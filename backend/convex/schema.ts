import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tenants: defineTable({
    slug: v.string(), name: v.string(),
    tier: v.union(v.literal("starter"), v.literal("standard"), v.literal("pro"), v.literal("enterprise")),
    status: v.union(v.literal("active"), v.literal("suspended"), v.literal("trial"), v.literal("churned")),
    modules: v.array(v.string()),
    billingInfo: v.object({ contactEmail: v.string(), contactName: v.string(), country: v.string(), currency: v.string() }),
    country: v.string(), currency: v.string(), createdAt: v.number(), updatedAt: v.number(),
  }).index("by_slug", ["slug"]).index("by_status", ["status"]).index("by_tier", ["tier"]),

  platformAdmins: defineTable({
    workosUserId: v.string(), email: v.string(), name: v.string(),
    role: v.union(v.literal("master_admin"), v.literal("super_admin")),
    isActive: v.boolean(), createdAt: v.number(),
  }).index("by_workos_user", ["workosUserId"]).index("by_email", ["email"]),

  // Unified sessions table
  sessions: defineTable({
    token: v.optional(v.string()), userId: v.string(), role: v.string(),
    permissions: v.optional(v.array(v.string())), expiresAt: v.number(), createdAt: v.number(),
    tenantId: v.string(), email: v.optional(v.string()),
    // Optional fields for backward compatibility
    isActive: v.optional(v.boolean()),
    deviceInfo: v.optional(v.string()),
    workosUserId: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  }).index("by_token", ["token"]).index("by_user", ["userId"]).index("by_tenant", ["tenantId"]),

  platformAuditLogs: defineTable({
    actorId: v.string(), actorEmail: v.string(), action: v.string(),
    tenantId: v.optional(v.string()), entityType: v.string(),
    entityId: v.optional(v.string()), metadata: v.optional(v.any()), timestamp: v.number(),
  }).index("by_actor", ["actorId"]).index("by_tenant", ["tenantId"]).index("by_timestamp", ["timestamp"]),

  impersonations: defineTable({
    masterAdminId: v.string(), targetUserId: v.string(), tenantId: v.string(),
    reason: v.optional(v.string()), startedAt: v.number(), endedAt: v.optional(v.number()),
  }).index("by_admin", ["masterAdminId"]).index("by_tenant", ["tenantId"]),

  moduleRegistry: defineTable({
    moduleId: v.string(), name: v.string(), description: v.string(),
    tier: v.string(), category: v.string(),
    status: v.union(v.literal("active"), v.literal("beta"), v.literal("deprecated")),
    version: v.string(),
  }).index("by_module_id", ["moduleId"]).index("by_status", ["status"]),

  subscriptions: defineTable({
    tenantId: v.string(), tier: v.string(), studentCount: v.number(),
    billingCycle: v.union(v.literal("monthly"), v.literal("annual")),
    amountCents: v.number(), currency: v.string(), nextBillingDate: v.number(),
    status: v.union(v.literal("active"), v.literal("past_due"), v.literal("cancelled")),
    createdAt: v.number(), updatedAt: v.number(),
  }).index("by_tenant", ["tenantId"]).index("by_status", ["status"]),

  platformInvoices: defineTable({
    tenantId: v.string(), amountCents: v.number(), currency: v.string(),
    status: v.union(v.literal("draft"), v.literal("sent"), v.literal("paid"), v.literal("overdue"), v.literal("void")),
    dueDate: v.number(), paidAt: v.optional(v.number()), description: v.string(), createdAt: v.number(),
  }).index("by_tenant", ["tenantId"]).index("by_status", ["status"]).index("by_due_date", ["dueDate"]),

  users: defineTable({
    tenantId: v.string(), workosUserId: v.string(),
    role: v.union(v.literal("school_admin"), v.literal("principal"), v.literal("teacher"), v.literal("student"), v.literal("parent"), v.literal("finance_officer"), v.literal("librarian"), v.literal("transport_officer"), v.literal("hr_officer"), v.literal("receptionist")),
    email: v.string(), phone: v.optional(v.string()), firstName: v.string(), lastName: v.optional(v.string()),
    photo: v.optional(v.string()), isActive: v.boolean(), createdAt: v.number(), updatedAt: v.optional(v.number()),
  }).index("by_tenant", ["tenantId"]).index("by_tenant_role", ["tenantId", "role"]).index("by_tenant_email", ["tenantId", "email"]).index("by_workos_user", ["workosUserId"]),

  auditLogs: defineTable({
    tenantId: v.string(), actorId: v.string(), actorEmail: v.string(), action: v.string(),
    entityType: v.string(), entityId: v.string(),
    before: v.optional(v.any()), after: v.optional(v.any()), timestamp: v.number(),
  }).index("by_tenant", ["tenantId"]).index("by_tenant_actor", ["tenantId", "actorId"]).index("by_tenant_entity", ["tenantId", "entityType", "entityId"]).index("by_tenant_timestamp", ["tenantId", "timestamp"]),

  students: defineTable({
    tenantId: v.string(), admissionNo: v.string(), firstName: v.string(), lastName: v.string(),
    dateOfBirth: v.string(), gender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
    photo: v.optional(v.string()), curriculum: v.string(), classId: v.optional(v.string()),
    guardianIds: v.array(v.string()), userId: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("graduated"), v.literal("transferred"), v.literal("suspended"), v.literal("expelled")),
    createdAt: v.number(), updatedAt: v.number(),
  }).index("by_tenant", ["tenantId"]).index("by_tenant_admission", ["tenantId", "admissionNo"]).index("by_tenant_class", ["tenantId", "classId"]).index("by_tenant_status", ["tenantId", "status"]).index("by_user", ["userId"]),

  guardians: defineTable({
    tenantId: v.string(), firstName: v.string(), lastName: v.string(), phone: v.string(),
    email: v.optional(v.string()),
    relationship: v.union(v.literal("father"), v.literal("mother"), v.literal("guardian"), v.literal("other")),
    studentIds: v.array(v.string()), userId: v.optional(v.string()), createdAt: v.number(), updatedAt: v.number(),
  }).index("by_tenant", ["tenantId"]).index("by_tenant_phone", ["tenantId", "phone"]),

  classes: defineTable({
    tenantId: v.string(), name: v.string(), grade: v.string(), stream: v.optional(v.string()),
    curriculum: v.string(), classTeacherId: v.optional(v.string()), academicYearId: v.string(),
    capacity: v.optional(v.number()), createdAt: v.number(), updatedAt: v.number(),
  }).index("by_tenant", ["tenantId"]).index("by_tenant_academic_year", ["tenantId", "academicYearId"]).index("by_tenant_grade", ["tenantId", "grade"]),

  enrollments: defineTable({
    tenantId: v.string(), studentId: v.string(), classId: v.string(), academicYearId: v.string(),
    status: v.union(v.literal("active"), v.literal("transferred"), v.literal("completed"), v.literal("withdrawn")),
    enrolledAt: v.number(), updatedAt: v.number(),
  }).index("by_tenant", ["tenantId"]).index("by_tenant_student", ["tenantId", "studentId"]).index("by_tenant_class", ["tenantId", "classId"]).index("by_tenant_academic_year", ["tenantId", "academicYearId"]),

  admissionApplications: defineTable({
    tenantId: v.string(), applicationId: v.string(),
    studentInfo: v.object({ firstName: v.string(), lastName: v.string(), dateOfBirth: v.string(), gender: v.string(), curriculum: v.optional(v.string()) }),
    guardianInfo: v.object({ firstName: v.string(), lastName: v.string(), phone: v.string(), email: v.optional(v.string()), relationship: v.string() }),
    applyingForGrade: v.string(), academicYearId: v.string(),
    status: v.union(v.literal("draft"), v.literal("submitted"), v.literal("under_review"), v.literal("accepted"), v.literal("rejected"), v.literal("waitlisted"), v.literal("enrolled")),
    documents: v.array(v.object({ type: v.string(), url: v.string(), uploadedAt: v.number() })),
    notes: v.optional(v.string()), reviewedBy: v.optional(v.string()), reviewedAt: v.optional(v.number()),
    createdAt: v.number(), updatedAt: v.number(),
  }).index("by_tenant", ["tenantId"]).index("by_tenant_status", ["tenantId", "status"]).index("by_tenant_application_id", ["tenantId", "applicationId"]).index("by_tenant_academic_year", ["tenantId", "academicYearId"]),

  feeStructures: defineTable({
    tenantId: v.string(), name: v.string(), grade: v.string(), term: v.string(), academicYearId: v.string(),
    items: v.array(v.object({ label: v.string(), amountCents: v.number(), isOptional: v.boolean() })),
    totalCents: v.number(), isActive: v.boolean(), createdAt: v.number(), updatedAt: v.number(),
  }).index("by_tenant", ["tenantId"]).index("by_tenant_grade", ["tenantId", "grade"]).index("by_tenant_academic_year", ["tenantId", "academicYearId"]),

  invoices: defineTable({
    tenantId: v.string(), invoiceRef: v.string(), studentId: v.string(), feeStructureId: v.string(),
    totalCents: v.number(), paidCents: v.number(), balanceCents: v.number(),
    status: v.union(v.literal("draft"), v.literal("issued"), v.literal("partially_paid"), v.literal("paid"), v.literal("overdue"), v.literal("waived"), v.literal("void")),
    dueDate: v.number(), academicYearId: v.string(), term: v.string(), createdAt: v.number(), updatedAt: v.number(),
  }).index("by_tenant", ["tenantId"]).index("by_tenant_student", ["tenantId", "studentId"]).index("by_tenant_status", ["tenantId", "status"]).index("by_tenant_academic_year", ["tenantId", "academicYearId"]).index("by_tenant_invoice_ref", ["tenantId", "invoiceRef"]),

  payments: defineTable({
    tenantId: v.string(), invoiceId: v.string(), studentId: v.string(), amountCents: v.number(), currency: v.string(),
    method: v.union(v.literal("mpesa"), v.literal("airtel_money"), v.literal("stripe"), v.literal("bank_transfer"), v.literal("cash"), v.literal("cheque")),
    reference: v.string(),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("refunded"), v.literal("cancelled")),
    processedBy: v.optional(v.string()), paidAt: v.optional(v.number()), createdAt: v.number(), updatedAt: v.number(),
  }).index("by_tenant", ["tenantId"]).index("by_tenant_invoice", ["tenantId", "invoiceId"]).index("by_tenant_student", ["tenantId", "studentId"]).index("by_tenant_status", ["tenantId", "status"]).index("by_tenant_reference", ["tenantId", "reference"]),

  paymentCallbacks: defineTable({
    tenantId: v.string(),
    provider: v.union(v.literal("mpesa"), v.literal("airtel_money"), v.literal("stripe")),
    payload: v.any(), processed: v.boolean(), paymentId: v.optional(v.string()), error: v.optional(v.string()), createdAt: v.number(),
  }).index("by_tenant", ["tenantId"]).index("by_tenant_provider", ["tenantId", "provider"]).index("by_tenant_processed", ["tenantId", "processed"]),

  academicYears: defineTable({
    tenantId: v.string(), name: v.string(), startDate: v.string(), endDate: v.string(), isCurrent: v.boolean(),
    terms: v.array(v.object({ name: v.string(), type: v.string(), startDate: v.string(), endDate: v.string(), isCurrent: v.boolean() })),
    createdAt: v.number(), updatedAt: v.number(),
  }).index("by_tenant", ["tenantId"]).index("by_tenant_current", ["tenantId", "isCurrent"]),

  attendanceRecords: defineTable({
    tenantId: v.string(), studentId: v.string(), classId: v.string(), date: v.string(),
    status: v.union(v.literal("present"), v.literal("absent"), v.literal("late"), v.literal("excused")),
    note: v.optional(v.string()), recordedBy: v.string(), createdAt: v.number(),
  }).index("by_tenant", ["tenantId"]).index("by_tenant_student", ["tenantId", "studentId"]).index("by_tenant_class_date", ["tenantId", "classId", "date"]).index("by_tenant_date", ["tenantId", "date"]),

  grades: defineTable({
    tenantId: v.string(), studentId: v.string(), classId: v.string(), subjectId: v.string(),
    term: v.string(), academicYearId: v.string(), score: v.number(), maxScore: v.number(),
    grade: v.optional(v.string()), curriculum: v.string(), assessmentType: v.string(),
    createdAt: v.number(), updatedAt: v.number(),
  }).index("by_tenant", ["tenantId"]).index("by_tenant_student", ["tenantId", "studentId"]).index("by_tenant_class", ["tenantId", "classId"]).index("by_tenant_student_term", ["tenantId", "studentId", "term"]),

  assignments: defineTable({
    tenantId: v.string(), classId: v.string(), subjectId: v.string(), title: v.string(),
    description: v.optional(v.string()), dueDate: v.number(), maxMarks: v.number(),
    setBy: v.string(), attachments: v.array(v.string()), createdAt: v.number(), updatedAt: v.number(),
  }).index("by_tenant", ["tenantId"]).index("by_tenant_class", ["tenantId", "classId"]).index("by_tenant_due_date", ["tenantId", "dueDate"]),

  submissions: defineTable({
    tenantId: v.string(), assignmentId: v.string(), studentId: v.string(),
    marks: v.optional(v.number()),
    status: v.union(v.literal("submitted"), v.literal("late"), v.literal("missing"), v.literal("graded")),
    feedback: v.optional(v.string()), attachments: v.array(v.string()),
    submittedAt: v.optional(v.number()), gradedBy: v.optional(v.string()), gradedAt: v.optional(v.number()),
    createdAt: v.number(), updatedAt: v.number(),
  }).index("by_tenant", ["tenantId"]).index("by_tenant_assignment", ["tenantId", "assignmentId"]).index("by_tenant_student", ["tenantId", "studentId"]),

  reportCards: defineTable({
    tenantId: v.string(), studentId: v.string(), classId: v.string(), term: v.string(), academicYearId: v.string(),
    grades: v.any(),
    attendance: v.object({ present: v.number(), absent: v.number(), late: v.number() }),
    teacherRemarks: v.optional(v.string()), principalRemarks: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("published")),
    publishedAt: v.optional(v.number()), createdAt: v.number(), updatedAt: v.number(),
  }).index("by_tenant", ["tenantId"]).index("by_tenant_student", ["tenantId", "studentId"]).index("by_tenant_class", ["tenantId", "classId"]).index("by_tenant_term", ["tenantId", "term", "academicYearId"]),

  staff: defineTable({
    tenantId: v.string(), userId: v.optional(v.string()), staffRef: v.string(),
    firstName: v.string(), lastName: v.string(), role: v.string(), department: v.string(),
    phone: v.string(), email: v.string(), salaryCents: v.number(),
    employmentType: v.union(v.literal("full_time"), v.literal("part_time"), v.literal("contract")),
    status: v.union(v.literal("active"), v.literal("on_leave"), v.literal("terminated"), v.literal("resigned")),
    joinedAt: v.number(), createdAt: v.number(), updatedAt: v.number(),
  }).index("by_tenant", ["tenantId"]).index("by_tenant_role", ["tenantId", "role"]).index("by_tenant_status", ["tenantId", "status"]).index("by_tenant_staff_ref", ["tenantId", "staffRef"]),

  timetableSlots: defineTable({
    tenantId: v.string(), academicYearId: v.string(), term: v.string(), classId: v.string(),
    day: v.union(v.literal("monday"), v.literal("tuesday"), v.literal("wednesday"), v.literal("thursday"), v.literal("friday")),
    period: v.number(), subjectId: v.string(), teacherId: v.string(),
    room: v.optional(v.string()), startTime: v.string(), endTime: v.string(),
    createdAt: v.number(), updatedAt: v.number(),
  }).index("by_tenant", ["tenantId"]).index("by_tenant_class", ["tenantId", "classId"]).index("by_tenant_teacher", ["tenantId", "teacherId"]).index("by_tenant_class_day", ["tenantId", "classId", "day"]),

  notifications: defineTable({
    tenantId: v.string(), userId: v.string(), type: v.string(), title: v.string(), content: v.string(),
    channel: v.union(v.literal("in_app"), v.literal("sms"), v.literal("email"), v.literal("push")),
    status: v.union(v.literal("pending"), v.literal("sent"), v.literal("failed"), v.literal("read")),
    sentAt: v.optional(v.number()), readAt: v.optional(v.number()), createdAt: v.number(),
  }).index("by_tenant", ["tenantId"]).index("by_tenant_user", ["tenantId", "userId"]).index("by_tenant_user_status", ["tenantId", "userId", "status"]).index("by_tenant_status", ["tenantId", "status"]),

  announcements: defineTable({
    tenantId: v.string(), title: v.string(), body: v.string(),
    audience: v.array(v.string()), channels: v.array(v.string()), sentBy: v.string(),
    sentAt: v.optional(v.number()),
    status: v.union(v.literal("draft"), v.literal("scheduled"), v.literal("sent")),
    scheduledFor: v.optional(v.number()), createdAt: v.number(), updatedAt: v.number(),
  }).index("by_tenant", ["tenantId"]).index("by_tenant_status", ["tenantId", "status"]).index("by_tenant_sent_at", ["tenantId", "sentAt"]),

  installedModules: defineTable({
    tenantId: v.string(), moduleId: v.string(), installedAt: v.number(), installedBy: v.string(),
    config: v.any(),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended")),
    updatedAt: v.number(),
  }).index("by_tenant", ["tenantId"]).index("by_tenant_module", ["tenantId", "moduleId"]).index("by_tenant_status", ["tenantId", "status"]),

  moduleRequests: defineTable({
    tenantId: v.string(), userId: v.string(), moduleId: v.string(), requestedAt: v.number(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    reviewedBy: v.optional(v.string()), reviewedAt: v.optional(v.number()), notes: v.optional(v.string()),
  }).index("by_tenant", ["tenantId"]).index("by_tenant_status", ["tenantId", "status"]).index("by_module", ["moduleId"]),
});
