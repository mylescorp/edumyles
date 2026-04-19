import { internal } from "../../_generated/api";
import { internalMutation, mutation, query } from "../../_generated/server";
import { v } from "convex/values";
import { logAction } from "../../helpers/auditLog";
import { requireRole } from "../../helpers/authorize";
import { requirePlatformRole, requirePlatformSession } from "../../helpers/platformGuard";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { CORE_MODULES, OPTIONAL_MODULES } from "../marketplace/moduleDefinitions";
import { TIER_MODULES } from "../marketplace/tierModules";

type TenantSubscriptionDoc = {
  _id: any;
  tenantId: string;
  planId: string;
  status: "trialing" | "active" | "past_due" | "suspended" | "cancelled";
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd?: boolean;
  studentCountAtBilling?: number;
  paymentProvider?: "mpesa" | "airtel" | "stripe" | "bank_transfer";
  paymentReference?: string;
  customPriceMonthlyKes?: number;
  customPriceAnnualKes?: number;
  customPricingNotes?: string;
  billingPeriod?: "monthly" | "termly" | "quarterly" | "annual";
  nextPaymentDue?: number;
  trialEndsAt?: number;
  graceEndsAt?: number;
  cancelledAt?: number;
  cancellationReason?: string;
  createdAt: number;
  updatedAt: number;
};

type OfficialPlanName = "free" | "starter" | "pro" | "enterprise";

type PlanBlueprint = {
  name: OfficialPlanName;
  priceMonthlyKes: number;
  priceAnnualKes: number;
  studentLimit?: number;
  staffLimit?: number;
  storageGb?: number;
  maxAdditionalModules?: number;
  apiAccess: "none" | "read" | "read_write";
  whiteLabel: "none" | "logo" | "full";
  customDomain: boolean;
  supportTier: string;
  slaHours?: number;
  isDefault: boolean;
  moduleSlugs: string[];
};

const OFFICIAL_PLAN_NAMES: OfficialPlanName[] = ["free", "starter", "pro", "enterprise"];
const BILLING_PERIOD_DAYS = {
  monthly: 30,
  termly: 90,
  quarterly: 90,
  annual: 365,
} as const;
const BILLING_PERIOD_MULTIPLIER = {
  monthly: 1,
  termly: 2.85,
  quarterly: 2.85,
  annual: 10,
} as const;

const TECH_SPEC_PLAN_BLUEPRINTS: PlanBlueprint[] = [
  {
    name: "free",
    priceMonthlyKes: 0,
    priceAnnualKes: 0,
    studentLimit: 100,
    staffLimit: 10,
    storageGb: 1,
    maxAdditionalModules: 0,
    apiAccess: "none",
    whiteLabel: "none",
    customDomain: false,
    supportTier: "community",
    isDefault: true,
    moduleSlugs: ["core_sis", "core_users", "core_notifications", "mod_attendance", "mod_academics"],
  },
  {
    name: "starter",
    priceMonthlyKes: 2500,
    priceAnnualKes: 25000,
    studentLimit: 500,
    staffLimit: 50,
    storageGb: 10,
    maxAdditionalModules: 4,
    apiAccess: "none",
    whiteLabel: "none",
    customDomain: false,
    supportTier: "email_48h",
    slaHours: 48,
    isDefault: false,
    moduleSlugs: [
      "core_sis",
      "core_users",
      "core_notifications",
      "mod_attendance",
      "mod_academics",
      "mod_finance",
      "mod_library",
      "mod_communications",
    ],
  },
  {
    name: "pro",
    priceMonthlyKes: 8000,
    priceAnnualKes: 80000,
    studentLimit: 2000,
    staffLimit: 200,
    storageGb: 50,
    maxAdditionalModules: 12,
    apiAccess: "read",
    whiteLabel: "logo",
    customDomain: true,
    supportTier: "priority_24h",
    slaHours: 24,
    isDefault: false,
    moduleSlugs: [
      "core_sis",
      "core_users",
      "core_notifications",
      "mod_attendance",
      "mod_academics",
      "mod_finance",
      "mod_library",
      "mod_communications",
      "mod_hr",
      "mod_transport",
      "mod_timetable",
      "mod_ewallet",
      "mod_admissions",
      "mod_reports",
    ],
  },
  {
    name: "enterprise",
    priceMonthlyKes: 0,
    priceAnnualKes: 0,
    apiAccess: "read_write",
    whiteLabel: "full",
    customDomain: true,
    supportTier: "dedicated_sla",
    slaHours: 8,
    isDefault: false,
    maxAdditionalModules: undefined,
    moduleSlugs: [],
  },
];

async function getSubscriptionPlanByName(ctx: any, name: string) {
  return await ctx.db
    .query("subscription_plans")
    .withIndex("by_name", (q: any) => q.eq("name", name))
    .first();
}

async function getTenantSubscriptionDoc(ctx: any, tenantId: string): Promise<TenantSubscriptionDoc | null> {
  return await ctx.db
    .query("tenant_subscriptions")
    .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenantId))
    .first();
}

async function getTenantDoc(ctx: any, tenantId: string) {
  return await ctx.db
    .query("tenants")
    .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenantId))
    .first();
}

async function createTenantAdminNotifications(
  ctx: any,
  tenantId: string,
  title: string,
  message: string,
  link = "/admin/settings/billing"
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
      type: "billing",
      isRead: false,
      link,
      createdAt: Date.now(),
    });
  }
}

async function getLatestUsageStats(ctx: any, tenantId: string) {
  const stats = await ctx.db
    .query("tenant_usage_stats")
    .withIndex("by_tenant_recordedAt", (q: any) => q.eq("tenantId", tenantId))
    .collect();

  return stats.sort((a: any, b: any) => b.recordedAt - a.recordedAt)[0] ?? null;
}

const STATIC_MODULE_MAP = new Map(
  [...CORE_MODULES, ...OPTIONAL_MODULES].map((module) => [
    module.moduleId,
    {
      id: module.moduleId,
      name: module.name,
      category: module.category,
    },
  ])
);

