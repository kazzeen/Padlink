"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import GlassButton from "@/components/ui/glass/GlassButton";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
        <GlassButton size="sm" variant="secondary" className="w-10 h-10 p-0 flex items-center justify-center">
            <span className="sr-only">Toggle theme</span>
            <div className="w-5 h-5 bg-current opacity-20 rounded-full" />
        </GlassButton>
    );
  }

  return (
    <GlassButton
      size="sm"
      variant="secondary"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-10 h-10 p-0 flex items-center justify-center"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        // Sun icon for dark mode
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2" />
          <path d="M12 21v2" />
          <path d="M4.22 4.22l1.42 1.42" />
          <path d="M18.36 18.36l1.42 1.42" />
          <path d="M1 12h2" />
          <path d="M21 12h2" />
          <path d="M4.22 19.78l1.42-1.42" />
          <path d="M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        // Moon icon for light mode
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </GlassButton>
  );
}
