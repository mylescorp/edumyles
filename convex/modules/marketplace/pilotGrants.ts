import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "../../_generated/server";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";
import { runModuleOnInstallSetup } from "../moduleRuntime";
import { ModuleSlug } from "../moduleCatalog";

const FREE_ACCESS_GRANT_TYPES = new Set([
  "free_trial",
  "free_permanent",
  "plan_upgrade",
  "beta_access",
]);

function isGrantActive(grant: any) {
  return (
    grant &&
    (grant.status === "active" || grant.status === "extended") &&
    grant.startDate <= Date.now() &&
    (!grant.endDate || grant.endDate >= Date.now())
  );
}

function isGrantFreeAccess(grantType: string) {
  return FREE_ACCESS_GRANT_TYPES.has(grantType);
}

async function getModuleRecordById(ctx: any, moduleId: string) {
  const marketplaceModules = await ctx.db.query("marketplace_modules").collect();
  return (
    marketplaceModules.find((moduleRecord: any) => String(moduleRecord._id) === String(moduleId)) ?? null
  );
}

async function getTargetModules(
  ctx: any,
  args: {
    moduleId?: string;
    moduleIds?: string[];
    grantScope: "single" | "selected" | "all";
  }
) {
  const modules = await ctx.db.query("marketplace_modules").collect();

  if (args.grantScope === "all") {
    return modules;
  }

  const requestedIds =
    args.grantScope === "selected"
      ? args.moduleIds ?? []
      : args.moduleId
        ? [args.moduleId]
        : [];

  const requestedSet = new Set(requestedIds.map(String));
  return modules.filter((moduleRecord: any) => requestedSet.has(String(moduleRecord._id)));
}

