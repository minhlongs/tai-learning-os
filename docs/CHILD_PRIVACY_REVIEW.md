# TAI LEARNING OS — Child Privacy & Data Protection Review

> **Status: Gate 01 Verified (Local-Only Scope).**
> This document records the privacy controls, data minimization decisions, and legal boundaries
> governing learner data in TAI LEARNING OS.

---

## 1. Core Principle: Privacy by Absence

The safest child personal data is data that is never collected. TAI LEARNING OS is architected so
that even if the local database file were copied or inspected, no personally identifiable information
(PII) capable of identifying a specific child outside the household exists within it.

### Data Minimization Matrix

| Category | Stored in Database? | Technical Enforcement |
|---|---|---|
| Legal full name | **NO** | `learners.nickname` only (e.g., `"Tài"`). |
| Exact date of birth | **NO** | `learners.birth_year` (integer year, e.g., `2016`, optional). |
| School name or class | **NO** | No column exists. `school_years.label` is a generic calendar span (`"2026-2027"`). |
| Home address or GPS | **NO** | No column exists. Only `timezone` (`"Asia/Ho_Chi_Minh"`) is stored for day-boundary calculation. |
| Email / Phone number | **NO** | Neither parent nor learner has an email or phone field. |
| Photos, audio, or video | **NO** | All exercise visuals are deterministic inline SVG keys defined in `src/shared/schemas/exercise.ts`. |
| Behavioral profiling / Ad IDs | **NO** | Zero third-party scripts, cookies, or analytics libraries. |
| Free-text learner chat | **NO** | No open chat or LLM interface exists. Exercises are structured choice or fraction inputs. |

---

## 2. Parent Sovereignty & Governance Controls

1. **Mandatory Parent Gate**:
   - The system fails closed without an authenticated parent session.
   - No lesson is accessible to the child unless explicitly marked `approved` by the parent in `review_approvals`.
2. **Complete Visibility**:
   - Every learning attempt (`learning_attempts`), derived skill state (`skill_evidence`), and review schedule item (`review_schedule`) is inspectable by the parent on `/parent`.
3. **Full Portability (Export / Import)**:
   - Parents can export the complete learning record as a human-readable JSON file (`tai-learning-os-export@v1`) via the UI (`/parent/data`) or CLI (`npm run export:learner`).
4. **Right to Erasure (Hard Delete Cascade)**:
   - Parents can permanently purge the learner's profile, sessions, attempts, evidence, and schedules via `DELETE /api/data/learner` (requiring explicit confirmation `XOA <Nickname>`).

---

## 3. Psychological Safety & Honest Pedagogy

- **No Dark Patterns**: No streaks, leaderboards, countdown timers, loot boxes, or artificial gamification points.
- **Separation of Child Feedback and Parent Assessment**:
  - The child sees encouraging, constructive Vietnamese feedback (`"Chính xác!"`, `"Chưa đúng, em thử lại nhé"`) and step explanations.
  - Raw failure streaks, retention decay states, and parent escalation flags (`needsParentAttention`) are shown exclusively to the parent, preventing learner anxiety.

---

## 4. Pre-Production Legal & Compliance Gate (Blocked Until Satisfied)

TAI LEARNING OS is currently restricted to **local household execution (`LOCAL ONLY / PRODUCTION BLOCKED`)**. Before any hosted or multi-family deployment can be considered, the following requirements must be completed and signed off:

1. **Vietnamese Personal Data Protection Decree (Nghị định 13/2023/NĐ-CP)**:
   - Formal impact assessment for processing children's data (DPIA) and verifiable parental consent workflows.
2. **COPPA / GDPR-K Alignment (if accessed internationally)**:
   - Explicit privacy notice, verifiable parental consent mechanisms, and encrypted cloud storage at rest.
3. **Independent Security Penetration Test**:
   - Verification of tenant isolation if multi-parent hosting is ever introduced.
