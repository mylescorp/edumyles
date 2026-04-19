# EduMyles Marketplace — Complete Technical Specification
## Version 1.0 | April 2026 | Definitive Reference

---

# SECTION 1 — OVERVIEW & ARCHITECTURE

---

## 1.1 The Marketplace Model

EduMyles operates exactly like Zoho One: every feature beyond three permanently-installed core modules is a discrete, independently-purchasable module in the marketplace. The marketplace is the commercial engine of the platform — it is where all module discovery, installation, billing, publisher management, and access control converge.

The marketplace has two distinct sides:

**School-facing marketplace** (`/admin/marketplace`) — where school admins browse, install, configure, and manage modules for their school.

**Platform-facing marketplace management** (`/platform/marketplace`) — where Master Admin publishes modules, sets prices, manages publishers, processes payouts, and monitors marketplace health.

Every module sold through the marketplace follows the same lifecycle: draft → published → installed → billed → (optionally) uninstalled → data retained → purged.

---

## 1.2 What Is a Module

A module is a **logical namespace** within the same Convex deployment. It is NOT a separate microservice, NOT a feature flag, NOT a plugin with sandboxed execution. Every module:

- Lives in `convex/modules/[moduleSlug]/`
- Has its own Convex queries, mutations, and actions
- Has its own database tables prefixed with the module slug (e.g. `finance_invoices`, `attendance_records`)
- Can only execute if `module_installs` shows it as `active` for the requesting tenant
- Communicates with other modules **exclusively** via the event bus — never by direct function calls or direct table queries
- Exposes a typed `publicApi.ts` that other modules may call for data reads
- Defines its own: config schema, feature-level RBAC keys, notification catalog, nav registration, event subscriptions, and onInstall/onUninstall handlers

---

## 1.3 Event Bus (Convex-Native, Not Kafka)

EduMyles uses a **Convex-native event bus** — a `module_events` table combined with scheduled function dispatchers. This was chosen over Kafka because:

- Zero additional infrastructure — everything stays in Convex
- Events persist in the database — full audit trail built-in
- Replay capability — reprocess failed events from the table
- Strongly typed — TypeScript event payloads
- Convex real-time subscriptions work naturally with this pattern
- Appropriate for EduMyles scale (Kafka is overkill until >10M events/day)

**Pattern:**
```
Module A calls publishEvent() →
  Creates module_events record (status: pending) →
  Schedules dispatchEvent via ctx.scheduler.runAfter(0) →
  dispatchEvent finds all active subscribers for this eventType + tenantId →
  Schedules each subscriber's handler function →
  Updates module_events with results per subscriber
```

Dead letter handling: after 3 failed attempts → status: `dead_letter` → alert platform admin via Slack webhook.

---

## 1.4 Module Isolation Rules (Enforced in Code)

```
RULE 1: Never call another module's Convex functions directly
  ❌ await ctx.runQuery(internal.finance.invoices.getStudentInvoices, args)
  ✅ await ctx.runQuery(internal.finance.publicApi.getStudentInvoiceSummary, args)

RULE 2: Never query another module's tables
  ❌ ctx.db.query("finance_invoices").filter(...)  // from library module
  ✅ ctx.runQuery(internal.finance.publicApi.getStudentBalance, args)

RULE 3: Never write to another module's tables
  ❌ ctx.db.insert("attendance_records", ...)  // from communications module
  ✅ publishEvent(ctx, { eventType: "attendance.request.mark", ... })

RULE 4: All cross-module writes go through events
  Module A wants Module B to do something →
  Module A publishEvent → Module B's event handler runs the action
```

---

# SECTION 2 — MODULE CATALOG

---

## 2.1 Core Modules (Always Installed, Always Free, Cannot Uninstall)

| Slug | Name | Description |
|---|---|---|
| `core_sis` | Student Information System | Student profiles, enrollment, class assignment, parent linking |
| `core_users` | User Management | All user accounts, roles, sessions, authentication flows |
| `core_notifications` | Notifications | In-app notification delivery, read tracking, preference management |

Core modules are seeded as `module_installs` records for every tenant on tenant creation, with `status: "active"` and `isFree: true`. They cannot appear in the marketplace install flow.

---

## 2.2 Standard Modules (Marketplace, Per-Student Pricing)

| Slug | Name | Base Rate (KES/student/month) | Dependencies |
|---|---|---|---|
| `mod_academics` | Academics | 15 | `core_sis` |
| `mod_attendance` | Attendance | 10 | `core_sis`, `core_notifications` |
| `mod_admissions` | Admissions | 8 | `core_sis` |
| `mod_finance` | Finance & Fees | 20 | `core_sis` |
| `mod_timetable` | Timetable | 8 | `core_sis`, `core_users` |
| `mod_library` | Library | 5 | `core_sis` |
| `mod_transport` | Transport | 12 | `core_sis`, `core_notifications` |
| `mod_hr` | HR & Payroll | 18 | `core_users` |
| `mod_communications` | Communications | 15 | `core_notifications` |
| `mod_ewallet` | E-Wallet | 10 | `core_sis`, `mod_finance` |
| `mod_ecommerce` | School Store | 8 | `core_sis`, `mod_ewallet` |
| `mod_reports` | Reports & Analytics | 12 | `core_sis` |

## 2.3 Extended Modules

| Slug | Name | Base Rate | Minimum Plan | Dependencies |
|---|---|---|---|---|
| `mod_advanced_analytics` | Advanced Analytics | 25 | Pro | `mod_reports` |
| `mod_parent_portal` | Parent Portal | 8 | Free | `core_sis`, `core_notifications` |
| `mod_alumni` | Alumni Portal | 5 | Starter | `core_sis` |
| `mod_partner` | Partner Portal | 5 | Starter | `core_sis`, `mod_reports` |

---

## 2.4 Module File Structure (Required for Every Module)

```
convex/modules/[moduleSlug]/
├── index.ts              # Module metadata, NAV_CONFIG, DASHBOARD_WIDGETS
├── onInstall.ts          # internalMutation: runs on module install
├── onUninstall.ts        # internalMutation: runs on module uninstall
├── configSchema.ts       # ModuleConfigSchema definition
├── features.ts           # Feature-level RBAC keys
├── notifications.ts      # Notification catalog
├── eventHandlers.ts      # Handlers for events this module subscribes to
├── publicApi.ts          # internalQuery functions exposed to other modules
├── queries.ts            # Public queries (tenant-scoped)
├── mutations.ts          # Public mutations (tenant-scoped)
└── actions.ts            # Server-side actions (payments, file gen, external APIs)
```

---

# SECTION 3 — PRICING ARCHITECTURE

---

## 3.1 Tiered Band Model

All module prices use tiered bands applied per student per month:

```
Band 1:   1 – 100 students     → 100% of base rate
Band 2: 101 – 500 students     →  85% of base rate
Band 3: 501 – 1,000 students   →  70% of base rate
Band 4: 1,001 – 2,500 students →  60% of base rate
Band 5: 2,501+ students        →  50% of base rate
```

**Example: Finance module (KES 20/student/month) for 750 students:**
```
Band 1: 100 students × KES 20.00 = KES  2,000.00
Band 2: 400 students × KES 17.00 = KES  6,800.00
Band 3: 250 students × KES 14.00 = KES  3,500.00
─────────────────────────────────────────────────
Monthly subtotal:                   KES 12,300.00
```

---

## 3.2 Billing Periods & Discounts

| Period | Upfront | Multiplier | Effective Discount |
|---|---|---|---|
| Monthly | 1 month | 1.00 | None |
| Termly | 3 months | 0.95 | 5% off |
| Quarterly | 3 months | 0.95 | 5% off |
| Annual | 12 months | 0.82 | 18% off |

**Annual savings example (Finance, 750 students):**
```
Monthly (×12):  KES 12,300 × 12 = KES 147,600
Annual (×0.82): KES 12,300 × 12 × 0.82 = KES 121,032
Annual saving:  KES 26,568 per year
```

---

## 3.3 VAT

16% VAT applied to all module invoices (Kenya statutory requirement).
Shown as a separate line item on all invoices.
VAT-exempt schools: Master Admin flags `tenant.isVatExempt: true` — no VAT applied.
VAT amounts stored separately in all invoice records for reporting.

---

## 3.4 Student Count for Billing

- Count captured on **last day of each billing period** (snapshot billing)
- Only `status: "active"` students counted
- Students added mid-period: charged from next period
- Students withdrawn mid-period: reduction from next period
- Count stored in `tenant_subscriptions.studentCountAtBilling` for audit

---

## 3.5 Mid-Period Module Install

When a school installs a module mid-billing-period:
- Module is **immediately available** to use
- **Billing starts at the beginning of the NEXT billing period**
- School gets the partial current period free (intentional — encourages adoption)
- `module_installs.billingStartsAt` is set to next billing period start

---

## 3.6 Trial Period

- Every paid module gets a **14-day free trial** on first install
- Trial applies only on **first-ever install** — not on reinstall
- `module_installs.trialEndsAt` = installedAt + 14 days
- `module_installs.billingStartsAt` = start of next billing period after trial ends
- If school uninstalls during trial: no charge at all
- If school reinstalls the same module: no new trial (tracked by first install date)

---

## 3.7 Pricing Authority

**Master Admin is the sole authority** on all module pricing. No one else can set prices.

Publisher pricing suggestion (when external publishers enabled): publishers suggest a price at submission. Master Admin decides the actual price at approval.

Master Admin capabilities:
- Set base rate per student per month for any module
- Set individual band rates (or use auto-calculated 85%/70%/60%/50% of base)
- Set plan-based pricing overrides (module costs less on Pro than on Starter)
- Grant per-school negotiated prices (price overrides) with expiry dates
- All price changes logged in immutable `module_price_history`

---

## 3.8 Plan-Based Pricing

Modules can be priced differently per subscription plan:

```typescript
// Example: Finance module priced by plan
planOverrides: [
  { plan: "starter", baseRateKes: 20 },  // standard rate
  { plan: "pro", baseRateKes: 0 },       // included in Pro plan (no charge)
  { plan: "enterprise", baseRateKes: 0 }, // included in Enterprise
]
```

When `baseRateKes: 0` AND `module_plan_inclusions.isIncluded: true` for that plan → no invoice generated for that module for that school.

---

## 3.9 Price Calculation Function

```typescript
// convex/modules/marketplace/pricing.ts

export function calculateModulePrice(
  pricing: ModulePricing,
  studentCount: number,
  billingPeriod: "monthly" | "termly" | "quarterly" | "annual"
): PriceCalculation {
  const bands = [
    { threshold: 100,  rate: pricing.band1Rate },
    { threshold: 500,  rate: pricing.band2Rate },
    { threshold: 1000, rate: pricing.band3Rate },
    { threshold: 2500, rate: pricing.band4Rate },
    { threshold: Infinity, rate: pricing.band5Rate },
  ];

  let subtotalMonthly = 0;
  let remaining = studentCount;
  let prevThreshold = 0;
  const bandBreakdown: BandBreakdown[] = [];

  for (const band of bands) {
    if (remaining <= 0) break;
    const studentsInBand = Math.min(remaining, band.threshold - prevThreshold);
    const bandSubtotal = studentsInBand * band.rate;
    subtotalMonthly += bandSubtotal;
    bandBreakdown.push({
      band: prevThreshold + 1,
      students: studentsInBand,
      rateKes: band.rate,
      subtotalKes: bandSubtotal,
    });
    remaining -= studentsInBand;
    prevThreshold = band.threshold;
  }

  const periods = { monthly: 1, termly: 3, quarterly: 3, annual: 12 };
  const multipliers = { monthly: 1.0, termly: 0.95, quarterly: 0.95, annual: 0.82 };

  const periodCount = periods[billingPeriod];
  const multiplier = multipliers[billingPeriod];
  const grossPeriodTotal = subtotalMonthly * periodCount;
  const discountedSubtotal = grossPeriodTotal * multiplier;
  const discountKes = grossPeriodTotal - discountedSubtotal;
  const vatKes = discountedSubtotal * (pricing.vatRatePct / 100);
  const totalKes = discountedSubtotal + vatKes;

  return {
    bandBreakdown,
    subtotalMonthlyKes: subtotalMonthly,
    grossPeriodKes: grossPeriodTotal,
    discountKes,
    discountPct: (1 - multiplier) * 100,
    vatKes,
    vatRatePct: pricing.vatRatePct,
    totalKes,
    effectiveMonthlyKes: totalKes / periodCount,
  };
}

// Get effective pricing for a tenant (checks overrides)
export async function getEffectivePricing(
  ctx: QueryCtx,
  moduleId: Id<"marketplace_modules">,
  tenantId: string
): Promise<ModulePricing> {
  // 1. Check per-school override first
  const override = await ctx.db
    .query("module_price_overrides")
    .withIndex("by_moduleId_tenantId", q =>
      q.eq("moduleId", moduleId).eq("tenantId", tenantId)
    )
    .filter(q => q.eq(q.field("isActive"), true))
    .unique();

  if (override && (!override.expiresAt || override.expiresAt > Date.now())) {
    // Return override pricing — flat rate replaces all bands
    const basePricing = await ctx.db
      .query("module_pricing")
      .withIndex("by_moduleId", q => q.eq("moduleId", moduleId))
      .unique();
    return {
      ...basePricing!,
      band1Rate: override.overridePriceKes,
      band2Rate: override.overridePriceKes,
      band3Rate: override.overridePriceKes,
      band4Rate: override.overridePriceKes,
      band5Rate: override.overridePriceKes,
      hasOverride: true,
      overrideId: override._id,
    };
  }

  // 2. Check plan-based pricing
  const subscription = await getTenantSubscription(ctx, tenantId);
  const basePricing = await ctx.db
    .query("module_pricing")
    .withIndex("by_moduleId", q => q.eq("moduleId", moduleId))
    .unique();

  if (!basePricing) throw new Error("Module pricing not configured");

  const planOverride = basePricing.planOverrides.find(
    p => p.plan === subscription?.plan
  );

  if (planOverride) {
    return { ...basePricing, band1Rate: planOverride.baseRateKes,
             band2Rate: planOverride.baseRateKes, band3Rate: planOverride.baseRateKes,
             band4Rate: planOverride.baseRateKes, band5Rate: planOverride.baseRateKes };
  }

  return basePricing;
}
```

