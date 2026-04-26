# EduMyles Pilot Readiness Assessment

Date: April 25, 2026
Prepared for: School pilot launch

## Executive Summary

EduMyles already has a strong pilot foundation:

- School admin dashboard and setup wizard exist.
- Core modules for students, classes, finance, academics, communications, and portals are present.
- Parent self-onboarding and parent fee payment flows exist.
- Staff invite infrastructure exists.
- Student bulk import exists.

The platform is not yet at the point where I would recommend granting a broad pilot to dozens of schools at once. It is ready for a controlled pilot cohort if the gaps below are closed first and the pilot is run with strong operational support.

## Recommendation

Start with 5 to 8 schools, not all 50 at once.

Suggested first cohort:

- 2 schools from Kiambu
- 2 schools from Kitengela
- 1 to 2 schools from Nairobi

Pick schools that are:

- responsive and founder-friendly
- willing to assign one admin champion
- able to provide student and parent data quickly
- okay with weekly feedback calls

## Must-Have Before Granting Pilot

These are the highest-priority gaps based on the current codebase.

### 1. Complete real auth and invitation setup for live schools

Why this matters:
School pilots fail quickly if admins, teachers, or parents cannot reliably receive invites and log in.

Evidence:

- [frontend/src/app/api/tenants/onboard/route.ts](/abs/path/C:/Users/Admin/Projects/edumyles/frontend/src/app/api/tenants/onboard/route.ts:89) falls back to a placeholder organization when WorkOS is not configured.
- [frontend/src/app/api/tenants/onboard/route.ts](/abs/path/C:/Users/Admin/Projects/edumyles/frontend/src/app/api/tenants/onboard/route.ts:91) explicitly warns that the admin invite email was not sent.
- [convex/modules/communications/workos.ts](/abs/path/C:/Users/Admin/Projects/edumyles/convex/modules/communications/workos.ts:214) still contains a TODO for actual email sending.

Implement before pilot:

- production WorkOS configuration
- verified invite emails for school admins
- tested staff invite acceptance
- tested parent OTP flow by SMS and email

### 2. Lock down payment flows end to end

Why this matters:
If fee payment is part of the pitch, it must work consistently with real callbacks, reconciliation, and parent-facing confirmations.

Evidence:

- Real M-Pesa and Stripe actions exist, but they depend on production env configuration.
- [frontend/src/app/portal/parent/fees/pay/page.tsx](/abs/path/C:/Users/Admin/Projects/edumyles/frontend/src/app/portal/parent/fees/pay/page.tsx:409) shows recent payment activity only from local page state, not a persisted live query.
- [e2e/payments.spec.ts](/abs/path/C:/Users/Admin/Projects/edumyles/e2e/payments.spec.ts:11) targets `/admin/payments`, but that route does not exist in the current app.

Implement before pilot:

- full live M-Pesa callback verification
- Stripe success and cancel flow verification
- bank transfer confirmation workflow for bursars
- persistent payment status tracking in parent UX
- updated E2E tests against current finance routes

### 3. Make onboarding and data migration fast for real schools

Why this matters:
Schools will not manually key in hundreds of records during pilot.

Evidence:

- Student bulk CSV import exists at [frontend/src/app/admin/students/import/page.tsx](/abs/path/C:/Users/Admin/Projects/edumyles/frontend/src/app/admin/students/import/page.tsx:292).
- There is no equivalent staff bulk import page under `frontend/src/app/admin/staff/`.

Implement before pilot:

- staff bulk import
- optional guardian or parent bulk import
- sample CSV templates for students, staff, and fee balances
- import validation report with row-by-row errors

### 4. Add an operations dashboard for pilot support

Why this matters:
During pilot you need to know which schools are stuck, inactive, or misconfigured without manually checking each tenant.

Implement before pilot:

- pilot cohort dashboard
- school health status
- onboarding progress
- last login by school admin
- student count imported
- teacher invites sent and accepted
- parent invites sent and accepted
- finance activation status
- unresolved support issues

### 5. Strengthen communication and support workflows

Why this matters:
Pilot schools will need quick help and clear escalation.

Implement before pilot:

- in-app support or help button for school admins
- support SLA and escalation workflow
- founder-facing internal checklist for onboarding calls
- issue tagging by school, severity, and module

### 6. Improve pilot reporting and success measurement

Why this matters:
You need hard proof of pilot success before conversion.

Implement before pilot:

- weekly pilot metrics export
- active users by role
- students uploaded
- invoices created
- payments completed
- attendance sessions marked
- announcements sent
- parent logins

## Important But Not Blocking for First Pilot

- drag-and-drop timetable auto-planning is not implemented yet:
  [frontend/src/app/admin/timetable/page.tsx](/abs/path/C:/Users/Admin/Projects/edumyles/frontend/src/app/admin/timetable/page.tsx:191)
- some parent academic views are functional but still basic and should be polished:
  [frontend/src/app/portal/parent/children/[studentId]/grades/page.tsx](/abs/path/C:/Users/Admin/Projects/edumyles/frontend/src/app/portal/parent/children/[studentId]/grades/page.tsx:40)
- library export is still marked "soon":
  [frontend/src/app/admin/library/reports/page.tsx](/abs/path/C:/Users/Admin/Projects/edumyles/frontend/src/app/admin/library/reports/page.tsx:95)

These should not stop a narrow pilot if your pilot promise is focused on:

- student records
- class setup
- teacher access
- parent access
- attendance
- fee invoices and payments
- school communication

## Recommended Pilot Scope

Do not pilot every module.

Pilot only these modules first:

- SIS
- Classes
- Staff invites
- Attendance
- Academics basics
- Finance and invoices
- Parent portal
- Communications

Keep these out of phase 1 unless a school specifically needs them:

- eWallet
- eCommerce
- Library
- Transport
- advanced analytics
- marketplace extras

## Pilot Go/No-Go Checklist

Only grant pilot if all of these are true:

- tenant creation works in production
- school admin invite works
- at least one teacher invite works
- at least one parent invite works
- student import works
- class setup works
- invoice creation works
- M-Pesa or bank transfer flow works live
- attendance can be marked and viewed
- at least one announcement can be sent
- support contact path is visible
- school onboarding checklist is documented
- your internal team can respond within 24 hours

## Internal Launch Rule

Grant pilot in waves:

Wave 1: 5 to 8 schools
Wave 2: 10 to 15 schools only after Wave 1 is stable
Wave 3: broader rollout after reference schools are secured
