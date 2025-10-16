import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { SyncModel } from "@/models/sync";
import { getAuthFromRequest } from "@/lib/server-auth";

export interface RecentSyncItem {
  id: string;
  connectionId: string;
  integrationId: string;
  integrationName: string;
  integrationLogo?: string;
  status: string | null;
  error: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  isTruncated: boolean;
  documentIds?: string[];
  actualSyncedDocumentIds?: string[];
  createdAt: Date;
}

export interface RecentSyncsResponse {
  syncs: RecentSyncItem[];
  total: number;
}

export async function GET(
  request: NextRequest
): Promise<
  NextResponse<RecentSyncsResponse | { error: string; code: string }>
> {
  try {
    const auth = getAuthFromRequest(request);
    await connectDB();

    // Get recent syncs for the user across all integrations
    const syncs = await SyncModel.find({ userId: auth.customerId })
      .sort({ createdAt: -1 })
      .limit(10) // Show last 10 syncs
      .lean();

    const recentSyncs: RecentSyncItem[] = syncs.map((sync) => ({
      id: sync._id.toString(),
      connectionId: sync.connectionId,
      integrationId: sync.integrationId,
      integrationName: sync.integrationName,
      integrationLogo: sync.integrationLogo,
      status: sync.syncStatus ?? null,
      error: sync.syncError ?? null,
      startedAt: sync.syncStartedAt ?? null,
      completedAt: sync.syncCompletedAt ?? null,
      isTruncated: sync.isTruncated ?? false,
      documentIds: sync.documentIds,
      actualSyncedDocumentIds: sync.actualSyncedDocumentIds,
      createdAt: sync.createdAt,
    }));

    return NextResponse.json({
      syncs: recentSyncs,
      total: recentSyncs.length,
    });
  } catch (error) {
    console.error("Failed to get recent syncs:", error);
    return NextResponse.json(
      { error: "Failed to get recent syncs", code: "500" },
      { status: 500 }
    );
  }
}
