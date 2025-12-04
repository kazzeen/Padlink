import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { z } from "zod";

// Schema for validating contact data
const contactSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  chainType: z.enum(["ethereum", "solana"]),
  avatar: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contacts = await prisma.savedContact.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = contactSchema.parse(body);

    const contact = await prisma.savedContact.create({
      data: {
        userId: session.user.id,
        ...data,
      },
    });

    return NextResponse.json({ contact });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save contact" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.savedContact.delete({
        where: { id, userId: session.user.id }
    });

    return NextResponse.json({ success: true });
}
