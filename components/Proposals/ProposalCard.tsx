"use client";

import { useState } from "react";
import Image from "next/image";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import { useAuth } from "@/lib/hooks/useAuth";

interface Proposal {
  id: string;
  status: string;
  rentAmount: number;
  moveInDate: string;
  leaseTerm: number;
  message?: string;
  expiresAt: string;
  senderId: string;
  receiverId: string;
  listing: {
    id: string;
    title: string;
    address: string;
    images: string; // JSON string
  };
}

interface ProposalCardProps {
  proposal: Proposal;
  onUpdate?: () => void;
}

export default function ProposalCard({ proposal, onUpdate }: ProposalCardProps) {
  const { data: session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isSender = session?.user?.id === proposal.senderId;
  const isReceiver = session?.user?.id === proposal.receiverId;
  const isPending = proposal.status === "PENDING";
  const isExpired = new Date(proposal.expiresAt) < new Date();

  const handleAction = async (action: "ACCEPT" | "DECLINE" | "CANCEL") => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/proposals/${proposal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Action failed");
      }

      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const images = JSON.parse(proposal.listing.images || "[]");
  const coverImage = images[0] || "/images/placeholder-house.jpg";

  const statusColors = {
    PENDING: "text-yellow-400",
    ACCEPTED: "text-green-400",
    DECLINED: "text-red-400",
    EXPIRED: "text-gray-400",
    CANCELLED: "text-gray-400",
  };

  return (
    <GlassCard className="w-full max-w-md mx-auto overflow-hidden border-2 border-opacity-50 bg-black/20 dark:bg-white/5">
      {/* Header / Status */}
      <div className="flex justify-between items-center mb-4 border-b border-[var(--glass-border)] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-[var(--glass-text)]">Rental Proposal</span>
        </div>
        <span className={`text-sm font-bold px-2 py-1 rounded-full bg-white/10 ${statusColors[proposal.status as keyof typeof statusColors] || "text-white"}`}>
          {proposal.status}
        </span>
      </div>

      {/* Property Preview */}
      <div className="flex gap-4 mb-4">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
          <Image src={coverImage} alt={proposal.listing.title} fill className="object-cover" />
        </div>
        <div className="min-w-0">
          <h4 className="font-semibold text-[var(--glass-text)] truncate">{proposal.listing.title}</h4>
          <p className="text-sm text-[var(--glass-text-muted)] truncate">{proposal.listing.address}</p>
        </div>
      </div>

      {/* Terms */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-[var(--glass-text-muted)]">Rent</p>
          <p className="font-medium text-[var(--glass-text)]">${proposal.rentAmount}/mo</p>
        </div>
        <div>
          <p className="text-[var(--glass-text-muted)]">Move-in</p>
          <p className="font-medium text-[var(--glass-text)]">{new Date(proposal.moveInDate).toLocaleDateString("en-US", { timeZone: "UTC" })}</p>
        </div>
        <div>
          <p className="text-[var(--glass-text-muted)]">Term</p>
          <p className="font-medium text-[var(--glass-text)]">{proposal.leaseTerm} months</p>
        </div>
        <div>
          <p className="text-[var(--glass-text-muted)]">Expires</p>
          <p className="font-medium text-[var(--glass-text)]">{new Date(proposal.expiresAt).toLocaleDateString("en-US", { timeZone: "UTC" })}</p>
        </div>
      </div>

      {proposal.message && (
        <div className="mb-4 p-3 rounded-lg bg-white/5 text-sm italic text-[var(--glass-text-muted)]">
          &quot;{proposal.message}&quot;
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm mb-3 text-center">{error}</p>
      )}

      {/* Actions */}
      {isPending && !isExpired && (
        <div className="flex gap-2 mt-2">
          {isReceiver && (
            <>
              <GlassButton
                onClick={() => handleAction("DECLINE")}
                variant="secondary"
                className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30"
                disabled={loading}
              >
                Decline
              </GlassButton>
              <GlassButton
                onClick={() => handleAction("ACCEPT")}
                variant="primary"
                className="flex-1 bg-green-600 hover:bg-green-700 border-none"
                disabled={loading}
              >
                Accept
              </GlassButton>
            </>
          )}
          {isSender && (
            <GlassButton
              onClick={() => handleAction("CANCEL")}
              variant="secondary"
              className="flex-1 text-[var(--glass-text-muted)]"
              disabled={loading}
            >
              Cancel Proposal
            </GlassButton>
          )}
        </div>
      )}
      
      {isExpired && isPending && (
        <p className="text-center text-sm text-red-400">This proposal has expired.</p>
      )}
    </GlassCard>
  );
}
