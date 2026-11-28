"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "@/lib/session";
import { useApi } from "@/lib/useApi";
import {
  Card,
  CardHeader,
  DataTable,
  ErrorState,
  KeyValue,
  LoadingRows,
  PageHeader,
  PermissionNotice,
  Row,
  StatusBadge,
  TagList,
} from "@/components/ui";
import { formatDate, formatDateTime, humanise } from "@/lib/format";
import type { InvestigationDetail } from "@/lib/types";

export default function AdminInvestigationDetailPage() {
  const params = useParams<{ id: string }>();
  const { has } = useSession();
  const detail = useApi<InvestigationDetail>(`/api/v1/investigations/${params.id}`);

  if (!has("investigation:read")) return <PermissionNotice tone="admin" permission="investigation:read" />;
  if (detail.loading) return <LoadingRows tone="admin" label="Loading case…" />;
  if (detail.error) return <ErrorState tone="admin" message={detail.error} onRetry={detail.reload} />;
  if (!detail.data) return <ErrorState tone="admin" message="Case not found." />;

  const { investigation, responsibility, recommendations, work_orders: workOrders } = detail.data;

  return (
    <>
      <PageHeader
        tone="admin"
        breadcrumb={{ label: "Case register", href: "/admin/investigations" }}
        title={`${investigation.case_number} — ${investigation.title}`}
        description={investigation.summary ?? undefined}
        actions={<StatusBadge status={investigation.status} />}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card tone="admin">
          <CardHeader title="Record match" description="Derived from the asset registry and contract dates." tone="admin" />
          <div className="px-5 py-4">
            <KeyValue
              tone="admin"
              items={[
                ["Status", <StatusBadge key="status" status={responsibility?.status ?? investigation.responsibility_status} />],
                ["Asset", responsibility?.asset_name ? `${responsibility.asset_code} — ${responsibility.asset_name}` : "No asset matched"],
                ["Owning department", responsibility?.owning_department_name ?? "Not recorded"],
                ["Match method", responsibility?.match_method ?? "—"],
                ["Distance", responsibility?.distance_meters !== null && responsibility?.distance_meters !== undefined ? `${responsibility.distance_meters.toFixed(1)} m` : "—"],
                ["Opened", formatDateTime(investigation.created_at)],
              ]}
            />
            {responsibility?.disclaimer ? (
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
            ) : null}
          </div>
        </Card>

        <Card tone="admin">
          <CardHeader title="Contract coverage" tone="admin" />
          <div className="space-y-2.5 px-5 py-4">
            {responsibility?.contracts.length ? (
              responsibility.contracts.map((contract) => (
                <div key={contract.contract_id} className="surface-data rounded-[10px] px-3.5 py-2.5">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {contract.contract_number} · {contract.contractor_name}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {humanise(contract.contract_type)} · {formatDate(contract.start_date)} →{" "}
                    {formatDate(contract.end_date)}
                  </p>
                  <p
                    className="mt-1 text-xs font-medium"
                    style={{
                      color: contract.is_active_on_event_date
                        ? "var(--status-success)"
                        : "var(--status-warn)",
                    }}
                  >
                    {contract.is_active_on_event_date ? "Active on the event date" : "Not active on the event date"} —{" "}
                    {contract.date_note}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--text-muted)]">No contract records cover this asset.</p>
            )}
            {responsibility?.missing_records.length ? (
              <div>
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Missing records</p>
                <TagList tone="admin" items={responsibility.missing_records} />
              </div>
            ) : null}
          </div>
        </Card>

        <Card tone="admin">
          <CardHeader title="Hypotheses on file" description="Possibilities to verify with records — not conclusions." tone="admin" />
          <div className="space-y-2.5 px-5 py-4">
            {investigation.hypotheses.length ? (
              investigation.hypotheses.map((hypothesis, index) => (
                <div key={index} className="surface-data rounded-[10px] px-3.5 py-2.5">
                  <p className="text-sm text-[var(--text-primary)]">{hypothesis.hypothesis}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Confidence {hypothesis.confidence_label} · supporting records{" "}
                    {hypothesis.supporting_record_ids.length}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--text-muted)]">No analysis drafted yet.</p>
            )}
          </div>
        </Card>

        <Card tone="admin">
          <CardHeader title="Recommendations and work orders" tone="admin" />
          <div className="px-5 py-4">
            {recommendations.length ? (
              <ul className="mb-3 space-y-2">
                {recommendations.map((recommendation) => (
                  <li key={recommendation.id} className="surface-data flex items-start justify-between gap-2 rounded-[10px] px-3.5 py-2.5">
                    <span className="text-sm text-[var(--text-primary)]">{recommendation.recommendation_text}</span>
                    <StatusBadge status={recommendation.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-3 text-sm text-[var(--text-muted)]">No recommendations drafted.</p>
            )}
            {workOrders.length ? (
              <DataTable tone="admin" head={["WO", "Status", "Priority", ""]}>
                {workOrders.map((order) => (
                  <Row key={order.id} tone="admin">
                    <td className="px-3 py-2.5 font-mono text-xs text-[var(--text-primary)]">{order.work_order_number}</td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[var(--text-secondary)]">{humanise(order.priority)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <Link href={`/admin/work-orders/${order.id}`} className="text-xs font-medium text-[var(--accent-primary)] hover:underline">
                        Open →
                      </Link>
                    </td>
                  </Row>
                ))}
              </DataTable>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">No work orders raised from this case.</p>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
