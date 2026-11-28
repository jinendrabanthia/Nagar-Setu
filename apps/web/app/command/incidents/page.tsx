"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSession } from "@/lib/session";
import { useApi } from "@/lib/useApi";
import {
  Card,
  CardHeader,
  DataTable,
  ErrorState,
  LoadingRows,
  PageHeader,
  PermissionNotice,
  Row,
  Select,
  StatusBadge,
} from "@/components/ui";
import { formatDateTime, humanise } from "@/lib/format";
import type { Camera, Incident } from "@/lib/types";

const REVIEW_FILTERS = [
  ["", "All review states"],
  ["pending", "Pending review"],
  ["confirmed", "Confirmed"],
  ["rejected_false_positive", "Rejected false positive"],
  ["needs_more_information", "Needs more information"],
];

const TYPE_FILTERS = [
  ["", "All event types"],
  ["near_miss_candidate", "Near miss candidate"],
  ["pedestrian_conflict_candidate", "Pedestrian conflict candidate"],
  ["collision_candidate", "Collision candidate"],
  ["rapid_motion_candidate", "Rapid motion candidate"],
  ["wrong_way_candidate", "Wrong way candidate"],
  ["signal_violation_candidate", "Signal violation candidate"],
  ["manual_road_hazard", "Manual road hazard"],
];

export default function IncidentsPage() {
  const { has } = useSession();
  const [reviewStatus, setReviewStatus] = useState("");
  const [incidentType, setIncidentType] = useState("");
  const [cameraId, setCameraId] = useState("");
  const cameras = useApi<Camera[]>("/api/v1/cameras?limit=100");

  const path = useMemo(() => {
    const params = new URLSearchParams({ limit: "50" });
    if (reviewStatus) params.set("review_status", reviewStatus);
    if (incidentType) params.set("incident_type", incidentType);
    if (cameraId) params.set("camera_id", cameraId);
    return `/api/v1/incidents?${params.toString()}`;
  }, [reviewStatus, incidentType, cameraId]);

  const incidents = useApi<Incident[]>(path);

  if (!has("incident:read")) return <PermissionNotice tone="command" permission="incident:read" />;

  const visibleIncidents = useMemo(() => {
    return (incidents.data ?? []).filter((item) => {
      if (reviewStatus && item.review_status !== reviewStatus) return false;
      if (incidentType && item.incident_type !== incidentType) return false;
      if (cameraId && item.camera_id !== cameraId) return false;
      return true;
    });
  }, [incidents.data, reviewStatus, incidentType, cameraId]);

  const pending = visibleIncidents.filter((item) => item.review_status === "pending").length;

  return (
    <>
      <PageHeader
        title="Event review queue"
        description="Every AI detection is a candidate observation. Confirm only what you can see in the evidence; a confirmation is still not a legal finding."
        tone="command"
      />

      <Card tone="command" className="mb-5">
        <div className="grid gap-3 px-5 py-4 sm:grid-cols-3">
          <label className="text-xs font-medium text-[var(--text-secondary)]">
            <span className="mb-1.5 block">Review state</span>
            <Select tone="command" value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value)}>
              {REVIEW_FILTERS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-xs font-medium text-[var(--text-secondary)]">
            <span className="mb-1.5 block">Event type</span>
            <Select tone="command" value={incidentType} onChange={(event) => setIncidentType(event.target.value)}>
              {TYPE_FILTERS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-xs font-medium text-[var(--text-secondary)]">
            <span className="mb-1.5 block">Camera</span>
            <Select tone="command" value={cameraId} onChange={(event) => setCameraId(event.target.value)}>
              <option value="">All cameras</option>
              {(cameras.data ?? []).map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.camera_code}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </Card>

      <Card tone="command">
        <CardHeader
          title="Candidates"
          description={`${visibleIncidents.length} showing · ${pending} pending a decision in this view`}
          tone="command"
        />
        {incidents.loading ? (
          <LoadingRows tone="command" />
        ) : incidents.error ? (
          <ErrorState tone="command" message={incidents.error} onRetry={incidents.reload} />
        ) : (
          <DataTable
            tone="command"
            head={["Event", "Review", "Score", "Window", "Camera", "Event time", "Reasons", ""]}
            empty="No events match these filters."
          >
            {visibleIncidents.map((incident) => (
              <Row key={incident.id} tone="command">
                <td className="px-4 py-3">
                  <span className="block font-medium text-[var(--text-primary)]">
                    {humanise(incident.incident_type)}
                  </span>
                  <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                    {incident.source_kind === "ai_detected" ? "AI candidate" : "manual report"} ·{" "}
                    {incident.severity ?? "severity unset"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={incident.review_status} />
                </td>
                <td className="px-4 py-3 font-mono text-xs tabular-nums text-[var(--text-secondary)]">
                  {incident.model_score !== null ? incident.model_score.toFixed(2) : "—"}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">
                  {incident.start_offset_seconds !== null
                    ? `${incident.start_offset_seconds.toFixed(1)}s – ${incident.end_offset_seconds?.toFixed(1) ?? "?"}s`
                    : "—"}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">{incident.camera_code ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{formatDateTime(incident.event_time)}</td>
                <td className="px-4 py-3 text-[11px] text-[var(--text-muted)]">
                  {incident.reason_codes.length ? incident.reason_codes.join(", ") : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/command/incidents/${incident.id}`} className="text-xs font-medium text-[var(--accent-primary)] hover:underline">
                    Review →
                  </Link>
                </td>
              </Row>
            ))}
          </DataTable>
        )}
      </Card>
    </>
  );
}
