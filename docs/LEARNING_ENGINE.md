# TAI LEARNING OS — Learning Engine

What the engine does, exactly, and — just as important — what it does not do.

Owner of the logic: [`src/shared/engine/competency.ts`](../src/shared/engine/competency.ts)
(competency) and [`src/shared/engine/review.ts`](../src/shared/engine/review.ts)
(spaced review). Both are pure, deterministic, and re-runnable.

---

## 1. The teaching sequence

```
 CONCEPT ──▶ VISUAL ──▶ GUIDED ──▶ INDEPENDENT ──▶ TRANSFER ──▶ REVIEW
   │           │          │             │              │           │
 what it is  see it   with a hint   alone      new situation   after a delay
```

The seven stages, and what each one is for:

| Stage | `lesson_steps.kind` | Purpose |
|---|---|---|
| **CONCEPT** | `concept` | Name the idea before touching a problem. |
| **VISUAL** | `visual` | Make it concrete — e.g. a fraction bar split into equal parts. |
| **GUIDED** | `guided` | Practise with scaffolding (hints available, levels 1–2). |
| **INDEPENDENT** | `independent` | Attempt with **no more than a small hint**. This is where "can do it" is established. |
| **EXPLANATION** | *(no `kind`)* | Shown **only after the attempt**. Held in `lesson_steps.explanation_vi`, never before — showing it first would answer the question. |
| **TRANSFER** | `transfer` | Apply the skill to a situation not seen in the lesson. This is where "understood it" is established. |
| **REVIEW** | *(no `kind`)* | Return to the skill after a delay. Establishes retention. |

**Note on the CHECK constraint.** `lesson_steps.kind` allows exactly
`('concept','visual','guided','independent','transfer')` — five values.
`EXPLANATION` and `REVIEW` are **not** kinds. Explanation is a column on the step
(`explanation_vi`), and Review is not a lesson step at all: it is the
`review_schedule` queue drawing from the same skill. This is a real asymmetry in
the schema, and it is deliberate: the five kinds are *lesson content*, while
review is *scheduling over* that content.

Skills, not lessons, are the unit of competency. A lesson is a container of steps;
`learning_attempts.skill_id` may be `NULL` (ON DELETE SET NULL), so an attempt can
belong to a lesson whose skill was later removed without destroying the evidence
record.

---

## 2. Hint levels 0–4

`hintFor(exercise, level)` in [`src/shared/schemas/answer.ts`](../src/shared/schemas/answer.ts).
`clampHelp` bounds every level to 0..4; anything non-finite or out of range
collapses to the nearest valid value.

| Level | Name | Meaning | Example (`vocab_match`) |
|---|---|---|---|
| **0** | none | No hint. The learner answers from what they know. | *(returns `null`)* |
| **1** | orientation | **Point to the task**, not the answer. | "Em hãy nhìn tranh và đoán nội dung bằng tiếng Việt trước." *(Look at the picture and guess the content in Vietnamese first.)* |
| **2** | narrowing | **Narrow the field.** Still not the answer. | "Em hãy đọc kỹ từ vựng ở trên." *(Read the vocabulary word above carefully.)* |
| **3** | worked scaffold | The learner is **shown a worked step or near-solution**. | `exercise.sentencePrompt_vi` — the sentence frame to fill in. |
| **4** | near-answer | **Approaches the answer directly.** The method has been shown. | `Từ vựng cần dùng là: "<word>".` *(The word you must use is "<word>".)* |

**The rule that matters:**

> **A hint level of 3 or higher makes the answer "assisted", not "independent".**
> A fully revealed solution can never be recorded as an independent solve.

Enforced in `gradeSubmission` as `const assisted = effectiveHelp >= 3;`. There is
exactly one code path, on the server, so there is no way to record an assisted
solve as independent.

The ceiling is deliberately **4, not "show the answer."** The comment in
`answer.ts` is explicit: *"Higher levels approach the answer but the answer text is
never simply handed over as a clickable string."* Level 4 names what the learner
must do; it does not do it for them. Hints are Vietnamese-first (`hint1_vi`,
`hint2_vi`, `hint3_vi` are required fields in `exercise.ts`).

`multiple_choice` carries three authored hints (`hint1_vi`…`hint3_vi`) and
**borrows a generic string for level 4** — that type has no `word` or `evidence`
field to name, so level 4 is a fixed strategy prompt rather than a specific
disclosure.

### Provenance of the hint level

`clampHelp` is applied by both the grader and `hintFor`, so the recorded level and
the revealed hint can never disagree. Per [`ARCHITECTURE.md`](ARCHITECTURE.md) §2,
the **Worker resolves `help_level` as the maximum hint actually revealed**. A
client that posts `help_level: 0` after being shown a worked example cannot
retroactively make its answer independent.

