"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter, useParams } from "next/navigation";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  createdAt: string;
}

export default function TicketDetailsPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const { status } = useAuth();
  const router = useRouter();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/support/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch ticket");
      }
      const data = await res.json();
      setTicket(data);
    } catch (err) {
      setError("Could not load ticket details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (status === "authenticated" && id) {
      fetchTicket();
    }
  }, [status, id, fetchTicket]);

  if (status === "loading" || loading) {
    return <div className="p-8 text-center text-[var(--glass-text)]">Loading ticket...</div>;
  }

  if (error || !ticket) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400 mb-4">{error || "Ticket not found"}</p>
        <GlassButton onClick={() => router.back()} variant="secondary">
          Go Back
        </GlassButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <GlassButton 
            onClick={() => router.push('/support')} 
            variant="secondary" 
            size="sm" 
            className="mb-6"
        >
            ← Back to Support
        </GlassButton>

        <GlassCard className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[var(--glass-text)] mb-2">
                {ticket.subject}
              </h1>
              <div className="flex gap-3 text-sm">
                <span className="px-2 py-1 rounded bg-white/10 text-[var(--glass-text)]">
                  {ticket.category}
                </span>
                <span className="px-2 py-1 rounded bg-white/10 text-[var(--glass-text)]">
                  {new Date(ticket.createdAt).toLocaleString("en-US", { timeZone: "UTC" })}
                </span>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full font-bold text-sm ${
                ticket.status === 'OPEN' ? 'bg-green-500/20 text-green-200' :
                ticket.status === 'CLOSED' ? 'bg-gray-500/20 text-gray-200' :
                'bg-blue-500/20 text-blue-200'
            }`}>
              {ticket.status}
            </div>
          </div>

          <div className="bg-black/20 rounded-lg p-6 mb-8">
            <h3 className="text-xs uppercase tracking-wider text-[var(--glass-text-muted)] mb-2">Description</h3>
            <p className="text-[var(--glass-text)] whitespace-pre-wrap leading-relaxed">
              {ticket.message}
            </p>
          </div>

          {/* Placeholder for conversation/replies */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-semibold text-[var(--glass-text)] mb-4">Updates</h3>
            <p className="text-[var(--glass-text-muted)] italic">
              No updates from support team yet. You will be notified via email when the status changes.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
