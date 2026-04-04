# EduMyles — End-to-End Implementation Audit Report

**Generated:** 2026-04-04  
**Audited by:** Claude Sonnet 4.6 (Senior Full-Stack & QA Architect pass)  
**Branch:** `codex/audit-edumyles-codebase`  
**Scope:** Every source file in `convex/`, `frontend/src/`, `mobile/src/`, `shared/src/`, `.github/`, root config

---

## 1. Executive Summary

| Metric | Value |
|---|---|
| **Overall Completeness** | **~87%** |
| **Convex DB Tables** | 163 defined in `schema.ts` |
| **Backend Modules** | 11 school modules + 25 platform modules |
| **Frontend Routes (admin)** | ~95 routes across all panels |
| **Mobile Screens** | 7 (Student, Parent, Teacher dashboards) |
| **Shared Zod Validators** | 20 schemas |
| **CI/CD Workflows** | 3 workflows (ci, deploy-preview, deploy-production) |

### Critical Blockers (production launch)

| # | Blocker | Location |
|---|---|---|
| 1 | M-Pesa & Airtel **sandbox URLs hardcoded** — live payments will fail | `convex/actions/payments/mpesa.ts:7-8` |
| 2 | `receptionist` role has **zero permissions** — users assigned this role are silently locked out of everything | `convex/helpers/authorize.ts` (missing entry) |
| 3 | `ENABLE_DEV_AUTH_BYPASS=true` in `.env.local` — must be explicitly disabled in all production deployments | `convex/helpers/tenantGuard.ts:73-76` |
| 4 | Bank transfer env vars (`BANK_ACCOUNT_NUMBER`, `BANK_NAME`, etc.) are **commented out** in `.env.example` — runtime error if bank transfer is used without them | `convex/actions/payments/bankTransfer.ts:20-27` |

### Module Completeness Summary

| Status | Count | Modules |
|---|---|---|
| ✅ Fully Implemented | 9 | SIS, Finance, Academics, HR, Library, Transport, Communications, eWallet, eCommerce |
| ⚠️ Partial | 2 | Admissions (no document upload UI), Timetable (no auto-conflict resolver) |
| ❌ Not Started | 0 | — |

---

## 2. User Panels Identified

| Panel | Route Prefix | Roles | Status |
|---|---|---|---|
| **School Admin** | `/admin` | `school_admin`, `principal`, `bursar`, `hr_manager`, `librarian`, `transport_manager` | ✅ Implemented |
| **Platform Admin** | `/platform` | `master_admin`, `super_admin` | ✅ Implemented |
| **Student Portal** | `/portal/student` | `student` | ✅ Implemented |
| **Teacher Portal** | `/portal/teacher` | `teacher` | ✅ Implemented |
| **Parent Portal** | `/portal/parent` | `parent` | ✅ Implemented |
| **Alumni Portal** | `/portal/alumni` | `alumni` | ✅ Implemented |
| **Partner Portal** | `/portal/partner` | `partner` | ✅ Implemented |
| **Support** | `/support` | all authenticated | ✅ Implemented |

---

## 3. Backend Module Status

| Module | Files | Functions (est.) | Fully Impl. | Stubs | Missing | Notes |
|---|---|---|---|---|---|---|
| **SIS** | `modules/sis/queries.ts`, `mutations.ts` | 8 | ✅ | 0 | — | listStudents, getStudent, getStudentStats, listClasses, listGuardians + mutations |
| **Admissions** | `modules/admissions/queries.ts`, `mutations.ts` | 6 | ✅ | 0 | — | Full application→review→accept→enroll flow |
| **Finance** | `modules/finance/queries.ts`, `mutations.ts`, `actions.ts`, `paymentUtils.ts` + 4 payment actions | 22 | ✅ | 0 | — | All 4 gateways + ledger + reconciliation |
| **Academics** | `modules/academics/queries.ts`, `mutations.ts`, `assignments.ts` | 19 | ✅ | 0 | GPA only uses Kenya CBC scale | enterGrades, markAttendance, generateReportCard, createExamination |
| **HR** | `modules/hr/queries.ts`, `mutations.ts` | 18 | ✅ | 0 | — | Staff, contracts, leave, payroll, payslips |
| **Timetable** | `modules/timetable/queries.ts`, `mutations.ts` | 9 | ✅ | 0 | Auto-conflict resolver (detect only) | Schedule CRUD, substitute assignment |
| **Library** | `modules/library/queries.ts`, `mutations.ts` | 10 | ✅ | 0 | — | Books, borrow/return, automatic fine calculation |
| **Transport** | `modules/transport/queries.ts`, `mutations.ts` | 12 | ✅ | 0 | — | Routes, vehicles, drivers, student assignments |
| **Communications** | `modules/communications/queries.ts`, `mutations.ts`, `platform.ts` + 3 actions | 34 | ✅ | 0 | — | SMS, email, in-app, push, templates, campaigns |
| **eWallet** | `modules/ewallet/queries.ts`, `mutations.ts` | 13 | ✅ | 0 | — | Wallets, top-up, transfers, freeze/thaw |
| **eCommerce** | `modules/ecommerce/queries.ts`, `mutations.ts` | 12 | ✅ | 0 | — | Products, cart, orders, wallet charge |
| **Marketplace** | `modules/marketplace/` (6 files) | 13 | ✅ | 0 | — | Module install, tier gating, dependency resolution |
| **Portal (student/parent/alumni/partner)** | `modules/portal/*/queries.ts`, `mutations.ts` (8 files) | 42 | ✅ | 0 | — | Role-specific views for all portal roles |
| **Platform (25 sub-modules)** | `platform/tenants/`, `billing/`, `users/`, `audit/`, `analytics/`, … | ~150 | ✅ | 0 | — | Full SaaS platform layer |
| **Notes** | `modules/notes/queries.ts`, `mutations.ts` | 6 | ✅ | 0 | — | |
| **Tasks** | `modules/tasks/queries.ts`, `mutations.ts` | 6 | ✅ | 0 | — | |

