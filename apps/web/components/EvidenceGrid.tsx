"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { StatusBadge } from "@/components/ui";
import { formatBytes, formatSeconds, humanise } from "@/lib/format";
import type { Evidence } from "@/lib/types";

/**
 * Signed evidence URLs expire, so they are requested only when the reviewer opens an item.
 * Nothing is embedded from a public bucket: every artefact is fetched through the API.
 */
export function EvidenceGrid({ items }: { items: Evidence[] }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const entries = await Promise.all(
          items.map(async (item) => {
            const result = await api.get<{ url: string }>(`/api/v1/evidence/${item.id}/url`);
            return [item.id, result.url] as const;
          }),
        );
        if (!cancelled) setUrls(Object.fromEntries(entries));
      } catch (err) {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : "Evidence could not be loaded.");
      }
    }
    if (items.length) void load();
    return () => {
      cancelled = true;
    };
  }, [items]);

  if (!items.length) {
    return (
      <p className="px-5 py-6 text-sm text-[var(--text-muted)]">
        No evidence artefacts are attached to this record.
      </p>
    );
  }

  return (
    <div className="space-y-3 px-5 py-4">
      {error ? (
        <p className="text-sm" style={{ color: "var(--status-danger)" }}>
          {error}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const url = urls[item.id];
          const isImage = item.content_type.startsWith("image/");
          const isVideo = item.content_type.startsWith("video/");
          return (
            <div
              key={item.id}
              className="surface-data rounded-[12px] p-3.5"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {item.label ?? humanise(item.evidence_type)}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {item.content_type} · {formatBytes(item.file_size_bytes)}
                    {item.timestamp_in_video !== null
                      ? ` · ${formatSeconds(item.timestamp_in_video)}`
                      : ""}
                  </p>
                </div>
                <StatusBadge status="verified" label={humanise(item.evidence_type)} />
              </div>
              {url && isImage ? (
                opened === item.id ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={item.label ?? "Evidence frame"} className="w-full rounded-[8px]" />
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpened(item.id)}
                    className="text-xs font-medium text-[var(--accent-primary)] hover:underline"
                  >
                    Show frame
                  </button>
                )
              ) : null}
              {url && isVideo ? (
                <video controls src={url} className="w-full rounded-[8px]">
                  <track kind="captions" />
                </video>
              ) : null}
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block text-xs font-medium text-[var(--accent-primary)] hover:underline"
                >
                  Open in new tab (signed, short-lived)
                </a>
              ) : (
                <p className="text-xs text-[var(--text-muted)]">Preparing signed link…</p>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-[var(--text-muted)]">
        Evidence files carry a checksum recorded at creation time. Generated frames are synthetic
        demo artefacts, not evidential photography.
      </p>
    </div>
  );
}
