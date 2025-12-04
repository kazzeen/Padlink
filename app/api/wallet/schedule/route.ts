import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { z } from "zod";

const scheduleSchema = z.object({
  recipientAddress: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  memo: z.string().optional(),
  startDate: z.string().optional(), // ISO Date
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = scheduleSchema.parse(body);

    const nextRunAt = new Date(data.startDate || Date.now());
    // Calculate next run based on frequency logic (simplified here)
    if (data.frequency === 'DAILY') nextRunAt.setDate(nextRunAt.getDate() + 1);
    if (data.frequency === 'WEEKLY') nextRunAt.setDate(nextRunAt.getDate() + 7);
    if (data.frequency === 'MONTHLY') nextRunAt.setMonth(nextRunAt.getMonth() + 1);

    const scheduled = await prisma.scheduledTransfer.create({
      data: {
        userId: session.user.id,
        recipientAddress: data.recipientAddress,
        amount: data.amount,
        currency: data.currency,
        frequency: data.frequency,
        nextRunAt: nextRunAt,
        memo: data.memo
      }
    });

    return NextResponse.json({ scheduled });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to schedule transfer" }, { status: 500 });
  }
}
