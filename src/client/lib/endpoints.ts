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
  extendSessionTime: "/api/learner/sessions/extend",
  finalizeSession: "/api/learner/sessions/finalize",
  reflectSession: "/api/learner/sessions/reflect",
  requestHint: "/api/learner/hints",
  submitAttempt: "/api/learner/attempts",

  parentDashboard: "/api/parent/dashboard",
  curriculum: "/api/parent/curriculum",
  baselineAssessments: "/api/parent/baseline",
  planner: "/api/parent/planner",
  generatePlan: "/api/parent/planner/generate",
  schedulePracticePlanItem: "/api/parent/planner/schedule-practice",
  updatePlanItem: "/api/parent/planner/item",
  lessons: "/api/parent/lessons",
  lessonDetail: (lessonId: string) => `/api/parent/lessons/${encodeURIComponent(lessonId)}`,
  forkLesson: "/api/parent/lessons/fork",
  setApproval: "/api/parent/lessons/approval",
  updateContent: "/api/parent/lessons/content",
  correctSkill: "/api/parent/skills/correct",
  createLearner: "/api/parent/learners",
  updateLearner: "/api/parent/learners/profile",
  schoolYears: "/api/parent/school-years",
  parentGoals: "/api/parent/goals",
  consents: "/api/parent/consents",
  grantConsent: "/api/parent/consents/grant",
  revokeConsent: "/api/parent/consents/revoke",
  consentOrganizations: "/api/parent/consents/organizations",
  classroomLessons: "/api/parent/classroom-lessons",

  orgList: "/api/org/list",
  orgCreate: "/api/org/create",
  orgMembers: "/api/org/members",
  orgConsentedLearners: "/api/org/consented-learners",
  orgClassrooms: "/api/org/classrooms",
  orgClassroomTeachers: "/api/org/classrooms/teachers",
  orgClassroomEnroll: "/api/org/classrooms/enroll",
  orgClassroomLearners: "/api/org/classrooms/learners",
  orgLessons: "/api/org/lessons",
  orgLessonDraft: "/api/org/lessons/draft",
  orgLessonSubmit: "/api/org/lessons/submit",
  orgLessonReview: "/api/org/lessons/review",
  orgClassroomAssignLesson: "/api/org/classrooms/assign-lesson",
  orgClassroomAssignedLessons: "/api/org/classrooms/assigned-lessons",
  orgClassroomProgress: "/api/org/classrooms/progress",

  exportData: "/api/data/export",
  exportPortability: "/api/data/export-portability",
  importData: "/api/data/import",
  deleteLearner: "/api/data/learner",
} as const;
