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
  const [checkedServer, setCheckedServer] = useState(false);
  const appIdAvailable = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);
  const router = useRouter();

  const attemptSync = useCallback(async () => {
    try {
      setLoadingDbUser(true);
      setSyncError(null);
      const res = await fetch("/api/users/profile", { credentials: "include" });
      let needsSync = false;

      if (res.ok) {
        const data = await res.json();
        if (privyUser?.id && data.privyId !== privyUser.id) {
          needsSync = true;
        } else {
          setDbUser(data);
        }
      } else if (res.status === 401) {
        needsSync = true;
      } else {
        setSyncError(`profile_${res.status}`);
      }

      if (needsSync) {
        const token = await getAccessToken();
        if (!token) {
          setSyncError("missing_token");
          return;
        }
        const syncRes = await fetch("/api/auth/privy-sync", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (syncRes.ok) {
          const synced = await syncRes.json();
          setDbUser(synced);
          const retryRes = await fetch("/api/users/profile", { credentials: "include" });
          if (retryRes.ok) {
            const data = await retryRes.json();
            setDbUser(data);
          } else {
            setSyncError(`profile_retry_${retryRes.status}`);
          }
        } else {
          try {
            const details = await syncRes.json();
            setSyncError(`sync_${syncRes.status}:${details?.error || "unknown"}`);
          } catch {
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

  const checkServerSession = useCallback(async () => {
    try {
      setLoadingDbUser(true);
      const res = await fetch("/api/users/profile", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setDbUser(data);
      } else if (res.status === 401) {
        setDbUser(null);
      } else {
        setSyncError(`profile_${res.status}`);
      }
    } catch (err) {
      console.error("Server session check error:", err);
    } finally {
      setLoadingDbUser(false);
      setCheckedServer(true);
    }
  }, []);

  useEffect(() => {
    if (!checkedServer && !loadingDbUser) {
      checkServerSession();
    }
  }, [checkedServer, loadingDbUser, checkServerSession]);

  useEffect(() => {
    if (ready && authenticated) {
      attemptSync();
    }
  }, [ready, authenticated, attemptSync]);

  const status = (!checkedServer || loadingDbUser)
    ? "loading"
    : (dbUser ? "authenticated" : "unauthenticated");

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
      console.log("useAuth.handleSignIn invoked", { appIdAvailable, ready });
      if (!appIdAvailable) {
        console.warn("Privy appId missing; login blocked");
        return;
      }
      if (!ready) {
        console.warn("Privy provider not ready; login blocked");
        return;
      }
      try {
        console.log("useAuth.handleSignIn calling Privy login()");
        await login();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // Normalize common Google/OAuth error signals
        const normalized = /popup/i.test(msg) ? "popup_closed_by_user"
                         : /access_denied|permission/i.test(msg) ? "access_denied"
                         : /network|timeout/i.test(msg) ? "network_error"
                         : msg;
        setSyncError(`login_error:${normalized}`);
        console.error("Privy login failed", msg);
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