function getEffectiveIncludedModuleIds(plan: any) {
  if (Array.isArray(plan.includedModuleIds) && plan.includedModuleIds.length > 0) {
    return plan.includedModuleIds;
  }

  return TIER_MODULES[plan.name] ?? [];
}

function normalizeSubscriptionPlan(plan: any) {
  return {
    ...plan,
    id: String(plan._id),
    includedModuleIds: getEffectiveIncludedModuleIds(plan),
  };
}

function sortPlans(left: any, right: any) {
  const leftOfficialIndex = OFFICIAL_PLAN_NAMES.indexOf(left.name as OfficialPlanName);
  const rightOfficialIndex = OFFICIAL_PLAN_NAMES.indexOf(right.name as OfficialPlanName);

  if (leftOfficialIndex >= 0 && rightOfficialIndex >= 0) {
    return leftOfficialIndex - rightOfficialIndex;
  }
  if (leftOfficialIndex >= 0) return -1;
  if (rightOfficialIndex >= 0) return 1;
  return left.priceMonthlyKes - right.priceMonthlyKes;
}

export const getSubscriptionPlans = query({
  args: {},
  handler: async (ctx) => {
    const activePlans = await ctx.db
      .query("subscription_plans")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    const plans =
      activePlans.length > 0
        ? activePlans
        : await ctx.db.query("subscription_plans").collect();

    return plans
      .map(normalizeSubscriptionPlan)
      .sort((left, right) => {
        if (left.isDefault && !right.isDefault) return -1;
        if (!left.isDefault && right.isDefault) return 1;
        return left.priceMonthlyKes - right.priceMonthlyKes;
      });
  },
});

export const getPlatformPlanCatalog = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const [plans, subscriptions, modules] = await Promise.all([
      ctx.db.query("subscription_plans").collect(),
      ctx.db.query("tenant_subscriptions").collect(),
      ctx.db.query("marketplace_modules").collect(),
    ]);

    const moduleMap = new Map<string, any>(modules.map((module) => [String(module._id), module]));

    return plans
      .map((plan) => {
        const includedModuleIds = getEffectiveIncludedModuleIds(plan);

        return {
          ...normalizeSubscriptionPlan(plan),
          subscriberCount: subscriptions.filter(
            (subscription) =>
              subscription.planId === plan.name && subscription.status !== "cancelled"
          ).length,
          includedModules: includedModuleIds.map((moduleId: string) => {
            const module = moduleMap.get(moduleId);
            const staticModule = STATIC_MODULE_MAP.get(moduleId);
            return {
              id: moduleId,
              name: module?.name ?? staticModule?.name ?? moduleId,
              category: module?.category ?? staticModule?.category ?? "module",
            };
          }),
        };
      })
      .sort((left, right) => left.priceMonthlyKes - right.priceMonthlyKes);
  },
});

export const getTenantSubscription = query({
  args: {},
  handler: async (ctx) => {
    const tenant = await requireTenantContext(ctx);
    const subscription = await getTenantSubscriptionDoc(ctx, tenant.tenantId);
    if (!subscription) {
      return null;
    }

    const plan = await getSubscriptionPlanByName(ctx, subscription.planId);
    return {
      ...subscription,
      id: String(subscription._id),
      plan,
    };
  },
});

export const previewDowngradePlan = query({
  args: {
    planId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    requireRole(tenant, "school_admin");

    const currentSubscription = await getTenantSubscriptionDoc(ctx, tenant.tenantId);
    if (!currentSubscription) {
      throw new Error("Subscription record not found");
    }

    const targetPlan = await getSubscriptionPlanByName(ctx, args.planId);
    if (!targetPlan || !targetPlan.isActive) {
      throw new Error("Target subscription plan not found");
    }

    const installs = await ctx.db
      .query("module_installs")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();

    const activeInstalls = installs.filter((install) => install.status === "active");
    const targetIncludedModules = new Set(getEffectiveIncludedModuleIds(targetPlan));
    const modulesToSuspend = activeInstalls.filter(
      (install) => !targetIncludedModules.has(install.moduleId)
    );

    const modules = await ctx.db.query("modules").collect();
    const moduleMap = new Map(modules.map((module) => [String(module._id), module]));

    return {
      currentPlanId: currentSubscription.planId,
      targetPlanId: args.planId,
      modulesToSuspend: modulesToSuspend.map((install) => ({
        moduleId: install.moduleId,
        name: moduleMap.get(install.moduleId)?.name ?? install.moduleId,
        category: moduleMap.get(install.moduleId)?.category ?? "module",
      })),
      moduleCount: modulesToSuspend.length,
    };
  },
});

