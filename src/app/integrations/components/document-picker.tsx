import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Integration } from "@integration-app/sdk";
import { Input } from "@/components/ui/input";
import {
  FileIcon,
  RefreshCcwIcon,
  Loader2Icon,
  ChevronRightIcon,
  FolderIcon,
  ExternalLinkIcon,
} from "lucide-react";
import Image from "next/image";
import { ErrorState } from "./error-state";
import {
  useIntegrationDocuments,
  IntegrationDocument,
} from "../hooks/useIntegrationDocuments";
import { useIntegrationSearch } from "../hooks/useIntegrationSearch";

interface BreadcrumbItem {
  id: string;
  title: string;
}

interface DocumentPickerProps {
  integration: Integration;
  onDone: (selectedDocumentIds: string[]) => void;
  onClose: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentPicker({
  integration,
  onDone,
  onClose,
  open,
  onOpenChange,
}: DocumentPickerProps) {
  const [localDocuments, setLocalDocuments] = useState<IntegrationDocument[]>(
    []
  );
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");

  const {
    documents,
    loading,
    error,
    hasMore,
    loadMore,
    fetchDocuments,
    currentParentId,
    clearCache,
  } = useIntegrationDocuments(integration.connection?.id);

  const {
    searchResults,
    searchLoading,
    searchHasMore,
    searchDocuments,
    loadMoreSearch,
    clearSearch,
    error: searchError,
  } = useIntegrationSearch(integration.connection?.id);

  // Sync documents for optimistic updates
  useEffect(() => {
    setLocalDocuments(documents);
  }, [documents]);

  // Trigger search when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchDocuments(searchQuery);
      } else {
        clearSearch();
      }
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, searchDocuments]); // clearSearch is stable and doesn't need to be in deps

  // Use search results when searching, otherwise use regular documents
  const displayDocs = searchQuery.trim() ? searchResults : localDocuments;
  const isLoading = searchQuery.trim() ? searchLoading : loading;
  const hasMoreItems = searchQuery.trim() ? searchHasMore : hasMore;
  const currentError = searchQuery.trim() ? searchError : error;

  const folders = displayDocs.filter((doc) => doc.canHaveChildren);
  const files = displayDocs.filter((doc) => !doc.canHaveChildren);

  const navigateToFolder = (folderId: string, folderTitle: string) => {
    // Clear search when navigating
    clearSearch();
    setSearchQuery("");
    setBreadcrumbs((prev) => [...prev, { id: folderId, title: folderTitle }]);
    setLocalDocuments([]); // Clear documents to show loading state
    fetchDocuments(folderId);
  };

  const navigateToBreadcrumb = (index: number) => {
    // Clear search when navigating
    clearSearch();
    setSearchQuery("");
    setLocalDocuments([]); // Clear documents to show loading state
    if (index === -1) {
      setBreadcrumbs([]);
      fetchDocuments(null);
    } else {
      const targetBreadcrumb = breadcrumbs[index];
      setBreadcrumbs((prev) => prev.slice(0, index + 1));
      fetchDocuments(targetBreadcrumb.id);
    }
  };

  const onSelectDocument = async (document: IntegrationDocument) => {
    const isCurrentlySelected = selectedDocuments.has(document.id);
    const newState = !isCurrentlySelected;

    // Optimistic update
    setSelectedDocuments((prev) => {
      const next = new Set(prev);
      if (newState) {
        next.add(document.id);
      } else {
        next.delete(document.id);
      }
      return next;
    });
  };

  const handleRefresh = () => {
    // Clear search when refreshing
    clearSearch();
    setSearchQuery("");
    setLocalDocuments([]); // Clear documents to show loading state
    clearCache();
    setBreadcrumbs([]);
    fetchDocuments(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              {integration.logoUri ? (
                <Image
                  width={32}
                  height={32}
                  src={integration.logoUri}
                  alt={`${integration.name} logo`}
                  className="w-8 h-8 rounded-lg"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  {integration.name[0]}
                </div>
              )}
              <DialogTitle>{integration.name}</DialogTitle>
            </div>

            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCcwIcon className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    searchDocuments(searchQuery);
                  }
                }}
                className="pr-10"
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2Icon className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-[400px] max-h-[400px] overflow-y-auto my-6">
          <div className="space-y-4">
            {/* Show breadcrumbs only when not at root and not searching */}
            {breadcrumbs.length > 0 && !searchQuery.trim() && (
              <div className="flex items-center flex-wrap gap-2 px-4 py-2 text-sm text-gray-500 bg-gray-50 rounded-md">
                <button
                  onClick={() => navigateToBreadcrumb(-1)}
                  className="hover:text-gray-900 transition-colors"
                >
                  Root
                </button>
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.id} className="flex items-center gap-2">
                    <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                    <button
                      onClick={() => navigateToBreadcrumb(index)}
                      className={cn(
                        "hover:text-gray-900 transition-colors",
                        index === breadcrumbs.length - 1 &&
                        "font-medium text-gray-900"
                      )}
                    >
                      {crumb.title}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {displayDocs.length === 0 ? (
              isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  {integration.logoUri ? (
                    <Image
                      width={64}
                      height={64}
                      src={integration.logoUri}
                      alt={`${integration.name} logo`}
                      className="w-16 h-16 rounded-xl mb-6 opacity-90"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-semibold mb-6 opacity-90">
                      {integration.name[0]}
                    </div>
                  )}
                  <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full w-2/5 bg-black rounded-full animate-[loading_1.5s_ease-in-out_infinite]" />
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    {searchQuery.trim() ? "Searching..." : "Loading documents..."}
                  </p>
                </div>
              ) : currentError ? (
                <ErrorState
                  message={currentError}
                  onRetry={() =>
                    searchQuery.trim()
                      ? searchDocuments(searchQuery)
                      : fetchDocuments(currentParentId)
                  }
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-gray-500">
                    {searchQuery.trim() ? "No results found" : "No items found"}
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-2">
                {folders.length === 0 && files.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-gray-500">No items found</p>
                  </div>
                ) : (
                  <>
                    {folders.map((folder) => (
                      <div
                        key={folder.id}
                        className="flex items-center gap-3 py-2 px-4 hover:bg-gray-50 cursor-pointer rounded-md"
                        onClick={() =>
                          navigateToFolder(folder.id, folder.title)
                        }
                      >
                        <Checkbox
                          checked={selectedDocuments.has(folder.id)}
                          onCheckedChange={() => onSelectDocument(folder)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FolderIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                          <span
                            className={cn("truncate", {
                              "text-blue-600": selectedDocuments.has(folder.id),
                            })}
                          >
                            {folder.title}
                          </span>
                        </div>
                        {folder.resourceURI && (
                          <a
                            href={folder.resourceURI}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex-shrink-0"
                            title="Open in new tab"
                          >
                            <ExternalLinkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          </a>
                        )}
                        <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}

                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 py-2 px-4 hover:bg-gray-50 cursor-pointer rounded-md"
                        onClick={() => onSelectDocument(file)}
                      >
                        <Checkbox
                          checked={selectedDocuments.has(file.id)}
                          onCheckedChange={() => onSelectDocument(file)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                          <span
                            className={cn("truncate", {
                              "text-blue-600": selectedDocuments.has(file.id),
                            })}
                          >
                            {file.title}
                          </span>
                        </div>
                        {file.resourceURI && (
                          <a
                            href={file.resourceURI}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex-shrink-0"
                            title="Open in new tab"
                          >
                            <ExternalLinkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          </a>
                        )}
                      </div>
                    ))}

                    {hasMoreItems && (
                      <div className="flex justify-center pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={
                            searchQuery.trim()
                              ? () => loadMoreSearch(searchQuery)
                              : loadMore
                          }
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                              Loading more...
                            </>
                          ) : (
                            "Load More"
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="!flex !flex-row !items-center !justify-between">
          <div className="text-sm text-gray-600">
            {selectedDocuments.size} {selectedDocuments.size === 1 ? 'document' : 'documents'} selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={() => {
                onDone(Array.from(selectedDocuments));
                onOpenChange(false);
              }}
            >
              Sync
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
