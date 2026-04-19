# EduMyles — Tenant Onboarding
## Complete Technical Specification v1.0
**Date:** April 2026 | **Status:** Definitive

---

# PART 1 — ONBOARDING OVERVIEW

---

## 1.1 The Full Onboarding Journey

Tenant onboarding in EduMyles spans from the moment a school expresses interest to the moment they are fully operational — students enrolled, staff added, modules configured, parents invited. The complete journey has 8 distinct stages:

```
STAGE 1: DISCOVERY
School visits edumyles.co.ke, reads about the platform.
Submits waitlist form OR books a demo via CRM.
           │
           ▼
STAGE 2: QUALIFICATION (Platform Admin)
Master Admin / Platform Manager reviews the submission.
Qualifies the lead: school size, country, budget, urgency.
Decides: invite now / waitlist / reject.
           │
           ▼
STAGE 3: INVITATION
School receives invitation email with unique invite link.
Link is valid for 7 days and tied to one email address.
           │
           ▼
STAGE 4: ACCOUNT CREATION
School Admin clicks invite link.
Creates WorkOS account (email + password or Google SSO).
EduMyles creates:
  - WorkOS Organization for the school
  - Convex tenant record
  - WorkOS Membership linking admin to organization
  - module_installs for 3 core modules
  - tenant_onboarding health tracking record
  - 14-day free trial starts
           │
           ▼
STAGE 5: SETUP WIZARD (12 steps)
School Admin is taken through the setup wizard.
Each completed step increases the onboarding health score.
Wizard covers: school profile, academic structure, subjects,
grading system, classes, staff, students, modules, billing,
portal customization, parent invites, first attendance mark.
           │
           ▼
STAGE 6: ACTIVATION
Health score reaches 50+ → tenant marked as "activated".
Platform Manager notified.
Automated congratulations email sent to school admin.
Trial clock is reset to 14 days from activation date
(not from signup date — schools get full 14 days of use).
           │
           ▼
STAGE 7: TRIAL → CONVERSION
Day 10: conversion nudge email + in-app banner.
Day 12: platform manager personal outreach.
Day 14: trial ends → plan selection required.
School selects plan + billing period + payment method.
First payment processed → subscription active.
           │
           ▼
STAGE 8: STEADY STATE
School is fully operational.
Monthly billing runs automatically.
Onboarding health score → ongoing engagement score.
Platform team monitors for churn signals.
```

---

## 1.2 WorkOS Integration Architecture

EduMyles uses WorkOS AuthKit for ALL authentication. For multi-tenancy, each school becomes a **WorkOS Organization**. Each user is a **WorkOS User** linked to one or more organizations via **WorkOS Memberships**.

```
WorkOS Structure:
─────────────────
Organization: "Nairobi Academy" (orgId: org_123)
  ├── Membership: alice@nairobiacademy.ac.ke (role: admin)
  ├── Membership: bob.teacher@nairobiacademy.ac.ke (role: member)
  └── Membership: carol.parent@gmail.com (role: member)

Organization: "Mombasa High School" (orgId: org_456)
  ├── Membership: principal@mombasa.ac.ke (role: admin)
  └── Membership: teacher@mombasa.ac.ke (role: member)

Convex Mapping:
─────────────────
tenants table:
  { _id: "tenant_abc", workosOrgId: "org_123", slug: "nairobi-academy", ... }

users table:
  { _id: "user_xyz", workosUserId: "user_workos_999", tenantId: "tenant_abc",
    role: "school_admin", ... }
```

**Key WorkOS concepts used:**
- `Organization` — one per school/tenant
- `OrganizationMembership` — links a user to an organization
- `AuthorizationURL` — generates login URL for specific organization
- `UserManagementSession` — session tied to specific organization context
- `InviteOrganizationMember` — sends WorkOS-managed invite email (or we manage our own)
- `MagicAuth` — OTP login for parents (no password)

---

## 1.3 Onboarding Data Model

```typescript
// convex/schema.ts additions

waitlist: defineTable({
  fullName: v.string(),
  email: v.string(),
  schoolName: v.string(),
  country: v.string(),
  county: v.optional(v.string()),
  phone: v.optional(v.string()),
  studentCount: v.optional(v.number()),
  currentSystem: v.optional(v.string()),  // "Excel", "Google Sheets", "No system", etc.
  biggestChallenge: v.optional(v.string()),
  referralSource: v.optional(v.string()),  // "Google", "Facebook", "Word of mouth", etc.
  referralCode: v.optional(v.string()),    // if came via reseller
  status: v.union(
    v.literal("waiting"),
    v.literal("invited"),
    v.literal("converted"),
    v.literal("rejected"),
    v.literal("expired"),
  ),
  isHighValue: v.boolean(),               // auto-flagged if studentCount > 500
  qualificationScore: v.number(),         // 0-100, computed from submission fields
  assignedTo: v.optional(v.string()),     // platform_user who owns this lead
  inviteToken: v.optional(v.string()),    // UUID for invite link
  inviteExpiresAt: v.optional(v.number()),
  invitedAt: v.optional(v.number()),
  inviteEmailSentAt: v.optional(v.number()),
  convertedAt: v.optional(v.number()),
  tenantId: v.optional(v.string()),       // set on conversion
  crmLeadId: v.optional(v.id("crm_leads")),
  notes: v.optional(v.string()),
  createdAt: v.number(),
})
  .index("by_status", ["status"])
  .index("by_email", ["email"])
  .index("by_inviteToken", ["inviteToken"])
  .index("by_isHighValue", ["isHighValue"])
  .index("by_assignedTo", ["assignedTo"]),

tenant_invites: defineTable({
  // One record per pending invite, separate from waitlist
  email: v.string(),
  schoolName: v.string(),
  firstName: v.string(),
  lastName: v.string(),
  country: v.string(),
  county: v.optional(v.string()),
  phone: v.optional(v.string()),
  studentCountEstimate: v.optional(v.number()),
  suggestedPlan: v.optional(v.string()),
  suggestedModules: v.array(v.string()),
  personalMessage: v.optional(v.string()),  // from platform manager
  referralCode: v.optional(v.string()),
  resellerId: v.optional(v.string()),
  token: v.string(),                        // crypto.randomUUID() — used in invite URL
  status: v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("expired"),
    v.literal("revoked"),
  ),
  expiresAt: v.number(),                    // 7 days from creation
  invitedBy: v.string(),                    // platform_user id
  waitlistId: v.optional(v.id("waitlist")),
  crmLeadId: v.optional(v.id("crm_leads")),
  acceptedAt: v.optional(v.number()),
  tenantId: v.optional(v.string()),         // set on acceptance
  emailSentAt: v.number(),
  remindersSent: v.number(),                // count of reminder emails sent
  lastReminderAt: v.optional(v.number()),
  createdAt: v.number(),
})
  .index("by_token", ["token"])
  .index("by_email", ["email"])
  .index("by_status", ["status"])
  .index("by_resellerId", ["resellerId"]),

tenants: defineTable({
  // Core tenant record — updated with WorkOS org on creation
  name: v.string(),
  slug: v.string(),
  workosOrgId: v.string(),                 // WorkOS Organization ID
  country: v.string(),
  county: v.optional(v.string()),
  address: v.optional(v.string()),
  phone: v.optional(v.string()),
  email: v.optional(v.string()),           // school's official email
  website: v.optional(v.string()),
  logoUrl: v.optional(v.string()),
  themeColor: v.optional(v.string()),
  schoolType: v.union(
    v.literal("primary"),
    v.literal("secondary"),
    v.literal("mixed"),
    v.literal("tertiary"),
    v.literal("vocational"),
    v.literal("international"),
  ),
  levels: v.array(v.string()),             // ["primary", "secondary"]
  boardingType: v.union(
    v.literal("day"),
    v.literal("boarding"),
    v.literal("mixed"),
  ),
  timezone: v.string(),                    // "Africa/Nairobi"
  displayCurrency: v.string(),             // "KES"
  language: v.string(),                    // "en" or "sw"
  status: v.union(
    v.literal("pending_setup"),            // created but wizard not started
    v.literal("setup_in_progress"),        // wizard started
    v.literal("active"),                   // wizard completed + paying
    v.literal("trial"),                    // in 14-day trial
    v.literal("trial_expired"),            // trial ended, no payment
    v.literal("suspended"),
    v.literal("cancelled"),
  ),
  trialStartedAt: v.optional(v.number()),  // when trial clock started (activation date)
  trialEndsAt: v.optional(v.number()),     // trialStartedAt + 14 days
  activatedAt: v.optional(v.number()),     // when health score first reached 50
  registrationNumber: v.optional(v.string()),
  vatNumber: v.optional(v.string()),
  isVatExempt: v.boolean(),
  resellerId: v.optional(v.string()),
  inviteId: v.optional(v.id("tenant_invites")),
  customDomain: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_slug", ["slug"])
  .index("by_workosOrgId", ["workosOrgId"])
  .index("by_status", ["status"])
  .index("by_resellerId", ["resellerId"]),

tenant_onboarding: defineTable({
  tenantId: v.string(),
  wizardStartedAt: v.optional(v.number()),
  wizardCompletedAt: v.optional(v.number()),
  currentStep: v.number(),                  // 1-12
  healthScore: v.number(),                  // 0-50 (each step = different points)
  isActivated: v.boolean(),                 // true when score >= 50
  isStalled: v.boolean(),                   // true if no progress in 48hrs
  stalledSince: v.optional(v.number()),
  stalledAtStep: v.optional(v.number()),
  assignedAccountManager: v.optional(v.string()), // platform_user
  lastActivityAt: v.number(),
  // Per-step completion tracking
  steps: v.object({
    school_profile:        v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), pointsAwarded: v.number() }),
    academic_year:         v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), pointsAwarded: v.number() }),
    grading_system:        v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), pointsAwarded: v.number() }),
    subjects:              v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), pointsAwarded: v.number() }),
    classes:               v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), pointsAwarded: v.number() }),
    fee_structure:         v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), pointsAwarded: v.number() }),
    staff_added:           v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), pointsAwarded: v.number(), count: v.number() }),
    students_added:        v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), pointsAwarded: v.number(), count: v.number() }),
    modules_configured:    v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), pointsAwarded: v.number() }),
    portal_customized:     v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), pointsAwarded: v.number() }),
    parents_invited:       v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), pointsAwarded: v.number(), count: v.number() }),
    first_action:          v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), pointsAwarded: v.number() }),
  }),
  // Intervention tracking
  interventionsSent: v.array(v.object({
    type: v.string(),        // "stalled_email", "trial_warning", "day3_nudge"
    sentAt: v.number(),
    channel: v.string(),     // "email", "sms", "in_app"
  })),
  conversionNudgeSentAt: v.optional(v.number()),
  notes: v.optional(v.string()),            // account manager notes
})
  .index("by_tenantId", ["tenantId"])
  .index("by_isStalled", ["isStalled"])
  .index("by_isActivated", ["isActivated"])
  .index("by_healthScore", ["healthScore"])
  .index("by_lastActivityAt", ["lastActivityAt"]),
```

---

# PART 2 — STAGE 1: DISCOVERY & WAITLIST

---

## 2.1 Public Waitlist Page `/`

The landing page is not in scope for this spec, but the waitlist form submission is.

**Waitlist Form Fields:**
```
Full Name*
School Name*
Email Address*
Phone Number (WhatsApp preferred)
Country* (dropdown — Kenya pre-selected)
County/Region (shows if Kenya selected)
Estimated Student Count* (dropdown: Under 100, 100-250, 250-500, 500-1000, 1000+)
Current System (how do you manage school data today?)
  Options: Excel/Spreadsheets, Google Workspace, Paper records, Another school system, Nothing
What is your biggest challenge? (textarea, optional)
How did you hear about us?
  Options: Google Search, Facebook/Instagram, Twitter/X, WhatsApp Group, Friend/Colleague, 
           Reseller referral, School conference, Other

[ref] query param captured (reseller referral code)
```

**Submission Flow:**
```typescript
// convex/modules/platform/waitlist.ts

export const submitWaitlistForm = mutation({
  args: {
    fullName: v.string(),
    email: v.string(),
    schoolName: v.string(),
    country: v.string(),
    county: v.optional(v.string()),
    phone: v.optional(v.string()),
    studentCount: v.optional(v.number()),
    currentSystem: v.optional(v.string()),
    biggestChallenge: v.optional(v.string()),
    referralSource: v.optional(v.string()),
    referralCode: v.optional(v.string()),   // from ?ref= query param
  },
  handler: async (ctx, args) => {
    // 1. Check for duplicate email
    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", q => q.eq("email", args.email))
      .unique();

    if (existing) {
      // If already converted: just say "already registered"
      if (existing.status === "converted") {
        return { status: "already_registered", message: "You already have an account. Sign in at app.edumyles.co.ke" };
      }
      // If waiting/invited: acknowledge and update info
      await ctx.db.patch(existing._id, {
        ...args,
        // Don't downgrade status — keep existing
      });
      return { status: "updated", message: "Your details have been updated. We'll be in touch soon." };
    }

    // 2. Calculate qualification score (0-100)
    const qualScore = calculateQualificationScore(args);

    // 3. Create waitlist record
    const waitlistId = await ctx.db.insert("waitlist", {
      ...args,
      status: "waiting",
      isHighValue: (args.studentCount ?? 0) >= 500,
      qualificationScore: qualScore,
      createdAt: Date.now(),
    });

    // 4. Create CRM lead for high-value prospects
    if (qualScore >= 60 || (args.studentCount ?? 0) >= 250) {
      await ctx.scheduler.runAfter(0, internal.platform.crm.createLeadFromWaitlist, {
        waitlistId,
      });
    }

    // 5. Send confirmation email
    await ctx.scheduler.runAfter(0, internal.communications.email.sendWaitlistConfirmation, {
      email: args.email,
      firstName: args.fullName.split(" ")[0],
      schoolName: args.schoolName,
    });

    // 6. Validate referral code and attribute
    if (args.referralCode) {
      await ctx.scheduler.runAfter(0, internal.reseller.attributeWaitlistEntry, {
        waitlistId,
        referralCode: args.referralCode,
      });
    }

    // 7. Notify platform team via Slack for high-value leads
    if (qualScore >= 75 || (args.studentCount ?? 0) >= 500) {
      await ctx.scheduler.runAfter(0, internal.platform.slack.notifyHighValueLead, {
        waitlistId,
        qualScore,
      });
    }

    return { status: "success", waitlistId };
  }
});

function calculateQualificationScore(args: WaitlistArgs): number {
  let score = 0;

  // Student count (weight: 30 points max)
  if (args.studentCount) {
    if (args.studentCount >= 1000) score += 30;
    else if (args.studentCount >= 500) score += 25;
    else if (args.studentCount >= 250) score += 20;
    else if (args.studentCount >= 100) score += 15;
    else score += 5;
  }

  // Country (weight: 20 points max)
  const primaryMarkets = ["Kenya", "Uganda", "Tanzania", "Rwanda", "Ethiopia"];
  const secondaryMarkets = ["Nigeria", "Ghana", "South Africa", "Zambia"];
  if (primaryMarkets.includes(args.country)) score += 20;
  else if (secondaryMarkets.includes(args.country)) score += 15;
  else score += 5;

  // Has phone (weight: 10 points — indicates engagement)
  if (args.phone) score += 10;

  // Current system indicates pain point (weight: 15 points)
  if (args.currentSystem === "Paper records") score += 15;
  else if (args.currentSystem === "Excel/Spreadsheets") score += 12;
  else if (args.currentSystem === "Nothing") score += 10;
  else if (args.currentSystem === "Another school system") score += 8;

  // Filled challenge field (weight: 10 points — engaged)
  if (args.biggestChallenge && args.biggestChallenge.length > 20) score += 10;

  // Referral (weight: 15 points — higher intent)
  if (args.referralCode) score += 15;
  else if (args.referralSource === "Friend/Colleague") score += 10;
  else if (args.referralSource === "School conference") score += 12;

  return Math.min(100, score);
}
```

---

## 2.2 Demo Booking Flow

Alternative to waitlist — school books a demo directly:

**Demo Booking Page `/demo`:**
```
Full Name*
Email*
School Name*
Phone Number*
Country*
Student Count*
Preferred call time (date + time picker)
What would you like to see? (checkboxes: Finance, Attendance, Grades, HR, Timetable, Other)
Any questions? (textarea)
```

On submit:
- Creates CRM lead directly (skips waitlist)
- Sends calendar invite via email (using Calendly integration or manual scheduling)
- Creates `crm_leads` record with stage: "demo_booked"
- Assigns to platform manager based on country/region

---

# PART 3 — STAGE 2: QUALIFICATION (PLATFORM ADMIN)

---

## 3.1 Waitlist Management Page `/platform/waitlist`

**Table columns:**
School Name | Email | Country | Students | Qual Score | Status | Applied | Assigned | Actions

**Filters:** Status (waiting/invited/converted/rejected), Country, Min students, High value only, Assigned to me, Unassigned

**Sort:** Qualification score desc (default), Applied date, Student count

**Bulk actions:** Invite selected, Reject selected, Assign to [platform manager]

**Waitlist entry detail:**

Click any row → slide-out panel showing:
- All submitted information
- Qualification score breakdown (visual bar)
- CRM lead link (if auto-created)
- Notes field (internal, not visible to school)
- Actions: Invite, Move to high priority, Reject, Assign

---

## 3.2 Sending an Invitation

**Invite Modal (from waitlist or from `/platform/tenants/create`):**

```
┌────────────────────────────────────────────────────────┐
│  Invite School to EduMyles                             │
│                                                        │
│  Email*           alice@nairobiacademy.ac.ke           │
│  First Name*      Alice                                │
│  Last Name*       Wanjiru                              │
│  School Name*     Nairobi Academy                      │
│  Country*         Kenya (flag)                         │
│  County           Nairobi                              │
│  Phone            +254 722 123456                      │
│  Student Count    450                                  │
│                                                        │
│  Suggested Plan   [Starter ▾]                          │
│  (Pre-select based on student count)                   │
│                                                        │
│  Pre-install modules (tick to recommend on signup):    │
│  ✅ Finance & Fees (essential)                          │
│  ✅ Attendance (essential)                              │
│  ✅ Academics (essential)                               │
│  ✅ Parent Portal (recommended)                         │
│  ☐ HR & Payroll                                        │
│  ☐ Timetable                                           │
│                                                        │
│  Personal message (optional):                          │
│  "Hi Alice, we reviewed your application and we're     │
│  excited to have Nairobi Academy on EduMyles! We've    │
│  set up your account with a 14-day trial..."           │
│                                                        │
│  Invite expires: 7 days                                │
│  Reseller attribution: [None ▾]                        │
│                                                        │
│  [Cancel]          [Send Invitation Email]             │
└────────────────────────────────────────────────────────┘
```

**Invitation Mutation:**

