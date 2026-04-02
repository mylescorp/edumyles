# EduMyles — End-to-End Implementation Audit Report

Generated: 2026-04-02
Auditor: Kilo (kilo-auto/free)
Branch audited: `codex/marketplace-e2e-fixes`
Monorepo root: `c:\Users\Admin\Projects\edumyles`

---

## 1. Executive Summary

### Overall Implementation Completeness: **~72%**

EduMyles is a mature, feature-rich school management SaaS with substantial implementation across backend, frontend, and infrastructure layers. The Convex backend is the strongest layer (~95% implemented). The frontend admin/platform panels are well-wired to real data (~85%). The shared layer has domain logic but critical type consistency issues. The mobile app is a non-functional scaffold (~5% complete).

### Critical Blockers

| #   | Blocker                                                                                                                                 | Impact                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | **Shared type/validator/backend schema mismatch** — `TenantTier`, `UserRole`, `Tenant` shape all diverge across layers                  | Runtime type errors, data corruption                     |
| 2   | **Multiple unguarded mutations** — `promoteUserEmailToMasterAdmin`, `emergencyAdmin.ts`, `repairMasterAdminByEmail` have no auth checks | Security vulnerability — anyone can create master admins |
| 3   | **`PLAN_PRICES_CENTS` undefined** in `platform/billing/queries.ts:101`                                                                  | Billing overview crashes at runtime                      |
| 4   | **E2E test infrastructure broken** — missing `fixtures/auth.fixture.ts`, `global-setup.ts`, `global-teardown.ts`                        | CI pipeline `tenant-isolation` job will fail             |
| 5   | **Hardcoded Convex deploy keys** in 5 PowerShell scripts                                                                                | Credential leak risk                                     |
| 6   | **Mobile app cannot compile** — missing `useAuth` hook and 5 of 7 screen files                                                          | Zero mobile functionality                                |

### Module Implementation Summary

| Status                   | Count | Modules                                                                                                                                                                                                                                                    |
| ------------------------ | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ Fully Implemented     | 11    | SIS, Admissions, Finance, Timetable, Academics, HR, Library, Transport, Communications, eWallet, eCommerce                                                                                                                                                 |
| ⚠️ Partially Implemented | 8     | Platform Billing (runtime bug), Platform Marketplace (mock payments), Platform Automation (mock steps), Platform AI Support (rule-based), Platform Communications (in-app only), Shared Layer (type mismatches), Mobile App (scaffold), E2E Tests (broken) |
| ❌ Not Started           | 2     | Airtel Money payment integration, Real AI/ML features                                                                                                                                                                                                      |

---

## 2. User Panels Identified

| #   | Panel                             | Route Prefix        | Roles                                                                                                                | Status                     |
| --- | --------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 1   | **Platform Admin (Master Admin)** | `/platform`         | `master_admin`, `super_admin`                                                                                        | ✅ Operational             |
| 2   | **School Admin**                  | `/admin`            | `school_admin`, `principal`, `bursar`, `hr_manager`, `librarian`, `transport_manager`, `master_admin`, `super_admin` | ✅ Operational             |
| 3   | **Student Portal**                | `/portal/student`   | `student`                                                                                                            | ✅ Operational (read-only) |
| 4   | **Teacher Portal**                | `/portal/teacher`   | `teacher`                                                                                                            | ✅ Operational             |
| 5   | **Parent Portal**                 | `/portal/parent`    | `parent`                                                                                                             | ✅ Operational             |
| 6   | **Alumni Portal**                 | `/portal/alumni`    | `alumni`                                                                                                             | ✅ Operational             |
| 7   | **Partner Portal**                | `/portal/partner`   | `partner`                                                                                                            | ✅ Operational             |
| 8   | **Portal Admin (Modular)**        | `/portal/admin`     | `school_admin`, `principal`                                                                                          | ✅ Operational             |
| 9   | **Legacy Student Portal**         | `/(portal)/student` | `student`                                                                                                            | ⚠️ Duplicate routes exist  |
| 10  | **Support Tickets**               | `/(portal)/support` | `student`                                                                                                            | ✅ Operational             |
| 11  | **Landing/Marketing**             | Landing site        | Public                                                                                                               | ✅ Separate Next.js app    |
| 12  | **Mobile App**                    | N/A                 | `student` (planned)                                                                                                  | ❌ Non-functional          |

---

## 3. Backend Module Status

### 3.1 Core Modules

| Module                         | Functions Found | Fully Impl. | Stubs/Partial | Missing | Notes                                                                 |
| ------------------------------ | --------------- | ----------- | ------------- | ------- | --------------------------------------------------------------------- |
| **SIS** (mutations)            | 5               | 5           | 0             | 0       | `createGuardian` missing audit log                                    |
| **SIS** (queries)              | 5               | 5           | 0             | 0       | Silent error swallowing in catch blocks                               |
| **Admissions** (mutations)     | 2               | 2           | 0             | 0       | Clean; cross-module dep on SIS                                        |
| **Admissions** (queries)       | 3               | 3           | 0             | 0       | Clean                                                                 |
| **Finance** (mutations)        | 9               | 9           | 0             | 0       | `pendingId: "pending"` bug; `generateReceipt` should be query         |
| **Finance** (queries)          | 6               | 6           | 0             | 0       | Clean                                                                 |
| **Finance** (actions)          | 4               | 4           | 0             | 0       | Real M-Pesa + Stripe; no `requireTenantContext` (uses webhook secret) |
| **Timetable** (mutations)      | 5               | 5           | 0             | 0       | Clean; full audit logging                                             |
| **Timetable** (queries)        | 6               | 6           | 0             | 0       | Real conflict detection (O(n²))                                       |
| **Academics** (mutations)      | 7               | 7           | 0             | 0       | Hardcoded term dates (`2025-01-01`, `2025-04-01`)                     |
| **Academics** (queries)        | 12              | 12          | 0             | 0       | Cross-module deps on SIS + Timetable                                  |
| **HR** (mutations)             | 9               | 9           | 0             | 0       | 5/9 missing audit logs                                                |
| **HR** (queries)               | 8               | 8           | 0             | 0       | `getRecentActivities` action string mismatch (underscores vs dots)    |
| **Library** (mutations)        | 4               | 4           | 0             | 0       | Zero audit logging                                                    |
| **Library** (queries)          | 6               | 6           | 0             | 0       | Comprehensive reports                                                 |
| **Transport** (mutations)      | 6               | 6           | 0             | 0       | Zero audit logging                                                    |
| **Transport** (queries)        | 5               | 5           | 0             | 0       | Unnecessary `"use node"` directive                                    |
| **Communications** (mutations) | 22              | 22          | 0             | 0       | Schema mismatch on `createEmailTemplate`                              |
| **Communications** (queries)   | 10              | 10          | 0             | 0       | Clean                                                                 |
| **Communications** (platform)  | 24              | 24          | 0             | 0       | Uses `requirePlatformSession`                                         |
| **eWallet** (mutations)        | 8               | 8           | 0             | 0       | Partial audit logging (3/8)                                           |
| **eWallet** (queries)          | 6               | 6           | 0             | 0       | Clean                                                                 |
| **eCommerce** (mutations)      | 6               | 6           | 0             | 0       | Zero audit logging; tight coupling to wallet tables                   |
| **eCommerce** (queries)        | 5               | 5           | 0             | 0       | Clean                                                                 |