### Cron Jobs (`convex/crons.ts`)

| Job | Interval | Function | Exists? |
|---|---|---|---|
| Process scheduled reports | 1 hour | `platform.scheduledReports.mutations.processDueReports` | ✅ |
| Cleanup expired sessions | 6 hours | `system.maintenance.cleanupExpiredSessions` | ✅ |
| Send overdue invoice alerts | 24 hours | `system.maintenance.sendOverdueInvoiceAlerts` | ✅ |
| Detect SLA breaches | 1 hour | `system.maintenance.detectSlaBreaches` | ✅ |
| Reconcile pending payments | 2 hours | `system.maintenance.reconcilePendingPayments` | ✅ |

> **Note:** The three `system.maintenance.*` cron references use `(internal as any)` cast to bypass TypeScript — functions do exist and are exported correctly in `convex/system/maintenance.ts`, but this bypasses compile-time safety. Recommend removing the cast.

---

## 4. Frontend Panel Status

### School Admin (`/admin`)

| Route | Status | Issue |
|---|---|---|
| `/admin` (dashboard) | ✅ Done | Real Convex data |
| `/admin/academics` | ✅ Done | Stats + recent exams + events from Convex |
| `/admin/academics/exams` | ✅ Done | DataTable with real query |
| `/admin/academics/exams/create` | ✅ Done | Form → `createExamination` mutation |
| `/admin/academics/exams/[examId]` | ✅ Done | Individual exam management |
| `/admin/academics/assignments` | ✅ Done | Assignment list |
| `/admin/academics/assignments/create` | ✅ Done | Form → `createAssignment` mutation |
| `/admin/academics/classes` | ✅ Done | Via `/admin/classes/` route |
| `/admin/academics/reports` | ⚠️ Partial | Shows stats/recent exams only; no per-student report card generation UI |
| `/admin/admissions` | ✅ Done | Application list with status filter, real Convex query |
| `/admin/audit` | ✅ Done | Full audit log viewer with filters |
| `/admin/classes` | ✅ Done | Class list + create + `[classId]` detail |
| `/admin/classes/create` | ✅ Done | Form → mutation |
| `/admin/classes/[classId]` | ✅ Done | Detail with teacher assignment |
| `/admin/communications` | ✅ Done | SMS, email, announcements, campaigns, templates, messaging |
| `/admin/communications/create` | ✅ Done | Announcement create form |
| `/admin/communications/email` | ✅ Done | Email campaign composer |
| `/admin/ecommerce` | ✅ Done | Order management |
| `/admin/ecommerce/products` | ✅ Done | Product list + create |
| `/admin/ecommerce/orders` | ✅ Done | Order list with status filter |
| `/admin/ewallet` | ✅ Done | Wallet overview |
| `/admin/ewallet/wallets` | ✅ Done | Wallet list + balance adjustment |
| `/admin/ewallet/transactions` | ✅ Done | Transaction log with type filter |
| `/admin/finance` | ✅ Done | Dashboard: totalBilled, totalPaid, outstanding, collectionRate from Convex |
| `/admin/finance/fees` | ✅ Done | Fee structure list + create form |
| `/admin/finance/invoices` | ✅ Done | Invoice list + generate + pay (all 4 gateways) |
| `/admin/hr` | ✅ Done | Stats + recent activity + leave count from Convex |
| `/admin/hr/leave` | ✅ Done | Leave request list + approval |
| `/admin/hr/payroll` | ✅ Done | Payroll runs + payslips |
| `/admin/hr/performance` | ⚠️ Partial | Lists staff but no performance scoring UI; links to `platform.staffPerformance` backend |
| `/admin/library` | ✅ Done | Book list + stats |
| `/admin/library/books` | ✅ Done | Book catalog with borrow/return |
| `/admin/library/circulation` | ✅ Done | Active borrows + overdue |
| `/admin/library/reports` | ✅ Done | Library report summary |
| `/admin/marketplace` | ✅ Done | Module marketplace with tier gating |
| `/admin/modules` | ✅ Done | Installed module management |
| `/admin/notes` | ✅ Done | Notes CRUD |
| `/admin/notifications` | ✅ Done | Notification centre |
| `/admin/profile` | ✅ Done | User profile |
| `/admin/reports` | ✅ Done | Reports hub |
| `/admin/security` | ✅ Done | Security settings |
| `/admin/settings` | ✅ Done | School settings, billing, roles |
| `/admin/staff` | ✅ Done | Staff directory + create + `[staffId]` detail |
| `/admin/students` | ✅ Done | Student list with status filter, real Convex query |
| `/admin/students/create` | ✅ Done | Enrollment form |
| `/admin/students/import` | ✅ Done | CSV import |
| `/admin/students/[studentId]` | ✅ Done | Student detail + edit |
| `/admin/tasks` | ✅ Done | Task management |
| `/admin/tickets` | ✅ Done | Support ticket list + create + `[ticketId]` detail |
| `/admin/timetable` | ✅ Done | Timetable grid view |
| `/admin/timetable/schedule` | ✅ Done | Slot create/manage form with Zod validation |
| `/admin/timetable/events` | ✅ Done | School events calendar |
| `/admin/timetable/assignments` | ✅ Done | Room/teacher assignment |
| `/admin/transport` | ✅ Done | Routes + vehicles + drivers |
| `/admin/transport/routes` | ✅ Done | Route list + student assignment |
| `/admin/transport/tracking` | ⚠️ Partial | UI scaffolded; real-time vehicle location requires a GPS integration not yet wired |
| `/admin/users` | ✅ Done | User management |

