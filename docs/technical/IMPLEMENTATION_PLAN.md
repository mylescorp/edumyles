# EduMyles Full Implementation Plan

> Module Marketplace + All User Panels (8 panels)

---

## Architecture Overview

### User Panels to Build (8 total)
| Panel | Role | Route Prefix | Purpose |
|-------|------|-------------|---------|
| Master Admin | `master_admin` | `/platform` | Full platform control, tenant management, marketplace admin |
| Super Admin | `super_admin` | `/platform` | Platform-level administration, support |
| School Admin | `school_admin` | `/admin` | School-wide settings, module marketplace, user management |
| Teacher | `teacher` | `/portal/teacher` | Classes, grades, attendance, assignments |
| Student | `student` | `/portal/student` | View grades, timetable, assignments, wallet |
| Alumni | `alumni` (NEW) | `/portal/alumni` | Transcript access, alumni network, events |
| Partner | `partner` (NEW) | `/portal/partner` | Sponsorship dashboards, reports, communications |
| Parent | `parent` | `/portal/parent` | Child monitoring, fee payments, communication |

### Module Marketplace
Tenants install/uninstall from 11 modules based on their subscription tier. Marketplace includes browsing, requesting, installing, configuring, and uninstalling modules.

---

## PHASE 1: Shared Foundation (Week 1-2)

### 1.1 Install & Configure shadcn/ui
- Install shadcn/ui CLI and dependencies
- Generate base components: Button, Card, Dialog, DropdownMenu, Input, Label, Select, Table, Tabs, Badge, Avatar, Separator, Sheet, Skeleton, Toast, Tooltip, Command, Popover, ScrollArea, Switch, Checkbox, Form
- Configure `components.json` for project paths

### 1.2 Build Shared Layout Components
**Files to create:**
```
frontend/src/components/
├── layout/
│   ├── AppShell.tsx          # Main app shell (sidebar + header + content)
│   ├── Sidebar.tsx           # Collapsible sidebar with role-based navigation
│   ├── Header.tsx            # Top bar (tenant name, user avatar, notifications bell)
│   ├── ImpersonationBanner.tsx  # Warning banner during admin impersonation
│   └── MobileNav.tsx         # Mobile hamburger menu
├── shared/
│   ├── DataTable.tsx         # Generic data table with sorting, filtering, pagination
│   ├── StatCard.tsx          # Dashboard stat card (count, label, trend)
│   ├── EmptyState.tsx        # Empty state placeholder for modules
│   ├── LoadingSkeleton.tsx   # Loading states
│   ├── PageHeader.tsx        # Page title + breadcrumbs + actions
│   ├── ConfirmDialog.tsx     # Reusable confirmation modal
│   ├── SearchInput.tsx       # Global search
│   └── NotificationDropdown.tsx  # Notification bell dropdown
```

### 1.3 Build Core Hooks
**Files to create:**
```
frontend/src/hooks/
├── useAuth.ts            # Session, user, role, tenant from Convex
├── useTenant.ts          # Current tenant context (slug, tier, modules)
├── usePermissions.ts     # Check permissions client-side for UI gating
├── useModules.ts         # Installed modules for current tenant
├── useNotifications.ts   # Real-time notification subscription
└── usePagination.ts      # Pagination state management
```

### 1.4 Build Utility Library
**Files to create:**
```
frontend/src/lib/
├── convex.ts             # Convex client setup
├── auth.ts               # Auth helpers (getSession, redirectToLogin)
├── formatters.ts         # Date, currency (KES), phone formatting
├── permissions.ts        # Client-side permission checks (mirror server RBAC)
└── routes.ts             # Role-based route definitions
```

