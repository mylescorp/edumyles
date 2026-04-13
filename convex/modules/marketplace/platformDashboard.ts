import { ConvexError, v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requirePlatformContext } from "../../helpers/platformGuard";
import { calculateModulePrice } from "./pricing";
import { logAction } from "../../helpers/auditLog";

function startOfMonth(timestamp: number) {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
}

function labelMonth(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-KE", { month: "short" });
}

function toModuleKey(moduleId: unknown) {
  return String(moduleId);
}

export const getPlatformMarketplaceOverview = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformContext(ctx, args, "marketplace.view");

    const [
      modules,
      installs,
      reviews,
      flags,
      invoices,
      tasks,
    ] = await Promise.all([
      ctx.db.query("marketplace_modules").collect(),
      ctx.db.query("module_installs").collect(),
      ctx.db.query("module_reviews").collect(),
      ctx.db.query("module_flags").collect(),
      ctx.db.query("subscription_invoices").collect(),
      ctx.db.query("admin_task_queue").collect(),
    ]);

    const now = Date.now();
    const monthStart = startOfMonth(now);
    const moduleMap = new Map(modules.map((moduleRecord: any) => [toModuleKey(moduleRecord._id), moduleRecord]));

    const publishedModules = modules.filter((moduleRecord: any) => moduleRecord.status === "published");
    const activeInstalls = installs.filter((install: any) => install.status === "active");
    const pendingReviews = reviews.filter((review: any) => review.status === "pending");
    const activeFlags = flags.filter((flag: any) =>
      ["flagged", "under_investigation"].includes(flag.status)
    );
    const moduleRequests = tasks.filter((task: any) => task.status === "pending");
    const mrrKesMtd = invoices
      .filter((invoice: any) => invoice.createdAt >= monthStart)
      .reduce((sum: number, invoice: any) => sum + (invoice.totalAmountKes ?? 0), 0);

    const topModules = publishedModules
      .map((moduleRecord: any) => {
        const moduleInstalls = installs.filter(
          (install: any) => toModuleKey(install.moduleId) === toModuleKey(moduleRecord._id)
        );
        const installCount = moduleInstalls.length;
        const activeInstallCount = moduleInstalls.filter((install: any) => install.status === "active").length;
        const moduleRevenueKes = invoices
          .filter((invoice: any) => invoice.metadata?.moduleSlug === moduleRecord.slug)
          .reduce((sum: number, invoice: any) => sum + (invoice.totalAmountKes ?? 0), 0);

        return {
          moduleId: String(moduleRecord._id),
          slug: moduleRecord.slug,
          name: moduleRecord.name,
          category: moduleRecord.category,
          installCount,
          activeInstallCount,
          revenueKes: moduleRevenueKes,
          averageRating: moduleRecord.averageRating ?? 0,
          reviewCount: moduleRecord.reviewCount ?? 0,
          status: moduleRecord.status,
        };
      })
      .sort((left, right) => right.activeInstallCount - left.activeInstallCount)
      .slice(0, 10);

    const installGrowth = Array.from({ length: 12 }).map((_, index) => {
      const bucketDate = new Date();
      bucketDate.setDate(1);
      bucketDate.setHours(0, 0, 0, 0);
      bucketDate.setMonth(bucketDate.getMonth() - (11 - index));
      const bucketStart = bucketDate.getTime();
      const bucketEndDate = new Date(bucketDate);
      bucketEndDate.setMonth(bucketEndDate.getMonth() + 1);
      const bucketEnd = bucketEndDate.getTime();

      return {
        month: labelMonth(bucketStart),
        installs: installs.filter(
          (install: any) =>
            typeof install.installedAt === "number" &&
            install.installedAt >= bucketStart &&
            install.installedAt < bucketEnd
        ).length,
      };
    });

    const billingPeriodDistribution = ["monthly", "termly", "quarterly", "annual"].map((period) => ({
      billingPeriod: period,
      count: activeInstalls.filter((install: any) => (install.billingPeriod ?? "monthly") === period).length,
    }));

    const churn = publishedModules.map((moduleRecord: any) => {
      const moduleInstalls = installs.filter(
        (install: any) => toModuleKey(install.moduleId) === toModuleKey(moduleRecord._id)
      );
      return {
        moduleId: String(moduleRecord._id),
        name: moduleRecord.name,
        installs: moduleInstalls.filter((install: any) => install.status !== "uninstalled").length,
        uninstalls: moduleInstalls.filter((install: any) => install.status === "uninstalled").length,
      };
    });

    const revenueByModule = topModules.map((moduleRecord) => ({
      name: moduleRecord.name,
      revenueKes: moduleRecord.revenueKes,
    }));

    return {
      stats: {
        publishedModules: publishedModules.length,
        activeInstalls: activeInstalls.length,
        mrrKesMtd,
        pendingReviews: pendingReviews.length,
        activeFlags: activeFlags.length,
        moduleRequests: moduleRequests.length,
      },
      topModules,
      revenueByModule,
      installGrowth,
      billingPeriodDistribution,
      churn,
      pendingReviewItems: pendingReviews.slice(0, 8).map((review: any) => ({
        reviewId: String(review._id),
        moduleName: moduleMap.get(toModuleKey(review.moduleId))?.name ?? String(review.moduleId),
        rating: review.rating,
        title: review.title,
        createdAt: review.createdAt,
        tenantId: review.tenantId,
      })),
      activeFlagItems: activeFlags.slice(0, 8).map((flag: any) => ({
        flagId: String(flag._id),
        moduleName: moduleMap.get(toModuleKey(flag.moduleId))?.name ?? String(flag.moduleId),
        status: flag.status,
        reason: flag.reason,
        createdAt: flag.createdAt,
        tenantId: flag.tenantId,
      })),
    };
  },
});

