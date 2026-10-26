/**
 * Every API path the client calls, in one place.
 *
 * These match `src/worker/index.ts` exactly. A screen never writes a path
 * inline: when a route moves, this file is the only client edit required.
 */

export const endpoints = {
  session: "/api/session",
  sessionMode: "/api/session/mode",
  login: "/api/session/login",
  bootstrap: "/api/session/bootstrap",
  logout: "/api/session/logout",

  learnerHome: "/api/learner/home",
  learnerSubjects: "/api/learner/subjects",
  startSession: "/api/learner/sessions",
  finalizeSession: "/api/learner/sessions/finalize",
  reflectSession: "/api/learner/sessions/reflect",
  requestHint: "/api/learner/hints",
  submitAttempt: "/api/learner/attempts",

  parentDashboard: "/api/parent/dashboard",
  curriculum: "/api/parent/curriculum",
  baselineAssessments: "/api/parent/baseline",
  planner: "/api/parent/planner",
  generatePlan: "/api/parent/planner/generate",
  updatePlanItem: "/api/parent/planner/item",
  lessons: "/api/parent/lessons",
  lessonDetail: (lessonId: string) => `/api/parent/lessons/${encodeURIComponent(lessonId)}`,
  setApproval: "/api/parent/lessons/approval",
  updateContent: "/api/parent/lessons/content",
  correctSkill: "/api/parent/skills/correct",
  createLearner: "/api/parent/learners",
  updateLearner: "/api/parent/learners/profile",

  exportData: "/api/data/export",
  importData: "/api/data/import",
  deleteLearner: "/api/data/learner",
} as const;
