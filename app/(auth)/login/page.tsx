"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import { usePrivy } from "@privy-io/react-auth";

function LoginPageInner() {
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
    const cb = searchParams.get("callbackUrl") || "/dashboard";
    console.log("LoginPage.handleSignIn click", { authReady, canLogin, status, sessionReady, cb });
    if (authReady && canLogin) {
      if (status === "unauthenticated") {
        console.log("LoginPage using Privy login()");
        signIn();
        return;
      }
      if (sessionReady) {
        console.log("LoginPage has sessionReady, redirecting");
        router.push("/dashboard");
        return;
      }
      console.log("LoginPage attempting Privy sync retry");
      retrySync();
      return;
    }
    console.log("LoginPage authentication unavailable");
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <GlassCard className="w-full max-w-md p-8 text-center">
        <h1 className="text-3xl font-bold mb-4 text-[var(--glass-text)] drop-shadow-md">
          Welcome Back
        </h1>
        <p className="text-[var(--glass-text-muted)] mb-8">
          Sign in to access your dashboard and connect with roommates.
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
          disabled={sessionReady}
        >
          Sign In
        </GlassButton>

        

        {syncError && syncError.startsWith("login_error:") && (
          <div className="mt-3 text-red-500 text-sm">
            {syncError.includes("Origin not allowed")
              ? "Login blocked: add http://localhost:3000 to Privy allowed origins (Dashboard → Security → Allowed Origins)."
              : syncError.match(/popup|closed/i)
                ? "Login canceled: the sign-in window was closed."
                : syncError.match(/access_denied|permission/i)
                  ? "Google denied access: please grant permissions and try again."
                  : syncError.match(/network|timeout/i)
                    ? "Network issue during Google sign-in: check your connection and retry."
                    : "Login failed. Please try again or choose another method."}
          </div>
        )}

        {!canLogin && (
          <div className="text-red-500 text-sm mb-4">Authentication is not configured.</div>
        )}
        {canLogin && !authReady && (
          <div className="text-[var(--glass-text-muted)] text-sm mb-4">Preparing authentication...</div>
        )}

        <p className="text-sm text-[var(--glass-text-muted)]">
            Don&apos;t have an account?{" "}
            <button
              onClick={handleSignIn}
              className="text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 hover:underline font-medium transition-colors"
              disabled={!canLogin || !authReady}
            >
              Sign up
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

export default function LoginPage() {
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
      <LoginPageInner />
    </Suspense>
  );
}
