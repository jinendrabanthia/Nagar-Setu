"use client";

import Link from "next/link";
import { useApi } from "@/lib/useApi";
import {
  Card,
  CardHeader,
  DataTable,
  LoadingRows,
  MetricCard,
  PageHeader,
  Row,
  StatusBadge,
} from "@/components/ui";
import { formatDateTime, humanise } from "@/lib/format";
import type {
  Asset,
  AuditEntry,
  Contract,
  Contractor,
  Department,
  IncidentAnalytics,
  Investigation,
  WorkOrder,
} from "@/lib/types";

export default function AdminOverviewPage() {
  const departments = useApi<Department[]>("/api/v1/departments?limit=100");
  const contractors = useApi<Contractor[]>("/api/v1/contractors?limit=100");
  const assets = useApi<Asset[]>("/api/v1/assets?limit=100");
  const contracts = useApi<Contract[]>("/api/v1/contracts?limit=100");
  const investigations = useApi<Investigation[]>("/api/v1/investigations?limit=100");
  const workOrders = useApi<WorkOrder[]>("/api/v1/work-orders?limit=100");
  const analytics = useApi<IncidentAnalytics>("/api/v1/incidents/analytics");
  const audit = useApi<AuditEntry[]>("/api/v1/audit-logs?limit=8");

  const openWorkOrders = (workOrders.data ?? []).filter(
    (order) => !["verified", "cancelled", "rejected"].includes(order.status),
  ).length;
  const awaitingVerification = (workOrders.data ?? []).filter(
    (order) => order.status === "completed_pending_verification",
  ).length;

  return (
    <>
      <PageHeader
        title="Administrative portal"
        description="Registry data, contracts and corrective actions. Every record here is demo data unless it was entered by your organization."
        tone="admin"
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard tone="admin" label="Departments" value={departments.data?.length ?? "—"} hint="Registry entries" />
        <MetricCard
          tone="admin"
          label="Assets"
          value={assets.data?.length ?? "—"}
          hint={`${(assets.data ?? []).filter((asset) => !asset.department_id).length} without an owning department`}
          emphasis="info"
        />
        <MetricCard
          tone="admin"
          label="Contracts"
          value={contracts.data?.length ?? "—"}
          hint={`${contractors.data?.length ?? 0} contractors`}
          emphasis="hotspot"
        />
        <MetricCard
          tone="admin"
          label="Open work orders"
          value={openWorkOrders}
          hint={`${awaitingVerification} awaiting verification`}
          emphasis={awaitingVerification ? "warn" : "success"}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card tone="admin" className="lg:col-span-2">
          <CardHeader
            title="Corrective action pipeline"
            tone="admin"
            actions={
              <Link href="/admin/work-orders" className="text-xs font-medium text-[var(--accent-primary)] hover:underline">
                All work orders →
              </Link>
            }
          />
          {workOrders.loading ? (
            <LoadingRows tone="admin" />
          ) : (
            <DataTable
              tone="admin"
              head={["Work order", "Department", "Status", "Priority", "Due", ""]}
              empty="No work orders raised yet."
            >
              {(workOrders.data ?? []).slice(0, 8).map((order) => (
                <Row key={order.id} tone="admin">
                  <td className="px-4 py-3 font-mono text-xs text-[var(--text-primary)]">{order.work_order_number}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{order.department_name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{humanise(order.priority)}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{formatDateTime(order.due_date)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/work-orders/${order.id}`} className="text-xs font-medium text-[var(--accent-primary)] hover:underline">
                      Open →
                    </Link>
                  </td>
                </Row>
              ))}
            </DataTable>
          )}
        </Card>

        <Card tone="admin">
          <CardHeader title="Data quality" description="Registry gaps affect investigation quality." tone="admin" />
          <ul className="divide-y divide-[var(--border-subtle)] px-5 py-2 text-sm text-[var(--text-secondary)]">
            <li className="flex justify-between gap-3 py-2.5">
              <span>Assets without coordinates</span>
              <span className="tabular-nums font-semibold text-[var(--text-primary)]">
                {(assets.data ?? []).filter((asset) => !asset.location).length}
              </span>
            </li>
            <li className="flex justify-between gap-3 py-2.5">
              <span>Assets without a department</span>
              <span className="tabular-nums font-semibold text-[var(--text-primary)]">
                {(assets.data ?? []).filter((asset) => !asset.department_id).length}
              </span>
            </li>
            <li className="flex justify-between gap-3 py-2.5">
              <span>Contracts with no assets linked</span>
              <span className="tabular-nums font-semibold text-[var(--text-primary)]">
                {(contracts.data ?? []).filter((contract) => contract.asset_ids.length === 0).length}
              </span>
            </li>
            <li className="flex justify-between gap-3 py-2.5">
              <span>Investigations open</span>
              <span className="tabular-nums font-semibold text-[var(--text-primary)]">
                {(investigations.data ?? []).filter((item) => item.status !== "closed").length}
              </span>
            </li>
            <li className="flex justify-between gap-3 py-2.5">
              <span>Candidate events pending review</span>
              <span className="tabular-nums font-semibold text-[var(--text-primary)]">{analytics.data?.pending_candidates ?? 0}</span>
            </li>
          </ul>
        </Card>
      </div>

      <div className="mt-5">
        <Card tone="admin">
          <CardHeader
            title="Recent administrative actions"
            description="Consequential actions are audited and cannot be edited."
            tone="admin"
            actions={
              <Link href="/admin/audit-logs" className="text-xs font-medium text-[var(--accent-primary)] hover:underline">
                Full audit trail →
              </Link>
            }
          />
          {audit.loading ? (
            <LoadingRows tone="admin" />
          ) : (
            <DataTable tone="admin" head={["Action", "Entity", "Actor", "When"]} empty="No audit entries yet.">
              {(audit.data ?? []).map((entry) => (
                <Row key={entry.id} tone="admin">
                  <td className="px-4 py-3 font-mono text-xs text-[var(--text-primary)]">{entry.action}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                    {entry.entity_type}
                    {entry.entity_id ? ` · ${entry.entity_id.slice(0, 8)}` : ""}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{entry.actor_label ?? "system"}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{formatDateTime(entry.created_at)}</td>
                </Row>
              ))}
            </DataTable>
          )}
        </Card>
      </div>
    </>
  );
}
