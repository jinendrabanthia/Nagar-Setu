"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/lib/session";
import { useApi } from "@/lib/useApi";
import { api, ApiError } from "@/lib/api";
import { EvidenceGrid } from "@/components/EvidenceGrid";
import {
  AlertBanner,
  Button,
  Card,
  CardHeader,
  DataTable,
  ErrorState,
  Field,
  KeyValue,
  LoadingRows,
  PageHeader,
  PermissionNotice,
  Row,
  Select,
  StatusBadge,
  TagList,
  Textarea,
} from "@/components/ui";
import { formatDate, formatDateTime, humanise } from "@/lib/format";
import type {
  Department,
  InvestigationAnalysis,
  InvestigationDetail,
  Recommendation,
  WorkOrder,
} from "@/lib/types";

export default function InvestigationDetailPage() {
  const params = useParams<{ id: string }>();
  const { has, session } = useSession();
  const detail = useApi<InvestigationDetail>(`/api/v1/investigations/${params.id}`);
  const departments = useApi<Department[]>("/api/v1/departments?limit=100");
  const [analysis, setAnalysis] = useState<InvestigationAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [showWorkOrder, setShowWorkOrder] = useState<{ recommendationId: string | null } | null>(
    null,
  );

  if (!has("investigation:read")) return <PermissionNotice tone="command" permission="investigation:read" />;

  const investigation = detail.data?.investigation;

  async function runAnalysis() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await api.post<InvestigationAnalysis>(`/api/v1/investigations/${params.id}/analyze`);
      setAnalysis(result);
      setNotice(
        `Draft analysis produced by the ${result.analysis_source} engine. It is a set of hypotheses for a human to verify.`,
      );
      detail.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The analysis could not be produced.");
    } finally {
      setBusy(false);
    }
  }

  async function submitRecommendation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await api.post<Recommendation>(`/api/v1/investigations/${params.id}/recommendations`, {
        recommendation_text: form.get("recommendation_text"),
        rationale: form.get("rationale"),
        priority: form.get("priority"),
        limitations: [],
      });
      setShowRecommendation(false);
      setNotice("Recommendation drafted. It needs approval by a different user before a work order.");
      detail.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save the recommendation.");
    } finally {
      setBusy(false);
    }
  }

  async function reviewRecommendation(id: string, decision: "approved" | "rejected") {
    setBusy(true);
    setError(null);
    try {
      await api.patch(`/api/v1/recommendations/${id}/review`, {
        decision,
        notes: decision === "approved" ? "Approved after reviewing the case evidence." : "Rejected; insufficient support.",
      });
      setNotice(`Recommendation ${decision}.`);
      detail.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not record the approval decision.");
    } finally {
      setBusy(false);
    }
  }

  async function createWorkOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await api.post<WorkOrder>("/api/v1/work-orders", {
        investigation_id: params.id,
        recommendation_id: showWorkOrder?.recommendationId ?? null,
        assigned_department_id: form.get("assigned_department_id"),
        title: form.get("title"),
        description: form.get("description"),
        priority: form.get("priority"),
        due_date: form.get("due_date") || null,
      });
      setShowWorkOrder(null);
      setNotice("Work order created. A department user must accept it, complete the work and submit evidence.");
      detail.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the work order.");
    } finally {
      setBusy(false);
    }
  }

  if (detail.loading) return <LoadingRows tone="command" label="Loading case…" />;
  if (detail.error) return <ErrorState tone="command" message={detail.error} onRetry={detail.reload} />;
  if (!detail.data || !investigation) return <ErrorState tone="command" message="Case not found." />;

  const data = detail.data;
  const responsibility = data.responsibility;
  const hypotheses = analysis?.potential_root_causes ?? investigation.hypotheses;

  return (
    <>
      <PageHeader
        tone="command"
        breadcrumb={{ label: "Investigations", href: "/command/investigations" }}
        title={`${investigation.case_number} — ${investigation.title}`}
        description={investigation.summary ?? undefined}
        actions={
          <>
            <StatusBadge status={investigation.status} />
            {has("investigation:analyze") || has("investigation:manage") ? (
              <Button tone="command" variant="secondary" onClick={() => void runAnalysis()} disabled={busy}>
                {busy ? "Working…" : "Draft analysis"}
              </Button>
            ) : null}
          </>
        }
      />

      {notice ? <AlertBanner kind="info">{notice}</AlertBanner> : null}
      {error ? <AlertBanner kind="danger">{error}</AlertBanner> : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card tone="command">
            <CardHeader
              title="Infrastructure record match"
              description="Nearest registered asset within the match radius. Records only — not a liability conclusion."
              tone="command"
            />
            <div className="px-5 py-4">
              {responsibility ? (
                <>
                  <KeyValue
                    tone="command"
                    items={[
                      ["Match status", <StatusBadge key="s" status={responsibility.status} />],
                      ["Asset", responsibility.asset_name ? `${responsibility.asset_code} — ${responsibility.asset_name}` : "No match"],
                      ["Owning department", responsibility.owning_department_name ?? "Not recorded"],
                      ["Match method", responsibility.match_method],
                      [
                        "Distance",
                        responsibility.distance_meters !== null
                          ? `${responsibility.distance_meters.toFixed(1)} m from the event location`
                          : "—",
                      ],
                    ]}
                  />
                  <div className="mt-4">
                    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Contracts</p>
                    {responsibility.contracts.length ? (
                      <ul className="space-y-2 text-sm">
                        {responsibility.contracts.map((contract) => (
                          <li key={contract.contract_id} className="surface-data rounded-[10px] px-3.5 py-2.5">
                            <p className="font-medium text-[var(--text-primary)]">
                              {contract.contract_number} · {contract.contractor_name}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">
                              {contract.contract_type} · {formatDate(contract.start_date)} →{" "}
                              {formatDate(contract.end_date)} ·{" "}
                              {contract.is_active_on_event_date ? "active on event date" : "not active on event date"}
                            </p>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">{contract.date_note}</p>
                            {contract.scope_notes ? (
                              <p className="mt-1 text-xs" style={{ color: "var(--status-warn)" }}>{contract.scope_notes}</p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-[var(--text-muted)]">No contract records cover this asset.</p>
                    )}
                  </div>
                  {responsibility.missing_records.length ? (
                    <div className="mt-3">
                      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Missing records</p>
                      <TagList tone="command" items={responsibility.missing_records} />
                    </div>
                  ) : null}
                  {responsibility.conflicts.length ? (
                    <div className="mt-3">
                      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Conflicts</p>
                      <TagList tone="command" items={responsibility.conflicts} />
                    </div>
                  ) : null}
                  <p
                    className="mt-4 rounded-[10px] border px-3.5 py-2 text-xs"
                    style={{
                      backgroundColor: "var(--demo-bg)",
                      borderColor: "var(--demo-border)",
                      color: "var(--demo-text)",
                    }}
                  >
                    {responsibility.disclaimer}
                  </p>
                </>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">
                  This case has no linked asset yet. Record match results appear once an asset is
                  associated.
                </p>
              )}
            </div>
          </Card>

          <Card tone="command">
            <CardHeader
              title="Root-cause hypotheses"
              description={
                analysis
                  ? `${analysis.analysis_source} draft · model ${analysis.model_name ?? "none"}`
                  : "Deterministic drafts are stored with the case. Run an analysis to refresh."
              }
              tone="command"
            />
            <div className="space-y-3 px-5 py-4">
              {hypotheses.length ? (
                hypotheses.map((hypothesis, index) => (
                  <div key={`${hypothesis.hypothesis}-${index}`} className="surface-data rounded-[10px] px-3.5 py-2.5">
                    <p className="text-sm text-[var(--text-primary)]">{hypothesis.hypothesis}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      Confidence label: {hypothesis.confidence_label} · supporting records:{" "}
                      {hypothesis.supporting_record_ids.length || "none"}
                    </p>
                    {hypothesis.counter_evidence.length ? (
                      <p className="mt-1 text-xs" style={{ color: "var(--status-warn)" }}>
                        Counter-evidence: {hypothesis.counter_evidence.join("; ")}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--text-muted)]">
                  No hypotheses drafted yet. Hypotheses are possibilities to check, not conclusions.
                </p>
              )}
              {analysis ? (
                <>
                  <div>
                    <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Missing information</p>
                    <TagList tone="command" items={analysis.missing_information} />
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Limitations</p>
                    <TagList tone="command" items={analysis.limitations} />
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Likely responsible authorities</p>
                    <TagList tone="command" items={analysis.potentially_relevant_authorities} emptyLabel="Not determined from records" />
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Human verification required: {analysis.human_verification_required ? "yes" : "no"}.
                  </p>
                </>
              ) : null}
            </div>
          </Card>

          <Card tone="command">
            <CardHeader title="Case evidence" description="Artefacts attached to the linked event or uploaded by an investigator." tone="command" />
            {data.evidence.length || data.incident_evidence.length ? (
              <EvidenceGrid items={[...data.evidence, ...data.incident_evidence]} />
            ) : (
              <p className="px-5 py-6 text-sm text-[var(--text-muted)]">No evidence attached to this case.</p>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card tone="command">
            <CardHeader
              title="Recommendations"
              tone="command"
              actions={
                has("recommendation:create") || has("investigation:manage") ? (
                  <Button tone="command" variant="secondary" onClick={() => setShowRecommendation((value) => !value)}>
                    {showRecommendation ? "Close" : "Draft"}
                  </Button>
                ) : null
              }
            />
            <div className="space-y-3 px-5 py-4">
              {showRecommendation ? (
                <form onSubmit={submitRecommendation} className="surface-data space-y-3 rounded-[10px] p-3.5">
                  <Field label="Recommendation" tone="command" htmlFor="recommendation_text">
                    <Textarea tone="command" id="recommendation_text" name="recommendation_text" rows={3} required minLength={5} />
                  </Field>
                  <Field label="Rationale" tone="command" htmlFor="rationale">
                    <Textarea tone="command" id="rationale" name="rationale" rows={2} required minLength={5} />
                  </Field>
                  <Field label="Priority" tone="command" htmlFor="priority">
                    <Select id="priority" name="priority">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </Select>
                  </Field>
                  <Button tone="command" type="submit" disabled={busy}>
                    Save draft
                  </Button>
                </form>
              ) : null}

              {data.recommendations.length ? (
                <ul className="space-y-2.5">
                  {data.recommendations.map((recommendation) => (
                    <li key={recommendation.id} className="surface-data rounded-[10px] px-3.5 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-[var(--text-primary)]">{recommendation.recommendation_text}</p>
                        <StatusBadge status={recommendation.status} />
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">{recommendation.rationale}</p>
                      <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                        Priority {recommendation.priority} · created {formatDateTime(recommendation.created_at)}
                      </p>
                      {recommendation.status === "draft" && (has("recommendation:approve") || has("recommendation:review")) ? (
                        <div className="mt-2 flex gap-2">
                          <Button
                            tone="command"
                            onClick={() => void reviewRecommendation(recommendation.id, "approved")}
                            disabled={busy}
                          >
                            Approve
                          </Button>
                          <Button
                            tone="command"
                            variant="secondary"
                            onClick={() => void reviewRecommendation(recommendation.id, "rejected")}
                            disabled={busy}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : null}
                      {recommendation.status === "approved" && (has("work_order:create") || has("work_order:manage")) ? (
                        <Button
                          tone="command"
                          variant="secondary"
                          className="mt-2"
                          onClick={() => setShowWorkOrder({ recommendationId: recommendation.id })}
                        >
                          Create work order
                        </Button>
                      ) : null}
                      {recommendation.created_by === session?.user.id &&
                      recommendation.status === "draft" ? (
                        <p className="mt-1 text-[11px]" style={{ color: "var(--status-warn)" }}>
                          You drafted this. A different user must approve it.
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No recommendations drafted.</p>
              )}
            </div>
          </Card>

          <Card tone="command">
            <CardHeader
              title="Work orders"
              tone="command"
              actions={
                (has("work_order:create") || has("work_order:manage")) && !showWorkOrder ? (
                  <Button tone="command" variant="secondary" onClick={() => setShowWorkOrder({ recommendationId: null })}>
                    New
                  </Button>
                ) : null
              }
            />
            <div className="space-y-3 px-5 py-4">
              {showWorkOrder ? (
                <form onSubmit={createWorkOrder} className="surface-data space-y-3 rounded-[10px] p-3.5">
                  <Field label="Department" tone="command" htmlFor="assigned_department_id">
                    <Select id="assigned_department_id" name="assigned_department_id" required>
                      <option value="">Select a department</option>
                      {(departments.data ?? []).map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Title" tone="command" htmlFor="title">
                    <Textarea tone="command" id="title" name="title" rows={1} required minLength={4} />
                  </Field>
                  <Field label="Description" tone="command" htmlFor="description">
                    <Textarea tone="command" id="description" name="description" rows={3} required minLength={5} />
                  </Field>
                  <Field label="Due date" tone="command" htmlFor="due_date">
                    <Textarea tone="command" id="due_date" name="due_date" rows={1} placeholder="YYYY-MM-DD" />
                  </Field>
                  <Button tone="command" type="submit" disabled={busy}>
                    Create work order
                  </Button>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    The department must accept, complete and attach evidence; a different user then
                    verifies it.
                  </p>
                </form>
              ) : null}

              {data.work_orders.length ? (
                <DataTable tone="command" head={["WO", "Status", "Priority"]}>
                  {data.work_orders.map((workOrder) => (
                    <Row key={workOrder.id} tone="command">
                      <td className="px-3 py-2.5">
                        <Link href={`/admin/work-orders/${workOrder.id}`} className="font-mono text-xs font-medium text-[var(--accent-primary)] hover:underline">
                          {workOrder.work_order_number}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={workOrder.status} />
                      </td>
                      <td className="px-3 py-2.5 text-xs text-[var(--text-secondary)]">{workOrder.priority}</td>
                    </Row>
                  ))}
                </DataTable>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No work orders raised from this case.</p>
              )}
            </div>
          </Card>

          <Card tone="command" variant="secondary">
            <CardHeader title="Nearby assets" tone="command" />
            <div className="px-5 py-3.5">
              {data.nearby_assets.length ? (
                <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                  {data.nearby_assets.map((asset) => (
                    <li key={asset.asset_id}>
                      <span className="font-mono font-medium text-[var(--text-primary)]">{asset.asset_code}</span> · {asset.name} ·{" "}
                      {asset.distance_meters.toFixed(0)} m
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No registered assets nearby.</p>
              )}
              {data.source_records.length ? (
                <p className="mt-3 text-[11px] text-[var(--text-muted)]">
                  Source records: {data.source_records.join(", ")}.
                </p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