---

# SECTION 4 — INSTALLATION SYSTEM

---

## 4.1 Complete Install Flow

```
School Admin: Clicks "Install [Module Name]"
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│  checkInstallRequirements (server-side, Convex query)   │
│                                                          │
│  CHECK 1: Is tenant subscription active?                 │
│    No → { error: "SUBSCRIPTION_INACTIVE", redirect: "/admin/settings/billing" }
│                                                          │
│  CHECK 2: Does tenant plan meet module.minimumPlan?      │
│    No → { error: "PLAN_TOO_LOW", requiredPlan, currentPlan }
│                                                          │
│  CHECK 3: Are all dependencies installed (status:active)?│
│    No → { error: "MISSING_DEPS", missingDeps[], depPricing[] }
│                                                          │
│  CHECK 4: Does user have RBAC permission to install?     │
│    No → { error: "NO_PERMISSION" }                       │
│                                                          │
│  CHECK 5: Is there an active pilot grant?               │
│    Yes → { free: true, pilotGrantId, grantType }        │
│                                                          │
│  CHECK 6: Is module free (baseRateKes === 0)?           │
│    Yes → proceed to install immediately                  │
│                                                          │
│  CHECK 7: All checks passed → show pricing confirmation  │
└─────────────────────────────────────────────────────────┘
      │
      ▼ (if payment required)
┌─────────────────────────────────────────────────────────┐
│  PRICING CONFIRMATION SCREEN                             │
│                                                          │
│  Module: Finance & Fees                                  │
│  Current active students: 320                            │
│                                                          │
│  Price breakdown:                                        │
│  Band 1: 100 students × KES 20.00 = KES 2,000           │
│  Band 2: 220 students × KES 17.00 = KES 3,740           │
│  ─────────────────────────────────────────────           │
│  Monthly subtotal:                  KES 5,740            │
│                                                          │
│  Billing period: [Monthly▾] [Termly▾] [Annual▾]         │
│    Annual selected: KES 5,740 × 12 × 0.82 = KES 56,482  │
│    You save KES 12,326/year vs monthly                   │
│                                                          │
│  VAT (16%):                         KES  9,037           │
│  Total (annual):                    KES 65,519           │
│                                                          │
│  ✓ Free for 14 days — billing starts 1 May 2026          │
│                                                          │
│  Payment method: [M-Pesa▾] [Airtel▾] [Card▾] [Bank▾]    │
│                                                          │
│  [Cancel]              [Confirm & Install]               │
└─────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│  installModule mutation                                   │
│                                                          │
│  1. Create module_installs { status: "installing" }      │
│  2. Create pending invoice in finance ledger             │
│  3. Process payment if required                          │
│  4. On payment success: continue                         │
│  5. On payment failure: status → "payment_failed"        │
│     Retry window: 24 hours                               │
│                                                          │
│  6. runModuleOnInstall internal mutation:                 │
│     a. Create default module_access_config               │
│        (from module's DEFAULT_ROLE_ACCESS constant)      │
│     b. Register event subscriptions in                   │
│        module_event_subscriptions table                  │
│     c. Create default module_notification_settings       │
│     d. Create module-specific initial data               │
│        (e.g. Finance: default fee categories)            │
│     e. Register nav items (stored in tenant config)      │
│                                                          │
│  7. Update module_installs { status: "active" }          │
│  8. Publish event: module.installed                      │
│  9. In-app notification to school admin:                 │
│     "Finance & Fees installed successfully"              │
│  10. Module nav item appears in sidebar immediately      │
│      (real-time via Convex subscription)                 │
└─────────────────────────────────────────────────────────┘
```

---

## 4.2 Install Status State Machine

```
                    ┌─────────────────┐
                    │ install_requested│
                    └────────┬────────┘
                             │ module is free or pilot grant
                    ┌────────▼────────┐
                    │payment_pending  │◄──── payment required
                    └────────┬────────┘
          payment failed     │ payment success
               ┌─────────────┼─────────────────┐
               ▼             ▼                  │
    ┌────────────────┐ ┌──────────┐             │
    │ payment_failed │ │installing│             │
    └────────────────┘ └────┬─────┘             │
      retry 24hrs           │                   │
                    ┌───────▼──────┐            │
                    │    active    │◄───────────┘
                    └──────┬───────┘
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌──────────┐  ┌─────────────────┐  ┌───────────────────┐
    │ disabled │  │suspended_payment│  │suspended_platform │
    └────┬─────┘  └────────┬────────┘  └─────────┬─────────┘
         │ enable          │ pay              │ reinstate
         └────────┐        └──────────────────┘
                  ▼
             ┌──────────┐
             │  active  │
             └──────────┘

    active/disabled/suspended → uninstalling → uninstalled
                                                    │
                                                    │ 90 days
                                                    ▼
                                               data_purged
```

---

## 4.3 Dependency Resolution UI

When a module has unmet dependencies, show this screen instead of the pricing confirmation:

```
┌─────────────────────────────────────────────────────────┐
│  Before installing School Store, you need:              │
│                                                         │
│  ✅ Finance & Fees      — already installed             │
│  ❌ E-Wallet            — not installed                  │
│     KES 10/student/month                                │
│     For your 320 students: +KES 3,200/month             │
│                                                         │
│  [Install E-Wallet + School Store]   [Cancel]           │
│                                                         │
│  Combined monthly total: +KES 5,760/month               │
└─────────────────────────────────────────────────────────┘
```

"Install E-Wallet + School Store" triggers sequential installs (E-Wallet first, then School Store) in a single mutation flow.

---

## 4.4 Module Access Control After Install

After install, `module_access_config` is created with default role access from the module's `DEFAULT_ROLE_ACCESS` constant. School admin can then customize via `/admin/settings/modules/[slug]`.

**Default access matrix across modules:**

| Module | school_admin | principal | teacher | student | parent |
|---|---|---|---|---|---|
| mod_finance | full | read_only | none | restricted¹ | restricted² |
| mod_attendance | full | full | restricted³ | restricted⁴ | restricted⁵ |
| mod_academics | full | full | restricted⁶ | restricted⁷ | restricted⁸ |
| mod_library | full | read_only | none | restricted⁹ | none |
| mod_hr | full | read_only | restricted¹⁰ | none | none |
| mod_timetable | full | full | restricted¹¹ | restricted¹² | restricted¹³ |
| mod_transport | full | read_only | none | restricted¹⁴ | restricted¹⁵ |
| mod_communications | full | full | restricted¹⁶ | none | restricted¹⁷ |
| mod_ewallet | full | read_only | none | restricted¹⁸ | restricted¹⁹ |
| mod_reports | full | full | restricted²⁰ | none | none |

Footnotes (feature keys granted for "restricted" roles):
1. view_own_invoices, view_own_balance, download_own_receipts
2. view_child_invoices, view_child_balance, pay_child_fees, download_child_receipts
3. mark_own_class_attendance, view_own_class_attendance
4. view_own_attendance
5. view_child_attendance
6. create_assignments, grade_own_assignments, view_gradebook_own_class
7. view_own_grades, submit_assignments, view_own_report_cards
8. view_child_grades, view_child_assignments, view_child_report_cards
9. search_catalogue, borrow_books, view_own_borrowing_history
10. view_own_payslips, apply_for_leave, view_own_leave_balance
11. view_timetable_own_class
12. view_own_timetable
13. view_child_timetable
14. view_own_route
15. view_child_route, view_vehicle_location
16. send_class_announcements, message_own_class_parents
17. view_announcements, message_own_teacher
18. view_own_balance, view_own_transactions
19. view_child_balance, topup_child_wallet
20. view_own_class_reports

---

## 4.5 Module Feature-Level RBAC Schema

Each module's `features.ts` exports:

```typescript
export type ModuleFeature = {
  key: string;             // "view_own_invoices"
  label: string;           // "View Own Invoices"
  description: string;     // "Student can see their own fee invoices"
  defaultRoles: string[];  // ["student"] — roles that get this by default
  riskyPermission?: boolean; // true = requires extra confirmation when granting
};

export const FINANCE_FEATURES: Record<string, ModuleFeature> = {
  manage_fee_structures: {
    key: "manage_fee_structures",
    label: "Manage Fee Structures",
    description: "Create and edit fee structures for classes and student categories",
    defaultRoles: ["school_admin"],
    riskyPermission: false,
  },
  // ... all features
};

export const FINANCE_DEFAULT_ROLE_ACCESS: RoleAccessConfig[] = [
  { role: "school_admin", accessLevel: "full", allowedFeatures: [] },
  { role: "principal", accessLevel: "read_only", allowedFeatures: [] },
  { role: "teacher", accessLevel: "none", allowedFeatures: [] },
  { role: "student", accessLevel: "restricted",
    allowedFeatures: ["view_own_invoices", "view_own_balance", "download_own_receipts"] },
  { role: "parent", accessLevel: "restricted",
    allowedFeatures: ["view_child_invoices", "view_child_balance", "pay_child_fees",
                      "download_child_receipts", "set_payment_reminders"] },
];
```

---

# SECTION 5 — UNINSTALL SYSTEM

---

## 5.1 Complete Uninstall Flow

```
School Admin: Clicks "Uninstall Finance & Fees"
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│  PRE-UNINSTALL CHECKS                                    │
│                                                          │
│  CHECK 1: Other active modules depend on this one?       │
│    mod_ewallet depends on mod_finance                    │
│    mod_ecommerce depends on mod_ewallet                  │
│    → Show cascade list: "3 modules will also uninstall"  │
│                                                          │
│  CHECK 2: Active unpaid invoices?                        │
│    "You have 47 unpaid invoices totaling KES 234,000"    │
│    → Warning, not a blocker                              │
└─────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│  CONSEQUENCES DISCLOSURE (must show, cannot skip)        │
│                                                          │
│  Uninstalling Finance & Fees                             │
│                                                          │
│  This will immediately:                                  │
│  • Remove Finance from school admin sidebar              │
│  • Remove fee information from parent portal             │
│  • Remove fee payment option from parent portal          │
│  • Stop all automatic payment processing                 │
│  • Stop all fee reminder SMS/emails                      │
│                                                          │
│  Modules that will also be uninstalled:                  │
│  • E-Wallet (depends on Finance)                         │
│  • School Store (depends on E-Wallet)                    │
│                                                          │
│  Your data:                                              │
│  • All financial records retained for 90 days            │
│  • You can export your data anytime before               │
│    15 July 2026 (90 days from today)                     │
│  • After 15 July 2026, all data is permanently deleted   │
│  • Reinstall within 90 days to recover all data          │
│                                                          │
│  Billing:                                                │
│  • Finance billing stops at end of current period        │
│    (30 April 2026)                                       │
│  • No refund for current billing period                  │
│                                                          │
│  Type "UNINSTALL" to confirm:  [______________]          │
│                                                          │
│  [Cancel]                   [Confirm Uninstall]          │
└─────────────────────────────────────────────────────────┘
      │ (typed "UNINSTALL", clicked Confirm)
      ▼
┌─────────────────────────────────────────────────────────┐
│  uninstallModule mutation                                 │
│                                                          │
│  1. status: "uninstalling"                               │
│  2. Publish event: module.uninstalling                   │
│     (other modules can react and clean up)               │
│  3. For each dependent module (cascade):                 │
│     - Repeat uninstall steps 1-8 for each               │
│  4. runModuleOnUninstall internal mutation:              │
│     a. Set all event subscriptions isActive: false       │
│     b. Remove module from nav config                     │
│     c. Remove dashboard widgets                          │
│     d. Cancel all scheduled notifications for this module│
│     e. Cancel future billing for this module             │
│  5. Set dataRetentionEndsAt: now + 90 days               │
│  6. status: "uninstalled"                                │
│  7. Publish event: module.uninstalled                    │
│  8. In-app notification to school admin:                 │
│     "Finance & Fees uninstalled. Export your data →"     │
│  9. Show data export button prominently                  │
└─────────────────────────────────────────────────────────┘
```

---

## 5.2 Data Retention & Purge

```
uninstalled (day 0)
      │
      │ School can:
      │ - View all data (read-only)
      │ - Export data as CSV/JSON
      │ - Reinstall to recover data
      │
      ▼ (day 90 — midnight EAT)
purge cron job runs:
      - Deletes all tables prefixed with moduleSlug for this tenantId
      - Deletes module_access_config record
      - Deletes module_notification_settings record
      - Updates module_installs.status: "data_purged"
      - Sends final notification: "Finance data permanently deleted"
      │
      ▼
data_purged (permanent)
```

---

## 5.3 Reinstall Within Retention Window

```
School Admin reinstalls Finance within 90 days:
      │
      ▼
System detects: previous install exists with status "uninstalled"
      │
      ▼
Dialog:
┌─────────────────────────────────────────────────────────┐
│  Restore Finance & Fees Data?                           │
│                                                         │
│  We found your previous Finance data from when you      │
│  uninstalled on 15 April 2026.                          │
│                                                         │
│  [Restore previous data]   [Start fresh]                │
│                                                         │
│  Previous data expires: 15 July 2026                    │
└─────────────────────────────────────────────────────────┘

If "Restore": reactivate existing data, resume billing from next period
If "Start fresh": mark previous data for immediate purge, create new install
```

---

# SECTION 6 — BILLING ENGINE

---

## 6.1 Monthly Billing Run (1st of Every Month)

