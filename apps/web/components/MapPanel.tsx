"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  Crosshair,
  Layers,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import type { MapPoint, TileProviderChoice } from "@/components/MapInner";
import { Card, CardHeader, LoadingRows, StatusBadge, type Tone } from "@/components/ui";
import { formatCoordinates, formatDateTime, humanise } from "@/lib/format";

const MapInner = dynamic(() => import("@/components/MapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-xs text-[var(--text-muted)]">
      Initializing map canvas…
    </div>
  ),
});

const LEGEND: Array<{ key: string; label: string; color: string }> = [
  { key: "pending_candidate", label: "Pending AI candidate", color: "var(--status-warn)" },
  { key: "confirmed_observation", label: "Human-confirmed", color: "var(--status-success)" },
  { key: "historical_accident", label: "Historical accident", color: "var(--status-danger)" },
  { key: "camera", label: "Registered camera", color: "var(--status-info)" },
  { key: "hotspot", label: "Hotspot cluster", color: "var(--status-hotspot)" },
];

type DateRangeOption = "all" | "24h" | "7d" | "30d";

export function MapPanel({
  tone,
  points,
  title = "City Safety & Incident Map",
  description = "Coordinates come strictly from registered records. Unlocated events remain in the list view.",
  cityLabel,
  height = 480,
  loading = false,
  showFilters = true,
}: {
  tone?: Tone;
  points: MapPoint[];
  title?: string;
  description?: string;
  cityLabel?: string | null;
  height?: number;
  loading?: boolean;
  showFilters?: boolean;
}) {
  const [layerFilter, setLayerFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRangeOption>("all");
  const [clustering, setClustering] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [providerChoice, setProviderChoice] = useState<TileProviderChoice>("auto");
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [zoomCommand, setZoomCommand] = useState({ seq: 0, delta: 0 });
  const [resetTick, setResetTick] = useState(0);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [tileStatus, setTileStatus] = useState({
    loading: false,
    errorCount: 0,
    provider: "CARTO",
  });

  const handleTileStatusChange = useCallback(
    (status: { loading: boolean; errorCount: number; provider: string }) => {
      setTileStatus(status);
    },
    [],
  );

  const availableLayers = useMemo(() => {
    const set = new Set(points.map((p) => p.layer));
    return Array.from(set);
  }, [points]);

  const filteredPoints = useMemo(() => {
    const now = Date.now();
    const cutoffMs =
      dateRange === "24h"
        ? now - 24 * 3600000
        : dateRange === "7d"
          ? now - 7 * 86400000
          : dateRange === "30d"
            ? now - 30 * 86400000
            : null;

    return points.filter((p) => {
      if (layerFilter !== "all" && p.layer !== layerFilter) return false;
      if (cutoffMs !== null && p.timestamp) {
        const ts = new Date(p.timestamp).getTime();
        if (!Number.isNaN(ts) && ts < cutoffMs) return false;
      }
      return true;
    });
  }, [points, layerFilter, dateRange]);

  const mapHeight = fullscreen ? "calc(100vh - 200px)" : `${height}px`;

  return (
    <Card
      tone={tone}
      className={fullscreen ? "fixed inset-4 z-50 flex flex-col overflow-hidden shadow-2xl" : "overflow-hidden"}
    >
      <CardHeader
        title={title}
        description={cityLabel ? `${cityLabel} · ${description}` : description}
        tone={tone}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {showFilters ? (
              <>
                <select
                  aria-label="Filter map by date range"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as DateRangeOption)}
                  className="rounded-[9px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs text-[var(--text-primary)]"
                >
                  <option value="all">All dates</option>
                  <option value="24h">Last 24h</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
                <button
                  type="button"
                  onClick={() => setClustering((c) => !c)}
                  aria-pressed={clustering}
                  className={`inline-flex items-center gap-1 rounded-[9px] border px-2.5 py-1 text-xs font-medium transition ${
                    clustering
                      ? "border-[var(--accent-primary)] bg-[var(--accent-soft)] text-[var(--accent-primary)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                  Cluster
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => setFullscreen((f) => !f)}
              aria-label={fullscreen ? "Exit fullscreen map" : "Expand map to fullscreen"}
              className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        }
      />

      {/* Category Filter Strip */}
      {showFilters && availableLayers.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-2">
          <button
            type="button"
            onClick={() => setLayerFilter("all")}
            className={`rounded-[8px] px-2.5 py-1 text-[11px] font-medium transition ${
              layerFilter === "all"
                ? "bg-[var(--accent-primary)] text-[var(--accent-contrast)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            }`}
          >
            All ({points.length})
          </button>
          {availableLayers.map((layer) => {
            const count = points.filter((p) => p.layer === layer).length;
            const active = layerFilter === layer;
            return (
              <button
                key={layer}
                type="button"
                onClick={() => setLayerFilter(active ? "all" : layer)}
                className={`rounded-[8px] px-2.5 py-1 text-[11px] font-medium transition ${
                  active
                    ? "bg-[var(--accent-primary)] text-[var(--accent-contrast)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                }`}
              >
                {humanise(layer)} ({count})
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Map Viewport Container */}
      <div style={{ height: mapHeight }} className="relative w-full overflow-hidden bg-[var(--map-bg)]">
        {loading ? (
          <LoadingRows tone={tone} label="Loading geospatial coordinates…" />
        ) : filteredPoints.length ? (
          <>
            <MapInner
              points={filteredPoints}
              selectedPointId={selectedPoint?.id ?? null}
              onSelectPoint={setSelectedPoint}
              clustering={clustering}
              providerChoice={providerChoice}
              zoomCommand={zoomCommand}
              resetTick={resetTick}
              reloadNonce={reloadNonce}
              onTileStatusChange={handleTileStatusChange}
            />

            {/* Floating Map Zoom & Provider Controls */}
            <div className="absolute top-3 right-3 z-[400] flex flex-col gap-1.5">
              <div className="glass-floating flex flex-col overflow-hidden rounded-[10px]">
                <button
                  type="button"
                  onClick={() => setZoomCommand((z) => ({ seq: z.seq + 1, delta: 1 }))}
                  aria-label="Zoom in"
                  className="flex h-8 w-8 items-center justify-center border-b border-[var(--border-subtle)] text-[var(--text-primary)] transition hover:bg-[var(--bg-hover)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomCommand((z) => ({ seq: z.seq + 1, delta: -1 }))}
                  aria-label="Zoom out"
                  className="flex h-8 w-8 items-center justify-center border-b border-[var(--border-subtle)] text-[var(--text-primary)] transition hover:bg-[var(--bg-hover)]"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setResetTick((t) => t + 1)}
                  aria-label="Fit all markers"
                  title="Fit all markers"
                  className="flex h-8 w-8 items-center justify-center text-[var(--text-primary)] transition hover:bg-[var(--bg-hover)]"
                >
                  <Crosshair className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Tile Loading Indicator */}
            {tileStatus.loading ? (
              <div className="glass-floating pointer-events-none absolute top-3 left-3 z-[400] inline-flex items-center gap-2 rounded-[10px] px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent-primary)]" />
                Loading {tileStatus.provider} tiles…
              </div>
            ) : null}

            {/* Graceful Tile Error Fallback Banner */}
            {tileStatus.errorCount > 2 ? (
              <div className="glass-floating absolute top-3 left-3 z-[410] flex max-w-sm items-start gap-2.5 rounded-[12px] p-3 text-xs">
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: "var(--status-warn)" }}
                />
                <div className="space-y-1.5">
                  <p className="font-medium text-[var(--text-primary)]">
                    Map tiles unavailable ({tileStatus.provider})
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Markers remain plotted accurately. Retry or switch tile source.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setReloadNonce((n) => n + 1)}
                      className="inline-flex items-center gap-1 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1 text-[11px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Retry
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setProviderChoice((c) => (c === "osm" ? "carto" : "osm"))
                      }
                      className="rounded-[8px] bg-[var(--accent-primary)] px-2 py-1 text-[11px] font-medium text-[var(--accent-contrast)]"
                    >
                      Switch to {providerChoice === "osm" ? "CARTO" : "OpenStreetMap"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Selected Marker Floating Glass Detail Card */}
            {selectedPoint ? (
              <div className="glass-floating absolute bottom-3 left-3 z-[400] w-80 max-w-[calc(100%-24px)] rounded-[14px] p-3.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge
                        status={selectedPoint.status ?? selectedPoint.layer}
                        label={humanise(selectedPoint.status ?? selectedPoint.layer)}
                      />
                      {selectedPoint.severity ? (
                        <StatusBadge status={selectedPoint.severity} />
                      ) : null}
                    </div>
                    <h3 className="mt-1.5 text-sm font-semibold text-[var(--text-primary)]">
                      {selectedPoint.label}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPoint(null)}
                    aria-label="Close detail card"
                    className="rounded-[6px] p-1 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {selectedPoint.detail ? (
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                    {selectedPoint.detail}
                  </p>
                ) : null}
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-2 text-[11px] text-[var(--text-muted)]">
                  <span className="font-mono">
                    {formatCoordinates(selectedPoint.latitude, selectedPoint.longitude)}
                  </span>
                  {selectedPoint.timestamp ? (
                    <span>{formatDateTime(selectedPoint.timestamp)}</span>
                  ) : null}
                </div>
                {selectedPoint.href ? (
                  <Link
                    href={selectedPoint.href}
                    className="mt-2.5 inline-flex w-full items-center justify-center rounded-[9px] bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-medium text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)]"
                  >
                    Open full record →
                  </Link>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              No located records match the current filter
            </p>
            <p className="max-w-sm text-xs text-[var(--text-muted)]">
              Records without surveyed or derived coordinates remain accessible in the list view.
            </p>
          </div>
        )}
      </div>

      {/* Legend + Methodology Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {LEGEND.map((item) => (
            <span key={item.key} className="inline-flex items-center gap-1.5 text-[var(--text-secondary)]">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-white/50"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
          <span>Tiles: {tileStatus.provider}</span>
          <Link className="font-medium text-[var(--accent-primary)] hover:underline" href="/command/hotspots">
            Hotspot methodology →
          </Link>
        </div>
      </div>
    </Card>
  );
}
