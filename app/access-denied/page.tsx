import Link from "next/link";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard className="max-w-md w-full p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
          <svg
            className="h-6 w-6 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[var(--glass-text)] mb-2">Access Denied</h2>
        <p className="text-[var(--glass-text-muted)] mb-6">
          You do not have permission to view this page. This area is restricted to administrators only.
        </p>
        <Link href="/dashboard">
          <GlassButton variant="primary" className="w-full">
            Return to Dashboard
          </GlassButton>
        </Link>
      </GlassCard>
    </div>
  );
}
