import { describe, expect, it } from "vitest";

import {
  DEFAULT_PLANNER_CONFIG,
  derivePrerequisiteRecommendations,
  evaluateBaselineDiagnostic,
  generateFourWeekPlan,
  type PrerequisiteRecommendationCandidate,
  type SkillCandidate,
} from "../../src/shared/engine/planner";

describe("generateFourWeekPlan — deterministic 4-week scheduling", () => {
  const candidates: SkillCandidate[] = [
    {
      id: "math-frac-equiv",
      subjectId: "math",
      code: "MATH.FRAC.EQUIV",
      nameVi: "Phân số bằng nhau",
      competencyState: "INDEPENDENT",
      prerequisiteSkillIds: [],
      dueForReview: true,
      needsObservation: false,
      suggestedLessonId: "math-equivalent-fractions",
      lessonTitleVi: "Phân số bằng nhau",
      expectedDurationMinutes: 20,
      provenance: "gdpt_2018_objective",
    },
    {
      id: "math-frac-compare",
      subjectId: "math",
      code: "MATH.FRAC.COMPARE",
      nameVi: "So sánh phân số",
      competencyState: "SUPPORTED",
      prerequisiteSkillIds: [],
      dueForReview: false,
      needsObservation: false,
      suggestedLessonId: "math-compare-fractions",
      lessonTitleVi: "So sánh phân số",
      expectedDurationMinutes: 20,
      provenance: "gdpt_2018_objective",
    },
    {
      id: "vi-read-main-idea",
      subjectId: "vietnamese",
      code: "VI.READ.MAIN",
      nameVi: "Tìm ý chính đoạn văn",
      competencyState: "NOT_OBSERVED",
      prerequisiteSkillIds: ["vi-read-detail"],
      dueForReview: false,
      needsObservation: true,
      suggestedLessonId: "vi-main-idea",
      lessonTitleVi: "Tìm ý chính trong đoạn văn",
      expectedDurationMinutes: 20,
      provenance: "gdpt_2018_objective",
    },
    {
      id: "eng-sent-simple",
      subjectId: "english",
      code: "ENG.SENT.SIMPLE",
      nameVi: "Câu đơn hiện tại",
      competencyState: "INDEPENDENT",
      prerequisiteSkillIds: ["eng-vocab-school"],
      dueForReview: false,
      needsObservation: false,
      suggestedLessonId: "eng-simple-sentences",
      lessonTitleVi: "Câu đơn tiếng Anh",
      expectedDurationMinutes: 20,
      provenance: "gdpt_2018_objective",
    },
  ];

  it("prioritizes overdue reviews first, then prerequisite gaps, then baseline observations, then general progression", () => {
    const plan = generateFourWeekPlan(candidates, DEFAULT_PLANNER_CONFIG);
    expect(plan.length).toBeGreaterThanOrEqual(4);

    // Slot 0: overdue review (math-frac-equiv)
    expect(plan[0]!.skillId).toBe("math-frac-equiv");
    expect(plan[0]!.itemKind).toBe("review");
    expect(plan[0]!.weekIndex).toBe(1);

    // Slot 1: foundational gap (math-frac-compare has no prerequisites and is SUPPORTED)
    expect(plan[1]!.skillId).toBe("math-frac-compare");
    expect(plan[1]!.itemKind).toBe("lesson");
    expect(plan[1]!.weekIndex).toBe(1);

    // Slot 2: baseline observation (vi-read-main-idea has needsObservation=true)
    expect(plan[2]!.skillId).toBe("vi-read-main-idea");
    expect(plan[2]!.itemKind).toBe("lesson");
    expect(plan[2]!.weekIndex).toBe(1);

    // Slot 3: general progression (eng-sent-simple moves to week 2 since sessionsPerWeek=3)
    expect(plan[3]!.skillId).toBe("eng-sent-simple");
    expect(plan[3]!.weekIndex).toBe(2);
  });

  it("respects custom sessionsPerWeek and sessionDurationMinutes", () => {
    const plan = generateFourWeekPlan(candidates, {
      sessionsPerWeek: 2,
      sessionDurationMinutes: 15,
      totalWeeks: 4,
    });

    expect(plan[0]!.weekIndex).toBe(1);
    expect(plan[1]!.weekIndex).toBe(1);
    expect(plan[2]!.weekIndex).toBe(2);
    expect(plan[3]!.weekIndex).toBe(2);
    for (const slot of plan) {
      expect(slot.durationMinutes).toBeLessThanOrEqual(15);
    }
  });
});

