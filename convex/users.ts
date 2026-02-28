
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Upsert user after WorkOS authentication
export const upsertUser = mutation({
  args: {
    tenantId: v.string(),
    eduMylesUserId: v.string(),
    workosUserId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.string(),
    permissions: v.array(v.string()),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_workos_user", (q) =>
        q.eq("workosUserId", args.workosUserId)
      )
      .first();

    if (existing) {
      // Enforce tenantId isolation — never update across tenants
      if (existing.tenantId !== args.tenantId) {
        throw new Error("Tenant mismatch — access denied");
      }
      await ctx.db.patch(existing._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        role: args.role as any,
        permissions: args.permissions,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      tenantId: args.tenantId,
      eduMylesUserId: args.eduMylesUserId,
      workosUserId: args.workosUserId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role as any,
      permissions: args.permissions,
      organizationId: args.organizationId,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

// Get user by WorkOS ID — always scoped to tenantId
export const getUserByWorkosId = query({
  args: {
    tenantId: v.string(),
    workosUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_user", (q) =>
        q.eq("workosUserId", args.workosUserId)
      )
      .first();

    // Enforce tenant isolation
    if (!user || user.tenantId !== args.tenantId) return null;
    return user;
  },
});