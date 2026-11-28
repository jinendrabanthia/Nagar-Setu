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

export default function InvestigationsPage() {
  const { has } = useSession();
  const investigations = useApi<Investigation[]>("/api/v1/investigations?limit=50");

  if (!has("investigation:read")) return <PermissionNotice tone="command" permission="investigation:read" />;

  return (
    <>
      <PageHeader
        title="Investigations"
        description="Each case links a reviewed observation to an infrastructure asset. Root causes stay hypotheses until a human corroborates them with records."
        tone="command"
      />
      <Card tone="command">
        <CardHeader title="Open cases" description="Ordered by most recently updated." tone="command" />
        {investigations.loading ? (
          <LoadingRows tone="command" />
        ) : investigations.error ? (
          <ErrorState tone="command" message={investigations.error} onRetry={investigations.reload} />
        ) : (
          <DataTable
            tone="command"
            head={["Case", "Title", "Status", "Responsibility", "Hypotheses", "Updated", ""]}
            empty="No investigations yet. Open one from a reviewed event."
          >
            {(investigations.data ?? []).map((investigation) => (
              <Row key={investigation.id} tone="command">
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">{investigation.case_number}</td>
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{investigation.title}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={investigation.status} />
                </td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                  {humanise(investigation.responsibility_status)}
                </td>
                <td className="px-4 py-3 tabular-nums text-[var(--text-primary)]">{investigation.hypotheses.length}</td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{formatDateTime(investigation.updated_at)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/command/investigations/${investigation.id}`} className="text-xs font-medium text-[var(--accent-primary)] hover:underline">
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
