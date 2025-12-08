"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import { usePrivy } from "@privy-io/react-auth";

function SignupPageInner() {
  const { signIn, status, authReady, canLogin, sessionReady, retrySync, syncError } = useAuth();
  const { ready: privyReady, authenticated: privyAuthenticated, user: privyUser } = usePrivy();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showDebug = searchParams.get("authDebug") === "1";

  useEffect(() => {
    if (sessionReady) {
      router.push("/dashboard");
    }
  }, [sessionReady, router]);

  const handleSignIn = () => {
    if (!authReady || !canLogin) return;
    if (status === "unauthenticated") {
      signIn();
      return;
    }
    if (sessionReady) {
      router.push("/dashboard");
      return;
    }
    retrySync();
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <GlassCard className="w-full max-w-md p-8 text-center">
        <h1 className="text-3xl font-bold mb-4 text-[var(--glass-text)] drop-shadow-md">
          Join PadLink
        </h1>
        <p className="text-[var(--glass-text-muted)] mb-8">
          Create an account to start your search for the perfect roommate.
        </p>

        {sessionReady && (
          <div className="mb-4 p-2 bg-green-500/20 text-green-200 rounded flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            Redirecting...
          </div>
        )}

        <GlassButton
          onClick={handleSignIn}
          variant="primary"
          className="w-full mb-2"
          disabled={!canLogin || !authReady}
        >
          Sign Up
        </GlassButton>

        {syncError && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-left">
            <p className="font-semibold mb-1">Authentication Error</p>
            {syncError.startsWith("login_error:") ? (
               syncError.includes("Origin not allowed")
                ? "Login blocked: Add this domain to Privy Allowed Origins."
                : "Login failed. Please try again."
            ) : (
              `Sync failed (${syncError}). Please retry.`
            )}
          </div>
        )}

        {!canLogin && (
          <div className="text-red-500 text-sm mb-4">Authentication is not configured.</div>
        )}
        {canLogin && !authReady && (
          <div className="text-[var(--glass-text-muted)] text-sm mb-4">Preparing authentication...</div>
        )}

        <p className="text-sm text-[var(--glass-text-muted)]">
          Already have an account?{" "}
          <button
            onClick={handleSignIn}
            className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 hover:underline font-medium transition-colors"
            disabled={!canLogin || !authReady}
          >
            Log in
          </button>
        </p>

        {showDebug && (
          <div className="mt-6 text-left text-sm space-y-2 p-3 rounded-md border border-[var(--glass-border)] bg-black/5 dark:bg-white/5">
            <div className="font-semibold">Auth Diagnostics</div>
            <div>env NEXT_PUBLIC_PRIVY_APP_ID: {String(Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID))}</div>
            <div>authReady: {String(authReady)}</div>
            <div>canLogin: {String(canLogin)}</div>
            <div>status: {status}</div>
            <div>privyReady: {String(privyReady)}</div>
            <div>privyAuthenticated: {String(privyAuthenticated)}</div>
            <div>privyUserId: {privyUser?.id ?? "null"}</div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

export default function SignupPage() {
  const appIdAvailable = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);
  if (!appIdAvailable) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <GlassCard className="w-full max-w-md p-8 text-center">
          <h1 className="text-3xl font-bold mb-4 text-[var(--glass-text)] drop-shadow-md">Authentication Unavailable</h1>
          <p className="text-[var(--glass-text-muted)] mb-8">Missing configuration. Set NEXT_PUBLIC_PRIVY_APP_ID.</p>
        </GlassCard>
      </div>
    );
  }
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div></div>}>
      <SignupPageInner />
    </Suspense>
  );
}
