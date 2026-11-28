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
import { formatCoordinates, humanise } from "@/lib/format";
import type { Asset, Department } from "@/lib/types";

const ASSET_TYPES = [
  "road_segment",
  "intersection",
  "traffic_signal",
  "street_light",
  "pedestrian_crossing",
  "road_sign",
  "drainage",
  "other",
];

export default function AssetsPage() {
  const { has } = useSession();
  const assets = useApi<Asset[]>("/api/v1/assets?limit=100");
  const departments = useApi<Department[]>("/api/v1/departments?limit=100");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!has("registry:read") && !has("asset:read")) {
    return <PermissionNotice tone="admin" permission="asset:read" />;
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const latitude = form.get("latitude");
    const longitude = form.get("longitude");
    setBusy(true);
    setError(null);
    try {
      await api.post<Asset>("/api/v1/assets", {
        asset_code: form.get("asset_code"),
        name: form.get("name"),
        asset_type: form.get("asset_type"),
        address: form.get("address") || null,
        department_id: form.get("department_id") || null,
        location:
          latitude && longitude
            ? { latitude: Number(latitude), longitude: Number(longitude), quality: "surveyed" }
            : null,
        condition_status: form.get("condition_status"),
        source_reference: form.get("source_reference") || null,
      });
      setOpen(false);
      assets.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the asset.");
    } finally {
      setBusy(false);
    }
  }

  const departmentName = (id: string | null) =>
    id ? ((departments.data ?? []).find((department) => department.id === id)?.name ?? id.slice(0, 8)) : "—";

  return (
    <>
      <PageHeader
        title="Infrastructure assets"
        description="Assets are what an event is matched to. Coordinates are required for a spatial match; without them the investigation reports 'no asset match' instead of guessing."
        tone="admin"
        actions={
          has("registry:manage") || has("asset:manage") ? (
            <Button tone="admin" onClick={() => setOpen((value) => !value)}>
              {open ? "Close" : "Add asset"}
            </Button>
          ) : null
        }
      />

      {error ? <AlertBanner kind="danger">{error}</AlertBanner> : null}

      {open ? (
        <Card tone="admin" className="mb-5">
          <CardHeader title="New asset" tone="admin" />
          <form onSubmit={create} className="grid gap-4 px-5 py-4 sm:grid-cols-2">
            <Field label="Asset code" tone="admin" htmlFor="asset_code">
              <Input tone="admin" id="asset_code" name="asset_code" required minLength={2} />
            </Field>
            <Field label="Name" tone="admin" htmlFor="name">
              <Input tone="admin" id="name" name="name" required minLength={2} />
            </Field>
            <Field label="Asset type" tone="admin" htmlFor="asset_type">
              <Select id="asset_type" name="asset_type">
                {ASSET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {humanise(type)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Owning department" tone="admin" htmlFor="department_id">
              <Select id="department_id" name="department_id">
                <option value="">Unassigned</option>
                {(departments.data ?? []).map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Address" tone="admin" htmlFor="address">
              <Input tone="admin" id="address" name="address" />
            </Field>
            <Field label="Condition" tone="admin" htmlFor="condition_status">
              <Select id="condition_status" name="condition_status">
                <option value="unknown">Unknown</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </Select>
            </Field>
            <Field label="Latitude" tone="admin" htmlFor="latitude" hint="Optional; needed for spatial matching.">
              <Input tone="admin" id="latitude" name="latitude" type="number" step="0.00001" />
            </Field>
            <Field label="Longitude" tone="admin" htmlFor="longitude">
              <Input tone="admin" id="longitude" name="longitude" type="number" step="0.00001" />
            </Field>
            <div className="sm:col-span-2">
              <Button tone="admin" type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save asset"}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card tone="admin">
        <CardHeader title="All assets" tone="admin" />
        {assets.loading ? (
          <LoadingRows tone="admin" />
        ) : assets.error ? (
          <ErrorState tone="admin" message={assets.error} onRetry={assets.reload} />
        ) : (
          <DataTable
            tone="admin"
            head={["Code", "Name", "Type", "Department", "Condition", "Location", "Demo"]}
            empty="No assets recorded."
          >
            {(assets.data ?? []).map((asset) => (
              <Row key={asset.id} tone="admin">
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-primary)]">{asset.asset_code}</td>
                <td className="px-4 py-3 text-[var(--text-primary)]">
                  <span className="font-medium">{asset.name}</span>
                  {asset.address ? <span className="block text-xs text-[var(--text-muted)]">{asset.address}</span> : null}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{humanise(asset.asset_type)}</td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{departmentName(asset.department_id)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={asset.condition_status} />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">
                  {formatCoordinates(asset.location?.latitude, asset.location?.longitude)}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{asset.is_demo ? "DEMO" : "—"}</td>
              </Row>
            ))}
          </DataTable>
        )}
      </Card>
    </>
  );
}
