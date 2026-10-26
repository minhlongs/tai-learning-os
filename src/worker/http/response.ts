/**
 * HTTP helpers: response construction, error shape, CSRF and CORS.
 *
 * Error responses are deliberately uniform and carry a Vietnamese message the
 * parent can read. They never include a stack trace, a SQL fragment, or an
 * internal identifier.
 */

import type { ApiError } from "../../shared/api-contract";

const JSON_HEADERS: Record<string, string> = {
  "content-type": "application/json; charset=utf-8",
  // The app is same-origin. Deny framing entirely: there is no reason for this
  // child-facing application to ever be embedded.
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  // No telemetry, no CDN. This app talks only to its own origin.
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
};

export function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

export function ok<T>(body: T): Response {
  return json(body, 200);
}

export function created<T>(body: T, location?: string): Response {
  return json(body, 201, location ? { location } : {});
}

export function noContent(): Response {
  return new Response(null, { status: 204, headers: JSON_HEADERS });
}

/** Uniform error. `messageVi` is user-facing; `detail` is server-log-only. */
export function apiError(
  code: ApiError["code"],
  messageVi: string,
  status: number,
): Response {
  const body: ApiError = { error: code, messageVi, code };
  return json(body, status);
}

export const unauthorized = (): Response =>
  apiError("unauthorized", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", 401);

export const forbidden = (msg = "Bạn không có quyền thực hiện thao tác này."): Response =>
  apiError("forbidden", msg, 403);

export const notFound = (msg = "Không tìm thấy dữ liệu cần thiết."): Response =>
  apiError("not_found", msg, 404);

export const badRequest = (msg: string): Response =>
  apiError("bad_request", msg, 400);

/** The request is well-formed but collides with state that already exists. */
export const conflict = (msg: string): Response => apiError("conflict", msg, 409);

export const rateLimited = (retryAfterSec?: number): Response => {
  const msg = retryAfterSec
    ? `Thử lại quá nhiều lần. Vui lòng chờ khoảng ${Math.max(1, Math.ceil(retryAfterSec / 60))} phút rồi thử lại.`
    : "Thử lại quá nhiều lần. Vui lòng chờ một lát.";
  const body: ApiError = { error: "rate_limited", messageVi: msg, code: "rate_limited" };
  return json(
    body,
    429,
    retryAfterSec ? { "retry-after": String(retryAfterSec) } : {},
  );
};

export const serverError = (): Response =>
  apiError("server_error", "Đã có lỗi hệ thống. Vui lòng thử lại.", 500);

/**
 * Reject requests that cannot be JSON, or that hide a payload where none is
 * expected. Cheap input validation before any handler logic runs.
 */
export async function readJsonBody(request: Request, maxBytes = 64_000): Promise<
  { ok: true; body: unknown } | { ok: false; response: Response }
> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return { ok: false, response: badRequest("Nội dung gửi lên phải là JSON.") };
  }
  const declaredLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { ok: false, response: badRequest("Dữ liệu gửi lên quá lớn.") };
  }
  try {
    const text = await request.text();
    if (text.length > maxBytes) {
      return { ok: false, response: badRequest("Dữ liệu gửi lên quá lớn.") };
    }
    return { ok: true, body: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, response: badRequest("Dữ liệu JSON không hợp lệ.") };
  }
}

/**
 * Double-submit CSRF check, bound to the session token id.
 * The cookie itself is SameSite=Strict, which already blocks cross-site
 * requests; this adds a check that a same-site POST originated from our code.
 */
export function csrfOk(headerValue: string | null, expectedToken: string | null): boolean {
  if (!expectedToken) return false; // fail closed
  if (!headerValue) return false;
  return headerValue === expectedToken;
}
