# EduMyles — Audit-Driven Implementation Plan

**Generated:** 2026-04-02  
**Source:** `audit-report.md` (comprehensive end-to-end audit)  
**Total Items:** 38 findings across 6 sprints

This plan maps directly to every audit finding. Each task references the exact file, line number, and concrete code change needed. Execute top-to-bottom within each sprint; tasks within a sprint can often run in parallel.

---

## Sprint 0 — Immediate Security Hotfixes (Day 1, ~4 hours)

These are one-liner or small-file changes that close critical security holes before anything else.

### 0.1 Guard `emergencyAdmin.ts` — CRITICAL

- **File:** `convex/emergencyAdmin.ts`
- **Action:** Delete the file entirely, or add a one-time token check:
  ```ts
  // Add at top of handler:
  const expectedToken = process.env.EMERGENCY_ADMIN_TOKEN;
  if (!expectedToken || args.emergencyToken !== expectedToken) {
    throw new Error("FORBIDDEN: Invalid emergency token");
  }
  ```
- **Also:** Remove `createEmergencyMasterAdmin` from `convex/index.ts` exports if present.
- **Why:** Any unauthenticated caller can create a master admin.

### 0.2 Guard `testAdmin.ts` — CRITICAL

- **File:** `convex/testAdmin.ts`
- **Action:** Delete the file entirely. Hardcoded email `ayany004@gmail.com` is a backdoor.

### 0.3 Guard `users.ts` promotion functions — CRITICAL

- **File:** `convex/users.ts`
- **Functions to guard:** `promoteUserEmailToMasterAdmin`, `syncMasterAdminRole`, `bootstrapMasterAdmin`
- **Action:** Add `requirePlatformSession(ctx, args)` to each, or delete if no longer needed.
- **Also:** `hasMasterAdmin` and `getUserByWorkosIdGlobal` should require at minimum a platform session.

### 0.4 Guard `notifications.ts:createNotification` — CRITICAL

- **File:** `convex/notifications.ts`
- **Action:** Add `requireTenantContext(ctx)` at the top of `createNotification` handler.

### 0.5 Guard `organizations.ts` — CRITICAL

- **File:** `convex/organizations.ts`
- **Action:** Add `requireTenantContext(ctx)` or `requirePlatformSession(ctx, args)` to both functions.

### 0.6 Remove `console.log` from `tenantGuard.ts` — HIGH

- **File:** `convex/helpers/tenantGuard.ts`
- **Action:** Remove or gate all `console.log` statements behind `process.env.NODE_ENV !== "production"`.

### 0.7 Remove `console.log` from `platform/users/mutations.ts` — HIGH

- **File:** `convex/platform/users/mutations.ts` (lines 144-184)
- **Action:** Remove debug `console.log` statements in `updateUserProfile`.

### 0.8 Guard `platform/users/mutations.ts:repairMasterAdminByEmail` — CRITICAL

- **File:** `convex/platform/users/mutations.ts`
- **Action:** Add `requirePlatformSession(ctx, args)` guard.

### 0.9 Remove hardcoded email from `platformGuard.ts` — MEDIUM

- **File:** `convex/helpers/platformGuard.ts`
- **Action:** Remove hardcoded `ayany004@gmail.com`. Use env var `MASTER_ADMIN_EMAIL` only.

### 0.10 Remove hardcoded email from middleware — MEDIUM

- **File:** `frontend/src/middleware.ts` (line 11)
- **Action:** Remove `"ayany004@gmail.com"` from `MASTER_ADMIN_EMAILS` array. Use env var only.

### 0.11 Remove hardcoded deploy keys from scripts — HIGH

- **Files:** `scripts/deploy.ps1`, `scripts/add-admin.ps1`, `scripts/test-admin.ps1`, `scripts/test-role.ps1`, `scripts/simple-check.ps1`
- **Action:** Replace hardcoded Convex deploy keys with `$env:CONVEX_DEPLOY_KEY`. Rotate the exposed key.

---

## Sprint 1 — Type Safety & Billing Stability (Week 1, ~16 hours)

### 1.1 Unify `TenantTier` enum — CRITICAL

The enum is inconsistent across 4 locations:

| Location                         | Current Values                                     |
| -------------------------------- | -------------------------------------------------- |
| `shared/src/types/index.ts:11`   | `"free" \| "starter" \| "growth" \| "enterprise"`  |
| `shared/src/validators/index.ts` | `"starter" \| "standard" \| "pro" \| "enterprise"` |
| `shared/src/lib/billing.ts`      | `"starter" \| "standard" \| "pro" \| "enterprise"` |
| `convex/schema.ts`               | `plan: v.string()` (unvalidated)                   |

**Action:**

1. **`shared/src/types/index.ts:11`** — Change to:
   ```ts
   export type TenantTier = "starter" | "standard" | "pro" | "enterprise";
   ```
2. **`shared/src/constants/index.ts`** — Update `TIER_MODULES` keys to match.
3. **`convex/schema.ts:45`** — Add validation:
   ```ts
   plan: v.union(v.literal("starter"), v.literal("standard"), v.literal("pro"), v.literal("enterprise")),
   ```
4. Verify all frontend components that reference tier names are updated.

### 1.2 Unify `UserRole` enum — CRITICAL

The enum is inconsistent:

| Location                         | Issue                                    |
| -------------------------------- | ---------------------------------------- |
| `shared/src/types/index.ts:31`   | Uses `"bursar"`, `"hr_manager"`          |
| `shared/src/validators/index.ts` | Uses `"finance_officer"`, `"hr_officer"` |
| `convex/helpers/authorize.ts`    | Uses 14 roles (check which names)        |

**Action:**

1. **`shared/src/validators/index.ts`** — Change `createUserSchema` role enum to use `"bursar"` and `"hr_manager"` (matching types and backend).
2. Audit `shared/src/constants/index.ts:USER_ROLES` — ensure role keys match the type union.
3. Verify frontend components that reference role names.

### 1.3 Align `Tenant` type with backend schema — CRITICAL

The shared type uses `slug`, `tier`, `enabledModules` but backend uses `subdomain`, `plan`, and has no `enabledModules`.

**Action:**

1. **`shared/src/types/index.ts:15-26`** — Update `Tenant` interface:
   ```ts
   export interface Tenant {
     _id: TenantId;
     tenantId: string;
     name: string;
     subdomain: string; // was "slug"
     email: string;
     phone: string;
     plan: TenantTier; // was "tier"
     status: TenantStatus;
     county: string;
     country: string;
     suspendedAt?: number;
     suspendReason?: string;
     createdAt: number;
     updatedAt: number;
   }
   ```
2. Update all frontend references from `tenant.slug` → `tenant.subdomain`, `tenant.tier` → `tenant.plan`.

### 1.4 Fix `PLAN_PRICES_CENTS` undefined — CRITICAL

- **File:** `convex/platform/billing/queries.ts:101`
- **Also at line 237** in `getRevenueBreakdown`
- **Action:** Add the constant at the top of the file:
  ```ts
  const PLAN_PRICES_CENTS: Record<string, number> = {
    starter: 2999,
    standard: 7999,
    pro: 19999,
    enterprise: 49999,
  };
  ```
  Or import from `shared/src/lib/billing.ts` if that module exports prices.
- **Also remove** the dead `BillingEngine` import on line 6.

### 1.5 Fix `createEmailTemplate` schema mismatch — HIGH

- **File:** `convex/modules/communications/mutations.ts` — find `createEmailTemplate`
- **Issue:** Inserts `type`, `htmlContent`, `textContent` but schema has `name`, `subject`, `body`, `variables`, `category`
- **Action:** Align the mutation's insert fields with the `emailTemplates` schema definition in `convex/schema.ts`.

### 1.6 Fix HR `getRecentActivities` action string mismatch — HIGH

- **File:** `convex/modules/hr/queries.ts:68-74`
- **Issue:** Filters by `"staff_created"` (underscores) but audit log stores `"staff.created"` (dots)
- **Action:** Change all filter strings to dot notation:
  ```ts
  q.or(
    q.eq(q.field("action"), "staff.created"),
    q.eq(q.field("action"), "staff.updated"),
    q.eq(q.field("action"), "leave.requested"),
    q.eq(q.field("action"), "payroll.processed")
  );
  ```
- **Also update** `getActivityTitle` and `getActivityStatus` helper maps (lines 98-114).

### 1.7 Fix M-Pesa `pendingId: "pending"` bug — HIGH

