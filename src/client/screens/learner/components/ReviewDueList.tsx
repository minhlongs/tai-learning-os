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
}: {
  entries: Entry[];
  subjectName: (subjectId: string) => string;
}): React.JSX.Element {
  return (
    <ul className="rows">
      {entries.map((entry) => (
        <li key={entry.skillId} className="row">
          <span className="row__main">
            <span className="row__title">{entry.skillNameVi}</span>
            <br />
            <span className="row__meta">{subjectName(entry.subjectId)}</span>
          </span>
          <span className="row__aside">
            <span className="pill pill--attention">
              <span aria-hidden="true">!</span>
              {overdueLabel(entry.daysOverdue, entry.dueAt)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
