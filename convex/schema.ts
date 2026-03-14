import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sessions: defineTable({
    sessionToken: v.optional(v.string()),
    token: v.optional(v.string()), // Add this to match existing data
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
    .index("by_sessionToken", ["token"]) // Add index for the token field
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
});
