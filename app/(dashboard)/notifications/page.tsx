"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSWRConfig } from "swr";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const { status } = useAuth();
  const { mutate } = useSWRConfig();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      fetchNotifications();
    }
  }, [status]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
      });
      if (res.ok) {
        // Optimistically update UI
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        mutate("/api/notifications/unread-count");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PUT" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      mutate("/api/notifications/unread-count");
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  if (status === "loading" || loading) {
    return <div className="p-8 text-center text-[var(--glass-text)]">Loading notifications...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="p-8 text-center text-[var(--glass-text)]">
        <p className="mb-4">You need to be signed in to view notifications.</p>
        <Link href="/login" className="text-blue-600 dark:text-blue-300 hover:underline">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--glass-text)] drop-shadow-md">
            Notifications
          </h1>
          {notifications.some(n => !n.read) && (
            <GlassButton onClick={markAllAsRead} variant="secondary" size="sm">
              Mark all as read
            </GlassButton>
          )}
        </div>

        {notifications.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-[var(--glass-text-muted)]">No notifications yet.</p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <GlassCard
                key={notification.id}
                className={`p-4 transition-all ${
                  !notification.read ? "border-l-4 border-blue-500 bg-blue-500/10" : "opacity-80"
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-[var(--glass-text)] mb-1">
                      {notification.title}
                    </h3>
                    <p className="text-[var(--glass-text)] text-sm mb-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-[var(--glass-text-muted)]">
                      {new Date(notification.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })} at {new Date(notification.createdAt).toLocaleTimeString("en-US", { timeZone: "UTC" })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Mark read
                      </button>
                    )}
                    {notification.link && (
                      <Link
                        href={notification.link}
                        onClick={() => markAsRead(notification.id)}
                        className="text-sm text-blue-500 hover:text-blue-400 font-medium"
                      >
                        View Details →
                      </Link>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
