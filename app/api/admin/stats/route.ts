import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();

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
        action: "VIEW_STATS_FAILED",
        resource: "admin_dashboard",
      }
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Log successful access
  await prisma.adminAccessLog.create({
    data: {
      userId: user.id,
      action: "VIEW_STATS",
      resource: "admin_dashboard",
    }
  });

  const adminStats = {
    totalUsers: await prisma.user.count(),
    totalListings: await prisma.listing.count(),
    // Add more stats as needed
  };

  return NextResponse.json(adminStats);
}
