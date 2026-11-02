/**
 * Completed activities, with the API's own correct/attempted counts.
 *
 * No percentage is invented: the two integers are shown as they were recorded.
 */

import type { LearnerHomeResponse } from "../../../../shared/api-contract";
import { formatDate } from "../../../lib/format";

type Session = LearnerHomeResponse["completedSessions"][number];

export function CompletedList({
  sessions,
  subjectName,
}: {
  sessions: Session[];
  subjectName: (subjectId: string) => string;
}): React.JSX.Element {
  return (
    <ol className="rows">
      {sessions.map((session) => (
        <li key={session.sessionId} className="row">
          <span className="row__main">
            <span className="row__title">
              {session.lessonTitleVi}{" "}
              {session.purpose === "practice" ? (
                <span
                  className="pill pill--attention"
                  data-testid={`completed-session-practice-badge-${session.sessionId}`}
                >
                  Luyện tập gia đình
                </span>
              ) : null}
            </span>
            <br />
            <span className="row__meta">
              {subjectName(session.subjectId)} · {formatDate(session.completedAt)}
              {session.purpose === "practice" ? " · Luyện tập gia đình" : ""}
            </span>
          </span>
          <span className="row__aside">
            <span className="pill pill--correct">
              <span aria-hidden="true">✓</span>
              {session.correctCount}/{session.attemptedCount} câu đúng
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
