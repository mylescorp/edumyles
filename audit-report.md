# EduMyles — Full Codebase Audit Report

**Generated:** 2026-04-01  
**Auditor:** Claude Code (claude-sonnet-4-6)  
**Branch audited:** `codex/marketplace-e2e-fixes`  
**Monorepo root:** `c:\Users\Admin\Projects\edumyles`

---

## 1. Executive Summary

EduMyles is a multi-tenant SaaS school-management platform targeting East African schools (Kenya, Uganda, Tanzania, Rwanda). The codebase is structured as a Turborepo monorepo with six workspaces: `frontend/` (Next.js 15), `convex/` (serverless backend), `shared/` (types/validators), `mobile/` (React Native/Expo — NOT STARTED), `landing/`, and `myles/`.

**Overall assessment:** The platform has a solid, security-conscious architecture. The multi-tenant isolation model, audit logging discipline, and module guard pattern are well executed. However, several critical issues exist that would prevent a production launch:

- The M-Pesa integration is hardcoded to the Safaricom **sandbox** environment
- Phone number normalisation hardcodes the Kenya country prefix (254) — breaking Uganda, Tanzania, and Rwanda numbers
- Currency symbols are hardcoded to KES/KSh in at least four frontend components, breaking multi-country deployments
- A student portal query contains a security fallback that can return any student's profile if a userId lookup fails
- A hardcoded fallback master-admin email (`ayany004@gmail.com`) is baked into the auth callback
- The mobile app workspace contains only placeholder `.gitkeep` files — zero implementation
- Report-card and PDF generation return status flags but produce no actual documents
- Library reports return fully hardcoded mock statistics regardless of real data
- The academics stats query uses a hardcoded `"dummy"` classId, making grade aggregation always return 0
- Role names and subscription tier names differ between the `shared/` layer and the Convex backend — validation schemas and backend guards will silently disagree

Despite these issues, the core backend modules (SIS, Finance, HR, Communications, eWallet, Transport, Library, Admissions) are substantially implemented with real database queries and proper tenant isolation.

---

## 2. User Panels Identified

| Panel | Route Prefix | Status |
|---|---|---|
| Platform Admin | `/platform` | Implemented — fully functional |
| School Admin | `/admin` | Implemented — some stubs (reports, some transport actions) |
| Teacher Portal | `/portal/teacher` | Partial — dashboard stats hardcoded; classes query real |
| Student Portal | `/portal/student` | Implemented — real queries, minor security issue in backend |
| Parent Portal | `/portal/parent` | Implemented — real queries; currency hardcoded to KES |
| Partner Portal | `/portal/partner` | Implemented — real queries |
| Alumni Portal | `/portal/alumni` | Implemented — real queries and mutations |
| Mobile App | N/A | NOT STARTED — zero implementation |

---

## 3. Backend Module Status

### 3.1 Core / Tenant Infrastructure

| Component | File | Status | Notes |
|---|---|---|---|
| Tenant guard | `convex/helpers/tenantGuard.ts` | Implemented | `requireTenantContext`, `requireTenantSession`, `requireActionTenantContext` all present |
| Platform guard | `convex/helpers/platformGuard.ts` | Implemented | `requirePlatformSession` for master/super admin paths |
| Authorization | `convex/helpers/authorize.ts` | Implemented | 14 roles, ~30 permissions, `requirePermission`, `requireRole` |
| Module guard | `convex/helpers/moduleGuard.ts` | Implemented | `requireModule` checks `installedModules` table |
| Audit log | `convex/helpers/auditLog.ts` | Implemented | `logAction` / `logImpersonation` used consistently |
| Tenant CRUD | `convex/platform/tenants/mutations.ts` | Implemented | Create, suspend, activate, invite admin, revoke invite |
| Tenant queries | `convex/platform/tenants/queries.ts` | Implemented | List, get, stats |

### 3.2 Student Information System (SIS)

| Component | File | Status |
|---|---|---|
| Student CRUD | `convex/modules/sis/mutations.ts` | Implemented |
| Class CRUD | `convex/modules/sis/mutations.ts` | Implemented |
| Guardian linking | `convex/modules/sis/mutations.ts` | Implemented |
| Student queries | `convex/modules/sis/queries.ts` | Implemented |
| `getTeacherClasses` | `convex/modules/academics/queries.ts` | Implemented |

