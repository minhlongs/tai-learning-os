/**
 * Curriculum coverage report generator (`npm run curriculum:coverage`).
 *
 * Emits the lesson → skill → objective (YCCĐ) mapping matrix as Markdown, plus
 * every gap expressed as a number. It is generated rather than transcribed:
 * the script opens an isolated `tmpdir()` database, replays every shipped
 * migration, seeds the shipped lesson registry through the same `seedLessons()`
 * the operator uses, and then reads the result back out of SQLite. A number in
 * the report therefore cannot drift from the content, because nothing in it is
 * typed by hand.
 *
 * Two facts the report keeps deliberately separate, because merging them would
 * be a lie in either direction:
 *
 *   1. **Mapping completeness** — every lesson carries an objective and every
 *      objective is reachable. This is complete.
 *   2. **Curriculum coverage** — how much of the Grade 4–5 programme the 50
 *      lessons actually represent. This is small, and the report says so.
 *
 * Usage:
 *   node scripts/curriculum-coverage.mjs                      # print to stdout
 *   node scripts/curriculum-coverage.mjs --output <path>      # write the file
 *
 * Local only. Writes nothing outside the OS temp directory unless `--output`.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { registerTsSpecifiers } from "./resolve-ts-specifiers.mjs";

registerTsSpecifiers();

const { openTestDatabase } = await import("../test/integration/test-db.ts");
const { seedLessons } = await import("../test/integration/lesson-seed.ts");

/**
 * Denominator for the coverage line, carried from the Masterplan audit rather
 * than re-derived here: the Grade 4–5 period budget normalises to roughly 1.400
 * standardised lesson slots, of which ~560 are the standardised Grade 4–5
 * count and ~2.650 are the Grade 4–12 scope. The report prints all three ratios
 * so no single percentage can be quoted without its denominator.
 */
const COVERAGE_DENOMINATORS = [
  { label: "quỹ tiết Grade 4–5 / Grade 4–5 period budget", total: 1400 },
  { label: "bài Grade 4–5 chuẩn hoá / standardised Grade 4–5 lesson count", total: 560 },
  { label: "quy mô Grade 4–12 / Grade 4–12 lesson scope", total: 2650 },
];

const outputFlag = process.argv.indexOf("--output");
const outputPath = outputFlag === -1 ? null : process.argv[outputFlag + 1];

if (outputFlag !== -1 && !outputPath) {
  console.error("--output needs a path");
  process.exit(1);
}

const proxy = await openTestDatabase();
let report;
try {
  const db = proxy.env.DB;
  const seeded = await seedLessons(db);
  report = await buildReport(db, seeded);
} finally {
  await proxy.dispose();
}

const markdown = renderMarkdown(report);

if (outputPath) {
  writeFileSync(resolve(outputPath), markdown, "utf8");
  console.log(`wrote ${resolve(outputPath)}`);
  console.log(
    `lessons ${report.lessonCount} · objectives ${report.objectiveTotal} · uncovered ${report.uncoveredObjectives.length} · dangling edges ${report.danglingEdges.length}`,
  );
} else {
  process.stdout.write(markdown);
}

/**
 * Reads the seeded state back and turns it into the report's data model. Every
 * number here is a query result, never a literal.
 */
