import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createNotification } from "@/lib/notifications";

const responseSchema = z.object({
  action: z.enum(["ACCEPT", "DECLINE", "CANCEL"]),
  message: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        listing: true,
        sender: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Access control
    if (proposal.senderId !== session.user.id && proposal.receiverId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("Get proposal error:", error);
    return NextResponse.json({ error: "Failed to fetch proposal" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const result = responseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.issues },
        { status: 400 }
      );
    }

    const { action, message } = result.data;

    // Fetch proposal with listing to check ownership/status
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: { listing: true },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Validate State
    if (proposal.status !== "PENDING") {
      return NextResponse.json({ error: `Proposal is already ${proposal.status}` }, { status: 400 });
    }

    if (proposal.expiresAt < new Date()) {
      // Auto-expire if found expired
      await prisma.proposal.update({
        where: { id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ error: "Proposal has expired" }, { status: 400 });
    }

    // Permission Check
    if (action === "CANCEL") {
      if (proposal.senderId !== session.user.id) {
        return NextResponse.json({ error: "Only the proposer can cancel" }, { status: 403 });
      }
    } else {
      // ACCEPT or DECLINE
      if (proposal.receiverId !== session.user.id) {
        return NextResponse.json({ error: "Only the receiver can respond" }, { status: 403 });
      }
    }

    // Perform Update
    const newStatus = action === "CANCEL" ? "CANCELLED" : action === "ACCEPT" ? "ACCEPTED" : "DECLINED";

    const updatedProposal = await prisma.$transaction(async (tx) => {
      const updated = await tx.proposal.update({
        where: { id },
        data: {
          status: newStatus,
        },
      });

      // Send status update message to chat
      await tx.message.create({
        data: {
          senderId: session.user.id,
          receiverId: action === "CANCEL" ? proposal.receiverId : proposal.senderId,
          content: `Proposal ${newStatus.toLowerCase()}${message ? `: ${message}` : ""}`,
          proposalId: id, // Link to same proposal
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: `PROPOSAL_${newStatus}`,
          details: JSON.stringify({ proposalId: id, action, message }),
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        },
      });

      return updated;
    });

    // Notifications
    const targetUserId = action === "CANCEL" ? proposal.receiverId : proposal.senderId;
    const notificationType = 
      action === "ACCEPT" ? "PROPOSAL_ACCEPTED" : 
      action === "DECLINE" ? "PROPOSAL_DECLINED" : "PROPOSAL_CANCELLED";
    
    const actorName = session.user.name || "User"; // Simplified, ideally fetch from DB

    await createNotification({
      userId: targetUserId,
      type: notificationType,
      title: `Proposal ${newStatus.charAt(0) + newStatus.slice(1).toLowerCase()}`,
      message: `${actorName} ${newStatus.toLowerCase()} the proposal for ${proposal.listing.title}`,
      link: `/messages/${session.user.id}`,
    });

    return NextResponse.json(updatedProposal);

  } catch (error) {
    console.error("Update proposal error:", error);
    return NextResponse.json(
      { error: "Failed to update proposal" },
      { status: 500 }
    );
  }
}
