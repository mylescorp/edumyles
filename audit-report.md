# EduMyles — End-to-End Implementation Audit Report
Generated: 2026-04-02

## 1. Executive Summary
- Overall implementation completeness estimate: 58%
- Critical blockers:
  - `convex/sessions.ts` exposes unauthenticated session creation, reads, role mutation, and deletion. This is a critical auth break.
  - `convex/notifications.ts` exposes notification reads and read-state mutations without tenant/session enforcement. This is a critical tenant-isolation break.
  - Role vocabulary is inconsistent across layers: shared constants use `platform_admin`, while frontend/backend auth logic primarily use `super_admin`.
  - `vercel.json` is configured to build `landing` and rewrite all traffic to `/api/tenant-handler`, which does not match the intended app-router multi-tenant frontend deployment.
  - Payment and comms integrations have env-name and API-contract drift (`MPESA_*` vs `CONVEX_MPESA_*`, `AT_*` vs `AFRICAS_TALKING_*`), making real deployments likely to fail.
  - Mobile auth is not a WorkOS mobile flow; users paste a session token manually.
- Number of modules fully implemented / partially implemented / not started:
  - Fully implemented: 7
  - Partially implemented: 5
  - Not started: 0

## 2. User Panels Identified
| Panel | Route Prefix | Roles |
| --- | --- | --- |
| Platform Admin Panel | `/platform` | `master_admin`, `super_admin` |
| School Admin Panel | `/admin` | `school_admin`, `principal`, `bursar`, `hr_manager`, `librarian`, `transport_manager` |
| Teacher Portal | `/portal/teacher` | `teacher` |
| Student Portal | `/portal/student` | `student` |
| Legacy Student Portal | `/student` | `student` |
| Parent Portal | `/portal/parent` | `parent` |
| Alumni Portal | `/portal/alumni` | `alumni` |
| Partner Portal | `/portal/partner` | `partner` |
| Support Portal | `/support` | shared portal users |
| Roles without dedicated panel | none | `board_member`, `receptionist`, `platform_admin` |

## 3. Backend Module Status
| Module | Functions Found | Fully Impl. | Stubs/Partial | Missing | Notes |
| --- | ---: | ---: | ---: | ---: | --- |
| SIS | 10 | 10 | 0 | 0 | Guarded with tenant context; no cron/realtime wiring observed. |
| Admissions | 5 | 5 | 0 | 0 | Core logic exists; frontend coverage is much thinner than backend. |
| Finance | 15 | 11 | 4 | 0 | Payment initiation exists, but ledger auto-posting and bank-transfer verification are incomplete end-to-end. |
| Timetable | 11 | 11 | 0 | 0 | Core CRUD exists; no scheduling/cron support found. |
| Academics | 22 | 22 | 0 | 0 | Strongest backend module; still no watcher/cron support. |
| HR | 17 | 17 | 0 | 0 | Backend logic exists; frontend payroll/leave pages are still stubbed. |
| Library | 10 | 10 | 0 | 0 | Backend appears implemented; frontend is largely placeholder. |
| Transport | 11 | 11 | 0 | 0 | Backend appears implemented; admin transport UI is largely placeholder. |
| Communications | 60 | 45 | 15 | 0 | In-app comms are strongest; `templates.ts` is placeholder and `email.ts`/`sms.ts` skip normal tenant guards. |
| eWallet | 13 | 9 | 4 | 0 | Backend exists, but wallet send/topup/transactions UX is still stubbed on student/admin panels. |
| eCommerce | 11 | 8 | 3 | 0 | Backend exists, but admin storefront/product/order UI is mostly placeholder. |
| Platform | 337 | 230 | 107 | 0 | Tenant management, onboarding, billing, and dashboards exist, but many functions/pages are partial and several files bypass `requirePlatformSession`. |

