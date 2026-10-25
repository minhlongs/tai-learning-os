/**
 * The grid of lessons a parent has approved.
 *
 * Each tile carries the lesson's own metadata — title, grade band, objective —
 * because a learner choosing what to study should see what the lesson is, not a
 * decoration. No badge, streak, or difficulty claim appears here: the screen
 * reports what exists and does not invent motivation data.
 */

type LessonRow = {
  id: string;
  titleVi: string;
  titleEn: string;
  objectiveVi: string;
  gradeFrom: number;
  gradeTo: number;
};

export function LessonList({
  lessons,
  onPick,
}: {
  lessons: readonly LessonRow[];
  onPick: (lessonId: string) => void;
}): React.JSX.Element {
  return (
    <ul className="lesson-grid">
      {lessons.map((lesson) => (
        <li key={lesson.id}>
          <button
            type="button"
            className="lesson-tile"
            onClick={() => onPick(lesson.id)}
            aria-label={`Mở bài học: ${lesson.titleVi}`}
          >
            <h3 className="lesson-tile__title">{lesson.titleVi}</h3>
            <p className="lesson-tile__objective">{lesson.objectiveVi}</p>
            <p className="lesson-tile__meta">
              Lớp {lesson.gradeFrom}
              {lesson.gradeTo > lesson.gradeFrom ? `–${lesson.gradeTo}` : ""}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}