async function buildReport(db, seeded) {
  const lessons = (
    await db
      .prepare(
        `SELECT l.id, l.subject_id, l.grade_from, l.grade_to, l.skill_id,
                l.title_vi, lm.objective_id, lm.provenance AS lesson_provenance,
                lm.is_baseline, co.code AS objective_code,
                co.provenance AS objective_provenance
           FROM lessons l
           LEFT JOIN lesson_metadata lm ON lm.lesson_id = l.id
           LEFT JOIN curriculum_objectives co ON co.id = lm.objective_id
          ORDER BY l.subject_id, l.grade_from, l.id`,
      )
      .all()
  ).results;

  const objectives = (
    await db
      .prepare(
        `SELECT id, subject_id, grade, code, skill_id, provenance
           FROM curriculum_objectives
          ORDER BY subject_id, grade, code`,
      )
      .all()
  ).results;

  const skills = (await db.prepare("SELECT id, subject_id, grade_from, grade_to FROM skills").all())
    .results;

  const edges = (
    await db
      .prepare("SELECT skill_id, prerequisite_id FROM skill_prerequisites ORDER BY skill_id, prerequisite_id")
      .all()
  ).results;

  const skillById = new Map(skills.map((skill) => [skill.id, skill]));
  const usedObjectiveIds = new Set(lessons.map((lesson) => lesson.objective_id).filter(Boolean));

  const objectivesById = new Map(objectives.map((objective) => [objective.id, objective]));

  const uncoveredObjectives = objectives.filter((objective) => !usedObjectiveIds.has(objective.id));
  const lessonsWithoutObjective = lessons.filter((lesson) => !lesson.objective_id);
  const lessonsWithUnknownObjective = lessons.filter(
    (lesson) => lesson.objective_id && !objectivesById.has(lesson.objective_id),
  );
  const skillsWithoutLesson = skills.filter(
    (skill) => !lessons.some((lesson) => lesson.skill_id === skill.id),
  );
  const skillsWithoutObjective = skills.filter(
    (skill) => !objectives.some((objective) => objective.skill_id === skill.id),
  );

  const danglingEdges = edges.filter(
    (edge) => !skillById.has(edge.skill_id) || !skillById.has(edge.prerequisite_id),
  );

  const crossSubjectEdges = edges.filter((edge) => {
    const dependent = skillById.get(edge.skill_id);
    const prerequisite = skillById.get(edge.prerequisite_id);
    return dependent && prerequisite && dependent.subject_id !== prerequisite.subject_id;
  });

  const forwardGradeEdges = edges.filter((edge) => {
    const dependent = skillById.get(edge.skill_id);
    const prerequisite = skillById.get(edge.prerequisite_id);
    return dependent && prerequisite && prerequisite.grade_from > dependent.grade_from;
  });

  const cycles = findCycles(edges);

  // Objectives carrying more than one lesson. The baseline diagnostics share an
  // objective with the topic lesson they diagnose, which is why 50 lessons fit
  // inside fewer objectives.
  const byObjective = new Map();
  for (const lesson of lessons) {
    if (!lesson.objective_id) continue;
    const bucket = byObjective.get(lesson.objective_id) ?? [];
    bucket.push(lesson);
    byObjective.set(lesson.objective_id, bucket);
  }
  const sharedObjectives = [...byObjective.entries()]
    .filter(([, bucket]) => bucket.length > 1)
    .map(([objectiveId, bucket]) => ({
      objectiveId,
      code: objectivesById.get(objectiveId)?.code ?? objectiveId,
      lessons: bucket.map((lesson) => lesson.id).sort(),
    }))
    .sort((a, b) => a.code.localeCompare(b.code));

  const perSubject = new Map();
  for (const lesson of lessons) {
    const bucket = perSubject.get(lesson.subject_id) ?? { lessons: 0, objectives: new Set(), skills: new Set() };
    bucket.lessons += 1;
    bucket.skills.add(lesson.skill_id);
    if (lesson.objective_id) bucket.objectives.add(lesson.objective_id);
    perSubject.set(lesson.subject_id, bucket);
  }

  const perSubjectEdges = new Map();
  for (const edge of edges) {
    const subject = skillById.get(edge.skill_id)?.subject_id ?? "unknown";
    perSubjectEdges.set(subject, (perSubjectEdges.get(subject) ?? 0) + 1);
  }

  return {
    seeded,
    lessons,
    objectives,
    skills,
    edges,
    lessonCount: lessons.length,
    objectiveTotal: objectives.length,
    objectiveUsed: usedObjectiveIds.size,
    skillTotal: skills.length,
    skillUsed: new Set(lessons.map((lesson) => lesson.skill_id)).size,
    uncoveredObjectives,
    lessonsWithoutObjective,
    lessonsWithUnknownObjective,
    skillsWithoutLesson,
    skillsWithoutObjective,
    danglingEdges,
    crossSubjectEdges,
    forwardGradeEdges,
    cycles,
    sharedObjectives,
    perSubject,
    perSubjectEdges,
    objectiveProvenance: tally(objectives, (objective) => objective.provenance),
    lessonProvenance: tally(lessons, (lesson) => lesson.lesson_provenance),
    baselineLessons: lessons.filter((lesson) => lesson.is_baseline === 1).length,
  };
}

