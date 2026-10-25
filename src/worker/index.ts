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
import { dispatch, publicRoute, protectedRoute, type Route } from "./http/middleware";
import {
  bootstrapParent,
  getSessionInfo,
  login,
  logout,
} from "./routes/session";
import {
  finalizeSession,
  getLearnerHome,
  listSubjectsForLearner,
  requestHint,
  startSession,
  submitAttempt,
} from "./routes/learner";
import {
  correctSkillEvidence,
  getLessonDetail,
  getParentDashboard,
  listLessons,
  setLessonApproval,
  updateLessonContent,
} from "./routes/parent";
import { deleteLearner, exportRecord, importRecord } from "./routes/data";

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

  protectedRoute("GET", /^\/api\/learner\/home$/, getLearnerHome),
  protectedRoute("GET", /^\/api\/learner\/subjects$/, listSubjectsForLearner),
  protectedRoute("POST", /^\/api\/learner\/sessions$/, startSession),
  protectedRoute("POST", /^\/api\/learner\/hints$/, requestHint),
  protectedRoute("POST", /^\/api\/learner\/attempts$/, submitAttempt),
  protectedRoute("POST", /^\/api\/learner\/sessions\/finalize$/, finalizeSession),

  protectedRoute("GET", /^\/api\/parent\/dashboard$/, getParentDashboard),
  protectedRoute("GET", /^\/api\/parent\/lessons$/, listLessons),
  protectedRoute("GET", /^\/api\/parent\/lessons\/[^/]+$/, getLessonDetail),
  protectedRoute("POST", /^\/api\/parent\/lessons\/approval$/, setLessonApproval),
  protectedRoute("POST", /^\/api\/parent\/lessons\/content$/, updateLessonContent),
  protectedRoute("POST", /^\/api\/parent\/skills\/correct$/, correctSkillEvidence),

  protectedRoute("POST", /^\/api\/data\/export$/, exportRecord),
  protectedRoute("POST", /^\/api\/data\/import$/, importRecord),
  protectedRoute("DELETE", /^\/api\/data\/learner$/, deleteLearner),
];

export default {
  fetch(request: Request, env: AppEnv): Promise<Response> {
    return dispatch(request, env, ROUTES);
  },
};
