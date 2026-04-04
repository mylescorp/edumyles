# EduMyles — End-to-End Implementation Audit Report

**Generated**: 2026-04-04
**Audited by**: Claude Opus 4.6 (automated full-codebase audit)
**Codebase**: `codex/audit-edumyles-codebase` branch
**Source files scanned**: 891 files across convex/, frontend/, mobile/, shared/

---

## 1. Executive Summary

| Metric | Value |
|---|---|
| **Overall implementation completeness** | **~78%** |
| **Backend modules fully implemented** | 16/16 module directories (all have real logic) |
| **Frontend panels fully implemented** | 8/8 panels (193 page files, all with real Convex queries) |
| **Mobile screens implemented** | 7/7 screens (student, parent, teacher roles) |
| **Critical blockers (will not compile)** | **10 files with unresolved git merge conflicts** |
| **Critical security issues** | 2 (missing admin RoleGuard, cross-tenant ticket leak) |
| **Schema mismatches** | 1 (`examinations` table missing from schema) |
| **Missing webhook endpoints** | 3 (M-Pesa, Stripe, Airtel callbacks not registered in http.ts) |
| **Payment gateway initiation** | 4/4 implemented |
| **Payment gateway callbacks** | 0/3 wired end-to-end (Bank Transfer is manual-only) |

### Critical Blockers

1. **10 files have unresolved `<<<<<<<`/`=======`/`>>>>>>>` merge conflict markers** — the app will not compile until these are resolved
2. **M-Pesa, Stripe, and Airtel payment callbacks have no HTTP endpoint** registered in `convex/http.ts` — payments will initiate but confirmations will never arrive
3. **`examinations` table** referenced in code but not defined in `convex/schema.ts` — runtime crash on exam creation
4. **Admin layout (`/admin/*`) is missing `RoleGuard`** — any authenticated user (student, parent) can access all admin routes
5. **`getTickets` and `getSLAStats`** in `convex/tickets.ts` have no tenant filtering — returns all tickets across all tenants (cross-tenant data leak)

---

## 2. User Panels Identified

| # | Panel | Route Prefix | Roles | Auth Guard | Mobile Coverage |
|---|---|---|---|---|---|
| 1 | **Platform (Super Admin)** | `/platform/*` | `master_admin`, `super_admin` | RoleGuard ✅ | None |
| 2 | **School Admin** | `/admin/*` | `school_admin`, `principal`, `bursar`, `hr_manager`, `librarian`, `transport_manager` | **MISSING** ❌ | None |
| 3 | **Portal Admin (Deep Workflows)** | `/portal/admin/*` | `school_admin`, `principal`, `master_admin`, `super_admin` | RoleGuard ✅ | None |
| 4 | **Teacher** | `/portal/teacher/*` | `teacher` + admin overrides | RoleGuard ✅ | 7 screens ✅ |
| 5 | **Student** | `/portal/student/*` | `student` + admin overrides | RoleGuard ✅ | 7 screens ✅ |
| 6 | **Parent** | `/portal/parent/*` | `parent` + admin overrides | RoleGuard ✅ | 7 screens ✅ |
| 7 | **Alumni** | `/portal/alumni/*` | `alumni` + admin overrides | RoleGuard ✅ | None |
| 8 | **Partner/Sponsor** | `/portal/partner/*` | `partner` + admin overrides | RoleGuard ✅ | None |
| 9 | **Support (Cross-role)** | `/support/*` | All authenticated users | useAuth ✅ | None |

---

## 3. Backend Module Status

### 3.1 Convex Module Functions

