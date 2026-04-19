import { ConvexError, v } from "convex/values";
import { query, internalQuery, QueryCtx } from "../../_generated/server";
import { requireTenantSession } from "../../helpers/tenantGuard";

type BillingPeriod = "monthly" | "termly" | "quarterly" | "annual";

const STUDENT_BANDS = [100, 400, 500, 1000, Number.POSITIVE_INFINITY];
const BILLING_PERIOD_MONTHS: Record<BillingPeriod, number> = {
  monthly: 1,
  termly: 3,
  quarterly: 3,
  annual: 12,
};
const ZERO_PRICING = {
  baseRateKes: 0,
  band1Rate: 0,
  band2Rate: 0,
  band3Rate: 0,
  band4Rate: 0,
  band5Rate: 0,
  monthlyMultiplier: 1,
  termlyMultiplier: 1,
  quarterlyMultiplier: 1,
  annualMultiplier: 1,
  vatRatePct: 0,
  planOverrides: [],
};

async function resolveTenantPlan(ctx: QueryCtx, tenantId: string) {
  const [organization, tenant] = await Promise.all([
    ctx.db
      .query("organizations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .first(),
    ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
      .first(),
  ]);

  return organization?.tier ?? tenant?.plan ?? "free";
}

async function getModuleAndPricing(ctx: QueryCtx, moduleSlug: string) {
  const moduleRecord = await ctx.db
    .query("marketplace_modules")
    .withIndex("by_slug", (q) => q.eq("slug", moduleSlug))
    .unique();

  if (!moduleRecord) {
    throw new ConvexError({
      code: "MODULE_NOT_FOUND",
      message: `Marketplace module '${moduleSlug}' was not found`,
    });
  }

  const pricing = await ctx.db
    .query("module_pricing")
    .withIndex("by_moduleId", (q) => q.eq("moduleId", moduleRecord._id))
    .unique();

  if (moduleRecord.isCore) {
    return { moduleRecord, pricing: pricing ?? ZERO_PRICING };
  }

  if (!pricing) {
    throw new ConvexError({
      code: "MODULE_PRICING_MISSING",
      message: `Pricing has not been configured for module '${moduleSlug}'`,
    });
  }

  return { moduleRecord, pricing };
}

async function getActiveStudentCountValue(ctx: QueryCtx, tenantId: string) {
  const students = await ctx.db
    .query("students")
    .withIndex("by_tenant_status", (q) => q.eq("tenantId", tenantId).eq("status", "active"))
    .collect();

  return students.length;
}

async function getEffectivePricingValue(ctx: QueryCtx, moduleId: any, tenantId: string) {
  const moduleRecord = (await ctx.db.get(moduleId)) as any;
  if (moduleRecord?.isCore) {
    return ZERO_PRICING;
  }

  const override = await ctx.db
    .query("module_price_overrides")
    .withIndex("by_moduleId_tenantId", (q) =>
      q.eq("moduleId", moduleId).eq("tenantId", tenantId)
    )
    .unique();

  const basePricing = await ctx.db
    .query("module_pricing")
    .withIndex("by_moduleId", (q) => q.eq("moduleId", moduleId))
    .unique();

  if (!basePricing) {
    throw new ConvexError({
      code: "MODULE_PRICING_MISSING",
      message: "Pricing record not found",
    });
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
      overrideId: override._id,
    };
  }

  const tenantPlan = await resolveTenantPlan(ctx, tenantId);
  const planOverride = basePricing.planOverrides.find((entry) => entry.plan === tenantPlan);
  if (!planOverride) {
    return basePricing;
  }

  return {
    ...basePricing,
    baseRateKes: planOverride.baseRateKes,
    band1Rate: planOverride.baseRateKes,
  };
}

