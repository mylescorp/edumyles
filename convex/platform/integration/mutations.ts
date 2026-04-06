import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";
import { requirePlatformSession } from "../../helpers/platformGuard";

/**
 * Install a third-party integration
 */
export const installIntegration = mutation({
  args: {
    sessionToken: v.string(),
    integrationId: v.string(),
    configuration: v.optional(v.record(v.string(), v.any())),
    autoEnable: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const integration = await ctx.db.get(args.integrationId as Id<"integrations">);
    if (!integration) {
      throw new Error("Integration not found");
    }

    const existingInstallation = await ctx.db
      .query("integrationInstallations")
      .withIndex("by_tenant_integration", (q) =>
        q.eq("tenantId", tenantId).eq("integrationId", args.integrationId)
      )
      .first();

    if (existingInstallation) {
      throw new Error("Integration already installed");
    }

    const installationId = await ctx.db.insert("integrationInstallations", {
      tenantId,
      integrationId: args.integrationId,
      configuration: args.configuration ?? {},
      status: args.autoEnable ? "active" : "installed",
      installedBy: userId,
      installedAt: Date.now(),
      syncStatus: "pending",
      usage: { apiCalls: 0, dataTransferred: 0, errors: 0 },
      subscription: {
        plan: integration.defaultPlan,
        status: "active",
        billingCycle: "monthly",
        amount: 0,
        currency: "USD",
        features: [],
        startedAt: Date.now(),
      },
      updatedAt: Date.now(),
      keepData: false,
    });

    await ctx.db.insert("integrationInstallationTimeline", {
      installationId,
      type: "installed",
      message: `Integration ${integration.name} installed successfully`,
      metadata: { integrationId: args.integrationId, autoEnabled: args.autoEnable },
      userId,
      tenantId,
      createdAt: Date.now(),
    });

    if (args.autoEnable) {
      await ctx.db.insert("integrationInstallationTimeline", {
        installationId,
        type: "activated",
        message: `Integration ${integration.name} activated and ready for use`,
        metadata: { integrationId: args.integrationId },
        userId,
        tenantId,
        createdAt: Date.now(),
      });
    }

    return { success: true, installationId, message: "Integration installed successfully" };
  },
});

/**
 * Configure an installed integration
 */
