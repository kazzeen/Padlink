"use client";

import { useEffect, useState, useRef, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import GlassInput from "@/components/ui/glass/GlassInput";

type Message = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: { name: string | null };
};

export default function ChatPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const router = useRouter();
  const { data: session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/${userId}`);
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId, content: newMessage }),
      });

      if (res.ok) {
        setNewMessage("");
        fetchMessages(); // Refresh immediately
      } else {
        alert("Failed to send message");
      }
    } catch (error) {
      console.error("Send error:", error);
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/messages");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-[var(--glass-border)]"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-4 flex items-center gap-4">
        <GlassButton
          onClick={handleBack}
          variant="secondary"
          size="sm"
          className="rounded-full w-10 h-10 p-0 flex items-center justify-center hover:bg-white/20"
          aria-label="Go back to previous page"
        >
          ←
        </GlassButton>
         <h1 className="text-2xl font-bold text-[var(--glass-text)] drop-shadow-md">Chat</h1>
      </div>
      
      <GlassCard className="flex-1 flex flex-col overflow-hidden p-0">
        {/* Messages Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/5 dark:bg-black/20"
        >
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-[var(--glass-text-muted)]">
              No messages yet. Say hi! 👋
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === session?.user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div 
                    className={`
                      max-w-[70%] px-4 py-2 rounded-2xl 
                      ${isMe 
                        ? "bg-blue-600 text-white rounded-br-none" 
                        : "bg-white/80 dark:bg-white/10 text-[var(--glass-text)] rounded-bl-none shadow-sm"
                      }
                    `}
                  >
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? "text-blue-100" : "opacity-50"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[var(--glass-border)] bg-white/50 dark:bg-black/20 backdrop-blur-sm">
          <form onSubmit={handleSend} className="flex gap-2">
            <GlassInput
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              disabled={sending}
            />
            <GlassButton 
              type="submit" 
              variant="primary" 
              disabled={sending || !newMessage.trim()}
              isLoading={sending}
            >
              Send
            </GlassButton>
          </form>
        </div>
      </GlassCard>
    </div>
  );
}
