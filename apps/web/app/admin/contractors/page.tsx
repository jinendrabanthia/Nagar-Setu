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
} from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import type { Contractor } from "@/lib/types";

export default function ContractorsPage() {
  const { has } = useSession();
  const contractors = useApi<Contractor[]>("/api/v1/contractors?limit=100");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!has("registry:read") && !has("contractor:read")) {
    return <PermissionNotice tone="admin" permission="contractor:read" />;
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await api.post<Contractor>("/api/v1/contractors", {
        name: form.get("name"),
        registration_number: form.get("registration_number"),
        contact_email: form.get("contact_email") || null,
        contact_phone: form.get("contact_phone") || null,
        source_reference: form.get("source_reference") || null,
      });
      setOpen(false);
      contractors.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the contractor.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Contractors"
        description="Registered contractors referenced by maintenance contracts. A contractor match is a record match, never an assignment of blame."
        tone="admin"
        actions={
          has("registry:manage") || has("contractor:manage") ? (
            <Button tone="admin" onClick={() => setOpen((value) => !value)}>
              {open ? "Close" : "Add contractor"}
            </Button>
          ) : null
        }
      />

      {error ? <AlertBanner kind="danger">{error}</AlertBanner> : null}

      {open ? (
        <Card tone="admin" className="mb-5">
          <CardHeader title="New contractor" tone="admin" />
          <form onSubmit={create} className="grid gap-4 px-5 py-4 sm:grid-cols-2">
            <Field label="Name" tone="admin" htmlFor="name">
              <Input tone="admin" id="name" name="name" required minLength={2} />
            </Field>
            <Field label="Registration number" tone="admin" htmlFor="registration_number">
              <Input tone="admin" id="registration_number" name="registration_number" required minLength={2} />
            </Field>
            <Field label="Contact email" tone="admin" htmlFor="contact_email">
              <Input tone="admin" id="contact_email" name="contact_email" type="email" />
            </Field>
            <Field label="Contact phone" tone="admin" htmlFor="contact_phone">
              <Input tone="admin" id="contact_phone" name="contact_phone" />
            </Field>
            <Field label="Source reference" tone="admin" htmlFor="source_reference">
              <Input tone="admin" id="source_reference" name="source_reference" />
            </Field>
            <div className="sm:col-span-2">
              <Button tone="admin" type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save contractor"}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card tone="admin">
        <CardHeader title="All contractors" tone="admin" />
        {contractors.loading ? (
          <LoadingRows tone="admin" />
        ) : contractors.error ? (
          <ErrorState tone="admin" message={contractors.error} onRetry={contractors.reload} />
        ) : (
          <DataTable tone="admin" head={["Name", "Registration", "Contact", "Source", "Created", "Demo"]} empty="No contractors recorded.">
            {(contractors.data ?? []).map((contractor) => (
              <Row key={contractor.id} tone="admin">
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{contractor.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">{contractor.registration_number}</td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                  {contractor.contact_email ?? "—"}
                  {contractor.contact_phone ? ` · ${contractor.contact_phone}` : ""}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{contractor.source_reference ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{formatDateTime(contractor.created_at)}</td>
                <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{contractor.is_demo ? "DEMO" : "—"}</td>
              </Row>
            ))}
          </DataTable>
        )}
      </Card>
    </>
  );
}
