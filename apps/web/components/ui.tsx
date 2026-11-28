"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { humanise, statusSemanticStyle } from "@/lib/format";

export type Tone = "command" | "admin";

export function GlassCard({
  children,
  className = "",
  variant = "primary",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "floating" | "flat";
}) {
  const variantClass =
    variant === "floating"
      ? "glass-floating rounded-[18px]"
      : variant === "secondary"
        ? "glass-secondary rounded-[14px]"
        : variant === "flat"
          ? "surface-data rounded-[14px]"
          : "glass-panel rounded-[14px]";

  return <section className={`${variantClass} text-[var(--text-primary)] ${className}`}>{children}</section>;
}

export function Card({
  tone: _tone,
  children,
  className = "",
  variant = "primary",
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "floating" | "flat";
}) {
  return (
    <GlassCard variant={variant} className={className}>
      {children}
    </GlassCard>
  );
}

export function CardHeader({
  title,
  description,
  actions,
  tone: _tone,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-3.5">
      <div>
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-secondary)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  tone: _tone,
  actions,
  breadcrumb,
}: {
  title: string;
  description?: string;
  tone?: Tone;
  actions?: React.ReactNode;
  breadcrumb?: { label: string; href: string };
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {breadcrumb ? (
          <Link
            className="mb-1.5 inline-flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] transition hover:text-[var(--accent-primary)]"
            href={breadcrumb.href}
          >
            ← {breadcrumb.label}
          </Link>
        ) : null}
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)] sm:text-[30px] leading-tight">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </header>
  );
}

export function StatusBadge({ status, label }: { status: string | null | undefined; label?: string }) {
  const semantic = statusSemanticStyle(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[8px] border px-2 py-0.5 text-[11px] font-medium tracking-[0.01em] whitespace-nowrap"
      style={{
        color: semantic.text,
        backgroundColor: semantic.bg,
        borderColor: semantic.border,
      }}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: semantic.dot }}
      />
      {label ?? humanise(status)}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  tone: _tone,
  emphasis = "default",
  accentColor,
  icon,
  trend,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: Tone;
  emphasis?: "default" | "warn" | "danger" | "success" | "hotspot" | "info";
  accentColor?: string;
  icon?: React.ReactNode;
  trend?: string;
}) {
  const barColor =
    accentColor ??
    (emphasis === "danger"
      ? "var(--status-danger)"
      : emphasis === "warn"
        ? "var(--status-warn)"
        : emphasis === "success"
          ? "var(--status-success)"
          : emphasis === "hotspot"
            ? "var(--status-hotspot)"
            : emphasis === "info"
              ? "var(--status-info)"
              : "var(--accent-primary)");

  return (
    <div className="glass-panel relative flex h-full flex-col justify-between overflow-hidden rounded-[14px] px-5 py-4 transition-transform duration-200 hover:-translate-y-0.5">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[2px] opacity-80"
        style={{ backgroundColor: barColor }}
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-secondary)]">
          {label}
        </p>
        {icon ? (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
            style={{ color: barColor }}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-2.5 flex items-baseline gap-2.5">
        <p className="text-[28px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-[var(--text-primary)] sm:text-[32px]">
          {value}
        </p>
        {trend ? (
          <span className="text-xs font-medium text-[var(--text-secondary)]">{trend}</span>
        ) : null}
      </div>
      {hint ? <p className="mt-2.5 text-xs text-[var(--text-muted)]">{hint}</p> : null}
    </div>
  );
}

