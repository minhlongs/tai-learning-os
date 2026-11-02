---
title: "M8: B2B2C Organization Studio UI (/parent/organization), 25-Lesson Curriculum Depth Parity (5x5), & AES-256-GCM Encrypted Backup Drill"
status: completed
created_at: 2026-11-02
branch: feat/m8-org-studio-25-lessons-and-encrypted-backup
---

# M8 Implementation Plan — B2B2C Organization Studio UI, 25-Lesson Curriculum Depth Parity & AES-256-GCM Encrypted Backup Drill

## 1. Objective & Scope
Deliver Milestone M8 (`A + B`) across three cohesive tracks:
1. **Track A — B2B2C Center & Classroom Studio UI (`/parent/organization`)**: Close all 13 orphaned `/api/org/*` backend routes (`src/worker/index.ts:127-141`) plus 3 read endpoints (`GET /api/org/list`, `GET /api/org/lessons`, `GET /api/org/consented-learners`) and hardened `owner` vs `admin` RBAC guards, wiring them into `src/client/lib/endpoints.ts`, `src/client/App.tsx`, `src/client/components/AppShell.tsx`, `src/client/screens/parent/DashboardScreen.tsx`, and a new `src/client/screens/parent/OrganizationStudioScreen.tsx`.
2. **Track B1 — 5-Subject Curriculum Depth Parity (25 Lessons = 5 Subjects × 5 Lessons)**: Expand Grade 4 Science (`science`) and Reasoning/Debate (`debate`) from 3 lessons each (2 core + 1 baseline) to 5 lessons each (4 core + 1 baseline) via `migrations/0011_science_and_debate_parity.sql` (synced to `test/integration/test-db.ts` and `scripts/run-e2e.mjs`) and 4 new 5-step lesson modules in `src/shared/content/`.
3. **Track B2 — Web Crypto AES-256-GCM Encrypted Backup & Automated Restore Drill (`npm run backup:drill`)**: Implement `src/shared/crypto/backup-cipher.ts` (PBKDF2-SHA256 600,000 iterations, 16-byte random salt, 12-byte random IV, 128-bit GCM auth tag, AAD header binding), wire optional passphrase encryption into `DataControlScreen.tsx` and `scripts/export-learner.mjs`, and create `scripts/backup-restore-drill.mjs` (`npm run backup:drill`) running in an isolated `os.tmpdir()` D1 instance to close `Production Gate #4` in `docs/ROADMAP_90_DAYS.md`.

### Non-Negotiable Constraints
- Preserve all security and pedagogical invariants:
  - Per-learner and per-version lesson approvals (`review_approvals`).
  - 30-minute continuation grace deadline (`continuation_deadline`) enforced at SQLite execution time.
  - Zero answer keys in learner payloads (`toLearnerExercise()`); `explanationVi` withheld until correct attempt.
  - Any hint or retry produces `assisted` (`SUPPORTED`) evidence, never `observed` (`INDEPENDENT`).
  - Owner-scoped SQL on every learner query (`parent_id` verification).
- Release policy: `PR-MERGE AUTHORIZED / PRODUCTION DEPLOY BLOCKED`. Do not touch `.wrangler/state`, `.dev.vars`, or port `8791`.

## 2. Work Tracks

### Track 1 — Migration `0011` & 25-Lesson Grade 4 Curriculum Parity (`migrations/0011_science_and_debate_parity.sql` & `src/shared/content/`)
1. Create `migrations/0011_science_and_debate_parity.sql`:
   - Insert version `11` into `schema_versions`.
   - Insert 4 new skills (`sci-states-of-matter`, `sci-light-and-shadow`, `deb-evidence-relevance`, `deb-counterargument-respect`), 4 `skill_prerequisites` edges, and 4 `curriculum_objectives` rows.
2. Register `0011_science_and_debate_parity.sql` in both `test/integration/test-db.ts` and `scripts/run-e2e.mjs`.
3. Author 4 new 5-step lesson modules (`concept -> concept -> guided -> independent -> transfer`, 3 distinct progressive hints per step, zero answer leaks):
   - `src/shared/content/science/states-of-matter.ts` (`sci-states-of-matter`)
   - `src/shared/content/science/light-and-shadow.ts` (`sci-light-and-shadow`)
   - `src/shared/content/debate/evidence-relevance.ts` (`deb-evidence-relevance`)
   - `src/shared/content/debate/counterargument-respect.ts` (`deb-counterargument-respect`)
4. Export all 4 lessons in `src/shared/content/index.ts` (bringing `LESSONS` from 21 to 25).

