import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requireRole } from "../../helpers/authorize";
import { logAction } from "../../helpers/auditLog";
import { generateTenantId } from "../../helpers/idGenerator";

export const createTenant = mutation({
  args: {
    name: v.string(),
    subdomain: v.string(),
    email: v.string(),
    phone: v.string(),
    plan: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("growth"),
      v.literal("enterprise")
    ),
    county: v.string(),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantContext(ctx);
    requireRole(tenantCtx, "master_admin", "super_admin");

    const existing = await ctx.db
      .query("tenants")
      .withIndex("by_subdomain", (q) => q.eq("subdomain", args.subdomain))
      .first();

    if (existing) {
      throw new Error(`CONFLICT: Subdomain '${args.subdomain}' already taken`);
    }

    const tenantId = generateTenantId();

    const id = await ctx.db.insert("tenants", {
      tenantId,
      name: args.name,
      subdomain: args.subdomain,
      email: args.email,
      phone: args.phone,
      plan: args.plan,
      status: "trial",
      county: args.county,
      country: args.country ?? "KE",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: tenantCtx.tenantId,
      userId: tenantCtx.userId,
      action: "tenant.created",
      targetId: tenantId,
      targetType: "tenant",
      details: { name: args.name, subdomain: args.subdomain, plan: args.plan },
    });

    return { id, tenantId };
  },
});

export const suspendTenant = mutation({
  args: {
    tenantId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantContext(ctx);
    requireRole(tenantCtx, "master_admin");

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (!tenant) throw new Error("NOT_FOUND: Tenant not found");

    await ctx.db.patch(tenant._id, {
      status: "suspended",
      suspendedAt: Date.now(),
      suspendReason: args.reason,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: tenantCtx.tenantId,
      userId: tenantCtx.userId,
      action: "tenant.suspended",
      targetId: args.tenantId,
      targetType: "tenant",
      details: { reason: args.reason },
    });
  },
});

export const activateTenant = mutation({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantContext(ctx);
    requireRole(tenantCtx, "master_admin", "super_admin");

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (!tenant) throw new Error("NOT_FOUND: Tenant not found");

    await ctx.db.patch(tenant._id, {
      status: "active",
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: tenantCtx.tenantId,
      userId: tenantCtx.userId,
      action: "tenant.created",
      targetId: args.tenantId,
      targetType: "tenant",
      details: { action: "activated" },
    });
  },
});
