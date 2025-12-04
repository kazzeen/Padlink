"use client";

import React from "react";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import { usePrivy } from "@privy-io/react-auth";

interface WalletItem {
  address: string;
  truncated: string;
  chainType: string;
  chainId?: string;
  createdAt?: string;
  balance?: string | null;
}

export default function WalletAccounts() {
  const { getAccessToken } = usePrivy();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [wallets, setWallets] = React.useState<WalletItem[]>([]);
  const [copied, setCopied] = React.useState<Record<string, boolean>>({});
  const [showDetails, setShowDetails] = React.useState<Record<string, boolean>>({});

  const fetchWallets = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Missing Privy access token");
      }
      const res = await fetch("/api/wallets", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setWallets(data.wallets || []);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load wallet accounts";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  React.useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  async function handleCopy(addr: string) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(addr);
      } else {
        const ta = document.createElement("textarea");
        ta.value = addr;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied((prev) => ({ ...prev, [addr]: true }));
      setTimeout(() => setCopied((prev) => ({ ...prev, [addr]: false })), 2000);
    } catch {
      setError("Clipboard access denied. Please allow copy permissions.");
    }
  }

  function toggleDetails(addr: string) {
    setShowDetails((prev) => ({ ...prev, [addr]: !prev[addr] }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[var(--glass-text)]">Wallet Accounts</h2>
        <GlassButton size="sm" variant="secondary" onClick={fetchWallets}>
          Refresh
        </GlassButton>
      </div>

      <GlassCard className="p-6">
        {loading && (
          <div className="text-[var(--glass-text-muted)]">Loading wallet accounts...</div>
        )}
        {error && (
          <div className="text-red-500 dark:text-red-300">{error}</div>
        )}
        {!loading && !error && wallets.length === 0 && (
          <div className="text-[var(--glass-text-muted)]">No wallet accounts found.</div>
        )}

        {!loading && !error && wallets.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wallets.map((w) => (
              <div key={`${w.address}-${w.chainId || w.chainType}`} className="glass-card p-4 sm:p-5 rounded-xl min-w-0">
                <div className="text-xs sm:text-sm glass-text-muted">Address</div>
                <div className={`font-mono text-[var(--glass-text)] text-xs sm:text-sm md:text-base truncate max-w-full`}>
                  {w.truncated}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <GlassButton
                    size="sm"
                    aria-label="Copy full wallet address"
                    onClick={() => handleCopy(w.address)}
                  >
                    {copied[w.address] ? "Copied!" : "Copy Address"}
                  </GlassButton>
                </div>
                <div className="sr-only" aria-live="polite">
                  {copied[w.address] ? "Address copied to clipboard" : ""}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:text-sm">
                  <div className="min-w-0">
                    <div className="glass-text-muted">Chain</div>
                    <div className="text-[var(--glass-text)] truncate" title={w.chainType} aria-label={w.chainType}>
                      {w.chainType}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="glass-text-muted">CAIP-2</div>
                    <div
                      className="text-[var(--glass-text)] truncate max-w-full"
                      title={w.chainId || "—"}
                      aria-label={w.chainId || "—"}
                    >
                      {w.chainId || "—"}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="glass-text-muted">Created</div>
                    <div className="text-[var(--glass-text)] truncate" title={w.createdAt ? new Date(w.createdAt).toLocaleString() : "—"} aria-label={w.createdAt ? new Date(w.createdAt).toLocaleString() : "—"}>
                      {w.createdAt ? new Date(w.createdAt).toLocaleString() : "—"}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="glass-text-muted">Balance</div>
                    <div className="text-[var(--glass-text)] truncate" title={w.balance ?? "N/A"} aria-label={w.balance ?? "N/A"}>
                      {w.balance ?? "N/A"}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Toggle wallet details"
                    className="glass-button px-3 py-2 rounded-lg text-[var(--glass-text)] text-xs sm:text-sm"
                    onClick={() => toggleDetails(w.address)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") toggleDetails(w.address);
                    }}
                  >
                    {showDetails[w.address] ? "Hide Details" : "Show Details"}
                  </div>
                </div>
                {showDetails[w.address] && (
                  <div className="mt-2 text-[var(--glass-text-muted)] text-xs">
                    Wallet client type and connector data is not shown for privacy.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