```typescript
// convex/modules/marketplace/billing.ts

export const runMonthlyModuleBilling = internalMutation({
  handler: async (ctx) => {
    const now = new Date();
    const billingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Get all active installs where nextBillingDate has passed
    const dueInstalls = await ctx.db
      .query("module_installs")
      .withIndex("by_nextBillingDate", q =>
        q.lte("nextBillingDate", now.getTime())
      )
      .filter(q => q.eq(q.field("status"), "active"))
      .collect();

    for (const install of dueInstalls) {
      // Skip core modules (always free)
      if (install.moduleSlug.startsWith("core_")) {
        await updateNextBillingDate(ctx, install);
        continue;
      }

      // Get active student count for tenant
      const studentCount = await getActiveStudentCount(ctx, install.tenantId);

      // Get effective pricing (checks overrides first)
      const pricing = await getEffectivePricing(ctx, install.moduleId, install.tenantId);

      // Check plan inclusion (is this module included in their plan?)
      const planInclusion = await ctx.db
        .query("module_plan_inclusions")
        .withIndex("by_moduleId_plan", q =>
          q.eq("moduleId", install.moduleId).eq("plan", currentPlan)
        )
        .unique();

      if (planInclusion?.isIncluded && !planInclusion.includedStudentLimit) {
        // Module fully included in plan — no charge
        await updateNextBillingDate(ctx, install);
        continue;
      }

      // Check for active pilot grant
      const activePilot = await ctx.db
        .query("pilot_grants")
        .withIndex("by_moduleId_tenantId", q =>
          q.eq("moduleId", install.moduleId).eq("tenantId", install.tenantId)
        )
        .filter(q =>
          q.and(
            q.eq(q.field("status"), "active"),
            q.or(
              q.eq(q.field("grantType"), "free_trial"),
              q.eq(q.field("grantType"), "free_permanent"),
            )
          )
        )
        .first();

      if (activePilot?.grantType === "free_permanent" ||
          (activePilot?.grantType === "free_trial" &&
           activePilot.endDate && activePilot.endDate > now.getTime())) {
        await updateNextBillingDate(ctx, install);
        continue;
      }

      // Calculate amount
      const priceCalc = calculateModulePrice(pricing, studentCount, install.billingPeriod);

      // Check for discounted pilot
      let finalTotal = priceCalc.totalKes;
      if (activePilot?.grantType === "discounted" && activePilot.discountPct) {
        finalTotal = finalTotal * (1 - activePilot.discountPct / 100);
      }

      // Create invoice
      const invoiceId = await ctx.db.insert("finance_invoices", {
        tenantId: install.tenantId,
        type: "module_subscription",
        moduleId: install.moduleId,
        moduleSlug: install.moduleSlug,
        description: `${getModuleName(install.moduleSlug)} — ${billingPeriod}`,
        studentCount,
        pricePerStudentKes: pricing.band1Rate,
        subtotalKes: priceCalc.grossPeriodKes,
        discountKes: priceCalc.discountKes,
        vatKes: priceCalc.vatKes,
        totalKes: finalTotal,
        paidAmountKes: 0,
        billingPeriod: install.billingPeriod,
        status: "pending",
        dueDate: now.getTime() + 7 * 24 * 60 * 60 * 1000, // 7 days grace
        createdAt: now.getTime(),
      });

      // Attempt auto-payment if payment method on file
      await ctx.scheduler.runAfter(0, internal.payments.processModulePayment, {
        invoiceId,
        tenantId: install.tenantId,
        install,
      });

      // Update next billing date
      await updateNextBillingDate(ctx, install);
    }
  }
});

function updateNextBillingDate(ctx: MutationCtx, install: ModuleInstall) {
  const periods = { monthly: 1, termly: 3, quarterly: 3, annual: 12 };
  const monthsToAdd = periods[install.billingPeriod];
  const next = new Date(install.nextBillingDate);
  next.setMonth(next.getMonth() + monthsToAdd);
  return ctx.db.patch(install._id, { nextBillingDate: next.getTime() });
}
```

---

## 6.2 Payment Failure Cascade

```typescript
// convex/modules/marketplace/billing.ts

export const handleModulePaymentFailure = internalMutation({
  args: { invoiceId: v.id("finance_invoices"), installId: v.id("module_installs") },
  handler: async (ctx, args) => {
    const install = await ctx.db.get(args.installId);
    if (!install) return;

    const failureCount = (install.paymentFailureCount ?? 0) + 1;
    await ctx.db.patch(args.installId, { paymentFailureCount: failureCount });

    // Day 0: notify school admin
    await createNotification(ctx, {
      tenantId: install.tenantId,
      targetRole: "school_admin",
      title: `Payment failed: ${getModuleName(install.moduleSlug)}`,
      body: `Your payment for ${getModuleName(install.moduleSlug)} failed. Update your payment method to keep access.`,
      actionUrl: "/admin/settings/billing",
      type: "payment_failure",
    });

    // Day 3: reminder
    await ctx.scheduler.runAt(
      Date.now() + 3 * 24 * 60 * 60 * 1000,
      internal.marketplace.billing.sendPaymentReminder,
      { installId: args.installId }
    );

    // Day 7: suspend module
    await ctx.scheduler.runAt(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
      internal.marketplace.billing.suspendModuleForPayment,
      { installId: args.installId }
    );

    // Day 30: auto-uninstall (data retention starts)
    await ctx.scheduler.runAt(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
      internal.marketplace.installation.autoUninstallForNonPayment,
      { installId: args.installId }
    );
  }
});

export const reinstateModuleAfterPayment = internalMutation({
  args: { installId: v.id("module_installs") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.installId, {
      status: "active",
      paymentFailureCount: 0,
    });
    await createNotification(ctx, {
      targetRole: "school_admin",
      title: "Access restored",
      body: "Your payment was received and module access has been restored.",
    });
  }
});
```

---

## 6.3 Plan Downgrade Module Audit

```typescript
// convex/modules/marketplace/planAudit.ts

export const auditModulesForPlanChange = query({
  args: { fromPlan: v.string(), toPlan: v.string() },
  handler: async (ctx, args) => {
    const { tenantId } = await requireTenantContext(ctx);
    const installs = await ctx.db
      .query("module_installs")
      .withIndex("by_tenantId", q => q.eq("tenantId", tenantId))
      .filter(q => q.eq(q.field("status"), "active"))
      .collect();

    const results = [];
    for (const install of installs) {
      const module = await ctx.db.get(install.moduleId);
      if (!module || module.isCore) continue;

      const meetsNewPlan = planMeetsMinimum(args.toPlan, module.minimumPlan);
      const includedInOldPlan = await isModuleIncludedInPlan(ctx, module._id, args.fromPlan);
      const includedInNewPlan = await isModuleIncludedInPlan(ctx, module._id, args.toPlan);

      if (!meetsNewPlan) {
        results.push({
          moduleId: module._id, moduleSlug: module.slug, moduleName: module.name,
          action: "will_be_suspended",
          reason: `Requires ${module.minimumPlan} plan`,
          effectiveDate: "end_of_current_period",
          dataNote: "Data retained 90 days after suspension",
        });
      } else if (includedInOldPlan && !includedInNewPlan) {
        const projectedMonthly = await calculateProjectedMonthlyKes(ctx, module._id, tenantId);
        results.push({
          moduleId: module._id, moduleSlug: module.slug, moduleName: module.name,
          action: "will_start_billing",
          reason: `Included in ${args.fromPlan} but charged on ${args.toPlan}`,
          projectedMonthlyKes: projectedMonthly,
        });
      }
    }
    return results;
  }
});
```

---

# SECTION 7 — PILOT GRANT SYSTEM

---

## 7.1 Grant Types

| Type | Description | Who Can Grant |
|---|---|---|
| `free_trial` | Full access, no payment, auto-expires (default 14 days) | Any platform admin |
| `free_permanent` | Never charged — for NGOs, partners, internal schools | master_admin only |
| `discounted` | Reduced price set explicitly (e.g. KES 5 instead of KES 20) | Any platform admin |
| `plan_upgrade` | Access to a module above their plan without upgrading | Any platform admin |
| `beta_access` | Access to unreleased/beta module | master_admin only |

---

## 7.2 Pilot Grant Rules

- One pilot per module per tenant at a time
- Multiple different-module pilots can stack (school can have Finance trial + Attendance trial simultaneously)
- School cannot uninstall + reinstall to reset trial (first install date permanently tracked in `pilotGrants`)
- Pilots override plan restrictions (school on Starter can get Enterprise module via pilot)
- When pilot expires: module suspended (not uninstalled) until school pays or uninstalls

---

## 7.3 Expiry Notification Schedule

| Days Before Expiry | Channels |
|---|---|
| 30 days | Email + in-app |
| 14 days | Email + in-app |
| 7 days | Email + in-app + SMS |
| 3 days | Email + in-app + SMS |
| 1 day | Email + in-app + SMS |
| Expiry day | Email + in-app (explains suspension + options) |

After expiry grace (2 days): module status → `suspended_platform` (until school pays or uninstalls).

---

## 7.4 School Admin Pilot View

```
╔══════════════════════════════════════════════════════════════╗
║  Finance & Fees                          [Free Trial]        ║
║                                           8 days remaining   ║
║  v1.2.0 · Active                                             ║
║                                                              ║
║  Billing starts: 1 May 2026                                  ║
║  After trial:    KES 5,740/month (320 students)              ║
║                                                              ║
║  [Subscribe Now]              [Cancel Trial]                 ║
╚══════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════╗
║  HR & Payroll                           [Special Rate]       ║
║                                         40% off              ║
║  v2.0.0 · Active                                             ║
║                                                              ║
║  Your rate: KES 10.80/student    Normal: KES 18/student      ║
║  Special rate valid until: 31 December 2026                  ║
╚══════════════════════════════════════════════════════════════╝
```

---

# SECTION 8 — EVENT BUS COMPLETE SPEC

---

## 8.1 Schema

```typescript
// convex/schema.ts

module_events: defineTable({
  eventType: v.string(),
  publisherModule: v.string(),
  tenantId: v.string(),
  payload: v.string(),                    // JSON string — typed per event
  publishedAt: v.number(),
  processingStatus: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("completed"),
    v.literal("failed"),
    v.literal("dead_letter"),
  ),
  retryCount: v.number(),
  lastRetryAt: v.optional(v.number()),
  subscriberResults: v.array(v.object({
    subscriberModule: v.string(),
    status: v.string(),
    processedAt: v.number(),
    error: v.optional(v.string()),
  })),
  correlationId: v.optional(v.string()),
  causationId: v.optional(v.string()),    // event that caused this event
})
  .index("by_tenantId", ["tenantId"])
  .index("by_eventType", ["eventType"])
  .index("by_processingStatus", ["processingStatus"])
  .index("by_publishedAt", ["publishedAt"]),

module_event_subscriptions: defineTable({
  eventType: v.string(),
  subscriberModule: v.string(),
  tenantId: v.string(),
  handlerFunctionName: v.string(),        // internal function path
  isActive: v.boolean(),
  createdAt: v.number(),
})
  .index("by_eventType_tenantId", ["eventType", "tenantId"])
  .index("by_subscriberModule_tenantId", ["subscriberModule", "tenantId"]),
```

---

## 8.2 publishEvent Function

```typescript
// convex/eventBus.ts

export async function publishEvent<T extends Record<string, unknown>>(
  ctx: MutationCtx,
  event: {
    eventType: string;
    publisherModule: string;
    tenantId: string;
    payload: T;
    correlationId?: string;
    causationId?: string;
  }
): Promise<Id<"module_events">> {
  // Verify publishing module is active for this tenant
  const install = await ctx.db
    .query("module_installs")
    .withIndex("by_tenantId_moduleSlug", q =>
      q.eq("tenantId", event.tenantId).eq("moduleSlug", event.publisherModule)
    )
    .unique();

  // Core modules can always publish
  if (!event.publisherModule.startsWith("core_")) {
    if (!install || install.status !== "active") {
      throw new Error(`Module ${event.publisherModule} is not active — cannot publish events`);
    }
  }

  const eventId = await ctx.db.insert("module_events", {
    eventType: event.eventType,
    publisherModule: event.publisherModule,
    tenantId: event.tenantId,
    payload: JSON.stringify(event.payload),
    publishedAt: Date.now(),
    processingStatus: "pending",
    retryCount: 0,
    subscriberResults: [],
    correlationId: event.correlationId,
    causationId: event.causationId,
  });

  // Dispatch immediately (0ms delay)
  await ctx.scheduler.runAfter(0, internal.eventBus.dispatchEvent, { eventId });

  return eventId;
}
```

---

## 8.3 Complete Event Catalog with Payloads

