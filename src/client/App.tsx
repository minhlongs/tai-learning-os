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
import { CurriculumSetupScreen } from "./screens/parent/CurriculumSetupScreen";
import { BaselineAssessmentScreen } from "./screens/parent/BaselineAssessmentScreen";
import { FourWeekPlannerScreen } from "./screens/parent/FourWeekPlannerScreen";
import { OrganizationStudioScreen } from "./screens/parent/OrganizationStudioScreen";
import { NotFoundScreen } from "./screens/NotFoundScreen";
import { SessionProvider } from "./lib/SessionProvider";
import { useSessionContext } from "./lib/session-context";
import { clearCsrfToken } from "./lib/csrf-store";
import { matchRoute, navigate, type Route } from "./routing";
import "./styles/app.css";

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

  const activeLearnerKey = session.learner?.id ?? "no-learner";

  // If in learner mode and trying to access parent routes directly via URL, redirect to learner home
  if (session.mode === "learner" && route.name.startsWith("parent-")) {
    return <LearnerHomeScreen key={activeLearnerKey} onNavigate={go} />;
  }

  switch (route.name) {
    case "subject":
      return <SubjectScreen key={`${activeLearnerKey}:${route.subjectId}`} subjectId={route.subjectId} onNavigate={go} />;
    case "lesson":
      return <LessonScreen key={`${activeLearnerKey}:${route.lessonId}`} lessonId={route.lessonId} onNavigate={go} />;
    case "session-summary":
      return <SessionSummaryScreen key={`${activeLearnerKey}:${route.sessionId}`} sessionId={route.sessionId} onNavigate={go} />;
    case "parent-dashboard":
      return <DashboardScreen key={activeLearnerKey} onNavigate={go} />;
    case "parent-curriculum":
      return <CurriculumSetupScreen key={activeLearnerKey} onNavigate={go} />;
    case "parent-baseline":
      return <BaselineAssessmentScreen key={activeLearnerKey} onNavigate={go} />;
    case "parent-planner":
      return <FourWeekPlannerScreen key={activeLearnerKey} onNavigate={go} />;
    case "parent-lessons":
      return <LessonManagerScreen key={activeLearnerKey} onNavigate={go} />;
    case "parent-organization":
      return <OrganizationStudioScreen key={activeLearnerKey} onNavigate={go} />;
    case "parent-data":
      return <DataControlScreen key={activeLearnerKey} onNavigate={go} />;
    case "learner-home":
      return <LearnerHomeScreen key={activeLearnerKey} onNavigate={go} />;
  }
}

export function App(): React.JSX.Element {
  return (
    <SessionProvider>
      <Router />
    </SessionProvider>
  );
}
