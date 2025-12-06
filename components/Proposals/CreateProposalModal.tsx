"use client";

import { useState, useEffect } from "react";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import GlassInput from "@/components/ui/glass/GlassInput";

interface Listing {
  id: string;
  title: string;
  rentAmount: number;
  moveInDate: string;
  leaseTerm: number;
}

interface CreateProposalModalProps {
  receiverId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateProposalModal({ receiverId, onClose, onSuccess }: CreateProposalModalProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [selectedListingId, setSelectedListingId] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [leaseTerm, setLeaseTerm] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await fetch("/api/listings/available");
        if (res.ok) {
          const data = await res.json();
          setListings(data);
          if (data.length > 0) {
            // Pre-fill with first listing
            const first = data[0];
            setSelectedListingId(first.id);
            setRentAmount(first.rentAmount.toString());
            setMoveInDate(new Date(first.moveInDate).toISOString().split("T")[0]);
            setLeaseTerm(first.leaseTerm.toString());
          }
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load listings");
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  const handleListingChange = (id: string) => {
    setSelectedListingId(id);
    const listing = listings.find(l => l.id === id);
    if (listing) {
      setRentAmount(listing.rentAmount.toString());
      setMoveInDate(new Date(listing.moveInDate).toISOString().split("T")[0]);
      setLeaseTerm(listing.leaseTerm.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListingId) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId,
          listingId: selectedListingId,
          rentAmount: parseFloat(rentAmount),
          moveInDate,
          leaseTerm: parseInt(leaseTerm),
          message,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create proposal");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <GlassCard className="w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[var(--glass-text)]">Create Proposal</h2>
          <button onClick={onClose} className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text)]">✕</button>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[var(--glass-text-muted)] mb-4">You don&apos;t have any active listings to propose.</p>
            <GlassButton onClick={onClose} variant="secondary">Close</GlassButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-500/20 text-red-200 rounded-lg text-sm">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-[var(--glass-text-muted)] mb-1">Select Listing</label>
              <select
                value={selectedListingId}
                onChange={(e) => handleListingChange(e.target.value)}
                className="w-full p-3 rounded-xl bg-black/20 border border-[var(--glass-border)] text-[var(--glass-text)] focus:outline-none focus:border-blue-500"
              >
                {listings.map(l => (
                  <option key={l.id} value={l.id} className="bg-gray-900">{l.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <GlassInput
                label="Rent Amount ($)"
                type="number"
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value)}
                required
              />
              <GlassInput
                label="Lease Term (Months)"
                type="number"
                value={leaseTerm}
                onChange={(e) => setLeaseTerm(e.target.value)}
                required
              />
            </div>

            <GlassInput
              label="Move-in Date"
              type="date"
              value={moveInDate}
              onChange={(e) => setMoveInDate(e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-[var(--glass-text-muted)] mb-1">Message (Optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 rounded-xl bg-black/20 border border-[var(--glass-border)] text-[var(--glass-text)] focus:outline-none focus:border-blue-500 min-h-[100px]"
                placeholder="Add a personal note..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <GlassButton type="button" onClick={onClose} variant="secondary" className="flex-1">Cancel</GlassButton>
              <GlassButton type="submit" variant="primary" className="flex-1" disabled={submitting} isLoading={submitting}>
                Send Proposal
              </GlassButton>
            </div>
          </form>
        )}
      </GlassCard>
    </div>
  );
}
