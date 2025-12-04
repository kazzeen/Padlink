import React from "react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 border-4 border-[var(--glass-border)] border-t-blue-500 rounded-full animate-spin mx-auto"></div>
        <div className="text-[var(--glass-text-muted)] animate-pulse">
          Loading wallet...
        </div>
      </div>
    </div>
  );
}