export function calculateModulePrice(
  pricing: {
    band1Rate: number;
    band2Rate: number;
    band3Rate: number;
    band4Rate: number;
    band5Rate: number;
    monthlyMultiplier: number;
    termlyMultiplier: number;
    quarterlyMultiplier: number;
    annualMultiplier: number;
    vatRatePct: number;
  },
  studentCount: number,
  billingPeriod: BillingPeriod
) {
  const rates = [
    pricing.band1Rate,
    pricing.band2Rate,
    pricing.band3Rate,
    pricing.band4Rate,
    pricing.band5Rate,
  ];

  let remaining = studentCount;
  const bandBreakdown = STUDENT_BANDS.map((bandLimit, index) => {
    const studentsInBand = Math.max(0, Math.min(remaining, bandLimit));
    const rateKes = rates[index] ?? pricing.band5Rate;
    remaining -= studentsInBand;
    return {
      band: index + 1,
      students: studentsInBand,
      rateKes,
      totalKes: studentsInBand * rateKes,
    };
  }).filter((band) => band.students > 0);

  const subtotalMonthlyKes = bandBreakdown.reduce((sum, band) => sum + band.totalKes, 0);
  const grossMonthlyKes = subtotalMonthlyKes * BILLING_PERIOD_MONTHS[billingPeriod];
  const periodMultiplier =
    billingPeriod === "monthly"
      ? pricing.monthlyMultiplier
      : billingPeriod === "termly"
        ? pricing.termlyMultiplier
        : billingPeriod === "quarterly"
          ? pricing.quarterlyMultiplier
          : pricing.annualMultiplier;
  const grossPeriodKes = grossMonthlyKes * periodMultiplier;
  const discountKes = grossMonthlyKes - grossPeriodKes;
  const discountPct = grossMonthlyKes === 0 ? 0 : (discountKes / grossMonthlyKes) * 100;
  const vatKes = grossPeriodKes * (pricing.vatRatePct / 100);
  const totalKes = grossPeriodKes + vatKes;
  const effectiveMonthlyKes =
    BILLING_PERIOD_MONTHS[billingPeriod] === 0
      ? 0
      : grossPeriodKes / BILLING_PERIOD_MONTHS[billingPeriod];

  return {
    bandBreakdown,
    subtotalMonthlyKes,
    grossPeriodKes,
    discountKes,
    discountPct,
    vatKes,
    vatRatePct: pricing.vatRatePct,
    totalKes,
    effectiveMonthlyKes,
  };
}

export const getActiveStudentCount = internalQuery({
  args: {
    tenantId: v.string(),
  },
  handler: async (ctx, args) => getActiveStudentCountValue(ctx, args.tenantId),
});

export const getEffectivePricing = internalQuery({
  args: {
    moduleId: v.id("marketplace_modules"),
    tenantId: v.string(),
  },
  handler: async (ctx, args) => getEffectivePricingValue(ctx, args.moduleId, args.tenantId),
});

export const generatePricingBreakdown = query({
  args: {
    sessionToken: v.string(),
    moduleSlug: v.string(),
    billingPeriod: v.union(
      v.literal("monthly"),
      v.literal("termly"),
      v.literal("quarterly"),
      v.literal("annual")
    ),
    studentCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    if (args.moduleSlug.startsWith("core_")) {
      const studentCount =
        args.studentCount ?? (await getActiveStudentCountValue(ctx, tenant.tenantId));

      return {
        moduleId: undefined,
        moduleSlug: args.moduleSlug,
        tenantId: tenant.tenantId,
        isCore: true,
        studentCount,
        billingPeriod: args.billingPeriod,
        breakdown: calculateModulePrice(ZERO_PRICING, studentCount, args.billingPeriod),
      };
    }

    const { moduleRecord, pricing: basePricing } = await getModuleAndPricing(ctx, args.moduleSlug);
    const pricing = moduleRecord.isCore
      ? basePricing
      : await getEffectivePricingValue(ctx, moduleRecord._id, tenant.tenantId);
    const studentCount =
      args.studentCount ?? (await getActiveStudentCountValue(ctx, tenant.tenantId));

    return {
      moduleId: moduleRecord._id,
      moduleSlug: args.moduleSlug,
      tenantId: tenant.tenantId,
      isCore: moduleRecord.isCore ?? false,
      studentCount,
      billingPeriod: args.billingPeriod,
      breakdown: calculateModulePrice(pricing, studentCount, args.billingPeriod),
    };
  },
});
