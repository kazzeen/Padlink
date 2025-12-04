import React from "react";
import { Check, X, Loader2, Circle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProcessingStepProps {
  status: "PENDING" | "CURRENT" | "COMPLETED" | "FAILED";
  label: string;
  description?: string;
  isLast?: boolean;
}

const ProcessingStep: React.FC<ProcessingStepProps> = ({ status, label, description, isLast }) => {
  return (
    <div className="relative flex gap-4 group">
      {/* Line connector */}
      {!isLast && (
        <div 
          className={cn(
            "absolute left-[15px] top-8 bottom-0 w-0.5 transition-all duration-700 ease-in-out",
            status === "COMPLETED" ? "bg-green-500" : "bg-white/10"
          )} 
          aria-hidden="true"
        />
      )}
      
      {/* Icon Container */}
      <div 
        className={cn(
          "relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500",
          status === "COMPLETED" ? "bg-green-500 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]" : 
          status === "FAILED" ? "bg-red-500 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]" :
          status === "CURRENT" ? "bg-blue-500/20 border-blue-400 text-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.3)] scale-110" :
          "bg-black/20 border-white/10 text-white/20"
        )}
        aria-current={status === "CURRENT" ? "step" : undefined}
      >
        {status === "COMPLETED" && <Check className="w-5 h-5 animate-in zoom-in duration-300" />}
        {status === "FAILED" && <X className="w-5 h-5 animate-in zoom-in duration-300" />}
        {status === "CURRENT" && <Loader2 className="w-5 h-5 animate-spin" />}
        {status === "PENDING" && <div className="w-2 h-2 bg-current rounded-full" />}
      </div>

      {/* Content */}
      <div className={cn(
        "pb-8 pt-1 transition-all duration-500 flex-1",
        status === "PENDING" ? "opacity-40 blur-[0.5px]" : "opacity-100"
      )}>
        <h4 className={cn(
          "font-medium text-base transition-colors duration-300",
          status === "CURRENT" ? "text-blue-400" : 
          status === "COMPLETED" ? "text-green-400" :
          status === "FAILED" ? "text-red-400" :
          "text-[var(--glass-text)]"
        )}>
          {label}
        </h4>
        {description && (
          <p className="text-sm text-[var(--glass-text-muted)] mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProcessingStep;