### 1.5 Add New Roles to Schema & RBAC
- Add `alumni` and `partner` roles to `convex/helpers/authorize.ts`
- Add to `shared/src/constants/index.ts` role definitions
- Add to `shared/src/types/index.ts` type unions
- Update Convex schema user role enum in `convex/schema.ts`
- Define permissions:
  - `alumni`: `[grades:read, reports:read, profile:read]`
  - `partner`: `[students:read, finance:read, reports:read, communications:read]`

### 1.6 Fix Auth Flow
- Fix `deriveTenantId()` — use WorkOS organization ID → Convex tenant lookup instead of email hash
- Fix `deriveRole()` — look up role from `users` table instead of hardcoding
- Build proper `/auth/login/page.tsx` — magic link form UI
- Build proper `/auth/callback/route.ts` — handle WorkOS redirect, create session, redirect to role-based dashboard
- Add logout route `/auth/logout/route.ts`
- Wire ConvexProvider in root layout

### 1.7 Role-Based Router
- Update middleware to detect role from session and redirect:
  - `master_admin` / `super_admin` → `/platform`
  - `school_admin` → `/admin`
  - `teacher` → `/portal/teacher`
  - `student` → `/portal/student`
  - `parent` → `/portal/parent`
  - `alumni` → `/portal/alumni`
  - `partner` → `/portal/partner`

---

## PHASE 2: Module Marketplace (Week 2-3)

### 2.1 Backend — Marketplace Convex Functions
**File: `convex/modules/marketplace/queries.ts`**
- `getModuleRegistry()` — list all available modules with metadata
- `getInstalledModules(tenantId)` — list modules installed for tenant
- `getAvailableForTier(tenantId)` — filter registry by tenant's tier
- `getModuleDetails(moduleId)` — single module info + install status
- `getModuleRequests(tenantId)` — list pending/approved/rejected requests

**File: `convex/modules/marketplace/mutations.ts`**
- `installModule(tenantId, moduleId)` — validate tier access, check dependencies, install, audit log
- `uninstallModule(tenantId, moduleId)` — check reverse dependencies, deactivate, audit log
- `updateModuleConfig(tenantId, moduleId, config)` — update module settings
- `requestModuleAccess(tenantId, userId, moduleId, reason)` — create access request
- `reviewModuleRequest(requestId, status, notes)` — approve/reject request

**File: `convex/modules/marketplace/mutations.ts` (Platform)**
- `seedModuleRegistry()` — populate moduleRegistry with all 11 modules
- `updateModuleStatus(moduleId, status)` — mark beta/active/deprecated
- `updateModuleVersion(moduleId, version)` — version management

### 2.2 Backend — Module Gate Middleware
**File: `convex/helpers/moduleGuard.ts`**
- `requireModule(ctx, tenantId, moduleId)` — throws if module not installed
- Use in every module's queries/mutations as first check after tenant guard

### 2.3 Frontend — Marketplace Pages
**Route: `/admin/marketplace`**
```
frontend/src/app/(admin)/marketplace/
├── page.tsx              # Module marketplace grid
├── [moduleId]/
│   └── page.tsx          # Module detail page (description, features, install/uninstall)
├── requests/
│   └── page.tsx          # Module access requests (admin view)
└── components/
    ├── ModuleCard.tsx     # Card showing module info, status, install button
    ├── ModuleGrid.tsx     # Grid layout of all modules
    ├── InstallDialog.tsx  # Confirmation dialog for install/uninstall
    ├── TierBadge.tsx      # Shows required tier (starter/standard/pro/enterprise)
    ├── ModuleStatusBadge.tsx  # active/inactive/beta badge
    └── RequestList.tsx    # List of module access requests
```

### 2.4 Frontend — Module Settings
**Route: `/admin/settings/modules`**
```
frontend/src/app/(admin)/settings/modules/
├── page.tsx              # Installed modules list with enable/disable toggles
└── [moduleId]/
    └── page.tsx          # Per-module configuration page
```

