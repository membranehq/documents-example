import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { DocumentModel } from "@/models/document";
import { getAuthFromRequest } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  try {
    const connectionId = (await params).integrationId;
    const { customerId: userId } = getAuthFromRequest(request);

    if (!connectionId || !userId) {
      return NextResponse.json({ documents: [] });
    }

    await connectDB();

    const documents = await DocumentModel.find({
      userId,
      connectionId,
    }).lean();

    return NextResponse.json({
      documents,
    });
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
