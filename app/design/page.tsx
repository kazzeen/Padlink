import GlassButton from "@/components/ui/glass/GlassButton";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassInput from "@/components/ui/glass/GlassInput";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = {
  title: "Design System - PadLink",
  description: "Glassmorphism Design System Documentation",
};

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen p-8 pb-20">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-[var(--glass-text)] drop-shadow-lg">Liquid Glass Design System</h1>
          <p className="text-xl text-[var(--glass-text)] opacity-80">
            A comprehensive guide to the Glassmorphism UI components used in PadLink.
          </p>
          <div className="flex items-center gap-4">
             <span className="text-[var(--glass-text)] opacity-70">Toggle Theme to test variants:</span>
             <ThemeToggle />
          </div>
        </div>

        {/* Typography */}
                <section className="space-y-6">
                  <h2 className="text-2xl font-bold text-[var(--glass-text)] border-b border-[var(--glass-border)] pb-2">Typography</h2>
                  <p className="text-[var(--glass-text)] opacity-80">
                    All text elements feature high contrast to ensure readability against the glass/mesh backgrounds.
                  </p>
                  <GlassCard className="p-8 space-y-6">
                    <div>
                      <h1 className="text-4xl font-bold text-[var(--glass-text)]">Heading 1 (4xl Bold)</h1>
                      <p className="text-[var(--glass-text)] opacity-50 text-sm">text-4xl font-bold text-[var(--glass-text)]</p>
                    </div>
            <div>
              <h2 className="text-3xl font-bold text-[var(--glass-text)]">Heading 2 (3xl Bold)</h2>
              <p className="text-[var(--glass-text)] opacity-50 text-sm">text-3xl font-bold text-[var(--glass-text)]</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[var(--glass-text)]">Heading 3 (2xl Bold)</h3>
              <p className="text-[var(--glass-text)] opacity-50 text-sm">text-2xl font-bold text-[var(--glass-text)]</p>
            </div>
            <div>
              <p className="text-base text-[var(--glass-text)] opacity-90">
                Body text (base). The quick brown fox jumps over the lazy dog. 
                Glassmorphism relies on high contrast text (pure white or dark grey) with varying opacity for hierarchy.
              </p>
              <p className="text-[var(--glass-text)] opacity-50 text-sm">text-base text-[var(--glass-text)] opacity-90</p>
            </div>
            <div>
              <p className="text-sm text-[var(--glass-text)] opacity-60">
                Muted text (sm). Used for secondary information, timestamps, or hints.
              </p>
              <p className="text-[var(--glass-text)] opacity-50 text-sm">text-sm text-[var(--glass-text)] opacity-60</p>
            </div>
          </GlassCard>
        </section>

        {/* Colors */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-[var(--glass-text)] border-b border-[var(--glass-border)] pb-2">Color Palette</h2>
          <GlassCard className="p-8 space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-[var(--glass-text)] opacity-80 mb-4">Theme Backgrounds</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-[#F5F7FA] shadow-lg border border-[var(--glass-border)]"></div>
                  <p className="text-[var(--glass-text)] font-medium">Light Mode Background</p>
                  <p className="text-[var(--glass-text)] opacity-60 text-xs">#F5F7FA</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-gradient-to-b from-[#001F3F] via-[#0081A7] to-[#006D77] shadow-lg border border-[var(--glass-border)]"></div>
                  <p className="text-[var(--glass-text)] font-medium">Dark Mode Background</p>
                  <p className="text-[var(--glass-text)] opacity-60 text-xs">Ocean Gradient (#001F3F -> #006D77)</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--glass-text)] opacity-80 mb-4">Text Colors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-[#212121] shadow-lg border border-[var(--glass-border)]"></div>
                  <p className="text-[var(--glass-text)] font-medium">Light Mode Text</p>
                  <p className="text-[var(--glass-text)] opacity-60 text-xs">#212121 (var(--glass-text))</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-[#F5F5F5] shadow-lg border border-[var(--glass-border)]"></div>
                  <p className="text-[var(--glass-text)] font-medium">Dark Mode Text</p>
                  <p className="text-[var(--glass-text)] opacity-60 text-xs">#F5F5F5 (var(--glass-text))</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--glass-text)] opacity-80 mb-4">Animated Blobs (Light Mode)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-[#93C5FD] shadow-lg border border-[var(--glass-border)]"></div>
                  <p className="text-[var(--glass-text)] opacity-60 text-xs">Blue 300 (#93C5FD)</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-[#D8B4FE] shadow-lg border border-[var(--glass-border)]"></div>
                  <p className="text-[var(--glass-text)] opacity-60 text-xs">Purple 300 (#D8B4FE)</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-[#FDBA74] shadow-lg border border-[var(--glass-border)]"></div>
                  <p className="text-[var(--glass-text)] opacity-60 text-xs">Orange 300 (#FDBA74)</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-[#5EEAD4] shadow-lg border border-[var(--glass-border)]"></div>
                  <p className="text-[var(--glass-text)] opacity-60 text-xs">Teal 300 (#5EEAD4)</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--glass-text)] opacity-80 mb-4">Animated Blobs (Dark Mode)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-[#023e8a] shadow-lg border border-[var(--glass-border)]"></div>
                  <p className="text-[var(--glass-text)] opacity-60 text-xs">Royal Blue (#023e8a)</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-[#0096c7] shadow-lg border border-[var(--glass-border)]"></div>
                  <p className="text-[var(--glass-text)] opacity-60 text-xs">Pacific Blue (#0096c7)</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-[#48cae4] shadow-lg border border-[var(--glass-border)]"></div>
                  <p className="text-[var(--glass-text)] opacity-60 text-xs">Sky Blue (#48cae4)</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-[#0077b6] shadow-lg border border-[var(--glass-border)]"></div>
                  <p className="text-[var(--glass-text)] opacity-60 text-xs">Star Command (#0077b6)</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Buttons */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-[var(--glass-text)] border-b border-[var(--glass-border)] pb-2">Buttons</h2>
          <GlassCard className="p-8 space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--glass-text)] opacity-80">Variants</h3>
              <div className="flex flex-wrap gap-4">
                <GlassButton variant="primary">Primary Button</GlassButton>
                <GlassButton variant="secondary">Secondary Button</GlassButton>
                <GlassButton variant="danger">Danger Button</GlassButton>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--glass-text)] opacity-80">Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <GlassButton size="sm" variant="primary">Small</GlassButton>
                <GlassButton size="md" variant="primary">Medium</GlassButton>
                <GlassButton size="lg" variant="primary">Large</GlassButton>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--glass-text)] opacity-80">States</h3>
              <div className="flex flex-wrap gap-4">
                <GlassButton isLoading variant="primary">Loading</GlassButton>
                <GlassButton disabled variant="primary">Disabled</GlassButton>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Cards */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-[var(--glass-text)] border-b border-white/20 dark:border-white/20 border-black/10 pb-2">Cards</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-[var(--glass-text)] mb-2">Standard Glass Card</h3>
              <p className="text-[var(--glass-text)] opacity-70">
                This is a standard card with blur, semi-transparent background, and a subtle border.
                It uses `backdrop-filter: blur(20px)`.
              </p>
            </GlassCard>
            
            <GlassCard className="p-6" hoverEffect>
              <h3 className="text-xl font-bold text-[var(--glass-text)] mb-2">Interactive Card</h3>
              <p className="text-[var(--glass-text)] opacity-70">
                Hover over this card to see the lift effect and glow intensification.
                Perfect for clickable items or grid layouts.
              </p>
            </GlassCard>
          </div>
        </section>

        {/* Inputs */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-[var(--glass-text)] border-b border-white/20 dark:border-white/20 border-black/10 pb-2">Inputs</h2>
          <GlassCard className="p-8 max-w-xl space-y-6">
            <GlassInput 
              label="Standard Input" 
              placeholder="Type something..." 
            />
            
            <GlassInput 
              label="With Error" 
              placeholder="Invalid input..." 
              error="This field is required"
            />
            
            <GlassInput 
              label="Password" 
              type="password"
              placeholder="••••••••" 
            />
          </GlassCard>
        </section>

      </div>
    </div>
  );
}