export const upgradePlan = mutation({
  args: {
    planId: v.string(),
    paymentProvider: v.optional(
      v.union(
        v.literal("mpesa"),
        v.literal("airtel"),
        v.literal("stripe"),
        v.literal("bank_transfer")
      )
    ),
    paymentReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    requireRole(tenant, "school_admin");

    const now = Date.now();
    const plan = await getSubscriptionPlanByName(ctx, args.planId);
    if (!plan || !plan.isActive) {
      throw new Error("Subscription plan not found");
    }

    const existing = await getTenantSubscriptionDoc(ctx, tenant.tenantId);
    if (!existing) {
      throw new Error("Subscription record not found");
    }

    const previousPlan = existing.planId;
    await ctx.db.patch(existing._id, {
      planId: args.planId,
      status: existing.status === "cancelled" ? "active" : existing.status,
      paymentProvider: args.paymentProvider ?? existing.paymentProvider,
      paymentReference: args.paymentReference ?? existing.paymentReference,
      cancelAtPeriodEnd: false,
      updatedAt: now,
    });

    await ctx.db.insert("subscription_plan_changes", {
      tenantId: tenant.tenantId,
      fromPlanId: previousPlan,
      toPlanId: args.planId,
      changeType: "upgrade",
      effectiveDate: now,
      initiatedBy: tenant.userId,
      prorationAmountKes: plan.priceMonthlyKes,
      refundAmountKes: undefined,
      modulesSuspended: [],
      modulesUnlocked: getEffectiveIncludedModuleIds(plan),
      status: "completed",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("subscription_invoices", {
      tenantId: tenant.tenantId,
      subscriptionId: String(existing._id),
      amountKes: plan.priceMonthlyKes,
      displayCurrency: "KES",
      displayAmount: plan.priceMonthlyKes,
      exchangeRate: 1,
      vatAmountKes: 0,
      totalAmountKes: plan.priceMonthlyKes,
      status: "sent",
      dueDate: now,
      paidAt: undefined,
      paymentProvider: args.paymentProvider,
      paymentReference: args.paymentReference,
      lineItems: [
        {
          description: `Plan upgrade to ${args.planId}`,
          quantity: 1,
          amountKes: plan.priceMonthlyKes,
        },
      ],
      pdfUrl: undefined,
      createdAt: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "subscription.updated",
      entityType: "tenant_subscription",
      entityId: String(existing._id),
      before: { planId: previousPlan },
      after: { planId: args.planId, changeType: "upgrade" },
    });

    await createTenantAdminNotifications(
      ctx,
      tenant.tenantId,
      "Subscription upgraded",
      `Your school subscription was upgraded from ${previousPlan} to ${args.planId}.`
    );

    return { success: true };
  },
});

export const downgradePlan = mutation({
  args: {
    planId: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; modulesToSuspend: string[] }> => {
    const tenant = await requireTenantContext(ctx);
    requireRole(tenant, "school_admin");

    const now = Date.now();
    const existing = await getTenantSubscriptionDoc(ctx, tenant.tenantId);
    if (!existing) {
      throw new Error("Subscription record not found");
    }

    const audit: { success: boolean; modulesToSuspend: string[]; targetPlanId: string } =
      await ctx.runMutation(internal.modules.platform.subscriptions.runModuleAuditForDowngrade, {
        tenantId: tenant.tenantId,
        targetPlanId: args.planId,
      });

    const previousPlan = existing.planId;
    await ctx.db.patch(existing._id, {
      planId: args.planId,
      updatedAt: now,
    });

    await ctx.db.insert("subscription_plan_changes", {
      tenantId: tenant.tenantId,
      fromPlanId: previousPlan,
      toPlanId: args.planId,
      changeType: "downgrade",
      effectiveDate: now,
      initiatedBy: tenant.userId,
      prorationAmountKes: undefined,
      refundAmountKes: undefined,
      modulesSuspended: audit.modulesToSuspend,
      modulesUnlocked: [],
      status: "completed",
      createdAt: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "subscription.updated",
      entityType: "tenant_subscription",
      entityId: String(existing._id),
      before: { planId: previousPlan },
      after: { planId: args.planId, changeType: "downgrade", modulesSuspended: audit.modulesToSuspend },
    });

    await createTenantAdminNotifications(
      ctx,
      tenant.tenantId,
      "Subscription downgraded",
      `Your school subscription was changed from ${previousPlan} to ${args.planId}.`
    );

    return { success: true, modulesToSuspend: audit.modulesToSuspend };
  },
});

export const cancelSubscription = mutation({
  args: {
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    requireRole(tenant, "school_admin");

    const subscription = await getTenantSubscriptionDoc(ctx, tenant.tenantId);
    if (!subscription) {
      throw new Error("Subscription record not found");
    }

    const now = Date.now();
    await ctx.db.patch(subscription._id, {
      status: "cancelled",
      cancelAtPeriodEnd: true,
      cancelledAt: now,
      cancellationReason: args.reason,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "subscription.cancelled",
      entityType: "tenant_subscription",
      entityId: String(subscription._id),
      after: { reason: args.reason },
    });

    await ctx.db.insert("churn_records", {
      tenantId: tenant.tenantId,
      cancellationReason: args.reason,
      cancellationDetail: undefined,
      cancelledBy: tenant.userId,
      effectiveDate: now,
      retentionOfferMade: undefined,
      retentionOfferAccepted: undefined,
      dataExportRequested: undefined,
      dataPurgeDate: undefined,
      crmDealId: undefined,
      createdAt: now,
      updatedAt: now,
    });

    await createTenantAdminNotifications(
      ctx,
      tenant.tenantId,
      "Subscription cancellation requested",
      `Your subscription is set to cancel at the end of the current billing period. Reason: ${args.reason}`
    );

    return { success: true };
  },
});

export const convertTrialToPaid = mutation({
  args: {
    planId: v.string(),
    sessionToken: v.optional(v.string()),
    tenantId: v.optional(v.string()),
    billingPeriod: v.union(
      v.literal("monthly"),
      v.literal("termly"),
      v.literal("quarterly"),
      v.literal("annual")
    ),
    paymentProvider: v.union(
      v.literal("mpesa"),
      v.literal("airtel"),
      v.literal("stripe"),
      v.literal("bank_transfer")
    ),
    paymentReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant =
      args.sessionToken
        ? await requireTenantSession(ctx, {
            sessionToken: args.sessionToken,
            tenantId: args.tenantId,
          })
        : await requireTenantContext(ctx);
    requireRole(tenant, "school_admin", "principal", "master_admin", "super_admin");

    const [subscription, plan] = await Promise.all([
      getTenantSubscriptionDoc(ctx, tenant.tenantId),
      getSubscriptionPlanByName(ctx, args.planId),
    ]);

    if (!subscription) {
      throw new Error("Subscription record not found");
    }

    if (!plan || !plan.isActive) {
      throw new Error("Selected subscription plan not found");
    }

    const now = Date.now();
    const amountKes = calculatePlanChargeKes(plan, args.billingPeriod);
    const invoiceId = await ctx.db.insert("subscription_invoices", {
      tenantId: tenant.tenantId,
      subscriptionId: String(subscription._id),
      amountKes,
      displayCurrency: "KES",
      displayAmount: amountKes,
      exchangeRate: 1,
      vatAmountKes: 0,
      totalAmountKes: amountKes,
      status: "sent",
      billingPeriod: args.billingPeriod,
      dueDate: now,
      paidAt: undefined,
      paymentProvider: args.paymentProvider,
      paymentReference: args.paymentReference,
      lineItems: [
        {
          description: `Convert trial to ${args.planId} (${args.billingPeriod})`,
          quantity: 1,
          amountKes,
        },
      ],
      pdfUrl: undefined,
      createdAt: now,
      updatedAt: now,
    });

    const result = await applySubscriptionPaymentSuccess(ctx, {
      tenantId: tenant.tenantId,
      planId: args.planId,
      invoiceId,
      paidAt: now,
      paymentProvider: args.paymentProvider,
      paymentReference: args.paymentReference,
      billingPeriod: args.billingPeriod,
      actorId: tenant.userId,
      actorEmail: tenant.email,
    });

    return {
      success: true,
      status: "active",
      invoiceId: String(invoiceId),
      amountKes,
      billingPeriod: args.billingPeriod,
      nextPaymentDue: result.nextPaymentDue,
    };
  },
});

export const onSubscriptionPaymentSuccess = internalMutation({
  args: {
    tenantId: v.string(),
    planId: v.string(),
    invoiceId: v.id("subscription_invoices"),
    paidAt: v.number(),
    billingPeriod: v.union(
      v.literal("monthly"),
      v.literal("termly"),
      v.literal("quarterly"),
      v.literal("annual")
    ),
    paymentProvider: v.optional(
      v.union(
        v.literal("mpesa"),
        v.literal("airtel"),
        v.literal("stripe"),
        v.literal("bank_transfer")
      )
    ),
    paymentReference: v.optional(v.string()),
    actorId: v.string(),
    actorEmail: v.string(),
  },
  handler: async (ctx, args) => {
    return await applySubscriptionPaymentSuccess(ctx, args);
  },
});

export const extendTrial = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    days: v.number(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "support_agent",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    const subscription = await getTenantSubscriptionDoc(ctx, args.tenantId);
    if (!subscription) {
      throw new Error("Subscription record not found");
    }

    const base = subscription.trialEndsAt ?? subscription.currentPeriodEnd;
    const nextTrialEnd = base + args.days * 24 * 60 * 60 * 1000;
    await ctx.db.patch(subscription._id, {
      status: "trialing",
      trialEndsAt: nextTrialEnd,
      currentPeriodEnd: nextTrialEnd,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "subscription.updated",
      entityType: "tenant_subscription",
      entityId: String(subscription._id),
      after: { tenantId: args.tenantId, trialEndsAt: nextTrialEnd },
    });

    await createTenantAdminNotifications(
      ctx,
      args.tenantId,
      "Trial extended",
      `Your EduMyles trial has been extended by ${args.days} day(s).`
    );

    return { success: true, trialEndsAt: nextTrialEnd };
  },
});

