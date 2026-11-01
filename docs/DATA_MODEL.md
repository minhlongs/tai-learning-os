# TAI LEARNING OS — Data Model

The schema is the contract. Everything in
[`migrations/0001_initial_schema.sql`](../migrations/0001_initial_schema.sql)
("Schema v1", **15 tables, 7 indexes**) plus the reference catalogue in
[`migrations/0002_reference_content.sql`](../migrations/0002_reference_content.sql).

Two files own this design. Migrations are not hand-edited: a new migration is
added, and `schema_versions` records which ones have run.

---

## 1. Tables

Grouped by role. All 15 tables in `0001_initial_schema.sql`, in declaration order.

### Infrastructure

| Table | Purpose | Notable columns |
|---|---|---|
| `schema_versions` | Which schema version this database is at. Import/export checks it. | `version` INTEGER PK, `applied_at` (unix epoch ms), `description` |

### Identity

| Table | Purpose | Notable columns |
|---|---|---|
| `parents` | The adult account. **One row in the local MVP.** | `password_hash` (PBKDF2-SHA256 record — see §6), `display_name`, `created_at`, `updated_at` |
| `learners` | The child. **Display name only.** | `nickname` (e.g. "Tai"), `birth_year` (year only, optional), `grade` (optional), `timezone` DEFAULT `'Asia/Ho_Chi_Minh'`, `archived_at` (null = active; soft delete) |
| `school_years` | Groups a record by school year so it stays meaningful across years. | `label` (e.g. "2026-2027"), `starts_on` / `ends_on` (ISO `YYYY-MM-DD`), UNIQUE `(learner_id, label)` |

### Content catalogue (reference data)

| Table | Purpose | Notable columns |
|---|---|---|
| `subjects` | The subject catalogue. | `name_vi`, `name_en`, `active` (`0` = documented future module, **not yet built**) |
| `skills` | A reusable capability, e.g. "equivalent fractions". | `code` (stable human-readable, e.g. `MATH.FRAC.EQUIV`), `name_vi`, `name_en`, `grade_from`, `grade_to`, UNIQUE `(subject_id, code)` |
| `skill_prerequisites` | Prerequisite graph. Deterministic ordering for lesson suggestions. | PK `(skill_id, prerequisite_id)`, CHECK `(skill_id <> prerequisite_id)`, index `idx_skill_prereq` |

### Content

| Table | Purpose | Notable columns |
|---|---|---|
| `lessons` | A container of ordered steps. | `title_vi`, `title_en`, `objective_vi`, `objective_en`, `grade_from`, `grade_to`, `version` (see below) |
| `lesson_steps` | One ordered step within a lesson, snapshotted per version so re-authoring cannot rewrite what an earlier attempt answered. | `position`, `kind` CHECK in `('concept','visual','guided','independent','transfer')`, `content` (JSON, validated against `src/shared/schemas/exercise.ts`), `answer_key` (JSON), `explanation_vi` (shown only after the attempt), `content_version`, UNIQUE `(lesson_id, content_version, position)` |
| `review_approvals` | **Parent approval gate.** Only `status = 'approved'` makes a lesson visible in learner mode — and only for the learner and version it names. | `learner_id` → `learners(id)` ON DELETE CASCADE (NULL = not yet bound to a specific learner), `lesson_version`, `status` CHECK in `('draft','approved','rejected')`, `decided_by` → `parents(id)`, `decided_at`, `note`, UNIQUE `(learner_id, lesson_id, lesson_version)` |

### Learner record (evidence)

| Table | Purpose | Notable columns |
|---|---|---|
| `learning_sessions` | One completed lesson run. | `lesson_version` (the IMMUTABLE version the session was authorised against), `school_year_id` (ON DELETE SET NULL), `started_at`, `ended_at` (null while in progress), `status` CHECK in `('in_progress','completed','abandoned')`, `steps_seen`, `continuation_deadline` (monotonic bound on how long a revoked-but-valid session may keep running; NULL = never revoked); index `idx_sessions_learner` |
| `learning_attempts` | **The atomic evidence record. One row per submitted answer attempt.** | `submitted` (JSON), `outcome` CHECK in `('correct','incorrect','partial')`, `help_level` CHECK `0..4`, `evidence_kind` CHECK in `('observed','assisted','parent_correction')`, `attempt_no`, `step_version`; indexes `idx_attempts_session`, `idx_attempts_skill`, `idx_attempts_learner` |
| `skill_evidence` | **Derived** competency state per skill. Always recomputed from attempts. | `state` CHECK in `('NOT_OBSERVED','SUPPORTED','INDEPENDENT','RETAINED','TRANSFERRED')`, `independent_count`, `assisted_count`, `correct_count`, `last_independent_at`, `last_observed_at`, `source` CHECK in `('derived','parent_correction')`, `correction_note`; UNIQUE `(learner_id, skill_id)` |
| `review_schedule` | Spaced-review queue. Interval days are **config-driven**, not magic numbers. | `due_at`, `interval_days` DEFAULT 1, `last_result` CHECK in `('passed','failed')`, `last_attempt_at`, `failure_streak` (+1 per failure, so scheduling stays explainable); index `idx_review_due` |
| `learning_goals` | Parent-set goals. **Direction from the family — not measured ability.** | `title_vi`, `note`, `target_date`, `status` CHECK in `('active','paused','achieved','retired')` |

