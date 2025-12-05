import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { z } from "zod";

const templateSchema = z.object({
  name: z.string().min(1),
  recipientAddress: z.string().min(1),
  amount: z.number().optional(),
  currency: z.string().default("ETH"),
  memo: z.string().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.transferTemplate.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = templateSchema.parse(body);

    const template = await prisma.transferTemplate.create({
      data: {
        userId: session.user.id,
        ...data,
      },
    });

    return NextResponse.json({ template });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save template" }, { status: 500 });
  }
}
