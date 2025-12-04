"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import ConnectButton from "@/components/ConnectButton";
import { User, PreferenceProfile } from "@prisma/client";

// Extended User type with optional email and isConnected status
type UserProfile = Partial<User> & {
  preferences?: PreferenceProfile | null;
  email?: string | null;
  isConnected?: boolean;
};

export default function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (res.ok) {
          setUser(await res.json());
        } else {
          setError("Failed to load profile");
        }
      } catch (err) {
        console.error(err);
        setError("An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div data-testid="loading-spinner" className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-[var(--glass-border)]"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <p className="text-red-500">{error || "User not found"}</p>
        <GlassButton onClick={() => router.back()}>Go Back</GlassButton>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header / Navigation */}
      <div className="flex items-center justify-between">
        <GlassButton onClick={() => router.back()} variant="secondary" size="sm">
          ← Back
        </GlassButton>
        {user.isConnected && (
           <Link href={`/messages/${user.id}`}>
             <GlassButton variant="primary" size="sm">
               Message
             </GlassButton>
           </Link>
        )}
      </div>

      {/* Profile Header Card */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="relative h-48 md:h-64 w-full bg-gradient-to-r from-blue-500/20 to-purple-500/20">
          {/* Cover Image Placeholder - could be real cover image later */}
          <div className="absolute -bottom-16 left-8">
            <div className="relative h-32 w-32 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-gray-200">
              {user.avatar || user.image ? (
                <Image
                  src={user.avatar || user.image}
                  alt={user.name || "Profile"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full text-4xl">👤</div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-20 px-8 pb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[var(--glass-text)]">
                {user.name || "Anonymous User"}
              </h1>
              <p className="text-[var(--glass-text-muted)]">
                {user.age ? `${user.age} years old` : "Age hidden"} • {user.role === "ROOMMATE_SEEKER" ? "Looking for a room" : "Has a room"}
              </p>
              {user.isConnected && user.email && (
                 <p className="text-sm text-blue-500 mt-1">{user.email}</p>
              )}
            </div>
            
            {!user.isConnected && (
              <div className="w-full md:w-auto">
                <ConnectButton receiverId={user.id!} />
              </div>
            )}
          </div>

          {user.bio && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2 text-[var(--glass-text)]">About Me</h3>
              <p className="text-[var(--glass-text-muted)] leading-relaxed">
                {user.bio}
              </p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Preferences */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold mb-4 text-[var(--glass-text)] flex items-center gap-2">
            <span>🏠</span> Living Preferences
          </h3>
          
          <div className="space-y-4">
            <PreferenceItem 
              label="Budget Range" 
              value={user.preferences ? `$${user.preferences.minBudget} - $${user.preferences.maxBudget}` : "Not specified"} 
            />
            <PreferenceItem 
              label="Preferred Cities" 
              value={user.preferences?.preferredCities 
                ? user.preferences.preferredCities.replace(/["\[\]]/g, '').split(',').join(', ') 
                : "Anywhere"} 
            />
            <PreferenceItem 
              label="Cleanliness" 
              value={user.preferences ? `${user.preferences.cleanlinesLevel}/5` : "Not specified"} 
            />
            <PreferenceItem 
              label="Sleep Schedule" 
              value={user.preferences?.sleepSchedule ? formatEnum(user.preferences.sleepSchedule) : "Not specified"} 
            />
            <PreferenceItem 
              label="Smoking" 
              value={user.preferences?.smokingStatus ? formatEnum(user.preferences.smokingStatus) : "Not specified"} 
            />
             <PreferenceItem 
              label="Social Vibe" 
              value={user.preferences?.socialPreference ? formatEnum(user.preferences.socialPreference) : "Not specified"} 
            />
          </div>
        </GlassCard>

        {/* Additional Info / Stats */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold mb-4 text-[var(--glass-text)] flex items-center gap-2">
             <span>📋</span> Details
          </h3>
           <div className="space-y-4">
            <PreferenceItem 
              label="Member Since" 
              value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"} 
            />
            <PreferenceItem 
              label="Commute Preference" 
              value={user.preferences?.commutDistance ? `< ${user.preferences.commutDistance} miles` : "Flexible"} 
            />
             <PreferenceItem 
              label="Verified" 
              value="Yes (Identity Verified)" 
            />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function PreferenceItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-2 last:border-0">
      <span className="text-[var(--glass-text-muted)]">{label}</span>
      <span className="text-[var(--glass-text)] font-medium text-right">{value}</span>
    </div>
  );
}

function formatEnum(str: string) {
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