export const pauseSubscription = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "billing_admin",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    const subscription = await getTenantSubscriptionDoc(ctx, args.tenantId);
    if (!subscription) {
      throw new Error("Subscription record not found");
    }

    await ctx.db.patch(subscription._id, {
      status: "suspended",
      customPricingNotes: args.notes ?? subscription.customPricingNotes,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "billing.subscription_updated",
      entityType: "tenant_subscription",
      entityId: String(subscription._id),
      after: { tenantId: args.tenantId, status: "suspended" },
    });

    await createTenantAdminNotifications(
      ctx,
      args.tenantId,
      "Subscription paused",
      "Your EduMyles subscription has been paused by the platform team."
    );

    return { success: true };
  },
});

export const setCustomPricing = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    monthlyPriceKes: v.optional(v.number()),
    annualPriceKes: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, ["master_admin"]);

    const subscription = await getTenantSubscriptionDoc(ctx, args.tenantId);
    if (!subscription) {
      throw new Error("Subscription record not found");
    }

    await ctx.db.patch(subscription._id, {
      customPriceMonthlyKes: args.monthlyPriceKes,
      customPriceAnnualKes: args.annualPriceKes,
      customPricingNotes: args.notes,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("subscription_plan_changes", {
      tenantId: args.tenantId,
      fromPlanId: subscription.planId,
      toPlanId: subscription.planId,
      changeType: "custom_negotiation",
      effectiveDate: Date.now(),
      initiatedBy: platform.userId,
      prorationAmountKes: args.monthlyPriceKes,
      refundAmountKes: undefined,
      modulesSuspended: [],
      modulesUnlocked: [],
      status: "completed",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const updateSubscriptionPlan = mutation({
  args: {
    sessionToken: v.string(),
    planName: v.string(),
    priceMonthlyKes: v.number(),
    priceAnnualKes: v.number(),
    studentLimit: v.optional(v.number()),
    staffLimit: v.optional(v.number()),
    storageGb: v.optional(v.number()),
    includedModuleIds: v.array(v.string()),
    maxAdditionalModules: v.optional(v.number()),
    apiAccess: v.union(v.literal("none"), v.literal("read"), v.literal("read_write")),
    whiteLabel: v.union(v.literal("none"), v.literal("logo"), v.literal("full")),
    customDomain: v.boolean(),
    supportTier: v.string(),
    slaHours: v.optional(v.number()),
    isActive: v.boolean(),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, ["billing_admin", "master_admin"]);
    if (!isOfficialPlanName(args.planName)) {
      throw new Error("Only Free, Starter, Pro, and Enterprise plans are supported.");
    }
    const plan = await getSubscriptionPlanByName(ctx, args.planName);
    if (!plan) {
      throw new Error("Subscription plan not found");
    }

    const now = Date.now();
    const nextIncludedModuleIds =
      args.includedModuleIds.length > 0
        ? args.includedModuleIds
        : (TIER_MODULES[args.planName] ?? []);

    if (args.isDefault) {
      const defaultPlans = await ctx.db
        .query("subscription_plans")
        .withIndex("by_isDefault", (q: any) => q.eq("isDefault", true))
        .collect();

      for (const defaultPlan of defaultPlans) {
        if (defaultPlan._id !== plan._id) {
          await ctx.db.patch(defaultPlan._id, {
            isDefault: false,
            updatedAt: now,
          });
        }
      }
    }

    await ctx.db.patch(plan._id, {
      priceMonthlyKes: args.priceMonthlyKes,
      priceAnnualKes: args.priceAnnualKes,
      studentLimit: args.studentLimit,
      staffLimit: args.staffLimit,
      storageGb: args.storageGb,
      includedModuleIds: nextIncludedModuleIds,
      maxAdditionalModules: args.maxAdditionalModules,
      apiAccess: args.apiAccess,
      whiteLabel: args.whiteLabel,
      customDomain: args.customDomain,
      supportTier: args.supportTier,
      slaHours: args.slaHours,
      isActive: args.isActive,
      isDefault: args.isDefault,
      updatedAt: now,
    });

    await syncModulePlanInclusions(ctx, {
      planName: args.planName,
      includedModuleIds: nextIncludedModuleIds,
      updatedBy: platform.userId,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "billing.subscription_updated",
      entityType: "subscription_plan",
      entityId: String(plan._id),
      before: {
        priceMonthlyKes: plan.priceMonthlyKes,
        priceAnnualKes: plan.priceAnnualKes,
        studentLimit: plan.studentLimit,
        staffLimit: plan.staffLimit,
        storageGb: plan.storageGb,
        includedModuleIds: getEffectiveIncludedModuleIds(plan),
        maxAdditionalModules: plan.maxAdditionalModules,
        apiAccess: plan.apiAccess,
        whiteLabel: plan.whiteLabel,
        customDomain: plan.customDomain,
        supportTier: plan.supportTier,
        slaHours: plan.slaHours,
        isActive: plan.isActive,
        isDefault: plan.isDefault,
      },
      after: {
        priceMonthlyKes: args.priceMonthlyKes,
        priceAnnualKes: args.priceAnnualKes,
        studentLimit: args.studentLimit,
        staffLimit: args.staffLimit,
        storageGb: args.storageGb,
        includedModuleIds: nextIncludedModuleIds,
        maxAdditionalModules: args.maxAdditionalModules,
        apiAccess: args.apiAccess,
        whiteLabel: args.whiteLabel,
        customDomain: args.customDomain,
        supportTier: args.supportTier,
        slaHours: args.slaHours,
        isActive: args.isActive,
        isDefault: args.isDefault,
      },
    });

    return { success: true };
  },
});

export const createSubscriptionPlan = mutation({
  args: {
    sessionToken: v.string(),
    planName: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("pro"),
      v.literal("enterprise")
    ),
    priceMonthlyKes: v.number(),
    priceAnnualKes: v.number(),
    studentLimit: v.optional(v.number()),
    staffLimit: v.optional(v.number()),
    storageGb: v.optional(v.number()),
    includedModuleIds: v.array(v.string()),
    maxAdditionalModules: v.optional(v.number()),
    apiAccess: v.union(v.literal("none"), v.literal("read"), v.literal("read_write")),
    whiteLabel: v.union(v.literal("none"), v.literal("logo"), v.literal("full")),
    customDomain: v.boolean(),
    supportTier: v.string(),
    slaHours: v.optional(v.number()),
    isActive: v.boolean(),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, ["master_admin"]);
    const existing = await getSubscriptionPlanByName(ctx, args.planName);
    if (existing) {
      throw new Error("A subscription plan with this name already exists");
    }

    const now = Date.now();
    const nextIncludedModuleIds =
      args.includedModuleIds.length > 0
        ? args.includedModuleIds
        : (TIER_MODULES[args.planName] ?? []);

    if (args.isDefault) {
      const defaultPlans = await ctx.db
        .query("subscription_plans")
        .withIndex("by_isDefault", (q: any) => q.eq("isDefault", true))
        .collect();

      for (const defaultPlan of defaultPlans) {
        await ctx.db.patch(defaultPlan._id, {
          isDefault: false,
          updatedAt: now,
        });
      }
    }

    const planId = await ctx.db.insert("subscription_plans", {
      name: args.planName,
      priceMonthlyKes: args.priceMonthlyKes,
      priceAnnualKes: args.priceAnnualKes,
      studentLimit: args.studentLimit,
      staffLimit: args.staffLimit,
      storageGb: args.storageGb,
      includedModuleIds: nextIncludedModuleIds,
      maxAdditionalModules: args.maxAdditionalModules,
      apiAccess: args.apiAccess,
      whiteLabel: args.whiteLabel,
      customDomain: args.customDomain,
      supportTier: args.supportTier,
      slaHours: args.slaHours,
      isActive: args.isActive,
      isDefault: args.isDefault,
      createdAt: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "billing.subscription_updated",
      entityType: "subscription_plan",
      entityId: String(planId),
      after: {
        name: args.planName,
        priceMonthlyKes: args.priceMonthlyKes,
        priceAnnualKes: args.priceAnnualKes,
        studentLimit: args.studentLimit,
        staffLimit: args.staffLimit,
        storageGb: args.storageGb,
        includedModuleIds: nextIncludedModuleIds,
        maxAdditionalModules: args.maxAdditionalModules,
        apiAccess: args.apiAccess,
        whiteLabel: args.whiteLabel,
        customDomain: args.customDomain,
        supportTier: args.supportTier,
        slaHours: args.slaHours,
        isActive: args.isActive,
        isDefault: args.isDefault,
      },
    });

    return { success: true, planId: String(planId) };
  },
});

export const getAllSubscriptions = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.string()),
    planId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    let subscriptions = await ctx.db.query("tenant_subscriptions").collect();
    if (args.status) {
      subscriptions = subscriptions.filter((subscription) => subscription.status === args.status);
    }
    if (args.planId) {
      subscriptions = subscriptions.filter((subscription) => subscription.planId === args.planId);
    }

    return Promise.all(
      subscriptions.map(async (subscription) => {
        const tenant = await getTenantDoc(ctx, subscription.tenantId);
        return {
          ...subscription,
          tenantName: tenant?.name ?? subscription.tenantId,
        };
      })
    );
  },
});

