import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        image: true,
        avatar: true,
        age: true,
        bio: true,
        role: true,
        createdAt: true,
        preferences: true,
        // Don't expose sensitive fields like email, password, etc.
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if we should show contact info
    // For now, we only show contact info if they are connected
    const isConnected = await prisma.request.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { senderId: session.user.id, receiverId: userId },
          { senderId: userId, receiverId: session.user.id },
        ],
      },
    });

    // We could add an "email" field to the response if isConnected is true
    const userResponse = {
      ...user,
      email: isConnected ? (await prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email : null,
      isConnected: !!isConnected,
    };

    return NextResponse.json(userResponse);
  } catch (error) {
    console.error("Fetch user profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