- **File:** `convex/modules/finance/actions.ts` — `initiateMpesaPayment` function
- **Issue:** Passes `pendingId: "pending"` literal string instead of actual callback document ID
- **Action:** Create the `paymentCallbacks` record FIRST, then pass its ID:
  ```ts
  const callbackId = await ctx.runMutation(api.modules.finance.mutations.savePaymentCallback, {
    tenantId,
    studentId,
    amount,
    phoneNumber,
    invoiceId,
    status: "pending",
  });
  // Then pass callbackId to the STK push action
  ```

---

## Sprint 2 — Frontend Dialog Wiring (Week 2, ~20 hours)

These are all non-functional dialogs/forms that render UI but don't call backend mutations.

### 2.1 Wire CRM Deal Detail mutations — MEDIUM

- **File:** `frontend/src/app/platform/crm/[dealId]/page.tsx`
- **Issue:** `handleAddActivity`, `handleUpdateDeal`, `handleStageChange` modify local state only
- **Action:** Replace `useState` edits with `useMutation(api.platform.crm.mutations.addActivity)`, `updateDeal`, `moveDealStage`.

### 2.2 Fix ticket comment posting — MEDIUM

- **File:** `frontend/src/app/platform/tickets/[id]/page.tsx`
- **Issue:** `handleAddComment` does `console.log(comment)` instead of calling mutation
- **Action:** Wire to `useMutation(api.tickets.addComment)`.

### 2.3 Wire Analytics custom report creation — MEDIUM

- **File:** `frontend/src/app/platform/analytics/page.tsx`
- **Issue:** Create Report dialog closes without calling mutation; hardcoded 3 entries
- **Action:** Wire `onSubmit` to `useMutation(api.platform.analytics.mutations.createCustomReport)` and load real reports from `api.platform.analytics.queries.getCustomReports`.

### 2.4 Wire Automation workflow creation — MEDIUM

- **File:** `frontend/src/app/platform/automation/page.tsx`
- **Issue:** Create Workflow dialog closes without calling mutation; Run/View/Edit non-functional
- **Action:** Wire to `useMutation(api.platform.automation.mutations.createWorkflow)`, `triggerWorkflow`, etc.

### 2.5 Wire Tenant Success dialogs — MEDIUM

- **File:** `frontend/src/app/platform/tenant-success/page.tsx`
- **Issue:** Create Initiative and Create Metric dialogs are non-functional
- **Action:** Wire to `useMutation(api.platform.tenantSuccess.mutations.createSuccessInitiative)` and `createSuccessMetric`.

### 2.6 Wire Staff Performance dialogs — MEDIUM

- **File:** `frontend/src/app/platform/staff-performance/[staffId]/page.tsx`
- **Issue:** `handleSendFeedback` and `handleCreateGoal` close dialog without mutation
- **Action:** Wire to appropriate mutations from `api.platform.staffPerformance.mutations`.

### 2.7 Wire Finance Fee Structure create — MEDIUM

- **File:** `frontend/src/app/admin/finance/fees/page.tsx`
- **Issue:** "Add Fee Structure" button not wired to create form
- **Action:** Create dialog with `useMutation(api.modules.finance.mutations.createFeeStructure)`.

### 2.8 Wire Timetable add slot — MEDIUM

- **File:** `frontend/src/app/admin/timetable/schedule/page.tsx`
- **Issue:** "Add Slot" button present but not wired
- **Action:** Create dialog with `useMutation(api.modules.timetable.mutations.createSlot)`.

### 2.9 Wire Staff edit profile — MEDIUM

- **File:** `frontend/src/app/admin/staff/[staffId]/page.tsx`
- **Issue:** Edit Profile button present but not wired
- **Action:** Wire to `useMutation(api.modules.hr.mutations.updateStaff)`.

### 2.10 Wire Platform Users security actions — MEDIUM

- **File:** `frontend/src/app/platform/users/[userId]/page.tsx`
- **Issue:** `handleResetPassword`, `handleToggle2FA`, `handleRevokeSession` are local-only
- **Action:** Wire to Convex mutations or API routes.

### 2.11 Wire Student Wallet send/topup — MEDIUM

- **Files:** `frontend/src/app/portal/student/wallet/send/page.tsx`, `frontend/src/app/portal/student/wallet/topup/page.tsx`
- **Issue:** Submit handlers set local state, no mutation or payment call
- **Action:** `send` → `useMutation(api.modules.ewallet.mutations.transfer)`; `topup` → invoke M-Pesa STK push or Stripe checkout.

