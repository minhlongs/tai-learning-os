# TAI LEARNING OS — Architecture

> **Status: partial implementation.** This document describes the architecture the
> repository is moving toward, and marks clearly which parts exist today.
> `src/shared/`, the Worker's HTTP + data + route handler layers, and part of the
> React client are implemented; the route table (`src/worker/index.ts`) and the
> scripts do **not** exist yet. Anything marked *planned* is not implemented and
> has not been tested.

The platform is **Vietnamese-first**: `Tiếng Việt` is the primary learner-facing
language, English is secondary. Read the vocabulary in
[`src/shared/schemas/attempt.ts`](../src/shared/schemas/attempt.ts) — those string
unions are the canonical contract shared by client, worker, and database. The
frozen HTTP surface is [`src/shared/api-contract.ts`](../src/shared/api-contract.ts).

---

## 1. Component map

```
┌──────────────────────────────────────────────────────────────────────┐
│  BROWSER  —  React SPA  (src/client/)               part-implemented │
│                                                                      │
│   • renders lessons; never decides correctness                        │
│   • holds the parent session cookie; sends it with every request      │
│   •   lib/api.ts        typed fetch wrapper          [done]           │
│   •   lib/csrf-store.ts CSRF token outside React   [done]            │
│   •   lib/useSession.ts GET /api/session on mount   [done]           │
│   •   App.tsx / main.tsx / styles/                 [done]            │
│   •   screens & pages (login, lesson, dashboard)   [planned]        │
│   • @/* path alias  (tsconfig.app.json)                              │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ HTTPS (same origin; Worker also serves
                            │ the SPA via the assets binding)
┌───────────────────────────▼──────────────────────────────────────────┐
│  CLOUDFLARE WORKER                                                  │
│                                                                      │
│  src/worker/index.ts   ← ROUTE TABLE / ENTRY           [planned]     │
│  src/worker/http/middleware.ts  dispatch()  ← auth+CSRF+rate  [done] │
│  src/worker/http/response.ts     json/errors/csrfOk     [done]       │
│  src/worker/routes/session.ts  login/logout/session   [done]        │
│  src/worker/services/session-service.ts attempts      [done]        │
│  src/worker/db/repositories.ts   all SQL, owner-scoped  [done]       │
│  src/worker/db/schema.ts         D1 row types           [done]       │
│                                                                      │
│   • sole authority: auth, authorization, grading, scheduling         │
│   • rate-limited: AUTH_RATE_LIMITER (5/60s), API_RATE_LIMITER (120/60s)│
│   • env: wrangler.jsonc  vars.ENVIRONMENT = "development"            │
└───────┬───────────────────────────────┬──────────────────────────────┘
        │ DB binding                    │ secrets (deploy time only)
        ▼                               ▼
┌───────────────────────────────┐   ┌─────────────────────────────────┐
│  D1  (SQLite, local-only)     │   │  .dev.vars (gitignored)         │
│  binding: DB                  │   │  SESSION_SECRET                 │
│  migrations/0001, 0002        │   │  PARENT_PASSWORD_HASH           │
│  15 tables — see DATA_MODEL   │   │  never in source, never in docs │
└───────────────────────────────┘   └─────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  SHARED DOMAIN  (src/shared/)                        ← implemented   │
│                                                                      │
│   schemas/    exercise.ts   attempt.ts   answer.ts   transfer.ts     │
│   api-contract.ts  ← frozen HTTP surface                             │
│   content/    types.ts + 3 math lessons          [done, unseeded*]   │
│   engine/     competency.ts review.ts                                 │
│   crypto/     password.ts   session.ts   timing-safe-equal.ts         │
│                                                                      │
│   @shared/* path alias (tsconfig.worker.json + tsconfig.app.json)    │
│   Imported by BOTH the client and the Worker. Because both sides run │
│   the same code, they cannot drift apart on vocabulary.              │
└──────────────────────────────────────────────────────────────────────┘
```

### Why `src/shared/` exists at all

The shared domain is the reason the two runtimes cannot disagree. The exercise
validator, the grader, the competency derivation, and the review scheduler are
one implementation, imported by both sides. `answer.ts` states the rule
directly: *"Every answer is checked here, on the server, with one code path. The
client never decides correctness: it only renders."*

`src/shared/schemas/attempt.ts` carries a warning worth repeating: those string
unions are **duplicated as CHECK constraints in the SQL schema**. Changing one
without the other is a bug, not a style choice.

