import { inngest } from "@/inngest/client";
import { IntegrationAppClient } from "@integration-app/sdk";
import { DocumentModel, Document } from "@/models/document";
import { SyncModel, SyncStatus } from "@/models/sync";
import connectDB from "@/lib/mongodb";
import { NonRetriableError } from "inngest";
import { withTimeout } from "@/lib/timeout";
import { SyncEventData } from "./types";

interface ListDocumentsActionRecord {
  fields: Exclude<Document, "connectionId" | "content" | "userId">;
}

interface DocumentsResponse {
  output: {
    records: ListDocumentsActionRecord[];
    cursor?: string;
  };
}

// Helper function to check if error is a connection not found error
function isConnectionNotFoundError(
  error: unknown,
  connectionId: string
): boolean {
  return (
    error instanceof Error &&
    error.message.includes(`Connection "${connectionId}" not found`)
  );
}

async function handleSyncFailure({
  eventData,
  errorMessage,
}: {
  errorMessage: string;
  eventData: SyncEventData;
}) {
  const { syncId, connectionId } = eventData;

  const existingSync = await SyncModel.findById(syncId);

  if (!existingSync) {
    // If sync doesn't exist, delete all associated documents
    await DocumentModel.deleteMany({ connectionId });

    return {
      cleanupDueToError: true,
    };
  }

  await SyncModel.findByIdAndUpdate(
    syncId,
    {
      $set: {
        syncStatus: SyncStatus.failed,
        syncCompletedAt: new Date(),
        syncError: errorMessage || "Unknown error occurred",
      },
    },
    { new: true }
  );
}

export const SYNC_EVENT_NAME = "integration/sync-documents";

export const inngest_syncDocuments = inngest.createFunction(
  {
    id: "sync-documents",
    retries: 3,
    onFailure: async (props) => {
      const event = props.event.data;

      const errorMessage = event.error.message;
      const eventData = event.event.data;

      await handleSyncFailure({ eventData, errorMessage });
    },
  },
  { event: SYNC_EVENT_NAME },
  async ({ event, step, logger }) => {
    const { syncId, connectionId, userId, token, documentIds } =
      event.data as SyncEventData;
    let totalDocumentsSynced = 0;
    const actualSyncedDocumentIds: string[] = [];

    const FETCH_PAGE_TIMEOUT = 60000; // 60 seconds timeout
    const MAX_DOCUMENTS = 1000; // Maximum number of documents to sync

    await connectDB();

    const integrationApp = new IntegrationAppClient({ token });

    // Fetch specific documents and their children
    if (!documentIds || documentIds.length === 0) {
      throw new NonRetriableError("No document IDs provided for sync");
    }
    logger.info(`Fetching ${documentIds.length} specific documents`);

    const documentsToSync: Array<
      Exclude<Document, "connectionId" | "content" | "userId">
    > = [];

    // Fetch each document and its children
    for (const documentId of documentIds) {
      // First, fetch the root document
      const rootDoc = await step.run(
        `fetch-root-document-${documentId}`,
        async () => {
          try {
            const fetchPromise = integrationApp
              .connection(connectionId)
              .action("find-content-item-by-id")
              .run({ id: documentId }) as Promise<{
              output: {
                fields: Exclude<
                  Document,
                  "connectionId" | "content" | "userId"
                >;
              };
            }>;

            return await withTimeout(
              fetchPromise,
              FETCH_PAGE_TIMEOUT,
              `Fetching root document ${documentId} timed out after ${
                FETCH_PAGE_TIMEOUT / 1000
              } seconds, please try again`
            );
          } catch (error) {
            if (isConnectionNotFoundError(error, connectionId)) {
              throw new NonRetriableError(
                `Connection "${connectionId}" was archived during sync process`
              );
            }
            throw error;
          }
        }
      );

      // Add the root document to the list
      const rootDocumentFields = rootDoc.output.fields;
      documentsToSync.push(rootDocumentFields);

      // Only fetch children if the document can have children
      if (rootDocumentFields.canHaveChildren) {
        logger.info(`Fetching children for document ${documentId}`);
        let cursor: string | undefined;

        while (true) {
          const result = await step.run(
            `fetch-children-${documentId}-${cursor || "initial"}`,
            async () => {
              try {
                const fetchPromise = integrationApp
                  .connection(connectionId)
                  .action("list-content-items")
                  .run({
                    parentId: documentId,
                    recursive: true,
                    cursor,
                  }) as Promise<DocumentsResponse>;

                return await withTimeout(
                  fetchPromise,
                  FETCH_PAGE_TIMEOUT,
                  `Fetching children for ${documentId} timed out after ${
                    FETCH_PAGE_TIMEOUT / 1000
                  } seconds, please try again`
                );
              } catch (error) {
                if (isConnectionNotFoundError(error, connectionId)) {
                  throw new NonRetriableError(
                    `Connection "${connectionId}" was archived during sync process`
                  );
                }
                throw error;
              }
            }
          );

          const records = result.output.records as ListDocumentsActionRecord[];
          documentsToSync.push(...records.map((r) => r.fields));

          cursor = result.output.cursor;
          if (!cursor) break;

          // Safety check to prevent infinite loops
          if (documentsToSync.length >= MAX_DOCUMENTS) {
            logger.warn(`Reached max documents limit (${MAX_DOCUMENTS})`);
            break;
          }
        }
      }

      // Safety check to prevent infinite loops
      if (documentsToSync.length >= MAX_DOCUMENTS) {
        logger.warn(`Reached max documents limit (${MAX_DOCUMENTS})`);
        break;
      }
    }

    // Save all fetched documents
    if (documentsToSync.length > 0) {
      const docsToSave = documentsToSync.slice(0, MAX_DOCUMENTS).map((doc) => ({
        ...doc,
        connectionId,
        content: null,
        userId,
      }));

      await step.run(`save-selected-documents`, async () => {
        return await DocumentModel.bulkWrite(
          docsToSave.map((doc) => ({
            updateOne: {
              filter: { id: doc.id, connectionId },
              update: { $set: doc },
              upsert: true,
            },
          }))
        );
      });

      // Track all document IDs that were actually synced
      actualSyncedDocumentIds.push(...docsToSave.map((doc) => doc.id));
      totalDocumentsSynced = docsToSave.length;
    }

    // Update final sync status
    await step.run("complete-sync", async () => {
      // Wait for a bit before marking sync as completed so that the UI can update sync count
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // First check if sync still exists
      const existingSync = await SyncModel.findById(syncId);

      if (!existingSync) {
        throw new NonRetriableError(`Sync with id "${syncId}" not found`);
      }

      // If sync exists, proceed with normal sync completion
      const sync = await SyncModel.findByIdAndUpdate(
        syncId,
        {
          $set: {
            syncStatus: "completed",
            syncCompletedAt: new Date(),
            syncError: null,
            isTruncated: totalDocumentsSynced >= MAX_DOCUMENTS,
            actualSyncedDocumentIds: actualSyncedDocumentIds,
          },
        },
        { new: true }
      );

      return sync;
    });

    return { success: true, totalDocumentsSynced };
  }
);
