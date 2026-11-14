# TAI LEARNING OS — Data Model

The schema is the contract. It began as
[`migrations/0001_initial_schema.sql`](../migrations/0001_initial_schema.sql)
("Schema v1": 17 tables, 7 indexes) plus the reference catalogue in
[`migrations/0002_reference_content.sql`](../migrations/0002_reference_content.sql),
and has grown through sixteen migrations, the last being
[`0016_learning_attempts_append_only_update_guard.sql`](../migrations/0016_learning_attempts_append_only_update_guard.sql).

Applying every file in `migrations/` to an empty SQLite database yields
**35 tables, 4 triggers, and 87 indexes**, where 50 of the 87 indexes are the
implicit ones SQLite creates for `UNIQUE` and `PRIMARY KEY` constraints and 37
are written out by hand.

Those numbers come from reading `sqlite_master` after the files have run, not
from counting `CREATE TABLE` strings: the files contain 39 `CREATE TABLE`
statements, but four of them create something that does not survive to the end.
`0007` rebuilds two tables under temporary names (`review_approvals_v7`,
`lesson_steps_v7`) and also copies `learning_attempts` into
`_tmp_learning_attempts` so foreign keys survive the rebuild; `0013` rebuilds one
table under a temporary name (`learning_plan_items_new`) and renames it over the
original. A textual count reports 39; the applied schema reports 35. Only the
applied schema says what exists.

Migrations are not hand-edited: a new migration is added, and `schema_versions`
records which ones have run.

---

## 1. Tables

Grouped by role, roughly in migration order. The 17 tables declared by
`0001_initial_schema.sql` come first; the rest are named with the migration
that introduced them. Two of the 17 (`review_approvals`, `lesson_steps`) are
rebuilt by `0007` under temporary names and renamed back, so they appear once
here even though the SQL for them appears twice in `migrations/`.

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

### Security & trust (`0003`, `0005`)

| Table | Purpose | Notable columns |
|---|---|---|
| `auth_throttles` | Persistent failed-login throttling, so a restart does not clear the lockout. Dual-scoped: the same attempt counts against both the IP and the account. | `key`, `scope` CHECK in `('account','ip')`, `failed_count`, `window_started_at`, `locked_until`; indexes `idx_auth_throttles_scope`, `idx_auth_throttles_locked` |
| `learner_consents` | Records that an organization holds consent for a learner. Revocation is a status change, never a delete — the grant itself stays auditable. | `status` CHECK in `('active','revoked')`, `granted_by` → `parents(id)`, UNIQUE `(organization_id, learner_id)` |

### Content catalogue (reference data)

| Table | Purpose | Notable columns |
|---|---|---|
| `subjects` | The subject catalogue. | `name_vi`, `name_en`, `active` (`0` = documented future module, **not yet built**) |
| `skills` | A reusable capability, e.g. "equivalent fractions". | `code` (stable human-readable, e.g. `MATH.FRAC.EQUIV`), `name_vi`, `name_en`, `grade_from`, `grade_to`, UNIQUE `(subject_id, code)` |
| `skill_prerequisites` | Prerequisite graph. Deterministic ordering for lesson suggestions. | PK `(skill_id, prerequisite_id)`, CHECK `(skill_id <> prerequisite_id)`, index `idx_skill_prereq` |

### Content

| Table | Purpose | Notable columns |
|---|---|---|
| `lessons` | A container of ordered steps with explicit ownership, purpose, and lineage (`0012_family_practice_and_version_lineage.sql`). | `title_vi`, `title_en`, `objective_vi`, `objective_en`, `grade_from`, `grade_to`, `version`, `ownership_type` CHECK in `('catalogue','organization','family')`, `owner_parent_id` → `parents(id)`, `purpose` CHECK in `('official','practice')`, `source_lesson_id`, `source_version` |
| `lesson_steps` | One ordered step within a lesson, snapshotted per version so re-authoring cannot rewrite what an earlier attempt answered. | `position`, `kind` CHECK in `('concept','visual','guided','independent','transfer')`, `content` (JSON, validated against `src/shared/schemas/exercise.ts`), `answer_key` (JSON), `explanation_vi` (shown only after the attempt), `content_version`, `source_step_id`, UNIQUE `(lesson_id, content_version, position)` |
| `review_approvals` | **Parent approval gate.** Only `status = 'approved'` makes a lesson visible in learner mode — and only for the learner and version it names. | `learner_id` → `learners(id)` ON DELETE CASCADE (NULL = not yet bound to a specific learner), `lesson_version`, `status` CHECK in `('draft','approved','rejected')`, `decided_by` → `parents(id)`, `decided_at`, `note`, UNIQUE `(learner_id, lesson_id, lesson_version)` |

