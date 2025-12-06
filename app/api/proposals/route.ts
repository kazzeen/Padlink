import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createNotification } from "@/lib/notifications";

const proposalSchema = z.object({
  receiverId: z.string().min(1, "Receiver ID is required"),
  listingId: z.string().min(1, "Listing ID is required"),
  rentAmount: z.number().positive("Rent must be positive"),
  moveInDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  leaseTerm: z.number().int().positive("Lease term must be positive"),
  message: z.string().optional(),
  expirationHours: z.number().int().positive().default(72),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = proposalSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.issues },
        { status: 400 }
      );
    }

    const { 
      receiverId, 
      listingId, 
      rentAmount, 
      moveInDate, 
      leaseTerm, 
      message,
      expirationHours 
    } = result.data;

    // 1. Verify Listing Existence and Ownership
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.userId !== session.user.id) {
      return NextResponse.json({ error: "You can only propose your own listings" }, { status: 403 });
    }

    if (!listing.isActive) {
      return NextResponse.json({ error: "Listing is not active" }, { status: 400 });
    }

    // 2. Verify Receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    }

    // 3. Check for existing pending proposal
    const existingProposal = await prisma.proposal.findFirst({
      where: {
        senderId: session.user.id,
        receiverId: receiverId,
        listingId: listingId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingProposal) {
      return NextResponse.json({ error: "A pending proposal already exists for this listing and user" }, { status: 409 });
    }

    // 4. Create Proposal
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    // Use transaction to ensure atomicity of proposal and message creation
    const proposal = await prisma.$transaction(async (tx) => {
      const newProposal = await tx.proposal.create({
        data: {
          senderId: session.user.id,
          receiverId,
          listingId,
          rentAmount,
          moveInDate: new Date(moveInDate),
          leaseTerm,
          message,
          status: "PENDING",
          expiresAt,
        },
      });

      // Create a system message in the chat
      await tx.message.create({
        data: {
          senderId: session.user.id,
          receiverId,
          content: "Sent a rental proposal", // Fallback content
          proposalId: newProposal.id,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "PROPOSAL_CREATED",
          details: JSON.stringify({ proposalId: newProposal.id, listingId, receiverId }),
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        },
      });

      return newProposal;
    });

    // 5. Notifications (outside transaction to not block)
    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });
    const senderName = sender?.name || "Someone";

    await createNotification({
      userId: receiverId,
      type: "PROPOSAL_RECEIVED",
      title: "New Rental Proposal",
      message: `${senderName} sent you a proposal for ${listing.title}`,
      link: `/messages/${session.user.id}`, // Or specific proposal link
    });

    return NextResponse.json(proposal, { status: 201 });

  } catch (error) {
    console.error("Create proposal error:", error);
    return NextResponse.json(
      { error: "Failed to create proposal" },
      { status: 500 }
    );
  }
}
