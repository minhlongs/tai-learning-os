/**
 * Typed fetch wrapper for the frozen API contract.
 *
 * Rules enforced here so no screen has to remember them:
 *   - responses are parsed into a discriminated result, never thrown;
 *   - a 401 redirects to /login once, and the caller sees `unauthorized`;
 *   - mutating requests carry the `x-tlo-csrf` token from the session.
 */

import type { ApiError } from "../../shared/api-contract";
import { readActiveLearnerId } from "./active-learner-store";
import { readCsrfToken } from "./csrf-store";

/** A response we could read: either the server's error body or transport failure. */
export type ApiFailure =
  | { kind: "api"; status: number; error: ApiError }
  | { kind: "network"; message: string }
  | { kind: "unauthorized"; message: string };

export type ApiResult<T> = { ok: true; value: T } | { ok: false; failure: ApiFailure };

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Read a JSON body, treating an unreadable body as a transport failure. */
async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length === 0) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function isApiError(value: unknown): value is ApiError {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ApiError>;
  return typeof candidate.messageVi === "string" && typeof candidate.error === "string";
}

/** 401 is a session problem, not an error to render inline. */
function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  window.location.assign("/login");
}

async function request<T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const bodyLearnerId =
    typeof body === "object" &&
    body !== null &&
    !Array.isArray(body) &&
    typeof (body as { learnerId?: unknown }).learnerId === "string" &&
    (body as { learnerId: string }).learnerId.trim().length > 0
      ? (body as { learnerId: string }).learnerId.trim()
      : null;
  const activeLearnerId = bodyLearnerId ?? readActiveLearnerId();
  if (activeLearnerId) {
    headers["x-tlo-learner-id"] = activeLearnerId;
  }
  if (MUTATING.has(method)) {
    const token = readCsrfToken();
    if (token) headers["x-tlo-csrf"] = token;
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers,
      credentials: "same-origin",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return { ok: false, failure: { kind: "network", message: "Không kết nối được tới máy chủ." } };
  }

  const payload = await readJson(response);

  if (response.status === 401) {
    redirectToLogin();
    return { ok: false, failure: { kind: "unauthorized", message: "Phiên đăng nhập đã hết." } };
  }

  if (!response.ok) {
    const error: ApiError = isApiError(payload)
      ? payload
      : {
          error: "http_error",
          messageVi: "Máy chủ không trả về dữ liệu hợp lệ.",
          code: "server_error",
        };
    return { ok: false, failure: { kind: "api", status: response.status, error } };
  }

  return { ok: true, value: payload as T };
}

/** The typed surface. Paths are relative to `/api`. */
export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  del: <T>(path: string, body?: unknown) => request<T>("DELETE", path, body),
};

/** A message the parent can read, whatever the failure was. */
export function failureMessage(failure: ApiFailure): string {
  switch (failure.kind) {
    case "api":
      return failure.error.messageVi;
    case "network":
      return failure.message;
    case "unauthorized":
      return failure.message;
  }
}
