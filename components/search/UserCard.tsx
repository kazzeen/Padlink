"use client";

import Image from "next/image";
import Link from "next/link";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import ConnectButton from "@/components/ConnectButton";

interface UserCardProps {
  user: any;
}

export default function UserCard({ user }: UserCardProps) {
  return (
    <GlassCard hoverEffect className="h-full flex flex-col overflow-hidden p-0">
      <div className="relative h-48 w-full bg-white/5">
        {user.avatar || user.image ? (
          <Image
            src={user.avatar || user.image}
            alt={user.name || "User"}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl text-[var(--glass-text-muted)]">
            👤
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <h3 className="text-lg font-bold text-white truncate">
            {user.name || "Anonymous"}
          </h3>
          <p className="text-xs text-white/80">
            {user.age ? `${user.age} years old` : "Age hidden"}
          </p>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col space-y-4">
        {/* Preferences Summary */}
        <div className="space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-[var(--glass-text-muted)]">Budget:</span>
                <span className="text-[var(--glass-text)] font-medium">
                    ${user.preferences?.minBudget} - ${user.preferences?.maxBudget}
                </span>
            </div>
            {user.preferences?.preferredCities && (
                <div className="flex justify-between">
                    <span className="text-[var(--glass-text-muted)]">Location:</span>
                    <span className="text-[var(--glass-text)] font-medium truncate max-w-[150px] text-right">
                        {user.preferences.preferredCities.replace(/["\[\]]/g, '').split(',').slice(0, 2).join(', ')}
                    </span>
                </div>
            )}
        </div>

        {/* Bio Teaser */}
        {user.bio && (
            <p className="text-sm text-[var(--glass-text-muted)] line-clamp-2 italic flex-1">
                &quot;{user.bio}&quot;
            </p>
        )}

        {/* Actions */}
        <div className="pt-2 flex gap-2 mt-auto">
            <Link href={`/profile/${user.id}`} className="flex-1">
                <GlassButton variant="secondary" size="sm" className="w-full">
                    Profile
                </GlassButton>
            </Link>
            <div className="flex-1">
                 <ConnectButton receiverId={user.id} />
            </div>
        </div>
      </div>
    </GlassCard>
  );
}