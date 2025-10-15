import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/server-auth";
import { inngest } from "@/inngest/client";
import { generateCustomerAccessToken } from "@/lib/integration-token";
import connectDB from "@/lib/mongodb";
import { SyncModel, SyncStatus } from "@/models/sync";
import { SyncEventData, SyncRequestBody, SyncRouteResponse } from "./types";
import { SYNC_EVENT_NAME } from "./syncDocuments";
import { DocumentModel } from "@/models/document";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
): Promise<NextResponse<SyncRouteResponse>> {
  try {
    const connectionId = (await params).integrationId;
    const { integrationId, integrationName, integrationLogo, documentIds } =
      (await request.json()) as SyncRequestBody;

    const auth = getAuthFromRequest(request);
    const token = await generateCustomerAccessToken(auth);

    await connectDB();

    const userId = auth.customerId;

    // Create a new sync record
    const sync = await SyncModel.create({
      userId,
      connectionId,
      integrationId,
      integrationName,
      integrationLogo,
      syncStatus: SyncStatus.in_progress,
      syncStartedAt: new Date(),
      syncError: null,
      isTruncated: false,
      documentIds,
    });

    const eventData = {
      connectionId,
      token,
      userId: auth.customerId,
      documentIds,
      syncId: sync._id.toString(),
    } satisfies SyncEventData;

    await inngest.send<{ name: string; data: SyncEventData }>({
      name: SYNC_EVENT_NAME,
      data: eventData,
    });

    return NextResponse.json({ status: SyncStatus.in_progress });
  } catch (error) {
    console.error("Failed to start sync:", error);
    return NextResponse.json(
      { status: SyncStatus.failed, message: "Failed to start sync" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  try {
    const connectionId = (await params).integrationId;
    await connectDB();

    // Delete all sync records for this connection
    await SyncModel.deleteMany({ connectionId });

    // Delete all documents for this connection
    await DocumentModel.deleteMany({ connectionId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete sync data:", error);
    return NextResponse.json(
      { error: "Failed to delete sync data" },
      { status: 500 }
    );
  }
}
