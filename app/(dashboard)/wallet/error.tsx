"use client";

import { useEffect } from "react";
import GlassButton from "@/components/ui/glass/GlassButton";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 p-6 text-center">
      <h2 className="text-2xl font-bold text-red-500">Something went wrong!</h2>
      <p className="text-[var(--glass-text-muted)]">
        We couldn&apos;t load your wallet information. Please try again.
      </p>
      <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20 max-w-md overflow-auto">
        <code className="text-xs text-red-400">{error.message}</code>
      </div>
      <GlassButton onClick={() => reset()}>Try again</GlassButton>
    </div>
  );
}
