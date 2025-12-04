import { NextRequest, NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID || "",
  process.env.PRIVY_APP_SECRET || ""
);

function truncateAddress(addr: string) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

async function getSolBalance(address: string) {
  try {
    const rpcUrl = "https://api.mainnet-beta.solana.com";
    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "getBalance",
      params: [address],
    };
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const lamports = data?.result?.value;
    if (lamports === undefined) return null;
    const sol = Number(lamports) / 1e9;
    return sol.toFixed(4);
  } catch {
    return null;
  }
}

async function getEthBalance(address: string, caip2?: string) {
  try {
    // Only attempt for Ethereum mainnet if chainId indicates eip155:1
    if (caip2 && !caip2.startsWith("eip155:")) return null;
    const isMainnet = !caip2 || caip2 === "eip155:1";
    if (!isMainnet) return null; // Only Mainnet supported

    const rpcUrl = "https://cloudflare-eth.com";
    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getBalance",
      params: [address, "latest"],
    };
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const hex = data?.result;
    if (!hex || typeof hex !== "string") return null;
    // Convert hex wei to ether string (rough)
    const wei = BigInt(hex);
    const ether = Number(wei) / 1e18;
    return ether.toFixed(6);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    const claims = await privy.verifyAuthToken(token);
    const user = await privy.getUser(claims.userId);

    // Collect wallet accounts from linkedAccounts and primary fields
    const wallets: Array<{
      address: string;
      truncated: string;
      chainType: string;
      chainId?: string;
      createdAt?: string;
      balance?: string | null;
    }> = [];

    for (const acct of user.linkedAccounts) {
      if (acct.type === "wallet") {
        const address = acct.address;
        const chainType = acct.chainType;
        const chainId = acct.chainId;
        const createdAt = acct.firstVerifiedAt ? new Date(acct.firstVerifiedAt).toISOString() : undefined;
        const balance = chainType === "ethereum" 
          ? await getEthBalance(address, chainId) 
          : chainType === "solana" 
            ? await getSolBalance(address)
            : null;
        wallets.push({
          address,
          truncated: truncateAddress(address),
          chainType,
          chainId,
          createdAt,
          balance,
        });
      }
      if (acct.type === "smart_wallet") {
        const address = acct.address;
        const createdAt = acct.firstVerifiedAt ? new Date(acct.firstVerifiedAt).toISOString() : undefined;
        wallets.push({
          address,
          truncated: truncateAddress(address),
          chainType: "smart_wallet",
          chainId: undefined,
          createdAt,
          balance: null,
        });
      }
    }

    // Also include primary wallet fields if present and not duplicated
    if (user.wallet) {
      const address = user.wallet.address;
      if (!wallets.find((w) => w.address.toLowerCase() === address.toLowerCase())) {
        const chainType = user.wallet.chainType;
        const chainId = user.wallet.chainId;
        const createdAt = user.wallet.firstVerifiedAt ? new Date(user.wallet.firstVerifiedAt).toISOString() : undefined;
        const balance = chainType === "ethereum" 
          ? await getEthBalance(address, chainId) 
          : chainType === "solana" 
            ? await getSolBalance(address)
            : null;
        wallets.push({
          address,
          truncated: truncateAddress(address),
          chainType,
          chainId,
          createdAt,
          balance,
        });
      }
    }

    return NextResponse.json({ wallets });
  } catch (error) {
    console.error("Wallets fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch wallet accounts" }, { status: 500 });
  }
}

