# EduMyles — All Modules Technical Specification
## Complete CRUD, RBAC, Schema, Events & Frontend Reference
**Version 1.0 | April 2026 | Covers 16 Marketplace Modules**

---

# HOW TO READ THIS DOCUMENT

Every module follows this structure:
1. **Overview** — purpose, dependencies, base rate
2. **Schema** — all Convex tables with every field and index
3. **RBAC** — feature keys + default role access matrix
4. **Convex Functions** — all queries, mutations, actions
5. **Event Bus** — what events it fires + what it subscribes to
6. **publicApi.ts** — what other modules can read
7. **onInstall / onUninstall** — setup and teardown logic
8. **configSchema** — all configurable settings
9. **Frontend Pages** — every route with data requirements
10. **Kenya Compliance** — Kenya-specific rules that affect implementation

All functions follow the mandatory pattern:
```typescript
const { tenantId, userId, userRole } = await requireTenantContext(ctx);
await requireModuleAccess(ctx, "mod_[slug]", tenantId);
await requireModuleFeatureAccess(ctx, "mod_[slug]", tenantId, userRole, "feature_key");
// ... business logic
await logAudit(ctx, { action, entity, performedBy: userId });
```

---

# ═══════════════════════════════════════════════════════════
# MODULE 1 — mod_finance (Finance & Fees)
# Base Rate: KES 20/student/month
# Dependencies: core_sis, core_notifications
# ═══════════════════════════════════════════════════════════

## Overview
The most critical module in every school. Handles fee structures, invoice generation, M-Pesa/Airtel/Stripe collection, reconciliation, scholarships, and financial reporting. Kenya VAT 16% aware. Integrates directly with Library (borrowing restriction), E-Wallet (balance updates), and Communications (payment receipts).

---

## Schema

```typescript
fee_structures: defineTable({
  tenantId: v.string(),
  name: v.string(),                    // "Term 1 2025 - Day Scholar"
  termId: v.id("academic_terms"),
  academicYearId: v.id("academic_years"),
  feeCategory: v.optional(v.string()), // "day_scholar" | "boarder" | "international"
  applicableToClassIds: v.array(v.string()), // empty = all classes
  components: v.array(v.object({
    id: v.string(),                    // uuid
    name: v.string(),                  // "Tuition Fee"
    amountKes: v.number(),
    mandatory: v.boolean(),
    description: v.optional(v.string()),
  })),
  totalAmountKes: v.number(),          // sum of mandatory components
  dueDate: v.number(),                 // epoch ms
  lateFineEnabled: v.boolean(),
  lateFineType: v.union(v.literal("percentage"), v.literal("fixed_kes")),
  lateFineAmount: v.number(),          // pct (e.g. 5) or KES amount
  gracePeriodDays: v.number(),
  vatEnabled: v.boolean(),
  vatRatePct: v.number(),              // 16 for Kenya
  status: v.union(v.literal("draft"), v.literal("active"), v.literal("archived")),
  isDeleted: v.boolean(),
  createdBy: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_tenantId", ["tenantId"])
  .index("by_tenantId_termId", ["tenantId", "termId"])
  .index("by_status", ["status"]),

finance_invoices: defineTable({
  tenantId: v.string(),
  studentId: v.string(),
  feeStructureId: v.optional(v.id("fee_structures")),
  type: v.union(
    v.literal("term_fees"),
    v.literal("admission_fee"),
    v.literal("library_fine"),
    v.literal("transport_fee"),
    v.literal("module_subscription"),
    v.literal("other"),
  ),
  description: v.string(),
  components: v.array(v.object({
    name: v.string(),
    amountKes: v.number(),
    mandatory: v.boolean(),
  })),
  subtotalKes: v.number(),
  discountKes: v.number(),             // from scholarships
  scholarshipId: v.optional(v.string()),
  lateFineKes: v.number(),
  vatKes: v.number(),
  totalKes: v.number(),
  paidAmountKes: v.number(),
  balanceKes: v.number(),              // totalKes - paidAmountKes
  dueDate: v.number(),
  status: v.union(
    v.literal("draft"),
    v.literal("pending"),
    v.literal("partial"),
    v.literal("paid"),
    v.literal("overdue"),
    v.literal("waived"),
    v.literal("voided"),
    v.literal("refunded"),
  ),
  academicYearId: v.optional(v.string()),
  termId: v.optional(v.string()),
  invoiceNumber: v.string(),           // INV-001, INV-002 (sequential per tenant)
  receiptSentAt: v.optional(v.number()),
  cancelledAt: v.optional(v.number()),
  cancelledBy: v.optional(v.string()),
  cancellationReason: v.optional(v.string()),
  isDeleted: v.boolean(),
  createdBy: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_tenantId", ["tenantId"])
  .index("by_studentId", ["studentId"])
  .index("by_tenantId_studentId", ["tenantId", "studentId"])
  .index("by_status", ["status"])
  .index("by_dueDate", ["dueDate"])
  .index("by_invoiceNumber", ["invoiceNumber"]),

finance_payments: defineTable({
  tenantId: v.string(),
  invoiceId: v.id("finance_invoices"),
  studentId: v.string(),
  amountKes: v.number(),
  paymentMethod: v.union(
    v.literal("mpesa"),
    v.literal("airtel"),
    v.literal("stripe"),
    v.literal("bank_transfer"),
    v.literal("cash"),
    v.literal("wallet"),
  ),
  // M-Pesa specific
  mpesaTransactionId: v.optional(v.string()),  // MpesaReceiptNumber
  mpesaCheckoutRequestId: v.optional(v.string()),
  mpesaPhoneNumber: v.optional(v.string()),
  // Stripe specific
  stripePaymentIntentId: v.optional(v.string()),
  stripeCheckoutSessionId: v.optional(v.string()),
  // Airtel specific
  airtelTransactionId: v.optional(v.string()),
  // Manual payments
  referenceNumber: v.optional(v.string()),
  bankSlipUrl: v.optional(v.string()),
  recordedBy: v.optional(v.string()),    // for cash/bank transfer
  status: v.union(
    v.literal("pending"),
    v.literal("confirmed"),
    v.literal("failed"),
    v.literal("reversed"),
  ),
  paidAt: v.optional(v.number()),
  reversedAt: v.optional(v.number()),
  reversalReason: v.optional(v.string()),
  receiptNumber: v.string(),
  isDeleted: v.boolean(),
  createdAt: v.number(),
})
  .index("by_tenantId", ["tenantId"])
  .index("by_invoiceId", ["invoiceId"])
  .index("by_studentId", ["studentId"])
  .index("by_mpesaTransactionId", ["mpesaTransactionId"])
  .index("by_status", ["status"])
  .index("by_paidAt", ["paidAt"]),

finance_scholarships: defineTable({
  tenantId: v.string(),
  name: v.string(),                    // "Bursary Fund", "Sports Scholarship"
  type: v.union(v.literal("percentage"), v.literal("fixed_kes")),
  value: v.number(),
  applicableFeeComponents: v.array(v.string()), // component names it applies to; empty = all
  maxStudents: v.optional(v.number()),
  currentRecipients: v.number(),
  academicYearId: v.optional(v.string()),
  isActive: v.boolean(),
  isDeleted: v.boolean(),
  createdBy: v.string(),
  createdAt: v.number(),
})
  .index("by_tenantId", ["tenantId"]),

finance_scholarship_recipients: defineTable({
  tenantId: v.string(),
  scholarshipId: v.id("finance_scholarships"),
  studentId: v.string(),
  assignedBy: v.string(),
  assignedAt: v.number(),
  revokedAt: v.optional(v.number()),
  revokedBy: v.optional(v.string()),
  revokedReason: v.optional(v.string()),
  isActive: v.boolean(),
})
  .index("by_tenantId_studentId", ["tenantId", "studentId"])
  .index("by_scholarshipId", ["scholarshipId"]),

finance_student_ledger: defineTable({
  tenantId: v.string(),
  studentId: v.string(),
  totalInvoicedKes: v.number(),
  totalPaidKes: v.number(),
  totalDiscountKes: v.number(),
  outstandingKes: v.number(),
  hasOverdueInvoices: v.boolean(),
  lastPaymentAt: v.optional(v.number()),
  lastUpdatedAt: v.number(),
})
  .index("by_tenantId_studentId", ["tenantId", "studentId"])
  .index("by_hasOverdueInvoices", ["hasOverdueInvoices"]),

finance_fee_categories: defineTable({
  tenantId: v.string(),
  name: v.string(),                    // "Day Scholar", "Boarder", "International"
  description: v.optional(v.string()),
  isDefault: v.boolean(),
  isDeleted: v.boolean(),
  createdAt: v.number(),
})
  .index("by_tenantId", ["tenantId"]),

mpesa_stk_requests: defineTable({
  tenantId: v.string(),
  invoiceId: v.id("finance_invoices"),
  studentId: v.string(),
  phoneNumber: v.string(),
  amountKes: v.number(),
  checkoutRequestId: v.string(),
  merchantRequestId: v.string(),
  accountReference: v.string(),        // admission number
  status: v.union(
    v.literal("pending"),
    v.literal("completed"),
    v.literal("failed"),
    v.literal("cancelled"),
    v.literal("timeout"),
  ),
  resultCode: v.optional(v.number()),
  resultDesc: v.optional(v.string()),
  mpesaReceiptNumber: v.optional(v.string()),
  transactionDate: v.optional(v.string()),
  initiatedAt: v.number(),
  completedAt: v.optional(v.number()),
})
  .index("by_checkoutRequestId", ["checkoutRequestId"])
  .index("by_invoiceId", ["invoiceId"])
  .index("by_tenantId", ["tenantId"])
  .index("by_status", ["status"]),
```

