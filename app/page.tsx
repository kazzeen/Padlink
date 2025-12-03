import Link from "next/link";
import GlassButton from "@/components/ui/glass/GlassButton";
import GlassCard from "@/components/ui/glass/GlassCard";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Navbar Placeholder */}
      <nav className="glass-panel flex items-center justify-between px-8 py-4 border-b border-[var(--glass-border)] sticky top-0 z-50">
        <div className="text-2xl font-bold text-[var(--glass-text)] drop-shadow-lg">PadLink</div>
        <div className="space-x-4 flex items-center">
          <ThemeToggle />
          <Link href="/login" className="text-[var(--glass-text)] opacity-80 hover:opacity-100 transition-colors font-medium">
            Login
          </Link>
          <Link href="/signup">
            <GlassButton size="sm" variant="primary">
              Sign Up
            </GlassButton>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center px-4 py-20 text-center relative z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-[100px] -z-10" />
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-[var(--glass-text)] mb-6 drop-shadow-xl">
          Find Your Perfect Roommate <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600 dark:from-teal-300 dark:to-blue-300">
            Stress-Free
          </span>
        </h1>
        <p className="text-xl text-[var(--glass-text-muted)] max-w-2xl mb-10 drop-shadow-md">
          Connect with compatible roommates based on lifestyle, budget, and personality. 
          Swipe, chat, and live together happily.
        </p>
        <div className="flex gap-4">
          <Link href="/signup">
            <GlassButton size="lg" variant="primary" className="shadow-xl shadow-blue-500/20">
              Get Started
            </GlassButton>
          </Link>
          <Link href="/about">
            <GlassButton size="lg" variant="secondary">
              Learn More
            </GlassButton>
          </Link>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-16 relative z-10">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          <GlassCard className="p-8 flex flex-col items-center text-center" hoverEffect>
            <div className="text-4xl mb-4 p-4 bg-black/5 dark:bg-white/10 rounded-full">🧩</div>
            <h3 className="text-xl font-bold mb-2 text-[var(--glass-text)]">Smart Matching</h3>
            <p className="text-[var(--glass-text-muted)]">
              Our algorithm matches you based on 20+ compatibility factors including sleep schedule, cleanliness, and social habits.
            </p>
          </GlassCard>
          
          <GlassCard className="p-8 flex flex-col items-center text-center" hoverEffect>
            <div className="text-4xl mb-4 p-4 bg-black/5 dark:bg-white/10 rounded-full">🔒</div>
            <h3 className="text-xl font-bold mb-2 text-[var(--glass-text)]">Verified Profiles</h3>
            <p className="text-[var(--glass-text-muted)]">
              Safety first. All users undergo identity verification so you can search with confidence.
            </p>
          </GlassCard>
          
          <GlassCard className="p-8 flex flex-col items-center text-center" hoverEffect>
            <div className="text-4xl mb-4 p-4 bg-black/5 dark:bg-white/10 rounded-full">💬</div>
            <h3 className="text-xl font-bold mb-2 text-[var(--glass-text)]">In-App Chat</h3>
            <p className="text-[var(--glass-text-muted)]">
              Connect safely without sharing personal contact info until you&apos;re ready.
            </p>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