```typescript
// Strongly-typed event payloads for all cross-module events

// STUDENT EVENTS
type StudentEnrolledPayload = {
  studentId: string; classId: string; academicYearId: string;
  termId: string; enrollmentDate: string;
  parentUserId?: string; feeCategoryId?: string;
};

type StudentGraduatedPayload = {
  studentId: string; classId: string; academicYearId: string;
  finalGrade?: number; graduationDate: string;
};

type StudentStatusChangedPayload = {
  studentId: string; fromStatus: string; toStatus: string;
  reason?: string; effectiveDate: string;
};

type StudentTransferredOutPayload = {
  studentId: string; fromClassId: string; transferSchool?: string;
  transferDate: string; transferCertificateUrl?: string;
};

// FINANCE EVENTS
type FinanceInvoiceCreatedPayload = {
  invoiceId: string; studentId: string; totalKes: number;
  dueDate: number; termId?: string; components: { name: string; amountKes: number }[];
};

type FinanceInvoiceOverduePayload = {
  invoiceId: string; studentId: string; totalKes: number;
  outstandingKes: number; daysOverdue: number;
};

type FinancePaymentReceivedPayload = {
  paymentId: string; studentId: string; amountKes: number;
  provider: string; transactionId: string;
  invoiceIds: string[]; allocations: { invoiceId: string; amountKes: number }[];
  remainingOutstandingKes: number;
};

type FinanceInvoicePaidPayload = {
  invoiceId: string; studentId: string; totalKes: number;
  paidAt: number;
};

// ATTENDANCE EVENTS
type AttendanceStudentAbsentPayload = {
  studentId: string; classId: string; date: string;
  session: "morning" | "afternoon" | "full_day";
  teacherId: string;
};

type AttendanceStudentConsecutivePayload = {
  studentId: string; classId: string;
  consecutiveDays: number; dates: string[];
};

type AttendanceStudentChronicPayload = {
  studentId: string; classId: string;
  attendanceRatePct: number; termId: string;
};

// ACADEMICS EVENTS
type AcademicsGradePostedPayload = {
  submissionId: string; assignmentId: string; studentId: string;
  teacherId: string; assignmentTitle: string;
  marksAwarded: number; totalMarks: number;
  percentageScore: number; letterGrade: string;
};

type AcademicsExamResultsPublishedPayload = {
  examId: string; examName: string; classId: string;
  termId: string; studentIds: string[];
  publishedBy: string;
};

type AcademicsReportCardGeneratedPayload = {
  studentId: string; termId: string; academicYearId: string;
  reportCardUrl: string; generatedBy: string;
};

// LIBRARY EVENTS
type LibraryBookOverduePayload = {
  borrowingId: string; studentId: string; bookId: string;
  bookTitle: string; duDate: string; daysOverdue: number;
  fineAmountKes: number;
};

// HR EVENTS
type HrLeaveApprovedPayload = {
  requestId: string; staffId: string; leaveType: string;
  startDate: string; endDate: string; daysApproved: number;
  approvedBy: string;
};

type HrPayrollProcessedPayload = {
  month: string; staffCount: number; totalNetPayKes: number;
  processedBy: string;
};

// MODULE LIFECYCLE EVENTS
type ModuleInstalledPayload = {
  moduleId: string; moduleSlug: string; moduleName: string;
  billingPeriod: string; installedBy: string;
};

type ModuleUninstalledPayload = {
  moduleId: string; moduleSlug: string;
  dataRetentionEndsAt: number; uninstalledBy: string;
};
```

---

## 8.4 All Cross-Module Automations (Must Implement All)

```
EVENT: student.enrolled
  → mod_finance handler: createAdmissionFeeInvoice
      Look up fee structure applicable to student's class + feeCategory
      calculateInvoiceWithScholarship (apply any active scholarships)
      Create finance_invoice
      Publish finance.invoice.created (triggers SMS/email to parent)
  → core_users handler: createParentPortalAccount
      If student has a parent linked: check if parent has portal account
      If no account: create WorkOS user, send invite email
      If already has account: add student to parent's linked children

EVENT: student.graduated
  → mod_alumni handler: createAlumniRecord
      Create alumni entry with: name, graduation year, class, photo
      Send welcome email to alumni portal

EVENT: finance.invoice.overdue
  → mod_library handler: addBorrowingRestriction
      Create library_borrowing_restrictions record for this student
      Student cannot borrow books until restriction lifted

EVENT: finance.payment.received
  → mod_library handler: removeBorrowingRestriction
      Check if student has any remaining outstanding invoices
      If fully paid up: delete library_borrowing_restrictions record
  → mod_ewallet handler: updateWalletBalance
      Only if payment was for wallet topup (check invoice type)
      Update ewallet wallet balance

EVENT: attendance.student.absent
  → mod_communications handler: sendAbsenceNotificationToParent
      Check module_notification_settings: is "student_absent_parent" enabled?
      If enabled and channels include "sms": send SMS to parent phone
      If enabled and channels include "email": send email to parent email
      Respect quiet hours (no SMS between quietHoursEnd and quietHoursStart)

EVENT: attendance.student.absent.consecutive
  → mod_communications handler: sendConsecutiveAbsenceAlert
      Send URGENT SMS to parent (bypasses quiet hours if >5 consecutive)
      Send in-app notification to school_admin and principal
      Mark student for follow-up in admin task queue

EVENT: attendance.student.chronic
  → mod_communications handler: sendChronicAbsenceAlert
      Send email to school admin with attendance report
      Create in-app alert for school admin

EVENT: academics.assignment.submitted
  → mod_communications handler: notifyTeacherOfSubmission
      Send in-app notification to assignment's teacher:
      "[Student Name] submitted [Assignment Title]"

EVENT: academics.grade.posted
  → mod_communications handler: notifyStudentOfGrade
      Send in-app notification to student:
      "Your [Assignment] has been graded: [Grade]"

EVENT: academics.exam.results.published
  → mod_communications handler: notifyParentsOfResults
      For each studentId in payload.studentIds:
      Send in-app notification to linked parents
      If email channel enabled: send email with link to view report card

EVENT: academics.report_card.generated
  → mod_communications handler: notifyParentReportCardReady
      Send SMS/email/in-app to parent:
      "[Student Name]'s report card is ready. View at: [link]"

EVENT: library.book.overdue
  → mod_finance handler: createLibraryFineInvoice
      Create fine invoice: description "[Book Title] overdue fine"
      Amount from library module config (finePerDayKes × daysOverdue)
      Publish finance.invoice.created after creating

EVENT: hr.leave.approved
  → mod_timetable handler: flagAffectedPeriods
      Find all timetable slots where this staff member is assigned
      For dates between startDate and endDate
      Mark slots as "cover_needed"
      Send in-app notification to school admin:
      "[Staff Name] on leave [startDate]–[endDate]. [N] periods need cover teacher."

EVENT: hr.payroll.processed
  → mod_communications handler: sendPayslipNotifications
      For each staff member: send in-app notification
      "Your payslip for [Month] is ready. Net pay: KES [amount]"

EVENT: module.installed
  → All modules handler: registerWithNewModule
      E.g. when Finance installs: Library registers finance.invoice.overdue subscription
      When Communications installs: all other modules can now use SMS/email channels

EVENT: module.uninstalled
  → All dependent modules: update configuration
      E.g. when Finance uninstalls: Library removes borrowing restriction automation
      When Communications uninstalls: other modules fall back to in-app only
```

---

## 8.5 Event Handler Pattern

```typescript
// Example: convex/modules/library/eventHandlers.ts

export const onFinanceInvoiceOverdue = internalMutation({
  args: {
    eventId: v.id("module_events"),
    tenantId: v.string(),
    payload: v.object({
      invoiceId: v.string(),
      studentId: v.string(),
      totalKes: v.number(),
      outstandingKes: v.number(),
      daysOverdue: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    // Verify library module is active for this tenant
    const libInstall = await ctx.db
      .query("module_installs")
      .withIndex("by_tenantId_moduleSlug", q =>
        q.eq("tenantId", args.tenantId).eq("moduleSlug", "mod_library")
      )
      .unique();
    if (!libInstall || libInstall.status !== "active") return;

    // Check if restriction already exists
    const existing = await ctx.db
      .query("library_borrowing_restrictions")
      .withIndex("by_tenantId_studentId", q =>
        q.eq("tenantId", args.tenantId).eq("studentId", args.payload.studentId)
      )
      .filter(q => q.eq(q.field("reason"), "outstanding_fees"))
      .unique();

    if (existing) return; // already restricted

    // Add borrowing restriction
    await ctx.db.insert("library_borrowing_restrictions", {
      tenantId: args.tenantId,
      studentId: args.payload.studentId,
      reason: "outstanding_fees",
      relatedInvoiceId: args.payload.invoiceId,
      outstandingAmountKes: args.payload.outstandingKes,
      restrictedAt: Date.now(),
      relatedEventId: args.eventId,
    });

    // Notify student
    await publishEvent(ctx, {
      eventType: "library.restriction.added",
      publisherModule: "mod_library",
      tenantId: args.tenantId,
      payload: {
        studentId: args.payload.studentId,
        reason: "outstanding_fees",
        message: "Library borrowing is restricted due to outstanding fee balance.",
      },
      causationId: args.eventId,
    });
  }
});
```

---

# SECTION 9 — MODULE GUARD SYSTEM

---

## 9.1 requireModuleAccess

```typescript
// convex/helpers/moduleGuard.ts

export async function requireModuleAccess(
  ctx: QueryCtx | MutationCtx,
  moduleSlug: string,
  tenantId: string
): Promise<{ install: Doc<"module_installs"> }> {
  const install = await ctx.db
    .query("module_installs")
    .withIndex("by_tenantId_moduleSlug", q =>
      q.eq("tenantId", tenantId).eq("moduleSlug", moduleSlug)
    )
    .unique();

  if (!install) {
    throw new ConvexError({
      code: "MODULE_NOT_INSTALLED",
      message: `${moduleSlug} is not installed. Visit the marketplace to install it.`,
      moduleSlug,
      marketplaceUrl: "/admin/marketplace",
    });
  }

  const errorMessages: Record<string, string> = {
    disabled: `${moduleSlug} is currently disabled. Enable it in your module settings.`,
    suspended_payment: `${moduleSlug} is suspended due to a payment issue. Update your payment method to restore access.`,
    suspended_platform: `${moduleSlug} has been suspended by EduMyles. Contact support for details.`,
    uninstalling: `${moduleSlug} is being uninstalled.`,
    uninstalled: `${moduleSlug} has been uninstalled. Data available until ${formatDate(install.dataRetentionEndsAt)}.`,
    data_purged: `${moduleSlug} data has been permanently deleted.`,
    payment_failed: `${moduleSlug} payment failed. Update your payment method to continue.`,
    installing: `${moduleSlug} is still being installed. This may take a moment.`,
  };

  if (errorMessages[install.status]) {
    throw new ConvexError({
      code: "MODULE_NOT_ACTIVE",
      status: install.status,
      message: errorMessages[install.status],
      moduleSlug,
    });
  }

  if (install.status !== "active") {
    throw new ConvexError({ code: "MODULE_NOT_ACTIVE", status: install.status, moduleSlug });
  }

  return { install };
}

export async function requireModuleFeatureAccess(
  ctx: QueryCtx | MutationCtx,
  moduleSlug: string,
  tenantId: string,
  userRole: string,
  featureKey: string
): Promise<void> {
  await requireModuleAccess(ctx, moduleSlug, tenantId);

  const config = await ctx.db
    .query("module_access_config")
    .withIndex("by_tenantId", q => q.eq("tenantId", tenantId))
    .filter(q => q.eq(q.field("moduleSlug"), moduleSlug))
    .unique();

  if (!config) return; // no config = full access (default on fresh install)

  const roleConfig = config.roleAccess.find(r => r.role === userRole);

  if (!roleConfig) {
    throw new ConvexError({
      code: "ROLE_NO_ACCESS",
      message: `Your role (${userRole}) does not have access to ${moduleSlug}.`,
    });
  }

  if (roleConfig.accessLevel === "none") {
    throw new ConvexError({
      code: "ROLE_NO_ACCESS",
      message: `Your role does not have access to ${moduleSlug}.`,
    });
  }

  if (roleConfig.accessLevel === "restricted") {
    if (!roleConfig.allowedFeatures.includes(featureKey)) {
      throw new ConvexError({
        code: "FEATURE_NOT_PERMITTED",
        message: `Your role does not have permission to: ${featureKey}.`,
        featureKey,
      });
    }
  }

  // "full" and "read_only" always pass feature check
  // read_only enforcement is at the UI level (mutation guards check their own logic)
}
```

---

## 9.2 Usage Pattern in Every Module Function

```typescript
// Example: every function in finance module follows this pattern

export const createInvoice = mutation({
  args: { studentId: v.string(), components: v.array(...), dueDate: v.number() },
  handler: async (ctx, args) => {
    // Step 1: Tenant context
    const { tenantId, userId, userRole } = await requireTenantContext(ctx);

    // Step 2: Module installed and active
    await requireModuleAccess(ctx, "mod_finance", tenantId);

    // Step 3: Feature-level permission
    await requireModuleFeatureAccess(ctx, "mod_finance", tenantId, userRole, "create_invoices");

    // Step 4: Business logic
    const invoiceId = await ctx.db.insert("finance_invoices", {
      tenantId,
      // ... all fields
    });

    // Step 5: Event publication
    await publishEvent(ctx, {
      eventType: "finance.invoice.created",
      publisherModule: "mod_finance",
      tenantId,
      payload: { invoiceId, studentId: args.studentId, /* ... */ },
    });

    // Step 6: Audit log
    await logAudit(ctx, {
      action: "finance.invoice.created",
      entity: invoiceId,
      after: JSON.stringify({ studentId: args.studentId, total: calculatedTotal }),
      performedBy: userId,
    });

    return invoiceId;
  }
});
```

---

# SECTION 10 — MODULE CONFIGURATION SCHEMA

---

## 10.1 Schema Type System

```typescript
// convex/modules/moduleConfigSchema.ts

export type ConfigFieldType =
  | "boolean" | "number" | "string" | "text"
  | "select" | "multiselect" | "time" | "date"
  | "color" | "phone" | "email" | "url" | "currency_kes";

export type ConfigField = {
  key: string;
  label: string;
  description?: string;
  type: ConfigFieldType;
  default: unknown;
  required?: boolean;
  min?: number;           // for number type
  max?: number;           // for number type
  maxLength?: number;     // for string/text type
  options?: { value: string; label: string; description?: string }[]; // for select/multiselect
  dependsOn?: {           // show this field only when another field has a specific value
    field: string;
    value: unknown;
  };
  visibleToRoles?: string[];    // if set, only these roles see this setting
  readOnlyForRoles?: string[];  // if set, these roles cannot edit
  validationRegex?: string;
  validationMessage?: string;
  helpUrl?: string;             // link to docs for this setting
  unit?: string;                // display unit (e.g. "days", "KES", "%")
  warning?: string;             // shown below field as a warning
};

export type ConfigSection = {
  key: string;
  label: string;
  description?: string;
  icon?: string;          // lucide-react icon name
  fields: string[];       // field keys in this section
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  visibleToRoles?: string[];
};

export type ModuleConfigSchema = {
  version: string;        // "1.0" — bump when adding new fields
  fields: ConfigField[];
  sections: ConfigSection[];
};
```

