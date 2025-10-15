import { SyncStatus } from "@/models/sync";

export interface SyncRouteSuccessResponse {
  status: SyncStatus;
}

export interface SyncRouteErrorResponse {
  status: SyncStatus;
  message: string;
}

export type SyncRouteResponse =
  | SyncRouteSuccessResponse
  | SyncRouteErrorResponse;

export interface SyncEventData {
  syncId: string;
  connectionId: string;
  userId: string;
  token: string;
  documentIds?: string[];
  integrationId?: string;
  integrationName?: string;
  integrationLogo?: string;
}

export interface SyncRequestBody {
  integrationId: string;
  integrationName: string;
  integrationLogo?: string;
  documentIds?: string[];
}