### Platform Admin (`/platform`)

| Route | Status | Issue |
|---|---|---|
| `/platform` (dashboard) | ✅ Done | |
| `/platform/tenants` | ✅ Done | Tenant list + create + `[tenantId]` detail |
| `/platform/billing` | ✅ Done | |
| `/platform/analytics` | ✅ Done | |
| `/platform/audit` | ✅ Done | |
| `/platform/automation` | ✅ Done | |
| `/platform/changelog` | ✅ Done | |
| `/platform/communications` | ✅ Done | Platform-wide broadcast |
| `/platform/crm` | ✅ Done | |
| `/platform/data-export` | ✅ Done | |
| `/platform/feature-flags` | ✅ Done | |
| `/platform/health` | ✅ Done | |
| `/platform/impersonation` | ✅ Done | |
| `/platform/knowledge-base` | ✅ Done | |
| `/platform/marketplace` | ✅ Done | |
| `/platform/notifications` | ✅ Done | |
| `/platform/onboarding` | ✅ Done | |
| `/platform/operations` | ✅ Done | |
| `/platform/pm` | ✅ Done | Project management |
| `/platform/role-builder` | ✅ Done | |
| `/platform/scheduled-reports` | ✅ Done | |
| `/platform/security` | ✅ Done | |
| `/platform/settings` | ✅ Done | |
| `/platform/sla` | ✅ Done | |
| `/platform/staff-performance` | ✅ Done | |
| `/platform/tenant-success` | ✅ Done | |
| `/platform/tickets` | ✅ Done | |
| `/platform/users` | ✅ Done | |
| `/platform/waitlist` | ✅ Done | |
| `/platform/webhooks` | ✅ Done | |
| `/platform/white-label` | ✅ Done | |
| `/platform/api-keys` | ✅ Done | |

### Student Portal (`/portal/student`)

| Route | Status | Issue |
|---|---|---|
| `/portal/student` (dashboard) | ✅ Done | Grades, attendance, assignments, wallet from Convex |
| `/portal/student/grades` | ✅ Done | |
| `/portal/student/attendance` | ✅ Done | |
| `/portal/student/assignments` | ✅ Done | |
| `/portal/student/timetable` | ✅ Done | |
| `/portal/student/wallet` | ✅ Done | |
| `/portal/student/report-cards` | ✅ Done | |
| `/portal/student/communications` | ✅ Done | |
| `/portal/student/notifications` | ✅ Done | |
| `/portal/student/profile` | ✅ Done | |

### Teacher Portal (`/portal/teacher`)

| Route | Status | Issue |
|---|---|---|
| `/portal/teacher` (dashboard) | ✅ Done | Classes, assignments count, today's classes from Convex |
| `/portal/teacher/classes` | ✅ Done | |
| `/portal/teacher/gradebook` | ✅ Done | |
| `/portal/teacher/attendance` | ✅ Done | |
| `/portal/teacher/assignments` | ✅ Done | |
| `/portal/teacher/timetable` | ✅ Done | |
| `/portal/teacher/communications` | ✅ Done | |
| `/portal/teacher/notifications` | ✅ Done | |
| `/portal/teacher/profile` | ✅ Done | |

### Parent Portal (`/portal/parent`)

| Route | Status | Issue |
|---|---|---|
| `/portal/parent` (dashboard) | ✅ Done | Children, fee overview from Convex |
| `/portal/parent/children` | ✅ Done | |
| `/portal/parent/fees` | ✅ Done | |
| `/portal/parent/payments` | ✅ Done | |
| `/portal/parent/announcements` | ✅ Done | |
| `/portal/parent/messages` | ✅ Done | |
| `/portal/parent/dashboard` | ✅ Done | |
| `/portal/parent/communications` | ✅ Done | |
| `/portal/parent/notifications` | ✅ Done | |
| `/portal/parent/profile` | ✅ Done | |

