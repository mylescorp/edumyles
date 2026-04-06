import { mutation, query, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePlatformSession } from "../../helpers/platformGuard";

const onboardingStepNames = [
  "schoolProfile",
  "rolesConfigured",
  "staffAdded",
  "studentsAdded",
  "classesCreated",
  "modulesConfigured",
  "portalCustomized",
  "parentsInvited",
  "firstPaymentProcessed",
] as const;

type OnboardingStepName = (typeof onboardingStepNames)[number];

function buildDefaultSteps() {
  return {
    schoolProfile: { completed: false, completedAt: undefined, count: undefined },
    rolesConfigured: { completed: false, completedAt: undefined, count: undefined },
    staffAdded: { completed: false, completedAt: undefined, count: undefined },
    studentsAdded: { completed: false, completedAt: undefined, count: undefined },
    classesCreated: { completed: false, completedAt: undefined, count: undefined },
    modulesConfigured: { completed: false, completedAt: undefined, count: undefined },
    portalCustomized: { completed: false, completedAt: undefined, count: undefined },
    parentsInvited: { completed: false, completedAt: undefined, count: undefined },
    firstPaymentProcessed: { completed: false, completedAt: undefined, count: undefined },
  };
}

function calculateHealthScore(steps: Record<OnboardingStepName, { completed: boolean }>) {
  const completedCount = onboardingStepNames.filter((step) => steps[step].completed).length;
  return Math.round((completedCount / onboardingStepNames.length) * 50);
}

async function createOnboardingNotification(
  ctx: any,
  tenantId: string,
  userId: string,
  title: string,
  message: string
) {
  await ctx.db.insert("notifications", {
    tenantId,
    userId,
    title,
    message,
    type: "onboarding",
    isRead: false,
    link: "/admin",
    createdAt: Date.now(),
  });
}

export const getTenantOnboarding = query({
  args: {},
  handler: async (ctx) => {
    const tenant = await requireTenantContext(ctx);
    return await ctx.db
      .query("tenant_onboarding")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .first();
  },
});

export const updateOnboardingStep = mutation({
  args: {
    step: v.union(
      v.literal("schoolProfile"),
      v.literal("rolesConfigured"),
      v.literal("staffAdded"),
      v.literal("studentsAdded"),
      v.literal("classesCreated"),
      v.literal("modulesConfigured"),
      v.literal("portalCustomized"),
      v.literal("parentsInvited"),
      v.literal("firstPaymentProcessed")
    ),
    completed: v.boolean(),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    const now = Date.now();
    const existing = await ctx.db
      .query("tenant_onboarding")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .first();

    const steps = existing?.steps ?? buildDefaultSteps();
    steps[args.step] = {
      completed: args.completed,
      completedAt: args.completed ? now : undefined,
      count: args.count,
    };

    const wizardCompleted = onboardingStepNames.every((step) => steps[step].completed);
    const healthScore = calculateHealthScore(steps as Record<OnboardingStepName, { completed: boolean }>);

    if (existing) {
      await ctx.db.patch(existing._id, {
        steps,
        wizardCompleted,
        wizardCompletedAt: wizardCompleted ? now : undefined,
        healthScore,
        lastActivityAt: now,
        stalled: false,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("tenant_onboarding", {
        tenantId: tenant.tenantId,
        wizardCompleted,
        wizardCompletedAt: wizardCompleted ? now : undefined,
        steps,
        healthScore,
        lastActivityAt: now,
        stalled: false,
        assignedAccountManager: undefined,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (args.completed) {
      await createOnboardingNotification(
        ctx,
        tenant.tenantId,
        tenant.userId,
        "Onboarding step completed",
        `You completed the ${args.step} onboarding step.`
      );
    }

    if (wizardCompleted) {
      await createOnboardingNotification(
        ctx,
        tenant.tenantId,
        tenant.userId,
        "Onboarding complete",
        "Your school onboarding checklist is complete."
      );
    }

    return { success: true, healthScore, wizardCompleted };
  },
});

export const computeHealthScore = internalMutation({
  args: {
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    const onboarding = await ctx.db
      .query("tenant_onboarding")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (!onboarding) {
      return { success: false, healthScore: 0 };
    }

    const healthScore = calculateHealthScore(
      onboarding.steps as Record<OnboardingStepName, { completed: boolean }>
    );

    await ctx.db.patch(onboarding._id, {
      healthScore,
      stalled: onboarding.lastActivityAt < Date.now() - 7 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now(),
    });

    return { success: true, healthScore };
  },
});

export const getStalledOnboardings = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const records = await ctx.db
      .query("tenant_onboarding")
      .withIndex("by_stalled", (q) => q.eq("stalled", true))
      .collect();

    return Promise.all(
      records.map(async (record) => {
        const tenant = await ctx.db
          .query("tenants")
          .withIndex("by_tenantId", (q) => q.eq("tenantId", record.tenantId))
          .first();
        return {
          ...record,
          tenantName: tenant?.name ?? record.tenantId,
        };
      })
    );
  },
});

export const getTrialDashboard = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const subscriptions = await ctx.db
      .query("tenant_subscriptions")
      .withIndex("by_status", (q) => q.eq("status", "trialing"))
      .collect();

    const onboardingRecords = await ctx.db.query("tenant_onboarding").collect();
    const onboardingByTenant = new Map(
      onboardingRecords.map((record) => [record.tenantId, record])
    );

    return Promise.all(
      subscriptions.map(async (subscription) => {
        const tenant = await ctx.db
          .query("tenants")
          .withIndex("by_tenantId", (q) => q.eq("tenantId", subscription.tenantId))
          .first();
        const onboarding = onboardingByTenant.get(subscription.tenantId);

        return {
          tenantId: subscription.tenantId,
          tenantName: tenant?.name ?? subscription.tenantId,
          trialEndsAt: subscription.trialEndsAt,
          currentPeriodEnd: subscription.currentPeriodEnd,
          healthScore: onboarding?.healthScore ?? 0,
          stalled: onboarding?.stalled ?? false,
          wizardCompleted: onboarding?.wizardCompleted ?? false,
        };
      })
    );
  },
});