describe("evaluateBaselineDiagnostic — non-punitive diagnostic evidence evaluation", () => {
  it("distinguishes independent solves from assisted/retried/incorrect attempts without assigning punitive scores", () => {
    const result = evaluateBaselineDiagnostic({
      learnerId: "lnr-1",
      subjectId: "math",
      attempts: [
        {
          stepId: "s1",
          stepPosition: 1,
          kind: "concept",
          outcome: "correct",
          helpLevel: 0,
          attemptNo: 1,
          skillId: "math-frac-equiv",
        },
        {
          stepId: "s2",
          stepPosition: 2,
          kind: "guided",
          outcome: "correct",
          helpLevel: 2,
          attemptNo: 1,
          skillId: "math-frac-compare",
        },
        {
          stepId: "s3",
          stepPosition: 3,
          kind: "independent",
          outcome: "incorrect",
          helpLevel: 0,
          attemptNo: 1,
          skillId: "math-order-ops",
        },
      ],
    });

    expect(result.observedSummaryVi).toContain("1 câu hỏi nền tảng");
    expect(result.supportedSummaryVi).toContain("không phải khuyết điểm");
    expect(result.needsObservation).toEqual(["math-frac-compare", "math-order-ops"]);
    expect(result.parentReviewRequired).toBe(true);
  });

  it("never counts a parent correction as an independent solve", () => {
    const result = evaluateBaselineDiagnostic({
      learnerId: "lnr-1",
      subjectId: "math",
      attempts: [
        {
          stepId: "s1",
          stepPosition: 1,
          kind: "concept",
          outcome: "correct",
          helpLevel: 0,
          attemptNo: 1,
          skillId: "math-frac-equiv",
          evidenceKind: "parent_correction",
        },
      ],
    });

    expect(result.observedSummaryVi).toContain("Chưa ghi nhận");
    // A correction is evidence that support exists, not that the child solved it.
    expect(result.needsObservation).toEqual(["math-frac-equiv"]);
  });

  it("handles empty baseline attempts honestly", () => {
    const result = evaluateBaselineDiagnostic({
      learnerId: "lnr-1",
      subjectId: "vietnamese",
      attempts: [],
    });

    expect(result.observedSummaryVi).toContain("Chưa ghi nhận");
    expect(result.needsObservation).toEqual([]);
    expect(result.parentReviewRequired).toBe(true);
  });
});

describe("derivePrerequisiteRecommendations — deterministic prerequisite graph engine", () => {
  it("recommends unlocked_next when a prerequisite is mastered and prerequisite_gap when a root skill is still unmastered", () => {
    const candidates: PrerequisiteRecommendationCandidate[] = [
      {
        skillId: "sci-water-cycle",
        skillNameVi: "Vòng tuần hoàn của nước trong tự nhiên",
        subjectId: "science",
        state: "INDEPENDENT",
        prerequisiteSkillIds: [],
        prerequisiteNamesVi: [],
        lessonId: "sci-water-cycle",
        lessonTitleVi: "Vòng tuần hoàn của nước trong tự nhiên",
        approvalStatus: "approved",
      },
      {
        skillId: "sci-plant-needs",
        skillNameVi: "Các yếu tố cần cho sự sống và phát triển của thực vật",
        subjectId: "science",
        state: "NOT_OBSERVED",
        prerequisiteSkillIds: ["sci-water-cycle"],
        prerequisiteNamesVi: ["Vòng tuần hoàn của nước trong tự nhiên"],
        lessonId: "sci-plant-needs",
        lessonTitleVi: "Cây xanh cần gì để sống và phát triển?",
        approvalStatus: "draft",
      },
      {
        skillId: "deb-claim-reason",
        skillNameVi: "Nhận diện ý kiến (luận điểm) và lý lẽ hỗ trợ",
        subjectId: "debate",
        state: "NOT_OBSERVED",
        prerequisiteSkillIds: [],
        prerequisiteNamesVi: [],
        lessonId: "deb-claim-reason",
        lessonTitleVi: "Ý kiến và lý lẽ: Vì sao em nghĩ vậy?",
        approvalStatus: "draft",
      },
      {
        skillId: "deb-fact-opinion",
        skillNameVi: "Phân biệt sự thật kiểm chứng được và ý kiến cá nhân",
        subjectId: "debate",
        state: "NOT_OBSERVED",
        prerequisiteSkillIds: ["deb-claim-reason"],
        prerequisiteNamesVi: ["Nhận diện ý kiến (luận điểm) và lý lẽ hỗ trợ"],
        lessonId: "deb-fact-opinion",
        lessonTitleVi: "Phân biệt sự thật và ý kiến cá nhân",
        approvalStatus: "draft",
      },
      {
        skillId: "eng-vocab-home",
        skillNameVi: "Từ vựng về ngôi nhà và gia đình",
        subjectId: "english",
        state: "SUPPORTED",
        prerequisiteSkillIds: [],
        prerequisiteNamesVi: [],
        lessonId: "eng-home-vocabulary",
        lessonTitleVi: "Từ vựng về ngôi nhà và đồ vật quanh em",
        approvalStatus: "approved",
      },
    ];

    const recs = derivePrerequisiteRecommendations(candidates, 6);

    // 1. sci-plant-needs is unlocked_next because sci-water-cycle is INDEPENDENT
    expect(recs[0]?.skillId).toBe("sci-plant-needs");
    expect(recs[0]?.recommendationKind).toBe("unlocked_next");
    expect(recs[0]?.reasonVi).toContain("Vòng tuần hoàn của nước trong tự nhiên");

    // 2. deb-claim-reason is prerequisite_gap because deb-fact-opinion depends on it, and deb-fact-opinion itself is blocked until deb-claim-reason is mastered
    const debClaimRec = recs.find((r) => r.skillId === "deb-claim-reason");
    expect(debClaimRec).toBeDefined();
    expect(debClaimRec?.recommendationKind).toBe("prerequisite_gap");
    expect(recs.some((r) => r.skillId === "deb-fact-opinion")).toBe(false);

    // 3. eng-vocab-home is reinforce_supported
    const engHomeRec = recs.find((r) => r.skillId === "eng-vocab-home");
    expect(engHomeRec).toBeDefined();
    expect(engHomeRec?.recommendationKind).toBe("reinforce_supported");

    // 4. sci-water-cycle is already INDEPENDENT and excluded
    expect(recs.some((r) => r.skillId === "sci-water-cycle")).toBe(false);
  });
});

