/**
 * Four-week learning planner & baseline assessment evaluation engine.
 *
 * Deterministic, evidence-based, transparent, and parent-auditable.
 *
 * Principles:
 * 1. Prioritize prerequisite gaps discovered in baseline assessments or session attempts.
 * 2. Interleave spaced retrieval practice (review intervals: 1, 3, 7, 14 days).
 * 3. Respect configurable weekly workload (default 3 sessions/week, ~20 mins).
 * 4. Transparent provenance labels (GDPT 2018, parent textbook, original supplemental, unverified assumption).
 * 5. Allow parent full editing/rescheduling/skipping authority.
 */

import type { ApprovalStatus, CompetencyState } from "../schemas/attempt";

export type ProvenanceLabel =
  | "gdpt_2018_objective"
  | "parent_textbook"
  | "original_supplemental"
  | "unverified_assumption";

export interface PlannerConfig {
  sessionsPerWeek: number;
  sessionDurationMinutes: number;
  totalWeeks: number;
}

export const DEFAULT_PLANNER_CONFIG: PlannerConfig = {
  sessionsPerWeek: 3,
  sessionDurationMinutes: 20,
  totalWeeks: 4,
};

export interface SkillCandidate {
  id: string;
  subjectId: string;
  code: string;
  nameVi: string;
  competencyState: CompetencyState;
  prerequisiteSkillIds: string[];
  dueForReview: boolean;
  needsObservation: boolean;
  suggestedLessonId: string | null;
  lessonTitleVi: string | null;
  expectedDurationMinutes: number;
  provenance: ProvenanceLabel;
}

export interface GeneratedPlanSlot {
  weekIndex: number; // 1..4
  dayOfWeek: number; // 1 (Mon) .. 7 (Sun)
  subjectId: string;
  skillId: string | null;
  lessonId: string | null;
  itemKind: "lesson" | "review" | "baseline";
  durationMinutes: number;
  reasonVi: string;
}

/**
 * Generate a deterministic 4-week learning plan based on learner evidence,
 * curriculum intake goals, and review schedules.
 */
