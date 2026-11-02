/**
 * Client- and CLI-shared authenticated encryption for longitudinal learner backups.
 *
 * Uses standard Web Crypto (`crypto.subtle` — available in modern browsers,
 * Cloudflare Workers, and Node.js 20+):
 *  - Key derivation: PBKDF2-SHA256 with 600,000 iterations and a 16-byte random salt.
 *  - Authenticated encryption: AES-256-GCM with a 12-byte random IV, 128-bit auth tag,
 *    and Additional Authenticated Data (AAD) binding the envelope metadata
 *    (`format|kdf|iterations|cipher`) so header tampering fails authentication.
 */

import type { ExportEnvelope } from "../schemas/transfer";
import { validateExportEnvelope } from "../schemas/transfer";

export const ENCRYPTED_BACKUP_FORMAT = "tai-encrypted-backup-v1" as const;
export const ENCRYPTED_BACKUP_KDF = "PBKDF2-SHA256" as const;
export const ENCRYPTED_BACKUP_CIPHER = "AES-256-GCM" as const;
export const ENCRYPTED_BACKUP_DEFAULT_ITERATIONS = 600_000;
export const ENCRYPTED_BACKUP_MIN_ITERATIONS = 100_000;
export const ENCRYPTED_BACKUP_MAX_ITERATIONS = 2_000_000;
export const MIN_BACKUP_PASSPHRASE_LENGTH = 8;

const SALT_BYTES = 16;
const IV_BYTES = 12;

export type EncryptedBackupEnvelope = {
  format: typeof ENCRYPTED_BACKUP_FORMAT;
  kdf: typeof ENCRYPTED_BACKUP_KDF;
  iterations: number;
  saltB64: string;
  ivB64: string;
  cipher: typeof ENCRYPTED_BACKUP_CIPHER;
  exportedAt: number;
  ciphertextB64: string;
};

export type DecryptBackupResult =
  | { ok: true; envelope: ExportEnvelope; warnings: string[] }
  | { ok: false; errors: string[] };

/** Copy into an fresh ArrayBuffer so TS 6 `BufferSource` is satisfied across DOM & Worker libs. */
function asBufferSource(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64(encoded: string): Uint8Array | null {
  try {
    const binary = atob(encoded);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      out[i] = binary.charCodeAt(i);
    }
    return out;
  } catch {
    return null;
  }
}

function buildAadBytes(iterations: number): ArrayBuffer {
  const aadText = `${ENCRYPTED_BACKUP_FORMAT}|${ENCRYPTED_BACKUP_KDF}|${iterations}|${ENCRYPTED_BACKUP_CIPHER}`;
  return asBufferSource(new TextEncoder().encode(aadText));
}

async function deriveAesGcmKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
  usage: "encrypt" | "decrypt",
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    asBufferSource(new TextEncoder().encode(passphrase)),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: asBufferSource(salt),
      iterations,
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    [usage],
  );
}

export function isEncryptedBackupEnvelope(raw: unknown): raw is EncryptedBackupEnvelope {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return false;
  }
  const candidate = raw as Partial<EncryptedBackupEnvelope>;
  return candidate.format === ENCRYPTED_BACKUP_FORMAT;
}

export type BackupEnvelopeLike = {
  formatVersion: number;
  exportedAt: number;
  source: string;
  containsLearnerEvidence: boolean;
  data: unknown;
};