export const getPlatformMarketplaceModules = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformContext(ctx, args, "marketplace.view");

    const [modules, installs, pricingRecords, overrides] = await Promise.all([
      ctx.db.query("marketplace_modules").collect(),
      ctx.db.query("module_installs").collect(),
      ctx.db.query("module_pricing").collect(),
      ctx.db.query("module_price_overrides").collect(),
    ]);

    return modules.map((moduleRecord: any) => {
      const moduleInstalls = installs.filter(
        (install: any) => toModuleKey(install.moduleId) === toModuleKey(moduleRecord._id)
      );
      const pricing = pricingRecords.find(
        (record: any) => toModuleKey(record.moduleId) === toModuleKey(moduleRecord._id)
      );
      const activeOverrides = overrides.filter(
        (record: any) =>
          toModuleKey(record.moduleId) === toModuleKey(moduleRecord._id) &&
          record.isActive &&
          (!record.expiresAt || record.expiresAt > Date.now())
      );

      return {
        ...moduleRecord,
        moduleId: String(moduleRecord._id),
        installCount: moduleInstalls.length,
        activeInstallCount: moduleInstalls.filter((install: any) => install.status === "active").length,
        pricing,
        activeOverrideCount: activeOverrides.length,
      };
    });
  },
});

export const getPlatformPricingControlData = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformContext(ctx, args, "marketplace.manage_pricing");

    const [modules, pricingRecords, overrides, history, rules] = await Promise.all([
      ctx.db.query("marketplace_modules").collect(),
      ctx.db.query("module_pricing").collect(),
      ctx.db.query("module_price_overrides").collect(),
      ctx.db.query("module_price_history").collect(),
      ctx.db.query("platform_pricing_rules").collect().catch(() => []),
    ]);

    const modulesWithPricing = modules.map((moduleRecord: any) => {
      const pricing = pricingRecords.find(
        (record: any) => toModuleKey(record.moduleId) === toModuleKey(moduleRecord._id)
      );
      const activeOverrides = overrides.filter(
        (record: any) =>
          toModuleKey(record.moduleId) === toModuleKey(moduleRecord._id) &&
          record.isActive &&
          (!record.expiresAt || record.expiresAt > Date.now())
      );

      return {
        moduleId: String(moduleRecord._id),
        slug: moduleRecord.slug,
        name: moduleRecord.name,
        category: moduleRecord.category,
        status: moduleRecord.status,
        pricing,
        activeOverrides: activeOverrides.map((override: any) => ({
          ...override,
          overrideId: String(override._id),
        })),
      };
    });

    return {
      modules: modulesWithPricing,
      history: history
        .sort((left: any, right: any) => (right.changedAt ?? right.createdAt) - (left.changedAt ?? left.createdAt))
        .slice(0, 20)
        .map((entry: any) => ({
          ...entry,
          historyId: String(entry._id),
          moduleName:
            modules.find((moduleRecord: any) => toModuleKey(moduleRecord._id) === toModuleKey(entry.moduleId))?.name ??
            String(entry.moduleId),
        })),
      rules: rules.map((rule: any) => ({
        ...rule,
        ruleId: String(rule._id),
      })),
    };
  },
});