---

## 3. The five competency states

```
   NOT_OBSERVED ──▶ SUPPORTED ──▶ INDEPENDENT ──▶ RETAINED ──▶ TRANSFERRED
                                                                     ▲
        └────────────────────────────────────────────────────────────┘
                    (transfer solved independently at any point after
                     INDEPENDENT is reached)
```

The ladder as documented in `competency.ts`:

| State | Meaning | `describeState` (shown to the parent) |
|---|---|---|
| `NOT_OBSERVED` | No independent solve recorded. | Chưa quan sát được |
| `SUPPORTED` | Reached the answer **with any hint (`helpLevel >= 1`) or retry (`attemptNo > 1`)**. | Làm được khi có hỗ trợ |
| `INDEPENDENT` | Solved **on the first attempt (`attemptNo === 1`) with zero hints (`helpLevel === 0`) and `evidenceKind === "observed"` across `>= 2` distinct sessions**. | Tự làm được |
| `RETAINED` | Solved independently again **after a due scheduled review (`now >= due_at`)**. | Nhớ được sau thời gian ôn |
| `TRANSFERRED` | Solved a **transfer** question independently (with `>= 2` independent solves across `>= 2` distinct sessions). | Áp dụng được vào tình huống mới |

### `COMPETENCY_CONFIG` — the real thresholds

```ts
export const COMPETENCY_CONFIG = {
  /** Correct attempts with help_level === 0 needed for INDEPENDENT. */
  independentMinCorrect: 2,
  /** Distinct learning sessions required before INDEPENDENT is confirmed (Gate G6). */
  independentMinDistinctSessions: 2,
  /** Only zero-hint attempts count toward independent mastery. */
  smallHint: 0,
  /** An independent solve after a *scheduled* review earns RETAINED. */
  retainedRequiresScheduledReview: true,
} as const;
```

Four values. `independentMinCorrect: 2` stops a single lucky guess establishing mastery, while `independentMinDistinctSessions: 2` prevents two back-to-back solves inside the same sitting from claiming durable independence (two independent solves in one session stay `SUPPORTED` until confirmed in a second session; see [`adr/ADR-006-cross-session-mastery-session-cap-and-open-portability.md`](adr/ADR-006-cross-session-mastery-session-cap-and-open-portability.md)). `smallHint: 0` enforces the strict boundary — only `helpLevel === 0` counts as independent; any hint usage (`1`, `2`, `3`, `4`) or pre-due repeat attempt (`attemptNo > 1`) is classified as `assisted` (`SUPPORTED`). When a scheduled review becomes due (`now >= due_at`), the learner's first zero-hint attempt on that skill inside the review session is unlocked as `observed` so 1-to-1 skill lessons can reach `RETAINED` while pre-due retries remain blocked by Gate A2.

### Session duration & eye-rest budget (Gate G9)

`src/shared/engine/session-budget.ts` enforces a deterministic **25-minute Soft Stop** (`MAX_LEARNER_SESSION_MS = 25 * 60 * 1000`) for Grades 4–5:

- An in-flight step submission that crosses the 25-minute mark is still graded and atomically recorded (`sessionTimeBudgetReached: true`, `canAdvance: false`) so the learner never loses work mid-problem.
- Advancing to a subsequent step or starting a new session is paused for a **15-minute eye-rest cooldown** (`EYE_REST_COOLDOWN_MS`), unless a parent verifies their password via `POST /api/learner/sessions/extend` (+15 minutes, recorded in `audit_events` as `session.time_extended` or `session.rest_overridden`).

### The exact derivation rule

`deriveCompetency(attempts)` — deterministic and total. Same attempts, same state,
always. Evaluated **in this order**, first match wins:

```ts
// 1. Nothing at all
if (relevant.length === 0)                                        → NOT_OBSERVED

// 2. TRANSFERRED — transfer question, independent, and already ≥2 independent
    some(a => a.isTransfer && isIndependentAttempt(a)
             && independentCount >= COMPETENCY_CONFIG.independentMinCorrect)
                                                                  → TRANSFERRED

// 3. RETAINED — a *scheduled review*, independent, and already ≥2 independent
    some(a => a.isReview && isIndependentAttempt(a)
             && independentCount >= COMPETENCY_CONFIG.independentMinCorrect)
                                                                  → RETAINED

// 4. INDEPENDENT — ≥2 correct attempts at help_level <= smallHint
    independentCount >= COMPETENCY_CONFIG.independentMinCorrect   → INDEPENDENT

// 5. SUPPORTED — correct at least once, but only with help above smallHint
    assistedCount > 0                                             → SUPPORTED

// 6. fallback — tried, never solved independently
                                                                  → NOT_OBSERVED
```

