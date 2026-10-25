/**
 * The interactive lesson screen.
 *
 * This is the app's most integrity-critical screen. Four rules hold it to the
 * product's promise, and they are stated here because a future change to this
 * file could quietly break any of them:
 *
 *  1. THE ANSWER KEY IS NOT IN THE BROWSER. `StartSessionResponse` carries
 *     content only; `explanationVi` arrives null and is unlocked by the server
 *     on a correct answer. The step's expected answer is never sent, so it
 *     cannot be read from devtools or from this component's state.
 *
 *  2. CLICKING THROUGH IS NOT MASTERY. Advancing is possible only after a
 *     graded attempt. `partial` unlocks the next step, and the screen says
 *     plainly that the learner was helped — the server records the difference.
 *
 *  3. HELP IS PROGRESSIVE AND NOT RESETTABLE. Each step tracks the highest
 *     level the learner has ASKED for this session. Requesting level 0 never
 *     rewinds that: the client cannot claim a lower help level than the one
 *     actually used, because `helpLevel` sent on submit is the maximum reached.
 *
 *  4. NOTHING IS FABRICATED. No score, no timer-based skill rating, no streak,
 *     no animation reward. The screen shows what happened.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  StartSessionResponse,
  SubmitAttemptRequest,
  SubmitAttemptResponse,
} from "../../../shared/api-contract";
import type { ExerciseSpec } from "../../../shared/schemas/exercise";
import type { LessonStepKind } from "../../../shared/schemas/attempt";
import type { Submission } from "../../../shared/schemas/answer";
import { api, failureMessage } from "../../lib/api";
import { endpoints } from "../../lib/endpoints";
import { useSessionContext } from "../../lib/SessionProvider";
import { ProtectedScreen } from "../../components/ProtectedScreen";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "../../components/ScreenState";
import { ExerciseBody } from "./components/ExerciseBody";
import { StepProgress } from "./components/StepProgress";
import { HintTray } from "./components/HintTray";
import "../../styles/lesson.css";

/** Per-step state. The answered outcome and unlocked explanation live here. */
type StepState = {
  /** Highest hint level requested for this step, clamped 0..4. */
  helpLevel: number;
  /** Hints the server actually returned, in the order they were requested. */
  hints: string[];
  outcome: "correct" | "partial" | "incorrect" | null;
  messageVi: string | null;
  attemptNo: number;
  explanationVi: string | null;
};

const EMPTY_STEP: StepState = {
  helpLevel: 0,
  hints: [],
  outcome: null,
  messageVi: null,
  attemptNo: 0,
  explanationVi: null,
};

/** The five levels, in the product's fixed disclosure order. */
const HINT_LEVELS = [1, 2, 3, 4] as const;

