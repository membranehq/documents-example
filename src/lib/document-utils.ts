import { DocumentModel } from "@/models/document";

/**
 * Get all document IDs in a document tree starting from a root document
 * @param rootDocumentId - The ID of the root document
 * @returns Array of document IDs including the root and all its descendants
 */
export async function getAllDocsInTree(
  rootDocumentId: string
): Promise<string[]> {
  // Get the root document
  const rootDoc = await DocumentModel.findOne({ id: rootDocumentId });
  if (!rootDoc) {
    return [];
  }

  // If the root document cannot have children, return the root document ID
  if (!rootDoc.canHaveChildren) {
    return [rootDocumentId];
  }

  const children = await DocumentModel.find({ parentId: rootDocumentId });

  // Recursively get IDs for all children
  const childrenIds = await Promise.all(
    children.map((child) => getAllDocsInTree(child.id))
  );

  return [rootDocumentId, ...childrenIds.flat()];
}

/**
 * Checks if a parent document exists in our database
 * @param parentDocumentId - The ID of the parent document to check
 * @returns Promise<boolean> - Returns true if parent document exists, false otherwise
 */
export async function findParentSubscription(
  parentDocumentId: string | null
): Promise<boolean> {
  if (!parentDocumentId) {
    return false;
  }

  const document = await DocumentModel.findOne({ id: parentDocumentId });

  return !!document;
}