### Track 2 — Web Crypto AES-256-GCM Encrypted Backup & CLI Drill (`src/shared/crypto/backup-cipher.ts` & `scripts/backup-restore-drill.mjs`)
1. Create `src/shared/crypto/backup-cipher.ts`:
   - Derive a 256-bit `AES-GCM` key via Web Crypto `PBKDF2` (`SHA-256`, default `600_000` iterations, 16-byte random salt).
   - Encrypt/decrypt with 12-byte random IV, 128-bit auth tag, and Additional Authenticated Data (`additionalData` binding `format|kdf|iterations|cipher`).
   - Validate decrypted payload with `validateExportEnvelope`.
2. Update `scripts/export-learner.mjs` and `src/client/screens/parent/DataControlScreen.tsx` to support optional passphrase-protected encrypted backups while preserving 100% backward compatibility with plaintext `tai-learning-os-export@v1`.
3. Create `scripts/backup-restore-drill.mjs` and wire `"backup:drill": "node scripts/backup-restore-drill.mjs"` in `package.json`:
   - Run in an isolated `os.tmpdir()` directory (`getPlatformProxy({ persist: { path: tempDir } })`) and clean up in `finally`.
   - Execute: Seed 25 lessons + learner + sessions + attempts + mastery -> `exportRecord` -> `encryptBackupEnvelope` (600,000 iterations) -> Tamper-Rejection Check (corrupted ciphertext byte, modified AAD iterations, wrong passphrase all rejected) -> `deleteLearner` -> `decryptBackupEnvelope` -> `importRecord` -> verify 100% row-count parity, `skill_evidence` mastery parity, and fail-closed `review_approvals` (`draft`) / `learning_sessions` (`abandoned`) invariants.

### Track 3 — B2B2C Organization & Classroom Studio (`/api/org/*` & `OrganizationStudioScreen.tsx`)
1. In `src/worker/db/repositories.ts`, `src/worker/routes/organization.ts`, `src/worker/routes/organization-lessons.ts`, `src/worker/index.ts`, and `src/shared/api-contract.ts`:
   - Add `GET /api/org/list` (`listMemberOrganizationsRoute`), `GET /api/org/lessons` (`listOrganizationLessonsRoute`), and `GET /api/org/consented-learners` (`listConsentedLearnersForOrgRoute`).
   - Harden `addOrganizationMemberRoute` (`POST /api/org/members`) so an `admin` cannot assign `owner` or overwrite/demote an existing `owner`, and the last `owner` cannot be demoted.
   - Harden `submitOrgLessonReviewRoute` (`POST /api/org/lessons/submit`) so `org_approved` lessons cannot be regressed to `submitted`.
2. In `src/client/lib/endpoints.ts`, `src/client/App.tsx`, `src/client/components/AppShell.tsx`, `src/client/screens/parent/DashboardScreen.tsx`, and `src/client/screens/parent/OrganizationStudioScreen.tsx`:
   - Declare all `/api/org/*` endpoints in `endpoints.ts`.
   - Build `OrganizationStudioScreen.tsx` at `/parent/organization` calling all `/api/org/*` routes with a consented-learner enrollment picker, inline parent consent toggle, and a structured 5-step lesson authoring form with 1-click template prefill.

### Track 4 — Multi-Layer Tests & Documentation Sync
1. Add unit tests (`test/unit/backup-cipher.test.ts`, router match for `/parent/organization`), integration tests (`test/integration/`), and Playwright E2E browser tests (`test/e2e/m4-browser-verification.spec.ts`) covering `/parent/organization`, 25 lessons, and encrypted backup/restore.
2. Update `CLAUDE.md`, `README.md`, `docs/ROADMAP_90_DAYS.md`, and `docs/PARENT_OPERATIONS.md`.

## 3. Acceptance Criteria & Verification Gates
- [x] Every `/api/org/*` route in `src/worker/index.ts` is wired in `src/client/lib/endpoints.ts` and actively called from `OrganizationStudioScreen.tsx` (`/parent/organization`).
- [x] `npm run validate:lessons` verifies 25/25 lessons (125 steps) with 0 schema, pedagogy, or answer-leak issues.
- [x] `npm run backup:drill` exits 0 after verifying `Export -> AES-256-GCM Encrypt -> Tamper-Rejection Check -> Learner Wipe -> Decrypt -> Import -> 100% Row-Count & Mastery Parity` in `os.tmpdir()`.
- [x] `npm run verify`, `npm run test:integration`, and `npm run test:e2e` pass with 0 errors.
