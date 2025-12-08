"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState, useMemo, useCallback } from "react";
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
  const [syncError, setSyncError] = useState<string | null>(null);
  const appIdAvailable = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);
  const router = useRouter();

  const attemptSync = useCallback(async () => {
    try {
      setLoadingDbUser(true);
      setSyncError(null);
      console.log("[Auth] Attempting to fetch profile...");
      const res = await fetch("/api/users/profile", { credentials: "include" });
      let needsSync = false;

      if (res.ok) {
        const data = await res.json();
        console.log("[Auth] Profile fetch successful", data.id);
        if (privyUser?.id && data.privyId !== privyUser.id) {
          console.warn("[Auth] Privy ID mismatch, resyncing...");
          needsSync = true;
        } else {
          setDbUser(data);
        }
      } else if (res.status === 401) {
        console.log("[Auth] Profile fetch 401, attempting sync...");
        needsSync = true;
      } else {
        console.error(`[Auth] Profile fetch failed: ${res.status}`);
        setSyncError(`profile_${res.status}`);
      }

      if (needsSync) {
        const token = await getAccessToken();
        if (!token) {
          console.error("[Auth] No access token available for sync");
          setSyncError("missing_token");
          return;
        }
        console.log("[Auth] Calling privy-sync...");
        const syncRes = await fetch("/api/auth/privy-sync", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (syncRes.ok) {
          const synced = await syncRes.json();
          console.log("[Auth] Sync successful, updating user state", synced.id);
          setDbUser(synced);
          
          // Optional: Verify cookie persistence by fetching profile again
          // But don't block login if we already have the user data
          fetch("/api/users/profile", { credentials: "include" })
            .then(r => {
                if (r.ok) r.json().then(setDbUser);
                else console.warn("[Auth] Post-sync profile fetch failed, but sync was successful.");
            })
            .catch(e => console.error("[Auth] Post-sync fetch error", e));
            
        } else {
          try {
            const details = await syncRes.json();
            console.error(`[Auth] Sync failed: ${syncRes.status}`, details);
            setSyncError(`sync_${syncRes.status}:${details?.error || "unknown"}`);
          } catch {
            console.error(`[Auth] Sync failed: ${syncRes.status}`);
            setSyncError(`sync_${syncRes.status}`);
          }
        }
      }
    } catch (err) {
      console.error("Auth sync error:", err);
      setSyncError("sync_exception");
    } finally {
      setLoadingDbUser(false);
    }
  }, [getAccessToken, privyUser?.id]);

  useEffect(() => {
    if (ready && authenticated && !dbUser && !loadingDbUser) {
      attemptSync();
    } else if (!authenticated) {
      setDbUser(null);
      setSyncError(null);
    }
  }, [ready, authenticated, getAccessToken, privyUser?.id, dbUser, loadingDbUser, attemptSync]);

  const status = !ready ? "loading" : (authenticated ? "authenticated" : "unauthenticated");

  const session = useMemo(() => {
    if (status !== "authenticated") return null;
    if (dbUser) {
      return {
        user: {
          id: dbUser.id,
          privyId: dbUser.privyId,
          name: dbUser.name,
          email: dbUser.email,
          image: dbUser.image || dbUser.avatar,
          role: dbUser.role
        }
      };
    }
    const p = privyUser as unknown as { id?: string; email?: { address?: string }; google?: { name?: string; picture?: string } };
    return {
      user: {
        id: `privy:${p?.id ?? ""}`,
        privyId: p?.id ?? null,
        name: p?.google?.name ?? null,
        email: p?.email?.address ?? null,
        image: p?.google?.picture ?? null,
        role: "USER"
      }
    };
  }, [status, dbUser, privyUser]);

  const sessionReady = status === "authenticated" && dbUser !== null;

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

  const handleSignIn = async () => {
      if (!appIdAvailable) {
        console.warn("Privy appId missing; login blocked");
        return;
      }
      if (!ready) {
        console.warn("Privy provider not ready; login blocked");
        return;
      }
      try {
        await login();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const isOriginError = /origin not allowed/i.test(msg);
        setSyncError(`login_error:${msg}`);
        if (isOriginError && typeof window !== "undefined") {
          window.location.href = "/api/auth/signin/google?callbackUrl=/dashboard";
        }
      }
  };

  return {
    data: session,
    status,
    sessionReady,
    loadingDbUser,
    syncError,
    retrySync: attemptSync,
    authReady: ready,
    canLogin: appIdAvailable,
    signIn: handleSignIn,
    signOut: handleSignOut
  };
}
