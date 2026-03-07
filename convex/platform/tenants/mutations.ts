import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";
import { generateTenantId } from "../../helpers/idGenerator";

export const createTenant = mutation({
  args: {
    sessionToken: v.string(),
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
    const tenantCtx = await requirePlatformSession(ctx, args);

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
      actorId: tenantCtx.userId,
      actorEmail: tenantCtx.email,
      action: "tenant.created",
      entityType: "tenant",
      entityId: tenantId,
      after: { name: args.name, subdomain: args.subdomain, plan: args.plan },
    });

    return { id, tenantId };
  },
});

export const suspendTenant = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requirePlatformSession(ctx, args);

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
      actorId: tenantCtx.userId,
      actorEmail: tenantCtx.email,
      action: "tenant.suspended",
      entityType: "tenant",
      entityId: args.tenantId,
      after: { reason: args.reason },
    });
  },
});

export const activateTenant = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requirePlatformSession(ctx, args);

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
      actorId: tenantCtx.userId,
      actorEmail: tenantCtx.email,
      action: "tenant.activated",
      entityType: "tenant",
      entityId: args.tenantId,
      after: { status: "active" },
    });
  },
});
