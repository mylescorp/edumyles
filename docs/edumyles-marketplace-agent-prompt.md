# EduMyles Marketplace — Agent Analysis & Implementation Prompt
## Version 1.0 | April 2026

---

# PART A — ANALYSIS PROMPT
## (Run this first — before writing any code)

---

```
=======================================================================
EDUMYLES MARKETPLACE — CODEBASE ANALYSIS PROMPT
=======================================================================

You are analyzing the EduMyles codebase to determine what has been
implemented for the marketplace and module system, and what is pending.
Do NOT write any code during this analysis. Only read, assess, and report.

=======================================================================
STEP 1 — READ ALL REFERENCE DOCUMENTS FIRST
=======================================================================

Before touching any code file, read these documents completely:

1. docs/edumyles-marketplace-spec.md     — full marketplace spec
2. docs/edumyles-tech-spec.md            — platform master spec
3. convex/schema.ts                       — existing DB tables
4. convex/crons.ts                        — existing scheduled jobs
5. convex/http.ts                         — webhook handlers
6. .agent-skills/                         — ALL skill files (read all)
7. opensrc/                               — relevant package internals

=======================================================================
STEP 2 — SCHEMA ANALYSIS
=======================================================================

Open convex/schema.ts. For each table listed below, check if it exists.
Output a table: TABLE NAME | EXISTS (yes/no) | MISSING FIELDS (list any)

Required marketplace tables:
marketplace_modules, module_pricing, module_price_overrides,
module_price_history, module_versions, module_installs,
module_access_config, module_event_subscriptions, module_events,
module_notification_settings, module_plan_inclusions, pilot_grants,
module_reviews, module_flags, admin_task_queue,
module_public_api_registry, user_notification_preferences

For tables that exist, check each field against the spec.
Note any fields that are missing or have wrong types.

=======================================================================
STEP 3 — CONVEX FUNCTIONS ANALYSIS
=======================================================================

Check each file listed below. For each function, note:
STATUS: implemented | partial | missing

FILE: convex/eventBus.ts
Functions to check:
- publishEvent (exported async function)
- dispatchEvent (internalMutation)
- retryFailedEvents (internalMutation)
- getEventSubscribers helper

FILE: convex/helpers/moduleGuard.ts
Functions to check:
- requireModuleAccess
- requireModuleFeatureAccess
- getInstalledModules
- isModuleInstalled

FILE: convex/modules/modulePublicApis.ts
Check: does this file exist? Does it have the MODULE_PUBLIC_APIS registry?

FILE: convex/modules/marketplace/installation.ts
Functions to check:
- checkInstallRequirements
- installModule
- uninstallModule
- reinstallModule
- runModuleOnInstall
- runModuleOnUninstall
- purgeExpiredModuleData

FILE: convex/modules/marketplace/pricing.ts
Functions to check:
- calculateModulePrice (pure function with tiered bands)
- getEffectivePricing (checks overrides)
- getActiveStudentCount
- generatePricingBreakdown

FILE: convex/modules/marketplace/billing.ts
Functions to check:
- runMonthlyModuleBilling
- handleModulePaymentFailure
- suspendModuleForPayment
- reinstateModuleAfterPayment
- checkPaymentGracePeriods

FILE: convex/modules/marketplace/planAudit.ts
Functions to check:
- auditModulesForPlanChange
- handlePlanUpgrade
- handlePlanDowngrade
- isModuleIncludedInPlan

FILE: convex/modules/marketplace/pilotGrants.ts
Functions to check:
- createPilotGrant
- revokePilotGrant
- extendPilotGrant
- processPilotExpiry (internalMutation — cron handler)
- getActivePilotGrant

For EACH module in: finance, attendance, academics, admissions, library,
transport, hr, communications, ewallet, ecommerce, reports, timetable,
mod_advanced_analytics, mod_parent_portal, mod_alumni, mod_partner

Check if these files exist and their implementation status:
- convex/modules/[slug]/index.ts (MODULE_METADATA, NAV_CONFIG, DASHBOARD_WIDGETS)
- convex/modules/[slug]/onInstall.ts
- convex/modules/[slug]/onUninstall.ts
- convex/modules/[slug]/configSchema.ts
- convex/modules/[slug]/features.ts
- convex/modules/[slug]/notifications.ts
- convex/modules/[slug]/eventHandlers.ts
- convex/modules/[slug]/publicApi.ts

=======================================================================
STEP 4 — EVENT BUS ANALYSIS
=======================================================================

Check if event handler subscriptions are registered for ALL these events:

MUST BE HANDLED:
student.enrolled
  → mod_finance: createAdmissionFeeInvoice
  → core_users: createParentPortalAccount

student.graduated
  → mod_alumni: createAlumniRecord

finance.invoice.overdue
  → mod_library: addBorrowingRestriction

finance.payment.received
  → mod_library: removeBorrowingRestriction
  → mod_ewallet: updateWalletBalance

attendance.student.absent
  → mod_communications: sendAbsenceNotificationToParent

attendance.student.absent.consecutive
  → mod_communications: sendConsecutiveAbsenceAlert

academics.grade.posted
  → mod_communications: notifyStudentOfGrade

academics.exam.results.published
  → mod_communications: notifyParentsOfResults

library.book.overdue
  → mod_finance: createLibraryFineInvoice

hr.leave.approved
  → mod_timetable: flagAffectedPeriods

For each: check if the handler function exists and is registered in
module_event_subscriptions (either hardcoded in onInstall or seeded).

=======================================================================
STEP 5 — FRONTEND PAGES ANALYSIS
=======================================================================

Check if these pages exist in frontend/src/app/:

SCHOOL ADMIN MARKETPLACE:
- admin/marketplace/page.tsx
- admin/marketplace/[moduleSlug]/page.tsx
- admin/modules/page.tsx
- admin/settings/modules/[moduleSlug]/page.tsx

PLATFORM MARKETPLACE MANAGEMENT:
- platform/marketplace/page.tsx
- platform/marketplace/admin/page.tsx
- platform/marketplace/[moduleId]/page.tsx
- platform/marketplace/pricing/page.tsx
- platform/marketplace/billing/page.tsx
- platform/marketplace/pilot-grants/page.tsx
- platform/marketplace/publishers/page.tsx
- platform/marketplace/flags/page.tsx
- platform/marketplace/reviews/page.tsx

SHARED COMPONENTS:
- frontend/src/components/modules/ModuleConfigForm.tsx
- frontend/src/components/modules/ModuleAccessConfig.tsx
- frontend/src/components/modules/ModuleNotificationSettings.tsx
- frontend/src/components/modules/ModuleUnavailablePage.tsx
- frontend/src/components/modules/ModuleAccessDeniedPage.tsx
- frontend/src/components/modules/ModuleSuspendedPage.tsx
- frontend/src/hooks/useInstalledModules.ts
- frontend/src/hooks/useModuleAccess.ts

For each page that exists, note:
- Does it use hardcoded/mock data? (violation of absolute rules)
- Does it use useQuery for all data fetching?
- Does it have loading states (skeletons)?
- Does it have empty states?
- Does it have error states?

=======================================================================
STEP 6 — PORTAL INTEGRATION ANALYSIS
=======================================================================

For each portal, check if module access gating is implemented:

TEACHER PORTAL: Check frontend/src/app/portal/teacher/
- Do pages that use module features call useModuleAccess?
- Do they show ModuleUnavailablePage if module not installed?
- Do they show ModuleAccessDeniedPage if no role access?

STUDENT PORTAL: Check frontend/src/app/portal/student/
- Same checks as teacher portal

PARENT PORTAL: Check frontend/src/app/portal/parent/
- Same checks

Check if dynamic navigation is implemented:
- frontend/src/hooks/useInstalledModules.ts exists?
- Admin layout uses this hook for sidebar?
- Teacher/student/parent layouts use this hook?

=======================================================================
STEP 7 — CRON JOBS ANALYSIS
=======================================================================

Open convex/crons.ts. Check if these jobs exist:
- Monthly module billing (1st of month)
- Pilot grant expiry check (daily)
- Module data purge (daily)
- Payment grace period check (daily)
- Module update notifications (daily)
- Event bus dead letter retry (every 15 minutes)
- Library overdue check (daily)

=======================================================================
STEP 8 — SEEDING ANALYSIS
=======================================================================

Check convex/dev/seed.ts (or wherever seeding happens):
- Are all 15 modules seeded in marketplace_modules?
- Are module_pricing records seeded for each module?
- Are module_plan_inclusions seeded (Free/Starter/Pro/Enterprise matrix)?
- Are core modules seeded as module_installs for all tenants?

=======================================================================
STEP 9 — SECURITY ANALYSIS
=======================================================================

Spot-check these specific security requirements:

1. Cross-module isolation:
   grep -rn "query(\"finance_" convex/modules/library/
   grep -rn "query(\"attendance_" convex/modules/finance/
   → Any results = VIOLATION (module querying another module's tables)

2. Module guard coverage:
   grep -rn "requireModuleAccess" convex/modules/
   → Does every module's query/mutation use this?

3. Server-side RBAC:
   grep -rn "requireModuleFeatureAccess" convex/modules/
   → Is feature-level checking used for sensitive operations?

4. Client-side data:
   grep -rn "hardcoded\|mock\|placeholder\|\[\].*\/\/ temp" \
     frontend/src/app/admin/marketplace \
     frontend/src/app/admin/modules
   → Any results = VIOLATION

=======================================================================
STEP 10 — PRODUCE ANALYSIS REPORT
=======================================================================

Output a structured report in this format:

## MARKETPLACE IMPLEMENTATION ANALYSIS REPORT
Date: [today]
Analyst: Claude Agent

### SUMMARY
- Schema completeness: X/17 tables fully implemented
- Core event bus: [implemented/partial/missing]
- Module guard system: [implemented/partial/missing]
- Installation engine: [implemented/partial/missing]
- Billing engine: [implemented/partial/missing]
- School admin UI: X/5 pages implemented
- Platform admin UI: X/9 pages implemented
- Module files: X/[total] modules have all required files

### CRITICAL BLOCKERS (must fix before any feature work)
List items that would break the system if not fixed immediately.
Example: "module_events table missing — event bus cannot function"

### SCHEMA GAPS
Table-by-table breakdown of missing tables and missing fields.

### FUNCTION GAPS
File-by-file breakdown of missing/partial functions.
Prioritize: installation > billing > event bus > UI.

### EVENT HANDLER GAPS
List which cross-module event automations are NOT implemented.
Note: each missing handler means a business process is broken.

### UI GAPS
List missing pages and components.
Note for each: what functionality is blocked by its absence.

### SECURITY GAPS
List any violations found in the security checks.
Mark as: CRITICAL (must fix now) or WARNING (fix before launch).

### SEEDING GAPS
List what seeding is missing and what breaks without it.

### WHAT IS WORKING (confirmed implemented)
List what IS correctly implemented and can be relied upon.

### IMPLEMENTATION ORDER (your recommendation)
Based on the gaps found, what should be implemented first?
Order by: what blocks other things, what is highest business value.

=======================================================================
END OF ANALYSIS PROMPT
=======================================================================
```

