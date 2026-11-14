/**
 * 10-Year Open Portability Bundle builders.
 *
 * Converts a validated or exported `ExportEnvelope` (`tai-learning-os-export@v1`)
 * into three open-standard archival representations plus a cryptographic manifest:
 *   1. 1EdTech Comprehensive Learner Record (CLR) Standard v2.0 (`clr-2.0.json`)
 *   2. 1EdTech Competency and Academic Standards Exchange (CASE) v1.1 (`case-1.1.json`)
 *   3. IEEE 9274.1.1-2023 / xAPI 2.0 chronological event ledger (`xapi-2.0.jsonl`)
 *   4. Bundle manifest with counts, specification versions, and SHA-256 checksums (`manifest.json`)
 *
 * Privacy & Assessment Integrity Invariants:
 *   - Pseudonymous learner representation only (`urn:uuid:<learnerId>` + `nickname`).
 *     Zero legal name, date of birth, birth year, school name, or home address.
 *   - Assessment secrets (`lessonSteps.answerKey` and all answer-bearing fields of
 *     `ExerciseSpec`) are never read or emitted into any portable artifact.
 */

import type { CompetencyState, EvidenceKind, SubmissionOutcome } from "../schemas/attempt";
import type {
  CurriculumObjectiveExport,
  ExportEnvelope,
  LessonExport,
  SkillEstimateExport,
  SkillExport,
} from "../schemas/transfer";

export const PORTABILITY_BUNDLE_FORMAT = "tai-open-portability-bundle@v1" as const;
export const HOUSEHOLD_ISSUER_URN = "urn:tai-learning-os:household" as const;

export const CLR_20_CONTEXT = [
  "https://www.w3.org/ns/credentials/v2",
  "https://purl.imsglobal.org/spec/clr/v2p0/context-2.0.1.jsonld",
] as const;

export const ADL_VERB_ANSWERED = "http://adlnet.gov/expapi/verbs/answered" as const;
export const ADL_VERB_COMPLETED = "http://adlnet.gov/expapi/verbs/completed" as const;

/* ── 1EdTech CLR v2.0 types ───────────────────────────────────────────────── */

export type Clr20Alignment = {
  type: ["Alignment"];
  targetName: string;
  targetUrl: string;
  targetCode: string;
  targetDescription?: string;
  targetType: "CFItem";
  targetFramework: string;
};

export type Clr20Achievement = {
  id: string;
  type: ["Achievement"];
  achievementType: "Competency";
  name: string;
  description: string;
  humanCode?: string;
  creator: {
    id: typeof HOUSEHOLD_ISSUER_URN;
    type: ["Profile"];
  };
  alignments: Clr20Alignment[];
};

export type Clr20MemoryEstimateSummary = {
  stabilityDays: number;
  difficulty: number;
  retrievability: number;
  reps: number;
  lapses: number;
  scheduledDays: number;
  modelVersion: string;
  computedAtIso: string;
  lastReviewAtIso: string | null;
};

export type Clr20EvidenceSummary = {
  independentCount: number;
  assistedCount: number;
  correctCount: number;
  source: "derived" | "parent_correction";
  lastIndependentAtIso: string | null;
  lastObservedAtIso: string | null;
  correctionNote: string | null;
};

export type Clr20Result = {
  id: string;
  type: ["Result"];
  achievedLevel: string;
  status: CompetencyState;
  value: CompetencyState;
  achievedDate: string;
  alignments: Clr20Alignment[];
  evidenceSummary: Clr20EvidenceSummary;
  memoryEstimate: Clr20MemoryEstimateSummary | null;
};

export type Clr20Credential = {
  "@context": readonly [
    "https://www.w3.org/ns/credentials/v2",
    "https://purl.imsglobal.org/spec/clr/v2p0/context-2.0.1.jsonld",
  ];
  id: string;
  type: ["VerifiableCredential", "ClrCredential"];
  name: string;
  description: string;
  issuer: {
    id: typeof HOUSEHOLD_ISSUER_URN;
    type: ["Profile"];
    name: string;
  };
  validFrom: string;
  partial: boolean;
  credentialSubject: {
    id: string;
    type: ["ClrSubject"];
    name: string;
    achievements: Clr20Achievement[];
    results: Clr20Result[];
  };
};

/* ── 1EdTech CASE v1.1 types ──────────────────────────────────────────────── */

export type Case11LinkUri = {
  title: string;
  identifier: string;
  URI: string;
};

export type Case11Document = {
  identifier: string;
  URI: string;
  creator: typeof HOUSEHOLD_ISSUER_URN;
  title: string;
  lastChangeDateTime: string;
  publisher: string;
  description: string;
  subject: string[];
  language: "vi";
  version: "1.1";
  adoptionStatus: "Adopted";
};

export type Case11Item = {
  identifier: string;
  URI: string;
  CFItemType: "Objective" | "Skill";
  humanCodingScheme: string;
  fullStatement: string;
  abbreviatedStatement: string;
  educationLevel: string[];
  language: "vi";
  lastChangeDateTime: string;
  notes?: string;
};

