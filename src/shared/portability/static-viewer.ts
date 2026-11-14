/**
 * Self-contained single-file offline archival viewer (`viewer.html`) for the
 * 10-Year Open Portability Bundle.
 *
 * Security, Offline & Accessibility Guarantees:
 *   - Strict CSP meta tag (`default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'`).
 *   - Zero external `<link>`, `<script src>`, `@import`, or `http(s)://` fetches.
 *   - Safe JSON-in-HTML-script serialization (`escapeJsonForHtmlScript`) neutralizing
 *     `</script>`, `<!--`, `-->`, U+2028, and U+2029 breakouts, paired with strict HTML
 *     entity escaping and DOM `createElement` + `textContent` updates (never `innerHTML`).
 *   - WCAG 2.2 AA / AAA high-contrast palette (`#14213d` on `#fcfbf7`, > 15:1 contrast),
 *     semantic `lang="vi"`, `<main>`, `<h1>`–`<h3>` hierarchy, `:focus-visible` outlines,
 *     and >= 48x48 CSS px touch targets on all `<button>` and `<a>` elements.
 *   - Never reads `lessonSteps.answerKey` or `lessonSteps.content` (Gate G4).
 */

import type { CompetencyState } from "../schemas/attempt";
import { COMPETENCY_STATES } from "../schemas/attempt";
import type { ExportEnvelope } from "../schemas/transfer";
import {
  type OpenPortabilityBundle,
  serializePortabilityBundleFiles,
} from "./open-portability";

export const VIEWER_CSP_CONTENT =
  "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'" as const;

const STATE_LABELS: Record<CompetencyState, { vi: string; en: string }> = {
  NOT_OBSERVED: { vi: "Chưa quan sát", en: "Not Observed" },
  SUPPORTED: { vi: "Cần hỗ trợ", en: "Supported" },
  INDEPENDENT: { vi: "Độc lập", en: "Independent" },
  RETAINED: { vi: "Duy trì bền vững", en: "Retained" },
  TRANSFERRED: { vi: "Vận dụng chuyển giao", en: "Transferred" },
};

const FEELING_LABELS: Record<string, string> = {
  confident: "Tự tin (Confident)",
  good: "Tốt (Good)",
  neutral: "Bình thường (Neutral)",
  confused: "Còn bối rối (Confused)",
  tired: "Mệt (Tired)",
};

/**
 * Escape arbitrary text for safe insertion into HTML element content or
 * double-quoted attributes.
 */
export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escape a serialized JSON string before embedding inside `<script type="application/json">`
 * so `</script>`, `<!--`, `-->`, U+2028, and U+2029 can never break out of the script
 * element or corrupt JS parsing.
 */