---

## 2. Why the Worker holds all authority

This is the load-bearing architectural decision, so it is worth stating plainly.

**The client never validates an answer.** It cannot: the answer key
(`lesson_steps.answer_key`) and the validator (`gradeSubmission` in
[`answer.ts`](../src/shared/schemas/answer.ts)) live server-side. A learner who
opens devtools and edits the React bundle cannot mark a step correct, because the
browser never learns whether it was correct until the Worker says so.

`api-contract.ts` makes the boundary explicit in a type comment:
`LessonStepPayload` is *"What the client is allowed to see. **Never includes the
answer key**"*, and `explanationVi` is *"withheld until the step is completed."*
The answer key is exposed only in `LessonDetailResponse`, which is a
**parent** endpoint.

Concretely, the Worker alone:

- **verifies the parent session before returning anything.** `dispatch()` in
  [`middleware.ts`](../src/worker/http/middleware.ts) authenticates first, then
  CSRF, then calls the handler. Its invariant, in the file's own words: *"an
  unauthenticated request must never reach a handler that reads or writes learner
  data."*
- **scopes every query to the owning parent.** This is the strongest of the
  controls, and it is in the data layer, not the route layer. The repositories
  header states it: *"AUTHORIZATION IS A DATA QUESTION, NOT A ROUTE QUESTION.
  Every query that reads or mutates learner data takes the parent id and
  joins/filters on ownership, so a handler cannot accidentally return another
  parent's learner by forgetting a check."*
- **resolves `help_level` as the maximum hint level actually revealed** by the
  server, not a number the client claims — a client posting `helpLevel: 0` after
  being shown a worked example cannot make its answer "independent".
- **grades with `gradeSubmission`**, the single deterministic code path, then
  **derives competency and schedules review** from stored attempts (§4.3).
- **enforces the lesson approval gate** (see §4.2).

The consequence: `learning_attempts.outcome` and `evidence_kind` are **observed
facts about what happened**, not claims the learner made. That is what allows
`docs/DATA_MODEL.md` to keep evidence and interpretation in separate tables.

### What is implemented vs. planned here

| Control | File | State |
|---|---|---|
| `dispatch()` — rate limit → authenticate → CSRF → handler | `src/worker/http/middleware.ts` | **implemented, no callers yet** |
| Owner-scoped SQL for every learner read/write | `src/worker/db/repositories.ts` | implemented |
| Uniform errors, no stack traces or SQL in responses | `src/worker/http/response.ts` | implemented |
| Session + CSRF tokens | `src/shared/crypto/session.ts` | implemented |
| Login / logout / session-info handlers | `src/worker/routes/session.ts` | implemented |
| Attempt write + derivation + rescheduling | `src/worker/services/session-service.ts` | implemented |
| Typed fetch wrapper, CSRF store, session hook | `src/client/lib/*.ts` | implemented |
| The route table that calls `dispatch` | `src/worker/index.ts` | **planned — file does not exist** |

`dispatch()` is written and typed but **has no callers**: `src/worker/index.ts`
does not exist, so no request reaches it today. The session *handlers* in
`src/worker/routes/session.ts` are written and exported, but nothing imports them.

---

## 3. Local-first posture

**What runs locally, today:**

| Concern | Runs where | Deployed? | Wired? |
|---|---|---|---|
| React SPA plumbing (fetch wrapper, CSRF, session hook, shell) | browser | no | written, **no lesson or dashboard screens yet** |
| Lesson content | authored in TS under `src/shared/content/` | no | **typechecked but never seeded** — no seeder exists, so no lesson reaches D1 |
| Worker HTTP layers (auth, CSRF, rate limit, SQL) | workerd | no | written, **not yet called** — no route table |
| Password hashing/verification | Worker | no | implemented |
| Competency + review derivation | Worker | no | implemented |
| Unit tests for the engine | Node/workerd | no | **run locally — 96 cases, see §5** |
| D1 database | local SQLite (`--local`) | no | **works** — `db:migrate` applies both migrations |
| Migrations | `wrangler d1 migrations apply … --local` | no | works |

The honest summary: **the security, data and derivation layers exist and are
reviewed-able; the app cannot yet serve a request**, because
`src/worker/index.ts` does not exist to call `dispatch()`.

**What would require the cloud — and is therefore blocked:**

`wrangler.jsonc` opens with the constraint in a comment:

> `LOCAL ONLY: this config must never be deployed without founder authorization.`

