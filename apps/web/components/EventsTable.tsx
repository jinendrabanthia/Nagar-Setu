"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  Card,
  CardHeader,
  DataTable,
  ErrorState,
  LoadingRows,
  Row,
  StatusBadge,
} from "@/components/ui";
import { formatDateTime, humanise } from "@/lib/format";
import type { Incident } from "@/lib/types";

type SortKey = "event_time" | "model_score" | "severity";

const SEVERITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const PAGE_SIZE = 10;

export function EventsTable({
  incidents,
  loading,
  error,
  onRetry,
  pendingCount,
  showViewAll = true,
}: {
  incidents: Incident[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  pendingCount?: number;
  showViewAll?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("event_time");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);

  const categories = useMemo(
    () => Array.from(new Set(incidents.map((i) => i.incident_type))),
    [incidents],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = incidents.filter((item) => {
      if (categoryFilter !== "all" && item.incident_type !== categoryFilter) return false;
      if (severityFilter !== "all" && (item.severity ?? "unset") !== severityFilter) return false;
      if (statusFilter !== "all" && item.review_status !== statusFilter) return false;
      if (q) {
        const haystack = [
          item.incident_type,
          item.description,
          item.camera_code ?? "",
          item.review_status,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "event_time") {
        cmp = new Date(a.event_time).getTime() - new Date(b.event_time).getTime();
      } else if (sortKey === "model_score") {
        cmp = (a.model_score ?? -1) - (b.model_score ?? -1);
      } else if (sortKey === "severity") {
        cmp =
          (SEVERITY_ORDER[a.severity ?? ""] ?? 0) -
          (SEVERITY_ORDER[b.severity ?? ""] ?? 0);
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [incidents, search, categoryFilter, severityFilter, statusFilter, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Latest events"
        description={`${pendingCount ?? incidents.filter((i) => i.review_status === "pending").length} candidate observation(s) awaiting human review`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => toggleSort("event_time")}
              className="inline-flex items-center gap-1 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <ArrowUpDown className="h-3 w-3" />
              Time
            </button>
            <button
              type="button"
              onClick={() => toggleSort("model_score")}
              className="inline-flex items-center gap-1 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <ArrowUpDown className="h-3 w-3" />
              Confidence
            </button>
            {showViewAll ? (
              <Link
                href="/command/incidents"
                className="ml-1 text-xs font-medium text-[var(--accent-primary)] hover:underline"
              >
                Full review queue →
              </Link>
            ) : null}
          </div>
        }
      />

      {/* Search & Filter Toolbar */}
      <div className="grid gap-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search events, cameras…"
            aria-label="Search events"
            className="themed-input pl-8 text-xs"
          />
        </div>
        <select
          aria-label="Filter by event category"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="themed-input text-xs"
        >
          <option value="all">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {humanise(cat)}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by severity"
          value={severityFilter}
          onChange={(e) => {
            setSeverityFilter(e.target.value);
            setPage(1);
          }}
          className="themed-input text-xs"
        >
          <option value="all">All severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          aria-label="Filter by review status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="themed-input text-xs"
        >
          <option value="all">All review statuses</option>
          <option value="pending">Pending review</option>
          <option value="confirmed">Confirmed</option>
          <option value="rejected_false_positive">Rejected false positive</option>
          <option value="needs_more_information">Needs more information</option>
        </select>
      </div>

      {loading ? (
        <LoadingRows />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : (
        <>
          <DataTable
            head={["Event", "Severity", "Review Status", "Confidence", "Camera", "Date / Time", "Action"]}
            empty="No events match these filters."
          >
            {paged.map((incident) => (
              <Row key={incident.id}>
                <td className="px-4 py-3">
                  <span className="block font-medium text-[var(--text-primary)]">
                    {humanise(incident.incident_type)}
                  </span>
                  <span className="mt-0.5 inline-block rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    {incident.source_kind === "ai_detected" ? "AI candidate" : "Manual report"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {incident.severity ? (
                    <StatusBadge status={incident.severity} />
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">Unset</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={incident.review_status} />
                </td>
                <td className="px-4 py-3 font-mono text-xs tabular-nums text-[var(--text-secondary)]">
                  {incident.model_score !== null ? incident.model_score.toFixed(2) : "—"}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">
                  {incident.camera_code ?? "—"}
                </td>
                <td className="px-4 py-3 text-xs whitespace-nowrap text-[var(--text-secondary)]">
                  {formatDateTime(incident.event_time)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/command/incidents/${incident.id}`}
                    className="inline-flex items-center rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--accent-primary)] transition hover:border-[var(--accent-primary)]/40 hover:bg-[var(--accent-soft)]"
                  >
                    View details
                  </Link>
                </td>
              </Row>
            ))}
          </DataTable>

          {/* Pagination */}
          {filtered.length > PAGE_SIZE ? (
            <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-4 py-2.5 text-xs text-[var(--text-secondary)]">
              <span>
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] border border-[var(--border-subtle)] disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="px-2 font-mono">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] border border-[var(--border-subtle)] disabled:opacity-40"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </Card>
  );
}
