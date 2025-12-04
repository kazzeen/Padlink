import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ticketSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  category: z.enum(["GENERAL", "TECHNICAL", "BILLING", "ABUSE"]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = ticketSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.issues },
        { status: 400 }
      );
    }

    const { subject, message, category } = result.data;

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id,
        subject,
        message,
        category,
        status: "OPEN",
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Create ticket error:", error);
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Fetch tickets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}