---

## RBAC — Features & Default Access

```typescript
export const FINANCE_FEATURES = {
  manage_fee_structures: {
    key: "manage_fee_structures",
    label: "Manage Fee Structures",
    description: "Create, edit, and activate term fee structures",
    defaultRoles: ["school_admin"],
  },
  view_all_invoices: {
    key: "view_all_invoices",
    label: "View All Invoices",
    description: "See all student invoices across the school",
    defaultRoles: ["school_admin"],
  },
  create_invoices: {
    key: "create_invoices",
    label: "Create Invoices",
    description: "Generate fee invoices for students",
    defaultRoles: ["school_admin"],
  },
  record_manual_payment: {
    key: "record_manual_payment",
    label: "Record Manual Payments",
    description: "Record cash or bank transfer payments",
    defaultRoles: ["school_admin"],
  },
  waive_invoice: {
    key: "waive_invoice",
    label: "Waive or Void Invoices",
    description: "Waive outstanding fees or void erroneous invoices",
    defaultRoles: ["school_admin"],
    riskyPermission: true,
  },
  manage_scholarships: {
    key: "manage_scholarships",
    label: "Manage Scholarships",
    description: "Create scholarships and assign to students",
    defaultRoles: ["school_admin"],
  },
  view_financial_reports: {
    key: "view_financial_reports",
    label: "View Financial Reports",
    description: "Access fee collection and arrears reports",
    defaultRoles: ["school_admin"],
  },
  view_own_invoices: {
    key: "view_own_invoices",
    label: "View Own Invoices",
    description: "Student can see their own fee invoices",
    defaultRoles: ["student"],
  },
  view_child_invoices: {
    key: "view_child_invoices",
    label: "View Child Invoices",
    description: "Parent can see their child's invoices",
    defaultRoles: ["parent"],
  },
  pay_child_fees: {
    key: "pay_child_fees",
    label: "Pay Child Fees via M-Pesa",
    description: "Parent can initiate M-Pesa payment for child",
    defaultRoles: ["parent"],
  },
  download_receipts: {
    key: "download_receipts",
    label: "Download Payment Receipts",
    description: "Download PDF receipt for any payment",
    defaultRoles: ["student", "parent"],
  },
};

export const FINANCE_DEFAULT_ROLE_ACCESS = [
  { role: "school_admin", accessLevel: "full", allowedFeatures: [] },
  { role: "principal",    accessLevel: "restricted",
    allowedFeatures: ["view_all_invoices", "view_financial_reports"] },
  { role: "teacher",      accessLevel: "none", allowedFeatures: [] },
  { role: "student",      accessLevel: "restricted",
    allowedFeatures: ["view_own_invoices", "download_receipts"] },
  { role: "parent",       accessLevel: "restricted",
    allowedFeatures: ["view_child_invoices", "pay_child_fees", "download_receipts"] },
];
```

---

## Convex Functions

### Queries