---

# PART B — IMPLEMENTATION PROMPT
## (Run after analysis is complete)

---

```
=======================================================================
EDUMYLES MARKETPLACE — COMPLETE IMPLEMENTATION PROMPT
Version 1.0 | April 2026
=======================================================================

You have completed the marketplace codebase analysis.
Now implement everything that is missing or incomplete.
Work through the phases in strict order.
Complete each phase fully — all verification steps must pass — before moving to the next.

=======================================================================
PRE-FLIGHT: READ EVERYTHING BEFORE WRITING CODE
=======================================================================

Read these files COMPLETELY before writing a single line of code:

1. docs/edumyles-marketplace-spec.md    — your primary reference
2. docs/edumyles-tech-spec.md           — platform rules and context
3. convex/schema.ts                      — existing tables (NEVER duplicate)
4. convex/helpers/tenantGuard.ts         — requireTenantContext implementation
5. convex/helpers/platformGuard.ts       — requirePlatformContext implementation
6. convex/helpers/auditLog.ts            — logAudit implementation
7. opensrc/repos/convex*/                — Convex internals
8. .agent-skills/                        — ALL skill files

After reading, write a 1-paragraph summary of what's already implemented
vs what you need to build. Then begin Phase 1.

=======================================================================
ABSOLUTE RULES — ENFORCE THROUGHOUT ALL PHASES
=======================================================================

These rules apply to EVERY file you create or modify. Violating any rule
is grounds for rejection and restart.

1. ALL data from Convex — no hardcoded arrays, mock objects, or placeholder
   data anywhere. Every list must come from a useQuery call.

2. ALL reads via useQuery() — ALL writes via useMutation() or useAction()
   ALL stats and aggregates computed in Convex queries (never in React)

3. requireTenantContext(ctx) at start of EVERY Convex function that touches
   tenant data — no exceptions, no "I'll add it later"

4. requireModuleAccess(ctx, moduleSlug, tenantId) at start of EVERY module
   function — before any business logic runs

5. requireModuleFeatureAccess() for all sensitive operations — check the
   feature-level RBAC, not just the module level

6. RBAC enforced server-side in Convex — UI gating is cosmetic only,
   the real security is in the Convex function

7. Loading skeletons matching the page layout while useQuery returns undefined

8. Empty states with helpful messages and CTAs when query returns empty array

9. Error states when things go wrong — tell the user what happened and how to fix it

10. DOMPurify.sanitize() on ALL rich text content before storage AND before rendering

11. All prices in KES — never hardcode KES values — always read from Convex pricing tables

12. All financial calculations in Convex — never compute prices in React

13. All lists paginated using Convex pagination API — never load all records

14. Every destructive action: AlertDialog confirmation + reason field required

15. Every action: logAudit() call in convex/helpers/auditLog.ts

16. Module isolation: NEVER query another module's tables directly
    Use publicApi.ts internalQuery functions instead

17. Cross-module writes: ONLY via publishEvent() in convex/eventBus.ts
    Never call another module's mutation directly

18. All cron jobs in convex/crons.ts — never ad-hoc schedulers in mutations

19. Existing shadcn/ui components only — check components/ui/ before creating any UI

20. Tailwind only — no inline styles, CSS modules, or new CSS files

21. recharts only for charts — never import another chart library

22. No new npm dependencies — use what is already installed

23. npx convex dev must show ZERO errors after every phase

24. npm run type-check must show ZERO errors after every phase

=======================================================================
PHASE 1 — SCHEMA FOUNDATION
=======================================================================

Objective: All marketplace tables exist in schema.ts with correct
fields and indexes. This is the foundation — nothing else works without it.

1.1 — Audit schema.ts:
  Open convex/schema.ts.
  For each marketplace table in the spec Section 16:
  - If table exists: compare every field against spec — add any missing fields
  - If table missing: add complete table definition

  Tables to verify/add:
  marketplace_modules, module_pricing, module_price_overrides,
  module_price_history, module_versions, module_installs,
  module_access_config, module_event_subscriptions, module_events,
  module_notification_settings, module_plan_inclusions, pilot_grants,
  module_reviews, module_flags, admin_task_queue,
  module_public_api_registry, user_notification_preferences

  CRITICAL: Do NOT remove existing fields. Only add missing ones.
  CRITICAL: Add ALL indexes specified in the schema. Missing indexes = slow queries.

1.2 — Run and fix:
  npx convex dev
  Fix every TypeScript error in schema.ts before proceeding.
  Zero errors required.

1.3 — Seed data:
  Open convex/dev/seed.ts (create if doesn't exist).
  
  Seed marketplace_modules with all 15 modules:
  (core_sis, core_users, core_notifications, mod_academics, mod_attendance,
   mod_admissions, mod_finance, mod_timetable, mod_library, mod_transport,
   mod_hr, mod_communications, mod_ewallet, mod_ecommerce, mod_reports)
  
  For each module: ALL fields from spec Section 2.2/2.3 including
  slug, name, tagline, description, category, status: "published",
  isFeatured, isCore, minimumPlan, dependencies[], supportedRoles[],
  version: "1.0.0", installCount: 0, activeInstallCount: 0, reviewCount: 0

  Seed module_pricing for each non-core module:
  Finance:        base=20, band1=20, band2=17, band3=14, band4=12, band5=10
  Attendance:     base=10, band1=10, band2=8.5, band3=7, band4=6, band5=5
  Academics:      base=15, band1=15, band2=12.75, band3=10.5, band4=9, band5=7.5
  Admissions:     base=8, band1=8, band2=6.8, band3=5.6, band4=4.8, band5=4
  Timetable:      base=8, band1=8, band2=6.8, band3=5.6, band4=4.8, band5=4
  Library:        base=5, band1=5, band2=4.25, band3=3.5, band4=3, band5=2.5
  Transport:      base=12, band1=12, band2=10.2, band3=8.4, band4=7.2, band5=6
  HR:             base=18, band1=18, band2=15.3, band3=12.6, band4=10.8, band5=9
  Communications: base=15, band1=15, band2=12.75, band3=10.5, band4=9, band5=7.5
  EWallet:        base=10, band1=10, band2=8.5, band3=7, band4=6, band5=5
  ECommerce:      base=8, band1=8, band2=6.8, band3=5.6, band4=4.8, band5=4
  Reports:        base=12, band1=12, band2=10.2, band3=8.4, band4=7.2, band5=6
  AdvancedAnalytics: base=25, band1=25, band2=21.25, band3=17.5, band4=15, band5=12.5
  ParentPortal:   base=8, band1=8, band2=6.8, band3=5.6, band4=4.8, band5=4
  Alumni:         base=5, band1=5, band2=4.25, band3=3.5, band4=3, band5=2.5
  Partner:        base=5, band1=5, band2=4.25, band3=3.5, band4=3, band5=2.5

  For ALL modules: monthlyMultiplier=1.0, termlyMultiplier=0.95,
                   quarterlyMultiplier=0.95, annualMultiplier=0.82, vatRatePct=16

  Seed module_plan_inclusions (the full matrix):
  Free plan: only core modules (no entries needed — they're always installed)
  Starter plan includes: mod_finance, mod_attendance, mod_academics, mod_parent_portal
  Pro plan includes: all Starter + mod_hr, mod_timetable, mod_transport, mod_library,
                    mod_communications, mod_ewallet, mod_admissions, mod_reports
  Enterprise: all Pro + mod_advanced_analytics, mod_ecommerce, mod_alumni, mod_partner

  For all existing tenants: seed core module installs (status: "active", isFree: true)
  for core_sis, core_users, core_notifications if not already seeded.

PHASE 1 VERIFICATION:
- [ ] npx convex dev — zero TypeScript errors
- [ ] convex/schema.ts has all 17 marketplace tables
- [ ] All 15 modules in marketplace_modules (run: ctx.db.query("marketplace_modules").collect())
- [ ] All 15 non-core modules have module_pricing records with correct band rates
- [ ] module_plan_inclusions seeded for Starter, Pro, Enterprise
- [ ] Core modules seeded as module_installs for all tenants

=======================================================================
PHASE 2 — EVENT BUS & MODULE GUARD CORE
=======================================================================

Objective: The event bus works end-to-end. Module guards enforce access.
These are the most critical pieces — everything else depends on them.

2.1 — Event bus (convex/eventBus.ts):
  If file exists: review against spec Section 8.2. Fill any gaps.
  If missing: create from scratch.

  Implement:
  
  publishEvent<T>(ctx, { eventType, publisherModule, tenantId, payload, correlationId?, causationId? })
    - Validates publisher module is active for tenant (core modules bypass)
    - Creates module_events record with status: "pending"
    - Schedules dispatchEvent via ctx.scheduler.runAfter(0, ...)
    - Returns eventId
    - TYPED: payload is generic T, stringified to JSON

  dispatchEvent (internalMutation, args: { eventId })
    - Gets event record
    - Sets status: "processing"
    - Gets all subscriptions: module_event_subscriptions WHERE
      eventType = event.eventType AND tenantId = event.tenantId AND isActive = true
    - For each subscription: ctx.scheduler.runAfter(0, subscription.handlerFunctionName, {...})
    - Updates subscriberResults
    - Sets status: "completed"
    - On error: increment retryCount, set status: "failed"

  retryFailedEvents (internalMutation — called by cron every 15 minutes)
    - Gets all events with status: "failed" AND retryCount < 3
    - Re-schedules dispatchEvent for each
    - Events with retryCount >= 3: set status: "dead_letter"
    - For dead_letter events: trigger Slack alert via platform settings webhook

2.2 — Module guard (convex/helpers/moduleGuard.ts):
  If file exists: compare against spec Section 9.1. Fill gaps.
  If missing: create from scratch.

  Implement:
  
  requireModuleAccess(ctx, moduleSlug, tenantId)
    - Queries module_installs by tenantId + moduleSlug
    - Throws ConvexError with appropriate message for each non-active status
    - Returns { install } on success for status: "active"
    - Core modules (startsWith "core_") bypass the check (always active)

  requireModuleFeatureAccess(ctx, moduleSlug, tenantId, userRole, featureKey)
    - Calls requireModuleAccess first
    - Queries module_access_config
    - Checks roleAccess array for userRole
    - For "restricted": checks featureKey in allowedFeatures[]
    - Throws ConvexError with clear message if denied

  getInstalledModules(ctx, tenantId)
    - Returns all module_installs with status: "active" for tenant
    - Includes module metadata from marketplace_modules

  isModuleInstalled(ctx, moduleSlug, tenantId)
    - Returns boolean
    - Used for conditional logic in cross-module functions

2.3 — Module public API registry (convex/modules/modulePublicApis.ts):
  Create this file with the MODULE_PUBLIC_APIS registry from spec Section 12.1.
  
  Create publicApi.ts for each module:
  
  convex/modules/finance/publicApi.ts:
    - getStudentBalance(tenantId, studentId) → { balanceKes, hasOverdueInvoices, lastUpdatedAt }
    - getStudentInvoiceSummary(tenantId, studentId) → { totalOutstandingKes, overdueCount, oldestOverdueDays }
    - getFeeStructureForClass(tenantId, classId, termId) → fee structure or null
    - getStudentOutstandingAmount(tenantId, studentId) → KES amount

  convex/modules/attendance/publicApi.ts:
    - getStudentAttendanceRate(tenantId, studentId, termId?) → { attendanceRatePct, consecutiveAbsences }
    - getClassAttendanceSummary(tenantId, classId, date) → { presentCount, absentCount, lateCount }
    - getConsecutiveAbsences(tenantId, studentId) → number

  convex/modules/library/publicApi.ts:
    - getStudentLibraryStatus(tenantId, studentId) → { canBorrow, restrictionReason, overdueCount, finesKes }
    - getStudentBorrowingHistory(tenantId, studentId) → borrowings array

  convex/modules/academics/publicApi.ts:
    - getStudentGradeSummary(tenantId, studentId, termId?) → { averageGrade, passedSubjects, failedSubjects }
    - getStudentTermAverage(tenantId, studentId, termId) → number

  convex/modules/hr/publicApi.ts:
    - getStaffLeaveBalance(tenantId, staffId) → leave balance object
    - getStaffOnLeaveToday(tenantId, date) → staffId[] 

  convex/modules/ewallet/publicApi.ts:
    - getStudentWalletBalance(tenantId, studentId) → { balanceKes, lastUpdatedAt }

PHASE 2 VERIFICATION:
- [ ] publishEvent() creates module_events record with status: "pending"
- [ ] dispatchEvent routes to handler function correctly
- [ ] Failed event: retried up to 3 times, then dead_letter
- [ ] requireModuleAccess throws for uninstalled module: correct error message
- [ ] requireModuleAccess throws for disabled module: correct error message
- [ ] requireModuleFeatureAccess blocks teacher from "create_invoices" feature
- [ ] finance/publicApi.getStudentBalance callable from library module
- [ ] Cannot query finance_invoices table from library module code

=======================================================================
PHASE 3 — MODULE FILE STRUCTURE
=======================================================================

Objective: Every module has all required files with correct exports.
These files are the module's definition — installation depends on them.

For EACH of the 15 modules (do all 15, not just some):
mod_finance, mod_attendance, mod_academics, mod_admissions, mod_library,
mod_transport, mod_hr, mod_communications, mod_ewallet, mod_ecommerce,
mod_reports, mod_timetable, mod_advanced_analytics, mod_parent_portal,
mod_alumni, mod_partner

Create/update these files:

3.1 — convex/modules/[slug]/index.ts:
  Export:
  - MODULE_METADATA: { slug, displayName, version }
  - NAV_CONFIG: adminNav, teacherNav, studentNav, parentNav, dashboardWidgets
    (nav items with href, label, icon name from lucide-react, requiredFeature)
  - DASHBOARD_WIDGETS: widget definitions for this module's dashboard contributions

3.2 — convex/modules/[slug]/features.ts:
  Export:
  - [MODULE]_FEATURES: Record<string, ModuleFeature>
    Each feature: key, label, description, defaultRoles[]
  - [MODULE]_DEFAULT_ROLE_ACCESS: RoleAccessConfig[]
    Default access matrix for all roles: school_admin, principal, teacher, student, parent
    Follow the access matrix from spec Section 4.4

3.3 — convex/modules/[slug]/configSchema.ts:
  Export:
  - [MODULE]_CONFIG_SCHEMA: ModuleConfigSchema
    Fields and sections appropriate to each module
    Finance: full schema from spec Section 10.2
    Attendance: school start time, late threshold, marking method, notification toggles
    Library: max books per student, borrowing period days, fine per day, renewal settings
    HR: payroll approval workflow, leave approval chain
    Transport: route tracking interval, parent notification timing
    Other modules: sensible config options for each

3.4 — convex/modules/[slug]/notifications.ts:
  Export:
  - [MODULE]_NOTIFICATIONS: ModuleNotification[]
    Notification catalog entries relevant to each module
    Finance: payment_received_parent, invoice_created_parent, overdue_reminder_parent
    Attendance: student_absent_parent, student_late_parent, consecutive_absence_admin
    Academics: grade_posted_student, exam_results_published_parent
    Library: book_due_reminder_student, book_overdue_student
    HR: leave_request_submitted_admin, leave_approved_staff, payslip_ready_staff
    etc.

3.5 — convex/modules/[slug]/onInstall.ts:
  Export:
  - onInstall (internalMutation, args: { tenantId }):
    1. Create module_access_config with DEFAULT_ROLE_ACCESS for this tenant
    2. Register event subscriptions in module_event_subscriptions:
       For each event this module subscribes to: insert subscription record
    3. Create module_notification_settings with default settings
    4. Create any module-specific initial data:
       Finance: seed default fee categories (Tuition, Activity, etc.)
       Library: seed default library config (max books: 3, period: 14 days, fine: KES 5)
       Attendance: seed default config (school start: 08:00, late threshold: 15 min)

3.6 — convex/modules/[slug]/onUninstall.ts:
  Export:
  - onUninstall (internalMutation, args: { tenantId }):
    1. Set all event subscriptions for this module + tenant to isActive: false
    2. Do NOT delete any data — retention handled by cron
    3. Module-specific cleanup (e.g. cancel any scheduled jobs for this tenant)

3.7 — convex/modules/[slug]/eventHandlers.ts:
  Implement ALL event handlers this module needs to subscribe to.
  Follow spec Section 8.4 — "All Cross-Module Automations (Must Implement All)"
  
  Critical implementations:

  finance/eventHandlers.ts:
  - onStudentEnrolled: look up fee structure for student's class + feeCategory,
    apply scholarships, create admission fee invoice,
    publish finance.invoice.created
  - onLibraryBookOverdue: create fine invoice with correct amount,
    publish finance.invoice.created

  library/eventHandlers.ts:
  - onFinanceInvoiceOverdue: create library_borrowing_restrictions record,
    publish library.restriction.added
  - onFinancePaymentReceived: check if student still has outstanding invoices,
    if fully paid: delete borrowing restriction record

  communications/eventHandlers.ts:
  - onAttendanceStudentAbsent: check notification settings,
    call sendModuleNotification for parent
  - onAttendanceStudentConsecutive: send urgent notification,
    create admin task alert
  - onAcademicsGradePosted: send in-app to student
  - onAcademicsExamResultsPublished: send in-app + email to parents of all students in payload
  - onFinanceInvoiceCreated: send invoice notification to parent
  - onFinanceInvoiceOverdue: send overdue reminder to parent
  - onFinancePaymentReceived: send receipt confirmation to parent

  timetable/eventHandlers.ts:
  - onHrLeaveApproved: find timetable slots for staff in date range,
    mark slots as cover_needed,
    send in-app notification to school_admin

  ewallet/eventHandlers.ts:
  - onFinancePaymentReceived: if invoice type is "wallet_topup", update wallet balance

  alumni/eventHandlers.ts:
  - onStudentGraduated: create alumni record, send welcome email

  core_users/eventHandlers.ts:
  - onStudentEnrolled: check if parent has portal account,
    if not: create WorkOS user invitation, send email
    if yes: add student to parent's linked children list

PHASE 3 VERIFICATION:
- [ ] All 15 modules have all 7 required files
- [ ] npx convex dev — zero errors
- [ ] Finance onInstall: creates module_access_config with correct default role access
- [ ] Finance onInstall: registers event subscriptions for student.enrolled
- [ ] Finance onUninstall: sets event subscriptions to isActive: false
- [ ] All event handlers in eventHandlers.ts follow the pattern from spec Section 8.5
- [ ] finance/onStudentEnrolled creates invoice correctly
- [ ] library/onFinanceInvoiceOverdue adds borrowing restriction correctly

=======================================================================
PHASE 4 — INSTALLATION ENGINE
=======================================================================

Objective: Complete install/uninstall/reinstall flow works correctly.

4.1 — Installation engine (convex/modules/marketplace/installation.ts):

  checkInstallRequirements(ctx, moduleSlug, tenantId):
    Runs all 7 checks in order from spec Section 4.1
    Returns one of:
    - { canInstall: true, requiresPayment: false } — free/pilot
    - { canInstall: true, requiresPayment: true, pricing: PriceCalc } — paid
    - { canInstall: false, reason: string, ... } — blocked with details

  installModule(ctx, moduleSlug, tenantId, billingPeriod):
    1. Re-run checkInstallRequirements server-side (never trust client)
    2. Create module_installs { status: "installing", installedBy, installedAt,
       firstInstalledAt (set once, never updated), trialEndsAt, billingStartsAt,
       nextBillingDate }
    3. If payment required:
       - Create finance_invoice for first billing period
       - Process payment via correct provider action
       - On payment failure: status → "payment_failed", return error
    4. Run onInstall for this module (schedule as internalMutation)
    5. status → "active"
    6. publishEvent: module.installed
    7. createNotification for school admin
    8. logAudit

  uninstallModule(ctx, moduleSlug, tenantId, confirmedBy):
    1. Check confirmedBy is school_admin role
    2. Find all dependent modules (other installs that have this slug in their dependencies)
    3. For each dependent: call uninstallModule recursively
    4. Run onUninstall for this module
    5. Cancel upcoming billing for this module
    6. status → "uninstalled"
    7. dataRetentionEndsAt → now + 90 days
    8. publishEvent: module.uninstalled
    9. createNotification with data export link
    10. logAudit

  reinstallModule(ctx, moduleSlug, tenantId, restoreData, billingPeriod):
    1. Find previous install record (status: "uninstalled" or "data_purged")
    2. Check dataRetentionEndsAt: if purged, cannot restore
    3. If restoreData: reactivate existing data, resume billing
    4. If !restoreData: mark old data for immediate purge, create fresh install
    5. Run onInstall again (registers subscriptions, creates fresh config)
    6. status → "active"

  disableModule(ctx, moduleSlug, tenantId):
    - status → "disabled", disabledAt, disabledBy

  enableModule(ctx, moduleSlug, tenantId):
    - status → "active"

  purgeExpiredModuleData (internalMutation — cron handler):
    - Find all module_installs with:
      status: "uninstalled" AND dataRetentionEndsAt < now
    - For each: delete all tables prefixed with this module's slug for this tenantId
      (use dynamic table lookup from module's schema definition)
    - Delete module_access_config for this tenant + module
    - Delete module_notification_settings for this tenant + module
    - status → "data_purged"
    - Send final notification: "Your [Module] data has been permanently deleted"

4.2 — Pricing engine (convex/modules/marketplace/pricing.ts):

  calculateModulePrice(pricing, studentCount, billingPeriod) — PURE FUNCTION:
    Implements exact algorithm from spec Section 3.9
    Returns: { bandBreakdown[], subtotalMonthlyKes, grossPeriodKes, discountKes,
               discountPct, vatKes, vatRatePct, totalKes, effectiveMonthlyKes }
    
    Test cases to verify:
    Finance (KES 20), 750 students, monthly:
      Band1: 100 × 20 = 2,000
      Band2: 400 × 17 = 6,800
      Band3: 250 × 14 = 3,500
      Monthly: 12,300 → gross: 12,300 → VAT: 1,968 → total: 14,268
    
    Finance (KES 20), 750 students, annual:
      Monthly: 12,300 × 12 = 147,600
      Discounted (×0.82): 121,032
      VAT (×1.16): 140,397.12
      Total: 140,397.12

  getEffectivePricing(ctx, moduleId, tenantId):
    1. Check module_price_overrides: active + not expired → flat rate override
    2. Check subscription plan → planOverrides[] for plan-based rate
    3. Return standard pricing

  getActiveStudentCount(ctx, tenantId):
    Count students with status: "active" for this tenant
    Cached in tenant record or computed fresh (spec says snapshot at billing time)

  generatePricingBreakdown(ctx, moduleSlug, tenantId, studentCount, billingPeriod):
    Public query for the pricing confirmation UI
    Returns full breakdown with all numbers for display

PHASE 4 VERIFICATION:
- [ ] calculateModulePrice(finance, 750, "monthly") = { subtotalMonthly: 12300, total: 14268 }
- [ ] calculateModulePrice(finance, 750, "annual").totalKes ≈ 140,397
- [ ] installModule: creates module_installs with correct billingStartsAt (next period)
- [ ] installModule: trialEndsAt set to 14 days from now
- [ ] uninstallModule: dataRetentionEndsAt set to 90 days from now
- [ ] uninstallModule: onUninstall called, event subscriptions deactivated
- [ ] uninstallModule with dependent: cascade uninstalls dependency first
- [ ] reinstallModule with restoreData: existing data accessible after reinstall
- [ ] purgeExpiredModuleData: deletes data, sets status: "data_purged"

=======================================================================
PHASE 5 — BILLING ENGINE
=======================================================================

Objective: Monthly billing runs correctly. Payment failures handled properly.

5.1 — Billing engine (convex/modules/marketplace/billing.ts):

  runMonthlyModuleBilling (internalMutation — called by cron):
    Full implementation from spec Section 6.1
    For each active install with nextBillingDate <= now:
    1. Skip if core module
    2. Get active student count
    3. Get effective pricing (checks overrides)
    4. Check plan inclusion (isIncluded: true → skip billing)
    5. Check active pilot grant (free_permanent or active free_trial → skip)
    6. Calculate amount using calculateModulePrice
    7. Apply discounted pilot if applicable
    8. Create finance_invoices record
    9. Schedule processModulePayment action
    10. Update nextBillingDate

  processModulePayment (internalAction — called for each invoice):
    1. Get school's default payment method from tenant settings
    2. Attempt payment via correct provider (M-Pesa, Stripe, etc.)
    3. On success: call reinstateModuleAfterPayment (if was suspended)
    4. On failure: call handleModulePaymentFailure

  handleModulePaymentFailure (internalMutation):
    Day 0: notify school admin + increment paymentFailureCount
    Day 3: schedule sendPaymentReminder
    Day 7: schedule suspendModuleForPayment
    Day 30: schedule autoUninstallForNonPayment

  suspendModuleForPayment (internalMutation):
    status → "suspended_payment"
    Notify school admin with payment update link

  reinstateModuleAfterPayment (internalMutation):
    status → "active"
    Reset paymentFailureCount to 0
    Notify school admin: "Access restored"

  checkPaymentGracePeriods (internalMutation — daily cron):
    Find all installs with status: "suspended_payment"
    Check if suspension has exceeded 30 days
    If yes: call autoUninstallForNonPayment

5.2 — Plan audit (convex/modules/marketplace/planAudit.ts):

  auditModulesForPlanChange(ctx, fromPlan, toPlan):
    Public query — school admin calls before confirming downgrade
    Returns array of affected modules with action and impact details
    (from spec Section 6.3)

  handlePlanUpgrade (internalMutation):
    Called when tenant plan upgrades
    Finds modules newly included in higher plan
    Notifies school admin of newly available modules
    Does NOT auto-install — just notifies

  handlePlanDowngrade (internalMutation):
    Called when tenant plan downgrades (at period end)
    For each module above new plan minimum: suspend at period end
    Creates future-dated suspension (not immediate)
    Notifies school admin of what will happen and when

5.3 — Cron jobs (convex/crons.ts):
  Add if not present:
  - Monthly module billing: day 1, 21:01 UTC
  - Pilot grant expiry: daily, 21:00 UTC
  - Module data purge: daily, 00:00 UTC
  - Payment grace period check: daily, 05:00 UTC
  - Event bus retry: every 15 minutes
  - Library overdue check: daily, 05:30 UTC

PHASE 5 VERIFICATION:
- [ ] Manually trigger runMonthlyModuleBilling: creates correct invoices
- [ ] Finance module, 320 students, monthly: invoice totalKes = 6,400 + 16% VAT
- [ ] Plan-included module: no invoice created
- [ ] Active free pilot grant: no invoice created
- [ ] Active discounted pilot (50% off): invoice at discounted amount
- [ ] Payment failure cascade: day 0 notify → day 7 suspend → day 30 uninstall
- [ ] Plan downgrade audit: correctly identifies modules to suspend
- [ ] All cron jobs in crons.ts

=======================================================================
PHASE 6 — PILOT GRANT SYSTEM
=======================================================================

Objective: Master Admin can create and manage pilot grants for any tenant.

6.1 — Pilot grant engine (convex/modules/marketplace/pilotGrants.ts):

  createPilotGrant(ctx, args) — mutation, requires "marketplace.manage_pilot_grants":
    args: moduleId, tenantId, grantType, discountPct?, customPriceKes?,
          startDate, endDate?, stealthMode, reason
    
    Validation:
    - free_permanent and beta_access: require "marketplace.bulk_pilot_grants" (master_admin)
    - Cannot create if active pilot already exists for same module + tenant
    - endDate required for all except free_permanent
    
    Creates pilot_grants record with status: "active"
    If module already installed: update module_installs to reference pilotGrantId
    If module not installed: pilot available when they install
    logAudit with reason
    Notify school admin (unless stealthMode: true)

  revokePilotGrant(ctx, { grantId, reason }) — mutation, platform permission required:
    Sets status: "revoked", revokedAt, revokedBy, revokedReason
    If module installed and was using this grant: begin billing from next period
    Notifies school admin

  extendPilotGrant(ctx, { grantId, newEndDate, reason }) — mutation:
    Updates endDate, status: "extended" (keeps as active)
    Notifies school admin of extension

  processPilotExpiry (internalMutation — daily cron):
    Find all pilot_grants with:
      status: "active" AND endDate <= now AND grantType != "free_permanent"
    
    For each expiring grant:
    1. Set status: "expired"
    2. Check if school converted to paid:
       - Look at module_installs.isFree: if false, they're already paying → no action
       - If still free: suspend module (suspended_platform with reason "pilot_expired")
    3. Send expiry notifications to school admin

  getActivePilotGrant(ctx, moduleId, tenantId):
    internalQuery — used by billing engine
    Returns active grant or null

  Expiry notification schedule (in processPilotExpiry or separate scheduler):
  Days before expiry → notification level:
  30 → email + in-app
  14 → email + in-app
  7 → email + in-app + SMS
  3 → email + in-app + SMS
  1 → email + in-app + SMS
  Store sent notifications in pilot_grants.notificationsSent[]

PHASE 6 VERIFICATION:
- [ ] Create free_trial pilot: school gets module without billing
- [ ] Create discounted pilot: school billed at discounted rate
- [ ] Revoke pilot: module suspended, school notified
- [ ] Create second pilot for same module + tenant: blocked
- [ ] free_permanent requires master_admin permission
- [ ] Expiry cron: sends notifications at correct intervals
- [ ] After expiry: module suspended, school sees payment prompt

=======================================================================
PHASE 7 — SCHOOL ADMIN MARKETPLACE UI
=======================================================================

Objective: School admin can browse, install, configure, and manage modules.
All data from Convex. Zero hardcoded values anywhere.

7.1 — Marketplace browse (frontend/src/app/admin/marketplace/page.tsx):

  Data: useQuery(api.marketplace.getMarketplaceModules) — returns all published modules
  with: install status for current tenant, pilot grant info, pricing for tenant's student count

  Layout:
  - Search input (real-time filter from loaded data — no server search needed)
  - Category filter tabs: All | Academic | Finance | HR | Communications | Analytics | Portals
  - Sort: Most Popular | Highest Rated | Lowest Price | Newest
  - Module grid (3 columns desktop, 2 tablet, 1 mobile)
  - Each module: ModuleCard component
  - Bottom: "Request a Module" button → modal with name, description, use case fields
    Submits to submitModuleRequestFromUser mutation → creates admin_task_queue entry for platform team

  ModuleCard component states (from spec Section 14.1):
  All 6 states implemented based on install status + pilot grant

  Loading state: grid of 15 skeleton cards (matching card layout)
  Empty state: "No modules found" with clear filters button

7.2 — Module detail (frontend/src/app/admin/marketplace/[moduleSlug]/page.tsx):

  Data: useQuery(api.marketplace.getModuleDetail, { slug: moduleSlug })
  Returns: module info + install status + pricing + reviews + screenshots

  Sections:
  1. Header with install/configure button
  2. Screenshots carousel (simple div with overflow-x scroll on mobile)
  3. About section with features list
  4. Works With section (modules it sends events to)
  5. Requires section (dependency modules with ✅/❌ install status)
  6. Role Access Preview table
  7. Pricing breakdown for school's current student count
     Show billing period tabs: Monthly | Termly | Annual (with savings highlighted)
  8. Reviews (paginated, from Convex)
  9. Changelog (from module_versions table)

  Install button flow:
  - Calls checkInstallRequirements server-side
  - Shows dependency screen if deps missing
  - Shows pricing confirmation modal
  - Billing period selector in modal
  - Payment method selection
  - Loading state while installing
  - Success: redirect to /admin/modules with success toast

7.3 — Installed modules (frontend/src/app/admin/modules/page.tsx):

  Data: useQuery(api.marketplace.getInstalledModulesForTenant)
  Returns all installs with status + pilot info + billing info + module metadata

  Display: list (not grid) with full details per module
  Per module: ModuleRow component showing all status info
  Actions: Configure, Disable/Enable, Uninstall

  Uninstall flow:
  - Check dependencies: "These modules will also be uninstalled: [list]"
  - Show ConsequencesDisclosure component with all impacts
  - Type "UNINSTALL" input (validated client-side before enabling Confirm button)
  - Submit → uninstallModule mutation
  - Show data export CTA after success

7.4 — Module settings (frontend/src/app/admin/settings/modules/[moduleSlug]/page.tsx):

  Tabs: Access Control | Configuration | Notifications | Billing

  Access Control tab:
    Data: useQuery(api.marketplace.getModuleAccessConfig, { moduleSlug })
    Renders ModuleAccessConfig component (build this component)
    Per-role cards with access level dropdown and feature checkboxes
    Save: updateModuleAccessConfig mutation

  Configuration tab:
    Data: useQuery(api.marketplace.getModuleConfig, { moduleSlug })
    Renders ModuleConfigForm component using module's configSchema
    Save: updateModuleConfig mutation (validates against schema server-side)

  Notifications tab:
    Data: useQuery(api.marketplace.getModuleNotificationSettings, { moduleSlug })
    Renders ModuleNotificationSettings component
    Save: updateModuleNotificationSettings mutation

  Billing tab:
    Data: useQuery(api.marketplace.getModuleBillingInfo, { moduleSlug })
    Shows: current price, monthly cost at current student count
    Change billing period: shows savings for annual
    Invoice history: last 12 months for this module

7.5 — Required components:

  frontend/src/components/modules/ModuleConfigForm.tsx:
    Full implementation from spec Section 10.3
    All 8 field types: boolean, number, string, select, multiselect, text, time, date
    dependsOn logic: show/hide fields based on other field values
    Dirty state tracking with sticky "Save Changes" bar

  frontend/src/components/modules/ModuleAccessConfig.tsx:
    Per-role cards showing access level
    For "restricted": feature checkboxes with labels
    "Full / Read Only / Custom / No Access" dropdown per role
    Plain English preview: "With these settings, teachers can: [list]"

  frontend/src/components/modules/ModuleNotificationSettings.tsx:
    Per-notification cards
    Enable/disable toggle (with "Required" lock for canDisable: false)
    Channel checkboxes per notification
    Frequency input for hasFrequency: true notifications
    Quiet hours time picker

  frontend/src/components/modules/ModuleUnavailablePage.tsx:
    "Module not installed" — with Request button for teachers/principals
    Module request modal with reason textarea (min 20 chars)
    Submits: submitModuleRequestFromUser mutation

  frontend/src/components/modules/ModuleAccessDeniedPage.tsx:
    "Access restricted" — shows who to contact

  frontend/src/components/modules/ModuleSuspendedPage.tsx:
    Two variants: "payment" and "platform"
    Payment: shows "Update payment method" CTA
    Platform: shows "Contact support" CTA

7.6 — Dynamic navigation:

  frontend/src/hooks/useInstalledModules.ts:
    useQuery for installed modules with nav configs
    Filters nav items by user role access level
    Returns: installedModules, accessibleNavItems, dashboardWidgets

  frontend/src/hooks/useModuleAccess.ts:
    useQuery for single module's access status
    Returns: { isLoading, isInstalled, hasAccess, accessLevel, installStatus, reason }

  Update ALL portal layouts to use useInstalledModules:
  - frontend/src/app/admin/layout.tsx
  - frontend/src/app/portal/teacher/layout.tsx
  - frontend/src/app/portal/student/layout.tsx
  - frontend/src/app/portal/parent/layout.tsx
  - frontend/src/app/portal/alumni/layout.tsx

  Update admin dashboard (/admin/page.tsx):
  - Load dashboard widgets from installed modules
  - Render each widget component based on widgetId
  - Allow reordering (save order to tenant config)

  Wrap ALL non-core portal pages with access check:
  Every page in teacher/student/parent portals that uses a module feature:
  ```typescript
  const { isLoading, isInstalled, hasAccess, installStatus } = useModuleAccess("mod_attendance");
  if (isLoading) return <PageSkeleton />;
  if (!isInstalled) return <ModuleUnavailablePage .../>;
  if (installStatus?.includes("suspended")) return <ModuleSuspendedPage .../>;
  if (!hasAccess) return <ModuleAccessDeniedPage .../>;
  return <ActualContent />;
  ```

PHASE 7 VERIFICATION:
- [ ] Marketplace page: all 15 modules shown with real data (no hardcoding)
- [ ] Module card shows correct state for: not installed / trial / installed / disabled / plan_too_low
- [ ] Install flow: dependency check → pricing confirmation → billing period → install
- [ ] After install: module nav item appears in sidebar immediately (real-time)
- [ ] Uninstall: type "UNINSTALL" required, cascade shown, retention date shown
- [ ] Config form: all field types render correctly, dependsOn shows/hides correctly
- [ ] Access control: changing teacher access from "full" to "none" → teacher can't access
- [ ] Teacher accessing uninstalled attendance page → ModuleUnavailablePage (not 404)
- [ ] Teacher submits module request → school admin sees in /admin/tasks
- [ ] Parent paying fees → shows parent access denied if finance has parent: none

=======================================================================
PHASE 8 — PLATFORM ADMIN MARKETPLACE UI
=======================================================================

Objective: Master Admin can manage all aspects of the marketplace.

8.1 — Marketplace dashboard (frontend/src/app/platform/marketplace/page.tsx):

  Stats row: total published modules, total active installs, MRR KES MTD,
             pending reviews, active flags, module requests
  All from useQuery — real data only

  Charts (recharts):
  - Revenue by module: horizontal BarChart, top 10 by MRR
  - Install growth: AreaChart, last 12 months, new installs per month
  - Billing period distribution: PieChart (monthly/termly/annual %)
  - Module churn: BarChart showing install vs uninstall per module

8.2 — Module management (frontend/src/app/platform/marketplace/modules/page.tsx):

  Table with all modules (all statuses)
  Columns: icon, name, slug, status badge, active installs, MRR, rating, version, actions
  Filter: status, category, minimum plan
  Sort: active installs desc (default), MRR desc, rating desc

  Create module (frontend/src/app/platform/marketplace/modules/create/page.tsx):
  5-section form as specified in Section 15.2
  Section 3 (Pricing): base rate input → "Auto-calculate bands" button
    Auto-calc: band2=base×0.85, band3=base×0.70, band4=base×0.60, band5=base×0.50
    All band rates editable after auto-calc
  Section 4 (Default Access): per-role access level dropdowns
  On publish: status → "published", appears in school marketplace immediately

  Edit module (frontend/src/app/platform/marketplace/modules/[moduleId]/edit/page.tsx):
  Same form, pre-filled. Shows warning: "X schools have this installed"
  Deprecate button: sets status → "deprecated" with confirmation
  Suspend button: sets status → "suspended", confirms impact on X tenants

8.3 — Pricing control (frontend/src/app/platform/marketplace/pricing/page.tsx):

  Global pricing table: all modules with band rates
  Edit any module's base rate → auto-recalculates bands
  Override bands individually

  Per-school override section:
  - Search school + module
  - Set override price + reason + optional expiry
  - List of active overrides with edit/revoke
  - All changes logged to module_price_history

  Pricing simulator:
  - Module selector, student count input, billing period selector
  - Real-time calculation showing full breakdown
  - "Apply as override for school" shortcut

8.4 — Pilot grants (frontend/src/app/platform/marketplace/pilot-grants/page.tsx):

  All active grants table with filters
  Create grant form (from spec Section 15.5)
  Bulk grant via CSV upload (master_admin only)

8.5 — Module billing (frontend/src/app/platform/marketplace/billing/page.tsx):

  Month selector → billing summary
  School list with their module billing status
  Manual trigger button: "Run billing for [school]"
  Failed payments queue with retry/suspend actions
  Revenue charts

PHASE 8 VERIFICATION:
- [ ] All platform marketplace pages load real data (no hardcoding)
- [ ] Create module → publish → appears in school marketplace
- [ ] Set base rate to KES 20 → bands auto-calculate correctly
- [ ] Create per-school override → saved and applied in billing
- [ ] Create pilot grant → school sees module as free/discounted
- [ ] Stealth mode pilot → no trial badge shown to school
- [ ] Monthly billing page shows correct invoice totals

=======================================================================
PHASE 9 — REVIEWS, FLAGS & MODERATION
=======================================================================

9.1 — Reviews system:

  Convex functions (convex/modules/marketplace/reviews.ts):
  - canReviewModule(ctx, moduleSlug) — query
    Returns: canReview, reason, existingReview
    canReview: true if module installed 14+ days AND no existing review from this tenant
  - submitReview(ctx, { moduleSlug, rating, title, body }) — mutation
    Validates: module installed 14+ days (server-side)
    Validates: no existing review from this tenant
    Creates review with status: "pending" (auto-approves if content passes basic check)
    Updates marketplace_modules.reviewCount and averageRating
  - getModuleReviews(ctx, moduleSlug) — query, paginated
    Returns approved reviews with school name, rating, body, publisher reply
  - addPublisherReply(ctx, { reviewId, reply }) — mutation (publisher only)
  - moderateReview(ctx, { reviewId, action }) — mutation (content_moderator)
  - getReviewsForModeration(ctx) — query (platform only)

9.2 — Flags system:

  Convex functions (convex/modules/marketplace/flags.ts):
  - flagModule(ctx, { moduleSlug, reason, details }) — mutation
    Creates module_flags record with status: "flagged"
    Alerts marketplace_reviewer via in-app notification
  - getActiveFlags(ctx) — query (platform only)
  - investigateFlag(ctx, { flagId }) — mutation, sets status: "under_investigation"
  - resolveFlag(ctx, { flagId, resolution, action }) — mutation (marketplace_reviewer)
    Actions: no_action, warning, suspend, ban
  - getModuleFlags(ctx, moduleSlug) — query (platform only)

9.3 — Moderation pages:

  /platform/marketplace/reviews — review moderation queue
  /platform/marketplace/flags — flag investigation queue
  Both with filter by status and real-time updates from Convex

PHASE 9 VERIFICATION:
- [ ] School cannot review module installed < 14 days
- [ ] One review per school per module (second review blocked server-side)
- [ ] Review appears in module detail page after approval
- [ ] Publisher can reply to reviews
- [ ] Flag creates alert for marketplace reviewer
- [ ] Resolve flag with "suspend": module status → "suspended"

=======================================================================
PHASE 10 — FINAL INTEGRATION & VERIFICATION
=======================================================================

10.1 — Integration testing (manual):

Test the following end-to-end flows:

FLOW 1: Student enrolled → invoice created
1. School admin adds new student to Form 2A
2. Finance module is installed and active
3. Verify: admission fee invoice created automatically
4. Verify: parent receives SMS/email with invoice (if communications installed)

FLOW 2: Invoice overdue → library restricted
1. Student has unpaid invoice past due date
2. Finance billing cron marks invoice as "overdue"
3. Verify: library borrowing restriction created for student
4. Verify: student cannot borrow books in library portal

FLOW 3: Payment received → restriction lifted
1. Parent pays the overdue invoice via M-Pesa
2. Verify: payment reconciled to invoice
3. Verify: invoice status → "paid"
4. Verify: library borrowing restriction removed
5. Verify: parent receives SMS receipt

FLOW 4: Student absent 3 days → parent alert
1. Teacher marks student absent 3 days in a row
2. Verify: attendance.student.absent.consecutive event published
3. Verify: parent receives SMS alert
4. Verify: school admin receives in-app notification

FLOW 5: Install → configure → access control
1. School admin installs Finance module
2. Change teacher access from "none" to "restricted: view_all_invoices"
3. Log in as a teacher
4. Verify: Finance appears in teacher sidebar
5. Change back to "none"
6. Verify: Finance disappears from teacher sidebar (real-time)

FLOW 6: Uninstall → data retention → reinstall
1. School admin uninstalls Finance module
2. Verify: Finance disappears from all sidebars
3. Verify: dataRetentionEndsAt set 90 days from now
4. Reinstall Finance within retention window
5. Select "Restore previous data"
6. Verify: previous invoices are visible

FLOW 7: Pilot grant lifecycle
1. Platform admin creates 14-day free_trial for Finance for a school
2. School installs Finance → no invoice created
3. Advance time to day 15 (or manually expire the grant)
4. Verify: module suspended, school admin notified
5. School pays → module reinstated

10.2 — Hardcoded data scan:
  Run this command:
  ```bash
  grep -rn "mock\|dummy\|placeholder\|\[\]\s*\/\/.*temp\|fake\|hardcoded\|TODO.*fetch" \
    frontend/src/app/admin/marketplace \
    frontend/src/app/admin/modules \
    frontend/src/app/platform/marketplace \
    convex/modules/marketplace \
    --include="*.ts" --include="*.tsx" | grep -v "node_modules\|.git\|spec\|test"
  ```
  Zero results required.

10.3 — Performance check:
  - Marketplace browse (15 modules): loads in < 2 seconds
  - Module install check: completes in < 500ms
  - Event dispatch: processes within 1 second of publishEvent
  - Dynamic sidebar: updates within 1 second of module status change

10.4 — TypeScript and build:
  npx convex dev          → ZERO errors
  npm run type-check      → ZERO errors
  npm run build           → ZERO errors

10.5 — Security spot check:
  1. Teacher calls installModule mutation → should throw "No permission"
  2. School A's admin calls checkInstallRequirements with School B's tenantId → should throw
  3. Call getMarketplaceModules without authentication → should throw
  4. Call gradeSubmission without requireModuleFeatureAccess check → should be blocked

=======================================================================
FINAL CHECKLIST — ALL MUST PASS BEFORE DONE
=======================================================================

SCHEMA:
- [ ] All 17 marketplace tables in schema.ts
- [ ] All 15 modules seeded with correct data
- [ ] module_plan_inclusions seeded correctly
- [ ] Core modules seeded as installs for all tenants
- [ ] npx convex dev — zero errors

EVENT BUS:
- [ ] publishEvent creates module_events with correct fields
- [ ] dispatchEvent routes to correct handler
- [ ] Failed events retry up to 3 times then dead_letter
- [ ] student.enrolled → finance creates invoice
- [ ] student.enrolled → parent portal account created
- [ ] finance.invoice.overdue → library restricts borrowing
- [ ] finance.payment.received → library removes restriction
- [ ] attendance.student.absent → parent SMS sent
- [ ] attendance.student.absent.consecutive → urgent SMS + admin alert
- [ ] library.book.overdue → finance creates fine invoice
- [ ] hr.leave.approved → timetable notified
- [ ] student.graduated → alumni record created

INSTALLATION:
- [ ] All 7 requirement checks run server-side
- [ ] Dependency missing: shows correct UI with costs
- [ ] Install flow: trial period correctly set
- [ ] Install flow: billing starts NEXT period (not current)
- [ ] After install: module in sidebar within 1 second
- [ ] Uninstall: cascade shown, type "UNINSTALL" required
- [ ] Uninstall: dataRetentionEndsAt = now + 90 days
- [ ] Reinstall: restore data prompt shown if within retention

BILLING:
- [ ] Monthly cron calculates correct amounts for all tiers
- [ ] Plan-included modules: not billed
- [ ] Active pilot (free): not billed
- [ ] Active pilot (discounted): billed at discount
- [ ] Payment failure: correct cascade (notify → suspend → uninstall)
- [ ] Plan downgrade: suspends modules at period END not immediately

PILOT GRANTS:
- [ ] All 5 grant types work
- [ ] free_permanent requires master_admin
- [ ] Expiry notifications sent at correct intervals
- [ ] Stealth mode: no trial badge shown to school
- [ ] Revoke: school notified, billing resumes next period

SCHOOL ADMIN UI:
- [ ] All 15 modules shown with correct data
- [ ] All 6 card states display correctly
- [ ] Install flow complete end-to-end
- [ ] Uninstall flow complete with all warnings
- [ ] Config form: all field types work
- [ ] Access control: changes take effect in real-time
- [ ] Notification settings: quiet hours respected
- [ ] Module request from teacher: reaches admin tasks

PLATFORM ADMIN UI:
- [ ] All marketplace pages use real Convex data
- [ ] Create module → publishes to marketplace
- [ ] Pricing simulator calculates correctly
- [ ] Per-school override: applied in billing
- [ ] Pilot grant creation: all types work
- [ ] Module suspension: all tenant installs affected

PORTAL INTEGRATION:
- [ ] All portal pages that use modules have access guards
- [ ] ModuleUnavailablePage shown when module not installed
- [ ] ModuleAccessDeniedPage shown when role has no access
- [ ] ModuleSuspendedPage shown for payment/platform suspension
- [ ] Dynamic sidebar loads from installed modules (not hardcoded)
- [ ] Dashboard widgets load from installed module configs

SECURITY:
- [ ] Teacher cannot install modules
- [ ] School A cannot install module for school B
- [ ] Pricing always calculated server-side
- [ ] Feature-level RBAC enforced in Convex functions
- [ ] Module guard blocks all uninstalled module access

FINAL:
- [ ] Zero hardcoded data anywhere in marketplace UI
- [ ] Zero TypeScript errors
- [ ] Zero build errors
- [ ] All 7 integration test flows pass

=======================================================================
END OF IMPLEMENTATION PROMPT
=======================================================================
```
