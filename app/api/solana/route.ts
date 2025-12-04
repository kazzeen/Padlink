import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { action, address } = await req.json();

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    const rpcUrl = "https://api.mainnet-beta.solana.com";

    if (action === "balance") {
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
        cache: "no-store",
      });

      if (!res.ok) {
        return NextResponse.json({ error: "RPC request failed" }, { status: res.status });
      }

      const data = await res.json();
      const lamports = data?.result?.value;
      
      if (lamports === undefined) {
        // This might happen if the account doesn't exist or RPC error
        return NextResponse.json({ balance: 0 });
      }

      const sol = Number(lamports) / 1e9;
      return NextResponse.json({ balance: sol.toFixed(4) });
    }

    if (action === "transactions") {
      const body = {
        jsonrpc: "2.0",
        id: 1,
        method: "getSignaturesForAddress",
        params: [
          address,
          { limit: 10 }
        ],
      };

      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });

      if (!res.ok) {
        return NextResponse.json({ error: "RPC request failed" }, { status: res.status });
      }

      const data = await res.json();
      const signatures = data?.result;

      if (!Array.isArray(signatures)) {
        return NextResponse.json({ transactions: [] });
      }

      // Transform to our app's format
      const transactions = signatures.map((sig: { signature: string; err: unknown; blockTime?: number }) => ({
        id: sig.signature,
        type: "Transaction",
        amount: "---", // Solana simple history doesn't give amount easily
        counterparty: "---",
        status: sig.err ? "Failed" : "Confirmed",
        timestamp: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : new Date().toISOString(),
        hash: sig.signature,
      }));

      return NextResponse.json({ transactions });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Solana proxy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
