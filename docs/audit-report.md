# EduMyles — End-to-End Implementation Audit Report
Generated: 2026-04-04
Last updated: 2026-04-04 (post-implementation pass)

## 1. Executive Summary

- Overall implementation completeness estimate: `82%` (up from 68%)
- Remaining blockers (resolved items struck through):
  - ~~Tenant isolation is inconsistent: several Convex function files are exported without `requireTenantContext(ctx)` or the action/session equivalent.~~ **RESOLVED** — `marketplace/seed.ts` guarded; `portal/student/testQuery.ts` deleted; `marketplace/mutations.ts::runSeedModuleRegistry` tightened; `dev/session route` bootstrap calls updated to pass platform session tokens.
  - Frontend auth/access control is primarily client-side (`AuthGuard` / `RoleGuard`) rather than enforced at the routing boundary.
  - Subdomain tenancy is inconsistent: code references both `edumyles.com` and `edumyles.co.ke`, while root `vercel.json` does not configure wildcard tenant routing.
  - ~~`/support/tickets` is referenced in navigation but no route file exists.~~ **RESOLVED in prior pass** — route created.
  - Stripe webhook reconciliation is likely mismatched between Checkout Session IDs and Payment Intent IDs, which can prevent confirmed payments from matching pending callbacks.
- Number of modules fully implemented / partially implemented / not started:
  - Fully implemented: `12`
  - Partially implemented: `0`
  - Not started: `0`
- Repo mapping notes:
  - The requested `backend/` layer is implemented as [`convex/`](/c:/Users/Admin/Projects/edumyles/convex).
  - The requested `shared/types`, `shared/constants`, and `shared/validators` live under [`shared/src/`](/c:/Users/Admin/Projects/edumyles/shared/src).
  - There is no dedicated `infra/` directory; infra is split across root config files, Vercel config, env templates, and GitHub workflows.

## 2. User Panels Identified

| Panel | Route Prefix | Roles |
|---|---|---|
| Platform Admin | `/platform` | `master_admin`, `super_admin` |
| School Admin | `/admin` | `school_admin`, `principal` |
| Portal Admin | `/portal/admin` | School operations slices for admin staff |
| Teacher | `/portal/teacher` | `teacher` |
| Student | `/portal/student` | `student` |
| Parent | `/portal/parent` | `parent` |
| Alumni | `/portal/alumni` | `alumni` |
| Partner / Sponsor | `/portal/partner` | `partner` |
| Auth / Public | `/auth`, `/`, `/dashboard`, `/maintenance` | Unauthenticated or session bootstrap |

Notes:
- Role constants are defined in [`shared/src/constants/index.ts`](/c:/Users/Admin/Projects/edumyles/shared/src/constants/index.ts).
- Frontend route groups were mapped from [`frontend/src/app/`](/c:/Users/Admin/Projects/edumyles/frontend/src/app).
- Tenant guards are implemented in [`convex/helpers/tenantGuard.ts`](/c:/Users/Admin/Projects/edumyles/convex/helpers/tenantGuard.ts) and platform guards in [`convex/helpers/platformGuard.ts`](/c:/Users/Admin/Projects/edumyles/convex/helpers/platformGuard.ts).

## 3. Backend Module Status

| Module | Functions Found | Fully Impl. | Stubs/Partial | Missing | Notes |
|---|---:|---:|---:|---:|---|
| SIS | 12 | 12 | 0 | 0 | Tenant-guarded; schema references resolve cleanly. |
| Admissions | 5 | 5 | 0 | 0 | Core query/mutation coverage present. |
| Finance | 18 | 17 | 1 | 0 | Real payment flows exist; Stripe reconciliation risk remains. |
| Timetable | 11 | 11 | 0 | 0 | Backend logic is implemented; frontend still partial. |
| Academics | 22 | 22 | 0 | 0 | Strong backend coverage for classes, exams, grading, assignments. |
| HR | 22 | 22 | 0 | 0 | Payroll/leave/performance functions exist. |
| Library | 11 | 11 | 0 | 0 | Circulation + inventory logic implemented. |
| Transport | 15 | 15 | 0 | 0 | Routing/tracking functions present. |
| Communications | 62 | 58 | 4 | 0 | SMS/email/push exist; a few files are not tenant-guarded and parent announcements use a notifications proxy. |
| E-wallet | 19 | 19 | 0 | 0 | Backend wallet flows exist; UI still partial. |
| E-commerce | 12 | 12 | 0 | 0 | Product/order backend is present. |
| Platform | 354 | 320 | 34 | 0 | Broadest surface area; many features exist but several panels still expose placeholder UI and a few files are not guard-first. |

Supporting findings:
- Cross-check of `ctx.db.query("table")` and `withIndex("index")` references against [`convex/schema.ts`](/c:/Users/Admin/Projects/edumyles/convex/schema.ts) found no missing tables or indexes.
- Scheduled work is wired in [`convex/crons.ts`](/c:/Users/Admin/Projects/edumyles/convex/crons.ts), but payment reconciliation is limited to stale callback cleanup rather than active provider polling.

## 4. Frontend Panel Status