export function generateFourWeekPlan(
  candidates: readonly SkillCandidate[],
  config: PlannerConfig = DEFAULT_PLANNER_CONFIG,
): GeneratedPlanSlot[] {
  const slots: GeneratedPlanSlot[] = [];
  const daysPattern = config.sessionsPerWeek === 3 ? [2, 4, 6] : [2, 3, 5]; // Mon=2, Wed=4, Fri=6 or similar

  // Partition candidates:
  // 1. Due for review (highest retention priority)
  // 2. Prerequisite gaps (skills needed by others that are NOT_OBSERVED or SUPPORTED)
  // 3. Needs observation (from baseline assessments)
  // 4. Regular progression
  const reviewQueue = candidates.filter((c) => c.dueForReview);
  const reviewIds = new Set(reviewQueue.map((c) => c.id));
  const gapQueue = candidates.filter(
    (c) =>
      !reviewIds.has(c.id) &&
      (c.competencyState === "SUPPORTED" || c.competencyState === "NOT_OBSERVED") &&
      c.prerequisiteSkillIds.length === 0,
  );
  const gapIds = new Set(gapQueue.map((c) => c.id));
  const observationQueue = candidates.filter(
    (c) => c.needsObservation && !reviewIds.has(c.id) && !gapIds.has(c.id),
  );
  const observationIds = new Set(observationQueue.map((c) => c.id));
  const generalQueue = candidates.filter(
    (c) =>
      !reviewIds.has(c.id) &&
      !gapIds.has(c.id) &&
      !observationIds.has(c.id) &&
      c.competencyState !== "TRANSFERRED",
  );

  let currentWeek = 1;
  let currentDayIdx = 0;

  function pushSlot(slot: Omit<GeneratedPlanSlot, "weekIndex" | "dayOfWeek">) {
    if (currentWeek > config.totalWeeks) return;
    const dayOfWeek = daysPattern[currentDayIdx % daysPattern.length] ?? 2;
    slots.push({
      ...slot,
      weekIndex: currentWeek,
      dayOfWeek,
    });
    currentDayIdx += 1;
    if (currentDayIdx >= config.sessionsPerWeek) {
      currentDayIdx = 0;
      currentWeek += 1;
    }
  }

  // Interleave reviews first
  for (const item of reviewQueue) {
    if (currentWeek > config.totalWeeks) break;
    pushSlot({
      subjectId: item.subjectId,
      skillId: item.id,
      lessonId: item.suggestedLessonId,
      itemKind: "review",
      durationMinutes: Math.min(item.expectedDurationMinutes, config.sessionDurationMinutes),
      reasonVi: `Ôn tập cách quãng củng cố kỹ năng "${item.nameVi}" đã học.`,
    });
  }

  // Prerequisite gaps next
  for (const item of gapQueue) {
    if (currentWeek > config.totalWeeks) break;
    pushSlot({
      subjectId: item.subjectId,
      skillId: item.id,
      lessonId: item.suggestedLessonId,
      itemKind: "lesson",
      durationMinutes: Math.min(item.expectedDurationMinutes, config.sessionDurationMinutes),
      reasonVi: `Bổ sung kỹ năng nền tảng "${item.nameVi}" đang cần hỗ trợ.`,
    });
  }

  // Baseline observations next
  for (const item of observationQueue) {
    if (currentWeek > config.totalWeeks) break;
    pushSlot({
      subjectId: item.subjectId,
      skillId: item.id,
      lessonId: item.suggestedLessonId,
      itemKind: "lesson",
      durationMinutes: Math.min(item.expectedDurationMinutes, config.sessionDurationMinutes),
      reasonVi: `Quan sát thêm qua bài học "${item.lessonTitleVi ?? item.nameVi}" theo kết quả khảo sát đầu vào.`,
    });
  }

  // Fill remainder with general progression
  for (const item of generalQueue) {
    if (currentWeek > config.totalWeeks) break;
    pushSlot({
      subjectId: item.subjectId,
      skillId: item.id,
      lessonId: item.suggestedLessonId,
      itemKind: "lesson",
      durationMinutes: Math.min(item.expectedDurationMinutes, config.sessionDurationMinutes),
      reasonVi: `Tiến độ học tập chuẩn GDPT 2018 cho kỹ năng "${item.nameVi}".`,
    });
  }

  return slots;
}

export interface BaselineDiagnosticInput {
  learnerId: string;
  subjectId: string;
  attempts: {
    stepId: string;
    stepPosition: number;
    kind: string;
    outcome: "correct" | "incorrect" | "partial";
    helpLevel: number;
    attemptNo: number;
    skillId: string | null;
  }[];
}

export interface BaselineDiagnosticResult {
  observedSummaryVi: string;
  supportedSummaryVi: string;
  needsObservation: string[];
  suggestedLessons: string[];
  parentReviewRequired: boolean;
}

/**
 * Evaluates baseline diagnostic assessment attempts to produce an actionable,
 * low-pressure baseline profile for the parent.
 */
export function evaluateBaselineDiagnostic(
  input: BaselineDiagnosticInput,
): BaselineDiagnosticResult {
  const { attempts } = input;
  const independentCorrect = attempts.filter(
    (a) => a.outcome === "correct" && a.helpLevel === 0 && a.attemptNo === 1,
  );
  const assistedOrRetried = attempts.filter(
    (a) =>
      (a.outcome === "correct" && (a.helpLevel > 0 || a.attemptNo > 1)) ||
      a.outcome === "partial",
  );
  const incorrect = attempts.filter((a) => a.outcome === "incorrect");

  const observedSkills = Array.from(
    new Set(independentCorrect.map((a) => a.skillId).filter((s): s is string => Boolean(s))),
  );
  const supportedSkills = Array.from(
    new Set(assistedOrRetried.map((a) => a.skillId).filter((s): s is string => Boolean(s))),
  );
  const missedSkills = Array.from(
    new Set(incorrect.map((a) => a.skillId).filter((s): s is string => Boolean(s))),
  );

  const needsObservation = Array.from(new Set([...supportedSkills, ...missedSkills]));

  const observedSummaryVi =
    observedSkills.length > 0
      ? `Em tự tin làm độc lập tốt ${observedSkills.length} câu hỏi nền tảng không cần trợ giúp.`
      : "Chưa ghi nhận câu hỏi nào em tự làm độc lập hoàn toàn.";

  const supportedSummaryVi =
    needsObservation.length > 0
      ? `Em cần hỗ trợ hoặc gợi ý ở ${needsObservation.length} nội dung. Đây là điểm khởi đầu tự nhiên, không phải khuyết điểm.`
      : "Em nắm bắt tốt các nội dung khảo sát ban đầu.";

  return {
    observedSummaryVi,
    supportedSummaryVi,
    needsObservation,
    suggestedLessons: needsObservation,
    parentReviewRequired: true, // Baseline results always prompt parent review
  };
}