### 2.5 Platform Admin — Marketplace Management
**Route: `/platform/marketplace`**
```
frontend/src/app/(platform)/marketplace/
├── page.tsx              # All modules registry management
├── [moduleId]/
│   └── page.tsx          # Edit module metadata, version, status
└── components/
    ├── ModuleRegistryTable.tsx
    └── ModuleEditForm.tsx
```

---

## PHASE 3: Master Admin & Super Admin Panels (Week 3-4)

### 3.1 Backend — Platform Functions
**File: `convex/platform/dashboard/queries.ts`**
- `getPlatformStats()` — total tenants, active/trial/suspended, total users, total students, MRR
- `getRecentActivity()` — recent tenant signups, module installs, support requests
- `getRevenueMetrics()` — revenue by tier, MRR trend, churn rate

**File: `convex/platform/users/queries.ts`**
- `listPlatformAdmins()` — all master/super admins
- `listAllUsers(filters)` — cross-tenant user search (master admin only)

**File: `convex/platform/users/mutations.ts`**
- `createPlatformAdmin(email, role)` — invite new platform admin
- `updatePlatformAdminRole(userId, role)` — change role
- `deactivatePlatformAdmin(userId)` — remove access

**File: `convex/platform/billing/queries.ts`**
- `listSubscriptions(filters)` — all tenant subscriptions
- `getSubscriptionDetails(tenantId)` — single tenant billing info

**File: `convex/platform/billing/mutations.ts`**
- `updateTenantTier(tenantId, tier)` — change subscription tier
- `overrideBilling(tenantId, amount, notes)` — manual billing adjustment

### 3.2 Frontend — Master Admin Panel
**Route: `/platform`**
```
frontend/src/app/(platform)/
├── layout.tsx                # Platform layout (sidebar: Dashboard, Tenants, Users, Marketplace, Billing, Audit, Settings)
├── page.tsx                  # Platform dashboard (stats, charts, recent activity)
├── tenants/
│   ├── page.tsx              # Tenant list (search, filter by status/tier)
│   ├── [tenantId]/
│   │   ├── page.tsx          # Tenant detail (info, modules, users, billing)
│   │   ├── modules/page.tsx  # Tenant's installed modules
│   │   ├── users/page.tsx    # Tenant's users
│   │   └── billing/page.tsx  # Tenant billing history
│   └── create/page.tsx       # Onboard new school form
├── users/
│   ├── page.tsx              # All platform admins
│   └── invite/page.tsx       # Invite new admin
├── marketplace/              # (from Phase 2.5)
├── billing/
│   ├── page.tsx              # All subscriptions overview
│   └── revenue/page.tsx      # Revenue analytics
├── audit/
│   └── page.tsx              # Platform-wide audit log viewer
├── impersonation/
│   └── page.tsx              # Active impersonation sessions
└── settings/
    └── page.tsx              # Platform settings (root domain, defaults)
```

### 3.3 Super Admin Panel
Super Admin shares the `/platform` layout but with restricted access:
- Can view tenants but cannot delete
- Can view audit logs but cannot clear
- Cannot manage billing overrides
- Cannot create other master admins
- Permission-gated at component level using `usePermissions()`

---

## PHASE 4: School Admin Panel (Week 4-5)

### 4.1 Backend — School Management Functions
**File: `convex/modules/sis/queries.ts`**
- `listStudents(tenantId, filters)` — paginated student list with search
- `getStudent(tenantId, studentId)` — student profile with guardian info
- `getStudentStats(tenantId)` — total enrolled, by class, by status
- `listClasses(tenantId)` — all classes with student counts
- `listGuardians(tenantId)` — all guardians

**File: `convex/modules/sis/mutations.ts`**
- `createStudent(tenantId, data)` — enroll new student
- `updateStudent(tenantId, studentId, data)` — update profile
- `transferStudent(tenantId, studentId, toClass)` — class transfer
- `graduateStudent(tenantId, studentId)` — mark graduated
- `createClass(tenantId, data)` — add new class
- `bulkImportStudents(tenantId, csvData)` — CSV bulk import

