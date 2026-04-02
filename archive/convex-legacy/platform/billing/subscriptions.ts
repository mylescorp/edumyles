import { v } from "convex/values";
import { mutation, internalMutation } from "../../_generated/server";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

// Import billing engine from shared lib
const { BillingEngine } = require("../../../shared/src/lib/billing");

/**
 * Create new subscription for tenant
 */
export const createSubscription = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    planId: v.string(),
    billingCycle: v.union(v.literal("monthly"), v.literal("yearly")),
    trialDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args.sessionToken);
    
    // Get the plan
    const plan = BillingEngine.getPlanById(args.planId);
    if (!plan) {
      throw new Error("Invalid plan selected");
    }

    // Check if tenant already has active subscription
    const existingSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) => 
        q.eq("status", "active").or().eq("status", "trial")
      )
      .first();

    if (existingSubscription) {
      throw new Error("Tenant already has an active subscription");
    }

    const now = Date.now();
    const trialEndsAt = args.trialDays 
      ? new Date(now.getTime() + (args.trialDays * 24 * 60 * 60 * 1000))
      : undefined;

    const subscriptionId = await ctx.db.insert("subscriptions", {
      tenantId: args.tenantId,
      planId: args.planId,
      status: trialEndsAt ? "trial" : "active",
      billingCycle: args.billingCycle,
      currentPeriodStart: now,
      currentPeriodEnd: BillingEngine.calculateNextBillingDate(
        new Date(now),
        args.billingCycle
      ),
      nextBillingDate: trialEndsAt || BillingEngine.calculateNextBillingDate(
        new Date(now),
        args.billingCycle
      ),
      trialEndsAt,
      createdAt: now,
    });

    // Generate and save first invoice
    const invoice = BillingEngine.generateSubscriptionInvoice(
      {
        id: subscriptionId,
        tenantId: args.tenantId,
        planId: args.planId,
        status: trialEndsAt ? "trial" : "active",
        billingCycle: args.billingCycle,
        currentPeriodStart: new Date(now),
        currentPeriodEnd: BillingEngine.calculateNextBillingDate(
          new Date(now),
          args.billingCycle
        ),
        nextBillingDate: trialEndsAt || BillingEngine.calculateNextBillingDate(
          new Date(now),
          args.billingCycle
        ),
        trialEndsAt,
      },
      plan
    );

    await ctx.db.insert("billingInvoices", {
      ...invoice,
      createdAt: now,
    });

    await logAction(ctx, {
      tenantId: "platform",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "subscription.created",
      entityType: "subscription",
      entityId: subscriptionId,
      after: {
        planId: args.planId,
        billingCycle: args.billingCycle,
        trialDays: args.trialDays,
      },
    });

    return {
      success: true,
      subscriptionId,
      nextBillingDate: invoice.dueDate,
      trialEndsAt,
    };
  },
});

/**
 * Update subscription plan
 */
export const updateSubscription = mutation({
  args: {
    sessionToken: v.string(),
    subscriptionId: v.id("subscriptions"),
    newPlanId: v.string(),
    effectiveImmediately: v.boolean(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args.sessionToken);
    
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Validate change
    const validation = BillingEngine.validateSubscriptionChange(
      subscription,
      args.newPlanId
    );

    if (!validation.canChange) {
      throw new Error(validation.reason || "Cannot change subscription");
    }

    const newPlan = BillingEngine.getPlanById(args.newPlanId);
    if (!newPlan) {
      throw new Error("Invalid new plan");
    }

    const now = Date.now();
    const effectiveDate = args.effectiveImmediately 
      ? new Date(now)
      : subscription.currentPeriodEnd;

    // Calculate prorated amount if mid-cycle change
    let proratedAmount = 0;
    if (args.effectiveImmediately) {
      const daysInPeriod = Math.ceil(
        (subscription.currentPeriodEnd.getTime() - subscription.currentPeriodStart.getTime()) 
        / (1000 * 60 * 60 * 24)
      );
      const daysRemaining = Math.ceil(
        (subscription.currentPeriodEnd.getTime() - effectiveDate.getTime()) 
        / (1000 * 60 * 60 * 24)
      );
      
      proratedAmount = BillingEngine.calculateProratedAmount(
        newPlan,
        subscription.billingCycle,
        daysInPeriod,
        daysRemaining
      );
    }

    // Update subscription
    await ctx.db.patch(args.subscriptionId, {
      planId: args.newPlanId,
      status: "active",
      currentPeriodStart: effectiveDate,
      currentPeriodEnd: BillingEngine.calculateNextBillingDate(effectiveDate, subscription.billingCycle),
      nextBillingDate: BillingEngine.calculateNextBillingDate(effectiveDate, subscription.billingCycle),
      updatedAt: now,
    });

    // Generate prorated invoice if needed
    if (proratedAmount > 0) {
      const proratedInvoice = {
        id: `INV-${Date.now()}-PRORATED`,
        tenantId: subscription.tenantId,
        subscriptionId: subscription.id,
        status: "pending",
        items: [
          {
            description: `Prorated upgrade to ${newPlan.name}`,
            quantity: 1,
            unitPrice: proratedAmount,
            amount: proratedAmount,
          },
        ],
        subtotal: proratedAmount,
        tax: proratedAmount * 0.16,
        total: proratedAmount * 1.16,
        currency: newPlan.currency,
        dueDate: new Date(now),
        createdAt: new Date(now),
      };

      await ctx.db.insert("billingInvoices", proratedInvoice);
    }

    await logAction(ctx, {
      tenantId: "platform",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "subscription.updated",
      entityType: "subscription",
      entityId: subscription.id,
      after: {
        oldPlanId: subscription.planId,
        newPlanId: args.newPlanId,
        effectiveDate,
        proratedAmount,
      },
    });

    return {
      success: true,
      effectiveDate,
      nextBillingDate: BillingEngine.calculateNextBillingDate(effectiveDate, subscription.billingCycle),
      proratedAmount,
    };
  },
});