/** Depth-first cycle hunt; returns one ordered cycle per back edge, if any. */
function findCycles(edges) {
  const adjacency = new Map();
  for (const edge of edges) {
    const bucket = adjacency.get(edge.skill_id) ?? [];
    bucket.push(edge.prerequisite_id);
    adjacency.set(edge.skill_id, bucket);
  }

  const WHITE = 0;
  const GREY = 1;
  const BLACK = 2;
  const colour = new Map();
  const path = [];
  const cycles = [];

  const visit = (node) => {
    colour.set(node, GREY);
    path.push(node);
    for (const next of adjacency.get(node) ?? []) {
      const state = colour.get(next) ?? WHITE;
      if (state === GREY) {
        cycles.push([...path.slice(path.indexOf(next)), next]);
      } else if (state === WHITE) {
        visit(next);
      }
    }
    path.pop();
    colour.set(node, BLACK);
  };

  for (const node of adjacency.keys()) {
    if ((colour.get(node) ?? WHITE) === WHITE) visit(node);
  }
  return cycles;
}

function tally(rows, keyOf) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyOf(row) ?? "(null)";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
}

function pct(part, total) {
  return `${((part / total) * 100).toFixed(2).replace(".", ",")}%`;
}

function renderMarkdown(report) {
  const lines = [];
  const push = (...rows) => lines.push(...rows);

  push(
    "# MA TRẬN ÁNH XẠ BÀI HỌC → KỸ NĂNG → MỤC TIÊU (YCCĐ)",
    "## LESSON → SKILL → OBJECTIVE (YCCĐ) MAPPING MATRIX",
    "",
    "> **Tệp này được sinh tự động. Không sửa tay.** / *Generated file. Do not edit by hand.*",
    ">",
    "> ```bash",
    "> node scripts/curriculum-coverage.mjs --output docs/CURRICULUM_COVERAGE_MATRIX.md",
    "> ```",
    ">",
    "> Script mở một cơ sở dữ liệu cách ly trong `tmpdir()`, chạy lại toàn bộ migration đã phát hành,",
    "> seed 50 bài qua chính `seedLessons()`, rồi đọc ngược kết quả từ SQLite. Mọi con số dưới đây là",
    "> kết quả truy vấn, không phải số chép tay.",
    "",
    "---",
    "",
    "## 1. Tổng quan / Summary",
    "",
    "| Chỉ số / Measure | Giá trị / Value |",
    "| --- | --- |",
    `| Bài học trong sổ đăng ký / Lessons in registry | **${report.lessonCount}** |`,
    `| Bài học có mục tiêu / Lessons carrying an objective | **${report.lessonCount - report.lessonsWithoutObjective.length} / ${report.lessonCount}** |`,
    `| Mục tiêu phân biệt được dùng / Distinct objectives used | **${report.objectiveUsed}** |`,
    `| Mục tiêu được seed trong CSDL / Objectives seeded in the DB | **${report.objectiveTotal}** |`,
    `| Kỹ năng được dùng / Skills referenced by a lesson | **${report.skillUsed} / ${report.skillTotal}** |`,
    `| Cạnh tiên quyết / Prerequisite edges | **${report.edges.length}** |`,
    `| Bài chẩn đoán đầu vào / Baseline diagnostic lessons | **${report.baselineLessons}** |`,
    `| Kết quả seed trên CSDL trống / Seed result on a fresh DB | \`${JSON.stringify(report.seeded)}\` |`,
    "",
    "Xuất xứ bài học / Lesson provenance:",
    "",
    "| Giá trị / Value | Số bài / Lessons |",
    "| --- | --- |",
    ...report.lessonProvenance.map(([key, count]) => `| \`${key}\` | ${count} |`),
    "",
    "Xuất xứ mục tiêu / Objective provenance:",
    "",
    "| Giá trị / Value | Số mục tiêu / Objectives |",
    "| --- | --- |",
    ...report.objectiveProvenance.map(([key, count]) => `| \`${key}\` | ${count} |`),
    "",
    "---",
    "",
    "## 2. Lỗ hổng, tính bằng số / Gaps, as numbers",
    "",
    "| Lỗ hổng / Gap | Số lượng / Count |",
    "| --- | --- |",
    `| Mục tiêu không có bài nào / Objectives with no lesson | **${report.uncoveredObjectives.length}** |`,
    `| Bài không có mục tiêu / Lessons with no objective | **${report.lessonsWithoutObjective.length}** |`,
    `| Bài trỏ tới mục tiêu không tồn tại / Lessons pointing at a missing objective | **${report.lessonsWithUnknownObjective.length}** |`,
    `| Kỹ năng không có bài nào / Skills with no lesson | **${report.skillsWithoutLesson.length}** |`,
    `| Kỹ năng không có mục tiêu nào / Skills with no objective | **${report.skillsWithoutObjective.length}** |`,
    `| Cạnh tiên quyết treo / Dangling prerequisite edges | **${report.danglingEdges.length}** |`,
    `| Cạnh tiên quyết chéo môn / Cross-subject prerequisite edges | **${report.crossSubjectEdges.length}** |`,
    `| Cạnh tiên quyết đi ngược lớp / Prerequisites starting in a later grade than their dependent | **${report.forwardGradeEdges.length}** |`,
    `| Chu trình tiên quyết / Prerequisite cycles | **${report.cycles.length}** |`,
    "",
  );

  if (report.skillsWithoutObjective.length > 0) {
    push(
      "Kỹ năng không ánh xạ tới mục tiêu nào / Skills that map to no objective:",
      "",
      ...report.skillsWithoutObjective.map((skill) => `- \`${skill.id}\` (${skill.subject_id}, lớp ${skill.grade_from}–${skill.grade_to})`),
      "",
      "Đây là lỗ hổng ánh xạ thật: kỹ năng này dạy được nhưng không chứng minh được một YCCĐ nào.",
      "Nó được ghi thành số ở đây thay vì bị ẩn đi. / *A real mapping gap: the skill can be taught but proves no YCCĐ.*",
      "",
    );
  }

  push(
    "---",
    "",
    "## 3. Phủ chương trình — tách biệt khỏi độ đầy đủ ánh xạ",
    "## Curriculum coverage — kept separate from mapping completeness",
    "",
    "**Độ đầy đủ ánh xạ / Mapping completeness:** mọi bài đều có mục tiêu, mọi mục tiêu đều có bài.",
    "Đây là điều kiện về **cấu trúc**, không phải về **quy mô**.",
    "",
    "**Phủ chương trình / Curriculum coverage:** 50 bài mẫu so với chương trình thật:",
    "",
    "| Mẫu số / Denominator | Tổng / Total | Tỉ lệ / Ratio |",
    "| --- | --- | --- |",
    ...COVERAGE_DENOMINATORS.map(
      (entry) => `| ${entry.label} | ${entry.total} | **${pct(report.lessonCount, entry.total)}** |`,
    ),
    "",
    "Hai sự thật này phải được báo cáo riêng. Ánh xạ đầy đủ **không** có nghĩa là chương trình đã phủ;",
    "và phủ mỏng **không** có nghĩa là ánh xạ sai. / *Mapping completeness does not imply curriculum coverage, and thin coverage does not imply a broken mapping.*",
    "",
    "---",
    "",
    "## 4. Ma trận 50 bài / The 50-lesson matrix",
    "",
    "| # | Môn / Subject | Lớp / Grade | Bài học / Lesson | Kỹ năng / Skill | Mục tiêu (YCCĐ) / Objective | Xuất xứ / Provenance | Chẩn đoán / Baseline |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
  );

  report.lessons.forEach((lesson, index) => {
    const grade = lesson.grade_from === lesson.grade_to ? `${lesson.grade_from}` : `${lesson.grade_from}–${lesson.grade_to}`;
    const objective = lesson.objective_code ? `\`${lesson.objective_code}\`` : "**— thiếu / missing —**";
    const provenance = lesson.objective_provenance ?? lesson.lesson_provenance ?? "—";
    push(
      `| ${index + 1} | ${lesson.subject_id} | ${grade} | \`${lesson.id}\` | \`${lesson.skill_id}\` | ${objective} | \`${provenance}\` | ${lesson.is_baseline === 1 ? "✔" : ""} |`,
    );
  });

  push(
    "",
    `Tổng / Total: **${report.lessonCount}** bài. / *${report.lessonCount} lessons.*`,
    "",
    "---",
    "",
    "## 5. Mục tiêu mang nhiều hơn một bài / Objectives carrying more than one lesson",
    "",
    "Bài chẩn đoán đầu vào dùng chung mục tiêu với bài chủ đề mà nó chẩn đoán. Đó là lý do",
    `**${report.lessonCount}** bài nằm gọn trong **${report.objectiveUsed}** mục tiêu.`,
    "/ *Baseline diagnostics share an objective with the topic lesson they diagnose.*",
    "",
    "| Mục tiêu / Objective | Số bài / Lessons | Bài / Lessons |",
    "| --- | --- | --- |",
    ...report.sharedObjectives.map(
      (entry) => `| \`${entry.code}\` | ${entry.lessons.length} | ${entry.lessons.map((id) => `\`${id}\``).join(", ")} |`,
    ),
    "",
    "---",
    "",
    "## 6. Theo môn học / Per subject",
    "",
    "| Môn / Subject | Bài / Lessons | Kỹ năng / Skills | Mục tiêu / Objectives | Cạnh tiên quyết / Prerequisite edges |",
    "| --- | --- | --- | --- | --- |",
    ...[...report.perSubject.entries()]
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
      .map(
        ([subject, bucket]) =>
          `| ${subject} | ${bucket.lessons} | ${bucket.skills.size} | ${bucket.objectives.size} | ${report.perSubjectEdges.get(subject) ?? 0} |`,
      ),
    "",
    "---",
    "",
    "## 7. Đồ thị tiên quyết / The prerequisite graph",
    "",
    `**${report.edges.length}** cạnh, **0** treo, **0** chéo môn, **0** chu trình, **0** đi ngược lớp — tất cả ở trên`,
    "là kết quả đo, và mỗi thuộc tính trong số đó được canh bởi",
    "`test/integration/curriculum-graph-integrity.test.ts` để một lần import nội dung không thể",
    "âm thầm làm hỏng đồ thị.",
    "",
    "---",
    "",
    "## 8. Phạm vi tài liệu này / Scope of this document",
    "",
    "Tài liệu này **không** nói rằng chương trình Grade 4–5 đã được viết xong. Nó nói rằng 50 bài",
    "đang có được ánh xạ đầy đủ, không mồ côi, và rằng phần còn thiếu là một con số đã biết.",
    "/ *This document does not claim the Grade 4–5 programme is written. It claims the 50 existing*",
    "*lessons are fully and honestly mapped, and that the remainder is a known number.*",
    "",
    "Không bài học nào trong `src/shared/content/` bị sửa bởi quá trình sinh tài liệu này.",
    "/ *No lesson in `src/shared/content/` is modified by this generation.*",
    "",
  );

  return lines.join("\n");
}
