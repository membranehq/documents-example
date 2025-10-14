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
} from "lucide-react";
import Image from "next/image";
import { ErrorState } from "./error-state";
import {
  useIntegrationDocuments,
  IntegrationDocument,
} from "../hooks/useIntegrationDocuments";

interface BreadcrumbItem {
  id: string;
  title: string;
}

interface DocumentPickerProps {
  integration: Integration;
  onComplete: () => void;
  onClose: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentPicker({
  integration,
  onComplete,
  onClose,
  open,
  onOpenChange,
}: DocumentPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [localDocuments, setLocalDocuments] = useState<IntegrationDocument[]>(
    []
  );
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(
    new Set()
  );

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

  // Sync documents for optimistic updates
  useEffect(() => {
    setLocalDocuments(documents);
  }, [documents]);

  // Filter and separate documents
  const filteredDocs = searchQuery
    ? localDocuments.filter((doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : localDocuments;

  const folders = filteredDocs.filter((doc) => doc.canHaveChildren);
  const files = filteredDocs.filter((doc) => !doc.canHaveChildren);

  const navigateToFolder = (folderId: string, folderTitle: string) => {
    setBreadcrumbs((prev) => [...prev, { id: folderId, title: folderTitle }]);
    setLocalDocuments([]); // Clear documents to show loading state
    fetchDocuments(folderId);
  };

  const navigateToBreadcrumb = (index: number) => {
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
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
        </DialogHeader>

        <div className="min-h-[400px] max-h-[400px] overflow-y-auto my-6">
          <div className="space-y-4">
            {/* Show breadcrumbs only when not at root */}
            {breadcrumbs.length > 0 && (
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

            {localDocuments.length === 0 ? (
              loading ? (
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
                    Loading documents...
                  </p>
                </div>
              ) : error ? (
                <ErrorState
                  message={error}
                  onRetry={() => fetchDocuments(currentParentId)}
                />
              ) : null
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
                      </div>
                    ))}

                    {hasMore && (
                      <div className="flex justify-center pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadMore}
                          disabled={loading}
                        >
                          {loading ? (
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              onComplete();
              onOpenChange(false);
            }}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
