/**
 * Worker entry point.
 *
 * The route table is the whole security surface of this app: a request that
 * matches no row gets 404, a request that matches a protected row gets
 * authenticated, and only then does a handler run. Nothing here authorizes by
 * route name alone.
 *
 * LOCAL ONLY. This Worker has no deployment target in the first MVP: it runs
 * under `wrangler dev` against a local D1 file. Nothing in this file creates a
 * remote resource.
 */

import type { AppEnv } from "./http/middleware";
import { dispatch, publicRoute, protectedRoute, parentRoute, type Route } from "./http/middleware";
import {
  bootstrapParent,
  getSessionInfo,
  login,
  logout,
  switchSessionMode,
} from "./routes/session";
import {
  finalizeSession,
  getLearnerHome,
  listSubjectsForLearner,
  requestHint,
  startSession,
  submitAttempt,
  submitSessionReflection,
} from "./routes/learner";
import {
  correctSkillEvidence,
  createLearnerProfile,
  createLearningGoalRoute,
  evaluateBaselineAssessment,
  generateFourWeekPlanRoute,
  getBaselineAssessments,
  getCurriculumSetup,
  getFourWeekPlan,
  getLessonDetail,
  getParentDashboard,
  listLessons,
  setLessonApproval,
  transitionSchoolYear,
  updateLearnerProfile,
  updateLearningGoalStatusRoute,
  updateLessonContent,
  updatePlanItemRoute,
  upsertCurriculumSetup,
} from "./routes/parent";
import { deleteLearner, exportRecord, importRecord } from "./routes/data";
import {
  grantConsent,
  listConsentableOrganizations,
  listConsents,
  revokeConsent,
} from "./routes/consents";
import {
  addOrganizationMemberRoute,
  assignClassroomTeacherRoute,
  createClassroomRoute,
  createOrganizationRoute,
  enrollLearnerRoute,
  listClassroomLearnersRoute,
  listClassroomsRoute,
  listOrganizationMembersRoute,
} from "./routes/organization";
import {
  assignClassroomLessonRoute,
  createOrgDraftLessonRoute,
  listClassroomAssignedLessonsRoute,
  listParentClassroomLessonsRoute,
  reviewOrgLessonRoute,
  submitOrgLessonReviewRoute,
} from "./routes/organization-lessons";

/**
 * Every route, in match order.
 *
 * `publicRoute` is used for exactly three things: reading the session, logging
 * in, and first-run parent creation. Everything that touches learner data is
 * protected. There is no development bypass route: bootstrap refuses once a
 * parent row exists, so there is nothing to switch on in production.
 */
