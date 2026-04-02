"use node";

import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";

// Payment processing mutations
export const initiatePayment = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.string(),
    paymentMethod: v.union(v.literal("mpesa"), v.literal("card"), v.literal("bank_transfer")),
    billingCycle: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annual")),
    couponCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }

    // Get module details
    const module = await ctx.db
      .query("moduleRegistry")
      .filter((q) => q.eq(q.field("moduleId"), args.moduleId))
      .first();

    if (!module) {
      throw new Error("Module not found");
    }

    // Get tenant details
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", session.tenantId))
      .first();

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Calculate pricing
    const pricing = calculatePricing(module.pricing, args.billingCycle);
    
    // Apply coupon discount if provided
    let discount = 0;
    if (args.couponCode) {
      discount = await applyCoupon(ctx, args.couponCode, pricing.total);
    }

    const finalAmount = pricing.total - discount;

    // Generate reference before insert (paymentReference is required)
    let paymentReference: string;
    switch (args.paymentMethod) {
      case "mpesa":
        paymentReference = generateMpesaReference();
        break;
      case "card":
        paymentReference = `CARD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        break;
      case "bank_transfer":
      default:
        paymentReference = `BANK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        break;
    }

    // Create payment transaction
    const transactionId = await ctx.db.insert("paymentTransactions", {
      tenantId: session.tenantId,
      moduleId: args.moduleId,
      paymentMethod: args.paymentMethod,
      billingCycle: args.billingCycle,
      amount: finalAmount,
      currency: "KES",
      status: "pending",
      couponCode: args.couponCode,
      discountAmount: discount,
      originalAmount: pricing.total,
      initiatedAt: Date.now(),
      expiresAt: Date.now() + (15 * 60 * 1000),
      initiatedBy: session.userId,
      paymentReference,
    });

    // Generate payment URL based on method
    let paymentUrl: string | undefined;

    switch (args.paymentMethod) {
      case "mpesa":
        paymentUrl = await initiateMpesaPayment(ctx, {
          transactionId,
          amount: finalAmount,
          phoneNumber: tenant.phone,
          reference: paymentReference,
        });
        break;
      case "card":
        paymentUrl = await initiateCardPayment(ctx, {
          transactionId,
          amount: finalAmount,
          reference: paymentReference,
        });
        break;
      case "bank_transfer":
        paymentUrl = await initiateBankTransfer(ctx, {
          transactionId,
          amount: finalAmount,
          reference: paymentReference,
        });
        break;
    }

    // Update transaction with payment URL
    await ctx.db.patch(transactionId, {
      paymentUrl,
    });

    return {
      transactionId,
      paymentUrl,
      paymentReference,
      amount: finalAmount,
      expiresAt: Date.now() + (15 * 60 * 1000),
    };
  },
});

// Process payment callback/webhook
export const processPaymentCallback = mutation({
  args: {
    paymentMethod: v.union(v.literal("mpesa"), v.literal("card"), v.literal("bank_transfer")),
    transactionReference: v.string(),
    status: v.union(v.literal("success"), v.literal("failed"), v.literal("cancelled")),
    amount: v.number(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Find transaction by reference
    const transaction = await ctx.db
      .query("paymentTransactions")
      .filter((q) => q.eq(q.field("paymentReference"), args.transactionReference))
      .first();

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Update transaction status
    await ctx.db.patch(transaction._id, {
      status: args.status === "success" ? "completed" : args.status,
      processedAt: Date.now(),
      metadata: args.metadata,
    });

    // If payment successful, activate module
    if (args.status === "success") {
      await activateModule(ctx, {
        tenantId: transaction.tenantId,
        moduleId: transaction.moduleId,
        transactionId: transaction._id,
        billingCycle: transaction.billingCycle,
      });
    }

    return {
      transactionId: transaction._id,
      status: args.status,
      moduleActivated: args.status === "success",
    };
  },
});

// Module installation
async function activateModule(ctx: any, args: any) {
  const { tenantId, moduleId, transactionId, billingCycle } = args;

  // Get module details
  const module = await ctx.db
    .query("moduleRegistry")
    .filter((q: any) => q.eq(q.field("moduleId"), moduleId))
    .first();

  if (!module) {
    throw new Error("Module not found");
  }

  // Calculate subscription period
  const subscriptionPeriod = getSubscriptionPeriod(billingCycle);
  const expiresAt = Date.now() + subscriptionPeriod;

  // Create module subscription
  const subscriptionId = await ctx.db.insert("moduleSubscriptions", {
    tenantId,
    moduleId,
    transactionId,
    billingCycle,
    status: "active",
    activatedAt: Date.now(),
    expiresAt,
    autoRenew: true,
    features: module.features,
  });

  // Log installation
  await ctx.db.insert("auditLogs", {
    tenantId,
    actorId: "system",
    actorEmail: "payment@edumyles.com",
    action: "module_installed",
    entityId: subscriptionId as string,
    entityType: "module_subscription",
    after: {
      moduleId,
      billingCycle,
      expiresAt,
    },
    timestamp: Date.now(),
  });

  return subscriptionId;
}

// Get payment status
export const getPaymentStatus = query({
  args: {
    sessionToken: v.string(),
    transactionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }

    // Get transaction
    const transaction = await ctx.db
      .query("paymentTransactions")
      .filter((q) => q.eq(q.field("_id"), args.transactionId))
      .first();

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    return transaction;
  },
});

