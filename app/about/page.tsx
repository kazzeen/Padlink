import Link from "next/link";
import Image from "next/image";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = {
  title: "About Us - PadLink",
  description: "Learn more about PadLink and our mission to help you find the perfect roommate.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Navbar */}
      <nav className="glass-panel flex items-center justify-between px-8 py-4 border-b border-[var(--glass-border)] sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-3">
          <div className="glass-icon-container w-12 h-12 rounded-full p-1">
            <Image 
              src="/images/logo_transparent.png" 
              alt="PadLink Logo - Return to homepage" 
              width={32} 
              height={32} 
              className="object-contain"
            />
          </div>
          <div className="text-2xl font-bold text-[var(--glass-text)] drop-shadow-lg">
            PadLink
          </div>
        </Link>
        <div className="space-x-4 flex items-center">
          <ThemeToggle />
          <Link href="/login" className="text-[var(--glass-text)] opacity-80 hover:opacity-100 transition-opacity font-medium">
            Login
          </Link>
          <Link href="/signup">
            <GlassButton size="sm" variant="primary">
              Sign Up
            </GlassButton>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-16 relative z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[100px] -z-10" />
        
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--glass-text)] mb-8 drop-shadow-xl text-center">About PadLink</h1>
        
        <div className="prose prose-lg prose-invert mx-auto">
          <GlassCard className="p-8 mb-8">
            <p className="mb-6 text-[var(--glass-text)] opacity-90 leading-relaxed text-lg">
              PadLink is dedicated to making the roommate search process safe, simple, and effective. 
              We understand that who you live with is just as important as where you live.
            </p>

            <h2 className="text-2xl font-bold text-[var(--glass-text)] mt-8 mb-4">Our Mission</h2>
            <p className="mb-6 text-[var(--glass-text)] opacity-80">
              To eliminate the stress of finding a roommate by using data-driven compatibility matching. 
              We believe everyone deserves a harmonious living environment.
            </p>

            <h2 className="text-2xl font-bold text-[var(--glass-text)] mt-8 mb-4">How It Works</h2>
            <ul className="list-disc pl-6 space-y-2 mb-6 text-[var(--glass-text)] opacity-80">
              <li>Create a detailed profile with your lifestyle preferences.</li>
              <li>Our algorithm scores your compatibility with other users.</li>
              <li>View potential matches sorted by compatibility score.</li>
              <li>Connect safely through our platform.</li>
            </ul>
          </GlassCard>

          <GlassCard className="mt-12 p-8 flex flex-col items-center text-center bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-400/30">
            <h3 className="text-2xl font-bold text-[var(--glass-text)] mb-2">Ready to find your match?</h3>
            <p className="text-[var(--glass-text-muted)] mb-6">
              Join thousands of others finding their perfect roommates today.
            </p>
            <Link href="/signup">
              <GlassButton size="lg" variant="primary" className="shadow-lg shadow-blue-500/20">
                Get Started
              </GlassButton>
            </Link>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