**File: `convex/modules/admissions/queries.ts`**
- `listApplications(tenantId, filters)` — pipeline view
- `getApplication(tenantId, appId)` — full application details

**File: `convex/modules/admissions/mutations.ts`**
- `submitApplication(tenantId, data)` — new application
- `updateApplicationStatus(tenantId, appId, status)` — move through pipeline
- `enrollFromApplication(tenantId, appId)` — convert to enrolled student

**File: `convex/modules/hr/queries.ts`**
- `listStaff(tenantId, filters)` — all staff with roles
- `getStaffMember(tenantId, staffId)` — staff profile

**File: `convex/modules/hr/mutations.ts`**
- `createStaff(tenantId, data)` — add staff member
- `updateStaff(tenantId, staffId, data)` — update profile
- `assignRole(tenantId, staffId, role)` — assign system role

### 4.2 Frontend — Admin Dashboard & Pages
**Route: `/admin`**
```
frontend/src/app/(admin)/
├── layout.tsx                # Admin layout (sidebar: Dashboard, Students, Staff, Classes, Admissions, Finance, Academics, HR, Settings, Marketplace)
├── page.tsx                  # Admin dashboard (student count, staff count, fee collection, attendance rate)
├── students/
│   ├── page.tsx              # Student list with filters (class, status, search)
│   ├── [studentId]/
│   │   └── page.tsx          # Student profile (info, grades, attendance, fees, guardians)
│   ├── create/page.tsx       # Enroll new student form
│   └── import/page.tsx       # CSV bulk import
├── classes/
│   ├── page.tsx              # Class list with student counts
│   ├── [classId]/
│   │   └── page.tsx          # Class detail (students, timetable, teachers)
│   └── create/page.tsx       # Create new class
├── staff/
│   ├── page.tsx              # Staff directory
│   ├── [staffId]/
│   │   └── page.tsx          # Staff profile
│   └── create/page.tsx       # Add new staff
├── admissions/
│   ├── page.tsx              # Application pipeline (kanban or table view)
│   └── [appId]/
│       └── page.tsx          # Application detail + review actions
├── users/
│   ├── page.tsx              # User management (all roles within school)
│   └── invite/page.tsx       # Invite user with role assignment
├── marketplace/              # (from Phase 2)
├── settings/
│   ├── page.tsx              # School settings (name, logo, contact, curriculum)
│   ├── modules/              # (from Phase 2.4)
│   ├── billing/page.tsx      # Subscription & billing info
│   └── roles/page.tsx        # Role management within school
└── audit/
    └── page.tsx              # School-level audit log
```

---

## PHASE 5: Teacher Panel (Week 5-6)

### 5.1 Backend — Teacher Functions
**File: `convex/modules/academics/queries.ts`**
- `getTeacherClasses(tenantId, teacherId)` — classes assigned to teacher
- `getClassStudents(tenantId, classId)` — students in a class
- `getGrades(tenantId, classId, subjectId, term)` — grade sheet
- `getAssignments(tenantId, classId)` — assignments list
- `getSubmissions(tenantId, assignmentId)` — student submissions
- `getAttendance(tenantId, classId, date)` — attendance for a day

**File: `convex/modules/academics/mutations.ts`**
- `enterGrades(tenantId, grades[])` — bulk grade entry
- `createAssignment(tenantId, data)` — new assignment
- `gradeSubmission(tenantId, submissionId, grade, feedback)` — grade work
- `markAttendance(tenantId, classId, date, records[])` — bulk attendance
- `generateReportCard(tenantId, studentId, term)` — trigger report card generation