### 3.2 Platform Modules

| Module                | Functions | Fully Impl. | Mock/Stub | Notes                                                                         |
| --------------------- | --------- | ----------- | --------- | ----------------------------------------------------------------------------- |
| **Tenants**           | 11        | 11          | 0         | Complete provisioning flow                                                    |
| **Billing**           | 8         | 8           | 0         | `PLAN_PRICES_CENTS` undefined (runtime crash)                                 |
| **Onboarding**        | 7         | 7           | 0         | 6-step wizard complete                                                        |
| **Users**             | 10        | 10          | 0         | Debug console.logs; unguarded `repairMasterAdminByEmail`                      |
| **Analytics**         | 6         | 6           | 1         | `exportReport` generates mock URL                                             |
| **Notifications**     | 7         | 7           | 0         | `createNotification` has no auth guard                                        |
| **CRM**               | 21        | 21          | 0         | Full pipeline + proposals                                                     |
| **Support (AI)**      | 13        | 13          | 2         | Rule-based keyword matching, not real ML                                      |
| **Feature Flags**     | 7         | 7           | 0         | Supports percentage/tenant/user targeting                                     |
| **Impersonation**     | 4         | 4           | 0         | 2-hour TTL, full audit logging                                                |
| **Role Builder**      | 8         | 8           | 0         | Custom roles + permission groups                                              |
| **Scheduled Reports** | 7         | 7           | 1         | `runNow` simulates completion                                                 |
| **Settings**          | 4         | 4           | 0         | Requires `master_admin` role                                                  |
| **Audit**             | 4         | 4           | 0         | Dual guard (platform + tenant)                                                |
| **Security**          | 18        | 18          | 2         | Mock vulnerability scan; mock connection test                                 |
| **Files**             | 5         | 5           | 0         | Clean                                                                         |
| **Webhooks**          | 8         | 8           | 2         | `testEndpoint` doesn't send HTTP; `retryDelivery` marks success without retry |
| **White Label**       | 4         | 4           | 0         | Clean                                                                         |
| **Dashboard**         | 3         | 3           | 0         | Read-only KPIs + charts                                                       |
| **Marketplace**       | 36        | 36          | 5         | M-Pesa/card/bank payments are ALL mocked                                      |
| **Knowledge Base**    | 13        | 13          | 0         | Full CRUD + search + analytics                                                |
| **Automation**        | 11        | 11          | 6         | All workflow action steps are mocked                                          |
| **Changelog**         | 5         | 5           | 0         | Inconsistent auth (manual session check)                                      |
| **Communications**    | 13        | 13          | 2         | Only `in_app` channel delivers; email/sms validated but not dispatched        |
| **Data Export**       | 4         | 4           | 0         | Clean                                                                         |
| **Health**            | 10        | 10          | 2         | Hardcoded service response times                                              |
| **Integration**       | 14        | 14          | 3         | Mock sync/test; `testIntegrationConnection` always returns success            |
| **Operations**        | 16        | 16          | 0         | Duplicate functions with platform/health                                      |
| **SLA**               | 6         | 6           | 0         | Inconsistent auth (manual session check)                                      |
| **Staff Performance** | 7         | 7           | 0         | Clean                                                                         |
| **Tenant Success**    | 10        | 10          | 0         | Clean                                                                         |
| **API Keys**          | 5         | 5           | 0         | Web Crypto API (SHA-256)                                                      |

### 3.3 Core Files

| File                | Functions  | Status | Notes                                                               |
| ------------------- | ---------- | ------ | ------------------------------------------------------------------- |
| `auth.ts`           | 0 (events) | ✅     | WorkOS AuthKit; `organizationId: undefined as any`                  |
| `sessions.ts`       | 7          | ✅     | Throws plain strings instead of ConvexError                         |
| `tenants.ts`        | 2          | ✅     | `getTenantByTenantId` has no auth guard                             |
| `users.ts`          | 15         | ⚠️     | `promoteUserEmailToMasterAdmin` has NO auth guard                   |
| `notifications.ts`  | 5          | ⚠️     | `createNotification` accepts any tenantId/userId without validation |
| `organizations.ts`  | 2          | ⚠️     | No guards on either function                                        |
| `tickets.ts`        | 7          | ✅     | SLA rules well-defined                                              |
| `emergencyAdmin.ts` | 1          | 🔴     | No auth guard — backdoor to create master admin                     |
| `testAdmin.ts`      | 1          | 🔴     | Hardcoded email — should be removed                                 |

### 3.4 Helpers

| File               | Functions | Status | Notes                                              |
| ------------------ | --------- | ------ | -------------------------------------------------- |
| `auditLog.ts`      | 3         | ✅     | 120+ action strings; some duplicates               |
| `authorize.ts`     | 3         | ✅     | 14 roles, 38 permissions                           |
| `idGenerator.ts`   | 6         | ✅     | `Math.random()` not cryptographically secure       |
| `moduleGuard.ts`   | 6         | ✅     | Tier validation + dependency checking              |
| `platformGuard.ts` | 1         | ⚠️     | Hardcoded master admin email `ayany004@gmail.com`  |
| `tenantGuard.ts`   | 4         | ⚠️     | `console.log` leaks session metadata in production |

### 3.5 Payment Integration Status

| Provider               | Initiation                                       | Callback/Webhook                                    | Ledger Posting                                         | Auto-Reconciliation                              | Status            |
| ---------------------- | ------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------ | ----------------- |
| **M-Pesa STK Push**    | ✅ Real Daraja API (`actions/payments/mpesa.ts`) | ✅ Webhook at `/api/webhooks/mpesa`                 | ✅ `recordPaymentFromGateway` updates invoice + ledger | ⚠️ `pendingId: "pending"` bug may cause mismatch | **90% Complete**  |
| **Stripe Checkout**    | ✅ Real API (`actions/payments/stripe.ts`)       | ✅ Webhook at `/api/webhooks/stripe`                | ✅ `recordPayment` updates invoice                     | ✅ Clean                                         | **100% Complete** |
| **Airtel Money**       | ❌ No initiation action                          | ⚠️ Webhook handler exists at `/api/webhooks/airtel` | ❌ No ledger posting                                   | ❌ N/A                                           | **10% Complete**  |
| **Bank Transfer**      | ❌ Not implemented                               | ❌ N/A                                              | ❌ N/A                                                 | ❌ N/A                                           | **0% Complete**   |
| **Marketplace M-Pesa** | ⚠️ Mock                                          | ⚠️ `processPaymentCallback` exists                  | ⚠️ Mock                                                | ❌ N/A                                           | **20% Complete**  |
| **Marketplace Stripe** | ⚠️ Mock                                          | ⚠️ Same callback                                    | ⚠️ Mock                                                | ❌ N/A                                           | **20% Complete**  |