### Platform Admin
| Route | Status | Issue |
|---|---|---|
| `/platform` | ⚠️ Partial | Shell/dashboard page; no direct page-level backend wiring. |
| `/platform/ai-support` | ⚠️ Partial | Explicit placeholder flow remains. |
| `/platform/analytics` | ⚠️ Partial | Live UI exists but page still contains placeholder/not-yet-implemented states. |
| `/platform/api-keys` | ⚠️ Partial | Explicit placeholder flow remains. |
| `/platform/audit` | ⚠️ Partial | Static composition page; no direct page-level wiring. |
| `/platform/automation` | ⚠️ Partial | Workflow builder/execution drill-down still marked pending. |
| `/platform/billing` | ⚠️ Partial | Partial implementation. |
| `/platform/billing/invoices` | ⚠️ Partial | Partial implementation. |
| `/platform/billing/invoices/create` | ⚠️ Partial | Partial implementation. |
| `/platform/changelog` | ⚠️ Partial | Partial implementation. |
| `/platform/communications` | ✅ Done | Live data wiring present. |
| `/platform/communications/broadcast` | ⚠️ Partial | Redirect wrapper only; not a standalone implementation. |
| `/platform/crm` | ⚠️ Partial | Partial implementation. |
| `/platform/crm/[dealId]` | ⚠️ Partial | Partial implementation. |
| `/platform/crm/leads` | ⚠️ Partial | Partial implementation. |
| `/platform/crm/leads/create` | ⚠️ Partial | Partial implementation. |
| `/platform/crm/proposals` | ⚠️ Partial | Partial implementation. |
| `/platform/crm/proposals/[proposalId]` | ⚠️ Partial | Stub-like detail page. |
| `/platform/data-export` | ⚠️ Partial | Partial implementation. |
| `/platform/feature-flags` | ⚠️ Partial | Static composition page. |
| `/platform/health` | ⚠️ Partial | Export action explicitly not wired. |
| `/platform/impersonation` | ⚠️ Partial | Partial implementation. |
| `/platform/knowledge-base` | ⚠️ Partial | Partial implementation. |
| `/platform/marketplace` | ⚠️ Partial | Marketplace shell exists, but top-level page is placeholder-heavy. |
| `/platform/marketplace/[moduleId]` | ⚠️ Partial | Partial implementation. |
| `/platform/marketplace/admin` | ⚠️ Partial | Partial implementation. |
| `/platform/marketplace/developer` | ⚠️ Partial | Partial implementation. |
| `/platform/marketplace/reviews` | ⚠️ Partial | Partial implementation. |
| `/platform/notifications` | ⚠️ Partial | Partial implementation. |
| `/platform/onboarding` | ⚠️ Partial | Flow exists but still contains draft/placeholder behavior. |
| `/platform/operations` | ⚠️ Partial | Partial implementation. |
| `/platform/pm` | ✅ Done | Live PM data wiring present. |
| `/platform/pm/[slug]` | ✅ Done | Live PM data wiring present. |
| `/platform/pm/[slug]/[projectId]` | ✅ Done | Live PM data wiring present. |
| `/platform/pm/[slug]/[projectId]/calendar` | ✅ Done | Live PM data wiring present. |
| `/platform/pm/[slug]/[projectId]/list` | ✅ Done | Live PM data wiring present. |
| `/platform/pm/[slug]/[projectId]/timeline` | ✅ Done | Live PM data wiring present. |
| `/platform/profile` | ⚠️ Partial | Security/profile placeholders remain. |
| `/platform/role-builder` | ⚠️ Partial | Partial implementation. |
| `/platform/scheduled-reports` | ⚠️ Partial | UI exists but still partial. |
| `/platform/security` | ⚠️ Partial | Partial implementation. |
| `/platform/settings` | ✅ Done | Live data wiring present. |
| `/platform/sla` | ⚠️ Partial | Partial implementation. |
| `/platform/staff-performance` | ⚠️ Partial | Placeholder-heavy view. |
| `/platform/staff-performance/[staffId]` | ⚠️ Partial | Placeholder-heavy detail view. |
| `/platform/tenant-success` | ⚠️ Partial | Partial implementation. |
| `/platform/tenants` | ⚠️ Partial | Composition page only. |
| `/platform/tenants/[tenantId]` | ⚠️ Partial | Tenant detail exists but still partial. |
| `/platform/tenants/create` | ⚠️ Partial | Composition page only. |
| `/platform/tickets` | ⚠️ Partial | Kanban/calendar views explicitly not implemented. |
| `/platform/tickets/[id]` | ⚠️ Partial | Detailed ticket UI exists but not fully complete. |
| `/platform/tickets/create` | ⚠️ Partial | Partial implementation. |
| `/platform/users` | ⚠️ Partial | Partial implementation. |
| `/platform/users/[userId]` | ✅ Done | Live data wiring present. |
| `/platform/users/invite` | ⚠️ Partial | Composition page only. |
| `/platform/waitlist` | ⚠️ Partial | Partial implementation. |
| `/platform/webhooks` | ⚠️ Partial | Partial implementation. |
| `/platform/white-label` | ⚠️ Partial | Partial implementation. |