There is no remote D1 (`database_id: "local-only"`), no `routes`, no custom
domain, and no `--remote` code path. Publishing would additionally require the
child-data legal review described in
[`CHILD_PRIVACY_REVIEW.md`](CHILD_PRIVACY_REVIEW.md) §4. Neither has happened, so
there is **no hosted TAI LEARNING OS**.

**What does not require the cloud, by design:** lessons are authored in
TypeScript so they can be typechecked and unit-tested rather than fetched from a
CMS. Vocab images are **locally drawn SVG keys** from a closed set in
`exercise.ts` (`"apple" | "book" | "bottle" | …`) — no remote or stock imagery,
and therefore no third-party content host in the learner's path. The only runtime
dependencies in `package.json` are `react` and `react-dom`.

A consequence worth naming: because everything runs on one machine, a lost laptop
is a lost learning record. **Export is the only backup**, which is why
[`PARENT_OPERATIONS.md`](PARENT_OPERATIONS.md) treats a regular export as a
routine, not an emergency.

---

## 4. Data flow

### 4.1 Parent login

```
Parent                SPA                Worker              D1
  │  enter password     │                   │                 │
  ├────────────────────▶│  POST /api/session/login              │
  │                    ├──────────────────▶│                 │
  │                    │                   │ verify against   │
  │                    │                   │ parents.password_hash
  │                    │                   ├────────────────▶│
  │                    │                   │◀────────────────┤
  │                    │  rate limit check (AUTH_RATE_LIMITER: 5/60s)
  │                    │  Set-Cookie: tlo_session; HttpOnly; SameSite=Strict
  │◀───────────────────┤◀──────────────────┤                 │
  │                    │  SPA renders parent area            │
```

Notes grounded in the code:

- Password handling is in [`src/shared/crypto/password.ts`](../src/shared/crypto/password.ts):
  **PBKDF2-SHA256, 60,000 iterations**, a fresh 16-byte random salt per password,
  constant-time verification via
  [`timing-safe-equal.ts`](../src/shared/crypto/timing-safe-equal.ts), minimum
  length 10 and maximum 200. The stored record encodes the iteration count so it
  can be raised later without invalidating the parent.
- The session is a **stateless HMAC-SHA256-signed token** in an HttpOnly cookie
  ([`session.ts`](../src/shared/crypto/session.ts)): cookie `tlo_session`, TTL
  **8 hours**, `SameSite=Strict`, and `Secure` only when the request is HTTPS
  (never on `http://localhost`, or the parent could not log in locally). Claims
  are parent id, display name, issued-at, expiry, and a `tokenId`. Fields are
  percent-escaped before joining so a display name containing the separator
  cannot forge a field boundary.
- Mutating routes additionally require an `x-tlo-csrf` header, bound to the
  session `tokenId` (double-submit). `csrfOk` **fails closed**.
- `parents` holds **exactly one row** in the local MVP — one adult account, no
  registration flow, no network password reset. `/api/session/bootstrap` exists
  for first-run parent creation. Its guard is in
  [`routes/session.ts`](../src/worker/routes/session.ts): it **refuses once any
  parent row exists**, and refuses again if `PARENT_PASSWORD_HASH` is already
  configured, so the form path cannot be used to create a second account. See
  [`DATA_MODEL.md`](DATA_MODEL.md) §6 for the password-storage detail and the
  stale *scrypt* comments in the SQL and `wrangler.jsonc`.

### 4.2 Lesson session

```
Parent            SPA                 Worker                    D1
  │ open lesson    │                    │                        │
  ├───────────────▶│                    │                        │
  │  approve       │  POST /lessons/:id/approve                   │
  ├───────────────▶├───────────────────▶│ INSERT review_approvals│
  │                │                    │ audit_events: lesson.approve
  │                │                    ├───────────────────────▶│
  │  child plays   │  POST /sessions    │                        │
  ├───────────────▶├───────────────────▶│ INSERT learning_sessions (in_progress)
  │                │                    ├───────────────────────▶│
  │                │◀─ step 1: concept  │  (no answer key sent)  │
```

The gate is a database constraint, not a UI convention: only `review_approvals`
rows with `status = 'approved'` make a lesson visible in learner mode, and
`UNIQUE (lesson_id)` means one decision per lesson. A lesson the parent has not
approved does not appear — it is not merely greyed out.

