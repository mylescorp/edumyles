import { ConvexError, v } from "convex/values";
import { internal } from "../../_generated/api";
import { internalAction, internalMutation, internalQuery } from "../../_generated/server";
import { calculateModulePrice } from "./pricing";

async function getTenantPlan(ctx: any, tenantId: string) {
  const [organization, tenant] = await Promise.all([
    ctx.db.query("organizations").withIndex("by_tenant", (q: any) => q.eq("tenantId", tenantId)).first(),
    ctx.db.query("tenants").withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenantId)).first(),
  ]);
  return organization?.tier ?? tenant?.plan ?? "free";
}

async function getActiveStudentCountValue(ctx: any, tenantId: string) {
  const students = await ctx.db
    .query("students")
    .withIndex("by_tenant_status", (q: any) => q.eq("tenantId", tenantId).eq("status", "active"))
    .collect();
  return students.length;
}

async function getEffectivePricingValue(ctx: any, moduleId: any, tenantId: string) {
  const override = await ctx.db
    .query("module_price_overrides")
    .withIndex("by_moduleId_tenantId", (q: any) =>
      q.eq("moduleId", moduleId).eq("tenantId", tenantId)
    )
    .unique();

  const basePricing = await ctx.db
    .query("module_pricing")
    .withIndex("by_moduleId", (q: any) => q.eq("moduleId", moduleId))
    .unique();

  if (!basePricing) {
    throw new ConvexError({ code: "MODULE_PRICING_MISSING", message: "Pricing record not found" });
  }

  if (override && override.isActive && (!override.expiresAt || override.expiresAt > Date.now())) {
    return {
      ...basePricing,
      baseRateKes: override.overridePriceKes,
      band1Rate: override.overridePriceKes,
      band2Rate: override.overridePriceKes,
      band3Rate: override.overridePriceKes,
      band4Rate: override.overridePriceKes,
      band5Rate: override.overridePriceKes,
    };
  }

  const plan = await getTenantPlan(ctx, tenantId);
  const planOverride = basePricing.planOverrides.find((entry: any) => entry.plan === plan);
  if (!planOverride) {
    return basePricing;
  }

  return {
    ...basePricing,
    baseRateKes: planOverride.baseRateKes,
    band1Rate: planOverride.baseRateKes,
  };
}

async function getActivePilotGrantValue(ctx: any, moduleId: any, tenantId: string) {
  const grants = await ctx.db
    .query("pilot_grants")
    .withIndex("by_moduleId_tenantId", (q: any) =>
      q.eq("moduleId", moduleId).eq("tenantId", tenantId)
    )
    .collect();

  return (
    grants.find(
      (grant: any) =>
        (grant.status === "active" || grant.status === "extended") &&
        grant.startDate <= Date.now() &&
        (!grant.endDate || grant.endDate >= Date.now())
    ) ?? null
  );
}

async function isIncludedInPlanValue(ctx: any, moduleId: any, tenantId: string) {
  const plan = await getTenantPlan(ctx, tenantId);
  const inclusion = await ctx.db
    .query("module_plan_inclusions")
    .withIndex("by_moduleId_plan", (q: any) => q.eq("moduleId", moduleId).eq("plan", plan))
    .unique();
  return Boolean(inclusion?.isIncluded);
}