---

## 10.2 Finance Module Config Schema (Complete)

```typescript
// convex/modules/finance/configSchema.ts

export const FINANCE_CONFIG_SCHEMA: ModuleConfigSchema = {
  version: "1.2",
  fields: [
    // Late payment policy
    { key: "lateFineEnabled", label: "Enable Late Payment Fine", type: "boolean", default: true,
      description: "Automatically apply a fine to invoices not paid by due date" },
    { key: "lateFineType", label: "Fine Type", type: "select", default: "percentage",
      dependsOn: { field: "lateFineEnabled", value: true },
      options: [
        { value: "percentage", label: "Percentage of invoice amount" },
        { value: "fixed_kes", label: "Fixed amount (KES)" },
      ]},
    { key: "lateFineAmount", label: "Fine Amount", type: "number", default: 5,
      min: 0, max: 100, unit: "%",
      dependsOn: { field: "lateFineEnabled", value: true },
      description: "Percentage (e.g. 5 for 5%) or KES amount" },
    { key: "gracePeriodDays", label: "Grace Period (days after due date)",
      type: "number", default: 7, min: 0, max: 30, unit: "days",
      dependsOn: { field: "lateFineEnabled", value: true } },
    // Payment methods
    { key: "acceptedPaymentMethods", label: "Accepted Payment Methods",
      type: "multiselect", default: ["mpesa", "airtel", "bank_transfer"], required: true,
      options: [
        { value: "mpesa", label: "M-Pesa" },
        { value: "airtel", label: "Airtel Money" },
        { value: "stripe", label: "Card (Stripe)" },
        { value: "bank_transfer", label: "Bank Transfer" },
        { value: "cash", label: "Cash (recorded manually)" },
      ]},
    { key: "paybillNumber", label: "M-Pesa Paybill Number", type: "string", default: "",
      dependsOn: { field: "acceptedPaymentMethods", value: "mpesa" } },
    { key: "paybillAccountFormat", label: "M-Pesa Account Reference Format",
      type: "string", default: "{admNo}",
      description: "Use {admNo} for admission number. Parents see this as the account reference.",
      dependsOn: { field: "acceptedPaymentMethods", value: "mpesa" } },
    { key: "schoolBankName", label: "Bank Name", type: "string", default: "" },
    { key: "schoolAccountNumber", label: "Account Number", type: "string", default: "" },
    { key: "schoolAccountName", label: "Account Name", type: "string", default: "" },
    // Invoicing
    { key: "invoicePrefix", label: "Invoice Number Prefix", type: "string", default: "INV",
      validationRegex: "^[A-Z0-9]{2,6}$",
      validationMessage: "2-6 uppercase letters or numbers only" },
    { key: "invoiceStartNumber", label: "Starting Invoice Number",
      type: "number", default: 1, min: 1, max: 99999 },
    { key: "autoSendInvoice", label: "Auto-send Invoice to Parent on Creation",
      type: "boolean", default: true },
    { key: "vatEnabled", label: "Apply VAT to Invoices",
      type: "boolean", default: false,
      description: "Only enable if your school is VAT-registered with KRA",
      visibleToRoles: ["school_admin"],
      warning: "Enabling VAT adds 16% to all student invoices" },
    { key: "invoiceFooterText", label: "Invoice Footer Text", type: "text", default:
      "Thank you for your payment. For queries contact the accounts office.",
      maxLength: 300 },
    // Reminders
    { key: "reminderDaysBefore", label: "Reminder Days Before Due Date",
      type: "number", default: 3, min: 0, max: 30, unit: "days",
      description: "0 to disable pre-due reminders" },
    { key: "overdueReminderFrequencyDays", label: "Overdue Reminder Frequency",
      type: "number", default: 7, min: 0, max: 30, unit: "days",
      description: "0 to disable overdue reminders" },
  ],
  sections: [
    { key: "late_payments", label: "Late Payment Policy", icon: "Clock",
      fields: ["lateFineEnabled", "lateFineType", "lateFineAmount", "gracePeriodDays"] },
    { key: "payment_methods", label: "Payment Methods", icon: "CreditCard",
      fields: ["acceptedPaymentMethods", "paybillNumber", "paybillAccountFormat",
               "schoolBankName", "schoolAccountNumber", "schoolAccountName"] },
    { key: "invoicing", label: "Invoice Settings", icon: "FileText",
      fields: ["invoicePrefix", "invoiceStartNumber", "autoSendInvoice",
               "vatEnabled", "invoiceFooterText"] },
    { key: "reminders", label: "Payment Reminders", icon: "Bell",
      fields: ["reminderDaysBefore", "overdueReminderFrequencyDays"] },
  ],
};
```

---

## 10.3 Dynamic Config Form Renderer

```typescript
// frontend/src/components/modules/ModuleConfigForm.tsx

export function ModuleConfigForm({
  schema, currentConfig, onSave, userRole
}: ModuleConfigFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>(
    schema.fields.reduce((acc, f) => ({
      ...acc, [f.key]: currentConfig[f.key] ?? f.default,
    }), {})
  );
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isVisible = (field: ConfigField): boolean => {
    if (field.visibleToRoles && !field.visibleToRoles.includes(userRole)) return false;
    if (!field.dependsOn) return true;
    return values[field.dependsOn.field] === field.dependsOn.value;
  };

  const isReadOnly = (field: ConfigField): boolean =>
    field.readOnlyForRoles?.includes(userRole) ?? false;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    schema.fields.forEach(field => {
      if (!isVisible(field)) return;
      const value = values[field.key];
      if (field.required && (value === undefined || value === "" ||
          (Array.isArray(value) && value.length === 0))) {
        newErrors[field.key] = `${field.label} is required`;
      }
      if (field.type === "number" && value !== undefined) {
        if (field.min !== undefined && Number(value) < field.min)
          newErrors[field.key] = `Minimum is ${field.min}`;
        if (field.max !== undefined && Number(value) > field.max)
          newErrors[field.key] = `Maximum is ${field.max}`;
      }
      if (field.validationRegex && value && typeof value === "string") {
        if (!new RegExp(field.validationRegex).test(value))
          newErrors[field.key] = field.validationMessage ?? "Invalid format";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const renderField = (field: ConfigField): React.ReactNode => {
    if (!isVisible(field)) return null;
    const readOnly = isReadOnly(field);
    const value = values[field.key];
    const error = errors[field.key];

    const onChange = (newValue: unknown) => {
      setValues(prev => ({ ...prev, [field.key]: newValue }));
      setIsDirty(true);
      if (errors[field.key]) setErrors(prev => ({ ...prev, [field.key]: "" }));
    };

    return (
      <div key={field.key} className="space-y-1.5">
        {field.type !== "boolean" && (
          <label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
            {field.unit && <span className="text-muted-foreground ml-1">({field.unit})</span>}
          </label>
        )}
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
        {/* Field rendering switch */}
        {field.type === "boolean" && (
          <div className="flex items-center justify-between py-2">
            <div>
              <label className="text-sm font-medium">{field.label}</label>
              {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
            </div>
            <Switch checked={!!value} onCheckedChange={onChange} disabled={readOnly} />
          </div>
        )}
        {field.type === "select" && (
          <Select value={String(value)} onValueChange={onChange} disabled={readOnly}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {field.options?.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {field.type === "multiselect" && (
          <div className="space-y-2">
            {field.options?.map(opt => (
              <div key={opt.value} className="flex items-center gap-2">
                <Checkbox
                  id={`${field.key}-${opt.value}`}
                  checked={(value as string[])?.includes(opt.value)}
                  onCheckedChange={checked => {
                    const current = (value as string[]) ?? [];
                    onChange(checked ? [...current, opt.value] : current.filter(v => v !== opt.value));
                  }}
                  disabled={readOnly}
                />
                <label htmlFor={`${field.key}-${opt.value}`} className="text-sm cursor-pointer">
                  {opt.label}
                  {opt.description && <span className="text-muted-foreground ml-1">— {opt.description}</span>}
                </label>
              </div>
            ))}
          </div>
        )}
        {["number", "string", "email", "url", "phone"].includes(field.type) && (
          <Input
            type={field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}
            value={String(value ?? "")}
            min={field.min}
            max={field.max}
            maxLength={field.maxLength}
            onChange={e => onChange(field.type === "number" ? Number(e.target.value) : e.target.value)}
            disabled={readOnly}
          />
        )}
        {field.type === "text" && (
          <Textarea
            value={String(value ?? "")}
            maxLength={field.maxLength}
            onChange={e => onChange(e.target.value)}
            disabled={readOnly}
            rows={3}
          />
        )}
        {field.type === "time" && (
          <Input type="time" value={String(value ?? "")}
            onChange={e => onChange(e.target.value)} disabled={readOnly} />
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
        {field.warning && (
          <p className="text-xs text-yellow-600 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {field.warning}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {schema.sections
        .filter(section => !section.visibleToRoles || section.visibleToRoles.includes(userRole))
        .map(section => (
          <Card key={section.key}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {section.icon && <DynamicIcon name={section.icon} className="w-4 h-4" />}
                {section.label}
              </CardTitle>
              {section.description && <CardDescription>{section.description}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">
              {section.fields
                .map(key => schema.fields.find(f => f.key === key))
                .filter(Boolean)
                .map(field => renderField(field!))}
            </CardContent>
          </Card>
        ))}

      {isDirty && (
        <div className="sticky bottom-4 flex items-center justify-between
                        bg-background/95 backdrop-blur border rounded-lg p-4 shadow-lg">
          <p className="text-sm text-muted-foreground">You have unsaved changes</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setValues(schema.fields.reduce((acc, f) =>
                ({ ...acc, [f.key]: currentConfig[f.key] ?? f.default }), {}));
              setIsDirty(false);
              setErrors({});
            }}>
              Discard
            </Button>
            <Button onClick={async () => {
              if (!validate()) return;
              setSaving(true);
              await onSave(values);
              setSaving(false);
              setIsDirty(false);
            }} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

# SECTION 11 — NOTIFICATION PREFERENCES

---

## 11.1 Notification Catalog Schema

```typescript
// convex/modules/[moduleSlug]/notifications.ts

export type ModuleNotification = {
  key: string;                           // "payment_received_parent"
  label: string;                         // "Payment Receipt to Parent"
  description: string;
  defaultEnabled: boolean;
  defaultChannels: ("sms" | "email" | "in_app")[];
  configurableChannels: ("sms" | "email" | "in_app")[];
  targetAudience: "student" | "parent" | "teacher" | "school_admin" | "principal" | "staff";
  canDisable: boolean;                   // false = legally/operationally required
  hasFrequency: boolean;                 // true = can set repeat interval
  defaultFrequencyDays?: number;
  costNote?: string;                     // "SMS costs ~KES 0.80/message"
};
```

---

## 11.2 Notification Dispatcher

```typescript
// convex/modules/notifications/dispatcher.ts

export const sendModuleNotification = internalMutation({
  args: {
    moduleSlug: v.string(),
    notificationKey: v.string(),
    tenantId: v.string(),
    targetUserId: v.optional(v.string()),
    targetRole: v.optional(v.string()),
    templateData: v.string(),           // JSON — variables for message templates
  },
  handler: async (ctx, args) => {
    // Get settings for this notification
    const settings = await ctx.db
      .query("module_notification_settings")
      .withIndex("by_tenantId_moduleSlug", q =>
        q.eq("tenantId", args.tenantId).eq("moduleSlug", args.moduleSlug)
      )
      .unique();

    const notifSetting = settings?.notifications.find(n => n.key === args.notificationKey);
    const isEnabled = notifSetting?.enabled ?? true; // default to enabled
    const channels = notifSetting?.channels ?? ["in_app"];

    if (!isEnabled) return;

    // Enforce quiet hours for SMS
    const effectiveChannels = await enforceQuietHours(
      channels,
      notifSetting?.quietHoursStart ?? "22:00",
      notifSetting?.quietHoursEnd ?? "07:00",
      args.tenantId,
      args
    );

    // Get target user(s)
    const targetUsers = args.targetUserId
      ? [args.targetUserId]
      : await getUsersByRole(ctx, args.tenantId, args.targetRole!);

    const data = JSON.parse(args.templateData);

    for (const userId of targetUsers) {
      const userPrefs = await getUserNotificationPrefs(ctx, userId, args.moduleSlug, args.notificationKey);
      const finalChannels = userPrefs?.channels ?? effectiveChannels;

      for (const channel of finalChannels) {
        switch (channel) {
          case "in_app":
            await ctx.scheduler.runAfter(0, internal.notifications.deliverInApp, {
              userId, tenantId: args.tenantId, notificationKey: args.notificationKey, data: args.templateData
            });
            break;
          case "sms":
            await ctx.scheduler.runAfter(0, internal.communications.sms.deliverSms, {
              userId, tenantId: args.tenantId, notificationKey: args.notificationKey, data: args.templateData
            });
            break;
          case "email":
            await ctx.scheduler.runAfter(0, internal.communications.email.deliverEmail, {
              userId, tenantId: args.tenantId, notificationKey: args.notificationKey, data: args.templateData
            });
            break;
        }
      }
    }
  }
});

