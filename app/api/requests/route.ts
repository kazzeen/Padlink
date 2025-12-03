import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createNotification } from "@/lib/notifications";

const requestSchema = z.object({
  receiverId: z.string().min(1, "Receiver ID is required"),
  message: z.string().max(500, "Message too long").optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate input
    const result = requestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.errors },
        { status: 400 }
      );
    }

    const { receiverId, message } = result.data;

    // Prevent self-request
    if (receiverId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot send request to yourself" },
        { status: 400 }
      );
    }

    // Check if request already exists
    const existingRequest = await prisma.request.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: receiverId },
          { senderId: receiverId, receiverId: session.user.id },
        ],
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "Request already exists or you are already connected" },
        { status: 409 }
      );
    }

    // Create request
    const request = await prisma.request.create({
      data: {
        senderId: session.user.id,
        receiverId,
        message: message || "Hi! I'd like to connect.",
        status: "PENDING",
      },
    });

    // Send Notification to Receiver
    await createNotification({
      userId: receiverId,
      type: "REQUEST_RECEIVED",
      title: "New Roommate Request",
      message: `${session.user.name || "Someone"} wants to connect with you!`,
      link: "/requests",
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error("Create request error:", error);
    return NextResponse.json(
      { error: "Failed to send request" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all"; // "sent", "received", "all"

    let whereClause: any = {};

    if (type === "sent") {
      whereClause = { senderId: session.user.id };
    } else if (type === "received") {
      whereClause = { receiverId: session.user.id };
    } else {
      whereClause = {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id },
        ],
      };
    }

    const requests = await prisma.request.findMany({
      where: whereClause,
      include: {
        sender: {
          select: { id: true, name: true, image: true, role: true },
        },
        receiver: {
          select: { id: true, name: true, image: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Fetch requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
