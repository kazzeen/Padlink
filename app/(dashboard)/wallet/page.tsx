"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
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
}

export default function WalletPage() {
  const { user, ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [activeWallet, setActiveWallet] = useState<WalletData | null>(null);
  const [balance, setBalance] = useState<string>("0.00");
  const [currency, setCurrency] = useState<string>("ETH");
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
                connected: false
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

        // 2. Fetch Transactions (Ethereum Mainnet only)
        const chainId = activeWallet.chainId?.split(':')[1] || '1'; // Default to mainnet for read-only logic if needed
        let apiUrl = "";
        if (chainId === "1") apiUrl = "https://api.etherscan.io/api";
        
        if (apiUrl) {
          const res = await fetch(`${apiUrl}?module=account&action=txlist&address=${activeWallet.address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=YourApiKeyToken`);
          const data = await res.json();
          if (data.status === "1" && Array.isArray(data.result)) {
            setTransactions(data.result.map((tx: { hash: string; from: string; value: string; to: string; isError: string; timeStamp: string }) => ({
              id: tx.hash,
              type: tx.from.toLowerCase() === activeWallet.address.toLowerCase() ? "Outgoing" : "Incoming",
              amount: `${(Number(tx.value) / 1e18).toFixed(4)} ETH`,
              counterparty: tx.from.toLowerCase() === activeWallet.address.toLowerCase() ? (tx.to || "") : tx.from,
              status: tx.isError === "0" ? "Confirmed" : "Failed",
              timestamp: new Date(Number(tx.timeStamp) * 1000).toISOString(),
              hash: tx.hash,
            })));
          } else if (data.message === "No transactions found") {
             setTransactions([]);
          }
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
                connected: false
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
                connected: false // Flag to indicate read-only
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
                       <div className="font-medium text-[var(--glass-text)]">{tx.type}</div>
                       <div className="text-xs text-[var(--glass-text-muted)]">{new Date(tx.timestamp).toLocaleDateString()}</div>
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="font-medium text-[var(--glass-text)]">{tx.amount}</div>
                     <div className={`text-xs ${tx.status === 'Confirmed' ? 'text-green-400' : 'text-yellow-400'}`}>
                       {tx.status}
                     </div>
                   </div>
                 </div>
                 
                 {expandedTx === tx.id && (
                   <div className="px-4 pb-4 pt-0 text-sm bg-black/5 dark:bg-black/20">
                     <div className="grid grid-cols-2 gap-2 py-2 text-[var(--glass-text-muted)]">
                       <div>Hash:</div>
                       <div className="font-mono text-[var(--glass-text)] truncate">{tx.hash}</div>
                       <div>From/To:</div>
                       <div className="font-mono text-[var(--glass-text)] truncate">{tx.counterparty}</div>
                       <div>Time:</div>
                       <div className="text-[var(--glass-text)]">{new Date(tx.timestamp).toLocaleString()}</div>
                     </div>
                     <a href="#" className="text-blue-400 hover:underline text-xs">View on Explorer ↗</a>
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
            

            
            <div className="text-center pt-2">
               <Link href="/profile" className="text-sm text-[var(--glass-text-muted)] hover:text-[var(--glass-text)] transition-colors">
                 Manage Linked Accounts →
               </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
