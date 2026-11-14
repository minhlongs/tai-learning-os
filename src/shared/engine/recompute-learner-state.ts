/**
 * Full-ledger deterministic state recomputation (Gate G6 & Layer 2/3/4).
 *
 * Given a learner's append-only official attempts, the set of transfer step IDs,
 * and optional parent-correction floors, deterministically reconstructs every
 * skill's `CompetencyDerivation`, FSRS `ReviewDecision`, and `SkillEstimate`
 * strictly from chronological history — replaying scheduled `dueAt` boundaries
 * step by step so `isReview` and scheduled-review first-try unlocks match the
 * live write path bit-for-bit.
 */

import type { CompetencyState, EvidenceKind, SubmissionOutcome } from "../schemas/attempt";
import {
  COMPETENCY_STATE_RANKS,
  deriveCompetency,
  type AttemptEvidence,
  type CompetencyDerivation,
} from "./competency";
import {
  computeEstimate,
  scheduleReview,
  type ReviewDecision,
  type SkillEstimate,
} from "./review";

export const LEARNER_RULE_ENGINE_VERSION = "tai-mastery-v2-cross-session-fsrs6";

export type RawLedgerAttempt = {
  id: string;
  sessionId: string;
  stepId: string;
  skillId: string | null;
  outcome: SubmissionOutcome;
  helpLevel: number;
  evidenceKind: EvidenceKind;
  attemptNo: number;
  purpose?: "official" | "practice";
  createdAt: number;
};

export type ParentFloorRecord = {
  id: string;
  skillId: string;
  state: CompetencyState;
  correctionNote: string | null;
  updatedAt: number;
};

export type RecomputedSkillState = {
  skillId: string;
  derivation: CompetencyDerivation;
  source: "derived" | "parent_correction";
  correctionNote: string | null;
  review: ReviewDecision | null;
  estimate: SkillEstimate | null;
};

export type RecomputedLearnerState = {
  learnerId: string;
  ruleEngineVersion: string;
  skills: ReadonlyMap<string, RecomputedSkillState>;
};

/**
 * Determine whether an attempt on `stepId` in `sessionId` at `createdAt` is an
 * eligible unassisted first-try attempt inside a scheduled-review session
 * (`priorDue !== null && createdAt >= priorDue`), even when `attemptNo > 1` on
 * the step from an earlier pre-review session.
 *
 * Anti-brute-force (Gate A2) stays intact:
 *   - Before `priorDue` (or when `priorDue === null`), any second attempt on the
 *     same `stepId` across sessions remains `assisted`.
 *   - Within the SAME `sessionId`, only the very first attempt on `stepId` can
 *     ever be independent.
 *   - Any hint (`helpLevel > 0`) or stored `evidenceKind !== "observed"` (unless
 *     specifically unlocked by scheduled review with 0 session hints) is `assisted`.
 */
export function isScheduledReviewFirstTryIndependent(input: {
  outcome: SubmissionOutcome;
  helpLevel: number;
  priorDueAt: number | null;
  createdAt: number;
  priorSameSessionStepAttempts: number;
  purpose: "official" | "practice";
}): boolean {
  if (input.purpose !== "official") return false;
  if (input.outcome !== "correct") return false;
  if (input.helpLevel !== 0) return false;
  if (input.priorDueAt === null || input.createdAt < input.priorDueAt) return false;
  if (input.priorSameSessionStepAttempts > 0) return false;
  return true;
}

/**
 * Replay chronological scheduled-review `dueAt` boundaries for a single skill's
 * official ledger rows, normalizing eligible due scheduled-review first-try
 * `observed` solves to `attemptNo: 1` so every reader (`session-service`,
 * `finalizeSession`, `recordParentCorrection`, `retention-queries`, and
 * `recomputeLearnerState`) applies the exact same Gate G6 rule.
 */
