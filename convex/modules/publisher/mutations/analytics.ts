import { v } from "convex/values";
import { query } from "../../../_generated/server";
import { requirePublisherContext } from "../../../helpers/publisherGuard";

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const publisher = await requirePublisherContext(ctx);
    
    // Get all modules for this publisher
    const modules = await ctx.db
      .query("modules")
      .withIndex("by_publisherId", q => q.eq("publisherId", publisher.publisherId))
      .collect();

    const moduleIds = modules.map((m) => String(m._id));
    const [installations, reviews, payments, installStats] = await Promise.all([
      moduleIds.length === 0
        ? Promise.resolve([])
        : ctx.db
            .query("module_installs")
            .collect()
            .then((items) => items.filter((install) => moduleIds.includes(install.moduleId))),
      moduleIds.length === 0
        ? Promise.resolve([])
        : ctx.db
            .query("module_reviews")
            .collect()
            .then((items) => items.filter((review) => moduleIds.includes(review.moduleId))),
      moduleIds.length === 0
        ? Promise.resolve([])
        : ctx.db
            .query("module_payments")
            .collect()
            .then((items) => items.filter((payment) => moduleIds.includes(payment.moduleId))),
      moduleIds.length === 0
        ? Promise.resolve([])
        : ctx.db
            .query("module_install_stats")
            .collect()
            .then((items) => items.filter((stat) => moduleIds.includes(stat.moduleId))),
    ]);

    // Calculate stats
    const totalModules = modules.length;
    const activeModules = modules.filter(m => m.status === "published").length;
    const totalInstalls = installations.length;
    const activeInstalls = installations.filter(i => i.status === "active").length;
    const totalRevenue = payments
      .filter((payment) => payment.status === "success")
      .reduce((sum, payment) => sum + payment.amountKes, 0);
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const monthlyRevenue = payments
      .filter((payment) => payment.status === "success" && payment.createdAt >= thirtyDaysAgo)
      .reduce((sum, payment) => sum + payment.amountKes, 0);

    // Get recent installations
    const recentInstallations = installations
      .sort((a, b) => (b.installedAt ?? 0) - (a.installedAt ?? 0))
      .slice(0, 10);

    // Get module performance
    const modulePerformance = modules.map((module) => {
      const moduleId = String(module._id);
      const stat = installStats.find((item) => item.moduleId === moduleId);
      const moduleReviews = reviews.filter((review) => review.moduleId === moduleId);
      const approvedReviews = moduleReviews.filter((review) => review.status === "approved");
      const modulePayments = payments.filter(
        (payment) => payment.moduleId === moduleId && payment.status === "success"
      );

      return {
        moduleId,
        slug: module.slug,
        name: module.name,
        status: module.status,
        installs: stat?.totalInstalls ?? installations.filter((i) => i.moduleId === moduleId).length,
        activeInstalls:
          stat?.activeInstalls ??
          installations.filter((i) => i.moduleId === moduleId && i.status === "active").length,
        revenue:
          stat?.totalRevenueKes ??
          modulePayments.reduce((sum, payment) => sum + payment.amountKes, 0),
        rating:
          stat?.avgRating ??
          (approvedReviews.length > 0
            ? approvedReviews.reduce((sum, review) => sum + review.rating, 0) / approvedReviews.length
            : 0),
        reviewCount: approvedReviews.length,
        lastUpdated: module.updatedAt,
      };
    });

    return {
      stats: {
        totalModules,
        activeModules,
        totalInstalls,
        activeInstalls,
        totalRevenue,
        monthlyRevenue,
      },
      recentInstallations,
      modulePerformance,
    };
  },
});

