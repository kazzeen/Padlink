"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import Link from "next/link";
import ProfileForm from "@/components/Forms/ProfileForm";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import MyListings from "@/components/listings/MyListings";

export default function DashboardPage() {
  const { data: session, status } = useAuth();

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

        <div className="grid gap-8 md:grid-cols-2">
          <GlassCard className="shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-[var(--glass-text)]">Your Profile</h2>
            <p className="text-[var(--glass-text-muted)] mb-4">
              Keep your profile updated to get better matches.
            </p>
            {/* We can embed the profile form here or link to it */}
            <ProfileForm />
          </GlassCard>

          <GlassCard className="h-fit shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-[var(--glass-text)]">Quick Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel bg-blue-500/10 p-4 rounded-xl text-center border border-blue-400/30">
                <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">0</div>
                <div className="text-sm text-[var(--glass-text-muted)]">New Matches</div>
              </div>
              <div className="glass-panel bg-green-500/10 p-4 rounded-xl text-center border border-green-400/30">
                <div className="text-3xl font-bold text-green-800 dark:text-green-200">0</div>
                <div className="text-sm text-[var(--glass-text-muted)]">Messages</div>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="mt-8">
          <MyListings />
        </div>
      </div>
    </div>
  );
}