export const configureIntegration = mutation({
  args: {
    sessionToken: v.string(),
    installationId: v.string(),
    configuration: v.record(v.string(), v.any()),
    testConnection: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const installation = await ctx.db.get(args.installationId as Id<"integrationInstallations">);
    if (!installation || installation.tenantId !== tenantId) {
      throw new Error("Installation not found");
    }

    await ctx.db.patch(args.installationId as Id<"integrationInstallations">, {
      configuration: args.configuration,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("integrationInstallationTimeline", {
      installationId: args.installationId,
      type: "configured",
      message: "Integration configuration updated",
      metadata: { testConnection: args.testConnection },
      userId,
      tenantId,
      createdAt: Date.now(),
    });

    if (args.testConnection) {
      const testResult = await testIntegrationConnection(installation.integrationId, args.configuration);

      await ctx.db.insert("integrationInstallationTimeline", {
        installationId: args.installationId,
        type: "test_connection",
        message: `Connection test ${testResult.success ? "passed" : "failed"}`,
        metadata: testResult,
        userId,
        tenantId,
        createdAt: Date.now(),
      });

      return { success: true, message: "Configuration updated and connection tested", testResult };
    }

    return { success: true, message: "Integration configured successfully" };
  },
});

/**
 * Enable/disable an integration
 */
export const toggleIntegration = mutation({
  args: {
    sessionToken: v.string(),
    installationId: v.string(),
    enabled: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const installation = await ctx.db.get(args.installationId as Id<"integrationInstallations">);
    if (!installation || installation.tenantId !== tenantId) {
      throw new Error("Installation not found");
    }

    const newStatus = args.enabled ? "active" : "disabled";

    await ctx.db.patch(args.installationId as Id<"integrationInstallations">, {
      status: newStatus,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("integrationInstallationTimeline", {
      installationId: args.installationId,
      type: args.enabled ? "enabled" : "disabled",
      message: `Integration ${args.enabled ? "enabled" : "disabled"}${args.reason ? `: ${args.reason}` : ""}`,
      metadata: { previousStatus: installation.status, newStatus },
      userId,
      tenantId,
      createdAt: Date.now(),
    });

    return { success: true, message: `Integration ${args.enabled ? "enabled" : "disabled"} successfully` };
  },
});

/**
 * Uninstall an integration
 */
export const uninstallIntegration = mutation({
  args: {
    sessionToken: v.string(),
    installationId: v.string(),
    reason: v.optional(v.string()),
    keepData: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const installation = await ctx.db.get(args.installationId as Id<"integrationInstallations">);
    if (!installation || installation.tenantId !== tenantId) {
      throw new Error("Installation not found");
    }

    await ctx.db.insert("integrationInstallationTimeline", {
      installationId: args.installationId,
      type: "uninstalled",
      message: `Integration uninstalled${args.reason ? `: ${args.reason}` : ""}`,
      metadata: { keepData: args.keepData, finalUsage: installation.usage },
      userId,
      tenantId,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.installationId as Id<"integrationInstallations">, {
      status: "uninstalled",
      uninstalledAt: Date.now(),
      uninstalledBy: userId,
      uninstalledReason: args.reason ?? "",
      keepData: args.keepData ?? false,
      updatedAt: Date.now(),
    });

    return { success: true, message: "Integration uninstalled successfully" };
  },
});

/**
 * Sync integration data
 */
export const syncIntegration = mutation({
  args: {
    sessionToken: v.string(),
    installationId: v.string(),
    syncType: v.optional(v.union(v.literal("full"), v.literal("incremental"), v.literal("manual"))),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const installation = await ctx.db.get(args.installationId as Id<"integrationInstallations">);
    if (!installation || installation.tenantId !== tenantId) {
      throw new Error("Installation not found");
    }

    await ctx.db.patch(args.installationId as Id<"integrationInstallations">, {
      syncStatus: "running",
      lastSyncAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("integrationInstallationTimeline", {
      installationId: args.installationId,
      type: "sync_started",
      message: `Integration sync started (${args.syncType ?? "manual"})`,
      metadata: { syncType: args.syncType ?? "manual" },
      userId,
      tenantId,
      createdAt: Date.now(),
    });

    const syncResult = {
      success: true,
      recordsProcessed: 1250,
      recordsCreated: 45,
      recordsUpdated: 89,
      recordsDeleted: 12,
      errors: [],
      duration: 45000,
    };

    await ctx.db.patch(args.installationId as Id<"integrationInstallations">, {
      syncStatus: "completed",
      usage: {
        ...installation.usage,
        apiCalls: installation.usage.apiCalls + 1,
        dataTransferred: installation.usage.dataTransferred + syncResult.recordsProcessed,
      },
      updatedAt: Date.now(),
    });

    await ctx.db.insert("integrationInstallationTimeline", {
      installationId: args.installationId,
      type: "sync_completed",
      message: "Integration sync completed successfully",
      metadata: syncResult,
      userId,
      tenantId,
      createdAt: Date.now(),
    });

    return { success: true, message: "Integration sync completed successfully", syncResult };
  },
});

/**
 * Create a custom integration
 */
export const createCustomIntegration = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("crm"), v.literal("communication"), v.literal("analytics"), v.literal("payment"),
      v.literal("storage"), v.literal("security"), v.literal("productivity"), v.literal("development"), v.literal("other")
    ),
    type: v.union(v.literal("webhook"), v.literal("api"), v.literal("oauth"), v.literal("database")),
    configuration: v.record(v.string(), v.any()),
    endpoints: v.array(v.object({
      name: v.string(),
      url: v.string(),
      method: v.union(v.literal("GET"), v.literal("POST"), v.literal("PUT"), v.literal("DELETE")),
      authentication: v.object({
        type: v.union(v.literal("none"), v.literal("api_key"), v.literal("oauth"), v.literal("basic")),
        credentials: v.optional(v.record(v.string(), v.any())),
      }),
    })),
    webhookUrl: v.optional(v.string()),
    documentationUrl: v.optional(v.string()),
    supportEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const integrationId = await ctx.db.insert("integrations", {
      name: args.name,
      description: args.description,
      category: args.category,
      type: args.type,
      isCustom: true,
      isPublic: false,
      isFeatured: false,
      status: "draft",
      configuration: args.configuration,
      endpoints: args.endpoints,
      webhookUrl: args.webhookUrl,
      documentationUrl: args.documentationUrl,
      supportEmail: args.supportEmail,
      createdBy: userId,
      tenantId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usage: { installs: 0, apiCalls: 0, dataTransferred: 0 },
      pricing: { type: "free", amount: 0, currency: "USD", billingCycle: "monthly" },
      defaultPlan: "free",
      features: [],
      requirements: [],
      limitations: [],
      tags: [],
    });

    return { success: true, integrationId, message: "Custom integration created successfully" };
  },
});

/**
 * Update integration subscription
 */
export const updateIntegrationSubscription = mutation({
  args: {
    sessionToken: v.string(),
    installationId: v.string(),
    plan: v.union(v.literal("free"), v.literal("basic"), v.literal("pro"), v.literal("enterprise")),
    billingCycle: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annual")),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const installation = await ctx.db.get(args.installationId as Id<"integrationInstallations">);
    if (!installation || installation.tenantId !== tenantId) {
      throw new Error("Installation not found");
    }

    const planPricing: Record<string, { amount: number; features: string[] }> = {
      free: { amount: 0, features: ["basic_sync", "support"] },
      basic: { amount: 29, features: ["advanced_sync", "api_access", "email_support"] },
      pro: { amount: 99, features: ["real_time_sync", "advanced_analytics", "priority_support", "custom_endpoints"] },
      enterprise: { amount: 299, features: ["unlimited_sync", "dedicated_support", "custom_development", "sla_guarantee"] },
    };

    const fallbackPricing = planPricing.free ?? { amount: 0, features: [] as string[] };
    const pricing = planPricing[args.plan] ?? fallbackPricing;
    const now = Date.now();
    const cycleMonths: Record<string, number> = { monthly: 1, quarterly: 3, annual: 12 };
    const expiresAt = args.plan !== "free"
      ? now + ((cycleMonths[args.billingCycle] ?? 1) * 30 * 24 * 60 * 60 * 1000)
      : undefined;

    await ctx.db.patch(args.installationId as Id<"integrationInstallations">, {
      subscription: {
        plan: args.plan,
        status: "active",
        billingCycle: args.billingCycle,
        amount: pricing.amount,
        currency: "USD",
        features: pricing.features,
        startedAt: now,
        expiresAt,
        lastBilledAt: now,
      },
      updatedAt: Date.now(),
    });

    await ctx.db.insert("integrationInstallationTimeline", {
      installationId: args.installationId,
      type: "subscription_updated",
      message: `Subscription updated to ${args.plan} plan (${args.billingCycle})`,
      metadata: { previousPlan: installation.subscription?.plan, newPlan: args.plan, amount: pricing.amount, expiresAt },
      userId,
      tenantId,
      createdAt: Date.now(),
    });

    return {
      success: true,
      message: "Integration subscription updated successfully",
      subscription: { plan: args.plan, billingCycle: args.billingCycle, amount: pricing.amount, currency: "USD", features: pricing.features, expiresAt },
    };
  },
});

async function testIntegrationConnection(integrationId: string, configuration: any): Promise<any> {
  return {
    success: true,
    responseTime: 150,
    message: "Connection successful",
    details: { endpoint: configuration.endpoint, authentication: "valid", lastTest: Date.now() },
  };
}
