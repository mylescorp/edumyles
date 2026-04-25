import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Auth sessions — canonical field is sessionToken
  sessions: defineTable({
    sessionToken: v.optional(v.string()), // canonical session token
    token: v.optional(v.string()), // legacy field kept for backward-compat; not indexed
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
    impersonatedBy: v.optional(v.string()), // adminId who created this impersonation session
  })
    .index("by_token", ["sessionToken"]) // primary index — look up by sessionToken
    .index("by_userId", ["userId"]),

  mobileAuthRequests: defineTable({
    requestId: v.string(),
    email: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("consumed"),
      v.literal("expired"),
      v.literal("cancelled")
    ),
    sessionToken: v.optional(v.string()),
    tenantId: v.optional(v.string()),
    userId: v.optional(v.string()),
    role: v.optional(v.string()),
    completedByEmail: v.optional(v.string()),
    createdAt: v.number(),
    expiresAt: v.number(),
    completedAt: v.optional(v.number()),
    consumedAt: v.optional(v.number()),
    deviceInfo: v.optional(v.string()),
  })
    .index("by_requestId", ["requestId"])
    .index("by_status", ["status", "createdAt"]),

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
      workosOrgId: v.optional(v.string()),
      email: v.string(),
      phone: v.string(),
      website: v.optional(v.string()),
      registrationNumber: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
    plan: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("growth"),
      v.literal("standard"),
      v.literal("pro"),
      v.literal("enterprise")
    ),
      status: v.string(),
      schoolType: v.optional(v.string()),
      levels: v.optional(v.array(v.string())),
      boardingType: v.optional(v.string()),
      county: v.string(),
      country: v.string(),
      trialStartedAt: v.optional(v.number()),
      trialEndsAt: v.optional(v.number()),
      activatedAt: v.optional(v.number()),
      engagementScore: v.optional(v.number()),
      isVatExempt: v.optional(v.boolean()),
      resellerId: v.optional(v.string()),
      inviteId: v.optional(v.id("tenant_invites")),
      suspendedAt: v.optional(v.number()),
      suspendReason: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_tenantId", ["tenantId"])
      .index("by_subdomain", ["subdomain"])
      .index("by_workosOrgId", ["workosOrgId"])
      .index("by_status", ["status"]),

  impersonationSessions: defineTable({
    adminId: v.string(),
    targetUserId: v.string(),
    targetTenantId: v.string(),
    reason: v.string(),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    active: v.boolean(),
    impersonationSessionToken: v.optional(v.string()), // temp session token created for the target user
    impersonationExpiresAt: v.optional(v.number()),
  })
    .index("by_admin", ["adminId"])
    .index("by_target", ["targetUserId"]),

  users: defineTable({
      tenantId: v.string(),
      eduMylesUserId: v.string(),
      workosUserId: v.string(),
      inviteToken: v.optional(v.string()),
      email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.string(),
    permissions: v.array(v.string()),
      organizationId: v.optional(v.id("organizations")),
      isActive: v.boolean(),
      status: v.optional(v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("pending_invite"),
        v.literal("pending_activation"),
        v.literal("suspended")
      )),
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
      .index("by_user_id", ["eduMylesUserId"])
      .index("by_email", ["email"])
      .index("by_inviteToken", ["inviteToken"])
      .index("by_workos_user", ["workosUserId"])
      .index("by_tenant_email", ["tenantId", "email"])
      .index("by_tenant_role", ["tenantId", "role"]),

  mobileDeviceTokens: defineTable({
    tenantId: v.string(),
    userId: v.string(),
    pushToken: v.string(),
    provider: v.string(), // expo | fcm | apns
    platform: v.string(), // ios | android | web
    deviceName: v.optional(v.string()),
    notificationsEnabled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastSeenAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_push_token", ["pushToken"])
    .index("by_tenant", ["tenantId"]),

  organizations: defineTable({
    tenantId: v.string(),
    workosOrgId: v.string(),
    name: v.string(),
    subdomain: v.string(),
    tier: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("growth"),
      v.literal("standard"),
      v.literal("pro"),
      v.literal("enterprise")
    ),
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
  }).index("by_section_key", ["section", "key"]),

  loginAttempts: defineTable({
    email: v.string(),
    attempts: v.number(),
    lastAttemptAt: v.number(),
    lockedUntil: v.optional(v.number()),
  }).index("by_email", ["email"]),

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
    pricing: v.optional(
      v.object({
        monthly: v.number(),
        quarterly: v.optional(v.number()),
        annual: v.optional(v.number()),
        currency: v.string(),
      })
    ),
    features: v.optional(v.array(v.string())),
    dependencies: v.optional(v.array(v.string())),
    documentation: v.optional(v.string()),
    support: v.optional(
      v.object({
        email: v.string(),
        phone: v.string(),
        responseTime: v.string(),
      })
    ),
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

  marketplace_modules: defineTable({
    slug: v.string(),
    name: v.string(),
    tagline: v.string(),
    description: v.string(),
    category: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("deprecated"),
      v.literal("suspended"),
      v.literal("banned")
    ),
    isFeatured: v.boolean(),
    isCore: v.boolean(),
    minimumPlan: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("pro"),
      v.literal("enterprise")
    ),
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
    planOverrides: v.array(
      v.object({
        plan: v.string(),
        baseRateKes: v.number(),
      })
    ),
    vatRatePct: v.number(),
    updatedBy: v.string(),
    updatedAt: v.number(),
  }).index("by_moduleId", ["moduleId"]),

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

  module_access_config: defineTable({
    moduleId: v.id("marketplace_modules"),
    moduleSlug: v.string(),
    tenantId: v.string(),
    roleAccess: v.array(
      v.object({
        role: v.string(),
        accessLevel: v.union(
          v.literal("full"),
          v.literal("read_only"),
          v.literal("restricted"),
          v.literal("none")
        ),
        allowedFeatures: v.array(v.string()),
      })
    ),
    config: v.string(),
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
    processingStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("dead_letter")
    ),
    retryCount: v.number(),
    lastRetryAt: v.optional(v.number()),
    subscriberResults: v.array(
      v.object({
        subscriberModule: v.string(),
        status: v.string(),
        processedAt: v.number(),
        error: v.optional(v.string()),
      })
    ),
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
    notifications: v.array(
      v.object({
        key: v.string(),
        enabled: v.boolean(),
        channels: v.array(v.string()),
        frequencyDays: v.optional(v.number()),
        quietHoursStart: v.optional(v.string()),
        quietHoursEnd: v.optional(v.string()),
      })
    ),
    updatedBy: v.string(),
    updatedAt: v.number(),
  }).index("by_tenantId_moduleSlug", ["tenantId", "moduleSlug"]),

  module_plan_inclusions: defineTable({
    moduleId: v.id("marketplace_modules"),
    moduleSlug: v.string(),
    plan: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("pro"),
      v.literal("enterprise")
    ),
    isIncluded: v.boolean(),
    includedStudentLimit: v.optional(v.number()),
    discountedRateKes: v.optional(v.number()),
    updatedBy: v.string(),
    updatedAt: v.number(),
  })
    .index("by_moduleId_plan", ["moduleId", "plan"])
    .index("by_plan", ["plan"]),

  admin_task_queue: defineTable({
    tenantId: v.string(),
    type: v.string(),
    requestedBy: v.string(),
    requestedByRole: v.string(),
    moduleSlug: v.optional(v.string()),
    moduleName: v.optional(v.string()),
    reason: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("cancelled")
    ),
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
  }).index("by_moduleSlug", ["moduleSlug"]),

  user_notification_preferences: defineTable({
    userId: v.string(),
    tenantId: v.string(),
    moduleSlug: v.string(),
    preferences: v.array(
      v.object({
        key: v.string(),
        enabled: v.boolean(),
        channels: v.array(v.string()),
      })
    ),
    updatedAt: v.number(),
  })
    .index("by_userId_tenantId", ["userId", "tenantId"])
    .index("by_userId_moduleSlug", ["userId", "moduleSlug"]),

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

  ledgerEntries: defineTable({
    tenantId: v.string(),
    studentId: v.string(),
    invoiceId: v.string(),
    paymentId: v.optional(v.string()),
    type: v.string(),
    amount: v.number(),
    currency: v.string(),
    description: v.string(),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId", "createdAt"])
    .index("by_student", ["studentId", "createdAt"])
    .index("by_invoice", ["invoiceId", "createdAt"])
    .index("by_payment", ["paymentId", "createdAt"]),

  paymentCallbacks: defineTable({
    tenantId: v.string(),
    gateway: v.string(), // mpesa | stripe | airtel
    externalId: v.string(), // CheckoutRequestID, Stripe payment intent id, etc.
    checkoutSessionId: v.optional(v.string()),
    paymentIntentId: v.optional(v.string()),
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
    .index("by_checkout_session_id", ["gateway", "checkoutSessionId"])
    .index("by_payment_intent_id", ["gateway", "paymentIntentId"])
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
    instructions: v.optional(v.string()),
    dueDate: v.string(),
    dueTime: v.optional(v.string()),
    maxPoints: v.number(),
    type: v.string(), // homework, classwork, project, exam, quiz
    gradingScale: v.optional(v.string()), // points, percentage, letter, competency
    allowLateSubmission: v.optional(v.boolean()),
    latePenalty: v.optional(v.number()),
    status: v.string(), // draft, published, closed, graded
    attachments: v.optional(v.array(v.string())),
    learningObjectives: v.optional(v.array(v.string())),
    rubric: v.optional(
      v.array(
        v.object({
          criteria: v.string(),
          description: v.string(),
          maxPoints: v.number(),
        })
      )
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_class", ["classId"])
    .index("by_teacher", ["teacherId", "createdAt"])
    .index("by_tenant_class", ["tenantId", "classId"])
    .index("by_tenant_status", ["tenantId", "status"]),

  submissions: defineTable({
    tenantId: v.string(),
    assignmentId: v.string(),
    studentId: v.string(),
    content: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
    fileUrl: v.optional(v.string()),
    status: v.string(), // not_submitted | submitted | late | graded
    grade: v.optional(v.number()),
    score: v.optional(v.number()), // numeric score
    letterGrade: v.optional(v.string()), // A, B, C, etc.
    feedback: v.optional(v.string()),
    submittedAt: v.optional(v.number()),
    gradedAt: v.optional(v.number()),
    gradedBy: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_assignment", ["assignmentId"])
    .index("by_student", ["studentId"])
    .index("by_assignment_student", ["assignmentId", "studentId"])
    .index("by_student_date", ["studentId", "submittedAt"]),

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

  academicTerms: defineTable({
    tenantId: v.string(),
    term: v.string(),
    academicYear: v.string(),
    name: v.string(),
    startDate: v.string(), // YYYY-MM-DD
    endDate: v.string(), // YYYY-MM-DD
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_term_year", ["tenantId", "term", "academicYear"])
    .index("by_tenant_active", ["tenantId", "isActive"]),

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

  rooms: defineTable({
    tenantId: v.string(),
    name: v.string(),
    code: v.string(),
    capacity: v.number(),
    type: v.string(), // classroom, lab, hall, office, etc.
    equipment: v.optional(v.array(v.string())), // projector, computer, whiteboard, etc.
    location: v.optional(v.string()),
    floor: v.optional(v.string()),
    available: v.boolean(), // whether room is currently available
    maintenanceNotes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_type", ["tenantId", "type"])
    .index("by_tenant_capacity", ["tenantId", "capacity"]),

  schoolEvents: defineTable({
    tenantId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    eventType: v.string(), // "academic" | "sports" | "cultural" | "holiday" | "meeting" | "other"
    startDate: v.string(), // ISO date string
    endDate: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    location: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_date", ["tenantId", "startDate"]),

  announcements: defineTable({
    tenantId: v.string(),
    title: v.string(),
    body: v.string(),
    audience: v.string(),
    targetRoles: v.optional(v.array(v.string())),
    priority: v.string(),
    status: v.string(),
    publishedAt: v.optional(v.number()),
    archivedAt: v.optional(v.number()),
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
  }).index("by_tenant", ["tenantId"]),

  vehicles: defineTable({
    tenantId: v.string(),
    plateNumber: v.string(),
    capacity: v.number(),
    routeId: v.optional(v.string()),
    driverId: v.optional(v.string()),
    status: v.string(),
    lastLatitude: v.optional(v.number()),
    lastLongitude: v.optional(v.number()),
    lastSpeed: v.optional(v.number()),
    lastHeading: v.optional(v.number()),
    lastLocationAt: v.optional(v.number()),
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
    frozen: v.optional(v.boolean()),
    frozenAt: v.optional(v.number()),
    frozenBy: v.optional(v.string()),
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
    toWalletId: v.optional(v.string()), // for transfer transactions
    note: v.optional(v.string()), // human-readable note
    performedBy: v.optional(v.string()), // actorId for admin-initiated transactions
  })
    .index("by_tenant", ["tenantId"])
    .index("by_wallet", ["walletId", "createdAt"]),

  walletTopUpRequests: defineTable({
    tenantId: v.string(),
    requesterId: v.string(),
    amountCents: v.number(),
    currency: v.string(),
    method: v.string(),
    phone: v.optional(v.string()),
    note: v.optional(v.string()),
    status: v.string(), // pending | approved | rejected
    reviewedBy: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    reviewNote: v.optional(v.string()),
    reference: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId", "createdAt"])
    .index("by_requester", ["requesterId", "createdAt"])
    .index("by_tenant_status", ["tenantId", "status"]),

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
    items: v.array(
      v.object({
        productId: v.string(),
        quantity: v.number(),
        unitPriceCents: v.number(),
      })
    ),
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
    triggerConfig: v.optional(
      v.object({
        schedule: v.optional(v.string()),
        eventType: v.optional(v.string()),
        webhookPath: v.optional(v.string()),
        conditions: v.optional(v.array(v.string())),
      })
    ),
    steps: v.array(
      v.object({
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
        config: v.object({
          type: v.optional(v.string()),
          params: v.optional(v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))),
        }),
        position: v.number(),
      })
    ),
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
    status: v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    duration: v.number(),
    triggeredBy: v.string(),
    triggerData: v.object({
      source: v.optional(v.string()),
      timestamp: v.optional(v.number()),
      payload: v.optional(v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))),
    }),
    steps: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        type: v.string(),
        status: v.union(
          v.literal("pending"),
          v.literal("running"),
          v.literal("completed"),
          v.literal("failed")
        ),
        startedAt: v.number(),
        completedAt: v.optional(v.number()),
        duration: v.number(),
        output: v.optional(v.any()),
        error: v.optional(
          v.object({
            message: v.string(),
            timestamp: v.number(),
          })
        ),
      })
    ),
    error: v.optional(
      v.object({
        message: v.string(),
        stack: v.string(),
        timestamp: v.number(),
      })
    ),
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
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
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
      timeRange: v.union(
        v.literal("1h"),
        v.literal("24h"),
        v.literal("7d"),
        v.literal("30d"),
        v.literal("90d")
      ),
      filters: v.optional(
        v.array(
          v.object({
            field: v.string(),
            op: v.string(),
            value: v.union(v.string(), v.number(), v.boolean()),
          })
        )
      ),
      metrics: v.array(v.string()),
      groupBy: v.optional(v.string()),
      chartType: v.union(v.literal("line"), v.literal("bar"), v.literal("pie"), v.literal("table")),
    }),
    schedule: v.optional(
      v.object({
        enabled: v.boolean(),
        frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
        recipients: v.array(v.string()),
      })
    ),
    status: v.union(
      v.literal("created"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    ),
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
    severity: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    status: v.union(
      v.literal("active"),
      v.literal("investigating"),
      v.literal("resolved"),
      v.literal("closed")
    ),
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
    type: v.union(
      v.literal("status_change"),
      v.literal("note"),
      v.literal("action"),
      v.literal("notification")
    ),
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
    status: v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    scheduledStart: v.number(),
    scheduledEnd: v.number(),
    actualStart: v.optional(v.number()),
    actualEnd: v.optional(v.number()),
    impact: v.union(
      v.literal("no_impact"),
      v.literal("degraded_performance"),
      v.literal("service_unavailable")
    ),
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
    type: v.union(
      v.literal("system"),
      v.literal("security"),
      v.literal("performance"),
      v.literal("capacity")
    ),
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
    services: v.array(
      v.object({
        name: v.string(),
        status: v.string(),
        responseTime: v.number(),
        uptime: v.number(),
        lastCheck: v.number(),
        metrics: v.record(v.string(), v.any()),
      })
    ),
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
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    status: v.union(
      v.literal("active"),
      v.literal("mitigating"),
      v.literal("resolved"),
      v.literal("false_positive")
    ),
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
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
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
    status: v.union(
      v.literal("open"),
      v.literal("investigating"),
      v.literal("contained"),
      v.literal("resolved"),
      v.literal("closed")
    ),
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
    type: v.union(
      v.literal("status_change"),
      v.literal("note"),
      v.literal("action"),
      v.literal("notification")
    ),
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
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
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
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
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
    type: v.union(
      v.literal("webhook"),
      v.literal("api"),
      v.literal("oauth"),
      v.literal("database")
    ),
    isCustom: v.boolean(),
    isPublic: v.boolean(),
    isFeatured: v.boolean(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("deprecated")),
    configuration: v.record(v.string(), v.any()),
    endpoints: v.array(
      v.object({
        name: v.string(),
        url: v.string(),
        method: v.union(v.literal("GET"), v.literal("POST"), v.literal("PUT"), v.literal("DELETE")),
        authentication: v.object({
          type: v.union(
            v.literal("none"),
            v.literal("api_key"),
            v.literal("oauth"),
            v.literal("basic")
          ),
          credentials: v.optional(v.record(v.string(), v.any())),
        }),
      })
    ),
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
    defaultPlan: v.union(
      v.literal("free"),
      v.literal("basic"),
      v.literal("pro"),
      v.literal("enterprise")
    ),
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
    status: v.union(
      v.literal("installed"),
      v.literal("active"),
      v.literal("disabled"),
      v.literal("error"),
      v.literal("uninstalled")
    ),
    installedBy: v.string(),
    installedAt: v.number(),
    lastSyncAt: v.optional(v.number()),
    syncStatus: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    usage: v.object({
      apiCalls: v.number(),
      dataTransferred: v.number(),
      errors: v.number(),
    }),
    subscription: v.object({
      plan: v.union(
        v.literal("free"),
        v.literal("basic"),
        v.literal("pro"),
        v.literal("enterprise")
      ),
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
    category: v.union(
      v.literal("billing"),
      v.literal("technical"),
      v.literal("data"),
      v.literal("feature"),
      v.literal("onboarding"),
      v.literal("account"),
      v.literal("legal"),
      v.literal("other")
    ),
    priority: v.union(v.literal("P0"), v.literal("P1"), v.literal("P2"), v.literal("P3")),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("pending_school"),
      v.literal("resolved"),
      v.literal("closed")
    ),
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
    aiAnalysis: v.optional(
      v.object({
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
      })
    ),
    aiCategorization: v.optional(
      v.object({
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
      })
    ),
    categorizedAt: v.optional(v.number()),
    categorizedBy: v.optional(v.string()),
    escalatedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_assigned", ["assignedTo"])
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
    category: v.union(
      v.literal("billing"),
      v.literal("technical"),
      v.literal("data"),
      v.literal("feature"),
      v.literal("onboarding"),
      v.literal("account"),
      v.literal("legal"),
      v.literal("other")
    ),
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
    category: v.union(
      v.literal("billing"),
      v.literal("technical"),
      v.literal("data"),
      v.literal("feature"),
      v.literal("onboarding"),
      v.literal("account"),
      v.literal("legal"),
      v.literal("other")
    ),
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
      v.literal("academic_tools"),
      v.literal("communication"),
      v.literal("finance_fees"),
      v.literal("analytics_bi"),
      v.literal("content_packs"),
      v.literal("integrations"),
      v.literal("ai_automation"),
      v.literal("accessibility"),
      v.literal("administration"),
      v.literal("security_compliance")
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
      v.literal("free"),
      v.literal("freemium"),
      v.literal("one_time"),
      v.literal("monthly"),
      v.literal("annual"),
      v.literal("per_student"),
      v.literal("per_user"),
      v.literal("free_trial")
    ),
    priceCents: v.optional(v.number()),
    currency: v.optional(v.string()),
    trialDays: v.optional(v.number()), // 7-30
    pricingTiers: v.optional(
      v.array(
        v.object({
          name: v.string(),
          priceCents: v.number(),
          features: v.array(v.string()),
        })
      )
    ),
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
      v.literal("draft"),
      v.literal("pending_review"),
      v.literal("approved"),
      v.literal("published"),
      v.literal("suspended"),
      v.literal("deprecated"),
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
    status: v.union(
      v.literal("draft"),
      v.literal("pending_review"),
      v.literal("approved"),
      v.literal("published"),
      v.literal("rejected")
    ),
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
    verificationLevel: v.union(
      v.literal("basic"),
      v.literal("verified"),
      v.literal("featured_partner")
    ),
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
      v.literal("active"),
      v.literal("degraded"),
      v.literal("suspended_non_payment"),
      v.literal("update_available"),
      v.literal("update_required"),
      v.literal("deprecated"),
      v.literal("uninstalled")
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
      v.literal("purchase"),
      v.literal("subscription"),
      v.literal("renewal"),
      v.literal("refund"),
      v.literal("trial_conversion")
    ),
    grossAmountCents: v.number(),
    commissionCents: v.number(),
    netAmountCents: v.number(),
    commissionRate: v.number(), // 0.20, 0.25, 0.30
    currency: v.string(),
    paymentMethod: v.optional(v.string()), // mpesa, stripe, bank
    paymentReference: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
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
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
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
      v.literal("install"),
      v.literal("uninstall"),
      v.literal("update"),
      v.literal("review"),
      v.literal("purchase"),
      v.literal("refund"),
      v.literal("submission"),
      v.literal("approval"),
      v.literal("rejection"),
      v.literal("suspension"),
      v.literal("featured")
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
    type: v.union(
      v.literal("refund"),
      v.literal("policy_violation"),
      v.literal("technical_failure"),
      v.literal("other")
    ),
    description: v.string(),
    evidence: v.optional(v.array(v.string())),
    status: v.union(
      v.literal("open"),
      v.literal("under_review"),
      v.literal("resolved"),
      v.literal("dismissed")
    ),
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
    variables: v.array(
      v.object({
        name: v.string(),
        type: v.string(), // text | date | time | number | url
        defaultValue: v.optional(v.string()),
        required: v.boolean(),
      })
    ),
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
    stats: v.optional(
      v.object({
        totalRecipients: v.number(),
        sent: v.number(),
        delivered: v.number(),
        opened: v.number(),
        clicked: v.number(),
        failed: v.number(),
        bounced: v.number(),
      })
    ),
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
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          url: v.string(),
          type: v.string(),
          size: v.optional(v.number()),
        })
      )
    ),
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
    categories: v.optional(
      v.object({
        announcements: v.optional(v.boolean()),
        academic: v.optional(v.boolean()),
        finance: v.optional(v.boolean()),
        system: v.optional(v.boolean()),
        marketing: v.optional(v.boolean()),
      })
    ),
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
    templateSteps: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        type: v.string(),
        config: v.record(v.string(), v.any()),
        position: v.number(),
      })
    ),
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
    factors: v.array(
      v.object({
        name: v.string(),
        weight: v.number(),
        value: v.number(),
        impact: v.string(),
      })
    ),
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
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    targetScore: v.number(),
    currentScore: v.number(),
    progress: v.number(),
    actions: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        assignee: v.string(),
        dueDate: v.string(),
        status: v.string(),
        completedAt: v.optional(v.string()),
      })
    ),
    milestones: v.array(
      v.object({
        title: v.string(),
        targetDate: v.string(),
        completed: v.boolean(),
        completedAt: v.optional(v.string()),
      })
    ),
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
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
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
    aiResponses: v.array(
      v.object({
        type: v.string(),
        content: v.string(),
        tone: v.string(),
        confidence: v.number(),
        generatedAt: v.number(),
      })
    ),
    tags: v.array(v.string()),
    satisfaction: v.optional(v.number()),
    resolutionTime: v.optional(v.number()),
    escalationHistory: v.array(
      v.object({
        escalatedAt: v.number(),
        reason: v.string(),
        urgency: v.string(),
        escalatedBy: v.string(),
        assignedTo: v.optional(v.string()),
      })
    ),
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

  // ─── CRM Tables ─────────────────────────────────────────────────────────────
  crmDeals: defineTable({
    tenantId: v.optional(v.string()),
    schoolName: v.string(),
    contactPerson: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    county: v.optional(v.string()),
    schoolType: v.optional(v.string()),
    currentStudents: v.optional(v.number()),
    potentialStudents: v.optional(v.number()),
    stage: v.union(
      v.literal("lead"),
      v.literal("qualified"),
      v.literal("proposal"),
      v.literal("negotiation"),
      v.literal("closed_won"),
      v.literal("closed_lost")
    ),
    value: v.number(),
    currency: v.string(),
    source: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    expectedCloseDate: v.optional(v.number()),
    probability: v.optional(v.number()),
    tags: v.array(v.string()),
    notes: v.optional(v.string()),
    lostReason: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_stage", ["stage"])
    .index("by_assignedTo", ["assignedTo"])
    .index("by_createdAt", ["createdAt"]),

  crmLeads: defineTable({
    tenantId: v.optional(v.string()),
    schoolName: v.string(),
    contactPerson: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    county: v.optional(v.string()),
    schoolType: v.optional(v.string()),
    source: v.string(),
    status: v.union(
      v.literal("new"),
      v.literal("contacted"),
      v.literal("qualified"),
      v.literal("converted"),
      v.literal("lost")
    ),
    notes: v.optional(v.string()),
    convertedDealId: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  crmActivities: defineTable({
    tenantId: v.optional(v.string()),
    dealId: v.optional(v.string()),
    leadId: v.optional(v.string()),
    type: v.union(
      v.literal("call"),
      v.literal("email"),
      v.literal("meeting"),
      v.literal("note"),
      v.literal("task"),
      v.literal("stage_change"),
      v.literal("proposal_sent"),
      v.literal("follow_up")
    ),
    title: v.string(),
    description: v.optional(v.string()),
    outcome: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdBy: v.string(),
    createdAt: v.number(),
  })
    .index("by_deal", ["dealId", "createdAt"])
    .index("by_lead", ["leadId", "createdAt"])
    .index("by_type", ["type"]),

  proposalTemplates: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("standard"),
      v.literal("custom"),
      v.literal("legal"),
      v.literal("pricing")
    ),
    sections: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        content: v.string(),
        order: v.number(),
        isRequired: v.boolean(),
        variables: v.array(v.string()),
      })
    ),
    variables: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        type: v.union(
          v.literal("text"),
          v.literal("number"),
          v.literal("date"),
          v.literal("currency"),
          v.literal("select")
        ),
        defaultValue: v.optional(v.string()),
        options: v.optional(v.array(v.string())),
        description: v.string(),
        required: v.boolean(),
      })
    ),
    terms: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        content: v.string(),
        category: v.union(
          v.literal("payment"),
          v.literal("service"),
          v.literal("legal"),
          v.literal("termination"),
          v.literal("confidentiality")
        ),
        isDefault: v.boolean(),
      })
    ),
    pricing: v.object({
      currency: v.string(),
      oneTime: v.boolean(),
      recurring: v.boolean(),
      customPricing: v.boolean(),
      priceTiers: v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          minStudents: v.number(),
          maxStudents: v.number(),
          setupFee: v.number(),
          monthlyFee: v.number(),
          perStudentFee: v.number(),
          features: v.array(v.string()),
        })
      ),
    }),
    isDefault: v.boolean(),
    usageCount: v.number(),
    isActive: v.boolean(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_active", ["isActive"]),

  proposals: defineTable({
    templateId: v.string(),
    dealId: v.optional(v.string()),
    schoolName: v.string(),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("viewed"),
      v.literal("signed"),
      v.literal("rejected"),
      v.literal("expired")
    ),
    variables: v.any(),
    content: v.string(),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    validUntil: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    viewedAt: v.optional(v.number()),
    signedAt: v.optional(v.number()),
    rejectedAt: v.optional(v.number()),
    signatureUrl: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_dealId", ["dealId"])
    .index("by_createdAt", ["createdAt"]),

  // ─── Staff Performance ──────────────────────────────────────────────────────
  staffPerformanceRecords: defineTable({
    userId: v.string(),
    userName: v.string(),
    userEmail: v.string(),
    role: v.string(),
    department: v.optional(v.string()),
    period: v.string(),
    metrics: v.object({
      ticketsResolved: v.number(),
      avgResponseTime: v.number(),
      avgResolutionTime: v.number(),
      satisfactionScore: v.number(),
      slaCompliance: v.number(),
      escalationRate: v.number(),
      firstContactResolution: v.number(),
    }),
    goals: v.optional(
      v.object({
        ticketsTarget: v.optional(v.number()),
        satisfactionTarget: v.optional(v.number()),
        responseTimeTarget: v.optional(v.number()),
      })
    ),
    achievements: v.array(v.string()),
    trend: v.union(v.literal("up"), v.literal("down"), v.literal("stable")),
    overallScore: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_period", ["period"])
    .index("by_overallScore", ["overallScore"]),

  // ── Knowledge Base ──────────────────────────────────────────────────
  knowledgeBaseArticles: defineTable({
    title: v.string(),
    content: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    status: v.union(v.literal("draft"), v.literal("published")),
    author: v.string(),
    authorName: v.optional(v.string()),
    viewCount: v.number(),
    helpfulCount: v.number(),
    notHelpfulCount: v.number(),
    tenantId: v.optional(v.string()), // null = platform-wide
    deleted: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_tenant", ["tenantId"])
    .index("by_author", ["author"])
    .index("by_viewCount", ["viewCount"])
    .index("by_status_category", ["status", "category"]),

  knowledgeBaseCategories: defineTable({
    name: v.string(),
    description: v.string(),
    icon: v.optional(v.string()),
    order: v.number(),
    parentId: v.optional(v.string()),
    articleCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_order", ["order"])
    .index("by_parent", ["parentId"]),

  // ── Data Exports ────────────────────────────────────────────────────
  dataExports: defineTable({
    tenantId: v.string(),
    exportType: v.union(
      v.literal("users"),
      v.literal("tenants"),
      v.literal("tickets"),
      v.literal("deals"),
      v.literal("analytics")
    ),
    format: v.union(v.literal("csv"), v.literal("json")),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    filters: v.optional(
      v.object({
        dateFrom: v.optional(v.number()),
        dateTo: v.optional(v.number()),
        status: v.optional(v.string()),
        search: v.optional(v.string()),
      })
    ),
    fileUrl: v.optional(v.string()),
    dataContent: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    rowCount: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_tenant", ["tenantId", "createdAt"])
    .index("by_status", ["tenantId", "status"])
    .index("by_createdBy", ["createdBy", "createdAt"]),

  // ── SLA Management ──────────────────────────────────────────────────
  slaConfigurations: defineTable({
    tenantId: v.string(),
    name: v.string(),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    responseTimeHours: v.number(),
    resolutionTimeHours: v.number(),
    escalationRules: v.array(
      v.object({
        afterHours: v.number(),
        action: v.string(),
        notifyRole: v.string(),
      })
    ),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_priority", ["tenantId", "priority"])
    .index("by_tenant_active", ["tenantId", "isActive"]),

  slaBreaches: defineTable({
    tenantId: v.string(),
    ticketId: v.string(),
    slaConfigId: v.string(),
    breachType: v.union(v.literal("response"), v.literal("resolution")),
    breachedAt: v.number(),
    acknowledgedAt: v.optional(v.number()),
    acknowledgedBy: v.optional(v.string()),
  })
    .index("by_tenant", ["tenantId", "breachedAt"])
    .index("by_ticket", ["ticketId"])
    .index("by_slaConfig", ["slaConfigId"]),

  // ─── Webhook Management ──────────────────────────────────────────────────
  webhookEndpoints: defineTable({
    tenantId: v.string(),
    url: v.string(),
    events: v.array(v.string()),
    secret: v.string(),
    isActive: v.boolean(),
    description: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastTriggeredAt: v.optional(v.number()),
    failureCount: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_active", ["tenantId", "isActive"]),

  webhookDeliveries: defineTable({
    tenantId: v.string(),
    endpointId: v.id("webhookEndpoints"),
    event: v.string(),
    payload: v.string(),
    statusCode: v.optional(v.number()),
    response: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("success"), v.literal("failed")),
    attemptCount: v.number(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_endpoint", ["endpointId", "createdAt"])
    .index("by_tenant", ["tenantId", "createdAt"])
    .index("by_status", ["tenantId", "status"]),

  // ─── API Key Management ─────────────────────────────────────────────────
  apiKeys: defineTable({
    tenantId: v.string(),
    name: v.string(),
    keyHash: v.string(),
    keyPrefix: v.string(),
    permissions: v.array(v.string()),
    rateLimit: v.number(),
    lastUsedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    isActive: v.boolean(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_keyHash", ["keyHash"])
    .index("by_tenant_active", ["tenantId", "isActive"]),

  apiKeyUsage: defineTable({
    keyId: v.id("apiKeys"),
    tenantId: v.string(),
    endpoint: v.string(),
    method: v.string(),
    statusCode: v.number(),
    responseTime: v.number(),
    timestamp: v.number(),
  })
    .index("by_key", ["keyId", "timestamp"])
    .index("by_tenant", ["tenantId", "timestamp"]),

  // ─── White-Label Configuration ──────────────────────────────────────────
  whiteLabelConfigs: defineTable({
    tenantId: v.string(),
    brandName: v.string(),
    logoUrl: v.optional(v.string()),
    primaryColor: v.string(),
    secondaryColor: v.string(),
    accentColor: v.string(),
    favicon: v.optional(v.string()),
    customDomain: v.optional(v.string()),
    emailFromName: v.optional(v.string()),
    emailFromAddress: v.optional(v.string()),
    footerText: v.optional(v.string()),
    customCSS: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_customDomain", ["customDomain"]),

  // ── Changelog ───────────────────────────────────────────────────────
  changelogEntries: defineTable({
    version: v.string(),
    title: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("feature"),
      v.literal("fix"),
      v.literal("improvement"),
      v.literal("breaking")
    ),
    date: v.number(),
    author: v.string(),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_date", ["date"])
    .index("by_type", ["type", "date"])
    .index("by_version", ["version"]),

  // ─── Platform Communications ───────────────────────────────────────────
  platform_messages: defineTable({
    senderId: v.string(),
    type: v.union(
      v.literal("broadcast"),
      v.literal("targeted"),
      v.literal("campaign"),
      v.literal("alert"),
      v.literal("transactional"),
      v.literal("drip_step")
    ),
    subject: v.string(),
    emailBody: v.string(),
    smsBody: v.string(),
    inAppBody: v.string(),
    channels: v.array(v.string()),
    segment: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    status: v.union(v.literal("draft"), v.literal("scheduled"), v.literal("sent")),
    stats: v.object({
      delivered: v.number(),
      opened: v.number(),
      clicked: v.number(),
      bounced: v.number(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status", "createdAt"])
    .index("by_sender", ["senderId", "createdAt"]),

  // ── Tenant Onboarding Wizard ──────────────────────────────────────
  onboardingProgress: defineTable({
    tenantId: v.string(),
    currentStep: v.number(),
    completedSteps: v.array(v.number()),
    status: v.union(v.literal("in_progress"), v.literal("completed"), v.literal("abandoned")),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    data: v.record(v.string(), v.any()),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_status", ["status"]),

  // ── Role-Based Access Builder ─────────────────────────────────────
  customRoles: defineTable({
    name: v.string(),
    description: v.string(),
    tenantId: v.optional(v.string()),
    permissions: v.array(v.string()),
    isSystem: v.boolean(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_name", ["tenantId", "name"])
    .index("by_system", ["isSystem"]),

  permissionGroups: defineTable({
    name: v.string(),
    description: v.string(),
    permissions: v.array(v.string()),
    module: v.string(),
  }).index("by_module", ["module"]),

  // ── Scheduled Reports ─────────────────────────────────────────────
  scheduledReports: defineTable({
    name: v.string(),
    reportType: v.string(),
    schedule: v.string(),
    filters: v.record(v.string(), v.any()),
    format: v.union(v.literal("csv"), v.literal("excel"), v.literal("pdf")),
    recipients: v.array(v.string()),
    lastRun: v.optional(v.number()),
    nextRun: v.optional(v.number()),
    isActive: v.boolean(),
    createdBy: v.string(),
    tenantId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_active", ["tenantId", "isActive"])
    .index("by_nextRun", ["nextRun"]),

  scheduledReportRuns: defineTable({
    reportId: v.string(),
    status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed")),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    resultUrl: v.optional(v.string()),
    error: v.optional(v.string()),
    tenantId: v.string(),
  })
    .index("by_report", ["reportId"])
    .index("by_tenant", ["tenantId"])
    .index("by_status", ["tenantId", "status"]),

  // ── Platform Billing ─────────────────────────────────────────────────
  subscriptionPlans: defineTable({
    planId: v.string(),
    name: v.string(),
    tier: v.union(
      v.literal("starter"),
      v.literal("standard"),
      v.literal("pro"),
      v.literal("enterprise")
    ),
    monthlyPriceCents: v.number(),
    annualPriceCents: v.number(),
    currency: v.string(),
    features: v.array(v.string()),
    maxUsers: v.optional(v.number()),
    maxStudents: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_planId", ["planId"])
    .index("by_tier", ["tier"])
    .index("by_active", ["isActive"]),

  platformInvoices: defineTable({
    invoiceNumber: v.string(),
    tenantId: v.string(),
    tenantName: v.string(),
    plan: v.string(),
    amountCents: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("void"),
      v.literal("refunded")
    ),
    billingPeriodStart: v.number(),
    billingPeriodEnd: v.number(),
    dueDate: v.number(),
    paidAt: v.optional(v.number()),
    paymentMethod: v.optional(v.string()),
    paymentReference: v.optional(v.string()),
    lineItems: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        unitPriceCents: v.number(),
        totalCents: v.number(),
      })
    ),
    notes: v.optional(v.string()),
    creditAppliedCents: v.optional(v.number()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId", "createdAt"])
    .index("by_status", ["status", "createdAt"])
    .index("by_invoiceNumber", ["invoiceNumber"])
    .index("by_dueDate", ["dueDate"]),

  billingCredits: defineTable({
    tenantId: v.string(),
    amountCents: v.number(),
    currency: v.string(),
    reason: v.string(),
    appliedToInvoice: v.optional(v.string()),
    status: v.union(v.literal("available"), v.literal("applied"), v.literal("expired")),
    expiresAt: v.optional(v.number()),
    createdBy: v.string(),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId", "createdAt"])
    .index("by_status", ["tenantId", "status"]),

  // Feature Flags — platform-wide feature toggles and rollout controls
  featureFlags: defineTable({
    name: v.string(),
    key: v.string(),
    description: v.optional(v.string()),
    enabled: v.boolean(),
    targetType: v.optional(v.string()), // "all", "percentage", "tenants", "users"
    targetValue: v.optional(v.any()), // percentage number, tenant IDs array, user IDs array
    tenantId: v.optional(v.string()),
    environment: v.optional(v.string()), // "production", "staging", "development"
    createdBy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_key", ["key"])
    .index("by_environment", ["environment"]),

  // ─── Project Management System ────────────────────────────────────────

  // PM Workspaces - Top-level containers for different workflow types
  pmWorkspaces: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("engineering"),
      v.literal("onboarding"),
      v.literal("bugs"),
      v.literal("okrs")
    ),
    icon: v.string(),
    color: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
    memberIds: v.optional(v.array(v.string())),
    isArchived: v.optional(v.boolean()),
    customFieldSchema: v.array(
      v.object({
        key: v.string(),
        name: v.string(),
        type: v.union(
          v.literal("text"),
          v.literal("number"),
          v.literal("select"),
          v.literal("multi_select"),
          v.literal("date"),
          v.literal("user"),
          v.literal("checkbox")
        ),
        options: v.optional(v.array(v.string())),
        required: v.boolean(),
      })
    ),
    defaultStatuses: v.array(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_type", ["type"])
    .index("by_createdBy", ["createdBy"]),

  // PM Projects - Scoped initiatives within workspaces
  pmProjects: defineTable({
    workspaceId: v.id("pmWorkspaces"),
    slug: v.optional(v.string()),
    name: v.string(),
    description: v.string(),
    priority: v.optional(v.string()),
    visibility: v.optional(v.union(v.literal("private"), v.literal("workspace"), v.literal("all_staff"))),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed"),
      v.literal("archived")
    ),
    startDate: v.number(),
    dueDate: v.number(),
    ownerId: v.string(),
    leadId: v.optional(v.string()),
    memberIds: v.array(v.string()),
    progress: v.optional(v.number()),
    totalTasks: v.optional(v.number()),
    completedTasks: v.optional(v.number()),
    isDeleted: v.optional(v.boolean()),
    isArchived: v.optional(v.boolean()),
    archivedAt: v.optional(v.number()),
    githubRepo: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    customFields: v.optional(v.record(v.string(), v.any())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_slug", ["slug"])
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_workspace_status", ["workspaceId", "status"]),

  // PM Epics - Large bodies of work grouping related tasks
  pmEpics: defineTable({
    projectId: v.id("pmProjects"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("done")),
    startDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    progress: v.number(), // 0-100 computed from child task completion
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_status", ["status"])
    .index("by_project_status", ["projectId", "status"]),

  // PM Tasks - Primary unit of work
  pmTasks: defineTable({
    projectId: v.id("pmProjects"),
    epicId: v.optional(v.id("pmEpics")),
    parentTaskId: v.optional(v.id("pmTasks")),
    title: v.string(),
    description: v.string(),
    type: v.optional(v.string()),
    status: v.string(),
    priority: v.union(
      v.literal("urgent"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low"),
      v.literal("none")
    ),
    assigneeId: v.optional(v.string()),
    reviewerId: v.optional(v.string()),
    collaboratorIds: v.optional(v.array(v.string())),
    reporterId: v.string(),
    creatorId: v.optional(v.string()),
    sprintId: v.optional(v.id("pmSprints")),
    dueDate: v.optional(v.number()),
    estimateMinutes: v.optional(v.number()),
    storyPoints: v.optional(v.number()),
    loggedMinutes: v.number(),
    actualHours: v.optional(v.number()),
    githubIssueNumber: v.optional(v.number()),
    githubPrNumber: v.optional(v.number()),
    githubBranch: v.optional(v.string()),
    githubPrNumbers: v.array(v.number()),
    githubIssueNumbers: v.array(v.number()),
    convexDeployId: v.optional(v.string()),
    customFields: v.optional(v.record(v.string(), v.any())),
    labels: v.array(v.string()),
    completedAt: v.optional(v.number()),
    isDeleted: v.optional(v.boolean()),
    position: v.number(), // Float for drag-drop ordering within status column
    order: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_epic", ["epicId", "status"])
    .index("by_assignee", ["assigneeId", "updatedAt"])
    .index("by_due_date", ["dueDate"])
    .index("by_project_status", ["projectId", "status", "position"])
    .index("by_parent", ["parentTaskId"])
    .index("by_reporter", ["reporterId"])
    .index("by_sprint", ["sprintId", "status"]),

  // PM Time Logs - Time tracking for tasks
  pmTimeLogs: defineTable({
    taskId: v.id("pmTasks"),
    userId: v.string(),
    minutes: v.number(),
    description: v.optional(v.string()),
    loggedAt: v.number(), // Unix timestamp of the work date
    billable: v.optional(v.boolean()),
    date: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_task", ["taskId", "loggedAt"])
    .index("by_user", ["userId", "loggedAt"]),

  pmSprints: defineTable({
    projectId: v.id("pmProjects"),
    name: v.string(),
    goal: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    status: v.union(v.literal("planned"), v.literal("active"), v.literal("completed")),
    velocity: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId", "startDate"])
    .index("by_project_status", ["projectId", "status"]),

  pmTaskComments: defineTable({
    taskId: v.id("pmTasks"),
    authorId: v.string(),
    body: v.string(),
    mentions: v.optional(v.array(v.string())),
    reactions: v.optional(
      v.array(
        v.object({
          emoji: v.string(),
          userIds: v.array(v.string()),
        })
      )
    ),
    isEdited: v.optional(v.boolean()),
    editedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_taskId", ["taskId", "createdAt"])
    .index("by_authorId", ["authorId", "createdAt"]),

  pmProjectShares: defineTable({
    projectId: v.id("pmProjects"),
    sharedWithUserId: v.string(),
    sharedByUserId: v.string(),
    accessLevel: v.union(v.literal("view"), v.literal("comment"), v.literal("edit")),
    message: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_projectId", ["projectId", "createdAt"])
    .index("by_sharedWithUserId", ["sharedWithUserId", "createdAt"]),

  pmGithubEvents: defineTable({
    projectId: v.optional(v.id("pmProjects")),
    repository: v.string(),
    eventType: v.string(),
    deliveryId: v.optional(v.string()),
    action: v.optional(v.string()),
    payload: v.any(),
    createdAt: v.number(),
  })
    .index("by_projectId", ["projectId", "createdAt"])
    .index("by_repository", ["repository", "createdAt"])
    .index("by_deliveryId", ["deliveryId"]),

  // PM Roles - Role-based access control for PM system
  pmRoles: defineTable({
    userId: v.string(),
    scope: v.union(v.literal("global"), v.literal("workspace"), v.literal("project")),
    scopeId: v.optional(v.string()), // workspaceId or projectId if scoped
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("viewer")),
    createdAt: v.number(),
  })
    .index("by_user_scope", ["userId", "scope", "scopeId"])
    .index("by_scope", ["scope", "scopeId"]),

  // PM Deploy Logs - Integration with Convex deploy system
  pmDeploys: defineTable({
    deployId: v.string(),
    timestamp: v.number(),
    gitSha: v.string(),
    deployer: v.string(),
    environment: v.string(),
    modifiedFunctions: v.array(v.string()),
    taskIds: v.array(v.string()), // Tasks linked to this deploy
    createdAt: v.number(),
  })
    .index("by_deployId", ["deployId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_task", ["taskIds"]),

  adminNotes: defineTable({
    tenantId: v.string(),
    userId: v.string(), // owner — only visible to this user
    title: v.string(),
    content: v.optional(v.string()),
    color: v.string(),
    pinned: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant_user", ["tenantId", "userId"])
    .index("by_user", ["userId"]),

  adminTasks: defineTable({
    tenantId: v.string(),
    userId: v.string(), // owner — personal task list
    title: v.string(),
    priority: v.string(), // "low" | "medium" | "high"
    done: v.boolean(),
    dueDate: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant_user", ["tenantId", "userId"])
    .index("by_user", ["userId"]),

  examinations: defineTable({
    tenantId: v.string(),
    name: v.string(),
    classId: v.optional(v.string()),
    className: v.optional(v.string()),
    subjectId: v.optional(v.string()),
    date: v.string(),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    venue: v.optional(v.string()),
    status: v.string(), // "scheduled" | "ongoing" | "completed" | "cancelled"
    totalMarks: v.optional(v.number()),
    passMark: v.optional(v.number()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_date", ["tenantId", "date"])
    .index("by_tenant_status", ["tenantId", "status"]),

  // ── Waitlist Applications ─────────────────────────────────────────────────
  // Tracks users who signed up via WorkOS but are not yet in the DB.
  // Master admin reviews and approves/rejects; on approval the user is
  // created in the `users` table and added to a WorkOS Organization.
  waitlistApplications: defineTable({
    workosUserId: v.string(), // WorkOS user ID (real, not pending-)
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    country: v.optional(v.string()),
    county: v.optional(v.string()),
    // Application fields
    schoolName: v.optional(v.string()), // school/org they want to join
    requestedRole: v.optional(v.string()), // role they are requesting
    message: v.optional(v.string()), // optional message from applicant
    source: v.optional(v.string()), // landing_public_signup | workos_auth_signup
    // Review outcome
    status: v.string(), // "pending" | "approved" | "rejected"
    requestedAt: v.number(),
    reviewedBy: v.optional(v.string()), // master admin workosUserId
    reviewedAt: v.optional(v.number()),
    reviewNotes: v.optional(v.string()),
    // Post-approval assignment (set by master admin before approving)
    assignedTenantId: v.optional(v.string()),
    assignedRole: v.optional(v.string()),
    assignedOrgId: v.optional(v.string()), // Convex org _id
  })
    .index("by_status", ["status"])
    .index("by_email", ["email"])
    .index("by_workos_user", ["workosUserId"]),

  // ─── Library Fine System ──────────────────────────────────────────────────
  fineRules: defineTable({
    tenantId: v.string(),
    name: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("one_time")
    ),
    amount: v.number(),
    maxAmount: v.optional(v.number()),
    gracePeriodDays: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_active", ["tenantId", "isActive"]),

  // ─── HR Payroll System ───────────────────────────────────────────────────
  payrollPeriods: defineTable({
    tenantId: v.string(),
    name: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    payDate: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("paid")
    ),
    totalGrossPay: v.number(),
    totalNetPay: v.number(),
    totalDeductions: v.number(),
    employeeCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_status", ["tenantId", "status"]),

  payrollCalculations: defineTable({
    tenantId: v.string(),
    payrollPeriodId: v.id("payrollPeriods"),
    employeeId: v.string(),
    basicSalary: v.number(),
    allowances: v.number(),
    overtimeHours: v.number(),
    overtimeRate: v.number(),
    overtimePay: v.number(),
    grossPay: v.number(),
    deductions: v.array(
      v.object({
        type: v.string(),
        amount: v.number(),
        description: v.string(),
      })
    ),
    totalDeductions: v.number(),
    netPay: v.number(),
    payeTax: v.number(),
    nssf: v.number(),
    nhif: v.number(),
    otherDeductions: v.number(),
    status: v.union(v.literal("calculated"), v.literal("approved"), v.literal("paid")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_period", ["payrollPeriodId"])
    .index("by_employee_period", ["employeeId", "payrollPeriodId"]),

  allowanceRules: defineTable({
    tenantId: v.string(),
    name: v.string(),
    type: v.union(v.literal("fixed"), v.literal("percentage")),
    amount: v.number(),
    appliesToRoles: v.array(v.string()),
    conditions: v.array(
      v.object({
        minSalary: v.optional(v.number()),
        maxSalary: v.optional(v.number()),
        department: v.optional(v.string()),
      })
    ),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_active", ["tenantId", "isActive"]),

  deductionRules: defineTable({
    tenantId: v.string(),
    name: v.string(),
    type: v.union(v.literal("percentage"), v.literal("fixed")),
    amount: v.number(),
    appliesToRoles: v.array(v.string()),
    isTaxDeductible: v.boolean(),
    conditions: v.array(
      v.object({
        minSalary: v.optional(v.number()),
        maxSalary: v.optional(v.number()),
        department: v.optional(v.string()),
      })
    ),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_active", ["tenantId", "isActive"]),

  payrollPayments: defineTable({
    tenantId: v.string(),
    payrollPeriodId: v.id("payrollPeriods"),
    calculationId: v.id("payrollCalculations"),
    employeeId: v.string(),
    amount: v.number(),
    paymentMethod: v.string(),
    paymentReference: v.optional(v.string()),
    paidBy: v.string(),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_period", ["payrollPeriodId"])
    .index("by_calculation", ["calculationId"]),

  // ─── Communication Templates ─────────────────────────────────────────────
  communicationTemplates: defineTable({
    tenantId: v.string(),
    type: v.union(v.literal("sms"), v.literal("email")),
    category: v.string(), // "fee_reminder", "payment_confirmation", "assignment_due", etc.
    name: v.string(),
    subject: v.optional(v.string()), // for email templates
    content: v.string(),
    variables: v.array(v.string()), // list of variables that can be substituted
    isActive: v.boolean(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_type", ["tenantId", "type"])
    .index("by_tenant_category", ["tenantId", "category"])
    .index("by_tenant_active", ["tenantId", "isActive"]),

  // ─── Phase 2 Platform Schema Extensions ──────────────────────────────────

  platform_users: defineTable({
    userId: v.string(),
    workosUserId: v.optional(v.string()),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.string(),
    department: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    addedPermissions: v.optional(v.array(v.string())),
    removedPermissions: v.optional(v.array(v.string())),
    scopeCountries: v.optional(v.array(v.string())),
    scopeTenantIds: v.optional(v.array(v.string())),
    scopePlans: v.optional(v.array(v.string())),
    status: v.union(v.literal("active"), v.literal("suspended")),
    accessExpiresAt: v.optional(v.number()),
    twoFactorEnabled: v.optional(v.boolean()),
    sessionCount: v.optional(v.number()),
    invitedBy: v.optional(v.string()),
    acceptedAt: v.optional(v.number()),
    lastLogin: v.optional(v.number()),
    lastActivityAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.string()),
    deletedReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_workosUserId", ["workosUserId"])
    .index("by_role", ["role"])
    .index("by_status", ["status"])
    .index("by_accessExpiresAt", ["accessExpiresAt"])
    .index("by_createdAt", ["createdAt"]),

  platform_roles: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    baseRole: v.optional(v.string()),
    isSystem: v.boolean(),
    isActive: v.boolean(),
    color: v.string(),
    icon: v.string(),
    permissions: v.array(v.string()),
    userCount: v.optional(v.number()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_isSystem", ["isSystem"])
    .index("by_isActive", ["isActive"]),

  platform_user_invites: defineTable({
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.string(),
    department: v.optional(v.string()),
    addedPermissions: v.optional(v.array(v.string())),
    removedPermissions: v.optional(v.array(v.string())),
    scopeCountries: v.optional(v.array(v.string())),
    scopeTenantIds: v.optional(v.array(v.string())),
    scopePlans: v.optional(v.array(v.string())),
    accessExpiresAt: v.optional(v.number()),
    invitedBy: v.string(),
    token: v.string(),
    workosInvitationToken: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("expired"),
      v.literal("revoked")
    ),
    expiresAt: v.number(),
    acceptedAt: v.optional(v.number()),
    notifyInviter: v.optional(v.boolean()),
    personalMessage: v.optional(v.string()),
    remindersSent: v.optional(v.number()),
    lastReminderAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_token", ["token"])
    .index("by_status", ["status"])
    .index("by_invitedBy", ["invitedBy"])
    .index("by_expiresAt", ["expiresAt"])
    .index("by_createdAt", ["createdAt"]),

  permission_audit_log: defineTable({
    targetUserId: v.string(),
    changedBy: v.string(),
    changeType: v.union(
      v.literal("role_changed"),
      v.literal("permission_added"),
      v.literal("permission_removed"),
      v.literal("scope_changed"),
      v.literal("access_expiry_set"),
      v.literal("account_suspended"),
      v.literal("account_unsuspended")
    ),
    permissionKey: v.optional(v.string()),
    roleSlug: v.optional(v.string()),
    changeSummary: v.optional(v.string()),
    previousValue: v.string(),
    newValue: v.string(),
    reason: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_targetUserId", ["targetUserId"])
    .index("by_changedBy", ["changedBy"])
    .index("by_createdAt", ["createdAt"]),

  platform_sessions: defineTable({
    platformUserId: v.optional(v.id("platform_users")),
    userId: v.string(),
    workosUserId: v.optional(v.string()),
    sessionId: v.string(),
    sessionToken: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    deviceLabel: v.optional(v.string()),
    location: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    lastActiveAt: v.number(),
    expiresAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
    isCurrent: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId", "lastActiveAt"])
    .index("by_sessionId", ["sessionId"])
    .index("by_platformUserId", ["platformUserId", "lastActiveAt"]),

  platform_notifications: defineTable({
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    type: v.union(
      v.literal("invite"),
      v.literal("rbac"),
      v.literal("crm"),
      v.literal("pm"),
      v.literal("security"),
      v.literal("billing"),
      v.literal("waitlist"),
      v.literal("system")
    ),
    actionUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
    isRead: v.boolean(),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId", "createdAt"])
    .index("by_userId_isRead", ["userId", "isRead"])
    .index("by_type", ["type", "createdAt"]),

  platform_settings: defineTable({
    key: v.string(),
    value: v.any(),
    updatedBy: v.string(),
    updatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_updatedAt", ["updatedAt"]),

  feature_flags: defineTable({
    key: v.string(),
    enabledGlobally: v.boolean(),
    enabledTenantIds: v.array(v.string()),
    rolloutPct: v.optional(v.number()),
    updatedBy: v.string(),
    updatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_updatedAt", ["updatedAt"]),

  maintenance_windows: defineTable({
    startAt: v.number(),
    endAt: v.number(),
    reason: v.string(),
    affectsTenants: v.array(v.string()),
    bypassIps: v.array(v.string()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    createdBy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_startAt", ["startAt"])
    .index("by_createdAt", ["createdAt"]),

  waitlist: defineTable({
      fullName: v.string(),
      email: v.string(),
      schoolName: v.string(),
      country: v.string(),
      county: v.optional(v.string()),
      studentCount: v.optional(v.number()),
      phone: v.optional(v.string()),
      currentSystem: v.optional(v.string()),
      referralSource: v.optional(v.string()),
      referralCode: v.optional(v.string()),
      biggestChallenge: v.optional(v.string()),
      status: v.union(
        v.literal("waiting"),
        v.literal("invited"),
        v.literal("converted"),
        v.literal("rejected"),
        v.literal("expired")
      ),
      isHighValue: v.optional(v.boolean()),
      qualificationScore: v.optional(v.number()),
      assignedTo: v.optional(v.string()),
      resellerId: v.optional(v.string()),
      sourceChannel: v.optional(v.string()),
      marketingAttribution: v.optional(v.object({
        utmSource: v.optional(v.string()),
        utmMedium: v.optional(v.string()),
        utmCampaign: v.optional(v.string()),
        utmTerm: v.optional(v.string()),
        utmContent: v.optional(v.string()),
        gclid: v.optional(v.string()),
        fbclid: v.optional(v.string()),
        msclkid: v.optional(v.string()),
        ttclid: v.optional(v.string()),
        referrer: v.optional(v.string()),
        landingPage: v.optional(v.string()),
        currentPage: v.optional(v.string()),
        originPath: v.optional(v.string()),
        ctaSource: v.optional(v.string()),
        ctaLabel: v.optional(v.string()),
        referralClickId: v.optional(v.string()),
      })),
      invitedAt: v.optional(v.number()),
      inviteEmailSentAt: v.optional(v.number()),
      convertedAt: v.optional(v.number()),
      crmLeadId: v.optional(v.string()),
      inviteToken: v.optional(v.string()),
      inviteExpiresAt: v.optional(v.number()),
      tenantId: v.optional(v.string()),
      notes: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_email", ["email"])
      .index("by_status", ["status"])
      .index("by_inviteToken", ["inviteToken"])
      .index("by_isHighValue", ["isHighValue"])
      .index("by_assignedTo", ["assignedTo"])
      .index("by_resellerId", ["resellerId"])
      .index("by_createdAt", ["createdAt"]),

  demo_requests: defineTable({
      fullName: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
      schoolName: v.string(),
      schoolType: v.optional(v.string()),
      jobTitle: v.optional(v.string()),
      preferredDemoDate: v.optional(v.string()),
      needs: v.optional(v.string()),
      country: v.optional(v.string()),
      county: v.optional(v.string()),
      studentCount: v.optional(v.number()),
      currentSystem: v.optional(v.string()),
      referralSource: v.optional(v.string()),
      referralCode: v.optional(v.string()),
      sourceChannel: v.optional(v.string()),
      marketingAttribution: v.optional(v.object({
        utmSource: v.optional(v.string()),
        utmMedium: v.optional(v.string()),
        utmCampaign: v.optional(v.string()),
        utmTerm: v.optional(v.string()),
        utmContent: v.optional(v.string()),
        gclid: v.optional(v.string()),
        fbclid: v.optional(v.string()),
        msclkid: v.optional(v.string()),
        ttclid: v.optional(v.string()),
        referrer: v.optional(v.string()),
        landingPage: v.optional(v.string()),
        currentPage: v.optional(v.string()),
        originPath: v.optional(v.string()),
        ctaSource: v.optional(v.string()),
        ctaLabel: v.optional(v.string()),
        referralClickId: v.optional(v.string()),
      })),
      qualificationScore: v.optional(v.number()),
      isHighValue: v.optional(v.boolean()),
      status: v.union(
        v.literal("requested"),
        v.literal("contacted"),
        v.literal("scheduled"),
        v.literal("completed"),
        v.literal("cancelled")
      ),
      priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
      assignedTo: v.optional(v.string()),
      assignedTeam: v.optional(v.string()),
      crmLeadId: v.optional(v.string()),
      scheduledFor: v.optional(v.number()),
      scheduledEndAt: v.optional(v.number()),
      meetingUrl: v.optional(v.string()),
      bookingSource: v.optional(v.string()),
      externalBookingId: v.optional(v.string()),
      externalBookingUid: v.optional(v.string()),
      nextActionAt: v.optional(v.number()),
      nextActionLabel: v.optional(v.string()),
      lastContactedAt: v.optional(v.number()),
      notesInternal: v.optional(v.string()),
      outcome: v.optional(v.string()),
      deletedAt: v.optional(v.number()),
      deletedBy: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_email", ["email"])
      .index("by_status", ["status"])
      .index("by_createdAt", ["createdAt"])
      .index("by_crmLeadId", ["crmLeadId"])
      .index("by_assignedTo", ["assignedTo", "updatedAt"])
      .index("by_scheduledFor", ["scheduledFor"])
      .index("by_nextActionAt", ["nextActionAt"])
      .index("by_externalBookingUid", ["externalBookingUid"])
      .index("by_externalBookingId", ["externalBookingId"]),

  demo_request_events: defineTable({
      demoRequestId: v.id("demo_requests"),
      eventType: v.string(),
      title: v.string(),
      body: v.optional(v.string()),
      actorUserId: v.optional(v.string()),
      actorEmail: v.optional(v.string()),
      metadata: v.optional(v.any()),
      createdAt: v.number(),
    })
      .index("by_demoRequestId", ["demoRequestId", "createdAt"])
      .index("by_createdAt", ["createdAt"]),

  tenant_invites: defineTable({
      email: v.string(),
      schoolName: v.optional(v.string()),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      country: v.optional(v.string()),
      county: v.optional(v.string()),
      phone: v.optional(v.string()),
      studentCountEstimate: v.optional(v.number()),
      suggestedPlan: v.optional(v.string()),
      suggestedModules: v.optional(v.array(v.string())),
      referralCode: v.optional(v.string()),
      resellerId: v.optional(v.string()),
      tenantId: v.string(),
      role: v.string(),
      invitedBy: v.string(),
      waitlistId: v.optional(v.id("waitlist")),
      crmLeadId: v.optional(v.string()),
      token: v.string(),
      status: v.union(
        v.literal("pending"),
      v.literal("accepted"),
      v.literal("expired"),
      v.literal("revoked")
    ),
    expiresAt: v.number(),
      acceptedAt: v.optional(v.number()),
      personalMessage: v.optional(v.string()),
      emailSentAt: v.optional(v.number()),
      remindersSent: v.optional(v.number()),
      lastReminderAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_tenantId", ["tenantId"])
      .index("by_email", ["email"])
      .index("by_status", ["status"])
      .index("by_tenant_status", ["tenantId", "status"])
      .index("by_token", ["token"])
      .index("by_resellerId", ["resellerId"])
      .index("by_createdAt", ["createdAt"]),

  tenant_onboarding: defineTable({
      tenantId: v.string(),
      wizardCompleted: v.boolean(),
      wizardCompletedAt: v.optional(v.number()),
      currentStep: v.optional(v.number()),
      isActivated: v.optional(v.boolean()),
      steps: v.object({
      schoolProfile: v.optional(v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), count: v.optional(v.number()), pointsAwarded: v.optional(v.number()) })),
      academicYear: v.optional(v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), count: v.optional(v.number()), pointsAwarded: v.optional(v.number()) })),
      gradingSystem: v.optional(v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), count: v.optional(v.number()), pointsAwarded: v.optional(v.number()) })),
      subjects: v.optional(v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), count: v.optional(v.number()), pointsAwarded: v.optional(v.number()) })),
      classes: v.optional(v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), count: v.optional(v.number()), pointsAwarded: v.optional(v.number()) })),
      feeStructure: v.optional(v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), count: v.optional(v.number()), pointsAwarded: v.optional(v.number()) })),
      staffAdded: v.optional(v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), count: v.optional(v.number()), pointsAwarded: v.optional(v.number()) })),
      studentsAdded: v.optional(v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), count: v.optional(v.number()), pointsAwarded: v.optional(v.number()) })),
      modulesConfigured: v.optional(v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), count: v.optional(v.number()), pointsAwarded: v.optional(v.number()) })),
      portalCustomized: v.optional(v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), count: v.optional(v.number()), pointsAwarded: v.optional(v.number()) })),
      parentsInvited: v.optional(v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), count: v.optional(v.number()), pointsAwarded: v.optional(v.number()) })),
      firstAction: v.optional(v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), count: v.optional(v.number()), pointsAwarded: v.optional(v.number()) })),
      rolesConfigured: v.optional(v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), count: v.optional(v.number()) })),
      classesCreated: v.optional(v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), count: v.optional(v.number()) })),
      firstPaymentProcessed: v.optional(v.object({ completed: v.boolean(), completedAt: v.optional(v.number()), count: v.optional(v.number()) })),
      }),
      stepPayloads: v.optional(v.object({
        schoolProfile: v.optional(v.object({
          schoolType: v.optional(v.string()),
          levels: v.optional(v.array(v.string())),
          boardingType: v.optional(v.string()),
          officialEmail: v.optional(v.string()),
          phone: v.optional(v.string()),
          website: v.optional(v.string()),
          county: v.optional(v.string()),
          registrationNumber: v.optional(v.string()),
          logoUrl: v.optional(v.string()),
        })),
        academicYear: v.optional(v.object({
          yearName: v.string(),
          startDate: v.string(),
          endDate: v.string(),
          structure: v.string(),
        })),
        gradingSystem: v.optional(v.object({
          preset: v.string(),
          passMark: v.number(),
          scaleLabel: v.optional(v.string()),
        })),
        subjects: v.optional(v.array(v.object({
          name: v.string(),
          code: v.string(),
          department: v.optional(v.string()),
        }))),
        classes: v.optional(v.array(v.object({
          name: v.string(),
          level: v.optional(v.string()),
          stream: v.optional(v.string()),
          capacity: v.optional(v.number()),
          academicYear: v.optional(v.string()),
        }))),
        feeStructure: v.optional(v.object({
          name: v.string(),
          amount: v.number(),
          academicYear: v.string(),
          grade: v.string(),
          frequency: v.string(),
        })),
        staffAdded: v.optional(v.array(v.object({
          email: v.string(),
          firstName: v.optional(v.string()),
          lastName: v.optional(v.string()),
          role: v.string(),
          department: v.optional(v.string()),
        }))),
        studentsAdded: v.optional(v.array(v.object({
          admissionNumber: v.optional(v.string()),
          firstName: v.string(),
          lastName: v.string(),
          dateOfBirth: v.string(),
          gender: v.string(),
          className: v.optional(v.string()),
          guardianName: v.optional(v.string()),
          guardianEmail: v.optional(v.string()),
          guardianPhone: v.optional(v.string()),
        }))),
        portalCustomized: v.optional(v.object({
          brandName: v.optional(v.string()),
          logoUrl: v.optional(v.string()),
          primaryColor: v.optional(v.string()),
          secondaryColor: v.optional(v.string()),
          accentColor: v.optional(v.string()),
          footerText: v.optional(v.string()),
        })),
      })),
      healthScore: v.number(),
      lastActivityAt: v.number(),
      stalled: v.boolean(),
      isStalled: v.optional(v.boolean()),
      stalledSince: v.optional(v.number()),
      stalledAtStep: v.optional(v.number()),
      assignedAccountManager: v.optional(v.string()),
      platformNotes: v.optional(v.array(v.object({
        id: v.string(),
        note: v.string(),
        authorId: v.string(),
        authorEmail: v.string(),
        createdAt: v.number(),
      }))),
      interventionsSent: v.optional(v.array(v.object({
        type: v.string(),
        sentAt: v.number(),
        channel: v.string(),
      }))),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_tenantId", ["tenantId"])
      .index("by_stalled", ["stalled"])
      .index("by_lastActivityAt", ["lastActivityAt"]),

  staff_invites: defineTable({
      tenantId: v.string(),
      email: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      role: v.string(),
      department: v.optional(v.string()),
      phone: v.optional(v.string()),
      staffNumber: v.optional(v.string()),
      jobTitle: v.optional(v.string()),
      token: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("expired"),
        v.literal("revoked")
      ),
      invitedBy: v.string(),
      expiresAt: v.number(),
      acceptedAt: v.optional(v.number()),
      workosUserId: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
      .index("by_token", ["token"])
      .index("by_tenantId", ["tenantId"])
      .index("by_status", ["status"]),

  parent_invites: defineTable({
      tenantId: v.string(),
      studentId: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      token: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("expired"),
        v.literal("revoked")
      ),
      invitedBy: v.string(),
      expiresAt: v.number(),
      acceptedAt: v.optional(v.number()),
      workosUserId: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
      .index("by_token", ["token"])
      .index("by_tenantId", ["tenantId"])
      .index("by_status", ["status"]),

  trial_interventions: defineTable({
    tenantId: v.string(),
    interventionType: v.union(
      v.literal("email"),
      v.literal("in_app"),
      v.literal("sms"),
      v.literal("call_scheduled")
    ),
    trigger: v.union(
      v.literal("day_1"),
      v.literal("day_3"),
      v.literal("day_7"),
      v.literal("day_10"),
      v.literal("day_12"),
      v.literal("day_13"),
      v.literal("day_14")
    ),
    sentAt: v.number(),
    opened: v.optional(v.boolean()),
    clicked: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_tenant_trigger", ["tenantId", "trigger"])
    .index("by_sentAt", ["sentAt"]),

  churn_records: defineTable({
    tenantId: v.string(),
    cancellationReason: v.string(),
    cancellationDetail: v.optional(v.string()),
    cancelledBy: v.string(),
    effectiveDate: v.number(),
    retentionOfferMade: v.optional(v.boolean()),
    retentionOfferAccepted: v.optional(v.boolean()),
    dataExportRequested: v.optional(v.boolean()),
    dataPurgeDate: v.optional(v.number()),
    crmDealId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_effectiveDate", ["effectiveDate"])
    .index("by_createdAt", ["createdAt"]),

  subscription_plans: defineTable({
    name: v.string(),
    priceMonthlyKes: v.number(),
    priceAnnualKes: v.number(),
    studentLimit: v.optional(v.number()),
    staffLimit: v.optional(v.number()),
    storageGb: v.optional(v.number()),
    includedModuleIds: v.array(v.string()),
    maxAdditionalModules: v.optional(v.number()),
    apiAccess: v.union(v.literal("none"), v.literal("read"), v.literal("read_write")),
    whiteLabel: v.union(v.literal("none"), v.literal("logo"), v.literal("full")),
    customDomain: v.boolean(),
    supportTier: v.string(),
    slaHours: v.optional(v.number()),
    isActive: v.boolean(),
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_isActive", ["isActive"])
    .index("by_isDefault", ["isDefault"])
    .index("by_updatedAt", ["updatedAt"]),

  tenant_subscriptions: defineTable({
    tenantId: v.string(),
    planId: v.string(),
    status: v.union(
      v.literal("trialing"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("suspended"),
      v.literal("cancelled")
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    studentCountAtBilling: v.optional(v.number()),
    paymentProvider: v.optional(
      v.union(
        v.literal("mpesa"),
        v.literal("airtel"),
        v.literal("stripe"),
        v.literal("bank_transfer")
      )
    ),
    paymentReference: v.optional(v.string()),
    customPriceMonthlyKes: v.optional(v.number()),
    customPriceAnnualKes: v.optional(v.number()),
    customPricingNotes: v.optional(v.string()),
    billingPeriod: v.optional(
      v.union(
        v.literal("monthly"),
        v.literal("termly"),
        v.literal("quarterly"),
        v.literal("annual")
      )
    ),
    nextPaymentDue: v.optional(v.number()),
    trialEndsAt: v.optional(v.number()),
    graceEndsAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    cancellationReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_status", ["status"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_currentPeriodEnd", ["currentPeriodEnd"])
    .index("by_updatedAt", ["updatedAt"]),

  subscription_invoices: defineTable({
    tenantId: v.string(),
    subscriptionId: v.string(),
    amountKes: v.number(),
    displayCurrency: v.string(),
    displayAmount: v.number(),
    exchangeRate: v.number(),
    vatAmountKes: v.number(),
    totalAmountKes: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("void"),
      v.literal("refunded")
    ),
    billingPeriod: v.optional(
      v.union(
        v.literal("monthly"),
        v.literal("termly"),
        v.literal("quarterly"),
        v.literal("annual")
      )
    ),
    dueDate: v.number(),
    paidAt: v.optional(v.number()),
    paymentProvider: v.optional(v.string()),
    paymentReference: v.optional(v.string()),
    lineItems: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        amountKes: v.number(),
      })
    ),
    pdfUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_status", ["status"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_dueDate", ["dueDate"])
    .index("by_createdAt", ["createdAt"]),

  subscription_plan_changes: defineTable({
    tenantId: v.string(),
    fromPlanId: v.string(),
    toPlanId: v.string(),
    changeType: v.union(
      v.literal("upgrade"),
      v.literal("downgrade"),
      v.literal("custom_negotiation")
    ),
    effectiveDate: v.number(),
    initiatedBy: v.string(),
    prorationAmountKes: v.optional(v.number()),
    refundAmountKes: v.optional(v.number()),
    modulesSuspended: v.array(v.string()),
    modulesUnlocked: v.array(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("scheduled")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_status", ["status"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_effectiveDate", ["effectiveDate"])
    .index("by_createdAt", ["createdAt"]),

  tenant_usage_stats: defineTable({
    tenantId: v.string(),
    studentCount: v.number(),
    staffCount: v.number(),
    storageUsedGb: v.number(),
    recordedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_recordedAt", ["recordedAt"])
    .index("by_tenant_recordedAt", ["tenantId", "recordedAt"]),

  currency_rates: defineTable({
    fromCurrency: v.string(),
    toCurrency: v.string(),
    rate: v.number(),
    fetchedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_pair", ["fromCurrency", "toCurrency"])
    .index("by_fetchedAt", ["fetchedAt"]),

  module_price_history: defineTable({
    moduleId: v.union(v.string(), v.id("marketplace_modules")),
    tenantId: v.optional(v.string()),
    changeType: v.optional(
      v.union(
        v.literal("global_base"),
        v.literal("global_band"),
        v.literal("override_created"),
        v.literal("override_revoked"),
        v.literal("plan_override")
      )
    ),
    previousPricing: v.optional(v.string()),
    newPricing: v.optional(v.string()),
    oldPriceKes: v.number(),
    newPriceKes: v.number(),
    changedBy: v.string(),
    changedAt: v.number(),
    reason: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_moduleId", ["moduleId"])
    .index("by_tenantId", ["tenantId"])
    .index("by_changedAt", ["changedAt"]),

  platform_pricing_rules: defineTable({
    category: v.string(),
    minPriceKes: v.number(),
    maxPriceKes: v.number(),
    defaultRevenueSharePct: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_updatedAt", ["updatedAt"]),

  publishers: defineTable({
    userId: v.string(),
    companyName: v.string(),
    email: v.string(),
    website: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("suspended"),
      v.literal("banned")
    ),
    tier: v.union(v.literal("indie"), v.literal("verified"), v.literal("enterprise")),
    revenueSharePct: v.number(),
    bankDetails: v.optional(v.any()),
    webhookUrl: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    taxId: v.optional(v.string()),
    billingCountry: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_tier", ["tier"])
    .index("by_createdAt", ["createdAt"]),

  modules: defineTable({
    publisherId: v.string(),
    name: v.string(),
    slug: v.string(),
    tagline: v.optional(v.string()),
    category: v.string(),
    description: v.string(),
    featureList: v.array(v.string()),
    supportedRoles: v.array(v.string()),
    minimumPlan: v.optional(v.string()),
    pricingModel: v.string(),
    suggestedPriceKes: v.optional(v.number()),
    platformPriceKes: v.optional(v.number()),
    compatibleModuleIds: v.array(v.string()),
    incompatibleModuleIds: v.array(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("pending_review"),
      v.literal("changes_requested"),
      v.literal("published"),
      v.literal("deprecated"),
      v.literal("suspended"),
      v.literal("banned")
    ),
    isFeatured: v.boolean(),
    documentationUrl: v.optional(v.string()),
    supportEmail: v.optional(v.string()),
    termsUrl: v.optional(v.string()),
    privacyUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_publisherId", ["publisherId"])
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_updatedAt", ["updatedAt"]),

  module_versions: defineTable({
    moduleId: v.union(v.string(), v.id("marketplace_modules")),
    version: v.string(),
    releaseType: v.optional(
      v.union(v.literal("patch"), v.literal("minor"), v.literal("major"))
    ),
    changelog: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("pending_review"),
      v.literal("published"),
      v.literal("deprecated")
    ),
    releasedAt: v.optional(v.number()),
    isCurrentVersion: v.optional(v.boolean()),
    releasedBy: v.optional(v.string()),
    submittedAt: v.optional(v.number()),
    reviewedAt: v.optional(v.number()),
    reviewerId: v.optional(v.string()),
    reviewerNotes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_moduleId", ["moduleId"])
    .index("by_moduleId_version", ["moduleId", "version"])
    .index("by_status", ["status"])
    .index("by_submittedAt", ["submittedAt"])
    .index("by_updatedAt", ["updatedAt"]),

  module_assets: defineTable({
    moduleId: v.string(),
    versionId: v.optional(v.string()),
    type: v.union(v.literal("screenshot"), v.literal("video")),
    url: v.string(),
    order: v.number(),
    createdAt: v.number(),
  })
    .index("by_moduleId", ["moduleId"])
    .index("by_versionId", ["versionId"])
    .index("by_type", ["type"]),

  module_installs: defineTable({
    moduleId: v.union(v.string(), v.id("marketplace_modules")),
    moduleSlug: v.optional(v.string()),
    versionId: v.optional(v.string()),
    tenantId: v.string(),
    status: v.union(
      v.literal("install_requested"),
      v.literal("payment_pending"),
      v.literal("payment_failed"),
      v.literal("installing"),
      v.literal("active"),
      v.literal("disabled"),
      v.literal("suspended"),
      v.literal("suspended_platform"),
      v.literal("suspended_payment"),
      v.literal("uninstalling"),
      v.literal("uninstalled"),
      v.literal("data_purged")
    ),
    billingPeriod: v.optional(
      v.union(
        v.literal("monthly"),
        v.literal("termly"),
        v.literal("quarterly"),
        v.literal("annual")
      )
    ),
    currentPriceKes: v.optional(v.number()),
    hasPriceOverride: v.optional(v.boolean()),
    priceOverrideId: v.optional(v.id("module_price_overrides")),
    pilotGrantId: v.optional(v.id("pilot_grants")),
    provisionedByPilotGrantId: v.optional(v.id("pilot_grants")),
    isFree: v.optional(v.boolean()),
    firstInstalledAt: v.optional(v.number()),
    trialEndsAt: v.optional(v.number()),
    billingStartsAt: v.optional(v.number()),
    nextBillingDate: v.optional(v.number()),
    installedAt: v.optional(v.number()),
    installedBy: v.optional(v.string()),
    uninstalledAt: v.optional(v.number()),
    uninstalledBy: v.optional(v.string()),
    dataRetentionEndsAt: v.optional(v.number()),
    disabledAt: v.optional(v.number()),
    disabledBy: v.optional(v.string()),
    version: v.optional(v.string()),
    paymentFailureCount: v.optional(v.number()),
    lastPaymentFailureAt: v.optional(v.number()),
    exceptionGrantId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_status", ["status"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_moduleId", ["moduleId"])
    .index("by_installedAt", ["installedAt"])
    .index("by_tenantId_moduleSlug", ["tenantId", "moduleSlug"])
    .index("by_nextBillingDate", ["nextBillingDate"])
    .index("by_dataRetentionEndsAt", ["dataRetentionEndsAt"]),

  module_configs: defineTable({
    moduleId: v.string(),
    tenantId: v.string(),
    rolePermissions: v.optional(v.record(v.string(), v.array(v.string()))),
    featureFlags: v.optional(v.record(v.string(), v.boolean())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_moduleId", ["moduleId"])
    .index("by_tenant_module", ["tenantId", "moduleId"])
    .index("by_updatedAt", ["updatedAt"]),

  module_exception_grants: defineTable({
    moduleId: v.string(),
    tenantId: v.string(),
    grantedBy: v.string(),
    grantedAt: v.number(),
    expiresAt: v.optional(v.number()),
    reason: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_moduleId", ["moduleId"])
    .index("by_tenant_module", ["tenantId", "moduleId"])
    .index("by_expiresAt", ["expiresAt"]),

  module_requests: defineTable({
    tenantId: v.string(),
    requestedBy: v.string(),
    type: v.union(
      v.literal("new_module"),
      v.literal("plan_locked"),
      v.literal("rbac_restricted"),
      v.literal("beta_suspended")
    ),
    moduleId: v.optional(v.string()),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    useCase: v.optional(v.string()),
    urgencyLevel: v.optional(v.string()),
    budgetKes: v.optional(v.number()),
    status: v.union(
      v.literal("submitted"),
      v.literal("under_review"),
      v.literal("approved_plan_upgrade_required"),
      v.literal("approved_exception_granted"),
      v.literal("approved_forwarded"),
      v.literal("rejected"),
      v.literal("waitlisted")
    ),
    resolution: v.optional(v.string()),
    waitlistPosition: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_status", ["status"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_moduleId", ["moduleId"])
    .index("by_createdAt", ["createdAt"]),

  module_waitlist: defineTable({
    moduleId: v.string(),
    tenantId: v.string(),
    joinedAt: v.number(),
    notifiedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_moduleId", ["moduleId"])
    .index("by_tenant_module", ["tenantId", "moduleId"])
    .index("by_joinedAt", ["joinedAt"]),

  module_reviews: defineTable({
    moduleId: v.union(v.string(), v.id("marketplace_modules")),
    tenantId: v.string(),
    reviewerUserId: v.optional(v.string()),
    rating: v.number(),
    title: v.string(),
    body: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("flagged"),
      v.literal("deleted")
    ),
    publisherReply: v.optional(v.string()),
    publisherReplyAt: v.optional(v.number()),
    moderatorNote: v.optional(v.string()),
    flaggedAt: v.optional(v.number()),
    installedDaysAtReview: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_status", ["status"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_moduleId", ["moduleId"])
    .index("by_moduleId_status", ["moduleId", "status"])
    .index("by_createdAt", ["createdAt"]),

  module_flags: defineTable({
    moduleId: v.union(v.string(), v.id("marketplace_modules")),
    tenantId: v.string(),
    flaggedBy: v.string(),
    reason: v.union(
      v.literal("misleading_description"),
      v.literal("not_working"),
      v.literal("inappropriate"),
      v.literal("security_concern"),
      v.literal("pricing_dispute"),
      v.literal("other")
    ),
    details: v.optional(v.string()),
    status: v.union(
      v.literal("flagged"),
      v.literal("under_investigation"),
      v.literal("resolved_no_action"),
      v.literal("resolved_warning"),
      v.literal("resolved_suspended"),
      v.literal("resolved_banned")
    ),
    resolution: v.optional(v.string()),
    adminNotes: v.optional(v.string()),
    publisherResponse: v.optional(v.string()),
    investigatedBy: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_status", ["status"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_moduleId", ["moduleId"])
    .index("by_createdAt", ["createdAt"]),

  module_payments: defineTable({
    moduleId: v.string(),
    tenantId: v.string(),
    amountKes: v.number(),
    currency: v.string(),
    displayAmount: v.number(),
    exchangeRate: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("success"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    provider: v.string(),
    invoiceId: v.optional(v.string()),
    periodStart: v.optional(v.number()),
    periodEnd: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_status", ["status"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_moduleId", ["moduleId"])
    .index("by_createdAt", ["createdAt"]),

  module_revenue_splits: defineTable({
    paymentId: v.string(),
    publisherAmountKes: v.number(),
    platformAmountKes: v.number(),
    revenueSharePct: v.number(),
    createdAt: v.number(),
  })
    .index("by_paymentId", ["paymentId"])
    .index("by_createdAt", ["createdAt"]),

  module_analytics_events: defineTable({
    moduleId: v.string(),
    tenantId: v.string(),
    eventType: v.string(),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
    createdAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_moduleId", ["moduleId"])
    .index("by_eventType", ["eventType"])
    .index("by_timestamp", ["timestamp"])
    .index("by_tenant_timestamp", ["tenantId", "timestamp"]),

  module_install_stats: defineTable({
    moduleId: v.string(),
    totalInstalls: v.number(),
    activeInstalls: v.number(),
    churnedInstalls: v.number(),
    avgRating: v.optional(v.number()),
    totalRevenueKes: v.number(),
    updatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_moduleId", ["moduleId"])
    .index("by_updatedAt", ["updatedAt"]),

  pilot_grants: defineTable({
    moduleId: v.union(v.string(), v.id("marketplace_modules")),
    tenantId: v.string(),
    grantType: v.union(
      v.literal("free_trial"),
      v.literal("free_permanent"),
      v.literal("discounted"),
      v.literal("plan_upgrade"),
      v.literal("beta_access")
    ),
    discountPct: v.optional(v.number()),
    customPriceKes: v.optional(v.number()),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    grantedBy: v.string(),
    reason: v.string(),
    grantScope: v.optional(
      v.union(v.literal("single"), v.literal("selected"), v.literal("all"))
    ),
    stealthMode: v.boolean(),
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("revoked"),
      v.literal("extended")
    ),
    convertedToPaid: v.boolean(),
    notificationsSent: v.array(v.string()),
    revokedAt: v.optional(v.number()),
    revokedBy: v.optional(v.string()),
    revokedReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_moduleId_tenantId", ["moduleId", "tenantId"])
    .index("by_status", ["status"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_moduleId", ["moduleId"])
    .index("by_endDate", ["endDate"]),

  publisher_payouts: defineTable({
    publisherId: v.string(),
    amountKes: v.number(),
    periodStart: v.number(),
    periodEnd: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("paid"),
      v.literal("failed")
    ),
    processedAt: v.optional(v.number()),
    bankReference: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_publisherId", ["publisherId"])
    .index("by_status", ["status"])
    .index("by_periodEnd", ["periodEnd"])
    .index("by_createdAt", ["createdAt"]),

  publisher_support_tickets: defineTable({
    publisherId: v.string(),
    moduleId: v.string(),
    tenantId: v.string(),
    subject: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    assignedTo: v.optional(v.string()),
    slaDueAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
    thread: v.optional(v.array(v.any())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_status", ["status"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_publisherId", ["publisherId"])
    .index("by_createdAt", ["createdAt"]),

  publisher_webhook_logs: defineTable({
    publisherId: v.string(),
    moduleId: v.optional(v.string()),
    eventType: v.string(),
    payload: v.any(),
    status: v.union(
      v.literal("delivered"),
      v.literal("failed"),
      v.literal("retrying")
    ),
    attempts: v.number(),
    lastAttemptAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_publisherId", ["publisherId"])
    .index("by_status", ["status"])
    .index("by_eventType", ["eventType"])
    .index("by_createdAt", ["createdAt"]),

  crm_leads: defineTable({
    schoolName: v.string(),
    contactName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    country: v.string(),
    studentCount: v.optional(v.number()),
    budgetConfirmed: v.optional(v.boolean()),
    timeline: v.optional(v.string()),
    decisionMaker: v.optional(v.string()),
    source: v.optional(v.string()),
    qualificationScore: v.optional(v.number()),
    probability: v.optional(v.number()),
    stage: v.string(),
    assignedTo: v.optional(v.string()),
    ownerId: v.optional(v.string()),
    dealValueKes: v.optional(v.number()),
    expectedClose: v.optional(v.number()),
    tenantId: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
    sourceType: v.optional(v.string()),
    marketingAttribution: v.optional(v.object({
      utmSource: v.optional(v.string()),
      utmMedium: v.optional(v.string()),
      utmCampaign: v.optional(v.string()),
      utmTerm: v.optional(v.string()),
      utmContent: v.optional(v.string()),
      gclid: v.optional(v.string()),
      fbclid: v.optional(v.string()),
      msclkid: v.optional(v.string()),
      ttclid: v.optional(v.string()),
      referrer: v.optional(v.string()),
      landingPage: v.optional(v.string()),
      currentPage: v.optional(v.string()),
      originPath: v.optional(v.string()),
      ctaSource: v.optional(v.string()),
      ctaLabel: v.optional(v.string()),
      referralClickId: v.optional(v.string()),
    })),
    isArchived: v.optional(v.boolean()),
    isDeleted: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    lastContactedAt: v.optional(v.number()),
    nextFollowUpAt: v.optional(v.number()),
    nextFollowUpNote: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_stage", ["stage"])
    .index("by_email", ["email"])
    .index("by_createdAt", ["createdAt"])
    .index("by_ownerId", ["ownerId", "updatedAt"])
    .index("by_assignedTo", ["assignedTo", "updatedAt"]),

  crm_deals: defineTable({
    leadId: v.string(),
    tenantId: v.optional(v.string()),
    valueKes: v.number(),
    stage: v.string(),
    proposalId: v.optional(v.string()),
    closedAt: v.optional(v.number()),
    status: v.union(v.literal("open"), v.literal("won"), v.literal("lost")),
    lossReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_stage", ["stage"])
    .index("by_leadId", ["leadId"])
    .index("by_createdAt", ["createdAt"]),

  crm_proposals: defineTable({
    dealId: v.string(),
    leadId: v.optional(v.id("crm_leads")),
    tenantId: v.optional(v.string()),
    planId: v.optional(v.string()),
    recommendedPlan: v.optional(v.string()),
    billingPeriod: v.optional(v.union(
      v.literal("monthly"),
      v.literal("termly"),
      v.literal("annual")
    )),
    studentCount: v.optional(v.number()),
    customItems: v.optional(
      v.array(
        v.object({
          description: v.string(),
          amountKes: v.number(),
          quantity: v.optional(v.number()),
        })
      )
    ),
    totalKes: v.number(),
    totalMonthlyKes: v.optional(v.number()),
    totalAnnualKes: v.optional(v.number()),
    trackingToken: v.optional(v.string()),
    viewCount: v.optional(v.number()),
    viewedAt: v.optional(v.number()),
    viewerIp: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("viewed"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("expired")
    ),
    sentAt: v.optional(v.number()),
    acceptedAt: v.optional(v.number()),
    rejectedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),
    validUntil: v.optional(v.number()),
    pdfUrl: v.optional(v.string()),
    customNotes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_dealId", ["dealId"])
    .index("by_leadId", ["leadId", "createdAt"])
    .index("by_validUntil", ["validUntil"])
    .index("by_createdAt", ["createdAt"])
    .index("by_trackingToken", ["trackingToken"]),

  crm_activities: defineTable({
    leadId: v.id("crm_leads"),
    createdByUserId: v.string(),
    type: v.string(),
    subject: v.optional(v.string()),
    body: v.optional(v.string()),
    isPrivate: v.boolean(),
    scheduledAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
    outcome: v.optional(v.string()),
    durationMinutes: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_leadId", ["leadId", "createdAt"])
    .index("by_createdByUserId", ["createdByUserId", "createdAt"])
    .index("by_scheduledAt", ["scheduledAt"]),

  crm_contacts: defineTable({
    leadId: v.id("crm_leads"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    title: v.optional(v.string()),
    isPrimary: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_leadId", ["leadId", "createdAt"])
    .index("by_email", ["email"]),

  crm_lead_shares: defineTable({
    leadId: v.id("crm_leads"),
    sharedWithUserId: v.string(),
    sharedByUserId: v.string(),
    accessLevel: v.union(v.literal("view"), v.literal("edit")),
    message: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_leadId", ["leadId", "createdAt"])
    .index("by_sharedWithUserId", ["sharedWithUserId", "createdAt"]),

  crm_pipeline_stages: defineTable({
    name: v.string(),
    slug: v.string(),
    order: v.number(),
    color: v.string(),
    icon: v.string(),
    requiresNote: v.boolean(),
    autoFollowUpDays: v.optional(v.number()),
    isWon: v.boolean(),
    isLost: v.boolean(),
    probabilityDefault: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"]),

  crm_teams: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    memberIds: v.array(v.string()),
    leadUserId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_leadUserId", ["leadUserId"]),

  crm_follow_ups: defineTable({
    leadId: v.id("crm_leads"),
    assignedToUserId: v.string(),
    title: v.string(),
    notes: v.optional(v.string()),
    dueAt: v.number(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    isOverdue: v.boolean(),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_leadId", ["leadId", "dueAt"])
    .index("by_assignedToUserId", ["assignedToUserId", "dueAt"])
    .index("by_dueAt", ["dueAt"]),

  support_tickets: defineTable({
    tenantId: v.string(),
    userId: v.string(),
    moduleId: v.optional(v.string()),
    subject: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    assignedTo: v.optional(v.string()),
    slaDueAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
    source: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_status", ["status"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_slaDueAt", ["slaDueAt"])
    .index("by_createdAt", ["createdAt"]),

  support_ticket_messages: defineTable({
    ticketId: v.string(),
    senderId: v.string(),
    body: v.string(),
    attachments: v.optional(v.array(v.string())),
    sentAt: v.number(),
    isInternal: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_ticketId", ["ticketId"])
    .index("by_sentAt", ["sentAt"]),

  kb_articles: defineTable({
    title: v.string(),
    slug: v.string(),
    body: v.string(),
    category: v.optional(v.string()),
    tags: v.array(v.string()),
    visibility: v.union(
      v.literal("public"),
      v.literal("tenants_only"),
      v.literal("staff_only")
    ),
    publishedAt: v.optional(v.number()),
    authorId: v.string(),
    views: v.number(),
    relatedArticleIds: v.array(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_visibility", ["visibility"])
    .index("by_status", ["status"])
    .index("by_publishedAt", ["publishedAt"])
    .index("by_createdAt", ["createdAt"]),

  platform_announcements: defineTable({
    title: v.string(),
    body: v.string(),
    targetPlans: v.array(v.string()),
    targetCountries: v.array(v.string()),
    channels: v.array(v.string()),
    isCritical: v.boolean(),
    startsAt: v.number(),
    endsAt: v.optional(v.number()),
    createdBy: v.string(),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("scheduled"),
        v.literal("active"),
        v.literal("archived")
      )
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_startsAt", ["startsAt"])
    .index("by_createdAt", ["createdAt"]),

  sla_configs: defineTable({
    supportTier: v.union(
      v.literal("community"),
      v.literal("email"),
      v.literal("priority"),
      v.literal("dedicated")
    ),
    firstResponseHours: v.number(),
    resolutionHours: v.number(),
    businessHoursOnly: v.boolean(),
    escalationRules: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_supportTier", ["supportTier"])
    .index("by_updatedAt", ["updatedAt"]),

  // Publisher & Reseller System
  publisherApplications: defineTable({
    applicantId: v.string(), // User ID of the applicant
    applicantEmail: v.string(),
    businessName: v.string(),
    businessType: v.union(v.literal("individual"), v.literal("company")),
    businessDescription: v.string(),
    website: v.optional(v.string()),
    contactPhone: v.string(),
    contactAddress: v.string(),
    country: v.string(),
    experience: v.string(),
    modules: v.array(v.string()), // List of modules they plan to publish
    status: v.union(
      v.literal("submitted"),
      v.literal("under_review"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("on_hold")
    ),
    reviewedBy: v.optional(v.string()),
    reviewNotes: v.optional(v.string()),
    rejectedReason: v.optional(v.string()),
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_applicant", ["applicantId"])
    .index("by_status", ["status"])
    .index("by_reviewedBy", ["reviewedBy"])
    .index("by_submittedAt", ["submittedAt"]),

  resellerApplications: defineTable({
    applicantId: v.string(), // User ID of the applicant
    applicantEmail: v.string(),
    businessName: v.string(),
    businessType: v.union(v.literal("reseller"), v.literal("affiliate")),
    businessDescription: v.string(),
    website: v.optional(v.string()),
    contactPhone: v.string(),
    contactAddress: v.string(),
    country: v.string(),
    targetMarket: v.string(), // Description of target schools/regions
    experience: v.string(),
    marketingChannels: v.array(v.string()), // How they plan to market
    expectedVolume: v.string(), // Expected monthly volume
    status: v.union(
      v.literal("submitted"),
      v.literal("under_review"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("on_hold")
    ),
    reviewedBy: v.optional(v.string()),
    reviewNotes: v.optional(v.string()),
    rejectedReason: v.optional(v.string()),
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_applicant", ["applicantId"])
    .index("by_status", ["status"])
    .index("by_applicantType", ["businessType"])
    .index("by_reviewedBy", ["reviewedBy"])
    .index("by_submittedAt", ["submittedAt"]),

  resellers: defineTable({
    userId: v.string(),
    resellerId: v.string(), // Unique reseller identifier
    businessName: v.string(),
    applicantType: v.union(v.literal("reseller"), v.literal("affiliate")),
    website: v.optional(v.string()),
    description: v.string(),
    tier: v.union(v.literal("starter"), v.literal("silver"), v.literal("gold"), v.literal("platinum")),
    status: v.union(v.literal("active"), v.literal("suspended"), v.literal("inactive")),
    verifiedAt: v.optional(v.number()),
    verificationDocuments: v.array(v.string()), // URLs to verification docs
    contactInfo: v.object({
      email: v.string(),
      phone: v.string(),
      address: v.string(),
      country: v.string(),
    }),
    banking: v.object({
      bankName: v.string(),
      accountNumber: v.string(),
      accountName: v.string(),
      branchCode: v.optional(v.string()),
      payPalEmail: v.optional(v.string()),
    }),
    commission: v.object({
      rate: v.number(), // Percentage
      tier: v.union(v.literal("starter"), v.literal("silver"), v.literal("gold"), v.literal("platinum")),
      holdDays: v.number(), // Days to hold commission before payout
      minPayout: v.number(), // Minimum payout amount in KES
    }),
    stats: v.object({
      totalReferrals: v.number(),
      activeReferrals: v.number(),
      totalCommission: v.number(),
      monthlyCommission: v.number(),
      totalPayouts: v.number(),
      conversionRate: v.number(), // Percentage of referrals that convert
    }),
    settings: v.object({
      emailNotifications: v.boolean(),
      monthlyReports: v.boolean(),
      referralTracking: v.boolean(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_resellerId", ["resellerId"])
    .index("by_status", ["status"])
    .index("by_tier", ["tier"])
    .index("by_applicantType", ["applicantType"]),

  resellerSchools: defineTable({
    resellerId: v.string(),
    schoolId: v.string(), // Tenant ID of the school
    schoolName: v.string(),
    schoolEmail: v.string(),
    schoolPhone: v.string(),
    status: v.union(v.literal("lead"), v.literal("contacted"), v.literal("demo_scheduled"), v.literal("trial"), v.literal("converted"), v.literal("closed")),
    source: v.string(), // How the reseller found this lead
    assignedAt: v.number(),
    contactedAt: v.optional(v.number()),
    demoScheduledAt: v.optional(v.number()),
    trialStartedAt: v.optional(v.number()),
    convertedAt: v.optional(v.number()),
    subscriptionPlan: v.optional(v.string()), // Plan they subscribed to
    subscriptionValue: v.optional(v.number()), // Value in KES
    commissionRate: v.number(), // Commission rate for this school
    commissionEarned: v.number(), // Total commission earned from this school
    notes: v.array(v.string()), // Notes about interactions
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_reseller", ["resellerId"])
    .index("by_school", ["schoolId"])
    .index("by_status", ["status"])
    .index("by_assignedAt", ["assignedAt"])
    .index("by_convertedAt", ["convertedAt"]),

  resellerLeads: defineTable({
    resellerId: v.string(),
    leadId: v.string(), // Unique lead identifier
    schoolName: v.string(),
    contactName: v.string(),
    contactEmail: v.string(),
    contactPhone: v.string(),
    schoolSize: v.union(v.literal("small"), v.literal("medium"), v.literal("large")), // Student count
    currentSystem: v.optional(v.string()), // Current management system
    requirements: v.array(v.string()), // What they're looking for
    budget: v.optional(v.string()), // Monthly budget range
    timeline: v.union(v.literal("immediate"), v.literal("1_month"), v.literal("3_months"), v.literal("6_months"), v.literal("exploring")),
    source: v.string(), // How they found the reseller
    status: v.union(v.literal("new"), v.literal("contacted"), v.literal("qualified"), v.literal("proposal_sent"), v.literal("negotiation"), v.literal("closed_won"), v.literal("closed_lost")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    value: v.optional(v.number()), // Potential deal value in KES
    probability: v.number(), // Win probability percentage
    expectedCloseDate: v.optional(v.number()),
    notes: v.array(v.string()),
    assignedAt: v.number(),
    contactedAt: v.optional(v.number()),
    qualifiedAt: v.optional(v.number()),
    proposalSentAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_reseller", ["resellerId"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_assignedAt", ["assignedAt"])
    .index("by_expectedCloseDate", ["expectedCloseDate"]),

  resellerCommissions: defineTable({
    resellerId: v.string(),
    commissionId: v.string(), // Unique commission identifier
    sourceId: v.string(), // School ID or lead ID
    sourceType: v.union(v.literal("school"), v.literal("lead")),
    type: v.union(v.literal("referral"), v.literal("subscription"), v.literal("upgrade"), v.literal("renewal")),
    amount: v.number(), // Commission amount in KES
    rate: v.number(), // Commission percentage
    currency: v.string(), // Should be "KES"
    status: v.union(v.literal("pending"), v.literal("held"), v.literal("available"), v.literal("paid"), v.literal("cancelled")),
    earnedAt: v.number(),
    availableAt: v.number(), // When commission becomes available for payout
    paidAt: v.optional(v.number()),
    payoutId: v.optional(v.string()), // Reference to payout record
    description: v.string(), // What this commission is for
    metadata: v.optional(v.record(v.string(), v.any())), // Additional data
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_reseller", ["resellerId"])
    .index("by_status", ["status"])
    .index("by_source", ["sourceType", "sourceId"])
    .index("by_earnedAt", ["earnedAt"])
    .index("by_availableAt", ["availableAt"])
    .index("by_paidAt", ["paidAt"]),

  resellerPayouts: defineTable({
    resellerId: v.string(),
    payoutId: v.string(), // Unique payout identifier
    amount: v.number(), // Total payout amount in KES
    currency: v.string(), // Should be "KES"
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed"), v.literal("cancelled")),
    method: v.union(v.literal("bank_transfer"), v.literal("mpesa"), v.literal("paypal"), v.literal("check")),
    bankDetails: v.optional(v.object({
      bankName: v.string(),
      accountNumber: v.string(),
      accountName: v.string(),
      branchCode: v.optional(v.string()),
    })),
    mpesaDetails: v.optional(v.object({
      phoneNumber: v.string(),
      accountName: v.string(),
    })),
    paypalDetails: v.optional(v.object({
      email: v.string(),
    })),
    commissionIds: v.array(v.string()), // IDs of commissions included in this payout
    period: v.object({
      startDate: v.number(),
      endDate: v.number(),
    }),
    requestedAt: v.number(),
    processedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    transactionId: v.optional(v.string()), // Bank transaction reference
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_reseller", ["resellerId"])
    .index("by_status", ["status"])
    .index("by_requestedAt", ["requestedAt"])
    .index("by_completedAt", ["completedAt"]),

  resellerTiers: defineTable({
    tierName: v.union(v.literal("starter"), v.literal("silver"), v.literal("gold"), v.literal("platinum")),
    displayName: v.string(),
    description: v.string(),
    requirements: v.object({
      minReferrals: v.number(),
      minRevenue: v.number(), // In KES
      minConversionRate: v.number(), // Percentage
      experience: v.optional(v.string()),
    }),
    benefits: v.array(v.string()), // List of benefits
    commissionRate: v.number(), // Base commission rate
    creationLimit: v.optional(v.number()), // Max schools they can create (null = unlimited)
    features: v.array(v.string()), // Features available at this tier
    supportLevel: v.union(v.literal("basic"), v.literal("standard"), v.literal("priority"), v.literal("dedicated")),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tier", ["tierName"])
    .index("by_active", ["isActive"]),

  resellerSubdomains: defineTable({
    resellerId: v.string(),
    subdomain: v.string(), // e.g. "myschools.edumyles.com"
    domain: v.string(), // Full domain
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("pending"), v.literal("suspended")),
    config: v.object({
      logoUrl: v.optional(v.string()),
      primaryColor: v.optional(v.string()),
      secondaryColor: v.optional(v.string()),
      customCss: v.optional(v.string()),
      companyName: v.string(),
      contactEmail: v.string(),
      contactPhone: v.string(),
      address: v.string(),
    }),
    dns: v.object({
      aRecord: v.string(), // IP address
      cnameRecord: v.optional(v.string()),
      mxRecord: v.optional(v.string()),
      txtRecord: v.optional(v.string()),
    }),
    ssl: v.object({
      enabled: v.boolean(),
      certificateId: v.optional(v.string()),
      expiresAt: v.optional(v.number()),
      autoRenew: v.boolean(),
    }),
    stats: v.object({
      totalVisits: v.number(),
      uniqueVisitors: v.number(),
      pageViews: v.number(),
      bounceRate: v.number(),
      avgSessionDuration: v.number(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_reseller", ["resellerId"])
    .index("by_subdomain", ["subdomain"])
    .index("by_domain", ["domain"])
    .index("by_status", ["status"]),

  resellerMarketingMaterials: defineTable({
    resellerId: v.string(),
    materialId: v.string(), // Unique material identifier
    type: v.union(v.literal("brochure"), v.literal("flyer"), v.literal("presentation"), v.literal("video"), v.literal("email_template"), v.literal("social_media")),
    name: v.string(),
    description: v.string(),
    fileUrl: v.string(), // URL to the file
    fileSize: v.number(), // File size in bytes
    fileType: v.string(), // MIME type
    thumbnailUrl: v.optional(v.string()), // Thumbnail for videos/images
    tags: v.array(v.string()), // Tags for categorization
    language: v.string(), // Language code (e.g., "en", "sw")
    targetAudience: v.union(v.literal("schools"), v.literal("parents"), v.literal("students"), v.literal("administrators")),
    status: v.union(v.literal("draft"), v.literal("approved"), v.literal("published"), v.literal("archived")),
    usage: v.object({
      downloads: v.number(),
      views: v.number(),
      shares: v.number(),
    }),
    approvedBy: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_reseller", ["resellerId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_language", ["language"])
    .index("by_targetAudience", ["targetAudience"])
    .index("by_publishedAt", ["publishedAt"]),

  resellerCourses: defineTable({
    courseId: v.string(), // Unique course identifier
    title: v.string(),
    description: v.string(),
    category: v.union(v.literal("product_training"), v.literal("sales_training"), v.literal("technical_training"), v.literal("marketing"), v.literal("onboarding")),
    level: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    duration: v.number(), // Duration in minutes
    content: v.array(v.object({
      type: v.union(v.literal("video"), v.literal("text"), v.literal("quiz"), v.literal("assignment")),
      title: v.string(),
      content: v.string(), // URL for video, text for content, etc.
      duration: v.number(), // Duration in minutes
      order: v.number(),
    })),
    instructor: v.string(), // Instructor name
    instructorBio: v.string(),
    thumbnailUrl: v.optional(v.string()),
    tags: v.array(v.string()),
    language: v.string(), // Language code
    prerequisites: v.array(v.string()), // Course prerequisites
    learningObjectives: v.array(v.string()),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    enrollmentCount: v.number(),
    completionRate: v.number(),
    averageRating: v.number(),
    ratingCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_courseId", ["courseId"])
    .index("by_category", ["category"])
    .index("by_level", ["level"])
    .index("by_status", ["status"])
    .index("by_language", ["language"]),

  resellerCourseProgress: defineTable({
    resellerId: v.string(),
    courseId: v.string(),
    enrollmentId: v.string(), // Unique enrollment identifier
    status: v.union(v.literal("not_started"), v.literal("in_progress"), v.literal("completed"), v.literal("dropped")),
    progress: v.number(), // Percentage complete (0-100)
    currentModule: v.number(), // Current module index
    completedModules: v.array(v.number()), // Array of completed module indices
    quizScores: v.record(v.string(), v.number()), // Quiz scores by module
    startedAt: v.number(),
    lastAccessedAt: v.number(),
    completedAt: v.optional(v.number()),
    certificateUrl: v.optional(v.string()), // URL to completion certificate
    notes: v.optional(v.string()), // User notes about the course
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_reseller", ["resellerId"])
    .index("by_course", ["courseId"])
    .index("by_status", ["status"])
    .index("by_startedAt", ["startedAt"])
    .index("by_completedAt", ["completedAt"]),

  resellerDirectoryListings: defineTable({
    listingId: v.string(), // Unique listing identifier
    resellerId: v.string(),
    companyName: v.string(),
    description: v.string(),
    category: v.union(v.literal("technology"), v.literal("education"), v.literal("consulting"), v.literal("training"), v.literal("other")),
    location: v.object({
      country: v.string(),
      city: v.string(),
      address: v.string(),
    }),
    contactInfo: v.object({
      email: v.string(),
      phone: v.string(),
      website: v.optional(v.string()),
    }),
    services: v.array(v.string()), // List of services offered
    specializations: v.array(v.string()), // Areas of specialization
    certifications: v.array(v.string()), // Certifications held
    experience: v.number(), // Years of experience
    portfolio: v.array(v.object({
      title: v.string(),
      description: v.string(),
      imageUrl: v.optional(v.string()),
      projectUrl: v.optional(v.string()),
    })),
    testimonials: v.array(v.object({
      clientName: v.string(),
      clientCompany: v.string(),
      rating: v.number(), // 1-5 stars
      testimonial: v.string(),
      date: v.number(),
    })),
    rating: v.number(), // Overall rating (1-5)
    reviewCount: v.number(),
    verificationStatus: v.union(v.literal("unverified"), v.literal("pending"), v.literal("verified")),
    featured: v.boolean(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("suspended")),
    views: v.number(),
    contacts: v.number(), // Number of contact requests
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_listingId", ["listingId"])
    .index("by_reseller", ["resellerId"])
    .index("by_category", ["category"])
    .index("by_location", ["location.country", "location.city"])
    .index("by_status", ["status"])
    .index("by_featured", ["featured"])
    .index("by_verificationStatus", ["verificationStatus"])
    .index("by_rating", ["rating"])
    .index("by_createdAt", ["createdAt"]),

  resellerReferralClicks: defineTable({
    clickId: v.string(), // Unique click identifier
    resellerId: v.string(),
    referralCode: v.string(), // The referral code used
    source: v.string(), // Where the click came from (e.g., "email", "social", "website")
    campaign: v.optional(v.string()), // Campaign identifier
    ipAddress: v.string(), // IP address of the clicker
    userAgent: v.string(), // Browser user agent
    referrer: v.optional(v.string()), // HTTP referrer
    landingPage: v.string(), // Page they landed on
    converted: v.boolean(), // Whether this click resulted in a conversion
    conversionId: v.optional(v.string()), // ID of the conversion (if any)
    conversionValue: v.optional(v.number()), // Value of the conversion in KES
    timestamp: v.number(), // When the click occurred
    createdAt: v.number(),
  })
    .index("by_reseller", ["resellerId"])
    .index("by_clickId", ["clickId"])
    .index("by_referralCode", ["referralCode"])
    .index("by_source", ["source"])
    .index("by_campaign", ["campaign"])
    .index("by_converted", ["converted"])
    .index("by_timestamp", ["timestamp"])
    .index("by_conversionId", ["conversionId"]),

  social_accounts: defineTable({
    tenantId: v.optional(v.string()),
    isPlatformAccount: v.optional(v.boolean()),
    platform: v.union(
      v.literal("facebook"),
      v.literal("instagram"),
      v.literal("twitter"),
      v.literal("linkedin"),
      v.literal("youtube"),
      v.literal("tiktok"),
      v.literal("whatsapp"),
      v.literal("telegram")
    ),
    accountName: v.string(),
    accountHandle: v.optional(v.string()),
    accountId: v.string(),
    profileImageUrl: v.optional(v.string()),
    followerCount: v.optional(v.number()),
    followingCount: v.optional(v.number()),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    pageToken: v.optional(v.string()),
    accountType: v.optional(v.string()),
    pageId: v.optional(v.string()),
    igUserId: v.optional(v.string()),
    wabaId: v.optional(v.string()),
    phoneNumberId: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("token_expired"),
      v.literal("disconnected"),
      v.literal("error")
    ),
    lastSyncAt: v.optional(v.number()),
    lastErrorMessage: v.optional(v.string()),
    connectedBy: v.string(),
    connectedAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_isPlatformAccount", ["isPlatformAccount"])
    .index("by_tenantId_platform", ["tenantId", "platform"])
    .index("by_accountId", ["accountId"])
    .index("by_status", ["status"]),

  social_campaigns: defineTable({
    tenantId: v.optional(v.string()),
    isPlatformCampaign: v.optional(v.boolean()),
    name: v.string(),
    description: v.optional(v.string()),
    goal: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    tags: v.array(v.string()),
    createdBy: v.string(),
    isDeleted: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_status", ["status"]),

  social_approval_flows: defineTable({
    tenantId: v.optional(v.string()),
    isPlatformFlow: v.optional(v.boolean()),
    name: v.string(),
    isDefault: v.boolean(),
    requiresApproval: v.boolean(),
    approverRoles: v.array(v.string()),
    approverUserIds: v.array(v.string()),
    notifyOnSubmit: v.boolean(),
    autoPublishOnApproval: v.boolean(),
    allowSelfApproval: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_isDefault", ["isDefault"]),

  social_media_library: defineTable({
    tenantId: v.optional(v.string()),
    isPlatformLibrary: v.optional(v.boolean()),
    name: v.string(),
    description: v.optional(v.string()),
    fileUrl: v.string(),
    fileType: v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("gif"),
      v.literal("document")
    ),
    fileSizeBytes: v.number(),
    mimeType: v.string(),
    dimensions: v.optional(
      v.object({
        width: v.number(),
        height: v.number(),
        durationSeconds: v.optional(v.number()),
      })
    ),
    tags: v.array(v.string()),
    uploadedBy: v.string(),
    usageCount: v.number(),
    isDeleted: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_fileType", ["fileType"]),

  social_content_templates: defineTable({
    tenantId: v.optional(v.string()),
    isPlatformTemplate: v.optional(v.boolean()),
    name: v.string(),
    description: v.optional(v.string()),
    platforms: v.array(v.string()),
    textTemplate: v.optional(v.string()),
    mediaUrls: v.array(v.string()),
    tags: v.array(v.string()),
    createdBy: v.string(),
    usageCount: v.number(),
    isDeleted: v.boolean(),
    createdAt: v.number(),
  }).index("by_tenantId", ["tenantId"]),

  social_posts: defineTable({
    tenantId: v.optional(v.string()),
    isPlatformPost: v.optional(v.boolean()),
    title: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("pending_approval"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("scheduled"),
      v.literal("publishing"),
      v.literal("published"),
      v.literal("partially_published"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    scheduledAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    targetAccountIds: v.array(v.id("social_accounts")),
    platformVariants: v.array(
      v.object({
        platform: v.string(),
        accountId: v.id("social_accounts"),
        textContent: v.optional(v.string()),
        mediaUrls: v.array(v.string()),
        mediaType: v.optional(v.string()),
        linkUrl: v.optional(v.string()),
        linkTitle: v.optional(v.string()),
        linkDescription: v.optional(v.string()),
        tweetThreadParts: v.optional(v.array(v.string())),
        pollOptions: v.optional(v.array(v.string())),
        pollDurationMinutes: v.optional(v.number()),
        youtubeTitle: v.optional(v.string()),
        youtubeDescription: v.optional(v.string()),
        youtubeTags: v.optional(v.array(v.string())),
        youtubeCategory: v.optional(v.string()),
        youtubePrivacy: v.optional(v.string()),
        tiktokCaption: v.optional(v.string()),
        whatsappTemplateId: v.optional(v.string()),
        telegramChatId: v.optional(v.string()),
        publishedPostId: v.optional(v.string()),
        publishedPostUrl: v.optional(v.string()),
        publishStatus: v.optional(v.string()),
        publishError: v.optional(v.string()),
        publishedAt: v.optional(v.number()),
      })
    ),
    approvalRequired: v.boolean(),
    approvedBy: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    rejectedBy: v.optional(v.string()),
    rejectedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),
    tags: v.array(v.string()),
    campaignId: v.optional(v.id("social_campaigns")),
    createdBy: v.string(),
    isDeleted: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_isPlatformPost", ["isPlatformPost"])
    .index("by_status", ["status"])
    .index("by_scheduledAt", ["scheduledAt"])
    .index("by_createdBy", ["createdBy"])
    .index("by_campaignId", ["campaignId"]),

  social_analytics: defineTable({
    tenantId: v.optional(v.string()),
    isPlatformAnalytics: v.optional(v.boolean()),
    accountId: v.id("social_accounts"),
    platform: v.string(),
    postId: v.optional(v.id("social_posts")),
    platformPostId: v.optional(v.string()),
    impressions: v.optional(v.number()),
    reach: v.optional(v.number()),
    engagements: v.optional(v.number()),
    likes: v.optional(v.number()),
    comments: v.optional(v.number()),
    shares: v.optional(v.number()),
    saves: v.optional(v.number()),
    clicks: v.optional(v.number()),
    followerGrowth: v.optional(v.number()),
    videoViews: v.optional(v.number()),
    videoWatchTimeSeconds: v.optional(v.number()),
    videoCompletionRate: v.optional(v.number()),
    rawMetrics: v.optional(v.string()),
    periodStart: v.number(),
    periodEnd: v.number(),
    pulledAt: v.number(),
  })
    .index("by_accountId", ["accountId"])
    .index("by_postId", ["postId"])
    .index("by_tenantId_platform", ["tenantId", "platform"])
    .index("by_periodStart", ["periodStart"]),

  social_comments: defineTable({
    tenantId: v.optional(v.string()),
    isPlatformComment: v.optional(v.boolean()),
    postId: v.id("social_posts"),
    accountId: v.id("social_accounts"),
    platform: v.string(),
    platformCommentId: v.string(),
    platformPostId: v.string(),
    authorName: v.string(),
    authorHandle: v.optional(v.string()),
    authorProfileUrl: v.optional(v.string()),
    body: v.string(),
    likeCount: v.number(),
    isReply: v.boolean(),
    parentCommentId: v.optional(v.string()),
    status: v.union(
      v.literal("new"),
      v.literal("read"),
      v.literal("replied"),
      v.literal("hidden"),
      v.literal("deleted_on_platform")
    ),
    repliedAt: v.optional(v.number()),
    repliedBy: v.optional(v.string()),
    replyText: v.optional(v.string()),
    pulledAt: v.number(),
  })
    .index("by_postId", ["postId"])
    .index("by_accountId", ["accountId"])
    .index("by_status", ["status"])
    .index("by_platform", ["platform"]),
});
