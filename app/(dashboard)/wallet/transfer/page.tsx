"use client";

import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import GlassInput from "@/components/ui/glass/GlassInput";
import ProcessingStep from "@/components/ui/ProcessingStep";
import { useRouter } from "next/navigation";
import { parseEther } from "viem";
import { v4 as uuidv4 } from 'uuid';

interface Recipient {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  address: string | null;
  chainType: string | null;
}

interface SavedContact {
    id: string;
    name: string;
    address: string;
    chainType: string;
    avatar?: string;
}

interface TransferTemplate {
    id: string;
    name: string;
    recipientAddress: string;
    amount?: number;
    currency: string;
    memo?: string;
}

type ProcessingStage = "INITIATING" | "SIGNING" | "BROADCASTING" | "RECORDING" | "COMPLETED";

export default function TransferPage() {
  const { user, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();

  const [step, setStep] = useState<"RECIPIENT" | "DETAILS" | "CONFIRM" | "PROCESSING" | "SUCCESS">("RECIPIENT");
  const [activeTab, setActiveTab] = useState<"SEARCH" | "CONTACTS" | "TEMPLATES">("SEARCH");
  
  // Processing State
  const [processingStage, setProcessingStage] = useState<ProcessingStage>("INITIATING");
  const [failedStage, setFailedStage] = useState<ProcessingStage | null>(null);
  
  // Data States
  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [templates, setTemplates] = useState<TransferTemplate[]>([]);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Recipient[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Transaction State
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("ETH");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [txHash, setTxHash] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");

  // Fetch Contacts & Templates on load
  useEffect(() => {
      if (authenticated) {
          fetch('/api/wallet/contacts').then(r => r.json()).then(d => setContacts(d.contacts || []));
          fetch('/api/wallet/templates').then(r => r.json()).then(d => setTemplates(d.templates || []));
      }
  }, [authenticated]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setSearching(true);
        try {
          const res = await fetch(`/api/wallet/lookup?query=${encodeURIComponent(searchQuery)}`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data.users);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectRecipient = (recipient: Recipient) => {
    if (!recipient.address) {
      setError("This user hasn't connected a wallet yet.");
      return;
    }
    setSelectedRecipient(recipient);
    setError("");
    setStep("DETAILS");
  };

  const handleSelectContact = (contact: SavedContact) => {
      setSelectedRecipient({
          id: contact.id, // Note: This ID is the contact ID, not User ID. We might need User ID for internal tracking.
          // Ideally SavedContact should store linked User ID if available.
          // For MVP, we assume we can't track "Internal User" purely from a Saved Contact unless we store it.
          // Let's fallback to address-only sending if ID is missing, but our API requires ID.
          // We need to fix API to handle address-only. 
          // But for now let's just assume we have the address.
          name: contact.name,
          email: null,
          avatar: contact.avatar || null,
          address: contact.address,
          chainType: contact.chainType
      });
      setStep("DETAILS");
  };

  const handleSelectTemplate = (template: TransferTemplate) => {
      // We need to reconstruct a recipient object from address
      // Ideally we lookup user by address.
      setSelectedRecipient({
          id: "template-recipient", 
          name: "Template Recipient",
          email: null,
          avatar: null,
          address: template.recipientAddress,
          chainType: "ethereum" // Assumption
      });
      if (template.amount) setAmount(template.amount.toString());
      if (template.memo) setMemo(template.memo);
      setCurrency(template.currency);
      setStep("DETAILS");
  };

  const handleDetailsSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    setError("");
    setIdempotencyKey(uuidv4()); // Generate key for this attempt
    setStep("CONFIRM");
  };

  const executeTransfer = async () => {
      if (!selectedRecipient?.address || !amount) return;
      setStep("PROCESSING");
      setProcessingStage("INITIATING");
      setFailedStage(null);
      
      try {
        const activeWallet = wallets.find(w => w.address === user?.wallet?.address) || wallets[0];
        if (!activeWallet) throw new Error("No wallet connected");

        // 1. On-Chain Transaction
        setProcessingStage("SIGNING");
        const provider = await activeWallet.getEthereumProvider();
        const weiValue = parseEther(amount);
        
        const hash = await provider.request({
            method: 'eth_sendTransaction',
            params: [{
                from: activeWallet.address,
                to: selectedRecipient.address,
                value: `0x${weiValue.toString(16)}`
            }]
        });
        
        setTxHash(hash);
        setProcessingStage("BROADCASTING");
        
        // Simulate broadcasting delay for better UX
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 2. Backend Record (with Idempotency)
        setProcessingStage("RECORDING");
        await fetch('/api/wallet/transfer/execute', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Idempotency-Key': idempotencyKey
            },
            body: JSON.stringify({
                receiverId: selectedRecipient.id.startsWith("template") ? undefined : selectedRecipient.id, // Handle template case
                recipientAddress: selectedRecipient.address,
                amount: parseFloat(amount),
                currency: currency,
                txHash: hash,
                memo
            })
        });

        setProcessingStage("COMPLETED");
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStep("SUCCESS");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
          console.error(err);
          setFailedStage(processingStage); // Mark current stage as failed
          setError(err.message || "Transaction failed");
          // Allow user to see the failed step before going back
          setTimeout(() => setStep("CONFIRM"), 3000);
      }
  };

  const saveAsContact = async () => {
      if (!selectedRecipient) return;
      try {
          await fetch('/api/wallet/contacts', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                  name: selectedRecipient.name || "New Contact",
                  address: selectedRecipient.address,
                  chainType: selectedRecipient.chainType || 'ethereum',
                  avatar: selectedRecipient.avatar
              })
          });
          alert("Contact Saved!");
      } catch (e) {
          console.error(e);
      }
  };

  const saveAsTemplate = async () => {
      if (!selectedRecipient) return;
      const name = prompt("Template Name:");
      if (!name) return;
      try {
          await fetch('/api/wallet/templates', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                  name,
                  recipientAddress: selectedRecipient.address,
                  amount: parseFloat(amount),
                  currency,
                  memo
              })
          });
          alert("Template Saved!");
      } catch (e) {
          console.error(e);
      }
  };

  if (!authenticated) return <div className="p-8 text-center">Please connect your wallet.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold text-[var(--glass-text)]">Transfer Funds</h1>
         <GlassButton size="sm" variant="secondary" onClick={() => router.back()}>Cancel</GlassButton>
      </div>

      {/* Progress Stepper */}
      <div className="flex justify-between mb-8 text-sm text-[var(--glass-text-muted)] relative">
          <div className="absolute top-3 left-0 w-full h-0.5 bg-[var(--glass-border)] -z-10" />
          {["Recipient", "Details", "Confirm", "Done"].map((s, i) => {
              const stepIdx = ["RECIPIENT", "DETAILS", "CONFIRM", "SUCCESS"].indexOf(step);
              // Map PROCESSING to CONFIRM index visually or handle separately
              const currentIdx = step === "PROCESSING" ? 2 : stepIdx;
              
              return (
                <div key={s} className={`flex flex-col items-center px-2 ${i <= currentIdx ? 'text-blue-400' : ''}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 z-10 ${i <= currentIdx ? 'bg-blue-500 text-white' : 'bg-black dark:bg-gray-900 border border-[var(--glass-border)]'}`}>
                        {i + 1}
                    </div>
                    <span className="hidden sm:block">{s}</span>
                </div>
              );
          })}
      </div>

      <GlassCard className="p-8">
        {step === "RECIPIENT" && (
            <div className="space-y-6">
                {/* Tabs */}
                <div className="flex gap-4 border-b border-[var(--glass-border)] pb-2">
                    <button 
                        className={`pb-2 px-2 ${activeTab === 'SEARCH' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-[var(--glass-text-muted)]'}`}
                        onClick={() => setActiveTab('SEARCH')}
                    >
                        Search
                    </button>
                    <button 
                        className={`pb-2 px-2 ${activeTab === 'CONTACTS' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-[var(--glass-text-muted)]'}`}
                        onClick={() => setActiveTab('CONTACTS')}
                    >
                        Contacts
                    </button>
                    <button 
                        className={`pb-2 px-2 ${activeTab === 'TEMPLATES' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-[var(--glass-text-muted)]'}`}
                        onClick={() => setActiveTab('TEMPLATES')}
                    >
                        Templates
                    </button>
                </div>

                {activeTab === 'SEARCH' && (
                    <div className="space-y-4">
                        <GlassInput 
                            placeholder="Search name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                        {searching && <div className="text-sm">Searching...</div>}
                        <div className="space-y-2">
                            {searchResults.map(user => (
                                <div key={user.id} onClick={() => handleSelectRecipient(user)} className="p-3 hover:bg-white/5 cursor-pointer rounded-lg flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        {user.name?.[0] || "U"}
                                    </div>
                                    <div>
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-xs opacity-60">{user.address?.slice(0, 10)}...</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'CONTACTS' && (
                    <div className="grid grid-cols-2 gap-4">
                        {contacts.map(c => (
                            <div key={c.id} onClick={() => handleSelectContact(c)} className="p-4 border border-[var(--glass-border)] rounded-xl hover:bg-white/5 cursor-pointer text-center space-y-2">
                                <div className="w-12 h-12 rounded-full bg-purple-500/20 mx-auto flex items-center justify-center text-xl">
                                    {c.name[0]}
                                </div>
                                <div className="font-medium">{c.name}</div>
                            </div>
                        ))}
                        {contacts.length === 0 && <div className="col-span-2 text-center opacity-50">No saved contacts</div>}
                    </div>
                )}

                {activeTab === 'TEMPLATES' && (
                    <div className="space-y-3">
                        {templates.map(t => (
                            <div key={t.id} onClick={() => handleSelectTemplate(t)} className="p-4 border border-[var(--glass-border)] rounded-xl hover:bg-white/5 cursor-pointer flex justify-between items-center">
                                <div>
                                    <div className="font-medium">{t.name}</div>
                                    <div className="text-xs opacity-60">{t.amount} {t.currency} to {t.recipientAddress.slice(0,6)}...</div>
                                </div>
                                <div>→</div>
                            </div>
                        ))}
                         {templates.length === 0 && <div className="text-center opacity-50">No templates saved</div>}
                    </div>
                )}
            </div>
        )}

        {step === "DETAILS" && selectedRecipient && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center gap-3 p-4 bg-blue-500/10 rounded-xl">
                    <span className="text-[var(--glass-text-muted)]">To:</span>
                    <span className="font-semibold text-[var(--glass-text)]">{selectedRecipient.name}</span>
                    <span className="text-xs text-[var(--glass-text-muted)] font-mono truncate max-w-[150px]">
                        {selectedRecipient.address}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--glass-text)] mb-2">Amount</label>
                        <GlassInput 
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="text-2xl"
                            autoFocus
                        />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-[var(--glass-text)] mb-2">Currency</label>
                         <select 
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full p-3 rounded-xl bg-white/5 border border-[var(--glass-border)] text-[var(--glass-text)]"
                         >
                             <option value="ETH">ETH</option>
                             <option value="SOL">SOL</option>
                             <option value="USDC">USDC</option>
                         </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--glass-text)] mb-2">Memo</label>
                    <GlassInput 
                        placeholder="What is this for?"
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                    />
                </div>
                
                {error && <div className="text-red-400 text-sm">{error}</div>}

                <div className="flex gap-4 pt-4">
                    <GlassButton variant="secondary" onClick={() => setStep("RECIPIENT")} className="flex-1">Back</GlassButton>
                    <GlassButton onClick={handleDetailsSubmit} className="flex-1">Next</GlassButton>
                </div>
            </div>
        )}

        {step === "CONFIRM" && selectedRecipient && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <h2 className="text-xl font-bold text-[var(--glass-text)] text-center">Review Transfer</h2>
                
                <div className="bg-white/5 p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[var(--glass-text-muted)]">Sending</span>
                        <span className="text-xl font-bold text-[var(--glass-text)]">{amount} {currency}</span>
                    </div>
                    <div className="h-px bg-white/10" />
                    <div className="flex justify-between items-center">
                        <span className="text-[var(--glass-text-muted)]">To</span>
                        <span className="text-[var(--glass-text)]">{selectedRecipient.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[var(--glass-text-muted)]">Address</span>
                        <span className="text-xs text-[var(--glass-text)] font-mono">{selectedRecipient.address?.slice(0, 10)}...</span>
                    </div>
                </div>

                {error && <div className="text-red-400 text-center text-sm">{error}</div>}

                <div className="flex gap-4 pt-4">
                    <GlassButton variant="secondary" onClick={() => setStep("DETAILS")} className="flex-1">Back</GlassButton>
                    <GlassButton onClick={executeTransfer} className="flex-1 bg-green-600 hover:bg-green-700 border-none">
                        Confirm & Send
                    </GlassButton>
                </div>
            </div>
        )}

        {step === "PROCESSING" && (
            <div className="py-8 px-4 space-y-8 animate-in fade-in">
                <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-[var(--glass-text)]">Processing Transaction</h3>
                    <p className="text-[var(--glass-text-muted)]">Please do not close this window.</p>
                </div>

                <div className="max-w-sm mx-auto">
                    {[
                        { id: "INITIATING", label: "Initiating", description: "Preparing transaction details" },
                        { id: "SIGNING", label: "Wallet Signature", description: "Please sign in your wallet" },
                        { id: "BROADCASTING", label: "Broadcasting", description: "Sending to blockchain" },
                        { id: "RECORDING", label: "Recording", description: "Updating internal ledger" }
                    ].map((s, i, arr) => {
                         const stages: ProcessingStage[] = ["INITIATING", "SIGNING", "BROADCASTING", "RECORDING", "COMPLETED"];
                         let status: "PENDING" | "CURRENT" | "COMPLETED" | "FAILED" = "PENDING";

                         if (failedStage === s.id) {
                             status = "FAILED";
                         } else if (failedStage) {
                             const failedIndex = stages.indexOf(failedStage);
                             const myIndex = stages.indexOf(s.id as ProcessingStage);
                             status = myIndex < failedIndex ? "COMPLETED" : "PENDING";
                         } else {
                             if (processingStage === "COMPLETED") {
                                 status = "COMPLETED";
                             } else {
                                 const currentIndex = stages.indexOf(processingStage);
                                 const myIndex = stages.indexOf(s.id as ProcessingStage);
                                 if (myIndex < currentIndex) status = "COMPLETED";
                                 else if (myIndex === currentIndex) status = "CURRENT";
                                 else status = "PENDING";
                             }
                         }

                         return (
                             <ProcessingStep 
                                 key={s.id}
                                 status={status}
                                 label={s.label}
                                 description={s.description}
                                 isLast={i === arr.length - 1}
                             />
                         );
                    })}
                </div>
            </div>
        )}

        {step === "SUCCESS" && (
            <div className="text-center py-12 space-y-6 animate-in zoom-in-95">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-4xl">
                    ✅
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-[var(--glass-text)]">Success!</h3>
                    <p className="text-[var(--glass-text-muted)] mt-2">Funds transferred successfully.</p>
                </div>
                
                <div className="flex gap-2 justify-center">
                    <GlassButton size="sm" variant="secondary" onClick={saveAsContact}>Save Contact</GlassButton>
                    <GlassButton size="sm" variant="secondary" onClick={saveAsTemplate}>Save Template</GlassButton>
                </div>

                <div className="flex gap-4 justify-center pt-4">
                    <GlassButton variant="secondary" onClick={() => router.push('/wallet')}>Back to Wallet</GlassButton>
                    <GlassButton onClick={() => {
                        setStep("RECIPIENT");
                        setAmount("");
                        setMemo("");
                        setTxHash("");
                        setSelectedRecipient(null);
                    }}>Send Another</GlassButton>
                </div>
            </div>
        )}
      </GlassCard>
    </div>
  );
}
