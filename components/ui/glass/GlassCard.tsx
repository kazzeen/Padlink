import React from "react";
import { twMerge } from "tailwind-merge";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export default function GlassCard({
  children,
  className,
  hoverEffect = false,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={twMerge(
        "glass-card rounded-2xl p-6 transition-all duration-300",
        hoverEffect && "hover:scale-[1.02] hover:shadow-2xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
