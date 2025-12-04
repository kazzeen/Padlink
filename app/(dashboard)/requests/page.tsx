"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";

type User = {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
};

type Request = {
  id: string;
  senderId: string;
  receiverId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  message: string;
  createdAt: string;
  sender: User;
  receiver: User;
};

export default function RequestsPage() {
  const router = useRouter();
  const [receivedRequests, setReceivedRequests] = useState<Request[]>([]);
  const [sentRequests, setSentRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const [receivedRes, sentRes] = await Promise.all([
        fetch("/api/requests?type=received"),
        fetch("/api/requests?type=sent"),
      ]);

      if (receivedRes.ok) {
        setReceivedRequests(await receivedRes.json());
      }
      if (sentRes.ok) {
        setSentRequests(await sentRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusUpdate = async (requestId: string, newStatus: "ACCEPTED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Refresh lists
        fetchRequests();
      } else {
        alert("Failed to update request");
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("An error occurred");
    }
  };

  const handleRequestClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    
    // Prevent navigation if clicking on interactive elements
    if (target.closest('button') || target.closest('a')) {
      return;
    }

    const card = target.closest('[data-user-id]');
    if (card) {
      const userId = card.getAttribute('data-user-id');
      if (userId) {
        try {
          const profileUrl = `/profile/${userId}`;
          router.push(profileUrl);
        } catch (error) {
          console.error("Navigation failed:", error);
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, userId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      router.push(`/profile/${userId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-[var(--glass-border)]" data-testid="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--glass-text)] drop-shadow-md">Connection Requests</h1>
        <p className="mt-2 text-[var(--glass-text-muted)]">
          Manage your incoming roommate requests and track those you&apos;ve sent.
        </p>
      </div>

      {/* Received Requests */}
      <section>
        <h2 className="text-xl font-semibold text-[var(--glass-text)] mb-4 flex items-center">
          Received
          {receivedRequests.filter(r => r.status === 'PENDING').length > 0 && (
             <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
               {receivedRequests.filter(r => r.status === 'PENDING').length} New
             </span>
          )}
        </h2>
        
        {receivedRequests.length === 0 ? (
          <GlassCard className="p-6 text-center opacity-80">
            <p className="text-[var(--glass-text-muted)]">No received requests yet.</p>
          </GlassCard>
        ) : (
          <div 
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            onClick={handleRequestClick}
            data-testid="received-requests-grid"
          >
            {receivedRequests.map((req) => (
              <GlassCard 
                key={req.id} 
                className="p-6 space-y-4 cursor-pointer hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
                data-user-id={req.sender.id}
                role="button"
                tabIndex={0}
                aria-label={`View profile of ${req.sender.name || "User"}`}
                onKeyDown={(e) => handleKeyDown(e, req.sender.id)}
                data-testid={`request-card-${req.sender.id}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[var(--glass-border)] bg-white/10 flex-shrink-0">
                      {req.sender.image ? (
                        <Image
                          src={req.sender.image}
                          alt={req.sender.name || "User"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm">
                          👤
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--glass-text)]">
                        {req.sender.name || "Anonymous"}
                      </h3>
                      <p className="text-xs text-[var(--glass-text-muted)]">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border
                    ${req.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                      req.status === 'ACCEPTED' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                      'bg-red-500/10 text-red-600 border-red-500/20'}
                  `}>
                    {req.status}
                  </div>
                </div>
                
                <div className="bg-black/5 dark:bg-white/5 p-3 rounded-lg text-sm text-[var(--glass-text)] italic">
                  &quot;{req.message}&quot;
                </div>

                {req.status === 'PENDING' && (
                  <div className="flex gap-3 pt-2">
                    <GlassButton 
                      size="sm" 
                      variant="primary" 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusUpdate(req.id, "ACCEPTED");
                      }}
                    >
                      Accept
                    </GlassButton>
                    <GlassButton 
                      size="sm" 
                      variant="secondary" 
                      className="flex-1 text-red-500 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusUpdate(req.id, "REJECTED");
                      }}
                    >
                      Decline
                    </GlassButton>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        )}
      </section>

      {/* Sent Requests */}
      <section>
        <h2 className="text-xl font-semibold text-[var(--glass-text)] mb-4">Sent</h2>
        
        {sentRequests.length === 0 ? (
          <GlassCard className="p-6 text-center opacity-80">
            <p className="text-[var(--glass-text-muted)]">You haven&apos;t sent any requests yet.</p>
          </GlassCard>
        ) : (
          <div 
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            onClick={handleRequestClick}
            data-testid="sent-requests-grid"
          >
            {sentRequests.map((req) => (
              <GlassCard 
                key={req.id} 
                className="p-6 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
                data-user-id={req.receiver.id}
                role="button"
                tabIndex={0}
                aria-label={`View profile of ${req.receiver.name || "User"}`}
                onKeyDown={(e) => handleKeyDown(e, req.receiver.id)}
                data-testid={`request-card-${req.receiver.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[var(--glass-border)] bg-white/10 flex-shrink-0">
                    {req.receiver.image ? (
                      <Image
                        src={req.receiver.image}
                        alt={req.receiver.name || "User"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm">
                        👤
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--glass-text)]">
                      {req.receiver.name || "Anonymous"}
                    </h3>
                    <p className="text-xs text-[var(--glass-text-muted)]">
                      Sent on {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border
                  ${req.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                    req.status === 'ACCEPTED' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                    'bg-red-500/10 text-red-600 border-red-500/20'}
                `}>
                  {req.status}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
