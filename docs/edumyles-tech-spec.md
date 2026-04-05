# EduMyles — Full Platform Technical Specification
**Version:** 1.0  
**Date:** April 2026  
**Status:** Source of Truth  
**Prepared for:** Engineering Team  

---

## TABLE OF CONTENTS

1. Platform Overview
2. Technology Stack
3. Repository Structure
4. Authentication & Session Management
5. Role-Based Access Control (RBAC)
6. Multi-Tenancy & Tenant Isolation
7. Platform User Management
8. Tenant Onboarding — End to End
9. Subscription Plans & Billing
10. Module Pricing & Currency
11. Marketplace Lifecycle
12. Developer Portal
13. Pilot Grants
14. Master Admin Portal
15. School Admin Portal
16. Portal Admin
17. Teacher Portal
18. Student Portal
19. Parent Portal
20. Alumni Portal
21. Partner Portal
22. Mobile App
23. Communications System
24. Payment Integration
25. Convex Database Schema
26. API & Webhook Architecture
27. Infrastructure & CI/CD
28. Security Requirements
29. Implementation Priority Order

---

## 1. PLATFORM OVERVIEW

EduMyles is a multi-tenant school management SaaS platform built for African educational institutions, with Kenya as the primary market. It serves multiple user types across web and mobile, with a marketplace for modular feature extensions.

### Core Principles
- All data lives in Convex — no hardcoded data anywhere in the UI
- Every read uses `useQuery()`, every write uses `useMutation()`
- All prices stored in KES (Kenya Shillings) as base currency
- Tenant isolation enforced server-side on every Convex function
- RBAC checked server-side — never trust client-side role checks
- All actions logged to audit trail

### User Panels
| Panel | Route Prefix | Primary Roles |
|---|---|---|
| Platform Admin | `/platform` | master_admin, super_admin, platform_manager, support_agent, billing_admin, marketplace_reviewer, content_moderator, analytics_viewer |
| School Admin | `/admin` | school_admin, principal |
| Portal Admin | `/portal/admin` | Admin staff operational slices |
| Teacher | `/portal/teacher` | teacher |
| Student | `/portal/student` | student |
| Parent | `/portal/parent` | parent |
| Alumni | `/portal/alumni` | alumni |
| Partner | `/portal/partner` | partner |
| Auth / Public | `/auth`, `/`, `/maintenance` | Unauthenticated |

---

## 2. TECHNOLOGY STACK

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **State:** Convex React hooks (`useQuery`, `useMutation`)
- **Auth:** WorkOS AuthKit (`@workos-inc/authkit-nextjs`)
- **File Upload:** UploadThing
- **AI:** Vercel AI SDK
- **Monorepo:** Turborepo

### Backend
- **Database & Functions:** Convex (queries, mutations, actions, scheduled functions)
- **Scheduled Jobs:** Convex crons + Inngest
- **Email:** Resend + React Email templates
- **SMS:** Africa's Talking
- **Push:** Expo Push Notifications
- **Payments:** M-Pesa Daraja, Airtel Money, Stripe, Bank Transfer

### Mobile
- **Framework:** Expo (React Native)
- **Backend:** Convex (same backend as web)
- **Auth:** Browser-assisted login via WorkOS
- **Build:** EAS Build (`mylescorp-technologies/edumyles`)

### Infrastructure
- **Web Hosting:** Vercel (wildcard subdomain per tenant)
- **Backend Hosting:** Convex Cloud
- **Domain:** `*.edumyles.co.ke` (canonical)
- **CI/CD:** GitHub Actions
- **Repo:** https://github.com/Mylesoft-Technologies/edumyles
- **Node Version:** `>=20.9.0` (currently running v24.14.0)

### Developer Tools (in repo)
- `opensrc/` — source code for key npm packages (convex, stripe, workos, resend, zod, ai, inngest, uploadthing, expo)
- `.agent-skills/` — AI agent skill files installed via autoskills

---

## 3. REPOSITORY STRUCTURE

```
edumyles/
├── convex/                    # Backend — all Convex functions
│   ├── actions/               # Server-side actions (payments, comms, AI)
│   │   ├── ai/
│   │   ├── auth/
│   │   ├── communications/    # email.ts, sms.ts, push.ts
│   │   └── payments/          # mpesa.ts, airtel.ts, stripe.ts, bankTransfer.ts
│   ├── helpers/               # Guards and utilities
│   │   ├── tenantGuard.ts     # requireTenantContext()
│   │   ├── platformGuard.ts   # requirePlatformContext()
│   │   ├── authorize.ts
│   │   ├── auditLog.ts
│   │   └── moduleGuard.ts
│   ├── modules/               # Feature modules
│   │   ├── academics/
│   │   ├── admissions/
│   │   ├── communications/
│   │   ├── finance/
│   │   ├── hr/
│   │   ├── library/
│   │   ├── marketplace/
│   │   ├── platform/
│   │   ├── pm/
│   │   ├── portal/
│   │   ├── sis/
│   │   └── transport/
│   ├── dev/seed.ts
│   ├── schema.ts              # Single source of truth for all tables
│   ├── crons.ts
│   └── http.ts
├── frontend/                  # Next.js app
│   ├── src/app/               # App Router pages
│   ├── src/components/        # Shared components
│   └── src/hooks/             # Custom React hooks
├── mobile/                    # Expo React Native app
├── shared/                    # Shared types, validators, constants
│   └── src/
│       ├── types/index.ts
│       ├── validators/index.ts
│       └── constants/index.ts
├── scripts/                   # Utility scripts (seed, admin setup)
├── docs/                      # Technical documentation
├── opensrc/                   # Fetched package source code
├── .agent-skills/             # AI agent skill files
├── .github/workflows/         # CI/CD pipelines
├── vercel.json
├── turbo.json
└── package.json               # Root monorepo config
```

---

## 4. AUTHENTICATION & SESSION MANAGEMENT

### Provider
WorkOS AuthKit handles all authentication. Every user, regardless of panel, authenticates via WorkOS.

### Auth Flow
1. User visits any protected route
2. Next.js middleware checks for valid WorkOS session
3. If no session → redirect to `/auth/login`
4. WorkOS handles credential verification (email/password, SSO, magic link, MFA)
5. On success → WorkOS returns session with user data and org ID
6. Session stored server-side; client reads via `withAuth()` from `@workos-inc/authkit-nextjs`
7. Convex receives authenticated identity via WorkOS JWT
8. Convex functions verify identity on every call

### Supported Auth Methods
- Email + password
- Magic link (passwordless)
- Google SSO
- Microsoft SSO
- GitHub SSO
- SAML SSO (Enterprise plan only)
- MFA (TOTP authenticator app)

### Server-Side Route Protection
- Next.js middleware at `frontend/src/middleware.ts` enforces auth at route level
- Middleware checks WorkOS session for every protected route
- Client-side `AuthGuard` and `RoleGuard` are supplementary display guards only — never the primary security boundary
- `/dev` route excluded from middleware (developer tool, no auth enforced)
- `/auth/*` and `/` routes excluded from middleware

### Session Management
- Session timeout: configurable per platform settings (default 60 minutes inactivity)
- Admins can view and revoke sessions per user
- Impersonation sessions tracked separately with reason and time limit

---

## 5. ROLE-BASED ACCESS CONTROL (RBAC)

### Platform-Level Roles (Staff who operate EduMyles itself)

**master_admin**
Full unrestricted platform access. Only role that can:
- Ban publishers and modules permanently
- Delete tenants and their data
- Configure payment providers
- Create other master_admin accounts
- Grant permanent free access (pilot grants)
- View all financial data and export reports
- Manage platform API keys
- Configure SLA and security settings
- Override any module price

**super_admin**
Near-full access. Restrictions:
- Cannot ban publishers permanently (suspend only)
- Cannot delete tenants (suspend only)
- Cannot access raw financial reports
- Cannot create master_admin accounts
- Cannot modify payment provider configs
- Cannot manage platform API keys

**platform_manager**
- Manage tenants (view, suspend, communicate)
- Manage marketplace (review, approve, reject, suspend modules)
- Manage publishers (approve, suspend)
- Grant pilot access (free_trial and discounted only)
- Manage CRM and onboarding
- Cannot access billing or financial data
- Cannot ban permanently
- Cannot impersonate users

**support_agent**
- View tenant details (read only)
- View user profiles (read only)
- Manage support tickets
- Send communications to tenants
- Manage knowledge base
- Cannot modify subscriptions
- Cannot access financial data
- Cannot impersonate

**billing_admin**
- View all billing and financial data
- Manage invoices (mark paid, void, refund)
- Manage subscriptions (upgrade, downgrade, cancel)
- Manage publisher payouts
- Cannot access tenant user data
- Cannot access marketplace management
- Cannot impersonate

**marketplace_reviewer**
- Review and approve/reject module submissions
- Request changes from publishers
- View publisher profiles
- Cannot suspend or ban
- Cannot access tenant data or financial data

**content_moderator**
- Moderate reviews and flags
- Approve/reject/delete reviews
- Investigate flags and dismiss or escalate
- Cannot take action on modules directly
- Cannot access tenant data

**analytics_viewer**
- Read-only access to analytics dashboards only
- Cannot view individual tenant or user data
- Can export reports only

### Tenant-Level Roles (Users within a school)

**school_admin**
- Full control within their tenant
- Manage students, staff, classes, finance, modules
- Install and configure modules
- Manage billing and subscription

**principal**
- View all tenant data
- Limited configuration (no billing, no module install)
- Approve requests from teachers

**teacher**
- Access academic modules: gradebook, assignments, attendance, timetable
- View their assigned classes and students
- Cannot access finance or HR

**student**
- Access student portal: grades, assignments, attendance, timetable, wallet
- Read-only on most data

**parent**
- View children's academic data
- Pay fees
- Communicate with school

**alumni**
- Access alumni portal: directory, events, transcripts

**partner**
- Access partner portal: reports, payments, students

### Permission Check Implementation
Every Convex function must check permissions server-side:

```typescript
// School admin functions
const tenantId = await requireTenantContext(ctx);

// Platform admin functions  
await requirePlatformContext(ctx);

// Publisher functions
await requirePublisherContext(ctx);

// Role-specific check
const user = await ctx.auth.getUserIdentity();
if (!hasPermission(user, "approve_modules")) {
  throw new Error("Unauthorized");
}
```