### Content lineage and curriculum outcomes (`0003`, `0006`, `0009`)

| Table | Purpose | Notable columns |
|---|---|---|
| `lesson_versions` | An immutable snapshot of a lesson as it was at a given version. Because `lesson_steps` is snapshotted per `content_version`, this table is the index that says which snapshot an attempt was answered against. STRICT. | PK `(lesson_id, version)`; `length()` CHECKs on the serialized fields; backfilled by `0009` for lessons that existed before versioning |
| `lesson_metadata` | Where a lesson's objective came from. Separates "this is a GDPT 2018 outcome" from "the parent's textbook said so" from "we assumed it". | PK = `lesson_id`; `objective_id` → `curriculum_objectives(id)`; `provenance` CHECK in `('gdpt_2018_objective','parent_textbook','original_supplemental','unverified_assumption')`; `is_baseline`, `expected_duration_minutes` |
| `curriculum_objectives` | The outcome registry lessons are mapped onto. Curriculum-independent: a lesson points at an outcome, never at a textbook page. | `code` TEXT NOT NULL UNIQUE (e.g. `GDPT2018.MATH.4.FRAC.01`), `provenance` CHECK (same four values as `lesson_metadata`), `source_ref`, FKs to `subjects` and `skills`. `0003` seeds ten Grade-4 outcomes |
| `curriculum_intakes` | What textbook a household is actually teaching from this year, so lesson suggestions can be ordered against it without the schema depending on it. | `textbook_series`, `current_unit`, `current_lesson` (all DEFAULT `'UNKNOWN'` — the schema never guesses), UNIQUE `(learner_id, subject_id, school_year_label)` |
| `organization_lessons` | A lesson authored by an organization (a center, a teacher). Lives in its own review track, separate from the household's `review_approvals`. | PK = `lesson_id`; `review_status` CHECK in `('draft','submitted','org_approved','org_rejected')` |

### Learner record (evidence)

| Table | Purpose | Notable columns |
|---|---|---|
| `learning_sessions` | One completed lesson run. | `lesson_version` (the IMMUTABLE version the session was authorised against), `school_year_id` (ON DELETE SET NULL), `started_at`, `ended_at` (null while in progress), `status` CHECK in `('in_progress','completed','abandoned')`, `steps_seen`, `continuation_deadline` (monotonic bound on how long a revoked-but-valid session may keep running; NULL = never revoked), `purpose` CHECK in `('official','practice')`; index `idx_sessions_learner` |
| `learning_attempts` | **The atomic evidence record. One row per submitted answer attempt.** | `submitted` (JSON), `outcome` CHECK in `('correct','incorrect','partial')`, `help_level` CHECK `0..4`, `evidence_kind` CHECK in `('observed','assisted','parent_correction')`, `attempt_no`, `step_version`, `purpose` CHECK in `('official','practice')`; indexes `idx_attempts_session`, `idx_attempts_skill`, `idx_attempts_learner` |
| `skill_evidence` | **Derived** competency state per skill. Always recomputed from attempts. | `state` CHECK in `('NOT_OBSERVED','SUPPORTED','INDEPENDENT','RETAINED','TRANSFERRED')`, `independent_count`, `assisted_count`, `correct_count`, `last_independent_at`, `last_observed_at`, `source` CHECK in `('derived','parent_correction')`, `correction_note`; UNIQUE `(learner_id, skill_id)` |
| `review_schedule` | Spaced-review queue. Interval days are **config-driven**, not magic numbers. | `due_at`, `interval_days` DEFAULT 1, `last_result` CHECK in `('passed','failed')`, `last_attempt_at`, `failure_streak` (+1 per failure, so scheduling stays explainable); index `idx_review_due` |
| `learning_goals` | Parent-set goals. **Direction from the family — not measured ability.** | `title_vi`, `note`, `target_date`, `status` CHECK in `('active','paused','achieved','retired')` |
| `baseline_assessments` | A parent-supervised diagnostic run, and the parent's review of it (`0003`). Deliberately not scored by the system: the summaries are the parent's words. | `status` CHECK in `('pending','completed','reviewed')`, `observed_summary_vi`, `supported_summary_vi`, `needs_observation_json`, `suggested_lessons_json`, `parent_review_required` |
| `session_reflections` | The child's own one-tap feeling after a session (`0003`). One row per session; free text is optional and short. | `session_id` UNIQUE, `feeling` CHECK in `('confident','good','neutral','confused','tired')`, `note_vi` |

