import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { SyncModel } from "@/models/sync";
import {
  SyncStatusRouteSuccessResponse,
  SyncStatusRouteErrorResponse,
} from "./types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
): Promise<
  NextResponse<SyncStatusRouteSuccessResponse | SyncStatusRouteErrorResponse>
> {
  try {
    const connectionId = (await params).integrationId;
    await connectDB();

    // Get the latest sync for this connection
    const sync = await SyncModel.findOne({ connectionId })
      .sort({ createdAt: -1 })
      .lean();

    if (!sync) {
      return NextResponse.json(
        { error: "Sync does not exist", code: "404" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: sync.syncStatus ?? null,
      error: sync.syncError ?? null,
      startedAt: sync.syncStartedAt ?? null,
      completedAt: sync.syncCompletedAt ?? null,
      isTruncated: sync.isTruncated ?? false,
    });
  } catch (error) {
    console.error("Failed to get sync status:", error);
    return NextResponse.json(
      { error: "Failed to get sync status", code: "500" },
      { status: 500 }
    );
  }
}
