"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassInput from "@/components/ui/glass/GlassInput";
import GlassButton from "@/components/ui/glass/GlassButton";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setIsLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  const handleGuestSignIn = async () => {
    setIsLoading(true);
    // Guest login logic here - passing a special flag to the credentials provider
    const result = await signIn("credentials", {
      redirect: false,
      isGuest: "true",
    });
    
    if (result?.error) {
      setError("Failed to create guest session");
      setIsLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <GlassCard className="w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-[var(--glass-text)] drop-shadow-md">
          Welcome Back
        </h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-600 dark:text-red-100 p-3 rounded-lg mb-4 text-sm text-center backdrop-blur-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleCredentialsSignIn} className="space-y-4 mb-6">
          <GlassInput
            label="Email Address / Username"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com or username"
          />
          <GlassInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
          <GlassButton
            type="submit"
            isLoading={isLoading}
            variant="primary"
            className="w-full"
          >
            Sign In
          </GlassButton>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--glass-border)]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-transparent text-[var(--glass-text-muted)] backdrop-blur-xl">Or continue with</span>
          </div>
        </div>

        <div className="space-y-4">
          <GlassButton
            onClick={handleGuestSignIn}
            isLoading={isLoading}
            variant="secondary"
            className="w-full"
          >
            Continue as Guest
          </GlassButton>
        </div>

        <p className="text-center text-sm text-[var(--glass-text-muted)] mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 hover:underline font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
      </GlassCard>
    </div>
  );
}