async function createModuleBillingInvoice(ctx: any, install: any, amountKes: number, studentCount: number) {
  return await ctx.db.insert("subscription_invoices", {
    tenantId: install.tenantId,
    subscriptionId: String(install._id),
    amountKes,
    displayCurrency: "KES",
    displayAmount: amountKes,
    exchangeRate: 1,
    vatAmountKes: Math.round(amountKes * 0.16 * 100) / 100,
    totalAmountKes: Math.round(amountKes * 1.16 * 100) / 100,
    status: "sent",
    dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
    paymentProvider: "marketplace_module",
    metadata: {
      moduleSlug: install.moduleSlug,
      studentCount,
      installId: String(install._id),
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

export const runMonthlyModuleBilling = internalMutation({
  args: {},
  handler: async (ctx) => {
    const installs = await ctx.db
      .query("module_installs")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    let billedCount = 0;

    for (const install of installs) {
      if (!install.moduleSlug || install.moduleSlug.startsWith("core_")) {
        continue;
      }
      if (install.nextBillingDate && install.nextBillingDate > Date.now()) {
        continue;
      }

      const moduleId = install.moduleId;
      const studentCount = await getActiveStudentCountValue(ctx, install.tenantId);
      const includedInPlan = await isIncludedInPlanValue(ctx, moduleId, install.tenantId);
      const pilotGrant = await getActivePilotGrantValue(ctx, moduleId, install.tenantId);

      if (includedInPlan) {
        continue;
      }
      if (
        pilotGrant &&
        ["free_trial", "free_permanent", "plan_upgrade", "beta_access"].includes(
          pilotGrant.grantType
        )
      ) {
        continue;
      }

      const pricing = await getEffectivePricingValue(ctx, moduleId, install.tenantId);
      let breakdown = calculateModulePrice(
        pricing,
        studentCount,
        (install.billingPeriod as any) ?? "monthly"
      );

      if (pilotGrant?.grantType === "discounted" && pilotGrant.discountPct) {
        const discountMultiplier = Math.max(0, 1 - pilotGrant.discountPct / 100);
        breakdown = {
          ...breakdown,
          grossPeriodKes: breakdown.grossPeriodKes * discountMultiplier,
          discountKes: breakdown.discountKes + breakdown.grossPeriodKes * (1 - discountMultiplier),
          totalKes: breakdown.totalKes * discountMultiplier,
          effectiveMonthlyKes: breakdown.effectiveMonthlyKes * discountMultiplier,
          vatKes: breakdown.vatKes * discountMultiplier,
        };
      }

      const invoiceId = await createModuleBillingInvoice(ctx, install, breakdown.totalKes, studentCount);
      await ctx.scheduler.runAfter(0, (internal as any).modules.marketplace.billing.processModulePayment, {
        installId: install._id,
        invoiceId,
      });
      await ctx.db.patch(install._id, {
        nextBillingDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now(),
      });
      billedCount += 1;
    }

    return { billedCount };
  },
});

export const processModulePayment = internalAction({
  args: {
    installId: v.id("module_installs"),
    invoiceId: v.id("subscription_invoices"),
  },
  handler: async (ctx, args) => {
    const invoice: any = await ctx.runQuery((internal as any).modules.marketplace.billing.getSubscriptionInvoice, {
      invoiceId: args.invoiceId,
    });
    const install: any = await ctx.runQuery((internal as any).modules.marketplace.billing.getInstallRecord, {
      installId: args.installId,
    });

    if (!invoice || !install) {
      return { success: false, reason: "missing_records" };
    }

    if (invoice.totalAmountKes <= 0) {
      await ctx.runMutation((internal as any).modules.marketplace.billing.reinstateModuleAfterPayment, {
        installId: args.installId,
      });
      return { success: true, skipped: true };
    }

    // Foundation pass: mark as payment pending failure path until gateway integration is added.
    await ctx.runMutation((internal as any).modules.marketplace.billing.handleModulePaymentFailure, {
      installId: args.installId,
      invoiceId: args.invoiceId,
    });

    return { success: true, attempted: true };
  },
});

export const getSubscriptionInvoice = internalQuery({
  args: { invoiceId: v.id("subscription_invoices") },
  handler: async (ctx, args) => await ctx.db.get(args.invoiceId),
});

export const getInstallRecord = internalQuery({
  args: { installId: v.id("module_installs") },
  handler: async (ctx, args) => await ctx.db.get(args.installId),
});

export const handleModulePaymentFailure = internalMutation({
  args: {
    installId: v.id("module_installs"),
    invoiceId: v.id("subscription_invoices"),
  },
  handler: async (ctx, args) => {
    const install = await ctx.db.get(args.installId);
    if (!install) return { success: false };

    await ctx.db.patch(args.installId, {
      status: "payment_failed",
      paymentFailureCount: (install.paymentFailureCount ?? 0) + 1,
      lastPaymentFailureAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(7 * 24 * 60 * 60 * 1000, (internal as any).modules.marketplace.billing.suspendModuleForPayment, {
      installId: args.installId,
    });

    return { success: true };
  },
});

export const suspendModuleForPayment = internalMutation({
  args: { installId: v.id("module_installs") },
  handler: async (ctx, args) => {
    const install = await ctx.db.get(args.installId);
    if (!install) return { success: false };

    await ctx.db.patch(args.installId, {
      status: "suspended_payment",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const reinstateModuleAfterPayment = internalMutation({
  args: { installId: v.id("module_installs") },
  handler: async (ctx, args) => {
    const install = await ctx.db.get(args.installId);
    if (!install) return { success: false };

    await ctx.db.patch(args.installId, {
      status: "active",
      paymentFailureCount: 0,
      lastPaymentFailureAt: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const checkPaymentGracePeriods = internalMutation({
  args: {},
  handler: async (ctx) => {
    const installs = await ctx.db
      .query("module_installs")
      .withIndex("by_status", (q) => q.eq("status", "suspended_payment"))
      .collect();

    let autoUninstalled = 0;
    for (const install of installs) {
      if (!install.lastPaymentFailureAt) continue;
      if (install.lastPaymentFailureAt + 30 * 24 * 60 * 60 * 1000 > Date.now()) continue;

      await ctx.db.patch(install._id, {
        status: "uninstalled",
        dataRetentionEndsAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now(),
      });
      autoUninstalled += 1;
    }

    return { autoUninstalled };
  },
});

export const checkLibraryOverdues = internalMutation({
  args: {},
  handler: async (ctx) => {
    const borrows = await ctx.db.query("bookBorrows").collect().catch(() => []);

    const overdue = borrows.filter((borrow: any) => borrow.dueDate < Date.now());
    return { overdueCount: overdue.length };
  },
});