The helper that decides attempts 2–4:

```ts
export function isIndependentAttempt(evidence: AttemptEvidence): boolean {
  if (evidence.evidenceKind === "parent_correction") return false;
  if (evidence.outcome !== "correct") return false;
  if (evidence.helpLevel > COMPETENCY_CONFIG.smallHint) return false;
  if (evidence.attemptNo !== undefined && evidence.attemptNo > 1) return false;
  return true;
}
```

Four consequences worth stating, because they are the reason the states are
trustworthy:

1. **`parent_correction` can never establish independence.** A parent's hand
   observation is recorded and audited, but it does not climb the ladder. Only
   the child's own attempts do. (This is a stricter reading than the table —
   `skill_evidence.source = 'parent_correction'` records an override to the
   *state row*, while this gate governs which attempts *feed* the derivation.)
2. **Order matters and is intentional.** TRANSFERRED is checked *before*
   RETAINED, so a learner who transfers after reviewing reports the stronger
   signal. RETAINED and TRANSFERRED both require ≥2 independent solves first —
   one independent solve of a review or transfer question is not enough.
3. **`partial` never counts.** Only `outcome === "correct"` counts as correct
   anywhere in this derivation. A `partial` (correct with help level ≥3) is
   evidence of support, not of competence.
4. **Every state carries a `reason_vi`.** The parent dashboard shows the reason,
   not just the label — e.g. *"Em tự làm đúng 3 lần (cần tối thiểu 2)."* The
   engine never claims more than the evidence supports.

---

## 4. Spaced review

Intervals are computed by **FSRS-6** (`ts-fsrs` 6.0.0), not by a hand-written
ladder. The scheduler keeps FSRS's memory model and adds this project's policy
rules around it:

```ts
export const REVIEW_CONFIG = {
  /** Target probability of recall at the due date. */
  requestRetention: 0.95,
  /** Ceiling for this learner; FSRS itself allows far longer. */
  maximumIntervalDays: 30,
  /** Interval after a failed review — retried tomorrow, not at an FSRS lapse. */
  failureRetryDays: 1,
  /** Floor for any computed interval; a review is never same-day. */
  minimumIntervalDays: 1,
  /** A skill with this many consecutive failures is flagged for parent review. */
  failureEscalation: 3,
} as const;
```

### How the interval is decided

`scheduleReview(attempts, nowMs)` is still a **pure function**: the same attempt
history always produces the same interval and the same due date.

1. The **decision point** is the last attempt the learner answered **correctly**.
   A failure recorded after that solve is input to the *next* decision, not this
   one — it has not yet disproven anything that was known when the solve happened.
2. If a **scheduled review** failed after that solve, the interval is
   `failureRetryDays` (1 day). FSRS's own lapse interval assumes the learner was
   genuinely recalling the item; a failed review is evidence they were not, so we
   retry tomorrow instead of trusting the model's lapse estimate.
3. If the solve was **not independent** (any hint, or a retry), the interval is
   also 1 day. Assistance is evidence of needing help, not of retention.
4. Otherwise the attempts **up to and including that solve** are replayed through
   FSRS in chronological order, each graded as `Good` (independent correct),
   `Hard` (assisted correct) or `Again` (wrong). The resulting
   `card.scheduled_days` is clamped to `[minimumIntervalDays, maximumIntervalDays]`.

Two configuration choices make that deterministic and explainable:

- **`enable_fuzz: false`.** FSRS normally fuzzes intervals on purpose, to spread
  due dates and avoid pile-ups. Fuzzing would make this function impure and the
  parent unable to reproduce a schedule, so it is off.
- **`enable_short_term: false`.** The short-term scheduler emits sub-day steps
  (minutes). This household runs one session per day, and `review_schedule.
  interval_days` is an integer number of days, so a 10-minute step would mark a
  skill due before the child next opens the app.

### What the intervals actually look like

Measured on this machine by replaying on-time reviews through the configured
scheduler (`node --input-type=module`, `ts-fsrs@6.0.0`):

```
first Good solve          →  3 days
then, reviewed on time    →  6 → 15 → 30 → 30 …   (ceiling holds)
first answer Again        →  1 day
first answer Hard         →  2 days (clamped up to the 1-day floor only if 0)
after a 4-solve streak,
one failed review          →  1 day, failureStreak 1
```

`requestRetention: 0.95` and `maximumIntervalDays: 30` are deliberate:

| retention | uncapped ladder after each Good | why not |
|---|---|---|
| 0.80 | 8 → 75 → 120 → 120 | a 9-year-old forgets long before 75 days |
| 0.90 | 3 → 14 → 57 → 120 | FSRS's adult self-study default; leaves a lapse-prone gap |
| **0.95** | **3 → 6 → 15 → 34 → 72** | **chosen: frequent enough that a forgotten skill resurfaces inside a term** |
| 0.97 | 3 → 3 → 6 → 11 → 19 | so frequent it turns revision into rote drilling |

