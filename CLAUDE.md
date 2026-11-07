# TAI LEARNING OS — Project & Agent Context (`CLAUDE.md`)

> **Release Policy: PR-MERGE AUTHORIZED / PRODUCTION DEPLOY BLOCKED.**
> Git push, pull request creation, and squash/merge to `main` are authorized following comprehensive local multi-layer verification.
>
> **Blocked:** Remote deploy (`wrangler deploy`), remote migrations, remote resource provisioning, paid/external LLM APIs, and hosted child pilot — a public server, cloud data processing, or any learner outside this household.
>
> **Permitted:** Localhost use on this household machine for the single learner registered in it, supervised in person by the parent/owner. Local-only runs write exactly the data the schema already defines and send nothing off the device. Simulated multi-learner data must stay in the isolated pilot database (see `npm run seed:pilot`) and never enter the household learner's database, because the append-only audit ledger cannot be cleaned once written.

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
   - Any hint usage (`helpLevel >= 1`) or retry (`attemptNo > 1`) designates an attempt as `assisted` (`SUPPORTED`), never `observed` (`INDEPENDENT`).
   - Spaced review uses a deterministic `[1, 3, 7, 14]` day ladder (`src/shared/engine/review.ts`).
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

# Apply local D1 migrations (0001_initial_schema.sql through 0014_grade5_curriculum_expansion.sql)
npm run db:migrate

# Seed curriculum (50 lessons for Grades 4–5 across 5 active subjects)
npm run seed:demo

# Start local development server (http://localhost:8791)
npm run dev

# Run verification gates
npm run typecheck          # Worker + App TypeScript strict check
npm run lint               # ESLint check
npm run test               # Vitest unit tests (13 files, 214 tests)
npm run test:integration   # Vitest Worker + D1 integration tests (15 files, 148 tests)
npm run test:e2e           # Playwright E2E browser tests (54 tests, Desktop, Tablet, Mobile)
npm run verify             # Full typecheck + lint + unit test + validate:lessons + build

# Data & Security operations (local only)
npm run export:learner -- ./backup-tai.json
npm run export:learner -- ./backup-tai.enc.json --passphrase "mat-khau-sao-luu"
npm run backup:drill       # Isolated AES-256-GCM encrypted backup & restore drill
npm run unlock:parent      # Clear auth_throttles after accidental lockout
npm run db:reset-data
npm run db:reprovision-household  # Archive the current D1 files into backups/, then provision a clean household database (keeps parent, learner, school-year, and 50 lessons)
```

---

## 3. Architecture & Documentation Map

- [`README.md`](README.md) — Quick-start and bilingual project overview
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Component map, authority boundaries, and data flows
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — 22 D1 tables, evidence/provenance split, and absent PII matrix
- [`docs/LEARNING_ENGINE.md`](docs/LEARNING_ENGINE.md) — Teaching sequence, hint policy, mastery states, and review ladder
- [`docs/CURRICULUM_ARCHITECTURE.md`](docs/CURRICULUM_ARCHITECTURE.md) — GDPT 2018 objective registry, content versioning, and competency derivation
- [`docs/BASELINE_ASSESSMENT.md`](docs/BASELINE_ASSESSMENT.md) — Parent-supervised diagnostic baseline architecture
- [`docs/FOUR_WEEK_LEARNING_PLAN.md`](docs/FOUR_WEEK_LEARNING_PLAN.md) — Priority-based 4-week planner and schedule states
- [`docs/PARENT_PILOT_GUIDE.md`](docs/PARENT_PILOT_GUIDE.md) — Step-by-step parent pilot and operational guide
- [`docs/SECURITY.md`](docs/SECURITY.md) — Threat model, PBKDF2-SHA256 (600,000 iterations), D1 auth throttling, CSRF, and owner-scoped SQL
- [`docs/CHILD_PRIVACY_REVIEW.md`](docs/CHILD_PRIVACY_REVIEW.md) — Vietnamese Law 91/2025/QH15 & Decree 356/2025/ND-CP review checklist
- [`docs/PARENT_OPERATIONS.md`](docs/PARENT_OPERATIONS.md) — Bilingual parent handbook for approvals, dashboard, and backups
- [`docs/ROADMAP_90_DAYS.md`](docs/ROADMAP_90_DAYS.md) — 90-day evolution and pre-production blockers
- [`docs/audits/GATE_01_REPORT.md`](docs/audits/GATE_01_REPORT.md) — Empirical Gate 01 audit report
- [`docs/audits/GATE_02_FORENSIC_AUDIT.md`](docs/audits/GATE_02_FORENSIC_AUDIT.md) — Empirical Gate 02 forensic audit & hardening report
- [`docs/audits/GATE_02_SECURITY_MATRIX.md`](docs/audits/GATE_02_SECURITY_MATRIX.md) — Route authorization, CSRF, Origin, and rate-limiter matrix
- [`docs/audits/GATE_02_LEARNING_INTEGRITY.md`](docs/audits/GATE_02_LEARNING_INTEGRITY.md) — Pedagogical integrity, hint provenance, and retention reset report
- [`docs/audits/GATE_02_RELEASE_DECISION.md`](docs/audits/GATE_02_RELEASE_DECISION.md) — Gate 02 verification verdict & local-only policy enforcement
- [`docs/audits/GATE_03_REPORT.md`](docs/audits/GATE_03_REPORT.md) — Comprehensive Gate 03 execution and verification report
- [`docs/audits/GATE_03_SECURITY_CLOSURE.md`](docs/audits/GATE_03_SECURITY_CLOSURE.md) — Gate 03 security closure, PBKDF2 600k upgrade, and D1 throttling audit
