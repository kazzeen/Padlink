"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useNotificationCount } from "@/lib/hooks/useNotificationCount";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session, signOut } = useAuth();
  const { count: unreadCount } = useNotificationCount();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const storedState = localStorage.getItem("sidebarCollapsed");
    if (storedState) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCollapsed(JSON.parse(storedState));
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Property Listings", href: "/listings", icon: "🏠" },
    { name: "Browse", href: "/browse", icon: "🔍" },
    { name: "Matches", href: "/matches", icon: "🧩" },
    { name: "Requests", href: "/requests", icon: "📩" },
    { name: "Messages", href: "/messages", icon: "💬" },
    { name: "Notifications", href: "/notifications", icon: "🔔" },
    { name: "Wallet", href: "/wallet", icon: "💳" },
    { name: "Profile", href: "/profile", icon: "👤" },
    { name: "Help/Support", href: "/support", icon: "❓" },
  ];

  if (session?.user?.role === "ADMIN") {
    navItems.push({ name: "Admin Panel", href: "/admin", icon: "🛡️" });
  }

  return (
    <div
      className={`flex flex-col h-screen glass-panel border-r-0 transition-all duration-300 sticky top-0 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)] h-16">
        {!isCollapsed && (
          <span className="text-xl font-bold text-[var(--glass-text)] truncate drop-shadow-lg">
            PadLink
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[var(--glass-text)] opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`relative flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "glass-button bg-black/10 dark:bg-white/20 text-[var(--glass-text)] shadow-lg scale-[1.02]"
                      : "text-[var(--glass-text)] opacity-70 hover:bg-black/5 dark:hover:bg-white/10 hover:opacity-100"
                  }`}
                  title={isCollapsed ? item.name : ""}
                  aria-label={item.name}
                >
                  <span className="text-xl mr-3 drop-shadow-md" aria-hidden="true">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="font-medium truncate">{item.name}</span>
                  )}
                  {item.name === "Notifications" && unreadCount > 0 && (
                     <span
                       className="absolute top-2 right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-[#ff0000] text-white text-xs font-bold rounded-full shadow-sm"
                       aria-label={`${unreadCount} unread notifications`}
                       aria-live="polite"
                     >
                       {unreadCount > 99 ? "99+" : unreadCount}
                     </span>
                   )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-[var(--glass-border)] space-y-2">
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between px-2"}`}>
           {!isCollapsed && <span className="text-sm text-[var(--glass-text-muted)] font-medium">Theme</span>}
           <ThemeToggle />
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={`glass-button flex items-center w-full px-4 py-3 rounded-lg text-[var(--glass-text)] ${
            isCollapsed ? "justify-center" : ""
          }`}
          title={isCollapsed ? "Logout" : ""}
          aria-label="Logout"
        >
          <span className="text-xl mr-3 drop-shadow-md" aria-hidden="true">🚪</span>
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}