## 4. Frontend Panel Status
### Platform Admin
| Route | Status | Issue |
| --- | --- | --- |
| `/platform` | ⚠️ Partial | Real dashboard shell, but page-level scan shows no direct Convex hook; relies on nested components. |
| `/platform/ai-support` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/analytics` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/api-keys` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/audit` | ✅ Done | Real page present. |
| `/platform/automation` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/billing` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/billing/invoices` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/billing/invoices/create` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/changelog` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/communications` | ✅ Done | Real page present. |
| `/platform/communications/broadcast` | ⚠️ Partial | UI exists; no direct Convex hook in page file. |
| `/platform/crm` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/crm/[dealId]` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/crm/leads` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/crm/leads/create` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/crm/proposals` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/crm/proposals/[proposalId]` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/data-export` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/feature-flags` | ⚠️ Partial | Page exists; no direct Convex hook in page file. |
| `/platform/health` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/impersonation` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/knowledge-base` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/marketplace` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/marketplace/[moduleId]` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/marketplace/admin` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/marketplace/developer` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/marketplace/reviews` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/notifications` | ⚠️ Partial | UI exists, but relies on insecure global notification APIs. |
| `/platform/onboarding` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/operations` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/pm` | ✅ Done | Real page present. |
| `/platform/pm/[slug]` | ✅ Done | Real page present. |
| `/platform/pm/[slug]/[projectId]` | ✅ Done | Real page present. |
| `/platform/pm/[slug]/[projectId]/calendar` | ✅ Done | Real page present. |
| `/platform/pm/[slug]/[projectId]/list` | ✅ Done | Real page present. |
| `/platform/pm/[slug]/[projectId]/timeline` | ✅ Done | Real page present. |
| `/platform/profile` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/role-builder` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/scheduled-reports` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/security` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/settings` | ✅ Done | Real page present. |
| `/platform/sla` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/staff-performance` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/staff-performance/[staffId]` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/tenant-success` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/tenants` | ✅ Done | Real page present. |
| `/platform/tenants/[tenantId]` | ✅ Done | Real page present. |
| `/platform/tenants/create` | ⚠️ Partial | UI exists; no direct Convex hook in page file. |
| `/platform/tickets` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/tickets/[id]` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/tickets/create` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/users` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/users/[userId]` | ✅ Done | Real page present. |
| `/platform/users/invite` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/waitlist` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/webhooks` | 🔲 Stub | Placeholder/TODO page. |
| `/platform/white-label` | 🔲 Stub | Placeholder/TODO page. |

### School Admin
| Route | Status | Issue |
| --- | --- | --- |
| `/admin` | ✅ Done | Real dashboard page present. |
| `/admin/academics` | ✅ Done | Real page present. |
| `/admin/admissions` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/admissions/[appId]` | ✅ Done | Real page present. |
| `/admin/audit` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/audit/reports` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/classes` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/classes/[classId]` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/classes/create` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/communications` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/communications/create` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/communications/email` | ✅ Done | Real page present. |
| `/admin/ecommerce` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/ecommerce/orders` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/ecommerce/products` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/ecommerce/products/create` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/ewallet` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/ewallet/transactions` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/ewallet/wallets` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/finance` | ✅ Done | Real page present. |
| `/admin/finance/fees` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/finance/invoices` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/finance/invoices/create` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/hr` | ✅ Done | Real page present. |
| `/admin/hr/leave` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/hr/payroll` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/library` | ✅ Done | Real page present. |
| `/admin/library/books` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/library/books/create` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/library/circulation` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/library/reports` | ✅ Done | Real page present. |
| `/admin/marketplace` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/marketplace/[moduleId]` | ✅ Done | Real page present. |
| `/admin/marketplace/requests` | ✅ Done | Real page present. |
| `/admin/modules` | ✅ Done | Real page present. |
| `/admin/notes` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/notifications` | ⚠️ Partial | UI exists, but relies on insecure global notification APIs. |
| `/admin/profile` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/reports` | ⚠️ Partial | Page exists; no direct Convex hook in page file. |
| `/admin/security` | ✅ Done | Real page present. |
| `/admin/settings` | ⚠️ Partial | Page exists; no direct Convex hook in page file. |
| `/admin/settings/billing` | ⚠️ Partial | Page exists; no direct Convex hook in page file. |
| `/admin/settings/modules` | ✅ Done | Real page present. |
| `/admin/settings/modules/[moduleId]` | ✅ Done | Real page present. |
| `/admin/settings/roles` | ⚠️ Partial | Page exists; no direct Convex hook in page file. |
| `/admin/staff` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/staff/[staffId]` | ✅ Done | Real page present. |
| `/admin/staff/create` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/students` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/students/[studentId]` | ✅ Done | Real page present. |
| `/admin/students/create` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/students/import` | 🔲 Stub | Hardcoded/mock import flow. |
| `/admin/tasks` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/tickets` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/timetable` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/timetable/assignments` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/timetable/events` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/timetable/events/create` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/timetable/schedule` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/transport` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/transport/routes` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/transport/routes/create` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/transport/tracking` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/users` | 🔲 Stub | Placeholder/TODO page. |
| `/admin/users/invite` | ✅ Done | Real page present. |

