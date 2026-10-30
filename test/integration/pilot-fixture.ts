/**
 * Pilot Fixture Data Definition (M3)
 *
 * Provides a canonical local pilot dataset for testing and running the B2B2C learning OS:
 *   - 1 Center (Organization): "Trung Tâm Bồi Dưỡng Tài Năng Trẻ"
 *   - 1 Owner (Parent/Admin): "Cô Hiệu Trưởng Mai"
 *   - 2 Teachers:
 *       1. "Thầy Quang" (Chuyên Toán lớp 4)
 *       2. "Cô Hương" (Chuyên Tiếng Anh & Tiếng Việt lớp 4)
 *   - 2 Classrooms:
 *       1. "Lớp Toán 4A - Tư Duy Phân Số"
 *       2. "Lớp Anh - Việt 4B - Giao Tiếp & Đọc Hiểu"
 *   - 5 Grade-4 Learners under 5 distinct Parent accounts (B2B2C boundary):
 *       1. Bé Tài (Parent: Ba Tài) -> Enrolled in Lớp Toán 4A
 *       2. Bé Bảo (Parent: Mẹ Bảo) -> Enrolled in Lớp Toán 4A
 *       3. Bé Châu (Parent: Ba Châu) -> Enrolled in Lớp Toán 4A
 *       4. Bé Duy (Parent: Mẹ Duy) -> Enrolled in Lớp Anh - Việt 4B
 *       5. Bé Em (Parent: Ba Em) -> Enrolled in Lớp Anh - Việt 4B
 *
 * Privacy by Absence Guard:
 *   - No full legal names, no dates of birth (birthYear only), no emails, no phones, no addresses.
 */

import type { MultipleChoiceSpec } from "../../src/shared/schemas/exercise";

export interface PilotTeacher {
  id: string;
  name: string;
  role: "teacher";
  subject: string;
}

export interface PilotLearnerConfig {
  parentId: string;
  parentName: string;
  learnerId: string;
  nickname: string;
  birthYear: number;
  grade: number;
  classroomName: "math4a" | "lang4b";
}

export const PILOT_ORGANIZATION = {
  id: "org-tai-nang-001",
  name: "Trung Tâm Bồi Dưỡng Tài Năng Trẻ",
  slug: "tai-nang-tre",
};

export const PILOT_OWNER = {
  id: "parent-owner-mai",
  name: "Cô Hiệu Trưởng Mai",
  role: "owner" as const,
};

export const PILOT_TEACHERS: PilotTeacher[] = [
  {
    id: "parent-teacher-quang",
    name: "Thầy Quang",
    role: "teacher",
    subject: "math",
  },
  {
    id: "parent-teacher-huong",
    name: "Cô Hương",
    role: "teacher",
    subject: "english",
  },
];

export const PILOT_CLASSROOMS = {
  math4a: {
    id: "classroom-math-4a",
    organizationId: PILOT_ORGANIZATION.id,
    name: "Lớp Toán 4A - Tư Duy Phân Số",
    grade: 4,
    subjectId: "math",
    teacherId: "parent-teacher-quang",
  },
  lang4b: {
    id: "classroom-lang-4b",
    organizationId: PILOT_ORGANIZATION.id,
    name: "Lớp Anh - Việt 4B - Giao Tiếp & Đọc Hiểu",
    grade: 4,
    subjectId: "english",
    teacherId: "parent-teacher-huong",
  },
};

export const PILOT_LEARNERS: PilotLearnerConfig[] = [
  {
    parentId: "parent-ba-tai",
    parentName: "Ba Minh (Phụ huynh bé Tài)",
    learnerId: "learner-tai-01",
    nickname: "Bé Tài",
    birthYear: 2016,
    grade: 4,
    classroomName: "math4a",
  },
  {
    parentId: "parent-me-bao",
    parentName: "Mẹ Lan (Phụ huynh bé Bảo)",
    learnerId: "learner-bao-02",
    nickname: "Bé Bảo",
    birthYear: 2016,
    grade: 4,
    classroomName: "math4a",
  },
  {
    parentId: "parent-ba-chau",
    parentName: "Ba Hùng (Phụ huynh bé Châu)",
    learnerId: "learner-chau-03",
    nickname: "Bé Châu",
    birthYear: 2016,
    grade: 4,
    classroomName: "math4a",
  },
  {
    parentId: "parent-me-duy",
    parentName: "Mẹ Trang (Phụ huynh bé Duy)",
    learnerId: "learner-duy-04",
    nickname: "Bé Duy",
    birthYear: 2016,
    grade: 4,
    classroomName: "lang4b",
  },
  {
    parentId: "parent-ba-em",
    parentName: "Ba Đức (Phụ huynh bé Em)",
    learnerId: "learner-em-05",
    nickname: "Bé Em",
    birthYear: 2016,
    grade: 4,
    classroomName: "lang4b",
  },
];

