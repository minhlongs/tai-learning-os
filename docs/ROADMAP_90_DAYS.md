# TAI LEARNING OS — 90-Day Roadmap & Production Gate

> **Release Policy: PR-MERGE AUTHORIZED / PRODUCTION DEPLOY BLOCKED.**
> Git push, pull request creation, and squash/merge to `main` are authorized following comprehensive local multi-layer verification.
>
> **Blocked:** Remote deploy (`wrangler deploy`), remote migrations, remote resource provisioning, paid/external LLM APIs, and hosted child pilot — a public server, cloud data processing, or any learner outside this household.
>
> **Permitted:** Localhost use on this household machine for the single learner registered in it, supervised in person by the parent/owner. Local-only runs write exactly the data the schema already defines and send nothing off the device.
>
> This document outlines the 90-day evolution from the Gate 01 Local MVP to a rich household learning
> system, along with the strict conditions required before any cloud or remote deployment is permitted.

---

## Phase 1: Days 1–30 — Local MVP Stabilization & Core Curriculum (Complete)

### Delivered in Gate 01, Gate 02 & M4
- [x] Deterministic competency derivation (`NOT_OBSERVED` → `SUPPORTED` → `INDEPENDENT` → `RETAINED` → `TRANSFERRED`) with failed-review demotion (`RETAINED` → `INDEPENDENT`) and first-attempt (`attemptNo === 1`) anti-brute-force rule.
- [x] Spaced review scheduler (`[1, 3, 7, 14]` days ladder with 1-day reset on review failure and parent escalation on 3+ consecutive failures).
- [x] Strict client-server boundary: answer keys stripped from learner responses; server-only grading and server-enforced hint provenance (`hint.requested` audit trail prevents `helpLevel` spoofing).
- [x] Hardened security middleware: per-client rate-limiting buckets (`AUTH_RATE_LIMITER` 5/60s, `API_RATE_LIMITER` 120/60s), `Origin` header validation, `x-tlo-csrf` enforcement, and automatic password hash upgrade (`needsRehash`).
- [x] Local D1 SQLite schema (22 domain tables including `lesson_versions` immutable snapshots, FK enforcement, CHECK constraints) and reference catalogue.
- [x] Parent governance screens: authentication, per-learner and per-version lesson approval gate with 30-minute continuation grace window on revoke, mastery dashboard, and full JSON export/import/delete.
- [x] Expanded Grade 4 Mathematics, English, and Vietnamese curriculum modules.

---

## Phase 2: Days 31–60 — Pedagogical Depth & Parent Authoring Tools (Complete — M4)

- [x] **Interactive Spaced Review Queue UI**:
  - Dedicated daily "Đến hạn ôn tập" flow on the learner home screen pulling directly from due `review_schedule` items with direct lesson navigation.
- [x] **Parent Correction & Observation Recording**:
  - UI controls allowing the parent to record offline observations or manual state overrides (`source = 'parent_correction'`) with mandatory `correction_note` (`POST /api/parent/skills/correct`).
- [x] **Local Lesson Authoring Validator**:
  - CLI validator (`npm run validate:lessons`) verifying schema integrity, 5-step teaching sequence, zero answer-key leakage, and unique skill coverage across all shipped lessons.

---

## Phase 3: Days 61–90 — Multi-Term Analytics, School-Year Transitions & 5-Subject Baseline/Planner Parity (Complete — M5 & M6)

- [x] **School-Year Archival & Comparison**:
  - Smooth transition workflows across `school_years` (`POST /api/parent/school-years`, e.g., Grade 4 → Grade 5) while preserving historical sessions, attempts, and competency snapshots per school year on `GET /api/parent/dashboard` and propagating active school year to Curriculum Setup and the 4-Week Planner.
- [x] **Prerequisite Graph Guided Recommendations**:
  - Deterministic prerequisite-graph engine (`derivePrerequisiteRecommendations`) highlighting `unlocked_next`, `prerequisite_gap`, and `reinforce_supported` lessons on `GET /api/parent/dashboard` with one-click parent approval.
- [x] **Activated Science & Reasoning Modules + 5-Subject Grade 4–5 Depth Parity**:
  - Curriculum packs and baseline diagnostics cover Grades 4 and 5 across all five active subjects: 10 lessons per subject, 50 lessons total (40 core + 10 baseline). / Học liệu và bài khảo sát đầu vào phủ Lớp 4–5 ở cả năm môn: 10 bài mỗi môn, tổng cộng 50 bài (40 bài chính + 10 bài khảo sát). Cross-tenant organization-lesson visibility filtering remains enforced across dashboard, baseline, and planner routes.
- [x] **B2B2C Center & Classroom Studio UI (`/parent/organization`)**:
  - End-to-end UI for creating organizations, managing members with role-based access (`owner` vs `admin` vs `teacher`), viewing consented learners, creating classrooms, enrolling learners, authoring polymorphic 5-step lessons (`draft` → `submitted` → `org_approved` / `rejected`), assigning center-approved lessons with version pinning (`assigned_version`), and viewing consent-gated classroom progress (`GET /api/org/classrooms/progress`) while preserving final parent approval sovereignty.
- [x] **Family Practice Lessons, Mastery Isolation & 4-Week Practice Scheduling (M10 & M11)**:
  - Parent-owned family practice forks (`POST /api/parent/lessons/fork`, `ownership_type = 'family'`, `purpose = 'practice'`) with strict mastery isolation (`evidence_kind = 'assisted'`, never elevating `INDEPENDENT` mastery or mutating `review_schedule`), explicit scheduling into the 4-week planner (`POST /api/parent/planner/schedule-practice`, `item_kind = 'practice'`), end-to-end `"Luyện tập gia đình"` transparency badges across learner and parent views, and version-scoped collision-safe JSON/AES-256-GCM backup/restore.

---

## Production Gate (Cloud Deployment Remain Blocked Until All Are Met)

No `wrangler deploy`, remote D1 creation, or public URL publication may occur unless and until:

1. **Founder Written Authorization**: Explicit sign-off revoking the `LOCAL ONLY` constraint in `wrangler.jsonc`.
2. **Child Privacy Legal Sign-Off**: Completion of the compliance review specified in `docs/CHILD_PRIVACY_REVIEW.md` §4 (Nghị định 13/2023/NĐ-CP impact assessment).
3. **Production Secret Provisioning**: High-entropy `SESSION_SECRET` and production `PARENT_PASSWORD_HASH` provisioned via encrypted Worker secrets (never in config files).
4. [x] **Automated Off-Site Encrypted Backups (Verified Locally — M8)**: Web Crypto `AES-256-GCM` + `PBKDF2-SHA256` (600,000 iterations) authenticated backup encryption (`src/shared/crypto/backup-cipher.ts`) wired into `/parent/data` and `npm run export:learner`, plus automated isolated backup/restore and tamper-rejection drill (`npm run backup:drill`).
