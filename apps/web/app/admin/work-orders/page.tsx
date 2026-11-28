"use client";

import Link from "next/link";
import { useSession } from "@/lib/session";
import { useApi } from "@/lib/useApi";
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
import { formatDate, formatDateTime, humanise } from "@/lib/format";
import type { WorkOrder } from "@/lib/types";

export default function WorkOrdersPage() {
  const { has } = useSession();
  const workOrders = useApi<WorkOrder[]>("/api/v1/work-orders?limit=100");

  if (!has("work_order:read")) return <PermissionNotice tone="admin" permission="work_order:read" />;

  const orders = workOrders.data ?? [];
  const awaiting = orders.filter((order) => order.status === "completed_pending_verification");
  const verified = orders.filter((order) => order.status === "verified");

  return (
    <>
      <PageHeader
        title="Corrective work orders"
        description="Work is completed by the responsible department, evidenced with files, then verified by a different user. Nobody can verify their own completion."
        tone="admin"
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <MetricCard tone="admin" label="Total" value={orders.length} hint="All work orders" />
        <MetricCard tone="admin" label="Awaiting verification" value={awaiting.length} hint="Evidence submitted" emphasis={awaiting.length ? "warn" : "default"} />
        <MetricCard tone="admin" label="Verified" value={verified.length} hint="Independently checked" emphasis="success" />
      </div>

      <Card tone="admin">
        <CardHeader title="All work orders" tone="admin" />
        {workOrders.loading ? (
          <LoadingRows tone="admin" />
        ) : workOrders.error ? (
          <ErrorState tone="admin" message={workOrders.error} onRetry={workOrders.reload} />
        ) : (
          <DataTable
            tone="admin"
            head={["WO", "Title", "Department", "Status", "Priority", "Due", "Completed", ""]}
            empty="No work orders yet."
          >
            {orders.map((order) => (
              <Row key={order.id} tone="admin">
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-primary)]">{order.work_order_number}</td>
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{order.title}</td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{order.department_name ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{humanise(order.priority)}</td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{formatDate(order.due_date)}</td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{formatDateTime(order.completed_at)}</td>
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
    </>
  );
}