export const PILOT_MATH_LESSON_CONTENT: {
  titleVi: string;
  objectiveVi: string;
  subjectId: string;
  steps: {
    kind: "guided";
    content: MultipleChoiceSpec;
    answerKey: { choiceId: string };
    explanationVi: string;
  }[];
} = {
  titleVi: "Khái niệm phân số và các thành phần",
  objectiveVi: "Nhận biết tử số, mẫu số và ý nghĩa của phân số trong bài toán thực tế",
  subjectId: "math",
  steps: [
    {
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Trong phân số 3/4, số 4 được gọi là gì?",
        choices: [
          { id: "c1", label_vi: "Tử số", correct: false },
          { id: "c2", label_vi: "Mẫu số", correct: true },
          { id: "c3", label_vi: "Thương số", correct: false },
          { id: "c4", label_vi: "Hiệu số", correct: false },
        ],
        hint1_vi: "Số nằm ở dưới dấu gạch ngang chỉ số phần bằng nhau được chia ra.",
        hint2_vi: "Mẫu số ở dưới, tử số ở trên.",
        hint3_vi: "Chọn 'Mẫu số'.",
      },
      answerKey: { choiceId: "c2" },
      explanationVi: "Trong phân số 3/4, 3 là tử số (chỉ số phần lấy đi), 4 là mẫu số (chỉ tổng số phần bằng nhau).",
    },
  ],
};