```typescript
// Get fee structures for a tenant (school admin)
getFeeStructures(tenantId, termId?, status?) → FeeStructure[]

// Get single fee structure with components
getFeeStructure(feeStructureId) → FeeStructure

// Get all invoices with filters (school admin)
getInvoices(filters: {
  studentId?, classId?, status?, termId?, dateFrom?, dateTo?,
  minBalance?, hasOverdue?,
}) → Invoice[] with student name, class

// Get invoice detail with payment history
getInvoice(invoiceId) → {invoice, payments[], student, feeStructure}

// Student's own invoices (student role)
getMyInvoices() → Invoice[]

// Child invoices for parent
getChildInvoices(studentId) → Invoice[]
  // Guard: parent must be linked to studentId via parent_student_links

// Fee collection summary (school admin)
getFeeCollectionSummary(termId) → {
  totalInvoiced, totalCollected, totalOutstanding,
  collectionRatePct, overdueCount, overdueAmountKes,
  byPaymentMethod: {mpesa, airtel, cash, bank, stripe},
}

// Student ledger (balance)
getStudentLedger(studentId) → StudentLedger

// Daily collection report
getDailyCollectionReport(date) → {
  payments[], totalKes, byMethod{}, invoicesSettled
}

// Outstanding arrears report
getArrearsReport(termId?, classId?, minDaysOverdue?) → {
  students: [{studentId, name, class, outstandingKes, oldestInvoiceDays}]
  totalOutstandingKes
}

// Scholarships list
getScholarships(includeInactive?) → Scholarship[]

// M-Pesa STK request status (for polling)
getMpesaStkStatus(checkoutRequestId) → {status, receiptNumber?}
```

### Mutations

```typescript
// CREATE FEE STRUCTURE
createFeeStructure(args: {
  name, termId, academicYearId, feeCategory?,
  applicableToClassIds[], components[],
  dueDate, lateFineEnabled, lateFineType, lateFineAmount,
  gracePeriodDays, vatEnabled, vatRatePct
}) → feeStructureId
  requireFeature: "manage_fee_structures"
  // Status: "draft" until explicitly activated
  logAudit

// ACTIVATE FEE STRUCTURE (generates invoices for all applicable students)
activateFeeStructure(feeStructureId) → {invoicesCreated: number}
  requireFeature: "manage_fee_structures"
  For each student in applicable classes:
    Check if invoice already exists for this student + term
    Create finance_invoice
    Publish finance.invoice.created event
    Update finance_student_ledger
  logAudit

// UPDATE FEE STRUCTURE (draft only — cannot update active)
updateFeeStructure(feeStructureId, updates) → void
  requireFeature: "manage_fee_structures"
  Guard: status must be "draft"

// ARCHIVE FEE STRUCTURE
archiveFeeStructure(feeStructureId) → void
  requireFeature: "manage_fee_structures"

// CREATE MANUAL INVOICE (one-off — not from fee structure)
createManualInvoice(args: {
  studentId, type, description,
  components[], dueDate,
}) → invoiceId
  requireFeature: "create_invoices"
  Auto-generates sequential invoiceNumber (INV-{tenantId-prefix}-{sequence})
  logAudit

// INITIATE MPESA PAYMENT (parent role — from parent portal)
initiateMpesaPayment(args: {
  invoiceId, phoneNumber, amountKes
}) → {checkoutRequestId, message}
  requireFeature: "pay_child_fees" (parent) OR school_admin
  Calls internalAction: mpesa.initiateSTKPush
  Creates mpesa_stk_requests record
  // M-Pesa callback handled by HTTP webhook → confirmMpesaPayment

// RECORD MANUAL PAYMENT (cash or bank transfer)
recordManualPayment(args: {
  invoiceId, amountKes, paymentMethod,
  referenceNumber?, bankSlipUrl?, paidAt?
}) → paymentId
  requireFeature: "record_manual_payment"
  Create finance_payments record
  Update invoice paidAmountKes and status
  Update finance_student_ledger
  Publish finance.payment.received event
  Send receipt notification
  logAudit

// CONFIRM MPESA PAYMENT (internalMutation — called by M-Pesa webhook)
confirmMpesaPayment(args: {
  checkoutRequestId, resultCode, resultDesc,
  mpesaReceiptNumber, transactionDate, phoneNumber, amountKes
}) → void
  Find mpesa_stk_requests by checkoutRequestId
  If resultCode === 0 (success):
    Create finance_payments record (status: confirmed)
    Update invoice
    Update finance_student_ledger
    Publish finance.payment.received event
    Send SMS receipt to parent phone
  Else:
    Update stk_request status: failed
    Notify parent of failure

// WAIVE INVOICE
waiveInvoice(invoiceId, reason) → void
  requireFeature: "waive_invoice"
  Set status: "waived", balanceKes: 0
  logAudit with reason

// VOID INVOICE
voidInvoice(invoiceId, reason) → void
  requireFeature: "waive_invoice"
  Guard: invoice must be "pending" or "draft"
  Set status: "voided"
  Update ledger
  logAudit

// CANCEL INVOICE (soft delete variant)
cancelInvoice(invoiceId, reason) → void
  requireFeature: "manage_fee_structures"
  Set cancelledAt, cancelledBy, cancellationReason
  Status → "voided"
  Auto-sends SMS/WhatsApp to parent if communications module installed
  logAudit

// APPLY SCHOLARSHIP TO STUDENT
assignScholarship(scholarshipId, studentId) → void
  requireFeature: "manage_scholarships"
  Check maxStudents not exceeded
  Create finance_scholarship_recipients
  Recalculate outstanding invoices (apply discount)
  logAudit

// REVOKE SCHOLARSHIP
revokeScholarship(scholarshipId, studentId, reason) → void
  requireFeature: "manage_scholarships"
  Mark isActive: false
  Do NOT recalculate past invoices (only future)
  logAudit

// APPLY LATE FINES (internalMutation — daily cron)
applyLateFines() → {finesApplied: number}
  Find all tenants with mod_finance active
  For each: find overdue invoices past gracePeriodDays
  Apply fine (percentage or fixed) if not already applied
  Update invoice
  Publish finance.invoice.overdue event

// GENERATE DEMAND NOTICE
generateDemandNotice(studentIds[]) → {pdfUrls[]}
  requireFeature: "view_all_invoices"
  Skip students with zero balance
  Generate PDF per student (via UploadThing)
  Send to parent if communications module installed

// CREATE FEE CATEGORY
createFeeCategory(name, description?) → feeCategoryId
  requireFeature: "manage_fee_structures"

// UPDATE ADVANCE FEE (future term collection)
createAdvanceFeeCollection(args: {
  studentId, amountKes, forTermId, notes
}) → invoiceId
  requireFeature: "create_invoices"
  Creates invoice with type: "term_fees", status: "pending"
  dueDate = future term start date
```

---

## Event Bus

### Events Published
```
finance.invoice.created     → payload: {invoiceId, studentId, totalKes, dueDate, components[]}
finance.invoice.overdue     → payload: {invoiceId, studentId, totalKes, outstandingKes, daysOverdue}
finance.invoice.paid        → payload: {invoiceId, studentId, totalKes, paidAt}
finance.payment.received    → payload: {paymentId, studentId, amountKes, provider, transactionId, invoiceIds[], remainingOutstandingKes}
finance.fee.structure.activated → payload: {feeStructureId, termId, invoicesCreated}
```

