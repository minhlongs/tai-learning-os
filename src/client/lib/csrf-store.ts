/**
 * The CSRF token lives outside React state so any fetch (including one fired
 * from a plain helper before React has rendered) can read it.
 *
 * The Worker binds the header to the session's token id, so the value only ever
 * comes from a `/api/session*` response. It is never stored in localStorage:
 * sessionStorage survives a reload but not a new tab, which matches the cookie.
 */

let token: string | null = null;

export function setCsrfToken(next: string | null): void {
  token = next;
}

export function readCsrfToken(): string | null {
  return token;
}

export function clearCsrfToken(): void {
  token = null;
}