Teaching sequence is `concept → visual → guided → independent → transfer`, with
an `explanation` shown only **after** the attempt. `lesson_steps.kind` is a
CHECK constraint over exactly those five values; see
[`LEARNING_ENGINE.md`](LEARNING_ENGINE.md) §1.

### 4.3 Attempt submit — the authoritative path

```
Child              SPA                 Worker                       D1
  │ answer         │                    │                           │
  ├───────────────▶│ POST /api/attempts │                           │
  │                │  {stepId, submission, helpLevel}               │
  ├── x-tlo-csrf ──┤                    │                           │
  │                ├───────────────────▶│                           │
  │                │                    │ 1. authorize: parent session (dispatch)
  │                │                    │ 2. fetch step + answer_key (owner-scoped SQL)
  │                │                    ├──────────────────────────▶│
  │                │                    │ 3. helpLevel = MAX hint  │
  │                │                    │    server actually revealed
  │                │                    │ 4. gradeSubmission(exercise, submission, helpLevel)
  │                │                    │ 5. evidenceKindFor(outcome, helpLevel)
  │                │                    │ 6. INSERT learning_attempts (recordAttempt)
  │                │                    ├──────────────────────────▶│
  │                │                    │ 7. re-derive skill_evidence (upsertSkillEvidence)
  │                │                    │ 8. reschedule review_schedule (upsertReviewSchedule)
  │                │◀── outcome, message_vi, canAdvance ──┤         │
  │◀───────────────┤                    │                           │
  │  "Chính xác!" or "Chưa đúng…"      │                           │
```

Two rules from [`answer.ts`](../src/shared/schemas/answer.ts) that the diagram
cannot show:

1. **The server resolves `help_level`.** `clampHelp` bounds it to 0..4, and
   `gradeSubmission` treats **level ≥ 3 as assisted** — a fully revealed solution
   is never recorded as an independent solve.
2. **Consequences are recomputed, not accumulated.** One wrong answer cannot
   permanently lower a state, and one lucky guess cannot raise it.

Two implementation details worth flagging, because the diagram simplifies them:

- **Step 5 is inlined, not via `evidenceKindFor`.**
  [`session-service.ts`](../src/worker/services/session-service.ts) computes
  `evidenceKind` inline as `grade.outcome === "correct" && helpLevel <= 2
  ? "observed" : "assisted"`. The shared helper
  [`evidenceKindFor`](../src/shared/schemas/attempt.ts) is typed and documented as
  *"the single place that decides provenance"* but **has no callers** — and its own
  body is self-contradictory (`helpLevel >= 3 → "assisted"`, then a `correct`
  branch and an unconditional `return "observed"` fallback). The inline expression
  is the stricter of the two, and it is what actually runs. This is a real
  code/comment disagreement, not a documentation simplification.
- **Step 6–8 are sequential awaits, not one transaction.** The service header
  claims all three writes happen *"in one transaction so the derived state can
  never disagree with the attempts it was derived from"*, but no `db.batch()`
  call wraps them; each `repo.*` function runs its own statement. The only
  `db.batch()` in the codebase is in `deleteLearnerCascade`. As written, a crash
  between the attempt insert and the evidence upsert would leave derived state
  behind the facts. Derivation is re-runnable, so this is recoverable by
  recomputation — but **the atomicity the comment promises is not implemented.**

Note the deliberate asymmetry in the flow: the **outcome and its Vietnamese
message** come back to the child, but the **evidence** does not. A child is
never shown a competency state, a failure streak, or a review count. Those go to
the parent dashboard only, and `review.ts` marks escalation explicitly as
*"Flag for the parent, not the learner."*

### 4.4 Review scheduling

`scheduleReview(attempts, nowMs)` in
[`review.ts`](../src/shared/engine/review.ts) is a **pure function**: same
attempts, same `nowMs`, same schedule. No randomness, so the parent can audit and
argue with every date.

- Ladder: `[1, 3, 7, 14]` days — climbed on each successful review.
- A **failed** review is *rescheduled, not dropped*, at `failureRetryDays = 1`.
- The climb position is chosen by **failure count**, so a learner who struggled
  restarts low instead of being pushed straight out to 14 days.
- `needsParentAttention` flags a skill for a human decision rather than another
  automated retry. It counts **total** incorrect attempts (≥ 3), although its
  comment says "consecutive" — see [`LEARNING_ENGINE.md`](LEARNING_ENGINE.md) §4.

