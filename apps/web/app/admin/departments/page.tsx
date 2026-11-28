"use client";

import { useState } from "react";
import { useSession } from "@/lib/session";
import { useApi } from "@/lib/useApi";
import { api, ApiError } from "@/lib/api";
import {
  AlertBanner,
  Button,
  Card,
  CardHeader,
  DataTable,
  ErrorState,
  Field,
  Input,
  LoadingRows,
  PageHeader,
  PermissionNotice,
  Row,
  Textarea,
} from "@/components/ui";
import { formatDateTime, humanise } from "@/lib/format";
import type { Department } from "@/lib/types";

export default function DepartmentsPage() {
  const { has } = useSession();
  const departments = useApi<Department[]>("/api/v1/departments?limit=100");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!has("registry:read") && !has("department:read")) {
    return <PermissionNotice tone="admin" permission="department:read" />;
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await api.post<Department>("/api/v1/departments", {
        name: form.get("name"),
        department_type: form.get("department_type"),
        contact_email: form.get("contact_email") || null,
        description: form.get("description") || null,
        source_reference: form.get("source_reference") || null,
      });
      setOpen(false);
      departments.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the department.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Departments"
        description="Owning authorities for infrastructure assets. Contract lookup depends on this registry being accurate."
        tone="admin"
        actions={
          has("registry:manage") || has("department:manage") ? (
            <Button tone="admin" onClick={() => setOpen((value) => !value)}>
              {open ? "Close" : "Add department"}
            </Button>
          ) : null
        }
      />

      {error ? <AlertBanner kind="danger">{error}</AlertBanner> : null}

      {open ? (
        <Card tone="admin" className="mb-5">
          <CardHeader title="New department" tone="admin" />
          <form onSubmit={create} className="grid gap-4 px-5 py-4 sm:grid-cols-2">
            <Field label="Name" tone="admin" htmlFor="name">
              <Input tone="admin" id="name" name="name" required minLength={2} />
            </Field>
            <Field label="Type" tone="admin" htmlFor="department_type" hint="e.g. roads, police, municipal">
              <Input tone="admin" id="department_type" name="department_type" required minLength={2} defaultValue="roads" />
            </Field>
            <Field label="Contact email" tone="admin" htmlFor="contact_email">
              <Input tone="admin" id="contact_email" name="contact_email" type="email" />
            </Field>
            <Field label="Source reference" tone="admin" htmlFor="source_reference" hint="Record of where this entry came from.">
              <Input tone="admin" id="source_reference" name="source_reference" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description" tone="admin" htmlFor="description">
                <Textarea tone="admin" id="description" name="description" rows={2} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Button tone="admin" type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save department"}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card tone="admin">
        <CardHeader title="All departments" tone="admin" />
        {departments.loading ? (
          <LoadingRows tone="admin" />
        ) : departments.error ? (
          <ErrorState tone="admin" message={departments.error} onRetry={departments.reload} />
        ) : (
          <DataTable tone="admin" head={["Name", "Type", "Contact", "Source", "Created", "Demo"]} empty="No departments recorded.">
            {(departments.data ?? []).map((department) => (
              <Row key={department.id} tone="admin">
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{department.name}</td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{humanise(department.department_type)}</td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{department.contact_email ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{department.source_reference ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{formatDateTime(department.created_at)}</td>
                <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{department.is_demo ? "DEMO" : "—"}</td>
              </Row>
            ))}
          </DataTable>
        )}
      </Card>
    </>
  );
}
