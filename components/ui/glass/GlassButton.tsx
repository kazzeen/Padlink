import React from "react";
import { twMerge } from "tailwind-merge";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export default function GlassButton({
  children,
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  ...props
}: GlassButtonProps) {
  const baseStyles = "glass-button rounded-xl font-semibold flex items-center justify-center gap-2 relative overflow-hidden text-[var(--glass-text)] border-[var(--glass-border)]";
  
  const variants = {
    primary: "hover:brightness-110",
    secondary: "opacity-90 hover:opacity-100",
    danger: "hover:brightness-110",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      className={twMerge(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
      )}
      {children}
    </button>
  );
}