The 30-day ceiling matters because at 0.95 the uncapped ladder reaches 72 days
by the fifth success. Thirty days is long enough that a 9-year-old still recalls
the skill and short enough that a forgotten one resurfaces before the next report
card. Neither number is validated against this learner's forgetting curve — see
[`ROADMAP_90_DAYS.md`](ROADMAP_90_DAYS.md) phase 2 — but both are now *stated
inputs* rather than an unexamined ladder. The full reasoning is in
[`adr/ADR-002-fsrs-spaced-review.md`](adr/ADR-002-fsrs-spaced-review.md).

### Calendar days, Vietnam time

`dueAt` is always `nowMs + intervalDays * DAY_MS`, an exact multiple of 24 hours.
Vietnam has no daylight saving, so in `Asia/Ho_Chi_Minh` this lands on the same
clock time N calendar days later. `ReviewDecision.dueOnVi` exposes that date as
`YYYY-MM-DD` in Vietnam time so the parent reads a date rather than an offset.

### Failure streak

`failure_streak` in `review_schedule` counts the run of wrong answers leading up
to the decision point. It is **visible to the parent only** — never shown to the
child.

When the last solve needed help, the solve itself joins the run, so the parent
sees `1` after an assisted answer rather than a clean-looking `0` that hides the
assistance.

`needsParentAttention(attempts)` escalates when the trailing consecutive failure
streak reaches 3, unbroken by an independent solve. At that point the skill is
**flagged for a human decision, not another automated retry**.

### Selection

```ts
export function selectDueForReview<T extends { dueAt: number; skillId: string }>(
  queue: readonly T[], nowMs: number,
): T[]
```

Returns everything with `dueAt <= nowMs`, **most overdue first**. No cap is
applied here, so a long backlog is presented whole rather than truncated — the
choice of how much to attempt in one sitting is the parent's and child's, not the
scheduler's.

### ⚠ Still starting assumptions, not validated thresholds

FSRS is a well-tested *model of memory*, but its parameters are population
defaults, not this child's. `requestRetention: 0.95` is a pedagogical judgement
(a school-scale ladder), and `maximumIntervalDays: 30` is a ceiling chosen for a
4th grader. Neither has been fitted to this learner, because no data exists yet
to fit against. They are configuration, not findings.

---

## 5. What the engine does NOT do

Stated plainly, because a system that measures children invites these readings
and the design refuses all of them:

| The engine does **not** | Why not |
|---|---|
| **Estimate IQ or any general ability score** | Nothing here measures a latent trait. Only *specific skills* are observed, one at a time, via specific exercises. No score is aggregated across skills. |
| **Attach psychological or diagnostic labels** | No "gifted", "slow", "struggling", "behind", or any clinical term exists in the vocabulary. `describeState` describes *what was observed*, never what the child *is*. |
| **Predict a profession or future outcome** | No model maps a state to a career, a school track, or a future. `learning_goals` is explicitly *"Direction from the family, NOT measured ability."* |
| **Merge everything into one "score"** | The schema header forbids it: the system *"never [stores] a single merged 'score'."* Evidence and interpretation are in separate tables. |
| **Rank learners against each other** | There is no leaderboard, no percentile, no peer comparison, and no multi-learner aggregation anywhere in the schema. |
| **Show the child their own evidence** | Outcomes and Vietnamese feedback messages reach the child. States, streaks, counts, and schedules do not — they are parent-facing only. |
| **Let a parent's opinion overwrite evidence** | `skill_evidence.source = 'parent_correction'` records an override **as a labelled correction** with a note, and `isIndependentAttempt` excludes `parent_correction` attempts from climbing the ladder. Evidence stays distinguishable from opinion. |

The single sentence that captures the whole posture, from `competency.ts`:

> *"A competency state is never stored as an independent assertion. It is derived
> from the learner's attempts, and the derivation is re-runnable so the parent can
> always see WHY a state was reached."*

---

## 6. Related documents

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — where the engine runs, and why the client cannot cheat it.
- [`DATA_MODEL.md`](DATA_MODEL.md) — the tables these engines write to.
- [`CHILD_PRIVACY_REVIEW.md`](CHILD_PRIVACY_REVIEW.md) — what "no labels" means in engineering controls.
- [`PARENT_OPERATIONS.md`](PARENT_OPERATIONS.md) — how a parent reads the dashboard.
- [`ROADMAP_90_DAYS.md`](ROADMAP_90_DAYS.md) — how these assumptions get tested.