```typescript
// convex/modules/platform/tenants.ts

export const sendTenantInvite = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    schoolName: v.string(),
    country: v.string(),
    county: v.optional(v.string()),
    phone: v.optional(v.string()),
    studentCountEstimate: v.optional(v.number()),
    suggestedPlan: v.optional(v.string()),
    suggestedModules: v.array(v.string()),
    personalMessage: v.optional(v.string()),
    resellerId: v.optional(v.string()),
    waitlistId: v.optional(v.id("waitlist")),
    crmLeadId: v.optional(v.id("crm_leads")),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "waitlist.invite");

    // Check no pending invite for this email
    const existingInvite = await ctx.db
      .query("tenant_invites")
      .withIndex("by_email", q => q.eq("email", args.email))
      .filter(q => q.eq(q.field("status"), "pending"))
      .unique();
    if (existingInvite) throw new Error("A pending invitation already exists for this email");

    // Check no existing tenant with this email as admin
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", q => q.eq("email", args.email))
      .first();
    if (existingUser) throw new Error("This email is already registered on EduMyles");

    // Generate unique token
    const token = crypto.randomUUID();

    // Create invite record
    const inviteId = await ctx.db.insert("tenant_invites", {
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      schoolName: args.schoolName,
      country: args.country,
      county: args.county,
      phone: args.phone,
      studentCountEstimate: args.studentCountEstimate,
      suggestedPlan: args.suggestedPlan,
      suggestedModules: args.suggestedModules,
      personalMessage: args.personalMessage,
      resellerId: args.resellerId,
      token,
      status: "pending",
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      invitedBy: userId,
      waitlistId: args.waitlistId,
      crmLeadId: args.crmLeadId,
      emailSentAt: Date.now(),
      remindersSent: 0,
      createdAt: Date.now(),
    });

    // Update waitlist entry to "invited"
    if (args.waitlistId) {
      await ctx.db.patch(args.waitlistId, {
        status: "invited",
        inviteToken: token,
        inviteExpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        invitedAt: Date.now(),
        inviteEmailSentAt: Date.now(),
      });
    }

    // Update CRM lead to "invited" stage
    if (args.crmLeadId) {
      await ctx.db.patch(args.crmLeadId, {
        stage: "invited",
        updatedAt: Date.now(),
      });
    }

    // Send invitation email
    await ctx.scheduler.runAfter(0, internal.communications.email.sendTenantInviteEmail, {
      to: args.email,
      firstName: args.firstName,
      schoolName: args.schoolName,
      personalMessage: args.personalMessage,
      token,
      inviterName: "EduMyles Team", // resolve from platform user
      suggestedPlan: args.suggestedPlan,
      suggestedModules: args.suggestedModules,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    // Schedule reminder email (day 3 if not accepted)
    await ctx.scheduler.runAt(
      Date.now() + 3 * 24 * 60 * 60 * 1000,
      internal.platform.invites.sendInviteReminder,
      { inviteId, reminderNumber: 1 }
    );

    // Schedule second reminder (day 6 if not accepted)
    await ctx.scheduler.runAt(
      Date.now() + 6 * 24 * 60 * 60 * 1000,
      internal.platform.invites.sendInviteReminder,
      { inviteId, reminderNumber: 2 }
    );

    await logAudit(ctx, {
      action: "tenant_invite.sent",
      entity: inviteId,
      after: JSON.stringify({ email: args.email, school: args.schoolName }),
      performedBy: userId,
    });

    return { inviteId, token };
  }
});
```

---

## 3.3 Invitation Email Content

```
Subject: Your EduMyles invitation is ready, Alice 🎉

──────────────────────────────────────────
[EduMyles Logo]
──────────────────────────────────────────

Hi Alice,

[If personalMessage: show it in a highlighted box]

You've been invited to join EduMyles — Kenya's leading school
management platform.

As the admin for Nairobi Academy, you'll be able to:
✓ Manage all students, staff, and classes
✓ Process fee payments via M-Pesa, Airtel, and Card
✓ Track attendance and share grades with parents
✓ Run payroll with automatic NHIF, NSSF & PAYE calculations
✓ And much more with 15+ modules in the marketplace

We've pre-configured your account with the modules most suitable
for a school your size. You'll have 14 days free to explore
everything — no payment required to start.

[GET STARTED →]
https://app.edumyles.co.ke/invite/accept?token=TOKEN

This invitation expires in 7 days (15 April 2026).

──────────────────────────────────────────
Questions? Reply to this email or WhatsApp us:
+254 700 000000

EduMyles | Nairobi, Kenya
Unsubscribe · Privacy Policy · Terms
──────────────────────────────────────────
```

**Reminder Email Day 3:**
```
Subject: Your EduMyles invitation expires in 4 days

Hi Alice,

Just a reminder — your invitation to set up Nairobi Academy on
EduMyles expires in 4 days.

[GET STARTED →]

Still have questions? Book a 15-minute call with our team: [link]
```

**Reminder Email Day 6 (urgent):**
```
Subject: Last chance — your EduMyles invitation expires tomorrow

Hi Alice,

Your invitation expires tomorrow. After that, you'll need to
request a new one.

[ACCEPT INVITATION NOW →]

Need help? Our team is available: +254 700 000000
```

---

# PART 4 — STAGE 3 & 4: INVITATION ACCEPTANCE & ACCOUNT CREATION

---

## 4.1 Invite Accept Page `/invite/accept`

**URL:** `https://app.edumyles.co.ke/invite/accept?token=TOKEN`

This is a **public page** — no authentication required before reaching it.

```
Step 1: Token validation (server-side on page load)
  - Query tenant_invites by token
  - If not found: show "Invalid invitation link"
  - If status !== "pending": show "This invitation has already been used" or "expired"
  - If expiresAt < now: show "This invitation has expired — request a new one"

Step 2: Show invitation details
```

**Invitation Accept Page UI:**

```
┌────────────────────────────────────────────────────────┐
│              [EduMyles Logo]                           │
│                                                        │
│        You're invited to EduMyles                      │
│                                                        │
│  School: Nairobi Academy                               │
│  Role:   School Administrator                          │
│                                                        │
│  ──────────────────────────────────────────────        │
│                                                        │
│  Create your admin account                             │
│                                                        │
│  First Name*     [Alice              ]                 │
│  Last Name*      [Wanjiru            ]                 │
│  Email*          [alice@nairobiacademy.ac.ke] (locked) │
│  Phone*          [+254 722 123456    ]                 │
│  Password*       [••••••••           ]                 │
│  Confirm*        [••••••••           ]                 │
│                                                        │
│  Password strength: ████░░ Good                        │
│                                                        │
│  ☐ I agree to the Terms of Service and Privacy Policy  │
│                                                        │
│  [Create Account & Set Up My School →]                 │
│                                                        │
│  ──────────────────────────────────────────────        │
│  Already have an account?  [Sign In Instead]           │
└────────────────────────────────────────────────────────┘
```

**"Sign In Instead" flow:**
- User signs in with their existing WorkOS account
- On successful sign-in: show confirmation "You're about to join as admin of Nairobi Academy"
- [Accept] button → links their existing account to the new organization

---

## 4.2 Account Creation Mutation (The Critical Function)

This is the most important function in onboarding — it creates everything needed for a tenant to operate.

```typescript
// convex/modules/platform/tenants.ts

export const acceptTenantInvite = mutation({
  // PUBLIC — no requireTenantContext or requirePlatformContext
  args: {
    token: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    password: v.string(),       // hashed by WorkOS, we never see plaintext
    workosUserId: v.optional(v.string()),  // if signing in with existing account
  },
  handler: async (ctx, args) => {
    // ─── STEP 1: Validate invite ───────────────────────────────────────
    const invite = await ctx.db
      .query("tenant_invites")
      .withIndex("by_token", q => q.eq("token", args.token))
      .unique();

    if (!invite) throw new ConvexError({ code: "INVALID_TOKEN", message: "Invalid invitation link" });
    if (invite.status !== "pending") throw new ConvexError({ code: "TOKEN_USED", message: "This invitation has already been used" });
    if (invite.expiresAt < Date.now()) {
      await ctx.db.patch(invite._id, { status: "expired" });
      throw new ConvexError({ code: "TOKEN_EXPIRED", message: "This invitation has expired. Please request a new one." });
    }

    // ─── STEP 2: Create WorkOS Organization ────────────────────────────
    // This is called from a Convex action (not mutation) because it calls WorkOS API
    // The action returns the workosOrgId, then this mutation continues
    // (See pattern below for action + mutation coordination)

    const workosOrgId = await ctx.runAction(
      internal.auth.workos.createOrganization,
      {
        name: invite.schoolName,
        domains: [],  // no domain enforcement — schools use personal emails
      }
    );

    // ─── STEP 3: Create or link WorkOS User ─────────────────────────────
    let workosUserId: string;

    if (args.workosUserId) {
      // Existing WorkOS user — just link to the new org
      workosUserId = args.workosUserId;
    } else {
      // Create new WorkOS user
      workosUserId = await ctx.runAction(
        internal.auth.workos.createUser,
        {
          email: invite.email,
          firstName: args.firstName,
          lastName: args.lastName,
          password: args.password,
        }
      );
    }

    // ─── STEP 4: Create WorkOS Organization Membership ──────────────────
    await ctx.runAction(
      internal.auth.workos.createOrganizationMembership,
      {
        userId: workosUserId,
        organizationId: workosOrgId,
        roleSlug: "admin",    // WorkOS role — separate from EduMyles role
      }
    );

    // ─── STEP 5: Generate tenant slug ──────────────────────────────────
    const rawSlug = invite.schoolName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 40);

    // Ensure slug is unique
    const slug = await generateUniqueSlug(ctx, rawSlug);

    // ─── STEP 6: Create Convex tenant record ────────────────────────────
    const tenantId = await ctx.db.insert("tenants", {
      name: invite.schoolName,
      slug,
      workosOrgId,
      country: invite.country,
      county: invite.county,
      phone: invite.phone ?? args.phone,
      email: invite.email,
      schoolType: "mixed",     // default — changed in wizard
      levels: ["primary"],     // default — changed in wizard
      boardingType: "day",     // default — changed in wizard
      timezone: getDefaultTimezone(invite.country),  // "Africa/Nairobi" for Kenya
      displayCurrency: getDefaultCurrency(invite.country),
      language: "en",
      status: "pending_setup",
      isVatExempt: false,
      resellerId: invite.resellerId,
      inviteId: invite._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // ─── STEP 7: Create school admin user record in Convex ──────────────
    const userId = await ctx.db.insert("users", {
      tenantId,
      workosUserId,
      email: invite.email,
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      role: "school_admin",
      status: "active",
      timezone: getDefaultTimezone(invite.country),
      language: "en",
      createdAt: Date.now(),
    });

    // ─── STEP 8: Install core modules ───────────────────────────────────
    const now = Date.now();
    for (const coreSlug of ["core_sis", "core_users", "core_notifications"]) {
      const coreModule = await ctx.db
        .query("marketplace_modules")
        .withIndex("by_slug", q => q.eq("slug", coreSlug))
        .unique();
      if (!coreModule) continue;

      await ctx.db.insert("module_installs", {
        moduleId: coreModule._id,
        moduleSlug: coreSlug,
        tenantId,
        status: "active",
        billingPeriod: "monthly",
        currentPriceKes: 0,
        hasPriceOverride: false,
        isFree: true,
        firstInstalledAt: now,
        billingStartsAt: now,
        nextBillingDate: now + 30 * 24 * 60 * 60 * 1000,
        installedAt: now,
        installedBy: userId,
        version: coreModule.version,
        isCore: true,
      });

      // Run onInstall for each core module
      await ctx.scheduler.runAfter(0,
        internal.modules[coreSlug].onInstall,
        { tenantId }
      );
    }

    // ─── STEP 9: Create tenant onboarding record ─────────────────────────
    await ctx.db.insert("tenant_onboarding", {
      tenantId,
      currentStep: 1,
      healthScore: 0,
      isActivated: false,
      isStalled: false,
      lastActivityAt: now,
      steps: {
        school_profile:     { completed: false, pointsAwarded: 0 },
        academic_year:      { completed: false, pointsAwarded: 0 },
        grading_system:     { completed: false, pointsAwarded: 0 },
        subjects:           { completed: false, pointsAwarded: 0 },
        classes:            { completed: false, pointsAwarded: 0 },
        fee_structure:      { completed: false, pointsAwarded: 0 },
        staff_added:        { completed: false, pointsAwarded: 0, count: 0 },
        students_added:     { completed: false, pointsAwarded: 0, count: 0 },
        modules_configured: { completed: false, pointsAwarded: 0 },
        portal_customized:  { completed: false, pointsAwarded: 0 },
        parents_invited:    { completed: false, pointsAwarded: 0, count: 0 },
        first_action:       { completed: false, pointsAwarded: 0 },
      },
      interventionsSent: [],
    });

    // ─── STEP 10: Create default subscription (trial) ────────────────────
    const starterPlan = await ctx.db
      .query("subscription_plans")
      .withIndex("by_name", q => q.eq("name", "starter"))
      .unique();

    await ctx.db.insert("tenant_subscriptions", {
      tenantId,
      planId: starterPlan!._id,
      status: "trialing",
      currentPeriodStart: now,
      currentPeriodEnd: now + 14 * 24 * 60 * 60 * 1000,
      cancelAtPeriodEnd: false,
      studentCountAtBilling: 0,
      nextPaymentDue: now + 14 * 24 * 60 * 60 * 1000,
      trialEndsAt: now + 14 * 24 * 60 * 60 * 1000,
    });

    // ─── STEP 11: Update invite record ──────────────────────────────────
    await ctx.db.patch(invite._id, {
      status: "accepted",
      acceptedAt: now,
      tenantId,
    });

    // Update waitlist if applicable
    if (invite.waitlistId) {
      await ctx.db.patch(invite.waitlistId, {
        status: "converted",
        convertedAt: now,
        tenantId,
      });
    }

    // Update CRM lead if applicable
    if (invite.crmLeadId) {
      await ctx.db.patch(invite.crmLeadId, {
        stage: "converted",
        tenantId,
        updatedAt: now,
      });
    }

    // ─── STEP 12: Reseller attribution ──────────────────────────────────
    if (invite.resellerId) {
      await ctx.scheduler.runAfter(0,
        internal.reseller.attribution.recordTenantConversion,
        { resellerId: invite.resellerId, tenantId }
      );
    }

    // ─── STEP 13: Send welcome email + Slack notification ───────────────
    await ctx.scheduler.runAfter(0,
      internal.communications.email.sendWelcomeEmail,
      {
        tenantId,
        email: invite.email,
        firstName: args.firstName,
        schoolName: invite.schoolName,
        trialEndsAt: now + 14 * 24 * 60 * 60 * 1000,
      }
    );

    await ctx.scheduler.runAfter(0,
      internal.platform.slack.notifyNewTenantCreated,
      { tenantId, schoolName: invite.schoolName, plan: "trial" }
    );

    // ─── STEP 14: Audit log ──────────────────────────────────────────────
    await logAudit(ctx, {
      action: "tenant.created",
      entity: tenantId,
      after: JSON.stringify({
        schoolName: invite.schoolName,
        country: invite.country,
        workosOrgId,
        adminEmail: invite.email,
      }),
      performedBy: userId,
    });

    // ─── RETURN: session data for immediate redirect ──────────────────────
    return {
      tenantId,
      userId,
      workosUserId,
      workosOrgId,
      slug,
      redirectTo: `https://${slug}.edumyles.co.ke/admin/setup`,
    };
  }
});

async function generateUniqueSlug(ctx: MutationCtx, base: string): Promise<string> {
  let slug = base;
  let attempt = 0;
  while (true) {
    const existing = await ctx.db
      .query("tenants")
      .withIndex("by_slug", q => q.eq("slug", slug))
      .unique();
    if (!existing) return slug;
    attempt++;
    slug = `${base}-${attempt}`;
  }
}
```

---

## 4.3 WorkOS Actions (Convex Actions)

These call the WorkOS API server-side:

```typescript
// convex/actions/auth/workos.ts

export const createOrganization = internalAction({
  args: { name: v.string(), domains: v.array(v.string()) },
  handler: async (ctx, args): Promise<string> => {
    const workos = new WorkOS(process.env.WORKOS_API_KEY!);

    const org = await workos.organizations.createOrganization({
      name: args.name,
      domainData: args.domains.map(domain => ({
        domain,
        state: "verified",
      })),
    });

    return org.id; // "org_xxxxxxxxxxxx"
  }
});

export const createUser = internalAction({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    const workos = new WorkOS(process.env.WORKOS_API_KEY!);

    const user = await workos.userManagement.createUser({
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      password: args.password,
      emailVerified: false,
    });

    // Send verification email via WorkOS
    await workos.userManagement.sendVerificationEmail({
      userId: user.id,
    });

    return user.id; // "user_xxxxxxxxxxxx"
  }
});

export const createOrganizationMembership = internalAction({
  args: {
    userId: v.string(),
    organizationId: v.string(),
    roleSlug: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const workos = new WorkOS(process.env.WORKOS_API_KEY!);

    await workos.userManagement.createOrganizationMembership({
      userId: args.userId,
      organizationId: args.organizationId,
      roleSlug: args.roleSlug,
    });
  }
});

export const inviteUserToOrganization = internalAction({
  args: {
    email: v.string(),
    organizationId: v.string(),
    roleSlug: v.string(),
    inviterUserId: v.string(),
    redirectUri: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    const workos = new WorkOS(process.env.WORKOS_API_KEY!);

    // WorkOS sends the invite email itself (or we send our own)
    const invitation = await workos.userManagement.sendInvitation({
      email: args.email,
      organizationId: args.organizationId,
      roleSlug: args.roleSlug,
      inviterUserId: args.inviterUserId,
      redirectUri: args.redirectUri,
    });

    return invitation.token;
  }
});

export const getOrganizationAuthUrl = internalAction({
  args: { organizationId: v.string(), redirectUri: v.string() },
  handler: async (ctx, args): Promise<string> => {
    const workos = new WorkOS(process.env.WORKOS_API_KEY!);

    const authorizationUrl = workos.userManagement.getAuthorizationUrl({
      provider: "authkit",
      redirectUri: args.redirectUri,
      organizationId: args.organizationId,
    });

    return authorizationUrl;
  }
});

export const deleteOrganization = internalAction({
  args: { organizationId: v.string() },
  handler: async (ctx, args): Promise<void> => {
    const workos = new WorkOS(process.env.WORKOS_API_KEY!);
    await workos.organizations.deleteOrganization(args.organizationId);
  }
});
```

---

## 4.4 Post-Accept Redirect Flow

After `acceptTenantInvite` succeeds:

```typescript
// frontend/src/app/invite/accept/page.tsx