export const simulatePlatformPricing = query({
  args: {
    sessionToken: v.string(),
    moduleId: v.id("marketplace_modules"),
    studentCount: v.number(),
    billingPeriod: v.union(
      v.literal("monthly"),
      v.literal("termly"),
      v.literal("quarterly"),
      v.literal("annual")
    ),
  },
  handler: async (ctx, args) => {
    await requirePlatformContext(ctx, args, "marketplace.manage_pricing");

    const pricing = await ctx.db
      .query("module_pricing")
      .withIndex("by_moduleId", (q: any) => q.eq("moduleId", args.moduleId))
      .unique();

    if (!pricing) {
      throw new ConvexError({
        code: "MODULE_PRICING_MISSING",
        message: "Module pricing could not be found for simulation.",
      });
    }

    return calculateModulePrice(pricing, args.studentCount, args.billingPeriod);
  },
});

export const upsertPlatformPricingRule = mutation({
  args: {
    sessionToken: v.string(),
    category: v.string(),
    minPriceKes: v.number(),
    maxPriceKes: v.number(),
    defaultRevenueSharePct: v.number(),
  },
  handler: async (ctx, args) => {
    await requirePlatformContext(ctx, args, "marketplace.manage_pricing");

    const existing = await ctx.db
      .query("platform_pricing_rules")
      .withIndex("by_category", (q: any) => q.eq("category", args.category))
      .unique()
      .catch(() => null);

    if (existing) {
      await ctx.db.patch(existing._id, {
        minPriceKes: args.minPriceKes,
        maxPriceKes: args.maxPriceKes,
        defaultRevenueSharePct: args.defaultRevenueSharePct,
        updatedAt: Date.now(),
      });
      return { success: true, ruleId: existing._id };
    }

    const ruleId = await ctx.db.insert("platform_pricing_rules", {
      category: args.category,
      minPriceKes: args.minPriceKes,
      maxPriceKes: args.maxPriceKes,
      defaultRevenueSharePct: args.defaultRevenueSharePct,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any);

    return { success: true, ruleId };
  },
});

export const deletePlatformPricingRule = mutation({
  args: {
    sessionToken: v.string(),
    ruleId: v.id("platform_pricing_rules"),
  },
  handler: async (ctx, args) => {
    await requirePlatformContext(ctx, args, "marketplace.manage_pricing");
    await ctx.db.delete(args.ruleId);
    return { success: true };
  },
});

export const upsertPlatformModulePriceOverride = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.id("marketplace_modules"),
    tenantId: v.string(),
    overridePriceKes: v.number(),
    reason: v.string(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformContext(ctx, args, "marketplace.manage_pricing");
    const existing = await ctx.db
      .query("module_price_overrides")
      .withIndex("by_moduleId_tenantId", (q: any) =>
        q.eq("moduleId", args.moduleId).eq("tenantId", args.tenantId)
      )
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        overridePriceKes: args.overridePriceKes,
        reason: args.reason,
        expiresAt: args.expiresAt,
        isActive: true,
        revokedAt: undefined,
        revokedBy: undefined,
      });

      await ctx.db.insert("module_price_history", {
        moduleId: args.moduleId,
        tenantId: args.tenantId,
        changeType: "override_created",
        oldPriceKes: existing.overridePriceKes,
        newPriceKes: args.overridePriceKes,
        changedBy: platform.userId,
        changedAt: now,
        reason: args.reason,
        createdAt: now,
      } as any);

      return { success: true, overrideId: existing._id };
    }

    const overrideId = await ctx.db.insert("module_price_overrides", {
      moduleId: args.moduleId,
      tenantId: args.tenantId,
      overridePriceKes: args.overridePriceKes,
      reason: args.reason,
      grantedBy: platform.userId,
      grantedAt: now,
      expiresAt: args.expiresAt,
      isActive: true,
    });

    await ctx.db.insert("module_price_history", {
      moduleId: args.moduleId,
      tenantId: args.tenantId,
      changeType: "override_created",
      oldPriceKes: 0,
      newPriceKes: args.overridePriceKes,
      changedBy: platform.userId,
      changedAt: now,
      reason: args.reason,
      createdAt: now,
    } as any);

    return { success: true, overrideId };
  },
});