export type Case11Association = {
  identifier: string;
  URI: string;
  associationType: "precedes" | "isChildOf";
  CFDocumentURI: Case11LinkUri;
  originNodeURI: Case11LinkUri;
  destinationNodeURI: Case11LinkUri;
  lastChangeDateTime: string;
};

export type Case11Package = {
  CFDocument: Case11Document;
  CFItems: Case11Item[];
  CFAssociations: Case11Association[];
};

/* ── IEEE 9274.1.1-2023 / xAPI 2.0 types ──────────────────────────────────── */

export type Xapi20Actor = {
  objectType: "Agent";
  account: {
    homePage: typeof HOUSEHOLD_ISSUER_URN;
    name: string;
  };
};

export type Xapi20Verb = {
  id: typeof ADL_VERB_ANSWERED | typeof ADL_VERB_COMPLETED;
  display: {
    vi: string;
    en: string;
  };
};

export type Xapi20Activity = {
  objectType: "Activity";
  id: string;
  definition?: {
    type: string;
    name?: {
      vi: string;
      en?: string;
    };
  };
};

export type Xapi20Result = {
  success: boolean;
  completion: boolean;
  duration?: string;
  extensions: Record<string, string | number | boolean | null>;
};

export type Xapi20Context = {
  registration: string;
  contextActivities: {
    parent?: Xapi20Activity[];
    grouping?: Xapi20Activity[];
    category?: Xapi20Activity[];
  };
  extensions: {
    "urn:tai-learning-os:xapi:ext:session-id": string;
    "urn:tai-learning-os:xapi:ext:purpose": "official" | "practice";
    "urn:tai-learning-os:xapi:ext:lesson-id": string;
    "urn:tai-learning-os:xapi:ext:case-skill-iris": string[];
    "urn:tai-learning-os:xapi:ext:case-objective-iris": string[];
    "urn:tai-learning-os:xapi:ext:attempt-id"?: string;
    "urn:tai-learning-os:xapi:ext:step-id"?: string;
    "urn:tai-learning-os:xapi:ext:step-version"?: number;
    "urn:tai-learning-os:xapi:ext:help-level"?: number;
    "urn:tai-learning-os:xapi:ext:evidence-kind"?: EvidenceKind;
    "urn:tai-learning-os:xapi:ext:attempt-no"?: number;
    "urn:tai-learning-os:xapi:ext:outcome"?: SubmissionOutcome;
    "urn:tai-learning-os:xapi:ext:lesson-version"?: number;
  };
};

export type Xapi20Statement = {
  id: string;
  version: "2.0.0";
  actor: Xapi20Actor;
  verb: Xapi20Verb;
  object: Xapi20Activity;
  result: Xapi20Result;
  context: Xapi20Context;
  timestamp: string;
};

/* ── Manifest & Bundle types ──────────────────────────────────────────────── */

export type PortabilityChecksums = {
  algorithm: "SHA-256";
  clr20Sha256: string;
  case11Sha256: string;
  xapi20JsonlSha256: string;
  bundleSha256: string;
};

export type PortabilityManifest = {
  format: typeof PORTABILITY_BUNDLE_FORMAT;
  sourceFormatVersion: number;
  exportedAt: number;
  exportedAtIso: string;
  issuer: typeof HOUSEHOLD_ISSUER_URN;
  containsLearnerEvidence: boolean;
  versions: {
    clr: "2.0";
    case: "1.1";
    xapi: "2.0.0";
  };
  counts: {
    learners: number;
    skills: number;
    objectives: number;
    achievements: number;
    sessions: number;
    attempts: number;
    xapiStatements: number;
  };
  files: {
    "clr-2.0.json": { sha256: string; bytes: number };
    "case-1.1.json": { sha256: string; bytes: number };
    "xapi-2.0.jsonl": { sha256: string; bytes: number };
  };
  checksums: PortabilityChecksums;
};

export type OpenPortabilityBundle = {
  clr20: Clr20Credential;
  case11: Case11Package;
  xapi20Statements: Xapi20Statement[];
  xapi20Jsonl: string;
  manifest: PortabilityManifest;
};

export type SerializedPortabilityFiles = {
  clr20Json: string;
  case11Json: string;
  xapi20Jsonl: string;
  manifestJson: string;
};

/* ── Deterministic URI helpers ────────────────────────────────────────────── */

export function caseDocumentIri(): string {
  return "urn:tai-learning-os:case:document:gdpt-2018";
}

export function caseSkillIri(skillId: string): string {
  return `urn:tai-learning-os:case:skill:${skillId}`;
}

export function caseObjectiveIri(objectiveId: string): string {
  return `urn:tai-learning-os:case:objective:${objectiveId}`;
}

function achievementIri(learnerId: string, skillId: string): string {
  return `urn:tai-learning-os:achievement:${learnerId}:${skillId}`;
}

function toIsoTimestamp(epochMs: number): string {
  if (!Number.isFinite(epochMs)) {
    return new Date(0).toISOString();
  }
  return new Date(epochMs).toISOString();
}