async function handleAcceptInvite(formData: FormData) {
  // 1. Call acceptTenantInvite mutation
  const result = await acceptTenantInvite({
    token,
    firstName: formData.firstName,
    lastName: formData.lastName,
    phone: formData.phone,
    password: formData.password,
  });

  // 2. Get WorkOS session for the new organization
  // WorkOS AuthKit handles creating the session after user creation
  const authUrl = await getOrganizationAuthUrl({
    organizationId: result.workosOrgId,
    redirectUri: result.redirectTo,
  });

  // 3. Redirect to WorkOS AuthKit to create session
  // AuthKit creates the session and redirects to redirectTo
  window.location.href = authUrl;
}
```

The flow is:
```
Accept invite → Create Convex records → Get WorkOS auth URL →
Redirect to WorkOS AuthKit login → WorkOS creates session →
Redirect to https://[slug].edumyles.co.ke/admin/setup
```

---

## 4.5 Welcome Email Content

```
Subject: Welcome to EduMyles — let's set up Nairobi Academy 🏫

Hi Alice,

Nairobi Academy is now on EduMyles. Your 14-day free trial has started.

Here's what to do next:

Step 1: Set up your school profile (5 minutes)
  School name, logo, colors, academic year, and grading system

Step 2: Add your classes and subjects (10 minutes)
  Create Form 1-4 (or Grade 1-8), add all subjects

Step 3: Import your students (15 minutes)
  Download our CSV template and upload your student list

Step 4: Invite your teachers (5 minutes)
  Teachers will receive an email to create their accounts

Step 5: Explore modules (ongoing)
  Finance, Attendance, Gradebook, and more are waiting for you

[CONTINUE SETUP →]
https://nairobi-academy.edumyles.co.ke/admin/setup

Your trial ends: 22 April 2026 (14 days)

Need help? Our team is available:
📧 support@edumyles.co.ke
📱 WhatsApp: +254 700 000000
📞 Call: +254 700 000000

The EduMyles Team
```

---

# PART 5 — STAGE 5: SETUP WIZARD (12 STEPS)

---

## 5.1 Wizard Architecture

The wizard lives at `/admin/setup` and is also accessible from the admin dashboard when setup is incomplete. After wizard completion, it redirects to `/admin`.

**Wizard shell behavior:**
- Progress bar at top showing 12 steps with icons
- Current step highlighted
- Completed steps show ✓ checkmark
- Can navigate back to previous steps (forward navigation locked until current step complete)
- "Save & Continue Later" available from step 3+ — saves progress and goes to dashboard
- Dashboard shows persistent "Complete Setup" banner with health score and next step

**Health Score Points System:**
```
Step 1 — School Profile:          8 points
Step 2 — Academic Year:           8 points
Step 3 — Grading System:          4 points
Step 4 — Subjects Setup:          4 points
Step 5 — Classes Created:         5 points
Step 6 — Fee Structure:           5 points
Step 7 — Staff Added:             5 points  (at least 1 teacher)
Step 8 — Students Added:          7 points  (at least 10 students)
Step 9 — Modules Configured:      2 points  (accessed marketplace once)
Step 10 — Portal Customized:      1 point   (logo or color set)
Step 11 — Parents Invited:        1 point   (at least 1 parent invited)
Step 12 — First Real Action:      1 point   (attendance marked OR invoice created)
─────────────────────────────────────────────
Total:                            51 points (threshold: 50 for activation)
```

---

## 5.2 Step 1 — School Profile

**URL:** `/admin/setup?step=1`

```
┌──────────────────────────────────────────────────────────┐
│  Step 1 of 12: Tell us about your school                 │
│  ████░░░░░░░░░░░░░░░░  8%                                │
│                                                          │
│  School Name*       [Nairobi Academy           ]         │
│                     (pre-filled from invite)             │
│                                                          │
│  School Type*       [Secondary School ▾]                 │
│  Options: Primary, Secondary, Mixed, Tertiary, Vocational│
│           International                                  │
│                                                          │
│  School Levels*     ☐ Pre-Primary                        │
│  (multi-select)     ✅ Primary (Grade 1-8)               │
│                     ✅ Secondary (Form 1-4)               │
│                     ☐ Junior Secondary (Grade 7-9, CBC)  │
│                     ☐ Tertiary                           │
│                                                          │
│  Boarding Type*     ○ Day School  ● Mixed  ○ Boarding    │
│                                                          │
│  Official Email     [info@nairobiacademy.ac.ke ]         │
│  Phone Number       [+254 722 123456          ]          │
│  Website            [https://nairobiacademy.ac.ke]       │
│  Physical Address   [Westlands, Nairobi        ]         │
│  County             [Nairobi ▾                ]          │
│                                                          │
│  Registration No.   [MoE/SEC/2015/001         ]          │
│  (Ministry of Ed)                                        │
│                                                          │
│  School Logo        [Upload Logo ↑]                      │
│                     PNG/SVG, min 200×200px               │
│                     [Preview shows here]                 │
│                                                          │
│  Language           ○ English  ○ Swahili  ● Both         │
│                                                          │
│         [Skip for Now]        [Save & Continue →]        │
└──────────────────────────────────────────────────────────┘
```

**Wizard Step Mutation Pattern:**

```typescript
// convex/modules/core/setupWizard.ts

export const completeWizardStep = mutation({
  args: {
    stepKey: v.union(
      v.literal("school_profile"), v.literal("academic_year"),
      v.literal("grading_system"), v.literal("subjects"),
      v.literal("classes"), v.literal("fee_structure"),
      v.literal("staff_added"), v.literal("students_added"),
      v.literal("modules_configured"), v.literal("portal_customized"),
      v.literal("parents_invited"), v.literal("first_action")
    ),
    data: v.optional(v.string()),  // JSON — step-specific data
  },
  handler: async (ctx, args) => {
    const { tenantId, userId } = await requireTenantContext(ctx);

    const onboarding = await ctx.db
      .query("tenant_onboarding")
      .withIndex("by_tenantId", q => q.eq("tenantId", tenantId))
      .unique();
    if (!onboarding) throw new Error("Onboarding record not found");

    // Already completed this step?
    if (onboarding.steps[args.stepKey].completed) return;

    const STEP_POINTS: Record<string, number> = {
      school_profile: 8, academic_year: 8, grading_system: 4,
      subjects: 4, classes: 5, fee_structure: 5, staff_added: 5,
      students_added: 7, modules_configured: 2, portal_customized: 1,
      parents_invited: 1, first_action: 1,
    };

    const pointsForStep = STEP_POINTS[args.stepKey];
    const newScore = Math.min(51, onboarding.healthScore + pointsForStep);
    const now = Date.now();

    const stepUpdate = {
      completed: true,
      completedAt: now,
      pointsAwarded: pointsForStep,
    };

    // Merge step-specific additional data
    if (args.stepKey === "staff_added" || args.stepKey === "students_added" || args.stepKey === "parents_invited") {
      const parsed = JSON.parse(args.data ?? "{}");
      stepUpdate.count = parsed.count ?? 0;
    }

    await ctx.db.patch(onboarding._id, {
      [`steps.${args.stepKey}`]: stepUpdate,
      healthScore: newScore,
      lastActivityAt: now,
      isStalled: false,  // reset stalled flag on any activity
    });

    // Check for activation milestone (score >= 50 for first time)
    if (newScore >= 50 && !onboarding.isActivated) {
      await ctx.db.patch(onboarding._id, { isActivated: true });
      await ctx.db.patch(tenantId, {
        status: "trial",
        trialStartedAt: now,
        trialEndsAt: now + 14 * 24 * 60 * 60 * 1000,
        activatedAt: now,
      });
      // Notify platform team
      await ctx.scheduler.runAfter(0,
        internal.platform.slack.notifyTenantActivated,
        { tenantId }
      );
      // Send congratulations email
      await ctx.scheduler.runAfter(0,
        internal.communications.email.sendActivationCongratulations,
        { tenantId }
      );
    }

    // Update tenant status if first step completed
    if (tenantId.status === "pending_setup") {
      await ctx.db.patch(tenantId, { status: "setup_in_progress" });
    }

    await logAudit(ctx, {
      action: `onboarding.step.${args.stepKey}.completed`,
      entity: tenantId,
      after: JSON.stringify({ points: pointsForStep, newScore }),
      performedBy: userId,
    });
  }
});
```

---

## 5.3 Step 2 — Academic Year

```
┌──────────────────────────────────────────────────────────┐
│  Step 2 of 12: Set up your academic year                 │
│  ████████░░░░░░░░░░░░  17%                               │
│                                                          │
│  Academic Year Name*   [2025                    ]        │
│                                                          │
│  Year Start Date*      [01/01/2025  📅]                  │
│  Year End Date*        [30/11/2025  📅]                  │
│                                                          │
│  Structure*                                              │
│  ○ 3 Terms (Kenya standard)                              │
│  ○ 2 Semesters                                           │
│  ○ 4 Quarters                                            │
│  ○ Custom                                                │
│                                                          │
│  ─── Terms (auto-filled, editable) ────────────────────  │
│  Term 1                                                  │
│  Start: [01/01/2025] End: [31/03/2025]                   │
│  Fee due date: [10/01/2025]                              │
│                                                          │
│  Term 2                                                  │
│  Start: [05/05/2025] End: [25/07/2025]                   │
│  Fee due date: [12/05/2025]                              │
│                                                          │
│  Term 3                                                  │
│  Start: [01/09/2025] End: [30/11/2025]                   │
│  Fee due date: [08/09/2025]                              │
│                                                          │
│  ─── Working Days ──────────────────────────────────────  │
│  ✅ Monday  ✅ Tuesday  ✅ Wednesday  ✅ Thursday  ✅ Friday  │
│  ☐ Saturday  ☐ Sunday                                    │
│                                                          │
│  School hours:  [07:30] to [17:00]                       │
│                                                          │
│  ─── Public Holidays ───────────────────────────────────  │
│  [Import Kenya 2025 public holidays] (pre-loaded list)   │
│                                                          │
│  Imported holidays preview:                              │
│  Jan 1 — New Year's Day                                  │
│  Apr 18 — Good Friday                                    │
│  ...                                                     │
│                                                          │
│         [← Back]        [Save & Continue →]              │
└──────────────────────────────────────────────────────────┘
```

**On save:** Calls `createAcademicYear` mutation → creates `academic_years`, `academic_terms`, `school_holidays` records → calls `completeWizardStep("academic_year")`

---

## 5.4 Step 3 — Grading System

```
┌──────────────────────────────────────────────────────────┐
│  Step 3 of 12: Choose your grading system                │
│  ████████████░░░░░░░░  25%                               │
│                                                          │
│  Select the grading system used in your school:          │
│                                                          │
│  ● Kenya Secondary (KCSE)  ← most common for secondary  │
│    A, A-, B+, B, B-, C+, C, C-, D+, D, D-, E (12 points)│
│                                                          │
│  ○ Kenya CBC (Primary)                                   │
│    EE, ME, AE, BE (Exceeds/Meets/Approaching/Below)      │
│                                                          │
│  ○ Percentage (0-100%)                                   │
│    Simple percentage grades                              │
│                                                          │
│  ○ International                                         │
│    A*, A, B, C, D, E, F (Cambridge/IB style)             │
│                                                          │
│  ○ Custom                                                │
│    Define your own grade boundaries                      │
│                                                          │
│  ─── Preview of selected system ─────────────────────── │
│  Grade  Min%  Max%  Points  Description                  │
│  A      80    100   12      Excellent                    │
│  A-     75    79    11      Very Good                    │
│  B+     70    74    10                                   │
│  ...                                                     │
│                                                          │
│  What does a student score of 73% get?  → B+            │
│                                                          │
│         [← Back]        [Save & Continue →]              │
└──────────────────────────────────────────────────────────┘
```

---

## 5.5 Step 4 — Subjects

```
┌──────────────────────────────────────────────────────────┐
│  Step 4 of 12: Set up your subjects                      │
│  ████████████████░░░░  33%                               │
│                                                          │
│  Start from a preset or add manually:                    │
│                                                          │
│  [Use Kenya Secondary Preset] (loads 15 standard subjects)│
│  [Use Kenya CBC Primary Preset]                          │
│  [Start from scratch]                                    │
│                                                          │
│  ─── Subjects (editable) ───────────────────────────────  │
│  ✅ English         Code: ENG   Core  All Forms           │
│  ✅ Kiswahili       Code: KIS   Core  All Forms           │
│  ✅ Mathematics     Code: MAT   Core  All Forms           │
│  ✅ Biology         Code: BIO   Core  Form 2-4            │
│  ✅ Chemistry       Code: CHE   Core  Form 2-4            │
│  ✅ Physics         Code: PHY   Core  Form 2-4            │
│  ✅ History & Gov   Code: HGC   Core  Form 1-4            │
│  ✅ Geography       Code: GEO   Core  Form 1-4            │
│  ✅ CRE             Code: CRE   Elective  All Forms       │
│  ✅ Business Stud.  Code: BST   Elective  Form 1-4        │
│  ✅ Computer Stud.  Code: CST   Elective  Form 1-4        │
│  [+ Add Custom Subject]                                  │
│                                                          │
│  Add Subject:                                            │
│  Name [_____________] Code [___] Core/Elective [Core ▾] │
│  Applies to: [All levels ▾]                              │
│  [Add]                                                   │
│                                                          │
│         [← Back]        [Save & Continue →]              │
└──────────────────────────────────────────────────────────┘
```

---

## 5.6 Step 5 — Classes

```
┌──────────────────────────────────────────────────────────┐
│  Step 5 of 12: Create your classes                       │
│  ████████████████████░  42%                              │
│                                                          │
│  Based on your school type (Secondary), we suggest:     │
│  Form 1, Form 2, Form 3, Form 4                          │
│                                                          │
│  [Use Suggested Structure]   [Set up manually]           │
│                                                          │
│  ─── Class Structure ──────────────────────────────────  │
│                                                          │
│  Form 1                                                  │
│  Streams: [A] [B] [C] [+ Add Stream]                     │
│  Capacity per stream: [45]                               │
│  Class Teacher: [Assign later ▾]                         │
│                                                          │
│  Form 2    Streams: A, B, C    Capacity: 45              │
│  Form 3    Streams: A, B       Capacity: 45              │
│  Form 4    Streams: A, B       Capacity: 45              │
│                                                          │
│  Stream naming convention:                               │
│  ● Letters (A, B, C)                                     │
│  ○ Animals (Lion, Eagle, Leopard)                        │
│  ○ Numbers (1, 2, 3)                                     │
│  ○ Custom                                                │
│                                                          │
│  ─── Subject Assignment ───────────────────────────────  │
│  Which subjects does each form study?                    │
│  (based on your subjects setup above)                    │
│                                                          │
│  Form 1-2:  English, Kiswahili, Maths, Biology, Chemistry│
│             Physics, History, Geography, CRE, BST        │
│  Form 3-4:  Same + select elective combinations          │
│                                                          │
│  Total classes created: 10 (4 forms × avg 2.5 streams)  │
│                                                          │
│         [← Back]        [Save & Continue →]              │
└──────────────────────────────────────────────────────────┘
```

---

## 5.7 Step 6 — Fee Structure

```
┌──────────────────────────────────────────────────────────┐
│  Step 6 of 12: Set up your fee structure                 │
│  █████████████████████  50%                              │
│                                                          │
│  ℹ️ You can change this later in Finance → Fee Structures │
│                                                          │
│  Student Categories (optional):                          │
│  ✅ Day Scholar (default)                                 │
│  ☐  Boarder                                              │
│  ☐  International                                        │
│  [+ Add Category]                                        │
│                                                          │
│  ─── Fees for Term 1 2025 ─────────────────────────────  │
│  (Day Scholar, All Classes)                              │
│                                                          │
│  Fee Components:                                         │
│  [+ Add Fee Component]                                   │
│                                                          │
│  Tuition Fee*       KES [____________]  Mandatory        │
│  Activity Fee       KES [____________]  ● Mandatory  ○ Optional│
│  Lunch Fee          KES [____________]  ○ Mandatory  ● Optional│
│  [+ Add another]                                         │
│                                                          │
│  Total per student:  KES 18,000                          │
│                                                          │
│  Due date:  [10/01/2025 📅]                              │
│                                                          │
│  Late payment fine:  ● Yes  ○ No                         │
│  Fine type: ● 5% of invoice  ○ Fixed KES amount          │
│  Fine after: [7] days past due date                      │
│                                                          │
│  Payment methods accepted:                               │
│  ✅ M-Pesa  ✅ Airtel Money  ✅ Bank Transfer  ☐ Card      │
│                                                          │
│  M-Pesa Paybill No:  [222111]                            │
│  Account reference:  [{admNo}] (admission number)        │
│                                                          │
│         [← Back]        [Save & Continue →]              │
│         [Skip — I'll set up fees later]                  │
└──────────────────────────────────────────────────────────┘
```

**On save:** Creates `fee_structures` record AND generates invoices for all students (if any) in draft status — they must be activated manually to send to parents.

---

## 5.8 Step 7 — Staff

```
┌──────────────────────────────────────────────────────────┐
│  Step 7 of 12: Add your staff                            │
│  ████████████████████████  58%                           │
│                                                          │
│  Add teachers and other staff so they can log in         │
│  and start using the system.                             │
│                                                          │
│  Add individually:                                       │
│  First Name*  [______________]  Last Name*  [__________] │
│  Email*       [______________]  Role*       [Teacher ▾]  │
│  Department   [______________]  Phone       [__________] │
│  [+ Add Another]  [Send Invite]                          │
│                                                          │
│  ─── OR ────────────────────────────────────────────── ──│
│                                                          │
│  Import from CSV:                                        │
│  [Download Staff Template]                               │
│  [Upload CSV ↑]                                          │
│                                                          │
│  ─── Added Staff ──────────────────────────────────────  │
│  NAME              EMAIL              ROLE    INVITE STATUS│
│  John Kamau        jkamau@...         Teacher  Pending   │
│  Mary Njeri        mnjeri@...         Teacher  Sent      │
│  [Add more]                                              │
│                                                          │
│  0 of 3 staff have created their accounts                │
│                                                          │
│  💡 Staff will receive an email invitation to create     │
│     their account. They can also log in via Google.      │
│                                                          │
│         [← Back]        [Save & Continue →]              │
│         [Skip — I'll add staff later]                    │
└──────────────────────────────────────────────────────────┘
```

**Staff invitation flow (detailed in Part 7).**

---

## 5.9 Step 8 — Students

```
┌──────────────────────────────────────────────────────────┐
│  Step 8 of 12: Add your students                         │
│  ██████████████████████████  67%                         │
│                                                          │
│  Choose how to add students:                             │
│                                                          │
│  [📋 Import from CSV] ← fastest for existing schools    │
│  [+ Add Manually]                                        │
│  [Skip for now]                                          │
│                                                          │
│  ─── Import from CSV ──────────────────────────────────  │
│  [Download Student Template]                             │
│                                                          │
│  Template includes: first_name, last_name, date_of_birth,│
│  gender, class_name, admission_number, parent1_name,     │
│  parent1_phone, parent1_email, parent2_name,             │
│  parent2_phone, fee_category                             │
│                                                          │
│  [Upload your CSV ↑] (.csv, max 5,000 rows per upload)  │
│                                                          │
│  ─── After upload ────────────────────────────────────── │
│  Validating... ████████████░░ 3 errors found             │
│                                                          │
│  Errors:                                                 │
│  Row 12: Missing admission_number                        │
│  Row 45: Invalid date format for date_of_birth (use DD/MM/YYYY)│
│  Row 89: Class "Form 1D" not found (check your classes)  │
│                                                          │
│  [Fix errors & re-upload]  [Import 447 valid rows]       │
│                                                          │
│  ─── After import ─────────────────────────────────────  │
│  ✅ 447 students imported successfully                   │
│  Classes:  Form 1 (142) | Form 2 (110) | Form 3 (98) |  │
│            Form 4 (97)                                   │
│                                                          │
│         [← Back]        [Save & Continue →]              │
└──────────────────────────────────────────────────────────┘
```

**When students are imported:** Fire `student.enrolled` event for each → Finance auto-creates admission invoices → Parent accounts queued for creation.

---

## 5.10 Step 9 — Explore Modules

```
┌──────────────────────────────────────────────────────────┐
│  Step 9 of 12: Explore the marketplace                   │
│  ████████████████████████████  75%                       │
│                                                          │
│  Extend your school's capabilities with modules.         │
│  Your trial includes all Pro modules free for 14 days.  │
│                                                          │
│  ─── Recommended for you ──────────────────────────────  │
│                                                          │
│  [✓] Finance & Fees (KES 20/student/month)               │
│      Essential for fee management and M-Pesa collection  │
│      [Explore]  [Already configured ✅]                  │
│                                                          │
│  [✓] Attendance (KES 10/student/month)                   │
│      Daily attendance with parent SMS alerts             │
│      [Install & Try Free]                                │
│                                                          │
│  [ ] HR & Payroll (KES 18/student/month)                 │
│      Staff payroll with NHIF/NSSF/PAYE auto-calculation  │
│      [Install & Try Free]                                │
│                                                          │
│  [ ] Timetable (KES 8/student/month)                     │
│      Drag-and-drop class scheduling                      │
│      [Install & Try Free]                                │
│                                                          │
│  [ ] Parent Portal (KES 8/student/month)                 │
│      Parents see grades, fees, attendance on their phone │
│      [Install & Try Free]                                │
│                                                          │
│  [View all 15 modules in marketplace →]                  │
│                                                          │
│  💡 All modules are free during your 14-day trial.       │
│     You only pay after your trial ends.                  │
│                                                          │
│         [← Back]        [Save & Continue →]              │
└──────────────────────────────────────────────────────────┘
```

---

## 5.11 Step 10 — Portal Customization

```
┌──────────────────────────────────────────────────────────┐
│  Step 10 of 12: Customize your school portal             │
│  ██████████████████████████████  83%                     │
│                                                          │
│  Make EduMyles look like it belongs to Nairobi Academy   │
│                                                          │
│  School Logo:                                            │
│  [Current: logo.png 🖼️]  [Change Logo]                  │
│  (Shows in all portals and emails)                       │
│                                                          │
│  Primary Color:   [#1B4F72 🎨] ← your brand color       │
│  (Used for buttons, nav, and accents)                    │
│                                                          │
│  ─── Live Preview ─────────────────────────────────────  │
│  [Preview of student portal with school logo and colors] │
│                                                          │
│  School Motto (optional):                                │
│  [Excellence through Discipline and Hard Work  ]         │
│  (Shown on login page and student portal)                │
│                                                          │
│  Student Portal URL:                                     │
│  https://nairobi-academy.edumyles.co.ke                  │
│  (Share this with students and parents)                  │
│                                                          │
│  Admin Portal URL:                                       │
│  https://nairobi-academy.edumyles.co.ke/admin            │
│                                                          │
│         [← Back]        [Save & Continue →]              │
└──────────────────────────────────────────────────────────┘
```

---

## 5.12 Step 11 — Invite Parents

```
┌──────────────────────────────────────────────────────────┐
│  Step 11 of 12: Invite parents                           │
│  ████████████████████████████████  92%                  │
│                                                          │
│  Parents can view their child's grades, fees, and        │
│  attendance — and pay fees via M-Pesa on their phone.    │
│                                                          │
│  447 students imported. We found parent contact details  │
│  for 389 students.                                       │
│                                                          │
│  ─── Send parent invitations ───────────────────────────  │
│                                                          │
│  📱 SMS to 389 parents (via M-Pesa registered numbers)   │
│     Cost: 389 × KES 0.80 = KES 311.20                   │
│     (deducted from your SMS credits — first 500 free)    │
│                                                          │
│  📧 Email to 234 parents (where email provided)          │
│     Free                                                 │
│                                                          │
│  Preview SMS:                                            │
│  "Nairobi Academy is now on EduMyles. As parent of       │
│  [Student Name], you can view grades, fees & attendance. │
│  Register at: app.edumyles.co.ke/join/SCHOOLCODE"        │
│                                                          │
│  [Send to All 389 Parents]                               │
│  [Send Test to Myself First]                             │
│                                                          │
│  ─── OR invite individually ────────────────────────────  │
│  [Invite specific parents by name/student]               │
│                                                          │
│  ─── 58 parents with missing contact info ─────────────  │
│  [Download list]  [Add contacts manually]                │
│                                                          │
│         [← Back]        [Save & Continue →]              │
│         [Skip for now]                                   │
└──────────────────────────────────────────────────────────┘
```

---

## 5.13 Step 12 — First Real Action

```
┌──────────────────────────────────────────────────────────┐
│  Step 12 of 12: Take your first action                   │
│  ████████████████████████████████████  99%               │
│                                                          │
│  🎉 Almost done! Complete one of these to activate       │
│  your school:                                            │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  📋 Mark today's attendance                    │     │
│  │  Record attendance for any class today.        │     │
│  │  [Mark Attendance →]                           │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  💰 Create a fee invoice                       │     │
│  │  Activate your fee structure to generate        │     │
│  │  student invoices for Term 1.                   │     │
│  │  [Activate Fee Structure →]                    │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  📚 Post an assignment                         │     │
│  │  Create an assignment for any class.           │     │
│  │  [Create Assignment →]                         │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  Completing any of these will:                           │
│  ✅ Activate your 14-day free trial                      │
│  ✅ Unlock access to all Pro modules                     │
│  ✅ Assign you a dedicated account manager               │
│                                                          │
│         [← Back]                                         │
└──────────────────────────────────────────────────────────┘
```

---

## 5.14 Wizard Completion Screen

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│              🎉 Nairobi Academy is live!                 │
│                                                          │
│     Your setup score: 51/51 ██████████████████████      │
│                                                          │
│  ✅ School profile          ✅ Academic year              │
│  ✅ Grading system          ✅ Subjects (15 added)        │
│  ✅ Classes (10 created)    ✅ Fee structure              │
│  ✅ Staff (12 invited)      ✅ Students (447 imported)    │
│  ✅ 5 modules active        ✅ Portal customized          │
│  ✅ 389 parents invited     ✅ First action complete       │
│                                                          │
│  Your 14-day free trial has started.                     │
│  Trial ends: 22 April 2026                               │
│                                                          │
│  Your dedicated account manager:                         │
│  [Photo] James Mwangi                                    │
│  james.m@edumyles.co.ke  |  +254 722 888 888             │
│  "Hi Alice, I'm here to help you get the most out of     │
│  EduMyles. I'll call you tomorrow at 10am EAT to check  │
│  in. Feel free to WhatsApp me anytime."                  │
│                                                          │
│  [Go to Dashboard →]                                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

# PART 6 — STAGE 5 (CONTINUED): STAFF INVITATION FLOW

---

## 6.1 Staff Invite from Wizard or Admin Panel

When school admin adds a staff member (in wizard Step 7 or from `/admin/staff/create`):

```typescript
// convex/modules/core/users.ts

export const inviteStaffMember = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.union(
      v.literal("teacher"), v.literal("principal"),
      v.literal("school_admin"), v.literal("portal_admin"),
    ),
    department: v.optional(v.string()),
    phone: v.optional(v.string()),
    staffNumber: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId } = await requireTenantContext(ctx);

    // Check no existing user with this email in this tenant
    const existing = await ctx.db
      .query("users")
      .withIndex("by_tenantId", q => q.eq("tenantId", tenantId))
      .filter(q => q.eq(q.field("email"), args.email))
      .unique();
    if (existing) throw new Error("A user with this email already exists in your school");

    const tenant = await ctx.db.get(tenantId);
    if (!tenant) throw new Error("Tenant not found");

    // Generate invite token
    const inviteToken = crypto.randomUUID();

    // Create staff invite record
    const staffInviteId = await ctx.db.insert("staff_invites", {
      tenantId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role,
      department: args.department,
      phone: args.phone,
      staffNumber: args.staffNumber,
      jobTitle: args.jobTitle,
      token: inviteToken,
      status: "pending",
      invitedBy: userId,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      createdAt: Date.now(),
    });

    // Send WorkOS invite to join the organization
    const inviteUrl = await ctx.runAction(
      internal.auth.workos.inviteUserToOrganization,
      {
        email: args.email,
        organizationId: tenant.workosOrgId,
        roleSlug: "member",
        inviterUserId: userId,
        redirectUri: `https://${tenant.slug}.edumyles.co.ke/staff/accept?token=${inviteToken}`,
      }
    );

    // Send our own branded invite email
    await ctx.scheduler.runAfter(0,
      internal.communications.email.sendStaffInviteEmail,
      {
        to: args.email,
        firstName: args.firstName,
        schoolName: tenant.name,
        role: args.role,
        inviteUrl: `https://${tenant.slug}.edumyles.co.ke/staff/accept?token=${inviteToken}`,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      }
    );

    // Create a draft staff record (full record created on acceptance)
    await ctx.db.insert("staff", {
      tenantId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      staffNumber: args.staffNumber ?? await generateStaffNumber(ctx, tenantId),
      jobTitle: args.jobTitle ?? args.role,
      department: args.department ?? "",
      role: args.role,
      status: "pending_invite",
      phone: args.phone ?? "",
      inviteToken,
      createdAt: Date.now(),
    });

    await logAudit(ctx, {
      action: "staff.invited",
      entity: staffInviteId,
      after: JSON.stringify({ email: args.email, role: args.role }),
      performedBy: userId,
    });

    return { staffInviteId, inviteToken };
  }
});
```

---

## 6.2 Staff Accept Invite Page `/staff/accept`

**URL:** `https://nairobi-academy.edumyles.co.ke/staff/accept?token=TOKEN`