### The four layers (`0015`)

`0015_four_layer_learner_model.sql` adds two tables beneath `skill_evidence`, so
the chain from "what happened" to "what we believe" is inspectable at every hop.
`docs/adr/ADR-005-four-layer-learner-model.md` records why.

| Layer | Table | What it holds |
|---|---|---|
| 1 — raw observation | `learning_attempts` | The submitted answer itself. Append-only since `0016`. |
| 2 — classified evidence | `skill_evidence_observation` | Which skill a specific attempt speaks to, and how much help was given. Keyed on the attempt, so re-deriving it from `learning_attempts` reproduces it exactly. |
| 3 — memory estimate | `skill_estimate` | The FSRS-6 memory model behind the review decision, with `retrievability_at` and `model_version`. **Not** the scheduler: `review_schedule` still owns the due date. |
| 4 — competency state | `skill_evidence.state` | The derived state that the UI reads. |

| Table | Notable columns |
|---|---|
| `skill_evidence_observation` | `observed_kind` CHECK in `('independent','assisted','correction')`, `help_level` `0..4`, UNIQUE `(learner_id, skill_id, attempt_id)`, index `idx_evidence_obs_learner_skill`. UPDATE is blocked by `skill_evidence_observation_no_update`. |
| `skill_estimate` | FSRS card fields plus `retrievability_at`, `model_version`, and `attempt_watermark` / `attempt_count` — the drift proof that says exactly which prefix of the evidence log this estimate was computed from. |

Nothing in layer 3 is read back into `skill_evidence.state`. The estimate and the
state are computed independently from the same evidence, so a bug in one cannot
silently certify the other.

### Provenance

| Table | Purpose | Notable columns |
|---|---|---|
| `audit_events` | **Append-only** audit trail. Every privileged or correcting action lands here. | `actor` (`'parent:<id>'` \| `'system'` \| `'learner:<id>'`), `action` (e.g. `'lesson.approve'`), `subject` (record id acted upon), `detail` (JSON, **non-sensitive metadata only**); index `idx_audit_time` |
| `content_origin` | Flags lesson content so fixture data can never be confused with, or merged into, the real learner's record. | `origin` CHECK in `('authored','demo','imported')`; PK = `lesson_id` |

### Planner (`0005`, `0013`)

| Table | Purpose | Notable columns |
|---|---|---|
| `learning_plan_items` | 4-week learning schedule items per learner and school year (`0005_pilot_curriculum_and_planner.sql`, widened in `0013_practice_planner_and_classroom_progress.sql`). | `learner_id`, `school_year_label`, `week_index` (`1..4`), `day_of_week` (`1..7`), `subject_id`, `skill_id`, `lesson_id`, `item_kind` CHECK in `('lesson','review','baseline','practice')`, `status` CHECK in `('scheduled','completed','skipped','rescheduled')`, `duration_minutes`, `parent_note`, `reason_vi` |

### B2B2C center governance (`0005`, `0006`, `0007`, `0013`)

These tables exist so a center can use the same engine. **None of them is part of
the household's path**, and the household's own review gate
(`review_approvals`, keyed on a parent) never consults them.