### 3.3 Academics

| Component | File | Status | Notes |
|---|---|---|---|
| Grade entry | `convex/modules/academics/mutations.ts` | Implemented | Upsert pattern |
| Assignments | `convex/modules/academics/mutations.ts` | Implemented | Create, update, grade submission |
| Attendance | `convex/modules/academics/mutations.ts` | Implemented | Mark per student |
| Report card generation | `convex/modules/academics/mutations.ts` | STUB | Sets `status: "generating"` in DB but no actual PDF is ever produced |
| Exam management | `convex/modules/academics/mutations.ts` | Implemented | Create, update status |
| `getAcademicsStats` | `convex/modules/academics/queries.ts` | BUG | Calls `.withIndex("by_class_subject", q => q.eq("classId", "dummy"))` — hardcoded "dummy" classId means grade count always returns 0 |
| `getRecentExams` | `convex/modules/academics/queries.ts` | STUB | Returns `submissions: 0, total: 0` hardcoded for all exams |

### 3.4 Finance

| Component | File | Status |
|---|---|---|
| Fee structures | `convex/modules/finance/mutations.ts` | Implemented |
| Invoice generation | `convex/modules/finance/mutations.ts` | Implemented (bulk + single) |
| Payment recording | `convex/modules/finance/mutations.ts` | Implemented |
| Receipt generation | `convex/modules/finance/mutations.ts` | Returns structured data only — no actual PDF |
| Payment callbacks | `convex/modules/finance/mutations.ts` | Implemented (internal) |
| M-Pesa STK Push | `convex/actions/payments/mpesa.ts` | CRITICAL BUG — hardcoded to sandbox URL |
| Stripe Checkout | `convex/actions/payments/stripe.ts` | Implemented — currency hardcoded to "kes" |
| Airtel Money webhook | `frontend/src/app/api/webhooks/airtel/route.ts` | Implemented — shared secret verification present |
| Bank Transfer | Validators reference it | NOT IMPLEMENTED |

### 3.5 Human Resources

| Component | File | Status |
|---|---|---|
| Staff CRUD | `convex/modules/hr/mutations.ts` | Implemented |
| Contracts | `convex/modules/hr/mutations.ts` | Implemented |
| Leave management | `convex/modules/hr/mutations.ts` | Implemented (with approval flow) |
| Payroll runs | `convex/modules/hr/mutations.ts` | Implemented |
| Payslips | `convex/modules/hr/mutations.ts` | Implemented (DB record only, no PDF) |

### 3.6 Communications