### Events Subscribed
```
student.enrolled            → createAdmissionFeeInvoice
  Look up fee structure for student's class + feeCategory
  Apply any active scholarships
  Create admission fee invoice
  Publish finance.invoice.created

library.book.overdue        → createLibraryFineInvoice
  Create invoice type: "library_fine"
  Amount: finePerDayKes × daysOverdue from library module config
  Publish finance.invoice.created
```

---

## publicApi.ts

```typescript
getStudentBalance(tenantId, studentId)
  → {balanceKes, hasOverdueInvoices, lastUpdatedAt}

getStudentInvoiceSummary(tenantId, studentId)
  → {totalOutstandingKes, overdueCount, oldestOverdueDays, invoiceCount}

getFeeStructureForClass(tenantId, classId, termId)
  → {id, components[], totalKes} | null

getStudentOutstandingAmount(tenantId, studentId)
  → number (KES)

hasOutstandingFees(tenantId, studentId)
  → boolean
```

---

## onInstall

```typescript
// Seed default fee categories
await ctx.db.insert("finance_fee_categories", {tenantId, name: "Day Scholar", isDefault: true, ...})
await ctx.db.insert("finance_fee_categories", {tenantId, name: "Boarder", isDefault: false, ...})

// Set default module config
await ctx.db.insert("module_access_config", {...FINANCE_DEFAULT_ROLE_ACCESS})

// Register event subscriptions
register("student.enrolled", "mod_finance:onStudentEnrolled")
register("library.book.overdue", "mod_finance:onLibraryBookOverdue")

// Create finance_student_ledger for all existing students
const students = await ctx.db.query("students").withIndex("by_tenantId")...
for (const s of students) {
  await ctx.db.insert("finance_student_ledger", {tenantId, studentId: s._id, ...zeros})
}
```

---

## configSchema

```typescript
// Key settings (full schema in edumyles-marketplace-spec.md Section 10.2)
Fields:
  lateFineEnabled: boolean (default: true)
  lateFineType: "percentage" | "fixed_kes" (default: "percentage")
  lateFineAmount: number (default: 5)
  gracePeriodDays: number (default: 7)
  acceptedPaymentMethods: multiselect (default: ["mpesa", "airtel", "bank_transfer"])
  paybillNumber: string
  paybillAccountFormat: string (default: "{admNo}")
  invoicePrefix: string (default: "INV")
  autoSendInvoice: boolean (default: true)
  vatEnabled: boolean (default: false, warning: "only enable if KRA-registered")
  reminderDaysBefore: number (default: 3)
  overdueReminderFrequencyDays: number (default: 7)
```

---

## Frontend Pages

```
/admin/finance                             — Dashboard: collection rate, alerts
/admin/finance/fee-structures              — List all fee structures
/admin/finance/fee-structures/create       — Create fee structure form
/admin/finance/fee-structures/[id]         — Detail + activate button
/admin/finance/invoices                    — All invoices with filters
/admin/finance/invoices/[invoiceId]        — Invoice detail + payment history
/admin/finance/collect                     — Fee collection page (STK push)
/admin/finance/scholarships                — Scholarship management
/admin/finance/scholarships/create
/admin/finance/reports                     — Collection reports, recharts
/admin/finance/reports/arrears             — Arrears report
/admin/finance/reports/daily               — Daily collection report

/portal/student/fees                       — Student's own invoices + payment history
/portal/parent/fees                        — Child's fees + M-Pesa pay button
```

---

## Kenya Compliance

- **VAT**: 16% applies only if school is KRA VAT-registered. Toggle per tenant. Shows as separate line item on invoice. KRA-format invoice number required.
- **M-Pesa limits**: STK push max KES 150,000 per transaction. Daily limit KES 300,000. If invoice > 150K, split across sessions or use bank transfer.
- **Receipt format**: Must include school name, date, amount, payment method, student name, reference number. Printed receipts in KES only.
- **Refund policy**: M-Pesa refunds via B2C API. Store mpesaReceiptNumber for all transactions — required for reversal requests.

---

# ═══════════════════════════════════════════════════════════
# MODULE 2 — mod_attendance
# Base Rate: KES 10/student/month
# Dependencies: core_sis, core_notifications
# ═══════════════════════════════════════════════════════════

## Overview
Daily attendance marking for every class and session. Automatic parent SMS on absence. Consecutive absence escalation. Attendance rate tracking per student. CBC/KCSE report card integration.

---

## Schema

```typescript
attendance_sessions: defineTable({
  tenantId: v.string(),
  classId: v.string(),
  teacherId: v.string(),
  date: v.string(),                    // "YYYY-MM-DD"
  session: v.union(
    v.literal("morning"),
    v.literal("afternoon"),
    v.literal("full_day"),
  ),
  markingMethod: v.union(
    v.literal("manual"),               // teacher marks each student
    v.literal("qr_scan"),              // QR code attendance
    v.literal("biometric"),            // fingerprint (future)
  ),
  academicYearId: v.string(),
  termId: v.string(),
  status: v.union(
    v.literal("open"),                 // can still be edited
    v.literal("submitted"),            // locked by teacher
    v.literal("late_submission"),
  ),
  submittedAt: v.optional(v.number()),
  presentCount: v.number(),
  absentCount: v.number(),
  lateCount: v.number(),
  createdAt: v.number(),
})
  .index("by_tenantId_classId_date", ["tenantId", "classId", "date"])
  .index("by_tenantId_date", ["tenantId", "date"])
  .index("by_teacherId", ["teacherId"])
  .index("by_status", ["status"]),

attendance_records: defineTable({
  tenantId: v.string(),
  sessionId: v.id("attendance_sessions"),
  studentId: v.string(),
  classId: v.string(),
  date: v.string(),
  session: v.string(),
  status: v.union(
    v.literal("present"),
    v.literal("absent"),
    v.literal("late"),
    v.literal("excused"),
    v.literal("medical_leave"),        // ML — appears on report card
  ),
  remarks: v.optional(v.string()),
  markedBy: v.string(),                // teacher userId
  parentNotified: v.boolean(),
  parentNotifiedAt: v.optional(v.number()),
  markedAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_tenantId_studentId", ["tenantId", "studentId"])
  .index("by_sessionId", ["sessionId"])
  .index("by_tenantId_date", ["tenantId", "date"])
  .index("by_studentId_date", ["studentId", "date"]),

attendance_qr_tokens: defineTable({
  tenantId: v.string(),
  studentId: v.string(),
  qrToken: v.string(),                // unique QR code string
  generatedAt: v.number(),
  isActive: v.boolean(),
})
  .index("by_qrToken", ["qrToken"])
  .index("by_tenantId_studentId", ["tenantId", "studentId"]),
```

---

## RBAC