export async function seedPilotFixture(db: D1Database): Promise<{
  organizationId: string;
  classroomsCount: number;
  teachersCount: number;
  learnersCount: number;
  lessonId: string;
}> {
  const now = Date.now();
  // Using standard local test hash
  const defaultPwHash = "pbkdf2:600000:6578616d706c6573616c743132333435:c90b6a6c0b968415a774db8cfc4083a002fa883017cf49fa3e75ef08fa671d18";

  // 1. Center Owner
  await db
    .prepare(
      `INSERT OR REPLACE INTO parents (id, password_hash, display_name, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?4)`,
    )
    .bind(PILOT_OWNER.id, defaultPwHash, PILOT_OWNER.name, now)
    .run();

  // 2. Teachers
  for (const t of PILOT_TEACHERS) {
    await db
      .prepare(
        `INSERT OR REPLACE INTO parents (id, password_hash, display_name, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?4)`,
      )
      .bind(t.id, defaultPwHash, t.name, now)
      .run();
  }

  // 3. Parents and Learners
  for (const item of PILOT_LEARNERS) {
    await db
      .prepare(
        `INSERT OR REPLACE INTO parents (id, password_hash, display_name, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?4)`,
      )
      .bind(item.parentId, defaultPwHash, item.parentName, now)
      .run();

    await db
      .prepare(
        `INSERT OR REPLACE INTO learners (id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, 'Asia/Ho_Chi_Minh', ?6, ?6)`,
      )
      .bind(item.learnerId, item.parentId, item.nickname, item.birthYear, item.grade, now)
      .run();
  }

  // 4. Organization
  await db
    .prepare(
      `INSERT OR REPLACE INTO organizations (id, slug, name, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?4)`,
    )
    .bind(PILOT_ORGANIZATION.id, PILOT_ORGANIZATION.slug, PILOT_ORGANIZATION.name, now)
    .run();

  // 5. Memberships
  await db
    .prepare(
      `INSERT OR REPLACE INTO organization_members (id, organization_id, user_id, role, created_at, updated_at)
       VALUES (?1, ?2, ?3, 'owner', ?4, ?4)`,
    )
    .bind("member-owner-mai", PILOT_ORGANIZATION.id, PILOT_OWNER.id, now)
    .run();

  for (const t of PILOT_TEACHERS) {
    await db
      .prepare(
        `INSERT OR REPLACE INTO organization_members (id, organization_id, user_id, role, created_at, updated_at)
         VALUES (?1, ?2, ?3, 'teacher', ?4, ?4)`,
      )
      .bind(`member-${t.id}`, PILOT_ORGANIZATION.id, t.id, now)
      .run();
  }

  // 6. Classrooms & Teacher Assignments
  for (const c of Object.values(PILOT_CLASSROOMS)) {
    await db
      .prepare(
        `INSERT OR REPLACE INTO classrooms (id, organization_id, name, grade, subject_id, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)`,
      )
      .bind(c.id, c.organizationId, c.name, c.grade, c.subjectId, now)
      .run();

    await db
      .prepare(
        `INSERT OR REPLACE INTO classroom_teachers (id, classroom_id, teacher_id, assigned_at)
         VALUES (?1, ?2, ?3, ?4)`,
      )
      .bind(`ct-${c.id}`, c.id, c.teacherId, now)
      .run();
  }

  // 7. Consents & Enrollments
  for (const item of PILOT_LEARNERS) {
    await db
      .prepare(
        `INSERT OR REPLACE INTO learner_consents (id, organization_id, learner_id, granted_by, status, granted_at, revoked_at)
         VALUES (?1, ?2, ?3, ?4, 'active', ?5, NULL)`,
      )
      .bind(`consent-${item.learnerId}`, PILOT_ORGANIZATION.id, item.learnerId, item.parentId, now)
      .run();

    const classroomId = PILOT_CLASSROOMS[item.classroomName].id;
    await db
      .prepare(
        `INSERT OR REPLACE INTO classroom_enrollments (id, classroom_id, learner_id, enrolled_by, status, enrolled_at)
         VALUES (?1, ?2, ?3, ?4, 'enrolled', ?5)`,
      )
      .bind(`enroll-${item.learnerId}`, classroomId, item.learnerId, PILOT_OWNER.id, now)
      .run();
  }

  // 8. Teacher-Authored Math Lesson + Center Approved + Classroom Assigned + Parent Approved
  const lessonId = "pilot-lesson-math-01";
  await db
    .prepare(
      `INSERT OR REPLACE INTO lessons (id, subject_id, title_vi, title_en, objective_vi, objective_en, grade_from, grade_to, version, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?3, ?4, ?4, 4, 4, 1, ?5, ?5)`,
    )
    .bind(
      lessonId,
      PILOT_MATH_LESSON_CONTENT.subjectId,
      PILOT_MATH_LESSON_CONTENT.titleVi,
      PILOT_MATH_LESSON_CONTENT.objectiveVi,
      now,
    )
    .run();

  const step = PILOT_MATH_LESSON_CONTENT.steps[0]!;
  await db
    .prepare(
      `INSERT OR REPLACE INTO lesson_steps (id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version)
       VALUES (?1, ?2, 1, ?3, ?4, ?5, ?6, 1)`,
    )
    .bind(
      "pilot-step-math-01-s1",
      lessonId,
      step.kind,
      JSON.stringify(step.content),
      JSON.stringify(step.answerKey),
      step.explanationVi,
    )
    .run();

  await db
    .prepare(
      `INSERT OR REPLACE INTO organization_lessons (lesson_id, organization_id, author_id, review_status, reviewed_by, reviewed_at, review_note, created_at, updated_at)
       VALUES (?1, ?2, ?3, 'org_approved', ?4, ?5, 'Duyệt bài mẫu thí điểm', ?5, ?5)`,
    )
    .bind(lessonId, PILOT_ORGANIZATION.id, PILOT_TEACHERS[0]!.id, PILOT_OWNER.id, now)
    .run();

  await db
    .prepare(
      `INSERT OR REPLACE INTO classroom_lesson_assignments (id, classroom_id, lesson_id, assigned_by, assigned_at, due_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    )
    .bind(
      "assign-pilot-math-01",
      PILOT_CLASSROOMS.math4a.id,
      lessonId,
      PILOT_TEACHERS[0]!.id,
      now,
      now + 7 * 86400_000,
    )
    .run();

  // Pre-approve for Ba Minh (Bé Tài)
  await db
    .prepare(
      `INSERT OR REPLACE INTO review_approvals (id, lesson_id, reviewer_id, status, note, created_at, updated_at)
       VALUES (?1, ?2, ?3, 'approved', 'Phụ huynh phê duyệt thí điểm', ?4, ?4)`,
    )
    .bind("approval-pilot-math-01", lessonId, PILOT_LEARNERS[0]!.parentId, now)
    .run();

  return {
    organizationId: PILOT_ORGANIZATION.id,
    classroomsCount: Object.keys(PILOT_CLASSROOMS).length,
    teachersCount: PILOT_TEACHERS.length,
    learnersCount: PILOT_LEARNERS.length,
    lessonId,
  };
}

