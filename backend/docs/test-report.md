# Project Nightfall — Automated QA & Security Verification Report

**Date:** October 29, 2026  
**Test Framework:** Vitest v3.2.7 with Supertest  
**Database:** PostgreSQL 18 (Local Instance `localhost:5432/nightfall`)  
**Execution Environment:** Node.js v22.22.3, Windows x64  
**Status:** **25 Passed / 0 Failed (100% Passing)**

---

## 📋 Test Summary

| Test Suite File | Domain / Focus | Tests Executed | Status | Duration |
| :--- | :--- | :--- | :--- | :--- |
| `tests/unit/pricing.test.ts` | Server Pricing Engine | 4 | ✅ Passed | 9 ms |
| `tests/security/auth-rbac.test.ts` | Authentication & RBAC | 6 | ✅ Passed | 298 ms |
| `tests/integration/payments-idempotency.test.ts` | Payments & Idempotency | 2 | ✅ Passed | 326 ms |
| `tests/concurrency/job-claiming.test.ts` | Atomic Concurrency & Leases | 4 | ✅ Passed | 272 ms |
| `tests/recovery/failure-recovery.test.ts` | Physical Uncertainty Recovery | 1 | ✅ Passed | 224 ms |
| `tests/integration/e2e-workflow.test.ts` | Full Lifecycle End-to-End Workflow | 8 | ✅ Passed | 645 ms |
| **Total** | **All Critical Domains** | **25 Tests** | ✅ **All Passed** | **5.08 s** |

---

## 🔍 Detailed Test Cases & Results

### 1. Pricing Engine (`tests/unit/pricing.test.ts`)
- ✅ **Test 1.1:** Color print calculation ($0.35/page, 8% tax) with 2-decimal rounding precision.
- ✅ **Test 1.2:** Monochrome print calculation ($0.08/page, 8% tax).
- ✅ **Test 1.3:** Paper size multiplier scaling (1.5x for A3 dimensions).
- ✅ **Test 1.4:** Input boundary enforcement: Rejection of zero or negative page/copy counts.

### 2. Authentication & Security Enforcement (`tests/security/auth-rbac.test.ts`)
- ✅ **Test 2.1:** Rejects unauthenticated requests with HTTP 401 (`UNAUTHORIZED`).
- ✅ **Test 2.2:** Rejects tampered / forged tokens with HTTP 401 (`INVALID_TOKEN`).
- ✅ **Test 2.3:** Allows authorized Administrator to access administrative operations.
- ✅ **Test 2.4:** Blocks ordinary customers from invoking operator/admin endpoints (HTTP 403 `FORBIDDEN`).
- ✅ **Test 2.5:** Data isolation: Customer A cannot view or access Customer B's private orders or documents (HTTP 403 `ACCESS_DENIED`).
- ✅ **Test 2.6:** Reject revoked kiosk credentials: Kiosks with `isRevoked: true` are blocked immediately (HTTP 403 `KIOSK_REVOKED`).

### 3. Payments & Idempotency (`tests/integration/payments-idempotency.test.ts`)
- ✅ **Test 3.1:** Ignores any client-tampered price payload (`clientTotalAmount: 0.01`) and enforces the authoritative server-calculated price.
- ✅ **Test 3.2:** Processes payment, transitions order to `Queued`, and enqueues a `PrintJob`.
- ✅ **Test 3.3:** **Idempotent Duplicate Protection:** Re-submitting the exact same payment request with the identical `idempotencyKey` returns HTTP 200 with `idempotentReplay: true`, returning the original receipt without creating a second print job.
- ✅ **Test 3.4:** Verifies database uniqueness constraint ensures exactly one `PrintJob` exists.

### 4. Concurrency & Atomic Claim Leases (`tests/concurrency/job-claiming.test.ts`)
- ✅ **Test 4.1:** **Race Condition Simulation:** Two parallel kiosk workers simultaneously issue claim requests for the same queued job.
  - **Result:** Exactly 1 worker receives the job and lease (`CLAIMED`); the second worker receives `null` (HTTP 204 No Content). Zero duplicate assignments.
- ✅ **Test 4.2:** Rejects progress reporting from an unauthorized kiosk that did not lease the job (HTTP 403 `WRONG_KIOSK`).
- ✅ **Test 4.3:** **Monotonic Sequence Protection:** Rejects regressive or stale progress updates (e.g. attempting to send 30% after 50% was already recorded).
- ✅ **Test 4.4:** Idempotent job completion: Re-sending completion reports returns success without duplicate database increments.

### 5. Failure Recovery & Physical Uncertainty Safety (`tests/recovery/failure-recovery.test.ts`)
- ✅ **Test 5.1:** When physical printer outcome is ambiguous (paper feed failure, power glitch), transitions job status to `UNCERTAIN` instead of blindly re-printing.
- ✅ **Test 5.2:** Automatically dispatches an `Error` severity incident and flags kiosk state as `Error`.
- ✅ **Test 5.3:** Operator resolution of the incident clears the fault and restores the kiosk to `Online` status.

### 6. Full Lifecycle End-to-End Workflow (`tests/integration/e2e-workflow.test.ts`)
- ✅ **Test 6.1:** Authenticates customer and retrieves user profile (`GET /api/v1/auth/me`).
- ✅ **Test 6.2:** Uploads a document with multipart file validation and HMAC storage key generation (`POST /api/v1/documents/upload`).
- ✅ **Test 6.3:** Creates order with authoritative server-side pricing, overriding client-tampered prices (`POST /api/v1/orders`).
- ✅ **Test 6.4:** Executes simulated payment with idempotency key and enqueues job (`POST /api/v1/payments/simulate`).
- ✅ **Test 6.5:** Kiosk K04 securely authenticates with kiosk mutual credentials and claims the assigned job (`POST /api/v1/kiosks/K04/jobs/claim`).
- ✅ **Test 6.6:** Kiosk reports monotonic printing progress (25% -> 75%) (`POST /api/v1/kiosks/K04/jobs/:id/progress`).
- ✅ **Test 6.7:** Kiosk completes the print job and marks order as `Completed` (`POST /api/v1/kiosks/K04/jobs/:id/complete`).
- ✅ **Test 6.8:** Verifies that the immutable audit trail captures the complete sequence (`GET /api/v1/audit-logs`).