### Teacher Portal
| Route | Status | Issue |
| --- | --- | --- |
| `/portal/teacher` | ✅ Done | Real dashboard page present. |
| `/portal/teacher/assignments` | ✅ Done | Real page present. |
| `/portal/teacher/assignments/create` | 🔲 Stub | Placeholder/TODO page. |
| `/portal/teacher/attendance` | 🔲 Stub | Placeholder/TODO page. |
| `/portal/teacher/classes` | ✅ Done | Real page present. |
| `/portal/teacher/classes/[classId]` | ✅ Done | Real page present. |
| `/portal/teacher/classes/[classId]/grades` | 🔲 Stub | Placeholder/TODO page. |
| `/portal/teacher/communications` | 🔲 Stub | Placeholder/TODO page. |
| `/portal/teacher/gradebook` | ✅ Done | Real page present. |
| `/portal/teacher/notifications` | ⚠️ Partial | UI exists, but relies on insecure global notification APIs. |
| `/portal/teacher/profile` | ⚠️ Partial | Mostly auth-session display, not teacher-domain data. |
| `/portal/teacher/timetable` | ✅ Done | Real page present. |

### Student Portal
| Route | Status | Issue |
| --- | --- | --- |
| `/portal/student` | ✅ Done | Real dashboard page present. |
| `/portal/student/assignments` | ✅ Done | Real page present. |
| `/portal/student/assignments/[assignmentId]` | 🔲 Stub | Placeholder/TODO page. |
| `/portal/student/attendance` | ✅ Done | Real page present. |
| `/portal/student/communications` | 🔲 Stub | Placeholder/TODO page. |
| `/portal/student/grades` | ✅ Done | Real page present. |
| `/portal/student/notifications` | ⚠️ Partial | UI exists, but relies on insecure global notification APIs. |
| `/portal/student/profile` | ✅ Done | Real page present. |
| `/portal/student/report-cards` | ✅ Done | Real page present. |
| `/portal/student/timetable` | ✅ Done | Real page present. |
| `/portal/student/wallet` | ✅ Done | Real page present. |
| `/portal/student/wallet/send` | 🔲 Stub | Placeholder/TODO page. |
| `/portal/student/wallet/topup` | 🔲 Stub | Placeholder/TODO page. |
| `/portal/student/wallet/transactions` | 🔲 Stub | Placeholder/TODO page. |

### Legacy Student Portal
| Route | Status | Issue |
| --- | --- | --- |
| `/student` | ✅ Done | Duplicate legacy portal route exists alongside `/portal/student`. |
| `/student/announcements` | ✅ Done | Duplicate legacy portal route. |
| `/student/assignments` | ✅ Done | Duplicate legacy portal route. |
| `/student/assignments/[assignmentId]` | 🔲 Stub | Placeholder/TODO page. |
| `/student/attendance` | ✅ Done | Duplicate legacy portal route. |
| `/student/grades` | ✅ Done | Duplicate legacy portal route. |
| `/student/profile` | ✅ Done | Duplicate legacy portal route. |
| `/student/report-cards` | ✅ Done | Duplicate legacy portal route. |
| `/student/timetable` | ✅ Done | Duplicate legacy portal route. |
| `/student/wallet` | 🔲 Stub | Placeholder/TODO page. |