```typescript
// convex/modules/core/users.ts

export const acceptStaffInvite = mutation({
  args: {
    token: v.string(),
    workosUserId: v.string(),   // from WorkOS after auth
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate invite
    const invite = await ctx.db
      .query("staff_invites")
      .withIndex("by_token", q => q.eq("token", args.token))
      .unique();
    if (!invite) throw new Error("Invalid invite link");
    if (invite.status !== "pending") throw new Error("This invite has already been used");
    if (invite.expiresAt < Date.now()) throw new Error("This invite has expired");

    const tenant = await ctx.db.get(invite.tenantId);
    if (!tenant) throw new Error("School not found");

    // Create WorkOS membership if not done via WorkOS flow
    await ctx.runAction(internal.auth.workos.createOrganizationMembership, {
      userId: args.workosUserId,
      organizationId: tenant.workosOrgId,
      roleSlug: "member",
    });

    // Create Convex user record
    const userId = await ctx.db.insert("users", {
      tenantId: invite.tenantId,
      workosUserId: args.workosUserId,
      email: invite.email,
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone ?? invite.phone,
      role: invite.role,
      status: "active",
      timezone: getDefaultTimezone(tenant.country),
      language: "en",
      createdAt: Date.now(),
    });

    // Update staff record from pending to active
    const staffRecord = await ctx.db
      .query("staff")
      .withIndex("by_tenantId", q => q.eq("tenantId", invite.tenantId))
      .filter(q => q.eq(q.field("inviteToken"), args.token))
      .unique();

    if (staffRecord) {
      await ctx.db.patch(staffRecord._id, {
        workosUserId: args.workosUserId,
        userId,
        status: "active",
        firstName: args.firstName,
        lastName: args.lastName,
        phone: args.phone ?? invite.phone,
        inviteToken: undefined,
      });
    }

    // Mark invite as accepted
    await ctx.db.patch(invite._id, {
      status: "accepted",
      acceptedAt: Date.now(),
      workosUserId: args.workosUserId,
    });

    // Send welcome notification to school admin
    await createNotification(ctx, {
      tenantId: invite.tenantId,
      targetRole: "school_admin",
      title: `${args.firstName} ${args.lastName} joined`,
      body: `${args.firstName} has accepted their invitation and can now log in.`,
      type: "staff_joined",
    });

    // Update onboarding: staff_added step
    await completeWizardStepIfNotDone(ctx, invite.tenantId, "staff_added");

    await logAudit(ctx, {
      action: "staff.invite_accepted",
      entity: userId,
      after: JSON.stringify({ email: invite.email, role: invite.role }),
      performedBy: userId,
    });

    return {
      userId,
      redirectTo: `https://${tenant.slug}.edumyles.co.ke/portal/${getPortalPath(invite.role)}`,
    };
  }
});
```

---

## 6.3 Parent Account Creation

Parents do NOT go through a traditional invite flow. They use **magic link / OTP** authentication. Their accounts are created either:

1. **Auto-created on student import** — when student CSV has parent email/phone
2. **Auto-created via `student.enrolled` event** — when student is added manually
3. **Parent self-registers** — visits school portal, enters their child's admission number

```typescript
// convex/modules/core/users.ts — parent account creation

// Called by student.enrolled event handler
export const createOrInviteParentAccount = internalMutation({
  args: {
    tenantId: v.string(),
    studentId: v.string(),
    parentName: v.string(),
    parentEmail: v.optional(v.string()),
    parentPhone: v.optional(v.string()),
    relationship: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if parent already has account (multiple children at same school)
    let parentUserId: string;
    const existing = args.parentEmail
      ? await ctx.db
          .query("users")
          .withIndex("by_tenantId", q => q.eq("tenantId", args.tenantId))
          .filter(q =>
            q.and(
              q.eq(q.field("email"), args.parentEmail),
              q.eq(q.field("role"), "parent"),
            )
          )
          .unique()
      : null;

    if (existing) {
      parentUserId = existing._id;
    } else {
      // Create parent user record (no WorkOS account yet — created on first login via magic link)
      parentUserId = await ctx.db.insert("users", {
        tenantId: args.tenantId,
        email: args.parentEmail,
        phone: args.parentPhone,
        firstName: args.parentName.split(" ")[0],
        lastName: args.parentName.split(" ").slice(1).join(" ") || "",
        role: "parent",
        status: "pending_activation",  // activates on first login
        language: "en",
        createdAt: Date.now(),
      });
    }

    // Link parent to student
    const linkExists = await ctx.db
      .query("parent_student_links")
      .withIndex("by_parentUserId", q => q.eq("parentUserId", parentUserId))
      .filter(q => q.eq(q.field("studentId"), args.studentId))
      .unique();

    if (!linkExists) {
      await ctx.db.insert("parent_student_links", {
        tenantId: args.tenantId,
        parentUserId,
        studentId: args.studentId,
        relationship: args.relationship,
        isPrimary: true,
        verifiedAt: Date.now(), // auto-verified if school admin linked them
      });
    }

    return parentUserId;
  }
});

// Parent self-registration (OR first login via magic link)
export const createParentWorkosAccount = internalAction({
  args: {
    tenantId: v.string(),
    parentUserId: v.string(),
    email: v.string(),
    workosOrgId: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    const workos = new WorkOS(process.env.WORKOS_API_KEY!);

    // Send magic link to parent's email
    await workos.userManagement.sendMagicAuth({
      email: args.email,
      redirectUri: `https://app.edumyles.co.ke/portal/parent/auth-callback`,
    });

    // WorkOS creates user on first magic link authentication
    return "magic_auth_sent";
  }
});
```

**Parent SMS Invitation (from wizard Step 11):**
```
SMS content:
"Hi [Parent Name], [School Name] is now on EduMyles.
View [Student Name]'s grades, fees & attendance.
Register (free): edumyles.co.ke/join/[SCHOOL_CODE]
Reply STOP to opt out."

WhatsApp content (if WhatsApp enabled):
"Hi [Parent Name] 👋
[School Name] invites you to EduMyles to track your
child [Student Name]'s progress.

✅ View grades & report cards
💰 Pay fees via M-Pesa
📋 Check attendance
🗓️ See class timetable

Register here (free, takes 2 min):
👉 edumyles.co.ke/join/[SCHOOL_CODE]"
```

**Parent self-registration page `/join/[SCHOOL_CODE]`:**
```
1. Enter your phone number OR email
2. We find your child's record (by parent phone/email from student record)
3. If found: show "Is this your child? [Student Name], [Class]"
   If not found: "Enter your child's admission number"
4. Enter OTP sent to your phone/email
5. Set display name preference
6. Redirected to parent portal
```

---

# PART 7 — STAGE 6: ONBOARDING HEALTH & ACTIVATION

---

## 7.1 Health Score Monitoring (Platform Admin)

**`/platform/tenant-success` — Tenant Success Dashboard:**

```
┌────────────────────────────────────────────────────────────┐
│  Tenant Success Dashboard                                  │
│                                                            │
│  STATS ROW:                                                │
│  Active trials: 47 | Activated: 23/47 (49%) |             │
│  Stalled: 8 | Avg health score: 34/51 |                    │
│  Converting this week: 3                                   │
│                                                            │
│  SEGMENTS:                                                 │
│  [All] [At Risk - Score <20] [Stalled >48hrs]              │
│  [Activating - Score 40-50] [Activated] [Converted]        │
│                                                            │
│  TENANT TABLE:                                             │
│  School        Country  Score   Status    Last Activity  AM │
│  ─────────────────────────────────────────────────────────  │
│  Nairobi Acad  Kenya    51/51   ✅ Active  2hrs ago      JM │
│  Mombasa High  Kenya    38/51   ⚠️ Stalled 2 days ago   JM │
│  Kampala Intl  Uganda   12/51   🔴 At Risk 5 days ago   -- │
│  Lagos School  Nigeria  45/51   🟡 Almost  1hr ago      -- │
│                                                            │
│  Per row actions: View | Assign AM | Send Nudge |          │
│                   Call | Add Note                          │
└────────────────────────────────────────────────────────────┘
```

**Health Score Progress Bar on Tenant Detail:**
```
Nairobi Academy — Onboarding Health
████████████████████████████████████████████████ 51/51 ✅

Step               Points  Status
────────────────────────────────────
School profile     8/8     ✅ Complete
Academic year      8/8     ✅ Complete
Grading system     4/4     ✅ Complete
Subjects           4/4     ✅ Complete (15 subjects)
Classes            5/5     ✅ Complete (10 classes)
Fee structure      5/5     ✅ Complete
Staff added        5/5     ✅ Complete (12 teachers)
Students added     7/7     ✅ Complete (447 students)
Modules configured 2/2     ✅ Complete (5 modules)
Portal customized  1/1     ✅ Complete
Parents invited    1/1     ✅ Complete (389 parents)
First action       1/1     ✅ Complete (attended marked)
```

---

## 7.2 Stalled Onboarding Detection (Daily Cron)

```typescript
// convex/modules/platform/tenants.ts

