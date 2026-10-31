# M1 — Organization, Classroom & Parent Consent Grant

Status: completed
Branch: `fix/group-a-security-remediation` (local only; no remote, no push)
Route: feature

## Outcome

Establish the fundamental B2B2C boundary for TAI SaaS so tutors and learning centers
can manage classrooms, enroll students, and view progress strictly under explicit,
revocable parent consent.

Key deliverables:
1. **D1 Schema Migration (`0005_organization_and_consent.sql`)**:
   - `organizations`: Tutor centers/schools with unique slug/code.
   - `organization_members`: RBAC for adults (`owner`, `admin`, `teacher`).
   - `classrooms`: Groups of learners managed by an organization.
   - `classroom_teachers`: Teachers assigned to specific classrooms.
   - `learner_consents`: Explicit, revocable authorization granted by a parent.
   - `classroom_enrollments`: Mapping of learners into classrooms.
2. **Repository & Service Layer**:
   - Verification of active consent before querying or returning any learner data to center staff.
   - Immediate access cut-off (instant revocation) when consent is withdrawn.
   - Teacher classroom scoping: teachers can only view learners enrolled in classrooms they teach.
3. **API Routes**:
   - `/api/org/*`: Organization management, invitations, and classroom assignment.
   - `/api/parent/consents/*`: List, grant, and revoke organization access to learner profiles.
4. **Integration & Security Tests**:
   - Proving teacher isolation, consent enforcement, instant revocation, and erasure cascading.

## Invariants & Design Decisions

- **D1. Parent Sovereignty**: Learners belong exclusively to parents (`learners.parent_id`). Organizations never own a learner profile.
- **D2. Explicit Consent Required**: An organization member has ZERO access to a learner until an active consent row exists (`learner_consents.status = 'active'`).
- **D3. Instant Revocation**: When `status` changes to `'revoked'`, all subsequent read/write requests from center members return `403 Forbidden` immediately.
- **D4. Teacher Least Privilege**: An organization `admin`/`owner` can view all consented learners in the center; a `teacher` can only view consented learners enrolled in their assigned classrooms.
- **D5. Append-Only Audit Integrity**: All consent grants, revocations, and classroom enrollments are audited into `audit_events` with PII-free details (never child nickname).
