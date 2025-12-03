"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassInput from "@/components/ui/glass/GlassInput";
import GlassButton from "@/components/ui/glass/GlassButton";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleCredentialsSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. Register the user via API
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Registration failed");
      }

      // 2. Sign in the user immediately
      const signInResult = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (signInResult?.error) {
        throw new Error("Failed to sign in after registration");
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <GlassCard className="w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-[var(--glass-text)] drop-shadow-md">
          Join PadLink
        </h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-800 dark:text-red-100 p-3 rounded-lg mb-4 text-sm text-center backdrop-blur-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleCredentialsSignup} className="space-y-4 mb-6">
          <GlassInput
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="John Doe"
          />
          <GlassInput
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
          <GlassInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Create a password"
          />
          <GlassButton
            type="submit"
            isLoading={isLoading}
            variant="primary"
            className="w-full"
          >
            Sign Up
          </GlassButton>
        </form>

        <p className="text-center text-sm text-[var(--glass-text-muted)] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 hover:underline font-medium transition-colors">
            Log in
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
