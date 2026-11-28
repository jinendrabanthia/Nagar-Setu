"use client";

import { getMockResponse } from "@/lib/mockData";

/** Typed API client. Every call is same-origin (proxied by Next rewrites). */

export class ApiError extends Error {
  code: string;
  status: number;
  details: Array<{ field?: string | null; reason: string }>;

  constructor(
    code: string,
    status: number,
    message: string,
    details: Array<{ field?: string | null; reason: string }> = [],
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function baseHeaders(headers?: HeadersInit): Headers {
  const result = new Headers(headers);
  const csrf = readCookie("roadguard_csrf");
  if (csrf && !result.has("x-csrf-token")) result.set("x-csrf-token", csrf);
  return result;
}

async function refreshSession(): Promise<boolean> {
  try {
    const response = await fetch("/api/v1/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: baseHeaders(),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function request<T>(path: string, init: RequestInit = {}, allowRetry = true): Promise<T> {
  const isGet = !init.method || init.method.toUpperCase() === "GET";
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: "include",
      headers: baseHeaders(init.headers),
    });
  } catch {
    if (isGet) {
      const mock = getMockResponse(path);
      if (mock !== undefined) return mock as T;
    }
    throw new ApiError(
      "NETWORK_ERROR",
      0,
      "The API is unreachable. Check that the backend is running and retry.",
    );
  }

  const isAuthEndpoint = path.startsWith("/api/v1/auth/");
  if (response.status === 401 && allowRetry && !isAuthEndpoint) {
    const refreshed = await refreshSession();
    if (refreshed) return request<T>(path, init, false);
  }

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const envelope = body as
      | { error?: { code?: string; message?: string; details?: Array<{ field?: string | null; reason: string }> } }
      | null;

    // Only fall back to preview data when Next.js proxy fails to reach offline backend (no JSON error envelope)
    const isOfflineProxyFailure =
      isGet && response.status >= 500 && !envelope?.error;
    if (isOfflineProxyFailure) {
      const mock = getMockResponse(path);
      if (mock !== undefined) return mock as T;
    }

    throw new ApiError(
      envelope?.error?.code ?? "REQUEST_FAILED",
      response.status,
      envelope?.error?.message ?? `Request failed with status ${response.status}.`,
      envelope?.error?.details ?? [],
    );
  }
  if (body === null) return undefined as T;
  const envelope = body as { data?: T };
  return (envelope.data ?? (body as T)) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  form: <T>(path: string, form: FormData, method: "POST" | "PATCH" = "POST") =>
    request<T>(path, { method, body: form }),
  /** Upload a file straight to the private object store using the signed URL. */
  uploadObject: async (uploadUrl: string, file: File | Blob, contentType: string) => {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "content-type": contentType },
      body: file,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new ApiError(
        "UPLOAD_FAILED",
        response.status,
        text || "The file upload failed.",
      );
    }
  },
};