Never trust client-side role claims. Always re-verify in Convex.

---

## 6. MULTI-TENANCY & TENANT ISOLATION

### Tenant Identification
- Each school is a tenant with a unique `tenantId`
- Tenant resolved from subdomain: `schoolname.edumyles.co.ke`
- Tenant handler at `frontend/src/app/api/tenant-handler/route.ts`
- All subdomains follow `*.edumyles.co.ke` (canonical domain)
- Custom domains supported for Pro+ plans (SSL auto-provisioned)

### Data Isolation Rules
- Every tenant-scoped table has a `tenantId` field
- Every Convex query/mutation for tenant data starts with `requireTenantContext(ctx)`
- `requireTenantContext` extracts and validates tenantId from the authenticated session
- Cross-tenant data access is never permitted
- Platform admin functions use `requirePlatformContext` which bypasses tenant scoping for legitimate admin operations — every such access is audit-logged

### Wildcard Routing (Vercel)
- `vercel.json` must configure wildcard routing for `*.edumyles.co.ke`
- Each tenant gets their own subdomain resolved at the middleware level
- Custom domain support maps `school.com` → tenant lookup → serve correct tenant context

---

## 7. PLATFORM USER MANAGEMENT

### Invite System `/platform/users/invite`

**Invite Form Fields:**
- Email address (one or multiple comma-separated)
- Role to assign (dropdown of 8 platform roles)
- Department: Engineering, Operations, Support, Finance, Marketing
- Personal message (appended to invite email)
- Permission overrides (add or remove specific permissions beyond role defaults)
- Access expiry date (for contractors or temporary staff)
- Notify inviter when accepted: yes/no

**Invite Process:**
1. Platform Admin submits form
2. Unique token generated, stored in `platform_user_invites` table
3. Invite email sent via Resend (expires 72 hours)
4. Pending invite visible in invite management list
5. Resend/revoke available from list

**Accept Invite Flow:**
1. Invitee clicks link in email
2. If no account: create password → profile setup → platform dashboard
3. If existing account: confirm → platform dashboard
4. First login triggers platform staff onboarding checklist

**Bulk Invite:**
- CSV upload with columns: email, role
- System processes each row as individual invite
- Errors reported per row (invalid email, invalid role)

**Invite Management `/platform/users/invite`:**
- List all pending invites
- Filter by: role, status, invited by, date sent
- Resend invite (resets 72hr expiry)
- Revoke invite

### Permission Override System
Each platform user has:
- Base permissions from their role
- Added permissions (granted beyond role defaults)
- Removed permissions (restricted below role defaults)
- Effective permissions = role defaults + added - removed

Master Admin can customize any user's permissions from their profile page. All permission changes logged in audit trail. Users can view their effective permissions in their own profile.

### Platform User Profile `/platform/profile`

**Personal Information:**
- Full name
- Profile photo (upload via UploadThing)
- Job title
- Department
- Phone number
- Timezone
- Language preference
- Display currency preference

**Account Security:**
- Change email (requires verification email)
- Change password (requires current password)
- Enable/disable 2FA (TOTP authenticator)
- View active sessions (device, IP, last active)
- Revoke individual sessions
- Revoke all other sessions
- View login history (last 30 logins)
- Download account data

**Notification Preferences:**
- Email notifications: on/off per event type
- In-app notifications: on/off per event type
- SMS notifications: on/off per event type (critical only)
- Notification digest: real-time or daily summary
- Quiet hours configuration

**Appearance:**
- Theme: light/dark/system
- Sidebar: expanded/collapsed by default
- Default landing page after login

**Personal API Keys:**
- Create, rotate, revoke personal API keys
- Usage stats per key

### Admin View of Staff Profile `/platform/users/[userId]`
- All profile fields (read only)
- Role and permissions with effective permissions breakdown
- Edit role button (Master Admin and Super Admin only)
- Edit permissions button with override interface
- Account status and access expiry
- Last login and session count
- Activity summary
- Activity timeline
- Suspend/unsuspend account
- Set access expiry date
- Add internal note
- Reset password (sends reset email)
- Revoke all sessions
- Delete account (Master Admin only)

---

## 8. TENANT ONBOARDING — END TO END

### Entry Points into the Funnel

```
Landing Page Waitlist
    ↓
CRM Lead (auto-created or manual)
    ↓
Demo → Trial Tenant Creation
    ↓
Direct Self-Serve Signup
    ↓
Referral from existing tenant / publisher / partner
```

### ENTRY POINT 1 — LANDING PAGE WAITLIST

**Waitlist Form on Landing Page captures:**
- Full name
- Email
- School name
- Country
- Approximate student count
- Phone number (optional)
- How did you hear about us
- Biggest challenge (optional — for qualification)

**On Submission:**
- Record created in `waitlist` Convex table
- Auto-reply email sent via Resend: "You're on the waitlist"
- Platform Admin sees new entry in `/platform/waitlist`
- If student_count > 500: automatically flagged as high-value lead

**Waitlist Management `/platform/waitlist`:**
- List all entries
- Filter by: country, student count, signup date, status
- Status: waiting / invited / converted / rejected
- Bulk actions: invite, reject, export
- Stats: total waiting, invited this week, conversion rate

**Waitlist to Invite:**
1. Platform Admin selects one or multiple entries
2. Clicks "Invite to Platform"
3. System creates pending tenant record
4. Sends invite email with unique signup link (expires 7 days)
5. Waitlist status → invited
6. If not accepted in 7 days: auto-reminder sent
7. If not accepted in 14 days: second reminder
8. If not accepted in 21 days: flagged as cold, Platform Admin notified

### ENTRY POINT 2 — CRM LEAD

**Lead Creation:**
- Manual creation by Platform Manager in `/platform/crm/leads/create`
- Auto-created from: landing page contact form, demo request form, publisher referral, tenant referral

**Lead Fields:**
- School name, contact name, email, phone
- Country, student count estimate
- Budget confirmed: yes/no
- Timeline: immediate, 1-3 months, 3-6 months, 6+ months
- Decision maker name and role
- Source: website, referral, outbound, demo_request, publisher_referral
- Assigned platform manager

**Qualification Score:**
- Student count > 500: +2 points
- Budget confirmed: +3 points
- Decision maker contacted: +2 points
- Demo attended: +3 points
- Trial requested: +4 points
- Thresholds: cold (0-4), warm (5-9), hot (10+)

**CRM Pipeline Stages:**
```
new_lead → contacted → demo_scheduled → demo_completed → 
trial_requested → trial_active → proposal_sent → 
negotiating → won → lost
```

**Demo Flow:**
1. Platform Manager schedules demo in CRM
2. Calendar invite and reminder auto-sent to lead
3. After demo: log outcome
   - Interested → trial_requested
   - Not interested → lost with reason
   - Follow-up needed → task created

**Trial Creation from CRM:**
1. Platform Manager clicks "Create Trial Tenant" from deal detail
2. Form pre-fills from CRM lead data
3. Platform Manager selects: trial duration, plan to trial, pilot grants, account manager
4. System creates tenant, sends invite to school admin
5. CRM deal stage → trial_active, linked to tenant_id

### ENTRY POINT 3 — DIRECT SELF-SERVE SIGNUP

**Signup Form:**
- School name
- Admin first and last name
- Work email
- Password
- Country (auto-detected from IP, editable)
- Accept terms and privacy policy

**On Submit:**
1. Verify email (OTP or magic link via WorkOS)
2. Create tenant with Free plan
3. Create School Admin user in WorkOS org
4. Trigger onboarding wizard

### TENANT CREATION (PLATFORM ADMIN INITIATED) `/platform/tenants/create`

**Step 1 — School Information:**
- School name
- School type: Primary, Secondary, University, College, Vocational, International
- Country, region/county, physical address, website URL
- School logo upload (UploadThing)

**Step 2 — Admin Account:**
- First name, last name, work email, phone, job title
- Auto-generate temporary password or send magic link

**Step 3 — Subscription Setup:**
- Select plan: Free/Starter/Pro/Enterprise
- Billing cycle: monthly/annual
- Custom pricing override (if needed by Master Admin)
- Trial period in days (0 for immediate billing)
- Student count estimate
- Payment method (collect now or prompt school admin later)

**Step 4 — Initial Configuration:**
- Subdomain (auto-suggested from school name, editable)
- Custom domain (Pro+ only)
- Timezone, display currency, academic year start month
- Term/semester structure

**Step 5 — Module Setup:**
- Pre-selected bundle modules shown (can deactivate)
- Additional pilot grants selected by Platform Admin
- Module install order

**Step 6 — Invite & Welcome:**
- Review all details
- Select welcome email template
- Add personal message
- Schedule send or send immediately
- Preview email before sending

**On Create — System Actions:**
1. Tenant record created in Convex `tenants` table
2. WorkOS org created for tenant
3. School Admin user created, assigned to org
4. Selected plan subscription created
5. Bundle modules installed
6. Pilot grants applied
7. Welcome email sent via Resend
8. If from CRM: deal updated to won, linked to tenant_id
9. If from waitlist: entry updated to converted
10. Platform Admin and account manager notified
11. Tenant appears in `/platform/tenants`

### SCHOOL ADMIN ONBOARDING WIZARD

Shown on first login. Cannot be skipped on first login.

**Step 1: Welcome & Plan Overview**
- Show current plan and trial end date
- Show included modules
- CTA: "Let's set up your school"

**Step 2: School Profile**
- Confirm school name, logo, address
- Set academic year dates, term/semester dates
- School motto, school colors for student-facing portals

**Step 3: Configure Roles**
- Confirm and rename roles to match school terminology
- Set which roles are active

**Step 4: Add Staff**
- Upload CSV (name, email, role, department)
- Or add manually
- Send invite emails to staff: yes/no

**Step 5: Add Students**
- Upload CSV (name, admission number, class/grade, DOB, parent email/phone)
- Or add manually
- Or skip with reminder

**Step 6: Set Up Classes**
- Create class/grade structure
- Assign class teachers
- Set subjects per class

**Step 7: Configure Modules**
- Walk through each installed module with quick/advanced setup:
  - Finance: fee structures, accepted payment methods
  - Library: borrowing rules
  - Timetable: school hours and periods
  - Communications: SMS/email preferences
  - Transport: routes

**Step 8: Customize Portal**
- Theme color from palette
- Upload school logo
- Portal language
- Parent and student dashboard configuration