### Provenance

| Table | Purpose | Notable columns |
|---|---|---|
| `audit_events` | **Append-only** audit trail. Every privileged or correcting action lands here. | `actor` (`'parent:<id>'` \| `'system'` \| `'learner:<id>'`), `action` (e.g. `'lesson.approve'`), `subject` (record id acted upon), `detail` (JSON, **non-sensitive metadata only**); index `idx_audit_time` |
| `content_origin` | Flags lesson content so fixture data can never be confused with, or merged into, the real learner's record. | `origin` CHECK in `('authored','demo','imported')`; PK = `lesson_id` |

### Global schema rules (enforced by the file, stated in its header)

1. Every record carries a **stable, opaque identifier** — never the learner's name.
2. Learning evidence is stored **separately from interpretation**. The system
   records what the learner did, what help was given, and any parent correction —
   **never a single merged "score"**.
3. Foreign keys are **ON by default and enforced** (`PRAGMA foreign_keys = ON`).
4. **No column stores free-text personal data** beyond what a lesson needs.

---

## 2. The evidence / provenance design

This is the core idea of the schema, and it is why there are three tables where a
conventional design would use one.

```
  learning_attempts   ──obs──▶   skill_evidence   ──prov──▶   audit_events
  what happened             what it means              who decided

  APPEND / INSERT-ONLY     DERIVED, RECOMPUTABLE      APPEND-ONLY
  never overwritten        always re-derivable        never rewritten
```

### `learning_attempts` — observed facts

One row per submitted answer. Nothing in it is an interpretation: it records
`submitted` (the learner's actual answer), `outcome` (the deterministic
validation result), `help_level` (**how much assistance was given BEFORE the
answer**), and `evidence_kind` (what produced the record). `evidence_kind` covers
three provenances: `observed` (unaided), `assisted` (hint level 3+),
`parent_correction` (recorded by hand). The provenance decision lives in exactly
one place, `evidenceKindFor` in [`src/shared/schemas/attempt.ts`](../src/shared/schemas/attempt.ts),
"so the database never holds an ambiguous record."

### `skill_evidence` — derived interpretation

A competency state is **never stored as an independent assertion**. It is derived
from attempts and the derivation is re-runnable, so the parent can always see
*why* a state was reached. The table still carries its own **evidence basis**
(`independent_count`, `assisted_count`, `correct_count`, `last_independent_at`,
`last_observed_at`) so a state is never a bare number.

Two columns deserve specific attention:

- `source` (`derived` | `parent_correction`) — a state the parent overrode is
  **labelled as a correction**, and `correction_note` records the reason. The
  system cannot silently overwrite evidence with an opinion.
- The five states and their exact derivation rule: see [`LEARNING_ENGINE.md`](LEARNING_ENGINE.md) §3.

`skill_evidence` rows are recomputed, not accumulated: one lucky guess cannot
raise a state, and one wrong answer cannot permanently lower it.

### `audit_events` — append-only

Every privileged or correcting action lands here — lesson approval, a parent
override, an import. There is no UPDATE path and no DELETE path in the design.
`detail` is explicitly "JSON, **non-sensitive metadata only**": record ids,
actions, timestamps. Not passwords, not answers, not notes about the child.

The `actor` vocabulary (`parent:<id>` | `system` | `learner:<id>`) means an event
always names *which kind of principal* acted, so a parent correcting a record can
be distinguished from the system deriving one.

