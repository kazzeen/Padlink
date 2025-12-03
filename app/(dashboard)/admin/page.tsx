"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";

interface AdminStats {
  totalUsers: number;
  totalListings: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user?.role !== "ADMIN") {
      router.push("/access-denied");
      return;
    }

    // Fetch admin stats
    fetch("/api/admin/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch stats");
        return res.json();
      })
      .then((data) => setStats(data))
      .catch((err) => setError(err.message));
  }, [session, status, router]);

  if (status === "loading") {
    return <div className="p-8 text-center text-[var(--glass-text)]">Loading...</div>;
  }

  if (!session || session.user.role !== "ADMIN") {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--glass-text)] mb-8 drop-shadow-md">Admin Dashboard</h1>

        {/* Production Warning */}
        <div className="mt-8 bg-yellow-500/20 border border-yellow-400/50 p-4 rounded-lg mb-8 backdrop-blur-sm">
          <h4 className="font-bold text-yellow-800 dark:text-yellow-200">Development Mode Warning</h4>
          <p className="text-yellow-900/80 dark:text-yellow-100/80 text-sm">
            You are currently using the default admin account (admin/admin). 
            Please create a secure admin account and disable this one before deploying to production.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-800 dark:text-red-100 p-4 rounded-lg mb-8 backdrop-blur-sm">
            {error}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold mb-4 text-[var(--glass-text)]">System Overview</h2>
            {stats ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-500/20 border border-blue-400/30 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">
                    {stats.totalUsers}
                  </div>
                  <div className="text-sm text-blue-900/70 dark:text-blue-100/70">Total Users</div>
                </div>
                <div className="bg-purple-500/20 border border-purple-400/30 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-purple-800 dark:text-purple-200">
                    {stats.totalListings}
                  </div>
                  <div className="text-sm text-purple-900/70 dark:text-purple-100/70">Active Listings</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-[var(--glass-text-muted)]">Loading stats...</div>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-bold mb-4 text-[var(--glass-text)]">Quick Actions</h2>
            <div className="space-y-4">
              <GlassButton variant="secondary" className="w-full justify-start">
                Manage Users
              </GlassButton>
              <GlassButton variant="secondary" className="w-full justify-start">
                Review Listings
              </GlassButton>
              <GlassButton variant="secondary" className="w-full justify-start">
                System Settings
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