### 5.2 Frontend — Teacher Portal
**Route: `/portal/teacher`**
```
frontend/src/app/(portal)/teacher/
├── layout.tsx                # Teacher layout (sidebar: Dashboard, My Classes, Gradebook, Attendance, Assignments, Timetable)
├── page.tsx                  # Teacher dashboard (today's classes, pending grades, upcoming assignments)
├── classes/
│   ├── page.tsx              # My classes list
│   └── [classId]/
│       ├── page.tsx          # Class overview (students, performance summary)
│       ├── students/page.tsx # Class roster
│       └── grades/page.tsx   # Grade entry sheet (spreadsheet-like UI)
├── gradebook/
│   └── page.tsx              # Full gradebook across all classes
├── attendance/
│   ├── page.tsx              # Mark attendance (class selector + date + checkboxes)
│   └── history/page.tsx      # Attendance history view
├── assignments/
│   ├── page.tsx              # All assignments
│   ├── create/page.tsx       # Create new assignment
│   └── [assignmentId]/
│       ├── page.tsx          # Assignment detail
│       └── submissions/page.tsx  # View & grade submissions
├── timetable/
│   └── page.tsx              # Teacher's weekly timetable view
└── profile/
    └── page.tsx              # Teacher's own profile
```

---

## PHASE 6: Parent Panel (Week 6-7)

### 6.1 Backend — Parent Functions
**File: `convex/modules/portal/parent/queries.ts`**
- `getChildren(tenantId, parentId)` — list linked children
- `getChildGrades(tenantId, studentId)` — grades for a child
- `getChildAttendance(tenantId, studentId)` — attendance record
- `getChildTimetable(tenantId, studentId)` — child's schedule
- `getFeeBalance(tenantId, studentId)` — outstanding fees
- `getPaymentHistory(tenantId, parentId)` — past payments
- `getChildAssignments(tenantId, studentId)` — upcoming/pending assignments
- `getAnnouncements(tenantId)` — school announcements

**File: `convex/modules/portal/parent/mutations.ts`**
- `initiatePayment(tenantId, invoiceId, method)` — start fee payment
- `sendMessage(tenantId, recipientId, message)` — message teacher/admin

### 6.2 Frontend — Parent Portal
**Route: `/portal/parent`**
```
frontend/src/app/(portal)/parent/
├── layout.tsx                # Parent layout (sidebar: Dashboard, Children, Fees, Messages, Announcements)
├── page.tsx                  # Parent dashboard (children summary, fee balance, recent grades)
├── children/
│   ├── page.tsx              # Children list
│   └── [studentId]/
│       ├── page.tsx          # Child overview (grades summary, attendance %, next fees due)
│       ├── grades/page.tsx   # Detailed grades per subject/term
│       ├── attendance/page.tsx  # Attendance calendar view
│       ├── timetable/page.tsx   # Child's timetable
│       └── assignments/page.tsx # Child's assignments
├── fees/
│   ├── page.tsx              # Fee statements for all children
│   ├── pay/page.tsx          # Payment page (M-Pesa, card, bank)
│   └── history/page.tsx      # Payment receipts
├── messages/
│   └── page.tsx              # Message inbox + compose
├── announcements/
│   └── page.tsx              # School announcements feed
└── profile/
    └── page.tsx              # Parent profile + notification preferences
```

---

## PHASE 7: Student Panel (Week 7-8)

### 7.1 Backend — Student Functions
**File: `convex/modules/portal/student/queries.ts`**
- `getMyGrades(tenantId, studentId)` — own grades
- `getMyAttendance(tenantId, studentId)` — own attendance
- `getMyTimetable(tenantId, studentId)` — own schedule
- `getMyAssignments(tenantId, studentId)` — pending/completed assignments
- `getMyWalletBalance(tenantId, studentId)` — eWallet balance
- `getMyReportCards(tenantId, studentId)` — downloadable report cards
- `getAnnouncements(tenantId)` — school announcements

**File: `convex/modules/portal/student/mutations.ts`**
- `submitAssignment(tenantId, assignmentId, submission)` — submit work