| Module | Files | Functions Found | Fully Impl. | Stubs/Partial | Missing | Notes |
|---|---|---|---|---|---|---|
| **academics** | 3 | 21 | 21 | 0 | 0 | `examinations` table not in schema — runtime crash |
| **admissions** | 2 | 5 | 5 | 0 | 0 | Clean |
| **communications** | 7 | 17 + 25 platform | 40 | 2 (bulk SMS/email stubs) | 0 | **Merge conflict** in mutations.ts |
| **ecommerce** | 2 | 12 | 12 | 0 | 0 | Wallet-integrated payments, full refund logic |
| **ewallet** | 2 | 18 | 18 | 0 | 0 | Frozen wallet checks, overdraw protection |
| **finance** | 3 | 21+ | 21 | 0 | 0 | Full fee/invoice/receipt lifecycle |
| **hr** | 2 | 22 | 22 | 0 | 0 | Full payroll cycle (create → generate → approve → complete) |
| **library** | 2 | 11 | 11 | 0 | 0 | Auto overdue fine calculation |
| **sis** | 2 | 12 | 12 | 0 | 0 | Student CRUD + class management |
| **timetable** | 2 | 11 | 11 | 0 | 0 | Time overlap conflict detection |
| **transport** | 2 | 15 | 15 | 0 | 0 | Bidirectional driver-vehicle assignment |
| **auth** | 4 | 15 | 15 | 0 | 0 | Login lockout, password policy, 2FA, reset tokens |
| **marketplace** | 4 | 17 | 17 | 0 | 0 | Module registry, tier gating, dependency checks |
| **portal/student** | 2 | 11 | 11 | 0 | 0 | |
| **portal/parent** | 2 | 14 | 13 | 1 (`initiatePayment` is stub) | 0 | Payment initiation not wired to gateways |
| **portal/alumni** | 2 | 9 | 9 | 0 | 0 | |
| **portal/partner** | 2 | 8 | 8 | 0 | 0 | |
| **pm** | 8 | ~40 | ~40 | 0 | 0 | GitHub/deploy integrations excluded (type issues) |
| **platform/** | 102 files | ~250+ | ~250 | 0 | 0 | All 30+ subdirectories fully implemented |
| **Root files** | 8 | ~50 | ~50 | 0 | 0 | **Merge conflict** in users.ts |

**Totals**: ~450+ functions | ~448 fully implemented | 3 stubs | 0 missing

### 3.2 Schema (`convex/schema.ts`)

- **100+ tables** defined across ~3,400 lines
- All module tables present with proper indexes
- **Gap**: `examinations` table is NOT defined but referenced by academics module

### 3.3 Helpers

| Helper | File | Status |
|---|---|---|
| Tenant guard | `convex/helpers/tenantGuard.ts` | ✅ Implemented |
| Authorization | `convex/helpers/authorize.ts` | ✅ Permission-based RBAC |
| Module guard | `convex/helpers/moduleGuard.ts` | ✅ Checks installed modules |
| Platform guard | `convex/helpers/platformGuard.ts` | ✅ Master/super admin only |
| Audit log | `convex/helpers/auditLog.ts` | ✅ All mutations log |
| ID generator | `convex/helpers/idGenerator.ts` | ✅ |
| Phone utils | `convex/helpers/phoneUtils.ts` | ✅ East African normalization |

---

## 4. Frontend Panel Status

### 4.1 Platform (Super Admin) — 56 routes

All 56 routes are **✅ Done** with real Convex data. Includes: tenant management, CRM/deals/proposals, billing, marketplace, project management, security operations, automation, health monitoring, feature flags, white-labeling, API keys, webhooks, SLA management, and more.

No broken nav links. No stubs. No hardcoded data.

### 4.2 School Admin — 60+ routes

| Route | Status | Issue |
|---|---|---|
| `/admin` (Dashboard) | ✅ Done | |
| `/admin/students` | ✅ Done | |
| `/admin/students/create` | ✅ Done | |
| `/admin/students/import` | ✅ Done | CSV import |
| `/admin/students/[studentId]` | ✅ Done | |
| `/admin/classes` | ✅ Done | |
| `/admin/classes/create` | ✅ Done | |
| `/admin/classes/[classId]` | ✅ Done | |
| `/admin/staff` | ✅ Done | |
| `/admin/staff/create` | ✅ Done | |
| `/admin/staff/[staffId]` | ✅ Done | |
| `/admin/admissions` | ✅ Done | |
| `/admin/admissions/[appId]` | ✅ Done | |
| `/admin/academics` | ⚠️ Partial | 4 quick-action links to non-existent routes |
| `/admin/finance` | ✅ Done | |
| `/admin/finance/fees` | ✅ Done | |
| `/admin/finance/invoices` | ✅ Done | |
| `/admin/finance/invoices/create` | ✅ Done | |
| `/admin/timetable` | ✅ Done | Conflict detection |
| `/admin/timetable/schedule` | ✅ Done | |
| `/admin/timetable/events` | ✅ Done | |
| `/admin/timetable/events/create` | ✅ Done | |
| `/admin/timetable/assignments` | ✅ Done | |
| `/admin/hr` | ⚠️ Partial | "Open Positions" hardcoded to `3`; link to `/admin/hr/performance` broken |
| `/admin/hr/leave` | ❌ Broken | **Unresolved merge conflict** |
| `/admin/hr/payroll` | ❌ Broken | **Unresolved merge conflict** |
| `/admin/library` | ✅ Done | |
| `/admin/library/books` | ✅ Done | |
| `/admin/library/books/create` | ✅ Done | |
| `/admin/library/circulation` | ❌ Broken | **Unresolved merge conflict** |
| `/admin/library/reports` | ✅ Done | |
| `/admin/transport` | ✅ Done | Full CRUD |
| `/admin/transport/routes` | ✅ Done | |
| `/admin/transport/routes/create` | ✅ Done | |
| `/admin/transport/tracking` | ✅ Done | |
| `/admin/communications` | ✅ Done | |
| `/admin/communications/create` | ✅ Done | |
| `/admin/communications/email` | ✅ Done | |
| `/admin/ewallet` | ✅ Done | |
| `/admin/ewallet/wallets` | ❌ Broken | **Unresolved merge conflict** |
| `/admin/ewallet/transactions` | ✅ Done | |
| `/admin/ecommerce` | ✅ Done | |
| `/admin/ecommerce/products` | ✅ Done | |
| `/admin/ecommerce/products/create` | ✅ Done | |
| `/admin/ecommerce/orders` | ✅ Done | |
| `/admin/users` | ❌ Broken | **Unresolved merge conflict** |
| `/admin/users/invite` | ✅ Done | |
| `/admin/modules` | ✅ Done | |
| `/admin/marketplace` | ✅ Done | |
| `/admin/settings` | ✅ Done | |
| `/admin/settings/billing` | ✅ Done | |
| `/admin/settings/roles` | ⚠️ Partial | Hardcoded ROLES array, not from Convex |
| `/admin/settings/modules` | ✅ Done | |
| `/admin/audit` | ✅ Done | |
| `/admin/reports` | ⚠️ Partial | Static link hub, no own data |
| `/admin/security` | ✅ Done | |
| `/admin/tasks` | ✅ Done | |
| `/admin/notes` | ✅ Done | |
| `/admin/notifications` | ✅ Done | |
| `/admin/profile` | ✅ Done | |

**Broken nav links from admin pages**:
- `/admin/hr/performance` — linked from HR dashboard, route does NOT exist
- `/admin/academics/exams` — linked from academics page, route does NOT exist
- `/admin/academics/exams/create` — does NOT exist
- `/admin/academics/classes/create` — does NOT exist
- `/admin/academics/assignments/create` — does NOT exist
- `/admin/academics/reports` — does NOT exist

### 4.3 Student Portal — 14 routes

| Route | Status | Issue |
|---|---|---|
| `/portal/student` (Dashboard) | ✅ Done | |
| `/portal/student/grades` | ✅ Done | |
| `/portal/student/timetable` | ✅ Done | |
| `/portal/student/assignments` | ✅ Done | |
| `/portal/student/assignments/[assignmentId]` | ✅ Done | |
| `/portal/student/attendance` | ✅ Done | |
| `/portal/student/report-cards` | ✅ Done | |
| `/portal/student/wallet` | ✅ Done | |
| `/portal/student/wallet/topup` | ❌ Broken | **Unresolved merge conflict** |
| `/portal/student/wallet/send` | ✅ Done | |
| `/portal/student/wallet/transactions` | ✅ Done | |
| `/portal/student/profile` | ✅ Done | |
| `/portal/student/communications` | ✅ Done | |
| `/portal/student/notifications` | ✅ Done | |

**Note**: Duplicate route group exists at `/(portal)/student/*` with different layout (`AppShell` vs `GlobalShell`) — creates route ambiguity.

### 4.4 Teacher Portal — 12 routes

All 12 routes **✅ Done** with real Convex data. Includes: dashboard, classes, gradebook, attendance recording, assignments (create + list), timetable, communications, profile, notifications.

### 4.5 Parent Portal — 17 routes

All 17 routes **✅ Done** with real Convex data. Includes: dashboard (enhanced variant), children (with per-child grades/attendance/timetable/assignments), fees (pay + history), messaging, announcements, payments, profile, notifications.

### 4.6 Alumni Portal — 6 routes

All 6 routes **✅ Done**. Missing `ModuleAccessGuard` in layout.

### 4.7 Partner Portal — 9 routes

All 9 routes **✅ Done** with real Convex data.

### 4.8 Portal Admin (Deep Workflows) — 13 routes

All 13 routes **✅ Done**. Missing `ModuleAccessGuard` in layout.

### 4.9 Support (Cross-role) — 4 routes

All 4 routes **✅ Done**.

### 4.10 Cross-Cutting Frontend Issues

| Issue | Severity | Details |
|---|---|---|
| No server-side middleware | HIGH | No `middleware.ts` — all auth is client-side only. Unauthenticated users see loading skeleton before redirect. |
| No server-side pagination | MEDIUM | `DataTable` loads all records client-side (25-row visual pages). Will degrade for schools with thousands of students/invoices. |
| Hardcoded sidebar badges | LOW | Admissions badge = `5`, Finance badge = `12` (labeled `// Mock count`) |
| Hardcoded HR value | LOW | "Open Positions" = `3` in HR dashboard |

---

## 5. Missing Features — Prioritized List

### CRITICAL (Blocks Core Usage)

| # | Module | Panel | Feature | What's Missing | Suggested Fix |
|---|---|---|---|---|---|
| 1 | All | All | **Merge conflicts** | 10 files with `<<<<<<<` markers — app won't compile | Resolve all merge conflicts immediately |
| 2 | Finance | All | **Payment callback endpoints** | M-Pesa, Stripe, Airtel callbacks have no HTTP route in `http.ts` | Register httpAction routes for each gateway callback |
| 3 | Academics | Admin | **Examinations schema** | `examinations` table not in `schema.ts` — runtime crash | Add table definition to schema |
| 4 | Auth | Admin | **Admin RoleGuard** | `/admin/*` layout has no `RoleGuard` — any user can access | Add `RoleGuard` to admin layout.tsx |
| 5 | Tickets | All | **Cross-tenant ticket leak** | `getTickets`/`getSLAStats` return all tenants' tickets | Add tenant filtering |
| 6 | Finance | Parent | **Parent payment initiation** | `initiatePayment` is a logging-only stub | Wire to M-Pesa/Stripe/Airtel actions |

### HIGH

| # | Module | Panel | Feature | What's Missing | Suggested Fix |
|---|---|---|---|---|---|
| 7 | Academics | Admin | **Exam management routes** | `/admin/academics/exams`, `exams/create`, `assignments/create`, `reports` don't exist | Create route files |
| 8 | HR | Admin | **Performance management route** | `/admin/hr/performance` linked but doesn't exist | Create route file |
| 9 | Auth | All | **Server-side middleware** | No `middleware.ts` — all auth is client-side | Add Next.js middleware for auth redirects |
| 10 | Auth | Auth | **Full table scans** | `getUserByUserId` and `resetPasswordWithToken` scan entire users table | Use index-based queries |
| 11 | Communications | All | **Bulk SMS/email** | `sendBulkSMS` and `sendBulkEmail` are stubs returning hardcoded failure | Implement batched sending |
| 12 | Platform | All | **AI support module** | Fully commented out in `actions/ai/index.ts` | Resolve action/DB access issues |

### MEDIUM

| # | Module | Panel | Feature | What's Missing | Suggested Fix |
|---|---|---|---|---|---|
| 13 | All | Admin | **Server-side pagination** | DataTable loads all records client-side | Add cursor-based pagination to Convex queries |
| 14 | All | Alumni/Portal Admin | **ModuleAccessGuard** | Missing from alumni and portal/admin layouts | Add guard to layouts |
| 15 | Student | Student | **Duplicate route group** | `/(portal)/student/*` and `/portal/student/*` both exist | Remove legacy route group |
| 16 | Crons | Backend | **Missing scheduled jobs** | No crons for: session cleanup, overdue invoice alerts, SLA breach detection, payment reconciliation | Add cron jobs |
| 17 | Shared | Mobile | **Theme divergence** | Mobile uses blue palette; shared theme uses forest green | Align mobile to shared theme tokens |
| 18 | Shared | All | **Grading bug** | `GradingSystem.calculateWeightedAverage` returns `totalWeight/totalWeight` (always 1) | Fix to `totalWeightedScore/totalWeight` |
| 19 | Validation | Backend | **Open status strings** | Many mutations accept `v.string()` for status fields instead of `v.union(v.literal(...))` | Add union validators |

### LOW

| # | Module | Panel | Feature | What's Missing | Suggested Fix |
|---|---|---|---|---|---|
| 20 | Admin | Admin | **Sidebar mock badges** | Admissions=5, Finance=12 hardcoded | Wire to real counts |
| 21 | HR | Admin | **Hardcoded positions** | "Open Positions" = 3 | Query from DB |
| 22 | Admin | Settings | **Static roles page** | Role permissions from hardcoded array | Query from roleBuilder |
| 23 | Reports | Admin | **Reports hub** | Static link page with no own data | Add summary stats |
| 24 | PM | Platform | **GitHub/deploy integrations** | Excluded from index.ts (type issues) | Fix type exports |
| 25 | Mobile | Mobile | **Entry point mismatch** | `package.json` declares `expo-router/entry` but app uses manual tabs in `App.tsx` | Align to one approach |
| 26 | Mobile | Mobile | **No Expo config** | No `app.json` or `app.config.ts` found | Add Expo config |
| 27 | Mobile | Mobile | **No deep linking** | No deep link configuration | Add linking config |
| 28 | Validation | Backend | **No input length limits** | Text fields (names, descriptions, messages) have no max length | Add `.max()` validators |

---

## 6. Payment Integration Status

| Provider | Initiation | Callback/Webhook | Ledger Posting | Status |
|---|---|---|---|---|
| **M-Pesa (Daraja STK Push)** | ✅ Implemented (`actions/payments/mpesa.ts` + `modules/finance/actions.ts`) | ❌ **No HTTP endpoint in `http.ts`** | ✅ `recordPayment` posts to student ledger | ⚠️ Partial — callbacks will fail silently |
| **Airtel Money** | ✅ Implemented (`modules/finance/actions.ts` using shared lib) | ❌ **No HTTP endpoint in `http.ts`** | ✅ Same ledger posting path | ⚠️ Partial — callbacks will fail silently |
| **Stripe** | ✅ Implemented (`actions/payments/stripe.ts`, multi-currency KES/UGX/TZS/RWF/ETB/GHS/USD) | ❌ **No webhook handler in `http.ts`** | ✅ Same ledger posting path | ⚠️ Partial — webhooks will fail silently |
| **Bank Transfer** | ✅ Manual flow (`actions/payments/bankTransfer.ts`, reference generation, role-based verification) | N/A (manual verification) | ✅ `verifyBankTransfer` in finance module | ✅ Done |

**Key issue**: All three automated payment gateways can *initiate* payments but have **no registered callback/webhook HTTP endpoints** in `convex/http.ts`. The `savePaymentCallbackFromServer` action exists but nothing routes inbound HTTP requests to it.

---

## 7. Communication Integration Status

| Channel | Send Single | Send Bulk | Templates | End-to-End Wired | Notes |
|---|---|---|---|---|---|
| **SMS (Africa's Talking)** | ✅ Implemented | 🔲 Stub (returns failure) | ✅ 4 templates | ⚠️ Single only | East African phone normalization included |
| **Email (Resend)** | ✅ Implemented | 🔲 Stub (returns failure) | ✅ 4 HTML templates (fee_reminder, payment_confirmation, assignment_due, grade_posted) | ⚠️ Single only | |
| **In-App Notifications** | ✅ Implemented | ✅ Batch via campaigns | ✅ Via notification types | ✅ Done | Mark read, unread count |
| **Push Notifications (Expo)** | ✅ Implemented (internal action) | ✅ Batched (100/batch) | N/A | ✅ Done | Mobile token registration + send |

---

## 8. Mobile App Status

### 8.1 Screen Coverage

| Screen | Roles | Convex Connected | Offline Handling | Status |
|---|---|---|---|---|
| **LoginScreen** | All | Yes (REST API) | No | ✅ Implemented |
| **DashboardScreen** | Student, Parent, Teacher | Yes (11+ useQuery) | Yes (cached values, offline banner) | ✅ Implemented |
| **GradesScreen** | Student (view), Parent (children), Teacher (enter) | Yes (useQuery + useMutation) | Yes (grade entry disabled offline) | ✅ Implemented |
| **FeesScreen** | Student (wallet), Parent (fee overview), Teacher (timetable) | Yes | Yes (cached) | ✅ Implemented |
| **AttendanceScreen** | Student (view), Parent (announcements), Teacher (mark) | Yes (useQuery + useMutation) | Yes (submission disabled offline) | ✅ Implemented |
| **AssignmentsScreen** | Student (view), Parent (messaging), Teacher (create) | Yes (useQuery + useMutation) | Yes (send/create disabled offline) | ✅ Implemented |
| **ProfileScreen** | All three roles | Yes | Yes (cached) | ✅ Implemented |

### 8.2 Role Coverage

| Role | Mobile App | Web App |
|---|---|---|
| Student | ✅ 7 screens | ✅ 14 routes |
| Parent | ✅ 7 screens | ✅ 17 routes |
| Teacher | ✅ 7 screens | ✅ 12 routes |
| School Admin | ❌ None | ✅ 60+ routes |
| Platform Admin | ❌ None | ✅ 56 routes |
| Alumni | ❌ None | ✅ 6 routes |
| Partner | ❌ None | ✅ 9 routes |

### 8.3 Auth on Mobile

Browser-based "device authorization" flow: mobile opens browser for WorkOS login → polls for approval → stores session in `expo-secure-store`. Not a native WorkOS SDK integration but functional.

### 8.4 Mobile Gaps

- No admin role coverage (web-only)
- No `app.json`/`app.config.ts` for Expo builds
- Entry point mismatch (`package.json` says `expo-router/entry` but app uses manual tab switching)
- No deep linking
- No biometric auth/PIN for stored sessions
- Write operations disabled offline (not queued)
- Heavy use of `any` types, no TypeScript strictness for Convex results
- Theme divergent from shared design tokens

---

## 9. Auth & Tenant Isolation Issues

### 9.1 Tenant Isolation (Backend)

**Overall assessment: STRONG** — Every module function uses one of:
- `requireTenantContext(ctx)` — session-based tenant extraction
- `requireTenantSession(ctx, { sessionToken })` — explicit session token
- `requirePlatformSession(ctx, args)` — platform admin access

All DB reads filter by `tenantId`. All mutations verify `record.tenantId === tenant.tenantId` before patching.

**Exceptions by design** (pre-tenant operations):
- Auth module functions (login attempts, password, 2FA) — user-level, not tenant-level
- Waitlist functions — pre-tenant enrollment

### 9.2 Tenant Isolation Issues

| Issue | Severity | Location | Details |
|---|---|---|---|
| **Cross-tenant ticket leak** | CRITICAL | `convex/tickets.ts` → `getTickets`, `getSLAStats` | Uses `ctx.auth.getUserIdentity()` with NO tenant filtering — returns tickets across ALL tenants |
| **Admin RoleGuard missing** | CRITICAL | `frontend/src/app/admin/layout.tsx` | Any authenticated user can navigate to `/admin/*` routes |
| **No server-side middleware** | HIGH | `frontend/src/middleware.ts` (file does not exist) | All auth is client-side only — brief flash of content before redirect |
| **ModuleAccessGuard missing** | MEDIUM | Alumni layout, Portal Admin layout | Module-gated pages render even if module is uninstalled |

### 9.3 Auth Flow

- **Web**: WorkOS AuthKit → session cookie → `useAuth()` hook → session resolution
- **Mobile**: Browser-based device authorization → `expo-secure-store` token → API polling
- **Backend**: Session tokens validated against `sessions` table with server secret gating for creation

---

## 10. Shared Layer Gaps

### 10.1 Types (`shared/src/types/`)

✅ 25+ TypeScript interfaces defined (Student, Staff, Fee, Grade, Tenant, Module, etc.)

**Gap**: No shared API response types for Convex functions — each consumer casts to `any`.

### 10.2 Validators (`shared/src/validators/`)

✅ 20+ Zod schemas with `.transform()` for role normalization.

**Gap**: Validators used in frontend forms but not consistently imported in Convex mutations (mutations use `v.` validators from Convex library instead).

### 10.3 Constants (`shared/src/constants/`)

✅ Comprehensive: roles, module metadata, tier gates, curriculum codes (Kenya CBC, Uganda, Tanzania, Rwanda, Ethiopia, Ghana), country/currency data, pagination defaults.

**Gap**: No shared navigation/route constants — routes are hardcoded in frontend.

### 10.4 Business Logic Libraries (`shared/src/lib/`)

| Library | Status | Issue |
|---|---|---|
| Billing engine | ✅ Implemented | Proration, overage, MRR/ARR calculations |
| Grading system | ⚠️ Bug | `calculateWeightedAverage` returns `totalWeight/totalWeight` (always 1) instead of `totalWeightedScore/totalWeight` |
| Payroll engine | ✅ Implemented | Kenya PAYE, NHIF, NSSF, Housing Levy |
| Timetable utils | ✅ Implemented | |
| Wallet utils | ✅ Implemented | |
| M-Pesa client | ✅ Implemented | Daraja API wrapper |
| Airtel client | ✅ Implemented | |
| SMS client | ✅ Implemented | Africa's Talking |
| Email client | ✅ Implemented | Resend |

### 10.5 Theme (`shared/src/theme/`)

✅ Design tokens defined (forest green brand, typography, spacing).

**Gap**: Mobile app does not consume shared theme — uses its own divergent blue palette.

---

## 11. Infra & CI/CD Gaps

### 11.1 CI/CD Workflows

| Workflow | Trigger | Jobs | Status |
|---|---|---|---|
| **CI** | PR to main/staging/develop | Lint+typecheck, unit tests, tenant isolation tests, E2E (Playwright), security audit | ✅ Implemented |
| **Deploy Preview** | PR to main/staging | Vercel preview (frontend + landing) | ✅ Implemented |
| **Deploy Production** | Push to main | Vercel prod + Convex deploy | ✅ Implemented |

### 11.2 CI Gaps

| Gap | Impact |
|---|---|
| **No mobile build/test job** | Mobile regressions will not be caught |
| **No Convex schema validation** | Schema mismatches (like `examinations`) won't be caught pre-deploy |
| **E2E only runs smoke suite** | 4 of 6 spec files run; deeper flows untested in CI |
| **No staging environment** | Preview → production with no intermediate validation |

### 11.3 Test Coverage

| Area | Test Files | Framework | Notes |
|---|---|---|---|
| Frontend unit | 16 files | Vitest (jsdom) | 70% coverage thresholds configured |
| Tenant isolation | 4 files | Vitest (dedicated config) | |
| E2E | 6 specs | Playwright (5 browsers) | Only smoke suite in CI |
| Mobile | **0 files** | None | No test framework configured |
| Shared libraries | **0 files** | None | Billing, grading, payroll engines untested |

### 11.4 Environment Variables

`.env.example` is **comprehensive** (240 lines) covering: Convex, WorkOS, Vercel, M-Pesa/Daraja, Airtel Money, Stripe, Africa's Talking, Resend, Sentry, PostHog, Cloudinary, FCM, Expo.

### 11.5 Deployment

- Vercel with security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy)
- Turborepo with 4 workspaces (frontend, mobile, shared, landing)
- Node >=20.9.0 required
- No `infra/` directory — no IaC

### 11.6 Seed Script

✅ `convex/dev/seed.ts` (245 lines) — seeds full test tenant with org, users, classes, students, fee structures, invoices, payments. Protected by webhook secret.

---

## 12. Recommended Implementation Priority Order

### Sprint 1 — Critical Fixes (Unblock Compilation & Security)

1. **Resolve all 10 merge conflicts** — app cannot compile
   - `frontend/src/hooks/useAuth.ts`
   - `frontend/src/hooks/useTenant.ts`
   - `frontend/src/app/admin/users/page.tsx`
   - `frontend/src/app/admin/hr/leave/page.tsx`
   - `frontend/src/app/admin/hr/payroll/page.tsx`
   - `frontend/src/app/admin/library/circulation/page.tsx`
   - `frontend/src/app/admin/ewallet/wallets/page.tsx`
   - `frontend/src/app/portal/student/wallet/topup/page.tsx`
   - `convex/modules/communications/mutations.ts`
   - `convex/users.ts`

2. **Add `RoleGuard` to admin layout** — prevents unauthorized access to `/admin/*`

3. **Fix cross-tenant ticket leak** — add `tenantId` filtering to `getTickets`/`getSLAStats`

4. **Add `examinations` table to schema.ts** — prevents runtime crash

### Sprint 2 — Payment Callbacks (Unblock Revenue)

5. **Register M-Pesa callback HTTP endpoint** in `convex/http.ts` routing to `savePaymentCallbackFromServer`
6. **Register Stripe webhook HTTP endpoint** in `convex/http.ts`
7. **Register Airtel Money callback HTTP endpoint** in `convex/http.ts`
8. **Wire parent `initiatePayment`** to actual gateway actions

### Sprint 3 — Missing Routes & Features

9. **Create missing admin academics routes** (`/admin/academics/exams`, `exams/create`, `assignments/create`, `reports`)
10. **Create `/admin/hr/performance` route**
11. **Add Next.js middleware** for server-side auth redirects
12. **Implement bulk SMS/email** (currently stubs)

### Sprint 4 — Data Integrity & Performance

13. **Add server-side pagination** to all list queries (cursor-based)
14. **Fix `calculateWeightedAverage` bug** in shared grading library
15. **Fix full table scans** in auth module (`getUserByUserId`, `resetPasswordWithToken`)
16. **Add union validators** for status fields in mutations
17. **Replace hardcoded values** (sidebar badges, HR positions, roles page)

### Sprint 5 — Guards & Cleanup

18. **Add `ModuleAccessGuard`** to alumni and portal/admin layouts
19. **Remove duplicate `/(portal)/student/*` route group**
20. **Add missing cron jobs** (session cleanup, overdue invoices, SLA breach detection, payment reconciliation)
21. **Fix PM module exports** (GitHub/deploy integrations excluded due to type issues)
22. **Disable AI support module** cleanly or fix action/DB access issues

### Sprint 6 — Mobile & Testing

23. **Add Expo config** (`app.json`/`app.config.ts`)
24. **Align mobile entry point** (resolve expo-router vs manual tabs)
25. **Align mobile theme** to shared design tokens
26. **Add mobile tests** (unit + E2E)
27. **Add shared library tests** (billing, grading, payroll engines)
28. **Add Convex schema validation to CI**
29. **Add mobile build/lint to CI**

---

## Appendix A: Files with Merge Conflicts

| File | Conflict Area |
|---|---|
| `convex/modules/communications/mutations.ts` | Import variants for `sendPushInternal` |
| `convex/users.ts` | `listTenantUsers` args (sessionToken optional vs required) |
| `frontend/src/hooks/useAuth.ts` | Auth hook implementation |
| `frontend/src/hooks/useTenant.ts` | Tenant hook implementation |
| `frontend/src/app/admin/users/page.tsx` | User management page |
| `frontend/src/app/admin/hr/leave/page.tsx` | Leave management page |
| `frontend/src/app/admin/hr/payroll/page.tsx` | Payroll page |
| `frontend/src/app/admin/library/circulation/page.tsx` | Circulation page |
| `frontend/src/app/admin/ewallet/wallets/page.tsx` | Wallets page |
| `frontend/src/app/portal/student/wallet/topup/page.tsx` | Student top-up page |

## Appendix B: TODO/FIXME/Disabled Code

| Location | Content |
|---|---|
| `convex/actions/ai/index.ts` line 3 | `// Temporarily disabled due to action/db access issues` — entire AI module commented out |
| `convex/modules/pm/index.ts` line 8 | `// GitHub and deploy integrations temporarily excluded due to type issues` |
| `frontend/src/components/layout/Sidebar.tsx` lines 113-115 | `// Mock count` — hardcoded badge values |
| `convex/modules/portal/parent/mutations.ts` | `initiatePayment` — logging-only placeholder, comment says "Phase 11" wiring |

## Appendix C: East Africa Localization Assessment

| Aspect | Status | Notes |
|---|---|---|
| **Currencies** | ✅ KES, UGX, TZS, RWF, ETB, GHS, USD supported | Stripe multi-currency, M-Pesa (KES), Airtel (multi-country) |
| **Phone formats** | ✅ East African normalization | `+254`, `+256`, `+255` etc. in `phoneUtils.ts` |
| **Curriculum** | ✅ Kenya CBC, Uganda, Tanzania, Rwanda, Ethiopia, Ghana | Codes in shared constants |
| **Tax calculations** | ✅ Kenya PAYE bands, NHIF, NSSF, Housing Levy | In shared payroll engine |
| **SMS provider** | ✅ Africa's Talking | Preferred provider for East Africa |
| **Payment providers** | ✅ M-Pesa + Airtel Money | Primary mobile money in region |
| **Offline support** | ✅ Mobile app caches data | Critical for areas with poor connectivity |
| **Language** | ⚠️ English only | No Swahili or other local language support |

---

*End of audit report.*