### Alumni Portal (`/portal/alumni`)

| Route | Status | Issue |
|---|---|---|
| `/portal/alumni` | ✅ Done | |
| `/portal/alumni/directory` | ✅ Done | |
| `/portal/alumni/events` | ✅ Done | |
| `/portal/alumni/transcripts` | ✅ Done | |
| `/portal/alumni/finance` | ✅ Done | |
| `/portal/alumni/hr` | ✅ Done | |
| `/portal/alumni/library` | ✅ Done | |
| `/portal/alumni/timetable` | ✅ Done | |
| `/portal/alumni/communications` | ✅ Done | |
| `/portal/alumni/notifications` | ✅ Done | |
| `/portal/alumni/profile` | ✅ Done | |

---

## 5. Missing Features — Prioritized List

### CRITICAL (blocks core usage)

| Module | Panel | Feature | What's Missing | Suggested Fix |
|---|---|---|---|---|
| Finance | All | M-Pesa production URLs | `DARAJA_OAUTH` and `DARAJA_STK_PUSH` are hardcoded to `sandbox.safaricom.co.ke` in `convex/actions/payments/mpesa.ts:7-8` | Make URL conditional on `MPESA_ENVIRONMENT` env var |
| Auth | All | `receptionist` role permissions | Role defined in `shared/src/validators/index.ts` and `shared/src/constants/index.ts` but absent from `convex/helpers/authorize.ts` `ROLE_PERMISSIONS` map. Users assigned this role silently receive zero permissions | Add receptionist to `ROLE_PERMISSIONS` with appropriate permissions (e.g. `students:read`, `communications:read`) |
| Finance | All | Bank transfer env vars | `BANK_ACCOUNT_NUMBER`, `BANK_NAME`, `BANK_BRANCH`, `BANK_SWIFT` are commented out in `.env.example`; at runtime `convex/actions/payments/bankTransfer.ts:27` throws if unset | Move to active section of `.env.example` |
| DevOps | Infra | Dev auth bypass | `ENABLE_DEV_AUTH_BYPASS=true` in `.env.local` enables unauthenticated Convex access | Confirm it is absent from all Vercel production environment variables |

### HIGH (significantly degrades functionality)

| Module | Panel | Feature | What's Missing | Suggested Fix |
|---|---|---|---|---|
| Academics | Admin | Per-student report card generation UI | `/admin/academics/reports` shows aggregate stats only; no UI to trigger `generateReportCard` mutation per student | Add student picker + term/year selector calling `generateReportCard` |
| Academics | All | Uganda/Tanzania GPA scales | `calculateGPA()` in `convex/modules/academics/mutations.ts:347` only implements Kenya CBC/8-4-4 letter bands | Add `CURRICULUM_CODE` field to tenant config; branch GPA logic per curriculum |
| Admissions | Admin | Document upload UI | Backend model supports documents; frontend admissions page lists applications but has no document upload/review interface | Add Convex file storage upload and document viewer in `[applicationId]` detail page |
| HR | Admin | Performance scoring UI | `/admin/hr/performance` lists staff members but shows no KPI scores or review form; `platform/staffPerformance` backend exists | Wire up frontend to `platform.staffPerformance` mutations |
| Transport | Admin | Real-time GPS tracking | `/admin/transport/tracking` route exists but location data display is scaffolded; `updateVehicleLocation` mutation exists but frontend map is not wired | Integrate a map component (Mapbox/Google Maps) subscribed to Convex real-time vehicle location |
| Timetable | Admin | Conflict auto-resolution | Conflict detection query exists; UI shows conflicts but offers no automatic resolution | Add suggested-slot algorithm in timetable mutations |
| Finance | Admin | Airtel Money staging → production | `shared/src/lib/airtel.ts` connects to Airtel staging environment | Add `AIRTEL_ENVIRONMENT` env-var switch to production endpoint |

### MEDIUM

| Module | Panel | Feature | What's Missing | Suggested Fix |
|---|---|---|---|---|
| Crons | Backend | TypeScript-safe cron references | `crons.ts` uses `(internal as any)` for three maintenance jobs, bypassing compile-time checking | Import maintenance functions directly via typed `internal` reference |
| Academics | Backend | Report card PDF export | `generateReportCard` stores the record but returns JSON; no PDF rendering action | Add a Convex action using a PDF library or call a Next.js API route to render PDF |
| Finance | Admin | Partial payment UI | Backend supports `partially_paid` status; invoice detail UI does not show multiple payment rows nor allow partial top-up | Enhance invoice detail to list all payments for an invoice |
| Mobile | Mobile | Teacher/Admin panels missing | Mobile app only covers Student, Parent, and Teacher dashboard views; no admin panel on mobile | Scope decision — flag for roadmap |
| Mobile | Mobile | `RefreshControl` no-op | `DashboardScreen.tsx:139` passes `onRefresh={() => undefined}` — pull-to-refresh does nothing | Implement `refetch` via Convex invalidation on pull |
| Communications | All | Push notifications public action | `sendPushInternal` is only an `internalAction`; there is no public-facing action for school admins to trigger targeted push from the UI | Add a public `sendPush` action with `requirePermission(tenant, "communications:broadcast")` |
| Security | Platform | IP allowlist for M-Pesa callbacks | `MPESA_ALLOWED_IPS` env var is documented but no middleware enforces Safaricom IP allowlisting on the callback route | Add IP validation in `/payments/mpesa/callback` handler |