Full detail, including the explicit statement that these intervals are starting
assumptions: [`LEARNING_ENGINE.md`](LEARNING_ENGINE.md) §4.

### 4.5 Export / import

**Planned — `npm run export:learner` points at `scripts/export-learner.mjs`,
which does not exist.** The intended design: a learner-scoped JSON bundle, with
import running the same exercise validator used for authored content, and
`content_origin.origin` (`authored | demo | imported`) keeping imported lessons
distinguishable from ones the parent wrote.

**⚠ The format is specified; the writer is not.** [`src/shared/schemas/transfer.ts`](../src/shared/schemas/transfer.ts)
defines the export envelope completely — `formatVersion` (currently
`TRANSFER_FORMAT_VERSION = 1`), `source` (`manual_export | demo_fixture |
backup_restore`), and `containsLearnerEvidence` — along with the row shape of
every table. Its header states the import rule: *"Import is therefore strict — it
validates before writing, rejects anything it does not recognise, and never
silently merges or upgrades data"*, and **importing a NEWER `formatVersion` than
the app knows is refused**.

But no code produces or consumes it: `scripts/export-learner.mjs` does not exist,
and `TransferRequest` / `TransferResponse` are not wired to a handler.
`schema_versions` is written by migration 0002 and read by **no code yet** — the
compatibility check that stamping implies is planned, not built. See
[`DATA_MODEL.md`](DATA_MODEL.md) §"schema_versions".

---

## 5. Known implementation gaps

The implemented code is the tree under `src/` (layout in §1); it is not
inventoried here because the tree was still growing while this was written.

**Missing, though referenced** (verified by checking each path):

| Referenced by | Missing file |
|---|---|
| `wrangler.jsonc` `main` | `src/worker/index.ts` — **the route table; nothing calls `dispatch()`** |
| `package.json` `dev`/`build` | `index.html` — the Vite entry |
| `migrations/seed/` | a seeder that walks `LESSONS` into `lessons`/`lesson_steps` — `content/types.ts` describes one that does not exist |
| `api-contract.ts` | the React screens that render `LessonStepPayload`, the parent dashboard, etc. |
| `package.json` `export:learner` | `scripts/export-learner.mjs` |
| `package.json` `db:reset` | `scripts/reset-database.sql` — `db:reset` will fail |
| `package.json` `seed:demo` | `migrations/seed/0002_demo_learner.sql` — `seed:demo` will fail |
| `package.json` `test:integration` | `vitest.integration.config.ts` |
| `package.json` `test:e2e` | `playwright.config.ts` |

### Quality gates

Measured by running each command, not asserted. **None of these is a pass, and
none is a green build.**

| Gate | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | **fails** — `baseUrl` is deprecated in TypeScript 6.0; TS5101 on `tsconfig.app.json` and `tsconfig.worker.json` |
| Lint | `npm run lint` | **fails (exit 2)** — `eslint.config.js` nests `globals` inside `globals`, which ESLint 10 rejects |
| Unit tests | `npx vitest run` | **partially failing** — test files under `test/unit/` exist; several cases fail, concentrated in `review-scheduling.test.ts` |
| Build | `npm run build` | fails — no `index.html`, and the Worker entry `src/worker/index.ts` is absent |
| Dev | `npm run dev` | fails for the same reason as Build |
| Migrate | `npm run db:migrate` | **works** — applies both migrations to local D1, 26 statements executed |

The test files were still being edited during this documentation pass, so no
pass/fail count is recorded here; run `npx vitest run` for the current result.

Two config bugs block the gates and are one-line fixes, but **fixing them is
outside this documentation task** and is noted so the owner can act: the
`globals` nesting in `eslint.config.js`, and the `baseUrl` deprecation in both
tsconfigs (or setting `ignoreDeprecations`). Neither is described as fixed.

## 6. Related documents

- [`DATA_MODEL.md`](DATA_MODEL.md) — tables, evidence/provenance design, what is deliberately not stored.
- [`LEARNING_ENGINE.md`](LEARNING_ENGINE.md) — teaching sequence, hints, competency derivation, review.
- [`CHILD_PRIVACY_REVIEW.md`](CHILD_PRIVACY_REVIEW.md) — controls and the unresolved legal review.
- [`PARENT_OPERATIONS.md`](PARENT_OPERATIONS.md) — bilingual operational guide.
- [`ROADMAP_90_DAYS.md`](ROADMAP_90_DAYS.md) — phased scope and the production gate.