async function enforceQuietHours(
  channels: string[], quietStart: string, quietEnd: string,
  tenantId: string, args: any
): Promise<string[]> {
  const now = new Date();
  const tenantTimezone = await getTenantTimezone(tenantId); // Africa/Nairobi
  const currentHour = getCurrentHourInTimezone(now, tenantTimezone);
  const quietStartHour = parseInt(quietStart.split(":")[0]);
  const quietEndHour = parseInt(quietEnd.split(":")[0]);

  const inQuietHours = quietStartHour > quietEndHour
    ? (currentHour >= quietStartHour || currentHour < quietEndHour)
    : (currentHour >= quietStartHour && currentHour < quietEndHour);

  if (!inQuietHours || !channels.includes("sms")) return channels;

  // Queue SMS for delivery at quiet hours end
  const nextDeliveryTime = getNextTimeAfterHour(quietEndHour, tenantTimezone);
  await ctx.scheduler.runAt(nextDeliveryTime, internal.notifications.deliverQueuedSms, args);

  // Return channels without SMS (will be sent later)
  return channels.filter(c => c !== "sms");
}
```

---

# SECTION 12 — INTER-MODULE DATA SHARING

---

## 12.1 Public API Registry

```typescript
// convex/modules/modulePublicApis.ts

// Central registry — other modules import from here
export const MODULE_PUBLIC_APIS = {
  mod_finance: {
    getStudentBalance: internal.finance.publicApi.getStudentBalance,
    getStudentInvoiceSummary: internal.finance.publicApi.getStudentInvoiceSummary,
    getFeeStructureForClass: internal.finance.publicApi.getFeeStructureForClass,
    getStudentOutstandingAmount: internal.finance.publicApi.getStudentOutstandingAmount,
  },
  mod_attendance: {
    getStudentAttendanceRate: internal.attendance.publicApi.getStudentAttendanceRate,
    getClassAttendanceSummary: internal.attendance.publicApi.getClassAttendanceSummary,
    getConsecutiveAbsences: internal.attendance.publicApi.getConsecutiveAbsences,
  },
  mod_library: {
    getStudentLibraryStatus: internal.library.publicApi.getStudentLibraryStatus,
    getStudentBorrowingHistory: internal.library.publicApi.getStudentBorrowingHistory,
  },
  mod_academics: {
    getStudentGradeSummary: internal.academics.publicApi.getStudentGradeSummary,
    getStudentTermAverage: internal.academics.publicApi.getStudentTermAverage,
  },
  mod_hr: {
    getStaffPayrollSummary: internal.hr.publicApi.getStaffPayrollSummary,
    getStaffLeaveBalance: internal.hr.publicApi.getStaffLeaveBalance,
  },
  mod_ewallet: {
    getStudentWalletBalance: internal.ewallet.publicApi.getStudentWalletBalance,
  },
};

// Helper for modules to call another module's API
export async function callModuleApi<T>(
  ctx: QueryCtx | MutationCtx,
  targetModule: keyof typeof MODULE_PUBLIC_APIS,
  apiName: string,
  args: Record<string, unknown>
): Promise<T> {
  const moduleApis = MODULE_PUBLIC_APIS[targetModule];
  if (!moduleApis) throw new Error(`Module ${targetModule} has no public API`);
  const apiFn = (moduleApis as any)[apiName];
  if (!apiFn) throw new Error(`API ${apiName} not found on module ${targetModule}`);
  return await ctx.runQuery(apiFn, args);
}
```

---

## 12.2 Finance Public API (Complete)

```typescript
// convex/modules/finance/publicApi.ts

export const getStudentBalance = internalQuery({
  args: { tenantId: v.string(), studentId: v.string() },
  handler: async (ctx, args) => {
    // No requireModuleAccess here — public API is for internal use
    // The calling module is responsible for having been installed
    const ledger = await ctx.db
      .query("finance_student_ledger")
      .withIndex("by_tenantId_studentId", q =>
        q.eq("tenantId", args.tenantId).eq("studentId", args.studentId)
      )
      .unique();
    return {
      balanceKes: ledger?.balanceKes ?? 0,
      hasOverdueInvoices: ledger?.hasOverdueInvoices ?? false,
      lastUpdatedAt: ledger?.lastUpdatedAt,
    };
  }
});

export const getStudentInvoiceSummary = internalQuery({
  args: { tenantId: v.string(), studentId: v.string() },
  handler: async (ctx, args) => {
    const invoices = await ctx.db
      .query("finance_invoices")
      .withIndex("by_tenantId_studentId", q =>
        q.eq("tenantId", args.tenantId).eq("studentId", args.studentId)
      )
      .filter(q => q.neq(q.field("status"), "paid"))
      .filter(q => q.neq(q.field("status"), "voided"))
      .filter(q => q.neq(q.field("status"), "waived"))
      .collect();

    const now = Date.now();
    const overdue = invoices.filter(inv => inv.dueDate < now);

    return {
      totalOutstandingKes: invoices.reduce((sum, inv) =>
        sum + (inv.totalKes - inv.paidAmountKes), 0),
      overdueCount: overdue.length,
      oldestOverdueDays: overdue.length > 0
        ? Math.floor((now - Math.min(...overdue.map(i => i.dueDate))) / (1000 * 60 * 60 * 24))
        : 0,
      invoiceCount: invoices.length,
    };
  }
});

export const getFeeStructureForClass = internalQuery({
  args: { tenantId: v.string(), classId: v.string(), termId: v.string() },
  handler: async (ctx, args) => {
    const structure = await ctx.db
      .query("fee_structures")
      .withIndex("by_tenantId_termId", q =>
        q.eq("tenantId", args.tenantId).eq("termId", args.termId)
      )
      .filter(q =>
        q.and(
          q.eq(q.field("status"), "active"),
          q.or(
            q.eq(q.field("applicableToClassIds"), []),
            // Check if classId is in applicableToClassIds array
          )
        )
      )
      .first();
    return structure ? { id: structure._id, components: structure.components,
                         totalKes: structure.components.reduce((sum, c) => sum + c.amountKes, 0) } : null;
  }
});
```

---

# SECTION 13 — DYNAMIC NAVIGATION SYSTEM

---

## 13.1 Module Nav Registration

Each module defines its navigation contribution in `index.ts`:

```typescript
// convex/modules/finance/index.ts

export const MODULE_METADATA = {
  slug: "mod_finance",
  displayName: "Finance & Fees",
  version: "1.2.0",
};

export const NAV_CONFIG = {
  moduleSlug: "mod_finance",
  adminNav: [
    {
      label: "Finance",
      icon: "CreditCard",
      href: "/admin/finance",
      requiredFeature: null,   // null = any access level can see
      children: [
        { label: "Overview", href: "/admin/finance" },
        { label: "Fee Structures", href: "/admin/finance/fees", requiredFeature: "manage_fee_structures" },
        { label: "Invoices", href: "/admin/finance/invoices", requiredFeature: "view_all_invoices" },
        { label: "Reconciliation", href: "/admin/finance/reconciliation", requiredFeature: "manage_fee_structures" },
        { label: "Scholarships", href: "/admin/finance/scholarships", requiredFeature: "manage_scholarships" },
        { label: "Reports", href: "/admin/finance/reports", requiredFeature: "view_financial_reports" },
      ],
    },
  ],
  teacherNav: [],
  studentNav: [
    { label: "My Fees", icon: "Receipt", href: "/portal/student/fees",
      requiredFeature: "view_own_invoices" },
  ],
  parentNav: [
    { label: "Fees", icon: "CreditCard", href: "/portal/parent/fees",
      requiredFeature: "view_child_invoices" },
  ],
  dashboardWidgets: [
    { widgetId: "finance-collection-summary", size: "medium" as const, defaultOrder: 2 },
    { widgetId: "finance-recent-payments", size: "small" as const, defaultOrder: 5 },
    { widgetId: "finance-overdue-alerts", size: "small" as const, defaultOrder: 6 },
  ],
};

export const DASHBOARD_WIDGETS = {
  "finance-collection-summary": {
    title: "Fee Collection",
    size: "medium",
    component: "FinanceCollectionWidget",
  },
  "finance-recent-payments": {
    title: "Recent Payments",
    size: "small",
    component: "RecentPaymentsWidget",
  },
};
```

---

## 13.2 Dynamic Sidebar Hook

```typescript
// frontend/src/hooks/useInstalledModules.ts

export function useInstalledModules() {
  const installedModules = useQuery(api.marketplace.getInstalledModulesWithNavConfig);
  const { userRole } = useAuth();

  const accessibleNavItems = useMemo(() => {
    if (!installedModules || !userRole) return [];

    return installedModules.flatMap(module => {
      const navKey = `${userRole}Nav` as keyof typeof module.navConfig;
      const navItems = module.navConfig[navKey] ?? [];

      return navItems.filter(item => {
        if (!item.requiredFeature) return true;
        const roleConfig = module.accessConfig?.roleAccess.find(r => r.role === userRole);
        if (!roleConfig) return false;
        if (roleConfig.accessLevel === "full" || roleConfig.accessLevel === "read_only") return true;
        if (roleConfig.accessLevel === "restricted") {
          return roleConfig.allowedFeatures.includes(item.requiredFeature);
        }
        return false; // "none"
      });
    });
  }, [installedModules, userRole]);

  const dashboardWidgets = useMemo(() => {
    if (!installedModules) return [];
    return installedModules.flatMap(module =>
      module.navConfig.dashboardWidgets ?? []
    ).sort((a, b) => a.defaultOrder - b.defaultOrder);
  }, [installedModules]);

  return { installedModules, accessibleNavItems, dashboardWidgets };
}
```

---

# SECTION 14 — SCHOOL ADMIN MARKETPLACE PAGES

---

## 14.1 `/admin/marketplace` — Browse Marketplace

**Layout:** Hero search bar + Featured modules row + Category filter tabs + Module grid

**Module Card Component:**
```typescript
// States the card shows:
// not_installed → Install button with price
// trial_active → Days remaining badge + "Subscribe Now" + "Cancel Trial"
// installed_active → Green border + "Configure" button
// installed_disabled → Gray border + "Enable" button
// plan_too_low → Lock icon + "Upgrade Plan" button
// free → "Install Free" button
// discounted_pilot → Struck-through original + discounted price

