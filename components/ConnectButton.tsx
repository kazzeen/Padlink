"use client";

import { useState } from "react";
import GlassButton from "@/components/ui/glass/GlassButton";
import { useConnectionStatus } from "@/lib/hooks/useConnectionStatus";

interface ConnectButtonProps {
  receiverId: string;
  receiverName?: string; // Added for analytics/feedback potential
  initialStatus?: "NONE" | "PENDING" | "ACCEPTED" | "REJECTED";
  onConnect?: () => void;
}

export default function ConnectButton({ receiverId, receiverName, initialStatus = "NONE", onConnect }: ConnectButtonProps) {
  const { request, isLoading: isCheckingStatus, mutate } = useConnectionStatus(receiverId);
  const [isSending, setIsSending] = useState(false);

  // Determine current status:
  // 1. If loading (request undefined), use initialStatus
  // 2. If loaded and request exists, use request.status
  // 3. If loaded and request is null, status is NONE
  const currentStatus = request === undefined 
    ? initialStatus 
    : (request ? request.status : "NONE");

  const isLoading = isSending || (isCheckingStatus && request === undefined);

  const handleConnect = async () => {
    setIsSending(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId }),
      });

      if (res.ok) {
        // Refresh the status via SWR
        await mutate();
        if (onConnect) onConnect();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send request");
      }
    } catch (error) {
      console.error("Connection error:", error);
      alert("An error occurred");
    } finally {
      setIsSending(false);
    }
  };

  if (currentStatus === "PENDING") {
    return (
      <GlassButton size="sm" variant="secondary" disabled className="opacity-70 cursor-not-allowed w-full">
        Request Pending
      </GlassButton>
    );
  }

  if (currentStatus === "ACCEPTED") {
    return (
      <GlassButton size="sm" variant="primary" disabled className="opacity-100 cursor-default bg-green-500/20 text-green-700 dark:text-green-200 border-green-500/30 w-full">
        Connected
      </GlassButton>
    );
  }

  return (
    <GlassButton 
      size="sm" 
      variant="primary" 
      onClick={handleConnect}
      isLoading={isLoading}
      disabled={isLoading}
      className="w-full"
    >
      Connect
    </GlassButton>
  );
}
