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
  PageHeader,
  PermissionNotice,
  Row,
  StatusBadge,
} from "@/components/ui";
import { formatDateTime, humanise } from "@/lib/format";
import type { Investigation } from "@/lib/types";

export default function AdminInvestigationsPage() {
  const { has } = useSession();
  const investigations = useApi<Investigation[]>("/api/v1/investigations?limit=100");

  if (!has("investigation:read")) return <PermissionNotice tone="admin" permission="investigation:read" />;

  return (
    <>
      <PageHeader
        title="Case register"
        description="Administrative view of cases, their record match state and analysis source. Root causes remain hypotheses."
        tone="admin"
      />
      <Card tone="admin">
        <CardHeader title="All cases" tone="admin" />
        {investigations.loading ? (
          <LoadingRows tone="admin" />
        ) : investigations.error ? (
          <ErrorState tone="admin" message={investigations.error} onRetry={investigations.reload} />
        ) : (
          <DataTable
            tone="admin"
            head={["Case", "Title", "Status", "Record match", "Analysis", "Updated", ""]}
            empty="No cases recorded. Open one from a reviewed event in the Command Center."
          >
            {(investigations.data ?? []).map((investigation) => (
              <Row key={investigation.id} tone="admin">
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">{investigation.case_number}</td>
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{investigation.title}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={investigation.status} />
                </td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                  {humanise(investigation.responsibility_status)}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                  {investigation.analysis_source ?? "not drafted"}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{formatDateTime(investigation.updated_at)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/investigations/${investigation.id}`} className="text-xs font-medium text-[var(--accent-primary)] hover:underline">
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
