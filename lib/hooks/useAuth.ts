"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export interface DBUser {
  id: string;
  privyId?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  avatar?: string | null;
  role: string;
  [key: string]: unknown;
}

export function useAuth() {
  const { user: privyUser, ready, authenticated, login, logout, getAccessToken } = usePrivy();
  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [loadingDbUser, setLoadingDbUser] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated && !dbUser && !loadingDbUser) {
      setLoadingDbUser(true);
      
      const fetchProfile = async () => {
          try {
              // 1. Try to fetch profile (relies on cookie)
              const res = await fetch("/api/users/profile");
              let needsSync = false;
              
              if (res.ok) {
                  const data = await res.json();
                  // Check if session matches current Privy user
                  // If dbUser has no privyId (legacy) or different privyId, we need to sync
                  if (privyUser?.id && data.privyId !== privyUser.id) {
                      needsSync = true;
                  } else {
                      setDbUser(data);
                  }
              } else if (res.status === 401) {
                  needsSync = true;
              }

              if (needsSync) {
                  // 2. If 401 or mismatch, sync with Privy token.
                  const token = await getAccessToken();
                  if (token) {
                      const syncRes = await fetch("/api/auth/privy-sync", {
                          method: "POST",
                          headers: { Authorization: `Bearer ${token}` }
                      });
                      
                      if (syncRes.ok) {
                          // 3. Retry profile fetch
                          const retryRes = await fetch("/api/users/profile");
                          if (retryRes.ok) {
                              const data = await retryRes.json();
                              setDbUser(data);
                          }
                      }
                  }
              }
          } catch (err) {
              console.error("Error fetching user profile:", err);
          } finally {
              setLoadingDbUser(false);
          }
      };

      fetchProfile();
    } else if (!authenticated) {
        setDbUser(null);
    }
  }, [ready, authenticated, getAccessToken, privyUser?.id, dbUser, loadingDbUser]); 

  const status = !ready || (authenticated && !dbUser && loadingDbUser) 
    ? "loading" 
    : (authenticated && dbUser ? "authenticated" : "unauthenticated");

  const session = useMemo(() => {
    return status === "authenticated" && dbUser ? {
      user: {
          id: dbUser.id,
          privyId: dbUser.privyId,
          name: dbUser.name,
          email: dbUser.email,
          image: dbUser.image || dbUser.avatar,
          role: dbUser.role
      }
    } : null;
  }, [status, dbUser]);

  const handleSignOut = async (options?: { callbackUrl?: string }) => {
      // Clear server-side session
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch (e) {
        console.error("Failed to clear server session", e);
      }

      await logout();
      if (options?.callbackUrl) {
          router.push(options.callbackUrl);
      } else {
          router.refresh();
      }
  };

  const handleSignIn = () => {
      login();
  };

  return {
    data: session,
    status,
    signIn: handleSignIn,
    signOut: handleSignOut
  };
}
