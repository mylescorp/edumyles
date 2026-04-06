import { internal } from "../../_generated/api";
import { internalMutation, mutation, query } from "../../_generated/server";
import { v } from "convex/values";
import { logAction } from "../../helpers/auditLog";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { requireTenantContext } from "../../helpers/tenantGuard";

async function getTenantAdminUsers(ctx: any, tenantId: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_tenant_role", (q: any) => q.eq("tenantId", tenantId).eq("role", "school_admin"))
    .collect();
}

export const getPilotGrants = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.string()),
    tenantId: v.optional(v.string()),
    moduleId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    let grants = await ctx.db.query("pilot_grants").collect();

    if (args.status) grants = grants.filter((grant) => grant.status === args.status);
    if (args.tenantId) grants = grants.filter((grant) => grant.tenantId === args.tenantId);
    if (args.moduleId) grants = grants.filter((grant) => grant.moduleId === args.moduleId);

    return grants;
  },
});

export const getTenantPilotGrants = query({
  args: {
    sessionToken: v.optional(v.string()),
    tenantId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenantId = args.sessionToken
      ? args.tenantId ?? (await requirePlatformSession(ctx, { sessionToken: args.sessionToken })).tenantId
      : (await requireTenantContext(ctx)).tenantId;

    return await ctx.db
      .query("pilot_grants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
      .collect();
  },
});

export const createPilotGrant = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.string(),
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
    reason: v.string(),
    stealthMode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    const now = Date.now();

    const grantId = await ctx.db.insert("pilot_grants", {
      moduleId: args.moduleId,
      tenantId: args.tenantId,
      grantType: args.grantType,
      discountPct: args.discountPct,
      customPriceKes: args.customPriceKes,
      startDate: args.startDate,
      endDate: args.endDate,
      grantedBy: platform.userId,
      reason: args.reason,
      stealthMode: args.stealthMode,
      status: "active",
      convertedToPaid: false,
      notificationsSent: [],
      createdAt: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "marketplace.module_installed",
      entityType: "pilot_grant",
      entityId: String(grantId),
      after: { tenantId: args.tenantId, moduleId: args.moduleId, grantType: args.grantType },
    });

    return { success: true, grantId };
  },
});

export const extendPilotGrant = mutation({
  args: {
    sessionToken: v.string(),
    grantId: v.id("pilot_grants"),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    await ctx.db.patch(args.grantId, {
      endDate: args.endDate,
      status: "extended",
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "marketplace.module_updated",
      entityType: "pilot_grant",
      entityId: String(args.grantId),
      after: { endDate: args.endDate, status: "extended" },
    });

    return { success: true };
  },
});

export const revokePilotGrant = mutation({
  args: {
    sessionToken: v.string(),
    grantId: v.id("pilot_grants"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    await ctx.db.patch(args.grantId, {
      status: "revoked",
      reason: args.reason,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "marketplace.module_suspended",
      entityType: "pilot_grant",
      entityId: String(args.grantId),
      after: { reason: args.reason, status: "revoked" },
    });

    return { success: true };
  },
});

export const checkActivePilotGrant = internalMutation({
  args: {
    tenantId: v.string(),
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const grants = await ctx.db
      .query("pilot_grants")
      .withIndex("by_tenant_status", (q) => q.eq("tenantId", args.tenantId).eq("status", "active"))
      .collect();

    const activeGrant = grants.find(
      (grant) =>
        grant.moduleId === args.moduleId &&
        grant.startDate <= now &&
        (grant.endDate === undefined || grant.endDate >= now)
    );

    return {
      active: Boolean(activeGrant),
      grant: activeGrant ?? null,
    };
  },
});

export const sendPilotExpiryNotifications = internalMutation({
  args: {
    grantId: v.id("pilot_grants"),
    template: v.union(v.literal("expiring_soon"), v.literal("expired")),
  },
  handler: async (ctx, args) => {
    const grant = await ctx.db.get(args.grantId);
    if (!grant) {
      return { success: false };
    }

    const alreadySent = grant.notificationsSent ?? [];
    if (alreadySent.includes(args.template)) {
      return { success: true, duplicate: true };
    }

    const admins = await getTenantAdminUsers(ctx, grant.tenantId);
    const title =
      args.template === "expired" ? "Pilot grant expired" : "Pilot grant expiring soon";
    const message =
      args.template === "expired"
        ? `Pilot access for module ${grant.moduleId} has expired.`
        : `Pilot access for module ${grant.moduleId} is expiring soon.`;

    for (const admin of admins) {
      await ctx.db.insert("notifications", {
        tenantId: grant.tenantId,
        userId: admin.eduMylesUserId,
        title,
        message,
        type: "pilot_grant",
        isRead: false,
        link: "/admin/marketplace/requests",
        createdAt: Date.now(),
      });
    }

    await ctx.db.patch(args.grantId, {
      notificationsSent: [...alreadySent, args.template],
      updatedAt: Date.now(),
    });

    return { success: true, recipients: admins.length };
  },
});

export const processExpiredGrants = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const grants = await ctx.db.query("pilot_grants").collect();

    let expiredCount = 0;
    let notifiedCount = 0;

    for (const grant of grants) {
      if (grant.status === "revoked") continue;

      if (grant.endDate && grant.endDate < now) {
        if (grant.status !== "expired") {
          await ctx.db.patch(grant._id, {
            status: "expired",
            updatedAt: now,
          });
          expiredCount += 1;
        }

        const expiredNotification = await ctx.runMutation(
          internal.modules.platform.pilotGrants.sendPilotExpiryNotifications,
          { grantId: grant._id, template: "expired" }
        );
        if ((expiredNotification as any)?.success) {
          notifiedCount += 1;
        }
        continue;
      }

      if (
        grant.endDate &&
        grant.endDate - now <= 3 * 24 * 60 * 60 * 1000 &&
        grant.endDate >= now
      ) {
        const soonNotification = await ctx.runMutation(
          internal.modules.platform.pilotGrants.sendPilotExpiryNotifications,
          { grantId: grant._id, template: "expiring_soon" }
        );
        if ((soonNotification as any)?.success) {
          notifiedCount += 1;
        }
      }
    }

    return { success: true, expiredCount, notifiedCount };
  },
});