### 2.12 Wire Proposal Detail actions — MEDIUM

- **File:** `frontend/src/app/platform/crm/proposals/[proposalId]/page.tsx`
- **Issue:** `handleSendProposal` uses `setTimeout(2000)` simulation
- **Action:** Wire to `useMutation(api.platform.crm.proposalMutations.sendProposal)`.

---

## Sprint 3 — Audit Logging & Payment Completions (Week 3, ~20 hours)

### 3.1 Add audit logging to Library mutations — MEDIUM

- **File:** `convex/modules/library/mutations.ts`
- **Functions:** `createBook`, `updateBook`, `borrowBook`, `returnBook`
- **Action:** Add `import { logAction } from "../../helpers/auditLog"` and call after each mutation:
  ```ts
  await logAction(ctx, {
    tenantId: tenant.tenantId,
    actorId: tenant.userId,
    actorEmail: tenant.email,
    action: "book.created",
    entityId: bookId,
    entityType: "book",
  });
  ```

### 3.2 Add audit logging to Transport mutations — MEDIUM

- **File:** `convex/modules/transport/mutations.ts`
- **Functions:** All 6 mutations
- **Action:** Same pattern as 3.1.

### 3.3 Add audit logging to eCommerce mutations — MEDIUM

- **File:** `convex/modules/ecommerce/mutations.ts`
- **Functions:** All 6 mutations
- **Action:** Same pattern.

### 3.4 Add audit logging to Communications mutations — MEDIUM

- **File:** `convex/modules/communications/mutations.ts`
- **Functions:** All 22 mutations (at minimum: `createAnnouncement`, `createCampaign`, `launchCampaign`, `sendMessage`, `createConversation`)
- **Action:** Same pattern.

### 3.5 Add audit logging to HR mutations — MEDIUM

- **File:** `convex/modules/hr/mutations.ts`
- **Functions:** `createLeaveRequest`, `approveLeaveRequest`, `createPayrollRun`, `addPayslip`, `approvePayrollRun`
- **Action:** Same pattern.

### 3.6 Add audit logging to eWallet mutations — MEDIUM

- **File:** `convex/modules/ewallet/mutations.ts`
- **Functions:** `topUp`, `spend`, `withdraw` (5/8 missing audit)
- **Action:** Same pattern.

### 3.7 Add audit logging to SIS `createGuardian` — LOW

- **File:** `convex/modules/sis/mutations.ts`
- **Action:** Add `logAction` call in `createGuardian`.

### 3.8 Implement Airtel Money initiation action — HIGH

- **File:** `convex/actions/payments/airtel.ts` (create new)
- **Action:** Follow the pattern of `convex/actions/payments/mpesa.ts`:
  1. Create `AirtelService` integration (shared lib already exists at `shared/src/lib/airtel.ts`)
  2. Add to `convex/modules/finance/actions.ts` exports
  3. Create Next.js API route `frontend/src/app/api/payments/airtel/initiate/route.ts`
  4. Wire to parent portal fee payment page

### 3.9 Wire marketplace payments to real integrations — HIGH

- **File:** `convex/platform/marketplace/payments.ts`
- **Issue:** M-Pesa, card, bank transfer are all mocked
- **Action:** Replace mock implementations with calls to real `actions/payments/mpesa.ts` and `actions/payments/stripe.ts`.

### 3.10 Wire platform communications email/SMS dispatch — HIGH

- **File:** `convex/platform/communications/mutations.ts` — `sendPlatformMessageNow`
- **Issue:** Only `in_app` channel delivers; `email` and `sms` channels are validated but not dispatched
- **Action:** Add calls to `actions/communications/email.ts:sendEmail` and `actions/communications/sms.ts:sendSms` when those channels are specified.

---

## Sprint 4 — Backend Bug Fixes & Schema Cleanup (Week 4, ~12 hours)

### 4.1 Fix hardcoded term dates — MEDIUM

- **File:** `convex/modules/academics/mutations.ts`
- **Functions:** `getTermStartDate`, `getTermEndDate`
- **Issue:** Return hardcoded `"2025-01-01"` and `"2025-04-01"`
- **Action:** Query from `academicTerms` or `settings` table. If no table exists, create one or use tenant settings.

### 4.2 Consolidate duplicate schema tables — MEDIUM