export const checkStalledOnboardings = internalMutation({
  handler: async (ctx) => {
    const STALLED_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours
    const now = Date.now();

    const onboardings = await ctx.db
      .query("tenant_onboarding")
      .filter(q =>
        q.and(
          q.eq(q.field("isActivated"), false),
          q.lt(q.field("lastActivityAt"), now - STALLED_THRESHOLD_MS),
          q.eq(q.field("isStalled"), false),  // not already flagged
        )
      )
      .collect();

    for (const onboarding of onboardings) {
      const tenant = await ctx.db.get(onboarding.tenantId);
      if (!tenant || !["pending_setup", "setup_in_progress"].includes(tenant.status)) continue;

      // Mark as stalled
      await ctx.db.patch(onboarding._id, {
        isStalled: true,
        stalledSince: onboarding.lastActivityAt,
        stalledAtStep: onboarding.currentStep,
      });

      // Notify assigned account manager
      if (onboarding.assignedAccountManager) {
        await createNotification(ctx, {
          targetUserId: onboarding.assignedAccountManager,
          isPlatformNotification: true,
          title: `${tenant.name} is stalled at step ${onboarding.currentStep}`,
          body: `No activity for 48+ hours. Reach out to get them back on track.`,
          actionUrl: `/platform/tenants/${tenant._id}`,
          type: "tenant_stalled",
          priority: "high",
        });
      }

      // Send nudge email to school admin
      const alreadySentNudge = onboarding.interventionsSent.some(
        i => i.type === "stalled_email"
      );

      if (!alreadySentNudge) {
        const admin = await getSchoolAdmin(ctx, onboarding.tenantId);
        if (admin) {
          await ctx.scheduler.runAfter(0,
            internal.communications.email.sendStalledOnboardingNudge,
            {
              email: admin.email,
              firstName: admin.firstName,
              schoolName: tenant.name,
              currentStep: onboarding.currentStep,
              healthScore: onboarding.healthScore,
              continueUrl: `https://${tenant.slug}.edumyles.co.ke/admin/setup`,
            }
          );

          await ctx.db.patch(onboarding._id, {
            interventionsSent: [
              ...onboarding.interventionsSent,
              { type: "stalled_email", sentAt: now, channel: "email" }
            ]
          });
        }
      }
    }
  }
});
```

---

## 7.3 Intervention Email Templates

**Stalled at Step 2 (Academic Year):**
```
Subject: Let's get Nairobi Academy set up — you're 17% there 📚

Hi Alice,

You started setting up Nairobi Academy 3 days ago but got stuck on
the academic year setup. You're so close!

Here's what's left:
→ Step 2: Set your academic year and terms (5 minutes)
→ Step 3: Choose your grading system (2 minutes)
→ ...

[Continue Setup →]

Need help with the academic year setup? Here's a quick guide:
[Video: Setting up academic years in EduMyles — 2 min]

Or call us: +254 700 000000 (Mon-Fri 8am-6pm EAT)
```

**Stalled at Step 7 (Staff):**
```
Subject: Tip: Import all your staff in 5 minutes 👨‍🏫

Hi Alice,

You're 58% through the setup but haven't added your staff yet.

Here's the fastest way to do it:
1. Download our staff template: [link]
2. Copy your staff list into it
3. Upload the CSV

We handle the rest — they'll all get invite emails automatically.

[Download Staff Template]
[Continue Setup →]
```

**Day Before Trial Ends (Stalled, Never Activated):**
```
Subject: Your EduMyles trial ends tomorrow ⏰

Hi Alice,

Your 14-day trial at EduMyles ends tomorrow, and Nairobi Academy's
setup is 38% complete.

You haven't unlocked your full trial yet. Once you complete the
setup and take your first action, your trial starts (14 days).

[Complete Setup in 10 minutes →]

Or if EduMyles isn't the right fit, just let us know and we'll
close the account.

Best,
James Mwangi
EduMyles Account Manager
+254 722 888 888
```

---

## 7.4 Activation Event

When health score reaches 50 for the first time:

```typescript
// Inside completeWizardStep mutation:

if (newScore >= 50 && !onboarding.isActivated) {
  const now = Date.now();

  // 1. Mark as activated
  await ctx.db.patch(onboarding._id, { isActivated: true });

  // 2. Start 14-day trial clock from activation (not from signup)
  await ctx.db.patch(tenantId, {
    status: "trial",
    trialStartedAt: now,
    trialEndsAt: now + 14 * 24 * 60 * 60 * 1000,
    activatedAt: now,
  });

  // 3. Update trial subscription period
  const sub = await getActiveTenantSubscription(ctx, tenantId);
  if (sub) {
    await ctx.db.patch(sub._id, {
      currentPeriodEnd: now + 14 * 24 * 60 * 60 * 1000,
      trialEndsAt: now + 14 * 24 * 60 * 60 * 1000,
    });
  }

  // 4. Install all Starter plan modules as free trials
  const starterModules = ["mod_finance", "mod_attendance", "mod_academics", "mod_parent_portal"];
  for (const slug of starterModules) {
    await ctx.scheduler.runAfter(0, internal.marketplace.installation.installModuleAsPilot, {
      tenantId,
      moduleSlug: slug,
      grantType: "free_trial",
      endDate: now + 14 * 24 * 60 * 60 * 1000,
      stealthMode: true,  // No "trial" badge — just works
    });
  }

  // 5. Notify platform team via Slack
  await ctx.scheduler.runAfter(0, internal.platform.slack.notifyTenantActivated, {
    tenantId,
    schoolName: tenant.name,
    healthScore: newScore,
    daysToActivation: Math.floor((now - tenant.createdAt) / (1000 * 60 * 60 * 24)),
  });

  // 6. Send congratulations email to school admin
  await ctx.scheduler.runAfter(0,
    internal.communications.email.sendActivationCongratulations,
    {
      email: adminUser.email,
      firstName: adminUser.firstName,
      schoolName: tenant.name,
      trialEndsAt: now + 14 * 24 * 60 * 60 * 1000,
      accountManagerName: "James Mwangi",
      accountManagerPhone: "+254 722 888888",
    }
  );

  // 7. Assign account manager if not already assigned
  if (!onboarding.assignedAccountManager) {
    await autoAssignAccountManager(ctx, tenantId);
  }

  // 8. Schedule trial intervention sequence
  await scheduleTrialInterventions(ctx, tenantId, now);
}
```

---

# PART 8 — STAGE 7: TRIAL → CONVERSION

---

## 8.1 Trial Intervention Schedule

```typescript
// convex/modules/platform/tenants.ts

async function scheduleTrialInterventions(
  ctx: MutationCtx,
  tenantId: string,
  trialStartedAt: number
) {
  const DAY = 24 * 60 * 60 * 1000;

  // Day 1: Welcome call reminder (from account manager)
  await ctx.scheduler.runAt(trialStartedAt + 1 * DAY,
    internal.platform.tenants.sendTrialIntervention,
    { tenantId, type: "day1_welcome" }
  );

  // Day 3: "How's it going?" check-in email
  await ctx.scheduler.runAt(trialStartedAt + 3 * DAY,
    internal.platform.tenants.sendTrialIntervention,
    { tenantId, type: "day3_checkin" }
  );

  // Day 7: Halfway point — highlight unused features
  await ctx.scheduler.runAt(trialStartedAt + 7 * DAY,
    internal.platform.tenants.sendTrialIntervention,
    { tenantId, type: "day7_halfway" }
  );

  // Day 10: Conversion nudge — "7 days left"
  await ctx.scheduler.runAt(trialStartedAt + 10 * DAY,
    internal.platform.tenants.sendTrialIntervention,
    { tenantId, type: "day10_nudge" }
  );

  // Day 12: Account manager personal outreach
  await ctx.scheduler.runAt(trialStartedAt + 12 * DAY,
    internal.platform.tenants.sendTrialIntervention,
    { tenantId, type: "day12_personal_outreach" }
  );

  // Day 13: "Tomorrow is your last day"
  await ctx.scheduler.runAt(trialStartedAt + 13 * DAY,
    internal.platform.tenants.sendTrialIntervention,
    { tenantId, type: "day13_last_warning" }
  );

  // Day 14: Trial ending today
  await ctx.scheduler.runAt(trialStartedAt + 14 * DAY,
    internal.platform.tenants.processTrialExpiry,
    { tenantId }
  );
}

export const sendTrialIntervention = internalMutation({
  args: { tenantId: v.string(), type: v.string() },
  handler: async (ctx, args) => {
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant || tenant.status !== "trial") return; // already converted or cancelled

    const onboarding = await getTenantOnboarding(ctx, args.tenantId);
    const admin = await getSchoolAdmin(ctx, args.tenantId);
    if (!admin) return;

    // Don't send if already converted
    if (tenant.status !== "trial") return;

    // Check if already sent this type
    if (onboarding.interventionsSent.some(i => i.type === args.type)) return;

    const interventionContent = getInterventionContent(args.type, tenant, onboarding, admin);

    // Send email
    await ctx.scheduler.runAfter(0, internal.communications.email.sendTrialEmail, {
      to: admin.email,
      subject: interventionContent.subject,
      body: interventionContent.body,
      ctaText: interventionContent.ctaText,
      ctaUrl: `https://${tenant.slug}.edumyles.co.ke/admin/settings/billing`,
    });

    // Send SMS for urgent interventions
    if (["day13_last_warning", "day14_expiring"].includes(args.type) && admin.phone) {
      await ctx.scheduler.runAfter(0, internal.communications.sms.sendSms, {
        to: admin.phone,
        message: interventionContent.sms,
        tenantId: args.tenantId,
      });
    }

    // Notify account manager to call
    if (["day12_personal_outreach"].includes(args.type) && onboarding.assignedAccountManager) {
      await createNotification(ctx, {
        targetUserId: onboarding.assignedAccountManager,
        isPlatformNotification: true,
        title: `Call ${tenant.name} today — Day 12 of trial`,
        body: `${admin.firstName} is on day 12 of their trial. Time for a personal outreach call.`,
        actionUrl: `/platform/tenants/${args.tenantId}`,
        priority: "high",
      });
    }

    // Record intervention
    await ctx.db.patch(onboarding._id, {
      interventionsSent: [...onboarding.interventionsSent, {
        type: args.type, sentAt: Date.now(), channel: "email"
      }]
    });
  }
});
```

---

## 8.2 In-App Trial Banner

Shown on admin dashboard throughout trial:

```typescript
// frontend/src/components/admin/TrialBanner.tsx

export function TrialBanner() {
  const subscription = useQuery(api.billing.getCurrentSubscription);
  const daysRemaining = subscription ? getDaysRemaining(subscription.trialEndsAt) : 0;

  if (subscription?.status !== "trialing") return null;

  const urgency = daysRemaining <= 3 ? "critical" :
                  daysRemaining <= 7 ? "warning" : "info";

  return (
    <div className={cn(
      "w-full px-4 py-3 flex items-center justify-between",
      urgency === "critical" && "bg-destructive text-destructive-foreground",
      urgency === "warning" && "bg-yellow-500 text-white",
      urgency === "info" && "bg-primary text-primary-foreground",
    )}>
      <div className="flex items-center gap-3">
        <Clock className="w-4 h-4" />
        <span className="text-sm font-medium">
          {daysRemaining > 0
            ? `Your free trial ends in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`
            : "Your free trial ends today"}
        </span>
        <span className="text-sm opacity-80">
          Choose a plan to keep your data and continue using EduMyles.
        </span>
      </div>
      <Button
        size="sm"
        variant={urgency === "info" ? "secondary" : "outline"}
        className="shrink-0"
        onClick={() => router.push("/admin/settings/billing")}
      >
        Choose a Plan →
      </Button>
    </div>
  );
}
```

---

## 8.3 Plan Selection & Conversion Flow

**Page:** `/admin/settings/billing`

**Step 1: Plan comparison table**

```
┌──────────────────────────────────────────────────────────────────────┐
│  Choose Your Plan                                                    │
│                                                                      │
│  Billing period: ● Monthly  ○ Termly (5% off)  ○ Annual (18% off)   │
│                                                                      │
│  ┌─────────────┬────────────────┬────────────────┬────────────────┐ │
│  │             │   FREE         │   STARTER      │   PRO          │ │
│  │             │   KES 0        │   KES 2,500    │   KES 8,000    │ │
│  │             │                │   per month    │   per month    │ │
│  ├─────────────┼────────────────┼────────────────┼────────────────┤ │
│  │ Students    │ Up to 100      │ Up to 500      │ Up to 2,000    │ │
│  │ Storage     │ 1GB            │ 10GB           │ 50GB           │ │
│  │ SIS         │ ✅             │ ✅             │ ✅             │ │
│  │ Finance     │ ❌             │ ✅ Included    │ ✅ Included    │ │
│  │ Attendance  │ ❌             │ ✅ Included    │ ✅ Included    │ │
│  │ Academics   │ ❌             │ ✅ Included    │ ✅ Included    │ │
│  │ Parent Port │ ❌             │ ✅ Included    │ ✅ Included    │ │
│  │ HR & Payrol │ ❌             │ + KES 18/st    │ ✅ Included    │ │
│  │ Timetable   │ ❌             │ + KES 8/st     │ ✅ Included    │ │
│  │ Transport   │ ❌             │ + KES 12/st    │ ✅ Included    │ │
│  │ Library     │ ❌             │ + KES 5/st     │ ✅ Included    │ │
│  │ Comms       │ ❌             │ + KES 15/st    │ ✅ Included    │ │
│  │ E-Wallet    │ ❌             │ + KES 10/st    │ ✅ Included    │ │
│  │ Reports     │ ❌             │ + KES 12/st    │ ✅ Included    │ │
│  │ Admissions  │ ❌             │ + KES 8/st     │ ✅ Included    │ │
│  │ Support     │ Community      │ Email 48hr     │ Priority 24hr  │ │
│  ├─────────────┼────────────────┼────────────────┼────────────────┤ │
│  │             │                │                │                │ │
│  │ You have:   │                │ 447 students   │ 447 students   │ │
│  │             │                │ KES 2,500/mo   │ KES 8,000/mo   │ │
│  │             │                │                │                │ │
│  │             │ [Downgrade]    │ [Current Trial]│ [Upgrade]      │ │
│  └─────────────┴────────────────┴────────────────┴────────────────┘ │
│                                                                      │
│  Currently using: HR & Payroll (KES 18/st), Timetable (KES 8/st)   │
│  These are included in Pro but charged separately on Starter.        │
│                                                                      │
│  Pro is right for you: you're already using 7 of the Pro modules.   │
│  Upgrading saves you KES 2,600/month vs Starter + add-ons.          │
└──────────────────────────────────────────────────────────────────────┘
```

**Step 2: Payment method selection + first payment:**

```
┌──────────────────────────────────────────────────────────┐
│  Complete your Pro plan subscription                     │
│                                                          │
│  Plan:     Pro — Annual                                  │
│  Period:   12 months (May 2026 – Apr 2027)               │
│                                                          │
│  Plan fee:      KES 8,000 × 12 = KES 96,000             │
│  Annual disc:   - KES 17,280 (18%)                       │
│  Subtotal:      KES 78,720                               │
│  VAT (16%):     + KES 12,595                             │
│  ──────────────────────────────────────────              │
│  Total today:   KES 91,315                               │
│                                                          │
│  Module add-ons: (all modules included in Pro)           │
│  KES 0 additional                                        │
│                                                          │
│  ─── Choose payment method ─────────────────────────────  │
│                                                          │
│  ● M-Pesa                                                │
│    Phone: [+254 722 123456 ]                             │
│    You'll receive an M-Pesa prompt on your phone.        │
│                                                          │
│  ○ Airtel Money                                          │
│  ○ Credit/Debit Card (Stripe)                            │
│  ○ Bank Transfer (manual — takes 1-3 days)               │
│                                                          │
│  [← Back]       [Pay KES 91,315 →]                       │
│                                                          │
│  By paying, you agree to our Terms of Service and        │
│  authorize EduMyles to charge your account monthly.      │
└──────────────────────────────────────────────────────────┘
```

**Conversion Mutation:**

```typescript
// convex/modules/platform/billing.ts

export const convertTrialToPaid = mutation({
  args: {
    planId: v.id("subscription_plans"),
    billingPeriod: v.union(v.literal("monthly"), v.literal("termly"),
                           v.literal("quarterly"), v.literal("annual")),
    paymentMethod: v.string(),
    paymentPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId } = await requireTenantContext(ctx);

    const tenant = await ctx.db.get(tenantId);
    if (!tenant) throw new Error("Tenant not found");

    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");

    // Calculate first payment amount
    const paymentAmount = calculatePlanPayment(plan, args.billingPeriod);
    const now = Date.now();

    // Create pending payment record
    const paymentId = await ctx.db.insert("subscription_payments", {
      tenantId,
      planId: args.planId,
      billingPeriod: args.billingPeriod,
      amountKes: paymentAmount.totalKes,
      status: "pending",
      paymentMethod: args.paymentMethod,
      createdAt: now,
    });

    // Process payment based on method
    if (args.paymentMethod === "mpesa") {
      const stkResult = await ctx.runAction(
        internal.payments.mpesa.initiateSTKPush,
        {
          phoneNumber: args.paymentPhone!,
          amountKes: paymentAmount.totalKes,
          description: `EduMyles ${plan.name} Plan — ${args.billingPeriod}`,
          reference: `SUB-${tenantId.substring(0, 8).toUpperCase()}`,
        }
      );

      await ctx.db.patch(paymentId, {
        mpesaCheckoutId: stkResult.checkoutRequestId,
      });

      // Poll for M-Pesa result (handled via webhook callback)
      return { status: "pending_mpesa", checkoutRequestId: stkResult.checkoutRequestId };
    }

    // Other payment methods handled similarly
  }
});

