# EduMyles — Master Admin Panel Specification v2.0

**Mylesoft Technologies Ltd** | Confidential | [www.mylesoft.com](http://www.mylesoft.com)

**Prepared by:** Jonathan Ayany (Myles), Founder, Mylesoft Technologies  
**Contact:** ayany004@gmail.com | 0743 993 715 / 0751 812 884  
**Document:** Version 2.0 — March 10, 2026  
**Platform:** edumyles.com | github.com/Mylesoft-Technologies  

> *Transforming Industries, Empowering Generations.*

---

## Document Overview

This document is the authoritative developer specification for the EduMyles Master Admin Panel (`/platform` route). It covers all 14 modules that Mylesoft staff use to run the SaaS business — from provisioning schools to collecting payments, managing support, and growing the sales pipeline. Every module is broken down into: purpose, user stories, detailed features, UI pages, Convex data schema, business rules, and routes. Treat this as ground truth for what to build.

---

## Architecture Principles (Must Follow)

**Tenant Isolation:** Every Convex query/mutation MUST call `requireTenantContext(ctx)`. `tenantId` is the first field on every tenant-scoped table and index.

**Platform vs School Routes:** `/platform/*` is for Mylesoft staff only. `/{slug}/*` is for schools. Never mix logic between them.

**RBAC Enforcement:** Every platform route must call `requirePlatformRole(ctx, [...])` on the Convex level. Never trust client-side role checks alone.

**Real-time First:** Use Convex `useQuery` for all live data. Only use HTTP actions for external webhooks (M-Pesa, Stripe).

**Audit Everything:** Every create/update/delete on platform tables must write to `platform_audit_log`. Non-negotiable.

**No Secrets in Code:** All API keys go in Convex environment variables. Never hardcode. Never commit `.env` files.

**Error Boundaries:** Every platform page must have an error boundary. Convex errors must show user-friendly messages.

**Mobile-first Responsive:** Platform panel must work on tablets. Use shadcn/ui with Tailwind responsive classes.

---

## Module Registry

| # | Module | Purpose | Primary Role | Priority |
|---|--------|---------|--------------|----------|
| 01 | Master Dashboard | KPI command centre — full platform overview | super-admin | P0 |
| 02 | Tenant Management | Provision, configure, and control school tenants | super-admin | P0 |
| 03 | Feature Flags | Toggle modules per tenant, manage plan entitlements | super-admin | P0 |
| 04 | Ticket Management | Support ticketing between schools and Mylesoft | support-agent | P0 |
| 05 | Communications | Broadcasts, campaigns, drip sequences to tenants | super-admin | P0 |
| 06 | Billing Management | Subscriptions, invoices, M-Pesa/Stripe, revenue | finance-officer | P0 |
| 07 | CRM | Sales pipeline, leads, proposals, account health | sales-rep | P1 |
| 08 | Platform Analytics | BI dashboards, adoption, geography, cohort analysis | super-admin | P1 |
| 09 | System Health | Uptime, error rates, API health, alerting | super-admin | P1 |
| 10 | Reseller / Agents | Agent portal, referrals, commissions, M-Pesa payouts | super-admin | P1 |
| 11 | Audit Log Centre | Immutable compliance log across all platform actions | super-admin | P1 |
| 12 | Data & Compliance | KDPA requests, data export, erasure, DPAs | super-admin | P2 |
| 13 | Team Management | Mylesoft staff accounts, roles, activity tracking | super-admin | P1 |
| 14 | Platform Settings | Config, SLA rules, plan definitions, integrations | super-admin | P1 |

---

## Table of Contents

- [Module 01: Master Dashboard](#module-01--master-dashboard)
- [Module 02: Tenant Management](#module-02--tenant-management)
- [Module 03: Feature Flags & Toggles](#module-03--feature-flags--module-toggles)
- [Module 04: Ticket Management System](#module-04--ticket-management-system)
- [Module 05: Communications Module](#module-05--communications-module)
- [Module 06: Billing Management](#module-06--billing-management)
- [Module 07: CRM — Sales & Onboarding](#module-07--crm--sales--onboarding)
- [Module 08: Platform Analytics & BI](#module-08--platform-analytics--bi)
- [Module 09: System Health & Monitoring](#module-09--system-health--monitoring)
- [Module 10: Reseller / Agent Management](#module-10--reseller--agent-management)
- [Module 11: Audit Log Centre](#module-11--audit-log-centre)
- [Module 12: Data & Compliance Centre](#module-12--data--compliance-centre)
- [Module 13: Team Management](#module-13--team-management)
- [Module 14: Platform Settings & Config](#module-14--platform-settings--configuration)
- [Master RBAC Permissions Matrix](#master-rbac-permissions-matrix)
- [Full Convex Schema Reference](#full-convex-schema-reference)
- [Implementation Roadmap](#implementation-roadmap)
- [Linear Issues Registry](#linear-issues-registry)

---

## MODULE 01 — MASTER DASHBOARD

*The KPI command centre — first screen every Mylesoft staff member sees on login*

### Purpose

The Master Dashboard is the home page of `/platform`. It gives real-time, at-a-glance visibility into the entire EduMyles SaaS business, consolidating metrics from all 14 modules into one screen so the team can spot issues, track growth, and make decisions without navigating to individual modules.

### User Stories

| As a... | I want to... | So that... |
|---------|-------------|-----------|
| super-admin | see total active tenants, MRR, and open tickets on one screen | I can start my day knowing the health of the business |
| super-admin | see a real-time feed of platform events | I never miss something critical happening |
| finance-officer | see revenue KPIs without accessing raw billing data | I can report to leadership quickly |
| support-agent | see my assigned tickets and SLA countdown on the dashboard | I prioritise my work without opening the ticket module |
| sales-rep | see pipeline value and deals closing this week | I know what to focus on each morning |

### KPI Widgets (Top Bar)

| Widget | Definition | Source | Visible To |
|--------|-----------|--------|-----------|
| Active Tenants | Tenants with `status=active` | Real-time Convex count | All roles |
| MRR | Sum of all active subscription monthly values | Billing module | finance-officer, super-admin |
| ARR | MRR x 12 | Computed | finance-officer, super-admin |
| Open Tickets | Tickets where `status != closed` | Ticket module | support-agent, super-admin |
| Pipeline Value | Sum of open CRM deal values (KES) | CRM module | sales-rep, super-admin |
| System Health | % of platform APIs returning 200 in last 5 min | Health module | super-admin |
| Trials Active | Tenants in trialing status | Billing | super-admin |
| New This Month | Tenants created in current calendar month | Tenant table | super-admin |

### Charts Row

| Chart | Description | Library |
|-------|------------|---------|
| MRR Trend | 12-month MRR history — new/expansion/churn breakdown. Hover for monthly detail. | Recharts LineChart |
| Tenant Growth | New tenants per month for last 12 months, coloured by plan tier | Recharts BarChart |
| Ticket Volume | Tickets created vs resolved per week, last 8 weeks | Recharts AreaChart |
| Revenue by Plan | % of MRR from each plan tier (Starter/Growth/Pro/Enterprise) | Recharts PieChart |

### Activity Feed (right sidebar)

Real-time chronological feed powered by Convex subscriptions. Max 50 items. Each event: icon, description, tenant name (clickable), timestamp. Event types:

- `[School]` New school registered — {school_name} ({plan})
- `[Payment]` Payment received — {school_name} KES {amount} via {method}
- `[Ticket]` Ticket opened — {school_name}: {ticket_title} [{priority}]
- `[Done]` Ticket resolved — {ticket_title} by {agent_name}
- `[!]` SLA breach — Ticket #{id} exceeded {priority} SLA
- `[Red]` Payment failed — {school_name} invoice #{number}
- `[Up]` Plan upgraded — {school_name} from {old_plan} to {new_plan}
- `[Exit]` Tenant suspended — {school_name} (reason: {reason})

### Quick Action Buttons

- Provision New School → opens Tenant Creation modal
- Create Ticket → opens new ticket form
- Send Broadcast → opens Communications compose screen
- Create Invoice → opens Billing invoice builder
- Add Lead → opens CRM new lead form

### Convex Queries

```typescript
export const getDashboardKPIs = query({
  handler: async (ctx) => {
    await requirePlatformRole(ctx, ["super-admin","finance-officer","support-agent","sales-rep"]);
    const [activeTenants, openTickets] = await Promise.all([
      ctx.db.query("tenants").withIndex("by_status", q => q.eq("status","active")).collect(),
      ctx.db.query("tickets").withIndex("by_status", q => q.neq("status","closed")).collect(),
    ]);
    return { activeTenants: activeTenants.length, openTickets: openTickets.length };
  }
});
```

> **DEV NOTE:** Use `Promise.all()` for parallel queries. Pre-compute KPI aggregates in `platform_kpi_cache` (refreshed every 5 min by cron) to keep dashboard under 1.5s load time.

### Routes

| Route | Description |
|-------|------------|
| `/platform` | Dashboard home — redirects to `/platform/dashboard` |
| `/platform/dashboard` | Main dashboard page |

---

## MODULE 02 — TENANT MANAGEMENT

*Provision, configure, suspend, and fully control every school on the platform*

### Purpose

Tenant Management is the operational core of the Master Admin Panel. A tenant is a single school or educational institution. Each gets its own subdomain (`{slug}.edumyles.com`), isolated Convex data, and module access based on their plan. This module handles the full tenant lifecycle: creation, configuration, monitoring, suspension, and deletion.

### Tenant Lifecycle States

| State | Description | Trigger |
|-------|------------|---------|
| provisioning | Tenant being set up — subdomain claimed, WorkOS org created, seed data loading | Auto, under 60 seconds |
| trialing | Free trial active (14 days default). Full plan access. | Auto-expires with warnings at D-7, D-3, D-1 |
| active | Paid subscription active and current | Normal operating state |
| past_due | Invoice overdue 1-14 days. Portal accessible with warning banner. | Triggers dunning sequence |
| suspended | Access blocked. School sees suspension page. Data preserved. | After 14 days past_due or manual |
| cancelled | Subscription cancelled. 30-day data retention window. | School or admin initiated |
| deleted | Data permanently deleted after retention window. | IRREVERSIBLE — super-admin only |

### Tenant List View Features

- Search by school name, slug, admin email, or phone
- Filter by: status, plan tier, county/region, school type, date range
- Sort by: created date, MRR, last login, ticket count
- Columns: School Name, Slug, Plan, Status, Students, MRR, Last Login, Created, Actions
- Export filtered list to CSV
- Bulk actions: suspend selected, send broadcast to selected, export selected
- Quick-view popover on hover — mini stats without leaving the list

### Tenant Detail Page — Tabs

| Tab | Content |
|-----|---------|
| Overview | School profile, key stats, status badge, quick actions. Shows: students, staff, storage used, last activity, health score, onboarding progress bar. |
| Modules | Modules enabled/disabled per tenant. Toggle switches. Usage stats per module (last used, record count). |
| Users | All WorkOS users under this school's org. Name, role, email, last login. Force-reset password, revoke session, deactivate user. |
| Billing | Subscription details, current invoice, payment history, plan change buttons. |
| Tickets | All tickets for this tenant. Status breakdown, open ticket list, avg resolution time. |
| Activity Log | Every action taken on this tenant's account from the platform side. Filtered audit log view. |
| Communications | All messages Mylesoft has sent to this school. Direct message send button. |
| Settings | Edit school name, slug (dangerous - requires confirmation), contact email, county, school type, logo. |

### Tenant Provisioning Flow

1. Click 'Provision New School' from Dashboard or Tenant List
2. **Step 1** — School Info: name, type, county, admin name, admin email, admin phone
3. **Step 2** — Plan and Billing: select plan, billing cycle, set trial end or skip trial
4. **Step 3** — Slug: auto-generated from school name, admin can edit. Real-time availability check.
5. **Step 4** — Modules: defaults to plan entitlements, can manually enable/disable extras
6. **Step 5** — Review and Confirm: summary before provisioning
7. System: Convex mutation creates tenant → WorkOS creates Org → subdomain claimed in Vercel → welcome email sent
8. Provisioning completes in under 60 seconds. Admin redirected to new tenant detail page.

> ⚠️ **WARNING:** Slug changes on existing tenants break all school bookmarks and login links. Require super-admin confirmation + email notification to school before executing.

### Convex Data Schema

```typescript
tenants: defineTable({
  name: v.string(),           // "Nairobi Academy"
  slug: v.string(),           // "nairobi-academy"
  workosOrgId: v.string(),
  schoolType: v.union(v.literal("primary"), v.literal("secondary"),
    v.literal("university"), v.literal("college"),
    v.literal("tvet"), v.literal("polytechnic"), v.literal("other")),
  county: v.string(),
  adminEmail: v.string(),
  adminPhone: v.string(),
  status: v.union(v.literal("provisioning"), v.literal("trialing"),
    v.literal("active"), v.literal("past_due"),
    v.literal("suspended"), v.literal("cancelled"), v.literal("deleted")),
  plan: v.union(v.literal("starter"), v.literal("growth"),
    v.literal("pro"), v.literal("enterprise")),
  billingCycle: v.union(v.literal("monthly"), v.literal("annual")),
  trialEnd: v.optional(v.number()),
  healthScore: v.optional(v.number()), // 0-100
  agentId: v.optional(v.id("agents")),
  createdAt: v.number(), updatedAt: v.number(),
})
.index("by_slug",["slug"]).index("by_status",["status"])
.index("by_plan",["plan"]).index("by_county",["county"]),
```

### Routes

| Route | Description |
|-------|------------|
| `/platform/tenants` | Tenant list — search, filter, bulk actions |
| `/platform/tenants/new` | Provision new school wizard (5 steps) |
| `/platform/tenants/[tenantId]` | Tenant detail — tabbed view |
| `/platform/tenants/[tenantId]/edit` | Edit school profile settings |

---

## MODULE 03 — FEATURE FLAGS & MODULE TOGGLES

*Granular control of what each school can access — by plan, by toggle, by flag*

### Purpose

Feature Flags give super-admins granular control over tenant access. This powers: plan-based entitlements, manual overrides (enable a paid feature for a trial school), beta rollouts (enable a new feature for 10% of tenants), and emergency killswitches (disable a broken module platform-wide without a deploy).

### Flag Types

| Type | Description | Scope |
|------|------------|-------|
| Module Toggle | Enable/disable an entire module per tenant or globally | Per-tenant or global |
| Feature Flag | Fine-grained toggle within a module (e.g. `enable_bulk_sms`) | Per-tenant or % rollout |
| Plan Entitlement | Auto-computed from `tenant.plan` — default module set per plan | Per plan tier |
| Killswitch | Disable a module for ALL tenants instantly in an emergency | Global override |
| Beta Flag | Enable a feature for a specific allowlist of tenants | Allowlist-based |

### Module Registry

| Module Key | Display Name | Min Plan | Toggle Status |
|-----------|-------------|---------|--------------|
| sis | Student Information System | All plans | Core — cannot be disabled |
| admissions | Admissions and Enrollment | All plans | Core — cannot be disabled |
| academics | Academics and Gradebook | All plans | Core — cannot be disabled |
| finance | Fee and Finance Management | Growth+ | Toggleable |
| timetable | Timetable and Scheduling | Growth+ | Toggleable |
| communications | Comms and Notifications | Growth+ | Toggleable |
| hr | HR and Payroll | Pro+ | Toggleable |
| library | Library Management | Growth+ | Toggleable |
| transport | Transport Management | Pro+ | Toggleable |
| ecommerce | eCommerce (school store) | Pro+ | Toggleable |
| ewallet | eWallet | Growth+ | Toggleable |
| hostel | Hostel/Boarding (future) | Enterprise | Toggleable |

### Business Rules

- Core modules (sis, admissions, academics) can NEVER be disabled for an active tenant
- Disabling a module hides UI and blocks API — it does NOT delete data
- On plan downgrade: modules not in new plan are auto-disabled after 7 days grace period
- A killswitch overrides all per-tenant settings — no tenant can access a killed module
- Manual overrides are flagged in billing reports as upsell opportunities

### Convex Data Schema

```typescript
tenant_modules: defineTable({
  tenantId: v.id("tenants"),
  moduleKey: v.string(),
  enabled: v.boolean(),
  overrideReason: v.optional(v.string()),
  enabledBy: v.optional(v.string()),
  enabledAt: v.optional(v.number()),
}).index("by_tenant",["tenantId"]).index("by_module",["moduleKey"]),

feature_flags: defineTable({
  key: v.string(),
  description: v.string(),
  type: v.union(v.literal("global"), v.literal("per_tenant"),
    v.literal("rollout"), v.literal("beta")),
  enabled: v.boolean(),
  rolloutPct: v.optional(v.number()),
  allowlist: v.optional(v.array(v.id("tenants"))),
  updatedBy: v.string(), updatedAt: v.number(),
}).index("by_key",["key"]),
```

### Routes

| Route | Description |
|-------|------------|
| `/platform/settings/flags` | Global feature flags — list, toggle, configure |
| `/platform/tenants/[tenantId] > Modules` | Per-tenant module toggles (tab in Tenant Detail) |

---

## MODULE 04 — TICKET MANAGEMENT SYSTEM

*End-to-end support ticketing between schools and Mylesoft staff with full SLA enforcement*

### Purpose

The Ticket Management System is the primary support channel between EduMyles schools and Mylesoft staff. Schools raise tickets from their portal. Agents manage them from the Master Admin Panel. The system enforces SLA timers, supports internal agent notes hidden from schools, collects CSAT ratings, and provides full analytics on support performance.

### User Stories

| As a... | I want to... | So that... |
|---------|-------------|-----------|
| school-admin | submit a support ticket with screenshot and description | Mylesoft can diagnose my problem quickly |
| school-admin | see the status of all my school's tickets in one place | I know what is resolved and what is pending |
| support-agent | see all open tickets sorted by SLA urgency | I never miss a breach or overlook a critical issue |
| support-agent | write internal notes a school cannot see | I can coordinate with teammates privately |
| super-admin | see agent performance (tickets resolved, avg time, CSAT) | I can manage team quality |
| super-admin | configure SLA rules per ticket category and priority | I can set service standards |

### Ticket Queue — Admin Features

| Feature | Description |
|---------|------------|
| Search | Full-text across ticket title, body, school name, and comments |
| Filter: Status | Open / In Progress / Pending School / Resolved / Closed |
| Filter: Priority | P0 Critical / P1 High / P2 Medium / P3 Low |
| Filter: Category | Billing / Technical / Data / Feature / Onboarding / Account / Legal |
| Filter: Assigned | My tickets / Unassigned / By agent name |
| Filter: SLA | Breached / At risk (< 2hr left) / On track |
| Views | Table view (default) \| Kanban by status \| Calendar by SLA deadline |
| Stats Bar | Total open, SLA compliance %, avg resolution time today |

### Ticket Detail Page — 3-Column Layout

**Left Column — Info Panel:**
- Status badge + action buttons (change status, assign, close)
- Priority badge with change button
- SLA countdown timer — red if < 2hrs, orange if < 25%, green if healthy
- Created by (school admin name + school name link)
- Assigned to (agent avatar + name, reassign button)
- Tenant link → opens tenant detail in new tab
- CSAT score (if resolved/closed)

**Centre Column — Thread:**
- Original ticket message with attachments (images, PDFs, CSVs)
- Chronological comment thread — public replies and internal notes
- Internal notes shown with yellow background + 'INTERNAL' badge
- Rich text editor with bold, italic, code, lists, file attachment
- Canned response button: dropdown of saved templates with variable substitution
- @mention support: type @agent-name to notify a colleague
- Reply sends email via Resend AND saves comment to Convex

**Right Column — Actions:**
- Quick status change dropdown
- Escalate button — bumps to P0 and assigns to super-admin
- Merge with duplicate ticket
- Link to related Linear issue (for bugs needing dev work)
- Full audit trail — every status/assignment change logged

### SLA Rules

| Priority | Examples | First Response SLA | Resolution SLA |
|----------|---------|-------------------|---------------|
| P0 — Critical | System down, data loss, payment stuck | 2 hours | 4 hours |
| P1 — High | Major feature broken, billing error | 8 hours | 24 hours |
| P2 — Medium | Feature partially broken, data discrepancy | 24 hours | 72 hours |
| P3 — Low | Feature request, how-to question | 72 hours | 7 days |

### SLA Enforcement Logic

- On creation: `slaFirstResponseDeadline = createdAt + priority SLA hours`
- On first agent reply: `first_response_at` stamped. SLA compliance calculated.
- Convex cron runs every 15 minutes: check all open tickets for breach
- At 75% time elapsed: email + in-app alert to assigned agent
- On breach: mark `slaBreached=true`, email agent + super-admin, badge turns red
- SLA clock pauses when `status = 'pending_school'` (waiting for school reply)
- SLA clock resumes when school replies or agent changes status back

### Ticket Categories

| Category | Examples | Default Priority |
|----------|---------|----------------|
| billing | Payment failed, invoice error, plan upgrade | P1 |
| technical | Module not loading, data not saving, login error | P0 |
| data | Export student records, bulk import help | P2 |
| feature | Asking for new module or customisation | P3 |
| onboarding | Setup assistance for new school | P1 |
| account | User access, subdomain change, password reset | P2 |
| legal | Data deletion, GDPR/KDPA queries | P1 |

### Notification Triggers

| Trigger | Recipients | Channel |
|---------|-----------|---------|
| Ticket created | Email to: assigned agent | Resend |
| Agent replies | Email to school admin + in-app notification on school portal | Resend + Convex |
| School replies | Email + in-app to: assigned agent | Resend + Convex |
| SLA at 75% | Email to: assigned agent | Resend |
| SLA breached | Email to: agent + super-admin. SMS to super-admin if P0. | Resend + Africa's Talking |
| Ticket closed | Email to school: resolution summary + CSAT rating link | Resend |
| Ticket escalated | Email + in-app to: super-admin | Resend + Convex |

### Convex Data Schema

```typescript
tickets: defineTable({
  tenantId: v.id("tenants"),
  title: v.string(),
  body: v.string(),
  category: v.union(v.literal("billing"), v.literal("technical"), v.literal("data"),
    v.literal("feature"), v.literal("onboarding"), v.literal("account"),
    v.literal("legal"), v.literal("other")),
  priority: v.union(v.literal("P0"), v.literal("P1"), v.literal("P2"), v.literal("P3")),
  status: v.union(v.literal("open"), v.literal("in_progress"),
    v.literal("pending_school"), v.literal("resolved"), v.literal("closed")),
  assignedTo: v.optional(v.string()),
  createdBy: v.string(),
  attachments: v.optional(v.array(v.string())),
  slaFirstResponseDL: v.number(),
  slaResolutionDL: v.number(),
  slaBreached: v.optional(v.boolean()),
  slaClockPaused: v.optional(v.boolean()),
  firstResponseAt: v.optional(v.number()),
  resolvedAt: v.optional(v.number()),
  csatScore: v.optional(v.number()),
  csatComment: v.optional(v.string()),
  linearIssueUrl: v.optional(v.string()),
  createdAt: v.number(), updatedAt: v.number(),
})
.index("by_tenant",["tenantId"]).index("by_status",["status"])
.index("by_priority",["priority"]).index("by_assigned",["assignedTo"])
.index("by_sla",["slaResolutionDL"]),
```

### Routes

| Route | Description |
|-------|------------|
| `/platform/tickets` | Main ticket queue — all tenants |
| `/platform/tickets/[ticketId]` | Ticket detail — thread and actions |
| `/platform/tickets/analytics` | Support analytics dashboard |
| `/platform/tickets/settings` | SLA rules, canned responses, categories |
| `/{slug}/support` | School portal — my tickets list |
| `/{slug}/support/new` | School portal — create new ticket |
| `/{slug}/support/[ticketId]` | School portal — ticket thread view |

---

## MODULE 05 — COMMUNICATIONS MODULE

*Broadcasts, email campaigns, SMS blasts, in-app notifications, and drip sequences to all schools*

### Purpose

The Communications module is how Mylesoft speaks to all its schools at scale. It handles urgent system alerts, monthly newsletters, automated onboarding sequences, and billing reminders. This is strictly Mylesoft-to-tenant communication — distinct from the school-level communications module that handles school-to-parent/student messaging.

> **Note:** `backend/modules/communications/` = school-to-parent/student messaging. `backend/platform/communications/` = Mylesoft-to-school (tenant) messaging. These are **SEPARATE** modules.

### Message Types

| Type | Description | Source |
|------|------------|--------|
| Broadcast | One-time message to all or filtered schools. Sent immediately or scheduled. | Manual |
| Campaign | Multi-message email series with subject, preview text, rich HTML body. | Manual |
| System Alert | Urgent technical message. Bypasses unsubscribe preferences. | Manual/Auto |
| Transactional | Triggered by system event: payment reminder, plan expiry, trial ending. | Auto |
| Drip Sequence | Multi-step automated series triggered by lifecycle event. | Auto |
| In-App Notification | Notification bell in school portal. Persists until dismissed. | Auto/Manual |
| Push Notification | Expo Push API to React Native mobile app. | Auto/Manual |
| Maintenance Banner | Top banner on all school portals during specified time window. | Manual |

### Audience Segmentation Options

| Segment Type | Description |
|-------------|------------|
| Plan Tier | Target Starter only, Growth only, Pro and Enterprise, etc. |
| Status | Active only / Trialing only / Past due (for billing reminders) / All |
| County / Region | All Nairobi schools, all Coast schools, etc. |
| School Type | Primary only, Secondary only, University only |
| Last Login | Schools that have not logged in for X days (re-engagement) |
| Module Usage | Schools using/not using specific modules |
| Custom Tag | Admin-defined tags on tenant records |
| Specific Tenants | Pick tenants by name for targeted direct messages |
| Exclude List | Exclude specific tenants from any segment |

### Built-in Drip Sequences

| Sequence | Trigger | Steps | Duration |
|----------|---------|-------|----------|
| Onboarding Welcome | tenant_created | D0: Welcome + setup / D3: Module walkthrough / D7: Tips / D14: Check-in | 14 days |
| Trial Expiry | trial_end - 7 days | D-7: Heads up / D-3: Urgency / D-1: Final reminder / D+1: Grace offer | 8 days |
| Win-back | subscription_cancelled | Week 1: Feedback / Week 3: Offer / Week 6: Final goodbye | 6 weeks |
| Re-engagement | last_login > 30 days | D30: Miss you / D37: New features / D44: Webinar invite | 14 days |
| Feature Adoption | module_enabled, 0 usage after 14 days | D14: Intro / D21: Video tutorial / D28: Live help | 14 days |

### Convex Data Schema

```typescript
platform_messages: defineTable({
  senderId: v.string(),
  type: v.union(v.literal("broadcast"), v.literal("campaign"), v.literal("alert"),
    v.literal("transactional"), v.literal("drip_step")),
  subject: v.string(),
  emailBody: v.optional(v.string()),
  smsBody: v.optional(v.string()),
  inAppBody: v.optional(v.string()),
  channels: v.array(v.string()),
  segment: v.object({
    planTiers: v.optional(v.array(v.string())),
    tenantIds: v.optional(v.array(v.id("tenants")))
  }),
  scheduledAt: v.optional(v.number()),
  sentAt: v.optional(v.number()),
  status: v.union(v.literal("draft"), v.literal("scheduled"),
    v.literal("sending"), v.literal("sent"), v.literal("failed")),
  stats: v.optional(v.object({
    delivered: v.number(), opened: v.number(),
    clicked: v.number(), bounced: v.number()
  })),
  createdAt: v.number(),
}),

tenant_notifications: defineTable({
  tenantId: v.id("tenants"),
  type: v.union(v.literal("info"), v.literal("warning"), v.literal("success"), v.literal("alert")),
  title: v.string(),
  body: v.string(),
  read: v.boolean(),
  ctaUrl: v.optional(v.string()),
  createdAt: v.number(),
}).index("by_tenant",["tenantId"]).index("by_read",["read"]),
```

### Routes

| Route | Description |
|-------|------------|
| `/platform/communications` | Message history list and stats |
| `/platform/communications/new` | Compose new broadcast/campaign (multi-step) |
| `/platform/communications/[id]` | Message detail and delivery analytics |
| `/platform/communications/drips` | Drip sequence builder and manager |
| `/platform/communications/templates` | Message template library |
| `/{slug}/notifications` | School portal — notification centre |

---

## MODULE 06 — BILLING MANAGEMENT

*Subscriptions, invoicing, M-Pesa Daraja, Stripe, dunning, and revenue analytics*

### Purpose

Billing Management is the financial backbone of EduMyles SaaS. It manages subscription plans, invoice generation, payment collection via M-Pesa Daraja, Airtel Money, Stripe, and Bank Transfer, failed payment recovery (dunning), refunds, tax management (VAT 16% Kenya), and full revenue analytics.

> ⚠️ **WARNING:** M-Pesa Daraja integration requires approved Safaricom Business Shortcode. All M-Pesa callbacks MUST be handled by Convex HTTP Actions (not Next.js API routes) to guarantee persistence.

### Subscription Plan Definitions

| Plan | Monthly | Annual | Limit | Inclusions |
|------|---------|--------|-------|-----------|
| Starter | KES 2,500/mo | KES 5,000/yr | 300 students | 1 branch, 5 staff, Core modules |
| Growth | KES 6,500/mo | KES 13,000/yr | 1,000 students | 3 branches, 20 staff, All core + Finance, Library |
| Pro | KES 15,000/mo | KES 30,000/yr | 5,000 students | Unlimited branches, 50 staff, All modules + API |
| Enterprise | Custom | Custom | Unlimited | SLA, dedicated support, white-label option |

### M-Pesa STK Push Payment Flow

1. Finance-officer or automated cron triggers invoice payment
2. Convex action calls Daraja STK Push API: `POST /mpesa/stkpush/v1/processrequest`
3. M-Pesa sends STK prompt to school admin's registered phone
4. School admin confirms payment with M-Pesa PIN
5. Daraja sends callback to Convex HTTP Action: `POST /api/mpesa/callback`
6. Callback handler: validate → if `ResultCode=0`: mark invoice PAID → send receipt email via Resend
7. If failure (cancelled/timeout): log reason, retry up to 3 times with 5-min gap

> **Note:** Required Daraja credentials: `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_CALLBACK_URL`, `MPESA_TRANSACTION_TYPE`. All stored as Convex environment variables.

### Dunning — Failed Payment Recovery

| Day | Condition | Action | Tenant State |
|-----|-----------|--------|-------------|
| Day 0 | Invoice due, unpaid | Email + in-app: friendly reminder with pay button | Active |
| Day 3 | Still unpaid | Email: urgency + STK push attempt #2 + SMS | Active — warning banner |
| Day 7 | Still unpaid | Email: final warning + support agent flag for phone call | Active — warning banner |
| Day 14 | Still unpaid | Tenant status → suspended. School sees suspension page. | Suspended |
| Day 21 | Still suspended | Email: account at risk + special discount offer | Suspended |
| Day 30 | No payment | Tenant status → cancelled. 30-day data retention begins. | Cancelled |

### Revenue KPIs

| KPI | Definition | Refresh |
|-----|-----------|---------|
| MRR | Sum of all active subscriptions normalised to monthly value | Real-time |
| ARR | MRR x 12 | Real-time |
| Churn Rate | Cancelled MRR / Start-of-period MRR x 100 | Monthly |
| LTV | ARPU / Monthly Churn Rate | Monthly |
| NRR | (MRR_end + expansion - churn - contraction) / MRR_start x 100. Target: >100% | Monthly |
| Payment Success Rate | Successful payment attempts / Total attempts x 100 | Real-time |

### Convex Data Schema

```typescript
subscriptions: defineTable({
  tenantId: v.id("tenants"),
  plan: v.union(v.literal("starter"), v.literal("growth"),
    v.literal("pro"), v.literal("enterprise")),
  status: v.union(v.literal("active"), v.literal("trialing"), v.literal("past_due"),
    v.literal("suspended"), v.literal("cancelled"), v.literal("paused")),
  billingCycle: v.union(v.literal("monthly"), v.literal("annual")),
  currentPeriodStart: v.number(), currentPeriodEnd: v.number(),
  trialEnd: v.optional(v.number()),
  mrr: v.number(), // normalised monthly value in KES cents
}).index("by_tenant",["tenantId"]).index("by_status",["status"]),

invoices: defineTable({
  tenantId: v.id("tenants"),
  number: v.string(),           // INV-2025-0042
  status: v.union(v.literal("draft"), v.literal("open"),
    v.literal("paid"), v.literal("void")),
  lineItems: v.array(v.object({ description: v.string(), amount: v.number() })),
  subtotal: v.number(), vatAmount: v.number(), total: v.number(),
  currency: v.string(),
  dueDate: v.number(), paidAt: v.optional(v.number()),
  mpesaRef: v.optional(v.string()), stripeId: v.optional(v.string()),
  dunningStep: v.optional(v.number()),
  createdAt: v.number(),
}).index("by_tenant",["tenantId"]).index("by_status",["status"])
  .index("by_due_date",["dueDate"]),
```

### Routes

| Route | Description |
|-------|------------|
| `/platform/billing` | Billing overview — MRR, ARR, outstanding invoices |
| `/platform/billing/subscriptions` | All subscriptions — filter, search, bulk actions |
| `/platform/billing/invoices` | Invoice list — all tenants |
| `/platform/billing/invoices/new` | Create manual invoice |
| `/platform/billing/invoices/[id]` | Invoice detail — payments, PDF download, actions |
| `/platform/billing/plans` | Plan definitions — edit pricing, limits, inclusions |
| `/platform/billing/dunning` | Dunning queue — overdue invoices and recovery actions |
| `/platform/billing/analytics` | Revenue analytics — MRR, churn, LTV, cohorts |
| `/api/mpesa/callback` | Convex HTTP Action — M-Pesa Daraja callback endpoint |
| `/api/stripe/webhook` | Convex HTTP Action — Stripe webhook endpoint |

---

## MODULE 07 — CRM — SALES & ONBOARDING

*Full school acquisition lifecycle: leads, pipeline, proposals, onboarding, account health*

### Purpose

The CRM module manages every school from first contact to renewal and expansion. It gives the Mylesoft sales team a structured pipeline, activity tracking, proposal generation, onboarding checklists, and account health monitoring. It connects to Billing (contract values), Tickets (onboarding support), and Communications (drip sequences) for a 360-degree school view.

### Sales Pipeline Stages

| Stage | Definition | Win Probability |
|-------|-----------|----------------|
| New Lead | School expressed interest or was prospected. No contact yet. | 10% |
| Contacted | First contact made (call, email, WhatsApp). | 20% |
| Qualified | Decision-maker confirmed, budget exists, timeline identified. | 35% |
| Demo Scheduled | Product demo meeting booked. | 45% |
| Demo Done | Demo delivered. School evaluating. | 60% |
| Proposal Sent | Formal PDF proposal sent. Awaiting decision. | 70% |
| Negotiation | Pricing/terms discussion underway. | 82% |
| Closed Won | Contract signed, payment received. Tenant provisioned. Onboarding starts. | 100% |
| Closed Lost | School chose competitor or deferred indefinitely. | 0% |
| Nurture | Not ready now. Follow up in 3-6 months. | 15% |

### Pipeline Kanban Board

- Each stage is a column. Cards are draggable between columns using `@dnd-kit` or `react-dnd`
- Card shows: school name, county, contact name, deal value (KES), days in stage, owner avatar
- Cards sorted by days in stage (oldest at top — most at-risk)
- Column header: stage name, count of deals, total value in stage
- Drag card → Convex mutation updates stage, logs activity, triggers automations
- Click card → opens lead detail side panel without leaving the board
- Board header: total pipeline value, weighted forecast value (value x probability), deals closing this month

### Lead Detail Page — 3-Column Layout

| Column | Content |
|--------|---------|
| School Profile | Name, type, county, est. students, current system, decision makers, lead source, assigned rep, deal value, tags |
| Activity Timeline | Full log: calls, emails, meetings, WhatsApp, notes, tasks. Filter by type. Pin important items. Rich text. |
| Deal Actions | Stage change, Generate Proposal PDF, Schedule Demo, Mark Won/Lost, Link to Tenant/Tickets |

### Proposal PDF Generator

- Auto-populated from CRM lead data. Generated by ReportLab in a Convex action.
- Cover page: Mylesoft logo, school name, 'Proposal for School Management System', date, sales rep contact
- School Profile: current challenges (from lead notes), student count, school type
- Proposed Solution: recommended modules based on school size and type
- Pricing Table: recommended plan, billing cycle, annual vs monthly comparison, any discount
- Implementation Timeline: 4-week onboarding plan (Setup / Data migration / Training / Go-live)
- Saved to Convex storage + attached to lead activity log + emailed directly from CRM

### Account Health Score

| Signal | Weight | Scoring Rule |
|--------|--------|-------------|
| Login Frequency | 25% | Daily=10, Weekly=7, Monthly=4, Less than monthly=1 |
| Module Adoption | 25% | % of subscribed modules with activity in last 30 days x 10 |
| Payment Health | 20% | No overdue=10, 1-7 days late=6, 7+ days=2, Suspended=0 |
| Ticket Volume/Severity | 15% | 0 P0/P1=10pts. Each P0=-3pts. Each P1=-1pt. Max deduct 8pts |
| CSAT Score | 15% | 4-5 stars=10, 3 stars=6, 1-2 stars=2, No ratings=5 |

| Score Range | Status and Action |
|-------------|------------------|
| 80-100 | Healthy — green badge. No action needed. |
| 60-79 | At Risk — amber badge. Check in within 7 days. |
| 40-59 | Danger — orange badge. Auto-create retention task for account manager. |
| 0-39 | Critical — red badge. Escalate to super-admin. Likely churn within 30 days. |

### Routes

| Route | Description |
|-------|------------|
| `/platform/crm` | Pipeline Kanban board (default view) |
| `/platform/crm/list` | List view — sortable, filterable table |
| `/platform/crm/new` | Create new lead form |
| `/platform/crm/[leadId]` | Lead detail — profile, timeline, actions |
| `/platform/crm/forecast` | Sales forecasting dashboard |
| `/platform/crm/analytics` | Win/loss, deal velocity, source analysis |
| `/platform/crm/accounts` | Accounts view — won deals with health scores |

---

## MODULE 08 — PLATFORM ANALYTICS & BI

*Deep intelligence on tenant growth, module adoption, geographic spread, and cohort behaviour*

### Purpose

Platform Analytics gives Mylesoft leadership and the product team deep insights into how the platform is growing. Data drives product roadmap decisions, marketing targeting, and sales strategy. Pre-computed daily snapshots prevent heavy aggregations on page load.

### Analytics Sections

| Section | Description |
|---------|------------|
| Tenant Growth | New tenants per month (bar), cumulative (line), breakdown by plan/type/county. MoM growth rate. |
| Module Adoption | For each module: % tenants enabled, % actively using (last 30 days). Unused module alerts. |
| Geographic Analysis | Kenya county heatmap (D3.js SVG). Table: tenants/county, MRR/county, top growth counties. |
| Cohort Retention | Group tenants by signup month. Track % still active at 1/3/6/12 months. |
| Revenue BI | MRR/ARR trends, plan mix over time, expansion vs new revenue, churn waterfall. |
| Engagement Metrics | Daily/Weekly/Monthly active tenants (DAT/WAT/MAT). Average sessions per school per week. |
| Feature Usage | Which features within each module are used most. Informs UX prioritisation. |
| Support Analytics | Which modules generate most tickets. Correlate with adoption rates. |

> **DEV NOTE:** Pre-compute daily snapshots via Convex cron at 00:00 EAT. Dashboard reads from `platform_analytics_snapshots` — never run heavy aggregations live from raw tables.

### Routes

| Route | Description |
|-------|------------|
| `/platform/analytics` | Analytics home — key charts overview |
| `/platform/analytics/tenants` | Tenant growth, churn, cohort retention |
| `/platform/analytics/modules` | Module adoption and feature usage |
| `/platform/analytics/geography` | County heatmap and regional breakdown |
| `/platform/analytics/revenue` | Revenue BI — MRR waterfall, plan mix |

---

## MODULE 09 — SYSTEM HEALTH & MONITORING

*Real-time platform health: API status, error rates, payment callbacks, active sessions*

### Purpose

System Health gives super-admins real-time visibility into platform reliability. It monitors all critical integrations (Convex, M-Pesa, Stripe, Africa's Talking, Resend, WorkOS, Vercel), tracks error rates, surfaces failed jobs, and alerts the team before schools notice problems.

### Health Dashboard Panels

| Panel | Description |
|-------|------------|
| Platform Status Bar | Green/amber/red indicator per service: Convex, M-Pesa, Stripe, AT, Resend, WorkOS, Vercel |
| Uptime History | 7-day uptime % per service. Bar chart showing outage windows. Target: 99.9% |
| M-Pesa Callback Monitor | Success rate of Daraja STK callbacks last 24h. Failed callbacks table with retry button. |
| Stripe Webhook Monitor | Webhook events processed vs failed. Failed events with error detail and manual replay. |
| Convex Function Errors | Mutations/queries with errors in last 24h. Error message, stack trace, affected tenant. |
| Scheduled Jobs Log | Convex cron jobs: last run, status, next run. Click to see job output. |
| Performance Metrics | P50/P95/P99 response times for key Convex queries. Alert if P95 > 500ms. |

### Alert Thresholds

| Alert | Trigger | Severity |
|-------|---------|---------|
| M-Pesa callback failure | Rate > 10% in 30 min | P0 — immediate email + SMS to super-admin |
| Convex error spike | Count > 50 in 10 min | P1 — alert within 5 min |
| Subscription job failure | Dunning cron fails to run | P1 — alert within 15 min |
| High latency | P95 > 1000ms for 5 min | P2 — alert within 15 min |
| WorkOS auth failures | > 20 failed logins in 5 min per tenant | P1 — possible attack |

### Routes

| Route | Description |
|-------|------------|
| `/platform/health` | System health overview dashboard |
| `/platform/health/jobs` | Scheduled jobs log and manual trigger |
| `/platform/health/callbacks` | M-Pesa and Stripe callback monitor |
| `/platform/health/alerts` | Alert configuration and history |

---

## MODULE 10 — RESELLER / AGENT MANAGEMENT

*Local sales agents who refer schools: referral tracking, commissions, M-Pesa payouts*

### Purpose

In Kenya and East Africa, a large proportion of B2B SaaS sales happen through local agents who have existing relationships with school owners. This module manages the full agent lifecycle: application, onboarding, referral tracking, commission calculation, and M-Pesa B2C payouts.

### Commission Structure

| Agent Type | Rate | Frequency | Notes |
|-----------|------|-----------|-------|
| Referral Agent | 10% of first invoice | One-time per school | Min: KES 250 |
| Reseller — Starter | 15% of monthly subscription | Monthly, lifetime | Paid monthly |
| Reseller — Growth | 12% of monthly subscription | Monthly, lifetime | Paid monthly |
| Reseller — Pro | 10% of monthly subscription | Monthly, lifetime | Paid monthly |
| County Rep | 15% recurring + KES 5,000/month retainer | Monthly | Requires contract |
| Annual plan bonus | +5% on top of standard rate | One-time on annual signup | Added to first commission |

### Agent Portal (agents.edumyles.com)

- Separate login for agents. Distinct from school portal and platform admin.
- Dashboard: referred schools, active schools, total commissions earned, pending payout
- Unique referral link + QR code: `edumyles.com/ref/AGENT_CODE`
- My Schools: list with status (Lead/Trial/Active/Churned)
- Commission History: itemised list with invoice reference and amount
- Payout History: M-Pesa payouts received with date and amount
- Marketing materials: download pitch decks, brochures, pricing sheets

### Routes

| Route | Description |
|-------|------------|
| `/platform/agents` | Agent list — all agents, status, performance |
| `/platform/agents/[agentId]` | Agent detail — schools, commissions, payouts |
| `/platform/agents/commissions` | Commission queue — approve/dispute/payout |
| `/platform/agents/payouts` | Payout history — M-Pesa B2C records |
| `agents.edumyles.com` | Agent self-service portal |

---

## MODULE 11 — AUDIT LOG CENTRE

*Immutable, searchable record of every action across the platform — compliance grade*

### Purpose

The Audit Log Centre satisfies Kenya Data Protection Act 2019 requirements and enables incident investigation. Every create, update, delete, and access action on the platform is recorded in an immutable log.

> ⚠️ **WARNING:** Audit log records are NEVER deleted. The only maintenance is archiving records older than 7 years to cold storage. Records are write-only.

### What Gets Logged

| Category | Events Logged |
|----------|--------------|
| Tenant Actions | provision_tenant, update_status, change_plan, delete_tenant, update_slug |
| Billing Actions | create_invoice, mark_paid, issue_refund, change_subscription, initiate_mpesa |
| Ticket Actions | create_ticket, assign_ticket, change_status, close_ticket, delete_ticket |
| Communications | send_broadcast, create_campaign, activate_drip_sequence |
| CRM Actions | create_lead, change_stage, mark_won, mark_lost, delete_lead |
| Feature Flags | enable_module, disable_module, change_feature_flag |
| Agent Actions | approve_agent, suspend_agent, approve_commission, process_payout |
| Auth Events | platform_login, platform_logout, failed_login, session_revoked |
| Settings Changes | update_sla_rules, update_plan_definition, update_system_config |
| Data Compliance | export_tenant_data, delete_tenant_data, view_sensitive_record |

### Convex Data Schema

```typescript
platform_audit_log: defineTable({
  userId: v.string(), userEmail: v.string(), userRole: v.string(),
  action: v.string(),
  category: v.string(),
  tenantId: v.optional(v.id("tenants")),
  targetType: v.string(),
  targetId: v.optional(v.string()),
  targetName: v.optional(v.string()),
  before: v.optional(v.any()),
  after: v.optional(v.any()),
  ipAddress: v.optional(v.string()),
  severity: v.union(v.literal("info"), v.literal("warning"), v.literal("critical")),
  hash: v.string(), // SHA256 chain hash for integrity
  createdAt: v.number(),
}).index("by_user",["userId"]).index("by_tenant",["tenantId"])
  .index("by_action",["action"]).index("by_time",["createdAt"]),
```

### Routes

| Route | Description |
|-------|------------|
| `/platform/audit-log` | Audit log viewer — search, filter, export to CSV |
| `/platform/audit-log/[id]` | Single record detail with diff view |

---

## MODULE 12 — DATA & COMPLIANCE CENTRE

*KDPA 2019 compliance: data export, right-to-erasure, DPAs, consent records*

### Purpose

Kenya Data Protection Act (KDPA) 2019 requires data processors to support data subject rights. This module handles KDPA compliance obligations and manages Data Processing Agreements (DPAs) with schools. Non-compliance is a hard blocker when selling to county governments and universities.

### KDPA Obligations Covered

| KDPA Right | Description | Implementation |
|-----------|------------|---------------|
| Right to Access | Tenant requests a copy of all data EduMyles holds about them | Data Export Request flow |
| Right to Erasure | Tenant requests deletion of their data after subscription ends | Data Deletion flow with 24hr cooling-off |
| Right to Portability | Tenant wants their data in portable format (CSV/JSON) | Export as structured ZIP file |
| Data Breach Notification | Notify affected tenants within 72 hours of a breach | Breach notification workflow |
| Consent Records | Record and track consent from schools and their users | Consent log table |
| Data Retention | Enforce 30-day post-cancellation deletion | Automated retention cron |
| DPA Management | Store and manage signed agreements with each school | DPA document library |

> ⚠️ **WARNING:** Data deletion is IRREVERSIBLE. The mutation must require typed confirmation matching the tenant slug AND enforce a 24-hour cooling-off period before execution.

### Routes

| Route | Description |
|-------|------------|
| `/platform/compliance` | Compliance overview — pending requests, DPA status |
| `/platform/compliance/requests` | Data requests list — export, deletion, correction |
| `/platform/compliance/requests/[id]` | Request detail — review, approve, reject |
| `/platform/compliance/dpa` | DPA agreements library |
| `/{slug}/settings/privacy` | School portal — submit data request |

---

## MODULE 13 — TEAM MANAGEMENT

*Mylesoft internal staff accounts: invite, role assignment, activity tracking, deactivation*

### Purpose

Team Management handles all Mylesoft internal staff accounts. Super-admins invite new team members, assign roles, view activity, and deactivate accounts when staff leave. All staff are managed in a dedicated WorkOS Organisation (the Mylesoft internal org).

### Platform Staff Roles

| Role | Access Scope | Typical Holder |
|------|-------------|---------------|
| super-admin | Full access to all 14 modules. Can manage other staff. Max 2-3 people. | Founder, CTO |
| support-agent | Ticket queue (all tenants), Tenant detail (read-only), Comms (read-only) | Customer support |
| finance-officer | Billing module (full), Revenue analytics, Tenant billing details | Finance/accounts |
| sales-rep | CRM pipeline (full), Tenant detail (read), Communications (read) | Sales team |
| marketing-admin | Communications module (full), Analytics (read) | Marketing |
| readonly | Read-only across all modules. Cannot make changes. | Advisors, investors |

### Staff Account Features

- Invite by email: super-admin selects role → WorkOS sends invite email
- Pending invites list: see who has not accepted yet. Resend invite button.
- Role change: logged to audit log with reason
- Activity view: per-staff — last login, tickets handled, messages sent, deals worked
- Deactivate: immediately revokes WorkOS session. Data is preserved.
- 2FA enforcement: require 2FA for all platform staff via WorkOS
- Session management: super-admin can revoke all sessions for a specific staff member

### Routes

| Route | Description |
|-------|------------|
| `/platform/team` | Team member list — all staff, roles, status |
| `/platform/team/invite` | Invite new team member |
| `/platform/team/[userId]` | Staff member detail — activity, performance, role |

---

## MODULE 14 — PLATFORM SETTINGS & CONFIGURATION

*Central config hub: plan definitions, SLA rules, payment gateways, email/SMS, onboarding wizard*

### Purpose

Platform Settings is the central configuration hub. Changes here affect the entire platform. All settings values are stored in a `platform_config` Convex table as a key-value store — super-admins can update settings without a redeploy.

### Settings Sections

| Section | Description |
|---------|------------|
| Plan Definitions | Edit plan names, pricing (KES), student limits, staff limits, module inclusions. Applies to NEW subscriptions only. |
| SLA Rules | Configure SLA response/resolution times per priority. Escalation chain. Business hours (Mon-Fri 8am-6pm EAT default). |
| Payment Gateways | M-Pesa: Shortcode, passkey, callback URL. Stripe: API keys, webhook secret. Toggle each gateway on/off. |
| Email Configuration | Resend API key, from email/name, reply-to. Default transactional email templates. |
| SMS Configuration | Africa's Talking API key, sender ID, SMS templates per notification type. |
| Onboarding Wizard | Define the 6-step guided setup flow for new schools. Titles, descriptions, required/optional per step. |
| Trial Settings | Default trial duration, which plan new trials default to, extension policy. |
| Data Retention | Post-cancellation retention (30 days), audit log archiving (7 years), ticket attachments (2 years). |
| Maintenance Mode | Toggle: shows maintenance page on all school portals with custom message and estimated restoration time. |

### Convex Data Schema

```typescript
platform_config: defineTable({
  key: v.string(),        // e.g. "trial_duration_days", "mpesa_shortcode"
  value: v.any(),         // string | number | boolean | object
  category: v.string(),   // "billing" | "sla" | "email" | "sms" | "onboarding"
  description: v.string(),
  updatedBy: v.string(), updatedAt: v.number(),
}).index("by_key",["key"]).index("by_category",["category"]),
```

### Routes

| Route | Description |
|-------|------------|
| `/platform/settings` | Settings home — section overview |
| `/platform/settings/plans` | Plan definitions — pricing and limits |
| `/platform/settings/sla` | SLA rules configuration |
| `/platform/settings/payments` | Payment gateway credentials and toggles |
| `/platform/settings/email` | Email config and templates |
| `/platform/settings/sms` | SMS config and templates |
| `/platform/settings/onboarding` | Onboarding wizard step definitions |
| `/platform/settings/maintenance` | Maintenance mode toggle and message |
| `/platform/settings/flags` | Feature flags (links to Module 03) |

---

## Master RBAC Permissions Matrix

> Enforcement is at the Convex mutation/query level. Client-side checks are for UX only.

| Action | super-admin | support-agent | finance-officer | sales-rep | marketing-admin |
|--------|:-----------:|:-------------:|:---------------:|:---------:|:---------------:|
| VIEW Master Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| VIEW Revenue KPIs | ✅ | ❌ | ✅ | ❌ | ❌ |
| PROVISION new tenant | ✅ | ❌ | ❌ | ❌ | ❌ |
| SUSPEND / ACTIVATE tenant | ✅ | ❌ | ❌ | ❌ | ❌ |
| CHANGE tenant plan | ✅ | ❌ | ✅ | ❌ | ❌ |
| DELETE tenant | ✅ | ❌ | ❌ | ❌ | ❌ |
| TOGGLE module per tenant | ✅ | ❌ | ❌ | ❌ | ❌ |
| VIEW all tickets | ✅ | ✅ | ❌ | ❌ | ❌ |
| ASSIGN ticket | ✅ | ✅ | ❌ | ❌ | ❌ |
| CONFIGURE SLA rules | ✅ | ❌ | ❌ | ❌ | ❌ |
| SEND broadcast/alert | ✅ | ❌ | ❌ | ❌ | ✅ |
| CREATE email campaign | ✅ | ❌ | ❌ | ❌ | ✅ |
| MANAGE drip sequences | ✅ | ❌ | ❌ | ❌ | ✅ |
| VIEW all invoices | ✅ | ❌ | ✅ | ❌ | ❌ |
| CREATE invoice | ✅ | ❌ | ✅ | ❌ | ❌ |
| INITIATE M-Pesa payment | ✅ | ❌ | ✅ | ❌ | ❌ |
| ISSUE refund / credit note | ✅ | ❌ | ✅ | ❌ | ❌ |
| VIEW revenue dashboard | ✅ | ❌ | ✅ | read | ❌ |
| EDIT plan definitions | ✅ | ❌ | ❌ | ❌ | ❌ |
| VIEW all CRM leads | ✅ | ❌ | ❌ | ✅ | ❌ |
| CREATE / EDIT lead | ✅ | ❌ | ❌ | ✅ | ❌ |
| GENERATE proposal PDF | ✅ | ❌ | ❌ | ✅ | ❌ |
| MARK deal won / lost | ✅ | ❌ | ❌ | ✅ | ❌ |
| VIEW analytics dashboards | ✅ | ❌ | ✅ | ✅ | ✅ |
| VIEW system health | ✅ | ❌ | ❌ | ❌ | ❌ |
| APPROVE agent / commission | ✅ | ❌ | ✅ | ❌ | ❌ |
| VIEW audit log | ✅ | ❌ | ❌ | ❌ | ❌ |
| APPROVE data export/deletion | ✅ | ❌ | ❌ | ❌ | ❌ |
| INVITE / DEACTIVATE staff | ✅ | ❌ | ❌ | ❌ | ❌ |
| EDIT platform settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| TOGGLE maintenance mode | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Full Convex Schema Reference

> All platform tables live in `backend/platform/`. Platform-level tables (not scoped per tenant) are prefixed with `platform_`.

| Table Name | Purpose | Key Indexes |
|-----------|---------|------------|
| tenants | Tenant registry. One record per school. | by_slug, by_status, by_plan, by_county, by_agent |
| tenant_modules | Per-tenant module enable/disable overrides. | by_tenant, by_module |
| feature_flags | Platform-wide and per-tenant feature flags. | by_key |
| subscriptions | Tenant subscription plans and billing cycles. | by_tenant, by_status |
| invoices | All invoices — subscription, add-on, manual. | by_tenant, by_status, by_due_date |
| payment_attempts | Individual payment attempt records. | by_invoice |
| tickets | Support tickets from schools. | by_tenant, by_status, by_priority, by_assigned, by_sla |
| ticket_comments | Thread comments and internal notes. | by_ticket |
| canned_responses | Reusable ticket reply templates. | — |
| platform_messages | Broadcasts, campaigns, alerts to tenants. | by_status, by_type |
| drip_sequences | Automated lifecycle email sequence definitions. | — |
| tenant_notifications | In-app notifications per tenant. | by_tenant, by_read |
| message_templates | Reusable email/SMS templates. | by_category |
| crm_leads | CRM pipeline — school leads and deals. | by_stage, by_owner, by_tenant |
| crm_activities | Activity log per CRM lead. | by_lead |
| agents | Reseller and referral agents. | by_code, by_status |
| agent_commissions | Commission events per agent per invoice. | by_agent, by_status |
| agent_payouts | M-Pesa B2C payout records to agents. | by_agent |
| platform_audit_log | Immutable action log — write-only. | by_user, by_tenant, by_action, by_time |
| compliance_requests | KDPA data export/deletion requests. | by_tenant, by_status |
| dpa_agreements | Data Processing Agreements per tenant. | by_tenant |
| platform_users | Mylesoft internal staff accounts. | by_role, by_status |
| platform_config | Key-value platform configuration store. | by_key, by_category |
| platform_health_checks | API health check results per service. | by_service, by_time |
| platform_jobs_log | Convex scheduled job execution log. | by_job, by_time |
| platform_activity_log | Dashboard activity feed events. | by_time |
| platform_kpi_cache | Pre-computed KPI snapshots for performance. | by_date |
| platform_analytics_snapshots | Daily analytics snapshots for BI dashboards. | by_date, by_metric |

---

## Implementation Roadmap

> Sprints are 2 weeks each unless noted. Total: ~46 weeks (11.5 months) end-to-end. With 2 developers in parallel: P0 modules can be production-ready in 18 weeks.

| Sprint | Timeline | Deliverables | Priority |
|--------|----------|-------------|----------|
| Sprint 1-2 | Wks 1-4 | Tenant Management (full), Feature Flags, Platform Settings (basic), RBAC roles in WorkOS | P0 |
| Sprint 3-4 | Wks 5-8 | Ticket Management: schema, queue UI, school portal form, SLA timers, email notifications | P0 |
| Sprint 5 | Wks 9-10 | Ticket: CSAT, analytics, canned responses, internal notes, escalation rules | P0 |
| Sprint 6-7 | Wks 11-14 | Billing: subscription model, M-Pesa STK integration, invoice PDF generation, invoice UI | P0 |
| Sprint 8 | Wks 15-16 | Billing: Stripe integration, dunning cron, revenue dashboard (MRR/ARR/churn) | P0 |
| Sprint 9 | Wks 17-18 | Communications: in-app notifications, broadcast email/SMS, maintenance banner | P0 |
| Sprint 10 | Wks 19-20 | Communications: drip sequences, email campaign builder, delivery analytics | P1 |
| Sprint 11-12 | Wks 21-24 | CRM: pipeline Kanban, lead model, activity timeline, proposal PDF generator | P1 |
| Sprint 13 | Wks 25-26 | CRM: health score, onboarding checklist, sales forecasting, win/loss analytics | P1 |
| Sprint 14 | Wks 27-28 | Master Dashboard (KPI bar, charts, activity feed, role-specific panels) | P1 |
| Sprint 15 | Wks 29-30 | Platform Analytics and BI (all sections, county heatmap, cohort analysis) | P1 |
| Sprint 16 | Wks 31-32 | System Health and Monitoring (all panels, alerts, callback monitor) | P1 |
| Sprint 17-18 | Wks 33-36 | Reseller/Agent Management (portal, commission engine, M-Pesa B2C payouts) | P2 |
| Sprint 19 | Wks 37-38 | Audit Log Centre (full UI, export, chain integrity verification) | P1 |
| Sprint 20 | Wks 39-40 | Data and Compliance Centre (KDPA flows, DPA library, deletion cron) | P2 |
| Sprint 21 | Wks 41-42 | Team Management, Platform Settings (full), Onboarding Wizard builder | P1 |
| Sprint 22 | Wks 43-44 | QA pass: all 14 modules, integration tests, security review | P0 |
| Sprint 23 | Wks 45-46 | Documentation update, Linear cleanup, go-live checklist, load testing | P0 |

> **Note:** P0 modules (Sprints 1-9, first 18 weeks): Platform is revenue-operational. Billing, Tickets, and Communications are live. Schools can pay, raise support, and receive updates. P1 and P2 modules enhance operations and drive growth.

---

## Linear Issues Registry

> Create these as Epics in linear.app/mylesoft. Use Fibonacci story points: 1, 2, 3, 5, 8, 13.

### MYL-55 — Tenant Management — Full Module (15 story pts) [P0]
- Tenant list UI with search/filter/sort
- Tenant detail page — tabbed layout
- Tenant provisioning wizard (5 steps)
- WorkOS org creation on provision
- Subdomain provisioning via Vercel API
- Tenant status state machine (suspend/activate/cancel)
- Tenant deletion with 30-day retention
- Per-tenant usage stats computation
- Bulk actions (suspend, export, broadcast)
- Edit tenant profile and slug change flow
- Tenant CSV export
- Unit tests for all mutations

### MYL-56 — Feature Flags and Module Toggles (8 story pts) [P0]
- Module registry table and seed data
- Feature flags Convex schema
- Module toggles UI in tenant detail
- Global flags management page
- Plan entitlement auto-computation
- Rollout % and beta allowlist UI
- Audit log integration for all flag changes

### MYL-57 — Ticket Management System (18 story pts) [P0]
- Tickets Convex schema and indexes
- Ticket queue UI (table + kanban + calendar views)
- Ticket detail page (3-column layout)
- Ticket creation form for school portal
- Rich text editor for comments
- Internal notes hidden from school
- SLA timer computation and cron
- SLA breach alerts (email + SMS + in-app)
- Canned responses library
- CSAT email and score collection
- Ticket analytics dashboard
- School portal ticket list and detail
- End-to-end ticket flow tests

### MYL-58 — Communications Module (14 story pts) [P0]
- Platform messages Convex schema
- Broadcast compose form (multi-step)
- Audience segmentation engine
- Email builder with React Email templates
- Variable substitution engine
- SMS blast via Africa's Talking
- In-app notification bell component
- Maintenance banner system
- Drip sequence builder UI
- Drip execution engine (Convex cron)
- Pre-built drip sequences (onboarding, trial, win-back)
- Delivery analytics per campaign
- Unsubscribe and opt-out handling

### MYL-59 — Billing Management (20 story pts) [P0]
- Subscriptions and invoices Convex schema
- Invoice list UI with filters
- Invoice PDF generation (ReportLab)
- Invoice email via Resend
- Manual invoice creation form
- M-Pesa Daraja STK Push integration
- M-Pesa callback Convex HTTP Action
- M-Pesa reconciliation logic
- Stripe Payment Intent integration
- Stripe webhook Convex HTTP Action
- Dunning cron (6-step recovery sequence)
- Subscription change (upgrade/downgrade/cancel)
- Proration on upgrade
- Revenue dashboard (MRR, ARR, churn, LTV)
- VAT computation and tax summary
- Credit notes and refund flow

### MYL-60 — CRM — Sales and Onboarding (16 story pts) [P1]
- CRM leads Convex schema
- Pipeline Kanban board (@dnd-kit)
- Lead detail page (3-column)
- Activity timeline component
- Stage change with automation triggers
- Proposal PDF generator (ReportLab)
- Demo scheduling (calendar + email invite)
- Closed Won → trigger tenant provisioning
- Win/loss reason capture
- Account health score (daily cron)
- Sales forecasting page
- Win rate and deal velocity analytics

### MYL-61 — Master Dashboard (8 story pts) [P1]
- KPI bar (8 widgets, role-filtered)
- MRR trend line chart
- Tenant growth bar chart
- Ticket volume area chart
- Revenue by plan donut chart
- Activity feed (real-time Convex)
- Quick action buttons
- Role-specific panels

### MYL-62 — Platform Analytics and BI (10 story pts) [P1]
- Analytics snapshot cron (daily)
- Tenant growth charts
- Module adoption heatmap
- Kenya county SVG heatmap component
- Cohort retention grid
- DAT/WAT/MAT tracking
- Revenue BI charts

### MYL-63 — System Health and Monitoring (8 story pts) [P1]
- Health check cron (5-min)
- Service status bar component
- M-Pesa callback monitor UI
- Stripe webhook monitor UI
- Alert threshold configuration
- Jobs log viewer

### MYL-64 — Reseller / Agent Management (12 story pts) [P2]
- Agents Convex schema
- Agent list and detail UI
- Agent approval workflow
- Referral code generation
- Commission calculation engine
- M-Pesa B2C payout integration
- Agent self-service portal (agents.edumyles.com)
- Agent dashboard
- Payout history UI

### MYL-65 — Audit Log Centre (5 story pts) [P1]
- Audit log Convex schema with chain hash
- `auditLog()` helper in all mutations
- Audit log viewer UI
- CSV export for compliance

### MYL-66 — Data and Compliance Centre (8 story pts) [P2]
- Compliance requests Convex schema
- Data export flow (school + admin review)
- Data export ZIP generation
- Data deletion with cooling-off period
- DPA document library
- KDPA consent records table
- Retention cron

### MYL-67 — Team Management (6 story pts) [P1]
- Platform users table (WorkOS mirror)
- Team list UI
- Invite staff via WorkOS
- Role change + audit log
- Deactivate / reactivate staff

### MYL-68 — Platform Settings and Config (8 story pts) [P1]
- `platform_config` key-value table
- All settings sections UI
- Plan definitions editor
- SLA rules config UI
- Payment gateway settings
- Onboarding wizard builder
- Maintenance mode toggle

### MYL-69 — RBAC Enforcement — All Modules (5 story pts) [P0]
- `requirePlatformRole()` helper
- WorkOS role check on every Convex mutation
- Frontend role-guard HOC for `/platform` routes
- RBAC integration tests across all 14 modules

---

> **Note:** Total: 15 Epics | Total estimated story points: ~1288+ | Create all epics in linear.app/mylesoft under the 'Master Admin Panel' project.

---

*© 2026 Mylesoft Technologies Ltd | www.mylesoft.com*  
*Proprietary and Confidential. Intended for EduMyles development team use only.*
