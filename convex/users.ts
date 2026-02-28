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
      if (existing.tenantId !== args.tenantId) {
        throw new Error("Tenant mismatch — access denied");
      }
      await ctx.db.patch(existing._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        role: args.role,
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
      role: args.role,
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

    if (!user || user.tenantId !== args.tenantId) return null;
    return user;
  },
});

// Get current user by session token — used by useAuth hook
export const getCurrentUser = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_tenant_email", (q) =>
        q.eq("tenantId", session.tenantId).eq("email", session.email)
      )
      .first();

    if (!user) {
      return {
        _id: session.userId,
        tenantId: session.tenantId,
        email: session.email,
        role: session.role,
        firstName: undefined,
        lastName: undefined,
        avatarUrl: undefined,
        isActive: true,
      };
    }

    return {
      _id: user._id,
      tenantId: user.tenantId,
      eduMylesUserId: user.eduMylesUserId,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      isActive: user.isActive,
    };
  },
});

// List users within a tenant
export const listTenantUsers = query({
  args: {
    tenantId: v.string(),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.role) {
      return await ctx.db
        .query("users")
        .withIndex("by_tenant_role", (q) =>
          q.eq("tenantId", args.tenantId).eq("role", args.role!)
        )
        .collect();
    }

    return await ctx.db
      .query("users")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});