| Table | Purpose | Notable columns |
|---|---|---|
| `organizations` | A center or school. The commercial tenant boundary. | `name`, `slug` UNIQUE |
| `organization_members` | Who acts for an organization. | `user_id`, `role` CHECK in `('owner','admin','teacher')`, UNIQUE `(organization_id, user_id)` |
| `classrooms` | A teaching group inside an organization. | `organization_id`, `name` |
| `classroom_teachers` | Which teachers are attached to a classroom. | PK `(classroom_id, teacher_user_id)` |
| `classroom_enrollments` | Which learners are in a classroom, and whether they still are. Withdrawal is a status, not a delete — the enrollment history stays. | `status` CHECK in `('enrolled','withdrawn')` |
| `classroom_lesson_assignments` | Center-approved lessons assigned to a classroom (`0007_teacher_lesson_workflow.sql`, version-pinned in `0013_practice_planner_and_classroom_progress.sql`). | `classroom_id`, `lesson_id`, `assigned_version` INTEGER NOT NULL DEFAULT 1 (`>= 1`), `assigned_by`, `assigned_at`, `due_at`, UNIQUE `(classroom_id, lesson_id)` |

### Global schema rules (enforced by the file, stated in its header)

1. Every record carries a **stable, opaque identifier** — never the learner's name.
2. Learning evidence is stored **separately from interpretation**. The system
   records what the learner did, what help was given, and any parent correction —
   **never a single merged "score"**.
3. Foreign keys are **ON by default and enforced** (`PRAGMA foreign_keys = ON`).
4. **No column stores free-text personal data** beyond what a lesson needs.

---

## 2. The evidence / provenance design

This is the core idea of the schema. A conventional design would keep one row per
skill and overwrite its "score"; here five tables participate, and each one holds
a different kind of statement:

```
                                  ┌─ skill_evidence_observation  (0015, layer 2)
  learning_attempts ──▶           │
  what happened     ──▶  skill_evidence ──prov──▶ audit_events
                     │  what it means            who decided
                     └─ skill_estimate            (0015, layer 3)

  APPEND-ONLY       DERIVED, RECOMPUTABLE        APPEND-ONLY
  never overwritten  always re-derivable         never rewritten
```

`learning_attempts` (since `0016`) and `skill_evidence_observation` (since `0015`)
both reject `UPDATE` at the database level, so a correction cannot rewrite
history in place — it must be recorded as a new row. `audit_events` (since `0004`)
rejects both `UPDATE` and `DELETE`.

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
> `skill_evidence`, `review_schedule`, `skill_evidence_observation`, and `skill_estimate`),
> data exports, imports, and learner deletion cascades.
> Migration `0004_evidence_integrity.sql` enforces append-only DML semantics via SQLite triggers
> (`audit_events_no_update` and `audit_events_no_delete`); `0015` adds
> `skill_evidence_observation_no_update` and `0016` adds `learning_attempts_no_update`.
> Note the threat-model boundary: these triggers block `UPDATE` and `DELETE` DML within the
> active schema, but do not protect against `DROP TRIGGER`, `DROP TABLE`, schema replacement,
> direct SQLite file replacement, or a privileged database administrator.
> The guards are deliberately asymmetric: `0004` blocks both `UPDATE` and `DELETE`, while `0015`
> and `0016` block `UPDATE` only. `DELETE` stays permitted because three legitimate paths need
> it — `deleteLearner` (which audits first), `resetUserData` (whose batch is all-or-nothing), and
> `ON DELETE CASCADE` from `lessons`. Each guard's scope is stated in the migration that adds it.

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
 migrations/0003 … 0016                ──▶  INSERT INTO schema_versions (3 … 16, …)