export const getBillingDashboardOverview = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const [subscriptions, plans, invoices, churnRecords] = await Promise.all([
      ctx.db.query("tenant_subscriptions").collect(),
      ctx.db.query("subscription_plans").collect(),
      ctx.db.query("subscription_invoices").collect(),
      ctx.db.query("churn_records").collect(),
    ]);

    const planMap = new Map<string, (typeof plans)[number]>(plans.map((plan) => [plan.name, plan]));
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

    const activeLikeSubscriptions = subscriptions.filter(
      (subscription) => subscription.status === "active" || subscription.status === "trialing"
    );

    const mrrKes = activeLikeSubscriptions.reduce((sum, subscription) => {
      if (subscription.customPriceMonthlyKes !== undefined) {
        return sum + subscription.customPriceMonthlyKes;
      }
      const plan = planMap.get(subscription.planId);
      return sum + (plan?.priceMonthlyKes ?? 0);
    }, 0);

    const invoicesLast30Days = invoices.filter((invoice) => invoice.createdAt >= thirtyDaysAgo);
    const paidLast30Days = invoicesLast30Days.filter((invoice) => invoice.status === "paid");
    const paidPrevious30Days = invoices.filter(
      (invoice) =>
        invoice.status === "paid" &&
        invoice.createdAt >= sixtyDaysAgo &&
        invoice.createdAt < thirtyDaysAgo
    );
    const overdueInvoices = invoices.filter(
      (invoice) => invoice.status === "sent" && invoice.dueDate < now
    );

    const atRiskSubscriptions = subscriptions.filter(
      (subscription) =>
        subscription.status === "past_due" ||
        subscription.status === "suspended" ||
        (subscription.status === "trialing" &&
          subscription.trialEndsAt !== undefined &&
          subscription.trialEndsAt - now <= 7 * 24 * 60 * 60 * 1000) ||
        (subscription.nextPaymentDue !== undefined &&
          subscription.nextPaymentDue < now &&
          subscription.status !== "cancelled")
    );

    const revenueByPlan = plans
      .map((plan) => {
        const planSubscriptions = subscriptions.filter((subscription) => subscription.planId === plan.name);
        const tenantCount = planSubscriptions.length;
        const monthlyKes = planSubscriptions.reduce((sum, subscription) => {
          return sum + (subscription.customPriceMonthlyKes ?? plan.priceMonthlyKes);
        }, 0);
        return {
          planId: plan.name,
          planLabel: plan.name,
          tenantCount,
          monthlyKes,
        };
      })
      .filter((row) => row.tenantCount > 0)
      .sort((left, right) => right.monthlyKes - left.monthlyKes);

    const recentActivity = (
      await Promise.all(
        invoices
          .sort((left, right) => right.updatedAt - left.updatedAt)
          .slice(0, 8)
          .map(async (invoice) => {
            const tenant = await getTenantDoc(ctx, invoice.tenantId);
            return {
              id: String(invoice._id),
              tenantId: invoice.tenantId,
              tenantName: tenant?.name ?? invoice.tenantId,
              status: invoice.status,
              totalAmountKes: invoice.totalAmountKes,
              dueDate: invoice.dueDate,
              updatedAt: invoice.updatedAt,
            };
          })
      )
    ).sort((left, right) => right.updatedAt - left.updatedAt);

    const atRiskTenants = await Promise.all(
      atRiskSubscriptions.slice(0, 8).map(async (subscription) => {
        const tenant = await getTenantDoc(ctx, subscription.tenantId);
        return {
          tenantId: subscription.tenantId,
          tenantName: tenant?.name ?? subscription.tenantId,
          status: subscription.status,
          planId: subscription.planId,
          trialEndsAt: subscription.trialEndsAt,
          nextPaymentDue: subscription.nextPaymentDue,
        };
      })
    );

    const currentRevenue = paidLast30Days.reduce((sum, invoice) => sum + invoice.totalAmountKes, 0);
    const previousRevenue = paidPrevious30Days.reduce((sum, invoice) => sum + invoice.totalAmountKes, 0);
    const revenueGrowthPct =
      previousRevenue > 0
        ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 1000) / 10
        : currentRevenue > 0
          ? 100
          : 0;

    const churnLast30Days = churnRecords.filter((record) => record.createdAt >= thirtyDaysAgo).length;
    const churnRatePct =
      subscriptions.length > 0 ? Math.round((churnLast30Days / subscriptions.length) * 1000) / 10 : 0;

    return {
      summary: {
        mrrKes,
        arrKes: mrrKes * 12,
        activeSubscriptions: subscriptions.filter((subscription) => subscription.status === "active").length,
        trialingSubscriptions: subscriptions.filter((subscription) => subscription.status === "trialing").length,
        overdueInvoiceCount: overdueInvoices.length,
        overdueAmountKes: overdueInvoices.reduce((sum, invoice) => sum + invoice.totalAmountKes, 0),
        atRiskCount: atRiskSubscriptions.length,
        churnLast30Days,
        churnRatePct,
        revenueLast30DaysKes: currentRevenue,
        revenueGrowthPct,
      },
      revenueByPlan,
      recentActivity,
      atRiskTenants,
    };
  },
});

