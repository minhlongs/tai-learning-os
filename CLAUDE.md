# TAI LEARNING OS — Project & Agent Context (`CLAUDE.md`)

> **Release Policy: LOCAL ONLY / PRODUCTION BLOCKED.**
> Do not push to any remote. Do not deploy (`wrangler deploy`). Do not provision remote Cloudflare resources or connect paid/external LLM APIs.

---

## 1. Mission & Non-Negotiable Invariants

1. **Vietnamese-First Child Learning OS**:
   - Designed for a 4th-grade learner (`"Tài"`, age under 13, timezone `Asia/Ho_Chi_Minh`).
   - All learner-facing UI, instructions, feedback, and explanations are in Vietnamese (`Tiếng Việt`).
2. **Zero Answer Keys in Browser**:
   - `StartSessionResponse` uses `LearnerExerciseSpec` via `toLearnerExercise()` (`src/shared/schemas/exercise.ts`), stripping all answer fields (`correct`, `correctNumerator`, `correctDenominator`, `correctChoiceId`, `evidenceSentence_vi`, `sentenceAcceptedWords`).
   - `explanationVi` is withheld until the Worker grades an attempt as `correct`.
3. **Deterministic Pedagogy & Mastery Engine**:
   - No generative AI / LLM chat in learner mode.
   - Evidence (`learning_attempts`) is append-only and separated from interpretation (`skill_evidence`).
   - Hint level $\ge 3$ designates an attempt as `assisted` rather than `observed` (independent).
   - Spaced review uses a deterministic `[1, 3, 7, 14]` day ladder (`src/shared/engine/review.ts`).
4. **Parent Governance & Security**:
   - Stateless HMAC-SHA256 session cookie (`tlo_session`, `HttpOnly`, `SameSite=Strict`, 8h TTL) + double-submit CSRF header (`x-tlo-csrf`).
   - Passwords hashed with PBKDF2-SHA256 (60,000 iterations, 16-byte random salt).
   - Owner-scoped SQL in `src/worker/db/repositories.ts`: every learner query filters by `parent_id`.
   - Lessons require explicit `review_approvals.status = 'approved'` before appearing to the learner.
5. **Child Privacy by Absence**:
   - Never collect or seed full legal name, full date of birth, school name, home address, phone number, email, or personal photos.

---

## 2. Exact Commands

```bash
# Install dependencies
npm install

# Apply local D1 migrations (0001_initial_schema.sql, 0002_reference_content.sql)
npm run db:migrate

# Seed curriculum (3 Math, 3 English, 3 Vietnamese lessons)
npm run seed:demo

# Start local development server (http://localhost:8791)
npm run dev

# Run verification gates
npm run typecheck          # Worker + App TypeScript strict check
npm run lint               # ESLint check
npm run test               # Vitest unit tests (7 files, 163 tests)
npm run test:integration   # Vitest Worker + D1 integration tests (4 files, 67 tests)
npm run test:e2e           # Playwright E2E browser tests (Desktop, Tablet, Mobile)
npm run verify             # Full typecheck + lint + unit test + build

# Data operations (local only)
npm run export:learner -- ./backup-tai.json
npm run db:reset-data
```

---

## 3. Architecture & Documentation Map

- [`README.md`](README.md) — Quick-start and bilingual project overview
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Component map, authority boundaries, and data flows
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — 15 D1 tables, evidence/provenance split, and absent PII matrix
- [`docs/LEARNING_ENGINE.md`](docs/LEARNING_ENGINE.md) — Teaching sequence, hint policy, mastery states, and review ladder
- [`docs/SECURITY.md`](docs/SECURITY.md) — Threat model, PBKDF2-SHA256, CSRF, rate limiting, and owner-scoped SQL
- [`docs/CHILD_PRIVACY_REVIEW.md`](docs/CHILD_PRIVACY_REVIEW.md) — Vietnamese Law 91/2025/QH15 & Decree 356/2025/ND-CP review checklist
- [`docs/PARENT_OPERATIONS.md`](docs/PARENT_OPERATIONS.md) — Bilingual parent handbook for approvals, dashboard, and backups
- [`docs/ROADMAP_90_DAYS.md`](docs/ROADMAP_90_DAYS.md) — 90-day evolution and pre-production blockers
- [`docs/audits/GATE_01_REPORT.md`](docs/audits/GATE_01_REPORT.md) — Empirical Gate 01 audit report
