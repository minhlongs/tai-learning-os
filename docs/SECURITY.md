# TAI LEARNING OS — Security & Privacy Architecture

> **Security & Threat Model.** This document specifies the security boundaries, cryptographic controls,
> authorization rules, and threat mitigation strategies implemented in TAI LEARNING OS.
> Bilingual summary: Tài liệu đặc tả chính sách an toàn thông tin, bảo vệ tài khoản phụ huynh và quyền riêng tư của trẻ em.

---

## 1. Threat Model & Security Posture

TAI LEARNING OS operates as a local-first system serving a household. Its threat model accounts for:

| Threat Category | Potential Vector | Mitigation Implemented |
|---|---|---|
| **Learner tampering** | Tampering with client-side code / devtools to bypass steps or fake scores | Answer keys and grading are completely withheld from the browser. Correctness is evaluated exclusively by Worker code; explanations are unlocked only upon a valid, server-verified attempt. Server-side `hint.requested` audit records prevent `helpLevel: 0` spoofing after viewing hints, and `attemptNo === 1` prevents brute-force guessing from counting as independent mastery. |
| **Credential guessing & brute-force** | Repeated brute-force login attempts against parent account | Rate limiter `AUTH_RATE_LIMITER` restricts login calls to 5 attempts per 60 seconds per client bucket (`clientKey`). Passwords hashed using PBKDF2-SHA256 (60,000 iterations) with automatic rehash upgrade on login. |
| **Cross-Site Request Forgery (CSRF)** | Malicious third-party tabs executing mutating actions via ambient cookies | Double-submit CSRF mechanism plus `Origin` header validation: mutating endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) require a matching `Origin` host and the `x-tlo-csrf` header matching the HMAC-derived token tied to the current session's `tokenId`. |
| **Cross-Site Scripting (XSS)** | Injection of malicious scripts in exercise content or learner notes | React 19 auto-escapes string content. Strict Content-Type headers (`application/json; charset=utf-8`). Session cookie is marked `HttpOnly` and `SameSite=Strict`. |
| **Data leakage across boundaries** | Accidental multi-tenant leakage or orphaned queries | Owner-scoped SQL repository design: every query reading or updating learner data joins/filters explicitly on `parent_id`. |
| **Accidental data destruction** | Unintentional deletion of learning history or attempts | Deletion requires an explicit, case-sensitive confirmation string matching the format `XOA <LearnerNickname>`. Audit log records deletion metadata permanently. |

---

## 2. Authentication & Credential Architecture

### 2.1 Password Hashing
- **Algorithm**: PBKDF2 with HMAC-SHA256.
- **Iteration Count**: 60,000 iterations (encoded into the serialized string for forward compatibility and automatic rehashing).
- **Salt**: 16 bytes cryptographically strong random salt generated per password via `crypto.getRandomValues`.
- **Timing-Attack Resistance**: Verification uses constant-time string comparison (`timingSafeEqual`) to prevent side-channel timing disclosures.
- **Constraints**: Minimum 10 characters, maximum 200 characters.

### 2.2 Stateless Session Management
- **Token Type**: HMAC-SHA256 signed stateless token holding `sub` (parent ID), `displayName`, `iat`, `exp`, and `jti` (unique token ID).
- **Transport**: `HttpOnly`, `SameSite=Strict` cookie (`tlo_session`). `Secure` flag is enforced in production/HTTPS environments.
- **Lifespan**: 8 hours (28,800 seconds). No refresh token; expired sessions require explicit re-authentication.

### 2.3 Double-Submit CSRF Defense
- On `/api/session/login`, the server returns a `csrfToken` computed via `HMAC-SHA256(secret, "csrf:" + tokenId)`.
- Client stores this value in memory (`csrf-store.ts`) and attaches it as `x-tlo-csrf` on every state-changing request.
- The Worker validates that the header matches the cryptographically signed `jti` inside the session cookie before invoking the handler.

---

## 3. Data Protection & Child Privacy by Design

1. **Zero High-Risk Child Identifiers**:
   - No legal names, phone numbers, email addresses, or physical addresses are stored.
   - Child profile only contains a friendly nickname (e.g., "Tài"), birth year (for age-appropriate grade defaults), and timezone.
2. **Local Storage Only**:
   - Database lives in local Cloudflare D1 (SQLite) under the user's local operating system profile.
   - No remote analytics, telemetry beacons, crash reporting pings, or AI training pipelines exist.
3. **Audit Trail**:
   - `audit_events` stores an append-only log of critical lifecycle events (`parent.login`, `lesson.approve`, `data.exported`, `learner.enrolled`, `learner.deleted`).
   - Audit details contain only non-sensitive structured metadata.

---

## 4. Production Release Gates & Prohibitions

- **No Remote Deployment**: Deploying to public Cloudflare Workers (`wrangler deploy`) is strictly prohibited without explicit founder authorization and completion of external compliance audits.
- **Fail-Closed Operations**: If secrets (`SESSION_SECRET`, `PARENT_PASSWORD_HASH`) are missing or malformed, the Worker refuses requests with a uniform error rather than falling back to default credentials.
