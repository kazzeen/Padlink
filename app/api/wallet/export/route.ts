import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PrivyClient } from "@privy-io/server-auth";

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID || "",
  process.env.PRIVY_APP_SECRET || ""
);

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate User
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let verifiedClaims;
    try {
      verifiedClaims = await privy.verifyAuthToken(token);
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ error: "Invalid auth token" }, { status: 401 });
    }

    const userId = verifiedClaims.userId;

    // 3. Get Request Details
    const body = await req.json();
    const { walletAddress, chainType } = body;

    // 3. Log to AuditLog
    // We don't have the IP easily in Next.js App Router without headers check, 
    // but we can try 'x-forwarded-for'.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

    await prisma.auditLog.create({
      data: {
        userId: userId, // This stores the Privy DID
        action: "WALLET_EXPORT_INITIATED",
        details: JSON.stringify({ 
          walletAddress, 
          chainType,
          timestamp: new Date().toISOString() 
        }),
        ipAddress: ip,
      },
    });

    // 4. Return Success
    // Note: We cannot return the private key here as Privy wallets are non-custodial.
    // The client SDK must handle the actual key revelation.
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Export log error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