// Get tenant's active subscriptions
export const getTenantSubscriptions = query({
  args: {
    sessionToken: v.string(),
    includeExpired: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }

    // Get subscriptions
    let subscriptions = await ctx.db
      .query("moduleSubscriptions")
      .filter((q) => q.eq(q.field("tenantId"), session.tenantId))
      .collect();

    // Filter expired subscriptions if not requested
    if (!args.includeExpired) {
      subscriptions = subscriptions.filter(sub => 
        sub.status === "active" && sub.expiresAt > Date.now()
      );
    }

    // Enrich with module details
    const enrichedSubscriptions = await Promise.all(
      subscriptions.map(async (subscription) => {
        const module = await ctx.db
          .query("moduleRegistry")
          .filter((q) => q.eq(q.field("moduleId"), subscription.moduleId))
          .first();

        return {
          ...subscription,
          module,
          daysUntilExpiry: Math.ceil((subscription.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)),
          isExpiringSoon: (subscription.expiresAt - Date.now()) < (7 * 24 * 60 * 60 * 1000), // 7 days
        };
      })
    );

    return enrichedSubscriptions;
  },
});

// Cancel subscription
export const cancelSubscription = mutation({
  args: {
    sessionToken: v.string(),
    subscriptionId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }

    // Get subscription
    const subscription = await ctx.db
      .query("moduleSubscriptions")
      .filter((q) => q.eq(q.field("_id"), args.subscriptionId))
      .first();

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    if (subscription.tenantId !== session.tenantId) {
      throw new Error("Unauthorized");
    }

    // Update subscription status
    await ctx.db.patch(args.subscriptionId as Id<"moduleSubscriptions">, {
      status: "cancelled",
      cancelledAt: Date.now(),
      cancelReason: args.reason,
      autoRenew: false,
    });

    // Log cancellation
    await ctx.db.insert("auditLogs", {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email ?? "",
      action: "subscription_cancelled",
      entityId: args.subscriptionId,
      entityType: "module_subscription",
      before: { status: "active" },
      after: { status: "cancelled", reason: args.reason },
      timestamp: Date.now(),
    });

    return {
      subscriptionId: args.subscriptionId,
      status: "cancelled",
      cancelledAt: Date.now(),
    };
  },
});

// Helper functions
function calculatePricing(basePricing: any, billingCycle: string) {
  const multiplier = billingCycle === "monthly" ? 1 : 
                      billingCycle === "quarterly" ? 3 : 
                      billingCycle === "annual" ? 12 : 1;

  const discount = billingCycle === "quarterly" ? 0.1 : 
                   billingCycle === "annual" ? 0.2 : 0;

  const monthlyPrice = basePricing.monthly || 0;
  const total = (monthlyPrice * multiplier) * (1 - discount);

  return {
    monthlyPrice,
    billingCycle,
    multiplier,
    discount,
    total,
  };
}

async function applyCoupon(ctx: any, couponCode: string, totalAmount: number): Promise<number> {
  // Mock coupon validation - in production, this would check a coupons table
  const coupons = {
    "WELCOME10": { discount: 0.1, maxDiscount: 5000 },
    "EDU2024": { discount: 0.15, maxDiscount: 10000 },
    "SPECIAL20": { discount: 0.2, maxDiscount: 15000 },
  };

  const coupon = coupons[couponCode as keyof typeof coupons];
  if (!coupon) {
    return 0;
  }

  const discount = totalAmount * coupon.discount;
  return Math.min(discount, coupon.maxDiscount);
}

function generateMpesaReference(): string {
  return `EDU${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
}

async function initiateMpesaPayment(ctx: any, paymentData: any): Promise<string> {
  // Mock M-Pesa integration - in production, this would call M-Pesa API
  const { transactionId, amount, phoneNumber, reference } = paymentData;
  
  // Simulate M-Pesa API call
  const mpesaUrl = `https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest`;
  
  // In production, this would make actual API call to M-Pesa
  console.log("Initiating M-Pesa payment:", {
    transactionId,
    amount,
    phoneNumber,
    reference,
    mpesaUrl,
  });

  return `https://edumyles.com/pay/mpesa/${reference}`;
}

async function initiateCardPayment(ctx: any, paymentData: any): Promise<string> {
  // Mock card payment integration - in production, this would call payment gateway
  const { transactionId, amount, reference } = paymentData;
  
  // Simulate payment gateway API call
  console.log("Initiating card payment:", {
    transactionId,
    amount,
    reference,
  });

  return `https://edumyles.com/pay/card/${reference}`;
}

async function initiateBankTransfer(ctx: any, paymentData: any): Promise<string> {
  // Mock bank transfer integration
  const { transactionId, amount, reference } = paymentData;
  
  console.log("Initiating bank transfer:", {
    transactionId,
    amount,
    reference,
  });

  return `https://edumyles.com/pay/bank/${reference}`;
}

function getSubscriptionPeriod(billingCycle: string): number {
  const msInDay = 24 * 60 * 60 * 1000;
  const msInMonth = 30 * msInDay;
  
  switch (billingCycle) {
    case "monthly": return msInMonth;
    case "quarterly": return 3 * msInMonth;
    case "annual": return 12 * msInMonth;
    default: return msInMonth;
  }
}