```typescript
export const ATTENDANCE_FEATURES = {
  mark_own_class_attendance: {
    key: "mark_own_class_attendance",
    label: "Mark Class Attendance",
    description: "Teacher can mark attendance for their assigned classes",
    defaultRoles: ["teacher"],
  },
  mark_any_class_attendance: {
    key: "mark_any_class_attendance",
    label: "Mark Any Class Attendance",
    description: "Mark attendance for any class (admin/principal)",
    defaultRoles: ["school_admin", "principal"],
  },
  view_own_class_attendance: {
    key: "view_own_class_attendance",
    defaultRoles: ["teacher"],
  },
  view_all_attendance: {
    key: "view_all_attendance",
    defaultRoles: ["school_admin", "principal"],
  },
  view_own_attendance: {
    key: "view_own_attendance",
    defaultRoles: ["student"],
  },
  view_child_attendance: {
    key: "view_child_attendance",
    defaultRoles: ["parent"],
  },
  edit_submitted_attendance: {
    key: "edit_submitted_attendance",
    label: "Edit Submitted Attendance",
    description: "Correct attendance after submission (admin only)",
    defaultRoles: ["school_admin"],
    riskyPermission: true,
  },
  view_attendance_reports: {
    key: "view_attendance_reports",
    defaultRoles: ["school_admin", "principal"],
  },
  manage_attendance_config: {
    key: "manage_attendance_config",
    defaultRoles: ["school_admin"],
  },
};

export const ATTENDANCE_DEFAULT_ROLE_ACCESS = [
  { role: "school_admin", accessLevel: "full", allowedFeatures: [] },
  { role: "principal",    accessLevel: "restricted",
    allowedFeatures: ["mark_any_class_attendance", "view_all_attendance", "view_attendance_reports"] },
  { role: "teacher",      accessLevel: "restricted",
    allowedFeatures: ["mark_own_class_attendance", "view_own_class_attendance"] },
  { role: "student",      accessLevel: "restricted",
    allowedFeatures: ["view_own_attendance"] },
  { role: "parent",       accessLevel: "restricted",
    allowedFeatures: ["view_child_attendance"] },
];
```

---

## Convex Functions

### Queries

```typescript
// Get attendance session for a class on a date
getAttendanceSession(classId, date, session?) → AttendanceSession | null

// Get all records for a session
getSessionRecords(sessionId) → AttendanceRecord[] with student names

// Classes not yet marked today (for admin dashboard alert)
getUnmarkedClassesToday(date) → Class[] with teacher name

// Student attendance rate for a term
getStudentAttendanceRate(studentId, termId) → {
  presentDays, absentDays, lateDays, medicalDays,
  totalDays, attendanceRatePct
}

// Class attendance summary for a period
getClassAttendanceSummary(classId, dateFrom, dateTo) → {
  dates[], dailyPresentPct[], averagePct
}

// Teacher: classes they can mark attendance for
getMyClassesForAttendance() → Class[] with session status today

// Parent: child attendance history
getChildAttendanceHistory(studentId, termId?) → AttendanceRecord[]

// Chronic absentees (below threshold)
getChronicAbsentees(termId, thresholdPct) → Student[] with attendanceRatePct

// Attendance log (audit trail — who marked what and when)
getAttendanceActivityLog(filters: {classId?, teacherId?, dateFrom?, dateTo?}) → AuditEntry[]
```

### Mutations

```typescript
// OPEN ATTENDANCE SESSION (teacher starts marking)
openAttendanceSession(classId, date, session, markingMethod?) → sessionId
  requireFeature: "mark_own_class_attendance" OR "mark_any_class_attendance"
  Guard teacher: teacher must be assigned to this class
  Check: no duplicate session for classId + date + session
  Set all students as "absent" by default (teacher marks present)
  logAudit

// MARK STUDENT (bulk — submit entire class at once)
submitAttendanceSession(sessionId, records: {studentId, status, remarks?}[]) → void
  requireFeature: "mark_own_class_attendance" OR "mark_any_class_attendance"
  Guard: session must be "open" (or "submitted" if user has edit_submitted_attendance)
  Update each attendance_record
  Recalculate presentCount, absentCount, lateCount on session
  Set session status: "submitted"
  For each absent/late student:
    Publish attendance.student.absent event
    (Communications module handles SMS to parent)
  Check consecutive absences: if 3+ days in a row → publish attendance.student.absent.consecutive
  Check chronic: if attendance rate drops below threshold → publish attendance.student.chronic
  logAudit

// MARK SINGLE STUDENT (quick update)
markSingleStudent(sessionId, studentId, status, remarks?) → void
  requireFeature: "mark_own_class_attendance"
  Update single attendance_record
  Update session counts
  If absent: publish attendance.student.absent

// EDIT SUBMITTED ATTENDANCE (admin correction)
editSubmittedAttendance(sessionId, records) → void
  requireFeature: "edit_submitted_attendance"
  Update records
  Log with reason: "Corrected by admin"
  logAudit

// GENERATE QR CODE FOR STUDENT
generateStudentQRCode(studentId) → {qrToken, qrImageUrl}
  requireFeature: "manage_attendance_config"
  Create attendance_qr_tokens record
  Generate QR image via UploadThing (encode token as URL)

// SCAN QR CODE (student arrival)
scanQRAttendance(qrToken, sessionId) → {studentId, status, message}
  PUBLIC (called from QR scanner app — no auth required, but session must be open)
  Find student by qrToken
  Mark student as "present" in session
  Return confirmation
```

---

## Event Bus

### Published
```
attendance.student.absent               → {studentId, classId, date, session, teacherId}
attendance.student.absent.consecutive   → {studentId, classId, consecutiveDays, dates[]}
attendance.student.chronic              → {studentId, classId, attendanceRatePct, termId}
attendance.session.submitted            → {sessionId, classId, date, presentCount, absentCount}
```

### Subscribed
None (Attendance is a publisher — other modules react to it)

---

## publicApi.ts

```typescript
getStudentAttendanceRate(tenantId, studentId, termId?)
  → {attendanceRatePct, consecutiveAbsences}

getClassAttendanceSummary(tenantId, classId, date)
  → {presentCount, absentCount, lateCount}

getConsecutiveAbsences(tenantId, studentId)
  → number (days in a row absent up to today)

hasStudentBeenMarkedToday(tenantId, studentId)
  → boolean
```

---

## configSchema

```typescript
schoolStartTime: time (default: "07:30")
lateThresholdMinutes: number (default: 15)
markingMethod: "manual" | "qr_scan" | "biometric" (default: "manual")
enableAfternoonSession: boolean (default: false)
chronicThresholdPct: number (default: 75) // below this = chronic
consecutiveAlertDays: number (default: 3)
enableQRCards: boolean (default: false)
autoSubmitHour: number (default: 17) // auto-submit open sessions at 5pm
```