export function escapeJsonForHtmlScript(json: string): string {
  return json
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Encode file content into a `data:` URI payload safe under `default-src 'none'`
 * without requiring `blob:` URLs or network access.
 */
export function encodeDataUriPayload(content: string): string {
  return encodeURIComponent(content).replace(/'/g, "%27");
}

function formatDisplayIso(epochMs: number | null | undefined): string {
  if (typeof epochMs !== "number" || !Number.isFinite(epochMs)) {
    return "—";
  }
  return new Date(epochMs).toISOString();
}

type ViewerSkillCard = {
  skillId: string;
  skillCode: string;
  nameVi: string;
  nameEn: string;
  subjectId: string;
  subjectNameVi: string;
  subjectNameEn: string;
  gradeRange: string;
  state: CompetencyState;
  stateLabelVi: string;
  stateLabelEn: string;
  independentCount: number;
  assistedCount: number;
  correctCount: number;
  stabilityDays: number | null;
  retrievabilityPct: number | null;
  objectives: { code: string; titleVi: string }[];
  correctionNote: string | null;
  updatedAtIso: string;
};

type ViewerSessionEntry = {
  sessionId: string;
  lessonTitleVi: string;
  lessonTitleEn: string;
  status: string;
  purpose: "official" | "practice";
  startedAtIso: string;
  endedAtIso: string;
  stepsSeen: number;
  reflectionFeeling: string | null;
  reflectionNoteVi: string | null;
};

type ViewerXapiEntry = {
  id: string;
  timestamp: string;
  verbKey: "answered" | "completed";
  verbVi: string;
  verbEn: string;
  activityId: string;
  activityNameVi: string;
  purpose: "official" | "practice";
  success: boolean;
  completion: boolean;
  outcome: string | null;
  helpLevel: number | null;
  evidenceKind: string | null;
  attemptNo: number | null;
  sessionId: string;
};

type ViewerEmbeddedData = {
  learnerNickname: string;
  exportedAtIso: string;
  bundleSha256: string;
  subjects: { id: string; nameVi: string; nameEn: string }[];
  competencyStates: readonly CompetencyState[];
  skills: ViewerSkillCard[];
};

function buildSkillCards(envelope: ExportEnvelope): ViewerSkillCard[] {
  const primaryLearner = envelope.data.learners[0];
  const subjectsById = new Map(envelope.data.subjects.map((s) => [s.id, s]));
  const evidenceBySkillId = new Map(
    envelope.data.skillEvidence
      .filter((ev) => (primaryLearner ? ev.learnerId === primaryLearner.id : true))
      .map((ev) => [ev.skillId, ev]),
  );
  const estimateBySkillId = new Map(
    (envelope.data.skillEstimates ?? [])
      .filter((est) => (primaryLearner ? est.learnerId === primaryLearner.id : true))
      .map((est) => [est.skillId, est]),
  );

  const objectivesBySkillId = new Map<string, { code: string; titleVi: string }[]>();
  for (const obj of envelope.data.curriculumObjectives ?? []) {
    if (!obj.skillId) continue;
    const list = objectivesBySkillId.get(obj.skillId) ?? [];
    list.push({ code: obj.code, titleVi: obj.titleVi });
    objectivesBySkillId.set(obj.skillId, list);
  }
  for (const list of objectivesBySkillId.values()) {
    list.sort((a, b) => a.code.localeCompare(b.code));
  }

  const allSkillIds = new Set<string>([
    ...envelope.data.skills.map((s) => s.id),
    ...evidenceBySkillId.keys(),
  ]);
  const skillsById = new Map(envelope.data.skills.map((s) => [s.id, s]));

  const cards: ViewerSkillCard[] = [];
  for (const skillId of allSkillIds) {
    const skill = skillsById.get(skillId);
    const ev = evidenceBySkillId.get(skillId);
    const est = estimateBySkillId.get(skillId);
    const subject = skill ? subjectsById.get(skill.subjectId) : undefined;
    const state: CompetencyState = ev?.state ?? "NOT_OBSERVED";
    const labels = STATE_LABELS[state];

    const gradeRange = skill
      ? skill.gradeFrom === skill.gradeTo
        ? `Lớp ${String(skill.gradeFrom)}`
        : `Lớp ${String(skill.gradeFrom)}–${String(skill.gradeTo)}`
      : "—";

    cards.push({
      skillId,
      skillCode: skill?.code ?? skillId,
      nameVi: skill?.nameVi ?? skillId,
      nameEn: skill?.nameEn ?? skillId,
      subjectId: skill?.subjectId ?? "other",
      subjectNameVi: subject?.nameVi ?? (skill?.subjectId ?? "Khác"),
      subjectNameEn: subject?.nameEn ?? (skill?.subjectId ?? "Other"),
      gradeRange,
      state,
      stateLabelVi: labels.vi,
      stateLabelEn: labels.en,
      independentCount: ev?.independentCount ?? 0,
      assistedCount: ev?.assistedCount ?? 0,
      correctCount: ev?.correctCount ?? 0,
      stabilityDays: est ? Math.round(est.stability * 10) / 10 : null,
      retrievabilityPct: est ? Math.round(est.retrievabilityAt * 1000) / 10 : null,
      objectives: objectivesBySkillId.get(skillId) ?? [],
      correctionNote: ev?.correctionNote ?? null,
      updatedAtIso: ev ? formatDisplayIso(ev.updatedAt) : "—",
    });
  }

  cards.sort(
    (a, b) =>
      a.subjectId.localeCompare(b.subjectId) ||
      a.skillCode.localeCompare(b.skillCode) ||
      a.skillId.localeCompare(b.skillId),
  );
  return cards;
}

function buildSessionEntries(envelope: ExportEnvelope): ViewerSessionEntry[] {
  const lessonsById = new Map(envelope.data.lessons.map((l) => [l.id, l]));
  const reflectionsBySessionId = new Map(
    (envelope.data.sessionReflections ?? []).map((r) => [r.sessionId, r]),
  );

  return [...envelope.data.learningSessions]
    .sort((a, b) => a.startedAt - b.startedAt || a.id.localeCompare(b.id))
    .map((sess) => {
      const lesson = lessonsById.get(sess.lessonId);
      const refl = reflectionsBySessionId.get(sess.id);
      const purpose: "official" | "practice" =
        sess.purpose === "practice" ||
        lesson?.ownershipType === "family" ||
        lesson?.purpose === "practice"
          ? "practice"
          : "official";
      return {
        sessionId: sess.id,
        lessonTitleVi: lesson?.titleVi ?? sess.lessonId,
        lessonTitleEn: lesson?.titleEn ?? "",
        status: sess.status,
        purpose,
        startedAtIso: formatDisplayIso(sess.startedAt),
        endedAtIso: sess.endedAt !== null ? formatDisplayIso(sess.endedAt) : "—",
        stepsSeen: sess.stepsSeen,
        reflectionFeeling: refl ? (FEELING_LABELS[refl.feeling] ?? refl.feeling) : null,
        reflectionNoteVi: refl?.noteVi ?? null,
      };
    });
}

function buildXapiEntries(bundle: OpenPortabilityBundle): ViewerXapiEntry[] {
  return bundle.xapi20Statements.map((stmt) => {
    const isCompleted = stmt.verb.id.endsWith("/completed");
    const ext = stmt.context.extensions;
    return {
      id: stmt.id,
      timestamp: stmt.timestamp,
      verbKey: isCompleted ? "completed" : "answered",
      verbVi: stmt.verb.display.vi,
      verbEn: stmt.verb.display.en,
      activityId: stmt.object.id,
      activityNameVi: stmt.object.definition?.name?.vi ?? stmt.object.id,
      purpose: ext["urn:tai-learning-os:xapi:ext:purpose"],
      success: stmt.result.success,
      completion: stmt.result.completion,
      outcome: ext["urn:tai-learning-os:xapi:ext:outcome"] ?? null,
      helpLevel: ext["urn:tai-learning-os:xapi:ext:help-level"] ?? null,
      evidenceKind: ext["urn:tai-learning-os:xapi:ext:evidence-kind"] ?? null,
      attemptNo: ext["urn:tai-learning-os:xapi:ext:attempt-no"] ?? null,
      sessionId: ext["urn:tai-learning-os:xapi:ext:session-id"],
    };
  });
}

function renderSkillCardHtml(card: ViewerSkillCard): string {
  const stabilityLabel =
    card.stabilityDays !== null
      ? `${String(card.stabilityDays)} ngày (${String(card.retrievabilityPct ?? 0)}% khả năng nhớ)`
      : "Chưa ước lượng";

  const objectivesHtml =
    card.objectives.length > 0
      ? `<ul class="obj-list">${card.objectives
          .map(
            (obj) =>
              `<li><span class="mono-code">${escapeHtml(obj.code)}</span> — ${escapeHtml(obj.titleVi)}</li>`,
          )
          .join("")}</ul>`
      : `<p class="muted-line">Chưa gắn mục tiêu GDPT 2018 cụ thể.</p>`;

  const noteHtml =
    card.correctionNote !== null && card.correctionNote.trim().length > 0
      ? `<p class="correction-note"><strong>Ghi chú điều chỉnh của phụ huynh (Parent Correction):</strong> ${escapeHtml(card.correctionNote)}</p>`
      : "";

  return `<article class="skill-card" data-subject-id="${escapeHtml(card.subjectId)}" data-state="${escapeHtml(card.state)}">
  <div class="skill-card-header">
    <div>
      <span class="subject-tag">${escapeHtml(card.subjectNameVi)} / ${escapeHtml(card.subjectNameEn)} · ${escapeHtml(card.gradeRange)}</span>
      <h3><span class="mono-code">${escapeHtml(card.skillCode)}</span> — ${escapeHtml(card.nameVi)}</h3>
      <p class="subtitle-en">${escapeHtml(card.nameEn)}</p>
    </div>
    <span class="state-badge state-${escapeHtml(card.state)}">${escapeHtml(card.stateLabelVi)} · ${escapeHtml(card.stateLabelEn)} (${escapeHtml(card.state)})</span>
  </div>
  <dl class="metrics-row">
    <div><dt>Độc lập (Independent)</dt><dd>${String(card.independentCount)}</dd></div>
    <div><dt>Có hỗ trợ (Assisted)</dt><dd>${String(card.assistedCount)}</dd></div>
    <div><dt>Tổng lượt đúng (Correct)</dt><dd>${String(card.correctCount)}</dd></div>
    <div><dt>Độ bền trí nhớ FSRS (Stability)</dt><dd>${escapeHtml(stabilityLabel)}</dd></div>
  </dl>
  <div class="objectives-box">
    <strong>Mục tiêu GDPT 2018 liên kết (Aligned Objectives):</strong>
    ${objectivesHtml}
  </div>
  ${noteHtml}
</article>`;
}

/**
 * Render a 100% standalone, offline-ready, WCAG 2.2 AA archival `viewer.html`.
 */
export function renderStandalonePortabilityViewerHtml(
  bundle: OpenPortabilityBundle,
  envelope: ExportEnvelope,
): string {
  const primaryLearner = envelope.data.learners[0];
  const learnerNickname = primaryLearner?.nickname ?? "Người học";
  const learnerId = primaryLearner?.id ?? "unknown-learner";
  const learnerGrade =
    primaryLearner?.grade !== null && primaryLearner?.grade !== undefined
      ? `Lớp ${String(primaryLearner.grade)}`
      : "Chưa khai báo lớp";

  const schoolYears = [...envelope.data.schoolYears].sort((a, b) =>
    a.startsOn.localeCompare(b.startsOn),
  );
  const subjects = [...envelope.data.subjects].sort(
    (a, b) => a.sort - b.sort || a.id.localeCompare(b.id),
  );
  const goals = [...envelope.data.learningGoals].sort((a, b) => a.createdAt - b.createdAt);

  const skillCards = buildSkillCards(envelope);
  const sessionEntries = buildSessionEntries(envelope);
  const xapiEntries = buildXapiEntries(bundle);

  const independentOrHigherCount = skillCards.filter(
    (c) => c.state === "INDEPENDENT" || c.state === "RETAINED" || c.state === "TRANSFERRED",
  ).length;

  const serializedFiles = serializePortabilityBundleFiles(bundle);
  const clrHref = `data:application/json;charset=utf-8,${encodeDataUriPayload(serializedFiles.clr20Json)}`;
  const caseHref = `data:application/json;charset=utf-8,${encodeDataUriPayload(serializedFiles.case11Json)}`;
  const xapiHref = `data:application/json;charset=utf-8,${encodeDataUriPayload(serializedFiles.xapi20Jsonl)}`;
  const manifestHref = `data:application/json;charset=utf-8,${encodeDataUriPayload(serializedFiles.manifestJson)}`;

  const embeddedData: ViewerEmbeddedData = {
    learnerNickname,
    exportedAtIso: bundle.manifest.exportedAtIso,
    bundleSha256: bundle.manifest.checksums.bundleSha256,
    subjects: subjects.map((s) => ({ id: s.id, nameVi: s.nameVi, nameEn: s.nameEn })),
    competencyStates: COMPETENCY_STATES,
    skills: skillCards,
  };
  const safeEmbeddedJson = escapeJsonForHtmlScript(JSON.stringify(embeddedData));

  const schoolYearsHtml =
    schoolYears.length > 0
      ? `<ul class="pill-list">${schoolYears
          .map(
            (sy) =>
              `<li><strong>${escapeHtml(sy.label)}</strong> (${escapeHtml(sy.startsOn)} → ${escapeHtml(sy.endsOn)}${sy.grade !== null ? `, Lớp ${String(sy.grade)}` : ""})</li>`,
          )
          .join("")}</ul>`
      : `<p class="muted-line">Chưa ghi nhận năm học cụ thể.</p>`;

  const goalsHtml =
    goals.length > 0
      ? `<ul class="goal-list">${goals
          .map(
            (g) =>
              `<li><strong>${escapeHtml(g.titleVi)}</strong> <span class="mono-code">[${escapeHtml(g.status)}]</span>${g.targetDate ? ` · Mục tiêu: ${escapeHtml(g.targetDate)}` : ""}${g.note ? ` — ${escapeHtml(g.note)}` : ""}</li>`,
          )
          .join("")}</ul>`
      : `<p class="muted-line">Chưa có mục tiêu học tập được lưu.</p>`;

  const subjectButtonsHtml = [
    `<button type="button" class="filter-btn is-active" data-filter-group="subject" data-filter-value="ALL" aria-pressed="true">Tất cả môn (All Subjects)</button>`,
    ...subjects.map(
      (s) =>
        `<button type="button" class="filter-btn" data-filter-group="subject" data-filter-value="${escapeHtml(s.id)}" aria-pressed="false">${escapeHtml(s.nameVi)} (${escapeHtml(s.nameEn)})</button>`,
    ),
  ].join("\n          ");

  const stateButtonsHtml = [
    `<button type="button" class="filter-btn is-active" data-filter-group="state" data-filter-value="ALL" aria-pressed="true">Tất cả mức năng lực (All States)</button>`,
    ...COMPETENCY_STATES.map((st) => {
      const lbl = STATE_LABELS[st];
      return `<button type="button" class="filter-btn" data-filter-group="state" data-filter-value="${escapeHtml(st)}" aria-pressed="false">${escapeHtml(lbl.vi)} (${escapeHtml(st)})</button>`;
    }),
  ].join("\n          ");

  const skillCardsHtml =
    skillCards.length > 0
      ? skillCards.map(renderSkillCardHtml).join("\n        ")
      : `<p class="empty-box">Hồ sơ hiện chưa có kỹ năng nào được ghi nhận.</p>`;

  const sessionsRowsHtml =
    sessionEntries.length > 0
      ? sessionEntries
          .map(
            (sess) => `<tr>
              <td><span class="mono-code">${escapeHtml(sess.sessionId)}</span></td>
              <td><strong>${escapeHtml(sess.lessonTitleVi)}</strong>${sess.lessonTitleEn ? `<br><span class="subtitle-en">${escapeHtml(sess.lessonTitleEn)}</span>` : ""}</td>
              <td><span class="mono-code">${escapeHtml(sess.purpose)}</span> · ${escapeHtml(sess.status)}</td>
              <td>${escapeHtml(sess.startedAtIso)}<br>→ ${escapeHtml(sess.endedAtIso)}</td>
              <td>${String(sess.stepsSeen)}</td>
              <td>${
                sess.reflectionFeeling || sess.reflectionNoteVi
                  ? `${sess.reflectionFeeling ? `<strong>${escapeHtml(sess.reflectionFeeling)}</strong>` : ""}${sess.reflectionNoteVi ? `<div>${escapeHtml(sess.reflectionNoteVi)}</div>` : ""}`
                  : "—"
              }</td>
            </tr>`,
          )
          .join("\n            ")
      : `<tr><td colspan="6">Chưa có phiên học nào được ghi nhận.</td></tr>`;

  const xapiRowsHtml =
    xapiEntries.length > 0
      ? xapiEntries
          .map(
            (ev) => `<tr>
              <td><span class="mono-code">${escapeHtml(ev.timestamp)}</span></td>
              <td><strong>${escapeHtml(ev.verbVi)}</strong> (${escapeHtml(ev.verbEn)})</td>
              <td>${escapeHtml(ev.activityNameVi)}<br><span class="mono-code">${escapeHtml(ev.activityId)}</span></td>
              <td><span class="mono-code">${escapeHtml(ev.purpose)}</span></td>
              <td>${ev.outcome !== null ? escapeHtml(ev.outcome) : ev.success ? "completed" : "—"}</td>
              <td>${
                ev.evidenceKind !== null
                  ? `${escapeHtml(ev.evidenceKind)} · gợi ý=${String(ev.helpLevel ?? 0)} · lần=${String(ev.attemptNo ?? 1)}`
                  : "Phiên hoàn thành"
              }</td>
            </tr>`,
          )
          .join("\n            ")
      : `<tr><td colspan="6">Chưa có sự kiện xAPI 2.0 nào.</td></tr>`;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="${VIEWER_CSP_CONTENT}">
  <title>Hồ sơ Di sản Học tập 10 Năm — ${escapeHtml(learnerNickname)} | TAI Learning OS</title>
  <style>
    :root {
      --paper-bg: #fcfbf7;
      --surface-bg: #ffffff;
      --surface-muted: #f3f1e8;
      --ink-primary: #14213d;
      --ink-secondary: #22304a;
      --border-strong: #14213d;
      --border-subtle: #8b95a7;
      --badge-independent-bg: #e6f4ea;
      --badge-independent-ink: #0b3d20;
      --badge-supported-bg: #fef3e2;
      --badge-supported-ink: #4a2500;
      --badge-neutral-bg: #eaeef7;
      --badge-neutral-ink: #14213d;
      --badge-transfer-bg: #f1eafb;
      --badge-transfer-ink: #2d124d;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      background-color: var(--paper-bg);
      color: var(--ink-primary);
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 16px;
      line-height: 1.6;
    }

    .page-shell {
      max-width: 1120px;
      margin: 0 auto;
      padding: 24px 16px 64px;
    }

    header.archive-banner {
      border: 2px solid var(--border-strong);
      background-color: var(--surface-bg);
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 28px;
    }

    .eyebrow {
      font-size: 0.875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--ink-secondary);
      margin: 0 0 8px;
    }

    h1 {
      font-size: 1.85rem;
      line-height: 1.25;
      margin: 0 0 8px;
      color: var(--ink-primary);
    }

    h2 {
      font-size: 1.4rem;
      line-height: 1.3;
      margin: 0 0 12px;
      color: var(--ink-primary);
      border-bottom: 2px solid var(--border-strong);
      padding-bottom: 8px;
    }

    h3 {
      font-size: 1.125rem;
      line-height: 1.35;
      margin: 4px 0;
      color: var(--ink-primary);
    }

    section.archive-section {
      background-color: var(--surface-bg);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 28px;
    }

    button,
    a {
      min-height: 48px;
      min-width: 48px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 16px;
      border-radius: 8px;
      font-family: inherit;
      font-size: 0.95rem;
      font-weight: 600;
      line-height: 1.25;
      text-decoration: none;
      cursor: pointer;
      border: 2px solid var(--border-strong);
      background-color: var(--surface-bg);
      color: var(--ink-primary);
      gap: 8px;
    }

    button:hover,
    a:hover {
      background-color: var(--surface-muted);
    }

    button.is-active,
    a.download-btn {
      background-color: var(--ink-primary);
      color: var(--paper-bg);
    }

    button.is-active:hover,
    a.download-btn:hover {
      background-color: #1f325c;
    }

    button:focus-visible,
    a:focus-visible,
    [tabindex]:focus-visible {
      outline: 3px solid var(--ink-primary);
      outline-offset: 3px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 16px;
      margin: 16px 0 20px;
    }

    .stat-card {
      background-color: var(--paper-bg);
      border: 1px solid var(--border-strong);
      border-radius: 10px;
      padding: 16px;
    }

    .stat-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--ink-secondary);
      display: block;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--ink-primary);
      margin-top: 4px;
      display: block;
      word-break: break-word;
    }

    .filter-toolbar {
      display: flex;
      flex-direction: column;
      gap: 14px;
      background-color: var(--paper-bg);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 18px;
    }

    .filter-group {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }

    .filter-group-label {
      font-weight: 700;
      min-width: 180px;
    }

    .filter-status {
      font-weight: 600;
      margin: 0 0 16px;
      color: var(--ink-secondary);
    }

    .skills-stack {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .skill-card {
      border: 1px solid var(--border-strong);
      border-radius: 10px;
      padding: 18px;
      background-color: var(--paper-bg);
    }

    .skill-card[hidden] {
      display: none !important;
    }

    .skill-card-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }

    .subject-tag {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--ink-secondary);
      display: block;
    }

    .subtitle-en {
      margin: 2px 0 0;
      font-size: 0.9rem;
      color: var(--ink-secondary);
    }

    .state-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 700;
      border: 1px solid var(--border-strong);
      background-color: var(--badge-neutral-bg);
      color: var(--badge-neutral-ink);
    }

    .state-SUPPORTED {
      background-color: var(--badge-supported-bg);
      color: var(--badge-supported-ink);
    }

    .state-INDEPENDENT,
    .state-RETAINED {
      background-color: var(--badge-independent-bg);
      color: var(--badge-independent-ink);
    }

    .state-TRANSFERRED {
      background-color: var(--badge-transfer-bg);
      color: var(--badge-transfer-ink);
    }

    .metrics-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 12px;
      margin: 12px 0;
      padding: 12px;
      background-color: var(--surface-bg);
      border-radius: 8px;
      border: 1px solid var(--border-subtle);
    }

    .metrics-row dt {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--ink-secondary);
    }

    .metrics-row dd {
      margin: 4px 0 0;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--ink-primary);
    }

    .objectives-box {
      margin-top: 10px;
      font-size: 0.95rem;
    }

    .obj-list,
    .pill-list,
    .goal-list {
      margin: 6px 0 0;
      padding-left: 20px;
    }

    .correction-note {
      margin: 12px 0 0;
      padding: 10px 12px;
      border-left: 4px solid var(--border-strong);
      background-color: var(--surface-bg);
    }

    .table-wrap {
      overflow-x: auto;
      margin-top: 12px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.92rem;
    }

    th,
    td {
      border: 1px solid var(--border-subtle);
      padding: 10px 12px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background-color: var(--surface-muted);
      color: var(--ink-primary);
      font-weight: 700;
    }

    .download-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .download-card {
      border: 1px solid var(--border-strong);
      border-radius: 10px;
      padding: 16px;
      background-color: var(--paper-bg);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 12px;
    }

    .mono-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.88em;
      word-break: break-all;
    }

    .muted-line {
      color: var(--ink-secondary);
      margin: 6px 0 0;
    }

    footer.archive-footer {
      font-size: 0.9rem;
      color: var(--ink-secondary);
      border-top: 1px solid var(--border-subtle);
      padding-top: 16px;
    }
  </style>
