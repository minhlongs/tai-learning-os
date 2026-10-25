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
| `SUPPORTED` | Reached the answer **with help at level 3+**. | Làm được khi có hỗ trợ |
| `INDEPENDENT` | Solved with **no more than a small hint**. | Tự làm được |
| `RETAINED` | Solved independently again **after a scheduled review**. | Nhớ được sau thời gian ôn |
| `TRANSFERRED` | Solved a **transfer** question independently. | Áp dụng được vào tình huống mới |

### `COMPETENCY_CONFIG` — the real thresholds

```ts
export const COMPETENCY_CONFIG = {
  /** Correct attempts with help_level <= SMALL_HINT needed for INDEPENDENT. */
  independentMinCorrect: 2,
  /** Attempts at or below this help level count as "small hint". */
  smallHint: 2,
  /** An independent solve after a *scheduled* review earns RETAINED. */
  retainedRequiresScheduledReview: true,
} as const;
```

Three values. `independentMinCorrect: 2` is what stops a single lucky guess
establishing mastery. `smallHint: 2` defines the boundary — level 0, 1 and 2 all
count as "small"; 3 and 4 do not. `retainedRequiresScheduledReview` is a
documented intent; the derivation reads it through `isReview`, which
`scheduleReview` does not itself set.

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

```ts
export const REVIEW_CONFIG = {
  /** Interval ladder in days, climbed on each successful review. */
  intervals: [1, 3, 7, 14],
  /** Interval used for the first scheduled review after independent learning. */
  initialIntervalDays: 1,
  /** Interval after a failed review — rescheduled, not dropped. */
  failureRetryDays: 1,
  /** A skill with more than this many consecutive failures is flagged for parent review. */
  failureEscalation: 3,
} as const;
```

### The ladder

```
  success →  1 day  →  3 days  →  7 days  →  14 days   (then stays at 14)
                     ▲
                     └── position is chosen by FAILURE COUNT, not by success count
```

`scheduleReview(attempts, nowMs)` is a **pure function**: the due date is a pure
function of (last result, failure streak, interval ladder). No randomness, so the
parent can audit and argue with every schedule. The position on the ladder is:

```ts
const stepIndex = Math.min(failuresBefore, REVIEW_CONFIG.intervals.length - 1);
const intervalDays = REVIEW_CONFIG.intervals[stepIndex] ?? REVIEW_CONFIG.initialIntervalDays;
```

So `failuresBefore = 0` → 1 day, `1` → 3 days, `2` → 7 days, `3+` → capped at 14
days. The comment states the intent: *"a learner who struggled restarts low
rather than being pushed out to 14 days."*

### Failed review rescheduling

A failed (or merely assisted) review is **rescheduled, not dropped**:

```ts
if (!isIndependentAttempt(lastAttempt)) {
  const interval = REVIEW_CONFIG.failureRetryDays;   // 1 day
  return {
    dueAt: nowMs + interval * DAY_MS,
    intervalDays: interval,
    failureStreak: failuresBefore + 1,
    reason_vi: "Em cần ôn lại sớm vì lần làm gần nhất cần gợi ý.",
  };
}
```

The due date is `now + 1 day`. **Two honest caveats about what this branch
actually catches:**

- It triggers when the last attempt is **not an independent solve** — which means
  both `incorrect` **and** `correct at help level ≥ 3`. An assisted success is
  treated as "needs review soon", which is the conservative reading.
- `failuresBefore` is computed by `countTrailingFailures`, which counts trailing
  `incorrect` attempts regardless of whether they were scheduled reviews. The
  variable name says "failures before"; the code counts *all* trailing incorrect
  attempts on the skill. For a skill being learned for the first time these are
  the same thing; for a skill already reviewed they are not. **This is a real
  imprecision in the implementation, not a documentation simplification.**

### Failure streak

`failure_streak` in `review_schedule` is `+1` per failure, *"so scheduling stays
explainable."* It is **visible to the parent only** — never shown to the child.

`needsParentAttention(attempts)` escalates when the trailing consecutive failure streak reaches the threshold:

```ts
export function needsParentAttention(attempts: readonly AttemptEvidence[]): boolean {
  let trailingFailures = 0;
  for (let i = attempts.length - 1; i >= 0; i -= 1) {
    const a = attempts[i]!;
    if (isIndependentAttempt(a)) break;
    if (a.outcome === "incorrect") {
      trailingFailures += 1;
    }
  }
  return trailingFailures >= REVIEW_CONFIG.failureEscalation;
}
```

At 3 consecutive incorrect attempts (unbroken by an independent solve) the skill is **flagged for a human decision, not another automated retry**. Once the learner achieves an independent solve (`helpLevel <= 2`, `attemptNo === 1`), the trailing failure streak is broken and the flag resets automatically.

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

### ⚠ These are starting assumptions, not validated thresholds

Quoting the file directly:

> *"These intervals are starting assumptions for this MVP — NOT validated
> thresholds for this learner. They are configuration, not findings."*

`[1, 3, 7, 14]` is a **reasonable default**, not an empirically derived schedule
for any child. It has not been validated against this learner's forgetting
behaviour, and no data exists to validate it against — no sessions have been run.
Tuning requires real evidence; see [`ROADMAP_90_DAYS.md`](ROADMAP_90_DAYS.md)
phase 2.

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
