"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { BootstrapMeta, Session } from "@/lib/types";
import { MOCK_BOOTSTRAP_META, MOCK_SESSION } from "@/lib/mockData";

interface SessionState {
  session: Session | null;
  meta: BootstrapMeta | null;
  loading: boolean;
  error: string | null;
  has: (permission: string) => boolean;
  reload: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(MOCK_SESSION);
  const [meta, setMeta] = useState<BootstrapMeta | null>(MOCK_BOOTSTRAP_META);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [current, bootstrap] = await Promise.all([
        api.get<Session>("/api/v1/auth/me"),
        api.get<BootstrapMeta>("/api/v1/meta/bootstrap"),
      ]);
      setSession(current);
      setMeta(bootstrap);
    } catch (err) {
      // Preserve real backend 401 redirect when API is running; only use temporary offline preview when unreachable
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login") &&
        err instanceof ApiError &&
        err.status === 401
      ) {
        setSession(null);
        window.location.href = "/login";
        return;
      }
      setSession(MOCK_SESSION);
      setMeta(MOCK_BOOTSTRAP_META);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const signOut = useCallback(async () => {
    try {
      await api.post("/api/v1/auth/logout");
    } catch {
      /* ignore when backend offline */
    } finally {
      if (typeof document !== "undefined") {
        document.cookie = "roadguard_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      window.location.href = "/login";
    }
  }, []);

  const value = useMemo<SessionState>(
    () => ({
      session,
      meta,
      loading,
      error,
      has: (permission: string) => Boolean(session?.user.permissions.includes(permission)),
      reload: load,
      signOut,
    }),
    [session, meta, loading, error, load, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider");
  return context;
}
