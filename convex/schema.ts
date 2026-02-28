import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sessions: defineTable({
    sessionToken: v.string(),
    tenantId: v.string(),
    userId: v.string(),
    email: v.string(),
    role: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
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
    enrolledAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_tenant_class", ["tenantId", "classId"])
    .index("by_admission", ["tenantId", "admissionNumber"]),

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
    .index("by_tenant_teacher", ["tenantId", "teacherId"]),

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
});
