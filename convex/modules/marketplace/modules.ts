import { internal } from "../../_generated/api";
import { internalMutation, mutation, query } from "../../_generated/server";
import { v } from "convex/values";
import { logAction } from "../../helpers/auditLog";
import { requireRole } from "../../helpers/authorize";
import { requirePlatformRole, requirePlatformSession } from "../../helpers/platformGuard";
import { requirePublisherContext } from "../../helpers/publisherGuard";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { CORE_MODULE_IDS, MODULE_DEPENDENCIES } from "./moduleDefinitions";
import { TIER_MODULES } from "./tierModules";

async function getTenantPlan(ctx: any, tenantId: string) {
  const tenant = await ctx.db
    .query("tenants")
    .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenantId))
    .first();
  return tenant?.plan ?? "starter";
}

async function getModuleBySlugOrId(ctx: any, value: string) {
  const bySlug = await ctx.db
    .query("modules")
    .withIndex("by_slug", (q: any) => q.eq("slug", value))
    .first();
  if (bySlug) return bySlug;

  const modules = await ctx.db
    .query("modules")
    .withIndex("by_publisherId", (q: any) => q.gt("publisherId", ""))
    .collect();
  return modules.find((module: any) => String(module._id) === value || module.slug === value) ?? null;
}

async function getModuleByDocOrSlug(ctx: any, moduleId: string) {
  const byLookup = await getModuleBySlugOrId(ctx, moduleId);
  if (byLookup) return byLookup;

  const modules = await ctx.db
    .query("modules")
    .withIndex("by_publisherId", (q: any) => q.gt("publisherId", ""))
    .collect();
  return modules.find((module: any) => String(module._id) === moduleId) ?? null;
}

async function createTenantNotification(
  ctx: any,
  tenantId: string,
  title: string,
  message: string,
  link?: string
) {
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
      type: "marketplace",
      isRead: false,
      link,
      createdAt: Date.now(),
    });
  }
}

export const getPublishedModules = query({
  args: {
    category: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let modules = await ctx.db
      .query("modules")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    if (args.category) {
      modules = modules.filter((module) => module.category === args.category);
    }
    if (args.search) {
      const search = args.search.toLowerCase();
      modules = modules.filter((module) =>
        [module.name, module.tagline ?? "", module.description].some((value) =>
          value.toLowerCase().includes(search)
        )
      );
    }

    return modules;
  },
});

export const getModuleDetail = query({
  args: {
    moduleRef: v.string(),
  },
  handler: async (ctx, args) => {
    const module = await getModuleBySlugOrId(ctx, args.moduleRef);
    if (!module || module.status !== "published") {
      return null;
    }

    const versions = await ctx.db
      .query("module_versions")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", String(module._id)))
      .collect();
    const assets = await ctx.db
      .query("module_assets")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", String(module._id)))
      .collect();
    const publisher = await ctx.db.get(module.publisherId as any).catch(() => null);

    return {
      ...module,
      versions,
      assets,
      publisher,
    };
  },
});

export const getModulesForReview = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformRole(ctx, args, [
      "marketplace_reviewer",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    return await ctx.db
      .query("modules")
      .withIndex("by_status", (q) => q.eq("status", "pending_review"))
      .collect();
  },
});

