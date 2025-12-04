import React from "react";
import { twMerge } from "tailwind-merge";

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, label, error, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = props.id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[var(--glass-text)] opacity-90 mb-2 ml-1">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={twMerge(
            "glass-input w-full px-4 py-3 rounded-xl transition-all duration-200 placeholder-gray-500 dark:placeholder-white/40 focus:outline-none",
            error ? "border-red-500/50 focus:border-red-500" : "focus:border-gray-400 dark:focus:border-white/60",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-red-500 dark:text-red-300 text-xs mt-1 ml-1 animate-pulse">{error}</p>
        )}
      </div>
    );
  }
);

GlassInput.displayName = "GlassInput";
export default GlassInput;