```

- **Written by:** each migration inserts its own row. `0002` inserts `version = 1`,
  `applied_at = strftime('%s','now') * 1000` (unix epoch **ms**, not seconds), and
  the description `'Initial schema: parents through audit_events'`; `0003` through
  `0016` insert `3` through `16` the same way. Nothing records `version = 2`: the
  file numbered `0002` is the reference catalogue and is the one that stamped v1,
  so the numbering in `schema_versions` is the migration's own claim about the
  schema, not an echo of its filename. A gap in that column is not a missing
  migration — check `migrations/` for that, and check `MAX(version)` here for what
  the database believes it is.
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

**⚠ Stale SQL comment in migration 0001.** `migrations/0001_initial_schema.sql`
lines 24 and 27 say *scrypt* (`wrangler.jsonc` has been updated to state PBKDF2-SHA256).
The code is PBKDF2-SHA256, and the code comment records the verified reason:
**workerd's Web Crypto does not implement scrypt — attempting it throws.**
PBKDF2-SHA256 was chosen because it is a NIST-approved platform primitive rather
than bespoke cryptography.

The SQL comment in `0001_initial_schema.sql` is kept untouched because historical
migrations are never hand-edited. **The code is authoritative.** Do not rely on
the SQL comment when reviewing this design.

---

## 7. Reference data installed by migrations

Migration 0002 is described in its own header as *"REQUIRED for the app to
work"* and *"contains no learner data."* It is the first of six migrations that
install reference rows; the numbers below are the state after **all sixteen**
migrations have run, not the state after 0002 alone.

| Measure | 0002 alone | After all 16 | Added by |
|---|---|---|---|
| Subjects | 5 rows, 3 active | 5 rows, 5 active | `0010` activates `science` and `debate` |
| Skills | 12 | **41** | `0008` +1, `0010` +4, `0011` +4, `0014` +20 |
| Prerequisite edges | 6 | **33** | `0008` +1, `0010` +2, `0011` +4, `0014` +20 |
| Curriculum objectives | 0 (table absent) | **40** | `0003` +10, `0008` +2, `0010` +4, `0011` +4, `0014` +20 |

The 41 skills split across the five subjects as math 9, English 8, Vietnamese 8,
science 8, debate 8, and across grade bands as `grade_from` 3 → 7, 4 → 14,
5 → 20. The 40 objectives split by provenance as 32 `gdpt_2018_objective` and
8 `original_supplemental`. Measuring this is a query, not a reading of the SQL:
`SELECT COUNT(*) FROM skills` against a database with every migration applied.

- **`schema_versions`** — one row per migration. `0002` stamps `version = 1`
  (the schema it builds on), and `0003`–`0016` stamp 3–16. No row records
  `version = 2`; see §4 for why that is not a missing migration.
- **Subjects — 5 rows, all active** (`0002` inserts them; `0010` flips
  `science` and `debate` from `active = 0` to `active = 1`):

  | id | name_vi | name_en | active |
  |---|---|---|---|
  | `math` | Toán | Mathematics | 1 |
  | `english` | Tiếng Anh | English | 1 |
  | `vietnamese` | Tiếng Việt | Vietnamese | 1 |
  | `science` | Khoa học | Science | 1 |
  | `debate` | Tư duy phản biện | Reasoning & Debate | 1 |

- **Skills — 41 rows** across the five active subjects (including `sci-water-cycle`,
  `sci-plant-needs`, `deb-claim-reason`, `deb-fact-opinion`, all of which arrive
  after `0002`), each with a stable `code` (e.g. `MATH.FRAC.EQUIV`,
  `ENG.DIALOG.GREET`, `VIE.READ.EVID`, `SCI.G4.WATER.CYCLE`,
  `DEB.G4.CLAIM.REASON`) and a `grade_from` / `grade_to` band.
- **Prerequisites — 33 edges**, a deterministic skill dependency graph. The 6
  edges written by `0002` are `math-frac-equiv → math-frac-identify`,
  `math-frac-compare → math-frac-equiv`, `math-word-problem → math-frac-identify`,
  `eng-sentence-basic → eng-voc-noun`, `eng-voc-home → eng-voc-noun`,
  `vie-evidence → vie-reading-main`; `0008`, `0010`, `0011`, and `0014` add the
  remaining 27 edges (including `sci-plant-needs → sci-water-cycle` and
  `deb-fact-opinion → deb-claim-reason`).

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
- [`adr/ADR-001-single-independent-standard.md`](adr/ADR-001-single-independent-standard.md) — why `observed` means independent, and how `assisted` is derived.
- [`adr/ADR-002-fsrs-spaced-review.md`](adr/ADR-002-fsrs-spaced-review.md) — `ts-fsrs` v6 replaces the fixed `[1,3,7,14]` ladder.
- [`adr/ADR-003-batch-atomicity-and-encrypted-backup.md`](adr/ADR-003-batch-atomicity-and-encrypted-backup.md) — why every cross-table write is one `db.batch` call.
- [`adr/ADR-004-production-lock.md`](adr/ADR-004-production-lock.md) — why the deploy path is closed and what would have to change to open it.
- [`adr/ADR-005-four-layer-learner-model.md`](adr/ADR-005-four-layer-learner-model.md) — the raw evidence → observation → estimate → state separation described in §2.