export type PrerequisiteRecommendationKind =
  | "prerequisite_gap"
  | "unlocked_next"
  | "reinforce_supported";

export interface PrerequisiteRecommendationCandidate {
  skillId: string;
  skillNameVi: string;
  subjectId: string;
  state: CompetencyState;
  prerequisiteSkillIds: string[];
  prerequisiteNamesVi: string[];
  lessonId: string | null;
  lessonTitleVi: string | null;
  lessonVersion?: number | null;
  approvalStatus: ApprovalStatus;
}

export interface PrerequisiteRecommendation {
  skillId: string;
  skillNameVi: string;
  subjectId: string;
  state: CompetencyState;
  recommendationKind: PrerequisiteRecommendationKind;
  prerequisiteSkillIds: string[];
  prerequisiteNamesVi: string[];
  lessonId: string | null;
  lessonTitleVi: string | null;
  lessonVersion: number | null;
  approvalStatus: ApprovalStatus;
  reasonVi: string;
}

function isSkillMastered(state: CompetencyState): boolean {
  return state === "INDEPENDENT" || state === "RETAINED" || state === "TRANSFERRED";
}

/**
 * Computes deterministic prerequisite-guided recommendations for the parent dashboard.
 *
 * Priority order:
 *   1. `prerequisite_gap`: Foundational skills (`NOT_OBSERVED` or `SUPPORTED`) whose own
 *      prerequisites (if any) are already mastered, and which are required by at least one
 *      unmastered downstream skill.
 *   2. `unlocked_next`: Downstream skills (`NOT_OBSERVED` or `SUPPORTED`) that have
 *      prerequisites and all of those prerequisites have reached `INDEPENDENT` / `RETAINED` / `TRANSFERRED`.
 *   3. `reinforce_supported`: Skills currently in `SUPPORTED` state whose prerequisites are satisfied,
 *      needing independent practice.
 */
