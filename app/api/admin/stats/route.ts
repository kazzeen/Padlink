import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (user?.role !== "ADMIN") {
    // Log failed access attempt
    await prisma.adminAccessLog.create({
      data: {
        userId: session.user.id,
        action: "VIEW_STATS",
        success: false,
        details: "Unauthorized access attempt to admin stats",
        ip: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
      }
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Log successful access
  await prisma.adminAccessLog.create({
    data: {
      userId: user.id,
      action: "VIEW_STATS",
      success: true,
      details: "Viewed admin dashboard stats",
      ip: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
    }
  });

  const adminStats = {
    totalUsers: await prisma.user.count(),
    totalListings: await prisma.listing.count(),
    // Add more stats as needed
  };

  return NextResponse.json(adminStats);
}
