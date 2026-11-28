/** Presentation helpers shared by Command Center and Admin Portal. */

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatSeconds(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function humanise(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatCoordinates(latitude?: number | null, longitude?: number | null): string {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return "Location unknown";
  }
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export interface SemanticTone {
  text: string;
  bg: string;
  border: string;
  dot: string;
}

const TONE_NEUTRAL: SemanticTone = {
  text: "var(--status-neutral)",
  bg: "var(--status-neutral-bg)",
  border: "var(--status-neutral-border)",
  dot: "var(--status-neutral)",
};

const TONE_INFO: SemanticTone = {
  text: "var(--status-info)",
  bg: "var(--status-info-bg)",
  border: "var(--status-info-border)",
  dot: "var(--status-info)",
};

const TONE_SUCCESS: SemanticTone = {
  text: "var(--status-success)",
  bg: "var(--status-success-bg)",
  border: "var(--status-success-border)",
  dot: "var(--status-success)",
};

const TONE_WARN: SemanticTone = {
  text: "var(--status-warn)",
  bg: "var(--status-warn-bg)",
  border: "var(--status-warn-border)",
  dot: "var(--status-warn)",
};

const TONE_DANGER: SemanticTone = {
  text: "var(--status-danger)",
  bg: "var(--status-danger-bg)",
  border: "var(--status-danger-border)",
  dot: "var(--status-danger)",
};

const TONE_HOTSPOT: SemanticTone = {
  text: "var(--status-hotspot)",
  bg: "var(--status-hotspot-bg)",
  border: "var(--status-hotspot-border)",
  dot: "var(--status-hotspot)",
};

const STATUS_STYLE_MAP: Record<string, SemanticTone> = {
  pending: TONE_WARN,
  queued: TONE_INFO,
  running: TONE_INFO,
  processing: TONE_INFO,
  succeeded: TONE_SUCCESS,
  processed: TONE_SUCCESS,
  confirmed: TONE_SUCCESS,
  verified: TONE_SUCCESS,
  accepted: TONE_SUCCESS,
  approved: TONE_SUCCESS,
  active: TONE_SUCCESS,
  online: TONE_SUCCESS,
  matched_records: TONE_SUCCESS,
  good: TONE_SUCCESS,
  rejected_false_positive: TONE_DANGER,
  rejected: TONE_DANGER,
  failed: TONE_DANGER,
  validation_failed: TONE_DANGER,
  critical: TONE_DANGER,
  poor: TONE_DANGER,
  high: TONE_DANGER,
  needs_more_information: TONE_WARN,
  needs_more_evidence: TONE_WARN,
  ambiguous_match: TONE_WARN,
  requires_field_verification: TONE_WARN,
  missing_contract_data: TONE_WARN,
  completed_pending_verification: TONE_WARN,
  simulated: TONE_WARN,
  medium: TONE_WARN,
  fair: TONE_WARN,
  in_progress: TONE_INFO,
  assigned: TONE_INFO,
  under_review: TONE_HOTSPOT,
  hotspot: TONE_HOTSPOT,
  reopened: TONE_WARN,
  low: TONE_NEUTRAL,
  cancelled: TONE_NEUTRAL,
  draft: TONE_NEUTRAL,
  no_asset_match: TONE_NEUTRAL,
  offline: TONE_NEUTRAL,
  unknown: TONE_NEUTRAL,
  closed: TONE_NEUTRAL,
};

export function statusSemanticStyle(status: string | null | undefined): SemanticTone {
  if (!status) return TONE_NEUTRAL;
  return STATUS_STYLE_MAP[status] ?? TONE_NEUTRAL;
}

/** Backwards-compatible string helper if any external code calls statusTone. */
export function statusTone(status: string | null | undefined): string {
  const s = statusSemanticStyle(status);
  return `bg-[${s.bg}] text-[${s.text}]`;
}
