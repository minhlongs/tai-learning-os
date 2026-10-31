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

## 4. Vietnamese Personal-Data Law Review & Pre-Production Compliance Gate

> **Important Legal Disclaimer**: This checklist distinguishes implemented **engineering controls** from **unresolved legal obligations**. Existence of this checklist does **not** constitute legal compliance or legal sign-off. Production / hosted release remains **BLOCKED** pending formal legal review.

### Official Regulatory References
- **Law on Personal Data Protection**: Luật Bảo vệ dữ liệu cá nhân số **91/2025/QH15**
- **Guiding Decree**: Nghị định số **356/2025/NĐ-CP** (và quy định kế thừa từ Nghị định 13/2023/NĐ-CP)
- **Official Portals**:
  - Cổng Thông tin điện tử Chính phủ — Hệ thống văn bản quy phạm pháp luật: [https://vanban.chinhphu.vn/](https://vanban.chinhphu.vn/)
  - Cổng Thông tin điện tử Bộ Công an: [https://bocongan.gov.vn/](https://bocongan.gov.vn/)

### Engineering Controls vs. Unresolved Legal Obligations (Law 91/2025/QH15 & Decree 356/2025/NĐ-CP)

| Requirement Area | Engineering Control (Implemented in Local MVP) | Unresolved Legal Obligation (Blocks Hosted / Production Release) |
|---|---|---|
| **Child Data Protection (Under 13 / Children's Personal Data)** | Zero collection of full legal name, full DOB, school, address, phone, or photo. Only `nickname` (`"Tài"`) and `birth_year` (`2016`) are stored locally. | Formal verification of parent/guardian legal status and recorded written/electronic consent compliant with Law 91/2025/QH15 and Decree 356/2025/NĐ-CP before any hosted processing. |
| **Parental Consent & Governance** | Fail-closed parent authentication (`tlo_session`), parent lesson approval gate (`review_approvals`), and parent-only data controls. | Legally binding privacy notice, consent withdrawal procedure, and audit retention policy for hosted services. |
| **Right to Access, Portability & Erasure** | Full JSON export (`tai-learning-os-export@v1`), schema-validated import, and confirmed cascade deletion (`DELETE /api/data/learner` with `XOA <Nickname>`). | Statutory SLA and formal verification workflow for data subject requests if operated as a hosted service. |
| **Data Processing Impact Assessment (DPIA) & Cross-Border Transfer** | Local-only SQLite (`.wrangler/state/v3/d1`); zero external network calls, zero third-party analytics, zero cloud transfers. | Filing of DPIA (Hồ sơ đánh giá tác động xử lý dữ liệu cá nhân) and Cross-Border Transfer Impact Assessment (nếu dùng hạ tầng đám mây ngoài lãnh thổ Việt Nam) with Bộ Công an (A05). |
| **AI & Automated Decision-Making** | Zero LLM/generative AI in learner mode; deterministic rule-based grading and spaced review; no IQ or psychological profiling. | Separate legal and child-safety impact review required before enabling any future AI-assisted features. |
| **Security Penetration & Multi-Tenant Isolation** | PBKDF2-SHA256 (600,000 iterations), HMAC-SHA256 sessions, double-submit CSRF, rate limiting, owner-scoped SQL (`parent_id`). | Independent third-party security audit before any multi-family or public deployment. |