export const getSubscriptionInvoices = query({
  args: {
    sessionToken: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("sent"), v.literal("paid"), v.literal("void"), v.literal("refunded"))),
  },
  handler: async (ctx, args) => {
    if (args.sessionToken) {
      await requirePlatformSession(ctx, { sessionToken: args.sessionToken });
      let invoices = await ctx.db.query("subscription_invoices").collect();
      if (args.status) invoices = invoices.filter((invoice) => invoice.status === args.status);
      return invoices.sort((a, b) => b.createdAt - a.createdAt);
    }

    const tenant = await requireTenantContext(ctx);
    let invoices = await ctx.db
      .query("subscription_invoices")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();
    if (args.status) invoices = invoices.filter((invoice) => invoice.status === args.status);
    return invoices.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getPlatformInvoices = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("sent"),
        v.literal("paid"),
        v.literal("void"),
        v.literal("refunded")
      )
    ),
    tenantId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    let invoices = await ctx.db.query("subscription_invoices").collect();
    if (args.status) {
      invoices = invoices.filter((invoice) => invoice.status === args.status);
    }
    if (args.tenantId) {
      invoices = invoices.filter((invoice) => invoice.tenantId === args.tenantId);
    }

    const tenants = await ctx.db.query("tenants").collect();
    const subscriptions = await ctx.db.query("tenant_subscriptions").collect();
    const plans = await ctx.db.query("subscription_plans").collect();

    const tenantMap = new Map(tenants.map((tenant) => [tenant.tenantId, tenant]));
    const subscriptionMap = new Map(subscriptions.map((subscription) => [String(subscription._id), subscription]));
    const planMap = new Map<string, (typeof plans)[number]>(plans.map((plan) => [plan.name, plan]));
    const now = Date.now();

    return invoices
      .map((invoice) => {
        const tenant = tenantMap.get(invoice.tenantId);
        const subscription = subscriptionMap.get(invoice.subscriptionId);
        const plan = subscription ? planMap.get(subscription.planId) : undefined;
        const effectiveStatus =
          invoice.status === "sent" && invoice.dueDate < now ? "overdue" : invoice.status;

        return {
          _id: invoice._id,
          id: String(invoice._id),
          invoiceNumber: `INV-${String(invoice._id).slice(-6).toUpperCase()}`,
          tenantId: invoice.tenantId,
          tenantName: tenant?.name ?? invoice.tenantId,
          subscriptionId: invoice.subscriptionId,
          planId: subscription?.planId ?? "unknown",
          planLabel: plan?.name ?? subscription?.planId ?? "Unknown",
          amountKes: invoice.amountKes,
          vatAmountKes: invoice.vatAmountKes,
          totalAmountKes: invoice.totalAmountKes,
          displayCurrency: invoice.displayCurrency,
          displayAmount: invoice.displayAmount,
          exchangeRate: invoice.exchangeRate,
          status: effectiveStatus,
          rawStatus: invoice.status,
          dueDate: invoice.dueDate,
          createdAt: invoice.createdAt,
          updatedAt: invoice.updatedAt,
          paidAt: invoice.paidAt,
          paymentProvider: invoice.paymentProvider,
          paymentReference: invoice.paymentReference,
          lineItems: invoice.lineItems,
        };
      })
      .sort((left, right) => right.createdAt - left.createdAt);
  },
});