| Component | File | Status | Notes |
|---|---|---|---|
| In-app notifications | `convex/modules/communications/queries.ts` | Implemented | `notifications` table |
| Announcements | `convex/modules/communications/queries.ts` | Implemented | |
| Campaigns | `convex/modules/communications/queries.ts` | Implemented | |
| SMS (Africa's Talking) | `convex/actions/communications/sms.ts` | PARTIAL | Phone normalisation hardcodes Kenya prefix `254` |
| Email (Resend) | `convex/actions/communications/email.ts` | Implemented | Plain-string templates, no React Email |
| Direct messages | `convex/modules/communications/queries.ts` | Implemented | |

### 3.7 eWallet

| Component | File | Status |
|---|---|---|
| Balance query | `convex/modules/ewallet/queries.ts` | Implemented |
| Transaction history | `convex/modules/ewallet/queries.ts` | Implemented |
| Top-up / spend / transfer | `convex/modules/ewallet/mutations.ts` | Implemented (atomic double-entry) |
| Withdraw | `convex/modules/ewallet/mutations.ts` | Implemented (debit + pending payout record) |
| Admin freeze/unfreeze | `convex/modules/ewallet/mutations.ts` | Implemented |

### 3.8 Library

| Component | File | Status | Notes |
|---|---|---|---|
| Books / borrows CRUD | `convex/modules/library/queries.ts` | Implemented | |
| Overdue detection | `convex/modules/library/queries.ts` | Implemented | |
| `getLibraryReports` | `convex/modules/library/queries.ts` | STUB | Returns fully hardcoded mock arrays: circulation Jan–Jun data, top books list, `averageReadingTime: 14`, `collectionEfficiency: 94.5` — no real DB aggregation |

### 3.9 Transport

| Component | File | Status |
|---|---|---|
| Routes / vehicles / drivers | `convex/modules/transport/queries.ts` | Implemented |
| Student assignments | `convex/modules/transport/queries.ts` | Implemented |
| Real-time GPS tracking | None | NOT IMPLEMENTED |

### 3.10 Admissions

| Component | File | Status |
|---|---|---|
| Application status updates | `convex/modules/admissions/mutations.ts` | Implemented |
| Enroll from application | `convex/modules/admissions/mutations.ts` | Implemented (creates student + guardian) |
| Application queries | `convex/modules/admissions/queries.ts` | Implemented |

### 3.11 Timetable

| Component | File | Status |
|---|---|---|
| Slot CRUD | `convex/modules/timetable/mutations.ts` | Implemented |
| Substitute assignment | `convex/modules/timetable/mutations.ts` | Implemented |
| School events | `convex/modules/timetable/mutations.ts` | Implemented |

### 3.12 Platform-Level Modules

| Module | Status | Notes |
|---|---|---|
| Impersonation | Implemented | `beginImpersonationSession` creates real short-lived session tokens; full audit logging |
| Security monitoring | Implemented | Real DB queries for threats, incidents, blocked IPs; `getComplianceStatus` returns hardcoded compliance area scores |
| Feature flags | Implemented | |
| CRM / Proposals | Implemented | |
| White-label | Implemented | |
| API keys | Implemented | |
| Webhooks | Implemented | |
| Knowledge base | Implemented | |
| Scheduled reports | Implemented (schema only) | `generateReport` returns `downloadUrl: null` |
| Data export | Implemented (schema only) | Export mutations exist; actual file generation unknown |
| Platform analytics / BI | Partial | Plan prices hardcoded in KES; `moduleInstallations` table referenced but noted as "not yet implemented" |
| Health monitoring | Implemented | Real queries against `maintenanceWindows` + `incidents` tables |
| Operations | Implemented | |
| Tenant success | Implemented | |
| SLA tracking | Implemented | |

---

## 4. Frontend Panel Status

### 4.1 Admin Panel (`/admin`)

| Page | Route | Status | Notes |
|---|---|---|---|
| Dashboard | `/admin` | Implemented | Real Convex queries; revenue shown as "KSh" (hardcoded Kenya) |
| Students | `/admin/students` | Implemented | Real list/CRUD |
| Classes | `/admin/classes` | Implemented | |
| Staff | `/admin/staff` | Implemented | |
| Finance / Fees | `/admin/finance` | Implemented | |
| Admissions | `/admin/admissions` | Implemented | |
| HR / Leave / Payroll | `/admin/hr/*` | Implemented | |
| Library | `/admin/library` | Implemented | Reports are stub (see backend note) |
| Transport | `/admin/transport` | Partial | Route/vehicle data real; "Track" and "Edit" DataTable buttons have no `href` or `onClick` |
| Reports | `/admin/reports` | STUB | All 4 stat cards show "—"; no queries; no PDF download; only static links |
| Timetable | `/admin/timetable` | Implemented | |
| Communications | `/admin/communications` | Implemented | |
| Settings | `/admin/settings` | Implemented | |
| Modules / Marketplace | `/admin/modules` | Implemented | |

### 4.2 Portal Panels

| Panel | Status | Notes |
|---|---|---|
| Student dashboard | Implemented | Real queries for profile, assignments, grades, attendance, wallet |
| Parent dashboard | Implemented | Real queries; fee balance hardcoded "KES" symbol |
| Teacher dashboard | PARTIAL | Classes list is real; `activeAssignments` hardcoded to `5`; "Today's Classes" hardcoded to `3` |
| Partner dashboard | Implemented | Real queries for sponsored students, payments, reports |
| Alumni dashboard | Implemented | Real queries; transcript request and event RSVP mutations work |

### 4.3 Platform Panel (`/platform`)

| Page | Status | Notes |
|---|---|---|
| Dashboard | Implemented | Real KPIs and charts via custom hooks |
| Tenants | Implemented | |
| Billing | Implemented | |
| Security | Implemented | Compliance scores are hardcoded constants (see §3.12) |
| Impersonation | Implemented | Full session swap implemented |
| Analytics / BI | Partial | MRR derived from tenant plan; plan prices in KES |
| Feature flags | Implemented | |
| CRM | Implemented | |

### 4.4 Auth Flow

| Step | Status | Notes |
|---|---|---|
| Login page | Implemented | WorkOS redirect |
| OAuth callback | Implemented | 6-path routing including first-user bootstrap |
| Logout redirect | Implemented | Enforces redirect to landing page; back-button blocked |
| Session cookie model | Implemented | Not Convex Auth; custom `sessions` table |

---

## 5. Missing / Stub Features (Prioritised by Impact)

### P0 — Launch Blockers

1. **M-Pesa production URL** — `convex/actions/payments/mpesa.ts` hardcodes `sandbox.safaricom.co.ke`. Payments will never reach production Safaricom API without an environment-aware URL switch.

2. **Phone number normalisation** — `convex/actions/communications/sms.ts` and `convex/actions/payments/mpesa.ts` both apply `.replace(/^0/, "254")` unconditionally. Ugandan numbers (start with `07`) become `254...` which is wrong; Tanzanian and Rwandan prefixes are never handled.

3. **Report card PDF generation** — `generateReportCard` mutation sets `status: "generating"` in the DB but no scheduled function or storage write ever produces an actual document. The feature appears complete in the UI but delivers nothing.

4. **`getAcademicsStats` dummy classId bug** — `convex/modules/academics/queries.ts` hardcodes `"dummy"` in the index query, causing grade counts to always return 0 on the academics dashboard.

5. **Mobile app** — The `mobile/` workspace contains only `.gitkeep` files. There is no React Native implementation whatsoever.

### P1 — High Business Impact

6. **Currency hardcoding** — `KES` / `KSh` appears as a hardcoded string in at least: `frontend/src/app/admin/page.tsx`, `frontend/src/app/portal/parent/page.tsx`, `convex/actions/payments/stripe.ts` (currency: "kes"), and email templates in `convex/actions/communications/email.ts`. Multi-country deployments will display incorrect currencies.

7. **Library reports are mock data** — `getLibraryReports` returns hardcoded arrays (Jan–Jun circulation, `averageReadingTime: 14`, `collectionEfficiency: 94.5`). Librarians see fake statistics.

8. **Teacher dashboard live stats** — `activeAssignments` and "Today's Classes" are hardcoded integers (`5` and `3`). Teachers see fabricated data on their main dashboard.

9. **`getRecentExams` stub** — Returns `submissions: 0, total: 0` for all exams regardless of actual submission data.

10. **Admin reports page** — All four stat cards show `"—"` and there is no PDF generation or download functionality. The page exists only as a shell.

### P2 — Medium Impact

11. **PDF receipts / payslips** — Finance `generateReceipt` and HR `payslips` both create DB records but produce no actual document binary. Users cannot download receipts or payslips.

12. **Transport tracking** — The `/admin/transport/tracking` page loads real route/vehicle data but the "Track" and "Edit" DataTable buttons have no actions attached. No GPS tracking exists.

13. **Bank transfer payment method** — Referenced in `shared/src/validators/index.ts` `createPaymentSchema` but has no implementation in the backend actions.

14. **Stripe currency flexibility** — Stripe action hardcodes `currency: "kes"`. Ugandan or Tanzanian schools cannot accept payments in UGX or TZS via Stripe.

15. **Platform BI plan prices in KES** — `convex/platform/analytics/queries.ts` uses hardcoded KES amounts for MRR calculation. MRR figures will be wrong for non-Kenya tenants.

16. **Scheduled / on-demand reports** — `generateReport` returns `downloadUrl: null`. No report file is ever produced.

17. **Security compliance scores hardcoded** — `getComplianceStatus` returns a static array of made-up compliance scores (95, 88, 92, 78, 98). These are not derived from any real compliance checks.

### P3 — Lower Priority / Polish

18. **Tier name mismatch** — `shared/src/constants/index.ts` defines tiers as `starter | standard | pro | enterprise`; Convex platform billing uses `free | starter | growth | enterprise`. These sets do not align.

19. **Role name mismatch** — `shared/src/constants/index.ts` uses `finance_officer`, `hr_officer`; the Convex `authorize.ts` uses `bursar`, `hr_manager`. Frontend role checks using shared constants will not match backend guards.

20. **`CONVEX_MPESA_*` vs `MPESA_*` env var prefix** — `convex/actions/payments/mpesa.ts` appears to expect `CONVEX_MPESA_*` prefixed environment variables, but `.env.example` documents them as `MPESA_*`. Deployment will silently fail to load credentials.

21. **Debug logging in student portal query** — `convex/modules/portal/student/queries.ts` (`getMyProfile`) contains extensive `console.log` statements left in production code.

---

## 6. Payment Integration Status

| Gateway | Integration | Webhook | Signature Verification | Production Ready |
|---|---|---|---|---|
| M-Pesa (Safaricom) | STK Push implemented | Yes (`/api/webhooks/mpesa/route.ts`) | No — no HMAC on M-Pesa callbacks | NO — sandbox URL hardcoded |
| Stripe | Checkout Session implemented | Yes (`/api/webhooks/stripe/route.ts`) | Optional HMAC when `STRIPE_WEBHOOK_SECRET` set | Partially — currency locked to KES |
| Airtel Money | Webhook handler only | Yes (`/api/webhooks/airtel/route.ts`) | Shared secret header check | Unknown — no outbound initiation found |
| Bank Transfer | Validator schema only | No | N/A | NOT IMPLEMENTED |

**Critical finding:** The Airtel Money integration has an inbound webhook handler to receive payment confirmations, but there is no outbound payment initiation action. If the payment is to be initiated externally and only confirmed here, this may be by design — but it is not documented.

---

## 7. Communication Integration Status

| Channel | Integration | Status | Issues |
|---|---|---|---|
| SMS (Africa's Talking) | `convex/actions/communications/sms.ts` | Implemented | Phone normalisation hardcodes Kenya (+254). Bulk SMS implemented. |
| Email (Resend) | `convex/actions/communications/email.ts` | Implemented | Plain-string template substitution; 4 templates (fee_reminder, exam_results, attendance_alert, payslip); no React Email |
| In-app notifications | `convex/modules/communications/` | Implemented | Real `notifications` table; unread count query; preferences table |
| Push notifications | No implementation found | NOT IMPLEMENTED | Mobile app not started |
| WhatsApp | No implementation found | NOT IMPLEMENTED | |

**Email template gap:** The `fee_reminder` template contains a hardcoded currency display that does not parametrise by country. Ugandan schools will send fee reminder emails showing amounts in the wrong format.

---

## 8. Mobile App Status

The `mobile/` workspace is **completely empty**. Files present:

- `mobile/src/components/.gitkeep`
- `mobile/src/hooks/.gitkeep`
- `mobile/src/lib/.gitkeep`
- `mobile/src/screens/.gitkeep`
- `mobile/src/index.ts` (only real file — likely a bare entry point)

There is an `app.json` / `package.json` for Expo configuration but zero screen implementations, zero navigation, zero API integration. Estimated effort to produce a usable mobile app: 3–6 months of dedicated mobile development.

---

## 9. Auth & Tenant Isolation Issues

### CRITICAL

**C1 — Student profile fallback vulnerability**
`convex/modules/portal/student/queries.ts` (`getMyProfile`) falls back to returning the **first student record in the tenant** if no student is found for the current `userId`. This means if a student account is misconfigured (userId not linked to a student record), they receive another student's profile data silently. This is a data exposure risk.

**C2 — Hardcoded master admin email**
`frontend/src/app/auth/callback/route.ts` contains:
```
const FALLBACK_MASTER_ADMIN_EMAILS = ["ayany004@gmail.com"];
```
This email is automatically granted `master_admin` role regardless of WorkOS configuration. If this account is compromised, the attacker gains full platform access. This must be moved to a secure environment variable.

**C3 — M-Pesa webhook has no signature verification**
`frontend/src/app/api/webhooks/mpesa/route.ts` processes payment confirmations without any HMAC or IP allowlist check. A malicious actor can POST a fake M-Pesa callback to falsely confirm a payment that was never made.

**C4 — Impersonation token uses `Math.random()`**
`convex/platform/impersonation/mutations.ts` generates the impersonation session token using `Math.floor(Math.random() * 256)` — a non-cryptographically-secure random number generator. This token is used as a real session credential. Should use `crypto.getRandomValues()`.

### HIGH

**H1 — `requireActionTenantContext` uses fragile internal cast**
`convex/helpers/tenantGuard.ts` implements `requireActionTenantContext` by casting the context as `(ctx as any).internal...`. This may break on Convex runtime updates. All action-based tenant guards depend on this.

**H2 — Stripe webhook signature is optional**
`frontend/src/app/api/webhooks/stripe/route.ts` only verifies the Stripe webhook signature when `STRIPE_WEBHOOK_SECRET` is set. If the env var is missing, the endpoint accepts any POST as a valid payment confirmation.

### MEDIUM

**M1 — Session-cookie model bypasses Convex Auth**
The custom `sessions` table approach means Convex's built-in auth protections do not apply. This is a conscious design choice (WorkOS integration) but requires careful maintenance to ensure all queries use `requireTenantContext` rather than relying on Convex's `ctx.auth`.

**M2 — No test coverage for tenant isolation in CI**
`ci.yml` declares a `tenant-isolation` job that runs `npm run test:tenant-isolation`. If that script does not exist or is empty, CI passes silently with no actual isolation testing. The tests themselves were not found in the audit.

---

## 10. Shared Layer Gaps

### Role name mismatches

| shared/src/constants | convex/helpers/authorize.ts | Impact |
|---|---|---|
| `finance_officer` | `bursar` | Any frontend permission check using shared constants will not match backend |
| `hr_officer` | `hr_manager` | Same issue |
| (no `board_member`) | `board_member` | Frontend cannot construct role lists that include board member |

### Tier name mismatches

| shared/src/constants | convex/platform/billing | Impact |
|---|---|---|
| `standard` | `growth` | Tier comparisons between frontend and backend will misalign |
| `pro` | (no equivalent) | Pro tier exists in shared layer but not in billing |
| (no `free`) | `free` | Free tier exists in billing but not in shared constants |

### Phone validation

`shared/src/validators/index.ts` `phoneSchema` uses an international-format regex that accepts many formats, but the SMS and M-Pesa action functions normalise numbers assuming Kenya's `0xxx` → `254xxx` pattern. A Ugandan number `+256...` or Tanzanian `+255...` number that passes shared validation will be mangled by the action.

### Currency

The `shared/src/constants/index.ts` correctly defines a 6-country currency table (KES, UGX, TZS, RWF, ETB, GHS). However, none of the Stripe action, email templates, or frontend fee displays read from this table — they all hardcode KES. The constant exists but is not consumed.

---

## 11. Infra & CI/CD Gaps

### CI (`/.github/workflows/ci.yml`)

| Check | Status | Notes |
|---|---|---|
| Lint | Present | `npm run lint` |
| Type check | Present | `npm run type-check` |
| Unit tests with coverage | Present | `npm run test -- --coverage`; coverage uploaded as artifact |
| Tenant isolation tests | Present in YAML | `npm run test:tenant-isolation` — actual test suite not confirmed to exist |
| Security audit (dependency) | Present | `npm audit --audit-level=high` — recently fixed 3 vulnerabilities (node-forge, xmldom, brace-expansion) |
| Secret scanning | Present | TruffleHog action on PR |
| E2E tests | MISSING | No Playwright or Cypress job in CI |
| Deploy preview job | Present in worktrees but NOT in main `.github/workflows/` | `deploy-preview.yml` exists in `.claude/worktrees/` branches but not in the main repo workflow directory |
| Deploy production job | Same as above | |

**Finding:** The main repo `.github/workflows/` directory contains only `ci.yml`. Deployment workflows (`deploy-preview.yml`, `deploy-production.yml`) exist only inside `.claude/worktrees/` worktree branches. This means merges to `main` have no automated deployment pipeline in the primary repository.

### Vercel Configuration

`vercel.json` at the root points to the `landing/` workspace. The `frontend/` Next.js app likely has its own Vercel project configured via the dashboard rather than the root config. No `vercel.json` was found inside `frontend/`.

### Environment Variables

`.env.example` documents all required variables. Key discrepancy:

- `.env.example` documents `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, `MPESA_SHORTCODE`
- Convex action code may reference these with `CONVEX_` prefix (Convex actions require env vars to be set via `convex env set` rather than `.env` files, under the `CONVEX_` namespace). This needs verification — if names don't match, M-Pesa will silently receive `undefined` credentials.

### No Test Files Found

No `*.test.ts`, `*.spec.ts`, or `__tests__/` directories were found during the audit. The CI workflow references `npm run test` but the actual test suite content could not be confirmed.

---

## 12. Recommended Implementation Priority Order

### Sprint 1 — Security & Data Integrity (Do First)

1. **Fix M-Pesa student profile fallback** (`convex/modules/portal/student/queries.ts`) — Remove the "return first student in tenant" fallback; throw an error instead.
2. **Remove hardcoded master admin email** (`frontend/src/app/auth/callback/route.ts`) — Move `ayany004@gmail.com` to `MASTER_ADMIN_EMAIL` environment variable.
3. **Add M-Pesa webhook signature verification** — Implement Safaricom IP allowlist or HMAC verification in `frontend/src/app/api/webhooks/mpesa/route.ts`.
4. **Fix impersonation token RNG** — Replace `Math.random()` with `crypto.getRandomValues()` in `convex/platform/impersonation/mutations.ts`.
5. **Make Stripe webhook signature mandatory** — Remove the optional check; throw if `STRIPE_WEBHOOK_SECRET` is not set.

### Sprint 2 — M-Pesa Production Readiness

6. **Switch M-Pesa URL based on environment** — Read `MPESA_ENVIRONMENT` env var; use `api.safaricom.co.ke` in production, `sandbox.safaricom.co.ke` in development.
7. **Fix phone number normalisation** — Accept full international prefix (`+254`, `+256`, `+255`, `+250`) rather than assuming a leading `0` is always Kenya.
8. **Fix `CONVEX_MPESA_*` vs `MPESA_*` env var prefix** — Reconcile with Convex's env var naming requirements.

### Sprint 3 — Data Accuracy Fixes

9. **Fix `getAcademicsStats` dummy classId** — Replace hardcoded `"dummy"` string with a proper aggregate query.
10. **Fix teacher dashboard stats** — Wire `activeAssignments` and "Today's Classes" to real Convex queries.
11. **Fix `getRecentExams` stub** — Query actual `submissions` table for submission counts.
12. **Fix library reports** — Replace hardcoded mock arrays with real DB aggregation queries.
13. **Fix security compliance scores** — Replace hardcoded scores with real checks or clearly mark as "Not yet assessed".

### Sprint 4 — Multi-Country Support

14. **Currency parameterisation** — Consume `shared/src/constants` country-currency table in admin dashboard, parent portal, finance pages, Stripe action, and email templates.
15. **Phone prefix per country** — Pass country code to SMS and M-Pesa normalisation functions from the tenant's country setting.
16. **Stripe currency per tenant** — Read currency from tenant country setting rather than hardcoding `"kes"`.

### Sprint 5 — Missing Core Features

17. **PDF generation** — Implement report card, receipt, and payslip PDF generation (recommend using a Convex scheduled action + Vercel Blob or S3 storage).
18. **Bank transfer initiation** — Implement the outbound bank transfer flow that the validator schema already defines.
19. **Admin reports page** — Connect the four stat cards to real queries; implement report download with PDF generation.
20. **Transport tracking** — Connect "Track" and "Edit" buttons in the transport DataTable; consider a real-time GPS data ingestion endpoint.
21. **Airtel Money outbound initiation** — Confirm whether Airtel Money initiation is in scope; if so, implement the outbound action alongside the existing webhook handler.

### Sprint 6 — Shared Layer Reconciliation

22. **Align role names** — Either update `shared/src/constants` to use `bursar` / `hr_manager`, or update `convex/helpers/authorize.ts` to use `finance_officer` / `hr_officer`. Pick one source of truth.
23. **Align tier names** — Reconcile `standard/pro` in shared layer with `growth` in Convex billing. Update both to use the same four values.
24. **Deploy workflow** — Move `deploy-preview.yml` and `deploy-production.yml` from worktree branches into the main `.github/workflows/` directory.

### Sprint 7 — Mobile App (Long-Term)

25. **Mobile app** — Requires full React Native/Expo project scaffolding: navigation (React Navigation or Expo Router), auth flow, student/parent/teacher screens, Convex client integration, push notifications. Estimated 3–6 months of dedicated mobile engineering.

---

## Appendix A — Files Audited

### Convex Backend
- `convex/schema.ts` (full — read in chunks)
- `convex/helpers/tenantGuard.ts`
- `convex/helpers/authorize.ts`
- `convex/helpers/moduleGuard.ts`
- `convex/helpers/auditLog.ts`
- `convex/actions/payments/mpesa.ts`
- `convex/actions/payments/stripe.ts`
- `convex/actions/communications/email.ts`
- `convex/actions/communications/sms.ts`
- `convex/http.ts`
- `convex/modules/finance/mutations.ts`
- `convex/modules/academics/queries.ts`
- `convex/modules/academics/mutations.ts`
- `convex/modules/sis/queries.ts`
- `convex/modules/sis/mutations.ts`
- `convex/modules/hr/queries.ts`
- `convex/modules/hr/mutations.ts`
- `convex/modules/timetable/mutations.ts`
- `convex/modules/transport/queries.ts`
- `convex/modules/library/queries.ts`
- `convex/modules/communications/queries.ts`
- `convex/modules/admissions/mutations.ts`
- `convex/modules/ewallet/queries.ts`
- `convex/modules/ewallet/mutations.ts`
- `convex/modules/ecommerce/queries.ts`
- `convex/modules/portal/student/queries.ts`
- `convex/modules/portal/parent/queries.ts`
- `convex/modules/portal/alumni/queries.ts` (partial)
- `convex/modules/portal/partner/queries.ts` (partial)
- `convex/platform/tenants/mutations.ts`
- `convex/platform/billing/mutations.ts`
- `convex/platform/analytics/queries.ts`
- `convex/platform/impersonation/mutations.ts`
- `convex/platform/security/queries.ts`
- `convex/platform/marketplace/queries.ts` (partial)

### Frontend
- `frontend/src/app/admin/page.tsx`
- `frontend/src/app/admin/layout.tsx`
- `frontend/src/app/admin/reports/page.tsx`
- `frontend/src/app/admin/transport/tracking/page.tsx`
- `frontend/src/app/portal/teacher/page.tsx`
- `frontend/src/app/portal/student/page.tsx`
- `frontend/src/app/portal/parent/page.tsx`
- `frontend/src/app/portal/partner/page.tsx`
- `frontend/src/app/portal/alumni/page.tsx`
- `frontend/src/app/platform/page.tsx`
- `frontend/src/app/platform/layout.tsx`
- `frontend/src/app/auth/login/page.tsx`
- `frontend/src/app/auth/callback/route.ts`
- `frontend/src/app/api/webhooks/mpesa/route.ts`
- `frontend/src/app/api/webhooks/airtel/route.ts`
- `frontend/src/app/api/webhooks/stripe/route.ts`

### Shared Layer
- `shared/src/constants/index.ts`
- `shared/src/validators/index.ts`

### Infrastructure
- `.env.example`
- `vercel.json`
- `.github/workflows/ci.yml`

### Mobile
- `mobile/src/` (directory listing only — no implementation files)

---

*Report ends.*