### Parent Portal
| Route | Status | Issue |
| --- | --- | --- |
| `/portal/parent` | ✅ Done | Real dashboard page present. |
| `/portal/parent/announcements` | ✅ Done | Real page present. |
| `/portal/parent/children` | ✅ Done | Real page present. |
| `/portal/parent/children/[studentId]` | ✅ Done | Real page present. |
| `/portal/parent/children/[studentId]/assignments` | ✅ Done | Real page present. |
| `/portal/parent/children/[studentId]/attendance` | ✅ Done | Real page present. |
| `/portal/parent/children/[studentId]/grades` | ✅ Done | Real page present. |
| `/portal/parent/children/[studentId]/timetable` | ✅ Done | Real page present. |
| `/portal/parent/communications` | 🔲 Stub | Placeholder/TODO page. |
| `/portal/parent/dashboard/enhanced` | ✅ Done | Real page present. |
| `/portal/parent/fees` | ✅ Done | Real page present. |
| `/portal/parent/fees/history` | ✅ Done | Real page present. |
| `/portal/parent/fees/pay` | 🔲 Stub | Placeholder/TODO page. |
| `/portal/parent/messages` | 🔲 Stub | Placeholder/TODO page. |
| `/portal/parent/notifications` | ⚠️ Partial | UI exists, but relies on insecure global notification APIs. |
| `/portal/parent/payments` | 🔲 Stub | Placeholder/TODO page. |
| `/portal/parent/profile` | ✅ Done | Real page present. |

### Alumni Portal
| Route | Status | Issue |
| --- | --- | --- |
| `/portal/alumni` | 🔲 Stub | Placeholder/TODO page. |
| `/portal/alumni/directory` | 🔲 Stub | Placeholder/TODO page. |
| `/portal/alumni/events` | ✅ Done | Real page present. |
| `/portal/alumni/notifications` | ⚠️ Partial | UI exists, but relies on insecure global notification APIs. |
| `/portal/alumni/profile` | 🔲 Stub | Placeholder/TODO page. |
| `/portal/alumni/transcripts` | 🔲 Stub | Placeholder/TODO page. |

### Partner Portal
| Route | Status | Issue |
| --- | --- | --- |
| `/portal/partner` | ✅ Done | Real dashboard page present. |
| `/portal/partner/dashboard` | ✅ Done | Real page present. |
| `/portal/partner/messages` | 🔲 Stub | Placeholder/TODO page. |
| `/portal/partner/notifications` | ⚠️ Partial | UI exists, but relies on insecure global notification APIs. |
| `/portal/partner/payments` | ✅ Done | Real page present. |
| `/portal/partner/profile` | ✅ Done | Real page present. |
| `/portal/partner/reports` | ✅ Done | Real page present. |
| `/portal/partner/students` | ✅ Done | Real page present. |
| `/portal/partner/students/[studentId]` | ✅ Done | Real page present. |

### Support Portal
| Route | Status | Issue |
| --- | --- | --- |
| `/support` | ✅ Done | Real page present. |
| `/support/tickets` | 🔲 Stub | Placeholder/TODO page. |
| `/support/tickets/[id]` | 🔲 Stub | Placeholder/TODO page. |
| `/support/tickets/create` | 🔲 Stub | Placeholder/TODO page. |

## 5. Missing Features — Prioritized List
### CRITICAL
| Module | Panel | Feature | What's Missing | Suggested Fix |
| --- | --- | --- | --- | --- |
| Auth/Core | All | Session security | `convex/sessions.ts` allows unauthenticated session CRUD and role updates. | Move all session operations behind WorkOS-backed auth and signed server-only flows. |
| Notifications | All | Tenant isolation | Notification read/write APIs do not call tenant/session guards. | Require `requireTenantContext` or `requireTenantSession` on every notification function and scope by authenticated user. |
| Infra | All | Multi-tenant routing | `vercel.json` currently builds `landing` and rewrites all traffic to one API handler. | Split landing/frontend deployment strategy or correct rewrites/build target to the actual app-router frontend. |
| Roles/Auth | Platform/Admin | Role mapping | `platform_admin` vs `super_admin` mismatch breaks consistent authorization. | Normalize role constants and update frontend/backend/shared types together. |
| Finance | Parent/Student/Admin | Fee ledger posting | Gateway callbacks record payments and invoice status, but do not fully allocate to student ledgers. | Add ledger posting and fee-allocation mutation invoked from confirmed payment handlers. |

