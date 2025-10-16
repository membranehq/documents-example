import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAuthHeaders } from "@/app/auth-provider";
import { Loader2Icon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import useSWR from "swr";

interface DocumentContentDialogProps {
  documentId: string;
  connectionId: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fetcher = async (url: string) => {
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch document content");
  }

  return response.json();
};

export function DocumentContentDialog({
  documentId,
  connectionId,
  title,
  open,
  onOpenChange,
}: DocumentContentDialogProps) {
  const { data, error, isLoading } = useSWR(
    open ? `/api/integrations/${connectionId}/documents/${documentId}/content` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // Cache for 30 seconds to avoid redundant requests
      errorRetryCount: 2,
      errorRetryInterval: 5000,
    }
  );

  const content = data?.content || "";
  const loading = isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2Icon className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 text-red-500 bg-red-50 rounded-xl">{error}</div>
          ) : !content.trim() ? (
            <div className="flex items-center justify-center text-gray-500 text-center py-8">
              No content available for this document
            </div>
          ) : (
            <div className="prose max-w-none dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