> **Status: Implemented.** `repo.recordAudit` and `repo.auditInsert` in `src/worker/db/repositories.ts`
> write audit records for parent logins, learner enrollment, lesson approvals, hint requests,
> attempt submissions (committed atomically inside `db.batch` alongside `learning_attempts`,
> `skill_evidence`, and `review_schedule`), data exports, imports, and learner deletion cascades.
> Migration `0004_evidence_integrity.sql` enforces append-only DML semantics via SQLite triggers
> (`audit_events_no_update` and `audit_events_no_delete`). Note the threat-model boundary:
> these triggers block `UPDATE` and `DELETE` DML within the active schema, but do not protect
> against `DROP TRIGGER`, `DROP TABLE`, schema replacement, direct SQLite file replacement,
> or a privileged database administrator.

---

## 3. Personal data deliberately ABSENT

Stated in the `learners` table comment and repeated here because it is a design
decision, not an omission:

> Deliberately ABSENT: legal name, date of birth, school, address, phone, photo.

| Field | Status | Held instead |
|---|---|---|
| Legal name / full name | **ABSENT** | `nickname` only (e.g. "Tai") |
| Date of birth | **ABSENT** | `birth_year` — year only, optional, for age banding |
| School name | **ABSENT** | nothing; `school_years.label` is a family-supplied grouping label |
| Home address | **ABSENT** | `timezone` DEFAULT `'Asia/Ho_Chi_Minh'` (a scheduling zone, not a location) |
| Phone number | **ABSENT** | nothing |
| Photo / avatar | **ABSENT** | nothing; exercise imagery is a closed set of locally drawn SVG keys in `exercise.ts` |
| Email | **ABSENT** | nothing; the single parent account is authenticated by password only |
| Third-party identifiers | **ABSENT** | nothing; no analytics SDK, no ad id, no external account link |

**Why:** every absent field is a field that cannot leak, cannot be subpoenaed,
cannot migrate to a server the family never agreed to, and cannot identify a child
outside the household. The MVP needs exactly two things to work — a display name
and a rough grade — and asks for no more. `birth_year` rather than a full DOB is
the clearest example: the app needs an age band, so it stores a year.

Note the asymmetry with `school_years`: `starts_on` / `ends_on` are ISO dates,
but they are **family-entered labels for the school year**, not the child's
personal schedule. They group lessons; they do not describe attendance.

The full minimization table, and the controls that keep these fields out, are in
[`CHILD_PRIVACY_REVIEW.md`](CHILD_PRIVACY_REVIEW.md).

---

## 4. `schema_versions` and export/import compatibility

```
 migrations/0001_initial_schema.sql   ──▶  CREATE TABLE schema_versions
 migrations/0002_reference_content.sql ──▶  INSERT INTO schema_versions (1, …)
```

- **Written by:** migration 0002 inserts `version = 1`, `applied_at =
  strftime('%s','now') * 1000` (unix epoch **ms**, not seconds), and the
  description `'Initial schema: parents through audit_events'`.
- **Role:** it is the single answer to *"is this export compatible with this
  database?"* An export bundle carries the version it was produced under; import
  compares it against the target's current version before applying anything.
- **Why it is a table and not a constant:** a constant in code can drift from the
  database it describes. A row is the database's own statement about itself, and
  a new migration is where it changes.

> **Status: Implemented.** `scripts/export-learner.mjs` and `/api/data/export` emit
> `schemaVersions` and `formatVersion: 1` (`TRANSFER_FORMAT_VERSION`), and
> `/api/data/import` validates incoming envelopes via `validateExportEnvelope` in
> `src/shared/schemas/transfer.ts`.

---

## 5. Content versioning

Two independent version columns exist because they answer different questions:

- `lessons.version` — the **lesson** changed (title, objective, step order, or any
  step content). Bumping it publishes a new immutable snapshot and invalidates
  every approval of the previous version.
- `lesson_steps.content_version` — a **single question** changed. The rows are
  snapshotted per version, so an edited question is distinguishable from an
  earlier one when interpreting old attempts.

`learning_attempts.step_version` records which version the learner actually
answered. Without it, re-authoring a question would silently rewrite the meaning
of every historical attempt against it. With it, an old attempt stays
interpretable as evidence about the version that was asked.

This is why `lesson_steps` is UNIQUE on `(lesson_id, content_version, position)`
rather than `(lesson_id, position)`: several versions of the same step position
coexist, and an in-progress session reads **only** the steps matching its own
`learning_sessions.lesson_version`. Authoring a new version never deletes or
mutates the steps a running session is still answering.

### Approval is scoped to a learner AND a version

`review_approvals` is UNIQUE on `(learner_id, lesson_id, lesson_version)` rather
than `(lesson_id)`. An approval therefore answers one precise question — *may
**this** learner run **this** version of the lesson* — and nothing else follows
from it:

- A second sibling under the same parent gets **no** approval: `learner_id` is
  part of the key, so a row naming one child cannot stand in for another.