### HIGH
| Module | Panel | Feature | What's Missing | Suggested Fix |
| --- | --- | --- | --- | --- |
| Platform | Platform Admin | Tenant lifecycle | Suspension exists, but tenant deletion is not implemented end-to-end. | Add safe soft-delete/archive flow with dependency checks. |
| Communications | Admin/Platform | SMS/Email delivery consistency | Backend has multiple email/SMS paths with mismatched args and env names. | Consolidate onto one guarded action path per channel and align env contracts. |
| Payments | Parent/Admin | Airtel/Bank transfer | Airtel is only partially wired and bank-transfer verification is not a full workflow. | Add verified callback/manual-review states and reconciliation UI. |
| Mobile/Auth | Mobile | WorkOS mobile auth | Mobile login is manual session-token paste. | Implement proper WorkOS device/browser login handoff and secure token storage. |
| Platform | Platform Admin | Scheduled reports/automation | Pages exist, but no real cron/scheduled backend implementation was found. | Add Convex scheduler/cron jobs and reporting actions. |

### MEDIUM
| Module | Panel | Feature | What's Missing | Suggested Fix |
| --- | --- | --- | --- | --- |
| Admin UI | School Admin | Core CRUD coverage | Many route files exist but are placeholders: classes, staff, students, timetable, transport, ewallet, ecommerce. | Finish route-by-route CRUD wiring using existing Convex modules. |
| Platform UI | Platform Admin | Platform operations tools | CRM, marketplace, SLA, security, white-label, waitlist, tickets are mostly placeholders. | Prioritize high-value platform ops pages and remove dead nav until implemented. |
| Shared Layer | All | Types/validators completeness | Shared types and validators cover only a small subset of schema/forms. | Expand shared domain contracts and reuse them in forms and Convex args. |
| Notifications | All | In-app notification safety | UI works, but it depends on insecure APIs. | Rewire hooks after guard fixes and add user ownership checks. |

### LOW
| Module | Panel | Feature | What's Missing | Suggested Fix |
| --- | --- | --- | --- | --- |
| Mobile | Student | Broader panel coverage | Only student-facing screens exist. | Add parent/teacher mobile scope after auth is fixed. |
| Curriculum/Regionalization | All | East Africa defaults | Core constants exist, but code still contains tier/currency/demo assumptions (`free`, demo tenant fallback). | Remove demo fallbacks from production hooks and validate regional defaults centrally. |
| Support | Support | Ticket workflows | Support ticket pages are placeholders. | Either implement ticketing or remove support nav links for now. |

## 6. Payment Integration Status
| Provider | Initiation Implemented? | Callback/Webhook Implemented? | Ledger Posting Done? | Notes |
| --- | --- | --- | --- | --- |
| M-Pesa | Yes | Yes | Partial | STK initiation exists and webhook records payment, but env names drift and ledger allocation is incomplete. |
| Airtel Money | Partial | Partial | No | Initiation and webhook routes exist, but overall flow is inconsistent and not clearly completed end-to-end. |
| Stripe | Yes | Yes | Partial | Checkout/initiate routes and webhook exist, but posting is invoice-centric rather than full student-ledger allocation. |
| Bank Transfer | Partial | No | No | Manual verification workflow is not implemented as a complete review-and-post pipeline. |

## 7. Communication Integration Status
| Channel | Status | Notes |
| --- | --- | --- |
| SMS | ⚠️ Partial | Africa's Talking integration code exists, but env names and API contracts are inconsistent across routes/actions. |
| Email | ⚠️ Partial | Resend integration and email templates exist, but there are multiple send paths and some template flows are placeholder. |
| In-app | ⚠️ Partial | Creation flows exist, but read/mark APIs are insecure and must be fixed before production use. |
| Push | ⚠️ Partial | Expo push token registration exists in mobile, but no complete backend delivery pipeline was verified. |

## 8. Mobile App Status
- Implemented screens in `mobile/src/screens/`: `DashboardScreen`, `GradesScreen`, `AssignmentsScreen`, `AttendanceScreen`, `FeesScreen`, `ProfileScreen`, `LoginScreen`
- Coverage by panel:
  - Student: partial coverage
  - Teacher: none
  - Parent: none
  - Admin/platform: none
