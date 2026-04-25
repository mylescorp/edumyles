# EduMyles Pilot Implementation Backlog

Date: April 25, 2026
Purpose: Turn pilot readiness into an execution checklist before opening Wave 1 schools.

## How To Use This Backlog

- `P0` means complete before any live pilot schools are activated.
- `P1` means complete during Wave 1 or immediately after Wave 1 starts.
- `P2` means useful, but not required for the first controlled pilot.

## Launch Strategy

Recommended rollout:

1. Close all `P0` items.
2. Activate 5 to 8 schools only.
3. Track usage and support issues for 2 to 4 weeks.
4. Only then move into a larger Wave 2.

## P0: Must Ship Before Pilot

### P0.1 Production auth and invitation reliability

Outcome:
Every school admin, teacher, and parent can receive an invite and log in without manual engineering intervention.

Tasks:

- configure production WorkOS environment fully
- remove or block placeholder-org fallback in live onboarding
- verify school admin invite email delivery
- verify staff invite flow from setup wizard and staff page
- verify parent OTP flow by SMS
- verify parent OTP flow by email
- add clear UI error states for expired invite, used invite, and failed invite delivery

Success check:

- one admin, one teacher, and one parent can all complete first login in production

Relevant code:

- [frontend/src/app/api/tenants/onboard/route.ts](/C:/Users/Admin/Projects/edumyles/frontend/src/app/api/tenants/onboard/route.ts:1)
- [convex/staffInvites.ts](/C:/Users/Admin/Projects/edumyles/convex/staffInvites.ts:1)
- [convex/parentOnboarding.ts](/C:/Users/Admin/Projects/edumyles/convex/parentOnboarding.ts:1)
- [convex/modules/communications/workos.ts](/C:/Users/Admin/Projects/edumyles/convex/modules/communications/workos.ts:214)

### P0.2 End-to-end payment readiness

Outcome:
Schools can issue invoices and parents can complete and verify payments using real flows.

Tasks:

- verify live M-Pesa STK push flow
- verify M-Pesa callback updates invoice and payment records correctly
- verify Stripe checkout success and cancel handling
- verify bank transfer initiation and school-side confirmation process
- replace local-only parent payment activity with persisted backend history
- update or replace outdated payment E2E tests

Success check:

- one real invoice can be paid successfully and reflected in parent and admin views

Relevant code:

- [convex/actions/payments/mpesa.ts](/C:/Users/Admin/Projects/edumyles/convex/actions/payments/mpesa.ts:1)
- [convex/actions/payments/stripe.ts](/C:/Users/Admin/Projects/edumyles/convex/actions/payments/stripe.ts:1)
- [frontend/src/app/portal/parent/fees/pay/page.tsx](/C:/Users/Admin/Projects/edumyles/frontend/src/app/portal/parent/fees/pay/page.tsx:1)
- [frontend/src/app/api/webhooks/mpesa/route.ts](/C:/Users/Admin/Projects/edumyles/frontend/src/app/api/webhooks/mpesa/route.ts:1)
- [frontend/src/app/api/webhooks/stripe/route.ts](/C:/Users/Admin/Projects/edumyles/frontend/src/app/api/webhooks/stripe/route.ts:1)
- [e2e/payments.spec.ts](/C:/Users/Admin/Projects/edumyles/e2e/payments.spec.ts:1)

### P0.3 School data migration basics

Outcome:
Pilot schools can go live quickly without manual record-by-record entry.

Tasks:

- add staff bulk import page and backend path
- add guardian or parent bulk import option, or extend student import cleanly
- provide downloadable CSV templates for students, staff, and optionally balances
- improve import result reporting with row successes and row failures
- document the required import format for onboarding

Success check:

- a school can import sample students, staff, and guardian contacts in less than one onboarding session

Relevant code:

- [frontend/src/app/admin/students/import/page.tsx](/C:/Users/Admin/Projects/edumyles/frontend/src/app/admin/students/import/page.tsx:1)
- [frontend/src/app/admin/staff/create/page.tsx](/C:/Users/Admin/Projects/edumyles/frontend/src/app/admin/staff/create/page.tsx:1)
- [convex/modules/sis/mutations.ts](/C:/Users/Admin/Projects/edumyles/convex/modules/sis/mutations.ts:1)
- [convex/modules/hr/mutations.ts](/C:/Users/Admin/Projects/edumyles/convex/modules/hr/mutations.ts:1)