export async function encryptBackupEnvelope(
  envelope: BackupEnvelopeLike,
  passphrase: string,
  iterations: number = ENCRYPTED_BACKUP_DEFAULT_ITERATIONS,
): Promise<EncryptedBackupEnvelope> {
  if (typeof passphrase !== "string" || passphrase.length < MIN_BACKUP_PASSPHRASE_LENGTH) {
    throw new Error(
      `Mật khẩu mã hóa bản sao lưu phải có ít nhất ${MIN_BACKUP_PASSPHRASE_LENGTH} ký tự.`,
    );
  }
  if (
    !Number.isInteger(iterations) ||
    iterations < ENCRYPTED_BACKUP_MIN_ITERATIONS ||
    iterations > ENCRYPTED_BACKUP_MAX_ITERATIONS
  ) {
    throw new Error("Số vòng lặp PBKDF2 không hợp lệ.");
  }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveAesGcmKey(passphrase, salt, iterations, "encrypt");
  const plaintextBytes = new TextEncoder().encode(JSON.stringify(envelope));

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: asBufferSource(iv),
      additionalData: buildAadBytes(iterations),
      tagLength: 128,
    },
    key,
    asBufferSource(plaintextBytes),
  );

  return {
    format: ENCRYPTED_BACKUP_FORMAT,
    kdf: ENCRYPTED_BACKUP_KDF,
    iterations,
    saltB64: toBase64(salt),
    ivB64: toBase64(iv),
    cipher: ENCRYPTED_BACKUP_CIPHER,
    exportedAt: envelope.exportedAt,
    ciphertextB64: toBase64(new Uint8Array(ciphertextBuffer)),
  };
}

export async function decryptBackupEnvelope(
  raw: unknown,
  passphrase: string,
): Promise<DecryptBackupResult> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: ["Tệp sao lưu mã hóa không hợp lệ."] };
  }
  const candidate = raw as Partial<EncryptedBackupEnvelope>;
  if (candidate.format !== ENCRYPTED_BACKUP_FORMAT) {
    return {
      ok: false,
      errors: [`Định dạng tệp mã hóa không được hỗ trợ: ${String(candidate.format)}.`],
    };
  }
  if (candidate.kdf !== ENCRYPTED_BACKUP_KDF || candidate.cipher !== ENCRYPTED_BACKUP_CIPHER) {
    return {
      ok: false,
      errors: ["Thuật toán mã hóa hoặc dẫn xuất khóa trong tệp không được hỗ trợ."],
    };
  }
  const iterations = candidate.iterations;
  if (
    typeof iterations !== "number" ||
    !Number.isInteger(iterations) ||
    iterations < ENCRYPTED_BACKUP_MIN_ITERATIONS ||
    iterations > ENCRYPTED_BACKUP_MAX_ITERATIONS
  ) {
    return {
      ok: false,
      errors: ["Số vòng lặp PBKDF2 trong tệp sao lưu mã hóa nằm ngoài giới hạn an toàn."],
    };
  }
  if (typeof passphrase !== "string" || passphrase.length === 0) {
    return {
      ok: false,
      errors: ["Tệp sao lưu này đã được mã hóa AES-256-GCM. Vui lòng nhập mật khẩu giải mã."],
    };
  }
  if (
    typeof candidate.saltB64 !== "string" ||
    typeof candidate.ivB64 !== "string" ||
    typeof candidate.ciphertextB64 !== "string"
  ) {
    return {
      ok: false,
      errors: ["Tệp sao lưu mã hóa thiếu dữ liệu salt, IV hoặc bản mã."],
    };
  }

  const salt = fromBase64(candidate.saltB64);
  const iv = fromBase64(candidate.ivB64);
  const ciphertext = fromBase64(candidate.ciphertextB64);
  if (
    !salt ||
    salt.byteLength !== SALT_BYTES ||
    !iv ||
    iv.byteLength !== IV_BYTES ||
    !ciphertext ||
    ciphertext.byteLength <= 16
  ) {
    return {
      ok: false,
      errors: ["Dữ liệu salt, IV hoặc bản mã trong tệp sao lưu bị hỏng."],
    };
  }

  try {
    const key = await deriveAesGcmKey(passphrase, salt, iterations, "decrypt");
    const plaintextBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: asBufferSource(iv),
        additionalData: buildAadBytes(iterations),
        tagLength: 128,
      },
      key,
      asBufferSource(ciphertext),
    );
    const plaintextJson = new TextDecoder().decode(plaintextBuffer);
    const parsed: unknown = JSON.parse(plaintextJson);
    return validateExportEnvelope(parsed);
  } catch {
    return {
      ok: false,
      errors: [
        "Không thể giải mã tệp sao lưu: mật khẩu không đúng hoặc dữ liệu bản mã đã bị thay đổi.",
      ],
    };
  }
}
