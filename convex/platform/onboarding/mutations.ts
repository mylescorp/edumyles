import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

/**
 * Initialize onboarding for a new tenant.
 */
export const startOnboarding = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    // Check if onboarding already exists
    const existing = await ctx.db
      .query("onboardingProgress")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (existing) {
      throw new Error("Onboarding already exists for this tenant");
    }

    const id = await ctx.db.insert("onboardingProgress", {
      tenantId: args.tenantId,
      currentStep: 0,
      completedSteps: [],
      status: "in_progress",
      startedAt: Date.now(),
      data: {},
    });

    return { success: true, id, message: "Onboarding started" };
  },
});

/**
 * Mark a step as done and advance to the next step.
 */
export const completeStep = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    step: v.number(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const progress = await ctx.db
      .query("onboardingProgress")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (!progress) throw new Error("Onboarding not found for this tenant");

    const completedSteps = progress.completedSteps.includes(args.step)
      ? progress.completedSteps
      : [...progress.completedSteps, args.step];

    const totalSteps = 6; // School Info, Admin Setup, Module Selection, Branding, Data Import, Review
    const nextStep = args.step + 1;
    const isComplete = completedSteps.length >= totalSteps;

    await ctx.db.patch(progress._id, {
      completedSteps,
      currentStep: isComplete ? args.step : nextStep,
      status: isComplete ? "completed" : "in_progress",
      completedAt: isComplete ? Date.now() : undefined,
    });

    return {
      success: true,
      isComplete,
      nextStep: isComplete ? null : nextStep,
    };
  },
});

/**
 * Persist form data for a specific step.
 */
export const saveStepData = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    step: v.number(),
    stepData: v.record(v.string(), v.any()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const progress = await ctx.db
      .query("onboardingProgress")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (!progress) throw new Error("Onboarding not found for this tenant");

    const updatedData = {
      ...progress.data,
      [`step_${args.step}`]: args.stepData,
    };

    await ctx.db.patch(progress._id, { data: updatedData });

    return { success: true, message: "Step data saved" };
  },
});

/**
 * Skip an optional step.
 */
export const skipStep = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    step: v.number(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const progress = await ctx.db
      .query("onboardingProgress")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (!progress) throw new Error("Onboarding not found for this tenant");

    const nextStep = args.step + 1;
    const updatedData = {
      ...progress.data,
      [`step_${args.step}`]: { skipped: true },
    };

    await ctx.db.patch(progress._id, {
      currentStep: nextStep,
      data: updatedData,
    });

    return { success: true, nextStep };
  },
});

/**
 * Reset onboarding and restart from the beginning.
 */
export const resetOnboarding = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const progress = await ctx.db
      .query("onboardingProgress")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (!progress) throw new Error("Onboarding not found for this tenant");

    await ctx.db.patch(progress._id, {
      currentStep: 0,
      completedSteps: [],
      status: "in_progress",
      completedAt: undefined,
      data: {},
    });

    return { success: true, message: "Onboarding reset" };
  },
});
