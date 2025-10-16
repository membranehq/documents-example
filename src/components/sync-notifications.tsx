"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronDown, ChevronUp, CircleCheckBig, AlertCircle, Clock, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthHeaders } from "@/lib/fetch-utils";
import { useSyncNotifications } from "@/contexts/sync-notifications-context";
import Image from "next/image";

interface RecentSyncItem {
  id: string;
  connectionId: string;
  integrationId: string;
  integrationName: string;
  integrationLogo?: string;
  status: string | null;
  error: string | null;
  startedAt: Date | string | null;
  completedAt: Date | string | null;
  isTruncated: boolean;
  documentIds?: string[];
  actualSyncedDocumentIds?: string[];
  createdAt: Date | string;
}

interface RecentSyncsResponse {
  syncs: RecentSyncItem[];
  total: number;
}

export function SyncNotifications() {
  const [syncs, setSyncs] = useState<RecentSyncItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { isRefreshing } = useSyncNotifications();

  const fetchRecentSyncs = useCallback(async () => {
    try {
      const response = await fetch("/api/syncs/recent", {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recent syncs");
      }

      const data: RecentSyncsResponse = await response.json();
      setSyncs(data.syncs || []);

      // Show notification if there are recent syncs (within last 5 minutes)
      const recentSyncs = data.syncs.filter(sync => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const createdAt = typeof sync.createdAt === 'string' ? new Date(sync.createdAt) : sync.createdAt;
        return createdAt > fiveMinutesAgo;
      });

      if (recentSyncs.length > 0) {
        setIsVisible(true);
        // Auto-hide after 10 seconds
        setTimeout(() => setIsVisible(false), 10000);
      }
    } catch (error) {
      console.error("Failed to fetch recent syncs:", error);
    }
  }, []);

  useEffect(() => {
    fetchRecentSyncs();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchRecentSyncs, 5000);
    return () => clearInterval(interval);
  }, [fetchRecentSyncs]);

  // Trigger refresh when context indicates a sync was initiated
  useEffect(() => {
    if (isRefreshing) {
      fetchRecentSyncs();
    }
  }, [isRefreshing, fetchRecentSyncs]);

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "completed":
        return <CircleCheckBig className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };


  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  const getDocumentCount = (sync: RecentSyncItem) => {
    return sync.actualSyncedDocumentIds?.length || sync.documentIds?.length || 0;
  };

  const completedSyncs = syncs.filter(sync => sync.status === "completed");
  const inProgressSyncs = syncs.filter(sync => sync.status === "in_progress");
  const failedSyncs = syncs.filter(sync => sync.status === "failed");

  const totalCompleted = completedSyncs.length;
  const totalInProgress = inProgressSyncs.length;
  const totalFailed = failedSyncs.length;

  if (!isVisible && syncs.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px]">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {totalCompleted > 0 && `${totalCompleted} sync${totalCompleted !== 1 ? 's' : ''} complete`}
              {totalCompleted === 0 && totalInProgress > 0 && `${totalInProgress} sync${totalInProgress !== 1 ? 's' : ''} in progress`}
              {totalCompleted === 0 && totalInProgress === 0 && totalFailed > 0 && `${totalFailed} sync${totalFailed !== 1 ? 's' : ''} failed`}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0 hover:bg-gray-200/60"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              )}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0 hover:bg-gray-200/60"
          >
            <X className="h-4 w-4 text-gray-500" />
          </Button>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="max-h-[400px] overflow-y-auto">
            {syncs.slice(0, 5).map((sync) => (
              <div
                key={sync.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  {sync.integrationLogo ? (
                    <Image
                      src={sync.integrationLogo}
                      alt={sync.integrationName}
                      width={36}
                      height={36}
                      className="h-9 w-9 object-contain rounded"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {sync.integrationName}
                    </span>
                    {getStatusIcon(sync.status)}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span>{getDocumentCount(sync)} doc{getDocumentCount(sync) !== 1 ? 's' : ''}</span>
                    <span className="text-gray-300">•</span>
                    <span>{formatTimeAgo(sync.createdAt)}</span>
                    {sync.isTruncated && (
                      <>
                        <span className="text-gray-300">•</span>
                        <Badge variant="outline" className="text-amber-600 border-amber-200 text-[10px] px-1.5 py-0 h-4">
                          Truncated
                        </Badge>
                      </>
                    )}
                  </div>

                  {sync.error && (
                    <div className="text-xs text-red-600 mt-1 truncate">
                      {sync.error}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {syncs.length > 5 && (
              <div className="px-4 py-2.5 text-center text-xs text-gray-500 bg-gray-50/30">
                +{syncs.length - 5} more sync{syncs.length - 5 !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        {/* Collapsed view - show summary */}
        {!isExpanded && (
          <div className="px-4 py-3">
            {syncs.slice(0, 3).map((sync) => (
              <div
                key={sync.id}
                className="flex items-center gap-3 mb-2.5 last:mb-0"
              >
                <div className="flex-shrink-0">
                  {sync.integrationLogo ? (
                    <Image
                      src={sync.integrationLogo}
                      alt={sync.integrationName}
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain rounded"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {sync.integrationName}
                    </span>
                    {getStatusIcon(sync.status)}
                  </div>

                  <div className="text-xs text-gray-500">
                    {getDocumentCount(sync)} doc{getDocumentCount(sync) !== 1 ? 's' : ''} • {formatTimeAgo(sync.createdAt)}
                  </div>
                </div>
              </div>
            ))}

            {syncs.length > 3 && (
              <div className="text-xs text-gray-500 text-center mt-2 pt-2 border-t border-gray-100">
                +{syncs.length - 3} more
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
