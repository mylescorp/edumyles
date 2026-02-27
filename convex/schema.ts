import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  organizations: defineTable({
    workosOrgId: v.string(),
    name: v.string(),
  }).index("by_workos_org", ["workosOrgId"]),

  users: defineTable({
    workosUserId: v.string(),
    email: v.string(),
    role: v.string(),
    organizationId: v.id("organizations"),
  })
    .index("by_workos_user", ["workosUserId"])
    .index("by_org", ["organizationId"]),
});