- **File:** `convex/schema.ts`
- **Duplicates:** `submissions`/`assignmentSubmissions`, `bookBorrows`/`bookLoans`, `timetables`/`timetableEntries`
- **Action:** Determine which is canonical, migrate all code to use the canonical table, delete the duplicate.

### 4.3 Fix `generateReceipt` mutation type — LOW

- **File:** `convex/modules/finance/mutations.ts` — `generateReceipt`
- **Issue:** Is a mutation but only reads data and returns it
- **Action:** Convert to a query or keep as mutation if audit logging is desired.

### 4.4 Fix SIS silent error swallowing — LOW

- **File:** `convex/modules/sis/queries.ts`
- **Issue:** All queries wrapped in try/catch returning `[]` on error — silently swallows auth failures
- **Action:** Log the error before returning default, or re-throw auth errors.

### 4.5 Fix eCommerce tight coupling to wallet tables — LOW

- **File:** `convex/modules/ecommerce/mutations.ts` — `createOrderFromCart`
- **Issue:** Directly accesses `wallets` and `walletTransactions` tables
- **Action:** Refactor to call through the ewallet module's `spend` mutation via `ctx.runMutation`.

### 4.6 Remove unnecessary `"use node"` from transport queries — LOW

- **File:** `convex/modules/transport/queries.ts` (line 1)
- **Action:** Remove `"use node"` directive — queries don't use Node APIs.

### 4.7 Standardize error handling (ConvexError vs string) — LOW

- **Files:** `convex/sessions.ts`, various modules
- **Issue:** Some throw plain strings (`"UNAUTHENTICATED"`), others use `ConvexError`
- **Action:** Standardize to use `ConvexError` from `convex/values` for all user-facing errors.

### 4.8 Fix duplicate action strings in auditLog.ts — LOW

- **File:** `convex/helpers/auditLog.ts`
- **Issue:** `api_key.created`, `changelog.created`, `white_label.updated` appear twice in `AuditAction` union
- **Action:** Remove duplicates.

### 4.9 Add missing permissions in authorize.ts — LOW

- **File:** `convex/helpers/authorize.ts`
- **Missing:** `ewallet:approve`, `ecommerce:approve`, `library:delete`, `transport:delete`
- **Action:** Add missing permission strings and assign to appropriate roles.

---

## Sprint 5 — Mobile App Foundation (Weeks 5-6, ~40 hours)

### 5.1 Create `useAuth` hook — CRITICAL

- **File:** `mobile/src/hooks/useAuth.ts` (create)
- **Action:** Implement WorkOS authentication with:
  - `signIn(email)` — magic link flow
  - `signOut()` — clear session
  - `user` — current user state
  - `isAuthenticated` — boolean
  - `sessionToken` — for Convex queries
  - Token persistence via `AsyncStorage`

### 5.2 Implement missing screens — HIGH

Create these 5 files:

- `mobile/src/screens/GradesScreen.tsx`
- `mobile/src/screens/AssignmentsScreen.tsx`
- `mobile/src/screens/AttendanceScreen.tsx`
- `mobile/src/screens/FeesScreen.tsx`
- `mobile/src/screens/ProfileScreen.tsx`

Each screen should:

- Use `ConvexProvider` context for queries
- Display real data from Convex
- Handle loading/empty/error states
- Follow the existing `DashboardScreen` UI pattern

### 5.3 Connect existing screens to Convex — HIGH

- **Files:** `mobile/src/screens/LoginScreen.tsx`, `mobile/src/screens/DashboardScreen.tsx`
- **Action:** Replace hardcoded mock stats with `useQuery` calls to Convex backend.

### 5.4 Add offline support — MEDIUM

- **Files:** New `mobile/src/hooks/useOfflineSync.ts`, `mobile/src/services/cache.ts`
- **Action:** Implement `AsyncStorage` caching, `NetInfo` connectivity detection, offline queue for mutations.

### 5.5 Add push notifications — MEDIUM

- **Files:** `mobile/src/services/pushNotifications.ts`
- **Action:** Integrate Firebase Cloud Messaging; register device token with Convex.

---

## Sprint 6 — Testing & Infrastructure (Weeks 7-8, ~16 hours)

### 6.1 Fix E2E test fixtures — HIGH

- **Files to create:**
  - `e2e/fixtures/auth.fixture.ts`
  - `e2e/global-setup.ts`
  - `e2e/global-teardown.ts`
