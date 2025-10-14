import { useState, useCallback, useRef, useEffect } from "react";
import { useIntegrationApp } from "@integration-app/react";
import { IntegrationDocument } from "./useIntegrationDocuments";

interface DocumentsResponse {
  output: {
    records: Array<{ fields: IntegrationDocument }>;
    cursor?: string;
  };
}

interface UseIntegrationSearchReturn {
  searchResults: IntegrationDocument[];
  searchLoading: boolean;
  searchHasMore: boolean;
  searchDocuments: (query: string) => Promise<void>;
  loadMoreSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
  error: string | null;
}

export function useIntegrationSearch(
  connectionId: string | undefined
): UseIntegrationSearchReturn {
  const integrationApp = useIntegrationApp();

  const [searchResults, setSearchResults] = useState<IntegrationDocument[]>([]);
  const [searchCursor, setSearchCursor] = useState<string | undefined>(
    undefined
  );
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track cursor without causing re-renders
  const searchCursorRef = useRef<string | undefined>(undefined);

  // Keep ref in sync with state
  useEffect(() => {
    searchCursorRef.current = searchCursor;
  }, [searchCursor]);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchCursor(undefined);
    setSearchHasMore(false);
    setError(null);
  }, []);

  const searchDocuments = useCallback(
    async (query: string, append = false) => {
      if (!connectionId) {
        setError("No connection ID provided");
        return;
      }

      if (!query.trim()) {
        clearSearch();
        return;
      }

      setSearchLoading(true);
      setError(null);

      try {
        const params: { query: string; cursor?: string } = {
          query,
        };

        // If appending (load more), use the cursor from ref
        if (append && searchCursorRef.current) {
          params.cursor = searchCursorRef.current;
        }

        const result = (await integrationApp
          .connection(connectionId)
          .action("search-content-items")
          .run(params)) as DocumentsResponse;

        const records = result.output.records;
        const newCursor = result.output.cursor;

        setSearchResults((prev) =>
          append
            ? [
                ...prev,
                ...records.map((record) => ({
                  ...record.fields,
                })),
              ]
            : records.map((record) => ({
                ...record.fields,
              }))
        );
        setSearchCursor(newCursor);
        setSearchHasMore(!!newCursor);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to search documents";
        setError(errorMessage);
        console.error("Error searching documents:", err);
      } finally {
        setSearchLoading(false);
      }
    },
    [connectionId, integrationApp]
  );

  const loadMoreSearch = useCallback(
    async (query: string) => {
      if (searchCursor && searchHasMore && !searchLoading && query) {
        await searchDocuments(query, true);
      }
    },
    [searchCursor, searchHasMore, searchLoading, searchDocuments]
  );

  return {
    searchResults,
    searchLoading,
    searchHasMore,
    searchDocuments,
    loadMoreSearch,
    clearSearch,
    error,
  };
}