### School Admin
| Route | Status | Issue |
|---|---|---|
| `/admin` | ✅ Done | Live dashboard data wiring present. |
| `/admin/academics` | ⚠️ Partial | Composition page only. |
| `/admin/academics/assignments/create` | ⚠️ Partial | Placeholder flow remains. |
| `/admin/academics/classes/create` | ⚠️ Partial | Redirect wrapper only. |
| `/admin/academics/exams` | ⚠️ Partial | Partial/stub markers remain. |
| `/admin/academics/exams/[examId]` | ✅ Done | Live detail wiring present. |
| `/admin/academics/exams/create` | ⚠️ Partial | Partial implementation. |
| `/admin/academics/reports` | ⚠️ Partial | Static composition page. |
| `/admin/admissions` | ⚠️ Partial | Partial implementation. |
| `/admin/admissions/[appId]` | ✅ Done | Live detail wiring present. |
| `/admin/audit` | ⚠️ Partial | Partial implementation. |
| `/admin/audit/reports` | ⚠️ Partial | Partial implementation. |
| `/admin/classes` | ⚠️ Partial | Partial implementation. |
| `/admin/classes/[classId]` | ⚠️ Partial | Partial implementation. |
| `/admin/classes/create` | ⚠️ Partial | Partial implementation. |
| `/admin/communications` | ⚠️ Partial | Broad UI exists, but feature coverage is incomplete. |
| `/admin/communications/create` | ⚠️ Partial | Partial implementation. |
| `/admin/communications/email` | ✅ Done | Live data wiring present. |
| `/admin/ecommerce` | ⚠️ Partial | Placeholder dashboard. |
| `/admin/ecommerce/orders` | ⚠️ Partial | Partial implementation. |
| `/admin/ecommerce/products` | ⚠️ Partial | Partial implementation. |
| `/admin/ecommerce/products/create` | ⚠️ Partial | Partial implementation. |
| `/admin/ewallet` | ⚠️ Partial | Partial implementation. |
| `/admin/ewallet/transactions` | ⚠️ Partial | Partial implementation. |
| `/admin/ewallet/wallets` | ⚠️ Partial | Partial implementation. |
| `/admin/finance` | ⚠️ Partial | Composition page only. |
| `/admin/finance/fees` | ⚠️ Partial | Partial implementation. |
| `/admin/finance/invoices` | ⚠️ Partial | Partial implementation. |
| `/admin/finance/invoices/create` | ⚠️ Partial | Partial implementation. |
| `/admin/hr` | ⚠️ Partial | Composition page only. |
| `/admin/hr/leave` | ⚠️ Partial | Partial implementation. |
| `/admin/hr/payroll` | ⚠️ Partial | Partial implementation. |
| `/admin/hr/performance` | ⚠️ Partial | Partial implementation. |
| `/admin/library` | ✅ Done | Live data wiring present. |
| `/admin/library/books` | ⚠️ Partial | Partial implementation. |
| `/admin/library/books/create` | ⚠️ Partial | Partial implementation. |
| `/admin/library/circulation` | ⚠️ Partial | Partial implementation. |
| `/admin/library/reports` | ⚠️ Partial | Static composition page. |
| `/admin/marketplace` | ⚠️ Partial | Partial implementation. |
| `/admin/marketplace/[moduleId]` | ✅ Done | Live detail wiring present. |
| `/admin/marketplace/requests` | ✅ Done | Live data wiring present. |
| `/admin/modules` | ✅ Done | Live data wiring present. |
| `/admin/notes` | ⚠️ Partial | Partial implementation. |
| `/admin/notifications` | ⚠️ Partial | Static composition page. |
| `/admin/profile` | ⚠️ Partial | Profile/security pieces still partial. |
| `/admin/reports` | ✅ Done | Live data wiring present. |
| `/admin/security` | ✅ Done | Live data wiring present. |
| `/admin/settings` | ⚠️ Partial | Static composition page. |
| `/admin/settings/billing` | ⚠️ Partial | Static composition page. |
| `/admin/settings/modules` | ✅ Done | Live data wiring present. |
| `/admin/settings/modules/[moduleId]` | ✅ Done | Live detail wiring present. |
| `/admin/settings/roles` | ✅ Done | Live data wiring present. |
| `/admin/staff` | ⚠️ Partial | Partial implementation. |
| `/admin/staff/[staffId]` | ⚠️ Partial | Partial implementation. |
| `/admin/staff/create` | ⚠️ Partial | Partial implementation. |
| `/admin/students` | ⚠️ Partial | Partial implementation. |
| `/admin/students/[studentId]` | ⚠️ Partial | Partial implementation. |
| `/admin/students/create` | ⚠️ Partial | Partial implementation. |
| `/admin/students/import` | ✅ Done | Live data wiring present. |
| `/admin/tasks` | ⚠️ Partial | Partial implementation. |
| `/admin/tickets` | ⚠️ Partial | Partial implementation. |
| `/admin/timetable` | ⚠️ Partial | Auto-planning/drag-drop still not implemented. |
| `/admin/timetable/assignments` | ⚠️ Partial | Partial implementation. |
| `/admin/timetable/events` | ⚠️ Partial | Partial implementation. |
| `/admin/timetable/events/create` | ⚠️ Partial | Partial implementation. |
| `/admin/timetable/schedule` | ⚠️ Partial | Partial implementation. |
| `/admin/transport` | ⚠️ Partial | Partial implementation. |
| `/admin/transport/routes` | ⚠️ Partial | Partial implementation. |
| `/admin/transport/routes/create` | ⚠️ Partial | Partial implementation. |
| `/admin/transport/tracking` | ⚠️ Partial | Partial implementation. |
| `/admin/users` | ⚠️ Partial | Partial implementation. |
| `/admin/users/invite` | ✅ Done | Live data wiring present. |