### 7.2 Frontend — Student Portal
**Route: `/portal/student`**
```
frontend/src/app/(portal)/student/
├── layout.tsx                # Student layout (sidebar: Dashboard, Grades, Timetable, Assignments, Attendance, Wallet, Report Cards)
├── page.tsx                  # Student dashboard (GPA, upcoming assignments, attendance %, wallet balance)
├── grades/
│   └── page.tsx              # Grades by subject and term
├── timetable/
│   └── page.tsx              # Weekly timetable view
├── assignments/
│   ├── page.tsx              # Assignments list (pending/submitted/graded)
│   └── [assignmentId]/
│       └── page.tsx          # Assignment detail + submission form
├── attendance/
│   └── page.tsx              # Attendance calendar
├── wallet/
│   └── page.tsx              # eWallet balance + transaction history
├── report-cards/
│   └── page.tsx              # Report card downloads (PDF)
├── announcements/
│   └── page.tsx              # School announcements
└── profile/
    └── page.tsx              # Student profile
```

---

## PHASE 8: Alumni Panel (Week 8-9)

### 8.1 Backend — Alumni Functions
**File: `convex/modules/portal/alumni/queries.ts`**
- `getAlumniProfile(tenantId, alumniId)` — profile with graduation info
- `getTranscripts(tenantId, alumniId)` — academic transcripts
- `getAlumniDirectory(tenantId, filters)` — searchable alumni network
- `getAlumniEvents(tenantId)` — upcoming alumni events
- `getAlumniAnnouncements(tenantId)` — alumni-specific news

**File: `convex/modules/portal/alumni/mutations.ts`**
- `updateAlumniProfile(tenantId, alumniId, data)` — update contact info, career
- `requestTranscript(tenantId, alumniId, type)` — request official transcript
- `rsvpEvent(tenantId, alumniId, eventId)` — RSVP to event

**Schema additions (convex/schema.ts):**
- `alumni` table — graduation year, degree, career info, contact details
- `alumniEvents` table — event name, date, location, capacity, RSVPs
- `transcriptRequests` table — request status, type, issued date

### 8.2 Frontend — Alumni Portal
**Route: `/portal/alumni`**
```
frontend/src/app/(portal)/alumni/
├── layout.tsx                # Alumni layout (sidebar: Dashboard, Transcripts, Directory, Events)
├── page.tsx                  # Alumni dashboard (graduation year, transcript status, upcoming events)
├── transcripts/
│   ├── page.tsx              # View academic records
│   └── request/page.tsx      # Request official transcript
├── directory/
│   └── page.tsx              # Alumni network directory (searchable by year, program)
├── events/
│   ├── page.tsx              # Upcoming alumni events
│   └── [eventId]/
│       └── page.tsx          # Event detail + RSVP
└── profile/
    └── page.tsx              # Alumni profile (career, contact info)
```

---

## PHASE 9: Partner Panel (Week 9-10)

### 9.1 Backend — Partner Functions
**File: `convex/modules/portal/partner/queries.ts`**
- `getPartnerProfile(tenantId, partnerId)` — organization info
- `getSponsoredStudents(tenantId, partnerId)` — students under sponsorship
- `getSponsorshipReport(tenantId, partnerId, term)` — academic/financial report
- `getPartnerPayments(tenantId, partnerId)` — payment history
- `getPartnerAnnouncements(tenantId)` — relevant school updates

**File: `convex/modules/portal/partner/mutations.ts`**
- `updatePartnerProfile(tenantId, partnerId, data)` — update org info
- `sendPartnerMessage(tenantId, partnerId, message)` — communicate with school

**Schema additions (convex/schema.ts):**
- `partners` table — organization name, type (NGO/corporate/individual), contact, sponsorship terms
- `sponsorships` table — partnerId, studentId, amount, startDate, endDate, status

