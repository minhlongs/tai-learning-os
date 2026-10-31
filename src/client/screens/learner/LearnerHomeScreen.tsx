/**
 * The learner's landing screen.
 *
 * Everything here comes from `LearnerHomeResponse`. The welcome name is
 * `learner.nickname` from the API — never a hardcoded "Chào Tài" — so a learner
 * with a different nickname is greeted correctly.
 *
 * It carries no score, no streak and no leaderboard: the product's claim is
 * about evidence, and a child sees only what they can act on next.
 */

import { useEffect, useState } from "react";
import type { LearnerHomeResponse } from "../../../shared/api-contract";
import { api, failureMessage } from "../../lib/api";
import { useSessionContext } from "../../lib/SessionProvider";
import { competencyClass, competencyGlyph, competencyLabel } from "../../lib/format";
import { ProtectedScreen } from "../../components/ProtectedScreen";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "../../components/ScreenState";
import { SubjectCards } from "./components/SubjectCards";
import { ObjectiveList } from "./components/ObjectiveList";
import { ReviewDueList } from "./components/ReviewDueList";
import { CompletedList } from "./components/CompletedList";
import "../../styles/learner-home.css";

export function LearnerHomeScreen({
  onNavigate,
}: {
  onNavigate: (to: string) => void;
}): React.JSX.Element {
  const { session } = useSessionContext();
  const [data, setData] = useState<LearnerHomeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    // `loading` starts true, so this effect only ever clears it. Switching the
    // spinner on from inside the effect is what React's cascading-render rule
    // objects to.
    void api.get<LearnerHomeResponse>("/api/learner/home").then((result) => {
      if (!live) return;
      if (result.ok) {
        setData(result.value);
        setError(null);
      } else {
        setError(failureMessage(result.failure));
      }
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, []);

  const nickname = data?.learner.nickname ?? session.learner?.nickname ?? null;

  return (
    <ProtectedScreen area="learner" session={session}>
      <div className="learner-home">
        <header className="page__header">
          <h1 className="page__title">
            {nickname ? `Chào ${nickname}!` : "Chào em!"}
          </h1>
          <p className="page__lede">
            Hôm nay em muốn học gì? Chọn một môn hoặc tiếp tục bài đang làm.
          </p>
        </header>

        {loading ? <LoadingPanel what="trang học tập" /> : null}
        {error ? <ErrorPanel message={error} /> : null}

        {data && !loading && !error ? (
          <>
            {data.continueLesson ? (
              <section className="card card--continue" aria-labelledby="continue-title">
                <h2 className="card__title" id="continue-title">
                  Bài đang học dở
                </h2>
                <p className="row__title">{data.continueLesson.titleVi}</p>
                <p className="row__meta">
                  Bước {data.continueLesson.stepPosition} ·{" "}
                  {subjectName(data.subjects, data.continueLesson.subjectId)}
                </p>
                <button
                  type="button"
                  className="btn btn--primary btn--large"
                  onClick={() => onNavigate(`/lessons/${data.continueLesson?.lessonId ?? ""}`)}
                >
                  Tiếp tục bài học
                </button>
              </section>
            ) : null}

            <section aria-labelledby="subjects-title">
              <h2 className="section-title" id="subjects-title">
                Môn học
              </h2>
              <SubjectCards
                subjects={data.subjects}
                onPick={(subjectId) => onNavigate(`/subjects/${subjectId}`)}
              />
            </section>

            {data.currentObjectives.length > 0 ? (
              <section className="card" aria-labelledby="objectives-title">
                <h2 className="card__title" id="objectives-title">
                  Kỹ năng em đang luyện
                </h2>
                <ObjectiveList objectives={data.currentObjectives} />
              </section>
            ) : null}

            {data.reviewDue.length > 0 ? (
              <section className="card card--attention" aria-labelledby="review-title">
                <h2 className="card__title" id="review-title">
                  Đến hạn ôn tập
                </h2>
                <ReviewDueList
                  entries={data.reviewDue}
                  subjectName={(id) => subjectName(data.subjects, id)}
                  onStartReview={(entry) => {
                    if (entry.lessonId) {
                      onNavigate(`/lessons/${entry.lessonId}`);
                    } else {
                      onNavigate(`/subjects/${entry.subjectId}`);
                    }
                  }}
                />
              </section>
            ) : null}

            {data.completedSessions.length > 0 ? (
              <section className="card" aria-labelledby="completed-title">
                <h2 className="card__title" id="completed-title">
                  Bài đã hoàn thành
                </h2>
                <CompletedList
                  sessions={data.completedSessions}
                  subjectName={(id) => subjectName(data.subjects, id)}
                />
              </section>
            ) : (
              <EmptyPanel title="Chưa có bài học nào được ghi nhận">
                <p>
                  Khi em hoàn thành một bài học, bài đó sẽ xuất hiện ở đây cùng
                  số câu em làm đúng.
                </p>
              </EmptyPanel>
            )}
          </>
        ) : null}

        <CompetencyLegend />
      </div>
    </ProtectedScreen>
  );
}

/** The subject's own name, or a neutral phrase when it is not loaded yet. */
function subjectName(
  subjects: LearnerHomeResponse["subjects"],
  subjectId: string,
): string {
  return subjects.find((s) => s.id === subjectId)?.nameVi ?? "Môn khác";
}

/**
 * A legend, not a progress meter. The glyph and the label together mean the
 * state never depends on colour alone.
 */
function CompetencyLegend(): React.JSX.Element {
  const sample = ["INDEPENDENT", "RETAINED", "SUPPORTED", "NOT_OBSERVED"] as const;
  return (
    <section className="card card--muted" aria-labelledby="legend-title">
      <h2 className="card__title" id="legend-title">
        Ý nghĩa các mốc
      </h2>
      <ul className="legend">
        {sample.map((state) => (
          <li key={state} className="legend__item">
            <span className={`pill ${competencyClass(state)}`}>
              <span aria-hidden="true">{competencyGlyph(state)}</span>
              {competencyLabel(state)}
            </span>
            <span className="row__meta">{legendText(state)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function legendText(state: "INDEPENDENT" | "RETAINED" | "SUPPORTED" | "NOT_OBSERVED"): string {
  switch (state) {
    case "INDEPENDENT":
      return "Em tự làm đúng nhiều lần.";
    case "RETAINED":
      return "Em vẫn nhớ sau thời gian chờ ôn.";
    case "SUPPORTED":
      return "Em làm đúng khi có gợi ý.";
    case "NOT_OBSERVED":
      return "Chưa có bài tập nào được ghi nhận.";
  }
}