export function derivePrerequisiteRecommendations(
  candidates: readonly PrerequisiteRecommendationCandidate[],
  maxResults = 6,
): PrerequisiteRecommendation[] {
  const bySkillId = new Map(candidates.map((c) => [c.skillId, c]));

  // Find skills that are prerequisites for at least one unmastered downstream skill
  const requiredByUnmasteredDownstream = new Set<string>();
  for (const candidate of candidates) {
    if (!isSkillMastered(candidate.state)) {
      for (const prereqId of candidate.prerequisiteSkillIds) {
        requiredByUnmasteredDownstream.add(prereqId);
      }
    }
  }

  const arePrerequisitesSatisfied = (candidate: PrerequisiteRecommendationCandidate): boolean => {
    for (const prereqId of candidate.prerequisiteSkillIds) {
      const prereq = bySkillId.get(prereqId);
      // If the prerequisite has no teachable lesson at all (e.g. a base concept skill),
      // only block if there IS a teachable lesson for that prerequisite that is still unmastered.
      if (prereq && prereq.lessonId !== null && !isSkillMastered(prereq.state)) {
        return false;
      }
    }
    return true;
  };

  const hasMasteredPrerequisite = (candidate: PrerequisiteRecommendationCandidate): boolean => {
    if (candidate.prerequisiteSkillIds.length === 0) return false;
    return candidate.prerequisiteSkillIds.some((prereqId) => {
      const prereq = bySkillId.get(prereqId);
      return prereq ? isSkillMastered(prereq.state) : false;
    });
  };

  const gapRecs: PrerequisiteRecommendation[] = [];
  const unlockedRecs: PrerequisiteRecommendation[] = [];
  const reinforceRecs: PrerequisiteRecommendation[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    if (!candidate.lessonId) continue;
    if (isSkillMastered(candidate.state)) continue;
    if (!arePrerequisitesSatisfied(candidate)) continue;

    // 1. Unlocked next: has at least one prerequisite that the learner has already mastered
    if (hasMasteredPrerequisite(candidate)) {
      const masteredPrereqNames = candidate.prerequisiteSkillIds
        .map((id, idx) => {
          const p = bySkillId.get(id);
          return p && isSkillMastered(p.state) ? (candidate.prerequisiteNamesVi[idx] ?? p.skillNameVi) : null;
        })
        .filter((name): name is string => Boolean(name));
      unlockedRecs.push({
        skillId: candidate.skillId,
        skillNameVi: candidate.skillNameVi,
        subjectId: candidate.subjectId,
        state: candidate.state,
        recommendationKind: "unlocked_next",
        prerequisiteSkillIds: candidate.prerequisiteSkillIds,
        prerequisiteNamesVi: candidate.prerequisiteNamesVi,
        lessonId: candidate.lessonId,
        lessonTitleVi: candidate.lessonTitleVi,
        lessonVersion: candidate.lessonVersion ?? null,
        approvalStatus: candidate.approvalStatus,
        reasonVi: `Đã vững kỹ năng nền tảng (${masteredPrereqNames.join(", ")}); sẵn sàng học tiếp “${candidate.skillNameVi}”.`,
      });
      seen.add(candidate.skillId);
      continue;
    }

    // 2. Prerequisite gap: needed by a downstream skill and not yet mastered
    if (requiredByUnmasteredDownstream.has(candidate.skillId)) {
      gapRecs.push({
        skillId: candidate.skillId,
        skillNameVi: candidate.skillNameVi,
        subjectId: candidate.subjectId,
        state: candidate.state,
        recommendationKind: "prerequisite_gap",
        prerequisiteSkillIds: candidate.prerequisiteSkillIds,
        prerequisiteNamesVi: candidate.prerequisiteNamesVi,
        lessonId: candidate.lessonId,
        lessonTitleVi: candidate.lessonTitleVi,
        lessonVersion: candidate.lessonVersion ?? null,
        approvalStatus: candidate.approvalStatus,
        reasonVi:
          candidate.state === "SUPPORTED"
            ? `Kỹ năng nền tảng “${candidate.skillNameVi}” đang cần gợi ý; nên củng cố trước khi học kỹ năng tiếp theo.`
            : `Kỹ năng nền tảng “${candidate.skillNameVi}” mở đường cho bài học tiếp theo; phụ huynh có thể duyệt để bé bắt đầu.`,
      });
      seen.add(candidate.skillId);
      continue;
    }

    // 3. Reinforce supported
    if (candidate.state === "SUPPORTED" && !seen.has(candidate.skillId)) {
      reinforceRecs.push({
        skillId: candidate.skillId,
        skillNameVi: candidate.skillNameVi,
        subjectId: candidate.subjectId,
        state: candidate.state,
        recommendationKind: "reinforce_supported",
        prerequisiteSkillIds: candidate.prerequisiteSkillIds,
        prerequisiteNamesVi: candidate.prerequisiteNamesVi,
        lessonId: candidate.lessonId,
        lessonTitleVi: candidate.lessonTitleVi,
        lessonVersion: candidate.lessonVersion ?? null,
        approvalStatus: candidate.approvalStatus,
        reasonVi: `Em đã làm được “${candidate.skillNameVi}” khi có gợi ý; nên luyện thêm để tự làm độc lập.`,
      });
      seen.add(candidate.skillId);
    }
  }

  // Sort unlocked_next first when a learner has already mastered a prerequisite (direct progression signal),
  // followed by prerequisite_gap (foundational roots) and reinforce_supported.
  return [...unlockedRecs, ...gapRecs, ...reinforceRecs].slice(0, maxResults);
}