// Called by M-Pesa webhook on successful payment
export const onSubscriptionPaymentSuccess = internalMutation({
  args: { paymentId: v.id("subscription_payments") },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) return;

    const now = Date.now();
    const plan = await ctx.db.get(payment.planId);

    // Update payment status
    await ctx.db.patch(args.paymentId, { status: "paid", paidAt: now });

    // Activate subscription
    const periodEnd = calculatePeriodEnd(now, payment.billingPeriod);
    const sub = await getTenantSubscription(ctx, payment.tenantId);

    await ctx.db.patch(sub._id, {
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      nextPaymentDue: periodEnd,
      trialEndsAt: undefined,
      studentCountAtBilling: await getActiveStudentCount(ctx, payment.tenantId),
    });

    // Update tenant status
    await ctx.db.patch(payment.tenantId, { status: "active" });

    // Install plan-included modules (auto-install all modules included in plan)
    await ctx.scheduler.runAfter(0,
      internal.marketplace.billing.installPlanIncludedModules,
      { tenantId: payment.tenantId, planId: payment.planId }
    );

    // Send conversion confirmation email
    const admin = await getSchoolAdmin(ctx, payment.tenantId);
    if (admin) {
      await ctx.scheduler.runAfter(0,
        internal.communications.email.sendSubscriptionConfirmation,
        {
          email: admin.email,
          firstName: admin.firstName,
          planName: plan.name,
          amountKes: payment.amountKes,
          nextPaymentDate: periodEnd,
          receiptUrl: `https://app.edumyles.co.ke/admin/settings/billing/receipts/${args.paymentId}`,
        }
      );
    }

    // Notify platform team
    await ctx.scheduler.runAfter(0, internal.platform.slack.notifyTenantConverted, {
      tenantId: payment.tenantId,
      planName: plan.name,
      amountKes: payment.amountKes,
    });

    await logAudit(ctx, {
      action: "tenant.trial_converted",
      entity: payment.tenantId,
      after: JSON.stringify({ plan: plan.name, amount: payment.amountKes }),
    });
  }
});
```

---

## 8.4 Trial Expiry Flow

```typescript
// convex/modules/platform/tenants.ts

export const processTrialExpiry = internalMutation({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant || tenant.status !== "trial") return; // already handled

    const now = Date.now();
    if (tenant.trialEndsAt > now) return; // not expired yet

    // Mark as trial_expired
    await ctx.db.patch(args.tenantId, { status: "trial_expired" });

    // Suspend all marketplace module installs
    const installs = await ctx.db
      .query("module_installs")
      .withIndex("by_tenantId", q => q.eq("tenantId", args.tenantId))
      .filter(q =>
        q.and(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("isCore"), false),
        )
      )
      .collect();

    for (const install of installs) {
      await ctx.db.patch(install._id, {
        status: "suspended_payment",
        disabledAt: now,
        disabledReason: "trial_expired",
      });
    }

    // Update subscription status
    const sub = await getTenantSubscription(ctx, args.tenantId);
    if (sub) {
      await ctx.db.patch(sub._id, { status: "past_due" });
    }

    // Send expiry email with strong CTA
    const admin = await getSchoolAdmin(ctx, args.tenantId);
    if (admin) {
      await ctx.scheduler.runAfter(0,
        internal.communications.email.sendTrialExpiredEmail,
        {
          email: admin.email,
          firstName: admin.firstName,
          schoolName: tenant.name,
          reactivateUrl: `https://${tenant.slug}.edumyles.co.ke/admin/settings/billing`,
        }
      );
    }

    // Grace period: 7 days before hard suspension
    await ctx.scheduler.runAt(
      now + 7 * 24 * 60 * 60 * 1000,
      internal.platform.tenants.hardSuspendExpiredTrial,
      { tenantId: args.tenantId }
    );

    // Notify platform team
    await ctx.scheduler.runAfter(0, internal.platform.slack.notifyTrialExpired, {
      tenantId: args.tenantId,
      schoolName: tenant.name,
    });
  }
});
```

---

## 8.5 Trial Expired State — School Admin View

When trial expires, school admin logs in to:

```
┌──────────────────────────────────────────────────────────┐
│  [EduMyles Logo]  Nairobi Academy                        │
│                                                          │
│  ╔════════════════════════════════════════════════════╗  │
│  ║  ⏰ Your free trial has ended                      ║  │
│  ║                                                    ║  │
│  ║  Your 14-day trial expired on 22 April 2026.       ║  │
│  ║  Your data is safe — choose a plan to continue.    ║  │
│  ║                                                    ║  │
│  ║  [Choose a Plan →]                                 ║  │
│  ║                                                    ║  │
│  ║  Questions? WhatsApp: +254 700 000000              ║  │
│  ╚════════════════════════════════════════════════════╝  │
│                                                          │
│  You can still:                                          │
│  ✅ View your student records                            │
│  ✅ Export your data                                     │
│  ❌ Mark attendance (module suspended)                   │
│  ❌ Create invoices (module suspended)                   │
│  ❌ Use any paid modules                                 │
│                                                          │
│  [Export My Data]  [View Plans]                          │
└──────────────────────────────────────────────────────────┘
```

Core SIS is always accessible (student records never locked). Only marketplace modules are suspended.

---

# PART 9 — STAGE 8: STEADY STATE & ENGAGEMENT

---

## 9.1 Post-Activation Dashboard (Admin)

Once the wizard is complete, the admin dashboard shows:

```
┌──────────────────────────────────────────────────────────┐
│  Good morning, Alice 👋  Nairobi Academy                 │
│  Tuesday, 15 April 2026  |  Term 1 2025                 │
│                                                          │
│  ──── Today at a glance ──────────────────────────────── │
│                                                          │
│  📊 447 students   👩‍🏫 12 staff   💰 KES 2.1M collected  │
│                                                          │
│  ──── Quick Actions ──────────────────────────────────── │
│  [Mark Attendance]  [Create Invoice]  [Send Announcement]│
│  [Add Student]      [View Reports]    [Run Payroll]      │
│                                                          │
│  ──── Alerts requiring action ─────────────────────────  │
│  ⚠️ 23 students with unpaid invoices > 30 days (KES 234K)│
│  📋 4 classes haven't marked attendance today            │
│  📝 3 pending leave requests from staff                  │
│  📦 Library module update available (v1.3.0)             │
│                                                          │
│  ──── Module Widgets (customizable) ───────────────────  │
│  [Finance Collection Widget]  [Attendance Widget]        │
│  [Recent Grades Widget]       [Staff Leave Widget]       │
└──────────────────────────────────────────────────────────┘
```

---

## 9.2 Engagement Score (Ongoing)

After activation, the health score transitions to an **Engagement Score** that platform team monitors for churn signals:

```typescript
type EngagementSignals = {
  lastLoginDays: number;           // days since school admin last logged in
  attendanceMarkedThisWeek: boolean; // at least one class marked
  invoicesCreatedThisMonth: boolean;
  parentLoginRate: number;          // % of parents who logged in this month
  moduleUsageCount: number;         // distinct modules used this week
  studentCountChange: number;       // student growth/decline %
};

function calculateEngagementScore(signals: EngagementSignals): number {
  let score = 100; // start at 100, subtract for risk signals

  if (signals.lastLoginDays > 7) score -= 20;
  if (signals.lastLoginDays > 14) score -= 20; // additional
  if (!signals.attendanceMarkedThisWeek) score -= 15;
  if (!signals.invoicesCreatedThisMonth) score -= 15;
  if (signals.parentLoginRate < 0.1) score -= 10; // less than 10% parents active
  if (signals.moduleUsageCount < 2) score -= 10;
  if (signals.studentCountChange < -0.05) score -= 10; // lost 5%+ students

  return Math.max(0, score);
}

// Score interpretation:
// 80-100: Healthy — active school, high engagement
// 60-79:  Watch — some signals of disengagement
// 40-59:  At Risk — reach out proactively
// 0-39:   Churn Risk — immediate intervention needed
```

---

## 9.3 Churn Signals & Interventions

```typescript
// Daily cron: check engagement for all active tenants
export const monitorEngagement = internalMutation({
  handler: async (ctx) => {
    const activeTenants = await ctx.db
      .query("tenants")
      .withIndex("by_status", q => q.eq("status", "active"))
      .collect();

    for (const tenant of activeTenants) {
      const signals = await computeEngagementSignals(ctx, tenant._id);
      const score = calculateEngagementScore(signals);

      // Update engagement score
      await ctx.db.patch(tenant._id, { engagementScore: score });

      if (score < 40) {
        // Notify account manager immediately
        const onboarding = await getTenantOnboarding(ctx, tenant._id);
        if (onboarding.assignedAccountManager) {
          await createNotification(ctx, {
            targetUserId: onboarding.assignedAccountManager,
            isPlatformNotification: true,
            title: `⚠️ CHURN RISK: ${tenant.name}`,
            body: `Engagement score: ${score}/100. ${signals.lastLoginDays} days since last login.`,
            actionUrl: `/platform/tenants/${tenant._id}`,
            priority: "critical",
          });
        }
      }
    }
  }
});
```

---

# PART 10 — COMPLETE ONBOARDING CONVEX FUNCTIONS REFERENCE

---

## 10.1 All Onboarding Functions

```
convex/modules/platform/
├── waitlist.ts
│   ├── submitWaitlistForm (mutation — PUBLIC)
│   ├── getWaitlistEntries (query — platform admin)
│   ├── updateWaitlistEntry (mutation — platform admin)
│   └── rejectWaitlistEntry (mutation — platform admin)
│
├── tenants.ts
│   ├── sendTenantInvite (mutation — platform admin)
│   ├── resendTenantInvite (mutation — platform admin)
│   ├── revokeTenantInvite (mutation — platform admin)
│   ├── acceptTenantInvite (mutation — PUBLIC)
│   ├── getTenantInvite (query — PUBLIC, by token)
│   ├── checkStalledOnboardings (internalMutation — cron)
│   ├── sendTrialIntervention (internalMutation — scheduler)
│   ├── processTrialExpiry (internalMutation — scheduler)
│   ├── hardSuspendExpiredTrial (internalMutation — scheduler)
│   └── monitorEngagement (internalMutation — daily cron)
│
├── invites.ts
│   ├── sendInviteReminder (internalMutation — scheduler)
│   └── expireOldInvites (internalMutation — daily cron)

convex/modules/core/
├── setupWizard.ts
│   ├── getSetupProgress (query — school admin)
│   ├── completeWizardStep (mutation — school admin)
│   └── skipWizardStep (mutation — school admin)
│
├── users.ts
│   ├── inviteStaffMember (mutation — school admin)
│   ├── bulkInviteStaff (mutation — school admin)
│   ├── resendStaffInvite (mutation — school admin)
│   ├── acceptStaffInvite (mutation — PUBLIC)
│   ├── createOrInviteParentAccount (internalMutation — event handler)
│   └── createParentWorkosAccount (internalAction — on first login)

convex/actions/auth/
├── workos.ts
│   ├── createOrganization (internalAction)
│   ├── createUser (internalAction)
│   ├── createOrganizationMembership (internalAction)
│   ├── inviteUserToOrganization (internalAction)
│   ├── getOrganizationAuthUrl (internalAction)
│   ├── deleteOrganization (internalAction)
│   └── revokeUserSessions (internalAction)
```

---

## 10.2 All Cron Jobs (Onboarding-Specific)

Add to `convex/crons.ts`:

```typescript
// Expire old invites (tenant + staff) — daily 1:00 AM EAT (22:00 UTC)
crons.daily("expire old invites",
  { hourUTC: 22, minuteUTC: 0 },
  internal.platform.invites.expireOldInvites);

// Check stalled onboardings — daily 12:30 AM EAT (21:30 UTC)
crons.daily("check stalled onboardings",
  { hourUTC: 21, minuteUTC: 30 },
  internal.platform.tenants.checkStalledOnboardings);

// Check trial expirations — daily 12:00 AM EAT (21:00 UTC)
crons.daily("process trial expirations",
  { hourUTC: 21, minuteUTC: 0 },
  internal.platform.tenants.processAllTrialExpirations);

// Monitor tenant engagement — daily 9:00 AM EAT (6:00 UTC)
crons.daily("monitor tenant engagement",
  { hourUTC: 6, minuteUTC: 0 },
  internal.platform.tenants.monitorEngagement);

// Send trial intervention emails — daily 10:00 AM EAT (7:00 UTC)
crons.daily("send trial interventions",
  { hourUTC: 7, minuteUTC: 0 },
  internal.platform.tenants.sendTrialInterventions);
```

---

# PART 11 — FRONTEND PAGES SPECIFICATION

---

## 11.1 Complete Page List (Onboarding)

```
PUBLIC PAGES:
─────────────────────────────────────────────────────────
/                                — Landing / waitlist form
/demo                            — Demo booking
/invite/accept                   — Tenant admin accept invite (token-gated)
/staff/accept                    — Staff accept invite (token-gated)
/join/[schoolCode]               — Parent self-registration
/portal/parent/auth-callback     — WorkOS auth callback for parents
/auth/login                      — General login
/auth/signup                     — Not used (only invite-based)
/auth/callback                   — WorkOS auth callback

SCHOOL ADMIN (AUTHENTICATED):
─────────────────────────────────────────────────────────
/admin/setup                     — Setup wizard (multi-step)
/admin/setup?step=1              — Step 1: School profile
/admin/setup?step=2              — Step 2: Academic year
/admin/setup?step=3              — Step 3: Grading system
/admin/setup?step=4              — Step 4: Subjects
/admin/setup?step=5              — Step 5: Classes
/admin/setup?step=6              — Step 6: Fee structure
/admin/setup?step=7              — Step 7: Staff
/admin/setup?step=8              — Step 8: Students
/admin/setup?step=9              — Step 9: Modules
/admin/setup?step=10             — Step 10: Portal customization
/admin/setup?step=11             — Step 11: Invite parents
/admin/setup?step=12             — Step 12: First action
/admin/settings/billing          — Plan selection + payment
/admin/settings/billing/receipts — Payment receipts

PLATFORM ADMIN (AUTHENTICATED):
─────────────────────────────────────────────────────────
/platform/waitlist               — Waitlist management
/platform/waitlist/[entryId]     — Waitlist entry detail
/platform/tenant-success         — Tenant onboarding dashboard
/platform/tenants/create         — Create tenant + send invite
/platform/tenants/[tenantId]     — Tenant detail (onboarding tab)
/platform/crm                    — CRM pipeline
```

---

## 11.2 Setup Wizard Page Architecture

```typescript
// frontend/src/app/admin/setup/page.tsx

