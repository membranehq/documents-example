import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { SyncModel } from "@/models/sync";

export interface SyncHistoryItem {
  id: string;
  status: string | null;
  error: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  isTruncated: boolean;
  documentIds?: string[]; // Initially selected document IDs
  actualSyncedDocumentIds?: string[]; // All document IDs that were actually synced
  createdAt: Date;
}

export interface SyncHistoryResponse {
  syncs: SyncHistoryItem[];
  total: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
): Promise<
  NextResponse<SyncHistoryResponse | { error: string; code: string }>
> {
  try {
    const connectionId = (await params).integrationId;
    await connectDB();

    // Get all syncs for this connection, ordered by most recent first
    const syncs = await SyncModel.find({ connectionId })
      .sort({ createdAt: -1 })
      .limit(50) // Limit to last 50 syncs
      .lean();

    const syncHistory: SyncHistoryItem[] = syncs.map((sync) => ({
      id: sync._id.toString(),
      status: sync.syncStatus ?? null,
      error: sync.syncError ?? null,
      startedAt: sync.syncStartedAt ?? null,
      completedAt: sync.syncCompletedAt ?? null,
      isTruncated: sync.isTruncated ?? false,
      documentIds: sync.documentIds, // Initially selected document IDs
      actualSyncedDocumentIds: sync.actualSyncedDocumentIds, // All document IDs that were actually synced
      createdAt: sync.createdAt,
    }));

    return NextResponse.json({
      syncs: syncHistory,
      total: syncHistory.length,
    });
  } catch (error) {
    console.error("Failed to get sync history:", error);
    return NextResponse.json(
      { error: "Failed to get sync history", code: "500" },
      { status: 500 }
    );
  }
}