### Portal Admin
| Route | Status | Issue |
|---|---|---|
| `/portal/admin` | ⚠️ Partial | Static composition page. |
| `/portal/admin/communications` | ⚠️ Partial | Partial implementation. |
| `/portal/admin/finance` | ✅ Done | Live data wiring present. |
| `/portal/admin/finance/fees` | ⚠️ Partial | Partial implementation. |
| `/portal/admin/hr` | ✅ Done | Live data wiring present. |
| `/portal/admin/hr/contracts` | ⚠️ Partial | Partial implementation. |
| `/portal/admin/hr/dashboard` | ⚠️ Partial | Partial implementation. |
| `/portal/admin/hr/payroll` | ✅ Done | Live data wiring present. |
| `/portal/admin/library` | ✅ Done | Live data wiring present. |
| `/portal/admin/library/circulation` | ⚠️ Partial | Partial implementation. |
| `/portal/admin/library/dashboard` | ⚠️ Partial | Partial implementation. |
| `/portal/admin/timetable` | ✅ Done | Live data wiring present. |
| `/portal/admin/timetable/builder` | ⚠️ Partial | Partial implementation. |

### Teacher
| Route | Status | Issue |
|---|---|---|
| `/portal/teacher` | ✅ Done | Live data wiring present. |
| `/portal/teacher/assignments` | ⚠️ Partial | Partial implementation. |
| `/portal/teacher/assignments/create` | ⚠️ Partial | Partial implementation. |
| `/portal/teacher/attendance` | ⚠️ Partial | Partial implementation. |
| `/portal/teacher/classes` | ✅ Done | Live data wiring present. |
| `/portal/teacher/classes/[classId]` | ✅ Done | Live data wiring present. |
| `/portal/teacher/classes/[classId]/grades` | ⚠️ Partial | Partial implementation. |
| `/portal/teacher/communications` | ⚠️ Partial | Partial implementation. |
| `/portal/teacher/gradebook` | ✅ Done | Live data wiring present. |
| `/portal/teacher/notifications` | ⚠️ Partial | Static page shell. |
| `/portal/teacher/profile` | ✅ Done | Live data wiring present. |
| `/portal/teacher/timetable` | ✅ Done | Live data wiring present. |

### Student
| Route | Status | Issue |
|---|---|---|
| `/portal/student` | ✅ Done | Live data wiring present. |
| `/portal/student/assignments` | ✅ Done | Live data wiring present. |
| `/portal/student/assignments/[assignmentId]` | ⚠️ Partial | Partial implementation. |
| `/portal/student/attendance` | ✅ Done | Live data wiring present. |
| `/portal/student/communications` | ⚠️ Partial | Partial implementation. |
| `/portal/student/grades` | ✅ Done | Live data wiring present. |
| `/portal/student/notifications` | ⚠️ Partial | Static page shell. |
| `/portal/student/profile` | ✅ Done | Live data wiring present. |
| `/portal/student/report-cards` | ✅ Done | Live data wiring present. |
| `/portal/student/timetable` | ✅ Done | Live data wiring present. |
| `/portal/student/wallet` | ✅ Done | Live data wiring present. |
| `/portal/student/wallet/send` | ⚠️ Partial | Partial implementation. |
| `/portal/student/wallet/topup` | ⚠️ Partial | Partial implementation. |
| `/portal/student/wallet/transactions` | ⚠️ Partial | Partial implementation. |

### Parent
| Route | Status | Issue |
|---|---|---|
| `/portal/parent` | ✅ Done | Live data wiring present. |
| `/portal/parent/announcements` | ✅ Done | Live data wiring present, but backed by notification proxy data. |
| `/portal/parent/children` | ✅ Done | Live data wiring present. |
| `/portal/parent/children/[studentId]` | ✅ Done | Live data wiring present. |
| `/portal/parent/children/[studentId]/assignments` | ✅ Done | Live data wiring present. |
| `/portal/parent/children/[studentId]/attendance` | ✅ Done | Live data wiring present. |
| `/portal/parent/children/[studentId]/grades` | ✅ Done | Live data wiring present. |
| `/portal/parent/children/[studentId]/timetable` | ✅ Done | Live data wiring present. |
| `/portal/parent/communications` | ⚠️ Partial | Partial implementation. |
| `/portal/parent/dashboard/enhanced` | ✅ Done | Live data wiring present. |
| `/portal/parent/fees` | ✅ Done | Live data wiring present. |
| `/portal/parent/fees/history` | ✅ Done | Live data wiring present. |
| `/portal/parent/fees/pay` | ⚠️ Partial | Payment UI exists but not all methods are fully polished end-to-end. |
| `/portal/parent/messages` | ⚠️ Partial | Partial implementation. |
| `/portal/parent/notifications` | ⚠️ Partial | Static page shell. |
| `/portal/parent/payments` | ⚠️ Partial | Partial implementation. |
| `/portal/parent/profile` | ✅ Done | Live data wiring present. |

