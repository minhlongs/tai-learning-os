# TAI LEARNING OS — Project & Agent Context (`AGENTS.md`)

> **Release Policy: PR-MERGE AUTHORIZED / PRODUCTION DEPLOY BLOCKED.**
> Git push, pull request creation, and squash/merge to `main` are authorized following comprehensive local multi-layer verification.
> Remote deploy (`wrangler deploy`), remote migrations, remote resource provisioning, paid/external LLM APIs, and live child pilot remain strictly blocked.

---

## 1. Mission & Non-Negotiable Invariants

1. **Vietnamese-First Child Learning OS**:
   - Designed for a 4th-grade learner (age under 13, timezone `Asia/Ho_Chi_Minh`).
   - All learner-facing UI, instructions, feedback, and explanations are in Vietnamese (`Tiếng Việt`).
2. **Zero Answer Keys in Browser**:
   - `StartSessionResponse` uses `LearnerExerciseSpec` via `toLearnerExercise()` (`src/shared/schemas/exercise.ts`), stripping all answer fields (`correct`, `correctNumerator`, `correctDenominator`, `correctChoiceId`, `evidenceSentence_vi`, `sentenceAcceptedWords`).
   - `explanationVi` is withheld until the Worker grades an attempt as `correct`.
3. **Deterministic Pedagogy & Mastery Engine**:
   - No generative AI / LLM chat in learner mode.
   - Evidence (`learning_attempts`) is append-only and separated from interpretation (`skill_evidence`).
   - Any hint usage (`helpLevel >= 1`) or retry (`attemptNo > 1`) designates an attempt as `assisted` (`SUPPORTED`), never `observed` (`INDEPENDENT`).
   - Spaced review intervals are computed by FSRS-6 (`ts-fsrs` 6.0.0) in `src/shared/engine/review.ts`, with fuzzing disabled so the same attempt history always yields the same interval. Failure retry (1 day), the assisted-solve retry (1 day), the 30-day ceiling and the 3-failure parent escalation are policy rules of this project, not FSRS defaults. See `docs/adr/ADR-002-fsrs-spaced-review.md`.
4. **Parent Governance & Security**:
   - Stateless HMAC-SHA256 session cookie (`tlo_session`, `HttpOnly`, `SameSite=Strict`, 8h TTL) with explicit `mode` claim (`parent` vs `learner`) + double-submit CSRF header (`x-tlo-csrf`).
   - Passwords hashed with PBKDF2-SHA256 (600,000 iterations, 16-byte random salt, transparent `needsRehash` migration from 100,000 iterations).
   - Persistent D1 failed-login throttling (`auth_throttles` dual-scope by IP and account, 15-minute lockout, CLI unlock via `npm run unlock:parent`).
   - Owner-scoped SQL in `src/worker/db/repositories.ts`: every learner query filters by `parent_id`.
   - Server-enforced privilege boundary: all `/api/parent/*` and `/api/data/*` routes use `parentRoute` and return `403 Forbidden` when in child mode (`mode: "learner"`). Re-entering parent mode requires server-side password verification via `POST /api/session/mode`.
   - Lessons require explicit `review_approvals.status = 'approved'` before appearing to the learner.
5. **Child Privacy by Absence**:
   - Never collect or seed full legal name, full date of birth, school name, home address, phone number, email, or personal photos.

---

## 2. Exact Commands

```bash
# Install dependencies
npm install

# Apply local D1 migrations (0001_initial_schema.sql through 0016_learning_attempts_append_only_update_guard.sql)
npm run db:migrate

# Seed curriculum (50 lessons for Grades 4–5 across 5 active subjects)
npm run seed:demo

# Start local development server (http://localhost:8791)
npm run dev

# Run verification gates
npm run typecheck          # Worker + App TypeScript strict check
npm run lint               # ESLint check
npm run test               # Vitest unit tests (24 files, 366 tests)
npm run test:integration   # Vitest Worker + D1 integration tests (19 files, 203 tests)
npm run test:e2e           # Playwright E2E browser tests (54 tests, Desktop, Tablet, Mobile)
npm run verify             # Full typecheck + lint + unit test + validate:lessons + build

# Data & Security operations (local only)
npm run export:learner -- ./backup-mau.json
npm run unlock:parent      # Clear auth_throttles after accidental lockout
npm run db:reset-data
```