**Step 9: Review & Launch**
- Summary of what was set up
- Checklist of complete and pending items
- "Go to Dashboard" button

**Persistent Onboarding Checklist (in dashboard header until complete):**
```
✅ School profile complete
✅ At least 1 staff member added
⬜ At least 10 students added
⬜ Classes created and assigned
⬜ Fee structure configured
⬜ First timetable created
⬜ Communication settings configured
⬜ Parent accounts invited
```

Progress tracked per step in `tenant_onboarding` Convex table. Account manager alerted if no progress in 3 days.

### TRIAL MANAGEMENT `/platform/tenant-success`

**Trial Health Score (0-50, computed in Convex):**
- +10: Completed onboarding wizard
- +5: Added 10+ students
- +5: Added 3+ staff
- +5: Configured fee structure
- +5: Logged in 3+ days in first week
- +5: Invited parents
- +10: Processed first payment
- +5: Used 3+ modules

**Automated Intervention Timeline:**
- Day 1: Welcome email + getting started guide
- Day 3: If onboarding < 50%: check-in email with tips
- Day 7: Mid-trial review email
- Day 10: Upgrade prompt email (4 days before trial ends)
- Day 12: Urgent upgrade prompt (2 days before)
- Day 13: Final day reminder + discount offer (if approved)
- Day 14: Trial ended, grace period starts (2 days)
- Day 16: Module access suspended if no payment

All interventions sent via existing `convex/actions/communications/email.ts`. Tracked in `trial_interventions` table.

**Trial Extension:**
- Platform Admin extends from `/platform/tenants/[tenantId]/subscription`
- New end date selected, reason required
- School Admin notified, logged in audit trail

### CONVERSION — TRIAL TO PAID

**Self-Serve:**
1. School Admin visits `/admin/settings/billing`
2. Selects plan
3. Completes payment (M-Pesa/Airtel/Stripe/Bank)
4. Subscription activates immediately
5. CRM deal → won (if originated from CRM)
6. Platform Admin and account manager notified

**Enterprise Assisted:**
1. Account Manager creates proposal in CRM
2. School Admin receives proposal via email and in-app
3. School Admin accepts/negotiates
4. Master Admin approves custom pricing
5. Platform Admin activates Enterprise plan manually

**Post-Conversion:**
- Welcome to paid plan email + invoice sent
- Trial limitations lifted
- Additional plan modules unlocked and installed
- Account manager assigned (Pro and Enterprise)
- 30-day check-in scheduled

### OFFBOARDING / CHURN

**Cancellation Request at `/admin/settings/billing`:**
- Required cancellation reason (dropdown):
  - Too expensive
  - Missing features
  - Switching to competitor
  - School closing
  - Technical issues
  - Other
- Show what they will lose and data retention period
- Options: cancel now or cancel at renewal

**Churn Intervention:**
- Platform Admin and account manager immediately notified
- If reason = "too expensive": auto-offer 20% discount for 3 months
- If reason = "missing features": route to feature request + offer extension
- If reason = "technical issues": auto-open priority support ticket

**On Cancellation:**
- Subscription marked cancelled
- Modules suspended at period end
- School Admin notified with data export instructions
- Data retained 90 days (with 7-day final warning before purge)
- CRM deal marked churned with reason
- Recorded in `churn_records` table

---

## 9. SUBSCRIPTION PLANS & BILLING

### Plan Tiers

**FREE — KES 0/month**
- Students: up to 100
- Staff: up to 10
- Storage: 1GB
- Included modules: SIS (basic), Attendance, Basic Grading
- Support: Community only
- Custom domain: No | API access: No | White label: No

**STARTER — KES 2,500/month or KES 25,000/year**
- Students: up to 500
- Staff: up to 50
- Storage: 10GB
- Included modules: Free + Finance (basic), Library, Communications (SMS + Email)
- Support: Email (48hr response)
- Custom domain: No | API access: No | White label: No

**PRO — KES 8,000/month or KES 80,000/year**
- Students: up to 2,000
- Staff: up to 200
- Storage: 50GB
- Included modules: Starter + HR, Transport, Timetable, E-wallet, Advanced Grading, Admissions, Reports
- Support: Priority email (24hr response)
- Custom domain: Yes | API access: Read only | White label: Partial (logo only)

**ENTERPRISE — Custom pricing (negotiated)**
- Students: Unlimited | Staff: Unlimited | Storage: Unlimited
- Included modules: All platform modules + custom module development
- Support: Dedicated account manager, phone, SLA
- Custom domain: Yes | API access: Full | White label: Full
- Custom integrations: Yes | On-premise option: Yes

### Student Count Overage
- Warning at 90% of limit (in-app + email)
- Grace period: 30 days at 100%+
- After grace period: new student additions blocked (existing unaffected)
- Per-student overage charge option

### Billing Lifecycle
```
trial_active (14 days) →
  converted_to_paid → active →
    payment_due →
      payment_success → active (renewed)
      payment_failed → grace_period (7 days) →
        payment_success → active
        still_failed → suspended →
          payment_success → reactivated
          30_days_suspended → cancelled → 
            data_retention (90 days) → purged
  trial_expired_no_conversion → free_plan_downgrade
```

### Upgrade Flow
1. School Admin selects higher plan at `/admin/settings/billing`
2. Confirmation screen shows: new price in KES, new modules to be unlocked, prorated charge, new renewal date, VAT breakdown
3. Payment method selection (M-Pesa default for KE, others available)
4. On payment success:
   - Plan upgraded immediately
   - New bundle modules auto-installed
   - School Admin notified
   - Invoice generated in Convex finance tables
   - Audit log entry created

### Downgrade Flow
1. School Admin selects lower plan
2. System runs module audit:
   - Lists all installed modules above new plan tier
   - Warns about data in those modules with export option
3. Timing options: downgrade now (prorated refund) or at renewal
4. On downgrade effective date:
   - Above-plan modules suspended (data retained 90 days)
   - School Admin notified with suspended module list

### Downgrade Rules
- Cannot downgrade if student count exceeds new plan limit
- Cannot downgrade mid-year on annual plan (schedule for renewal)
- Enterprise plan changes require Master Admin approval
- Refunds processed within 7 business days

### Enterprise Negotiation Flow
1. School requests Enterprise at `/admin/settings/billing`
2. Fills in: expected student count, required modules, special requirements
3. Goes to Master Admin as CRM lead
4. Master Admin configures custom plan in `/platform/tenants/[tenantId]/subscription`
5. Sets custom price, limits, modules, contract length
6. Sends proposal via in-app + email
7. School accepts/rejects
8. On acceptance: plan activated, invoice generated

---

## 10. MODULE PRICING & CURRENCY

### Pricing Authority
- **Master Admin has final authority** over all module pricing
- Publishers submit suggested prices only
- Master Admin can: accept, override, set price range, or force free
- Price changes require Master Admin approval — same review workflow as module submissions
- Publisher cannot change price without approval

### Currency Architecture
- **All prices stored in KES** in Convex as the base currency
- Display currency detected from: browser locale → school country profile → manual override
- Supported display currencies: KES, USD, GBP, EUR, UGX, TZS, RWF, ETB, NGN, ZAR, GHS
- Conversion rates fetched daily via Convex action and stored in `currency_rates` table
- Prices displayed in selected currency with KES shown alongside: `KES 2,000 (~$15)`
- Show exchange rate and last updated timestamp
- All transactions processed and stored in KES
- Currency selector in marketplace header and billing pages
- School sets preferred display currency in `/admin/settings/billing`

### Pricing Models (stored in KES)
```
free               — KES 0, no payment required
one_time           — single KES payment, permanent access
monthly            — recurring KES charge per month
annual             — recurring KES charge per year (typically 15-20% discount)
per_student_monthly — KES X × active student count per month
per_student_annual  — KES X × active student count per year
custom             — negotiated price per tenant, set by Master Admin
```

### Price Display Rules
- Always show KES price prominently
- Show converted price in brackets if different currency
- Show VAT (16% Kenya) separately
- Show total inclusive of VAT

### Global Pricing Rules (Master Admin)
- Platform commission % (default 20%)
- Maximum module price by category
- Minimum module price by category
- Free module limit per plan tier
- Trial period default (days)
- Grace period for failed payments (days)

### Per-Module Price Override (Master Admin)
- Set platform price overriding publisher suggestion
- Set revenue share % for specific module
- Price history log with reason per change

---

## 11. MARKETPLACE LIFECYCLE

### Module Status States
```
draft → pending_review → changes_requested → pending_review →
published → suspended → reinstated
                      → banned (terminal)
deprecated (still works for installed, new installs blocked)
```

### Module Access Enforcement (in order, server-side)
1. Is tenant subscription active? If not → billing page
2. Does tenant plan meet module `minimum_plan`? If not → upgrade prompt or exception request
3. Does `pilot_grants` table have an active grant for this tenant+module? If yes → allow
4. Does user role have RBAC permission to install? If not → escalation flow
5. Is module published and not suspended/banned? If not → waitlist or error
6. Payment required? → payment flow in KES with currency display

### Module Request Types

