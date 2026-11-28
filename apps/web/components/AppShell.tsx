"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Building2,
  Camera,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSearch,
  FileText,
  Flame,
  HardHat,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Radio,
  ScrollText,
  Shield,
  Users,
  Video,
  AlertTriangle,
  X,
} from "lucide-react";
import { useSession } from "@/lib/session";
import { useRealtime } from "@/lib/realtime";
import { DemoBanner, type Tone } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LiquidBackdrop } from "@/components/LiquidBackdrop";
import { formatDateTime } from "@/lib/format";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const COMMAND_NAV: NavItem[] = [
  { href: "/command", label: "Overview", icon: LayoutDashboard },
  { href: "/command/cameras", label: "Cameras", icon: Camera },
  { href: "/command/monitoring", label: "Monitoring", icon: Radio },
  { href: "/command/videos", label: "Videos & Jobs", icon: Video },
  { href: "/command/incidents", label: "Events", icon: AlertTriangle },
  { href: "/command/hotspots", label: "Hotspots", icon: Flame },
  { href: "/command/investigations", label: "Investigations", icon: FileSearch },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/departments", label: "Departments", icon: Building2 },
  { href: "/admin/contractors", label: "Contractors", icon: HardHat },
  { href: "/admin/assets", label: "Assets", icon: MapPin },
  { href: "/admin/contracts", label: "Contracts", icon: FileText },
  { href: "/admin/investigations", label: "Investigations", icon: FileSearch },
  { href: "/admin/work-orders", label: "Work orders", icon: ClipboardList },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/audit-logs", label: "Audit trail", icon: ScrollText },
  { href: "/admin/users", label: "Users & roles", icon: Users },
];

