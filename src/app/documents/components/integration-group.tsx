import { Document } from "@/models/document";
import { DocumentItem } from "./document-item";
import { Icons } from "@/components/ui/icons";
import { ChevronRightIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useDocumentNavigation } from "@/app/integrations/hooks/use-document-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface IntegrationGroupProps {
  connectionId: string;
  integrationId: string;
  integrationName: string;
  integrationLogo: string;
  documents: Document[];
  isTruncated: boolean;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  isLoading?: boolean;
  error?: Error | null;
  hasFetchedDocuments?: boolean;
}

export function IntegrationGroup({
  connectionId,
  integrationName,
  integrationLogo,
  documents,
  isTruncated,
  isMinimized,
  onToggleMinimize,
  isLoading = false,
  error = null,
  hasFetchedDocuments = false,
}: IntegrationGroupProps) {

  const {
    currentFolders: folders,
    currentFiles: files,
    breadcrumbs,
    navigateToFolder,
    navigateToBreadcrumb,
  } = useDocumentNavigation(documents);

  const renderBreadcrumbs = () => {
    return (
      <div className="flex items-center flex-wrap gap-2 mb-2 text-xs text-gray-500 bg-gray-100 p-2 -ml-3 -mr-3 pl-5">
        <button
          onClick={() => navigateToBreadcrumb(-1)}
          className="hover:text-gray-900 transition-colors"
        >
          All Documents
        </button>
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.id} className="flex items-center gap-2">
            <ChevronRightIcon className="h-3 w-3 text-gray-400" />
            <button
              onClick={() => navigateToBreadcrumb(index)}
              className="hover:text-gray-900 transition-colors"
            >
              {crumb.title}
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="border rounded-lg shadow-none">
      <div className="p-3 pb-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100"
            onClick={onToggleMinimize}
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronUpIcon className="h-4 w-4" />
            )}
          </Button>
          {integrationLogo ? (
            <Image
              src={integrationLogo}
              alt={`${integrationName} logo`}
              width={24}
              height={24}
              className="rounded"
            />
          ) : (
            <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-xs font-semibold">
              {integrationName[0]}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-800">
                {integrationName}
              </h2>
              {hasFetchedDocuments && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {documents.length}
                </Badge>
              )}
            </div>
          </div>
          {isTruncated && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md">
              <Icons.alertCircle className="h-4 w-4" />
              <span className="text-sm">Results may be truncated</span>
            </div>
          )}
        </div>
      </div>

      {!isMinimized && (
        <div className="px-3 pb-3 transition-all duration-300 ease-in-out">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-md animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-4 text-red-500 bg-red-50 rounded-md">
              <p className="text-sm">Failed to load documents. Please try again.</p>
            </div>
          ) : (
            <>
              {renderBreadcrumbs()}

              <div className="space-y-2">
                {folders.length === 0 && files.length === 0 && (
                  <div className="text-gray-500 text-sm p-4 w-full items-center flex justify-center">
                    No files or folders
                  </div>
                )}
                {folders.map((doc) => (
                  <DocumentItem
                    integrationName={integrationName}
                    key={doc.id}
                    document={doc}
                    connectionId={connectionId}
                    onItemClick={() => navigateToFolder(doc.id, doc.title)}
                  />
                ))}

                {files.map((doc) => (
                  <DocumentItem
                    integrationName={integrationName}
                    key={doc.id}
                    document={doc}
                    connectionId={connectionId}
                  />
                ))}
              </div>

              {isTruncated && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    Some documents may not be displayed. The integration returned more
                    documents than can be shown at once.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

