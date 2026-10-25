/**
 * A subject's lesson list.
 *
 * The list is a real response: lessons the parent has approved. A subject with
 * no approved lessons says so instead of showing an empty grid, and a lesson
 * the learner has already finished still appears, marked as done.
 */

import { useEffect, useState } from "react";
import type { LearnerSubjectListResponse, SubjectSummary } from "../../../shared/api-contract";
import { api, failureMessage } from "../../lib/api";
import { useSessionContext } from "../../lib/SessionProvider";
import { ProtectedScreen } from "../../components/ProtectedScreen";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "../../components/ScreenState";
import { endpoints } from "../../lib/endpoints";
import { LessonList } from "./components/LessonList";
import { SubjectHeader } from "./components/SubjectHeader";
import "../../styles/subject.css";

/** One lesson as the learner may see it. Derived from the contract, not redeclared. */
type LessonRow = LearnerSubjectListResponse["subjects"][number]["lessons"][number];

export function SubjectScreen({
  subjectId,
  onNavigate,
}: {
  subjectId: string;
  onNavigate: (to: string) => void;
}): React.JSX.Element {
  const { session } = useSessionContext();
  const [subject, setSubject] = useState<SubjectSummary | null>(null);
  const [lessons, setLessons] = useState<readonly LessonRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    // One call carries both the subject metadata and its approved lessons, so
    // the header and the grid can never disagree about what is available.
    // `loading` starts true; the mount fetch only ever clears it, so the effect
    // does not switch the spinner on itself.
    void api
      .get<LearnerSubjectListResponse>(endpoints.learnerSubjects)
      .then((result) => {
        if (!live) return;
        if (result.ok) {
          const found = result.value.subjects.find((s) => s.id === subjectId);
          setSubject(found ?? null);
          setLessons(found?.lessons ?? []);
          setError(null);
        } else {
          setError(failureMessage(result.failure));
        }
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [subjectId]);

  return (
    <ProtectedScreen area="learner" session={session}>
      <div className="subject-page">
        <SubjectHeader
          subject={subject}
          onBack={() => onNavigate("/")}
          onHome={() => onNavigate("/")}
        />

        {loading ? <LoadingPanel what="danh sách bài học" /> : null}
        {error ? <ErrorPanel message={error} /> : null}

        {!loading && !error && lessons.length === 0 ? (
          <EmptyPanel title="Chưa có bài học nào được ghi nhận">
            <p>
              Môn này chưa có bài học nào đã được phụ huynh duyệt. Hãy nhờ phụ
              huynh mở khóa bài học trong khu phụ huynh.
            </p>
          </EmptyPanel>
        ) : null}

        {lessons.length > 0 ? (
          <section aria-labelledby="lessons-title">
            <h2 className="section-title" id="lessons-title">
              Bài học ({lessons.length})
            </h2>
            <LessonList
              lessons={lessons}
              onPick={(lessonId) => onNavigate(`/lessons/${lessonId}`)}
            />
          </section>
        ) : null}
      </div>
    </ProtectedScreen>
  );
}