export const submitModule = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    tagline: v.optional(v.string()),
    category: v.string(),
    description: v.string(),
    featureList: v.array(v.string()),
    supportedRoles: v.array(v.string()),
    minimumPlan: v.optional(v.string()),
    pricingModel: v.string(),
    suggestedPriceKes: v.optional(v.number()),
    documentationUrl: v.optional(v.string()),
    supportEmail: v.optional(v.string()),
    termsUrl: v.optional(v.string()),
    privacyUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("modules")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) {
      throw new Error("Module slug already exists");
    }

    const moduleId = await ctx.db.insert("modules", {
      publisherId: publisher.publisherId,
      name: args.name,
      slug: args.slug,
      tagline: args.tagline,
      category: args.category,
      description: args.description,
      featureList: args.featureList,
      supportedRoles: args.supportedRoles,
      minimumPlan: args.minimumPlan,
      pricingModel: args.pricingModel,
      suggestedPriceKes: args.suggestedPriceKes,
      platformPriceKes: args.suggestedPriceKes,
      compatibleModuleIds: [],
      incompatibleModuleIds: [],
      status: "pending_review",
      isFeatured: false,
      documentationUrl: args.documentationUrl,
      supportEmail: args.supportEmail ?? publisher.email,
      termsUrl: args.termsUrl,
      privacyUrl: args.privacyUrl,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("module_versions", {
      moduleId: String(moduleId),
      version: "1.0.0",
      changelog: "Initial publisher submission",
      status: "pending_review",
      submittedAt: now,
      reviewedAt: undefined,
      reviewerId: undefined,
      reviewerNotes: undefined,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, moduleId };
  },
});

export const approveModule = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.id("modules"),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "marketplace_reviewer",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    await ctx.db.patch(args.moduleId, {
      status: "published",
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const rejectModule = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.id("modules"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "marketplace_reviewer",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    await ctx.db.patch(args.moduleId, {
      status: "changes_requested",
      updatedAt: Date.now(),
    });
    return { success: true, reason: args.reason };
  },
});

export const requestChanges = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.id("modules"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "marketplace_reviewer",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    await ctx.db.patch(args.moduleId, {
      status: "changes_requested",
      updatedAt: Date.now(),
    });
    return { success: true, notes: args.notes };
  },
});

export const suspendModule = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.id("modules"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "marketplace_reviewer",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    await ctx.db.patch(args.moduleId, {
      status: "suspended",
      updatedAt: Date.now(),
    });
    return { success: true, reason: args.reason };
  },
});