function formatIsoDurationMs(durationMs: number): string {
  const clampedSeconds = Math.max(0, Math.round(durationMs / 1000));
  return `PT${clampedSeconds}S`;
}

function gradeRangeEducationLevels(gradeFrom: number, gradeTo: number): string[] {
  const start = Math.min(gradeFrom, gradeTo);
  const end = Math.max(gradeFrom, gradeTo);
  const levels: string[] = [];
  for (let g = start; g <= end && levels.length < 16; g += 1) {
    levels.push(String(g));
  }
  return levels.length > 0 ? levels : [String(gradeFrom)];
}

/* ── Pure FIPS 180-4 SHA-256 + WebCrypto verification ─────────────────────── */

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr32(value: number, shift: number): number {
  return ((value >>> shift) | (value << (32 - shift))) >>> 0;
}

function sha256BytesSync(message: Uint8Array): Uint8Array {
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const paddedLen = Math.ceil((message.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(message);
  padded[message.length] = 0x80;

  const view = new DataView(padded.buffer);
  const bitLenHi = Math.floor(message.length / 0x20000000);
  const bitLenLo = ((message.length >>> 0) * 8) >>> 0;
  view.setUint32(paddedLen - 8, bitLenHi, false);
  view.setUint32(paddedLen - 4, bitLenLo, false);

  const w = new Uint32Array(64);
  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i += 1) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i += 1) {
      const w15 = w[i - 15] ?? 0;
      const w2 = w[i - 2] ?? 0;
      const w16 = w[i - 16] ?? 0;
      const w7 = w[i - 7] ?? 0;
      const s0 = (rotr32(w15, 7) ^ rotr32(w15, 18) ^ (w15 >>> 3)) >>> 0;
      const s1 = (rotr32(w2, 17) ^ rotr32(w2, 19) ^ (w2 >>> 10)) >>> 0;
      w[i] = (w16 + s0 + w7 + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i += 1) {
      const s1 = (rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const kVal = SHA256_K[i] ?? 0;
      const wVal = w[i] ?? 0;
      const temp1 = (h + s1 + ch + kVal + wVal) >>> 0;
      const s0 = (rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = (s0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, h0, false);
  outView.setUint32(4, h1, false);
  outView.setUint32(8, h2, false);
  outView.setUint32(12, h3, false);
  outView.setUint32(16, h4, false);
  outView.setUint32(20, h5, false);
  outView.setUint32(24, h6, false);
  outView.setUint32(28, h7, false);
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = "";
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}

function sha256Utf8Sync(text: string): { sha256: string; bytes: number } {
  const encoded = new TextEncoder().encode(text);
  return {
    sha256: bytesToHex(sha256BytesSync(encoded)),
    bytes: encoded.byteLength,
  };
}

function asBufferSource(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

async function sha256Utf8Subtle(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", asBufferSource(encoded));
  return bytesToHex(new Uint8Array(digest));
}

export function deterministicUuid(seed: string): string {
  const digest = sha256BytesSync(new TextEncoder().encode(`tai-learning-os:${seed}`));
  const bytes = digest.slice(0, 16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = bytesToHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/* ── Canonical JSON formatting ────────────────────────────────────────────── */

export function formatPortabilityJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function serializePortabilityBundleFiles(
  bundle: OpenPortabilityBundle,
): SerializedPortabilityFiles {
  return {
    clr20Json: formatPortabilityJson(bundle.clr20),
    case11Json: formatPortabilityJson(bundle.case11),
    xapi20Jsonl: bundle.xapi20Jsonl,
    manifestJson: formatPortabilityJson(bundle.manifest),
  };
}

/* ── Internal builders ────────────────────────────────────────────────────── */

function buildClr20Credential(
  envelope: ExportEnvelope,
  exportedAtIso: string,
  skillsById: ReadonlyMap<string, SkillExport>,
  objectivesBySkillId: ReadonlyMap<string, CurriculumObjectiveExport[]>,
  estimatesByLearnerSkill: ReadonlyMap<string, SkillEstimateExport>,
): Clr20Credential {
  const primaryLearner = envelope.data.learners[0];
  const learnerId = primaryLearner?.id ?? "unknown-learner";
  const learnerNickname = primaryLearner?.nickname ?? "Người học";

  const learnerEvidence = [...envelope.data.skillEvidence]
    .filter((row) => (primaryLearner ? row.learnerId === primaryLearner.id : true))
    .sort((a, b) => a.skillId.localeCompare(b.skillId) || a.id.localeCompare(b.id));

  const achievements: Clr20Achievement[] = [];
  const results: Clr20Result[] = [];

  for (const ev of learnerEvidence) {
    const skill = skillsById.get(ev.skillId);
    const alignedObjectives = objectivesBySkillId.get(ev.skillId) ?? [];

    const alignments: Clr20Alignment[] = [];
    if (skill) {
      alignments.push({
        type: ["Alignment"],
        targetName: skill.nameVi,
        targetUrl: caseSkillIri(skill.id),
        targetCode: skill.code,
        targetDescription: `${skill.nameVi} (${skill.nameEn})`,
        targetType: "CFItem",
        targetFramework: "GDPT-2018-TAI-CASE-1.1",
      });
    } else {
      alignments.push({
        type: ["Alignment"],
        targetName: ev.skillId,
        targetUrl: caseSkillIri(ev.skillId),
        targetCode: ev.skillId,
        targetType: "CFItem",
        targetFramework: "GDPT-2018-TAI-CASE-1.1",
      });
    }

    for (const obj of alignedObjectives) {
      alignments.push({
        type: ["Alignment"],
        targetName: obj.titleVi,
        targetUrl: caseObjectiveIri(obj.id),
        targetCode: obj.code,
        targetDescription: obj.descriptionVi,
        targetType: "CFItem",
        targetFramework: "GDPT-2018-TAI-CASE-1.1",
      });
    }

    const achId = achievementIri(ev.learnerId, ev.skillId);
    achievements.push({
      id: achId,
      type: ["Achievement"],
      achievementType: "Competency",
      name: skill ? skill.nameVi : ev.skillId,
      description: skill
        ? `${skill.nameVi} (${skill.nameEn}) — Trạng thái năng lực: ${ev.state}`
        : `Kỹ năng ${ev.skillId} — Trạng thái năng lực: ${ev.state}`,
      ...(skill ? { humanCode: skill.code } : {}),
      creator: {
        id: HOUSEHOLD_ISSUER_URN,
        type: ["Profile"],
      },
      alignments,
    });

    const estimate = estimatesByLearnerSkill.get(`${ev.learnerId}::${ev.skillId}`);
    const memoryEstimate: Clr20MemoryEstimateSummary | null = estimate
      ? {
          stabilityDays: estimate.stability,
          difficulty: estimate.difficulty,
          retrievability: estimate.retrievabilityAt,
          reps: estimate.reps,
          lapses: estimate.lapses,
          scheduledDays: estimate.scheduledDays,
          modelVersion: estimate.modelVersion,
          computedAtIso: toIsoTimestamp(estimate.computedAt),
          lastReviewAtIso:
            estimate.lastReviewAt !== null ? toIsoTimestamp(estimate.lastReviewAt) : null,
        }
      : null;

    results.push({
      id: `urn:tai-learning-os:result:${ev.id}`,
      type: ["Result"],
      achievedLevel: `urn:tai-learning-os:competency-state:${ev.state}`,
      status: ev.state,
      value: ev.state,
      achievedDate: toIsoTimestamp(ev.updatedAt),
      alignments,
      evidenceSummary: {
        independentCount: ev.independentCount,
        assistedCount: ev.assistedCount,
        correctCount: ev.correctCount,
        source: ev.source,
        lastIndependentAtIso:
          ev.lastIndependentAt !== null ? toIsoTimestamp(ev.lastIndependentAt) : null,
        lastObservedAtIso:
          ev.lastObservedAt !== null ? toIsoTimestamp(ev.lastObservedAt) : null,
        correctionNote: ev.correctionNote,
      },
      memoryEstimate,
    });
  }

  return {
    "@context": CLR_20_CONTEXT,
    id: `urn:tai-learning-os:clr:${learnerId}:${String(envelope.exportedAt)}`,
    type: ["VerifiableCredential", "ClrCredential"],
    name: `Hồ sơ Năng lực Học tập Toàn diện — ${learnerNickname}`,
    description:
      "Hồ sơ năng lực 1EdTech CLR 2.0 ẩn danh xuất từ hệ thống học tập gia đình TAI Learning OS.",
    issuer: {
      id: HOUSEHOLD_ISSUER_URN,
      type: ["Profile"],
      name: "Hộ gia đình TAI Learning OS",
    },
    validFrom: exportedAtIso,
    partial: false,
    credentialSubject: {
      id: `urn:uuid:${learnerId}`,
      type: ["ClrSubject"],
      name: learnerNickname,
      achievements,
      results,
    },
  };
}

function buildCase11Package(
  envelope: ExportEnvelope,
  exportedAtIso: string,
  skillsById: ReadonlyMap<string, SkillExport>,
): Case11Package {
  const docIdentifier = "tai-learning-os-gdpt-2018-cfdoc";
  const docUri = caseDocumentIri();
  const docTitle = "Khung Chương trình & Kỹ năng TAI Learning OS (GDPT 2018)";
  const docLink: Case11LinkUri = {
    title: docTitle,
    identifier: docIdentifier,
    URI: docUri,
  };

  const sortedSubjects = [...envelope.data.subjects].sort(
    (a, b) => a.sort - b.sort || a.id.localeCompare(b.id),
  );
  const sortedObjectives = [...(envelope.data.curriculumObjectives ?? [])].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  const sortedSkills = [...envelope.data.skills].sort((a, b) => a.id.localeCompare(b.id));

  const cfItems: Case11Item[] = [];

  for (const obj of sortedObjectives) {
    const fullStatement =
      obj.descriptionVi.trim().length > 0
        ? `${obj.titleVi}: ${obj.descriptionVi}`
        : obj.titleVi;
    cfItems.push({
      identifier: obj.id,
      URI: caseObjectiveIri(obj.id),
      CFItemType: "Objective",
      humanCodingScheme: obj.code,
      fullStatement,
      abbreviatedStatement: obj.titleVi,
      educationLevel: [String(obj.grade)],
      language: "vi",
      lastChangeDateTime: toIsoTimestamp(obj.createdAt),
      ...(obj.sourceRef ? { notes: `${obj.provenance} | ${obj.sourceRef}` } : { notes: obj.provenance }),
    });
  }

  for (const skill of sortedSkills) {
    cfItems.push({
      identifier: skill.id,
      URI: caseSkillIri(skill.id),
      CFItemType: "Skill",
      humanCodingScheme: skill.code,
      fullStatement: `${skill.nameVi} (${skill.nameEn})`,
      abbreviatedStatement: skill.nameVi,
      educationLevel: gradeRangeEducationLevels(skill.gradeFrom, skill.gradeTo),
      language: "vi",
      lastChangeDateTime: exportedAtIso,
    });
  }

  const cfAssociations: Case11Association[] = [];

  const sortedPrereqs = [...envelope.data.skillPrerequisites].sort(
    (a, b) =>
      a.prerequisiteId.localeCompare(b.prerequisiteId) || a.skillId.localeCompare(b.skillId),
  );
  for (const edge of sortedPrereqs) {
    const prereqSkill = skillsById.get(edge.prerequisiteId);
    const targetSkill = skillsById.get(edge.skillId);
    const assocId = `assoc-precedes-${edge.prerequisiteId}-${edge.skillId}`;
    cfAssociations.push({
      identifier: assocId,
      URI: `urn:tai-learning-os:case:association:${assocId}`,
      associationType: "precedes",
      CFDocumentURI: docLink,
      originNodeURI: {
        title: prereqSkill ? prereqSkill.nameVi : edge.prerequisiteId,
        identifier: edge.prerequisiteId,
        URI: caseSkillIri(edge.prerequisiteId),
      },
      destinationNodeURI: {
        title: targetSkill ? targetSkill.nameVi : edge.skillId,
        identifier: edge.skillId,
        URI: caseSkillIri(edge.skillId),
      },
      lastChangeDateTime: exportedAtIso,
    });
  }

  for (const obj of sortedObjectives) {
    if (!obj.skillId) continue;
    const skill = skillsById.get(obj.skillId);
    const assocId = `assoc-child-${obj.skillId}-${obj.id}`;
    cfAssociations.push({
      identifier: assocId,
      URI: `urn:tai-learning-os:case:association:${assocId}`,
      associationType: "isChildOf",
      CFDocumentURI: docLink,
      originNodeURI: {
        title: skill ? skill.nameVi : obj.skillId,
        identifier: obj.skillId,
        URI: caseSkillIri(obj.skillId),
      },
      destinationNodeURI: {
        title: obj.titleVi,
        identifier: obj.id,
        URI: caseObjectiveIri(obj.id),
      },
      lastChangeDateTime: exportedAtIso,
    });
  }

  return {
    CFDocument: {
      identifier: docIdentifier,
      URI: docUri,
      creator: HOUSEHOLD_ISSUER_URN,
      title: docTitle,
      lastChangeDateTime: exportedAtIso,
      publisher: "TAI Learning OS",
      description:
        "Đồ thị mục tiêu chương trình GDPT 2018 và kỹ năng học tập xuất theo chuẩn 1EdTech CASE v1.1.",
      subject: sortedSubjects.map((s) => s.nameVi),
      language: "vi",
      version: "1.1",
      adoptionStatus: "Adopted",
    },
    CFItems: cfItems,
    CFAssociations: cfAssociations,
  };
}

type PendingXapiEntry = {
  timestampMs: number;
  kindOrder: 0 | 1;
  subOrder: number;
  rawId: string;
  statement: Xapi20Statement;
};

function resolveEffectivePurpose(
  explicitPurpose: "official" | "practice" | undefined,
  lesson: LessonExport | undefined,
  sessionPurpose?: "official" | "practice",
): "official" | "practice" {
  if (
    explicitPurpose === "practice" ||
    sessionPurpose === "practice" ||
    lesson?.ownershipType === "family" ||
    lesson?.purpose === "practice"
  ) {
    return "practice";
  }
  return "official";
}

function buildXapi20Statements(
  envelope: ExportEnvelope,
  lessonsById: ReadonlyMap<string, LessonExport>,
  objectivesBySkillId: ReadonlyMap<string, CurriculumObjectiveExport[]>,
  objectiveIdsByLessonId: ReadonlyMap<string, string[]>,
): Xapi20Statement[] {
  const sessionsById = new Map(envelope.data.learningSessions.map((s) => [s.id, s]));
  const reflectionsBySessionId = new Map(
    (envelope.data.sessionReflections ?? []).map((r) => [r.sessionId, r]),
  );

  const entries: PendingXapiEntry[] = [];

  for (const attempt of envelope.data.learningAttempts) {
    const parentSession = sessionsById.get(attempt.sessionId);
    const lesson = lessonsById.get(attempt.lessonId);
    const effectivePurpose = resolveEffectivePurpose(
      attempt.purpose,
      lesson,
      parentSession?.purpose,
    );

    const effectiveSkillId = attempt.skillId ?? lesson?.skillId ?? null;
    const skillIris = effectiveSkillId ? [caseSkillIri(effectiveSkillId)] : [];

    const objectiveIdSet = new Set<string>(objectiveIdsByLessonId.get(attempt.lessonId) ?? []);
    if (effectiveSkillId) {
      for (const obj of objectivesBySkillId.get(effectiveSkillId) ?? []) {
        objectiveIdSet.add(obj.id);
      }
    }
    const objectiveIris = [...objectiveIdSet].sort().map(caseObjectiveIri);

    const categoryActivities: Xapi20Activity[] = [
      ...skillIris.map((id) => ({ objectType: "Activity" as const, id })),
      ...objectiveIris.map((id) => ({ objectType: "Activity" as const, id })),
    ];

    const groupingActivities: Xapi20Activity[] = [
      { objectType: "Activity", id: `urn:tai-learning-os:session:${attempt.sessionId}` },
    ];
    if (parentSession?.schoolYearId) {
      groupingActivities.push({
        objectType: "Activity",
        id: `urn:tai-learning-os:school-year:${parentSession.schoolYearId}`,
      });
    }

    const statement: Xapi20Statement = {
      id: deterministicUuid(`xapi-attempt:${attempt.id}`),
      version: "2.0.0",
      actor: {
        objectType: "Agent",
        account: {
          homePage: HOUSEHOLD_ISSUER_URN,
          name: attempt.learnerId,
        },
      },
      verb: {
        id: ADL_VERB_ANSWERED,
        display: {
          vi: "đã trả lời",
          en: "answered",
        },
      },
      object: {
        objectType: "Activity",
        id: `urn:tai-learning-os:lesson:${attempt.lessonId}:step:${attempt.stepId}`,
        definition: {
          type: "http://adlnet.gov/expapi/activities/cmi.interaction",
          ...(lesson
            ? {
                name: {
                  vi: lesson.titleVi,
                  ...(lesson.titleEn.length > 0 ? { en: lesson.titleEn } : {}),
                },
              }
            : {}),
        },
      },
      result: {
        success: attempt.outcome === "correct",
        completion: true,
        extensions: {
          "urn:tai-learning-os:xapi:ext:outcome": attempt.outcome,
          "urn:tai-learning-os:xapi:ext:help-level": attempt.helpLevel,
          "urn:tai-learning-os:xapi:ext:evidence-kind": attempt.evidenceKind,
          "urn:tai-learning-os:xapi:ext:attempt-no": attempt.attemptNo,
        },
      },
      context: {
        registration: deterministicUuid(`xapi-session-reg:${attempt.sessionId}`),
        contextActivities: {
          parent: [
            {
              objectType: "Activity",
              id: `urn:tai-learning-os:lesson:${attempt.lessonId}@v${String(attempt.stepVersion)}`,
            },
          ],
          grouping: groupingActivities,
          ...(categoryActivities.length > 0 ? { category: categoryActivities } : {}),
        },
        extensions: {
          "urn:tai-learning-os:xapi:ext:session-id": attempt.sessionId,
          "urn:tai-learning-os:xapi:ext:attempt-id": attempt.id,
          "urn:tai-learning-os:xapi:ext:lesson-id": attempt.lessonId,
          "urn:tai-learning-os:xapi:ext:step-id": attempt.stepId,
          "urn:tai-learning-os:xapi:ext:step-version": attempt.stepVersion,
          "urn:tai-learning-os:xapi:ext:purpose": effectivePurpose,
          "urn:tai-learning-os:xapi:ext:help-level": attempt.helpLevel,
          "urn:tai-learning-os:xapi:ext:evidence-kind": attempt.evidenceKind,
          "urn:tai-learning-os:xapi:ext:attempt-no": attempt.attemptNo,
          "urn:tai-learning-os:xapi:ext:outcome": attempt.outcome,
          "urn:tai-learning-os:xapi:ext:case-skill-iris": skillIris,
          "urn:tai-learning-os:xapi:ext:case-objective-iris": objectiveIris,
        },
      },
      timestamp: toIsoTimestamp(attempt.createdAt),
    };

    entries.push({
      timestampMs: attempt.createdAt,
      kindOrder: 0,
      subOrder: attempt.attemptNo,
      rawId: attempt.id,
      statement,
    });
  }

  for (const session of envelope.data.learningSessions) {
    if (session.status !== "completed") continue;

    const lesson = lessonsById.get(session.lessonId);
    const effectivePurpose = resolveEffectivePurpose(session.purpose, lesson);
    const effectiveSkillId = lesson?.skillId ?? null;
    const skillIris = effectiveSkillId ? [caseSkillIri(effectiveSkillId)] : [];

    const objectiveIdSet = new Set<string>(objectiveIdsByLessonId.get(session.lessonId) ?? []);
    if (effectiveSkillId) {
      for (const obj of objectivesBySkillId.get(effectiveSkillId) ?? []) {
        objectiveIdSet.add(obj.id);
      }
    }
    const objectiveIris = [...objectiveIdSet].sort().map(caseObjectiveIri);

    const categoryActivities: Xapi20Activity[] = [
      ...skillIris.map((id) => ({ objectType: "Activity" as const, id })),
      ...objectiveIris.map((id) => ({ objectType: "Activity" as const, id })),
    ];

    const groupingActivities: Xapi20Activity[] = [
      { objectType: "Activity", id: `urn:tai-learning-os:session:${session.id}` },
    ];
    if (session.schoolYearId) {
      groupingActivities.push({
        objectType: "Activity",
        id: `urn:tai-learning-os:school-year:${session.schoolYearId}`,
      });
    }

    const completedAtMs = session.endedAt ?? session.startedAt;
    const reflection = reflectionsBySessionId.get(session.id);

    const statement: Xapi20Statement = {
      id: deterministicUuid(`xapi-session:${session.id}`),
      version: "2.0.0",
      actor: {
        objectType: "Agent",
        account: {
          homePage: HOUSEHOLD_ISSUER_URN,
          name: session.learnerId,
        },
      },
      verb: {
        id: ADL_VERB_COMPLETED,
        display: {
          vi: "đã hoàn thành",
          en: "completed",
        },
      },
      object: {
        objectType: "Activity",
        id: `urn:tai-learning-os:lesson:${session.lessonId}@v${String(session.lessonVersion)}`,
        definition: {
          type: "http://adlnet.gov/expapi/activities/lesson",
          ...(lesson
            ? {
                name: {
                  vi: lesson.titleVi,
                  ...(lesson.titleEn.length > 0 ? { en: lesson.titleEn } : {}),
                },
              }
            : {}),
        },
      },
      result: {
        success: true,
        completion: true,
        ...(session.endedAt !== null && session.endedAt >= session.startedAt
          ? { duration: formatIsoDurationMs(session.endedAt - session.startedAt) }
          : {}),
        extensions: {
          "urn:tai-learning-os:xapi:ext:steps-seen": session.stepsSeen,
          ...(reflection
            ? { "urn:tai-learning-os:xapi:ext:reflection-feeling": reflection.feeling }
            : {}),
        },
      },
      context: {
        registration: deterministicUuid(`xapi-session-reg:${session.id}`),
        contextActivities: {
          grouping: groupingActivities,
          ...(categoryActivities.length > 0 ? { category: categoryActivities } : {}),
        },
        extensions: {
          "urn:tai-learning-os:xapi:ext:session-id": session.id,
          "urn:tai-learning-os:xapi:ext:lesson-id": session.lessonId,
          "urn:tai-learning-os:xapi:ext:lesson-version": session.lessonVersion,
          "urn:tai-learning-os:xapi:ext:purpose": effectivePurpose,
          "urn:tai-learning-os:xapi:ext:case-skill-iris": skillIris,
          "urn:tai-learning-os:xapi:ext:case-objective-iris": objectiveIris,
        },
      },
      timestamp: toIsoTimestamp(completedAtMs),
    };

    entries.push({
      timestampMs: completedAtMs,
      kindOrder: 1,
      subOrder: 0,
      rawId: session.id,
      statement,
    });
  }

  entries.sort(
    (a, b) =>
      a.timestampMs - b.timestampMs ||
      a.kindOrder - b.kindOrder ||
      a.subOrder - b.subOrder ||
      a.rawId.localeCompare(b.rawId),
  );

  return entries.map((e) => e.statement);
}

/* ── Public builders ──────────────────────────────────────────────────────── */

/**
 * Synchronously build a deterministic 10-year Open Portability Bundle from an
 * `ExportEnvelope` (`tai-learning-os-export@v1`).
 *
 * Never reads `lessonSteps.answerKey` or `lessonSteps.content`, ensuring zero
 * assessment-key leakage by construction.
 */
export function buildOpenPortabilityBundle(envelope: ExportEnvelope): OpenPortabilityBundle {
  const exportedAtIso = toIsoTimestamp(envelope.exportedAt);

  const skillsById = new Map<string, SkillExport>();
  for (const skill of envelope.data.skills) {
    skillsById.set(skill.id, skill);
  }

  const objectives = envelope.data.curriculumObjectives ?? [];
  const objectivesBySkillId = new Map<string, CurriculumObjectiveExport[]>();
  for (const obj of objectives) {
    if (!obj.skillId) continue;
    const list = objectivesBySkillId.get(obj.skillId) ?? [];
    list.push(obj);
    objectivesBySkillId.set(obj.skillId, list);
  }
  for (const list of objectivesBySkillId.values()) {
    list.sort((a, b) => a.code.localeCompare(b.code) || a.id.localeCompare(b.id));
  }

  const objectiveIdsByLessonId = new Map<string, string[]>();
  for (const meta of envelope.data.lessonMetadata ?? []) {
    if (!meta.objectiveId) continue;
    const list = objectiveIdsByLessonId.get(meta.lessonId) ?? [];
    list.push(meta.objectiveId);
    objectiveIdsByLessonId.set(meta.lessonId, list);
  }

  const estimatesByLearnerSkill = new Map<string, SkillEstimateExport>();
  for (const est of envelope.data.skillEstimates ?? []) {
    estimatesByLearnerSkill.set(`${est.learnerId}::${est.skillId}`, est);
  }

  const lessonsById = new Map<string, LessonExport>();
  for (const lesson of envelope.data.lessons) {
    lessonsById.set(lesson.id, lesson);
  }

  const clr20 = buildClr20Credential(
    envelope,
    exportedAtIso,
    skillsById,
    objectivesBySkillId,
    estimatesByLearnerSkill,
  );
  const case11 = buildCase11Package(envelope, exportedAtIso, skillsById);
  const xapi20Statements = buildXapi20Statements(
    envelope,
    lessonsById,
    objectivesBySkillId,
    objectiveIdsByLessonId,
  );
  const xapi20Jsonl =
    xapi20Statements.length > 0
      ? `${xapi20Statements.map((stmt) => JSON.stringify(stmt)).join("\n")}\n`
      : "";

  const clr20Formatted = formatPortabilityJson(clr20);
  const case11Formatted = formatPortabilityJson(case11);

  const clrStat = sha256Utf8Sync(clr20Formatted);
  const caseStat = sha256Utf8Sync(case11Formatted);
  const xapiStat = sha256Utf8Sync(xapi20Jsonl);
  const combinedDigestInput = `clr-2.0.json:${clrStat.sha256}\ncase-1.1.json:${caseStat.sha256}\nxapi-2.0.jsonl:${xapiStat.sha256}\n`;
  const bundleStat = sha256Utf8Sync(combinedDigestInput);

  const checksums: PortabilityChecksums = {
    algorithm: "SHA-256",
    clr20Sha256: clrStat.sha256,
    case11Sha256: caseStat.sha256,
    xapi20JsonlSha256: xapiStat.sha256,
    bundleSha256: bundleStat.sha256,
  };

  const manifest: PortabilityManifest = {
    format: PORTABILITY_BUNDLE_FORMAT,
    sourceFormatVersion: envelope.formatVersion,
    exportedAt: envelope.exportedAt,
    exportedAtIso,
    issuer: HOUSEHOLD_ISSUER_URN,
    containsLearnerEvidence: envelope.containsLearnerEvidence,
    versions: {
      clr: "2.0",
      case: "1.1",
      xapi: "2.0.0",
    },
    counts: {
      learners: envelope.data.learners.length,
      skills: envelope.data.skills.length,
      objectives: objectives.length,
      achievements: clr20.credentialSubject.achievements.length,
      sessions: envelope.data.learningSessions.length,
      attempts: envelope.data.learningAttempts.length,
      xapiStatements: xapi20Statements.length,
    },
    files: {
      "clr-2.0.json": { sha256: clrStat.sha256, bytes: clrStat.bytes },
      "case-1.1.json": { sha256: caseStat.sha256, bytes: caseStat.bytes },
      "xapi-2.0.jsonl": { sha256: xapiStat.sha256, bytes: xapiStat.bytes },
    },
    checksums,
  };

  return {
    clr20,
    case11,
    xapi20Statements,
    xapi20Jsonl,
    manifest,
  };
}

/**
 * Compute WebCrypto `crypto.subtle.digest("SHA-256", ...)` checksums over the
 * canonical serialized artifacts in `bundle` (compatible with Node 24+ and
 * Cloudflare `workerd`).
 */
export async function computePortabilityChecksums(
  bundle: Pick<OpenPortabilityBundle, "clr20" | "case11" | "xapi20Jsonl">,
): Promise<PortabilityChecksums> {
  const clr20Formatted = formatPortabilityJson(bundle.clr20);
  const case11Formatted = formatPortabilityJson(bundle.case11);

  const [clr20Sha256, case11Sha256, xapi20JsonlSha256] = await Promise.all([
    sha256Utf8Subtle(clr20Formatted),
    sha256Utf8Subtle(case11Formatted),
    sha256Utf8Subtle(bundle.xapi20Jsonl),
  ]);

  const combinedDigestInput = `clr-2.0.json:${clr20Sha256}\ncase-1.1.json:${case11Sha256}\nxapi-2.0.jsonl:${xapi20JsonlSha256}\n`;
  const bundleSha256 = await sha256Utf8Subtle(combinedDigestInput);

  return {
    algorithm: "SHA-256",
    clr20Sha256,
    case11Sha256,
    xapi20JsonlSha256,
    bundleSha256,
  };
}
