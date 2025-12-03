"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, PreferenceProfile } from "@prisma/client";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";

type MatchUser = User & {
  matchScore: number;
  preferences?: PreferenceProfile;
};

import ConnectButton from "@/components/ConnectButton";

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch("/api/matches");
        if (res.ok) {
          const data = await res.json();
          setMatches(data);
        } else {
          const errData = await res.json();
          setError(errData.error || "Failed to fetch matches");
        }
      } catch {
        setError("An error occurred while fetching matches");
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-[var(--glass-border)]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-500 dark:text-red-400 mb-4">Oops!</h2>
        <p className="text-[var(--glass-text-muted)] mb-6">{error}</p>
        {error.includes("preferences") && (
          <Link href="/profile">
            <GlassButton variant="primary">
              Complete Your Profile
            </GlassButton>
          </Link>
        )}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-[var(--glass-text)] mb-4">No Matches Found</h2>
        <p className="text-[var(--glass-text-muted)]">
          We couldn&apos;t find any roommates matching your criteria right now.
          Try adjusting your preferences or check back later!
        </p>
        <div className="mt-6">
             <Link href="/profile">
                <GlassButton variant="secondary">
                  Adjust Preferences
                </GlassButton>
              </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--glass-text)] drop-shadow-md">Your Top Matches</h1>
        <p className="mt-2 text-[var(--glass-text-muted)]">
          Based on your compatibility score, here are the best roommate options for you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map((match) => (
          <GlassCard
            key={match.id}
            hoverEffect={true}
            className="p-0 overflow-hidden flex flex-col h-full"
          >
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[var(--glass-border)] bg-white/10 flex-shrink-0">
                    {match.avatar || match.image ? (
                      <Image
                        src={match.avatar || match.image || ""}
                        alt={match.name || "User"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">
                        👤
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--glass-text)]">
                      {match.name || "Anonymous User"}
                    </h3>
                    <p className="text-sm text-[var(--glass-text)] opacity-60">{match.role === "ROOMMATE_SEEKER" ? "Roommate Seeker" : "User"}</p>
                  </div>
                </div>
                <div className={`
                    flex items-center justify-center h-12 w-12 rounded-full font-bold text-sm border
                    ${match.matchScore >= 80 ? "bg-green-500/20 text-green-800 dark:text-green-200 border-green-400/50" : 
                      match.matchScore >= 60 ? "bg-yellow-500/20 text-yellow-800 dark:text-yellow-200 border-yellow-400/50" : "bg-red-500/20 text-red-800 dark:text-red-200 border-red-400/50"}
                `}>
                  {match.matchScore}%
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                {match.age && (
                    <p className="text-[var(--glass-text-muted)] text-sm">
                        <span className="font-medium text-[var(--glass-text)]">Age:</span> {match.age}
                    </p>
                )}
                {match.bio && (
                    <p className="text-[var(--glass-text-muted)] text-sm line-clamp-3 italic">
                        &quot;{match.bio}&quot;
                    </p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-[var(--glass-border)] flex justify-between items-center bg-black/5 dark:bg-white/5">
                 <button className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text)] text-sm font-medium transition-colors">
                    View Profile
                 </button>
                 <ConnectButton receiverId={match.id} />
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