---

## Frontend Pages

```
/admin/attendance                          — Dashboard: today's marking status, alerts
/admin/attendance/mark/[classId]           — Mark attendance for a class
/admin/attendance/history                  — Historical attendance (filter by class, date range)
/admin/attendance/reports                  — Summary reports, chronic absentees
/admin/attendance/qr-cards                 — Generate and print QR ID cards

/portal/teacher/attendance                 — Teacher's classes with today's status
/portal/teacher/attendance/mark/[classId]  — Mark attendance form (quick tap UI)
/portal/student/attendance                 — Own attendance history + rate
/portal/parent/attendance                  — Child's attendance with SMS notification history
```

---

# ═══════════════════════════════════════════════════════════
# MODULE 3 — mod_academics
# Base Rate: KES 15/student/month
# Dependencies: core_sis
# ═══════════════════════════════════════════════════════════

## Overview
Gradebook, assignments, exam results, report cards. Supports KCSE (12-point letter grade), CBC (EE/ME/AE/BE), percentage, Cambridge, and custom grading. AI-assisted report card narratives via OpenRouter Claude Haiku.

---

## Schema

```typescript
grading_systems: defineTable({
  tenantId: v.string(),
  name: v.string(),                    // "KCSE", "CBC Grade 1-6", "Custom"
  type: v.union(
    v.literal("kcse"),
    v.literal("cbc"),
    v.literal("percentage"),
    v.literal("cambridge"),
    v.literal("custom"),
  ),
  grades: v.array(v.object({
    grade: v.string(),                 // "A", "B+", "EE"
    minPct: v.number(),
    maxPct: v.number(),
    points: v.number(),                // for mean grade calculation
    description: v.string(),          // "Excellent"
  })),
  isDefault: v.boolean(),
  createdAt: v.number(),
})
  .index("by_tenantId", ["tenantId"]),

subjects: defineTable({
  tenantId: v.string(),
  name: v.string(),
  code: v.string(),
  type: v.union(v.literal("core"), v.literal("elective"), v.literal("co_curricular")),
  applicableLevels: v.array(v.string()),
  gradingSystemId: v.optional(v.id("grading_systems")), // null = use school default
  isOptional: v.boolean(),
  isDeleted: v.boolean(),
  createdAt: v.number(),
})
  .index("by_tenantId", ["tenantId"]),

class_subject_assignments: defineTable({
  tenantId: v.string(),
  classId: v.string(),
  subjectId: v.id("subjects"),
  teacherId: v.string(),
  academicYearId: v.string(),
  termId: v.optional(v.string()),
  isActive: v.boolean(),
})
  .index("by_tenantId_classId", ["tenantId", "classId"])
  .index("by_teacherId", ["teacherId"]),

student_subject_opts: defineTable({
  tenantId: v.string(),
  studentId: v.string(),
  subjectId: v.id("subjects"),
  isOptedOut: v.boolean(),             // for optional subjects
  approvedBy: v.optional(v.string()),
  createdAt: v.number(),
})
  .index("by_tenantId_studentId", ["tenantId", "studentId"]),

exams: defineTable({
  tenantId: v.string(),
  name: v.string(),                    // "Mid-Term Exam", "End-Term Exam"
  type: v.union(
    v.literal("exam"),
    v.literal("cat"),                  // Continuous Assessment Test
    v.literal("assignment"),
    v.literal("classwork"),
    v.literal("homework"),
    v.literal("project"),
  ),
  classIds: v.array(v.string()),       // which classes write this exam
  subjectId: v.optional(v.id("subjects")), // null = multiple subjects
  termId: v.string(),
  academicYearId: v.string(),
  totalMarks: v.number(),
  weight: v.number(),                  // percentage of term mark (e.g. 40)
  examDate: v.optional(v.number()),
  resultsPublishDate: v.optional(v.number()), // auto-publish on this date
  status: v.union(
    v.literal("draft"),
    v.literal("active"),
    v.literal("grading"),
    v.literal("published"),
    v.literal("archived"),
  ),
  createdBy: v.string(),
  isDeleted: v.boolean(),
  createdAt: v.number(),
})
  .index("by_tenantId", ["tenantId"])
  .index("by_tenantId_termId", ["tenantId", "termId"])
  .index("by_status", ["status"])
  .index("by_resultsPublishDate", ["resultsPublishDate"]),

exam_results: defineTable({
  tenantId: v.string(),
  examId: v.id("exams"),
  studentId: v.string(),
  subjectId: v.id("subjects"),
  classId: v.string(),
  marksAwarded: v.optional(v.number()), // null = absent or not yet graded
  totalMarks: v.number(),
  percentageScore: v.optional(v.number()),
  grade: v.optional(v.string()),        // "A", "B+", "EE" etc
  gradePoints: v.optional(v.number()),
  remarks: v.optional(v.string()),      // teacher remarks
  isMissing: v.boolean(),               // show "?" on report card
  gradedBy: v.string(),
  gradedAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_tenantId_studentId", ["tenantId", "studentId"])
  .index("by_examId", ["examId"])
  .index("by_tenantId_examId", ["tenantId", "examId"]),

assignments: defineTable({
  tenantId: v.string(),
  classId: v.string(),
  subjectId: v.id("subjects"),
  teacherId: v.string(),
  title: v.string(),
  description: v.optional(v.string()), // DOMPurify sanitized
  dueDate: v.number(),
  totalMarks: v.number(),
  type: v.union(
    v.literal("assignment"),
    v.literal("classwork"),
    v.literal("homework"),
    v.literal("project"),
    v.literal("test"),
  ),
  attachmentUrls: v.array(v.string()),
  isPublished: v.boolean(),
  status: v.union(
    v.literal("draft"),
    v.literal("published"),
    v.literal("grading"),
    v.literal("completed"),
  ),
  isDeleted: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_tenantId_classId", ["tenantId", "classId"])
  .index("by_teacherId", ["teacherId"])
  .index("by_dueDate", ["dueDate"]),

assignment_submissions: defineTable({
  tenantId: v.string(),
  assignmentId: v.id("assignments"),
  studentId: v.string(),
  submittedAt: v.number(),
  fileUrls: v.array(v.string()),
  notes: v.optional(v.string()),
  marksAwarded: v.optional(v.number()),
  grade: v.optional(v.string()),
  feedback: v.optional(v.string()),    // DOMPurify sanitized
  gradedBy: v.optional(v.string()),
  gradedAt: v.optional(v.number()),
  status: v.union(
    v.literal("submitted"),
    v.literal("late_submission"),
    v.literal("graded"),
    v.literal("returned"),
  ),
})
  .index("by_assignmentId", ["assignmentId"])
  .index("by_tenantId_studentId", ["tenantId", "studentId"]),

report_cards: defineTable({
  tenantId: v.string(),
  studentId: v.string(),
  classId: v.string(),
  termId: v.string(),
  academicYearId: v.string(),
  subjects: v.array(v.object({
    subjectId: v.string(),
    subjectName: v.string(),
    marksAwarded: v.optional(v.number()),
    totalMarks: v.number(),
    percentageScore: v.optional(v.number()),
    grade: v.optional(v.string()),
    gradePoints: v.optional(v.number()),
    teacherRemarks: v.optional(v.string()),
    attendanceNote: v.optional(v.string()), // ML if medical leave
    isMissing: v.boolean(),
  })),
  totalMarks: v.number(),
  outOf: v.number(),
  overallPercentage: v.number(),
  meanGrade: v.optional(v.string()),  // KCSE: A, A-, B+... CBC: EE, ME...
  classRank: v.optional(v.number()),
  streamRank: v.optional(v.number()),
  classSize: v.optional(v.number()),
  principalRemarks: v.optional(v.string()),
  classTeacherRemarks: v.optional(v.string()),
  aiGeneratedNarrative: v.optional(v.string()),
  performanceGraphEnabled: v.boolean(),
  attendanceSummary: v.optional(v.object({
    presentDays: v.number(),
    absentDays: v.number(),
    lateDays: v.number(),
    medicalDays: v.number(),
    attendanceRatePct: v.number(),
  })),
  pdfUrl: v.optional(v.string()),
  publishedAt: v.optional(v.number()),
  status: v.union(v.literal("draft"), v.literal("published")),
  generatedAt: v.number(),
})
  .index("by_tenantId_studentId", ["tenantId", "studentId"])
  .index("by_tenantId_termId", ["tenantId", "termId"])
  .index("by_status", ["status"]),

lesson_plans: defineTable({
  tenantId: v.string(),
  teacherId: v.string(),
  classId: v.string(),
  subjectId: v.id("subjects"),
  termId: v.string(),
  weekNumber: v.number(),
  sessionNumber: v.number(),          // 1 = Monday AM, etc.
  topic: v.string(),
  learningObjectives: v.array(v.string()),
  activities: v.optional(v.string()), // DOMPurify sanitized
  resources: v.array(v.string()),
  duration: v.number(),               // minutes
  completedAt: v.optional(v.number()),
  createdAt: v.number(),
})
  .index("by_teacherId_termId", ["teacherId", "termId"])
  .index("by_classId_termId", ["classId", "termId"]),
```

