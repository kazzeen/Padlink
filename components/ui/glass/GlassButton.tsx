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
  const baseStyles = "glass-button rounded-xl font-semibold flex items-center justify-center gap-2 relative overflow-hidden";
  
  const variants = {
    primary: "bg-blue-600/10 hover:bg-blue-600/20 border-blue-500/30 dark:bg-white/10 dark:hover:bg-white/20 dark:border-white/30",
    secondary: "bg-transparent border-gray-500/20 hover:bg-gray-500/10 dark:border-white/20 dark:hover:bg-white/10",
    danger: "bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-600 dark:text-red-100 dark:bg-red-500/20 dark:hover:bg-red-500/30",
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