### P0.4 Pilot operations visibility

Outcome:
Your team can see which schools are blocked, inactive, or succeeding.

Tasks:

- add a pilot cohort view in platform admin
- show onboarding completion by school
- show last activity by school
- show student import count
- show staff invite sent and accepted counts
- show parent invite sent and accepted counts
- show invoice and payment activity
- show support or issue flags per school

Success check:

- you can review every pilot school in one dashboard without checking tenant-by-tenant manually

Suggested location:

- platform CRM, onboarding, or tenant success area

### P0.5 Support workflow for pilot schools

Outcome:
Pilot schools know how to get help and your team knows how to respond.

Tasks:

- add visible support entry point for school admins
- define response SLA for pilot schools
- create issue triage tags by module and severity
- create internal onboarding checklist for kickoff and weekly follow-up
- define escalation path for login, payment, and data-import issues

Success check:

- every pilot issue can be logged, assigned, and tracked within one day

## P1: High Value During Wave 1

### P1.1 Pilot metrics and weekly reporting

Outcome:
You can measure whether the pilot is actually working.

Tasks:

- weekly usage summary by school
- active users by role
- attendance sessions recorded
- invoices created
- payments completed
- parent logins
- announcements sent
- exportable pilot summary

### P1.2 Parent portal polish

Outcome:
Parents see a cleaner, more trustworthy experience.

Tasks:

- improve grade labels so subjects show names, not only raw ids
- improve attendance presentation
- add better payment confirmation and transaction visibility
- review parent navigation for first-time users

Relevant code:

- [frontend/src/app/portal/parent/children/[studentId]/grades/page.tsx](/C:/Users/Admin/Projects/edumyles/frontend/src/app/portal/parent/children/[studentId]/grades/page.tsx:1)
- [frontend/src/app/portal/parent/children/[studentId]/attendance/page.tsx](/C:/Users/Admin/Projects/edumyles/frontend/src/app/portal/parent/children/[studentId]/attendance/page.tsx:1)

### P1.3 Stronger E2E coverage for real pilot flows

Outcome:
You catch regressions before schools do.

Tasks:

- school admin onboarding smoke test
- student import smoke test
- staff invite smoke test
- parent login smoke test
- invoice creation and payment smoke test
- attendance smoke test

### P1.4 Pilot cohort onboarding kit

Outcome:
Every school gets the same high-quality launch process.

Tasks:

- kickoff checklist
- admin training guide
- teacher quick start guide
- parent onboarding instructions
- weekly feedback form

## P2: Useful But Not Required For First Pilot

### P2.1 Timetable planning enhancements

- drag-and-drop planning
- auto-scheduling improvements

Relevant code:

- [frontend/src/app/admin/timetable/page.tsx](/C:/Users/Admin/Projects/edumyles/frontend/src/app/admin/timetable/page.tsx:191)

### P2.2 Advanced exports and reporting polish

- richer PDF exports
- more polished library and module-specific reports

### P2.3 Secondary module rollout

- library
- transport
- eWallet
- eCommerce

These should come after the first pilot proves core adoption.

## Suggested Build Order

### Sprint 1

- P0.1 auth and invites
- P0.2 payment readiness

### Sprint 2

- P0.3 school data migration
- P0.4 pilot operations dashboard

### Sprint 3

- P0.5 support workflow
- P1.1 pilot metrics
- P1.3 real E2E coverage

## Go/No-Go Gate

Do not launch Wave 1 until these are true:

- admin invite tested
- teacher invite tested
- parent OTP tested
- student import tested
- staff import or equivalent import path tested
- invoice creation tested
- at least one real payment flow tested
- attendance flow tested
- pilot dashboard available
- support process documented

## Founder View

If time is tight, the true minimum set is:

1. fix auth and invites
2. verify payments
3. enable fast imports
4. add pilot dashboard
5. define support workflow

That minimum is what turns EduMyles from "demo-capable" into "pilot-capable."
