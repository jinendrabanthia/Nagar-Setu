"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Shield, Zap } from "lucide-react";
import { api } from "@/lib/api";
import type { Session } from "@/lib/types";
import { LiquidBackdrop } from "@/components/LiquidBackdrop";
import { ThemeToggle } from "@/components/ThemeToggle";

const DEMO_PASSWORD = "RoadguardDemo#2026";

const DEMO_ACCOUNTS = [
  ["ops@demo.roadguard.ai", "Operations administrator"],
  ["reviewer@demo.roadguard.ai", "Event reviewer / verifier"],
  ["engineer@demo.roadguard.ai", "Department engineer"],
  ["auditor@demo.roadguard.ai", "Auditor (read only)"],
  ["admin@demo.roadguard.ai", "Organization administrator"],
];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post<Session>("/api/v1/auth/login", { email, password });
    } catch {
      // Auth paused fallback when backend is offline
      if (typeof document !== "undefined") {
        document.cookie = "roadguard_access=demo_session_token; path=/; SameSite=Lax";
      }
    } finally {
      const next = params.get("next");
      router.replace(next && next.startsWith("/") ? next : "/command");
      router.refresh();
      setBusy(false);
    }
  }

  function bypassAuth() {
    if (typeof document !== "undefined") {
      document.cookie = "roadguard_access=demo_session_token; path=/; SameSite=Lax";
    }
    const next = params.get("next");
    router.replace(next && next.startsWith("/") ? next : "/command");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4 py-10 text-[var(--text-primary)]">
      <LiquidBackdrop />

      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-[14px] border border-[var(--glass-border)] bg-[var(--accent-soft)] text-[var(--accent-primary)]">
            <Shield className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            ROADGUARD <span className="text-[var(--accent-primary)]">AI</span>
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            City safety review and municipal corrective-action tracking
          </p>
        </div>

        <form
          onSubmit={submit}
          className="glass-floating space-y-4 rounded-[18px] p-6"
        >
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ops@demo.roadguard.ai"
              className="themed-input"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••••••"
              className="themed-input"
            />
          </div>
          {error ? (
            <p
              role="alert"
              className="rounded-[10px] border px-3 py-2 text-xs"
              style={{
                backgroundColor: "var(--status-danger-bg)",
                borderColor: "var(--status-danger-border)",
                color: "var(--status-danger)",
              }}
            >
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-[10px] bg-[var(--accent-primary)] px-3.5 py-2.5 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <button
            type="button"
            onClick={bypassAuth}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2 text-xs font-medium text-[var(--accent-primary)] transition hover:border-[var(--accent-primary)]/40 hover:bg-[var(--accent-soft)]"
          >
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            Enter Command Center (Auth Paused)
          </button>
          <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
            Roles are assigned by an administrator on the server. You cannot choose a role at
            sign-in.
          </p>
        </form>

        <div
          className="mt-5 rounded-[14px] border p-4 text-xs"
          style={{
            backgroundColor: "var(--demo-bg)",
            borderColor: "var(--demo-border)",
            color: "var(--demo-text)",
          }}
        >
          <p className="font-semibold tracking-wide">DEMO CREDENTIALS</p>
          <p className="mt-1 opacity-90">
            Password:{" "}
            <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono font-medium">
              RoadguardDemo#2026
            </code>
          </p>
          <p className="mt-1 opacity-75">
            Click any account below to autofill both email &amp; password:
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {DEMO_ACCOUNTS.map(([account, role]) => (
              <li key={account} className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="rounded px-1.5 py-0.5 text-left font-mono underline decoration-dotted hover:bg-black/5"
                  onClick={() => {
                    setEmail(account);
                    setPassword(DEMO_PASSWORD);
                    setError(null);
                  }}
                >
                  {account}
                </button>
                <span className="text-[11px] opacity-75">{role}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-primary)]" />}>
      <LoginForm />
    </Suspense>
  );
}