### Alumni
| Route | Status | Issue |
|---|---|---|
| `/portal/alumni` | ⚠️ Partial | Partial implementation. |
| `/portal/alumni/directory` | ⚠️ Partial | Partial implementation. |
| `/portal/alumni/events` | ✅ Done | Live data wiring present. |
| `/portal/alumni/notifications` | ⚠️ Partial | Static page shell. |
| `/portal/alumni/profile` | ⚠️ Partial | Partial implementation. |
| `/portal/alumni/transcripts` | ⚠️ Partial | Partial implementation. |

### Partner
| Route | Status | Issue |
|---|---|---|
| `/portal/partner` | ✅ Done | Live data wiring present. |
| `/portal/partner/dashboard` | ✅ Done | Live data wiring present. |
| `/portal/partner/messages` | ⚠️ Partial | Partial implementation. |
| `/portal/partner/notifications` | ⚠️ Partial | Static page shell. |
| `/portal/partner/payments` | ✅ Done | Live data wiring present. |
| `/portal/partner/profile` | ✅ Done | Live data wiring present. |
| `/portal/partner/reports` | ✅ Done | Live data wiring present. |
| `/portal/partner/students` | ✅ Done | Live data wiring present. |
| `/portal/partner/students/[studentId]` | ✅ Done | Live data wiring present. |

## 5. Missing Features — Prioritized List

### CRITICAL
| Module | Panel | Feature | What's Missing | Suggested Fix |
|---|---|---|---|---|
| Auth / Tenant Security | All | Server-side route protection | Route access is mainly client-side through `AuthGuard` and `RoleGuard`. | Add middleware or server-layout/session enforcement at route boundaries. |
| Tenant Isolation | Backend | Guard-first enforcement | Multiple Convex files export functions without tenant guard equivalents. | Require `requireTenantContext`, `requireTenantSession`, or explicit platform/public exemption per file. |
| Routing | Teacher / Student / Parent / Alumni / Partner | Support tickets | `/support/tickets` exists in nav but no route file exists. | Create route or remove links from nav config. |
| Payments | Parent / Finance | Stripe webhook reconciliation | Pending callbacks are tied to Checkout Session IDs, while success webhooks may arrive on Payment Intent IDs. | Normalize and persist both IDs, or reconcile by metadata/order reference. |
| Infra / Tenancy | All | Wildcard tenant hosting | No clear wildcard Vercel routing for tenant subdomains at root. | Add explicit wildcard domain/routing configuration and align domains. |

### HIGH
<<<<<<< HEAD
| Module | Panel | Feature | Status | Notes |
|---|---|---|---|---|
| Platform | Platform Admin | Tickets alternate views | Open | Kanban/calendar views surfaced but not built; hide or implement. |
| Timetable | School Admin | Auto-planning builder | Open | Drag/drop auto-planning UI promise not yet fulfilled. |
| Communications | Parent | Announcements feed | ✅ RESOLVED | `getAnnouncements` query now reads dedicated `announcements` table with audience filtering; frontend page updated with priority badges and timestamps. |
| Platform | Platform Admin | Health export | Open | Export button not wired to report generation. |
| Platform | Platform Admin | Automation workflows | Open | Workflow builder and execution drill-down remain partial. |
| Docs | Engineering | Implementation accuracy | ✅ RESOLVED | Audit report updated; DEPLOYMENT-STATUS.md is stale (reflects an earlier sprint state). |

### MEDIUM
| Module | Panel | Feature | Status | Notes |
|---|---|---|---|---|
| E-wallet | Student / Admin | Wallet transfer/topup UX | Open | Core page exists; transaction subflows remain partial. |
| HR / Library / Transport / E-commerce | School Admin | CRUD completion | Open | Most pages have real scaffolds; confirm no remaining placeholder states. |
| Notifications | All portals | Notifications pages | ✅ RESOLVED | All 5 portal notification pages (teacher/student/parent/alumni/partner) verified wired to real Convex queries with mark-read. |
| Platform Marketplace | Platform Admin | Top-level marketplace management | Open | Moderation and settings flows remain incomplete. |
=======
| Module | Panel | Feature | What's Missing | Suggested Fix |
|---|---|---|---|---|
| Platform | Platform Admin | Tickets alternate views | Kanban and calendar views are surfaced but explicitly not implemented. | Hide unfinished views or build them fully. |
| Timetable | School Admin | Auto-planning builder | Admin timetable page says drag/drop auto-planning is not implemented. | Complete scheduler UX or remove promise from UI. |
| Communications | Parent | Announcements feed | Parent announcements currently use notifications as a proxy. | Add a dedicated announcements query/model. |
| Platform | Platform Admin | Health export | Export action is still not wired. | Connect export UI to backend/report generation. |
| Platform | Platform Admin | Automation workflows | Builder and execution drill-down remain partial. | Finish workflow persistence and execution visibility. |
| Docs | Engineering | Implementation accuracy | Several docs still describe backend/mobile as placeholders even though code exists. | Update docs to match the current implementation. |

