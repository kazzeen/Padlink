"use client";

import { useState } from "react";
import GlassButton from "@/components/ui/glass/GlassButton";

interface ConnectButtonProps {
  receiverId: string;
  initialStatus?: "NONE" | "PENDING" | "ACCEPTED" | "REJECTED";
  onConnect?: () => void;
}

export default function ConnectButton({ receiverId, initialStatus = "NONE", onConnect }: ConnectButtonProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId }),
      });

      if (res.ok) {
        setStatus("PENDING");
        if (onConnect) onConnect();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send request");
      }
    } catch (error) {
      console.error("Connection error:", error);
      alert("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "PENDING") {
    return (
      <GlassButton size="sm" variant="secondary" disabled className="opacity-70 cursor-not-allowed">
        Request Sent
      </GlassButton>
    );
  }

  if (status === "ACCEPTED") {
    return (
      <GlassButton size="sm" variant="primary" disabled className="opacity-100 cursor-default bg-green-500/20 text-green-700 dark:text-green-200 border-green-500/30">
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
    >
      Connect
    </GlassButton>
  );
}
