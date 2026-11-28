"use client";

import Link from "next/link";
import { ArrowRight, Clock, Cpu, Radio } from "lucide-react";
import {
  Card,
  CardHeader,
  ErrorState,
  LoadingRows,
  StatusBadge,
} from "@/components/ui";
import { formatDateTime, humanise } from "@/lib/format";
import type { Incident, Job } from "@/lib/types";
import type { RealtimeEvent } from "@/lib/realtime";

export function PriorityReviewQueue({
  incidents,
  loading,
  error,
  onRetry,
}: {
  incidents: Incident[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const ordered = [...incidents].sort((a, b) => {
    if (a.review_status === "pending" && b.review_status !== "pending") return -1;
    if (a.review_status !== "pending" && b.review_status === "pending") return 1;
    return new Date(b.event_time).getTime() - new Date(a.event_time).getTime();
  });

  return (
    <Card>
      <CardHeader
        title="Priority review queue"
        description="Pending AI candidates require human review."
        actions={
          <Link
            href="/command/incidents"
            className="text-xs font-medium text-[var(--accent-primary)] hover:underline"
          >
            All →
          </Link>
        }
      />
      {loading ? (
        <LoadingRows />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : ordered.length ? (
        <ul className="divide-y divide-[var(--border-subtle)]">
          {ordered.slice(0, 4).map((item) => {
            const isPending = item.review_status === "pending";
            return (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 px-4 py-3 transition hover:bg-[var(--bg-hover)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {isPending ? (
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: "var(--status-warn)" }}
                        title="Pending human review"
                      />
                    ) : null}
                    <p className="truncate text-[13px] font-medium text-[var(--text-primary)]">
                      {humanise(item.incident_type)}
                    </p>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
                    <span className="font-mono">{item.camera_code ?? "No camera"}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {formatDateTime(item.event_time)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={item.review_status} />
                    {item.severity ? <StatusBadge status={item.severity} /> : null}
                  </div>
                </div>
                <Link
                  href={`/command/incidents/${item.id}`}
                  className="inline-flex shrink-0 items-center gap-1 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--accent-primary)] transition hover:border-[var(--accent-primary)]/40"
                >
                  {isPending ? "Review" : "Open"}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">
          No candidate events in the queue.
        </p>
      )}
    </Card>
  );
}

export function RealtimePanel({
  status,
  events,
  lastRefreshed,
}: {
  status: string;
  events: RealtimeEvent[];
  lastRefreshed?: string | null;
}) {
  const statusMeta =
    status === "live"
      ? {
          label: "Connected (ticket-authenticated)",
          color: "var(--status-success)",
        }
      : status === "blocked"
        ? {
            label: "Realtime unavailable — refreshes on navigation",
            color: "var(--status-danger)",
          }
        : {
            label: "Connecting to event stream…",
            color: "var(--status-warn)",
          };

  return (
    <Card variant="secondary">
      <CardHeader
        title="Realtime feed"
        description="Server-pushed hints; REST remains authoritative."
        actions={
          <Radio className="h-4 w-4 text-[var(--text-muted)]" aria-hidden="true" />
        }
      />
      <div className="px-4 py-3 text-xs">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[var(--text-secondary)]">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: statusMeta.color }}
            />
            {statusMeta.label}
          </p>
        </div>
        {lastRefreshed ? (
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Last sync: {lastRefreshed}
          </p>
        ) : null}
        {events.length ? (
          <ul className="mt-2.5 space-y-1.5 border-t border-[var(--border-subtle)] pt-2">
            {events.slice(0, 4).map((event) => (
              <li
                key={event.event_id}
                className="flex items-center justify-between gap-2 text-[11px]"
              >
                <span className="truncate font-medium text-[var(--text-primary)]">
                  {event.event_type}
                </span>
                <span className="shrink-0 text-[var(--text-muted)]">
                  {formatDateTime(event.occurred_at)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2.5 text-[11px] leading-relaxed text-[var(--text-muted)]">
            No live events received yet. Footage processing and review actions appear here when pushed.
          </p>
        )}
      </div>
    </Card>
  );
}

export function ProcessingJobs({
  jobs,
  loading,
  error,
  onRetry,
}: {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <Card>
      <CardHeader
        title="Recent processing jobs"
        actions={
          <Link
            href="/command/videos"
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)] hover:underline"
          >
            <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
            Queue
          </Link>
        }
      />
      {loading ? (
        <LoadingRows />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : jobs.length ? (
        <ul className="divide-y divide-[var(--border-subtle)]">
          {jobs.slice(0, 4).map((job) => (
            <li key={job.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-medium text-[var(--text-primary)]">
                  {job.id.slice(0, 8)}
                </span>
                <StatusBadge status={job.status} />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                <span className="capitalize">{job.stage.replace(/_/g, " ")}</span>
                <span className="font-mono tabular-nums">{job.progress}%</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(0, Math.min(100, job.progress))}%`,
                    backgroundColor:
                      job.status === "succeeded"
                        ? "var(--status-success)"
                        : job.status === "failed"
                          ? "var(--status-danger)"
                          : "var(--accent-primary)",
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">
          No recent processing jobs.
        </p>
      )}
    </Card>
  );
}
