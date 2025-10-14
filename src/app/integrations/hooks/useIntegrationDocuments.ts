import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useIntegrationApp } from "@integration-app/react";

export interface ListDocumentsActionRecord {
  fields: IntegrationDocument;
}

export interface IntegrationDocument {
  id: string;
  title: string;
  canHaveChildren: boolean;
  canDownload: boolean;
  resourceURI: string;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
}

interface DocumentsResponse {
  output: {
    records: ListDocumentsActionRecord[];
    cursor?: string;
  };
}

interface DocumentCache {
  documents: IntegrationDocument[];
  cursor?: string;
  hasMore: boolean;
}

interface UseIntegrationDocumentsReturn {
  documents: IntegrationDocument[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  fetchDocuments: (parentId: string | null) => Promise<void>;
  loadMore: () => Promise<void>;
  currentParentId: string | null;
  clearCache: () => void;
}

export function useIntegrationDocuments(
  connectionId: string | undefined
): UseIntegrationDocumentsReturn {
  const integrationApp = useIntegrationApp();

  // Cache documents by parent ID (null = root, "folder-id" = that folder's contents)
  const [documentCache, setDocumentCache] = useState<
    Map<string, DocumentCache>
  >(new Map());
  const documentCacheRef = useRef(documentCache);

  // Keep ref in sync with state
  useEffect(() => {
    documentCacheRef.current = documentCache;
  }, [documentCache]);

  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get cache key from parent ID
  const getCacheKey = (parentId: string | null): string => parentId ?? "root";

  // Get current cache entry - memoize to prevent infinite loops
  const currentCache = useMemo(
    () => documentCache.get(getCacheKey(currentParentId)),
    [documentCache, currentParentId]
  );

  const documents = useMemo(
    () => currentCache?.documents ?? [],
    [currentCache?.documents]
  );

  const hasMore = currentCache?.hasMore ?? true;
  const cursor = currentCache?.cursor;

  const fetchDocuments = useCallback(
    async (parentId: string | null, append = false) => {
      if (!connectionId) {
        setError("No connection ID provided");
        return;
      }

      setLoading(true);
      setError(null);

      const cacheKey = getCacheKey(parentId);

      try {
        const params: { cursor?: string; parentId?: string | null } = {};

        // Always pass parentId to the action
        params.parentId = parentId;

        // Use ref to get cursor without causing re-render
        const cache = documentCacheRef.current.get(cacheKey);

        // If appending (load more), use the cursor from cache
        if (append && cache?.cursor) {
          params.cursor = cache.cursor;
        }

        const result = (await integrationApp
          .connection(connectionId)
          .action("list-content-items")
          .run(params)) as DocumentsResponse;

        const records = result.output.records;
        const newCursor = result.output.cursor;

        // Update cache with fetched documents
        setDocumentCache((prevCache) => {
          const newCache = new Map(prevCache);
          const cache = prevCache.get(cacheKey);
          const existingDocs = append ? cache?.documents ?? [] : [];

          newCache.set(cacheKey, {
            documents: [
              ...existingDocs,
              ...records.map((record) => ({
                ...record.fields,
              })),
            ],
            cursor: newCursor,
            hasMore: !!newCursor,
          });

          return newCache;
        });

        // Update current parent ID
        setCurrentParentId(parentId);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch documents";
        setError(errorMessage);
        console.error("Error fetching documents:", err);
      } finally {
        setLoading(false);
      }
    },
    [connectionId, integrationApp]
  );

  const loadMore = useCallback(async () => {
    if (cursor && hasMore && !loading) {
      await fetchDocuments(currentParentId, true);
    }
  }, [cursor, hasMore, loading, currentParentId, fetchDocuments]);

  const clearCache = useCallback(() => {
    setDocumentCache(new Map());
    setCurrentParentId(null);
  }, []);

  // Fetch root documents on mount
  useEffect(() => {
    if (connectionId && documentCache.size === 0) {
      fetchDocuments(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionId]); // Only fetch when connectionId changes, fetchDocuments is stable

  return {
    documents,
    loading,
    error,
    hasMore,
    fetchDocuments,
    loadMore,
    currentParentId,
    clearCache,
  };
}
