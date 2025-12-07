import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { action, address } = await req.json();

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    // Using Cloudflare's public Ethereum RPC
    const rpcUrl = "https://cloudflare-eth.com";

    if (action === "balance") {
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
        cache: "no-store",
      });

      if (!res.ok) {
        return NextResponse.json({ balance: "0.0000" });
      }

      const data = await res.json();
      const hex = data?.result;
      
      if (!hex || typeof hex !== "string") {
        return NextResponse.json({ balance: "0.0000" });
      }

      const wei = BigInt(hex);
      const ether = Number(wei) / 1e18;
      return NextResponse.json({ balance: ether.toFixed(4) });
    }

    if (action === "transactions") {
      return NextResponse.json({ transactions: [] });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Ethereum proxy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
