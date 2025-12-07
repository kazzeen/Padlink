"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useEffect, useState } from "react";
import Link from "next/link";
import ProfileForm from "@/components/Forms/ProfileForm";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import MyListings from "@/components/listings/MyListings";

export default function DashboardPage() {
  const { data: session, status } = useAuth();
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 0);
    return () => clearTimeout(t);
  }, []);

  if (status === "loading") {
    return <div className="p-8 text-center text-[var(--glass-text)]">Loading...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="p-8 text-center text-[var(--glass-text)]">
        <p className="mb-4">You need to be signed in to view this page.</p>
        <Link href="/login" className="text-blue-600 dark:text-blue-300 hover:underline">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Quick Stats Compact Bar */}
        <div className={`mb-6 transition-all duration-300 ease-out ${entered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}>
           <GlassCard className="w-full p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--glass-text-muted)] shrink-0">Quick Stats</h2>
              <div className="flex flex-1 w-full sm:w-auto gap-3">
                 <div className="flex-1 glass-panel bg-blue-500/10 p-2 rounded-lg flex items-center justify-center gap-3 border border-blue-400/30">
                   <div className="text-2xl font-bold text-blue-800 dark:text-blue-200 leading-none">0</div>
                   <div className="text-xs font-medium text-[var(--glass-text-muted)]">New Matches</div>
                 </div>
                 <div className="flex-1 glass-panel bg-green-500/10 p-2 rounded-lg flex items-center justify-center gap-3 border border-green-400/30">
                   <div className="text-2xl font-bold text-green-800 dark:text-green-200 leading-none">0</div>
                   <div className="text-xs font-medium text-[var(--glass-text-muted)]">Messages</div>
                 </div>
              </div>
           </GlassCard>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-[var(--glass-text)] drop-shadow-md">
            Welcome, {session?.user?.name}!
          </h1>
            <div className="flex flex-wrap gap-4">
            {/* Admin Dashboard Link */}
            {session?.user?.role === "ADMIN" && (
              <Link href="/admin">
                <GlassButton variant="danger" size="sm">
                  Admin Panel
                </GlassButton>
              </Link>
            )}
            <Link href="/matches">
              <GlassButton variant="primary" size="sm">
                View Matches
              </GlassButton>
            </Link>
            <Link href="/profile">
              <GlassButton variant="secondary" size="sm">
                Edit Profile
              </GlassButton>
            </Link>
          </div>
        </div>

        <div className="mb-8">
           <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--glass-text)]">Your Profile</h2>
                <p className="text-[var(--glass-text-muted)] text-sm">
                  Keep your profile updated to get better matches.
                </p>
              </div>
           </div>
           
           <ProfileForm layoutMode="grid" />
        </div>

        <div className="mt-8">
          <MyListings />
        </div>
      </div>
    </div>
  );
}
