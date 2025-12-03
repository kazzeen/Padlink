import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createNotification } from "@/lib/notifications";

const messageSchema = z.object({
  receiverId: z.string().min(1, "Receiver ID is required"),
  content: z.string().min(1, "Message cannot be empty").max(1000),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = messageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.errors },
        { status: 400 }
      );
    }

    const { receiverId, content } = result.data;

    // Optional: Check if they are connected (Request ACCEPTED)
    // For now, we'll allow messaging if they exist, but ideally enforce connection
    const connection = await prisma.request.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { senderId: session.user.id, receiverId: receiverId },
          { senderId: receiverId, receiverId: session.user.id },
        ],
      },
    });

    if (!connection) {
      // For MVP we might warn, but let's enforce connection for safety
       return NextResponse.json(
         { error: "You must be connected to send messages." },
         { status: 403 }
       );
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content,
      },
    });

    // Send Notification to Receiver
    await createNotification({
      userId: receiverId,
      type: "MESSAGE_RECEIVED",
      title: "New Message",
      message: `${session.user.name || "Someone"} sent you a message`,
      link: `/messages/${session.user.id}`,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

// GET: Fetch recent conversations (users you've talked to)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all unique users interacted with
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
      },
    });

    // Group by "other user" to find latest message per conversation
    const conversationsMap = new Map();

    messages.forEach((msg) => {
      const otherUser = msg.senderId === session.user.id ? msg.receiver : msg.sender;
      if (!conversationsMap.has(otherUser.id)) {
        conversationsMap.set(otherUser.id, {
          user: otherUser,
          lastMessage: msg,
        });
      }
    });

    const conversations = Array.from(conversationsMap.values());

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Fetch conversations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