export function AppShell({
  tone,
  children,
}: {
  tone: Tone;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { session, loading, signOut } = useSession();
  const realtime = useRealtime();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const nav = tone === "command" ? COMMAND_NAV : ADMIN_NAV;
  const org = session?.user.organization;
  const cityLabel = org?.city ? `${org.city}${org.state ? `, ${org.state}` : ""}` : null;

  const isActive = (href: string) => {
    if (href === "/command" || href === "/admin") return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const SidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand Block */}
      <div className="flex items-center justify-between gap-2 px-3 py-3.5">
        <Link href={tone === "command" ? "/command" : "/admin"} className="flex items-center gap-2.5 min-w-0">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-[var(--glass-border)] bg-[var(--accent-soft)] text-[var(--accent-primary)]"
          >
            <Shield className="h-4 w-4" aria-hidden="true" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                ROADGUARD <span className="text-[var(--accent-primary)]">AI</span>
              </p>
              <p className="truncate text-[11px] font-medium text-[var(--text-muted)]">
                {tone === "command" ? "Command Center" : "Administrative Portal"}
              </p>
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden h-7 w-7 items-center justify-center rounded-[8px] text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] lg:inline-flex"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
          className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav aria-label={`${tone} navigation`} className="mt-2 flex-1 space-y-1 overflow-y-auto px-2.5">
        {nav.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={`group relative flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13.5px] font-medium transition-all duration-150 ${
                active
                  ? "bg-[var(--accent-soft)] text-[var(--accent-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              {active ? (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--accent-primary)]"
                />
              ) : null}
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  active ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                }`}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Governance & Context */}
      <div className="mt-auto space-y-2 border-t border-[var(--border-subtle)] p-2.5">
        {!collapsed && org ? (
          <div className="rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-2">
            <p className="truncate text-xs font-semibold text-[var(--text-primary)]">{org.name}</p>
            {cityLabel ? (
              <p className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">{cityLabel}</p>
            ) : null}
          </div>
        ) : null}

        <Link
          href={tone === "command" ? "/admin" : "/command"}
          onClick={() => setMobileOpen(false)}
          title={tone === "command" ? "Administrative Portal" : "Command Center"}
          className="flex items-center justify-center gap-2 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] transition hover:border-[var(--accent-primary)]/40 hover:text-[var(--accent-primary)]"
        >
          <ArrowLeftRight className="h-3.5 w-3.5 shrink-0 text-[var(--accent-primary)]" aria-hidden="true" />
          {!collapsed && (
            <span className="truncate">
              {tone === "command" ? "Administrative Portal" : "Command Center"}
            </span>
          )}
        </Link>

        {session ? (
          <div className="flex items-center justify-between gap-2 rounded-[10px] px-2 py-1.5">
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-[var(--text-primary)]">
                  {session.user.full_name}
                </p>
                <p className="truncate text-[11px] capitalize text-[var(--text-muted)]">
                  {session.user.role.replace(/_/g, " ")}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => void signOut()}
              title="Sign out"
              aria-label="Sign out"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-[var(--border-subtle)] text-[var(--text-secondary)] transition hover:border-[var(--status-danger-border)] hover:text-[var(--status-danger)]"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ) : null}

        {!collapsed && (
          <p className="px-2 text-[10.5px] leading-snug text-[var(--text-muted)]">
            Human verification required for all safety & municipal decisions.
          </p>
        )}
      </div>
    </div>
  );

  const realtimeBadge =
    realtime.status === "live"
      ? { label: "Live", color: "var(--status-success)", bg: "var(--status-success-bg)" }
      : realtime.status === "blocked"
        ? { label: "Polling / Offline", color: "var(--text-muted)", bg: "var(--bg-subtle)" }
        : { label: "Connecting", color: "var(--status-warn)", bg: "var(--status-warn-bg)" };

  return (
    <div className="relative min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <LiquidBackdrop />

      <div className="relative z-10 flex min-h-screen">
        {/* Desktop Floating Sidebar */}
        <aside
          className={`hidden shrink-0 p-3 transition-[width] duration-200 lg:block ${
            collapsed ? "w-[84px]" : "w-[264px]"
          }`}
        >
          <div className="glass-floating sticky top-3 h-[calc(100vh-24px)] rounded-[18px]">
            {SidebarContent}
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileOpen ? (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/45 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <aside className="glass-floating relative z-10 h-full w-72 max-w-[85vw] rounded-r-[18px] p-2">
              {SidebarContent}
            </aside>
          </div>
        ) : null}

        {/* Main Shell Column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Header */}
          <header className="sticky top-0 z-30 px-3 pt-3 sm:px-5">
            <div className="glass-floating flex items-center justify-between gap-3 rounded-[14px] px-3.5 py-2.5 sm:px-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open navigation menu"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-[var(--border-subtle)] text-[var(--text-primary)] lg:hidden"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <span className="truncate text-sm font-semibold tracking-tight lg:hidden">
                  ROADGUARD <span className="text-[var(--accent-primary)]">AI</span>
                </span>
                {org ? (
                  <div className="hidden items-center gap-2 sm:flex">
                    <span className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)]">
                      {org.name}
                    </span>
                    {cityLabel ? (
                      <span className="hidden items-center gap-1 text-xs text-[var(--text-secondary)] md:inline-flex">
                        <MapPin className="h-3 w-3 text-[var(--accent-copper)]" aria-hidden="true" />
                        {cityLabel}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* System Connectivity Status */}
                <span
                  className="hidden items-center gap-1.5 rounded-[8px] border border-[var(--border-subtle)] px-2.5 py-1 text-[11px] font-medium md:inline-flex"
                  style={{ backgroundColor: realtimeBadge.bg, color: realtimeBadge.color }}
                  title="Backend event stream connectivity"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: realtimeBadge.color }}
                  />
                  {realtimeBadge.label}
                </span>

                {/* Notifications Popover */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setNotifOpen((v) => !v)}
                    aria-label="Notifications"
                    aria-expanded={notifOpen}
                    className="relative inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                  >
                    <Bell className="h-4 w-4" />
                    {realtime.events.length > 0 ? (
                      <span
                        className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: "var(--accent-primary)" }}
                      />
                    ) : null}
                  </button>
                  {notifOpen ? (
                    <div className="glass-floating absolute right-0 mt-2 w-80 max-w-[90vw] rounded-[14px] p-3 text-xs">
                      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                        <span className="font-semibold text-[var(--text-primary)]">
                          Realtime Activity
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {realtimeBadge.label}
                        </span>
                      </div>
                      {realtime.events.length ? (
                        <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto">
                          {realtime.events.slice(0, 6).map((evt) => (
                            <li
                              key={evt.event_id}
                              className="rounded-[8px] bg-[var(--bg-subtle)] px-2.5 py-1.5"
                            >
                              <p className="font-medium text-[var(--text-primary)]">
                                {evt.event_type}
                              </p>
                              <p className="text-[11px] text-[var(--text-muted)]">
                                {formatDateTime(evt.occurred_at)}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="py-4 text-center text-[var(--text-muted)]">
                          No realtime events pushed in this session.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Theme Switch */}
                <ThemeToggle />

                {/* Profile Badge */}
                {loading ? (
                  <span className="hidden text-xs text-[var(--text-muted)] sm:inline">Loading…</span>
                ) : session ? (
                  <div className="hidden items-center gap-2 border-l border-[var(--border-subtle)] pl-3 xl:flex">
                    <div className="text-right">
                      <p className="text-xs font-medium leading-tight text-[var(--text-primary)]">
                        {session.user.full_name}
                      </p>
                      <p className="text-[11px] capitalize leading-tight text-[var(--text-muted)]">
                        {session.user.role.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          {/* Main Workspace Canvas */}
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-3 py-5 sm:px-5">
            <div className="mb-5">
              <DemoBanner tone={tone} />
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
