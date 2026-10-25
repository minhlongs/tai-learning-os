/**
 * A dependency-free router.
 *
 * The app has three route groups and no nested routing needs, so a small
 * router beats a dependency: it listens to `popstate`, matches the leading path
 * segments, and keeps the group prefix in the path so deep links and the
 * browser's back button behave normally.
 *
 * Routes:
 *   /login                     auth
 *   /                          learner home
 *   /subjects/:subjectId       learner subject -> lesson list
 *   /lessons/:lessonId         learner lesson session
 *   /session/:sessionId        learner session summary
 *   /parent                    parent dashboard
 *   /parent/lessons            parent lesson manager
 *   /parent/data               parent data control
 *
 * Hash routing is deliberately NOT used: the Worker serves the SPA from real
 * paths, so the History API keeps URLs honest and shareable.
 *
 * Auth gate: `/login` is the only public screen. Anything else waits for
 * `GET /api/session` and, if no parent session exists, redirects to /login.
 */

import { useCallback, useEffect, useState } from "react";
import { LoginScreen } from "./screens/LoginScreen";
import { LearnerHomeScreen } from "./screens/learner/LearnerHomeScreen";
import { SubjectScreen } from "./screens/learner/SubjectScreen";
import { LessonScreen } from "./screens/learner/LessonScreen";
import { SessionSummaryScreen } from "./screens/learner/SessionSummaryScreen";
import { DashboardScreen } from "./screens/parent/DashboardScreen";
import { LessonManagerScreen } from "./screens/parent/LessonManagerScreen";
import { DataControlScreen } from "./screens/parent/DataControlScreen";
import { NotFoundScreen } from "./screens/NotFoundScreen";
import { SessionProvider, useSessionContext } from "./lib/SessionProvider";
import { clearCsrfToken } from "./lib/csrf-store";
import "./styles/app.css";

export type Route =
  | { name: "login" }
  | { name: "learner-home" }
  | { name: "subject"; subjectId: string }
  | { name: "lesson"; lessonId: string }
  | { name: "session-summary"; sessionId: string }
  | { name: "parent-dashboard" }
  | { name: "parent-lessons" }
  | { name: "parent-data" }
  | { name: "not-found" };

/** Match a pathname to a route. Pure, so tests and the back button agree. */
export function matchRoute(pathname: string): Route {
  const parts = pathname.split("/").filter((part) => part.length > 0);

  if (parts.length === 0) return { name: "learner-home" };
  if (parts[0] === "login") return { name: "login" };

  if (parts[0] === "parent") {
    if (parts.length === 1) return { name: "parent-dashboard" };
    if (parts[1] === "lessons") return { name: "parent-lessons" };
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

function currentRoute(): Route {
  return matchRoute(window.location.pathname);
}

export function Router(): React.JSX.Element {
  const [route, setRoute] = useState<Route>(currentRoute);
  const { loading, session } = useSessionContext();

  useEffect(() => {
    const onPop = (): void => setRoute(currentRoute());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // A session that expired (or never existed) must not leave a screen rendered.
  useEffect(() => {
    if (!loading && !session.authenticated && route.name !== "login") {
      clearCsrfToken();
      navigate("/login");
    }
  }, [loading, session.authenticated, route.name]);

  const go = useCallback((to: string) => navigate(to), []);

  // Public screen: no session needed.
  if (route.name === "login") return <LoginScreen />;
  if (route.name === "not-found") return <NotFoundScreen onNavigate={go} />;

  // Everything else is behind the parent session. Waiting here beats rendering
  // a screen that would immediately redirect.
  if (loading || !session.authenticated) return <div className="app" />;

  switch (route.name) {
    case "subject":
      return <SubjectScreen subjectId={route.subjectId} onNavigate={go} />;
    case "lesson":
      return <LessonScreen lessonId={route.lessonId} onNavigate={go} />;
    case "session-summary":
      return <SessionSummaryScreen sessionId={route.sessionId} onNavigate={go} />;
    case "parent-dashboard":
      return <DashboardScreen onNavigate={go} />;
    case "parent-lessons":
      return <LessonManagerScreen onNavigate={go} />;
    case "parent-data":
      return <DataControlScreen onNavigate={go} />;
    case "learner-home":
      return <LearnerHomeScreen onNavigate={go} />;
  }
}

export function App(): React.JSX.Element {
  return (
    <SessionProvider>
      <Router />
    </SessionProvider>
  );
}