### 9.2 Frontend — Partner Portal
**Route: `/portal/partner`**
```
frontend/src/app/(portal)/partner/
├── layout.tsx                # Partner layout (sidebar: Dashboard, Students, Reports, Payments, Messages)
├── page.tsx                  # Partner dashboard (sponsored student count, total invested, performance summary)
├── students/
│   ├── page.tsx              # Sponsored students list
│   └── [studentId]/
│       └── page.tsx          # Student academic/attendance report (read-only)
├── reports/
│   └── page.tsx              # Aggregated sponsorship reports (downloadable PDF)
├── payments/
│   └── page.tsx              # Payment history + upcoming dues
├── messages/
│   └── page.tsx              # Communication with school
└── profile/
    └── page.tsx              # Partner organization profile
```

---

## PHASE 10: Remaining Modules Backend (Week 10-13)

### 10.1 Finance & Fees Module
**Files: `convex/modules/finance/queries.ts` & `mutations.ts`**
- Fee structure builder (line items per class/term)
- Invoice generation (individual + bulk)
- Payment recording + reconciliation
- Fee reminders trigger
- Financial reports (collection rate, outstanding, by class)
- Receipt generation data

### 10.2 Timetable Module
**Files: `convex/modules/timetable/queries.ts` & `mutations.ts`**
- Timetable slot CRUD
- Conflict detection (teacher double-booking, room clash)
- Substitute teacher assignment
- Class/teacher/room schedule views

### 10.3 HR & Payroll Module
**Files: `convex/modules/hr/queries.ts` & `mutations.ts`**
- Staff profile CRUD
- Contract management
- Leave management
- Payroll calculation (basic + allowances - deductions)
- Payslip data generation

### 10.4 Library Module
**Files: `convex/modules/library/queries.ts` & `mutations.ts`**
- Book catalogue CRUD (ISBN, title, author, category)
- Borrow/return tracking
- Overdue detection + fine calculation
- Low stock alerts

### 10.5 Transport Module
**Files: `convex/modules/transport/queries.ts` & `mutations.ts`**
- Route definition with stops
- Vehicle fleet management
- Student-route assignment
- Driver assignment

### 10.6 Communications Module
**Files: `convex/modules/communications/queries.ts` & `mutations.ts`**
- Notification CRUD + template system
- SMS send via Africa's Talking action
- Email send via Resend action
- Announcement CRUD
- Emergency broadcast with acknowledgment

### 10.7 eWallet Module
**Files: `convex/modules/ewallet/queries.ts` & `mutations.ts`**
- Wallet balance queries
- Top-up processing
- Transaction recording
- Spend tracking

### 10.8 eCommerce Module
**Files: `convex/modules/ecommerce/queries.ts` & `mutations.ts`**
- Product catalogue CRUD
- Order management
- Cart operations
- Payment integration with eWallet

---

## PHASE 11: Payment Webhooks & Integrations (Week 13-14)

### 11.1 API Routes
```
frontend/src/app/api/
├── webhooks/
│   ├── mpesa/route.ts        # M-Pesa STK Push callback
│   ├── stripe/route.ts       # Stripe webhook handler
│   ├── airtel/route.ts       # Airtel Money callback
│   └── workos/route.ts       # WorkOS webhook (user sync)
├── payments/
│   ├── mpesa/initiate/route.ts   # Initiate M-Pesa STK Push
│   └── stripe/checkout/route.ts  # Create Stripe checkout session
```

### 11.2 Payment Actions
**File: `convex/actions/payments/mpesa.ts`**
- `initiateStkPush(phone, amount, invoiceId)` — call Daraja API
- `processCallback(data)` — reconcile payment

**File: `convex/actions/payments/stripe.ts`**
- `createCheckoutSession(invoiceId, amount)` — Stripe checkout
- `processWebhook(event)` — handle Stripe events

### 11.3 Communication Actions
**File: `convex/actions/communications/sms.ts`**
- `sendSms(phone, message)` — Africa's Talking API
- `sendBulkSms(phones[], template)` — bulk send