function ModuleCard({ module, install, pilotGrant }: ModuleCardProps) {
  const { studentCount } = useSchoolStats();
  const monthlyPrice = module.isFree ? 0 : calculateBand1Price(module.pricing, studentCount);

  return (
    <Card className={cn(
      "relative transition-all cursor-pointer hover:shadow-md",
      install?.status === "active" && "border-primary/50 ring-1 ring-primary/20",
      install?.status === "disabled" && "opacity-70",
    )}>
      {module.isFeatured && (
        <Badge className="absolute top-2 right-2 bg-yellow-100 text-yellow-800">Featured</Badge>
      )}
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <img src={module.iconUrl} alt={module.name} className="w-12 h-12 rounded-xl" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{module.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{module.tagline}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span>{module.averageRating?.toFixed(1) ?? "New"}</span>
          {module.reviewCount > 0 && <span>({module.reviewCount})</span>}
          <span>·</span>
          <span>{module.installCount.toLocaleString()} schools</span>
        </div>
        <div className="mt-3">
          {pilotGrant?.grantType === "free_trial" ? (
            <div className="space-y-1">
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                Free Trial — {getDaysRemaining(pilotGrant.endDate)} days left
              </Badge>
              <p className="text-xs text-muted-foreground">
                Billing starts: {formatDate(install.billingStartsAt)}
              </p>
            </div>
          ) : pilotGrant?.grantType === "discounted" ? (
            <div>
              <span className="text-sm font-semibold">
                KES {pilotGrant.customPriceKes}/student/month
              </span>
              <span className="text-xs text-muted-foreground line-through ml-2">
                KES {monthlyPrice}
              </span>
            </div>
          ) : module.isFree || monthlyPrice === 0 ? (
            <span className="text-sm font-semibold text-green-600">Free</span>
          ) : (
            <div>
              <span className="text-sm font-semibold">KES {monthlyPrice}/student/month</span>
              <p className="text-xs text-muted-foreground">
                From KES {(monthlyPrice * studentCount).toLocaleString()}/month
              </p>
            </div>
          )}
        </div>
        <div className="mt-3">
          <ModuleCardAction install={install} module={module} pilotGrant={pilotGrant} />
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 14.2 `/admin/marketplace/[moduleSlug]` — Module Detail

**Sections:**
1. Header: icon, name, category, version, install count, rating, install button
2. Screenshots carousel (swipeable, lightbox on click)
3. About (full description, features list with ✓ checkmarks)
4. Works With section (modules it integrates with via events)
5. Requires section (dependency modules with install status)
6. Role Access Preview table (what each role can do after install)
7. Pricing breakdown for school's current student count
8. Reviews list (paginated, with school name + verified badge + rating + body + date + publisher reply)
9. Publisher reply thread under each review
10. Changelog (version history with release notes)

---

## 14.3 `/admin/modules` — Installed Modules Management

**Module Item Row:**
```
[Icon] Finance & Fees           v1.2.0  [Active ✅]
       KES 20/student · 320 students · KES 6,400/month
       Next billing: 1 May 2026 · Termly billing
       [Configure]  [Disable]  [Update Available v1.3.0]  [⋮ More]

[Icon] E-Wallet                 v2.0.1  [⚠️ Payment Issue]
       Last payment failed 3 days ago
       Billing suspended: 7 Apr 2026
       [Update Payment Method]  [Uninstall]

[Icon] Library                  v1.1.0  [Disabled ⚪]
       Installed but currently disabled
       [Enable]  [Configure]  [Uninstall]
```

**More menu options:** Configure, Billing History, Data Export, Disable/Enable, Uninstall

---

## 14.4 `/admin/settings/modules/[moduleSlug]` — Module Settings

**4 Tabs: Access Control | Configuration | Notifications | Billing**

**Access Control tab:**
- Per-role cards with visual access level indicator
- Toggle between Full / Read Only / Custom / No Access
- Custom: reveals feature checkboxes with labels and descriptions
- Live preview: "With these settings, teachers can: [list of what they can do]"
- Save button with confirmation if reducing access to existing role

**Configuration tab:**
- `ModuleConfigForm` component rendered dynamically from module's `configSchema.ts`
- Sticky "Save Changes" bar with "Discard" button
- All field types supported

**Notifications tab:**
- `ModuleNotificationSettings` component
- Per-notification: enable/disable + channel checkboxes
- Required notifications show lock badge (cannot disable)
- SMS cost estimate shown below bulk SMS notifications
- Quiet hours global setting per school

**Billing tab:**
- Current pricing: per student, total for current student count
- Billing period: change with savings shown
- Invoice history for this module (last 12 months)
- "Switch to Annual" CTA if on monthly/termly

---

## 14.5 Module Unavailable Pages

```typescript
// frontend/src/components/modules/ModuleUnavailablePage.tsx

export function ModuleUnavailablePage({ moduleSlug, moduleName, userRole }) {
  const canRequest = ["teacher", "principal"].includes(userRole);
  const [showRequestModal, setShowRequestModal] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <Package className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-3">{moduleName} is not enabled</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        This feature requires the <strong>{moduleName}</strong> module.
        {canRequest
          ? " You can request your school admin to install it."
          : " Contact your school admin to enable this feature."}
      </p>
      {canRequest && (
        <>
          <Button onClick={() => setShowRequestModal(true)}>
            <Send className="w-4 h-4 mr-2" />
            Request this Module
          </Button>
          <ModuleRequestModal
            open={showRequestModal}
            moduleSlug={moduleSlug}
            moduleName={moduleName}
            onClose={() => setShowRequestModal(false)}
          />
        </>
      )}
    </div>
  );
}

// frontend/src/components/modules/ModuleAccessDeniedPage.tsx
export function ModuleAccessDeniedPage({ moduleName, userRole }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <Lock className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-3">Access Restricted</h2>
      <p className="text-muted-foreground max-w-md">
        Your school has {moduleName} installed, but <strong>{userRole}</strong> accounts
        don't have access to this section. Contact your school admin if you need access.
      </p>
    </div>
  );
}

// Wrapper hook for all portal pages
export function useModuleAccess(moduleSlug: string, featureKey?: string) {
  const result = useQuery(api.marketplace.getModuleAccessStatus,
    { moduleSlug, featureKey });
  return {
    isLoading: result === undefined,
    isInstalled: result?.isInstalled ?? false,
    hasAccess: result?.hasAccess ?? false,
    accessLevel: result?.accessLevel ?? "none",
    installStatus: result?.installStatus,
    reason: result?.reason,
  };
}

// EVERY module portal page must use this pattern:
function ExampleModulePage() {
  const { isLoading, isInstalled, hasAccess, installStatus } = useModuleAccess("mod_finance");
  if (isLoading) return <PageSkeleton />;
  if (!isInstalled) return <ModuleUnavailablePage moduleSlug="mod_finance" moduleName="Finance & Fees" userRole={userRole} />;
  if (installStatus === "suspended_payment") return <ModuleSuspendedPage reason="payment" />;
  if (installStatus === "suspended_platform") return <ModuleSuspendedPage reason="platform" />;
  if (!hasAccess) return <ModuleAccessDeniedPage moduleName="Finance & Fees" userRole={userRole} />;
  return <FinanceContent />;
}
```

---

# SECTION 15 — PLATFORM MARKETPLACE MANAGEMENT

---

## 15.1 `/platform/marketplace` — Dashboard

**Stats Row (all from Convex real-time queries):**
- Total published modules (count)
- Total active installs (across all tenants)
- Marketplace revenue MTD (KES)
- Pending review count (badge)
- Active flags count
- New module requests (7 days)

**Charts (all recharts, all from Convex):**
- Revenue by module (horizontal BarChart, top 10 modules)
- Install growth over time (AreaChart, last 12 months)
- Revenue by billing period (PieChart: monthly/termly/annual %)
- Module churn rate (BarChart: installs vs uninstalls per module)

---

## 15.2 `/platform/marketplace/modules` — All Modules

**Table columns:** icon, name, slug, status badge, active installs, MRR (KES), avg rating, version, last updated, actions

**Per-module actions:** View Detail, Edit, Feature/Unfeature, Suspend, Deprecate, Archive

**Create Module button** → `/platform/marketplace/modules/create` (5-section form):

Section 1 — Identity: name, slug (auto + editable), tagline, description (rich text), category, icon upload, screenshots (up to 8)

Section 2 — Technical: Convex module namespace, dependencies (multi-select from existing), supported roles, minimum plan, version (semver), documentation URL

Section 3 — Pricing: base rate, auto-calculate bands button (applies 85/70/60/50%), individual band rate inputs, billing period multipliers, plan overrides table (plan → rate), VAT rate

Section 4 — Default Access Matrix: per-role cards setting default access level and features for fresh installs

Section 5 — Review & Publish: summary of all settings, estimated revenue at 100/500/1000 student schools, publish button

---

## 15.3 `/platform/marketplace/pricing` — Price Control Center

**Global Band Configuration Table:**
```
Module          Base Rate  Band1   Band2   Band3   Band4   Band5
─────────────────────────────────────────────────────────────────
Finance & Fees  KES 20     20.00   17.00   14.00   12.00   10.00
Attendance      KES 10     10.00    8.50    7.00    6.00    5.00
Academics       KES 15     15.00   12.75   10.50    9.00    7.50
[Edit] per module
```

**Per-School Price Override Section:**
- Search: school name + module name
- Set override price (flat rate per student, replaces bands)
- Reason field (required)
- Expiry date (optional — blank = permanent)
- List of all active overrides with edit/revoke actions

**Pricing Simulator:**
```
Module:         [Finance & Fees ▾]
Student count:  [500]
Billing period: [Annual ▾]

─── Calculation ──────────────────────
Band 1: 100 × KES 20.00 = KES  2,000
Band 2: 400 × KES 17.00 = KES  6,800
────────────────────────────────────
Monthly subtotal:          KES  8,800
Annual (×12 months):       KES 105,600
Annual discount (18%):    -KES  19,008
Discounted subtotal:       KES  86,592
VAT (16%):                +KES  13,855
───────────────────────────────────────
Total (annual):            KES 100,447
Monthly equivalent:        KES   8,371
```

---

## 15.4 `/platform/marketplace/billing` — Module Billing Overview

**Monthly Billing Dashboard:**
- Select month → shows all billing activity for that month
- Status summary: pending / invoiced / paid / failed / suspended counts
- Per-school billing table: school name, modules billed, total KES, payment status
- Manual trigger: "Re-run billing for this school" per-school action
- Failed payments queue: list with retry, grace period countdown, suspend countdown

**Revenue Analytics:**
- MRR trend chart (12 months, recharts AreaChart)
- Revenue by module (last 30 days, recharts BarChart)
- Cohort analysis: which tenant signup months have highest module adoption
- Churn analysis: modules with highest uninstall rate

---

## 15.5 `/platform/marketplace/pilot-grants` — All Pilot Grants

**Columns:** school name, module, grant type badge, start date, expiry, status, created by, actions

**Create Pilot Grant (from this page or from tenant detail):**
- Select tenant (search)
- Select module
- Grant type: free_trial / free_permanent / discounted / plan_upgrade / beta_access
- If discounted: price per student (KES)
- If plan_upgrade: which plan to grant access as
- Start date, end date (leave blank for permanent)
- Stealth mode toggle (school sees module as normal, no "trial" badge)
- Reason (required for audit)

**Bulk Pilot Grants:**
- Upload CSV: school_slug, module_slug, grant_type, end_date, reason
- Preview and confirm
- Master Admin only

---

## 15.6 `/platform/marketplace/admin` — Module Review Queue

For future publisher submissions. Currently shows only EduMyles internal submissions.

**Review Queue table:** module name, publisher, submitted date, version, status (pending_review / changes_requested / approved / rejected)

**Module Review Detail:**
- Module info (name, description, screenshots, category, dependencies)
- Publisher info
- Pricing suggestion from publisher
- Review form:
  - Functionality verdict: ✓ / ✗
  - Code quality verdict (if code reviewed)
  - Description accuracy: ✓ / ✗
  - Pricing decision: Accept suggested / Override price / Set price range
  - Decision: Approve / Request Changes / Reject
  - Notes to publisher
- Price setting if approving: final price confirmed by Master Admin

---

# SECTION 16 — COMPLETE DATABASE SCHEMA (MARKETPLACE TABLES)

```typescript
// All marketplace-related tables for convex/schema.ts

marketplace_modules: defineTable({
  slug: v.string(),
  name: v.string(),
  tagline: v.string(),
  description: v.string(),
  category: v.string(),
  status: v.union(v.literal("draft"), v.literal("published"),
                  v.literal("deprecated"), v.literal("suspended"), v.literal("banned")),
  isFeatured: v.boolean(),
  isCore: v.boolean(),
  minimumPlan: v.union(v.literal("free"), v.literal("starter"),
                       v.literal("pro"), v.literal("enterprise")),
  dependencies: v.array(v.string()),
  supportedRoles: v.array(v.string()),
  version: v.string(),
  iconUrl: v.optional(v.string()),
  screenshots: v.array(v.string()),
  documentationUrl: v.optional(v.string()),
  changelogUrl: v.optional(v.string()),
  publishedAt: v.optional(v.number()),
  averageRating: v.optional(v.number()),
  reviewCount: v.number(),
  installCount: v.number(),
  activeInstallCount: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_slug", ["slug"])
  .index("by_status", ["status"])
  .index("by_category", ["category"])
  .index("by_isCore", ["isCore"])
  .index("by_isFeatured", ["isFeatured"]),

module_pricing: defineTable({
  moduleId: v.id("marketplace_modules"),
  baseRateKes: v.number(),
  band1Rate: v.number(),
  band2Rate: v.number(),
  band3Rate: v.number(),
  band4Rate: v.number(),
  band5Rate: v.number(),
  monthlyMultiplier: v.number(),
  termlyMultiplier: v.number(),
  quarterlyMultiplier: v.number(),
  annualMultiplier: v.number(),
  planOverrides: v.array(v.object({
    plan: v.string(),
    baseRateKes: v.number(),
  })),
  vatRatePct: v.number(),
  updatedBy: v.string(),
  updatedAt: v.number(),
})
  .index("by_moduleId", ["moduleId"]),

module_price_overrides: defineTable({
  moduleId: v.id("marketplace_modules"),
  tenantId: v.string(),
  overridePriceKes: v.number(),
  reason: v.string(),
  grantedBy: v.string(),
  grantedAt: v.number(),
  expiresAt: v.optional(v.number()),
  isActive: v.boolean(),
  revokedAt: v.optional(v.number()),
  revokedBy: v.optional(v.string()),
})
  .index("by_moduleId_tenantId", ["moduleId", "tenantId"])
  .index("by_tenantId", ["tenantId"])
  .index("by_isActive", ["isActive"]),

module_price_history: defineTable({
  moduleId: v.id("marketplace_modules"),
  tenantId: v.optional(v.string()),
  changeType: v.union(v.literal("global_base"), v.literal("global_band"),
                      v.literal("override_created"), v.literal("override_revoked"),
                      v.literal("plan_override")),
  previousPricing: v.string(),
  newPricing: v.string(),
  changedBy: v.string(),
  changedAt: v.number(),
  reason: v.string(),
})
  .index("by_moduleId", ["moduleId"])
  .index("by_tenantId", ["tenantId"])
  .index("by_changedAt", ["changedAt"]),

module_versions: defineTable({
  moduleId: v.id("marketplace_modules"),
  version: v.string(),
  releaseType: v.union(v.literal("patch"), v.literal("minor"), v.literal("major")),
  changelog: v.string(),
  releasedAt: v.number(),
  isCurrentVersion: v.boolean(),
  releasedBy: v.string(),
})
  .index("by_moduleId", ["moduleId"])
  .index("by_moduleId_version", ["moduleId", "version"]),

module_installs: defineTable({
  moduleId: v.id("marketplace_modules"),
  moduleSlug: v.string(),
  tenantId: v.string(),
  status: v.union(
    v.literal("install_requested"), v.literal("payment_pending"),
    v.literal("payment_failed"), v.literal("installing"),
    v.literal("active"), v.literal("disabled"),
    v.literal("suspended_platform"), v.literal("suspended_payment"),
    v.literal("uninstalling"), v.literal("uninstalled"), v.literal("data_purged"),
  ),
  billingPeriod: v.union(v.literal("monthly"), v.literal("termly"),
                         v.literal("quarterly"), v.literal("annual")),
  currentPriceKes: v.number(),
  hasPriceOverride: v.boolean(),
  priceOverrideId: v.optional(v.id("module_price_overrides")),
  pilotGrantId: v.optional(v.id("pilot_grants")),
  isFree: v.boolean(),
  firstInstalledAt: v.number(),         // never reset — prevents trial gaming
  trialEndsAt: v.optional(v.number()),
  billingStartsAt: v.number(),
  nextBillingDate: v.number(),
  installedAt: v.number(),
  installedBy: v.string(),
  uninstalledAt: v.optional(v.number()),
  uninstalledBy: v.optional(v.string()),
  dataRetentionEndsAt: v.optional(v.number()),
  disabledAt: v.optional(v.number()),
  disabledBy: v.optional(v.string()),
  version: v.string(),
  paymentFailureCount: v.optional(v.number()),
  lastPaymentFailureAt: v.optional(v.number()),
})
  .index("by_tenantId", ["tenantId"])
  .index("by_moduleId", ["moduleId"])
  .index("by_tenantId_moduleSlug", ["tenantId", "moduleSlug"])
  .index("by_status", ["status"])
  .index("by_nextBillingDate", ["nextBillingDate"])
  .index("by_dataRetentionEndsAt", ["dataRetentionEndsAt"]),

module_access_config: defineTable({
  moduleId: v.id("marketplace_modules"),
  moduleSlug: v.string(),
  tenantId: v.string(),
  roleAccess: v.array(v.object({
    role: v.string(),
    accessLevel: v.union(v.literal("full"), v.literal("read_only"),
                         v.literal("restricted"), v.literal("none")),
    allowedFeatures: v.array(v.string()),
  })),
  config: v.string(),                   // JSON from module configSchema
  updatedBy: v.string(),
  updatedAt: v.number(),
})
  .index("by_tenantId_moduleId", ["tenantId", "moduleId"])
  .index("by_tenantId", ["tenantId"]),

module_event_subscriptions: defineTable({
  eventType: v.string(),
  subscriberModule: v.string(),
  tenantId: v.string(),
  handlerFunctionName: v.string(),
  isActive: v.boolean(),
  createdAt: v.number(),
})
  .index("by_eventType_tenantId", ["eventType", "tenantId"])
  .index("by_subscriberModule_tenantId", ["subscriberModule", "tenantId"]),

module_events: defineTable({
  eventType: v.string(),
  publisherModule: v.string(),
  tenantId: v.string(),
  payload: v.string(),
  publishedAt: v.number(),
  processingStatus: v.union(v.literal("pending"), v.literal("processing"),
                            v.literal("completed"), v.literal("failed"),
                            v.literal("dead_letter")),
  retryCount: v.number(),
  lastRetryAt: v.optional(v.number()),
  subscriberResults: v.array(v.object({
    subscriberModule: v.string(),
    status: v.string(),
    processedAt: v.number(),
    error: v.optional(v.string()),
  })),
  correlationId: v.optional(v.string()),
  causationId: v.optional(v.string()),
})
  .index("by_tenantId", ["tenantId"])
  .index("by_eventType", ["eventType"])
  .index("by_processingStatus", ["processingStatus"])
  .index("by_publishedAt", ["publishedAt"]),

module_notification_settings: defineTable({
  moduleSlug: v.string(),
  tenantId: v.string(),
  notifications: v.array(v.object({
    key: v.string(),
    enabled: v.boolean(),
    channels: v.array(v.string()),
    frequencyDays: v.optional(v.number()),
    quietHoursStart: v.optional(v.string()),
    quietHoursEnd: v.optional(v.string()),
  })),
  updatedBy: v.string(),
  updatedAt: v.number(),
})
  .index("by_tenantId_moduleSlug", ["tenantId", "moduleSlug"]),

module_plan_inclusions: defineTable({
  moduleId: v.id("marketplace_modules"),
  moduleSlug: v.string(),
  plan: v.union(v.literal("free"), v.literal("starter"),
                v.literal("pro"), v.literal("enterprise")),
  isIncluded: v.boolean(),
  includedStudentLimit: v.optional(v.number()),
  discountedRateKes: v.optional(v.number()),
  updatedBy: v.string(),
  updatedAt: v.number(),
})
  .index("by_moduleId_plan", ["moduleId", "plan"])
  .index("by_plan", ["plan"]),

pilot_grants: defineTable({
  moduleId: v.id("marketplace_modules"),
  tenantId: v.string(),
  grantType: v.union(v.literal("free_trial"), v.literal("free_permanent"),
                     v.literal("discounted"), v.literal("plan_upgrade"),
                     v.literal("beta_access")),
  discountPct: v.optional(v.number()),
  customPriceKes: v.optional(v.number()),
  startDate: v.number(),
  endDate: v.optional(v.number()),
  grantedBy: v.string(),
  reason: v.string(),
  stealthMode: v.boolean(),
  status: v.union(v.literal("active"), v.literal("expired"),
                  v.literal("revoked"), v.literal("extended")),
  convertedToPaid: v.boolean(),
  notificationsSent: v.array(v.string()),
  revokedAt: v.optional(v.number()),
  revokedBy: v.optional(v.string()),
  revokedReason: v.optional(v.string()),
})
  .index("by_tenantId", ["tenantId"])
  .index("by_moduleId_tenantId", ["moduleId", "tenantId"])
  .index("by_status", ["status"])
  .index("by_endDate", ["endDate"]),

module_reviews: defineTable({
  moduleId: v.id("marketplace_modules"),
  tenantId: v.string(),
  reviewerUserId: v.string(),
  rating: v.number(),
  title: v.string(),
  body: v.string(),
  status: v.union(v.literal("pending"), v.literal("approved"),
                  v.literal("flagged"), v.literal("deleted")),
  publisherReply: v.optional(v.string()),
  publisherReplyAt: v.optional(v.number()),
  moderatorNote: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_moduleId", ["moduleId"])
  .index("by_moduleId_status", ["moduleId", "status"])
  .index("by_tenantId", ["tenantId"]),

module_flags: defineTable({
  moduleId: v.id("marketplace_modules"),
  tenantId: v.string(),
  flaggedBy: v.string(),
  reason: v.union(
    v.literal("misleading_description"), v.literal("not_working"),
    v.literal("inappropriate"), v.literal("security_concern"),
    v.literal("pricing_dispute"), v.literal("other")
  ),
  details: v.optional(v.string()),
  status: v.union(
    v.literal("flagged"), v.literal("under_investigation"),
    v.literal("resolved_no_action"), v.literal("resolved_warning"),
    v.literal("resolved_suspended"), v.literal("resolved_banned")
  ),
  resolution: v.optional(v.string()),
  adminNotes: v.optional(v.string()),
  publisherResponse: v.optional(v.string()),
  investigatedBy: v.optional(v.string()),
  resolvedAt: v.optional(v.number()),
  createdAt: v.number(),
})
  .index("by_moduleId", ["moduleId"])
  .index("by_status", ["status"])
  .index("by_tenantId", ["tenantId"]),

admin_task_queue: defineTable({
  tenantId: v.string(),
  type: v.string(),
  requestedBy: v.string(),
  requestedByRole: v.string(),
  moduleSlug: v.optional(v.string()),
  moduleName: v.optional(v.string()),
  reason: v.string(),
  status: v.union(v.literal("pending"), v.literal("approved"),
                  v.literal("rejected"), v.literal("cancelled")),
  resolvedBy: v.optional(v.string()),
  resolvedAt: v.optional(v.number()),
  resolutionNote: v.optional(v.string()),
  createdAt: v.number(),
})
  .index("by_tenantId", ["tenantId"])
  .index("by_tenantId_status", ["tenantId", "status"]),

module_public_api_registry: defineTable({
  moduleSlug: v.string(),
  apiName: v.string(),
  description: v.string(),
  argsSchema: v.string(),
  returnSchema: v.string(),
  version: v.string(),
  deprecatedAt: v.optional(v.number()),
  deprecationNote: v.optional(v.string()),
})
  .index("by_moduleSlug", ["moduleSlug"]),

user_notification_preferences: defineTable({
  userId: v.string(),
  tenantId: v.string(),
  moduleSlug: v.string(),
  preferences: v.array(v.object({
    key: v.string(),
    enabled: v.boolean(),
    channels: v.array(v.string()),
  })),
  updatedAt: v.number(),
})
  .index("by_userId_tenantId", ["userId", "tenantId"])
  .index("by_userId_moduleSlug", ["userId", "moduleSlug"]),
```

---

# SECTION 17 — CRON JOBS (MARKETPLACE-SPECIFIC)

```typescript
// All in convex/crons.ts

// Monthly billing — 1st of month, 12:01 AM EAT (21:01 UTC prev day)
crons.monthly("run module billing",
  { day: 1, hourUTC: 21, minuteUTC: 1 },
  internal.marketplace.billing.runMonthlyModuleBilling);

// Pilot grant expiry check — daily, midnight EAT (21:00 UTC)
crons.daily("process pilot grant expiry",
  { hourUTC: 21, minuteUTC: 0 },
  internal.marketplace.pilotGrants.processPilotExpiry);

// Module data purge (90 days post-uninstall) — daily 3:00 AM EAT (0:00 UTC)
crons.daily("purge expired module data",
  { hourUTC: 0, minuteUTC: 0 },
  internal.marketplace.installation.purgeExpiredModuleData);

// Payment failure grace period checks — daily 8:00 AM EAT (5:00 UTC)
crons.daily("check payment grace periods",
  { hourUTC: 5, minuteUTC: 0 },
  internal.marketplace.billing.checkPaymentGracePeriods);

// Module update notifications — daily 9:00 AM EAT (6:00 UTC)
crons.daily("send module update notifications",
  { hourUTC: 6, minuteUTC: 0 },
  internal.marketplace.versions.sendUpdateNotifications);

// Library overdue check (triggers events for finance fines) — 8:30 AM EAT (5:30 UTC)
crons.daily("check library overdue",
  { hourUTC: 5, minuteUTC: 30 },
  internal.library.overdue.checkAndPublishOverdueEvents);

// Staff contract expiry alerts — 9:00 AM EAT (6:00 UTC)
crons.daily("check contract expiry",
  { hourUTC: 6, minuteUTC: 0 },
  internal.hr.contracts.checkExpiryAlerts);

// Event bus dead letter retry — every 15 minutes
crons.interval("retry failed events",
  { minutes: 15 },
  internal.eventBus.retryFailedEvents);
```

---

# SECTION 18 — MARKETPLACE VERIFICATION CHECKLIST

All items must pass before marketplace launch.

## Schema & Data
- [ ] All 16 marketplace tables exist in schema.ts with correct indexes
- [ ] All 15 modules seeded in marketplace_modules with status: "published"
- [ ] All 15 module pricing records seeded with band rates
- [ ] module_plan_inclusions seeded for all modules × all plans
- [ ] Core modules (core_sis, core_users, core_notifications) seeded as installs for all existing tenants

## Module System
- [ ] requireModuleAccess throws correct error for each install status
- [ ] requireModuleFeatureAccess blocks at feature level (not just module level)
- [ ] Module public APIs accessible only via internalQuery (not from client)
- [ ] Direct cross-module table access throws runtime error (enforced by convention)
- [ ] Module isolation: mod_library cannot query finance_invoices table

## Event Bus
- [ ] publishEvent creates module_events record with status: "pending"
- [ ] dispatchEvent routes to correct handlers for each event type
- [ ] finance.invoice.overdue → library adds borrowing restriction
- [ ] finance.payment.received → library removes restriction if fully paid
- [ ] attendance.student.absent → communications sends parent SMS
- [ ] attendance.student.absent.consecutive → urgent SMS + admin alert
- [ ] student.enrolled → finance creates admission invoice
- [ ] student.enrolled → parent portal account created/invite sent
- [ ] student.graduated → alumni record created
- [ ] library.book.overdue → finance creates fine invoice
- [ ] hr.leave.approved → timetable notifies admin
- [ ] Dead letter: event fails 3 times → status: dead_letter → Slack alert

## Installation
- [ ] Dependency check shows missing deps with costs
- [ ] "Install E-Wallet + School Store" installs both correctly
- [ ] Pricing confirmation shows correct tiered breakdown
- [ ] Trial period: billing starts next period, not immediately
- [ ] After install: module appears in sidebar within 1 second (real-time)
- [ ] Core modules cannot be uninstalled (blocked server-side)
- [ ] onInstall creates correct default access config
- [ ] onInstall registers all event subscriptions

## Uninstall
- [ ] Cascade shows which dependent modules will also uninstall
- [ ] Type "UNINSTALL" to confirm (exact match required)
- [ ] dataRetentionEndsAt set to 90 days from uninstall
- [ ] onUninstall deregisters all event subscriptions
- [ ] Reinstall within 90 days: restore data prompt shown
- [ ] After 90 days: purge cron deletes all module data for tenant

## Billing
- [ ] Monthly billing cron calculates correct tiered price
- [ ] Plan-included modules not billed (isIncluded: true)
- [ ] Pilot grant (free): not billed during grant period
- [ ] Pilot grant (discounted): billed at discounted rate
- [ ] Price override: billed at override rate (not band rates)
- [ ] Payment failure: module suspended after 7 days, uninstalled after 30
- [ ] Plan downgrade audit shows correct affected modules
- [ ] Suspension happens at period END (not immediately on downgrade)

## School Admin UI
- [ ] Marketplace shows all 15 modules with correct data from Convex
- [ ] Module card states correct for each install status
- [ ] Module detail page loads reviews, pricing breakdown, screenshots
- [ ] Config form renders all field types from schema
- [ ] dependsOn fields show/hide correctly
- [ ] Access control changes take effect immediately (real-time)
- [ ] Notification preferences respect quiet hours
- [ ] Teacher accessing uninstalled module sees ModuleUnavailablePage (not 404)
- [ ] Teacher request creates admin_task_queue record
- [ ] School admin sees task in /admin/tasks

## Platform Admin UI
- [ ] Marketplace dashboard shows real data from Convex (no hardcoded values)
- [ ] Pricing simulator calculates correctly
- [ ] Per-school price override saves and is applied in next billing
- [ ] Pilot grant creation works for all grant types
- [ ] Stealth mode pilot: school sees no trial badge
- [ ] Module publish: appears in school marketplace within 1 second
- [ ] Module suspend: all tenant installs show suspended_platform state

## Performance
- [ ] Marketplace browse loads in <2 seconds with all 15 modules
- [ ] Module install check completes in <500ms
- [ ] Event dispatch processes within 1 second of publishEvent
- [ ] useInstalledModules hook returns within 200ms

## Security
- [ ] School admin cannot install module for another tenant
- [ ] Teacher cannot install modules (RBAC blocked server-side)
- [ ] Publisher cannot access school data (cross-context check)
- [ ] Pricing is always calculated server-side (never trusted from client)
- [ ] Module uninstall requires authenticated school_admin (not any user)
```
