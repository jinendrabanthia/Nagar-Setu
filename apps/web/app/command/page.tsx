"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  AlertTriangle,
  Archive,
  Camera as CameraIcon,
  CheckCircle2,
  ClipboardCheck,
  Upload,
} from "lucide-react";
import { useSession } from "@/lib/session";
import { useApi } from "@/lib/useApi";
import { MapPanel } from "@/components/MapPanel";
import type { MapPoint } from "@/components/MapInner";
import { EventsTable } from "@/components/EventsTable";
import {
  PriorityReviewQueue,
  ProcessingJobs,
  RealtimePanel,
} from "@/components/OperationsPanels";
import {
  Card,
  CardHeader,
  MetricCard,
  PageHeader,
} from "@/components/ui";
import { formatDateTime, humanise } from "@/lib/format";
import { useRealtime } from "@/lib/realtime";
import type {
  AccidentRecord,
  Camera,
  HotspotAnalysis,
  Incident,
  IncidentAnalytics,
  Job,
} from "@/lib/types";

export default function CommandOverviewPage() {
  const { session } = useSession();
  const analytics = useApi<IncidentAnalytics>("/api/v1/incidents/analytics");
  const incidents = useApi<Incident[]>("/api/v1/incidents?limit=50");
  const cameras = useApi<Camera[]>("/api/v1/cameras?limit=50");
  const jobs = useApi<Job[]>("/api/v1/jobs?limit=6");
  const accidents = useApi<AccidentRecord[]>("/api/v1/accident-records?limit=25");
  const hotspots = useApi<HotspotAnalysis[]>("/api/v1/hotspots?limit=1");

  const realtime = useRealtime((event) => {
    if (event.event_type.startsWith("incident.")) incidents.reload();
    if (event.event_type.startsWith("video.")) jobs.reload();
    if (event.event_type.startsWith("camera.")) cameras.reload();
    analytics.reload();
  });

  const points = useMemo<MapPoint[]>(() => {
    const incidentPoints: MapPoint[] = (incidents.data ?? [])
      .filter((incident) => incident.location)
      .map((incident) => ({
        id: incident.id,
        latitude: incident.location!.latitude,
        longitude: incident.location!.longitude,
        label: humanise(incident.incident_type),
        detail: incident.description,
        layer:
          incident.review_status === "confirmed"
            ? "confirmed_observation"
            : incident.review_status === "pending"
              ? "pending_candidate"
              : "event",
        status: incident.review_status,
        severity: incident.severity,
        timestamp: incident.event_time,
        cameraCode: incident.camera_code,
        confidence: incident.model_score,
        href: `/command/incidents/${incident.id}`,
      }));

    const cameraPoints: MapPoint[] = (cameras.data ?? [])
      .filter((camera) => camera.location)
      .map((camera) => ({
        id: camera.id,
        latitude: camera.location!.latitude,
        longitude: camera.location!.longitude,
        label: `${camera.camera_code} · ${camera.name}`,
        detail: camera.description ?? camera.connection_status.replace(/_/g, " "),
        layer: "camera",
        status: camera.connection_status,
        timestamp: camera.last_seen_at,
        href: `/command/monitoring?camera=${camera.id}`,
      }));

    const accidentPoints: MapPoint[] = (accidents.data ?? [])
      .filter((record) => record.location)
      .map((record) => ({
        id: record.id,
        latitude: record.location!.latitude,
        longitude: record.location!.longitude,
        label: record.road_name ?? "Historical accident record",
        detail: `${humanise(record.accident_type)} · ${record.source_name}`,
        layer: "historical_accident",
        status: record.verification_status,
        severity: record.severity,
        timestamp: record.accident_time ?? record.accident_date,
      }));

    const hotspotPoints: MapPoint[] = (hotspots.data?.[0]?.clusters ?? []).map((cluster) => ({
      id: cluster.cluster_key,
      latitude: cluster.latitude,
      longitude: cluster.longitude,
      label: cluster.label,
      detail: `${cluster.total_records} clustered records (${cluster.radius_meters}m radius)`,
      layer: "hotspot",
      timestamp: cluster.last_seen,
      href: "/command/hotspots",
    }));

    return [...incidentPoints, ...cameraPoints, ...accidentPoints, ...hotspotPoints];
  }, [incidents.data, cameras.data, accidents.data, hotspots.data]);

  const onlineCameras = (cameras.data ?? []).filter(
    (camera) => camera.connection_status === "online",
  ).length;
  const totalCameras = (cameras.data ?? []).length;
  const org = session?.user.organization;
  const cityLabel = org?.city ? `${org.city}${org.state ? `, ${org.state}` : ""}` : org?.name;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Overview"
        description="Your city's current safety picture at a glance. AI detections remain candidate observations until human verification; historical accident records stay segregated."
        actions={
          <>
            <Link
              href="/command/videos"
              className="inline-flex items-center gap-2 rounded-[10px] bg-[var(--accent-primary)] px-4 py-2 text-xs sm:text-sm font-medium text-[var(--accent-contrast)] shadow-xs transition hover:bg-[var(--accent-hover)]"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload Footage
            </Link>
            <Link
              href="/command/incidents"
              className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2 text-xs sm:text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--bg-secondary)]"
            >
              <ClipboardCheck className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden="true" />
              Review Queue
            </Link>
          </>
        }
      />

      {/* Four Equal-Height KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="AI Candidate Events"
          value={analytics.data?.pending_candidates ?? "—"}
          hint="Awaiting human review"
          emphasis="warn"
          icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />}
        />
        <MetricCard
          label="Human Confirmed"
          value={analytics.data?.confirmed_observations ?? "—"}
          hint="Reviewed and accepted"
          emphasis="success"
          icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
        />
        <MetricCard
          label="Historical Accident Records"
          value={analytics.data?.historical_accidents_in_window ?? "—"}
          hint="Imported records"
          emphasis="hotspot"
          icon={<Archive className="h-4 w-4" aria-hidden="true" />}
        />
        <MetricCard
          label="Cameras Online"
          value={`${onlineCameras}/${totalCameras}`}
          hint="Reporting online"
          emphasis="info"
          icon={<CameraIcon className="h-4 w-4" aria-hidden="true" />}
        />
      </div>

      {/* Primary City Safety Map (65-70%) + Operations Panel (30-35%) */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <MapPanel
            points={points}
            title="Located events, cameras & hotspots"
            cityLabel={cityLabel}
            loading={incidents.loading || cameras.loading}
            height={520}
          />
        </div>

        <div className="space-y-4 lg:col-span-4">
          <PriorityReviewQueue
            incidents={incidents.data ?? []}
            loading={incidents.loading}
            error={incidents.error}
            onRetry={incidents.reload}
          />

          <RealtimePanel
            status={realtime.status}
            events={realtime.events}
            lastRefreshed={analytics.data?.window_to ? formatDateTime(analytics.data.window_to) : null}
          />

          <ProcessingJobs
            jobs={jobs.data ?? []}
            loading={jobs.loading}
            error={jobs.error}
            onRetry={jobs.reload}
          />

          <Card variant="secondary">
            <CardHeader title="Data provenance separation" />
            <div className="space-y-2 px-4 py-3 text-xs leading-relaxed text-[var(--text-secondary)]">
              <p>
                <strong className="font-semibold text-[var(--text-primary)]">AI Candidate Events</strong>{" "}
                originate from the vision pipeline and remain unverified proposals until reviewed.
              </p>
              <p>
                <strong className="font-semibold text-[var(--text-primary)]">Historical Records</strong>{" "}
                are imported police datasets and are never merged into AI detection metrics.
              </p>
              {analytics.data?.data_note ? (
                <p className="text-[11px] text-[var(--text-muted)]">{analytics.data.data_note}</p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      {/* Latest Events Table */}
      <EventsTable
        incidents={incidents.data ?? []}
        loading={incidents.loading}
        error={incidents.error}
        onRetry={incidents.reload}
        pendingCount={analytics.data?.pending_candidates}
      />
    </div>
  );
}