**File: `convex/actions/communications/email.ts`**
- `sendEmail(to, subject, template, data)` — Resend API
- Templates: fee reminder, exam results, attendance alert, payslip

---

## PHASE 12: Admin Pages for Remaining Modules (Week 14-16)

### Finance Pages (`/admin/finance/`)
- Fee structures, invoices, payments, reports, receipts

### Timetable Pages (`/admin/timetable/`)
- Visual timetable builder, conflict warnings, substitute management

### HR Pages (`/admin/hr/`)
- Staff directory, payroll runs, leave management, contracts

### Library Pages (`/admin/library/`)
- Book catalog, circulation, overdue tracking, dashboard

### Transport Pages (`/admin/transport/`)
- Routes, vehicles, student assignments, driver management

### Communications Pages (`/admin/communications/`)
- Send SMS/email, templates, announcements, broadcast

### eWallet Pages (`/admin/ewallet/`)
- Wallet overview, top-ups, transactions

### eCommerce Pages (`/admin/ecommerce/`)
- Product catalog, orders, inventory

---

## PHASE 13: Testing (Week 16-17)

### 13.1 Setup
- Install Vitest + testing-library
- Configure test environment for Convex

### 13.2 Critical Tests
- Tenant isolation tests (cross-tenant data leak prevention)
- RBAC permission tests (every role + permission combination)
- Module guard tests (access blocked when module not installed)
- Payment webhook signature verification tests
- Auth flow tests (login, session, logout, expiry)

### 13.3 Module Tests
- Unit tests for every query/mutation in all 11 modules
- Integration tests for payment flows
- Integration tests for admission pipeline

---

## Execution Order & Dependencies

```
Phase 1 (Foundation)
  └──> Phase 2 (Marketplace)
        └──> Phase 3 (Master/Super Admin)
        └──> Phase 4 (School Admin)  ←── depends on SIS module backend
              └──> Phase 5 (Teacher) ←── depends on Academics backend
              └──> Phase 6 (Parent)  ←── depends on Finance + Academics
              └──> Phase 7 (Student) ←── depends on Academics
              └──> Phase 8 (Alumni)  ←── new schema + portal
              └──> Phase 9 (Partner) ←── new schema + portal
  Phase 10 (Module Backends) ←── can run in PARALLEL with Phases 4-9
  Phase 11 (Payments/Integrations)
  Phase 12 (Admin Module Pages) ←── depends on Phase 10
  Phase 13 (Testing) ←── runs throughout but formalized last
```

---

## File Count Estimate

| Area | New Files | Notes |
|------|-----------|-------|
| shadcn/ui components | ~25 | Base component library |
| Shared layout components | ~12 | AppShell, Sidebar, Header, etc. |
| Hooks & utilities | ~10 | Auth, permissions, formatting |
| Convex marketplace functions | ~6 | Queries, mutations, guards |
| Convex module functions (11 modules) | ~30 | 2-3 files per module |
| Convex portal functions (4 portals) | ~12 | Alumni, partner, parent, student |
| Convex actions (payments, comms) | ~6 | M-Pesa, Stripe, SMS, email |
| Platform admin pages | ~15 | Dashboard, tenants, billing, audit |
| School admin pages | ~25 | Students, staff, classes, admissions, settings |
| Teacher portal pages | ~12 | Classes, gradebook, attendance, assignments |
| Parent portal pages | ~12 | Children, fees, messages |
| Student portal pages | ~10 | Grades, timetable, assignments, wallet |
| Alumni portal pages | ~8 | Transcripts, directory, events |
| Partner portal pages | ~8 | Students, reports, payments |
| Admin module pages | ~20 | Finance, HR, library, transport, etc. |
| API routes | ~6 | Webhooks + payment initiation |
| Test files | ~20 | Unit + integration tests |
| **TOTAL** | **~237** | |
