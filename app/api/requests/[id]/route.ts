import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    
    const result = updateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const { status } = result.data;

    // Find request
    const request = await prisma.request.findUnique({
      where: { id },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Verify ownership
    // Only receiver can ACCEPT/REJECT
    if (request.receiverId !== session.user.id) {
      return NextResponse.json(
        { error: "You are not authorized to update this request" },
        { status: 403 }
      );
    }

    const updatedRequest = await prisma.request.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Update request error:", error);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    );
  }
}
