# TAI LEARNING OS — Architecture

> **Status: Gate 01 MVP Implemented & Verified.** This document describes the implemented
> architecture of TAI LEARNING OS. The shared domain, Worker HTTP and database repository layers,
> local D1 SQLite store, React 19 SPA client screens, seed/reset/export scripts, and end-to-end
> browser test journey are fully implemented and verified green locally.

The platform is **Vietnamese-first**: `Tiếng Việt` is the primary learner-facing
language, English is secondary. Canonical vocabulary is defined in
[`src/shared/schemas/attempt.ts`](../src/shared/schemas/attempt.ts) — string
unions that are mirrored as SQL CHECK constraints across the database. The frozen
HTTP surface is [`src/shared/api-contract.ts`](../src/shared/api-contract.ts).

---

## 1. Component Map

```
┌──────────────────────────────────────────────────────────────────────┐
│  BROWSER  —  React 19 SPA  (src/client/)              [implemented]  │
│                                                                      │
│   • Renders lessons; never decides correctness or holds answer keys   │
│   • Session cookie (HttpOnly) sent automatically with every request  │
│   • CSRF token in memory via csrf-store.ts; attached via x-tlo-csrf  │
│   • Screens:                                                         │
│       - LoginScreen.tsx          Parent auth & first-run bootstrap   │
│       - LearnerHomeScreen.tsx    Enrolled learner home & subject hub │
│       - SubjectDetailScreen.tsx  Approved lessons per subject        │
│       - LessonScreen.tsx         Interactive steps & hint progression│
│       - SessionSummaryScreen.tsx Learner session recap               │
│       - ParentDashboardScreen.tsx Child mastery & evidence dashboard │
│       - ParentLessonsScreen.tsx  Parent lesson approval governance   │
│       - ParentDataScreen.tsx     Export / Import / Delete governance │
│   • @/* path alias  (tsconfig.app.json)                              │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ HTTPS / Same-Origin HTTP (via Vite dev or
                            │ workerd asset binding)
┌───────────────────────────▼──────────────────────────────────────────┐
│  CLOUDFLARE WORKER  (src/worker/)                     [implemented]  │
│                                                                      │
│  src/worker/index.ts            ← Route table entry & dispatch       │
│  src/worker/http/middleware.ts  ← Auth, CSRF, rate limiters, router  │
│  src/worker/http/response.ts    ← Uniform JSON envelopes & errors    │
│  src/worker/routes/session.ts   ← Login, logout, session info, init  │
│  src/worker/routes/learner.ts   ← Lesson start, hints, attempts, fin │
│  src/worker/routes/parent.ts    ← Learners, approvals, dashboard stats│
│  src/worker/routes/data.ts      ← Export, import, delete cascade     │
│  src/worker/services/session-service.ts ← Grading, evidence, review  │
│  src/worker/db/repositories.ts  ← All SQL queries, owner-scoped      │
│  src/worker/db/schema.ts        ← D1 row type definitions            │
│                                                                      │
│   • Sole authority: auth, authorization, grading, spaced review      │
│   • Rate limiters: AUTH_RATE_LIMITER (5/60s), API_RATE_LIMITER (120/60s)│
│   • Local workerd runtime with Cloudflare Vite plugin                │
└───────┬───────────────────────────────┬──────────────────────────────┘
        │ DB binding                    │ Secrets (.dev.vars, gitignored)
        ▼                               ▼
┌───────────────────────────────┐   ┌─────────────────────────────────┐
│  D1  (SQLite, local-only)     │   │  .dev.vars                      │
│  binding: DB                  │   │  SESSION_SECRET                 │
│  migrations/0001, 0002        │   │  PARENT_PASSWORD_HASH           │
│  15 tables — see DATA_MODEL   │   │  Local-only test credentials    │
└───────────────────────────────┘   └─────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  SHARED DOMAIN  (src/shared/)                         [implemented]  │
│                                                                      │
│   schemas/    exercise.ts   attempt.ts   answer.ts   transfer.ts     │
│   api-contract.ts  ← Frozen client-server HTTP API specification     │
│   content/    types.ts + 3 math lessons (fraction, area, perimeter)  │
│   engine/     competency.ts review.ts                                │
│   crypto/     password.ts   session.ts   timing-safe-equal.ts        │
│                                                                      │
│   @shared/* path alias (tsconfig.worker.json + tsconfig.app.json)    │
│   Imported identically by client, worker, and scripts.              │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Why the Worker Holds All Authority

**The client never validates an answer.** The answer key (`lesson_steps.answer_key`)
and the validation routine (`gradeSubmission` in `src/shared/schemas/answer.ts`)
run exclusively inside the Worker. 

When a session starts (`POST /api/learner/sessions`), the server sanitizes all lesson
steps via `toLearnerExercise()`, stripping out `correct`, `correctNumerator`,
`correctDenominator`, `correctChoiceId`, `evidenceSentence_vi`, and `sentenceAcceptedWords`.
The client only receives `LearnerExerciseSpec` where the answers do not exist.
Furthermore, `explanationVi` is withheld by the server until a submitted attempt is
graded as `correct`.

Concretely, the Worker alone:

- **Enforces strict authentication & session validation.** `dispatch()` in
  `src/worker/http/middleware.ts` executes rate limiting, authenticates the parent session
  token, enforces the `x-tlo-csrf` header on all mutating requests (POST, PUT, DELETE),
  and only then invokes the matching handler.
- **Enforces owner-scoped SQL queries.** Every query that touches learner records
  or session attempts joins or filters by `parent_id` (`src/worker/db/repositories.ts`).
  A handler cannot leak or mutate another family's data.
- **Resolves `help_level` as the maximum hint level revealed.** The learner cannot claim
  an independent solve after requesting worked hints; the server tracks and clamps `helpLevel`.
- **Derives mastery deterministically.** `learning_attempts` is an append-only ledger of
  observed facts. `skill_evidence` is re-derived upon each attempt, and `review_schedule`
  is scheduled without client-supplied metrics.
- **Enforces parent lesson approval.** Learners only see lessons with an active
  `review_approvals.status = 'approved'` record scoped to **that learner** and
  **that lesson version** (`UNIQUE (learner_id, lesson_id, lesson_version)`).
  Approving a lesson for one child does not approve it for a sibling, and
  approving version 1 does not approve a later re-authored version — new content
  always needs a fresh parent decision.

---

## 3. Local-First Posture & Security Boundary

**Local Execution Policy:**
TAI LEARNING OS operates under a strict **Local Only / Production Blocked** policy.
- No public URL or cloud deployment is configured (`database_id = "local-only"` in `wrangler.jsonc`).
- No external paid APIs, AI generation services, or third-party telemetry SDKs are loaded.
- Exercise illustrations are self-contained SVG primitives defined in code.
- Data export (`scripts/export-learner.mjs` or `/api/data/export`) provides a standard,
  complete JSON transfer bundle (`tai-learning-os-export@v1`) ensuring family data sovereignty.

---

## 4. End-to-End Data Flow

### 4.1 Parent Authentication & First-Run Bootstrap
1. First run: If no parent account exists in local D1, `/api/session/bootstrap` creates the
   single parent record using PBKDF2-SHA256 (600,000 iterations for new hashes, 16-byte cryptographically secure salt; verification uses the stored record's iteration count and transparently upgrades legacy 100,000-iteration records on successful login).
   Once created, the bootstrap endpoint fails closed.
2. Login: Parent posts credentials to `/api/session/login`. On verification, the server issues
   a signed HMAC-SHA256 cookie (`tlo_session`, `HttpOnly`, `SameSite=Strict`, 8-hour TTL)
   and returns a CSRF token bound to the session's token ID (`jti`).

### 4.2 Lesson Governance & Approval
1. Lessons are loaded from TypeScript definitions (`src/shared/content/`) via `scripts/seed-lessons.mjs`.
2. Lessons default to unapproved (`review_approvals` empty or `draft`).
3. Parent visits `/parent/lessons` and toggles approval status (`POST /api/parent/lessons/approval`).
4. Learner screens query approved lessons only.

### 4.3 Learner Session & Attempt Submission
1. Learner clicks an approved lesson. The SPA calls `POST /api/learner/sessions`.
2. Worker creates a `learning_sessions` record and returns steps sanitized of all answers.
3. Learner submits an answer: `POST /api/learner/attempts` with `{ sessionId, stepId, submission, helpLevel }`.
4. Worker verifies ownership, grades against `answer_key`, records the attempt in `learning_attempts`,
   updates `skill_evidence`, and reschedules `review_schedule`.
5. Worker returns outcome (`correct`, `partial`, `incorrect`), feedback message in Vietnamese,
   and unlocks `explanationVi` on success.

---

## 5. Verification Status (Gate 01)

| Verification Suite | Test Count | Status |
|---|---|---|
| TypeScript Typecheck (Worker & App) | 0 errors | **Pass** |
| ESLint Code Quality | 0 errors | **Pass** |
| Vitest Unit Test Suite | 7 files, 163 tests | **Pass** |
| Vitest Integration Test Suite (D1 + workerd) | 4 files, 67 tests | **Pass** |
| Playwright E2E Suite (Desktop, Tablet & Mobile) | 3 viewports, 15 tests | **Pass** |
| Production Build (Vite & Worker bundle) | Clean build | **Pass** |
| Local D1 Data Export (`npm run export:learner`) | Valid JSON envelope, strictly read-only | **Pass** |
