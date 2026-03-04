import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sessions: defineTable({
    sessionToken: v.optional(v.string()),
    tenantId: v.string(),
    userId: v.string(),
    email: v.optional(v.string()),
    role: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    deviceInfo: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    permissions: v.optional(v.array(v.string())),
    workosUserId: v.optional(v.string()),
  })
    .index("by_token", ["sessionToken"])
    .index("by_userId", ["userId"]),

  auditLogs: defineTable({
    tenantId: v.string(),
    userId: v.string(),
    action: v.string(),
    targetId: v.optional(v.string()),
    targetType: v.optional(v.string()),
    details: v.any(),
    ipAddress: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId", "createdAt"])
    .index("by_user", ["userId", "createdAt"]),

  tenants: defineTable({
    tenantId: v.string(),
    name: v.string(),
    subdomain: v.string(),
    email: v.string(),
    phone: v.string(),
    plan: v.string(),
    status: v.string(),
    county: v.string(),
    country: v.string(),
    suspendedAt: v.optional(v.number()),
    suspendReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_subdomain", ["subdomain"])
    .index("by_status", ["status"]),

  impersonationSessions: defineTable({
    adminId: v.string(),
    targetUserId: v.string(),
    targetTenantId: v.string(),
    reason: v.string(),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    active: v.boolean(),
  })
    .index("by_admin", ["adminId"])
    .index("by_target", ["targetUserId"]),

  users: defineTable({
    tenantId: v.string(),
    eduMylesUserId: v.string(),
    workosUserId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.string(),
    permissions: v.array(v.string()),
    organizationId: v.id("organizations"),
    isActive: v.boolean(),
    avatarUrl: v.optional(v.string()),
    phone: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_workos_user", ["workosUserId"])
    .index("by_tenant_email", ["tenantId", "email"])
    .index("by_tenant_role", ["tenantId", "role"]),

  organizations: defineTable({
    tenantId: v.string(),
    workosOrgId: v.string(),
    name: v.string(),
    subdomain: v.string(),
    tier: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_workos_org", ["workosOrgId"])
    .index("by_subdomain", ["subdomain"])
    .index("by_tenant", ["tenantId"]),

  installedModules: defineTable({
    tenantId: v.string(),
    moduleId: v.string(),
    installedAt: v.number(),
    installedBy: v.string(),
    config: v.any(),
    status: v.string(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_module", ["tenantId", "moduleId"])
    .index("by_tenant_status", ["tenantId", "status"]),

  moduleRegistry: defineTable({
    moduleId: v.string(),
    name: v.string(),
    description: v.string(),
    tier: v.string(),
    category: v.string(),
    status: v.string(),
    version: v.string(),
  })
    .index("by_module_id", ["moduleId"])
    .index("by_status", ["status"]),

  moduleRequests: defineTable({
    tenantId: v.string(),
    userId: v.string(),
    moduleId: v.string(),
    requestedAt: v.number(),
    status: v.string(),
    reviewedBy: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    reason: v.optional(v.string()),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_module", ["moduleId"]),

  alumni: defineTable({
    tenantId: v.string(),
    userId: v.string(),
    studentId: v.optional(v.string()),
    graduationYear: v.number(),
    program: v.optional(v.string()),
    currentEmployer: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    linkedIn: v.optional(v.string()),
    bio: v.optional(v.string()),
    contactEmail: v.string(),
    contactPhone: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_year", ["tenantId", "graduationYear"])
    .index("by_user", ["userId"]),

  partners: defineTable({
    tenantId: v.string(),
    userId: v.string(),
    organizationName: v.string(),
    organizationType: v.string(),
    contactEmail: v.string(),
    contactPhone: v.optional(v.string()),
    sponsorshipTerms: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_user", ["userId"])
    .index("by_tenant_type", ["tenantId", "organizationType"]),

  sponsorships: defineTable({
    tenantId: v.string(),
    partnerId: v.string(),
    studentId: v.string(),
    amountCents: v.number(),
    currency: v.string(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    status: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_partner", ["partnerId"])
    .index("by_student", ["studentId"])
    .index("by_tenant_status", ["tenantId", "status"]),

  students: defineTable({
    tenantId: v.string(),
    admissionNumber: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.string(),
    gender: v.string(),
    classId: v.optional(v.string()),
    streamId: v.optional(v.string()),
    status: v.string(),
    guardianUserId: v.optional(v.string()),
    userId: v.optional(v.string()),
    enrolledAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_tenant_class", ["tenantId", "classId"])
    .index("by_admission", ["tenantId", "admissionNumber"])
    .index("by_user", ["userId"]),

  classes: defineTable({
    tenantId: v.string(),
    name: v.string(),
    level: v.optional(v.string()),
    stream: v.optional(v.string()),
    teacherId: v.optional(v.string()),
    capacity: v.optional(v.number()),
    academicYear: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_teacher", ["tenantId", "teacherId"])
    .index("by_tenant_grade", ["tenantId", "level"]),

  admissionApplications: defineTable({
    tenantId: v.string(),
    applicationId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.string(),
    gender: v.string(),
    requestedGrade: v.string(),
    guardianName: v.string(),
    guardianPhone: v.string(),
    guardianEmail: v.string(),
    documents: v.optional(v.array(v.string())),
    status: v.string(), // draft | submitted | under_review | accepted | rejected | waitlisted | enrolled
    notes: v.optional(v.string()),
    reviewedBy: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    submittedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_application_id", ["tenantId", "applicationId"]),

  guardians: defineTable({
    tenantId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    relationship: v.string(), // father | mother | guardian | other
    studentIds: v.array(v.string()),
    userId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_email", ["tenantId", "email"]),

  staff: defineTable({
    tenantId: v.string(),
    userId: v.optional(v.string()),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role: v.string(),
    department: v.optional(v.string()),
    employeeId: v.string(),
    qualification: v.optional(v.string()),
    joinDate: v.string(),
    status: v.string(), // active | inactive | on_leave | terminated
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_role", ["tenantId", "role"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_employee_id", ["tenantId", "employeeId"]),

  feeStructures: defineTable({
    tenantId: v.string(),
    name: v.string(),
    amount: v.number(),
    academicYear: v.string(),
    grade: v.string(),
    frequency: v.string(), // one_time | monthly | termly | yearly
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_grade", ["tenantId", "grade"])
    .index("by_tenant_academic_year", ["tenantId", "academicYear"]),

  invoices: defineTable({
    tenantId: v.string(),
    studentId: v.string(),
    feeStructureId: v.string(),
    amount: v.number(),
    status: v.string(), // pending | paid | partially_paid | cancelled
    dueDate: v.string(),
    issuedAt: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_student", ["tenantId", "studentId"])
    .index("by_tenant_status", ["tenantId", "status"]),

  payments: defineTable({
    tenantId: v.string(),
    invoiceId: v.string(),
    amount: v.number(),
    method: v.string(),
    reference: v.string(),
    status: v.string(),
    processedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_invoice", ["invoiceId"]),

  notifications: defineTable({
    tenantId: v.string(),
    userId: v.string(),
    title: v.string(),
    message: v.string(),
    type: v.string(),
    isRead: v.boolean(),
    link: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId", "createdAt"])
    .index("by_user_unread", ["userId", "isRead"])
    .index("by_tenant", ["tenantId", "createdAt"]),

  subjects: defineTable({
    tenantId: v.string(),
    name: v.string(),
    code: v.string(),
    department: v.optional(v.string()),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_code", ["tenantId", "code"]),

  assignments: defineTable({
    tenantId: v.string(),
    classId: v.string(),
    subjectId: v.string(),
    teacherId: v.string(),
    title: v.string(),
    description: v.string(),
    dueDate: v.string(),
    maxPoints: v.number(),
    status: v.string(), // active | archived | draft
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_class", ["classId"])
    .index("by_teacher", ["teacherId", "createdAt"]),

  submissions: defineTable({
    tenantId: v.string(),
    assignmentId: v.string(),
    studentId: v.string(),
    content: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    status: v.string(), // pending | submitted | graded | late
    grade: v.optional(v.number()),
    feedback: v.optional(v.string()),
    submittedAt: v.optional(v.number()),
    gradedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_assignment", ["assignmentId"])
    .index("by_student", ["studentId"]),

  grades: defineTable({
    tenantId: v.string(),
    studentId: v.string(),
    classId: v.string(),
    subjectId: v.string(),
    term: v.string(),
    academicYear: v.string(),
    score: v.number(),
    grade: v.string(),
    remarks: v.optional(v.string()),
    recordedBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_student", ["studentId", "term"])
    .index("by_class_subject", ["classId", "subjectId", "term"])
    .index("by_tenant_student", ["tenantId", "studentId"]),

  attendance: defineTable({
    tenantId: v.string(),
    classId: v.string(),
    studentId: v.string(),
    date: v.string(), // YYYY-MM-DD
    status: v.string(), // present | absent | late | excused
    remarks: v.optional(v.string()),
    recordedBy: v.string(),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_class_date", ["classId", "date"])
    .index("by_student_date", ["studentId", "date"]),

  timetables: defineTable({
    tenantId: v.string(),
    classId: v.string(),
    subjectId: v.string(),
    teacherId: v.string(),
    dayOfWeek: v.number(), // 1-7
    startTime: v.string(), // HH:mm
    endTime: v.string(), // HH:mm
    room: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_class", ["classId"])
    .index("by_teacher", ["teacherId"]),

  reportCards: defineTable({
    tenantId: v.string(),
    studentId: v.string(),
    term: v.string(),
    academicYear: v.string(),
    gpa: v.optional(v.number()),
    rank: v.optional(v.number()),
    fileUrl: v.optional(v.string()),
    status: v.string(), // generating | ready | published
    generatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_student_term", ["studentId", "term", "academicYear"]),
});