export default function SetupWizardPage() {
  const searchParams = useSearchParams();
  const stepParam = parseInt(searchParams.get("step") ?? "1");
  const router = useRouter();

  const progress = useQuery(api.core.setupWizard.getSetupProgress);
  const completeStep = useMutation(api.core.setupWizard.completeWizardStep);
  const skipStep = useMutation(api.core.setupWizard.skipWizardStep);

  // Redirect if already completed wizard
  useEffect(() => {
    if (progress?.wizardCompletedAt) {
      router.replace("/admin");
    }
  }, [progress]);

  // Redirect if trying to access step ahead of current
  useEffect(() => {
    if (progress && stepParam > progress.currentStep + 1) {
      router.replace(`/admin/setup?step=${progress.currentStep}`);
    }
  }, [progress, stepParam]);

  const WIZARD_STEPS = [
    { key: "school_profile",     label: "School Profile",     icon: "School",     component: SchoolProfileStep },
    { key: "academic_year",      label: "Academic Year",      icon: "Calendar",   component: AcademicYearStep },
    { key: "grading_system",     label: "Grading System",     icon: "Award",      component: GradingSystemStep },
    { key: "subjects",           label: "Subjects",           icon: "BookOpen",   component: SubjectsStep },
    { key: "classes",            label: "Classes",            icon: "Users",      component: ClassesStep },
    { key: "fee_structure",      label: "Fee Structure",      icon: "CreditCard", component: FeeStructureStep },
    { key: "staff_added",        label: "Add Staff",          icon: "UserPlus",   component: StaffStep },
    { key: "students_added",     label: "Add Students",       icon: "Users",      component: StudentsStep },
    { key: "modules_configured", label: "Explore Modules",    icon: "Puzzle",     component: ModulesStep },
    { key: "portal_customized",  label: "Customize Portal",   icon: "Palette",    component: CustomizeStep },
    { key: "parents_invited",    label: "Invite Parents",     icon: "Mail",       component: ParentsStep },
    { key: "first_action",       label: "First Action",       icon: "Play",       component: FirstActionStep },
  ];

  const CurrentStep = WIZARD_STEPS[stepParam - 1]?.component ?? SchoolProfileStep;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Wizard header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <img src="/logo.svg" alt="EduMyles" className="h-8" />
            <div className="text-sm text-muted-foreground">
              Step {stepParam} of {WIZARD_STEPS.length}
            </div>
          </div>

          {/* Step progress bar */}
          <div className="flex gap-1">
            {WIZARD_STEPS.map((step, index) => {
              const stepNum = index + 1;
              const isCompleted = progress?.steps[step.key]?.completed;
              const isCurrent = stepNum === stepParam;

              return (
                <button
                  key={step.key}
                  onClick={() => {
                    if (isCompleted || stepNum <= (progress?.currentStep ?? 1)) {
                      router.push(`/admin/setup?step=${stepNum}`);
                    }
                  }}
                  className={cn(
                    "flex-1 h-1.5 rounded-full transition-colors",
                    isCompleted ? "bg-primary" :
                    isCurrent ? "bg-primary/50" :
                    "bg-muted-foreground/20",
                    (isCompleted || stepNum <= (progress?.currentStep ?? 1)) && "cursor-pointer"
                  )}
                  title={step.label}
                />
              );
            })}
          </div>

          {/* Health score */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Setup score:</span>
              <span className="font-semibold">{progress?.healthScore ?? 0}/51</span>
            </div>
            {stepParam > 2 && (
              <button
                onClick={() => router.push("/admin")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Save & Continue Later
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {progress !== undefined ? (
          <CurrentStep
            stepNumber={stepParam}
            totalSteps={WIZARD_STEPS.length}
            isCompleted={progress.steps[WIZARD_STEPS[stepParam-1].key]?.completed ?? false}
            onComplete={async (data) => {
              await completeStep({
                stepKey: WIZARD_STEPS[stepParam - 1].key,
                data: data ? JSON.stringify(data) : undefined,
              });
              if (stepParam < WIZARD_STEPS.length) {
                router.push(`/admin/setup?step=${stepParam + 1}`);
              } else {
                // Last step — show completion screen
                router.push("/admin/setup/complete");
              }
            }}
            onBack={() => {
              if (stepParam > 1) router.push(`/admin/setup?step=${stepParam - 1}`);
            }}
            onSkip={async () => {
              await skipStep({ stepKey: WIZARD_STEPS[stepParam - 1].key });
              if (stepParam < WIZARD_STEPS.length) {
                router.push(`/admin/setup?step=${stepParam + 1}`);
              }
            }}
          />
        ) : (
          <WizardSkeleton />
        )}
      </div>
    </div>
  );
}
```

---

## 11.3 Onboarding Dashboard Widget (Persistent)

Shown on `/admin` dashboard when wizard is incomplete:

```typescript
// frontend/src/components/admin/OnboardingProgress.tsx

export function OnboardingProgress() {
  const progress = useQuery(api.core.setupWizard.getSetupProgress);
  const router = useRouter();

  if (!progress || progress.wizardCompletedAt) return null;

  const completedSteps = Object.values(progress.steps).filter(s => s.completed).length;
  const totalSteps = Object.keys(progress.steps).length;
  const pct = Math.round((completedSteps / totalSteps) * 100);

  // Find next incomplete step
  const STEP_KEYS = [
    "school_profile", "academic_year", "grading_system", "subjects",
    "classes", "fee_structure", "staff_added", "students_added",
    "modules_configured", "portal_customized", "parents_invited", "first_action"
  ];
  const nextStep = STEP_KEYS.findIndex(key => !progress.steps[key]?.completed) + 1;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-base">Complete your school setup</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {completedSteps} of {totalSteps} steps complete
            </p>
            <Progress value={pct} className="mt-3 h-2" />
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">Setup score:</span>
              <span className="text-xs font-semibold">{progress.healthScore}/51</span>
              {progress.healthScore < 50 && (
                <span className="text-xs text-muted-foreground">
                  ({50 - progress.healthScore} more points to unlock trial)
                </span>
              )}
            </div>
          </div>
          <Button onClick={() => router.push(`/admin/setup?step=${nextStep}`)}>
            Continue Setup →
          </Button>
        </div>

        {/* Step status grid */}
        <div className="grid grid-cols-4 gap-2 mt-4 sm:grid-cols-6 lg:grid-cols-12">
          {STEP_KEYS.map((key, index) => {
            const step = progress.steps[key];
            return (
              <button
                key={key}
                onClick={() => router.push(`/admin/setup?step=${index + 1}`)}
                className={cn(
                  "h-2 rounded-full transition-colors",
                  step?.completed ? "bg-primary" : "bg-muted-foreground/20"
                )}
                title={key.replace(/_/g, " ")}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

# PART 12 — COMPLETE IMPLEMENTATION AGENT PROMPT

---

```
=======================================================================
EDUMYLES — TENANT ONBOARDING IMPLEMENTATION PROMPT
Version 1.0 | April 2026
=======================================================================

Implement the complete tenant onboarding flow for EduMyles end-to-end:
from waitlist submission through WorkOS organization creation, tenant
admin invite acceptance, 12-step setup wizard, staff/parent invitations,
trial management, and plan conversion.

=======================================================================
STEP 0 — READ EVERYTHING FIRST (NON-NEGOTIABLE)
=======================================================================

Read these completely before writing a single line of code:

1. docs/edumyles-onboarding-spec.md    — this specification
2. docs/edumyles-tech-spec.md          — platform rules
3. docs/edumyles-marketplace-spec.md   — module system (onboarding installs modules)
4. convex/schema.ts                    — existing tables (NEVER duplicate)
5. convex/helpers/tenantGuard.ts       — requireTenantContext
6. convex/helpers/auditLog.ts          — logAudit
7. opensrc/workos-authkit-nextjs/      — WorkOS integration internals
8. opensrc/resend/                     — Email sending internals
9. .agent-skills/                      — ALL skill files

=======================================================================
ABSOLUTE RULES (same as all EduMyles work)
=======================================================================

1. ALL data from Convex — no hardcoded placeholder data ever
2. ALL reads useQuery() — ALL writes useMutation()
3. requireTenantContext on every tenant-scoped Convex function
4. Loading skeletons while data loads — everywhere
5. Empty states when data is empty — everywhere
6. Zod validation matching Convex validator schemas
7. DOMPurify on all rich text fields
8. All prices in KES stored in Convex
9. logAudit on every action
10. npx convex dev must show zero errors after every phase

=======================================================================
PHASE 1 — SCHEMA ADDITIONS
=======================================================================

Open convex/schema.ts. Add these tables if not present:
waitlist, tenant_invites, staff_invites, parent_invites (for future use)

Update tenants table:
Add if missing: workosOrgId, schoolType, levels[], boardingType,
trialStartedAt, trialEndsAt, activatedAt, engagementScore,
isVatExempt, resellerId, inviteId

Update users table:
Add if missing: inviteToken, status (add "pending_activation" if not there)

Update tenant_onboarding:
Add if missing: currentStep, isStalled, stalledSince, stalledAtStep,
assignedAccountManager, interventionsSent[]

Add staff_invites table:
tenantId, email, firstName, lastName, role, department, phone,
staffNumber, jobTitle, token, status, invitedBy, expiresAt,
acceptedAt, workosUserId, createdAt
Indexes: by_token, by_tenantId, by_status

VERIFY: npx convex dev — zero errors before Phase 2.

=======================================================================
PHASE 2 — WORKOS ACTION LAYER
=======================================================================

Create convex/actions/auth/workos.ts with ALL internalAction functions:

- createOrganization(name, domains[]) → workosOrgId
  Calls: workos.organizations.createOrganization()
  Returns: org.id

- createUser(email, firstName, lastName, password) → workosUserId
  Calls: workos.userManagement.createUser()
  Also calls: workos.userManagement.sendVerificationEmail()
  Returns: user.id

- createOrganizationMembership(userId, organizationId, roleSlug) → void
  Calls: workos.userManagement.createOrganizationMembership()

- inviteUserToOrganization(email, organizationId, roleSlug, inviterUserId, redirectUri) → token
  Calls: workos.userManagement.sendInvitation()
  Returns: invitation.token

- getOrganizationAuthUrl(organizationId, redirectUri) → string
  Calls: workos.userManagement.getAuthorizationUrl()
  Returns: authorization URL

- deleteOrganization(organizationId) → void
  Calls: workos.organizations.deleteOrganization()
  Used when tenant creation fails partway through

- revokeUserSessions(workosUserId) → void
  Calls: workos.userManagement.revokeSession() for all sessions

WorkOS client setup:
  const workos = new WorkOS(process.env.WORKOS_API_KEY!);
  process.env.WORKOS_CLIENT_ID is also needed
  Import from: opensrc/workos-authkit-nextjs (check how it initializes)

CRITICAL: These are Convex internalActions — they can call external APIs.
CRITICAL: Every action must have proper error handling with try/catch.
CRITICAL: Log failures to audit log before re-throwing.

VERIFY:
- [ ] createOrganization returns a string org ID
- [ ] createUser returns a string user ID
- [ ] Both handle WorkOS API errors gracefully

=======================================================================
PHASE 3 — WAITLIST SYSTEM
=======================================================================

3.1 — Convex functions (convex/modules/platform/waitlist.ts):

submitWaitlistForm (mutation — PUBLIC, no auth required):
  Args: fullName, email, schoolName, country, county?, phone?,
        studentCount?, currentSystem?, biggestChallenge?,
        referralSource?, referralCode?
  Logic:
  - Check for duplicate email (return helpful message if exists)
  - calculateQualificationScore() using algorithm from spec Part 2.1
  - Create waitlist record
  - If qualScore >= 60 OR studentCount >= 250: schedule CRM lead creation
  - Send confirmation email via Resend
  - Validate referral code and attribute to reseller if valid
  - If qualScore >= 75: send Slack notification to platform team
  Returns: { status, waitlistId? }

getWaitlistEntries (query — platform admin, "waitlist.view" permission):
  Args: status?, country?, minStudents?, isHighValue?, assignedTo?
  Returns: paginated waitlist entries with CRM lead status

updateWaitlistEntry (mutation — platform admin):
  Update: notes, assignedTo, isHighValue
  logAudit on every update

rejectWaitlistEntry (mutation — platform admin, reason required):
  Sets status: "rejected"
  Sends polite rejection email to school
  logAudit

3.2 — Waitlist confirmation email:
  Create email template: waitlist_confirmation
  Subject: "You're on the EduMyles waitlist, [FirstName]!"
  Content: confirmation, what to expect, timeline

3.3 — Platform admin waitlist page:
  /platform/waitlist — full page implementation
  Table: school name, email, country, students, qual score, status, applied, assigned
  Filters: status, country, high value only, unassigned
  Sort: qual score desc (default)
  Per-row actions: Invite, Reject, Assign, View Detail
  Slide-out panel for entry detail

VERIFY:
- [ ] Submit waitlist form: creates record, sends confirmation email
- [ ] High-value lead (score >= 75): Slack notification sent
- [ ] Platform admin sees waitlist with correct data

=======================================================================
PHASE 4 — TENANT INVITE SYSTEM
=======================================================================

4.1 — Invite mutation (convex/modules/platform/tenants.ts):

sendTenantInvite (mutation — "waitlist.invite" permission):
  Full implementation from spec Part 3.2
  - Check no pending invite for this email
  - Check no existing user with this email
  - Generate crypto.randomUUID() token
  - Create tenant_invites record (7 day expiry)
  - Update waitlist entry to "invited" if waitlistId provided
  - Update CRM lead stage if crmLeadId provided
  - Send invitation email via Resend
  - Schedule reminder emails: day 3 and day 6 via ctx.scheduler.runAt
  - If resellerId: validate reseller exists and is active
  - logAudit

resendTenantInvite (mutation — "waitlist.invite" permission):
  Regenerate token (new UUID), reset expiresAt
  Increment remindersSent count
  Send invite email again
  Update lastReminderAt

revokeTenantInvite (mutation — "waitlist.invite" permission, reason required):
  Set status: "revoked"
  logAudit

getTenantInviteByToken (query — PUBLIC):
  Args: token
  Returns: invite details (email, schoolName, firstName, expiresAt, status)
  Used by accept page to validate token before showing form

expireOldInvites (internalMutation — daily cron):
  Find all invites with status: "pending" AND expiresAt < now
  Set status: "expired"
  Update linked waitlist entry if applicable

4.2 — Invitation email:
  Create email template: tenant_invite
  Subject: "Your EduMyles invitation is ready, [FirstName] 🎉"
  Content from spec Part 3.3
  Uses Resend React Email format
  Includes: school name, personal message, feature list, CTA button, expiry date

4.3 — Reminder emails:
  tenant_invite_reminder_day3 — "Your invitation expires in 4 days"
  tenant_invite_reminder_day6 — "Last chance — expires tomorrow"

4.4 — Platform admin send invite modal:
  Used from: /platform/waitlist (Invite button) and /platform/tenants/create
  Modal fields from spec Part 3.2
  Email pre-filled from waitlist entry
  Suggested plan pre-selected based on studentCount
  Suggested modules pre-checked (Finance, Attendance, Academics always checked)
  Personal message textarea (optional)
  Submit → sendTenantInvite mutation
  Show success: "Invitation sent to [email]. Expires in 7 days."

VERIFY:
- [ ] Send invite: tenant_invites record created with 7-day expiry
- [ ] Invite email received with correct content and working link
- [ ] Day 3 reminder scheduled correctly
- [ ] Day 6 reminder scheduled correctly
- [ ] Resend invite: new token, email sent again
- [ ] Revoke: status set to "revoked"
- [ ] Expired invite (past expiresAt): shows correct error on accept page

=======================================================================
PHASE 5 — TENANT ACCOUNT CREATION (CRITICAL PHASE)
=======================================================================

5.1 — Accept invite page (frontend/src/app/invite/accept/page.tsx):

Public page — no auth required before reaching it.

On load:
  Read ?token= from URL
  Call getTenantInviteByToken query
  If invalid/used/expired: show appropriate error with "Request new invite" link

Show invitation details:
  School name, invited by (if personalMessage), "Create your admin account" form

Form fields:
  First name (pre-filled from invite)
  Last name (pre-filled from invite)
  Email (pre-filled and LOCKED — cannot change)
  Phone number
  Password with strength indicator
  Confirm password
  Terms of Service checkbox

"Sign In Instead" link:
  Navigates to WorkOS AuthKit login with organization context
  On successful auth: shows confirmation screen then accepts invite

Submit flow:
  1. Client-side validation (matching passwords, ToS checked, all required fields)
  2. Show loading state
  3. Call acceptTenantInvite mutation
  4. On success: receive { redirectTo: "https://[slug].edumyles.co.ke/admin/setup" }
  5. Redirect to WorkOS auth URL to create session, which then redirects to setup

5.2 — acceptTenantInvite mutation:
  Complete implementation from spec Part 4.2
  This is a CONVEX ACTION not a mutation because it calls other actions.
  Actually: this should be a Convex mutation that schedules the WorkOS calls
  as actions and uses returned values via ctx.runAction().

  Implement as a Convex ACTION (not mutation) because it needs to:
  - Call WorkOS createOrganization (external API)
  - Call WorkOS createUser (external API)  
  - Call WorkOS createOrganizationMembership (external API)
  - Then insert Convex records

  PATTERN: Convex action calling multiple sub-actions then inserting:

  export const acceptTenantInvite = action({
    // PUBLIC — no auth
    args: { token, firstName, lastName, phone, password },
    handler: async (ctx, args) => {
      // 1. Validate invite (via runQuery)
      const invite = await ctx.runQuery(internal.platform.tenants.getInviteByToken, { token: args.token });
      if (!invite) throw new Error("Invalid invitation");
      
      // 2. Create WorkOS organization
      const workosOrgId = await ctx.runAction(internal.auth.workos.createOrganization, {
        name: invite.schoolName, domains: []
      });
      
      // 3. Create WorkOS user
      const workosUserId = await ctx.runAction(internal.auth.workos.createUser, {
        email: invite.email, firstName: args.firstName,
        lastName: args.lastName, password: args.password
      });
      
      // 4. Create WorkOS membership
      await ctx.runAction(internal.auth.workos.createOrganizationMembership, {
        userId: workosUserId, organizationId: workosOrgId, roleSlug: "admin"
      });
      
      // 5. Create all Convex records in one mutation
      const result = await ctx.runMutation(internal.platform.tenants.createTenantFromInvite, {
        inviteToken: args.token,
        workosOrgId, workosUserId,
        firstName: args.firstName, lastName: args.lastName, phone: args.phone
      });
      
      // 6. Get WorkOS auth URL for session creation
      const authUrl = await ctx.runAction(internal.auth.workos.getOrganizationAuthUrl, {
        organizationId: workosOrgId,
        redirectUri: `https://${result.slug}.edumyles.co.ke/admin/setup`
      });
      
      return { ...result, authUrl };
    }
  });

  createTenantFromInvite (internalMutation):
    All Convex record creation from spec Part 4.2 steps 5-14:
    - generateUniqueSlug
    - ctx.db.insert tenants
    - ctx.db.insert users (school_admin role)
    - Install 3 core modules (module_installs)
    - Schedule onInstall for each core module
    - ctx.db.insert tenant_onboarding with all steps incomplete
    - ctx.db.insert tenant_subscriptions (status: trialing)
    - Update tenant_invites status to "accepted"
    - Update waitlist entry to "converted"
    - Update CRM lead to "converted"
    - If resellerId: schedule reseller attribution
    - Schedule welcome email
    - Schedule Slack notification
    - logAudit: "tenant.created"
    Returns: { tenantId, userId, slug }

  ERROR HANDLING: If any WorkOS API call fails, DO NOT create Convex records.
  If WorkOS org created but user creation fails: delete the org
  (deleteOrganization action), then throw error.
  Show user: "Account creation failed. Please try again. If the problem persists,
  contact support@edumyles.co.ke"

VERIFY:
- [ ] Submit form with valid token: WorkOS org created, user created, membership created
- [ ] Convex records created: tenants, users (role: school_admin), 3 module_installs, tenant_onboarding, tenant_subscriptions
- [ ] Invite status set to "accepted"
- [ ] Redirect to /admin/setup works
- [ ] Invalid token shows correct error
- [ ] Expired token shows correct error
- [ ] Duplicate email (existing user): shows helpful error
- [ ] WorkOS API failure: clean rollback, no orphaned records

=======================================================================
PHASE 6 — SETUP WIZARD
=======================================================================

6.1 — Wizard backend (convex/modules/core/setupWizard.ts):

getSetupProgress (query — school_admin):
  Returns full tenant_onboarding record for current tenant
  Includes: currentStep, healthScore, isActivated, steps object
  Used by wizard shell and dashboard widget

completeWizardStep (mutation — school_admin):
  Args: stepKey, data? (JSON string for step-specific data)
  Full implementation from spec Part 5.2
  - Check step not already completed
  - Calculate points from STEP_POINTS map
  - Update tenant_onboarding steps and healthScore
  - Reset isStalled flag
  - If score >= 50 for first time: trigger activation sequence
  - If tenant.status is "pending_setup": update to "setup_in_progress"
  - logAudit

skipWizardStep (mutation — school_admin):
  For skippable steps only (fee_structure, staff_added, parents_invited)
  Sets skipped: true in step (no points awarded)
  Advances currentStep

activateTenant (internalMutation):
  Called when score reaches 50
  - Mark isActivated: true in onboarding
  - Set tenant.status: "trial"
  - Set tenant.trialStartedAt and trialEndsAt (+14 days from now)
  - Update tenant_subscriptions period
  - Install Starter plan modules as stealth free_trial pilot grants
  - Schedule all trial intervention emails
  - Notify platform team via Slack
  - Send congratulations email to school admin
  - Auto-assign account manager

6.2 — Wizard frontend (frontend/src/app/admin/setup/page.tsx):

Full implementation from spec Part 11.2.

Wizard shell:
- Step progress bar (12 segments, colored = completed, half = current)
- Health score display
- "Save & Continue Later" button (step 3+)
- Back button navigation
- Cannot jump ahead past current step

Each step component receives:
- stepNumber, totalSteps
- isCompleted (already done this step?)
- onComplete(data?) — async, receives step-specific data
- onBack()
- onSkip() (for skippable steps)

6.3 — Step components:

All steps follow the pattern:
1. Load any needed data with useQuery (e.g. existing academic years)
2. Show form with pre-filled values if step was done before
3. "Save & Continue" calls onComplete(formData)
4. Before calling onComplete: call the specific Convex mutation for that step
   e.g. completeWizardStep runs AFTER createAcademicYear succeeds

Step 1 — SchoolProfileStep:
  Form: schoolType, levels[], boardingType, officialEmail, phone, website,
        address, county, registrationNumber, logoUrl (UploadThing)
  On save: updateTenantProfile mutation → then completeWizardStep("school_profile")

Step 2 — AcademicYearStep:
  Form: yearName, startDate, endDate, structure (3 terms / semesters / custom)
  Auto-generates term dates based on structure selected
  Import Kenya public holidays button
  On save: createAcademicYear mutation → setCurrentAcademicYear → completeWizardStep("academic_year")

Step 3 — GradingSystemStep:
  4 preset options + custom
  Preview table showing grade boundaries
  "What does 73% get?" live calculator
  On save: setGradingSystem mutation → completeWizardStep("grading_system")

Step 4 — SubjectsStep:
  "Use Kenya Secondary Preset" button (loads 15 standard subjects)
  "Use Kenya CBC Primary Preset" button
  Editable subject list (add/remove)
  Each subject: name, code, core/elective, applicable levels
  On save: bulkCreateSubjects mutation → completeWizardStep("subjects")

Step 5 — ClassesStep:
  Auto-suggest based on school type and levels
  Class structure builder: level → streams
  Stream naming convention selector
  Subject assignment per form/grade
  On save: bulkCreateClasses mutation → completeWizardStep("classes")

Step 6 — FeeStructureStep:
  Fee categories (Day Scholar default)
  Fee components (Tuition, Activity, etc.) with amounts
  Due date
  Late fine configuration
  Payment methods + M-Pesa paybill
  On save: createFeeStructure mutation (status: "draft") → completeWizardStep("fee_structure")
  Note: fee structure stays draft until school admin activates it

Step 7 — StaffStep:
  Add individually: name, email, role, department
  "Add Another" button
  CSV import tab (download template → upload → validate → import)
  Show invited staff list with invite status
  On save: inviteStaffMember for each → completeWizardStep("staff_added", { count })

Step 8 — StudentsStep:
  CSV import (primary path)
  Download template button
  Upload → validation → preview → import
  Show import progress and results
  On save: runs data migration → completeWizardStep("students_added", { count })
  CRITICAL: fires student.enrolled events for each student → auto-creates parent records

Step 9 — ModulesStep:
  Shows recommended modules based on school profile
  Each module: name, description, price, install button
  "All free during trial" banner
  On visit: completeWizardStep("modules_configured") immediately (just viewing counts)

Step 10 — CustomizeStep:
  Logo upload (UploadThing — already uploaded in step 1 but can change)
  Primary color picker (hex)
  Live preview of student portal
  School motto/tagline
  Portal URL display (slug.edumyles.co.ke)
  On save: updateTenantBranding mutation → completeWizardStep("portal_customized")

Step 11 — ParentsStep:
  Show count of students with parent contact info
  Show estimated SMS cost
  SMS preview with actual content
  "Send to All" and "Test Send to Myself" buttons
  Show parents with missing contact info
  On "Send to All": bulkInviteParents mutation → completeWizardStep("parents_invited", { count })

Step 12 — FirstActionStep:
  3 options: Mark Attendance | Create Fee Invoice | Post Assignment
  Each links to the relevant module page
  Monitor via Convex real-time: when any action taken → auto-complete this step
  completeWizardStep("first_action") triggered automatically when:
    - Attendance session marked (attendance.session.marked event)
    - Fee structure activated (finance.fee.structure.activated event)
    - Assignment created (academics.assignment.created event)

6.4 — Wizard completion screen:
  /admin/setup/complete page
  Show full completion card from spec Part 5.14
  Display account manager info (from assignedAccountManager)
  "Go to Dashboard" button → /admin

6.5 — Onboarding progress widget:
  frontend/src/components/admin/OnboardingProgress.tsx
  Shows on /admin dashboard when wizard is incomplete
  Health score progress bar
  "Continue Setup" button
  Step status dots (12 dots — colored if complete)
  Hide when wizard is complete

VERIFY:
- [ ] Complete step 1: healthScore increases by 8
- [ ] Complete all 12 steps: healthScore = 51
- [ ] At step 8 complete with 50 points: tenant status → "trial"
- [ ] Trial starts 14 days from activation (not from signup)
- [ ] Step progress bar shows correct colors
- [ ] "Save & Continue Later" navigates to /admin
- [ ] Dashboard shows OnboardingProgress widget when incomplete
- [ ] Dashboard does NOT show widget after completion
- [ ] Step 12 auto-completes when attendance is marked

=======================================================================
PHASE 7 — STAFF INVITATION SYSTEM
=======================================================================

7.1 — Staff invite mutation (convex/modules/core/users.ts):

inviteStaffMember (mutation — school_admin):
  Full implementation from spec Part 6.1
  - Check no existing user with email in this tenant
  - Generate crypto.randomUUID() token
  - Create staff_invites record
  - Call workos.inviteUserToOrganization action to get WorkOS invite
  - Send branded staff invite email via Resend
  - Create draft staff record with status: "pending_invite"
  - Returns: { staffInviteId, inviteToken }

bulkInviteStaff (mutation — school_admin):
  Accepts array of staff objects
  Calls inviteStaffMember for each
  Returns: { sent, failed[] }

resendStaffInvite (mutation — school_admin):
  Regenerate token, reset expiry, send email again

acceptStaffInvite (action — PUBLIC):
  Full implementation from spec Part 6.2
  SAME PATTERN as acceptTenantInvite: Convex action calling sub-actions then internalMutation
  - Validate token
  - Call createOrganizationMembership WorkOS action
  - Call createTenantUserFromInvite internalMutation
  - Returns { userId, redirectTo }

createTenantUserFromInvite (internalMutation):
  - ctx.db.insert users with correct role
  - Update staff record from "pending_invite" to "active"
  - Update staff_invites status to "accepted"
  - Notify school admin in-app
  - completeWizardStepIfNotDone "staff_added"

7.2 — Staff accept page (frontend/src/app/staff/accept/page.tsx):
  Public page, similar to tenant accept page
  Shows school name and role being joined
  Form: first name, last name, password
  Email locked (from invite)
  Submit → acceptStaffInvite action → redirect to correct portal

7.3 — Staff invite email:
  Template: staff_invite
  Subject: "You've been invited to join [School Name] on EduMyles"
  Shows: school name, role, CTA button, expiry date

VERIFY:
- [ ] Invite teacher: staff_invites record created, email sent
- [ ] Accept invite: WorkOS membership created, users record created, staff status updated
- [ ] School admin notified when staff joins
- [ ] Bulk invite: processes all staff correctly
- [ ] Expired staff invite: shows correct error

=======================================================================
PHASE 8 — PARENT INVITATION SYSTEM
=======================================================================

8.1 — Bulk parent invite (convex/modules/core/users.ts):

bulkInviteParents (mutation — school_admin):
  Called from wizard Step 11 and /admin/communications
  Gets all students with parent phone/email from student records
  For each parent: createOrInviteParentAccount
  Sends SMS via Africa's Talking to phones
  Sends email via Resend to emails
  Tracks delivery: bulk_parent_invites table entry
  Returns: { smsSent, emailsSent, missing[] }

createOrInviteParentAccount (internalMutation):
  From spec Part 6.3
  Creates users record with role: "parent", status: "pending_activation"
  Links to student via parent_student_links
  Does NOT create WorkOS account yet (created on first login)

8.2 — Parent self-registration (frontend/src/app/join/[schoolCode]/page.tsx):
  School code = tenant slug
  Form: phone number OR email
  System matches to student records
  Show: "Is this your child? [Name], [Class]"
  Send OTP via SMS (Africa's Talking) or email (Resend)
  Verify OTP → create WorkOS user via magic auth → link to parent record
  Redirect to parent portal

8.3 — Parent auth callback (frontend/src/app/portal/parent/auth-callback/page.tsx):
  WorkOS redirects here after magic auth
  Extract WorkOS user ID
  Find Convex parent record by email/phone
  Update: workosUserId, status: "active"
  Create WorkOS org membership for school's organization
  Redirect to /portal/parent

8.4 — Parent SMS template:
  Short, clear, WhatsApp-friendly
  School name, student name, registration link
  Opt-out instruction

VERIFY:
- [ ] Bulk parent invite: SMS sent to all parents with phone numbers
- [ ] Parent self-registration: finds child by admission number
- [ ] OTP verification works
- [ ] Parent portal accessible after registration
- [ ] Parent linked to correct children

=======================================================================
PHASE 9 — TRIAL MANAGEMENT & CONVERSION
=======================================================================

9.1 — Trial intervention system:

scheduleTrialInterventions (internalMutation):
  Called on activation
  Schedules all 7 intervention emails via ctx.scheduler.runAt
  Using timestamps relative to trialStartedAt:
  Day 1, 3, 7, 10, 12, 13, 14

sendTrialIntervention (internalMutation — called by scheduler):
  Full implementation from spec Part 8.1
  Check tenant.status === "trial" before sending (avoid sending if converted)
  Check interventionsSent to avoid duplicates
  Send email with correct content based on type
  Send SMS for day13 and day14 types if admin has phone
  Notify account manager for day12 type
  Record in interventionsSent[]

processAllTrialExpirations (internalMutation — daily cron):
  Find all tenants with status: "trial" AND trialEndsAt < now
  Call processTrialExpiry for each
  
processTrialExpiry (internalMutation):
  Full implementation from spec Part 8.4
  - Set tenant.status: "trial_expired"
  - Suspend all non-core module_installs
  - Update subscription status to "past_due"
  - Send expiry email with strong CTA
  - Schedule hardSuspendExpiredTrial for 7 days later

hardSuspendExpiredTrial (internalMutation):
  Only if still trial_expired (not converted in grace period)
  Set tenant.status: "suspended"
  Data is preserved — tenant can reactivate by paying

9.2 — Trial banner (frontend):
  frontend/src/components/admin/TrialBanner.tsx
  From spec Part 8.2
  Shown on ALL admin pages during trial
  3 urgency levels: info (7+ days), warning (3-7 days), critical (<3 days)
  "Choose a Plan" button → /admin/settings/billing

9.3 — Trial expired state:
  When tenant.status === "trial_expired": show full-page interstitial
  Shows what's still accessible (core SIS) and what's suspended
  "Choose a Plan" and "Export Data" CTAs
  Data export generates CSV of all student records

9.4 — Plan selection and conversion:
  /admin/settings/billing — plan comparison page
  From spec Part 8.3
  Shows 3 plans: Free, Starter, Pro (+ Enterprise link)
  Billing period toggle: Monthly | Termly | Annual (with savings)
  For current tenant: show actual student count and projected costs
  Shows modules currently in use and which plan includes them
  Smart recommendation: "Pro is right for you — you're using 7 Pro modules"
  
  convertTrialToPaid (mutation):
  Full implementation from spec Part 8.3
  - Calculate correct payment amount for plan + billing period
  - Create subscription_payments record
  - Initiate M-Pesa/Stripe/Airtel payment
  - Returns pending status for payment confirmation

  onSubscriptionPaymentSuccess (internalMutation):
  Called by payment webhook
  - Update subscription status to "active"
  - Update tenant status to "active"
  - Install all plan-included modules
  - Send confirmation email with receipt

9.5 — Subscription confirmation email:
  Template: subscription_confirmed
  Shows: plan name, amount paid, next payment date, receipt link

VERIFY:
- [ ] Day 10 intervention email sent (not if already converted)
- [ ] Trial expiry: all non-core modules suspended
- [ ] Grace period: 7 days before hard suspension
- [ ] Trial banner shows correct urgency level
- [ ] Plan comparison shows real student count and costs
- [ ] M-Pesa payment: STK push, confirmation, subscription activated
- [ ] After conversion: modules reinstated, tenant.status = "active"

=======================================================================
PHASE 10 — STALLED ONBOARDING MONITORING
=======================================================================

10.1 — Stalled detection cron (checkStalledOnboardings):
  Full implementation from spec Part 7.2
  Run daily at 21:30 UTC (12:30 AM EAT)
  48-hour inactivity threshold
  Mark isStalled: true
  Notify assigned account manager
  Send nudge email (one per stalling event)

10.2 — Platform admin tenant success page:
  /platform/tenant-success — full implementation
  
  Stats row: all from Convex queries (no hardcoding)
  - Active trials count
  - Activated percentage
  - Stalled count
  - Average health score
  - Converting this week (converted in last 7 days)
  
  Filter tabs: All | At Risk (<20) | Stalled | Almost (40-50) | Activated | Converted
  
  Tenant table with sortable columns:
  - School name (link to /platform/tenants/[id])
  - Country flag + name
  - Health score with colored bar
  - Status badge
  - Last activity (relative time: "2hrs ago", "5 days ago")
  - Assigned account manager (initials avatar)
  - Actions: View | Assign AM | Send Nudge | Add Note
  
  "Send Nudge" modal:
  - Channel: Email + SMS
  - Message template selector (stalled_step_X templates)
  - Preview before sending
  - Calls sendOnboardingNudge mutation → logs intervention

10.3 — Tenant detail onboarding tab (/platform/tenants/[id]):
  Tab: Onboarding
  Shows full health score breakdown from spec Part 7.1
  Step-by-step completion table
  Account manager assignment (dropdown of platform users)
  Notes field (platform-facing, not shown to tenant)
  Intervention history timeline
  "Send intervention email" button per intervention type

VERIFY:
- [ ] Stalled cron: marks tenants inactive 48hrs as stalled
- [ ] Account manager notification: correct tenant detail link
- [ ] Platform admin sees stalled count in tenant success dashboard
- [ ] Send nudge: email sent, intervention recorded in interventionsSent

=======================================================================
PHASE 11 — EMAIL TEMPLATES (ALL ONBOARDING EMAILS)
=======================================================================

Create all email templates using Resend React Email format.
Store templates in convex/emails/ directory.
Each template is a React component exported as default.

Templates to create:

1. waitlist_confirmation — sent on waitlist signup
2. tenant_invite — sent when platform admin invites school
3. tenant_invite_reminder_day3 — day 3 reminder
4. tenant_invite_reminder_day6 — urgent reminder
5. tenant_welcome — sent after successful account creation
6. staff_invite — sent when school admin invites staff member
7. parent_invite_email — sent to parents with email
8. activation_congratulations — sent when health score reaches 50
9. trial_day3_checkin — "How's it going?"
10. trial_day7_halfway — "You're halfway through your trial"
11. trial_day10_nudge — "7 days left in your trial"
12. trial_day12_outreach — account manager personal outreach
13. trial_day13_urgent — "Tomorrow is your last day"
14. trial_expired — "Your trial has ended"
15. subscription_confirmed — payment confirmation + receipt
16. stalled_onboarding_nudge — nudge for stalled schools

Each template must:
- Use school branding (logo from platform settings, brand colors)
- Be mobile-responsive
- Include unsubscribe link in footer
- Have proper from/reply-to headers
- Include plain text fallback

VERIFY:
- [ ] All 16 templates created and render without errors
- [ ] Templates are mobile-responsive
- [ ] Unsubscribe link present in all
- [ ] All email sends use Resend via internal actions (not direct client calls)

=======================================================================
PHASE 12 — FINAL INTEGRATION & VERIFICATION
=======================================================================

12.1 — Integration test: Complete onboarding end-to-end

Run through the full flow manually:

STEP A: Waitlist submission
1. Go to / (or submit via API)
2. Submit form: "Riverside Secondary School", alice@riverside.ac.ke, Kenya, 320 students
3. Verify: waitlist record created, confirmation email received
4. Verify (if score >= 60): CRM lead created

STEP B: Platform admin invites
1. Log in as platform admin
2. Go to /platform/waitlist
3. Find "Riverside Secondary School" entry
4. Click "Invite"
5. Fill invite modal, click "Send Invitation Email"
6. Verify: tenant_invites record created with 7-day expiry
7. Verify: invitation email received at alice@riverside.ac.ke
8. Verify: waitlist entry status → "invited"

STEP C: School admin accepts invite
1. Click invite link from email
2. Verify: invite page shows school name and form
3. Fill form: first name, last name, phone, password
4. Click "Create Account & Set Up My School"
5. Verify: WorkOS organization created (check WorkOS dashboard)
6. Verify: WorkOS user created (check WorkOS dashboard)
7. Verify: WorkOS membership created (admin role)
8. Verify: tenants record created with correct slug
9. Verify: users record created with role: "school_admin"
10. Verify: 3 core module_installs created
11. Verify: tenant_onboarding record created (all steps false)
12. Verify: tenant_subscriptions created with status: "trialing"
13. Verify: welcome email received
14. Verify: Slack notification sent to platform team
15. Verify: Redirected to https://riverside-secondary.edumyles.co.ke/admin/setup

STEP D: Setup wizard
1. Verify: wizard loads at step 1
2. Complete step 1 (school profile)
3. Verify: tenant record updated with school details
4. Verify: onboarding.steps.school_profile.completed = true
5. Verify: healthScore = 8
6. Complete steps 2-8 (all required steps)
7. Verify: at step 8 completion with 50+ points: tenant.status → "trial"
8. Verify: trialStartedAt set, trialEndsAt = trialStartedAt + 14 days
9. Verify: congratulations email received
10. Verify: trial banner appears on admin dashboard
11. Complete steps 9-12
12. Verify: wizard completion screen shown
13. Verify: redirected to /admin dashboard
14. Verify: OnboardingProgress widget gone from dashboard

STEP E: Staff invitation
1. From wizard step 7 (or /admin/staff): invite a teacher
2. Verify: staff_invites record created
3. Verify: staff invite email received
4. Accept invite as teacher
5. Verify: users record created with role: "teacher"
6. Verify: staff record updated with workosUserId
7. Verify: school admin receives "John joined" notification

STEP F: Trial management
1. Wait for or manually trigger day 10 intervention
2. Verify: email sent to school admin
3. Manually expire trial (or advance time)
4. Verify: all non-core modules suspended
5. Verify: expiry email sent
6. Go to /admin/settings/billing
7. Select Starter plan, Monthly, M-Pesa
8. Complete M-Pesa payment
9. Verify: subscription activated
10. Verify: modules reinstated
11. Verify: confirmation email with receipt

12.2 — Security checks:

1. Try accessing /admin/setup with another tenant's token: blocked
2. Try calling acceptTenantInvite with used token: "already used" error
3. Try calling acceptTenantInvite with expired token: "expired" error
4. Try inviting staff without school_admin role: permission denied
5. Staff accepting invite from different school: blocked

12.3 — Final checklist:

SCHEMA:
- [ ] waitlist, tenant_invites, staff_invites tables all exist
- [ ] tenants has workosOrgId, trialStartedAt, trialEndsAt, activatedAt
- [ ] tenant_onboarding has all 12 step fields
- [ ] npx convex dev — zero errors

WORKOS:
- [ ] createOrganization creates org in WorkOS dashboard
- [ ] createUser creates user in WorkOS dashboard
- [ ] createOrganizationMembership links user to org
- [ ] Error handling: WorkOS failure rolls back gracefully

WAITLIST:
- [ ] Submit form: record created, email sent
- [ ] Platform admin sees waitlist with qual scores
- [ ] High value lead: Slack notification

INVITE:
- [ ] Send invite: email received, 7-day expiry
- [ ] Day 3 reminder scheduled
- [ ] Day 6 reminder scheduled
- [ ] Revoke: status updated

ACCOUNT CREATION:
- [ ] All 14 steps in acceptTenantInvite execute correctly
- [ ] All Convex records created atomically
- [ ] Welcome email sent
- [ ] Redirect to setup wizard works

SETUP WIZARD:
- [ ] All 12 steps render with correct form fields
- [ ] Each step saves data and advances
- [ ] Health score increments correctly
- [ ] Activation triggers at score 50
- [ ] Trial clock starts at activation

STAFF INVITES:
- [ ] Invite email sent
- [ ] Accept page works
- [ ] WorkOS membership created
- [ ] Convex user record created
- [ ] School admin notified

PARENT INVITES:
- [ ] Bulk SMS to all parents
- [ ] Self-registration flow works
- [ ] OTP verification works
- [ ] Parent linked to correct children

TRIAL MANAGEMENT:
- [ ] All 7 intervention emails scheduled on activation
- [ ] Interventions respect tenant.status (skip if converted)
- [ ] Expiry suspends non-core modules
- [ ] Conversion reactivates subscription and modules
- [ ] Trial banner shows correct urgency

PLATFORM ADMIN:
- [ ] Tenant success dashboard shows real data
- [ ] Stalled onboarding detection works
- [ ] Account manager assignment works
- [ ] Send nudge email works

FINAL:
- [ ] Zero hardcoded data anywhere
- [ ] Zero TypeScript errors (npm run type-check)
- [ ] Zero build errors (npm run build)
- [ ] All 15 integration test steps pass

=======================================================================
END OF IMPLEMENTATION PROMPT
=======================================================================
```