export const revokePlatformModulePriceOverride = mutation({
  args: {
    sessionToken: v.string(),
    overrideId: v.id("module_price_overrides"),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformContext(ctx, args, "marketplace.manage_pricing");
    const existing = await ctx.db.get(args.overrideId);
    if (!existing) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Price override not found." });
    }

    const now = Date.now();
    await ctx.db.patch(args.overrideId, {
      isActive: false,
      revokedAt: now,
      revokedBy: platform.userId,
    });

    await ctx.db.insert("module_price_history", {
      moduleId: existing.moduleId,
      tenantId: existing.tenantId,
      changeType: "override_revoked",
      oldPriceKes: existing.overridePriceKes,
      newPriceKes: existing.overridePriceKes,
      changedBy: platform.userId,
      changedAt: now,
      reason: existing.reason,
      createdAt: now,
    } as any);

    return { success: true };
  },
});

export const getPlatformPilotGrantsData = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformContext(ctx, args, "marketplace.manage_pilot_grants");

    const [grants, modules, tenants] = await Promise.all([
      ctx.db.query("pilot_grants").collect(),
      ctx.db.query("marketplace_modules").collect(),
      ctx.db.query("tenants").collect(),
    ]);

    const moduleMap = new Map(modules.map((moduleRecord: any) => [toModuleKey(moduleRecord._id), moduleRecord]));
    const tenantMap = new Map(tenants.map((tenant: any) => [tenant.tenantId, tenant]));

    return {
      grants: grants
        .sort((left: any, right: any) => right.createdAt - left.createdAt)
        .map((grant: any) => ({
          ...grant,
          grantId: String(grant._id),
          moduleName: moduleMap.get(toModuleKey(grant.moduleId))?.name ?? String(grant.moduleId),
          tenantName: tenantMap.get(grant.tenantId)?.name ?? grant.tenantId,
        })),
      modules: modules.map((moduleRecord: any) => ({
        moduleId: String(moduleRecord._id),
        slug: moduleRecord.slug,
        name: moduleRecord.name,
      })),
      tenants: tenants.map((tenant: any) => ({
        tenantId: tenant.tenantId,
        name: tenant.name,
      })),
    };
  },
});