---

## RBAC

```typescript
export const ACADEMICS_FEATURES = {
  manage_subjects: { key: "manage_subjects", defaultRoles: ["school_admin"] },
  create_exams:    { key: "create_exams",    defaultRoles: ["school_admin", "teacher"] },
  enter_grades:    { key: "enter_grades",    defaultRoles: ["teacher"] },
  publish_results: { key: "publish_results", defaultRoles: ["school_admin", "principal"] },
  generate_report_cards: { key: "generate_report_cards", defaultRoles: ["school_admin"] },
  view_all_grades: { key: "view_all_grades", defaultRoles: ["school_admin", "principal"] },
  create_assignments: { key: "create_assignments", defaultRoles: ["teacher"] },
  grade_assignments:  { key: "grade_assignments",  defaultRoles: ["teacher"] },
  view_own_grades:    { key: "view_own_grades",    defaultRoles: ["student"] },
  submit_assignments: { key: "submit_assignments", defaultRoles: ["student"] },
  view_child_grades:  { key: "view_child_grades",  defaultRoles: ["parent"] },
  manage_lesson_plans:{ key: "manage_lesson_plans", defaultRoles: ["teacher"] },
  result_counselling: { key: "result_counselling", defaultRoles: ["school_admin", "principal"] },
};

export const ACADEMICS_DEFAULT_ROLE_ACCESS = [
  { role: "school_admin", accessLevel: "full",       allowedFeatures: [] },
  { role: "principal",    accessLevel: "restricted",  allowedFeatures: ["view_all_grades", "publish_results", "result_counselling"] },
  { role: "teacher",      accessLevel: "restricted",  allowedFeatures: ["create_exams", "enter_grades", "create_assignments", "grade_assignments", "manage_lesson_plans"] },
  { role: "student",      accessLevel: "restricted",  allowedFeatures: ["view_own_grades", "submit_assignments"] },
  { role: "parent",       accessLevel: "restricted",  allowedFeatures: ["view_child_grades"] },
];
```

---

## Convex Functions

### Queries
```typescript
getSubjects(filters: {level?, type?}) → Subject[]
getClassSubjectAssignments(classId, academicYearId) → {subject, teacher}[]
getExams(filters: {classId?, termId?, status?}) → Exam[]
getExamResults(examId, classId?) → ExamResult[] with student names
getStudentResultsSummary(studentId, termId) → {subjects[], overallPct, meanGrade, rank}
getGradebook(classId, termId) → Matrix: students × subjects × marks
getAssignments(classId?, subjectId?, dateFrom?) → Assignment[]
getMyAssignments() → Assignment[] (teacher = assigned to me, student = my class)
getAssignmentSubmissions(assignmentId) → Submission[] with student name
getMySubmissions(assignmentId?) → Submission[] (student)
getReportCard(studentId, termId) → ReportCard | null
getClassReportCards(classId, termId) → ReportCard[]
getStudentAchievements(studentId) → Achievement[]
getStudentsNeedingCounselling(classId, termId, thresholdPct) → Student[]
getCumulativePerformance(studentId, academicYearId) → TermPerformance[]
downloadBlankMarksSheet(examId, classId) → {csvData} (for offline use)
getLessonPlans(teacherId, termId, weekNumber?) → LessonPlan[]
```

