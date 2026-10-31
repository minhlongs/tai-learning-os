/**
 * Review-due entries with real days overdue, from the API's own count.
 *
 * The count is rendered as text beside a warning colour, never as colour alone,
 * so a colour-blind learner and a screen reader get the same information.
 */

import type { LearnerHomeResponse } from "../../../../shared/api-contract";
import { overdueLabel } from "../../../lib/format";

type Entry = LearnerHomeResponse["reviewDue"][number];

export function ReviewDueList({
  entries,
  subjectName,
  onStartReview,
}: {
  entries: Entry[];
  subjectName: (subjectId: string) => string;
  onStartReview?: (entry: Entry) => void;
}): React.JSX.Element {
  return (
    <ul className="rows">
      {entries.map((entry) => (
        <li key={entry.skillId} className="row">
          <span className="row__main">
            <span className="row__title">{entry.skillNameVi}</span>
            <br />
            <span className="row__meta">
              {subjectName(entry.subjectId)}
              {entry.lessonTitleVi ? ` · Bài: ${entry.lessonTitleVi}` : ""}
            </span>
          </span>
          <span className="row__aside" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="pill pill--attention">
              <span aria-hidden="true">!</span>
              {overdueLabel(entry.daysOverdue, entry.dueAt)}
            </span>
            {onStartReview ? (
              entry.lessonId ? (
                <button
                  type="button"
                  className="btn btn--primary"
                  data-testid={`review-now-${entry.skillId}`}
                  onClick={() => onStartReview(entry)}
                >
                  Ôn tập ngay
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--secondary"
                  data-testid={`review-fallback-${entry.skillId}`}
                  onClick={() => onStartReview(entry)}
                >
                  Xem môn học
                </button>
              )
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
