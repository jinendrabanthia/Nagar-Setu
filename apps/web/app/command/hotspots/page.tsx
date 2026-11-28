"use client";

import { useState } from "react";
import { useSession } from "@/lib/session";
import { useApi } from "@/lib/useApi";
import { api, ApiError } from "@/lib/api";
import { MapPanel } from "@/components/MapPanel";
import {
  AlertBanner,
  Button,
  Card,
  CardHeader,
  DataTable,
  ErrorState,
  Field,
  Input,
  LoadingRows,
  MetricCard,
  PageHeader,
  PermissionNotice,
  Row,
} from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/format";
import type { HotspotAnalysis } from "@/lib/types";

export default function HotspotsPage() {
  const { has } = useSession();
  const analyses = useApi<HotspotAnalysis[]>("/api/v1/hotspots?limit=10");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const rawData = analyses.data;
  const latest = Array.isArray(rawData) ? (rawData[0] ?? null) : (rawData ?? null);

  if (!has("analytics:read")) return <PermissionNotice tone="command" permission="analytics:read" />;

  async function analyse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await api.post<HotspotAnalysis>("/api/v1/hotspots/analyze", {
        radius_meters: Number(form.get("radius_meters")),
        min_size: Number(form.get("min_size")),
        window_from: null,
        window_to: null,
      });
      analyses.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The hotspot analysis failed.");
    } finally {
      setBusy(false);
    }
  }

  const clusters = latest?.clusters ?? [];
  const points = clusters.map((cluster) => ({
    id: cluster.cluster_key,
    latitude: cluster.latitude,
    longitude: cluster.longitude,
    label: cluster.label,
    detail: `${cluster.total_records} record(s) · ${Object.entries(cluster.counts)
      .map(([key, value]) => `${key.replace(/_/g, " ")}: ${value}`)
      .join(", ")}`,
    layer: "hotspot",
    timestamp: cluster.last_seen,
  }));

  const totalRecords = clusters.reduce((sum, cluster) => sum + cluster.total_records, 0);
  const historical = clusters.reduce(
    (sum, cluster) => sum + (cluster.counts.historical_accident ?? 0),
    0,
  );
  const confirmed = clusters.reduce(
    (sum, cluster) => sum + (cluster.counts.confirmed_observation ?? 0),
    0,
  );

  return (
    <>
      <PageHeader
        title="Accident and event hotspots"
        description="Clusters of located records. A cluster means records are close together; it is not an exposure-normalised risk rate and does not establish causation."
        tone="command"
      />

      {error ? <AlertBanner kind="danger">{error}</AlertBanner> : null}

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard tone="command" label="Clusters" value={clusters.length} hint={latest ? `${latest.method} · ${latest.radius_meters}m` : "No analysis yet"} emphasis="hotspot" />
        <MetricCard tone="command" label="Records in clusters" value={totalRecords} hint="All sources combined" />
        <MetricCard tone="command" label="Historical accidents" value={historical} hint="Imported CSV records" emphasis="danger" />
        <MetricCard tone="command" label="Confirmed observations" value={confirmed} hint="Human-reviewed AI events" emphasis="success" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MapPanel
            tone="command"
            points={points}
            title="Cluster centroids"
            description={latest ? `Window: ${formatDate(latest.window_from)} → ${formatDate(latest.window_to)}` : "Run an analysis to populate this map."}
            loading={analyses.loading}
            height={380}
          />
        </div>
        <Card tone="command">
          <CardHeader title="Run analysis" description="DBSCAN over geodesic distance on located records." tone="command" />
          {has("hotspot:analyze") ? (
            <form onSubmit={analyse} className="space-y-4 px-5 py-4">
              <Field label="Cluster radius (m)" tone="command" htmlFor="radius_meters">
                <Input tone="command" id="radius_meters" name="radius_meters" type="number" min={25} max={5000} defaultValue={250} />
              </Field>
              <Field label="Minimum records per cluster" tone="command" htmlFor="min_size">
                <Input tone="command" id="min_size" name="min_size" type="number" min={2} max={50} defaultValue={2} />
              </Field>
              <Button tone="command" type="submit" disabled={busy}>
                {busy ? "Analysing…" : "Run hotspot analysis"}
              </Button>
              <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                Analysis is calculated from records with coordinates only; unlocated records are
                reported separately and never guessed.
              </p>
            </form>
          ) : (
            <p className="px-5 py-4 text-sm text-[var(--text-muted)]">
              Your role can read analyses but not run them.
            </p>
          )}
        </Card>
      </div>

      <div className="mt-5">
        <Card tone="command">
          <CardHeader
            title="Latest analysis clusters"
            description={latest?.methodology_note}
            tone="command"
          />
          {analyses.loading ? (
            <LoadingRows tone="command" />
          ) : analyses.error ? (
            <ErrorState tone="command" message={analyses.error} onRetry={analyses.reload} />
          ) : (
            <DataTable
              tone="command"
              head={["Cluster", "Records", "Sources", "Categories", "First seen", "Last seen"]}
              empty="No hotspot analysis has been run for this organization yet."
            >
              {clusters.map((cluster) => (
                <Row key={cluster.cluster_key} tone="command">
                  <td className="px-4 py-3">
                    <span className="block font-medium text-[var(--text-primary)]">{cluster.label}</span>
                    <span className="font-mono text-[11px] text-[var(--text-muted)]">
                      {cluster.latitude.toFixed(5)}, {cluster.longitude.toFixed(5)}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums font-medium text-[var(--text-primary)]">{cluster.total_records}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{cluster.source_mix?.join(", ") ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                    {Object.entries(cluster.categories)
                      .map(([key, value]) => `${key.replace(/_/g, " ")}: ${value}`)
                      .join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{formatDateTime(cluster.first_seen)}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{formatDateTime(cluster.last_seen)}</td>
                </Row>
              ))}
            </DataTable>
          )}
          {latest ? (
            <div className="border-t border-[var(--border-subtle)] px-5 py-3 text-xs text-[var(--text-muted)]">
              <p>Data sources: {latest.data_sources?.join(", ") ?? "—"}.</p>
              <p className="mt-1">
                Unlocated records excluded from clustering: {latest.unlocated_count}. Generated{" "}
                {formatDateTime(latest.generated_at)}.
              </p>
            </div>
          ) : null}
        </Card>
      </div>
    </>
  );
}
