import { SyncStatus } from "@/models/sync";

export type SyncStatusRouteSuccessResponse = {
  status: SyncStatus | null;
  error: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  isTruncated: boolean;
};

export type SyncStatusRouteErrorResponse = {
  error: string;
  code: string;
};