export const getPlatformBillingData = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformContext(ctx, args, "marketplace.view");

    const [invoices, installs, modules, tenants] = await Promise.all([
      ctx.db.query("subscription_invoices").collect(),
      ctx.db.query("module_installs").collect(),
      ctx.db.query("marketplace_modules").collect(),
      ctx.db.query("tenants").collect(),
    ]);

    const tenantMap = new Map(tenants.map((tenant: any) => [tenant.tenantId, tenant.name]));
    const moduleMap = new Map(modules.map((moduleRecord: any) => [moduleRecord.slug, moduleRecord.name]));
    const now = Date.now();
    const monthStart = startOfMonth(now);

    const moduleInvoices = invoices
      .filter((invoice: any) => Boolean(invoice.metadata?.moduleSlug))
      .sort((left: any, right: any) => right.createdAt - left.createdAt);

    const failedPayments = installs
      .filter((install: any) => ["payment_failed", "suspended_payment"].includes(install.status))
      .map((install: any) => ({
        installId: String(install._id),
        tenantId: install.tenantId,
        tenantName: tenantMap.get(install.tenantId) ?? install.tenantId,
        moduleSlug: install.moduleSlug,
        moduleName: moduleMap.get(install.moduleSlug) ?? install.moduleSlug,
        status: install.status,
        paymentFailureCount: install.paymentFailureCount ?? 0,
        lastPaymentFailureAt: install.lastPaymentFailureAt,
      }));

    return {
      stats: {
        invoicesThisMonth: moduleInvoices.filter((invoice: any) => invoice.createdAt >= monthStart).length,
        revenueThisMonthKes: moduleInvoices
          .filter((invoice: any) => invoice.createdAt >= monthStart)
          .reduce((sum: number, invoice: any) => sum + (invoice.totalAmountKes ?? 0), 0),
        activeBillableInstalls: installs.filter(
          (install: any) => install.status === "active" && !install.moduleSlug?.startsWith("core_")
        ).length,
        failedPayments: failedPayments.length,
      },
      recentInvoices: moduleInvoices.slice(0, 20).map((invoice: any) => ({
        invoiceId: String(invoice._id),
        tenantId: invoice.tenantId,
        tenantName: tenantMap.get(invoice.tenantId) ?? invoice.tenantId,
        moduleSlug: invoice.metadata?.moduleSlug,
        moduleName: moduleMap.get(invoice.metadata?.moduleSlug) ?? invoice.metadata?.moduleSlug ?? "Unknown module",
        totalAmountKes: invoice.totalAmountKes,
        status: invoice.status,
        dueDate: invoice.dueDate,
        createdAt: invoice.createdAt,
      })),
      failedPayments,
    };
  },
});

export const getPlatformMarketplaceReviews = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(
      v.union(v.literal("pending"), v.literal("approved"), v.literal("flagged"), v.literal("deleted"))
    ),
  },
  handler: async (ctx, args) => {
    await requirePlatformContext(ctx, args, "marketplace.manage_reviews");

    const [reviews, modules] = await Promise.all([
      ctx.db.query("module_reviews").collect(),
      ctx.db.query("marketplace_modules").collect(),
    ]);

    const moduleMap = new Map(modules.map((moduleRecord: any) => [toModuleKey(moduleRecord._id), moduleRecord]));
    const filtered = args.status
      ? reviews.filter((review: any) => review.status === args.status)
      : reviews;

    return filtered
      .sort((left: any, right: any) => right.createdAt - left.createdAt)
      .map((review: any) => ({
        ...review,
        moduleName: moduleMap.get(toModuleKey(review.moduleId))?.name ?? String(review.moduleId),
      }));
  },
});

export const getPlatformMarketplaceFlags = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(
      v.union(
        v.literal("flagged"),
        v.literal("under_investigation"),
        v.literal("resolved_no_action"),
        v.literal("resolved_warning"),
        v.literal("resolved_suspended"),
        v.literal("resolved_banned")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requirePlatformContext(ctx, args, "marketplace.manage_flags");

    const [flags, modules] = await Promise.all([
      ctx.db.query("module_flags").collect(),
      ctx.db.query("marketplace_modules").collect(),
    ]);

    const moduleMap = new Map(modules.map((moduleRecord: any) => [toModuleKey(moduleRecord._id), moduleRecord]));
    const filtered = args.status ? flags.filter((flag: any) => flag.status === args.status) : flags;

    return filtered
      .sort((left: any, right: any) => right.createdAt - left.createdAt)
      .map((flag: any) => ({
        ...flag,
        moduleName: moduleMap.get(toModuleKey(flag.moduleId))?.name ?? String(flag.moduleId),
      }));
  },
});

