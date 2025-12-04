"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";

export default function SignupPage() {
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
          Join PadLink
        </h1>
        <p className="text-[var(--glass-text-muted)] mb-8">
          Create an account to start your search for the perfect roommate.
        </p>

        <GlassButton
          onClick={signIn}
          variant="primary"
          className="w-full mb-4"
        >
          Sign Up
        </GlassButton>

        <p className="text-sm text-[var(--glass-text-muted)]">
          Already have an account?{" "}
          <button
            onClick={signIn}
            className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 hover:underline font-medium transition-colors"
          >
            Log in
          </button>
        </p>
      </GlassCard>
    </div>
  );
}