/**
 * Cancel subscription
 */
export const cancelSubscription = mutation({
  args: {
    sessionToken: v.string(),
    subscriptionId: v.id("subscriptions"),
    reason: v.string(),
    effectiveImmediately: v.boolean(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args.sessionToken);
    
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const now = Date.now();
    const effectiveDate = args.effectiveImmediately 
      ? new Date(now)
      : subscription.currentPeriodEnd;

    await ctx.db.patch(args.subscriptionId, {
      status: "cancelled",
      cancelledAt: effectiveDate,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: "platform",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "subscription.cancelled",
      entityType: "subscription",
      entityId: subscription.id,
      after: {
        reason: args.reason,
        effectiveDate,
        effectiveImmediately: args.effectiveImmediately,
      },
    });

    return {
      success: true,
      effectiveDate,
      serviceEndsAt: subscription.currentPeriodEnd,
    };
  },
});

/**
 * Process recurring billing for all active subscriptions
 */
export const processRecurringBilling = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get all active subscriptions due for billing
    const dueSubscriptions = await ctx.db
      .query("subscriptions")
      .filter((q) => 
        q.eq("status", "active").or().eq("status", "trial")
      )
      .filter((q) => 
        q.lte("nextBillingDate", new Date(now))
      )
      .collect();

    const processedInvoices = [];

    for (const subscription of dueSubscriptions) {
      const plan = BillingEngine.getPlanById(subscription.planId);
      if (!plan) continue;

      // Get current usage for overage calculation
      const usage = await ctx.db
        .query("tenantUsage")
        .withIndex("by_tenant_period", (q) => 
          q.eq("tenantId", subscription.tenantId).eq("period", "current")
        )
        .first();

      let overageCharges = 0;
      if (usage) {
        const overage = BillingEngine.calculateOverageCharges(
          {
            activeUsers: usage.activeUsers,
            totalStudents: usage.totalStudents,
            storageUsed: usage.storageUsed,
            apiCalls: usage.apiCalls,
            bandwidthUsed: usage.bandwidthUsed,
            period: "current",
          },
          plan
        );
        overageCharges = overage.totalOverage;
      }

      // Generate new invoice
      const invoice = BillingEngine.generateSubscriptionInvoice(
        subscription,
        plan,
        overageCharges
      );

      const invoiceId = await ctx.db.insert("billingInvoices", {
        ...invoice,
        createdAt: now,
      });

      // Update subscription for next period
      const nextBillingDate = BillingEngine.calculateNextBillingDate(
        subscription.currentPeriodEnd,
        subscription.billingCycle
      );

      await ctx.db.patch(subscription.id, {
        currentPeriodStart: subscription.currentPeriodEnd,
        currentPeriodEnd: nextBillingDate,
        nextBillingDate,
        updatedAt: now,
      });

      processedInvoices.push({
        subscriptionId: subscription.id,
        invoiceId,
        overageCharges,
      });
    }

    return {
      processed: processedInvoices.length,
      invoices: processedInvoices.map(inv => inv.invoiceId),
      processedAt: now,
    };
  },
});
