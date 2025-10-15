"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/ui/icons";
import { SyncHistoryItem } from "@/app/api/integrations/[integrationId]/sync-history/route";
import { getAuthHeaders } from "@/app/auth-provider";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, Clock, AlertCircle, RefreshCw } from "lucide-react";

interface SyncHistoryModalProps {
  integrationId: string;
  integrationName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SyncHistoryModal({
  integrationId,
  integrationName,
  open,
  onOpenChange,
}: SyncHistoryModalProps) {
  const [syncs, setSyncs] = useState<SyncHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSyncHistory = useCallback(async () => {
    if (!integrationId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/integrations/${integrationId}/sync-history`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch sync history");
      }

      const data = await response.json();
      setSyncs(data.syncs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sync history");
    } finally {
      setLoading(false);
    }
  }, [integrationId]);

  useEffect(() => {
    if (open) {
      fetchSyncHistory();
    }
  }, [open, integrationId, fetchSyncHistory]);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="default" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" />
            In Progress
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Unknown
          </Badge>
        );
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };


  const formatDuration = (startedAt: Date | null, completedAt: Date | null) => {
    if (!startedAt || !completedAt) return "N/A";
    const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Icons.history className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-semibold">Sync History</div>
              <div className="text-sm font-normal text-gray-600">{integrationName}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-blue-50 rounded-full mb-4">
                <Icons.spinner className="w-8 h-8 animate-spin text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Loading sync history</h3>
              <p className="text-sm text-gray-500">Fetching the latest sync information...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-red-50 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Failed to load sync history</h3>
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <Button variant="outline" onClick={fetchSyncHistory} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && syncs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-gray-50 rounded-full mb-4">
                <Icons.history className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No sync history</h3>
              <p className="text-sm text-gray-500 text-center max-w-sm">
                This integration hasn&apos;t performed any syncs yet. Start by selecting files to sync.
              </p>
            </div>
          )}

          {!loading && !error && syncs.length > 0 && (
            <div className="space-y-2">
              {syncs.map((sync) => (
                <div
                  key={sync.id}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getStatusBadge(sync.status)}
                    {sync.isTruncated && (
                      <Badge variant="outline" className="text-amber-600 border-amber-200">
                        Truncated
                      </Badge>
                    )}
                    <div className="text-sm text-gray-600">
                      {formatDate(sync.createdAt)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Duration: {formatDuration(sync.startedAt, sync.completedAt)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {sync.actualSyncedDocumentIds?.length || 0} document{(sync.actualSyncedDocumentIds?.length || 0) !== 1 ? 's' : ''} synced
                    </div>
                  </div>
                  {sync.error && (
                    <div className="text-sm text-red-600 max-w-xs truncate" title={sync.error}>
                      {sync.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {syncs.length > 0 && `Showing ${syncs.length} sync${syncs.length !== 1 ? 's' : ''}`}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