export const reinstateModule = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.id("modules"),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "marketplace_reviewer",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    await ctx.db.patch(args.moduleId, {
      status: "published",
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const banModule = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.id("modules"),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, ["master_admin"]);
    await ctx.db.patch(args.moduleId, {
      status: "banned",
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const featureModule = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.id("modules"),
    featured: v.boolean(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "marketplace_reviewer",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    await ctx.db.patch(args.moduleId, {
      isFeatured: args.featured,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const overrideModulePrice = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.id("modules"),
    priceKes: v.number(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, ["master_admin"]);
    const module = await ctx.db.get(args.moduleId);
    if (!module) throw new Error("Module not found");

    await ctx.db.patch(args.moduleId, {
      platformPriceKes: args.priceKes,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("module_price_history", {
      moduleId: String(args.moduleId),
      oldPriceKes: module.platformPriceKes ?? 0,
      newPriceKes: args.priceKes,
      changedBy: platform.userId,
      changedAt: Date.now(),
      reason: "Platform price override",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const getInstalledModules = query({
  args: {},
  handler: async (ctx) => {
    const tenant = await requireTenantContext(ctx);
    return await ctx.db
      .query("module_installs")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();
  },
});

export const installModule = mutation({
  args: {
    moduleId: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<
    | { success: true; installId: any; status: "allowed" }
    | { status: "allowed" | "plan_upgrade_required" | "rbac_escalation_required" | "payment_required" | "waitlist_only"; reason: string }
  > => {
    const tenant = await requireTenantContext(ctx);
    requireRole(tenant, "school_admin");

    const access: {
      status: "allowed" | "plan_upgrade_required" | "rbac_escalation_required" | "payment_required" | "waitlist_only";
      reason: string;
    } = await ctx.runMutation(internal.modules.marketplace.modules.checkModuleAccess, {
        tenantId: tenant.tenantId,
        moduleId: args.moduleId,
      });

    if (access.status !== "allowed") {
      return access;
    }

    const now = Date.now();
    const module = await getModuleByDocOrSlug(ctx, args.moduleId);
    const resolvedModuleId = String(module?._id ?? args.moduleId);
    const installId = await ctx.db.insert("module_installs", {
      moduleId: resolvedModuleId,
      versionId: undefined,
      tenantId: tenant.tenantId,
      status: "active",
      installedAt: now,
      installedBy: tenant.userId,
      uninstalledAt: undefined,
      exceptionGrantId: undefined,
      createdAt: now,
      updatedAt: now,
    });

    await createTenantNotification(
      ctx,
      tenant.tenantId,
      "Module installed",
      `${module?.name ?? "Module"} was installed successfully.`,
      "/admin/modules"
    );

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "module.installed",
      entityType: "module_install",
      entityId: String(installId),
      after: { moduleId: args.moduleId },
    });

    await ctx.runMutation(internal.modules.marketplace.analytics.recordAnalyticsEvent, {
      moduleId: resolvedModuleId,
      tenantId: tenant.tenantId,
      eventType: "install_activated",
      metadata: { installId: String(installId), installedBy: tenant.userId },
      timestamp: now,
    });

    await ctx.runMutation(internal.modules.marketplace.analytics.refreshModuleInstallStats, {
      moduleId: resolvedModuleId,
    });

    return { success: true, installId, status: "allowed" };
  },
});

export const uninstallModule = mutation({
  args: {
    installId: v.id("module_installs"),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    requireRole(tenant, "school_admin");
    const install = await ctx.db.get(args.installId);
    if (!install || install.tenantId !== tenant.tenantId) {
      throw new Error("Module installation not found");
    }
    const now = Date.now();
    await ctx.db.patch(args.installId, {
      status: "uninstalled",
      uninstalledAt: now,
      updatedAt: now,
    });

    await ctx.runMutation(internal.modules.marketplace.analytics.recordAnalyticsEvent, {
      moduleId: install.moduleId,
      tenantId: tenant.tenantId,
      eventType: "uninstalled",
      metadata: { installId: String(args.installId), uninstalledBy: tenant.userId },
      timestamp: now,
    });

    await ctx.runMutation(internal.modules.marketplace.analytics.refreshModuleInstallStats, {
      moduleId: install.moduleId,
    });

    return { success: true };
  },
});

export const enableModule = mutation({
  args: {
    installId: v.id("module_installs"),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    const install = await ctx.db.get(args.installId);
    if (!install || install.tenantId !== tenant.tenantId) {
      throw new Error("Module installation not found");
    }
    const now = Date.now();
    await ctx.db.patch(args.installId, {
      status: "active",
      updatedAt: now,
    });

    await ctx.runMutation(internal.modules.marketplace.analytics.recordAnalyticsEvent, {
      moduleId: install.moduleId,
      tenantId: tenant.tenantId,
      eventType: "enabled",
      metadata: { installId: String(args.installId), enabledBy: tenant.userId },
      timestamp: now,
    });

    return { success: true };
  },
});

export const disableModule = mutation({
  args: {
    installId: v.id("module_installs"),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    const install = await ctx.db.get(args.installId);
    if (!install || install.tenantId !== tenant.tenantId) {
      throw new Error("Module installation not found");
    }
    const now = Date.now();
    await ctx.db.patch(args.installId, {
      status: "suspended",
      updatedAt: now,
    });

    await ctx.runMutation(internal.modules.marketplace.analytics.recordAnalyticsEvent, {
      moduleId: install.moduleId,
      tenantId: tenant.tenantId,
      eventType: "disabled",
      metadata: { installId: String(args.installId), disabledBy: tenant.userId },
      timestamp: now,
    });

    return { success: true };
  },
});

export const getModuleConfig = query({
  args: {
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    return await ctx.db
      .query("module_configs")
      .withIndex("by_tenant_module", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("moduleId", args.moduleId)
      )
      .first();
  },
});

export const updateModuleConfig = mutation({
  args: {
    moduleId: v.string(),
    rolePermissions: v.optional(v.record(v.string(), v.array(v.string()))),
    featureFlags: v.optional(v.record(v.string(), v.boolean())),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    requireRole(tenant, "school_admin");
    const existing = await ctx.db
      .query("module_configs")
      .withIndex("by_tenant_module", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("moduleId", args.moduleId)
      )
      .first();
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        rolePermissions: args.rolePermissions,
        featureFlags: args.featureFlags,
        updatedAt: now,
      });
      return { success: true, configId: existing._id };
    }

    const configId = await ctx.db.insert("module_configs", {
      moduleId: args.moduleId,
      tenantId: tenant.tenantId,
      rolePermissions: args.rolePermissions,
      featureFlags: args.featureFlags,
      createdAt: now,
      updatedAt: now,
    });
    return { success: true, configId };
  },
});

export const submitModuleRequest = mutation({
  args: {
    type: v.union(
      v.literal("new_module"),
      v.literal("plan_locked"),
      v.literal("rbac_restricted"),
      v.literal("beta_suspended")
    ),
    moduleId: v.optional(v.string()),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    useCase: v.optional(v.string()),
    urgencyLevel: v.optional(v.string()),
    budgetKes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    const now = Date.now();
    const requestId = await ctx.db.insert("module_requests", {
      tenantId: tenant.tenantId,
      requestedBy: tenant.userId,
      type: args.type,
      moduleId: args.moduleId,
      name: args.name,
      description: args.description,
      useCase: args.useCase,
      urgencyLevel: args.urgencyLevel,
      budgetKes: args.budgetKes,
      status: args.type === "rbac_restricted" ? "approved_exception_granted" : "submitted",
      resolution: undefined,
      waitlistPosition: undefined,
      createdAt: now,
      updatedAt: now,
    });

    if (args.type === "rbac_restricted" && args.moduleId) {
      await ctx.db.insert("module_exception_grants", {
        moduleId: args.moduleId,
        tenantId: tenant.tenantId,
        grantedBy: tenant.userId,
        grantedAt: now,
        expiresAt: undefined,
        reason: args.description ?? args.useCase ?? "RBAC escalation approved",
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true, requestId };
  },
});

export const getModuleRequests = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.sessionToken) {
      await requirePlatformSession(ctx, { sessionToken: args.sessionToken });
      return await ctx.db.query("module_requests").collect();
    }
    const tenant = await requireTenantContext(ctx);
    return await ctx.db
      .query("module_requests")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();
  },
});

export const joinWaitlist = mutation({
  args: {
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    const existing = await ctx.db
      .query("module_waitlist")
      .withIndex("by_tenant_module", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("moduleId", args.moduleId)
      )
      .first();
    if (existing) return { success: true, waitlistId: existing._id, duplicate: true };

    const waitlistId = await ctx.db.insert("module_waitlist", {
      moduleId: args.moduleId,
      tenantId: tenant.tenantId,
      joinedAt: Date.now(),
      notifiedAt: undefined,
      createdAt: Date.now(),
    });
    return { success: true, waitlistId };
  },
});

export const checkModuleAccess = internalMutation({
  args: {
    tenantId: v.string(),
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    const module = await getModuleByDocOrSlug(ctx, args.moduleId);
    if (!module) {
      throw new Error("Module not found");
    }

    if (module.status !== "published") {
      return { status: "waitlist_only" as const, reason: "Module is not published" };
    }

    const pilotGrant = await ctx.runMutation(internal.modules.platform.pilotGrants.checkActivePilotGrant, {
      tenantId: args.tenantId,
      moduleId: args.moduleId,
    });
    if ((pilotGrant as any).active) {
      return { status: "allowed" as const, reason: "Pilot grant active" };
    }

    const exceptionGrant = await ctx.db
      .query("module_exception_grants")
      .withIndex("by_tenant_module", (q) =>
        q.eq("tenantId", args.tenantId).eq("moduleId", String(module._id))
      )
      .first();
    if (
      exceptionGrant &&
      (exceptionGrant.expiresAt === undefined || exceptionGrant.expiresAt >= Date.now())
    ) {
      return { status: "allowed" as const, reason: "Module exception grant active" };
    }

    const plan = await getTenantPlan(ctx, args.tenantId);
    const allowedForPlan = [
      ...(TIER_MODULES[plan] ?? []),
      ...(plan === "starter" ? [] : (TIER_MODULES.starter ?? [])),
    ];
    const moduleSlug = module.slug as string;
    const dependencyIds = MODULE_DEPENDENCIES[moduleSlug] ?? [];

    if (Array.isArray(module.supportedRoles) && module.supportedRoles.length > 0) {
      const tenantUsers = await ctx.db
        .query("users")
        .withIndex("by_tenant", (q: any) => q.eq("tenantId", args.tenantId))
        .collect();
      const hasEligibleRole = tenantUsers.some(
        (user: any) => user.isActive && module.supportedRoles.includes(user.role)
      );

      if (!hasEligibleRole) {
        return {
          status: "rbac_escalation_required" as const,
          reason: "No active tenant users match the module's supported roles",
        };
      }
    }

    if (!CORE_MODULE_IDS.includes(moduleSlug) && !allowedForPlan.includes(moduleSlug)) {
      return { status: "plan_upgrade_required" as const, reason: "Plan upgrade required" };
    }

    for (const dependency of dependencyIds) {
      const dependencyInstall = await ctx.db
        .query("module_installs")
        .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
        .collect();
      const hasDependency = dependencyInstall.some(
        (install) => install.moduleId === dependency && install.status === "active"
      );
      if (!hasDependency) {
        return { status: "waitlist_only" as const, reason: `Missing dependency ${dependency}` };
      }
    }

    const successfulPayments = await ctx.db
      .query("module_payments")
      .withIndex("by_tenant_status", (q) =>
        q.eq("tenantId", args.tenantId).eq("status", "success")
      )
      .filter((q) => q.eq(q.field("moduleId"), args.moduleId))
      .collect();
    const hasSuccessfulPayment = successfulPayments.some(
      (payment) => payment.status === "success"
    );

    if (module.platformPriceKes && module.platformPriceKes > 0 && !hasSuccessfulPayment) {
      return { status: "payment_required" as const, reason: "Module requires payment" };
    }

    return { status: "allowed" as const, reason: "Access granted" };
  },
});

export const recordModulePayment = mutation({
  args: {
    tenantId: v.string(),
    moduleId: v.string(),
    amountKes: v.number(),
    currency: v.string(),
    displayAmount: v.number(),
    exchangeRate: v.number(),
    provider: v.string(),
    invoiceId: v.optional(v.string()),
    periodStart: v.optional(v.number()),
    periodEnd: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("success"),
      v.literal("failed"),
      v.literal("refunded")
    ),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    requireRole(tenant, "school_admin");
    if (tenant.tenantId !== args.tenantId) {
      throw new Error("FORBIDDEN: tenant mismatch");
    }

    const paymentId = await ctx.db.insert("module_payments", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const module = await getModuleByDocOrSlug(ctx, args.moduleId);
    if (module) {
      const publisher = await ctx.db
        .query("publishers")
        .withIndex("by_userId", (q: any) => q.eq("userId", module.publisherId))
        .first();
      const revenueSharePct = publisher?.revenueSharePct ?? 70;
      const publisherAmountKes = Math.round((args.amountKes * revenueSharePct) / 100);
      await ctx.db.insert("module_revenue_splits", {
        paymentId: String(paymentId),
        publisherAmountKes,
        platformAmountKes: args.amountKes - publisherAmountKes,
        revenueSharePct,
        createdAt: Date.now(),
      });
    }

    await ctx.runMutation(internal.modules.marketplace.analytics.refreshModuleInstallStats, {
      moduleId: args.moduleId,
    });

    return { success: true, paymentId };
  },
});
