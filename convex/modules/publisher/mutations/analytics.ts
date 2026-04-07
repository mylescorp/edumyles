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

    // Get installed modules
    const moduleIds = modules.map(m => m.moduleId);
    const installations = await ctx.db
      .query("installedModules")
      .filter(q => 
        q.or(...moduleIds.map(moduleId => q.eq("moduleId", moduleId)))
      )
      .collect();

    // Calculate stats
    const totalModules = modules.length;
    const activeModules = modules.filter(m => m.status === "published").length;
    const totalInstalls = installations.length;
    const activeInstalls = installations.filter(i => i.status === "active").length;
    
    // Calculate revenue (this would come from paymentTransactions)
    const totalRevenue = 0; // TODO: Calculate from payment transactions
    const monthlyRevenue = 0; // TODO: Calculate from recent transactions

    // Get recent installations
    const recentInstallations = installations
      .sort((a, b) => b.installedAt - a.installedAt)
      .slice(0, 10);

    // Get module performance
    const modulePerformance = modules.map(module => ({
      moduleId: module.moduleId,
      name: module.name,
      status: module.status,
      installs: installations.filter(i => i.moduleId === module.moduleId).length,
      activeInstalls: installations.filter(i => i.moduleId === module.moduleId && i.status === "active").length,
      revenue: 0, // TODO: Calculate revenue per module
      rating: 0, // TODO: Calculate from reviews table
      reviewCount: 0, // TODO: Calculate from reviews table
    }));

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

    // TODO: Get revenue data from paymentTransactions
    // For now, return mock data
    const revenueData = [];
    const currentDate = new Date(startDate);
    
    while (currentDate.getTime() <= now) {
      revenueData.push({
        date: currentDate.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 10000), // Mock revenue
        installs: Math.floor(Math.random() * 10), // Mock installs
      });
      
      // Move to next period
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
      .query("installedModules")
      .filter(q => q.eq("moduleId", args.moduleId))
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
    const periodInstallations = installations.filter(i => i.installedAt >= startDate);

    // Get daily install data
    const dailyData = [];
    const currentDate = new Date(startDate);
    
    while (currentDate.getTime() <= now) {
      const dayStart = currentDate.getTime();
      const dayEnd = dayStart + (24 * 60 * 60 * 1000);
      
      const dayInstalls = installations.filter(i => 
        i.installedAt >= dayStart && i.installedAt < dayEnd
      ).length;

      dailyData.push({
        date: currentDate.toISOString().split('T')[0],
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
        moduleId: module.moduleId,
        name: module.name,
        status: module.status,
        totalInstalls: installations.length,
        activeInstalls: installations.filter(i => i.status === "active").length,
        periodInstalls: periodInstallations.length,
        rating: module.rating,
        reviewCount: module.reviewCount,
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
      // Get installations for specific module
      const module = await ctx.db
        .query("modules")
        .withIndex("by_slug", q => q.eq("slug", args.moduleId))
        .unique();

      if (!module || module.publisherId !== publisher.publisherId) {
        throw new Error("Module not found or not authorized");
      }

      installations = await ctx.db
        .query("installedModules")
        .filter(q => q.eq("moduleId", args.moduleId))
        .collect();
    } else {
      // Get installations for all modules by this publisher
      const modules = await ctx.db
        .query("modules")
        .withIndex("by_publisherId", q => q.eq("publisherId", publisher.publisherId))
        .collect();

      // Filter installations for all modules by this publisher
      const moduleIds = modules.map(m => m.moduleId);
      installations = await ctx.db
        .query("installedModules")
        .filter(q => 
          q.or(...moduleIds.map(moduleId => q.eq("moduleId", moduleId)))
        )
        .collect();
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
        const country = tenant.country;
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