export function replaySkillAttemptEvidence(input: {
  skillId: string;
  attempts: readonly RawLedgerAttempt[];
  transferStepIds: ReadonlySet<string>;
}): AttemptEvidence[] {
  const ordered = [...input.attempts].sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
    return a.id.localeCompare(b.id);
  });

  const learnerEvidence: AttemptEvidence[] = [];
  let priorDueAt: number | null = null;
  const seenSessionSteps = new Map<string, number>();

  for (const raw of ordered) {
    if ((raw.purpose ?? "official") !== "official") continue;
    if (raw.evidenceKind === "parent_correction") continue;

    const sessionStepKey = `${raw.sessionId}::${raw.stepId}`;
    const priorSameSessionStepAttempts = seenSessionSteps.get(sessionStepKey) ?? 0;
    seenSessionSteps.set(sessionStepKey, priorSameSessionStepAttempts + 1);

    const isReview = priorDueAt !== null && raw.createdAt >= priorDueAt;
    const reviewFirstTryUnlock = isScheduledReviewFirstTryIndependent({
      outcome: raw.outcome,
      helpLevel: raw.helpLevel,
      priorDueAt,
      createdAt: raw.createdAt,
      priorSameSessionStepAttempts,
      purpose: raw.purpose ?? "official",
    });

    const effectiveAttemptNo =
      raw.evidenceKind === "observed" && (isReview || reviewFirstTryUnlock) && priorSameSessionStepAttempts === 0
        ? 1
        : raw.attemptNo;

    const ev: AttemptEvidence = {
      attemptId: raw.id,
      sessionId: raw.sessionId,
      skillId: input.skillId,
      outcome: raw.outcome,
      helpLevel: raw.helpLevel,
      evidenceKind: raw.evidenceKind,
      attemptNo: effectiveAttemptNo,
      isTransfer: input.transferStepIds.has(raw.stepId) && raw.outcome === "correct",
      isReview,
      createdAt: raw.createdAt,
    };
    learnerEvidence.push(ev);

    const stepDecision = scheduleReview(learnerEvidence, raw.createdAt);
    if (stepDecision) {
      priorDueAt = stepDecision.dueAt;
    }
  }

  return learnerEvidence;
}

/**
 * Deterministically recompute every skill's derived state, schedule, and FSRS
 * memory estimate from raw ledger rows.
 */
export function recomputeLearnerState(input: {
  learnerId: string;
  attempts: readonly RawLedgerAttempt[];
  transferStepIds: ReadonlySet<string>;
  parentCorrections?: readonly ParentFloorRecord[];
  ruleEngineVersion?: string;
}): RecomputedLearnerState {
  const officialBySkill = new Map<string, RawLedgerAttempt[]>();

  const ordered = [...input.attempts].sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
    return a.id.localeCompare(b.id);
  });

  for (const row of ordered) {
    if (!row.skillId) continue;
    if ((row.purpose ?? "official") !== "official") continue;
    if (row.evidenceKind === "parent_correction") continue;
    const bucket = officialBySkill.get(row.skillId) ?? [];
    bucket.push(row);
    officialBySkill.set(row.skillId, bucket);
  }

  const floorBySkill = new Map<string, ParentFloorRecord>();
  for (const corr of input.parentCorrections ?? []) {
    const existing = floorBySkill.get(corr.skillId);
    if (!existing || corr.updatedAt >= existing.updatedAt) {
      floorBySkill.set(corr.skillId, corr);
    }
  }

  const allSkillIds = new Set<string>([
    ...officialBySkill.keys(),
    ...floorBySkill.keys(),
  ]);

  const skills = new Map<string, RecomputedSkillState>();

  for (const skillId of [...allSkillIds].sort()) {
    const rawSkillAttempts = officialBySkill.get(skillId) ?? [];
    const learnerEvidence = replaySkillAttemptEvidence({
      skillId,
      attempts: rawSkillAttempts,
      transferStepIds: input.transferStepIds,
    });

    const fullEvidence: AttemptEvidence[] = [...learnerEvidence];
    const floor = floorBySkill.get(skillId);
    if (floor) {
      fullEvidence.push({
        attemptId: `correction-${floor.id}`,
        sessionId: `correction-${floor.id}`,
        skillId,
        outcome: "correct",
        helpLevel: 0,
        evidenceKind: "parent_correction",
        attemptNo: 1,
        isTransfer: false,
        isReview: false,
        createdAt: floor.updatedAt,
        correctedState: floor.state,
      });
    }

    const derivation = deriveCompetency(fullEvidence);
    const isStillFloored =
      floor !== undefined &&
      COMPETENCY_STATE_RANKS[derivation.state] <= COMPETENCY_STATE_RANKS[floor.state];

    const lastInstant = learnerEvidence.at(-1)?.createdAt ?? floor?.updatedAt ?? 0;
    const review =
      learnerEvidence.length > 0 ? scheduleReview(learnerEvidence, lastInstant) : null;
    const estimate =
      learnerEvidence.length > 0 ? computeEstimate(learnerEvidence, lastInstant) : null;

    skills.set(skillId, {
      skillId,
      derivation,
      source: isStillFloored ? "parent_correction" : "derived",
      correctionNote: isStillFloored ? (floor?.correctionNote ?? null) : null,
      review,
      estimate,
    });
  }

  return {
    learnerId: input.learnerId,
    ruleEngineVersion: input.ruleEngineVersion ?? LEARNER_RULE_ENGINE_VERSION,
    skills,
  };
}
