/**
 * Formats the active learner's display nickname for parent-facing Vietnamese UI
 * copy, falling back to a neutral term when no learner profile is selected yet.
 */
import type { SessionInfo } from "../../shared/api-contract";

export function activeLearnerLabelVi(
  session: Pick<SessionInfo, "learner">,
  fallback = "con",
): string {
  const trimmed = session.learner?.nickname.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}
