import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PrivyClient } from "@privy-io/server-auth";
import { getSession } from "@/lib/session";

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID || "",
  process.env.PRIVY_APP_SECRET || ""
);

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query || query.length < 2) {
    return NextResponse.json({ users: [] });
  }

  try {
    // Find users by name or email
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
        ],
        AND: {
           id: { not: session.user.id }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        privyId: true,
      },
      take: 5,
    });

    // Fetch wallet addresses for these users from Privy
    const results = await Promise.all(users.map(async (user) => {
      let address = null;
      let chainType = null;

      if (user.privyId) {
        try {
          const privyUser = await privy.getUser(user.privyId);
          // Prefer wallet, then smart_wallet
          const wallet = privyUser.linkedAccounts.find(a => a.type === 'wallet') || 
                         privyUser.linkedAccounts.find(a => a.type === 'smart_wallet');
          
          if (wallet) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            address = (wallet as any).address;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            chainType = (wallet as any).chainType;
          } else if (privyUser.wallet) {
             address = privyUser.wallet.address;
             chainType = privyUser.wallet.chainType;
          }
        } catch (e) {
          console.error(`Failed to fetch privy user ${user.id}:`, e);
        }
      }
      return {
        ...user,
        address,
        chainType
      };
    }));

    return NextResponse.json({ users: results });
  } catch (error) {
    console.error("Lookup error:", error);
    return NextResponse.json({ error: "Failed to lookup users" }, { status: 500 });
  }
}