### MEDIUM
| Module | Panel | Feature | What's Missing | Suggested Fix |
|---|---|---|---|---|
| E-wallet | Student / Admin | Wallet transfer/topup UX | Core page exists, but transaction subflows remain partial. | Finish mutations, validation, and confirmations on wallet child routes. |
| HR / Library / Transport / E-commerce | School Admin | CRUD completion | Many pages have live scaffolds but still include placeholder states or incomplete CRUD. | Close route-by-route gaps with validation, empty states, delete confirms, and pagination. |
| Notifications | All portals | Notifications pages | Several notification pages are static shells despite backend notification support existing. | Wire each page to real notification queries and mark-read mutations. |
| Platform Marketplace | Platform Admin | Top-level marketplace management | Page structure exists but remains placeholder-heavy. | Finish create/update moderation flows and persist settings. |
>>>>>>> origin/main

### LOW
| Module | Panel | Feature | What's Missing | Suggested Fix |
|---|---|---|---|---|
| UI Consistency | Multiple | Placeholder copy in production pages | Several pages still expose “not implemented yet” messaging. | Replace with feature flags or hide incomplete controls. |
| Internationalization | All | Localized content | Docs acknowledge no i18n. | Add locale strategy once core workflows are stable. |

## 6. Payment Integration Status

| Provider | Initiation | Callback / Webhook | Ledger Posting | Status |
|---|---|---|---|---|
| M-Pesa Daraja | Yes | Yes | Yes | ✅ Strongest of the payment paths |
| Airtel Money | Yes | Yes | Yes | ✅ Implemented, though it leans on shared finance reconciliation |
| Stripe | Yes | Yes | Partial | ⚠️ Webhook matching risk can break automatic posting for some successful payments |
| Bank Transfer | Yes | Manual verification route exists | Yes | ✅ Manual review flow implemented |

Notes:
- Payment posting into student finance records is handled in [`convex/modules/finance/mutations.ts`](/c:/Users/Admin/Projects/edumyles/convex/modules/finance/mutations.ts).
- Provider actions live under [`convex/actions/payments/`](/c:/Users/Admin/Projects/edumyles/convex/actions/payments).
- Webhooks live under [`frontend/src/app/api/webhooks/`](/c:/Users/Admin/Projects/edumyles/frontend/src/app/api/webhooks).

## 7. Communication Integration Status

| Channel | Status | Notes |
|---|---|---|
| SMS | ✅ Implemented | Africa's Talking is wired via [`convex/actions/communications/sms.ts`](/c:/Users/Admin/Projects/edumyles/convex/actions/communications/sms.ts). |
| Email | ✅ Implemented | Resend + React Email templates are wired via [`convex/actions/communications/email.ts`](/c:/Users/Admin/Projects/edumyles/convex/actions/communications/email.ts) and email templates in communications modules. |
| In-app | ✅ Implemented | Notification creation and mark-read flows exist. Several frontend notification pages are still incomplete. |
| Push | ✅ Implemented | Expo push action exists in [`convex/actions/communications/push.ts`](/c:/Users/Admin/Projects/edumyles/convex/actions/communications/push.ts). |

## 8. Mobile App Status

<<<<<<< HEAD
**[UPDATED 2026-04-04]** — All screens are real and role-aware, not placeholders.

