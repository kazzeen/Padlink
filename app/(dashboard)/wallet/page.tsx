"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useCreateWallet as useSolanaCreateWallet, useExportWallet as useSolanaExportWallet } from "@privy-io/react-auth/solana";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import Link from "next/link";

interface WalletData {
  address: string;
  chainType: string;
  chainId?: string;
  connected?: boolean;
  walletClientType?: string;
  getEthereumProvider?: () => Promise<{ request: (args: { method: string; params?: unknown[] }) => Promise<string> }>;
  switchChain?: (chainId: number) => Promise<void>;
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  counterparty: string;
  status: string;
  timestamp: string;
  hash: string;
  memo?: string;
}

interface InternalTransactionDTO {
  id: string;
  amount: number;
  currency: string;
  senderId: string;
  receiverId: string;
  sender?: { name?: string | null } | null;
  receiver?: { name?: string | null } | null;
  status: string;
  createdAt: string;
  txHash?: string | null;
  memo?: string | null;
}

type LinkedAccount = {
  type: string;
  address: string;
  chainType?: string;
  chainId?: string;
  walletClientType?: string;
  walletClient?: string;
  connectorType?: string;
};

export default function WalletPage() {
  const { user, ready, authenticated, exportWallet, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const { createWallet: createSolanaWallet } = useSolanaCreateWallet();
  const { exportWallet: exportSolanaWallet } = useSolanaExportWallet();
  
  const [activeWallet, setActiveWallet] = useState<WalletData | null>(null);
  const [balance, setBalance] = useState<string>("0.00");
  const [currency, setCurrency] = useState<string>("ETH");
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<Set<string>>(new Set());
  const [walletToExport, setWalletToExport] = useState<WalletData | null>(null);
  const [showDocs, setShowDocs] = useState(false);

  // Select primary wallet or first connected wallet
  useEffect(() => {
    if (ready && authenticated) {
      if (wallets.length > 0) {
        const primary = wallets.find(
          (w) => w.address.toLowerCase() === user?.wallet?.address.toLowerCase()
        );
        // Cast to unknown first to avoid direct incompatibility, then to WalletData
        setActiveWallet((primary || wallets[0]) as unknown as WalletData);
      } else if (user?.linkedAccounts) {
        // Fallback to first linked wallet if no connected wallet
        const linkedWallet = user.linkedAccounts.find(a => a.type === 'wallet');
        if (linkedWallet && linkedWallet.type === 'wallet') {
             setActiveWallet({
                address: linkedWallet.address,
                chainType: (linkedWallet as unknown as { chainType: string }).chainType || 'ethereum',
                chainId: (linkedWallet as unknown as { chainId: string }).chainId,
                connected: false,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                walletClientType: (linkedWallet as any).walletClientType || ((linkedWallet as any).connectorType === 'embedded' ? 'privy' : 'external')
             });
        }
      }
    }
  }, [ready, authenticated, wallets, user]);

  // Fetch real balance and history
  const fetchWalletData = useCallback(async () => {
    if (!activeWallet) return;
    
    setLoadingBalance(true);
    setTransactions([]);
    
    try {
      let internalTxs: Transaction[] = [];
      // Fetch Internal Transactions first (faster, more reliable metadata)
      try {
        const internalRes = await fetch('/api/wallet/transactions');
        if (internalRes.ok) {
            const data = await internalRes.json() as { transactions?: InternalTransactionDTO[] };
            if (data.transactions && Array.isArray(data.transactions)) {
                internalTxs = data.transactions.map((tx) => ({
                    id: tx.id,
                    type: 'Transfer',
                    amount: `${tx.amount} ${tx.currency}`,
                    counterparty: tx.senderId === tx.receiverId ? 'Self' : (tx.sender ? `From: ${tx.sender.name}` : `To: ${tx.receiver?.name}`),
                    status: tx.status,
                    timestamp: tx.createdAt,
                    hash: tx.txHash || "",
                    memo: tx.memo || undefined
                }));
                setTransactions(internalTxs);
            }
        }
      } catch (e) {
        console.error("Failed to fetch internal transactions", e);
      }

      if (activeWallet.chainType === 'ethereum') {
        setCurrency("ETH");
        // 1. Fetch Balance (Ethereum)
        if (activeWallet.connected !== false && activeWallet.getEthereumProvider) {
           const provider = await activeWallet.getEthereumProvider();
           const balanceHex = await provider.request({ 
             method: 'eth_getBalance', 
             params: [activeWallet.address, 'latest'] 
           });
           const balanceEth = (parseInt(balanceHex, 16) / 1e18).toFixed(4);
           setBalance(balanceEth);
        } else {
           // Fetch balance for read-only Ethereum wallet via proxy
           try {
             const res = await fetch('/api/ethereum', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ action: 'balance', address: activeWallet.address })
             });
             if (res.ok) {
               const data = await res.json();
               if (data.balance) {
                 setBalance(data.balance);
               } else {
                 setBalance("0.0000");
               }
             } else {
               setBalance("---");
             }
           } catch (err) {
             console.error("Error fetching ETH balance:", err);
             setBalance("Error");
           }
        }

        // 2. Fetch Transactions (Etherscan via Proxy)
        try {
            const res = await fetch('/api/ethereum', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'transactions', address: activeWallet.address })
            });

            if (res.ok) {
              const data = await res.json();
              if (data.status === "1" && Array.isArray(data.result)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const onChainTxs = data.result.map((tx: any) => ({
                  id: tx.hash,
                  type: tx.from.toLowerCase() === activeWallet.address.toLowerCase() ? "Outgoing" : "Incoming",
                  amount: `${(Number(tx.value) / 1e18).toFixed(4)} ETH`,
                  counterparty: tx.from.toLowerCase() === activeWallet.address.toLowerCase() ? (tx.to || "") : tx.from,
                  status: tx.isError === "0" ? "Confirmed" : "Failed",
                  timestamp: new Date(Number(tx.timeStamp) * 1000).toISOString(),
                  hash: tx.hash,
                }));

                // Merge with internalTxs, avoiding duplicates by hash
                setTransactions(prev => {
                    const seenHashes = new Set(prev.map(t => t.hash));
                    const newTxs = onChainTxs.filter((t: Transaction) => !seenHashes.has(t.hash));
                    return [...prev, ...newTxs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                });
              }
            }
        } catch (e) {
            console.error("Eth tx fetch error", e);
        }
      } else if (activeWallet.chainType === 'solana') {
        setCurrency("SOL");
        // 1. Fetch Balance (Solana) - Use Proxy API to avoid CORS/403
        const balanceRes = await fetch('/api/solana', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'balance', address: activeWallet.address })
        });
        
        if (balanceRes.ok) {
          const data = await balanceRes.json();
          if (data.balance !== undefined) {
            setBalance(data.balance);
          }
        }

        // 2. Fetch Transactions (Solana) - Use Proxy API
        const txRes = await fetch('/api/solana', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'transactions', address: activeWallet.address })
        });

        if (txRes.ok) {
          const data = await txRes.json();
          if (Array.isArray(data.transactions)) {
            setTransactions(data.transactions);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      setBalance("Error");
    } finally {
      setLoadingBalance(false);
    }
  }, [activeWallet]);

  useEffect(() => {
    if (activeWallet) {
      fetchWalletData();
    }
  }, [activeWallet, fetchWalletData]);

  const handleCopy = async () => {
    if (activeWallet?.address) {
      try {
        await navigator.clipboard.writeText(activeWallet.address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy", err);
      }
    }
  };

  const toggleTxDetails = (id: string) => {
    setExpandedTx(expandedTx === id ? null : id);
  };



  const handleSwitchNetwork = async (target: string) => {
    try {
      if (target === 'ethereum') {
         // 1. Try to find connected Ethereum wallet
         let ethWallet: WalletData | undefined = wallets.find(w => w.walletClientType !== 'privy' && (w as unknown as { chainType: string }).chainType === 'ethereum') as unknown as WalletData;
         
         // 2. If not connected, check linked accounts for read-only
         if (!ethWallet) {
            const linkedEth = user?.linkedAccounts?.find((a) => a.type === 'wallet' && (a as unknown as { chainType: string }).chainType === 'ethereum');
            if (linkedEth && linkedEth.type === 'wallet') {
              ethWallet = {
                address: linkedEth.address,
                chainType: 'ethereum',
                chainId: (linkedEth as unknown as { chainId: string }).chainId,
                connected: false,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                walletClientType: (linkedEth as any).walletClientType || ((linkedEth as any).connectorType === 'embedded' ? 'privy' : 'external')
              };
            }
         }

         if (ethWallet) {
           setActiveWallet(ethWallet);
           if (ethWallet.connected !== false && ethWallet.chainId !== 'eip155:1') {
              try {
                if (ethWallet.switchChain) {
                  await ethWallet.switchChain(1);
                }
              } catch (e) {
                console.error("Switch chain failed", e);
              }
           }
         } else {
           alert("No Ethereum wallet found. Please connect one.");
         }
      } else if (target === 'solana') {
         const solWallet = wallets.find(w => (w as unknown as { chainType: string }).chainType === 'solana');
         if (solWallet) {
           setActiveWallet(solWallet as unknown as WalletData);
         } else {
           // Check for linked but not connected Solana account
           const linkedSol = user?.linkedAccounts?.find((a) => a.type === 'wallet' && (a as unknown as { chainType: string }).chainType === 'solana');
           if (linkedSol && linkedSol.type === 'wallet') {
              // Use the linked account as a read-only wallet
              setActiveWallet({
                address: linkedSol.address,
                chainType: 'solana',
                chainId: undefined, // Solana doesn't use chainId in the same way
                connected: false, // Flag to indicate read-only
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                walletClientType: (linkedSol as any).walletClientType || ((linkedSol as any).connectorType === 'embedded' ? 'privy' : 'external')
              });
           } else {
              // Trigger Privy to connect a Solana wallet if possible, or just notify
              alert("Please connect a Solana wallet to view this network.");
           }
         }
      }
    } catch (error) {
      console.error("Error switching network:", error);
      alert("Failed to switch network. Please try again.");
    }
  };

  const handleExportClick = (wallet?: WalletData) => {
    let target = wallet || activeWallet;
    if (target && target.chainType === 'solana' && target.walletClientType !== 'privy') {
      const embeddedSol = user?.linkedAccounts?.find(
        (a) => {
          const la = a as LinkedAccount;
          return la.type === 'wallet' && (la.chainType === 'solana') && ((la.walletClientType ?? la.walletClient) === 'privy');
        }
      ) as LinkedAccount | undefined;
      if (embeddedSol) {
        target = { address: embeddedSol.address, chainType: 'solana', connected: false, walletClientType: 'privy' } as WalletData;
      }
    } else if (target && target.chainType === 'ethereum' && target.walletClientType !== 'privy') {
      const embeddedEth = user?.linkedAccounts?.find(
        (a) => {
          const la = a as LinkedAccount;
          return la.type === 'wallet' && (la.chainType === 'ethereum') && ((la.walletClientType ?? la.walletClient) === 'privy');
        }
      ) as LinkedAccount | undefined;
      if (embeddedEth) {
        target = { address: embeddedEth.address, chainType: 'ethereum', connected: false, walletClientType: 'privy' } as WalletData;
      } else if (user?.wallet && ((user.wallet as unknown as { chainType?: string; walletClientType?: string; walletClient?: string }).chainType === 'ethereum')) {
        const wc = user.wallet as unknown as { address: string; chainType?: string; walletClientType?: string; walletClient?: string };
        const isPrivy = (wc.walletClientType ?? wc.walletClient) === 'privy';
        if (isPrivy) {
          target = { address: wc.address, chainType: 'ethereum', connected: false, walletClientType: 'privy' } as WalletData;
        }
      }
    }
    setWalletToExport(target || null);
    setShowExportModal(true);
  };

  const confirmExport = async () => {
    const targetWallet = walletToExport || activeWallet;
    if (!targetWallet) return;

    if (isExporting) {
      alert("An export is already in progress. Please wait.");
      return;
    }

    // Check if already exported in this session to prevent accidental multiple exports
    if (exportHistory.has(targetWallet.address)) {
        const proceed = window.confirm("You have already exported keys for this wallet in this session. Do you want to do it again?");
        if (!proceed) {
             setShowExportModal(false);
             return;
        }
    }

    let isEmbedded = !!user?.linkedAccounts?.find((a) => {
      const la = a as LinkedAccount;
      return la.type === 'wallet' && la.address === targetWallet.address && ((la.walletClientType ?? la.walletClient) === 'privy');
    });
    if (!isEmbedded) {
      if (targetWallet.chainType === 'solana') {
        try {
          const created = await createSolanaWallet({ createAdditional: false });
          if (!created) {
            alert("Failed to create a Solana embedded wallet for export.");
            setShowExportModal(false);
            return;
          }
          const newTarget: WalletData = { address: (created as unknown as { address: string }).address, chainType: 'solana', connected: true, walletClientType: 'privy' };
          setActiveWallet(newTarget);
          setWalletToExport(newTarget);
          isEmbedded = true;
        } catch {
          alert("Solana private key export requires an embedded wallet created on this platform. External wallets (e.g., Phantom) do not reveal private keys here.");
          setShowExportModal(false);
          return;
        }
      } else {
        alert("Ethereum private key export requires an embedded wallet created on this platform. External wallets (e.g., MetaMask) do not reveal private keys here.");
        setShowExportModal(false);
        return;
      }
    }
    
    try {
      setIsExporting(true);
      
      // 1. Authenticate and Log
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Session expired or unauthorized. Please sign in again.");
      }
      const res = await fetch("/api/wallet/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          walletAddress: targetWallet.address,
          chainType: targetWallet.chainType
        })
      });

      if (res.status === 401) {
        throw new Error("Authorization failed. Please re-authenticate and try again.");
      }
      if (!res.ok) {
        throw new Error("Failed to authorize export");
      }

      // 2. Close our modal BEFORE triggering Privy's modal to avoid UI conflicts
      setShowExportModal(false);
      
      if (exportWallet) {
         // Add to history immediately to prevent rapid re-clicks if the user manages to open modal again
         setExportHistory(prev => new Set(prev).add(targetWallet.address));

         // Robustly determine chain type based on address format
         // Ethereum addresses start with 0x, Solana addresses do not
         const isSolana = targetWallet.chainType === 'solana' || !targetWallet.address.startsWith('0x');
         
         console.log(`Exporting wallet: ${targetWallet.address} (Type: ${isSolana ? 'solana' : 'ethereum'})`);
         if (isSolana) {
           await exportSolanaWallet({ address: targetWallet.address });
         } else {
           await exportWallet({ address: targetWallet.address });
         }

         // Reset state to allow continuous exports without reload
         setWalletToExport(null);
         setExportHistory(new Set());
      } else {
         alert("Export functionality is not available. This usually works for embedded wallets created via email/social login.");
      }

    } catch (error) {
      console.error("Export failed:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      alert((error as any).message || "Failed to export wallet. Please try again.");
      setShowExportModal(false);
    } finally {
      setIsExporting(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[var(--glass-text-muted)] animate-pulse">Loading wallet data...</div>
      </div>
    );
  }

  if (!authenticated || !activeWallet) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <h2 className="text-2xl font-bold text-[var(--glass-text)]">No Wallet Connected</h2>
        <p className="text-[var(--glass-text-muted)]">Please connect a wallet to view your account.</p>
        <GlassButton onClick={() => { /* Trigger login via Sidebar or Header */ }}>Connect Wallet</GlassButton>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--glass-text)]">Wallet Account</h1>
        <div className="flex items-center gap-4">
          <Link href="/wallet/transfer">
             <GlassButton size="sm" className="bg-blue-600 hover:bg-blue-700 border-none">
               Transfer Funds
             </GlassButton>
          </Link>
          <GlassButton size="sm" variant="secondary" onClick={fetchWalletData} disabled={loadingBalance}>
            {loadingBalance ? "Refreshing..." : "Refresh Data"}
          </GlassButton>
          <div className="text-sm text-[var(--glass-text-muted)] hidden sm:block">
            Connected via Privy
          </div>
        </div>
      </div>

      {/* Account Overview */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-sm font-medium text-[var(--glass-text-muted)] uppercase tracking-wider">
              Total Balance
            </h2>
            <div className="text-3xl sm:text-4xl font-bold text-[var(--glass-text)] mt-1">
              {loadingBalance ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                `${balance} ${currency}`
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
             <div className="flex items-center gap-2 bg-black/20 dark:bg-white/5 px-3 py-1 rounded-full">
               <span className={`w-2 h-2 rounded-full ${activeWallet.chainId || activeWallet.chainType === 'solana' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
               <span className="text-sm font-medium text-[var(--glass-text)]">
                 {activeWallet.chainType === 'solana' ? 'Solana Mainnet' : `${activeWallet.chainType} (ID: ${activeWallet.chainId?.split(':')[1] || 'Unknown'})`}
               </span>
             </div>
             {activeWallet.connected === false && (
               <div className="text-xs text-yellow-400 font-medium bg-yellow-400/10 px-2 py-1 rounded">
                 Read-only (Linked)
               </div>
             )}
             <div className="text-xs text-[var(--glass-text-muted)]">
               {transactions.length} Recent Transactions
             </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--glass-border)]">
          <label className="text-xs text-[var(--glass-text-muted)] block mb-1">Wallet Address</label>
          <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 p-3 rounded-lg">
            <code className="font-mono text-sm sm:text-base text-[var(--glass-text)] truncate flex-1">
              {activeWallet.address}
            </code>
            <GlassButton size="sm" variant="secondary" onClick={handleCopy} aria-label="Copy address">
              {copied ? "Copied!" : "Copy"}
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction History */}
        <div className="lg:col-span-2 space-y-4">
           <h3 className="text-xl font-semibold text-[var(--glass-text)]">Recent Transactions</h3>
           <GlassCard className="divide-y divide-[var(--glass-border)] overflow-hidden">
             {transactions.map((tx) => (
               <div key={tx.id} className="bg-transparent transition-colors hover:bg-white/5">
                 <div 
                   className="p-4 flex items-center justify-between cursor-pointer"
                   onClick={() => toggleTxDetails(tx.id)}
                   role="button"
                   tabIndex={0}
                   onKeyDown={(e) => { if(e.key === 'Enter') toggleTxDetails(tx.id) }}
                   aria-expanded={expandedTx === tx.id}
                 >
                   <div className="flex items-center gap-4">
                     <div className={`p-2 rounded-full ${tx.type === 'Incoming' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                       {tx.type === 'Incoming' ? '↓' : '↑'}
                     </div>
                     <div>
                       <div className="font-medium text-[var(--glass-text)]">
                         {tx.counterparty && tx.counterparty !== 'Self' && tx.counterparty.length < 20 ? tx.counterparty : tx.type}
                       </div>
                       <div className="text-xs text-[var(--glass-text-muted)]">{new Date(tx.timestamp).toLocaleDateString()}</div>
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="font-medium text-[var(--glass-text)]">{tx.amount}</div>
                     <div className={`text-xs ${tx.status === 'Confirmed' || tx.status === 'COMPLETED' ? 'text-green-400' : 'text-yellow-400'}`}>
                       {tx.status}
                     </div>
                   </div>
                 </div>
                 
                 {expandedTx === tx.id && (
                   <div className="px-4 pb-4 pt-0 text-sm bg-black/5 dark:bg-black/20 animate-in slide-in-from-top-2">
                     <div className="grid grid-cols-2 gap-2 py-2 text-[var(--glass-text-muted)]">
                       <div>Hash:</div>
                       <div className="font-mono text-[var(--glass-text)] truncate">
                          <a 
                            href={`https://etherscan.io/tx/${tx.hash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            {tx.hash || "Pending"}
                          </a>
                       </div>
                       <div>From/To:</div>
                       <div className="font-mono text-[var(--glass-text)] truncate">{tx.counterparty}</div>
                       <div>Time:</div>
                       <div className="text-[var(--glass-text)]">{new Date(tx.timestamp).toLocaleString()}</div>
                       {tx.memo && (
                         <>
                            <div>Memo:</div>
                            <div className="text-[var(--glass-text)] italic">{tx.memo}</div>
                         </>
                       )}
                     </div>
                   </div>
                 )}
               </div>
             ))}
             {transactions.length === 0 && (
               <div className="p-8 text-center text-[var(--glass-text-muted)]">No recent transactions found.</div>
             )}
           </GlassCard>
        </div>

        {/* Account Management */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-[var(--glass-text)]">Management</h3>
          <GlassCard className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--glass-text-muted)] mb-2">Network</label>
              <div className="space-y-2">
                <button 
                  onClick={() => handleSwitchNetwork('ethereum')}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${activeWallet.chainType === 'ethereum' ? 'border-green-500/50 bg-green-500/10' : 'border-[var(--glass-border)] hover:bg-white/5'}`}
                  aria-pressed={activeWallet.chainType === 'ethereum'}
                >
                  <span className="text-[var(--glass-text)]">Ethereum Mainnet</span>
                  {activeWallet.chainType === 'ethereum' && <span className="text-green-400">●</span>}
                </button>
                <button 
                  onClick={() => handleSwitchNetwork('solana')}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${activeWallet.chainType === 'solana' ? 'border-green-500/50 bg-green-500/10' : 'border-[var(--glass-border)] hover:bg-white/5'}`}
                  aria-pressed={activeWallet.chainType === 'solana'}
                >
                  <span className="text-[var(--glass-text)]">Solana Mainnet</span>
                  {activeWallet.chainType === 'solana' && <span className="text-green-400">●</span>}
                </button>
              </div>
            </div>
            
            <div className="pt-4 border-t border-[var(--glass-border)]">
              <label className="block text-sm font-medium text-[var(--glass-text-muted)] mb-2">Security</label>
              
              {activeWallet.chainType === 'solana' ? (
                <GlassButton 
                  variant="secondary" 
                  className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 justify-center"
                  onClick={() => handleExportClick()}
                  disabled={isExporting}
                  aria-label="Export Solana Private Key"
                >
                  {isExporting ? "Processing..." : "Export Solana Private Key"}
                </GlassButton>
              ) : (
                <GlassButton 
                  variant="secondary" 
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 justify-center"
                  onClick={() => handleExportClick()}
                  disabled={isExporting}
                >
                  {isExporting ? "Processing..." : "Export Ethereum Private Key"}
                </GlassButton>
              )}

              {/* Dedicated Solana Export Button (Client-side) */}
              {activeWallet.chainType !== 'solana' && !!user?.linkedAccounts?.find(a => (a as LinkedAccount).type === 'wallet' && (((a as LinkedAccount).walletClientType ?? (a as LinkedAccount).walletClient) === 'privy') && (a as LinkedAccount).chainType === 'solana') && (
                 <GlassButton 
                   variant="secondary" 
                   className="w-full mt-2 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 justify-center"
                   onClick={() => {
                      const linkedSol = user?.linkedAccounts?.find(a => (a as LinkedAccount).type === 'wallet' && (((a as LinkedAccount).walletClientType ?? (a as LinkedAccount).walletClient) === 'privy') && (a as LinkedAccount).chainType === 'solana') as LinkedAccount | undefined;
                      if (linkedSol && linkedSol.type === 'wallet') {
                        handleExportClick({ address: linkedSol.address, chainType: 'solana', connected: false, walletClientType: 'privy' } as WalletData);
                      }
                    }}
                   disabled={isExporting}
                 >
                   Export Solana Private Key
                 </GlassButton>
              )}

              {activeWallet.chainType !== 'solana' && !user?.linkedAccounts?.find(a => (a as LinkedAccount).type === 'wallet' && (((a as LinkedAccount).walletClientType ?? (a as LinkedAccount).walletClient) === 'privy') && (a as LinkedAccount).chainType === 'solana') && (
                 <GlassButton 
                   variant="primary" 
                   className="w-full mt-2 bg-purple-600 hover:bg-purple-700 border-none justify-center"
                    onClick={async () => {
                      try {
                        await createSolanaWallet({ createAdditional: false });
                      } catch {
                        alert("Failed to create Solana embedded wallet.");
                      }
                    }}
                   disabled={isExporting}
                 >
                   Create Solana Embedded Wallet
                 </GlassButton>
              )}

              <p className="text-xs text-[var(--glass-text-muted)] mt-2">
                Only export your keys if you need to import your wallet elsewhere. Never share your keys with anyone.
              </p>
              <button 
                onClick={() => setShowDocs(!showDocs)}
                className="text-xs text-blue-400 hover:text-blue-300 mt-2 underline underline-offset-2"
              >
                {showDocs ? "Hide Security Guide" : "Read Safe Key Handling Guide"}
              </button>
              
              {showDocs && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-[var(--glass-text-muted)] animate-in slide-in-from-top-2">
                  <h4 className="text-[var(--glass-text)] font-medium mb-2">Safe Key Handling Best Practices</h4>
                  <ul className="list-disc pl-4 space-y-1 text-xs">
                    <li><strong>Never share your private key:</strong> Anyone with this key has full control over your funds.</li>
                    <li><strong>Offline Storage:</strong> Write it down on paper and store it in a secure physical location (like a safe).</li>
                    <li><strong>Avoid Digital Copies:</strong> Do not take screenshots, save in notes apps, or email it to yourself.</li>
                    <li><strong>Hardware Wallets:</strong> For large amounts, consider importing this key into a hardware wallet.</li>
                    <li><strong>Solana Specifics:</strong> This key uses the Base58 format standard for Solana. Ensure you use a compatible wallet (e.g., Phantom, Solflare).</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="text-center pt-2">
               <Link href="/profile" className="text-sm text-[var(--glass-text-muted)] hover:text-[var(--glass-text)] transition-colors">
                 Manage Linked Accounts →
               </Link>
            </div>
          </GlassCard>
        </div>
      </div>
      {/* Export Confirmation Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <GlassCard className="max-w-md w-full p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="space-y-2">
              <h3 className={`text-xl font-bold ${(walletToExport || activeWallet)?.chainType === 'solana' ? 'text-purple-400' : 'text-red-400'}`}>
                {(walletToExport || activeWallet)?.chainType === 'solana' ? 'Export Solana Secret Key' : 'Export Ethereum Private Key'}
              </h3>
              <p className="text-[var(--glass-text)]">
                Are you sure you want to export your private keys?
              </p>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-200 space-y-2">
                <div className="font-bold flex items-center gap-2">
                  <span className="text-lg">⚠️</span> WARNING: HIGH RISK
                </div>
                <p>Anyone with your private keys can access and drain your funds immediately.</p>
                <ul className="list-disc pl-4 space-y-1 text-xs opacity-90">
                   <li>Ensure you are in a private location.</li>
                   <li>Ensure no one is looking at your screen.</li>
                   <li>Do not share this key with &quot;support&quot; agents.</li>
                   {(walletToExport || activeWallet)?.chainType === 'solana' && (
                     <li className="font-bold text-red-100">This is a Solana (Base58) key. Verify the network before importing elsewhere.</li>
                   )}
                   {(walletToExport || activeWallet)?.chainType === 'ethereum' && (
                     <li className="font-bold text-red-100">This is an Ethereum private key formatted as a 64-character hexadecimal string.</li>
                   )}
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <GlassButton 
                variant="secondary" 
                className="flex-1 justify-center"
                onClick={() => setShowExportModal(false)}
                disabled={isExporting}
              >
                Cancel
              </GlassButton>
              <GlassButton 
                className={`flex-1 border-none justify-center ${(walletToExport || activeWallet)?.chainType === 'solana' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-600 hover:bg-red-700'}`}
                onClick={confirmExport}
                disabled={isExporting}
              >
                {isExporting ? "Preparing..." : "Reveal Keys"}
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