export const getPlatformMarketplaceModuleDetail = query({
  args: {
    sessionToken: v.string(),
    moduleId: v.id("marketplace_modules"),
  },
  handler: async (ctx, args) => {
    await requirePlatformContext(ctx, args, "marketplace.view");

    const [moduleRecord, pricing, installs, reviews, flags, versions, priceHistory] = await Promise.all([
      ctx.db.get(args.moduleId),
      ctx.db
        .query("module_pricing")
        .withIndex("by_moduleId", (q: any) => q.eq("moduleId", args.moduleId))
        .unique(),
      ctx.db
        .query("module_installs")
        .withIndex("by_moduleId", (q: any) => q.eq("moduleId", args.moduleId))
        .collect(),
      ctx.db
        .query("module_reviews")
        .withIndex("by_moduleId", (q: any) => q.eq("moduleId", args.moduleId))
        .collect(),
      ctx.db
        .query("module_flags")
        .withIndex("by_moduleId", (q: any) => q.eq("moduleId", args.moduleId))
        .collect(),
      ctx.db
        .query("module_versions")
        .withIndex("by_moduleId", (q: any) => q.eq("moduleId", args.moduleId))
        .collect(),
      ctx.db
        .query("module_price_history")
        .withIndex("by_moduleId", (q: any) => q.eq("moduleId", args.moduleId))
        .collect(),
    ]);

    if (!moduleRecord) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Marketplace module not found." });
    }

    return {
      module: moduleRecord,
      pricing,
      installs,
      reviews: reviews.sort((left: any, right: any) => right.createdAt - left.createdAt),
      flags: flags.sort((left: any, right: any) => right.createdAt - left.createdAt),
      versions: versions.sort((left: any, right: any) => (right.releasedAt ?? right.createdAt) - (left.releasedAt ?? left.createdAt)),
      priceHistory: priceHistory.sort((left: any, right: any) => (right.changedAt ?? right.createdAt) - (left.changedAt ?? left.createdAt)),
      stats: {
        totalInstalls: installs.length,
        activeInstalls: installs.filter((install: any) => install.status === "active").length,
        averageRating:
          reviews.filter((review: any) => review.status === "approved").length > 0
            ? reviews
                .filter((review: any) => review.status === "approved")
                .reduce((sum: number, review: any) => sum + review.rating, 0) /
              reviews.filter((review: any) => review.status === "approved").length
            : 0,
      },
    };
  },
});

export const getPlatformMarketplaceSubmissionQueue = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformContext(ctx, args, "marketplace.review_modules");

    const [modules, pricingRecords, versions] = await Promise.all([
      ctx.db.query("marketplace_modules").collect(),
      ctx.db.query("module_pricing").collect(),
      ctx.db.query("module_versions").collect(),
    ]);

    const draftModules = modules
      .filter((moduleRecord: any) => moduleRecord.status === "draft")
      .map((moduleRecord: any) => ({
        ...moduleRecord,
        moduleId: String(moduleRecord._id),
        queueType: "module_submission" as const,
        submittedAt: moduleRecord.updatedAt ?? moduleRecord.createdAt,
        pricing: pricingRecords.find(
          (pricing: any) => toModuleKey(pricing.moduleId) === toModuleKey(moduleRecord._id)
        ) ?? null,
        pendingVersions: versions.filter(
          (version: any) =>
            toModuleKey(version.moduleId) === toModuleKey(moduleRecord._id) &&
            version.status === "pending_review"
        ).length,
      }))
      .sort((left: any, right: any) => left.submittedAt - right.submittedAt);

    return draftModules;
  },
});

export const reviewPlatformMarketplaceSubmission = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.id("marketplace_modules"),
    decision: v.union(
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("requires_changes")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformContext(ctx, args, "marketplace.review_modules");
    const moduleRecord = await ctx.db.get(args.moduleId);

    if (!moduleRecord) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Marketplace module not found." });
    }

    const now = Date.now();
    const nextStatus =
      args.decision === "approved"
        ? "published"
        : args.decision === "rejected"
          ? "deprecated"
          : "draft";
    const auditAction =
      args.decision === "approved"
        ? "marketplace.module_approved"
        : args.decision === "rejected"
          ? "marketplace.module_rejected"
          : "marketplace.module_updated";

    await ctx.db.patch(args.moduleId, {
      status: nextStatus,
      publishedAt: args.decision === "approved" ? now : moduleRecord.publishedAt,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: auditAction,
      entityType: "marketplace_module",
      entityId: String(args.moduleId),
      after: {
        decision: args.decision,
        status: nextStatus,
        notes: args.notes,
      },
    });

    return { success: true, status: nextStatus };
  },
});