export const recordSubscriptionInvoice = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    amountKes: v.number(),
    displayCurrency: v.string(),
    displayAmount: v.number(),
    exchangeRate: v.number(),
    vatAmountKes: v.number(),
    totalAmountKes: v.number(),
    dueDate: v.number(),
    paymentProvider: v.optional(v.string()),
    paymentReference: v.optional(v.string()),
    lineItems: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        amountKes: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    const subscription = await getTenantSubscriptionDoc(ctx, args.tenantId);
    if (!subscription) {
      throw new Error("Subscription record not found");
    }

    const invoiceId = await ctx.db.insert("subscription_invoices", {
      tenantId: args.tenantId,
      subscriptionId: String(subscription._id),
      amountKes: args.amountKes,
      displayCurrency: args.displayCurrency,
      displayAmount: args.displayAmount,
      exchangeRate: args.exchangeRate,
      vatAmountKes: args.vatAmountKes,
      totalAmountKes: args.totalAmountKes,
      status: "sent",
      dueDate: args.dueDate,
      paidAt: undefined,
      paymentProvider: args.paymentProvider,
      paymentReference: args.paymentReference,
      lineItems: args.lineItems,
      pdfUrl: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "billing.invoice.created",
      entityType: "subscription_invoice",
      entityId: String(invoiceId),
      after: { tenantId: args.tenantId, totalAmountKes: args.totalAmountKes },
    });

    return { success: true, invoiceId };
  },
});

export const updateSubscriptionInvoiceStatus = mutation({
  args: {
    sessionToken: v.string(),
    invoiceId: v.id("subscription_invoices"),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("void"),
      v.literal("refunded")
    ),
    paymentProvider: v.optional(v.string()),
    paymentReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "billing_admin",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const nextPaidAt = args.status === "paid" ? Date.now() : args.status === "refunded" ? undefined : invoice.paidAt;

    await ctx.db.patch(invoice._id, {
      status: args.status,
      paidAt: nextPaidAt,
      paymentProvider: args.paymentProvider ?? invoice.paymentProvider,
      paymentReference: args.paymentReference ?? invoice.paymentReference,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "billing.invoice.status_updated",
      entityType: "subscription_invoice",
      entityId: String(invoice._id),
      before: {
        status: invoice.status,
        paymentProvider: invoice.paymentProvider,
        paymentReference: invoice.paymentReference,
        paidAt: invoice.paidAt,
      },
      after: {
        status: args.status,
        paymentProvider: args.paymentProvider ?? invoice.paymentProvider,
        paymentReference: args.paymentReference ?? invoice.paymentReference,
        paidAt: nextPaidAt,
      },
    });

    return { success: true };
  },
});