- Findings:
  - Screens are mostly implemented for student read-only use cases.
  - Offline caching/sync support exists and is a strong point for low-connectivity contexts.
  - Auth is not WorkOS-native; login asks for a pasted session token.
  - Push token registration exists, but full push delivery was not verified.
  - Duplicate hook files (`useAuth.ts` and `useAuth.tsx`) indicate unfinished mobile cleanup.

## 9. Auth & Tenant Isolation Issues
- Critical: `convex/sessions.ts` exposes unauthenticated `createSession`, `getSession`, `updateSessionRole`, and `deleteSession`.
- Critical: `convex/notifications.ts` notification reads and mark-read mutations do not require tenant/session context.
- High: `convex/platform/settings/maintenanceCheck.ts` is public.
- High: `convex/platform/sla/queries.ts` validates only that a session token exists; it does not enforce platform role via `requirePlatformSession`.
- High: `convex/platform/tenants/emailActions.ts`, `convex/modules/communications/email.ts`, and `convex/modules/communications/sms.ts` bypass the normal tenant-session guard pattern.
- High: `frontend/src/hooks/useTenant.ts` falls back to a demo tenant, which can mask tenant-resolution failures.
- High: subdomain handling is only partially implemented; `frontend/src/app/api/tenant-handler/route.ts` redirects based on subdomain but does not validate it against tenant records.

## 10. Shared Layer Gaps
- `shared/src/types/index.ts` is too small for the domain surface implied by the Convex schema and frontend forms.
- `shared/src/validators/index.ts` defines only a small handful of validators; most frontend forms and backend mutations use local validation instead of shared contracts.
- `shared/src/constants/index.ts` is stronger, but role constants conflict with frontend/backend usage (`platform_admin` vs `super_admin`).
- Shared module/tier assumptions are inconsistent: `moduleGuard` references a `free` tier fallback that does not match the main shared tier definitions.

## 11. Infra & CI/CD Gaps
- No `infra/vercel/` directory exists; deployment logic is centralized in root `vercel.json`.
- `vercel.json` appears misaligned with the intended architecture:
  - builds `landing`
  - outputs `landing/.next`
  - rewrites all requests to `/api/tenant-handler`
- `.env.example` does not match all env names actually used by payment/SMS code.
- CI workflows exist in `.github/workflows`, but there is a script mismatch: workflow references `test:e2e:smoke`, which is not present in root `package.json`.
- Test status observed during audit:
  - `npm run type-check`: passed
  - `npm run test:tenant-isolation`: passed
  - `npm test`: failed because frontend Vitest could not resolve `jsdom`
- Seed scripts exist (`scripts/seed.ts`, `scripts/seed-cli.mjs`, `convex/dev/seed.ts`), but no formal migration strategy beyond schema/code evolution was found.

## 12. Recommended Implementation Priority Order
1. Lock down auth and tenant isolation in Convex: fix `sessions.ts`, `notifications.ts`, and every platform/action file bypassing the standard guard helpers.
2. Unify role definitions across shared, frontend, and backend (`platform_admin` vs `super_admin`) and remove demo/fallback tenant behavior from client hooks.
3. Fix deployment architecture: correct Vercel build/rewrite strategy and validate subdomain-to-tenant resolution against real tenant records.
4. Stabilize payments: align env names, consolidate gateway flows, and implement proper fee-ledger allocation after confirmed payment.
5. Consolidate communications: one guarded SMS pipeline, one guarded email pipeline, and secure in-app notification reads/writes.
6. Finish the school-admin routes that correspond to already-existing backend modules: students, staff, classes, timetable, transport, finance subpages, library CRUD.
7. Finish the platform pages that are currently nav-visible placeholders, starting with billing, security, tickets, onboarding, and scheduled reports.
8. Replace mobile manual-token login with a proper WorkOS mobile auth flow, then expand beyond student-only coverage.
9. Expand shared types/validators so forms and Convex functions use the same contracts.
10. Repair CI/test execution: align workflow scripts, fix `jsdom` test environment resolution, and then raise automated coverage around auth, payments, and tenant isolation.
