/**
 * Pure routing helpers, deliberately outside `App.tsx`.
 *
 * `App.tsx` exports React components only, so these live here to keep the module
 * free of the `react-refresh/only-export-components` warning and to keep the
 * router's shape unit-testable without rendering.
 *
 * Routes:
 *   /login                     auth
 *   /                          learner home
 *   /subjects/:subjectId       learner subject -> lesson list
 *   /lessons/:lessonId         learner lesson session
 *   /session/:sessionId        learner session summary
 *   /parent                    parent dashboard
 *   /parent/curriculum         parent curriculum setup
 *   /parent/baseline           parent baseline assessment
 *   /parent/planner            parent 4-week planner
 *   /parent/lessons            parent lesson manager
 *   /parent/organization       parent organization studio
 *   /parent/data               parent data control
 *
 * Hash routing is deliberately NOT used: the Worker serves the SPA from real
 * paths, so the History API keeps URLs honest and shareable.
 */

export type Route =
  | { name: "login" }
  | { name: "learner-home" }
  | { name: "subject"; subjectId: string }
  | { name: "lesson"; lessonId: string }
  | { name: "session-summary"; sessionId: string }
  | { name: "parent-dashboard" }
  | { name: "parent-curriculum" }
  | { name: "parent-baseline" }
  | { name: "parent-planner" }
  | { name: "parent-lessons" }
  | { name: "parent-organization" }
  | { name: "parent-data" }
  | { name: "not-found" };

/** Match a pathname to a route. Pure, so tests and the back button agree. */
export function matchRoute(pathname: string): Route {
  const parts = pathname.split("/").filter((part) => part.length > 0);

  if (parts.length === 0) return { name: "learner-home" };
  if (parts[0] === "login") return { name: "login" };

  if (parts[0] === "parent") {
    if (parts.length === 1) return { name: "parent-dashboard" };
    if (parts[1] === "curriculum") return { name: "parent-curriculum" };
    if (parts[1] === "baseline") return { name: "parent-baseline" };
    if (parts[1] === "planner") return { name: "parent-planner" };
    if (parts[1] === "lessons") return { name: "parent-lessons" };
    if (parts[1] === "organization") return { name: "parent-organization" };
    if (parts[1] === "data") return { name: "parent-data" };
    return { name: "not-found" };
  }

  if (parts[0] === "subjects" && parts.length === 2 && parts[1]) {
    return { name: "subject", subjectId: parts[1] };
  }
  if (parts[0] === "lessons" && parts.length === 2 && parts[1]) {
    return { name: "lesson", lessonId: parts[1] };
  }
  if (parts[0] === "session" && parts.length === 2 && parts[1]) {
    return { name: "session-summary", sessionId: parts[1] };
  }

  return { name: "not-found" };
}

/** Push a new entry and let the router pick it up. */
export function navigate(to: string): void {
  if (window.location.pathname === to) return;
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
