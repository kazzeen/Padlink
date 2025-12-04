import { getSession } from "@/lib/session";
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
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = messageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.issues },
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

    // Fetch current user name for notification to ensure consistency
    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });
    const senderName = sender?.name || session.user.name || "Someone";

    // Send Notification to Receiver
    await createNotification({
      userId: receiverId,
      type: "MESSAGE_RECEIVED",
      title: "New Message",
      message: `You have a new message from ${senderName}`,
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

// GET: Fetch recent conversations (users you've talked to) and accepted connections
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Get all messages involving the user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
      },
    });

    // 2. Get all accepted connections
    const connections = await prisma.request.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
      },
    });

    // 3. Build a map of conversations
    const conversationsMap = new Map();

    // Process messages first
    messages.forEach((msg) => {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!conversationsMap.has(otherUser.id)) {
        conversationsMap.set(otherUser.id, {
          user: otherUser,
          lastMessage: msg,
        });
      }
    });

    // Process connections (add if not present)
    connections.forEach((conn) => {
      const otherUser = conn.senderId === userId ? conn.receiver : conn.sender;
      if (!conversationsMap.has(otherUser.id)) {
        conversationsMap.set(otherUser.id, {
          user: otherUser,
          lastMessage: null, // No message yet
        });
      }
    });

    const conversations = Array.from(conversationsMap.values());

    // Sort: Users with recent messages first, then new connections
    // OR: New connections first?
    // Standard approach: Sort by last activity (message date or connection date).
    // Since we don't have connection date easily accessible in the map without extra work,
    // let's stick to: Messages sorted by date, then connections without messages.
    // Actually, let's put new connections (lastMessage: null) at the TOP, so user sees them.
    conversations.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return -1; // a is new connection -> comes first
      if (!b.lastMessage) return 1; // b is new connection -> comes first
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Fetch conversations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
