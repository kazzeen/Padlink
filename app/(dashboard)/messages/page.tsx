"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GlassCard from "@/components/ui/glass/GlassCard";

type Conversation = {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: string;
  };
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch("/api/messages");
        if (res.ok) {
          setConversations(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-[var(--glass-border)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--glass-text)] drop-shadow-md">Messages</h1>
        <p className="mt-2 text-[var(--glass-text-muted)]">
          Chat with your connected roommates.
        </p>
      </div>

      {conversations.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-[var(--glass-text-muted)] mb-4">No conversations yet.</p>
          <p className="text-sm text-[var(--glass-text-muted)]">
            Connect with roommates in the <Link href="/matches" className="text-blue-500 hover:underline">Matches</Link> tab to start chatting!
          </p>
        </GlassCard>
      ) : (
        <div className="grid gap-4">
          {conversations.map((conv) => (
            <Link href={`/messages/${conv.user.id}`} key={conv.user.id}>
              <GlassCard hoverEffect={true} className="p-4 flex items-center space-x-4 cursor-pointer">
                <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-white/20 flex items-center justify-center overflow-hidden">
                   {conv.user.image ? (
                       <img src={conv.user.image} alt={conv.user.name || "User"} className="h-full w-full object-cover" />
                   ) : (
                       <span className="text-xl font-bold text-gray-600 dark:text-white">
                         {(conv.user.name || "U").charAt(0).toUpperCase()}
                       </span>
                   )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-lg font-semibold text-[var(--glass-text)] truncate">
                      {conv.user.name || "Anonymous User"}
                    </h3>
                    <span className="text-xs text-[var(--glass-text-muted)]">
                      {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[var(--glass-text-muted)] truncate text-sm">
                    {conv.lastMessage.content}
                  </p>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