**Type 1: New Module (doesn't exist)**
- School wants a module not in marketplace
- Form: module name, description, use case, urgency, budget willing to pay
- Goes to Master Admin
- Master Admin can: forward to publishers as RFP, build internally, reject
- School notified when matching module published

**Type 2: Plan-Locked Module**
- Module exists but requires higher plan
- System shows: "This module requires the Pro plan"
- Options: "Upgrade Plan" or "Request Exception Access"
- Exception request → Master Admin reviews
- Master Admin can grant temporary or permanent exception with expiry date

**Type 3: RBAC-Restricted Module**
- Module exists, plan is sufficient, but user role can't install
- System shows: "Submit a request to your School Admin"
- Request goes to School Admin task queue in `/admin/tasks`
- School Admin can approve, reject, or partially grant
- If School Admin needs platform-level exception → escalates to Master Admin

**Type 4: Beta/Suspended Module**
- School can join waitlist
- Publisher and Master Admin see waitlist count
- Waitlisted schools notified on reinstatement

### Request Lifecycle
```
submitted → under_review →
  approved_plan_upgrade_required → plan_upgraded → module_installed
  approved_exception_granted → module_installed
  approved_forwarded_to_publisher
  rejected → school_notified_with_reason
  waitlisted → notified_when_available
```

### Install Flow
- **Free module:** install immediately → module enabled for tenant
- **Paid module:** billing confirmation → payment via M-Pesa/Airtel/Stripe/Bank → on success → module installed
- **Per-student pricing:** system calculates cost from active student count → confirm → payment → install

### Install States
```
not_installed → install_requested → payment_pending →
installing → active → suspended → uninstalled
```

### Uninstall Flow
1. Admin clicks uninstall at `/admin/modules`
2. Warning: data implications, active users, billing impact
3. Confirm → module deactivated for tenant
4. Data retained 30 days then purged (configurable by Master Admin)
5. If paid: cancellation processed, prorated refund if applicable

### Reviews System
- Only School Admins with module installed and active 14+ days can review
- One review per tenant per module (can update anytime)
- Review fields: rating (1-5), title, body
- Verified install badge shown automatically
- Publisher can reply to reviews (shown publicly)
- Moderation: Master Admin can approve, flag, delete any review
- Publisher can flag a review for moderation

### Flagging System
- School Admin can flag from `/admin/marketplace/[moduleId]`
- Reasons: Misleading description, Not working as advertised, Inappropriate content, Security concern, Pricing dispute

**Flag Lifecycle:**
```
flagged → under_investigation →
  resolved_no_action
  resolved_warning_issued
  resolved_module_suspended
  resolved_module_banned
```

Master Admin reviews all flags at `/platform/marketplace/flags`. Publisher notified and given chance to respond. Resolution logged with admin notes.

### RBAC for Marketplace Actions
| Action | MA | SA | PM | School Admin | Principal | Publisher | Teacher |
|---|---|---|---|---|---|---|---|
| Submit module | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Approve module | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ban module | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Install module | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Configure module | ✅ | ✅ | ❌ | ✅ | ✅ (limited) | ❌ | ❌ |
| Request module | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ (to admin) |
| Review module | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Flag module | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Grant plan exception | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve publisher | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ban publisher | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage payouts | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ (own) | ❌ |

---

## 12. DEVELOPER PORTAL

### Publisher Registration
- Apply at `/platform/marketplace/developer`
- Fields: company name, contact, website, tax ID, bank details for payouts
- Master Admin reviews and approves/rejects
- Approved publishers get `publisher_id` and developer portal access

### Publisher Tiers
- **indie:** Default for new publishers, standard revenue share
- **verified:** Verified business, improved revenue share, priority review
- **enterprise:** Top publishers, negotiated revenue share, dedicated support

### Developer Portal Pages

**`/platform/marketplace/developer` — Overview Dashboard**
- Stats from Convex: total installs, active installs, revenue MTD/lifetime, avg rating, recent activity
- Module list with status and quick actions
- Pending payout balance
- Unresolved support tickets count

**`/platform/marketplace/developer/modules` — Module List**
- All submitted modules
- Filter by status: draft, pending, published, deprecated, suspended, banned
- Per module: name, status, version, installs, rating, revenue, last updated
- Actions: edit, submit new version, deprecate, view analytics, view reviews, view flags

**`/platform/marketplace/developer/modules/create` — Submit Module**

Required fields:
- Name, slug (auto-generated, editable), tagline
- Category (multi-select): Academic, Finance, HR, Communications, Transport, Library, E-commerce, E-wallet
- Long description (rich text)
- Feature list (add/remove items)
- Supported roles (which panels the module affects)
- Minimum EduMyles plan required: Free, Starter, Pro, Enterprise
- Pricing model and suggested price in KES
- Screenshots (up to 10 via UploadThing)
- Demo video URL
- Documentation URL
- Support email
- Changelog
- Terms of service URL, Privacy policy URL
- Webhook URL (platform POSTs install/uninstall/payment events)
- Required permissions declaration (what data the module accesses)
- Compatible modules list
- Incompatible modules list

**`/platform/marketplace/developer/modules/[moduleId]/edit`** — Edit Module

**`/platform/marketplace/developer/modules/[moduleId]/versions` — Version Management**
- List all versions with status and submission date
- Submit new version with changelog
- Mark version as deprecated
- Roll back to previous version
- Each version independently reviewed

**`/platform/marketplace/developer/modules/[moduleId]/analytics` — Analytics**
- Install trend chart (daily/weekly/monthly toggle)
- Uninstall rate and active vs churned installs
- Revenue over time
- Geographic breakdown (country/region)
- School size breakdown (small/medium/large by student count)
- Conversion rate: marketplace views → installs

**`/platform/marketplace/developer/modules/[moduleId]/reviews` — Reviews**
- All reviews for this module from Convex
- Reply to reviews (shown publicly)
- Flag reviews for moderation

**`/platform/marketplace/developer/support` — Support Tickets**
- All tickets across all publisher's modules
- Status: open, in_progress, resolved, closed
- Priority: low, medium, high, critical
- SLA timer (based on publisher tier)
- Reply thread per ticket
- Escalate to Master Admin

**`/platform/marketplace/developer/payouts` — Payouts**
- Payout history from Convex
- Pending balance breakdown per module
- Revenue share breakdown (gross, platform cut, net)
- Download payout statements as PDF
- Bank account management
- Tax document downloads

**`/platform/marketplace/developer/webhooks` — Webhook Logs**
- All webhook events sent to publisher URL
- Status: delivered, failed, retrying
- Retry failed webhooks manually
- View full payload per event

**`/platform/marketplace/developer/api-keys` — API Keys**
- Generate, rotate, revoke API keys
- Used to verify webhook authenticity

---

## 13. PILOT GRANTS

### What is Pilot Access
Master Admin grants any tenant access to any module for free for a defined period. Used for:
- Onboarding new schools to demonstrate value
- Beta testing with selected schools
- Partnership deals
- Promotional campaigns
- Compensating schools for issues/downtime
- NGOs and academic institutions
- Strategic market entry in new regions

### Grant Types
- `free_trial` — full access, no payment, auto-expires
- `free_permanent` — never charged (NGO, partner, internal use) — Master Admin only
- `discounted` — reduced price set by Master Admin (e.g. 50% off)
- `plan_upgrade` — access to higher plan module without upgrading plan
- `beta_access` — access to unreleased or beta modules

### Grant Configuration
Fields when creating a grant:
- Module(s) to grant (multi-select)
- Grant type
- Start date
- End date (or indefinite for free_permanent)
- Reason / internal note
- Discount percentage (for discounted type)
- Custom price in KES (for discounted type)
- Notify school: yes/no
- Stealth mode: school sees module as available without knowing it's a grant

### Pilot Grant Lifecycle
```
granted → active →
  expiry_warning_sent (30 days, 14 days, 7 days, 1 day before) →
  expired →
    auto_convert_to_paid (if school accepts and has payment method) →
    auto_suspend (if no payment) →
  extended (Master Admin manually extends) →
  revoked (Master Admin removes early)
```

### Pilot Grant Rules
- School cannot uninstall and reinstall to reset trial (first install date tracked)
- Multiple pilots can stack (different modules)
- One pilot per module per tenant at a time
- Pilot grants override plan restrictions
- When pilot expires: module suspended until school upgrades or pays

### Expiry Notifications (via existing communications system)
- 30 days before: email + in-app to School Admin
- 14 days before: email + in-app
- 7 days before: email + in-app + SMS
- 1 day before: email + in-app + SMS
- On expiry: email + in-app explaining suspension and next steps

### Pilot Grants Dashboard `/platform/marketplace/pilot-grants`
- All active, expired, upcoming grants
- Filter by: tenant, module, grant type, expiry date
- Stats: total active, expiring this week, conversion rate (pilots → paid)
- Bulk grant: select multiple tenants, grant same module
- Export pilot grant report

---

## 14. MASTER ADMIN PORTAL

### Dashboard `/platform`

**Header Stats Bar (real-time from Convex):**
Total Tenants | Active Tenants | Tenants in Trial | Tenants Suspended | Total Students | Total Staff | Total Revenue KES | MRR KES | Active Modules | Pending Reviews | Open Flags | Open Support Tickets

**Platform Health Panel:**
- Convex deployment status
- API response time (avg last 24hrs)
- Error rate
- Active sessions count
- Failed payments last 7 days
- Webhook delivery success rate
- SMS/Email/Push delivery rates

**Revenue Overview:**
- MRR and ARR in KES with charts
- Revenue by plan, by module (top 10), by payment provider
- Pending publisher payouts, overdue invoices

**Tenant Overview:**
- New tenants this month, churned this month
- Trial conversion rate %, plan distribution chart
- Tenants by country map
- Tenants approaching student limit (flagged)
- Tenants with failed payments (action required)

**Marketplace Overview:**
- Pending submissions count, modules published this month
- Most installed and highest rated modules
- Flagged modules, active pilot grants expiring this week

**Recent Activity Feed:**
- New signups, plan changes, module installs, submissions, flags, failed payments, tickets

**Quick Actions:**
- Create new tenant
- Grant pilot access
- Review pending modules
- Process pending payouts
- View security alerts
- Impersonate tenant

### Tenant Management

**`/platform/tenants` — Tenant List:**
- Search by name, domain, email, country
- Filter by: plan, status, country, student count range, signup date range
- Columns: name, domain, plan, status, students, MRR, signup date, last active
- Bulk actions: suspend, send email, export

**`/platform/tenants/[tenantId]` — Tenant Detail (tabbed):**

*Overview Tab:* School info, contact details, account status, plan, student/staff/storage usage, account manager, created date, last login.

*Subscription Tab:* Current plan, billing history, payment method, next payment, proration calculator, manual plan override, custom pricing, extend trial, pause/cancel subscription.

*Pilot Grants Tab:* All active and historical grants, add/extend/revoke grants.

*Modules Tab:* All installed modules, enable/disable any module, grant out-of-plan access, force uninstall, install history.

*Users Tab:* All users in tenant, filter by role, view profiles, impersonate any user, reset passwords, suspend/change roles, activity logs.

*Finance Tab:* All invoices, payments, outstanding balance, manually mark paid, issue credit notes/refunds/waivers, download PDFs.

*Communications Tab:* Send direct message, view all comms sent to tenant, bulk announce to all users, SMS and email logs.

*Audit Log Tab:* Every action in this tenant, filter by user/action/date, export.

*Settings Tab:* Custom domain, white label, API access, webhooks, feature flags, data retention, GDPR export, delete tenant.

### User Management

**`/platform/users` — User List:**
- Search by name, email, role, tenant
- Filter by: role, status, tenant, country, signup date
- Bulk actions: suspend, reset password, export

**`/platform/users/[userId]` — User Detail:**
- Full profile, role and tenant
- Active sessions with device/IP
- Kill all sessions, activity log
- Impersonate button
- Suspend/delete

**`/platform/impersonation` — Impersonation Tool:**
- Search for any tenant or user
- Reason required before starting
- Time limit (default 2 hours, configurable)
- Banner shown during impersonation: "You are impersonating [name] at [school]"
- Exit button
- All actions during impersonation audit-logged
- Cannot impersonate another Master Admin

### Marketplace Management

**`/platform/marketplace` — Dashboard:**
Total published modules, total installs, marketplace revenue KES, platform share earned, pending review count, active flags.

**`/platform/marketplace/admin` — Review Queue:**
- Pending submissions sorted by date (oldest first)
- Assign reviewer
- Review detail: metadata, screenshots, feature claims, pricing, publisher history, automated content scan, reviewer notes
- Actions: Approve, Reject with reason, Request Changes, Flag for further review
- Bulk approve/reject

**`/platform/marketplace/[moduleId]` — Module Detail:**
- Full info, all versions, install stats, revenue stats
- Publisher info and history
- Reviews with moderation controls
- Flags with investigation status
- Pricing history
- Actions: Edit any field, Override price, Feature/Unfeature, Suspend, Reinstate, Ban, Force update all tenants

**`/platform/marketplace/pricing` — Pricing Control:**
- Global rules: commission %, max/min prices by category, free module limits
- Per-module price override with history
- Currency management: supported currencies, exchange rate config, manual override, force refresh

**`/platform/marketplace/flags` — Flags:**
- All active flags, filter by module/reason/status/date
- Flag detail with timeline, publisher response, admin notes
- Actions: Dismiss, Issue warning, Suspend module, Ban module

**`/platform/marketplace/reviews` — Reviews Moderation:**
- All reviews across all modules
- Actions: Approve, Flag, Delete, Hide

**`/platform/marketplace/pilot-grants` — Pilot Grants:**
- Full pilot grants dashboard with bulk actions
- Conversion funnel: granted → active → converted/lapsed

**`/platform/marketplace/publishers` — Publisher Management:**
- List with stats per publisher
- Registration queue for pending applications
- Bulk actions

**`/platform/marketplace/publishers/[publisherId]` — Publisher Detail:**
- Overview, Modules, Payouts, Revenue Share, Support Tickets tabs
- Change publisher tier, revenue share %
- Suspend/Ban publisher
- Send warning, add internal note, assign account manager

### Billing Management

**`/platform/billing` — Dashboard:**
MRR, ARR, revenue by plan chart, new/churned subscriptions this month, net revenue retention %, trial conversion rate, outstanding invoices.

**`/platform/billing/plans` — Plan Configuration:**
- Edit plan details (price, limits, modules, features)
- Activate/deactivate plans (deactivated grandfathered for existing tenants)
- Create new plan, set default for signups

**`/platform/billing/invoices` — Invoice Management:**
- All invoices across all tenants
- Filter by: tenant, status, provider, date range, amount
- Mark paid, void, refund, download PDF, create manual invoice

**`/platform/billing/subscriptions` — Subscription Overview:**
- All subscriptions with upcoming renewals, grace period, suspended

**`/platform/billing/reports` — Revenue Reports:**
- MRR movement (new, expansion, contraction, churn)
- Revenue by country, plan, payment provider
- Cohort analysis, publisher payout report, VAT report

### Platform Settings `/platform/settings`

All settings stored in `platform_settings` Convex table as key-value. Sensitive values encrypted. All changes audit-logged.

*General:* Platform name, logo, favicon, support contact, timezone, language, date/number format.

*Branding:* Primary/secondary colors, login page, email header, SMS sender name.

*Domain:* Primary domain, wildcard subdomain pattern (`*.edumyles.co.ke`), custom domain SSL.

*Email:* Resend API key, from name/email, reply-to, tracking, bounce handling, test form.

*SMS:* Africa's Talking API key, sender ID, fallback, test form, usage stats.

*Push:* Expo push access token, test form, icon/color.

*Payment Providers:*
- M-Pesa Daraja: Consumer Key/Secret, Business Short Code, Passkey, Callback URL, sandbox/production toggle, test form
- Airtel Money: Client ID/Secret, Merchant ID, toggle, test form
- Stripe: Publishable Key, Secret Key, Webhook Secret, toggle, test form
- Bank Transfer: Bank name, account name/number, branch, SWIFT/IBAN
- General: VAT rate (default 16%), invoice prefix, numbering, footer, logo

*Security:* Password policy, session timeout, max login attempts, lockout duration, MFA enforcement per role, IP whitelist, rate limiting, CORS, CSP.

*Data & Privacy:* Retention periods (audit logs, sessions, deleted data), GDPR export format, cookie consent, privacy policy/terms URLs.

*Integrations:* WorkOS config, Sentry DSN, OAuth apps (Google, GitHub), Slack webhook for internal alerts.

*Maintenance:* Maintenance mode toggle, message, scheduled windows, bypass IPs.

### Feature Flags `/platform/feature-flags`
- Enable/disable features platform-wide
- Enable/disable per tenant (override)
- A/B test flags with percentage rollout
- Flag history log

### Communications `/platform/communications`

**Broadcast `/platform/communications/broadcast`:**
- Target: all tenants, specific plan tier, specific country, specific tenants, all publishers
- Channels: in-app, email, SMS (critical only)
- Schedule or send immediately
- Preview before sending, broadcast history

**Email Templates:**
- Edit all transactional templates
- Variables reference per template
- Preview with sample data, test send

### Analytics `/platform/analytics`
- DAU/MAU, sessions per day, average session duration
- Feature usage heatmap, most used modules/features
- Error rate trends, API usage stats
- Business metrics: growth rate, churn, LTV, CAC, NPS
- Custom reports `/platform/scheduled-reports`

### Security `/platform/security`
- Failed login attempts, suspicious activity alerts
- Active admin sessions, recent impersonation sessions
- API key usage anomalies, rate limit hits

**Audit Log `/platform/audit`:**
- Every action across entire platform
- Filter by user, tenant, action type, date range, IP
- Export, flag suspicious entries, detailed view with before/after state

### API Keys `/platform/api-keys`
- Platform-level API keys
- Create, rotate, revoke, usage stats, permission scopes, IP restrictions

### Webhooks `/platform/webhooks`
- Outbound webhook endpoints
- Select events, delivery logs, retry, test

### CRM `/platform/crm`

**Leads `/platform/crm/leads`:**
- Pipeline: new → contacted → demo_scheduled → demo_completed → trial_requested → trial_active → proposal_sent → negotiating → won/lost
- Lead fields: school info, contact, country, student count, source, assigned manager
- Qualification score, activity log per lead

**Deal Detail `/platform/crm/[dealId]`:**
- Full deal info, value in KES, expected close, stage history, notes, tasks, link to create tenant on close

**Proposals `/platform/crm/proposals`:**
- Proposal builder: select plan or custom config, custom line items, validity period, terms
- Preview as PDF, send via email
- Track open/accepted/rejected, convert to subscription on accept

### Knowledge Base `/platform/knowledge-base`
- Create/edit/publish articles with rich text editor
- Categories, tags, visibility (public/tenants/staff)
- SEO fields, related articles, file attachments

### SLA Management `/platform/sla`
- Configure SLA tiers per support plan
- Business hours, escalation rules
- Dashboard: breaching tickets, at-risk tickets, compliance rate, avg response/resolution times

### Staff Performance `/platform/staff-performance`
- All platform staff with metrics: reviews completed, avg review time, tickets resolved, response time
- Individual staff detail `/platform/staff-performance/[staffId]`

### Tenant Success `/platform/tenant-success`
- All tenants in trial with health scores
- Engagement metrics, last login, modules configured, students added
- Risk score: low/medium/high
- Quick actions: extend trial, send message, grant pilot

---

## 15. SCHOOL ADMIN PORTAL

### Dashboard `/admin`
- Live data from Convex: student count, staff count, pending fees, attendance rate, recent activity
- Quick actions: add student, add staff, create invoice, send announcement

### Students `/admin/students`
- Searchable, filterable student list
- `/admin/students/create` — individual student creation
- `/admin/students/import` — CSV bulk import
- `/admin/students/[studentId]` — full student profile with: personal info, academic records, attendance, fees, assignments, timetable, parent links

### Staff `/admin/staff`
- Staff list with roles and departments
- `/admin/staff/create` — add staff member
- `/admin/staff/[staffId]` — staff detail with assignments, performance, payroll, leave

### Classes `/admin/classes`
- Class list with teacher assignments
- `/admin/classes/create` — create class
- `/admin/classes/[classId]` — class detail: students list, subjects, timetable, assignments

### Academics `/admin/academics`
- Overview of academic activity
- `/admin/academics/exams` — exam management
- `/admin/academics/exams/create` — create exam
- `/admin/academics/exams/[examId]` — exam detail
- `/admin/academics/assignments/create` — create assignment
- `/admin/academics/reports` — academic reports

### Admissions `/admin/admissions`
- Application list with status
- `/admin/admissions/[appId]` — application detail with approve/reject/waitlist

### Finance `/admin/finance`
- Finance overview
- `/admin/finance/fees` — fee structure configuration
- `/admin/finance/invoices` — invoice list
- `/admin/finance/invoices/create` — create invoice
- `/admin/finance/invoices/[invoiceId]` — invoice detail

### HR `/admin/hr`
- HR overview
- `/admin/hr/leave` — leave management
- `/admin/hr/payroll` — payroll processing
- `/admin/hr/performance` — performance reviews

### Library `/admin/library`
- Library dashboard
- `/admin/library/books` — book inventory
- `/admin/library/books/create` — add book
- `/admin/library/circulation` — issue/return tracking
- `/admin/library/reports` — library reports

### Transport `/admin/transport`
- Transport overview
- `/admin/transport/routes` — route management
- `/admin/transport/routes/create` — create route
- `/admin/transport/tracking` — live vehicle tracking

### Timetable `/admin/timetable`
- Timetable overview
- `/admin/timetable/schedule` — schedule view
- `/admin/timetable/assignments` — teacher-subject assignments
- `/admin/timetable/events` — school events
- `/admin/timetable/events/create` — create event

### E-wallet `/admin/ewallet`
- Wallet overview
- `/admin/ewallet/wallets` — all student wallets
- `/admin/ewallet/transactions` — transaction history

### E-commerce `/admin/ecommerce`
- Store overview
- `/admin/ecommerce/products` — product list
- `/admin/ecommerce/products/create` — create product
- `/admin/ecommerce/orders` — order management

### Communications `/admin/communications`
- Communications hub
- `/admin/communications/create` — compose message
- `/admin/communications/email` — email campaigns

### Marketplace `/admin/marketplace`
- Browse all published modules with filters and search
- Featured modules section
- `/admin/marketplace/[moduleId]` — module detail with install/uninstall (plan and RBAC enforced)
- `/admin/marketplace/requests` — all module requests with full lifecycle

### Modules `/admin/modules`
- All installed modules with enable/disable toggles
- Module version and last updated

### Settings `/admin/settings`
- `/admin/settings/billing` — plan management with upgrade/downgrade
- `/admin/settings/modules` — module configuration
- `/admin/settings/modules/[moduleId]` — per-module settings with role permissions
- `/admin/settings/roles` — role configuration

### Other
- `/admin/reports` — report generation
- `/admin/security` — security settings
- `/admin/audit` — audit log viewer
- `/admin/notes` — internal notes
- `/admin/tasks` — task queue (including module requests from staff)
- `/admin/tickets` — support tickets
- `/admin/users` — user management
- `/admin/users/invite` — invite users
- `/admin/profile` — admin profile

---

## 16. PORTAL ADMIN

Operational slices for non-School-Admin staff.

- `/portal/admin` — overview dashboard
- `/portal/admin/finance` — finance operations
- `/portal/admin/finance/fees` — fee collection
- `/portal/admin/hr` — HR operations
- `/portal/admin/hr/payroll` — payroll view
- `/portal/admin/hr/contracts` — contracts
- `/portal/admin/hr/dashboard` — HR dashboard
- `/portal/admin/library` — library operations
- `/portal/admin/library/circulation` — issue/return
- `/portal/admin/library/dashboard` — library dashboard
- `/portal/admin/timetable` — timetable view
- `/portal/admin/timetable/builder` — timetable builder
- `/portal/admin/communications` — send communications

---

## 17. TEACHER PORTAL

- `/portal/teacher` — dashboard with classes, assignments, today's schedule
- `/portal/teacher/classes` — list of assigned classes
- `/portal/teacher/classes/[classId]` — class detail
- `/portal/teacher/classes/[classId]/grades` — grade entry
- `/portal/teacher/gradebook` — full gradebook
- `/portal/teacher/assignments` — assignment management
- `/portal/teacher/assignments/create` — create assignment
- `/portal/teacher/attendance` — attendance marking
- `/portal/teacher/timetable` — personal timetable
- `/portal/teacher/communications` — messaging
- `/portal/teacher/notifications` — notifications (wired to Convex)
- `/portal/teacher/profile` — profile management

---

## 18. STUDENT PORTAL

- `/portal/student` — dashboard
- `/portal/student/assignments` — assignment list
- `/portal/student/assignments/[assignmentId]` — assignment detail and submission
- `/portal/student/attendance` — attendance history
- `/portal/student/grades` — grade view
- `/portal/student/report-cards` — report card downloads
- `/portal/student/timetable` — class schedule
- `/portal/student/wallet` — e-wallet balance
- `/portal/student/wallet/topup` — add funds
- `/portal/student/wallet/send` — transfer funds
- `/portal/student/wallet/transactions` — transaction history
- `/portal/student/communications` — messaging
- `/portal/student/notifications` — notifications (wired to Convex)
- `/portal/student/profile` — profile management

---

## 19. PARENT PORTAL

- `/portal/parent` — dashboard
- `/portal/parent/children` — list of linked children
- `/portal/parent/children/[studentId]` — child overview
- `/portal/parent/children/[studentId]/assignments` — child assignments
- `/portal/parent/children/[studentId]/attendance` — child attendance
- `/portal/parent/children/[studentId]/grades` — child grades
- `/portal/parent/children/[studentId]/timetable` — child timetable
- `/portal/parent/announcements` — school announcements (dedicated announcements query, not notification proxy)
- `/portal/parent/fees` — fee balances
- `/portal/parent/fees/pay` — payment interface (all payment methods)
- `/portal/parent/fees/history` — payment history
- `/portal/parent/payments` — all payments
- `/portal/parent/messages` — messaging
- `/portal/parent/communications` — communications hub
- `/portal/parent/notifications` — notifications (wired to Convex)
- `/portal/parent/profile` — profile management
- `/portal/parent/dashboard/enhanced` — enhanced dashboard view

---

## 20. ALUMNI PORTAL

- `/portal/alumni` — dashboard
- `/portal/alumni/directory` — alumni directory
- `/portal/alumni/events` — alumni events
- `/portal/alumni/transcripts` — transcript requests
- `/portal/alumni/notifications` — notifications (wired to Convex)
- `/portal/alumni/profile` — profile management

---

## 21. PARTNER PORTAL

- `/portal/partner` — dashboard
- `/portal/partner/dashboard` — detailed dashboard
- `/portal/partner/students` — sponsored students list
- `/portal/partner/students/[studentId]` — student detail
- `/portal/partner/reports` — performance reports
- `/portal/partner/payments` — payment history
- `/portal/partner/messages` — messaging
- `/portal/partner/notifications` — notifications (wired to Convex)
- `/portal/partner/profile` — profile management

---

## 22. MOBILE APP

### Implemented Screens
- `LoginScreen` — browser-assisted WorkOS login
- `DashboardScreen` — role-aware dashboard
- `AssignmentsScreen`
- `AttendanceScreen`
- `FeesScreen`
- `GradesScreen`
- `ProfileScreen`

### Technical Setup
- Convex wired via `mobile/src/lib/convexApi.ts`
- Offline sync via `mobile/src/hooks/useOfflineSync.ts`
- Auth via browser-assisted login (`mobile/src/screens/LoginScreen.tsx`)
- Metro config: `mobile/metro.config.js` — `watchFolders` merged with Expo defaults
- EAS project: `mylescorp-technologies/edumyles`
- EAS config: `mobile/eas.json`
- Build workflow: `mobile/.eas/workflows/build-and-submit.yml`
- Build command: run from `mobile/` directory — `eas build --profile development --platform android`

### Panel Coverage
- Student: partial coverage (screens above)
- Parent: partial coverage
- Teacher: partial coverage
- School Admin / Platform Admin / Alumni / Partner: web-only

### Push Notifications
- Expo push action at `convex/actions/communications/push.ts`
- Notification icon at `mobile/assets/notification-icon.png`

---

## 23. COMMUNICATIONS SYSTEM

### Channels
| Channel | Provider | Status | Implementation |
|---|---|---|---|
| SMS | Africa's Talking | ✅ | `convex/actions/communications/sms.ts` |
| Email | Resend + React Email | ✅ | `convex/actions/communications/email.ts` |
| In-app | Convex notifications | ✅ | Notification create/mark-read flows |
| Push | Expo Push | ✅ | `convex/actions/communications/push.ts` |

### Notification Events (must trigger notifications)

**Tenant events:** new module installed, module update available, module suspended, payment failed, payment successful, trial expiring (days 1/3/7/10/12/13/14), plan changed, new announcement.

**Pilot grant events:** grant activated, expiry warnings (30/14/7/1 days before), grant expired, grant extended, grant revoked.

**Marketplace events:** module review submitted, module approved/rejected, module flagged, publisher new install, publisher new review, publisher flag.

**Support events:** new ticket opened, ticket reply, ticket resolved, ticket escalated.

**All notification pages** across student, parent, teacher, alumni, and partner portals must be wired to real Convex notification queries and mark-read mutations. No static shells.

### Announcements
- Parent announcements must use a **dedicated announcements query/model** — not the notifications proxy
- School announcements stored in `announcements` table with: tenantId, title, body, target_roles, created_by, published_at

---

## 24. PAYMENT INTEGRATION

### Provider Status
| Provider | Initiation | Webhook | Ledger Posting | Notes |
|---|---|---|---|---|
| M-Pesa Daraja | ✅ | ✅ | ✅ | Strongest payment path |
| Airtel Money | ✅ | ✅ | ✅ | Shares finance reconciliation |
| Stripe | ✅ | ✅ | ⚠️ | Webhook reconciliation bug |
| Bank Transfer | ✅ | Manual | ✅ | Manual review flow |

### Stripe Reconciliation Bug (CRITICAL)
**Problem:** Pending callbacks stored against Checkout Session IDs. Some webhooks arrive on Payment Intent IDs. Successful payments fail to match pending records.

**Fix required:**
1. When initiating Stripe payment: persist BOTH `checkout_session_id` AND `payment_intent_id`
2. Webhook handler must reconcile against either field
3. Update ledger posting in `convex/modules/finance/mutations.ts` accordingly
4. Provider actions in `convex/actions/payments/stripe.ts`
5. Webhooks in `frontend/src/app/api/webhooks/`

### Payment Flow (all providers)
1. Initiate payment → create pending record in Convex with all IDs
2. Provider processes payment
3. Webhook received → match to pending record → update status
4. On success: post to student finance ledger, create invoice, send receipt
5. On failure: send notification, start grace period if subscription payment

### Payment Posting
All payments post to student finance records via `convex/modules/finance/mutations.ts`.

---

## 25. CONVEX DATABASE SCHEMA

All tables defined in `convex/schema.ts`. Never create tables outside of schema.ts. Always check existing tables before adding new ones.

### Core Platform Tables

```typescript
// Tenants
tenants: {
  name, slug, domain, customDomain, country, region, address, website,
  logoUrl, schoolType, timezone, displayCurrency, academicYearStart,
  termStructure, themeColor, status, createdAt, accountManagerId
}

// Platform Users (staff operating EduMyles)
platform_users: {
  userId, // WorkOS user ID
  role: "master_admin" | "super_admin" | "platform_manager" |
        "support_agent" | "billing_admin" | "marketplace_reviewer" |
        "content_moderator" | "analytics_viewer",
  department, addedPermissions, removedPermissions,
  status: "active" | "suspended",
  accessExpiresAt, invitedBy, acceptedAt, lastLogin
}

platform_user_invites: {
  email, role, department, addedPermissions, removedPermissions,
  accessExpiresAt, invitedBy, token, status, expiresAt, acceptedAt,
  notifyInviter, personalMessage
}

platform_settings: {
  key, value, updatedBy, updatedAt
}

feature_flags: {
  key, enabledGlobally, enabledTenantIds, rolloutPct, updatedBy
}

maintenance_windows: {
  startAt, endAt, reason, affectsTenants, bypassIps
}
```

### Auth & Users

```typescript
users: {
  tenantId, workosUserId, email, firstName, lastName, role, status,
  avatarUrl, phone, timezone, language, lastLogin, createdAt
}

sessions: {
  userId, tenantId, deviceInfo, ipAddress, lastActive, expiresAt
}
```

### Onboarding & Waitlist

```typescript
waitlist: {
  fullName, email, schoolName, country, studentCount, phone,
  referralSource, biggestChallenge,
  status: "waiting" | "invited" | "converted" | "rejected",
  invitedAt, convertedAt, crmLeadId, inviteToken, inviteExpiresAt
}

tenant_invites: {
  email, tenantId, role, invitedBy, token,
  status: "pending" | "accepted" | "expired" | "revoked",
  expiresAt, acceptedAt, personalMessage
}

tenant_onboarding: {
  tenantId, wizardCompleted, wizardCompletedAt,
  steps: {
    schoolProfile, rolesConfigured, staffAdded, studentsAdded,
    classesCreated, modulesConfigured, portalCustomized,
    parentsInvited, firstPaymentProcessed
    // each: { completed, completedAt, count? }
  },
  healthScore, // 0-50, computed
  lastActivityAt, stalled, assignedAccountManager
}

trial_interventions: {
  tenantId,
  interventionType: "email" | "in_app" | "sms" | "call_scheduled",
  trigger: "day_1" | "day_3" | "day_7" | "day_10" | "day_12" | "day_13" | "day_14",
  sentAt, opened, clicked
}

churn_records: {
  tenantId, cancellationReason, cancellationDetail, cancelledBy,
  effectiveDate, retentionOfferMade, retentionOfferAccepted,
  dataExportRequested, dataPurgeDate, crmDealId
}
```

### Subscriptions & Billing

```typescript
subscription_plans: {
  name: "free" | "starter" | "pro" | "enterprise",
  priceMonthlyKes, priceAnnualKes, studentLimit, staffLimit, storageGb,
  includedModuleIds, maxAdditionalModules,
  apiAccess: "none" | "read" | "read_write",
  whiteLabel: "none" | "logo" | "full",
  customDomain, supportTier, slaHours, isActive, isDefault
}

tenant_subscriptions: {
  tenantId, planId,
  status: "trialing" | "active" | "past_due" | "suspended" | "cancelled",
  currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd,
  studentCountAtBilling,
  paymentProvider: "mpesa" | "airtel" | "stripe" | "bank_transfer",
  paymentReference, nextPaymentDue, trialEndsAt, cancelledAt, cancellationReason
}

subscription_invoices: {
  tenantId, subscriptionId, amountKes, displayCurrency, displayAmount,
  exchangeRate, vatAmountKes, totalAmountKes,
  status: "draft" | "sent" | "paid" | "void" | "refunded",
  dueDate, paidAt, paymentProvider, paymentReference, lineItems, pdfUrl
}

subscription_plan_changes: {
  tenantId, fromPlanId, toPlanId,
  changeType: "upgrade" | "downgrade" | "custom_negotiation",
  effectiveDate, initiatedBy, prorationAmountKes, refundAmountKes,
  modulesSuspended, modulesUnlocked,
  status: "pending" | "completed" | "failed" | "scheduled"
}

tenant_usage_stats: {
  tenantId, studentCount, staffCount, storageUsedGb, recordedAt
}
```

### Currency & Pricing

```typescript
currency_rates: {
  fromCurrency, toCurrency, rate, fetchedAt
}

module_price_history: {
  moduleId, oldPriceKes, newPriceKes, changedBy, changedAt, reason
}

platform_pricing_rules: {
  category, minPriceKes, maxPriceKes, defaultRevenueSharePct
}
```

### Marketplace & Publishers

```typescript
publishers: {
  userId, companyName, email, website, status,
  tier: "indie" | "verified" | "enterprise",
  revenueSharePct, bankDetails, webhookUrl, apiKey,
  taxId, billingCountry
}

modules: {
  publisherId, name, slug, tagline, category, description,
  featureList, supportedRoles, minimumPlan, pricingModel,
  suggestedPriceKes, platformPriceKes, // platform price = authoritative
  compatibleModuleIds, incompatibleModuleIds,
  status: "draft" | "pending_review" | "changes_requested" | "published" |
          "deprecated" | "suspended" | "banned",
  isFeatured, documentationUrl, supportEmail, termsUrl, privacyUrl
}

module_versions: {
  moduleId, version, changelog,
  status: "draft" | "pending_review" | "published" | "deprecated",
  submittedAt, reviewedAt, reviewerId, reviewerNotes
}

module_assets: {
  moduleId, versionId,
  type: "screenshot" | "video",
  url, order
}

module_installs: {
  moduleId, versionId, tenantId,
  status: "install_requested" | "payment_pending" | "installing" |
          "active" | "suspended" | "uninstalled",
  installedAt, installedBy, uninstalledAt, exceptionGrantId
}

module_configs: {
  moduleId, tenantId, rolePermissions, featureFlags
}

module_exception_grants: {
  moduleId, tenantId, grantedBy, grantedAt, expiresAt, reason
}

module_requests: {
  tenantId, requestedBy,
  type: "new_module" | "plan_locked" | "rbac_restricted" | "beta_suspended",
  moduleId, // null for type=new_module
  name, description, useCase, urgencyLevel, budgetKes,
  status: "submitted" | "under_review" | "approved_plan_upgrade_required" |
          "approved_exception_granted" | "approved_forwarded" |
          "rejected" | "waitlisted",
  resolution, waitlistPosition
}

module_waitlist: {
  moduleId, tenantId, joinedAt, notifiedAt
}

module_reviews: {
  moduleId, tenantId, rating, title, body,
  status: "pending" | "approved" | "flagged" | "deleted",
  publisherReply, flaggedAt, installedDaysAtReview
}

module_flags: {
  moduleId, tenantId, flaggedBy,
  reason: "misleading_description" | "not_working" | "inappropriate" |
          "security_concern" | "pricing_dispute",
  status: "flagged" | "under_investigation" | "resolved_no_action" |
          "resolved_warning" | "resolved_suspended" | "resolved_banned",
  resolution, adminNotes, publisherResponse
}

module_payments: {
  moduleId, tenantId, amountKes, currency, displayAmount, exchangeRate,
  status: "pending" | "success" | "failed" | "refunded",
  provider, invoiceId, periodStart, periodEnd
}

module_revenue_splits: {
  paymentId, publisherAmountKes, platformAmountKes, revenueSharePct
}

module_analytics_events: {
  moduleId, tenantId, eventType, metadata, timestamp
}

module_install_stats: {
  moduleId, totalInstalls, activeInstalls, churnedInstalls, avgRating, totalRevenueKes
}
```

### Pilot Grants

```typescript
pilot_grants: {
  moduleId, tenantId,
  grantType: "free_trial" | "free_permanent" | "discounted" |
             "plan_upgrade" | "beta_access",
  discountPct, customPriceKes, startDate, endDate, // null = indefinite
  grantedBy, reason, stealthMode,
  status: "active" | "expired" | "revoked" | "extended",
  convertedToPaid, notificationsSent
}
```

### Publisher Operations

```typescript
publisher_payouts: {
  publisherId, amountKes, periodStart, periodEnd,
  status: "pending" | "processing" | "paid" | "failed",
  processedAt, bankReference
}

publisher_support_tickets: {
  publisherId, moduleId, tenantId, subject,
  status: "open" | "in_progress" | "resolved" | "closed",
  priority: "low" | "medium" | "high" | "critical",
  assignedTo, slaDueAt, resolvedAt, thread
}

publisher_webhook_logs: {
  publisherId, moduleId, eventType, payload,
  status: "delivered" | "failed" | "retrying",
  attempts, lastAttemptAt
}
```

### CRM

```typescript
crm_leads: {
  schoolName, contactName, email, phone, country, studentCount,
  budgetConfirmed, timeline, decisionMaker, source, qualificationScore,
  stage, assignedTo, dealValueKes, expectedClose,
  tenantId, // linked after conversion
  notes
}

crm_deals: {
  leadId, tenantId, valueKes, stage, proposalId, closedAt,
  status: "open" | "won" | "lost", lossReason
}

crm_proposals: {
  dealId, tenantId, planId, customItems, totalKes,
  status: "draft" | "sent" | "accepted" | "rejected" | "expired",
  sentAt, acceptedAt, validUntil, pdfUrl
}
```

### Support & Knowledge Base

```typescript
support_tickets: {
  tenantId, userId, moduleId, subject,
  status: "open" | "in_progress" | "resolved" | "closed",
  priority: "low" | "medium" | "high" | "critical",
  assignedTo, slaDueAt, resolvedAt, source
}

support_ticket_messages: {
  ticketId, senderId, body, attachments, sentAt, isInternal
}

kb_articles: {
  title, slug, body, category, tags,
  visibility: "public" | "tenants_only" | "staff_only",
  publishedAt, authorId, views, relatedArticleIds
}

platform_announcements: {
  title, body, targetPlans, targetCountries, channels,
  isCritical, startsAt, endsAt, createdBy
}
```

### Existing Module Tables (reference convex/schema.ts for current definitions)
- `students`, `staff`, `classes`, `subjects`, `assignments`, `grades`, `attendance`, `exams`
- `invoices`, `payments`, `fees`, `wallets`, `transactions`
- `leaveRequests`, `payrollRecords`, `performanceReviews`
- `books`, `borrowings`, `libraryFines`
- `routes`, `vehicles`, `tracking`
- `notifications`, `announcements`, `messages`
- `timetableSlots`, `events`
- `products`, `orders`
- `auditLogs`

### SLA

```typescript
sla_configs: {
  supportTier: "community" | "email" | "priority" | "dedicated",
  firstResponseHours, resolutionHours, businessHoursOnly, escalationRules
}
```

---

## 26. API & WEBHOOK ARCHITECTURE

### Internal API Routes (`frontend/src/app/api/`)
- `/api/webhooks/stripe` — Stripe webhook handler
- `/api/webhooks/mpesa` — M-Pesa callback
- `/api/webhooks/airtel` — Airtel Money callback
- `/api/tenant-handler` — Tenant resolution from subdomain
- `/api/auth/*` — WorkOS auth routes

### Webhook Security
- All incoming webhooks verified against provider signature
- Stripe: `stripe.webhooks.constructEvent()` with webhook secret
- M-Pesa: IP allowlist + signature verification
- All webhook events logged in Convex

### Platform Outbound Webhooks
- Configurable endpoints at `/platform/webhooks`
- Events: tenant.created, tenant.suspended, module.installed, module.uninstalled, payment.success, payment.failed, subscription.changed
- HMAC signature on each payload
- Retry with exponential backoff on failure (up to 3 attempts)
- Delivery logs visible in platform

### Publisher Webhooks
- Publisher-configured URL at developer portal
- Events: install, uninstall, payment.success, payment.failed, review.new
- Same HMAC signing as platform webhooks
- Logs visible in developer portal with manual retry

---

## 27. INFRASTRUCTURE & CI/CD

### Vercel Configuration
- Root `vercel.json` must configure wildcard routing for `*.edumyles.co.ke`
- All tenant subdomains routed to Next.js app
- Tenant resolved at middleware level from hostname
- Custom domain SSL provisioned automatically

### Environment Variables
All defined in `.env.example`. Key variables:
- `NEXT_PUBLIC_CONVEX_URL` — Convex deployment URL
- `NEXT_PUBLIC_APP_URL` — Platform URL (edumyles.co.ke)
- `EXPO_PUBLIC_CONVEX_URL` — Convex URL for mobile
- `EXPO_PUBLIC_APP_ENV` — development/staging/production
- WorkOS keys, Stripe keys, M-Pesa credentials, Africa's Talking credentials, Resend API key

### GitHub Actions Workflows
- `.github/workflows/ci.yml` — lint, type-check, tests on every PR
- `.github/workflows/deploy-preview.yml` — preview deployment on PR
- `.github/workflows/deploy-production.yml` — production deployment on merge to main

### Testing
- Unit/integration: Vitest
- E2E: Playwright
- Mobile: Expo test utilities
- Run from monorepo root: `npm run test`

### Seeding
- Development seed: `convex/dev/seed.ts`
- CLI seed: `scripts/seed-cli.mjs`
- Seed command: `npm run seed:dev`

---

## 28. SECURITY REQUIREMENTS

### Server-Side Enforcement (non-negotiable)
1. Every Convex query and mutation for tenant data starts with `requireTenantContext(ctx)`
2. Every Convex query and mutation for platform data starts with `requirePlatformContext(ctx)`
3. Publisher functions use `requirePublisherContext(ctx)`
4. Role and permission checks done in Convex, never client-side only
5. All financial mutations require re-authentication or explicit confirmation

### Auth Security
- Password minimum 8 characters, complexity requirements configurable
- Maximum 5 login attempts before lockout (duration configurable)
- MFA enforced for master_admin and super_admin by default
- Session timeout on inactivity (default 60 minutes)
- IP whitelist for platform admin access (configurable)

### Audit Requirements
- Every destructive action (delete, suspend, ban) requires: confirmation dialog + reason + audit log entry
- Impersonation requires reason, time-limited, all actions during session logged separately
- Audit log retained for configurable period (default 365 days)
- Audit log entries are append-only (cannot be modified or deleted even by master_admin)

### Data Isolation Audit
The following Convex files were identified as missing tenant guards and must be fixed:
- `convex/modules/communications/email.ts`
- `convex/modules/communications/platform.ts`
- `convex/modules/communications/sms.ts`
- `convex/modules/marketplace/platform.ts`
- `convex/modules/marketplace/seed.ts`
- `convex/modules/pm/deploys.ts`
- `convex/modules/pm/epics.ts`
- `convex/modules/pm/github.ts`
- `convex/modules/pm/projects.ts`
- `convex/modules/pm/tasks.ts`
- `convex/modules/pm/timeLogs.ts`
- `convex/modules/pm/workspaces.ts`

Each must either: add `requireTenantContext` / `requirePlatformContext`, or be explicitly documented as a public/system exception.

---

## 29. IMPLEMENTATION PRIORITY ORDER

### CRITICAL — Fix First (blockers for production)

**1. Tenant Isolation**
Add `requireTenantContext` or `requirePlatformContext` to all 12 unguarded files listed above. Check every file in `convex/modules/` systematically.

**2. Server-Side Auth**
Replace client-side-only `AuthGuard`/`RoleGuard` with server-side session enforcement at Next.js middleware and layout level using WorkOS `withAuth()`.

**3. Stripe Reconciliation**
Fix webhook matching — persist both Checkout Session ID and Payment Intent ID, reconcile webhooks against either. Update `convex/modules/finance/mutations.ts`.

**4. Missing `/support/tickets` Route**
Either create the route wired to the existing tickets backend, or remove nav links from all portal nav configs.

**5. Wildcard Tenant Routing**
Configure `vercel.json` for `*.edumyles.co.ke` and align all tenant handler references to one canonical domain.

### HIGH — Complete Next

**6. Marketplace & Developer Portal**
Build complete marketplace system (school admin, platform admin, developer portal) all wired to Convex. No hardcoded data.

**7. Subscription & Billing System**
Build all 4 plan tiers, upgrade/downgrade flows, pilot grants, enterprise negotiation — all in Convex.

**8. Master Admin Portal**
Complete all platform admin pages with real Convex data. No placeholder UI.

**9. Tenant Onboarding**
Build waitlist → CRM → trial → conversion → offboarding complete pipeline.

**10. Notification Pages**
Wire all static notification shells (student, parent, teacher, alumni, partner) to real Convex notification queries.

### MEDIUM — Fill Gaps

**11. Platform Tickets Kanban/Calendar**
Build or hide the unimplemented views in `/platform/tickets`.

**12. Parent Announcements**
Replace notification proxy with dedicated announcements model and query.

**13. Student Wallet Subflows**
Complete topup, send, transactions flows.

**14. School Admin CRUD Completion**
Close gaps in students, staff, finance invoices/fees, timetable planning — validation, empty states, delete confirms, pagination throughout.

**15. Timetable Auto-Planning**
Build drag-drop timetable builder or remove the promise from the UI.

**16. HR/Library/Transport/E-commerce**
Complete CRUD across these modules.

### LOW — Polish

**17. Replace Placeholder Copy**
Remove all "not implemented yet" messages. Use feature flags to hide incomplete controls instead.

**18. Update Documentation**
Align all docs with actual implementation — mobile status, backend status, module status.

**19. npm Audit Vulnerabilities**
Run `npm audit fix` and resolve the 2 flagged vulnerabilities (1 moderate, 1 low).

**20. Internationalization**
Add locale strategy once core workflows are stable.

---

## APPENDIX A — Developer Tools

### opensrc/ (package source code for AI agents)
```
convex@1.34.1         opensrc/repos/github.com/get-convex/convex-backend/npm-packages/convex
@workos-inc/authkit-nextjs@2.15.0  opensrc/repos/github.com/workos/authkit-nextjs
stripe@18.5.0         opensrc/repos/github.com/stripe/stripe-node
resend@6.9.3          opensrc/repos/github.com/resend/resend-node
zod@3.25.76           opensrc/repos/github.com/colinhacks/zod
ai@6.0.146            opensrc/repos/github.com/vercel/ai
inngest@4.1.2         opensrc/repos/github.com/inngest/inngest-js/packages/inngest
uploadthing@7.7.4     opensrc/repos/github.com/pingdotgg/uploadthing/packages/uploadthing
expo                  opensrc/expo (various packages)
```

### .agent-skills/ (installed via autoskills)
- `vitest`, `typescript-advanced-types`, `nodejs-backend-patterns`
- `vercel-react-best-practices`, `vercel-composition-patterns`
- `next-best-practices`, `next-cache-components`, `next-upgrade`
- `playwright-best-practices`
- `turborepo`, `deploy-to-vercel`
- `building-native-ui`, `native-data-fetching`, `upgrading-expo`
- `expo-tailwind-setup`, `expo-dev-client`, `expo-deployment`
- `expo-cicd-workflows`, `expo-api-routes`, `use-dom`
- `tailwind-v4-shadcn`, `frontend-design`
- `accessibility`, `seo`, `sleek-design-mobile-apps`

### Key Helper Files
- `convex/helpers/tenantGuard.ts` — `requireTenantContext()`
- `convex/helpers/platformGuard.ts` — `requirePlatformContext()`
- `convex/helpers/authorize.ts` — authorization utilities
- `convex/helpers/auditLog.ts` — audit logging
- `convex/helpers/moduleGuard.ts` — module access checks
- `shared/src/constants/index.ts` — role constants, East African countries/currencies, curriculum codes
- `shared/src/validators/index.ts` — shared Zod validators
- `shared/src/types/index.ts` — shared TypeScript types

---

## APPENDIX B — Implementation Rules (Non-Negotiable)

1. **All data from Convex.** No hardcoded arrays, mock objects, or placeholder data anywhere in the UI.
2. **All reads via `useQuery()`.** All writes via `useMutation()`. All stats computed in Convex queries.
3. **Loading states everywhere.** Show skeleton or spinner while `useQuery` returns `undefined`.
4. **Empty states everywhere.** Reflect real empty database results — never hide or replace with placeholder content.
5. **All prices in KES** stored in Convex. Display currency converted client-side from `currency_rates` table.
6. **Tenant guards on every function.** No exceptions without explicit documentation.
7. **Zod validation on all form inputs.** Use shared validators from `shared/src/validators/index.ts` where applicable.
8. **No new npm dependencies** without discussion. Use existing packages already in the monorepo.
9. **All UI uses existing shadcn/ui components** from `frontend/src/components/ui/`.
10. **Tailwind only for styling.** No inline styles, no CSS modules, no separate CSS files.
11. **All tables paginated** using Convex pagination API.
12. **Every destructive action** requires confirmation dialog + reason + audit log entry.
13. **Match existing UI patterns.** Refer to existing implemented pages before building new ones.
14. **Reference opensrc/** when working with any of the 8 fetched packages for internals.
15. **Reference .agent-skills/** for framework best practices before starting any new feature area.
