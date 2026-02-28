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
});
