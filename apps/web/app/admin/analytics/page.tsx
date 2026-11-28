"use client";

import { useSession } from "@/lib/session";
import { useApi } from "@/lib/useApi";
import { MapPanel } from "@/components/MapPanel";
import {
  Card,
  CardHeader,
  DataTable,
  ErrorState,
  LoadingRows,
  MetricCard,
  PageHeader,
  PermissionNotice,
  Row,
  StatusBadge,
} from "@/components/ui";
import { formatDateTime, humanise } from "@/lib/format";
import type { AccidentRecord, HotspotAnalysis, IncidentAnalytics } from "@/lib/types";

export default function AdminAnalyticsPage() {
  const { has } = useSession();
  const analytics = useApi<IncidentAnalytics>("/api/v1/incidents/analytics");
  const hotspots = useApi<HotspotAnalysis[]>("/api/v1/hotspots?limit=1");
  const accidents = useApi<AccidentRecord[]>("/api/v1/accident-records?limit=100");

  if (!has("analytics:read")) return <PermissionNotice tone="admin" permission="analytics:read" />;

  const rawHotspots = hotspots.data;
  const latest = Array.isArray(rawHotspots) ? (rawHotspots[0] ?? null) : (rawHotspots ?? null);
  const clusters = latest?.clusters ?? [];
  const points = clusters.map((cluster) => ({
    id: cluster.cluster_key,
    latitude: cluster.latitude,
    longitude: cluster.longitude,
    label: cluster.label,
    detail: `${cluster.total_records} record(s)`,
    layer: "hotspot",
    timestamp: cluster.last_seen,
  }));

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Counts are reported with their source. Historical accident records and AI-detected candidates are never summed into a single 'accidents' figure."
        tone="admin"
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard tone="admin" label="All events" value={analytics.data?.total ?? "—"} hint="AI candidates and manual reports" />
        <MetricCard tone="admin" label="Confirmed" value={analytics.data?.confirmed_observations ?? "—"} hint="Human reviewed" emphasis="success" />
        <MetricCard tone="admin" label="Pending" value={analytics.data?.pending_candidates ?? "—"} hint="Awaiting review" emphasis="warn" />
        <MetricCard tone="admin" label="Historical records" value={analytics.data?.historical_accidents_in_window ?? "—"} hint="Imported CSV source" emphasis="hotspot" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card tone="admin" className="lg:col-span-1">
          <CardHeader title="Event mix" tone="admin" />
          {analytics.loading ? (
            <LoadingRows tone="admin" />
          ) : analytics.error ? (
            <ErrorState tone="admin" message={analytics.error} onRetry={analytics.reload} />
          ) : (
            <div className="space-y-4 px-5 py-4 text-sm">
              <div>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">By review state</p>
                <ul className="space-y-1.5 text-[var(--text-secondary)]">
                  {Object.entries(analytics.data?.by_review_status ?? {}).map(([key, value]) => (
                    <li key={key} className="flex justify-between">
                      <span>{humanise(key)}</span>
                      <span className="tabular-nums font-semibold text-[var(--text-primary)]">{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">By event type</p>
                <ul className="space-y-1.5 text-[var(--text-secondary)]">
                  {Object.entries(analytics.data?.by_type ?? {}).map(([key, value]) => (
                    <li key={key} className="flex justify-between">
                      <span>{humanise(key)}</span>
                      <span className="tabular-nums font-semibold text-[var(--text-primary)]">{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-[var(--text-muted)]">{analytics.data?.data_note}</p>
            </div>
          )}
        </Card>

        <div className="lg:col-span-2">
          <MapPanel
            tone="admin"
            points={points}
            title="Latest hotspot clusters"
            description={latest ? `${latest.method} · ${latest.radius_meters} m radius` : "No hotspot analysis has been generated yet."}
            loading={hotspots.loading}
            height={360}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-5">
        <Card tone="admin">
          <CardHeader
            title="Clusters"
            description={latest?.methodology_note ?? "Clusters combine located records; they are not exposure-normalised risk rates."}
            tone="admin"
          />
          {hotspots.loading ? (
            <LoadingRows tone="admin" />
          ) : hotspots.error ? (
            <ErrorState tone="admin" message={hotspots.error} onRetry={hotspots.reload} />
          ) : (
            <DataTable tone="admin" head={["Cluster", "Records", "Sources", "First seen", "Last seen"]} empty="No clusters yet.">
              {clusters.map((cluster) => (
                <Row key={cluster.cluster_key} tone="admin">
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{cluster.label}</td>
                  <td className="px-4 py-3 tabular-nums text-[var(--text-primary)]">{cluster.total_records}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{cluster.source_mix.join(", ")}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{formatDateTime(cluster.first_seen)}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{formatDateTime(cluster.last_seen)}</td>
                </Row>
              ))}
            </DataTable>
          )}
        </Card>

        <Card tone="admin">
          <CardHeader title="Historical accident records" description="Imported reference data with its own source reference and verification state." tone="admin" />
          {accidents.loading ? (
            <LoadingRows tone="admin" />
          ) : accidents.error ? (
            <ErrorState tone="admin" message={accidents.error} onRetry={accidents.reload} />
          ) : (
            <DataTable
              tone="admin"
              head={["Date", "Road", "Type", "Severity", "Source", "Verification"]}
              empty="No historical records imported."
            >
              {(accidents.data ?? []).slice(0, 25).map((record) => (
                <Row key={record.id} tone="admin">
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{record.accident_date ?? formatDateTime(record.accident_time)}</td>
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{record.road_name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{humanise(record.accident_type)}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{humanise(record.severity)}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{record.source_name}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={record.verification_status} />
                  </td>
                </Row>
              ))}
            </DataTable>
          )}
        </Card>
      </div>
    </>
  );
}
