import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Auth sessions — canonical field is sessionToken
  sessions: defineTable({
    sessionToken: v.optional(v.string()), // canonical session token
    token: v.optional(v.string()),        // legacy field kept for backward-compat; not indexed
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
    .index("by_token", ["sessionToken"])     // primary index — look up by sessionToken
    .index("by_userId", ["userId"]),

  auditLogs: defineTable({
    tenantId: v.string(),
    actorId: v.string(),
    actorEmail: v.string(),
    action: v.string(),
    entityId: v.string(),
    entityType: v.string(),
    before: v.optional(v.any()),
    after: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_tenant", ["tenantId", "timestamp"])
    .index("by_actor", ["actorId", "timestamp"])
    .index("by_entity", ["entityType", "entityId", "timestamp"]),

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
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    passwordHash: v.optional(v.string()),
    twoFactorEnabled: v.optional(v.boolean()),
    twoFactorSecret: v.optional(v.string()),
    tempTwoFactorSecret: v.optional(v.string()),
    recoveryCodes: v.optional(v.array(v.string())),
    lastPasswordChangeAt: v.optional(v.number()),
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

  passwordResetTokens: defineTable({
    userId: v.string(),
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    used: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),

  platformSettings: defineTable({
    section: v.string(),
    key: v.string(),
    value: v.string(),
    updatedBy: v.string(),
    updatedAt: v.number(),
  })
    .index("by_section_key", ["section", "key"]),

  loginAttempts: defineTable({
    email: v.string(),
    attempts: v.number(),
    lastAttemptAt: v.number(),
    lockedUntil: v.optional(v.number()),
  })
    .index("by_email", ["email"]),

  platformFiles: defineTable({
    tenantId: v.string(),
    uploadedBy: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    storageId: v.string(),
    fileUrl: v.string(),
    category: v.string(),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId", "createdAt"])
    .index("by_category", ["category", "createdAt"]),

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
    isCore: v.optional(v.boolean()),
    iconName: v.optional(v.string()),
    pricing: v.optional(v.object({
      monthly: v.number(),
      quarterly: v.optional(v.number()),
      annual: v.optional(v.number()),
      currency: v.string(),
    })),
    features: v.optional(v.array(v.string())),
    dependencies: v.optional(v.array(v.string())),
    documentation: v.optional(v.string()),
    support: v.optional(v.object({
      email: v.string(),
      phone: v.string(),
      responseTime: v.string(),
    })),
  })
    .index("by_module_id", ["moduleId"])
    .index("by_status", ["status"])
    .index("by_tier", ["tier"])
    .index("by_category", ["category"]),

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

  alumniEvents: defineTable({
    tenantId: v.string(),
    title: v.string(),
    description: v.string(),
    date: v.number(), // timestamp
    endDate: v.optional(v.number()),
    location: v.string(),
    capacity: v.optional(v.number()),
    rsvps: v.array(v.string()), // array of alumni user IDs
    status: v.string(), // upcoming | ongoing | completed | cancelled
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_tenant_date", ["tenantId", "date"]),

  transcriptRequests: defineTable({
    tenantId: v.string(),
    alumniId: v.string(), // ID from alumni table
    userId: v.string(),
    type: v.string(), // official | unofficial
    status: v.string(), // pending | processing | ready | rejected
    notes: v.optional(v.string()),
    issuedDate: v.optional(v.number()),
    fileUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_alumni", ["alumniId"])
    .index("by_tenant_status", ["tenantId", "status"]),

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
    userId: v.optional(v.string()),
    guardianUserId: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
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

  paymentCallbacks: defineTable({
    tenantId: v.string(),
    gateway: v.string(), // mpesa | stripe | airtel
    externalId: v.string(), // CheckoutRequestID, Stripe payment intent id, etc.
    invoiceId: v.optional(v.string()),
    amount: v.optional(v.number()),
    reference: v.optional(v.string()), // M-Pesa TransID, Stripe charge id
    payload: v.optional(v.any()),
    status: v.string(), // pending | completed | failed
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_external_id", ["gateway", "externalId"])
    .index("by_tenant_gateway", ["tenantId", "gateway"]),

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
    substituteTeacherId: v.optional(v.string()),
    dayOfWeek: v.number(), // 1-7
    startTime: v.string(), // HH:mm
    endTime: v.string(), // HH:mm
    room: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_class", ["classId"])
    .index("by_teacher", ["teacherId"])
    .index("by_room", ["tenantId", "room", "dayOfWeek"])
    .index("by_tenant_day", ["tenantId", "dayOfWeek"]),

  announcements: defineTable({
    tenantId: v.string(),
    title: v.string(),
    body: v.string(),
    audience: v.string(),
    priority: v.string(),
    status: v.string(),
    publishedAt: v.optional(v.number()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_tenant_created", ["tenantId", "createdAt"]),

  staffContracts: defineTable({
    tenantId: v.string(),
    staffId: v.string(),
    type: v.string(),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    salaryCents: v.optional(v.number()),
    currency: v.string(),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_staff", ["staffId"])
    .index("by_tenant_status", ["tenantId", "status"]),

  staffLeave: defineTable({
    tenantId: v.string(),
    staffId: v.string(),
    type: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    days: v.number(),
    status: v.string(),
    approvedBy: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_staff", ["staffId"])
    .index("by_tenant_status", ["tenantId", "status"]),

  payrollRuns: defineTable({
    tenantId: v.string(),
    periodLabel: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    status: v.string(),
    approvedBy: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_status", ["tenantId", "status"]),

  payslips: defineTable({
    tenantId: v.string(),
    payrollRunId: v.string(),
    staffId: v.string(),
    basicCents: v.number(),
    allowancesCents: v.number(),
    deductionsCents: v.number(),
    netCents: v.number(),
    currency: v.string(),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_payroll", ["payrollRunId"])
    .index("by_staff", ["staffId"]),

  books: defineTable({
    tenantId: v.string(),
    isbn: v.optional(v.string()),
    title: v.string(),
    author: v.string(),
    category: v.string(),
    quantity: v.number(),
    availableQuantity: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_isbn", ["tenantId", "isbn"])
    .index("by_tenant_category", ["tenantId", "category"]),

  bookBorrows: defineTable({
    tenantId: v.string(),
    bookId: v.string(),
    borrowerId: v.string(),
    borrowerType: v.string(),
    borrowedAt: v.number(),
    dueDate: v.number(),
    returnedAt: v.optional(v.number()),
    fineCents: v.optional(v.number()),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_book", ["bookId"])
    .index("by_borrower", ["borrowerId"])
    .index("by_tenant_status", ["tenantId", "status"]),

  transportRoutes: defineTable({
    tenantId: v.string(),
    name: v.string(),
    stops: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"]),

  vehicles: defineTable({
    tenantId: v.string(),
    plateNumber: v.string(),
    capacity: v.number(),
    routeId: v.optional(v.string()),
    driverId: v.optional(v.string()),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_status", ["tenantId", "status"]),

  transportAssignments: defineTable({
    tenantId: v.string(),
    studentId: v.string(),
    routeId: v.string(),
    stopIndex: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_student", ["studentId"])
    .index("by_route", ["routeId"]),

  drivers: defineTable({
    tenantId: v.string(),
    userId: v.optional(v.string()),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    vehicleId: v.optional(v.string()),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_status", ["tenantId", "status"]),

  wallets: defineTable({
    tenantId: v.string(),
    ownerId: v.string(),
    ownerType: v.string(),
    balanceCents: v.number(),
    currency: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_owner", ["tenantId", "ownerId"]),

  walletTransactions: defineTable({
    tenantId: v.string(),
    walletId: v.string(),
    type: v.string(),
    amountCents: v.number(),
    reference: v.optional(v.string()),
    orderId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_wallet", ["walletId", "createdAt"]),

  products: defineTable({
    tenantId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    priceCents: v.number(),
    stock: v.number(),
    category: v.optional(v.string()),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_status", ["tenantId", "status"]),

  orders: defineTable({
    tenantId: v.string(),
    orderNumber: v.string(),
    customerId: v.string(),
    customerType: v.string(),
    totalCents: v.number(),
    status: v.string(),
    paymentMethod: v.optional(v.string()),
    walletTransactionId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_customer", ["customerId"])
    .index("by_order_number", ["tenantId", "orderNumber"]),

  orderItems: defineTable({
    tenantId: v.string(),
    orderId: v.string(),
    productId: v.string(),
    quantity: v.number(),
    unitPriceCents: v.number(),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_order", ["orderId"]),

  carts: defineTable({
    tenantId: v.string(),
    customerId: v.string(),
    customerType: v.string(),
    items: v.array(v.object({
      productId: v.string(),
      quantity: v.number(),
      unitPriceCents: v.number(),
    })),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_customer", ["tenantId", "customerId"]),

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

  // Workflow Management System
  workflows: defineTable({
    tenantId: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("onboarding"),
      v.literal("offboarding"),
      v.literal("compliance"),
      v.literal("security"),
      v.literal("communications"),
      v.literal("data_management"),
      v.literal("approval"),
      v.literal("notification"),
      v.literal("integration")
    ),
    trigger: v.union(
      v.literal("manual"),
      v.literal("scheduled"),
      v.literal("event_based"),
      v.literal("webhook")
    ),
    triggerConfig: v.optional(v.record(v.string(), v.any())),
    steps: v.array(v.object({
      id: v.string(),
      name: v.string(),
      type: v.union(
        v.literal("action"),
        v.literal("condition"),
        v.literal("approval"),
        v.literal("notification"),
        v.literal("delay"),
        v.literal("integration"),
        v.literal("data_operation")
      ),
      config: v.record(v.string(), v.any()),
      position: v.number(),
    })),
    isActive: v.boolean(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    executionCount: v.number(),
    successRate: v.number(),
    averageDuration: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_category", ["tenantId", "category"])
    .index("by_status", ["tenantId", "isActive"]),

  workflowExecutions: defineTable({
    workflowId: v.string(),
    workflowName: v.string(),
    executionId: v.string(),
    status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed"), v.literal("cancelled")),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    duration: v.number(),
    triggeredBy: v.string(),
    triggerData: v.record(v.string(), v.any()),
    steps: v.array(v.object({
      id: v.string(),
      name: v.string(),
      type: v.string(),
      status: v.union(v.literal("pending"), v.literal("running"), v.literal("completed"), v.literal("failed")),
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
      duration: v.number(),
      output: v.optional(v.any()),
      error: v.optional(v.object({
        message: v.string(),
        timestamp: v.number(),
      })),
    })),
    error: v.optional(v.object({
      message: v.string(),
      stack: v.string(),
      timestamp: v.number(),
    })),
    tenantId: v.string(),
  })
    .index("by_workflow", ["workflowId"])
    .index("by_tenant", ["tenantId"])
    .index("by_status", ["tenantId", "status"])
    .index("by_executionId", ["executionId"]),

  // Payment Processing System
  paymentTransactions: defineTable({
    tenantId: v.string(),
    moduleId: v.string(),
    paymentMethod: v.union(v.literal("mpesa"), v.literal("card"), v.literal("bank_transfer")),
    billingCycle: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annual")),
    amount: v.number(),
    currency: v.string(),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("cancelled")),
    paymentReference: v.string(),
    paymentUrl: v.optional(v.string()),
    couponCode: v.optional(v.string()),
    discountAmount: v.number(),
    originalAmount: v.number(),
    initiatedAt: v.number(),
    processedAt: v.optional(v.number()),
    expiresAt: v.number(),
    initiatedBy: v.string(),
    metadata: v.optional(v.record(v.string(), v.any())),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_status", ["tenantId", "status"])
    .index("by_reference", ["paymentReference"])
    .index("by_module", ["moduleId"]),

  moduleSubscriptions: defineTable({
    tenantId: v.string(),
    moduleId: v.string(),
    transactionId: v.string(),
    billingCycle: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annual")),
    status: v.union(v.literal("active"), v.literal("cancelled"), v.literal("expired")),
    activatedAt: v.number(),
    expiresAt: v.number(),
    cancelledAt: v.optional(v.number()),
    cancelReason: v.optional(v.string()),
    autoRenew: v.boolean(),
    features: v.array(v.string()),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_status", ["tenantId", "status"])
    .index("by_module", ["moduleId"])
    .index("by_expiry", ["expiresAt"]),

  coupons: defineTable({
    code: v.string(),
    discountType: v.union(v.literal("percentage"), v.literal("fixed")),
    discountValue: v.number(),
    maxDiscount: v.optional(v.number()),
    minAmount: v.optional(v.number()),
    usageLimit: v.optional(v.number()),
    usedCount: v.number(),
    validFrom: v.number(),
    validUntil: v.number(),
    isActive: v.boolean(),
    createdBy: v.string(),
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_active", ["isActive", "validFrom", "validUntil"]),

  // Analytics and Reporting System
  reports: defineTable({
    tenantId: v.string(),
    name: v.string(),
    description: v.string(),
    reportType: v.union(
      v.literal("user_analytics"),
      v.literal("ticket_analytics"),
      v.literal("workflow_analytics"),
      v.literal("tenant_analytics"),
      v.literal("system_analytics"),
      v.literal("custom")
    ),
    config: v.object({
      timeRange: v.union(v.literal("1h"), v.literal("24h"), v.literal("7d"), v.literal("30d"), v.literal("90d")),
      filters: v.optional(v.record(v.string(), v.any())),
      metrics: v.array(v.string()),
      groupBy: v.optional(v.string()),
      chartType: v.union(v.literal("line"), v.literal("bar"), v.literal("pie"), v.literal("table")),
    }),
    schedule: v.optional(v.object({
      enabled: v.boolean(),
      frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
      recipients: v.array(v.string()),
    })),
    status: v.union(v.literal("created"), v.literal("generating"), v.literal("completed"), v.literal("failed")),
    createdBy: v.string(),
    createdAt: v.number(),
    lastGenerated: v.optional(v.number()),
    nextScheduled: v.optional(v.number()),
    data: v.optional(v.any()),
    lastExported: v.optional(v.number()),
    exportFormat: v.optional(v.union(v.literal("csv"), v.literal("excel"), v.literal("pdf"))),
    exportUrl: v.optional(v.string()),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_type", ["tenantId", "reportType"])
    .index("by_status", ["tenantId", "status"])
    .index("by_createdBy", ["tenantId", "createdBy"]),

  // Platform Operations Center - System Monitoring & Incident Management
  incidents: defineTable({
    tenantId: v.string(),
    title: v.string(),
    description: v.string(),
    severity: v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low")),
    status: v.union(v.literal("active"), v.literal("investigating"), v.literal("resolved"), v.literal("closed")),
    services: v.array(v.string()),
    impact: v.string(),
    assignedTo: v.optional(v.string()),
    tags: v.array(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    duration: v.optional(v.number()),
    resolution: v.optional(v.string()),
    resolvedBy: v.optional(v.string()),
    acknowledged: v.boolean(),
    acknowledgedAt: v.optional(v.number()),
    acknowledgedBy: v.optional(v.string()),
    notifications: v.array(v.string()),
    metrics: v.object({
      affectedUsers: v.number(),
      affectedTenants: v.number(),
      businessImpact: v.string(),
      recoveryTime: v.optional(v.number()),
    }),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_status", ["tenantId", "status"])
    .index("by_severity", ["tenantId", "severity"])
    .index("by_assignedTo", ["tenantId", "assignedTo"])
    .index("by_createdBy", ["tenantId", "createdBy"])
    .index("by_createdAt", ["createdAt"]),

  incidentTimeline: defineTable({
    incidentId: v.string(),
    type: v.union(v.literal("status_change"), v.literal("note"), v.literal("action"), v.literal("notification")),
    message: v.string(),
    metadata: v.optional(v.any()),
    internal: v.boolean(),
    createdBy: v.string(),
    tenantId: v.string(),
    createdAt: v.number(),
  })
    .index("by_incidentId", ["incidentId"])
    .index("by_tenant", ["tenantId"])
    .index("by_createdAt", ["createdAt"]),

  maintenanceWindows: defineTable({
    tenantId: v.string(),
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("scheduled"), v.literal("in_progress"), v.literal("completed"), v.literal("cancelled")),
    scheduledStart: v.number(),
    scheduledEnd: v.number(),
    actualStart: v.optional(v.number()),
    actualEnd: v.optional(v.number()),
    impact: v.union(v.literal("no_impact"), v.literal("degraded_performance"), v.literal("service_unavailable")),
    affectedServices: v.array(v.string()),
    notificationChannels: v.array(v.string()),
    autoNotify: v.boolean(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    notifications: v.array(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_status", ["tenantId", "status"])
    .index("by_scheduledStart", ["scheduledStart"])
    .index("by_createdBy", ["tenantId", "createdBy"]),

  operationsAlerts: defineTable({
    tenantId: v.string(),
    type: v.union(v.literal("system"), v.literal("security"), v.literal("performance"), v.literal("capacity")),
    title: v.string(),
    description: v.string(),
    severity: v.union(v.literal("critical"), v.literal("warning"), v.literal("info")),
    status: v.union(v.literal("active"), v.literal("resolved")),
    source: v.string(),
    metrics: v.optional(v.record(v.string(), v.any())),
    autoResolve: v.boolean(),
    resolveCondition: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.string()),
    resolution: v.optional(v.string()),
    acknowledgements: v.array(v.string()),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_type", ["tenantId", "type"])
    .index("by_severity", ["tenantId", "severity"])
    .index("by_status", ["tenantId", "status"])
    .index("by_createdAt", ["createdAt"])
    .index("by_source", ["source"]),

  alertAcknowledgements: defineTable({
    alertId: v.string(),
    userId: v.string(),
    notes: v.string(),
    acknowledgedAt: v.number(),
    tenantId: v.string(),
  })
    .index("by_alertId", ["alertId"])
    .index("by_userId", ["userId", "acknowledgedAt"]),

  alertSuppressions: defineTable({
    alertType: v.string(),
    source: v.string(),
    condition: v.string(),
    suppressedBy: v.string(),
    suppressedAt: v.number(),
    expiresAt: v.number(),
    tenantId: v.string(),
  })
    .index("by_type_source", ["alertType", "source"])
    .index("by_expiresAt", ["expiresAt"])
    .index("by_tenant", ["tenantId"]),

  scheduledNotifications: defineTable({
    maintenanceId: v.string(),
    type: v.string(),
    scheduledFor: v.number(),
    message: v.string(),
    channels: v.array(v.string()),
    status: v.union(v.literal("pending"), v.literal("sent"), v.literal("failed")),
    tenantId: v.string(),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_status", ["tenantId", "status"])
    .index("by_scheduledFor", ["scheduledFor"]),

  systemHealth: defineTable({
    tenantId: v.string(),
    overall: v.string(),
    score: v.number(),
    lastChecked: v.number(),
    services: v.array(v.object({
      name: v.string(),
      status: v.string(),
      responseTime: v.number(),
      uptime: v.number(),
      lastCheck: v.number(),
      metrics: v.record(v.string(), v.any()),
    })),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_overall", ["tenantId", "overall"])
    .index("by_lastChecked", ["lastChecked"]),

  // Advanced Security Dashboard - Threat Detection & Security Monitoring
  threats: defineTable({
    tenantId: v.string(),
    type: v.union(
      v.literal("malware"),
      v.literal("phishing"),
      v.literal("brute_force"),
      v.literal("ddos"),
      v.literal("injection"),
      v.literal("xss"),
      v.literal("social_engineering"),
      v.literal("insider_threat")
    ),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    status: v.union(v.literal("active"), v.literal("mitigating"), v.literal("resolved"), v.literal("false_positive")),
    source: v.object({
      ip: v.string(),
      country: v.string(),
      userAgent: v.optional(v.string()),
      email: v.optional(v.string()),
    }),
    target: v.object({
      system: v.string(),
      user: v.optional(v.string()),
      data: v.optional(v.string()),
    }),
    detectedAt: v.number(),
    mitigatedAt: v.optional(v.number()),
    description: v.string(),
    indicators: v.array(v.string()),
    confidence: v.number(),
    falsePositive: v.optional(v.boolean()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_type", ["tenantId", "type"])
    .index("by_severity", ["tenantId", "severity"])
    .index("by_status", ["tenantId", "status"])
    .index("by_detectedAt", ["detectedAt"]),

  threatAcknowledgements: defineTable({
    threatId: v.string(),
    userId: v.string(),
    notes: v.string(),
    acknowledgedAt: v.number(),
    tenantId: v.string(),
  })
    .index("by_threatId", ["threatId"])
    .index("by_userId", ["userId", "acknowledgedAt"]),

  threatMitigations: defineTable({
    threatId: v.string(),
    action: v.string(),
    implementedBy: v.string(),
    implementedAt: v.number(),
    effectiveness: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    verified: v.boolean(),
    tenantId: v.string(),
    createdAt: v.number(),
  })
    .index("by_threatId", ["threatId"])
    .index("by_tenant", ["tenantId"]),

  blockedIPs: defineTable({
    ip: v.string(),
    reason: v.string(),
    blockedBy: v.string(),
    blockedAt: v.number(),
    expiresAt: v.number(),
    threatId: v.optional(v.string()),
    tenantId: v.string(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_ip", ["ip"])
    .index("by_expiresAt", ["expiresAt"]),

  securityIncidents: defineTable({
    tenantId: v.string(),
    title: v.string(),
    description: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    category: v.union(
      v.literal("unauthorized_access"),
      v.literal("data_breach"),
      v.literal("malware"),
      v.literal("phishing"),
      v.literal("denial_of_service"),
      v.literal("vulnerability"),
      v.literal("policy_violation"),
      v.literal("other")
    ),
    status: v.union(v.literal("open"), v.literal("investigating"), v.literal("contained"), v.literal("resolved"), v.literal("closed")),
    affectedSystems: v.array(v.string()),
    affectedTenants: v.array(v.string()),
    discoveredAt: v.number(),
    reportedAt: v.number(),
    reportedBy: v.string(),
    assignee: v.optional(v.string()),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    duration: v.optional(v.number()),
    resolution: v.optional(v.string()),
    resolvedBy: v.optional(v.string()),
    impactAssessment: v.object({
      affectedUsers: v.number(),
      dataExposed: v.boolean(),
      systemIntegrity: v.string(),
      businessImpact: v.string(),
    }),
    mitigations: v.array(v.string()),
    rootCause: v.optional(v.string()),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_status", ["tenantId", "status"])
    .index("by_category", ["tenantId", "category"])
    .index("by_severity", ["tenantId", "severity"])
    .index("by_reportedBy", ["tenantId", "reportedBy"])
    .index("by_createdAt", ["createdAt"]),

  securityIncidentTimeline: defineTable({
    incidentId: v.string(),
    type: v.union(v.literal("status_change"), v.literal("note"), v.literal("action"), v.literal("notification")),
    message: v.string(),
    metadata: v.optional(v.any()),
    createdBy: v.string(),
    tenantId: v.string(),
    createdAt: v.number(),
  })
    .index("by_incidentId", ["incidentId"])
    .index("by_tenant", ["tenantId"])
    .index("by_createdAt", ["createdAt"]),

  securityNotifications: defineTable({
    type: v.string(),
    title: v.string(),
    message: v.string(),
    incidentId: v.optional(v.string()),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    status: v.union(v.literal("unread"), v.literal("read")),
    sentTo: v.string(),
    sentBy: v.string(),
    tenantId: v.string(),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_type", ["tenantId", "type"])
    .index("by_status", ["tenantId", "status"])
    .index("by_createdAt", ["createdAt"]),

  vulnerabilityScans: defineTable({
    type: v.union(v.literal("quick"), v.literal("standard"), v.literal("comprehensive")),
    status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed")),
    targets: v.array(v.string()),
    initiatedBy: v.string(),
    tenantId: v.string(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    vulnerabilitiesFound: v.number(),
    highRiskVulnerabilities: v.number(),
    mediumRiskVulnerabilities: v.number(),
    lowRiskVulnerabilities: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_status", ["tenantId", "status"])
    .index("by_type", ["tenantId", "type"])
    .index("by_initiatedBy", ["tenantId", "initiatedBy"])
    .index("by_startedAt", ["startedAt"]),

  vulnerabilities: defineTable({
    scanId: v.string(),
    id: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    category: v.string(),
    title: v.string(),
    description: v.string(),
    affectedSystem: v.string(),
    cveId: v.optional(v.string()),
    riskScore: v.number(),
    recommendation: v.string(),
    tenantId: v.string(),
    createdAt: v.number(),
  })
    .index("by_scanId", ["scanId"])
    .index("by_severity", ["tenantId", "severity"])
    .index("by_category", ["tenantId", "category"]),

  // Integration Marketplace - Third-party App Integration
  integrations: defineTable({
    tenantId: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("crm"),
      v.literal("communication"),
      v.literal("analytics"),
      v.literal("payment"),
      v.literal("storage"),
      v.literal("security"),
      v.literal("productivity"),
      v.literal("development"),
      v.literal("other")
    ),
    type: v.union(v.literal("webhook"), v.literal("api"), v.literal("oauth"), v.literal("database")),
    isCustom: v.boolean(),
    isPublic: v.boolean(),
    isFeatured: v.boolean(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("deprecated")),
    configuration: v.record(v.string(), v.any()),
    endpoints: v.array(v.object({
      name: v.string(),
      url: v.string(),
      method: v.union(v.literal("GET"), v.literal("POST"), v.literal("PUT"), v.literal("DELETE")),
      authentication: v.object({
        type: v.union(v.literal("none"), v.literal("api_key"), v.literal("oauth"), v.literal("basic")),
        credentials: v.optional(v.record(v.string(), v.any())),
      }),
    })),
    webhookUrl: v.optional(v.string()),
    documentationUrl: v.optional(v.string()),
    supportEmail: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
    usage: v.object({
      installs: v.number(),
      apiCalls: v.number(),
      dataTransferred: v.number(),
    }),
    pricing: v.object({
      type: v.union(v.literal("free"), v.literal("paid"), v.literal("freemium")),
      amount: v.number(),
      currency: v.string(),
      billingCycle: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annual")),
    }),
    defaultPlan: v.union(v.literal("free"), v.literal("basic"), v.literal("pro"), v.literal("enterprise")),
    features: v.array(v.string()),
    requirements: v.array(v.string()),
    limitations: v.array(v.string()),
    tags: v.array(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_type", ["type"])
    .index("by_featured", ["isFeatured"])
    .index("by_createdBy", ["tenantId", "createdBy"])
    .index("by_createdAt", ["createdAt"]),

  integrationInstallations: defineTable({
    tenantId: v.string(),
    integrationId: v.string(),
    configuration: v.record(v.string(), v.any()),
    status: v.union(v.literal("installed"), v.literal("active"), v.literal("disabled"), v.literal("error"), v.literal("uninstalled")),
    installedBy: v.string(),
    installedAt: v.number(),
    lastSyncAt: v.optional(v.number()),
    syncStatus: v.union(v.literal("pending"), v.literal("running"), v.literal("completed"), v.literal("failed")),
    usage: v.object({
      apiCalls: v.number(),
      dataTransferred: v.number(),
      errors: v.number(),
    }),
    subscription: v.object({
      plan: v.union(v.literal("free"), v.literal("basic"), v.literal("pro"), v.literal("enterprise")),
      status: v.union(v.literal("active"), v.literal("cancelled"), v.literal("expired")),
      billingCycle: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annual")),
      amount: v.number(),
      currency: v.string(),
      features: v.array(v.string()),
      startedAt: v.number(),
      expiresAt: v.optional(v.number()),
      lastBilledAt: v.optional(v.number()),
    }),
    updatedAt: v.number(),
    uninstalledAt: v.optional(v.number()),
    uninstalledBy: v.optional(v.string()),
    uninstalledReason: v.optional(v.string()),
    keepData: v.boolean(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_integration", ["tenantId", "integrationId"])
    .index("by_status", ["tenantId", "status"])
    .index("by_installedBy", ["tenantId", "installedBy"])
    .index("by_installedAt", ["installedAt"]),

  integrationInstallationTimeline: defineTable({
    installationId: v.string(),
    type: v.union(
      v.literal("installed"),
      v.literal("configured"),
      v.literal("enabled"),
      v.literal("disabled"),
      v.literal("sync_started"),
      v.literal("sync_completed"),
      v.literal("test_connection"),
      v.literal("uninstalled"),
      v.literal("subscription_updated"),
      v.literal("activated")
    ),
    message: v.string(),
    metadata: v.optional(v.any()),
    userId: v.string(),
    tenantId: v.string(),
    createdAt: v.number(),
  })
    .index("by_installationId", ["installationId"])
    .index("by_tenant", ["tenantId"])
    .index("by_type", ["tenantId", "type"])
    .index("by_createdAt", ["createdAt"]),

  // Ticket Management System - Module 04
  tickets: defineTable({
    tenantId: v.string(),
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
    // AI Analysis fields
    aiAnalysis: v.optional(v.object({
      sentiment: v.object({
        sentiment: v.string(),
        confidence: v.number(),
        emotions: v.array(v.string()),
        keyPhrases: v.array(v.string()),
        urgency: v.string(),
        escalationRecommended: v.boolean(),
      }),
      analyzedAt: v.number(),
      analyzedBy: v.string(),
    })),
    aiCategorization: v.optional(v.object({
      category: v.string(),
      confidence: v.number(),
      priority: v.string(),
      reasoning: v.string(),
      alternatives: v.array(v.string()),
      factors: v.array(v.string()),
      escalation: v.object({
        recommended: v.boolean(),
        confidence: v.number(),
        reason: v.string(),
        suggestedLevel: v.string(),
      }),
    })),
    categorizedAt: v.optional(v.number()),
    categorizedBy: v.optional(v.string()),
    escalatedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"]).index("by_status", ["status"])
    .index("by_priority", ["priority"]).index("by_assigned", ["assignedTo"])
    .index("by_sla", ["slaResolutionDL"]),

  ticketComments: defineTable({
    ticketId: v.id("tickets"),
    authorId: v.string(),
    authorEmail: v.string(),
    authorRole: v.string(),
    content: v.string(),
    isInternal: v.boolean(),
    attachments: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_ticket", ["ticketId"])
    .index("by_author", ["authorId"]),

  cannedResponses: defineTable({
    title: v.string(),
    content: v.string(),
    category: v.union(v.literal("billing"), v.literal("technical"), v.literal("data"),
      v.literal("feature"), v.literal("onboarding"), v.literal("account"),
      v.literal("legal"), v.literal("other")),
    variables: v.optional(v.array(v.string())), // Variable names like {{school_name}}
    isActive: v.boolean(),
    usageCount: v.number(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_active", ["isActive"]),

  slaRules: defineTable({
    category: v.union(v.literal("billing"), v.literal("technical"), v.literal("data"),
      v.literal("feature"), v.literal("onboarding"), v.literal("account"),
      v.literal("legal"), v.literal("other")),
    priority: v.union(v.literal("P0"), v.literal("P1"), v.literal("P2"), v.literal("P3")),
    firstResponseHours: v.number(),
    resolutionHours: v.number(),
    escalationChain: v.optional(v.array(v.string())), // Role escalation chain
    isActive: v.boolean(),
    updatedBy: v.string(),
    updatedAt: v.number(),
  })
    .index("by_category_priority", ["category", "priority"])
    .index("by_active", ["isActive"]),

  // ── Module Marketplace ──────────────────────────────────────────────

  // Marketplace module listings (published by Mylesoft or third-party devs)
  marketplaceModules: defineTable({
    moduleId: v.string(), // UUID
    name: v.string(), // max 60 chars
    shortDescription: v.string(), // max 120 chars
    fullDescription: v.string(), // rich text, max 5000 chars
    category: v.union(
      v.literal("academic_tools"), v.literal("communication"),
      v.literal("finance_fees"), v.literal("analytics_bi"),
      v.literal("content_packs"), v.literal("integrations"),
      v.literal("ai_automation"), v.literal("accessibility"),
      v.literal("administration"), v.literal("security_compliance")
    ),
    subCategory: v.optional(v.string()),
    tags: v.array(v.string()),
    iconUrl: v.optional(v.string()), // 512x512 PNG/SVG
    screenshots: v.array(v.string()), // URLs, min 2 max 10
    demoVideoUrl: v.optional(v.string()),
    featureHighlights: v.array(v.string()), // up to 8 bullet points
    version: v.string(), // semver
    edumylesMinVersion: v.optional(v.string()),
    edumylesMaxVersion: v.optional(v.string()),
    permissions: v.array(v.string()), // data scopes requested
    supportsOffline: v.boolean(),
    dataResidency: v.array(v.string()), // country codes
    // Pricing
    pricingModel: v.union(
      v.literal("free"), v.literal("freemium"), v.literal("one_time"),
      v.literal("monthly"), v.literal("annual"), v.literal("per_student"),
      v.literal("per_user"), v.literal("free_trial")
    ),
    priceCents: v.optional(v.number()),
    currency: v.optional(v.string()),
    trialDays: v.optional(v.number()), // 7-30
    pricingTiers: v.optional(v.array(v.object({
      name: v.string(),
      priceCents: v.number(),
      features: v.array(v.string()),
    }))),
    // Compatibility
    compatiblePlans: v.array(v.string()), // starter, growth, enterprise etc
    systemRequirements: v.optional(v.string()),
    // Publisher
    publisherId: v.string(),
    publisherName: v.string(),
    // Support
    supportUrl: v.optional(v.string()),
    documentationUrl: v.optional(v.string()),
    privacyPolicyUrl: v.optional(v.string()),
    // Aggregate stats (denormalized for perf)
    totalInstalls: v.number(),
    activeInstalls: v.number(),
    averageRating: v.number(),
    totalReviews: v.number(),
    // Lifecycle
    status: v.union(
      v.literal("draft"), v.literal("pending_review"), v.literal("approved"),
      v.literal("published"), v.literal("suspended"), v.literal("deprecated"),
      v.literal("rejected")
    ),
    reviewNotes: v.optional(v.string()),
    reviewedBy: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    deprecatedAt: v.optional(v.number()),
    deprecationNotice: v.optional(v.string()),
    isFeatured: v.boolean(),
    featuredUntil: v.optional(v.number()),
    // Trust badges
    isVerified: v.boolean(),
    isSecurityReviewed: v.boolean(),
    isGdprCompliant: v.boolean(),
    lastSecurityReviewAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_moduleId", ["moduleId"])
    .index("by_status", ["status"])
    .index("by_category", ["category", "status"])
    .index("by_publisher", ["publisherId"])
    .index("by_featured", ["isFeatured", "status"]),

  // Module version history / changelog
  marketplaceModuleVersions: defineTable({
    moduleId: v.string(),
    version: v.string(),
    releaseNotes: v.string(),
    packageSize: v.optional(v.number()), // bytes
    packageHash: v.optional(v.string()), // SHA-256
    storageId: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("pending_review"), v.literal("approved"), v.literal("published"), v.literal("rejected")),
    reviewedBy: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_module", ["moduleId", "createdAt"])
    .index("by_module_version", ["moduleId", "version"]),

  // Developer / publisher accounts
  marketplacePublishers: defineTable({
    userId: v.string(), // platform user id
    legalName: v.string(),
    entityType: v.union(v.literal("individual"), v.literal("organization")),
    country: v.string(),
    businessRegistration: v.optional(v.string()),
    taxId: v.optional(v.string()),
    payoutMethod: v.union(v.literal("mpesa"), v.literal("bank_transfer"), v.literal("paypal")),
    payoutDetails: v.string(), // JSON string of payment details
    verificationLevel: v.union(v.literal("basic"), v.literal("verified"), v.literal("featured_partner")),
    totalModules: v.number(),
    totalInstalls: v.number(),
    totalEarningsCents: v.number(),
    pendingPayoutCents: v.number(),
    averageRating: v.number(),
    agreementAcceptedAt: v.number(),
    isActive: v.boolean(),
    suspendedReason: v.optional(v.string()),
    contactEmail: v.string(),
    contactPhone: v.optional(v.string()),
    website: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_verification", ["verificationLevel"])
    .index("by_active", ["isActive"]),

  // Module installations per tenant
  marketplaceInstallations: defineTable({
    tenantId: v.string(),
    moduleId: v.string(),
    installedVersion: v.string(),
    // Lifecycle state
    status: v.union(
      v.literal("active"), v.literal("degraded"), v.literal("suspended_non_payment"),
      v.literal("update_available"), v.literal("update_required"),
      v.literal("deprecated"), v.literal("uninstalled")
    ),
    // Licensing
    licenseType: v.string(), // matches module pricingModel
    licenseExpiresAt: v.optional(v.number()),
    trialEndsAt: v.optional(v.number()),
    isTrialUsed: v.boolean(),
    // Billing
    lastPaymentAt: v.optional(v.number()),
    nextBillingAt: v.optional(v.number()),
    monthlyCostCents: v.optional(v.number()),
    // Config & access
    configuration: v.optional(v.any()),
    assignedRoles: v.array(v.string()), // which roles have access
    // Usage tracking
    lastUsedAt: v.optional(v.number()),
    totalApiCalls: v.number(),
    activeUsers: v.number(),
    // Install metadata
    installedBy: v.string(),
    installedAt: v.number(),
    uninstalledAt: v.optional(v.number()),
    uninstalledBy: v.optional(v.string()),
    uninstallReason: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_module", ["tenantId", "moduleId"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_module", ["moduleId"]),

  // Reviews & ratings
  marketplaceReviews: defineTable({
    moduleId: v.string(),
    tenantId: v.string(),
    reviewerId: v.string(),
    reviewerEmail: v.string(),
    reviewerRole: v.string(), // admin, teacher
    rating: v.number(), // 1-5
    content: v.string(), // 50-2000 chars
    tags: v.array(v.string()), // e.g. "Easy to Use", "Good Support"
    // Moderation
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    moderatedBy: v.optional(v.string()),
    moderatedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),
    // Publisher response
    publisherResponse: v.optional(v.string()),
    publisherRespondedAt: v.optional(v.number()),
    // Helpfulness
    helpfulVotes: v.number(),
    unhelpfulVotes: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_module", ["moduleId", "status"])
    .index("by_tenant_module", ["tenantId", "moduleId"])
    .index("by_reviewer", ["reviewerId"])
    .index("by_status", ["status"]),

  // Marketplace categories (admin-managed taxonomy)
  marketplaceCategories: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    parentSlug: v.optional(v.string()), // for sub-categories
    iconName: v.optional(v.string()), // lucide icon name
    sortOrder: v.number(),
    moduleCount: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_parent", ["parentSlug"])
    .index("by_active", ["isActive", "sortOrder"]),

  // Featured placements / curated collections
  marketplaceFeatured: defineTable({
    type: v.union(v.literal("banner"), v.literal("staff_pick"), v.literal("collection")),
    title: v.string(),
    description: v.optional(v.string()),
    moduleIds: v.array(v.string()),
    imageUrl: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type", "isActive"])
    .index("by_active_date", ["isActive", "startDate", "endDate"]),

  // Revenue / payout tracking
  marketplaceTransactions: defineTable({
    moduleId: v.string(),
    publisherId: v.string(),
    tenantId: v.string(),
    installationId: v.string(),
    type: v.union(
      v.literal("purchase"), v.literal("subscription"), v.literal("renewal"),
      v.literal("refund"), v.literal("trial_conversion")
    ),
    grossAmountCents: v.number(),
    commissionCents: v.number(),
    netAmountCents: v.number(),
    commissionRate: v.number(), // 0.20, 0.25, 0.30
    currency: v.string(),
    paymentMethod: v.optional(v.string()), // mpesa, stripe, bank
    paymentReference: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("refunded")),
    createdAt: v.number(),
  })
    .index("by_publisher", ["publisherId", "createdAt"])
    .index("by_module", ["moduleId", "createdAt"])
    .index("by_tenant", ["tenantId", "createdAt"])
    .index("by_status", ["status"]),

  // Publisher payouts
  marketplacePayouts: defineTable({
    publisherId: v.string(),
    amountCents: v.number(),
    currency: v.string(),
    payoutMethod: v.string(),
    payoutReference: v.optional(v.string()),
    transactionIds: v.array(v.string()), // which transactions are included
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    periodStart: v.number(),
    periodEnd: v.number(),
    processedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_publisher", ["publisherId", "createdAt"])
    .index("by_status", ["status"]),

  // Marketplace activity log (installs, reviews, purchases etc)
  marketplaceActivity: defineTable({
    type: v.union(
      v.literal("install"), v.literal("uninstall"), v.literal("update"),
      v.literal("review"), v.literal("purchase"), v.literal("refund"),
      v.literal("submission"), v.literal("approval"), v.literal("rejection"),
      v.literal("suspension"), v.literal("featured")
    ),
    moduleId: v.optional(v.string()),
    moduleName: v.optional(v.string()),
    publisherId: v.optional(v.string()),
    tenantId: v.optional(v.string()),
    tenantName: v.optional(v.string()),
    actorId: v.string(),
    actorEmail: v.string(),
    details: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_module", ["moduleId", "createdAt"])
    .index("by_tenant", ["tenantId", "createdAt"])
    .index("by_type", ["type", "createdAt"])
    .index("by_created", ["createdAt"]),

  // Module installation requests (from teachers to admins)
  marketplaceInstallRequests: defineTable({
    tenantId: v.string(),
    moduleId: v.string(),
    requestedBy: v.string(),
    requestedByEmail: v.string(),
    reason: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("denied")),
    reviewedBy: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    reviewNotes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId", "status"])
    .index("by_module", ["moduleId"]),

  // Marketplace disputes
  marketplaceDisputes: defineTable({
    moduleId: v.string(),
    tenantId: v.string(),
    installationId: v.string(),
    transactionId: v.optional(v.string()),
    type: v.union(v.literal("refund"), v.literal("policy_violation"), v.literal("technical_failure"), v.literal("other")),
    description: v.string(),
    evidence: v.optional(v.array(v.string())),
    status: v.union(v.literal("open"), v.literal("under_review"), v.literal("resolved"), v.literal("dismissed")),
    resolution: v.optional(v.string()),
    resolvedBy: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    filedBy: v.string(),
    filedByEmail: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_module", ["moduleId"])
    .index("by_tenant", ["tenantId"])
    .index("by_status", ["status"]),

  // ─── Premium Communication Module Tables ────────────────────────────

  /** Message templates for email, SMS, push, and in-app channels */
  messageTemplates: defineTable({
    tenantId: v.optional(v.string()), // null = platform-level (global) template
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(), // onboarding | marketing | system | alerts | academic | finance | custom
    channels: v.array(v.string()), // email | sms | push | in_app
    subject: v.optional(v.string()), // email subject
    content: v.string(), // message body with {{variable}} placeholders
    htmlContent: v.optional(v.string()), // rich HTML content for email
    variables: v.array(v.object({
      name: v.string(),
      type: v.string(), // text | date | time | number | url
      defaultValue: v.optional(v.string()),
      required: v.boolean(),
    })),
    isGlobal: v.optional(v.boolean()), // platform-wide template
    status: v.string(), // active | archived | draft
    usageCount: v.optional(v.number()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_category", ["category"])
    .index("by_global", ["isGlobal", "status"])
    .index("by_tenant_status", ["tenantId", "status"]),

  /** Campaigns for broadcast messaging across channels */
  campaigns: defineTable({
    tenantId: v.optional(v.string()), // null = platform-level campaign
    name: v.string(),
    description: v.optional(v.string()),
    channels: v.array(v.string()), // email | sms | push | in_app
    status: v.string(), // draft | scheduled | running | paused | completed | cancelled
    message: v.string(),
    subject: v.optional(v.string()),
    htmlContent: v.optional(v.string()),
    templateId: v.optional(v.id("messageTemplates")),
    targetAudience: v.object({
      type: v.string(), // all | by_tenant | by_role | by_status | custom
      tenantIds: v.optional(v.array(v.string())),
      roles: v.optional(v.array(v.string())),
      tenantStatuses: v.optional(v.array(v.string())), // active | trial | suspended
      tenantPlans: v.optional(v.array(v.string())), // free | starter | standard | pro | enterprise
      excludeTenantIds: v.optional(v.array(v.string())),
    }),
    scheduledFor: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    isPlatformLevel: v.optional(v.boolean()),
    stats: v.optional(v.object({
      totalRecipients: v.number(),
      sent: v.number(),
      delivered: v.number(),
      opened: v.number(),
      clicked: v.number(),
      failed: v.number(),
      bounced: v.number(),
    })),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId", "createdAt"])
    .index("by_status", ["status", "createdAt"])
    .index("by_platform", ["isPlatformLevel", "status"])
    .index("by_scheduled", ["status", "scheduledFor"]),

  /** Individual message records for tracking delivery per recipient */
  messageRecords: defineTable({
    tenantId: v.string(),
    campaignId: v.optional(v.id("campaigns")),
    channel: v.string(), // email | sms | push | in_app
    recipientId: v.string(), // userId
    recipientEmail: v.optional(v.string()),
    recipientPhone: v.optional(v.string()),
    subject: v.optional(v.string()),
    content: v.string(),
    status: v.string(), // queued | sending | sent | delivered | opened | clicked | failed | bounced
    externalId: v.optional(v.string()), // provider message ID
    errorMessage: v.optional(v.string()),
    sentAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    openedAt: v.optional(v.number()),
    clickedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId", "createdAt"])
    .index("by_campaign", ["campaignId", "status"])
    .index("by_recipient", ["recipientId", "createdAt"])
    .index("by_channel_status", ["channel", "status"])
    .index("by_status", ["status", "createdAt"]),

  /** Direct messages between users (1:1 or group conversations) */
  conversations: defineTable({
    tenantId: v.string(),
    type: v.string(), // direct | group
    name: v.optional(v.string()), // for group conversations
    participants: v.array(v.string()), // userIds
    lastMessageAt: v.optional(v.number()),
    lastMessagePreview: v.optional(v.string()),
    isPlatformThread: v.optional(v.boolean()), // cross-tenant platform thread
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId", "lastMessageAt"])
    .index("by_platform", ["isPlatformThread", "lastMessageAt"]),

  /** Messages within conversations */
  directMessages: defineTable({
    tenantId: v.string(),
    conversationId: v.id("conversations"),
    senderId: v.string(),
    senderName: v.optional(v.string()),
    senderRole: v.optional(v.string()),
    content: v.string(),
    attachments: v.optional(v.array(v.object({
      name: v.string(),
      url: v.string(),
      type: v.string(),
      size: v.optional(v.number()),
    }))),
    isEdited: v.optional(v.boolean()),
    isDeleted: v.optional(v.boolean()),
    readBy: v.optional(v.array(v.string())), // userIds who read the message
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_conversation", ["conversationId", "createdAt"])
    .index("by_sender", ["senderId", "createdAt"]),

  /** User notification preferences */
  notificationPreferences: defineTable({
    tenantId: v.string(),
    userId: v.string(),
    emailEnabled: v.optional(v.boolean()),
    smsEnabled: v.optional(v.boolean()),
    pushEnabled: v.optional(v.boolean()),
    inAppEnabled: v.optional(v.boolean()),
    quietHoursStart: v.optional(v.string()), // HH:mm
    quietHoursEnd: v.optional(v.string()), // HH:mm
    categories: v.optional(v.object({
      announcements: v.optional(v.boolean()),
      academic: v.optional(v.boolean()),
      finance: v.optional(v.boolean()),
      system: v.optional(v.boolean()),
      marketing: v.optional(v.boolean()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_tenant", ["tenantId"]),

  /** Contact lists / recipient groups for targeting */
  contactLists: defineTable({
    tenantId: v.optional(v.string()), // null = platform-level
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(), // role | tenant | custom | dynamic
    isPlatformLevel: v.optional(v.boolean()),
    criteria: v.object({
      roles: v.optional(v.array(v.string())),
      tenantIds: v.optional(v.array(v.string())),
      tenantStatuses: v.optional(v.array(v.string())),
      tenantPlans: v.optional(v.array(v.string())),
    }),
    memberCount: v.optional(v.number()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_platform", ["isPlatformLevel"])
    .index("by_type", ["type"]),

  // ─── Workflow Templates ────────────────────────────────────────────────────
  workflowTemplates: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.string(),
    templateSteps: v.array(v.object({
      id: v.string(),
      name: v.string(),
      type: v.string(),
      config: v.record(v.string(), v.any()),
      position: v.number(),
    })),
    isPublic: v.boolean(),
    tags: v.array(v.string()),
    usageCount: v.number(),
    rating: v.number(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_public", ["isPublic"]),

  // ─── Tenant Success ────────────────────────────────────────────────────────
  tenantHealthScores: defineTable({
    tenantId: v.string(),
    category: v.union(
      v.literal("adoption"),
      v.literal("engagement"),
      v.literal("support"),
      v.literal("technical"),
      v.literal("financial"),
      v.literal("overall")
    ),
    score: v.number(),
    grade: v.union(v.literal("A"), v.literal("B"), v.literal("C"), v.literal("D"), v.literal("F")),
    metrics: v.record(v.string(), v.any()),
    factors: v.array(v.object({
      name: v.string(),
      weight: v.number(),
      value: v.number(),
      impact: v.string(),
    })),
    recommendations: v.array(v.string()),
    trends: v.array(v.object({ date: v.string(), score: v.number() })),
    calculatedAt: v.number(),
    calculatedBy: v.string(),
    previousScore: v.optional(v.number()),
    scoreChange: v.optional(v.number()),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_category", ["tenantId", "category"])
    .index("by_calculatedAt", ["tenantId", "calculatedAt"]),

  successInitiatives: defineTable({
    tenantId: v.string(),
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("onboarding"),
      v.literal("training"),
      v.literal("optimization"),
      v.literal("support"),
      v.literal("engagement"),
      v.literal("retention")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    targetScore: v.number(),
    currentScore: v.number(),
    progress: v.number(),
    actions: v.array(v.object({
      id: v.string(),
      title: v.string(),
      assignee: v.string(),
      dueDate: v.string(),
      status: v.string(),
      completedAt: v.optional(v.string()),
    })),
    milestones: v.array(v.object({
      title: v.string(),
      targetDate: v.string(),
      completed: v.boolean(),
      completedAt: v.optional(v.string()),
    })),
    createdBy: v.string(),
    assignedTo: v.string(),
    startDate: v.string(),
    targetDate: v.string(),
    status: v.union(
      v.literal("planned"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_status", ["tenantId", "status"])
    .index("by_assignedTo", ["assignedTo"]),

  successMetrics: defineTable({
    tenantId: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("adoption"),
      v.literal("engagement"),
      v.literal("support"),
      v.literal("technical"),
      v.literal("financial")
    ),
    unit: v.string(),
    targetValue: v.number(),
    currentValue: v.number(),
    baselineValue: v.number(),
    calculationMethod: v.union(v.literal("automated"), v.literal("manual"), v.literal("survey")),
    frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    isActive: v.boolean(),
    trend: v.optional(v.string()),
    lastUpdated: v.number(),
    history: v.array(v.object({ date: v.string(), value: v.number() })),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_category", ["tenantId", "category"])
    .index("by_active", ["tenantId", "isActive"]),

  // ─── AI Support ───────────────────────────────────────────────────────────
  aiSupportTickets: defineTable({
    ticketId: v.string(),
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("technical"),
      v.literal("billing"),
      v.literal("account"),
      v.literal("feature_request"),
      v.literal("bug_report"),
      v.literal("general")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed"),
      v.literal("escalated")
    ),
    tenantId: v.string(),
    userId: v.string(),
    contactInfo: v.optional(v.record(v.string(), v.any())),
    submittedBy: v.string(),
    assignedTo: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    aiAnalysis: v.object({
      sentiment: v.string(),
      category: v.string(),
      priority: v.string(),
      escalation: v.object({ recommended: v.boolean(), confidence: v.number() }),
    }),
    aiResponses: v.array(v.object({
      type: v.string(),
      content: v.string(),
      tone: v.string(),
      confidence: v.number(),
      generatedAt: v.number(),
    })),
    tags: v.array(v.string()),
    satisfaction: v.optional(v.number()),
    resolutionTime: v.optional(v.number()),
    escalationHistory: v.array(v.object({
      escalatedAt: v.number(),
      reason: v.string(),
      urgency: v.string(),
      escalatedBy: v.string(),
      assignedTo: v.optional(v.string()),
    })),
    knowledgeBaseRefs: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_status", ["tenantId", "status"])
    .index("by_category", ["tenantId", "category"])
    .index("by_assignedTo", ["assignedTo"])
    .index("by_ticketId", ["ticketId"]),

  aiKnowledgeBase: defineTable({
    title: v.string(),
    content: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    keywords: v.array(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    isPublic: v.boolean(),
    viewCount: v.number(),
    helpfulCount: v.number(),
    relatedTickets: v.array(v.string()),
    aiGenerated: v.boolean(),
    aiConfidence: v.optional(v.number()),
    language: v.string(),
    estimatedReadTime: v.number(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_public", ["isPublic"]),

  // ─── Email / SMS Campaigns ────────────────────────────────────────────────
  emailCampaigns: defineTable({
    tenantId: v.optional(v.string()), // null = platform-level
    name: v.string(),
    subject: v.string(),
    templateId: v.optional(v.string()),
    body: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("cancelled")
    ),
    scheduledAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    recipientCount: v.number(),
    openCount: v.number(),
    clickCount: v.number(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_status", ["tenantId", "status"])
    .index("by_createdAt", ["tenantId", "createdAt"]),

  emailTemplates: defineTable({
    tenantId: v.optional(v.string()),
    name: v.string(),
    subject: v.string(),
    body: v.string(),
    variables: v.array(v.string()),
    category: v.string(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_category", ["category"]),

  smsTemplates: defineTable({
    tenantId: v.optional(v.string()),
    name: v.string(),
    body: v.string(),
    variables: v.array(v.string()),
    category: v.string(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_category", ["category"]),
});
