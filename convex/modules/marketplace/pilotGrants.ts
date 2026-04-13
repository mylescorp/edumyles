import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "../../_generated/server";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

async function getActiveGrant(ctx: any, moduleId: any, tenantId: string) {
  const grants = await ctx.db
    .query("pilot_grants")
    .withIndex("by_moduleId_tenantId", (q: any) => q.eq("moduleId", moduleId).eq("tenantId", tenantId))
    .collect();
  return (
    grants.find(
      (grant: any) =>
        grant.status !== "revoked" &&
        grant.status !== "expired" &&
        (!grant.endDate || grant.endDate >= Date.now())
    ) ?? null
  );
}

async function notifyTenantAdmins(ctx: any, tenantId: string, title: string, message: string) {
  const admins = await ctx.db
    .query("users")
    .withIndex("by_tenant_role", (q: any) => q.eq("tenantId", tenantId).eq("role", "school_admin"))
    .collect();

  for (const admin of admins) {
    await ctx.db.insert("notifications", {
      tenantId,
      userId: admin.eduMylesUserId,
      title,
      message,
      type: "pilot_grant",
      isRead: false,
      link: "/admin/marketplace",
      createdAt: Date.now(),
    });
  }
}

export const createPilotGrant = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.union(v.string(), v.id("marketplace_modules")),
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
    stealthMode: v.boolean(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    if (["free_permanent", "beta_access"].includes(args.grantType) && platform.role !== "master_admin") {
      throw new ConvexError({ code: "FORBIDDEN", message: "Only master admin can create this grant type" });
    }
    if (!args.endDate && args.grantType !== "free_permanent") {
      throw new ConvexError({ code: "INVALID_ARGUMENT", message: "endDate is required for this grant type" });
    }

    const activeGrant = await getActiveGrant(ctx, args.moduleId, args.tenantId);
    if (activeGrant) {
      throw new ConvexError({ code: "PILOT_EXISTS", message: "An active pilot grant already exists" });
    }

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
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const installs = await ctx.db
      .query("module_installs")
      .withIndex("by_tenantId", (q: any) => q.eq("tenantId", args.tenantId))
      .collect();
    const install = installs.find((entry: any) => entry.moduleId === args.moduleId || entry.moduleId === String(args.moduleId));
    if (install) {
      await ctx.db.patch(install._id, {
        pilotGrantId: grantId,
        isFree: args.grantType === "free_trial" || args.grantType === "free_permanent",
        updatedAt: Date.now(),
      });
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "marketplace.module_installed",
      entityType: "pilot_grant",
      entityId: String(grantId),
      after: { tenantId: args.tenantId, moduleId: String(args.moduleId), grantType: args.grantType, reason: args.reason },
    });

    if (!args.stealthMode) {
      await notifyTenantAdmins(ctx, args.tenantId, "Pilot grant activated", "A marketplace pilot grant has been activated for your school.");
    }

    return { success: true, grantId };
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
    const grant = await ctx.db.get(args.grantId);
    if (!grant) throw new ConvexError({ code: "NOT_FOUND", message: "Pilot grant not found" });

    await ctx.db.patch(args.grantId, {
      status: "revoked",
      revokedAt: Date.now(),
      revokedBy: platform.userId,
      revokedReason: args.reason,
      updatedAt: Date.now(),
    });

    const installs = await ctx.db
      .query("module_installs")
      .withIndex("by_tenantId", (q: any) => q.eq("tenantId", grant.tenantId))
      .collect();
    const install = installs.find((entry: any) => String(entry.moduleId) === String(grant.moduleId));
    if (install) {
      await ctx.db.patch(install._id, {
        pilotGrantId: undefined,
        isFree: false,
        updatedAt: Date.now(),
      });
    }

    await notifyTenantAdmins(ctx, grant.tenantId, "Pilot grant revoked", "A marketplace pilot grant has been revoked and billing will resume.");

    return { success: true };
  },
});

export const extendPilotGrant = mutation({
  args: {
    sessionToken: v.string(),
    grantId: v.id("pilot_grants"),
    newEndDate: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const grant = await ctx.db.get(args.grantId);
    if (!grant) throw new ConvexError({ code: "NOT_FOUND", message: "Pilot grant not found" });

    await ctx.db.patch(args.grantId, {
      endDate: args.newEndDate,
      status: "extended",
      updatedAt: Date.now(),
    });

    await notifyTenantAdmins(ctx, grant.tenantId, "Pilot grant extended", "Your marketplace pilot access has been extended.");
    return { success: true };
  },
});

export const processPilotExpiry = internalMutation({
  args: {},
  handler: async (ctx) => {
    const grants = await ctx.db
      .query("pilot_grants")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    let expired = 0;
    for (const grant of grants) {
      if (grant.grantType === "free_permanent") continue;
      if (!grant.endDate) continue;

      const daysRemaining = Math.ceil((grant.endDate - Date.now()) / (24 * 60 * 60 * 1000));
      const notificationsSent = grant.notificationsSent ?? [];
      for (const day of [30, 14, 7, 3, 1]) {
        const key = `expiry_${day}`;
        if (daysRemaining <= day && daysRemaining >= 0 && !notificationsSent.includes(key)) {
          await notifyTenantAdmins(ctx, grant.tenantId, "Pilot grant expiring soon", `Your pilot grant expires in ${day} day(s).`);
          await ctx.db.patch(grant._id, {
            notificationsSent: [...notificationsSent, key],
            updatedAt: Date.now(),
          });
        }
      }

      if (grant.endDate <= Date.now()) {
        await ctx.db.patch(grant._id, {
          status: "expired",
          updatedAt: Date.now(),
        });

        const installs = await ctx.db
          .query("module_installs")
          .withIndex("by_tenantId", (q: any) => q.eq("tenantId", grant.tenantId))
          .collect();
        const install = installs.find((entry: any) => String(entry.moduleId) === String(grant.moduleId));
        if (install && install.isFree) {
          await ctx.db.patch(install._id, {
            status: "suspended_platform",
            updatedAt: Date.now(),
          });
        }

        await notifyTenantAdmins(ctx, grant.tenantId, "Pilot grant expired", "Your marketplace pilot has expired.");
        expired += 1;
      }
    }

    return { expired };
  },
});

export const getActivePilotGrant = query({
  args: {
    moduleId: v.union(v.string(), v.id("marketplace_modules")),
    tenantId: v.string(),
  },
  handler: async (ctx, args) => await getActiveGrant(ctx, args.moduleId, args.tenantId),
});