export const getRevenueAnalytics = query({
  args: {
    period: v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"), v.literal("1y")),
    granularity: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);
    const modules = await ctx.db
      .query("modules")
      .withIndex("by_publisherId", (q) => q.eq("publisherId", publisher.publisherId))
      .collect();
    const moduleIds = new Set(modules.map((module) => String(module._id)));

    // Calculate date range
    const now = Date.now();
    let startDate: number;
    
    switch (args.period) {
      case "7d":
        startDate = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = now - (30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = now - (90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = now - (365 * 24 * 60 * 60 * 1000);
        break;
    }

    const [payments, installs] = await Promise.all([
      moduleIds.size === 0
        ? Promise.resolve([])
        : ctx.db
            .query("module_payments")
            .collect()
            .then((items) =>
              items.filter(
                (payment) =>
                  moduleIds.has(payment.moduleId) &&
                  payment.status === "success" &&
                  payment.createdAt >= startDate
              )
            ),
      moduleIds.size === 0
        ? Promise.resolve([])
        : ctx.db
            .query("module_installs")
            .collect()
            .then((items) =>
              items.filter(
                (install) =>
                  moduleIds.has(install.moduleId) && (install.installedAt ?? 0) >= startDate
              )
            ),
    ]);

    const revenueData: Array<{ date: string; revenue: number; installs: number }> = [];
    const currentDate = new Date(startDate);

    while (currentDate.getTime() <= now) {
      const bucketStart = currentDate.getTime();
      const bucketEnd = new Date(bucketStart);
      switch (args.granularity) {
        case "daily":
          bucketEnd.setDate(bucketEnd.getDate() + 1);
          break;
        case "weekly":
          bucketEnd.setDate(bucketEnd.getDate() + 7);
          break;
        case "monthly":
          bucketEnd.setMonth(bucketEnd.getMonth() + 1);
          break;
      }

      revenueData.push({
        date: currentDate.toISOString().split("T")[0] ?? "",
        revenue: payments
          .filter((payment) => payment.createdAt >= bucketStart && payment.createdAt < bucketEnd.getTime())
          .reduce((sum, payment) => sum + payment.amountKes, 0),
        installs: installs.filter(
          (install) =>
            (install.installedAt ?? 0) >= bucketStart &&
            (install.installedAt ?? 0) < bucketEnd.getTime()
        ).length,
      });

      switch (args.granularity) {
        case "daily":
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case "weekly":
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case "monthly":
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }
    }

    return {
      period: args.period,
      granularity: args.granularity,
      data: revenueData,
      totalRevenue: revenueData.reduce((sum, d) => sum + d.revenue, 0),
      totalInstalls: revenueData.reduce((sum, d) => sum + d.installs, 0),
    };
  },
});

export const getModuleAnalytics = query({
  args: {
    moduleId: v.string(),
    period: v.union(v.literal("7d"), v.literal("30d"), v.literal("90d")),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);
    
    // Get the module
    const module = await ctx.db
      .query("modules")
      .withIndex("by_slug", q => q.eq("slug", args.moduleId))
      .unique();

    if (!module) {
      throw new Error("Module not found");
    }

    // Check if publisher owns this module
    if (module.publisherId !== publisher.publisherId) {
      throw new Error("Not authorized to view analytics for this module");
    }

    // Get installations for this module
    const installations = await ctx.db
      .query("module_installs")
      .withIndex("by_moduleId", q => q.eq("moduleId", String(module._id)))
      .collect();

    const reviews = await ctx.db
      .query("module_reviews")
      .withIndex("by_moduleId", q => q.eq("moduleId", String(module._id)))
      .collect();

    // Calculate date range
    const now = Date.now();
    let startDate: number;
    
    switch (args.period) {
      case "7d":
        startDate = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = now - (30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = now - (90 * 24 * 60 * 60 * 1000);
        break;
    }

    // Filter installations by period
    const periodInstallations = installations.filter(i => (i.installedAt ?? 0) >= startDate);

    // Get daily install data
    const dailyData = [];
    const currentDate = new Date(startDate);
    
    while (currentDate.getTime() <= now) {
      const dayStart = currentDate.getTime();
      const dayEnd = dayStart + (24 * 60 * 60 * 1000);
      
      const dayInstalls = installations.filter(i => 
        (i.installedAt ?? 0) >= dayStart && (i.installedAt ?? 0) < dayEnd
      ).length;

      dailyData.push({
        date: currentDate.toISOString().split("T")[0] ?? "",
        installs: dayInstalls,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get top installing tenants
    const tenantInstalls = installations.reduce((acc, install) => {
      const tenantId = install.tenantId;
      if (!acc[tenantId]) {
        acc[tenantId] = { tenantId, count: 0 };
      }
      acc[tenantId].count++;
      return acc;
    }, {} as Record<string, { tenantId: string; count: number }>);

    const topTenants = Object.values(tenantInstalls)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      module: {
        moduleId: String(module._id),
        name: module.name,
        status: module.status,
        totalInstalls: installations.length,
        activeInstalls: installations.filter(i => i.status === "active").length,
        periodInstalls: periodInstallations.length,
        rating: reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0,
        reviewCount: reviews.length,
      },
      dailyData,
      topTenants,
    };
  },
});

export const getGeographicAnalytics = query({
  args: {
    moduleId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);
    
    // Get installations
    let installations;
    if (args.moduleId) {
      const moduleSlug = args.moduleId;
      // Get installations for specific module
      const module = await ctx.db
        .query("modules")
        .withIndex("by_slug", q => q.eq("slug", moduleSlug))
        .unique();

      if (!module || module.publisherId !== publisher.publisherId) {
        throw new Error("Module not found or not authorized");
      }

      installations = await ctx.db
        .query("module_installs")
        .withIndex("by_moduleId", q => q.eq("moduleId", String(module._id)))
        .collect();
    } else {
      // Get installations for all modules by this publisher
      const modules = await ctx.db
        .query("modules")
        .withIndex("by_publisherId", q => q.eq("publisherId", publisher.publisherId))
        .collect();

      // Filter installations for all modules by this publisher
      const moduleIds = modules.map(m => String(m._id));
      installations = moduleIds.length === 0
        ? []
        : await ctx.db
            .query("module_installs")
            .collect()
            .then((items) => items.filter((install) => moduleIds.includes(install.moduleId)));
    }

    // Get tenant information for geographic data
    const tenantIds = [...new Set(installations.map(i => i.tenantId))];
    const tenants = await Promise.all(
      tenantIds.map(async (tenantId) => {
        const tenant = await ctx.db
          .query("tenants")
          .withIndex("by_tenantId", q => q.eq("tenantId", tenantId))
          .first();
        return tenant;
      })
    );

    // Group by country
    const countryData = tenants.reduce((acc, tenant) => {
      if (tenant) {
      const country = tenant.country ?? "Unknown";
        if (!acc[country]) {
          acc[country] = { country, count: 0, tenants: [] };
        }
        acc[country].count++;
        acc[country].tenants.push({
          tenantId: tenant.tenantId,
          name: tenant.name,
          country: tenant.country,
        });
      }
      return acc;
    }, {} as Record<string, { country: string; count: number; tenants: any[] }>);

    const geographicData = Object.values(countryData).sort((a, b) => b.count - a.count);

    return {
      totalInstallations: installations.length,
      geographicData,
    };
  },
});
