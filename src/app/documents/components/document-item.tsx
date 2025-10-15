import { Document } from "@/models/document";
import {
  FileIcon,
  FolderIcon,
  ExternalLinkIcon,
  ChevronRightIcon,
  DownloadIcon,
  AlertCircleIcon,
  MoreVerticalIcon,
  FileTextIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadFileToDisk } from "@/app/documents/utils";
import { DownloadStateDisplay } from "@/app/documents/components/download-state";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { DocumentContentDialog } from "@/app/documents/components/document-content-dialog";
import { useState } from "react";

const Icons = {
  file: FileIcon,
  folder: FolderIcon,
  chevronRight: ChevronRightIcon,
  externalLink: ExternalLinkIcon,
  download: DownloadIcon,
  error: AlertCircleIcon,
  moreVertical: MoreVerticalIcon,
  fileText: FileTextIcon,
} as const;

interface DocumentItemProps {
  document: Document;
  connectionId: string;
  onItemClick?: (document: Document) => void;
  integrationName: string;
}

export function DocumentItem({
  document,
  connectionId,
  integrationName,
  onItemClick: onFolderClick,
}: DocumentItemProps) {
  const isFolder = document.canHaveChildren;
  const [isViewingDocument, setIsViewingDocument] = useState<boolean>(false);

  return (
    <>
      <div
        className={`flex gap-3 p-3 hover:bg-gray-50 rounded-md transition-colors ${isFolder ? "cursor-pointer" : ""
          }`}
        onClick={() => {
          if (isFolder) {
            onFolderClick?.(document);
          }
        }}
      >
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="flex items-start gap-2">
            {isFolder ? (
              <Icons.folder className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Icons.file className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
            )}
            <span className="text-sm font-medium leading-none truncate">
              {document.title}
            </span>
          </div>
          {document.updatedAt && (
            <p className="text-xs text-gray-500 ml-6">
              Updated {format(new Date(document.updatedAt), "MMM d, yyyy")}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2 justify-end flex-shrink-0">
          {document.downloadState && (
            <DownloadStateDisplay
              state={document.downloadState}
              integrationName={integrationName}
            />
          )}
          {document.downloadError && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  title="View error"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Icons.error className="h-4 w-4 text-red-500" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3">
                <div className="text-sm text-red-600">
                  <p className="font-semibold mb-1">Last Download Failed</p>
                  <p className="text-xs">{document.downloadError}</p>
                </div>
              </PopoverContent>
            </Popover>
          )}
          {document.content !== null && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setIsViewingDocument(true);
              }}
            >
              <Icons.fileText className="h-4 w-4" />
            </Button>
          )}
          {(document.content !== null ||
            document.storageKey ||
            document.resourceURI) && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 focus:ring-0 focus-visible:ring-2"
                  >
                    <Icons.moreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px]">
                  {document.storageKey && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFileToDisk(
                          document.id,
                          document.storageKey!,
                          connectionId
                        );
                      }}
                    >
                      <Icons.download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                  )}
                  {document.resourceURI && (
                    <DropdownMenuItem asChild>
                      <a
                        href={document.resourceURI}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Icons.externalLink className="h-4 w-4 mr-2" />
                        View on {integrationName}
                      </a>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

          <div className="w-4">
            {isFolder && (
              <Icons.chevronRight className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      <DocumentContentDialog
        documentId={document._id}
        connectionId={connectionId}
        title={document.title}
        open={isViewingDocument}
        onOpenChange={setIsViewingDocument}
      />
    </>
  );
}