export function DataTable({
  tone: _tone,
  head,
  children,
  empty,
  caption,
}: {
  tone?: Tone;
  head: string[];
  children: React.ReactNode;
  empty?: string;
  caption?: string;
}) {
  const hasRows = Array.isArray(children)
    ? children.flat().filter(Boolean).length > 0
    : Boolean(children);

  return (
    <div className="surface-data overflow-x-auto rounded-b-[14px] border-x-0 border-b-0">
      <table className="w-full min-w-full text-sm">
        {caption ? (
          <caption className="px-5 py-2 text-left text-xs text-[var(--text-muted)]">{caption}</caption>
        ) : null}
        <thead>
          <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-left text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)]">
            {head.map((label, idx) => (
              <th key={`${label}-${idx}`} className="whitespace-nowrap px-4 py-2.5 font-semibold">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {hasRows ? (
            children
          ) : (
            <tr>
              <td colSpan={head.length} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                {empty ?? "No records yet."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Row({
  tone: _tone,
  children,
  className = "",
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr className={`transition-colors duration-150 hover:bg-[var(--bg-hover)] ${className}`}>
      {children}
    </tr>
  );
}

export function EmptyState({
  tone: _tone,
  title,
  description,
  action,
}: {
  tone?: Tone;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 px-6 py-12 text-center">
      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="max-w-md text-xs leading-relaxed text-[var(--text-secondary)]">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  tone,
  message,
  onRetry,
}: {
  tone?: Tone;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-3 px-5 py-6 text-sm">
      <p className="flex items-center gap-2 font-medium" style={{ color: "var(--status-danger)" }}>
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
        Unable to load data
      </p>
      <p className="text-xs text-[var(--text-secondary)]">{message}</p>
      {onRetry ? (
        <Button tone={tone} variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function LoadingRows({ tone: _tone, label = "Loading…" }: { tone?: Tone; label?: string }) {
  return (
    <div
      className="space-y-3 px-5 py-6"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <span
          className="inline-block h-2 w-2 animate-pulse rounded-full"
          style={{ backgroundColor: "var(--accent-primary)" }}
        />
        {label}
      </div>
      <div className="space-y-2">
        <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--bg-subtle)]" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--bg-subtle)]" />
      </div>
    </div>
  );
}

export function PermissionNotice({ tone, permission }: { tone?: Tone; permission: string }) {
  return (
    <Card tone={tone}>
      <EmptyState
        tone={tone}
        title="You do not have access to this view"
        description={`Your role does not include the ${permission} permission. Ask an administrator if you need access.`}
      />
    </Card>
  );
}

export function DemoBanner({ tone: _tone }: { tone?: Tone }) {
  return (
    <div
      role="note"
      className="flex items-center gap-2.5 rounded-[12px] border px-3.5 py-2 text-xs leading-snug backdrop-blur-md"
      style={{
        backgroundColor: "var(--demo-bg)",
        borderColor: "var(--demo-border)",
        color: "var(--demo-text)",
      }}
    >
      <AlertTriangle
        className="h-4 w-4 shrink-0"
        style={{ color: "var(--demo-icon)" }}
        aria-hidden="true"
      />
      <p>
        <strong className="font-semibold tracking-wide">DEMO ENVIRONMENT</strong> — synthetic records
        and generated sample footage. Not real city statistics. AI output is a candidate observation
        until a human reviews it.
      </p>
    </div>
  );
}

export function AlertBanner({
  kind = "info",
  children,
}: {
  kind?: "success" | "danger" | "info" | "warn";
  children: React.ReactNode;
}) {
  const styles = {
    success: {
      bg: "var(--status-success-bg)",
      border: "var(--status-success-border)",
      text: "var(--status-success)",
      Icon: CheckCircle2,
    },
    danger: {
      bg: "var(--status-danger-bg)",
      border: "var(--status-danger-border)",
      text: "var(--status-danger)",
      Icon: AlertTriangle,
    },
    warn: {
      bg: "var(--status-warn-bg)",
      border: "var(--status-warn-border)",
      text: "var(--status-warn)",
      Icon: AlertTriangle,
    },
    info: {
      bg: "var(--status-info-bg)",
      border: "var(--status-info-border)",
      text: "var(--status-info)",
      Icon: Info,
    },
  }[kind];

  const IconComponent = styles.Icon;
  return (
    <div
      role={kind === "danger" ? "alert" : "status"}
      className="mb-4 flex items-start gap-2.5 rounded-[12px] border px-3.5 py-2.5 text-sm"
      style={{
        backgroundColor: styles.bg,
        borderColor: styles.border,
        color: styles.text,
      }}
    >
      <IconComponent className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-[var(--text-primary)]">{children}</div>
    </div>
  );
}

export function Button({
  tone: _tone,
  variant = "primary",
  children,
  onClick,
  type = "button",
  disabled,
  className = "",
}: {
  tone?: Tone;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const variants: Record<string, string> = {
    primary:
      "bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] shadow-xs",
    secondary:
      "border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-secondary)]",
    danger:
      "border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--status-danger)] hover:opacity-90",
    ghost: "text-[var(--accent-primary)] hover:bg-[var(--accent-soft)]",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-[10px] px-3.5 py-2 text-xs sm:text-sm font-medium transition-all duration-150 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  tone: _tone,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  tone?: Tone;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label className="block text-sm" htmlFor={htmlFor}>
      <span className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]">{label}</span>
      {children}
      {hint && !error ? (
        <span className="mt-1 block text-xs text-[var(--text-muted)]">{hint}</span>
      ) : null}
      {error ? (
        <span className="mt-1 block text-xs" style={{ color: "var(--status-danger)" }}>
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function Input({
  tone: _tone,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { tone?: Tone }) {
  return <input {...props} className={`themed-input ${props.className ?? ""}`} />;
}

export function Textarea({
  tone: _tone,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { tone?: Tone }) {
  return <textarea {...props} className={`themed-input ${props.className ?? ""}`} />;
}

export function Select({
  tone: _tone,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { tone?: Tone }) {
  return (
    <select {...props} className={`themed-input ${props.className ?? ""}`}>
      {children}
    </select>
  );
}

export function KeyValue({
  tone: _tone,
  items,
}: {
  tone?: Tone;
  items: Array<[string, React.ReactNode]>;
}) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="border-b border-[var(--border-subtle)]/60 pb-2">
          <dt className="text-[11px] font-medium uppercase tracking-[0.05em] text-[var(--text-muted)]">
            {label}
          </dt>
          <dd className="mt-0.5 text-[var(--text-primary)]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TagList({
  tone: _tone,
  items,
  emptyLabel = "None recorded",
}: {
  tone?: Tone;
  items: string[];
  emptyLabel?: string;
}) {
  if (!items.length) return <p className="text-xs text-[var(--text-muted)]">{emptyLabel}</p>;
  return (
    <ul className="flex flex-wrap gap-1.5 text-xs">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-0.5 font-mono text-[11px] text-[var(--text-secondary)]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