### Mutations
```typescript
// GRADING SYSTEM
createGradingSystem(args) → gradingSystemId
updateGradingSystem(id, args)
setDefaultGradingSystem(gradingSystemId)

// SUBJECTS
createSubject(args) → subjectId
updateSubject(id, updates)
deleteSubject(id) → soft delete
assignSubjectToClass(classId, subjectId, teacherId, academicYearId)
studentOptOutOfSubject(studentId, subjectId) → records student opt-out

// EXAMS
createExam(args) → examId
  Guard: teacher can only create for their assigned classes
updateExam(examId, updates)
  Guard: cannot update published exam without admin permission
publishExamResults(examId) → void
  requireFeature: "publish_results"
  Set exam status: "published"
  For each student: calculate grade from marks
  Update exam_results with grade, gradePoints
  Publish academics.exam.results.published event
autoPublishExamResults (internalMutation — cron)
  Find exams with resultsPublishDate <= now AND status !== "published"
  publishExamResults for each

// GRADES
bulkEnterGrades(examId, grades: {studentId, marksAwarded, remarks?}[]) → void
  requireFeature: "enter_grades"
  Guard: teacher must own this subject for this class
  DOMPurify on remarks
  Update exam_results
  For each: calculate percentageScore and grade
  Publish academics.grade.posted for each student
  logAudit

enterSingleGrade(examId, studentId, marksAwarded, remarks?) → void
  requireFeature: "enter_grades"
importGradesFromCSV(examId, csvData) → {imported, errors[]}
  requireFeature: "enter_grades"
downloadBlankMarksSheet(examId) → generates CSV with student list, no marks

// ASSIGNMENTS
createAssignment(args) → assignmentId
  requireFeature: "create_assignments"
  DOMPurify on description
  On publish: notify students in class
updateAssignment(assignmentId, updates)
  Guard: only creator or school_admin
deleteAssignment(id) → soft delete
submitAssignment(assignmentId, {fileUrls, notes?}) → submissionId
  requireFeature: "submit_assignments"
  Check: dueDate not passed (or mark as late_submission)
  Publish academics.assignment.submitted event → teacher notified
gradeSubmission(submissionId, {marksAwarded, feedback}) → void
  requireFeature: "grade_assignments"
  DOMPurify on feedback
  Publish academics.grade.posted event → student notified

// REPORT CARDS
generateReportCards(classId, termId) → {generated, failed[]}
  requireFeature: "generate_report_cards"
  For each student in class:
    Aggregate all exam results for term
    Calculate overallPercentage, meanGrade
    Compute classRank, streamRank
    Pull attendance from publicApi if mod_attendance installed
    Generate AI narrative via callOpenRouter(claude-haiku-4-5)
    Create report_cards record
    Generate PDF (UploadThing)
  logAudit

publishReportCards(termId, classIds[]) → void
  requireFeature: "publish_results"
  Set all matching report cards status: "published"
  Publish academics.report_card.generated for each student
  (Communications module sends parent notification)

addPrincipalRemarks(reportCardId, remarks) → void
  requireFeature: "publish_results"
  DOMPurify on remarks

generateAIReportNarrative(studentId, termId) → {narrative: string}
  requireFeature: "generate_report_cards"
  Calls callOpenRouter with claude-sonnet-4-6
  NEVER sends student name to OpenRouter — sends anonymised scores only
  Returns narrative for admin to review before saving

retainMarksOnSectionChange(studentId, fromClassId, toClassId) → void
  requireFeature: "manage_subjects" (school_admin)
  Copies exam_results where classId matches fromClassId

// LESSON PLANS
createLessonPlan(args) → lessonPlanId
  requireFeature: "manage_lesson_plans"
updateLessonPlan(lessonPlanId, updates)
markLessonCompleted(lessonPlanId) → void

// ACHIEVEMENTS
logStudentAchievement(studentId, {title, description, date, category, evidenceUrl?}) → void
  requireFeature: "view_all_grades" (admin/principal)

// RESULT COUNSELLING
flagStudentForCounselling(studentId, termId, reason) → void
  requireFeature: "result_counselling"
  Creates a task/alert for school admin
  Notifies counsellor if applicable
```

---

## Event Bus

### Published
```
academics.grade.posted          → {submissionId, assignmentId, studentId, teacherId, grade}
academics.exam.results.published → {examId, classId, termId, studentIds[]}
academics.report_card.generated  → {studentId, termId, academicYearId, reportCardUrl}
academics.assignment.submitted   → {submissionId, assignmentId, studentId}
```

### Subscribed
```
attendance.student.absent.consecutive → flag attendance on report card
  Update report_card.attendanceSummary if report card exists for current term
  Add note to student's medical leave / absence record
```

---

## publicApi.ts

```typescript
getStudentGradeSummary(tenantId, studentId, termId?)
  → {averageGrade, passedSubjects, failedSubjects, overallPct}

getStudentTermAverage(tenantId, studentId, termId)
  → number (percentage)

getMeanGrade(tenantId, studentId, termId)
  → string (e.g. "B+")

getClassGradeDistribution(tenantId, classId, termId)
  → {grade: string, count: number}[]
```

---

## configSchema

```typescript
defaultGradingSystem: select (kcse | cbc | percentage | cambridge | custom)
enablePerformanceGraph: boolean (default: true)
enableAIReportNarratives: boolean (default: false, note: "uses AI credits")
reportCardSignatureBlock: text
reportCardFooterText: text
enableClassRank: boolean (default: true)
enableStreamRank: boolean (default: true)
showAttendanceOnReportCard: boolean (default: true)
autoPublishResultsEnabled: boolean (default: false)
```

---

## Frontend Pages

```
/admin/academics                             — Dashboard: pending grades, upcoming exams
/admin/academics/subjects                    — Subject management
/admin/academics/subjects/create
/admin/academics/exams                       — All exams
/admin/academics/exams/create
/admin/academics/exams/[examId]/grades       — Enter grades (teacher view)
/admin/academics/gradebook/[classId]         — Full class gradebook matrix
/admin/academics/report-cards               — Generate and publish report cards
/admin/academics/report-cards/[termId]       — All report cards for a term
/admin/academics/assignments                 — All assignments list
/admin/academics/achievements               — Student achievements log

/portal/teacher/academics                   — My classes and exams
/portal/teacher/academics/assignments       — Create/manage assignments
/portal/teacher/academics/assignments/[id]/grade — Grade submissions
/portal/teacher/academics/grades/[examId]   — Enter exam marks
/portal/teacher/academics/lesson-plans      — Lesson planner

/portal/student/academics                   — My grades, report cards, assignments
/portal/student/academics/assignments       — Pending assignments
/portal/student/academics/assignments/[id]/submit — Submit assignment
/portal/student/academics/report-cards      — Download report cards

/portal/parent/academics                    — Child's grades, results
/portal/parent/academics/report-cards       — Download child's report cards
```

---

## Kenya Compliance

- **KCSE grades**: A=80+, A-=75-79, B+=70-74, B=65-69, B-=60-64, C+=55-59, C=50-54, C-=45-49, D+=40-44, D=35-39, D-=30-34, E=<30. Verify against KNEC current scheme before each academic year.
- **CBC assessment**: EE (Exceeds Expectation), ME (Meets Expectation), AE (Approaches Expectation), BE (Below Expectation). Grade 1-9. Rubric-based, not mark-based.
- **Medical Leave**: Appears on report card as "ML" alongside attendance — required by MOE.
- **NEMIS export**: Report cards must be exportable in NEMIS-compatible format (future integration).
- **Report card retention**: Schools must retain for minimum 7 years per Kenya law.