export const getBillingReportsOverview = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const [invoices, subscriptions, tenants] = await Promise.all([
      ctx.db.query("subscription_invoices").collect(),
      ctx.db.query("tenant_subscriptions").collect(),
      ctx.db.query("tenants").collect(),
    ]);

    const tenantMap = new Map(tenants.map((tenant) => [tenant.tenantId, tenant.name]));
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();
    const monthly = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(Date.UTC(currentYear, currentMonth - (5 - index), 1));
      const monthStart = date.getTime();
      const monthEnd = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)).getTime();
      const monthInvoices = invoices.filter(
        (invoice) => invoice.createdAt >= monthStart && invoice.createdAt < monthEnd
      );
      const paidKes = monthInvoices
        .filter((invoice) => invoice.status === "paid")
        .reduce((sum, invoice) => sum + invoice.totalAmountKes, 0);
      const sentKes = monthInvoices
        .filter((invoice) => invoice.status === "sent")
        .reduce((sum, invoice) => sum + invoice.totalAmountKes, 0);
      const vatKes = monthInvoices.reduce((sum, invoice) => sum + invoice.vatAmountKes, 0);

      return {
        monthLabel: date.toLocaleString("en-KE", { month: "short", year: "numeric", timeZone: "UTC" }),
        paidKes,
        sentKes,
        vatKes,
        invoiceCount: monthInvoices.length,
      };
    });

    const paidInvoices = invoices.filter((invoice) => invoice.status === "paid");
    const outstandingInvoices = invoices.filter((invoice) => invoice.status === "sent");
    const overdueInvoices = outstandingInvoices.filter((invoice) => invoice.dueDate < Date.now());

    const topTenants = invoices
      .reduce((map, invoice) => {
        const existing = map.get(invoice.tenantId) ?? {
          tenantId: invoice.tenantId,
          tenantName: tenantMap.get(invoice.tenantId) ?? invoice.tenantId,
          billedKes: 0,
          paidKes: 0,
          invoiceCount: 0,
        };
        existing.billedKes += invoice.totalAmountKes;
        if (invoice.status === "paid") {
          existing.paidKes += invoice.totalAmountKes;
        }
        existing.invoiceCount += 1;
        map.set(invoice.tenantId, existing);
        return map;
      }, new Map<string, { tenantId: string; tenantName: string; billedKes: number; paidKes: number; invoiceCount: number }>())
      .values();

    return {
      summary: {
        totalBilledKes: invoices.reduce((sum, invoice) => sum + invoice.totalAmountKes, 0),
        totalCollectedKes: paidInvoices.reduce((sum, invoice) => sum + invoice.totalAmountKes, 0),
        totalOutstandingKes: outstandingInvoices.reduce((sum, invoice) => sum + invoice.totalAmountKes, 0),
        totalVatKes: invoices.reduce((sum, invoice) => sum + invoice.vatAmountKes, 0),
        overdueCount: overdueInvoices.length,
        overdueKes: overdueInvoices.reduce((sum, invoice) => sum + invoice.totalAmountKes, 0),
        activeSubscriptions: subscriptions.filter((subscription) => subscription.status === "active").length,
      },
      monthly,
      topTenants: Array.from(topTenants)
        .sort((left, right) => right.paidKes - left.paidKes)
        .slice(0, 8),
      recentInvoices: invoices
        .slice()
        .sort((left, right) => right.createdAt - left.createdAt)
        .slice(0, 8)
        .map((invoice) => ({
          id: String(invoice._id),
          tenantId: invoice.tenantId,
          tenantName: tenantMap.get(invoice.tenantId) ?? invoice.tenantId,
          totalAmountKes: invoice.totalAmountKes,
          vatAmountKes: invoice.vatAmountKes,
          status: invoice.status,
          dueDate: invoice.dueDate,
          createdAt: invoice.createdAt,
        })),
    };
  },
});

export const getTenantUsageStats = query({
  args: {
    sessionToken: v.optional(v.string()),
    tenantId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenantId = args.sessionToken
      ? args.tenantId ?? (await requirePlatformSession(ctx, { sessionToken: args.sessionToken })).tenantId
      : (await requireTenantContext(ctx)).tenantId;

    const stats = await ctx.db
      .query("tenant_usage_stats")
      .withIndex("by_tenant_recordedAt", (q: any) => q.eq("tenantId", tenantId))
      .collect();

    return stats.sort((a: any, b: any) => b.recordedAt - a.recordedAt);
  },
});

export const recordTenantUsageStats = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    studentCount: v.number(),
    staffCount: v.number(),
    storageUsedGb: v.number(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const now = Date.now();
    const statId = await ctx.db.insert("tenant_usage_stats", {
      tenantId: args.tenantId,
      studentCount: args.studentCount,
      staffCount: args.staffCount,
      storageUsedGb: args.storageUsedGb,
      recordedAt: now,
      createdAt: now,
    });

    return { success: true, statId };
  },
});

export const getSubscriptionsAtRisk = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const subscriptions = await ctx.db.query("tenant_subscriptions").collect();
    const now = Date.now();

    const atRisk = subscriptions.filter(
      (subscription) =>
        subscription.status === "past_due" ||
        (subscription.status === "trialing" &&
          subscription.trialEndsAt !== undefined &&
          subscription.trialEndsAt - now <= 3 * 24 * 60 * 60 * 1000) ||
        (subscription.nextPaymentDue !== undefined &&
          subscription.nextPaymentDue < now &&
          subscription.status !== "cancelled")
    );

    return Promise.all(
      atRisk.map(async (subscription) => {
        const tenant = await getTenantDoc(ctx, subscription.tenantId);
        return {
          ...subscription,
          tenantName: tenant?.name ?? subscription.tenantId,
        };
      })
    );
  },
});

export const runModuleAuditForDowngrade = internalMutation({
  args: {
    tenantId: v.string(),
    targetPlanId: v.string(),
  },
  handler: async (ctx, args) => {
    const plan = await getSubscriptionPlanByName(ctx, args.targetPlanId);
    if (!plan) {
      throw new Error("Target plan not found");
    }

    const installs = await ctx.db
      .query("module_installs")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    const activeModuleIds = installs
      .filter((install) => install.status === "active")
      .map((install) => String(install.moduleId));

    const included = new Set(getEffectiveIncludedModuleIds(plan));
    const modulesToSuspend = activeModuleIds.filter((moduleId) => !included.has(moduleId));

    return {
      success: true,
      modulesToSuspend,
      targetPlanId: args.targetPlanId,
    };
  },
});