export function LessonScreen({
  lessonId,
  onNavigate,
}: {
  lessonId: string;
  onNavigate: (to: string) => void;
}): React.JSX.Element {
  const { session } = useSessionContext();
  const [start, setStart] = useState<StartSessionResponse | null>(null);
  const [index, setIndex] = useState(0);
  const [stepStates, setStepStates] = useState<Record<string, StepState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  // Starting the session must happen exactly once per lesson. React StrictMode
  // double-invokes effects in development, and a duplicate POST would create a
  // second abandoned session row for the same lesson.
  const started = useRef<string | null>(null);

  useEffect(() => {
    let live = true;
    if (started.current === lessonId) return;
    started.current = lessonId;
    void api
      .post<StartSessionResponse>(endpoints.startSession, { lessonId })
      .then((result) => {
        if (!live) return;
        if (result.ok) {
          setStart(result.value);
          setError(null);
        } else {
          setError(failureMessage(result.failure));
        }
      });
    return () => {
      live = false;
    };
  }, [lessonId]);

  const steps = start?.steps ?? [];
  const step = steps[index] ?? null;
  const state = useMemo<StepState>(
    () => (step ? (stepStates[step.id] ?? EMPTY_STEP) : EMPTY_STEP),
    [step, stepStates],
  );

  const patchStep = useCallback((stepId: string, patch: Partial<StepState>) => {
    setStepStates((current) => ({ ...current, [stepId]: { ...(current[stepId] ?? EMPTY_STEP), ...patch } }));
  }, []);

  const onRequestHint = useCallback(
    (level: number) => {
      if (!step) return;
      if (state.helpLevel >= level) return;
      void api
        .post<{ level: number; hintVi: string | null }>(endpoints.requestHint, {
          stepId: step.id,
          currentLevel: level,
        })
        .then((result) => {
          if (!result.ok) {
            setError(failureMessage(result.failure));
            return;
          }
          // The server clamps and owns the text. We ask for `level`; we record
          // what came back, and the level we have reached is the max of both.
          patchStep(step.id, {
            helpLevel: Math.max(state.helpLevel, result.value.level),
            hints: result.value.hintVi ? [...state.hints, result.value.hintVi] : state.hints,
          });
        });
    },
    [patchStep, state.helpLevel, state.hints, step],
  );

  const onAnswer = useCallback(
    (submission: Submission) => {
      if (!step || !start) return;
      setSubmitting(true);
      const body: SubmitAttemptRequest = {
        stepId: step.id,
        submission,
        helpLevel: state.helpLevel,
      };
      void api
        .post<SubmitAttemptResponse>(endpoints.submitAttempt, body)
        .then((result) => {
          setSubmitting(false);
          if (!result.ok) {
            setError(failureMessage(result.failure));
            return;
          }
          patchStep(step.id, {
            outcome: result.value.outcome,
            messageVi: result.value.messageVi,
            attemptNo: result.value.attemptNo,
            explanationVi: result.value.explanationVi,
          });
        });
    },
    [patchStep, start, state.helpLevel, step],
  );

  const canAdvance = state.outcome === "correct" || state.outcome === "partial";
  const isLast = index >= steps.length - 1;

  const onFinish = useCallback(() => {
    if (!start) return;
    setFinishing(true);
    void api
      .post<{ sessionId: string; status: string; summary: unknown }>(endpoints.finalizeSession, {
        sessionId: start.sessionId,
      })
      .then((result) => {
        setFinishing(false);
        if (!result.ok) {
          setError(failureMessage(result.failure));
          return;
        }
        onNavigate(`/session/${start.sessionId}`);
      });
  }, [onNavigate, start]);

  if (error && !start) {
    return (
      <ProtectedScreen area="learner" session={session}>
        <ErrorPanel message={error} onRetry={() => onNavigate("/")} />
      </ProtectedScreen>
    );
  }

  return (
    <ProtectedScreen area="learner" session={session}>
      <div className="lesson-page">
        <header className="lesson-header">
          <button type="button" className="btn btn--secondary" onClick={() => onNavigate("/")}>
            ← Thoát bài học
          </button>
          <h1 className="lesson-header__title">{start ? start.lessonTitleVi : "Bài học"}</h1>
        </header>

        {!start ? <LoadingPanel what="bài học" /> : null}

        {start && steps.length === 0 ? (
          <EmptyPanel title="Bài học chưa có nội dung">
            <p>Bài học này chưa được nhập bước học nào.</p>
          </EmptyPanel>
        ) : null}

        {start && step ? (
          <>
            <StepProgress
              position={step.position}
              total={steps.length}
              /** A step is done when it was answered, not when it was viewed. */
              completed={Object.values(stepStates).filter((s) => s.outcome !== null).length}
            />

            <section className="lesson-card" aria-labelledby="step-question">
              <p className="lesson-card__kind">{stepKindLabel(step.kind)}</p>
              <h2 className="lesson-card__question" id="step-question">
                {questionOf(step.content)}
              </h2>
              <ExerciseBody exercise={step.content} onAnswer={onAnswer} disabled={submitting} />
            </section>

            <HintTray
              levels={HINT_LEVELS}
              reachedLevel={state.helpLevel}
              hints={state.hints}
              onRequest={onRequestHint}
            />

            {state.messageVi ? (
              <section
                className={`lesson-feedback lesson-feedback--${state.outcome ?? "incorrect"}`}
                role="status"
                aria-live="polite"
                data-testid="attempt-feedback"
              >
                <p className="lesson-feedback__message">{state.messageVi}</p>
                <p className="lesson-feedback__meta">
                  Lần thử: {state.attemptNo}
                  {state.helpLevel > 0 ? ` · Mức gợi ý đã dùng: ${state.helpLevel}` : ""}
                </p>
              </section>
            ) : null}

            {state.explanationVi ? (
              <section className="lesson-explanation" aria-labelledby="explanation-title">
                <h3 id="explanation-title">Giải thích</h3>
                <p>{state.explanationVi}</p>
              </section>
            ) : null}

            <nav className="lesson-nav" aria-label="Điều hướng bài học">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0}
              >
                ← Bước trước
              </button>
  {isLast ? (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={onFinish}
                  disabled={!canAdvance || finishing}
                >
                  {finishing ? "Đang kết thúc…" : "Kết thúc bài học"}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setIndex((i) => i + 1)}
                  disabled={!canAdvance}
                  data-testid="next-step"
                >
                  Bước tiếp theo →
                </button>
              )}
            </nav>

            {/* Why the next button is disabled, said once and only when it is. */}
            {!canAdvance && index < steps.length - 1 ? (
              <p className="lesson-nav__note">Em cần trả lời đúng bước này để sang bước tiếp theo.</p>
            ) : null}
          </>
        ) : null}
      </div>
    </ProtectedScreen>
  );
}

/** Vietnamese label for a lesson step's kind. Read-only: nothing is invented. */
function stepKindLabel(kind: LessonStepKind): string {
  switch (kind) {
    case "concept":
      return "Khái niệm";
    case "visual":
      return "Khám phá hình ảnh";
    case "guided":
      return "Luyện tập có hướng dẫn";
    case "independent":
      return "Tự làm";
    case "transfer":
      return "Kiểm tra vận dụng";
    default: {
      const exhaustive: never = kind;
      void exhaustive;
      return "Bước học";
    }
  }
}

/**
 * The learner-facing question. Every exercise type carries a `question_vi`;
 * the mapping is written out per case so that adding a type without a question
 * is a compile error rather than an empty heading.
 */
function questionOf(exercise: ExerciseSpec): string {
  switch (exercise.type) {
    case "fraction_visual":
      return exercise.question_vi;
    case "vocab_match":
      return exercise.question_vi;
    case "reading_comprehension":
      return exercise.question_vi;
    case "multiple_choice":
      return exercise.question_vi;
  }
}
