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
  Select,
  StatusBadge,
} from "@/components/ui";
import { formatDateTime, humanise } from "@/lib/format";
import type { AdminUser, Department } from "@/lib/types";

export default function UsersPage() {
  const { has, meta } = useSession();
  const users = useApi<AdminUser[]>("/api/v1/users?limit=100");
  const departments = useApi<Department[]>("/api/v1/departments?limit=100");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!has("user:read") && !has("user:manage")) {
    return <PermissionNotice tone="admin" permission="user:manage" />;
  }

  const roles = meta?.roles ?? [];

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api.post<AdminUser>("/api/v1/users", {
        full_name: form.get("full_name"),
        email: form.get("email"),
        role: form.get("role"),
        department_id: form.get("department_id") || null,
        password: form.get("password"),
      });
      setOpen(false);
      setNotice("User created. They must change the initial password after signing in.");
      users.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the user.");
    } finally {
      setBusy(false);
    }
  }

  async function update(user: AdminUser, patch: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      await api.patch(`/api/v1/users/${user.id}`, patch);
      users.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update the user.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Users and roles"
        description="Roles are assigned here, on the server. A user can never choose their own role or organization at sign-in."
        tone="admin"
        actions={
          has("user:manage") ? (
            <Button tone="admin" onClick={() => setOpen((value) => !value)}>
              {open ? "Close" : "Invite user"}
            </Button>
          ) : null
        }
      />

      {notice ? <AlertBanner kind="success">{notice}</AlertBanner> : null}
      {error ? <AlertBanner kind="danger">{error}</AlertBanner> : null}

      {open ? (
        <Card tone="admin" className="mb-5">
          <CardHeader title="New user" tone="admin" />
          <form onSubmit={create} className="grid gap-4 px-5 py-4 sm:grid-cols-2">
            <Field label="Full name" tone="admin" htmlFor="full_name">
              <Input tone="admin" id="full_name" name="full_name" required minLength={2} />
            </Field>
            <Field label="Email" tone="admin" htmlFor="email">
              <Input tone="admin" id="email" name="email" type="email" required />
            </Field>
            <Field label="Role" tone="admin" htmlFor="role" hint="Permissions come from the role map on the server.">
              <Select id="role" name="role" required>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {humanise(role)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Department (optional)" tone="admin" htmlFor="department_id">
              <Select id="department_id" name="department_id">
                <option value="">None</option>
                {(departments.data ?? []).map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Initial password" tone="admin" htmlFor="password" hint="Minimum 12 characters. Share it out-of-band.">
              <Input tone="admin" id="password" name="password" type="password" required minLength={12} />
            </Field>
            <div className="sm:col-span-2">
              <Button tone="admin" type="submit" disabled={busy}>
                {busy ? "Saving…" : "Create user"}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card tone="admin">
        <CardHeader title="All users" tone="admin" />
        {users.loading ? (
          <LoadingRows tone="admin" />
        ) : users.error ? (
          <ErrorState tone="admin" message={users.error} onRetry={users.reload} />
        ) : (
          <DataTable tone="admin" head={["Name", "Email", "Role", "Department", "State", "Last sign-in", ""]} empty="No users recorded.">
            {(users.data ?? []).map((user) => (
              <Row key={user.id} tone="admin">
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{user.full_name}</td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{user.email}</td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{humanise(user.role)}</td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                  {departments.data?.find((department) => department.id === user.department_id)?.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={user.is_active ? "active" : "offline"} label={user.is_active ? "Active" : "Disabled"} />
                </td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{formatDateTime(user.last_login_at)}</td>
                <td className="px-4 py-3 text-right">
                  {has("user:manage") ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-[var(--accent-primary)] hover:underline"
                      disabled={busy}
                      onClick={() => void update(user, { is_active: !user.is_active })}
                    >
                      {user.is_active ? "Disable" : "Enable"}
                    </button>
                  ) : null}
                </td>
              </Row>
            ))}
          </DataTable>
        )}
      </Card>
    </>
  );
}