- **Action:** Create auth fixture with Playwright test fixtures pattern. Create global setup/teardown for test data seeding/cleanup.

### 6.2 Add E2E tests to CI — MEDIUM

- **File:** `.github/workflows/ci.yml`
- **Action:** Add Playwright job after `test` job:
  ```yaml
  e2e:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npx playwright install --with-deps
      - run: npx playwright test
  ```

### 6.3 Create database seed script — MEDIUM

- **File:** `scripts/seed.ts` (create)
- **Action:** Create Convex mutation that seeds dev data: test tenant, admin user, students, staff, classes, fee structures.

### 6.4 Replace placeholder tests — MEDIUM

- **File:** `src/test/convex.test.ts`
- **Issue:** All tests are `expect(true).toBe(true)`
- **Action:** Write real integration tests for auth flow, tenant isolation, payment webhooks.

### 6.5 Add `test:tenant-isolation` script — LOW

- **File:** `package.json`
- **Issue:** CI references `test:tenant-isolation` but script is not defined
- **Action:** Add script entry or create test file.

### 6.6 Enable frontend strict mode — MEDIUM

- **File:** `frontend/tsconfig.json`
- **Action:** Set `strict: true` and `noImplicitAny: true`. Fix resulting type errors.

### 6.7 Export shared lib from barrel — LOW

- **File:** `shared/src/index.ts`
- **Action:** Add `export * from "./lib"` to barrel-export mpesa, airtel, billing, email, sms, grading, wallet, payroll, timetable utilities.

---

## Execution Order & Dependencies

```
Sprint 0 (Day 1): 0.1 → 0.2 → 0.3 → 0.4 → 0.5 → 0.6 → 0.7 → 0.8 → 0.9 → 0.10 → 0.11
                   (all parallel, no dependencies)

Sprint 1 (Week 1): 1.1 → 1.2 → 1.3 (sequential, enum unification)
                    1.4 (parallel, billing fix)
                    1.5 (parallel, email schema)
                    1.6 (parallel, HR action strings)
                    1.7 (parallel, M-Pesa bug)

Sprint 2 (Week 2): All 12 tasks (2.1-2.12) are independent, can run in parallel

Sprint 3 (Week 3): 3.1-3.7 (audit logging, all parallel)
                    3.8 (Airtel Money, independent)
                    3.9 (Marketplace payments, depends on 1.4)
                    3.10 (Platform comms dispatch, independent)

Sprint 4 (Week 4): All 9 tasks (4.1-4.9) are independent, can run in parallel

Sprint 5 (Weeks 5-6): 5.1 → 5.2 → 5.3 (sequential, auth → screens → connect)
                       5.4 (parallel after 5.3)
                       5.5 (parallel after 5.1)

Sprint 6 (Weeks 7-8): 6.1 → 6.2 (sequential, fixtures → CI)
                       6.3, 6.4, 6.5, 6.6, 6.7 (all parallel)
```

---

## Verification Checklist

After completing all sprints, verify:

- [ ] All 9 unguarded mutations now have auth guards
- [ ] `TenantTier`, `UserRole`, `Tenant` types match across shared/validators/backend
- [ ] `getBillingOverview` returns data without crashing
- [ ] `getRecentActivities` returns real HR audit logs
- [ ] M-Pesa payment callback reconciliation works end-to-end
- [ ] Airtel Money payment can be initiated from parent portal
- [ ] All frontend dialogs that show Create/Add buttons actually call mutations
- [ ] Library, Transport, eCommerce, Communications, HR mutations create audit logs
- [ ] Mobile app compiles and shows real Convex data
- [ ] E2E tests pass in CI
- [ ] `npm run type-check` passes with `strict: true`
- [ ] No hardcoded secrets in scripts
- [ ] No `console.log` of session data in production code paths

---

## File Change Summary

| Sprint    | Files Modified | Files Created | Files Deleted |
| --------- | -------------- | ------------- | ------------- |
| 0         | 7              | 0             | 2             |
| 1         | 8              | 0             | 0             |
| 2         | 12             | 0             | 0             |
| 3         | 8              | 1             | 0             |
| 4         | 6              | 0             | 0             |
| 5         | 3              | 8             | 0             |
| 6         | 4              | 4             | 0             |
| **Total** | **48**         | **13**        | **2**         |
