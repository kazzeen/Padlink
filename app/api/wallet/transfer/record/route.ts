import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { z } from "zod";
import { createNotification } from "@/lib/notifications";

const transferSchema = z.object({
  receiverId: z.string().min(1), // Our DB User ID
  amount: z.number().positive(),
  currency: z.string(),
  txHash: z.string().optional(),
  status: z.string(), // "PENDING", "COMPLETED"
  memo: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = transferSchema.parse(body);

    const tx = await prisma.transaction.create({
      data: {
        senderId: session.user.id,
        receiverId: data.receiverId,
        amount: data.amount,
        currency: data.currency,
        txHash: data.txHash,
        status: data.status,
        memo: data.memo,
      },
    });

    // Create notification for receiver
    if (data.status === 'COMPLETED') {
        try {
            await createNotification({
                userId: data.receiverId,
                type: "SYSTEM",
                title: "Funds Received",
                message: `You received ${data.amount} ${data.currency} from ${session.user.name || "a user"}.`,
                link: "/wallet"
            });
        } catch (e) {
            console.error("Failed to create notification", e);
        }
    }

    return NextResponse.json({ success: true, transaction: tx });
  } catch (error) {
    console.error("Transfer record error:", error);
    return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 });
  }
}