### LOW

| Module | Panel | Feature | What's Missing | Suggested Fix |
|---|---|---|---|---|
| Finance | Admin | Receipt PDF download | `generateReceipt` mutation builds receipt data; no PDF download button in invoice UI | Add "Download Receipt" button calling `generateReceipt` and rendering PDF |
| Library | Admin | Digital book resources | Schema and UI support physical books only; no ebook/resource links | Add optional `resourceUrl` field |
| Shared | All | `receptionist` role label in UI | Role exists in constants but missing from authorize.ts — once fixed, ensure role picker in user management includes it | Minor UI label work |
| Docs | — | API reference | `docs/` directory referenced in README but not verified in file tree | Generate from OpenAPI spec or inline comments |

---

## 6. Payment Integration Status

### M-Pesa (Daraja STK Push)

| Step | Implemented | Notes |
|---|---|---|
| Initiation (STK Push) | ✅ | `convex/actions/payments/mpesa.ts` — OAuth + STK Push request |
| Pending callback storage | ✅ | `savePaymentCallback` internal mutation |
| Webhook handler | ✅ | `http.ts:/payments/mpesa/callback` — parses `MpesaCallback` |
| Ledger posting | ✅ | `recordPaymentFromGatewayInternal` → `postConfirmedPayment` → `ensureLedgerEntryForPayment` |
| Invoice reconciliation | ✅ | `reconcileInvoiceStatus` auto-updates invoice status |
| Phone normalization | ✅ | Converts `07xx` → `254xx` |
| Idempotency | ✅ | `paymentCallbacks` table prevents double-processing |
| **SANDBOX HARDCODED** | ❌ | `const DARAJA_OAUTH = "https://sandbox.safaricom.co.ke/..."` — not driven by env var |

### Airtel Money

| Step | Implemented | Notes |
|---|---|---|
| OAuth | ✅ | `shared/src/lib/airtel.ts` |
| Initiation | ✅ | `initiateAirtelPayment` in `modules/finance/actions.ts` |
| Network detection | ✅ | `AirtelService.isAirtelNumber()` checks Airtel prefixes |
| Webhook handler | ✅ | `http.ts:/payments/airtel/callback` |
| Ledger posting | ✅ | Via `recordPaymentFromGateway` |
| Idempotency | ✅ | `paymentCallbacks` table |
| **STAGING ENVIRONMENT** | ⚠️ | `shared/src/lib/airtel.ts` connects to Airtel staging |

### Stripe

| Step | Implemented | Notes |
|---|---|---|
| Checkout Session creation | ✅ | `convex/actions/payments/stripe.ts` |
| Multi-currency (KES/UGX/TZS/RWF/ETB/GHS) | ✅ | `COUNTRY_TO_CURRENCY` map in action |
| Webhook handler | ✅ | `http.ts:/payments/stripe/webhook` |
| HMAC-SHA256 signature verification | ✅ | `verifyStripeSignature()` with timing-safe compare |
| Handled events | ✅ | `checkout.session.completed`, `async_payment_succeeded`, `async_payment_failed`, `expired` |
| Ledger posting | ✅ | Via `recordPaymentFromGateway` |

### Bank Transfer (Manual)

| Step | Implemented | Notes |
|---|---|---|
| Reference generation | ✅ | `EMB-YYYY-XXXX` format |
| Bank account details returned | ✅ | Reads `BANK_ACCOUNT_NUMBER`, `BANK_NAME`, `BANK_BRANCH`, `BANK_SWIFT` |
| Manual verification by officer | ✅ | `verifyBankTransfer` mutation (requires `finance:write`) |
| Ledger posting | ✅ | Via `postConfirmedPayment` |
| **ENV VARS MISSING FROM .env.example** | ❌ | `BANK_*` vars are commented out under "Optional" |

### Fee Allocation to Student Ledger

| Step | Implemented | Notes |
|---|---|---|
| `ledgerEntries` table | ✅ | Defined in `schema.ts` with `by_student`, `by_invoice`, `by_payment` indexes |
| Payment auto-posts to ledger | ✅ | `ensureLedgerEntryForPayment` — idempotent, won't double-post |
| Invoice status reconciliation | ✅ | `pending` → `partially_paid` → `paid` based on total completed payments |
| Student balance calculation | ✅ | Derived from `ledgerEntries` by student |

---

## 7. Communication Integration Status

### SMS — Africa's Talking

| Feature | Status | Notes |
|---|---|---|
| Single SMS send | ✅ | `convex/actions/communications/sms.ts:sendSms` |
| Bulk SMS | ✅ | `sendBulkSms` — comma-joined phone list |
| Country-aware phone normalization | ✅ | `normalisePhoneNumber()` per tenant country |
| Internal SMS (from crons/system) | ✅ | `sendSmsInternal` internalAction |
| Audit logging | ✅ | Logs `communication.sms_sent` on every send |
| `AT_API_KEY` / `AT_USERNAME` env | ✅ | Documented in `.env.example` |

