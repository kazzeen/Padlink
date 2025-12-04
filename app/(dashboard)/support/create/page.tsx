"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import GlassInput from "@/components/ui/glass/GlassInput";

export default function CreateTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    subject: "",
    category: "GENERAL",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create ticket");
      }

      router.push("/support");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <GlassCard className="p-8">
          <h1 className="text-2xl font-bold text-[var(--glass-text)] mb-6">
            Submit a Support Ticket
          </h1>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--glass-text)] mb-2">
                Subject
              </label>
              <GlassInput
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief summary of the issue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--glass-text)] mb-2">
                Category
              </label>
              <select
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-[var(--glass-text)] focus:outline-none focus:ring-2 focus:ring-white/20"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="GENERAL" className="bg-slate-800">General Inquiry</option>
                <option value="TECHNICAL" className="bg-slate-800">Technical Issue</option>
                <option value="BILLING" className="bg-slate-800">Billing Support</option>
                <option value="ABUSE" className="bg-slate-800">Report Abuse</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--glass-text)] mb-2">
                Message
              </label>
              <textarea
                required
                rows={6}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-[var(--glass-text)] placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Describe your issue in detail..."
              />
            </div>

            <div className="flex justify-end gap-4">
              <GlassButton
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </GlassButton>
              <GlassButton type="submit" variant="primary" disabled={loading}>
                {loading ? "Submitting..." : "Submit Ticket"}
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