</head>
<body>
  <div class="page-shell">
    <header class="archive-banner">
      <p class="eyebrow">TAI Learning OS · Open Portability Archive (1EdTech CLR 2.0 + CASE 1.1 + IEEE xAPI 2.0)</p>
      <h1>Hồ sơ Di sản Học tập 10 Năm — ${escapeHtml(learnerNickname)}</h1>
      <p>Bản lưu trữ độc lập ngoại tuyến 100% (Offline Archival Reader). Dữ liệu ẩn danh theo hộ gia đình, không chứa họ tên pháp lý, ngày sinh, trường học, địa chỉ hoặc đáp án bài tập.</p>
    </header>

    <main id="main-content">
      <section class="archive-section" aria-labelledby="sec-overview">
        <h2 id="sec-overview">1. Tổng quan Hồ sơ Di sản 10 Năm (Longitudinal Record Overview)</h2>
        <div class="summary-grid">
          <div class="stat-card">
            <span class="stat-label">Biệt danh người học (Learner Nickname)</span>
            <span class="stat-value">${escapeHtml(learnerNickname)}</span>
            <span class="muted-line mono-code">urn:uuid:${escapeHtml(learnerId)} · ${escapeHtml(learnerGrade)}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Tổng số phiên học (Total Sessions)</span>
            <span class="stat-value">${String(bundle.manifest.counts.sessions)}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Tổng lượt trả lời (Total Attempts)</span>
            <span class="stat-value">${String(bundle.manifest.counts.attempts)}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Kỹ năng Độc lập trở lên (Independent+ Skills)</span>
            <span class="stat-value">${String(independentOrHigherCount)} / ${String(skillCards.length)}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Thời điểm xuất (Exported At ISO)</span>
            <span class="stat-value mono-code">${escapeHtml(bundle.manifest.exportedAtIso)}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Mã kiểm chứng SHA-256 (Bundle Digest)</span>
            <span class="stat-value mono-code">${escapeHtml(bundle.manifest.checksums.bundleSha256.slice(0, 16))}…</span>
          </div>
        </div>

        <h3>Năm học đã ghi nhận (Recorded School Years)</h3>
        ${schoolYearsHtml}

        <h3>Mục tiêu học tập của gia đình (Family Learning Goals)</h3>
        ${goalsHtml}
      </section>

      <section class="archive-section" aria-labelledby="sec-competency">
        <h2 id="sec-competency">2. Bản đồ Năng lực &amp; Mục tiêu GDPT 2018 (Competency Map &amp; GDPT 2018 Alignment)</h2>
        <div class="filter-toolbar" role="region" aria-label="Bộ lọc kỹ năng và trạng thái năng lực">
          <div class="filter-group">
            <span class="filter-group-label">Lọc theo môn học (Subject):</span>
            ${subjectButtonsHtml}
          </div>
          <div class="filter-group">
            <span class="filter-group-label">Lọc theo năng lực (State):</span>
            ${stateButtonsHtml}
          </div>
        </div>
        <p id="competency-filter-status" class="filter-status" aria-live="polite">Đang hiển thị ${String(skillCards.length)} / ${String(skillCards.length)} kỹ năng.</p>
        <div id="competency-list" class="skills-stack">
          ${skillCardsHtml}
        </div>
      </section>

      <section class="archive-section" aria-labelledby="sec-history">
        <h2 id="sec-history">3. Lịch sử Phiên học &amp; Nhật ký Sự kiện xAPI 2.0 (Sessions &amp; xAPI 2.0 Event Ledger)</h2>
        <h3>Nhật ký phiên học (Chronological Learning Sessions)</h3>
        <div class="table-wrap" tabindex="0" role="region" aria-label="Bảng nhật ký phiên học">
          <table>
            <thead>
              <tr>
                <th scope="col">Mã phiên (Session)</th>
                <th scope="col">Bài học (Lesson)</th>
                <th scope="col">Mục đích &amp; Trạng thái</th>
                <th scope="col">Thời gian (Started → Ended)</th>
                <th scope="col">Số bước</th>
                <th scope="col">Cảm nhận sau buổi học (Reflection)</th>
              </tr>
            </thead>
            <tbody>
              ${sessionsRowsHtml}
            </tbody>
          </table>
        </div>

        <h3>Nhật ký sự kiện chuẩn IEEE xAPI 2.0 (${String(bundle.manifest.counts.xapiStatements)} statements)</h3>
        <div class="table-wrap" tabindex="0" role="region" aria-label="Bảng nhật ký sự kiện IEEE xAPI 2.0">
          <table>
            <thead>
              <tr>
                <th scope="col">Thời điểm ISO-8601</th>
                <th scope="col">Động từ (ADL Verb)</th>
                <th scope="col">Hoạt động (Activity)</th>
                <th scope="col">Mục đích</th>
                <th scope="col">Kết quả</th>
                <th scope="col">Bằng chứng &amp; Gợi ý</th>
              </tr>
            </thead>
            <tbody>
              ${xapiRowsHtml}
            </tbody>
          </table>
        </div>
      </section>

      <section class="archive-section" aria-labelledby="sec-downloads">
        <h2 id="sec-downloads">4. Tải xuống Dữ liệu Chuẩn Mở (Open Standard Downloads)</h2>
        <p>Mỗi tệp dưới đây được nhúng trực tiếp trong trang lưu trữ này để có thể tải về ngoại tuyến không cần máy chủ hay kết nối mạng.</p>
        <div class="download-grid">
          <div class="download-card">
            <div>
              <h3>1EdTech CLR 2.0</h3>
              <p class="muted-line">Hồ sơ năng lực học tập toàn diện định dạng JSON-LD Verifiable Credential v2.</p>
              <p class="mono-code">SHA-256: ${escapeHtml(bundle.manifest.files["clr-2.0.json"].sha256)}</p>
            </div>
            <a class="download-btn" download="clr-2.0.json" href="${clrHref}">Tải xuống clr-2.0.json</a>
          </div>
          <div class="download-card">
            <div>
              <h3>1EdTech CASE 1.1</h3>
              <p class="muted-line">Đồ thị khung chương trình GDPT 2018, kỹ năng và quan hệ tiên quyết CFPackage.</p>
              <p class="mono-code">SHA-256: ${escapeHtml(bundle.manifest.files["case-1.1.json"].sha256)}</p>
            </div>
            <a class="download-btn" download="case-1.1.json" href="${caseHref}">Tải xuống case-1.1.json</a>
          </div>
          <div class="download-card">
            <div>
              <h3>IEEE xAPI 2.0 JSONL</h3>
              <p class="muted-line">Nhật ký sự kiện học tập theo trình tự thời gian chuẩn IEEE 9274.1.1-2023.</p>
              <p class="mono-code">SHA-256: ${escapeHtml(bundle.manifest.files["xapi-2.0.jsonl"].sha256)}</p>
            </div>
            <a class="download-btn" download="xapi-2.0.jsonl" href="${xapiHref}">Tải xuống xapi-2.0.jsonl</a>
          </div>
          <div class="download-card">
            <div>
              <h3>Bundle Manifest</h3>
              <p class="muted-line">Bảng kê phiên bản chuẩn mở, số lượng bản ghi và mã băm SHA-256 đối chiếu.</p>
              <p class="mono-code">Bundle SHA-256: ${escapeHtml(bundle.manifest.checksums.bundleSha256)}</p>
            </div>
            <a class="download-btn" download="manifest.json" href="${manifestHref}">Tải xuống manifest.json</a>
          </div>
        </div>
      </section>
    </main>

    <footer class="archive-footer">
      <p>Định dạng gói: <span class="mono-code">${escapeHtml(bundle.manifest.format)}</span> · Đơn vị phát hành cục bộ: <span class="mono-code">${escapeHtml(bundle.manifest.issuer)}</span> · Chuẩn mở: CLR ${escapeHtml(bundle.manifest.versions.clr)}, CASE ${escapeHtml(bundle.manifest.versions.case)}, xAPI ${escapeHtml(bundle.manifest.versions.xapi)}.</p>
    </footer>
  </div>

  <script id="tlo-portability-data" type="application/json">${safeEmbeddedJson}</script>
  <script>
    (function () {
      var dataEl = document.getElementById("tlo-portability-data");
      var archiveData = null;
      if (dataEl && dataEl.textContent) {
        try {
          archiveData = JSON.parse(dataEl.textContent);
        } catch (_err) {
          archiveData = null;
        }
      }

      var activeSubject = "ALL";
      var activeState = "ALL";
      var buttons = document.querySelectorAll("button.filter-btn");
      var cards = document.querySelectorAll("#competency-list .skill-card");
      var statusEl = document.getElementById("competency-filter-status");
      var totalCount = archiveData && Array.isArray(archiveData.skills) ? archiveData.skills.length : cards.length;

      function applyFilters() {
        var visibleCount = 0;
        for (var i = 0; i < cards.length; i += 1) {
          var card = cards[i];
          var cardSubject = card.getAttribute("data-subject-id") || "";
          var cardState = card.getAttribute("data-state") || "";
          var matchesSubject = activeSubject === "ALL" || cardSubject === activeSubject;
          var matchesState = activeState === "ALL" || cardState === activeState;
          var show = matchesSubject && matchesState;
          card.hidden = !show;
          if (show) {
            visibleCount += 1;
          }
        }
        if (statusEl) {
          statusEl.textContent =
            "Đang hiển thị " + String(visibleCount) + " / " + String(totalCount) + " kỹ năng.";
        }
      }

      function updatePressedStates(group, selectedValue) {
        for (var i = 0; i < buttons.length; i += 1) {
          var btn = buttons[i];
          if (btn.getAttribute("data-filter-group") === group) {
            var isSelected = btn.getAttribute("data-filter-value") === selectedValue;
            btn.setAttribute("aria-pressed", isSelected ? "true" : "false");
            if (isSelected) {
              btn.classList.add("is-active");
            } else {
              btn.classList.remove("is-active");
            }
          }
        }
      }

      for (var i = 0; i < buttons.length; i += 1) {
        buttons[i].addEventListener("click", function (event) {
          var target = event.currentTarget;
          if (!target) return;
          var group = target.getAttribute("data-filter-group");
          var value = target.getAttribute("data-filter-value") || "ALL";
          if (group === "subject") {
            activeSubject = value;
            updatePressedStates("subject", value);
            applyFilters();
          } else if (group === "state") {
            activeState = value;
            updatePressedStates("state", value);
            applyFilters();
          }
        });
      }
    })();
  </script>
</body>
</html>
`;
}