### Email — Resend + React Email

| Feature | Status | Notes |
|---|---|---|
| Individual email send | ✅ | `convex/actions/communications/email.ts` |
| Bulk email | ✅ | |
| System templates | ✅ | `fee_reminder`, `exam_results`, `attendance_alert`, `payslip` |
| Custom templates with variable substitution | ✅ | `{{variable}}` replacement in `modules/communications/templates.ts` |
| Validation | ✅ | Email address validated before send |
| Audit logging | ✅ | `communication.email_sent` |
| `RESEND_API_KEY` env | ✅ | Documented in `.env.example` |

### In-App Notifications

| Feature | Status | Notes |
|---|---|---|
| Create notification | ✅ | `ctx.db.insert("notifications", ...)` |
| Read/unread tracking | ✅ | `isRead` field, mark-read mutation |
| Real-time subscription | ✅ | Convex `useQuery` on `notifications` table |
| Overdue invoice auto-notifications | ✅ | `system/maintenance.ts:sendOverdueInvoiceAlerts` cron |
| Broadcast to role group | ✅ | `platform/communications` mutations |

### Push Notifications — Expo

| Feature | Status | Notes |
|---|---|---|
| Device token registration | ✅ | `mobileDeviceTokens` table; `mobile.device_token_registered` audit action |
| Expo push send (internal) | ✅ | `convex/actions/communications/push.ts:sendPushInternal` — batched in chunks of 100 |
| FCM/APNS token storage | ✅ | `mobileDeviceTokens.provider` field supports `expo`, `fcm`, `apns` |
| **Public send action missing** | ⚠️ | `sendPushInternal` is `internalAction` only; school admin UI cannot trigger push directly |

---

## 8. Mobile App Status

**Technology:** React Native + Expo  
**Auth:** Magic link via browser handoff (approve URL) + polling for session completion  
**Offline:** `useOfflineSync` + `useCachedQueryValue` — last fetched data persists when offline; offline banner shown

| Screen | File | Roles Covered | Real Convex Data | Offline Cache | Status |
|---|---|---|---|---|---|
| LoginScreen | `screens/LoginScreen.tsx` | All | N/A | N/A | ✅ |
| DashboardScreen | `screens/DashboardScreen.tsx` | Student, Parent, Teacher | ✅ (role-conditional queries) | ✅ | ✅ |
| GradesScreen | `screens/GradesScreen.tsx` | Student | ✅ | ✅ | ✅ |
| AttendanceScreen | `screens/AttendanceScreen.tsx` | Student | ✅ | ✅ | ✅ |
| FeesScreen | `screens/FeesScreen.tsx` | Student, Parent | ✅ | ✅ | ✅ |
| AssignmentsScreen | `screens/AssignmentsScreen.tsx` | Student, Teacher | ✅ | ✅ | ✅ |
| ProfileScreen | `screens/ProfileScreen.tsx` | All | ✅ | ✅ | ✅ |

**Panels with no mobile coverage (web-only):**
- School Admin, Platform Admin, Bursar, HR Manager, Librarian, Transport Manager, Alumni, Partner

**Known mobile issues:**
- `RefreshControl` `onRefresh` is a no-op (`() => undefined`) in `DashboardScreen.tsx` — pull-to-refresh does not actually refetch data
- No navigation to transport/timetable from mobile (Quick Actions link labels are placeholder text like "Timetable" pointing to `fees` screen)

---

## 9. Auth & Tenant Isolation Issues

### Tenant Guard (`convex/helpers/tenantGuard.ts`)

| Check | Status | Notes |
|---|---|---|
| Session token lookup in DB | ✅ | `by_token` index on `sessions` table |
| Session expiry enforcement | ✅ | `session.expiresAt < Date.now()` throws `UNAUTHENTICATED` |
| `tenantId` format validation | ✅ | Must start with `TENANT-` or equal `PLATFORM` |
| Dev bypass | ⚠️ | `ENABLE_DEV_AUTH_BYPASS=true` + `NODE_ENV !== "production"` allows bypass — safe only if env var is absent in production |
| `requireTenantContext` used in all modules | ✅ | Verified across all 11 school modules |
| Action context (`requireActionTenantContext`) | ✅ | Used in SMS, email, payment actions |

### Authorization (`convex/helpers/authorize.ts`)

| Check | Status | Notes |
|---|---|---|
| 14 roles defined | ⚠️ | `receptionist` appears in validators/constants but is **absent from `ROLE_PERMISSIONS`** — silently grants zero permissions |
| 40+ permissions defined | ✅ | |
| Wildcard permission `*` for master override | ✅ | `if (ctx.permissions.includes("*")) return;` |
| `requirePermission` used in modules | ✅ | Verified across all modules |
| `requireRole` for platform-only ops | ✅ | Used in platform guards |

### Frontend Auth Guards