const ROUTES: readonly Route[] = [
  publicRoute("GET", /^\/api\/session$/, getSessionInfo),
  publicRoute("POST", /^\/api\/session\/login$/, login),
  publicRoute("POST", /^\/api\/session\/logout$/, logout),
  publicRoute("POST", /^\/api\/session\/bootstrap$/, bootstrapParent),
  protectedRoute("POST", /^\/api\/session\/mode$/, switchSessionMode),

  protectedRoute("GET", /^\/api\/learner\/home$/, getLearnerHome),
  protectedRoute("GET", /^\/api\/learner\/subjects$/, listSubjectsForLearner),
  protectedRoute("POST", /^\/api\/learner\/sessions$/, startSession),
  protectedRoute("POST", /^\/api\/learner\/hints$/, requestHint),
  protectedRoute("POST", /^\/api\/learner\/attempts$/, submitAttempt),
  protectedRoute("POST", /^\/api\/learner\/sessions\/finalize$/, finalizeSession),
  protectedRoute("POST", /^\/api\/learner\/sessions\/reflect$/, submitSessionReflection),

  parentRoute("GET", /^\/api\/parent\/dashboard$/, getParentDashboard),
  parentRoute("GET", /^\/api\/parent\/curriculum$/, getCurriculumSetup),
  parentRoute("POST", /^\/api\/parent\/curriculum$/, upsertCurriculumSetup),
  parentRoute("GET", /^\/api\/parent\/baseline$/, getBaselineAssessments),
  parentRoute("POST", /^\/api\/parent\/baseline$/, evaluateBaselineAssessment),
  parentRoute("GET", /^\/api\/parent\/planner$/, getFourWeekPlan),
  parentRoute("POST", /^\/api\/parent\/planner\/generate$/, generateFourWeekPlanRoute),
  parentRoute("PATCH", /^\/api\/parent\/planner\/item$/, updatePlanItemRoute),
  parentRoute("GET", /^\/api\/parent\/lessons$/, listLessons),
  parentRoute("GET", /^\/api\/parent\/lessons\/[^/]+$/, getLessonDetail),
  parentRoute("POST", /^\/api\/parent\/lessons\/approval$/, setLessonApproval),
  parentRoute("POST", /^\/api\/parent\/lessons\/content$/, updateLessonContent),
  parentRoute("POST", /^\/api\/parent\/skills\/correct$/, correctSkillEvidence),
  parentRoute("POST", /^\/api\/parent\/learners$/, createLearnerProfile),
  parentRoute("PATCH", /^\/api\/parent\/learners\/profile$/, updateLearnerProfile),
  parentRoute("POST", /^\/api\/parent\/school-years$/, transitionSchoolYear),
  parentRoute("POST", /^\/api\/parent\/goals$/, createLearningGoalRoute),
  parentRoute("PATCH", /^\/api\/parent\/goals$/, updateLearningGoalStatusRoute),

  // Parent Consent routes
  parentRoute("GET", /^\/api\/parent\/consents$/, listConsents),
  parentRoute("POST", /^\/api\/parent\/consents\/grant$/, grantConsent),
  parentRoute("POST", /^\/api\/parent\/consents\/revoke$/, revokeConsent),
  parentRoute("GET", /^\/api\/parent\/consents\/organizations$/, listConsentableOrganizations),

  // Organization & Classroom routes
  parentRoute("POST", /^\/api\/org\/create$/, createOrganizationRoute),
  parentRoute("GET", /^\/api\/org\/members$/, listOrganizationMembersRoute),
  parentRoute("POST", /^\/api\/org\/members$/, addOrganizationMemberRoute),
  parentRoute("GET", /^\/api\/org\/classrooms$/, listClassroomsRoute),
  parentRoute("POST", /^\/api\/org\/classrooms$/, createClassroomRoute),
  parentRoute("POST", /^\/api\/org\/classrooms\/teachers$/, assignClassroomTeacherRoute),
  parentRoute("POST", /^\/api\/org\/classrooms\/enroll$/, enrollLearnerRoute),
  parentRoute("GET", /^\/api\/org\/classrooms\/learners$/, listClassroomLearnersRoute),

  // Organization Lesson Authoring & Classroom Assignments
  parentRoute("POST", /^\/api\/org\/lessons\/draft$/, createOrgDraftLessonRoute),
  parentRoute("POST", /^\/api\/org\/lessons\/submit$/, submitOrgLessonReviewRoute),
  parentRoute("POST", /^\/api\/org\/lessons\/review$/, reviewOrgLessonRoute),
  parentRoute("POST", /^\/api\/org\/classrooms\/assign-lesson$/, assignClassroomLessonRoute),
  parentRoute("GET", /^\/api\/org\/classrooms\/assigned-lessons$/, listClassroomAssignedLessonsRoute),
  parentRoute("GET", /^\/api\/parent\/classroom-lessons$/, listParentClassroomLessonsRoute),

  parentRoute("POST", /^\/api\/data\/export$/, exportRecord),
  parentRoute("POST", /^\/api\/data\/import$/, importRecord),
  parentRoute("DELETE", /^\/api\/data\/learner$/, deleteLearner),
];

export default {
  fetch(request: Request, env: AppEnv): Promise<Response> {
    return dispatch(request, env, ROUTES);
  },
};