export const getPlatformOnboardingRecords = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const records = await ctx.db.query("tenant_onboarding").collect();

    return Promise.all(
      records.map(async (record) => {
        const tenant = await ctx.db
          .query("tenants")
          .withIndex("by_tenantId", (q) => q.eq("tenantId", record.tenantId))
          .first();
        const subscription = await ctx.db
          .query("tenant_subscriptions")
          .withIndex("by_tenantId", (q) => q.eq("tenantId", record.tenantId))
          .first();

        const completedCount = onboardingStepNames.filter((step) => record.steps?.[step]?.completed).length;

        return {
          ...record,
          tenantName: tenant?.name ?? record.tenantId,
          tenantStatus: tenant?.status ?? "unknown",
          planId: subscription?.planId,
          trialEndsAt: subscription?.trialEndsAt,
          status: record.wizardCompleted ? "completed" : record.stalled ? "stalled" : "in_progress",
          completedCount,
          totalSteps: onboardingStepNames.length,
          progressPct: Math.round((completedCount / onboardingStepNames.length) * 100),
        };
      })
    );
  },
});

export const getPlatformOnboardingRecord = query({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const record = await ctx.db
      .query("tenant_onboarding")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (!record) {
      return null;
    }

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();
    const subscription = await ctx.db
      .query("tenant_subscriptions")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();

    const completedCount = onboardingStepNames.filter((step) => record.steps?.[step]?.completed).length;

    return {
      ...record,
      tenantName: tenant?.name ?? record.tenantId,
      tenantStatus: tenant?.status ?? "unknown",
      planId: subscription?.planId,
      trialEndsAt: subscription?.trialEndsAt,
      status: record.wizardCompleted ? "completed" : record.stalled ? "stalled" : "in_progress",
      completedCount,
      totalSteps: onboardingStepNames.length,
      progressPct: Math.round((completedCount / onboardingStepNames.length) * 100),
    };
  },
});

export const recordTrialIntervention = internalMutation({
  args: {
    tenantId: v.string(),
    interventionType: v.union(
      v.literal("email"),
      v.literal("in_app"),
      v.literal("sms"),
      v.literal("call_scheduled")
    ),
    trigger: v.union(
      v.literal("day_1"),
      v.literal("day_3"),
      v.literal("day_7"),
      v.literal("day_10"),
      v.literal("day_12"),
      v.literal("day_13"),
      v.literal("day_14")
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("trial_interventions")
      .withIndex("by_tenant_trigger", (q) =>
        q.eq("tenantId", args.tenantId).eq("trigger", args.trigger)
      )
      .first();

    if (existing) {
      return { success: true, duplicate: true };
    }

    const interventionId = await ctx.db.insert("trial_interventions", {
      tenantId: args.tenantId,
      interventionType: args.interventionType,
      trigger: args.trigger,
      sentAt: Date.now(),
      opened: undefined,
      clicked: undefined,
      createdAt: Date.now(),
    });

    return { success: true, interventionId };
  },
});