| Guard | Location | Status |
|---|---|---|
| WorkOS session check on admin routes | `frontend/src/app/admin/layout.tsx` | ✅ |
| WorkOS session check on platform routes | `frontend/src/app/platform/layout.tsx` | ✅ |
| WorkOS session check on portal routes | `frontend/src/app/portal/*/layout.tsx` | ✅ |
| Role-based access control on frontend | `useAuth` hook + `RoleGuard` component | ✅ |
| Module access guard | `ModuleAccessGuard` component | ✅ |
| `sessionToken` passed to all Convex queries | ✅ | All queries use `sessionToken` from `useAuth()` |
| Subdomain-based tenant routing | Next.js middleware + `NEXT_PUBLIC_ROOT_DOMAIN` | ✅ |

### HTTP Webhook Security

| Webhook | Signature Verification | Status |
|---|---|---|
| WorkOS | HMAC-SHA256 with timestamp tolerance | ✅ |
| Stripe | HMAC-SHA256 with 5-min replay protection | ✅ |
| M-Pesa | Callback lookup by `CheckoutRequestID` (no HMAC — M-Pesa doesn't send one) | ✅ (correct per Daraja spec) |
| Airtel | Callback lookup by `transactionId` | ✅ |

---

## 10. Shared Layer Gaps

### Types (`shared/src/types/index.ts`)

| Domain | Status | Notes |
|---|---|---|
| Tenant, TenantTier, TenantStatus | ✅ | |
| UserRole (14 roles) | ⚠️ | `receptionist` in types but missing from `authorize.ts` |
| Module (11 modules) | ✅ | |
| Student, Staff, Guardian, Alumni, Partner | ✅ | |
| Payment, PaymentMethod, PaymentStatus | ✅ | |
| Invoice, FeeStructure, LedgerEntry | ✅ | |
| Grade, Attendance, Assignment, Submission | ✅ | |
| AcademicYear, AcademicTerm | ✅ | |
| Class, Subject, Room, Timetable | ✅ | |
| TransportRoute, Vehicle, Driver | ✅ | |
| Book, BookBorrow | ✅ | |

### Validators (`shared/src/validators/index.ts`)

All 20 Zod schemas verified present and used:

| Schema | Status |
|---|---|
| `createTenantSchema` | ✅ |
| `createUserSchema` | ✅ |
| `createStudentSchema` | ✅ |
| `createStudentWithGuardianSchema` | ✅ |
| `createStudentImportSchema` | ✅ |
| `createPaymentSchema` | ✅ |
| `createInvoiceSchema` | ✅ |
| `createFeeStructureSchema` | ✅ |
| `generateInvoiceSchema` | ✅ |
| `createStaffSchema` | ✅ |
| `createClassSchema` | ✅ |
| `createBookSchema` | ✅ |
| `createTransportRouteSchema` | ✅ |
| `assignStudentToRouteSchema` | ✅ |
| `createProductSchema` | ✅ |
| `updateOrderStatusSchema` | ✅ |
| `requestWalletTopUpSchema` | ✅ |
| `createTimetableSlotSchema` | ✅ (imported and used in `/admin/timetable/schedule`) |
| `createSchoolEventSchema` | ✅ |
| `paginationSchema` | ✅ |

**Gap:** No Zod schemas for admissions applications, staff contracts, library borrows, or payroll runs — these use Convex `v.` validators directly in backend but have no shared Zod counterpart for frontend form validation.

### Constants (`shared/src/constants/index.ts`)

| Constant Group | Status | Notes |
|---|---|---|
| `USER_ROLES` (14 roles with levels) | ⚠️ | `receptionist` present here but missing from authorize.ts |
| `MODULES` (11 modules) | ✅ | |
| `TIER_MODULES` (starter/standard/pro/enterprise) | ✅ | |
| `CURRICULUM_CODES` (KE-CBC, KE-8-4-4, UG-UNEB, TZ-NECTA, RW-REB, ET-MOE, GH-WAEC) | ✅ | Defined but **not used** in GPA calculation logic |
| `SUPPORTED_COUNTRIES` (KE, UG, TZ, RW, ET, GH) | ✅ | |
| `getCurrencyForCountry()` | ✅ | |
| `DATE_FORMAT` / `DATETIME_FORMAT` | ✅ | |

**Gap:** `CURRICULUM_CODES` are defined but the `calculateGPA()` function in `convex/modules/academics/mutations.ts` is hardcoded to the Kenya CBC letter-band scale. Uganda (UNEB uses O-level divisions), Tanzania (NECTA A-F), and Rwanda (REB percentages) grading systems are not differentiated.

---

## 11. Infra & CI/CD Gaps

### CI/CD (`.github/workflows/ci.yml`)

| Stage | Implemented | Notes |
|---|---|---|
| Lint | ✅ | `npm run lint` |
| TypeScript type-check | ✅ | `npm run type-check` |
| Unit tests (with coverage) | ✅ | `npm run test -- --coverage`; coverage artifact uploaded |
| Tenant isolation tests | ✅ | `npm run test:tenant-isolation` (separate job) |
| E2E (Playwright smoke) | ✅ | `npx playwright install` + `npm run test:e2e:smoke` |
| Convex schema validation | ✅ | `npx tsc --noEmit --project convex/tsconfig.json` |
| Mobile lint, types, tests | ✅ | Separate job for mobile workspace |
| Security audit | ✅ | `npm audit --audit-level=high` + TruffleHog secret scan |

**Gaps:**
- No Convex deployment step in `ci.yml` — deployments happen via `deploy-preview.yml` and `deploy-production.yml` (separate workflows)
- No integration test against a live Convex dev environment in CI
- Coverage threshold not enforced (coverage is uploaded but no minimum % gate)

### Hosting & Environment

| Concern | Status | Notes |
|---|---|---|
| Vercel subdomain routing (`*.edumyles.com`) | ✅ | `NEXT_PUBLIC_ROOT_DOMAIN` + Next.js middleware |
| Convex production deployment | ✅ | `CONVEX_DEPLOY_KEY` documented |
| All required env vars documented | ⚠️ | `BANK_*` vars missing from active section; `WORKOS_WEBHOOK_SECRET` documented |
| Sentry error monitoring | ⚠️ | Documented in `.env.example` but commented out under "Optional" — not wired in production |
| Turborepo monorepo | ✅ | Workspaces: `frontend`, `mobile`, `shared`, `landing` |
| `.nvmrc` for Node version | ✅ | `>=20.9.0` |

### Test Coverage Assessment

| Layer | Tests Present | Coverage |
|---|---|---|
| Shared lib | `billing.test.ts`, `payroll.test.ts`, `grading.test.ts` | Unit — billing, payroll, grading logic |
| Mobile | `__tests__/cache.test.ts`, `theme.test.ts` | Unit — cache and theme |
| Frontend | Playwright E2E smoke suite | Smoke only |
| Convex backend | `test:tenant-isolation` script referenced | Scope unknown — script not inspected |
| Payment callbacks | No unit tests | Webhook handler not unit-tested |

**Coverage estimate:** ~40-50% of critical paths. No mutation/query unit tests for the Convex backend itself.

---

## 12. Recommended Implementation Priority Order

Sprint-ready backlog, most critical first:

### Sprint 1 — Production Blockers (before any live school)

1. **Fix M-Pesa URLs**: Make `DARAJA_OAUTH` and `DARAJA_STK_PUSH` conditional on `MPESA_ENVIRONMENT` env var in `convex/actions/payments/mpesa.ts`
2. **Fix `receptionist` role**: Add entry to `ROLE_PERMISSIONS` in `convex/helpers/authorize.ts` with appropriate read permissions
3. **Fix Bank Transfer env documentation**: Move `BANK_*` vars to the active (non-commented) section of `.env.example`
4. **Production env audit**: Confirm `ENABLE_DEV_AUTH_BYPASS` is absent from all Vercel production env configs
5. **Fix Airtel environment**: Add `AIRTEL_ENVIRONMENT` switch in `shared/src/lib/airtel.ts` to toggle staging vs. production endpoint

### Sprint 2 — High-Value Missing Features

6. **Report card generation UI**: Add student picker in `/admin/academics/reports` calling `generateReportCard` mutation; add PDF export action
7. **Multi-curriculum GPA**: Branch `calculateGPA()` on tenant `curriculumCode` for UG-UNEB, TZ-NECTA, RW-REB
8. **Admissions document upload**: Add Convex file storage upload in admissions application detail page
9. **HR performance UI**: Wire `/admin/hr/performance` to `platform.staffPerformance` queries/mutations
10. **Public push notification action**: Add `sendPush` public action with `communications:broadcast` permission guard

### Sprint 3 — Mobile & UX Polish

11. **Fix mobile pull-to-refresh**: Replace `onRefresh={() => undefined}` with actual Convex invalidation in `DashboardScreen.tsx`
12. **Fix mobile Quick Action labels**: "Timetable" button currently navigates to `fees` screen — correct navigation targets
13. **Partial payment UI**: Enhance invoice detail to display each payment row and remaining balance
14. **Transport GPS map**: Integrate Mapbox/Leaflet component subscribed to `updateVehicleLocation` real-time Convex query

### Sprint 4 — Security & Observability

15. **Wire Sentry**: Move `NEXT_PUBLIC_SENTRY_DSN` from "Optional" to required; add `Sentry.init()` in `frontend/src/app/layout.tsx`
16. **M-Pesa IP allowlist**: Implement Safaricom IP validation in `http.ts` M-Pesa callback handler
17. **Remove `(internal as any)` casts in `crons.ts`**: Import maintenance functions via typed `internal` reference
18. **CI coverage gate**: Add a minimum coverage threshold (suggest 60%) to the `test` CI job

### Sprint 5 — Completeness Improvements

19. **Zod validators for admissions/payroll/contracts**: Add shared schemas for forms that currently validate server-side only
20. **`CURRICULUM_CODES` integration**: Thread curriculum code from tenant settings through academics module to enable correct grading, report card headers, and assessment type labels per country
21. **Receipt PDF download**: Add "Download Receipt" action in invoice detail page
22. **Mobile teacher/admin panels**: Evaluate roadmap priority for admin-facing mobile screens

---

*End of audit report — generated 2026-04-04*
