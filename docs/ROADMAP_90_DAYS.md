# TAI LEARNING OS — 90-Day Roadmap & Production Gate

> **Release Policy: LOCAL ONLY / PRODUCTION BLOCKED.**
> This document outlines the 90-day evolution from the Gate 01 Local MVP to a rich household learning
> system, along with the strict conditions required before any cloud or remote deployment is permitted.

---

## Phase 1: Days 1–30 — Local MVP Stabilization & Core Curriculum (Current: Gate 01 Complete)

### Delivered in Gate 01
- [x] Deterministic competency derivation (`NOT_OBSERVED` → `SUPPORTED` → `INDEPENDENT` → `RETAINED` → `TRANSFERRED`).
- [x] Spaced review scheduler (`[1, 3, 7, 14]` days ladder with parent escalation on 3+ failures).
- [x] Strict client-server boundary: answer keys stripped from learner responses; server-only grading and hint progression.
- [x] Local D1 SQLite schema (15 tables, FK enforcement, CHECK constraints) and reference catalogue.
- [x] Parent governance screens: authentication, lesson approval gate, mastery dashboard, and JSON export/import/delete.
- [x] Full verification suite: 163 unit tests, 67 integration tests, 15 E2E browser tests across Desktop, Tablet, and Mobile.

### Remaining in Days 1–30
- [ ] Expand Grade 4 Mathematics library (fractions comparison, word problems, multi-digit operations).
- [ ] Expand Grade 4 English & Vietnamese reading comprehension modules using the existing validated exercise schemas.
- [ ] Routine weekly parent JSON backup habit verification.

---

## Phase 2: Days 31–60 — Pedagogical Depth & Parent Authoring Tools

- **Interactive Spaced Review Queue UI**:
  - Dedicated daily "Ôn tập hôm nay" (Today's Review) flow on the learner home screen pulling directly from due `review_schedule` items.
- **Parent Correction & Observation Recording**:
  - UI controls allowing the parent to record offline observations or manual state overrides (`source = 'parent_correction'`) with mandatory `correction_note`.
- **Local Lesson Authoring Validator**:
  - CLI validator and template generator helping parents author new TypeScript lesson packs with immediate schema verification.

---

## Phase 3: Days 61–90 — Multi-Term Analytics & School-Year Transitions

- **School-Year Archival & Comparison**:
  - Smooth transition workflows across `school_years` (e.g., Grade 4 → Grade 5) while preserving historical competency snapshots.
- **Prerequisite Graph Guided Recommendations**:
  - Highlight recommended next lessons to the parent based on `skill_prerequisites` edges and current `INDEPENDENT`/`RETAINED` mastery states.
- **Activated Science & Reasoning Modules**:
  - Author initial curriculum packs for `science` (`Khoa học`) and `debate` (`Tư duy phản biện`) and flip `subjects.active = 1`.

---

## Production Gate (Cloud Deployment Remain Blocked Until All Are Met)

No `wrangler deploy`, remote D1 creation, or public URL publication may occur unless and until:

1. **Founder Written Authorization**: Explicit sign-off revoking the `LOCAL ONLY` constraint in `wrangler.jsonc`.
2. **Child Privacy Legal Sign-Off**: Completion of the compliance review specified in `docs/CHILD_PRIVACY_REVIEW.md` §4 (Nghị định 13/2023/NĐ-CP impact assessment).
3. **Production Secret Provisioning**: High-entropy `SESSION_SECRET` and production `PARENT_PASSWORD_HASH` provisioned via encrypted Worker secrets (never in config files).
4. **Automated Off-Site Encrypted Backups**: Proven, encrypted backup restoration drill prior to storing any real household history outside the local machine.
