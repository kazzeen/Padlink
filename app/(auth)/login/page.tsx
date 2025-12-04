"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";

export default function LoginPage() {
  const { signIn, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <GlassCard className="w-full max-w-md p-8 text-center">
        <h1 className="text-3xl font-bold mb-4 text-[var(--glass-text)] drop-shadow-md">
          Welcome Back
        </h1>
        <p className="text-[var(--glass-text-muted)] mb-8">
          Sign in to access your dashboard and connect with roommates.
        </p>

        <GlassButton
          onClick={signIn}
          variant="primary"
          className="w-full mb-4"
        >
          Sign In
        </GlassButton>

        <p className="text-sm text-[var(--glass-text-muted)]">
            Don&apos;t have an account?{" "}
            <button
              onClick={signIn}
              className="text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 hover:underline font-medium transition-colors"
            >
              Sign up
            </button>
        </p>
      </GlassCard>
    </div>
  );
}
