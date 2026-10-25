/**
 * Subject cards. Each is a button, because picking a subject navigates.
 *
 * The lesson count is the API's own `lessonCount` — a subject with no approved
 * lessons still renders, but says so rather than hiding the count.
 */

import type { SubjectSummary } from "../../../../shared/api-contract";

export function SubjectCards({
  subjects,
  onPick,
}: {
  subjects: SubjectSummary[];
  onPick: (subjectId: string) => void;
}): React.JSX.Element {
  if (subjects.length === 0) {
    return <p className="row__meta">Chưa có môn học nào.</p>;
  }

  return (
    <ul className="grid grid--3">
      {subjects.map((subject) => (
        <li key={subject.id}>
          <button
            type="button"
            className="subject-card"
            onClick={() => onPick(subject.id)}
            disabled={!subject.active}
          >
            <span className="subject-card__name">{subject.nameVi}</span>
            <span className="subject-card__name-en">{subject.nameEn}</span>
            <span className="subject-card__count">
              {subject.active
                ? `${subject.lessonCount} bài học`
                : "Tạm nghỉ"}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