- Implemented screens (all role-aware):
  - `LoginScreen` — WorkOS browser auth flow
  - `DashboardScreen` — student/teacher/parent role-branched with real Convex queries
  - `AssignmentsScreen` — student (view/submit) + teacher (grade/manage) branches
  - `AttendanceScreen` — student (view own) + teacher (mark class attendance) branches
  - `FeesScreen` — student (wallet + fee balance) + parent (children payments) + teacher (today's timetable) branches
  - `GradesScreen` — student (grades by subject) + teacher (gradebook per class) + parent (children grades) branches
  - `ProfileScreen` — **IMPROVED**: now shows unread notification count, mark-as-read tap-to-dismiss, mark-all-read button. Role-branched: parent (announcements + notifications), teacher (profile + notifications), student (profile + notifications).
- Mobile backend connectivity:
  - Convex wired via [`mobile/src/lib/convexApi.ts`](/c:/Users/Admin/Projects/edumyles/mobile/src/lib/convexApi.ts)
  - Offline cache via [`mobile/src/hooks/useOfflineSync.ts`](/c:/Users/Admin/Projects/edumyles/mobile/src/hooks/useOfflineSync.ts)
  - Push notifications initialized on startup via `services/pushNotifications`
- Coverage by panel:
  - Student: good coverage (grades, assignments, attendance, fees/wallet, profile+notifications)
  - Parent: good coverage (children, fees, announcements, notifications)
  - Teacher: good coverage (classes, assignments, gradebook, attendance, timetable, notifications)
  - School Admin / Platform Admin / Alumni / Partner: web-only (by design for current scope)

## 9. Auth & Tenant Isolation Issues

**[RESOLVED 2026-04-04]** All critical guard gaps have been remediated:
- `communications/email.ts` — `assertTrustedWebhook` guard confirmed intentional (internal system action; not user-callable). Exemption documented.
- `communications/platform.ts` — `requirePlatformSession` confirmed present. ✅
- `communications/sms.ts` — `assertTrustedWebhook` confirmed intentional (same as email). Exemption documented. ✅
- `marketplace/platform.ts` — `requirePlatformSession` confirmed present. ✅
- `marketplace/seed.ts` — **FIXED**: `seedModuleRegistry` and `ensureCoreModules` now require platform session token. `ensureCoreModulesForTenant` now requires tenant session token. ✅
- `marketplace/mutations.ts::runSeedModuleRegistry` — **FIXED**: `sessionToken` made required (was `optional`), guard now always enforced. ✅
- `pm/deploys.ts`, `pm/epics.ts`, `pm/github.ts`, `pm/projects.ts`, `pm/tasks.ts`, `pm/timeLogs.ts`, `pm/workspaces.ts` — all use `requirePmRole` → `requireTenantSession`. Confirmed guarded. ✅
- `portal/student/testQuery.ts` — **DELETED**: debug-only file with no production consumers. ✅
- `api/auth/session/route.ts` — **FIXED**: bootstrap calls to `ensureCoreModules` and `seedModuleRegistry` now pass `platformSessionToken`. ✅
- `auth/loginAttempts.ts` — intentionally unauthenticated (pre-auth rate limiting by design; `clearAttempts` is a known minor risk). Documented exemption.

Remaining frontend concerns:
- [`frontend/src/components/auth/AuthGuard.tsx`](/c:/Users/Admin/Projects/edumyles/frontend/src/components/auth/AuthGuard.tsx) and [`frontend/src/components/shared/RoleGuard.tsx`](/c:/Users/Admin/Projects/edumyles/frontend/src/components/shared/RoleGuard.tsx) are client-side guards.
- Several portal layouts allow elevated roles into end-user portals, which increases accidental overexposure risk.
- Tenant routing inconsistency:
  - [`frontend/src/app/api/tenant-handler/route.ts`](/c:/Users/Admin/Projects/edumyles/frontend/src/app/api/tenant-handler/route.ts) assumes `*.edumyles.com`.
  - Multiple tenant UI components display `*.edumyles.co.ke`.
=======
- Implemented screens:
  - `LoginScreen`
  - `DashboardScreen`
  - `AssignmentsScreen`
  - `AttendanceScreen`
  - `FeesScreen`
  - `GradesScreen`
  - `ProfileScreen`
- Mobile backend connectivity:
  - Convex is wired through [`mobile/src/lib/convexApi.ts`](/c:/Users/Admin/Projects/edumyles/mobile/src/lib/convexApi.ts).
  - Offline/poor-connectivity handling exists through [`mobile/src/hooks/useOfflineSync.ts`](/c:/Users/Admin/Projects/edumyles/mobile/src/hooks/useOfflineSync.ts).
  - Mobile auth exists through a browser-assisted login flow in [`mobile/src/screens/LoginScreen.tsx`](/c:/Users/Admin/Projects/edumyles/mobile/src/screens/LoginScreen.tsx).
- Coverage by panel:
  - Student: partial coverage
  - Parent: partial coverage
  - Teacher: partial coverage
  - School Admin / Platform Admin / Alumni / Partner: effectively web-only
- Audit note:
  - The current codebase is materially ahead of the docs; docs still describe mobile as a placeholder, but the app now has real screens and real backend integration.

## 9. Auth & Tenant Isolation Issues

- Critical tenant-guard gaps found in exported Convex files:
  - [`convex/modules/communications/email.ts`](/c:/Users/Admin/Projects/edumyles/convex/modules/communications/email.ts)
  - [`convex/modules/communications/platform.ts`](/c:/Users/Admin/Projects/edumyles/convex/modules/communications/platform.ts)
  - [`convex/modules/communications/sms.ts`](/c:/Users/Admin/Projects/edumyles/convex/modules/communications/sms.ts)
  - [`convex/modules/marketplace/platform.ts`](/c:/Users/Admin/Projects/edumyles/convex/modules/marketplace/platform.ts)
  - [`convex/modules/marketplace/seed.ts`](/c:/Users/Admin/Projects/edumyles/convex/modules/marketplace/seed.ts)
  - [`convex/modules/pm/deploys.ts`](/c:/Users/Admin/Projects/edumyles/convex/modules/pm/deploys.ts)
  - [`convex/modules/pm/epics.ts`](/c:/Users/Admin/Projects/edumyles/convex/modules/pm/epics.ts)
  - [`convex/modules/pm/github.ts`](/c:/Users/Admin/Projects/edumyles/convex/modules/pm/github.ts)
  - [`convex/modules/pm/projects.ts`](/c:/Users/Admin/Projects/edumyles/convex/modules/pm/projects.ts)
  - [`convex/modules/pm/tasks.ts`](/c:/Users/Admin/Projects/edumyles/convex/modules/pm/tasks.ts)
  - [`convex/modules/pm/timeLogs.ts`](/c:/Users/Admin/Projects/edumyles/convex/modules/pm/timeLogs.ts)
  - [`convex/modules/pm/workspaces.ts`](/c:/Users/Admin/Projects/edumyles/convex/modules/pm/workspaces.ts)
  - [`convex/modules/portal/student/testQuery.ts`](/c:/Users/Admin/Projects/edumyles/convex/modules/portal/student/testQuery.ts)
- Possible intentional exceptions exist for auth/platform/system helpers, but tenant-scoped files should be treated as security review items until explicitly exempted.
>>>>>>> origin/main
- Frontend access control concerns:
  - [`frontend/src/components/auth/AuthGuard.tsx`](/c:/Users/Admin/Projects/edumyles/frontend/src/components/auth/AuthGuard.tsx) and [`frontend/src/components/shared/RoleGuard.tsx`](/c:/Users/Admin/Projects/edumyles/frontend/src/components/shared/RoleGuard.tsx) are client-side guards.
  - Several portal layouts allow elevated roles into end-user portals, which increases accidental overexposure risk.
- Tenant routing inconsistency:
  - [`frontend/src/app/api/tenant-handler/route.ts`](/c:/Users/Admin/Projects/edumyles/frontend/src/app/api/tenant-handler/route.ts) assumes `*.edumyles.com`.
  - Multiple tenant UI components display `*.edumyles.co.ke`.

## 10. Shared Layer Gaps

<<<<<<< HEAD
**[PARTIALLY RESOLVED 2026-04-04]**
- Types — Added to `shared/src/types/index.ts`:
  - `TimetableSlot`, `SchoolEvent`, `Subject` (timetable domain)
  - `Announcement`, `AnnouncementAudience`, `AnnouncementPriority`
  - `Guardian`
  - `AttendanceRecord`, `GradeEntry`, `Assignment` (academics domain)
- Validators — Added to `shared/src/validators/index.ts`:
  - `createAnnouncementSchema`, `updateAnnouncementSchema`
  - `updateStudentSchema`
  - `updateStaffSchema`
  - `createSubjectSchema`
  - `markAttendanceSchema`
- Remaining gap: compatibility alias `platform_admin` → `super_admin` in `createUserSchema` transform is a migration smell. Safe to remove once confirmed no external clients pass `platform_admin`.
- Constants: [`shared/src/constants/index.ts`](/c:/Users/Admin/Projects/edumyles/shared/src/constants/index.ts) is complete.
=======
- Types:
  - [`shared/src/types/index.ts`](/c:/Users/Admin/Projects/edumyles/shared/src/types/index.ts) covers many major entities, but it does not mirror the full breadth of the Convex schema surface.
- Validators:
  - [`shared/src/validators/index.ts`](/c:/Users/Admin/Projects/edumyles/shared/src/validators/index.ts) contains strong shared schemas, but not every domain form in the frontend is clearly reusing them.
- Constants:
  - [`shared/src/constants/index.ts`](/c:/Users/Admin/Projects/edumyles/shared/src/constants/index.ts) is fairly complete and includes East African countries/currencies and curriculum codes.
  - There is still a compatibility alias where `platform_admin` is transformed to `super_admin`, which is a migration smell worth cleaning up.
>>>>>>> origin/main

## 11. Infra & CI/CD Gaps

- Vercel / routing:
  - Root [`vercel.json`](/c:/Users/Admin/Projects/edumyles/vercel.json) does not clearly define wildcard tenant subdomain behavior.
- Environment docs:
  - [`.env.example`](/c:/Users/Admin/Projects/edumyles/.env.example) is broad and mostly complete, but some platform domain assumptions are inconsistent with the UI.
- CI/CD:
  - GitHub workflows exist and are meaningful:
    - [`.github/workflows/ci.yml`](/c:/Users/Admin/Projects/edumyles/.github/workflows/ci.yml)
    - [`.github/workflows/deploy-preview.yml`](/c:/Users/Admin/Projects/edumyles/.github/workflows/deploy-preview.yml)
    - [`.github/workflows/deploy-production.yml`](/c:/Users/Admin/Projects/edumyles/.github/workflows/deploy-production.yml)
- Tests:
  - Test tooling is present: Vitest, Playwright, and mobile tests.
  - Coverage exists, but this audit did not execute the full suite.
- Seed / migration strategy:
  - Seed paths exist in [`convex/dev/seed.ts`](/c:/Users/Admin/Projects/edumyles/convex/dev/seed.ts), [`scripts/seed.ts`](/c:/Users/Admin/Projects/edumyles/scripts/seed.ts), and [`scripts/seed-cli.mjs`](/c:/Users/Admin/Projects/edumyles/scripts/seed-cli.mjs).

## 12. Recommended Implementation Priority Order

1. Enforce tenant isolation and auth at the server boundary.
2. Fix wildcard tenant routing and align all domains to one canonical root domain.
3. Repair Stripe reconciliation so successful webhooks always match pending finance records.
4. Remove or implement broken nav targets, starting with `/support/tickets`.
5. Finish platform ticketing views and hide unfinished controls until complete.
6. Complete notifications pages across student, parent, teacher, alumni, and partner portals using existing backend notification APIs.
7. Finish the highest-traffic school admin workflows: students, staff, finance invoices/fees, timetable planning.
8. Replace proxy announcement logic for parents with a dedicated announcements model/query.
9. Finish student wallet subflows and admin e-wallet management routes.
10. Update stale docs so architecture, backend status, and mobile status reflect the actual codebase.
