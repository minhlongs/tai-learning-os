import { describe, expect, it } from "vitest";

import {
  decryptBackupEnvelope,
  encryptBackupEnvelope,
  ENCRYPTED_BACKUP_CIPHER,
  ENCRYPTED_BACKUP_DEFAULT_ITERATIONS,
  ENCRYPTED_BACKUP_FORMAT,
  ENCRYPTED_BACKUP_KDF,
  isEncryptedBackupEnvelope,
} from "../../src/shared/crypto/backup-cipher";
import {
  TRANSFER_FORMAT_VERSION,
  type ExportEnvelope,
} from "../../src/shared/schemas/transfer";

function sampleEnvelope(): ExportEnvelope {
  return {
    formatVersion: TRANSFER_FORMAT_VERSION,
    exportedAt: 1_700_000_000_000,
    source: "manual_export",
    containsLearnerEvidence: true,
    data: {
      learners: [
        {
          id: "lnr-backup-1",
          nickname: "Tài",
          birthYear: 2016,
          grade: 4,
          timezone: "Asia/Ho_Chi_Minh",
          createdAt: 1_700_000_000_000,
          updatedAt: 1_700_000_000_000,
          archivedAt: null,
        },
      ],
      schoolYears: [],
      subjects: [],
      skills: [],
      skillPrerequisites: [],
      lessons: [],
      lessonSteps: [],
      reviewApprovals: [],
      learningSessions: [],
      learningAttempts: [],
      skillEvidence: [],
      reviewSchedule: [],
      learningGoals: [],
      auditEvents: [],
      schemaVersions: [{ version: 11, description: "Science & Debate parity" }],
    },
  };
}

describe("backup-cipher — Web Crypto AES-256-GCM authenticated backup encryption", () => {
  it("encrypts and decrypts a valid ExportEnvelope round-trip with 600,000 PBKDF2-SHA256 iterations", async () => {
    const original = sampleEnvelope();
    const passphrase = "mat-khau-sao-luu-2026";
    const encrypted = await encryptBackupEnvelope(original, passphrase);

    expect(isEncryptedBackupEnvelope(encrypted)).toBe(true);
    expect(encrypted.format).toBe(ENCRYPTED_BACKUP_FORMAT);
    expect(encrypted.kdf).toBe(ENCRYPTED_BACKUP_KDF);
    expect(encrypted.cipher).toBe(ENCRYPTED_BACKUP_CIPHER);
    expect(encrypted.iterations).toBe(ENCRYPTED_BACKUP_DEFAULT_ITERATIONS);
    expect(encrypted.exportedAt).toBe(original.exportedAt);

    const decrypted = await decryptBackupEnvelope(encrypted, passphrase);
    expect(decrypted.ok).toBe(true);
    if (decrypted.ok) {
      expect(decrypted.envelope).toEqual(original);
    }
  });

  it("produces unique random salt and IV on every encryption of identical plaintext", async () => {
    const original = sampleEnvelope();
    const passphrase = "mat-khau-sao-luu-2026";
    const enc1 = await encryptBackupEnvelope(original, passphrase, 100_000);
    const enc2 = await encryptBackupEnvelope(original, passphrase, 100_000);

    expect(enc1.saltB64).not.toBe(enc2.saltB64);
    expect(enc1.ivB64).not.toBe(enc2.ivB64);
    expect(enc1.ciphertextB64).not.toBe(enc2.ciphertextB64);
  });

  it("refuses short passphrases under 8 characters", async () => {
    await expect(encryptBackupEnvelope(sampleEnvelope(), "short")).rejects.toThrow(
      /ít nhất 8 ký tự/,
    );
  });

  it("fails closed when decrypted with a wrong passphrase", async () => {
    const encrypted = await encryptBackupEnvelope(sampleEnvelope(), "correct-passphrase-1", 100_000);
    const result = await decryptBackupEnvelope(encrypted, "wrong-passphrase-2");
    expect(result.ok).toBe(false);
  });

  it("fails closed when a single byte of ciphertext is tampered with (GCM tag authentication)", async () => {
    const encrypted = await encryptBackupEnvelope(sampleEnvelope(), "correct-passphrase-1", 100_000);
    const rawBytes = Buffer.from(encrypted.ciphertextB64, "base64");
    rawBytes[0] = (rawBytes[0] ?? 0) ^ 0xff;
    const tampered = {
      ...encrypted,
      ciphertextB64: rawBytes.toString("base64"),
    };

    const result = await decryptBackupEnvelope(tampered, "correct-passphrase-1");
    expect(result.ok).toBe(false);
  });

  it("fails closed when AAD-bound envelope metadata (iterations) is modified", async () => {
    const encrypted = await encryptBackupEnvelope(sampleEnvelope(), "correct-passphrase-1", 100_000);
    const tamperedAad = {
      ...encrypted,
      iterations: 100_001,
    };

    const result = await decryptBackupEnvelope(tamperedAad, "correct-passphrase-1");
    expect(result.ok).toBe(false);
  });
});