- Another family cannot inherit an approval at all: every read is owner-scoped by
  `decided_by = <parent>` and `learner_id`.
- Re-authoring a lesson bumps `lessons.version`, so the approved version and the
  current version diverge and the learner sees the lesson as unapproved until the
  parent re-approves the new version.

A legacy row migrated with `learner_id = NULL` is not bound to any child and is
never read as one learner's approval.

---

## 6. Password storage — and a stale comment

`parents.password_hash` stores a **PBKDF2-SHA256** record produced by
[`src/shared/crypto/password.ts`](../src/shared/crypto/password.ts):

- Format: `pbkdf2-sha256:<iterations>$<saltB64Url>$<hashB64Url>`
- **600,000** iterations for every newly created hash, SHA-256.
- Fresh **16-byte random salt** per password, so identical passwords hash
  differently and precomputation is not reusable.
- Constant-time verification (`timing-safe-equal.ts`), so a wrong password is not
  distinguishable from a right one by how long the check takes.
- **Minimum 10 characters** (`MIN_PASSWORD_LENGTH`), maximum 200.
- The iteration count is stored **with** the hash: `verifyPassword` derives against
  the stored record's iteration count, and `needsRehash` detects legacy records
  (such as 100,000-iteration hashes) so they are transparently upgraded to
  600,000 iterations after a successful login.
- `verifyPassword` **fails closed** on a malformed record.

**⚠ Two stale comments.** `migrations/0001_initial_schema.sql` lines 24 and 27
say *scrypt*, and `wrangler.jsonc` line 49 repeats it. The code is PBKDF2-SHA256,
and the code comment records the verified reason: **workerd's Web Crypto does not
implement scrypt — attempting it throws.** PBKDF2-SHA256 was chosen because it is
a NIST-approved platform primitive rather than bespoke cryptography.

The SQL comments are stale and should be corrected in a new migration's
documentation. **The code is authoritative.** Do not rely on the SQL comment when
reviewing this design.

---

## 7. Reference data installed by migration 0002

Migration 0002 is described in its own header as *"REQUIRED for the app to
work"* and *"contains no learner data."* It installs:

- **`schema_versions`** — the single `version = 1` row.
- **Subjects — 5 active rows** (activated across migrations `0002_reference_content.sql` and `0010_activate_science_and_debate.sql`):

  | id | name_vi | name_en | active |
  |---|---|---|---|
  | `math` | Toán | Mathematics | 1 |
  | `english` | Tiếng Anh | English | 1 |
  | `vietnamese` | Tiếng Việt | Vietnamese | 1 |
  | `science` | Khoa học | Science | 1 |
  | `debate` | Tư duy phản biện | Reasoning & Debate | 1 |

- **Skills — 16 rows** across the five active subjects (including `sci-water-cycle`, `sci-plant-needs`, `deb-claim-reason`, `deb-fact-opinion`), each with a stable `code`
  (e.g. `MATH.FRAC.EQUIV`, `ENG.DIALOG.GREET`, `VIE.READ.EVID`, `SCI.G4.WATER.CYCLE`, `DEB.G4.CLAIM.REASON`) and a
  `grade_from` / `grade_to` band.
- **Prerequisites — 8 edges**, deterministic skill dependency graph:
  `math-frac-equiv → math-frac-identify`, `math-frac-compare → math-frac-equiv`,
  `math-word-problem → math-frac-identify`, `eng-sentence-basic → eng-voc-noun`,
  `eng-voc-home → eng-voc-noun`, `vie-evidence → vie-reading-main`,
  `sci-plant-needs → sci-water-cycle`, `deb-fact-opinion → deb-claim-reason`.

**Lessons are not in SQL.** The migration header explains: lessons live in
TypeScript (`src/shared/content/`) so they can be typechecked and unit-tested, and
are inserted at runtime by the seed script because their content payload must
match the exercise schema exactly.

> **Status: Implemented.** Lessons live in `src/shared/content/` and are seeded into
> local D1 via `npm run seed:demo` (`scripts/seed-lessons.mjs` calling `seedLessons`
> in `test/integration/lesson-seed.ts`).

---

## 8. Related documents

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — component map, why the Worker holds authority, data flow.
- [`LEARNING_ENGINE.md`](LEARNING_ENGINE.md) — competency states and review scheduling.
- [`CHILD_PRIVACY_REVIEW.md`](CHILD_PRIVACY_REVIEW.md) — minimization table and controls.
- [`PARENT_OPERATIONS.md`](PARENT_OPERATIONS.md) — bilingual operational guide.
