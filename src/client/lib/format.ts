/**
 * Small display helpers.
 *
 * Everything here is a pure function over a value the API already returned —
 * nothing invents data, and nothing rounds a number into a friendlier lie.
 */

import type { CompetencyState } from "../../shared/schemas/attempt";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Vietnamese date, e.g. "24/10/2026". Locale tags come from Intl, not a CDN. */
export function formatDate(ms: number): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(ms);
}

export function formatDateTime(ms: number): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(ms);
}

/** "Cần ôn" phrase built from a real timestamp, never from a guess. */
export function formatDaysUntil(dueAt: number, nowMs: number): string {
  const days = Math.round((dueAt - nowMs) / DAY_MS);
  if (days <= 0) return "Đến hạn ôn";
  if (days === 1) return "Ôn vào ngày mai";
  return `Ôn sau ${days} ngày`;
}

/** Days late, floored at 0 — an overdue count must not become negative. */
export function daysBetween(fromMs: number, toMs: number): number {
  return Math.max(0, Math.floor(Math.abs(toMs - fromMs) / DAY_MS));
}

/**
 * "Quá hạn N ngày" from the API's own `daysOverdue`, with the date beside it so
 * the count is checkable. The number comes from the server, never recomputed.
 */
export function overdueLabel(daysOverdue: number, dueAt: number): string {
  const days = Math.max(0, Math.floor(daysOverdue));
  const date = formatDate(dueAt);
  if (days === 0) return `Đến hạn ${date}`;
  if (days === 1) return `Quá hạn 1 ngày (${date})`;
  return `Quá hạn ${days} ngày (${date})`;
}

/**
 * Vietnamese label for a competency state, with the glyph that keeps the state
 * readable without relying on colour.
 */
const STATE_LABELS: Record<CompetencyState, { label: string; glyph: string }> = {
  NOT_OBSERVED: { label: "Chưa quan sát được", glyph: "○" },
  SUPPORTED: { label: "Làm được khi có hỗ trợ", glyph: "◐" },
  INDEPENDENT: { label: "Tự làm được", glyph: "✓" },
  RETAINED: { label: "Nhớ được sau thời gian ôn", glyph: "✓" },
  TRANSFERRED: { label: "Áp dụng được vào tình huống mới", glyph: "✓" },
};

export function competencyLabel(state: CompetencyState): string {
  return STATE_LABELS[state].label;
}

export function competencyGlyph(state: CompetencyState): string {
  return STATE_LABELS[state].glyph;
}

/** Modifier class for the state pill, so colour is applied in one place. */
export function competencyClass(state: CompetencyState): string {
  switch (state) {
    case "TRANSFERRED":
    case "RETAINED":
      return "is-strong";
    case "INDEPENDENT":
      return "is-independent";
    case "SUPPORTED":
      return "is-supported";
    case "NOT_OBSERVED":
      return "is-unobserved";
  }
}
