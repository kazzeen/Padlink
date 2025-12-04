"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import Link from "next/link";

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  category: string;
  createdAt: string;
}

export default function SupportPage() {
  const { status } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTickets();
    }
  }, [status]);

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/support");
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (error) {
      console.error("Failed to fetch tickets", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return <div className="p-8 text-center text-[var(--glass-text)]">Loading support tickets...</div>;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--glass-text)] drop-shadow-md">
            Help & Support
          </h1>
          <Link href="/support/create">
            <GlassButton variant="primary">
              Create New Ticket
            </GlassButton>
          </Link>
        </div>

        <div className="mb-8">
            <h2 className="text-xl font-semibold text-[var(--glass-text)] mb-4">My Tickets</h2>
            {tickets.length === 0 ? (
            <GlassCard className="p-8 text-center">
                <p className="text-[var(--glass-text-muted)]">You haven&apos;t submitted any support tickets yet.</p>
            </GlassCard>
            ) : (
            <div className="space-y-4">
                {tickets.map((ticket) => (
                <Link href={`/support/${ticket.id}`} key={ticket.id}>
                    <GlassCard className="p-4 hover:bg-white/5 transition-colors mb-4">
                    <div className="flex justify-between items-center">
                        <div>
                        <h3 className="font-bold text-[var(--glass-text)]">{ticket.subject}</h3>
                        <p className="text-sm text-[var(--glass-text-muted)]">
                            {ticket.category} • {new Date(ticket.createdAt).toLocaleDateString()}
                        </p>
                        </div>
                        <div className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-[var(--glass-text)]">
                        {ticket.status}
                        </div>
                    </div>
                    </GlassCard>
                </Link>
                ))}
            </div>
            )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <GlassCard className="p-6">
                <h3 className="text-lg font-bold text-[var(--glass-text)] mb-2">FAQ</h3>
                <p className="text-[var(--glass-text-muted)] mb-4">Find answers to common questions.</p>
                <GlassButton variant="secondary" size="sm">Browse FAQ</GlassButton>
             </GlassCard>
             <GlassCard className="p-6">
                <h3 className="text-lg font-bold text-[var(--glass-text)] mb-2">Live Chat</h3>
                <p className="text-[var(--glass-text-muted)] mb-4">Chat with a support agent.</p>
                <GlassButton variant="secondary" size="sm" disabled>Coming Soon</GlassButton>
             </GlassCard>
        </div>
      </div>
    </div>
  );
}