### 3.6 Communication Integration Status

| Channel                    | Backend API                     | Templates                                                           | Trigger Points                   | Delivery                              | Status          |
| -------------------------- | ------------------------------- | ------------------------------------------------------------------- | -------------------------------- | ------------------------------------- | --------------- |
| **SMS (Africa's Talking)** | ✅ `sendSms`, `sendBulkSms`     | ✅ Default templates in `communications/templates`                  | Fee reminders, attendance alerts | ✅ Real API calls                     | **Implemented** |
| **Email (Resend)**         | ✅ `sendEmail`                  | 4 templates (fee_reminder, exam_results, attendance_alert, payslip) | Fee reminders, invites           | ✅ Real API calls                     | **Implemented** |
| **In-App Notifications**   | ✅ Full CRUD                    | N/A                                                                 | System events, announcements     | ✅ Real-time via Convex subscriptions | **Implemented** |
| **Push Notifications**     | ❌ No FCM/APNs setup            | ❌                                                                  | ❌                               | ❌                                    | **Not Started** |
| **Platform Comms (email)** | ⚠️ Validated but not dispatched | Stored in DB                                                        | `sendPlatformMessageNow`         | ❌ Only in_app channel works          | **Partial**     |
| **Platform Comms (sms)**   | ⚠️ Validated but not dispatched | Stored in DB                                                        | `sendPlatformMessageNow`         | ❌ Only in_app channel works          | **Partial**     |

---

## 4. Frontend Panel Status

### 4.1 Platform Admin Panel (`/platform`) — 52 routes

| Route                                   | Status     | Issue                                                                                  |
| --------------------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| `/platform` (Dashboard)                 | ✅ Done    | Real KPIs, charts, activity feed                                                       |
| `/platform/tenants`                     | ✅ Done    | Real data via `usePlatformQuery`                                                       |
| `/platform/tenants/create`              | ✅ Done    | 5-step provisioning wizard                                                             |
| `/platform/tenants/[tenantId]`          | ✅ Done    | Real data; `TenantDetailTabs` component                                                |
| `/platform/users`                       | ⚠️ Partial | Roles tab uses hardcoded `staticRoles`; Activity tab uses empty `useState([])`         |
| `/platform/users/invite`                | ✅ Done    | Full invite flow via API route                                                         |
| `/platform/users/[userId]`              | ⚠️ Partial | `handleResetPassword`, `handleToggle2FA`, `handleRevokeSession` are local-only         |
| `/platform/billing`                     | ✅ Done    | Real subscriptions; tier update wired                                                  |
| `/platform/billing/invoices`            | ✅ Done    | Real data                                                                              |
| `/platform/billing/invoices/create`     | ✅ Done    | Full form with line items                                                              |
| `/platform/analytics`                   | ⚠️ Partial | Custom Reports tab has 3 hardcoded entries; Create Report dialog doesn't call mutation |
| `/platform/crm`                         | ✅ Done    | Full pipeline with drag-and-drop                                                       |
| `/platform/crm/leads/create`            | ✅ Done    | Create wired to mutation                                                               |
| `/platform/crm/[dealId]`                | ⚠️ Partial | Local state only; Quick Actions are non-functional buttons                             |
| `/platform/crm/proposals`               | ✅ Done    | Create templates + generate proposals                                                  |
| `/platform/crm/proposals/[proposalId]`  | ⚠️ Partial | `handleSendProposal` uses `setTimeout(2000)` simulation                                |
| `/platform/tickets`                     | ✅ Done    | Real data                                                                              |
| `/platform/tickets/create`              | ✅ Done    | Create wired                                                                           |
| `/platform/tickets/[id]`                | ⚠️ Partial | `handleAddComment` logs to console instead of calling mutation                         |
| `/platform/notifications`               | ✅ Done    | Real data + mark read                                                                  |
| `/platform/communications`              | ✅ Done    | Real CRUD + send                                                                       |
| `/platform/communications/broadcast`    | ✅ Done    | Redirect to comms with broadcast tab                                                   |
| `/platform/feature-flags`               | ⚠️ Partial | Stats cards hardcoded (5 total, 3 active)                                              |
| `/platform/impersonation`               | ✅ Done    | Begin/end sessions wired                                                               |
| `/platform/health`                      | ✅ Done    | Real system health data                                                                |
| `/platform/security`                    | ⚠️ Partial | Threat Intelligence counts hardcoded; Compliance areas hardcoded                       |
| `/platform/audit`                       | ✅ Done    | Real audit logs                                                                        |
| `/platform/settings`                    | ✅ Done    | Full settings with sectioned save                                                      |
| `/platform/marketplace`                 | ✅ Done    | Fallback catalog for graceful degradation                                              |
| `/platform/marketplace/admin`           | ✅ Done    | Full admin panel                                                                       |
| `/platform/marketplace/[moduleId]`      | ✅ Done    | Install/uninstall/review wired                                                         |
| `/platform/marketplace/developer`       | ✅ Done    | Publisher registration + module management                                             |
| `/platform/marketplace/reviews`         | ✅ Done    | Review moderation                                                                      |
| `/platform/onboarding`                  | ✅ Done    | Full 6-step wizard                                                                     |
| `/platform/knowledge-base`              | ✅ Done    | Full CRUD                                                                              |
| `/platform/automation`                  | ⚠️ Partial | Create Workflow dialog closes without mutation; Run/View/Edit non-functional           |
| `/platform/changelog`                   | ✅ Done    | Create + delete wired                                                                  |
| `/platform/operations`                  | ✅ Done    | Full incident/maintenance/alert management                                             |
| `/platform/sla`                         | ✅ Done    | Create + delete wired                                                                  |
| `/platform/white-label`                 | ✅ Done    | Update + reset wired                                                                   |
| `/platform/webhooks`                    | ✅ Done    | Create + delete + test wired                                                           |
| `/platform/api-keys`                    | ✅ Done    | Create + revoke + rotate wired                                                         |
| `/platform/data-export`                 | ✅ Done    | Create export wired                                                                    |
| `/platform/profile`                     | ✅ Done    | Full profile with avatar, password, 2FA                                                |
| `/platform/role-builder`                | ✅ Done    | Full CRUD + duplicate                                                                  |
| `/platform/scheduled-reports`           | ✅ Done    | Full CRUD + run now                                                                    |
| `/platform/staff-performance`           | ⚠️ Partial | Feedback/goal dialogs close without mutation                                           |
| `/platform/staff-performance/[staffId]` | ⚠️ Partial | `handleSendFeedback`, `handleCreateGoal` non-functional                                |
| `/platform/tenant-success`              | ⚠️ Partial | Create Initiative/Metric dialogs non-functional                                        |
| `/platform/ai-support`                  | ⚠️ Partial | `Math.random()` for category counts; rule-based "AI"                                   |
| `/platform/pm`                          | ✅ Done    | Real workspace list                                                                    |
| `/platform/pm/[slug]`                   | ✅ Done    | Real project list                                                                      |
| `/platform/pm/[slug]/[projectId]`       | ✅ Done    | Kanban board                                                                           |

**Platform Summary**: 38/52 routes fully functional (73%), 14/52 partially functional (27%)

### 4.2 School Admin Panel (`/admin`) — 60 routes

| Route                                | Status     | Issue                                            |
| ------------------------------------ | ---------- | ------------------------------------------------ |
| `/admin` (Dashboard)                 | ✅ Done    | Real stats from SIS, HR, Finance                 |
| `/admin/students`                    | ✅ Done    | Real list                                        |
| `/admin/students/create`             | ✅ Done    | Full form with validation                        |
| `/admin/students/[studentId]`        | ⚠️ Partial | Academics tab says "module not installed" stub   |
| `/admin/students/import`             | ✅ Done    | CSV import with validation                       |
| `/admin/staff`                       | ✅ Done    | Real list                                        |
| `/admin/staff/create`                | ✅ Done    | Create wired                                     |
| `/admin/staff/[staffId]`             | ⚠️ Partial | Edit Profile button present but not wired        |
| `/admin/classes`                     | ✅ Done    | Real list                                        |
| `/admin/classes/create`              | ✅ Done    | Create wired                                     |
| `/admin/classes/[classId]`           | ✅ Done    | Real data with student roster                    |
| `/admin/admissions`                  | ✅ Done    | Real list                                        |
| `/admin/admissions/[appId]`          | ✅ Done    | Status transitions + enroll wired                |
| `/admin/finance`                     | ✅ Done    | Real financial report                            |
| `/admin/finance/fees`                | ⚠️ Partial | "Add Fee Structure" button present but not wired |
| `/admin/finance/invoices`            | ✅ Done    | Real list                                        |
| `/admin/finance/invoices/create`     | ✅ Done    | Full form                                        |
| `/admin/academics`                   | ✅ Done    | Real stats, exams, events                        |
| `/admin/timetable`                   | ⚠️ Partial | Weekly Grid View is a placeholder div            |
| `/admin/timetable/schedule`          | ⚠️ Partial | "Add Slot" button not wired                      |
| `/admin/timetable/assignments`       | ✅ Done    | Real data                                        |
| `/admin/timetable/events/create`     | ✅ Done    | Create wired                                     |
| `/admin/hr`                          | ✅ Done    | Real stats + recent activities                   |
| `/admin/hr/leave`                    | ✅ Done    | Real list                                        |
| `/admin/hr/payroll`                  | ✅ Done    | Real list                                        |
| `/admin/library`                     | ✅ Done    | Real stats                                       |
| `/admin/library/books`               | ✅ Done    | Real list                                        |
| `/admin/library/books/create`        | ✅ Done    | Create wired                                     |
| `/admin/library/circulation`         | ✅ Done    | Borrow/return wired                              |
| `/admin/library/reports`             | ✅ Done    | Real reports                                     |
| `/admin/transport`                   | ✅ Done    | Real routes/vehicles/drivers                     |
| `/admin/transport/routes/create`     | ✅ Done    | Create wired                                     |
| `/admin/transport/tracking`          | ⚠️ Partial | Likely map placeholder                           |
| `/admin/communications`              | ✅ Done    | Real announcements + templates                   |
| `/admin/communications/create`       | ✅ Done    | Create wired                                     |
| `/admin/communications/email`        | ✅ Done    | Email composer                                   |
| `/admin/ecommerce`                   | ✅ Done    | Real products/orders                             |
| `/admin/ecommerce/products/create`   | ✅ Done    | Create wired                                     |
| `/admin/ecommerce/orders`            | ✅ Done    | Real list                                        |
| `/admin/ewallet`                     | ✅ Done    | Real wallets                                     |
| `/admin/ewallet/transactions`        | ✅ Done    | Real list                                        |
| `/admin/ewallet/wallets`             | ✅ Done    | Real list                                        |
| `/admin/notes`                       | ✅ Done    | Real data                                        |
| `/admin/tasks`                       | ✅ Done    | Real data                                        |
| `/admin/tickets`                     | ✅ Done    | Real tickets                                     |
| `/admin/notifications`               | ✅ Done    | Real notifications                               |
| `/admin/marketplace`                 | ✅ Done    | Real module browsing                             |
| `/admin/marketplace/[moduleId]`      | ✅ Done    | Install/uninstall                                |
| `/admin/marketplace/requests`        | ✅ Done    | Real list                                        |
| `/admin/modules`                     | ✅ Done    | Real installed modules                           |
| `/admin/settings`                    | ✅ Done    | Real settings                                    |
| `/admin/settings/billing`            | ✅ Done    | Real billing info                                |
| `/admin/settings/modules`            | ✅ Done    | Real module management                           |
| `/admin/settings/modules/[moduleId]` | ✅ Done    | Module detail                                    |
| `/admin/settings/roles`              | ✅ Done    | Real roles                                       |
| `/admin/audit`                       | ✅ Done    | Real audit logs                                  |
| `/admin/audit/reports`               | ✅ Done    | Real reports                                     |
| `/admin/reports`                     | ✅ Done    | Real data                                        |
| `/admin/security`                    | ✅ Done    | Real security data                               |
| `/admin/profile`                     | ✅ Done    | Real profile                                     |
| `/admin/users`                       | ✅ Done    | Real list                                        |
| `/admin/users/invite`                | ✅ Done    | Invite wired                                     |

**School Admin Summary**: 52/60 routes fully functional (87%), 8/60 partially functional (13%)

### 4.3 Student Portal (`/portal/student`) — 14 routes

| Route                                 | Status  | Issue                                                   |
| ------------------------------------- | ------- | ------------------------------------------------------- |
| `/portal/student` (Dashboard)         | ✅ Done | Real data                                               |
| `/portal/student/assignments`         | ✅ Done | Real list                                               |
| `/portal/student/assignments/[id]`    | ✅ Done | Submit wired                                            |
| `/portal/student/attendance`          | ✅ Done | Real data                                               |
| `/portal/student/communications`      | ✅ Done | Full messaging                                          |
| `/portal/student/grades`              | ✅ Done | Real grades                                             |
| `/portal/student/notifications`       | ✅ Done | Mark read wired                                         |
| `/portal/student/profile`             | ✅ Done | Real profile                                            |
| `/portal/student/wallet`              | ✅ Done | Real balance                                            |
| `/portal/student/wallet/send`         | ❌ Stub | Submit handler sets local state, no mutation call       |
| `/portal/student/wallet/topup`        | ❌ Stub | Submit handler sets local state, no payment integration |
| `/portal/student/wallet/transactions` | ✅ Done | Real list                                               |

**Student Summary**: 12/14 routes functional (86%), 2/14 are UI shells

### 4.4 Teacher Portal (`/portal/teacher`) — 11 routes

All routes fully functional with real Convex data. Attendance recording, grade entry, assignment creation all wired to mutations.

### 4.5 Parent Portal (`/portal/parent`) — 16 routes

All routes functional. M-Pesa STK Push and Stripe Checkout integrated in fee payment flow. Real child grade/attendance/assignment views.

### 4.6 Alumni Portal (`/portal/alumni`) — 6 routes

All routes functional. Transcript requests and event RSVPs wired to mutations.

### 4.7 Partner Portal (`/portal/partner`) — 9 routes

All routes functional. Sponsored student tracking, payment history, messaging all wired.

### 4.8 Portal Admin (`/portal/admin`) — 12 routes

All routes functional. Full CRUD for communications, finance, HR, library, and timetable builder with conflict detection.

---

## 5. Missing Features — Prioritized List

### CRITICAL (Blocks Core Usage)

| #   | Module         | Panel    | Feature                      | What's Missing                                                                                                      | Suggested Fix                                                                          |
| --- | -------------- | -------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | Shared Layer   | All      | Type consistency             | `TenantTier`, `UserRole`, `Tenant` shape diverge across types/validators/backend                                    | Unify enum values and field names; create single source of truth in `shared/src/types` |
| 2   | Security       | All      | Unguarded mutations          | `promoteUserEmailToMasterAdmin`, `emergencyAdmin.ts`, `repairMasterAdminByEmail`, `createNotification` have no auth | Add `requirePlatformSession` or `requireTenantContext` to all mutations                |
| 3   | Billing        | Platform | Runtime crash                | `PLAN_PRICES_CENTS` undefined in `platform/billing/queries.ts`                                                      | Define constant or import from `shared/src/lib/billing.ts`                             |
| 4   | Mobile         | Mobile   | App cannot compile           | Missing `useAuth` hook and 5 screen files                                                                           | Create hook and implement screens or remove from App.tsx imports                       |
| 5   | Communications | Platform | Email/SMS not dispatched     | `sendPlatformMessageNow` only delivers in_app channel                                                               | Wire email via Resend and SMS via Africa's Talking in the send function                |
| 6   | Auth           | Backend  | `emergencyAdmin.ts` backdoor | No auth guard, creates master admin                                                                                 | Remove file or add one-time token validation                                           |

### HIGH

| #   | Module         | Panel        | Feature               | What's Missing                                                                      | Suggested Fix                                                                    |
| --- | -------------- | ------------ | --------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 7   | Airtel Money   | Finance      | Payment integration   | No initiation action exists                                                         | Create `actions/payments/airtel.ts` following M-Pesa pattern                     |
| 8   | E2E Tests      | CI/CD        | Broken test infra     | Missing `fixtures/auth.fixture.ts`, `global-setup.ts`, `global-teardown.ts`         | Create fixture files or update playwright config                                 |
| 9   | HR             | School Admin | Audit log mismatch    | `getRecentActivities` filters by `"staff_created"` but audit uses `"staff.created"` | Standardize to dot notation                                                      |
| 10  | Communications | Backend      | Schema mismatch       | `createEmailTemplate` inserts `type`/`htmlContent`/`textContent` not in schema      | Align mutation fields with `emailTemplates` schema                               |
| 11  | Finance        | Backend      | `pendingId` bug       | `initiateMpesaPayment` passes `pendingId: "pending"` literal                        | Pass actual callback document ID                                                 |
| 12  | Scripts        | Infra        | Hardcoded deploy keys | 5 PowerShell scripts contain Convex deploy keys                                     | Move to env vars; rotate keys                                                    |
| 13  | Marketplace    | Platform     | Mock payments         | M-Pesa/card/bank all mocked in `marketplace/payments.ts`                            | Integrate with real `actions/payments/mpesa.ts` and `actions/payments/stripe.ts` |
| 14  | Security       | Backend      | Console.log leaks     | `tenantGuard.ts` logs session metadata on every validation                          | Remove or gate behind `NODE_ENV !== "production"`                                |

### MEDIUM

| #   | Module         | Panel    | Feature                | What's Missing                                                                                    | Suggested Fix                                    |
| --- | -------------- | -------- | ---------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 15  | Academics      | Backend  | Hardcoded term dates   | `getTermStartDate`/`getTermEndDate` return static strings                                         | Query from `academicTerms` table                 |
| 16  | Platform       | Frontend | Non-functional dialogs | Analytics, automation, tenant-success, staff-performance create dialogs don't call mutations      | Wire `onSubmit` to `useMutation` calls           |
| 17  | CRM            | Platform | Deal detail local-only | `handleAddActivity`, `handleUpdateDeal` modify local state                                        | Replace with Convex mutations                    |
| 18  | Tickets        | Platform | Comment posting        | `handleAddComment` logs to console                                                                | Call `api.tickets.addComment` mutation           |
| 19  | Timetable      | Admin    | Grid view stub         | Weekly grid is a placeholder div                                                                  | Implement timetable grid component               |
| 20  | Finance        | Admin    | Fee structure create   | "Add Fee Structure" button not wired                                                              | Create dialog with `createFeeStructure` mutation |
| 21  | Library        | Backend  | No audit logging       | 0/4 mutations have audit logs                                                                     | Add `auditLog.logAction` calls                   |
| 22  | Transport      | Backend  | No audit logging       | 0/6 mutations have audit logs                                                                     | Add `auditLog.logAction` calls                   |
| 23  | eCommerce      | Backend  | No audit logging       | 0/6 mutations have audit logs                                                                     | Add `auditLog.logAction` calls                   |
| 24  | Communications | Backend  | No audit logging       | 0/22 mutations have audit logs                                                                    | Add `auditLog.logAction` calls                   |
| 25  | Automation     | Platform | Mock action steps      | All workflow steps (create_user, send_email, etc.) return mock data                               | Implement real actions                           |
| 26  | Frontend       | All      | `strict: false`        | Frontend tsconfig disables strict mode                                                            | Enable `strict: true` for type safety            |
| 27  | Health         | Platform | Hardcoded metrics      | Service response times are static                                                                 | Derive from actual monitoring                    |
| 28  | Student Wallet | Portal   | Send/topup stubs       | Forms render but submit does nothing                                                              | Wire to `ewallet` mutations and payment APIs     |
| 29  | Schema         | Backend  | Duplicate tables       | `submissions`/`assignmentSubmissions`, `bookBorrows`/`bookLoans`, `timetables`/`timetableEntries` | Consolidate duplicate tables                     |

### LOW

| #   | Module         | Panel         | Feature              | What's Missing                                            | Suggested Fix                                    |
| --- | -------------- | ------------- | -------------------- | --------------------------------------------------------- | ------------------------------------------------ |
| 30  | Tests          | Backend       | Placeholder tests    | `convex.test.ts` is all `expect(true).toBe(true)`         | Write real tests or remove                       |
| 31  | AI Support     | Platform      | Rule-based AI        | Keyword matching, not real ML                             | Integrate actual LLM or mark as "Smart Rules"    |
| 32  | Seed Scripts   | Infra         | No database seeding  | No way to populate dev data                               | Create Convex seed script                        |
| 33  | Documentation  | Root          | No AGENTS.md         | Missing agent config for Kilo                             | Create `.kilo/agent/*.md` files                  |
| 34  | Shared         | Barrel export | `lib/` not exported  | Mpesa, airtel, billing etc. not in `shared/src/index.ts`  | Add `export * from "./lib"`                      |
| 35  | Mobile         | Mobile        | Zero offline support | No `NetInfo`, AsyncStorage, offline queue                 | Implement offline-first patterns for East Africa |
| 36  | Payments       | Backend       | No retry logic       | External API calls (M-Pesa, Stripe, Resend) have no retry | Add exponential backoff                          |
| 37  | ID Generator   | Helpers       | `Math.random()`      | Not cryptographically secure                              | Use `crypto.randomUUID()`                        |
| 38  | Platform Guard | Helpers       | Hardcoded email      | `ayany004@gmail.com` in source                            | Move to env var                                  |

---

## 6. Payment Integration Status

| Provider               | Initiation                                       | Callback/Webhook                                    | Ledger Posting                                         | Auto-Reconciliation                              | Status            |
| ---------------------- | ------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------ | ----------------- |
| **M-Pesa STK Push**    | ✅ Real Daraja API (`actions/payments/mpesa.ts`) | ✅ Webhook at `/api/webhooks/mpesa`                 | ✅ `recordPaymentFromGateway` updates invoice + ledger | ⚠️ `pendingId: "pending"` bug may cause mismatch | **90% Complete**  |
| **Stripe Checkout**    | ✅ Real API (`actions/payments/stripe.ts`)       | ✅ Webhook at `/api/webhooks/stripe`                | ✅ `recordPayment` updates invoice                     | ✅ Clean                                         | **100% Complete** |
| **Airtel Money**       | ❌ No initiation action                          | ⚠️ Webhook handler exists at `/api/webhooks/airtel` | ❌ No ledger posting                                   | ❌ N/A                                           | **10% Complete**  |
| **Bank Transfer**      | ❌ Not implemented                               | ❌ N/A                                              | ❌ N/A                                                 | ❌ N/A                                           | **0% Complete**   |
| **Marketplace M-Pesa** | ⚠️ Mock                                          | ⚠️ `processPaymentCallback` exists                  | ⚠️ Mock                                                | ❌ N/A                                           | **20% Complete**  |
| **Marketplace Stripe** | ⚠️ Mock                                          | ⚠️ Same callback                                    | ⚠️ Mock                                                | ❌ N/A                                           | **20% Complete**  |

---

## 7. Communication Integration Status

| Channel                    | Backend API                     | Templates                                                           | Trigger Points                   | Delivery                              | Status          |
| -------------------------- | ------------------------------- | ------------------------------------------------------------------- | -------------------------------- | ------------------------------------- | --------------- |
| **SMS (Africa's Talking)** | ✅ `sendSms`, `sendBulkSms`     | ✅ Default templates                                                | Fee reminders, attendance alerts | ✅ Real API calls                     | **Implemented** |
| **Email (Resend)**         | ✅ `sendEmail`                  | 4 templates (fee_reminder, exam_results, attendance_alert, payslip) | Fee reminders, invites           | ✅ Real API calls                     | **Implemented** |
| **In-App Notifications**   | ✅ Full CRUD                    | N/A                                                                 | System events, announcements     | ✅ Real-time via Convex subscriptions | **Implemented** |
| **Push Notifications**     | ❌ No FCM/APNs setup            | ❌                                                                  | ❌                               | ❌                                    | **Not Started** |
| **Platform Comms (email)** | ⚠️ Validated but not dispatched | Stored in DB                                                        | `sendPlatformMessageNow`         | ❌ Only in_app channel works          | **Partial**     |
| **Platform Comms (sms)**   | ⚠️ Validated but not dispatched | Stored in DB                                                        | `sendPlatformMessageNow`         | ❌ Only in_app channel works          | **Partial**     |

---

## 8. Mobile App Status

| Screen              | File Exists | Convex Connected     | Auth              | Offline | Status                      |
| ------------------- | ----------- | -------------------- | ----------------- | ------- | --------------------------- |
| `LoginScreen`       | ✅          | ❌                   | ❌ (hook missing) | ❌      | UI only — crashes on import |
| `DashboardScreen`   | ✅          | ❌ (hardcoded stats) | ❌ (hook missing) | ❌      | UI with mock data           |
| `GradesScreen`      | ❌ Missing  | N/A                  | N/A               | N/A     | Referenced in App.tsx       |
| `AssignmentsScreen` | ❌ Missing  | N/A                  | N/A               | N/A     | Referenced in App.tsx       |
| `AttendanceScreen`  | ❌ Missing  | N/A                  | N/A               | N/A     | Referenced in App.tsx       |
| `FeesScreen`        | ❌ Missing  | N/A                  | N/A               | N/A     | Referenced in App.tsx       |
| `ProfileScreen`     | ❌ Missing  | N/A                  | N/A               | N/A     | Referenced in App.tsx       |

**Verdict**: The mobile app is a non-functional UI prototype. It would not compile (missing imports) and has zero Convex integration. No offline handling, no push notifications, no WorkOS integration despite providers being wrapped.

**Panels with mobile coverage**: 0/7 user panels have working mobile screens.
**Panels web-only**: All 7 panels (Platform Admin, School Admin, Student, Teacher, Parent, Alumni, Partner) are web-only.

---

## 9. Auth & Tenant Isolation Issues

### Unguarded Backend Functions (CRITICAL Security Issues)

| File                          | Function                        | Auth Guard | Risk                                         |
| ----------------------------- | ------------------------------- | ---------- | -------------------------------------------- |
| `convex/emergencyAdmin.ts`    | `createEmergencyAdmin`          | **NONE**   | Anyone can create master admin               |
| `convex/users.ts`             | `promoteUserEmailToMasterAdmin` | **NONE**   | Anyone can promote to master_admin           |
| `convex/users.ts`             | `syncMasterAdminRole`           | **NONE**   | Anyone can sync master admin role            |
| `convex/users.ts`             | `bootstrapMasterAdmin`          | **NONE**   | Anyone can bootstrap master admin            |
| `convex/users.ts`             | `hasMasterAdmin`                | **NONE**   | Information disclosure                       |
| `convex/users.ts`             | `getUserByWorkosIdGlobal`       | **NONE**   | Cross-tenant user lookup                     |
| `convex/notifications.ts`     | `createNotification`            | **NONE**   | Can create notifications for any tenant/user |
| `convex/organizations.ts`     | All (2 functions)               | **NONE**   | Unrestricted org operations                  |
| `platform/users/mutations.ts` | `repairMasterAdminByEmail`      | **NONE**   | Anyone can repair master admin               |

### Inconsistent Auth Patterns

| Pattern                      | Files                                                                     | Issue                                     |
| ---------------------------- | ------------------------------------------------------------------------- | ----------------------------------------- |
| `requirePlatformSession`     | 31 platform modules                                                       | Standard — good                           |
| `requireTenantContext`       | Core modules                                                              | Standard — good                           |
| `requireActionTenantContext` | 2 action files                                                            | Good for actions                          |
| Manual session check         | `platform/changelog/queries.ts`, `platform/sla/queries.ts`, `sessions.ts` | Inconsistent — should use standard guards |
| No auth at all               | 9 functions listed above                                                  | **CRITICAL**                              |

### Middleware Auth Coverage

| Area                      | Status                                                                          |
| ------------------------- | ------------------------------------------------------------------------------- |
| Protected route detection | ✅ Covers `/admin`, `/dashboard`, `/portal`, `/platform`, `/student`            |
| RBAC role enforcement     | ✅ Route-role mapping defined for all panels                                    |
| IP blocking               | ✅ Real-time blocked IP checking with 60s cache                                 |
| Maintenance mode          | ✅ Redirects non-admins during maintenance                                      |
| Subdomain tenant routing  | ✅ Extracts `x-tenant-slug` header from subdomain                               |
| Impersonation flag        | ✅ Passes `x-impersonating` header                                              |
| Dev auth bypass           | ⚠️ `ENABLE_DEV_AUTH_BYPASS=true` skips ALL auth — must not be set in production |

---

## 10. Shared Layer Gaps

### Type/Validator Mismatches (CRITICAL)

| Concept           | Shared Types                                      | Validators                                         | Backend Schema                                  | Billing                                            |
| ----------------- | ------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| **Tenant Tier**   | `"free" \| "starter" \| "growth" \| "enterprise"` | `"starter" \| "standard" \| "pro" \| "enterprise"` | `plan` field (any string)                       | `"starter" \| "standard" \| "pro" \| "enterprise"` |
| **User Role**     | 15 roles incl. `"bursar"`, `"hr_manager"`         | `"finance_officer"`, `"hr_officer"`                | 15 roles with `"bursar"`, `"hr_manager"`        | N/A                                                |
| **Tenant fields** | `slug`, `tier`, `enabledModules`                  | `slug`, `tier`, `name`                             | `subdomain`, `plan`, `county`, `email`, `phone` | N/A                                                |

### Missing Types

| Expected Type            | Location           | Status                   |
| ------------------------ | ------------------ | ------------------------ |
| `Staff`                  | `shared/src/types` | ❌ Not defined in shared |
| `Fee` / `Invoice`        | `shared/src/types` | ❌ Not defined in shared |
| `Grade` / `Assignment`   | `shared/src/types` | ❌ Not defined in shared |
| `Book` / `Borrow`        | `shared/src/types` | ❌ Not defined in shared |
| `TimetableSlot`          | `shared/src/types` | ❌ Not defined in shared |
| `Wallet` / `Transaction` | `shared/src/types` | ❌ Not defined in shared |
| `Product` / `Order`      | `shared/src/types` | ❌ Not defined in shared |

### Missing Validators

| Expected Validator          | Status         |
| --------------------------- | -------------- |
| `createStaffSchema`         | ❌ Not defined |
| `createFeeStructureSchema`  | ❌ Not defined |
| `createGradeSchema`         | ❌ Not defined |
| `createAssignmentSchema`    | ❌ Not defined |
| `createBookSchema`          | ❌ Not defined |
| `createTimetableSlotSchema` | ❌ Not defined |
| `createProductSchema`       | ❌ Not defined |

### Constants Quality

| Constant              | Status          | Notes                                                        |
| --------------------- | --------------- | ------------------------------------------------------------ |
| `USER_ROLES`          | ⚠️ Inconsistent | 15 roles but names don't match validator enum                |
| `MODULES`             | ✅ Good         | 11 modules with labels and icons                             |
| `TIER_MODULES`        | ✅ Good         | Feature gates per tier                                       |
| `CURRICULUM_CODES`    | ✅ Good         | KE-CBC, KE-8-4-4, UG-UNEB, TZ-NECTA, RW-REB, ET-MOE, GH-WAEC |
| `SUPPORTED_COUNTRIES` | ✅ Good         | 6 East African countries with currency/dial info             |

---

## 11. Infra & CI/CD Gaps

### CI/CD Pipeline

| Component              | Status | Notes                                                                     |
| ---------------------- | ------ | ------------------------------------------------------------------------- |
| Lint + Type-check      | ✅     | Runs on PR and push                                                       |
| Unit tests             | ✅     | Vitest with coverage upload                                               |
| Tenant isolation tests | ⚠️     | Script `test:tenant-isolation` referenced in CI but not in `package.json` |
| Security audit         | ✅     | `npm audit` + TruffleHog                                                  |
| E2E tests (Playwright) | ❌     | Never run in CI; broken fixtures                                          |
| Mobile build           | ❌     | No mobile CI workflow                                                     |
| Preview deployments    | ✅     | Frontend + Landing on PRs                                                 |
| Production deployment  | ✅     | Frontend + Landing + Convex on push to main                               |

### Test Coverage

| Layer               | Framework  | Files                                                          | Status             |
| ------------------- | ---------- | -------------------------------------------------------------- | ------------------ |
| Backend integration | Vitest     | 2 real files (`timetable.test.ts`, `academics.test.ts`)        | ⚠️ Limited         |
| Backend placeholder | Vitest     | 1 file (`convex.test.ts`) — all `expect(true)`                 | ❌ Useless         |
| Frontend            | Vitest     | 5 test files (auth, payments, RBAC, tenant isolation, modules) | ⚠️ Moderate        |
| E2E                 | Playwright | 6 spec files (30 tests)                                        | ❌ Broken fixtures |
| Load                | k6         | 1 file                                                         | ✅ Basic           |

### Environment Variables

`.env.example` is excellent — 236 lines covering all integrations (Convex, WorkOS, M-Pesa, Airtel, Stripe, Africa's Talking, Resend, monitoring).

### Missing Infrastructure

| Component                 | Status                                   |
| ------------------------- | ---------------------------------------- |
| Database seed script      | ❌ Not implemented                       |
| Migration strategy        | ❌ Not implemented (Convex schema-first) |
| AGENTS.md / .kilo/ config | ❌ Not found                             |
| E2E global setup/teardown | ❌ Files referenced but don't exist      |
| E2E auth fixture          | ❌ Referenced but doesn't exist          |
| Mobile CI/CD              | ❌ Not implemented                       |

---

## 12. Recommended Implementation Priority Order

### Sprint 1 — Critical Security & Stability (1-2 weeks)

| #   | Task                                                                         | Effort | Impact      |
| --- | ---------------------------------------------------------------------------- | ------ | ----------- |
| 1   | Remove or guard `emergencyAdmin.ts`, `testAdmin.ts`                          | 1h     | Security    |
| 2   | Add auth guards to all unguarded mutations (9 functions)                     | 4h     | Security    |
| 3   | Fix `PLAN_PRICES_CENTS` undefined in billing queries                         | 1h     | Stability   |
| 4   | Unify `TenantTier` enum across types/validators/backend/billing              | 4h     | Type safety |
| 5   | Unify `UserRole` enum across types/validators                                | 2h     | Type safety |
| 6   | Remove hardcoded deploy keys from PowerShell scripts; rotate keys            | 2h     | Security    |
| 7   | Remove `console.log` from `tenantGuard.ts` and `platform/users/mutations.ts` | 1h     | Security    |

### Sprint 2 — Payment & Communication Completions (2-3 weeks)

| #   | Task                                                               | Effort | Impact              |
| --- | ------------------------------------------------------------------ | ------ | ------------------- |
| 8   | Implement Airtel Money initiation action                           | 8h     | Revenue             |
| 9   | Fix `pendingId: "pending"` bug in M-Pesa flow                      | 2h     | Payment reliability |
| 10  | Wire marketplace payments to real M-Pesa/Stripe actions            | 8h     | Marketplace revenue |
| 11  | Implement email/sms dispatch in `sendPlatformMessageNow`           | 6h     | Communications      |
| 12  | Wire student wallet send/topup to real mutations                   | 6h     | Student UX          |
| 13  | Add audit logging to Library, Transport, eCommerce, Communications | 4h     | Compliance          |

### Sprint 3 — Frontend Completion (2-3 weeks)

| #   | Task                                                                                   | Effort | Impact     |
| --- | -------------------------------------------------------------------------------------- | ------ | ---------- |
| 14  | Wire non-functional dialogs (analytics, automation, tenant-success, staff-performance) | 8h     | UX         |
| 15  | Wire CRM deal detail mutations to backend                                              | 4h     | Sales      |
| 16  | Fix ticket comment posting (console.log → mutation)                                    | 1h     | Support    |
| 17  | Implement timetable weekly grid view                                                   | 8h     | School ops |
| 18  | Wire fee structure create dialog                                                       | 2h     | Finance    |
| 19  | Wire staff profile edit                                                                | 2h     | HR         |

### Sprint 4 — Shared Layer & Type Safety (1-2 weeks)

| #   | Task                                                     | Effort | Impact          |
| --- | -------------------------------------------------------- | ------ | --------------- |
| 20  | Align `Tenant` type with backend schema fields           | 4h     | Type safety     |
| 21  | Add missing shared types (Staff, Fee, Grade, Book, etc.) | 8h     | Type safety     |
| 22  | Add missing shared validators                            | 6h     | Form validation |
| 23  | Enable `strict: true` in frontend tsconfig               | 8h     | Type safety     |
| 24  | Consolidate duplicate DB tables in schema                | 4h     | Data integrity  |
| 25  | Fix HR `getRecentActivities` action string mismatch      | 1h     | HR              |

### Sprint 5 — Mobile App Foundation (4-6 weeks)

| #   | Task                                                                         | Effort | Impact                  |
| --- | ---------------------------------------------------------------------------- | ------ | ----------------------- |
| 26  | Create `useAuth` hook with WorkOS integration                                | 8h     | Mobile auth             |
| 27  | Implement 5 missing screens (Grades, Assignments, Attendance, Fees, Profile) | 40h    | Mobile UX               |
| 28  | Connect all screens to Convex queries/mutations                              | 16h    | Mobile data             |
| 29  | Implement offline-first patterns (caching, queue)                            | 24h    | East Africa reliability |
| 30  | Set up push notifications (FCM)                                              | 12h    | Mobile engagement       |

### Sprint 6 — Testing & Infrastructure (1-2 weeks)

| #   | Task                                                     | Effort | Impact         |
| --- | -------------------------------------------------------- | ------ | -------------- |
| 31  | Fix E2E test fixtures (auth, global setup/teardown)      | 4h     | CI/CD          |
| 32  | Add E2E tests to CI pipeline                             | 2h     | CI/CD          |
| 33  | Create database seed script                              | 8h     | Dev experience |
| 34  | Replace placeholder `convex.test.ts` with real tests     | 4h     | Test quality   |
| 35  | Implement real vulnerability scanning in security module | 8h     | Security       |
| 36  | Add retry logic for external API calls                   | 4h     | Reliability    |

---

## Appendix A: Schema Table Count

The Convex schema (`convex/schema.ts`) defines **~90+ tables** covering all modules: users, tenants, organizations, sessions, auditLogs, notifications, students, classes, guardians, applications, feeStructures, invoices, payments, paymentCallbacks, timetableSlots, timetableEvents, assignments, assignmentSubmissions, grades, attendance, reportCards, examinations, staff, contracts, leaveRequests, payrollRuns, payslips, books, bookLoans, transportRoutes, vehicles, drivers, routeAssignments, announcements, campaigns, templates, conversations, messages, smsTemplates, emailTemplates, notificationPreferences, wallets, walletTransactions, products, orders, cartItems, plus 40+ platform tables (deals, leads, featureFlags, marketplaceModules, etc.).

## Appendix B: File Count by Layer

| Layer                                         | File Count     | Lines (est.) |
| --------------------------------------------- | -------------- | ------------ |
| Convex Backend (modules + platform + helpers) | ~120 files     | ~25,000      |
| Frontend (app + components + hooks + lib)     | ~280 files     | ~45,000      |
| Landing Site                                  | ~60 files      | ~8,000       |
| Mobile                                        | 5 files        | ~500         |
| Shared                                        | 14 files       | ~2,600       |
| E2E + Tests                                   | ~15 files      | ~3,000       |
| Scripts                                       | 10 files       | ~800         |
| Docs                                          | 7 files        | ~15,000      |
| Config (CI/CD, Vercel, TypeScript, etc.)      | ~20 files      | ~1,500       |
| **TOTAL**                                     | **~530 files** | **~101,400** |
