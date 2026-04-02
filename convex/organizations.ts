import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireTenantContext } from "./helpers/tenantGuard";

export const upsertOrganization = mutation({
  args: {
    tenantId: v.string(),
    workosOrgId: v.string(),
    name: v.string(),
    subdomain: v.string(),
    tier: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("growth"),
      v.literal("enterprise")
    ),
  },
  handler: async (ctx, args) => {
    await requireTenantContext(ctx);
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_workos_org", (q) => q.eq("workosOrgId", args.workosOrgId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { name: args.name });
      return existing._id;
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
  args: { subdomain: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_subdomain", (q) => q.eq("subdomain", args.subdomain))
      .first();
  },
});
