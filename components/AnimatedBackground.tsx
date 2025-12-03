"use client";

import React from "react";

export default function AnimatedBackground() {
  return (
    <div 
      className="fixed inset-0 z-[-1] overflow-hidden transition-colors duration-300"
      style={{ background: "var(--page-bg)" }}
    >
      {/* Gradient Mesh */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--blob-color-1)] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-40 animate-blob" />
      <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] bg-[var(--blob-color-2)] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-40 animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-[var(--blob-color-3)] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-40 animate-blob animation-delay-4000" />
      <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-[var(--blob-color-4)] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-30 animate-blob animation-delay-6000" />
      
      {/* Noise Overlay for texture (optional but adds depth) */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20" />
    </div>
  );
}
