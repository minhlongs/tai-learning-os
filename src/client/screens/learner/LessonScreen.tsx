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

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type {
  ExtendSessionTimeResponse,
  RequestHintRequest,
  StartSessionResponse,
  SubmitAttemptRequest,
  SubmitAttemptResponse,
} from "../../../shared/api-contract";
import { MAX_LEARNER_SESSION_MINUTES } from "../../../shared/engine/session-budget";
import type { LearnerExerciseSpec } from "../../../shared/schemas/exercise";
import type { LessonStepKind } from "../../../shared/schemas/attempt";
import type { Submission } from "../../../shared/schemas/answer";
import { api, failureMessage } from "../../lib/api";
import { endpoints } from "../../lib/endpoints";
import { useSessionContext } from "../../lib/session-context";
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

/** In-flight or completed start-session requests, keyed by lesson id.
 *
 * Module-level on purpose: React StrictMode double-invokes effects in
 * development, so the mount effect runs twice in quick succession and both
 * invocations would otherwise POST a session for the same lesson. Which means a
 * real HTTP request the moment the screen opens, and two concurrent ones race
 * each other on the server for rows that are meant to be written once.
 *
 * Two properties matter and neither follows from the other:
 *
 *  - It caches the PROMISE, not a flag. A `Set` of issued lesson ids looks like
 *    the same guard, but the first invocation's cleanup sets `live` false before
 *    its response arrives, so the second invocation would skip the post AND find
 *    nothing stored — the screen would load forever. The promise is shared, so
 *    a later caller simply awaits the request that is already running.
 *  - It caches FAILURES as a settled promise too, so a rejected attempt is not
 *    replayed forever; the learner can retry by re-entering the lesson. */
const startSessionFlights = new Map<string, Promise<StartSessionResponse>>();