async function getActiveGrant(ctx: any, moduleId: any, tenantId: string) {
  const grants = await ctx.db
    .query("pilot_grants")
    .withIndex("by_moduleId_tenantId", (q: any) => q.eq("moduleId", moduleId).eq("tenantId", tenantId))
    .collect();

  return grants.find((grant: any) => isGrantActive(grant)) ?? null;
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

async function getTenantInstall(ctx: any, tenantId: string, moduleSlug: string) {
  return await ctx.db
    .query("module_installs")
    .withIndex("by_tenantId_moduleSlug", (q: any) =>
      q.eq("tenantId", tenantId).eq("moduleSlug", moduleSlug)
    )
    .unique();
}

async function provisionInstallFromPilot(
  ctx: any,
  args: {
    grantId: any;
    tenantId: string;
    grantedBy: string;
    moduleRecord: any;
    grantType: string;
  }
) {
  const now = Date.now();
  const isFree = isGrantFreeAccess(args.grantType);
  const existingInstall = await getTenantInstall(ctx, args.tenantId, args.moduleRecord.slug);

  if (existingInstall) {
    await ctx.db.patch(existingInstall._id, {
      moduleId: args.moduleRecord._id,
      moduleSlug: args.moduleRecord.slug,
      pilotGrantId: args.grantId,
      isFree,
      status:
        existingInstall.status === "uninstalled" ||
        existingInstall.status === "data_purged" ||
        existingInstall.status === "suspended_platform"
          ? "active"
          : existingInstall.status,
      updatedAt: now,
    });

    return existingInstall._id;
  }

  const installId = await ctx.db.insert("module_installs", {
    moduleId: args.moduleRecord._id,
    moduleSlug: args.moduleRecord.slug,
    tenantId: args.tenantId,
    status: "active",
    billingPeriod: "monthly",
    currentPriceKes: 0,
    hasPriceOverride: false,
    pilotGrantId: args.grantId,
    provisionedByPilotGrantId: args.grantId,
    isFree,
    firstInstalledAt: now,
    installedAt: now,
    installedBy: args.grantedBy,
    version: args.moduleRecord.version,
    paymentFailureCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  if (!args.moduleRecord.slug.startsWith("core_")) {
    await runModuleOnInstallSetup(ctx, {
      moduleSlug: args.moduleRecord.slug as ModuleSlug,
      tenantId: args.tenantId,
      updatedBy: args.grantedBy,
    });
  }

  return installId;
}

async function detachGrantFromInstall(
  ctx: any,
  args: {
    grantId: any;
    tenantId: string;
    moduleSlug: string;
    suspendProvisionedAccess: boolean;
  }
) {
  const install = await getTenantInstall(ctx, args.tenantId, args.moduleSlug);
  if (!install) {
    return;
  }

  const basePatch: Record<string, unknown> = {
    pilotGrantId: undefined,
    isFree: false,
    updatedAt: Date.now(),
  };

  if (String(install.provisionedByPilotGrantId ?? "") === String(args.grantId)) {
    basePatch.provisionedByPilotGrantId = undefined;
    if (args.suspendProvisionedAccess) {
      basePatch.status = "suspended_platform";
    }
  }

  await ctx.db.patch(install._id, basePatch);
}

export const createPilotGrant = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.optional(v.union(v.string(), v.id("marketplace_modules"))),
    moduleIds: v.optional(v.array(v.string())),
    grantScope: v.optional(v.union(v.literal("single"), v.literal("selected"), v.literal("all"))),
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

    const grantScope = args.grantScope ?? "single";
    const targetModules = await getTargetModules(ctx, {
      moduleId: args.moduleId ? String(args.moduleId) : undefined,
      moduleIds: args.moduleIds,
      grantScope,
    });

    if (targetModules.length === 0) {
      throw new ConvexError({ code: "INVALID_ARGUMENT", message: "Select at least one module to grant." });
    }

    const grantIds: any[] = [];
    for (const moduleRecord of targetModules) {
      const activeGrant = await getActiveGrant(ctx, moduleRecord._id, args.tenantId);
      if (activeGrant) {
        continue;
      }

      const now = Date.now();
      const grantId = await ctx.db.insert("pilot_grants", {
        moduleId: moduleRecord._id,
        tenantId: args.tenantId,
        grantType: args.grantType,
        discountPct: args.discountPct,
        customPriceKes: args.customPriceKes,
        startDate: args.startDate,
        endDate: args.endDate,
        grantedBy: platform.userId,
        reason: args.reason,
        grantScope,
        stealthMode: args.stealthMode,
        status: "active",
        convertedToPaid: false,
        notificationsSent: [],
        createdAt: now,
        updatedAt: now,
      });
      grantIds.push(grantId);

      await provisionInstallFromPilot(ctx, {
        grantId,
        tenantId: args.tenantId,
        grantedBy: platform.userId,
        moduleRecord,
        grantType: args.grantType,
      });
    }

    if (grantIds.length === 0) {
      throw new ConvexError({
        code: "PILOT_EXISTS",
        message: "Active pilot grants already exist for all selected modules.",
      });
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "marketplace.listing_updated",
      entityType: "pilot_grant",
      entityId: String(grantIds[0]),
      after: {
        tenantId: args.tenantId,
        grantType: args.grantType,
        reason: args.reason,
        grantScope,
        moduleCount: grantIds.length,
      },
    });

    if (!args.stealthMode) {
      const scopeLabel =
        grantScope === "all"
          ? "full marketplace access"
          : grantIds.length === 1
            ? "a marketplace module"
            : `${grantIds.length} marketplace modules`;
      await notifyTenantAdmins(
        ctx,
        args.tenantId,
        "Pilot grant activated",
        `The platform team granted ${scopeLabel} to your school.`
      );
    }

    return { success: true, grantIds, createdCount: grantIds.length };
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

    const moduleRecord = await getModuleRecordById(ctx, String(grant.moduleId));
    if (!moduleRecord) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Marketplace module not found for pilot grant" });
    }

    await ctx.db.patch(args.grantId, {
      status: "revoked",
      revokedAt: Date.now(),
      revokedBy: platform.userId,
      revokedReason: args.reason,
      updatedAt: Date.now(),
    });

    await detachGrantFromInstall(ctx, {
      grantId: args.grantId,
      tenantId: grant.tenantId,
      moduleSlug: moduleRecord.slug,
      suspendProvisionedAccess: true,
    });

    await notifyTenantAdmins(
      ctx,
      grant.tenantId,
      "Pilot grant revoked",
      "A marketplace pilot grant was revoked and any access it provisioned has been withdrawn."
    );

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
    const grants = await ctx.db.query("pilot_grants").collect();

    let expired = 0;
    for (const grant of grants.filter((entry: any) => entry.status === "active" || entry.status === "extended")) {
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

        const moduleRecord = await getModuleRecordById(ctx, String(grant.moduleId));
        if (moduleRecord) {
          await detachGrantFromInstall(ctx, {
            grantId: grant._id,
            tenantId: grant.tenantId,
            moduleSlug: moduleRecord.slug,
            suspendProvisionedAccess: isGrantFreeAccess(grant.grantType),
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
