import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { z } from "zod";
import { createNotification } from "@/lib/notifications";

const executeSchema = z.object({
  receiverId: z.string().optional(), // Internal User ID (optional if external address)
  recipientAddress: z.string().min(1), // Blockchain address
  amount: z.number().positive(),
  currency: z.string(),
  txHash: z.string().min(1),
  memo: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Idempotency Check
  const idempotencyKey = req.headers.get("idempotency-key");
  if (idempotencyKey) {
      const existing = await prisma.transaction.findUnique({
          where: { idempotencyKey }
      });
      if (existing) {
          return NextResponse.json({ success: true, transaction: existing, cached: true });
      }
  }

  try {
    const body = await req.json();
    const data = executeSchema.parse(body);

    // Create Audit Log
    await prisma.auditLog.create({
        data: {
            userId: session.user.id,
            action: "TRANSFER_EXECUTED",
            details: JSON.stringify({ 
                amount: data.amount, 
                currency: data.currency, 
                recipient: data.recipientAddress 
            }),
            ipAddress: req.headers.get("x-forwarded-for") || "unknown"
        }
    });

    // Create Transaction Record
    // Note: receiverId might be null if sending to external address
    // We need to gracefully handle the relation. 
    // Since Transaction model requires receiverId currently (Relation to User), 
    // we need to either relax that constraint or only support internal transfers fully.
    // For this MVP, we assume we are sending to a User ID if provided, 
    // OR we find the user by address if not provided.
    
    let receiverId = data.receiverId;
    if (!receiverId) {
        // Try to find user by wallet address (complex query needed usually, or iterate linked accounts)
        // For now, we'll just fail or mock it. 
        // Let's assume for MVP we MUST provide a receiver ID if we want the relation.
        // If we want to support external sends, we should make receiverId optional in schema.
        // I will update the schema to make receiverId optional in next step if needed, 
        // but for now let's assume internal transfers primarily.
        
        // Actually, looking at schema, receiverId is required. 
        // Let's try to find the user who owns this address from our Account/User tables.
        // This is hard because address is in Account/User.wallet (json) or Account (linked).
        // Let's assume the frontend passes the ID for internal users.
    }

    if (!receiverId) {
        throw new Error("Receiver ID required for internal transaction tracking");
    }

    const tx = await prisma.transaction.create({
      data: {
        senderId: session.user.id,
        receiverId: receiverId,
        amount: data.amount,
        currency: data.currency,
        txHash: data.txHash,
        status: "COMPLETED", // Optimistic, real status checked via cron/listener
        memo: data.memo,
        idempotencyKey: idempotencyKey
      },
    });

    // Notify Receiver
    await createNotification({
        userId: receiverId,
        type: "SYSTEM",
        title: "Funds Received",
        message: `You received ${data.amount} ${data.currency} from ${session.user.name || "a user"}.`,
        link: "/wallet"
    });

    return NextResponse.json({ success: true, transaction: tx });

  } catch (error) {
    console.error("Transfer execution error:", error);
    return NextResponse.json({ error: "Failed to execute transfer" }, { status: 500 });
  }
}
