/**
 * Active learner selection store.
 *
 * When a parent manages more than one child, this store holds the currently
 * selected learner ID so `lib/api.ts` can attach `x-tlo-learner-id` on every
 * request without threading it through every component prop.
 *
 * Authorization remains server-enforced: the Worker verifies that the requested
 * learner ID belongs to the authenticated parent (`learners.parent_id`).
 */

const STORAGE_KEY = "tlo_active_learner_id";
let memoryLearnerId: string | null = null;

export function readActiveLearnerId(): string | null {
  if (memoryLearnerId) return memoryLearnerId;
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage?.getItem(STORAGE_KEY);
    if (stored && stored.trim().length > 0) {
      memoryLearnerId = stored.trim();
      return memoryLearnerId;
    }
  } catch {
    // Ignore storage access errors in restricted environments
  }
  return null;
}

export function setActiveLearnerId(id: string | null): void {
  const normalized = id && id.trim().length > 0 ? id.trim() : null;
  memoryLearnerId = normalized;
  if (typeof window === "undefined") return;
  try {
    if (normalized) {
      window.localStorage?.setItem(STORAGE_KEY, normalized);
    } else {
      window.localStorage?.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage access errors
  }
}

export function clearActiveLearnerId(): void {
  setActiveLearnerId(null);
}
