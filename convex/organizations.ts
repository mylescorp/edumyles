import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "./helpers/platformGuard";

function isTrustedServerCall(serverSecret?: string) {
  return Boolean(
    serverSecret &&
      process.env.CONVEX_WEBHOOK_SECRET &&
      serverSecret === process.env.CONVEX_WEBHOOK_SECRET
  );
}

export const upsertOrganization = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
    tenantId: v.string(),
    workosOrgId: v.string(),
    name: v.string(),
    subdomain: v.string(),
    tier: v.union(
      v.literal("starter"),
      v.literal("standard"),
      v.literal("pro"),
      v.literal("enterprise")
    ),
  },
  handler: async (ctx, args) => {
    if (!isTrustedServerCall(args.serverSecret)) {
      await requirePlatformSession(ctx, { sessionToken: args.sessionToken ?? "" });
    }
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_workos_org", (q) => q.eq("workosOrgId", args.workosOrgId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        tenantId: args.tenantId,
        name: args.name,
        subdomain: args.subdomain,
        tier: args.tier,
        isActive: true,
      });
      return existing._id;
    }

    const existingForTenant = await ctx.db
      .query("organizations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (existingForTenant) {
      await ctx.db.patch(existingForTenant._id, {
        workosOrgId: args.workosOrgId,
        name: args.name,
        subdomain: args.subdomain,
        tier: args.tier,
        isActive: true,
      });
      return existingForTenant._id;
    }

    return await ctx.db.insert("organizations", {
      tenantId: args.tenantId,
      workosOrgId: args.workosOrgId,
      name: args.name,
      subdomain: args.subdomain,
      tier: args.tier,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

// Resolve tenant from subdomain — used by middleware
export const getOrgBySubdomain = query({
  args: {
    sessionToken: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
    subdomain: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isTrustedServerCall(args.serverSecret)) {
      await requirePlatformSession(ctx, { sessionToken: args.sessionToken ?? "" });
    }
    return await ctx.db
      .query("organizations")
      .withIndex("by_subdomain", (q) => q.eq("subdomain", args.subdomain))
      .first();
  },
});

export const getOrgByTenantId = query({
  args: {
    sessionToken: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isTrustedServerCall(args.serverSecret)) {
      await requirePlatformSession(ctx, { sessionToken: args.sessionToken ?? "" });
    }
    return await ctx.db
      .query("organizations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();
  },
});