/** POST a session for `lessonId`, joining one already in flight. */
function startSessionFlight(lessonId: string): Promise<StartSessionResponse> {
  const existing = startSessionFlights.get(lessonId);
  if (existing) return existing;

  const flight = api
    .post<StartSessionResponse>(endpoints.startSession, { lessonId })
    .then((result) => {
      if (result.ok) return result.value;
      // Do not memoize a failure: a network blip must not pin the lesson shut
      // for the rest of the browser session.
      startSessionFlights.delete(lessonId);
      throw new Error(failureMessage(result.failure));
    });
  startSessionFlights.set(lessonId, flight);
  return flight;
}

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
  const [budgetReachedAfterStep, setBudgetReachedAfterStep] = useState(false);
  const [showExtendForm, setShowExtendForm] = useState(false);
  const [parentPassword, setParentPassword] = useState("");
  const [extending, setExtending] = useState(false);
  const [extendError, setExtendError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void startSessionFlight(lessonId)
      .then((value) => {
        if (!live) return;
        setStart(value);
        setError(null);
      })
      .catch((error: unknown) => {
        if (!live) return;
        // The flight rejects with an already-localised message, so this is a
        // fallback for an unexpected throw rather than a second translation.
        setError(error instanceof Error ? error.message : "Không mở được bài học.");
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
      if (!step || !start) return;
      if (state.helpLevel >= level) return;
      const body: RequestHintRequest = {
        stepId: step.id,
        currentLevel: level,
        sessionId: start.sessionId,
      };
      void api
        .post<{ level: number; hintVi: string | null }>(endpoints.requestHint, body)
        .then((result) => {
          if (!result.ok) {
            setError(failureMessage(result.failure));
            return;
          }
          // The server clamps and owns the text. We ask for `level`; we record
          // what came back, and the level we have reached is the max of both.
          setError(null);
          patchStep(step.id, {
            helpLevel: Math.max(state.helpLevel, result.value.level),
            hints: result.value.hintVi ? [...state.hints, result.value.hintVi] : state.hints,
          });
        });
    },
    [patchStep, start, state.helpLevel, state.hints, step],
  );

  const onAnswer = useCallback(
    (submission: Submission) => {
      if (!step || !start) return;
      setSubmitting(true);
      const body: SubmitAttemptRequest = {
        stepId: step.id,
        sessionId: start.sessionId,
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
          setError(null);
          if (result.value.sessionTimeBudgetReached) {
            setBudgetReachedAfterStep(true);
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

  const isSoftStopped = budgetReachedAfterStep;
  const canAdvance =
    !submitting &&
    !isSoftStopped &&
    (state.outcome === "correct" || state.outcome === "partial");
  const isLast = index >= steps.length - 1;

  const onExtendSession = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (!start || !parentPassword.trim()) {
        setExtendError("Phụ huynh vui lòng nhập mật khẩu.");
        return;
      }
      setExtending(true);
      setExtendError(null);
      void api
        .post<ExtendSessionTimeResponse>(endpoints.extendSessionTime, {
          sessionId: start.sessionId,
          password: parentPassword,
        })
        .then((result) => {
          setExtending(false);
          if (!result.ok) {
            setExtendError(failureMessage(result.failure));
            return;
          }
          setParentPassword("");
          setShowExtendForm(false);
          setBudgetReachedAfterStep(false);
          setStart((prev) =>
            prev
              ? {
                  ...prev,
                  sessionBudget: prev.sessionBudget
                    ? {
                        ...prev.sessionBudget,
                        extensionCount: result.value.extensionCount,
                        budgetMs: result.value.budgetMs ?? prev.sessionBudget.budgetMs,
                        reached: false,
                      }
                    : undefined,
                }
              : prev,
          );
        });
    },
    [parentPassword, start],
  );

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
        startSessionFlights.delete(lessonId);
        onNavigate(`/session/${start.sessionId}`);
      });
  }, [lessonId, onNavigate, start]);

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
          {start?.purpose === "practice" ? (
            <span className="pill" data-testid="lesson-practice-badge">
              Luyện tập gia đình
            </span>
          ) : null}
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
              <ExerciseBody
                key={step.id}
                exercise={step.content}
                onAnswer={onAnswer}
                disabled={submitting}
              />
            </section>

            {error ? (
              <p className="lesson-error" role="alert">
                {error}
              </p>
            ) : null}

            <HintTray
              levels={HINT_LEVELS}
              reachedLevel={state.helpLevel}
              hints={state.hints}
              onRequest={onRequestHint}
            />

            {!submitting && state.messageVi ? (
              <section
                className={`lesson-feedback lesson-feedback--${state.outcome ?? "incorrect"}`}
                role="status"
                aria-live="polite"
                data-testid="attempt-feedback"
                /* The graded outcome, in the DOM rather than only in the copy.
                   The message text is chosen per outcome and reworded per
                   exercise type, so matching Vietnamese strings to recover the
                   outcome would make every consumer a translator. */
                data-outcome={state.outcome ?? "incorrect"}
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

            {isSoftStopped ? (
              <section
                className="lesson-rest-banner"
                role="status"
                aria-live="polite"
                data-testid="session-soft-stop-banner"
              >
                <h3 className="lesson-rest-banner__title">
                  Em đã học trọn {MAX_LEARNER_SESSION_MINUTES} phút rồi — mình nghỉ mắt nhé!
                </h3>
                <p>
                  Câu trả lời vừa rồi đã được lưu lại đầy đủ. Em hãy lưu kết quả phiên học,
                  đứng dậy nhìn xa thư giãn mắt ít nhất 15 phút trước khi học tiếp.
                </p>
                <div className="lesson-rest-banner__actions">
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={onFinish}
                    disabled={finishing}
                    data-testid="soft-stop-finish"
                  >
                    {finishing ? "Đang lưu kết quả…" : "Nghỉ mắt & xem tổng kết"}
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setShowExtendForm((v) => !v)}
                    data-testid="toggle-parent-extend"
                  >
                    Phụ huynh gia hạn (+15 phút)
                  </button>
                </div>

                {showExtendForm ? (
                  <form className="lesson-extend-form" onSubmit={onExtendSession}>
                    <label className="field" htmlFor="extend-parent-password">
                      <span className="field__label">Mật khẩu phụ huynh</span>
                      <input
                        id="extend-parent-password"
                        type="password"
                        className="input"
                        value={parentPassword}
                        onChange={(e) => setParentPassword(e.target.value)}
                        autoComplete="current-password"
                        disabled={extending}
                      />
                    </label>
                    <button
                      type="submit"
                      className="btn btn--secondary"
                      disabled={extending}
                      data-testid="confirm-parent-extend"
                    >
                      {extending ? "Đang xác nhận…" : "Xác nhận gia hạn"}
                    </button>
                    {extendError ? (
                      <p className="field__error" role="alert">
                        {extendError}
                      </p>
                    ) : null}
                  </form>
                ) : null}
              </section>
            ) : null}

            <nav className="lesson-nav" aria-label="Điều hướng bài học">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0 || isSoftStopped}
              >
                ← Bước trước
              </button>
              {isLast ? (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={onFinish}
                  disabled={(!canAdvance && !isSoftStopped) || finishing}
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
            {!canAdvance && !isSoftStopped && index < steps.length - 1 ? (
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
function questionOf(exercise: LearnerExerciseSpec): string {
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
