import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

const categoryValidator = v.union(
  v.literal("academic_tools"), v.literal("communication"),
  v.literal("finance_fees"), v.literal("analytics_bi"),
  v.literal("content_packs"), v.literal("integrations"),
  v.literal("ai_automation"), v.literal("accessibility"),
  v.literal("administration"), v.literal("security_compliance")
);

// ── Storefront Queries ────────────────────────────────────────────────

export const getMarketplaceHome = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const now = Date.now();

    // Get published modules
    const allModules = await ctx.db
      .query("marketplaceModules")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    // Featured banners
    const featuredPlacements = await ctx.db
      .query("marketplaceFeatured")
      .withIndex("by_type", (q) => q.eq("type", "banner").eq("isActive", true))
      .collect();
    const activeBanners = featuredPlacements.filter(
      (f) => f.startDate <= now && f.endDate >= now
    );

    // Staff picks
    const staffPicks = await ctx.db
      .query("marketplaceFeatured")
      .withIndex("by_type", (q) => q.eq("type", "staff_pick").eq("isActive", true))
      .collect();

    // New & noteworthy (published in last 30 days)
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const newModules = allModules
      .filter((m) => m.publishedAt && m.publishedAt > thirtyDaysAgo)
      .sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0))
      .slice(0, 8);

    // Top rated (min 1 review, sorted by avg rating)
    const topRated = [...allModules]
      .filter((m) => m.totalReviews > 0)
      .sort((a, b) => b.averageRating - a.averageRating || b.totalReviews - a.totalReviews)
      .slice(0, 8);

    // Trending (highest install count)
    const trending = [...allModules]
      .sort((a, b) => b.totalInstalls - a.totalInstalls)
      .slice(0, 8);

    // Categories with counts
    const categories = await ctx.db
      .query("marketplaceCategories")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Count modules per category
    const categoryWithCounts = categories
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((cat) => ({
        ...cat,
        moduleCount: allModules.filter((m) => m.category === cat.slug).length,
      }));

    // Stats
    const totalInstalls = allModules.reduce((sum, m) => sum + m.totalInstalls, 0);
    const avgRating = allModules.length > 0
      ? allModules.filter((m) => m.totalReviews > 0).reduce((sum, m) => sum + m.averageRating, 0) /
        Math.max(1, allModules.filter((m) => m.totalReviews > 0).length)
      : 0;

    // Recent activity
    const recentActivity = await ctx.db
      .query("marketplaceActivity")
      .withIndex("by_created")
      .order("desc")
      .take(10);

    // Publishers count
    const publishers = await ctx.db
      .query("marketplacePublishers")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    return {
      stats: {
        totalModules: allModules.length,
        totalInstalls,
        averageRating: Math.round(avgRating * 10) / 10,
        totalPublishers: publishers.length,
      },
      featuredBanners: activeBanners,
      staffPicks,
      newAndNoteworthy: newModules,
      topRated,
      trending,
      categories: categoryWithCounts,
      recentActivity,
    };
  },
});

export const browseModules = query({
  args: {
    sessionToken: v.string(),
    category: v.optional(categoryValidator),
    search: v.optional(v.string()),
    pricingModel: v.optional(v.string()),
    minRating: v.optional(v.number()),
    compatiblePlan: v.optional(v.string()),
    sortBy: v.optional(v.union(
      v.literal("relevance"), v.literal("most_installed"),
      v.literal("highest_rated"), v.literal("newest"),
      v.literal("alphabetical"), v.literal("price_low"),
      v.literal("price_high")
    )),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    let modules;
    if (args.category) {
      modules = await ctx.db
        .query("marketplaceModules")
        .withIndex("by_category", (q) => q.eq("category", args.category!).eq("status", "published"))
        .collect();
    } else {
      modules = await ctx.db
        .query("marketplaceModules")
        .withIndex("by_status", (q) => q.eq("status", "published"))
        .collect();
    }

    // Apply filters
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      modules = modules.filter((m) =>
        m.name.toLowerCase().includes(searchLower) ||
        m.shortDescription.toLowerCase().includes(searchLower) ||
        m.tags.some((t) => t.toLowerCase().includes(searchLower)) ||
        m.publisherName.toLowerCase().includes(searchLower)
      );
    }

    if (args.pricingModel) {
      modules = modules.filter((m) => m.pricingModel === args.pricingModel);
    }

    if (args.minRating) {
      modules = modules.filter((m) => m.averageRating >= args.minRating!);
    }

    if (args.compatiblePlan) {
      modules = modules.filter((m) => m.compatiblePlans.includes(args.compatiblePlan!));
    }

    // Sort
    const sortBy = args.sortBy || "relevance";
    switch (sortBy) {
      case "most_installed":
        modules.sort((a, b) => b.totalInstalls - a.totalInstalls);
        break;
      case "highest_rated":
        modules.sort((a, b) => b.averageRating - a.averageRating);
        break;
      case "newest":
        modules.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));
        break;
      case "alphabetical":
        modules.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "price_low":
        modules.sort((a, b) => (a.priceCents || 0) - (b.priceCents || 0));
        break;
      case "price_high":
        modules.sort((a, b) => (b.priceCents || 0) - (a.priceCents || 0));
        break;
      default: // relevance - featured first, then by installs
        modules.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return b.totalInstalls - a.totalInstalls;
        });
    }

    const total = modules.length;
    const offset = args.offset || 0;
    const limit = args.limit || 24;
    modules = modules.slice(offset, offset + limit);

    return { modules, total, offset, limit };
  },
});

export const getModuleDetail = query({
  args: {
    sessionToken: v.string(),
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const mod = await ctx.db
      .query("marketplaceModules")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", args.moduleId))
      .first();
    if (!mod) throw new Error("Module not found");

    // Get publisher info
    const publisher = await ctx.db
      .query("marketplacePublishers")
      .withIndex("by_userId", (q) => q.eq("userId", mod.publisherId))
      .first();

    // Get version history
    const versions = await ctx.db
      .query("marketplaceModuleVersions")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .order("desc")
      .collect();

    // Get approved reviews
    const reviews = await ctx.db
      .query("marketplaceReviews")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId).eq("status", "approved"))
      .collect();

    // Get other modules by same publisher
    const otherModules = await ctx.db
      .query("marketplaceModules")
      .withIndex("by_publisher", (q) => q.eq("publisherId", mod.publisherId))
      .collect();
    const otherPublished = otherModules
      .filter((m) => m.moduleId !== args.moduleId && m.status === "published")
      .slice(0, 4);

    // Get install count by tenant
    const installations = await ctx.db
      .query("marketplaceInstallations")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .collect();
    const activeInstallations = installations.filter((i) => i.status === "active");

    return {
      module: mod,
      publisher: publisher ? {
        _id: publisher._id,
        legalName: publisher.legalName,
        verificationLevel: publisher.verificationLevel,
        totalModules: publisher.totalModules,
        averageRating: publisher.averageRating,
        contactEmail: publisher.contactEmail,
        website: publisher.website,
        logoUrl: publisher.logoUrl,
        bio: publisher.bio,
      } : null,
      versions,
      reviews: reviews.sort((a, b) => b.createdAt - a.createdAt),
      otherModulesByPublisher: otherPublished,
      installStats: {
        total: mod.totalInstalls,
        active: activeInstallations.length,
      },
    };
  },
});

// ── Installation Queries ──────────────────────────────────────────────

export const getTenantInstallations = query({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    let installations;
    if (args.status) {
      installations = await ctx.db
        .query("marketplaceInstallations")
        .withIndex("by_tenant_status", (q) => q.eq("tenantId", args.tenantId).eq("status", args.status as any))
        .collect();
    } else {
      installations = await ctx.db
        .query("marketplaceInstallations")
        .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
        .collect();
    }

    // Enrich with module info
    const enriched = await Promise.all(
      installations.map(async (inst) => {
        const mod = await ctx.db
          .query("marketplaceModules")
          .withIndex("by_moduleId", (q) => q.eq("moduleId", inst.moduleId))
          .first();
        return {
          ...inst,
          moduleName: mod?.name || "Unknown Module",
          moduleCategory: mod?.category,
          moduleVersion: mod?.version,
          moduleIcon: mod?.iconUrl,
          updateAvailable: mod ? mod.version !== inst.installedVersion : false,
          latestVersion: mod?.version,
        };
      })
    );

    return enriched;
  },
});

export const getAllInstallations = query({
  args: {
    sessionToken: v.string(),
    moduleId: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    let installations;
    if (args.moduleId) {
      installations = await ctx.db
        .query("marketplaceInstallations")
        .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId!))
        .collect();
    } else {
      installations = await ctx.db
        .query("marketplaceInstallations")
        .collect();
    }

    if (args.status) {
      installations = installations.filter((i) => i.status === args.status);
    }

    // Enrich with tenant and module names
    const enriched = await Promise.all(
      installations.slice(0, args.limit || 100).map(async (inst) => {
        const mod = await ctx.db
          .query("marketplaceModules")
          .withIndex("by_moduleId", (q) => q.eq("moduleId", inst.moduleId))
          .first();
        const tenant = await ctx.db
          .query("tenants")
          .withIndex("by_tenantId", (q) => q.eq("tenantId", inst.tenantId))
          .first();
        return {
          ...inst,
          moduleName: mod?.name || "Unknown",
          tenantName: tenant?.name || "Unknown",
        };
      })
    );

    return enriched;
  },
});

// ── Review Queries ────────────────────────────────────────────────────

export const getModuleReviews = query({
  args: {
    sessionToken: v.string(),
    moduleId: v.string(),
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const status = args.status || "approved";
    const reviews = await ctx.db
      .query("marketplaceReviews")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId).eq("status", status))
      .collect();

    return reviews.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getPendingReviews = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const pending = await ctx.db
      .query("marketplaceReviews")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Enrich with module names
    const enriched = await Promise.all(
      pending.map(async (r) => {
        const mod = await ctx.db
          .query("marketplaceModules")
          .withIndex("by_moduleId", (q) => q.eq("moduleId", r.moduleId))
          .first();
        return { ...r, moduleName: mod?.name || "Unknown" };
      })
    );

    return enriched.sort((a, b) => a.createdAt - b.createdAt);
  },
});

// ── Publisher Queries ─────────────────────────────────────────────────

export const getPublishers = query({
  args: {
    sessionToken: v.string(),
    verificationLevel: v.optional(v.union(v.literal("basic"), v.literal("verified"), v.literal("featured_partner"))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    let publishers;
    if (args.verificationLevel) {
      publishers = await ctx.db
        .query("marketplacePublishers")
        .withIndex("by_verification", (q) => q.eq("verificationLevel", args.verificationLevel!))
        .collect();
    } else if (args.isActive !== undefined) {
      publishers = await ctx.db
        .query("marketplacePublishers")
        .withIndex("by_active", (q) => q.eq("isActive", args.isActive!))
        .collect();
    } else {
      publishers = await ctx.db.query("marketplacePublishers").collect();
    }

    return publishers.sort((a, b) => b.totalInstalls - a.totalInstalls);
  },
});

export const getPublisherDetail = query({
  args: {
    sessionToken: v.string(),
    publisherId: v.id("marketplacePublishers"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const publisher = await ctx.db.get(args.publisherId);
    if (!publisher) throw new Error("Publisher not found");

    // Get publisher's modules
    const modules = await ctx.db
      .query("marketplaceModules")
      .withIndex("by_publisher", (q) => q.eq("publisherId", publisher.userId))
      .collect();

    // Get recent transactions
    const transactions = await ctx.db
      .query("marketplaceTransactions")
      .withIndex("by_publisher", (q) => q.eq("publisherId", publisher.userId))
      .order("desc")
      .take(20);

    // Get payouts
    const payouts = await ctx.db
      .query("marketplacePayouts")
      .withIndex("by_publisher", (q) => q.eq("publisherId", publisher.userId))
      .order("desc")
      .take(10);

    return {
      publisher,
      modules,
      transactions,
      payouts,
      stats: {
        totalModules: modules.length,
        publishedModules: modules.filter((m) => m.status === "published").length,
        totalInstalls: publisher.totalInstalls,
        totalEarningsCents: publisher.totalEarningsCents,
        pendingPayoutCents: publisher.pendingPayoutCents,
        averageRating: publisher.averageRating,
      },
    };
  },
});

// ── Admin Queries ─────────────────────────────────────────────────────

export const getMarketplaceOverview = query({
  args: {
    sessionToken: v.string(),
    timeRange: v.optional(v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"), v.literal("365d"))),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const allModules = await ctx.db.query("marketplaceModules").collect();
    const published = allModules.filter((m) => m.status === "published");
    const pending = allModules.filter((m) => m.status === "pending_review");
    const publishers = await ctx.db.query("marketplacePublishers").collect();
    const activePublishers = publishers.filter((p) => p.isActive);

    const installations = await ctx.db.query("marketplaceInstallations").collect();
    const activeInstalls = installations.filter((i) => i.status === "active");

    const pendingReviews = await ctx.db
      .query("marketplaceReviews")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const openDisputes = await ctx.db
      .query("marketplaceDisputes")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    const transactions = await ctx.db.query("marketplaceTransactions").collect();
    const completedTx = transactions.filter((t) => t.status === "completed");
    const totalRevenueCents = completedTx.reduce((sum, t) => sum + t.grossAmountCents, 0);
    const totalCommissionCents = completedTx.reduce((sum, t) => sum + t.commissionCents, 0);

    const categories = await ctx.db
      .query("marketplaceCategories")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const categoriesWithCounts = categories.map((cat) => ({
      ...cat,
      moduleCount: published.filter((m) => m.category === cat.slug).length,
      installCount: installations.filter((i) => {
        const mod = published.find((m) => m.moduleId === i.moduleId);
        return mod?.category === cat.slug;
      }).length,
    }));

    // Recent activity
    const recentActivity = await ctx.db
      .query("marketplaceActivity")
      .withIndex("by_created")
      .order("desc")
      .take(20);

    // Top modules by installs
    const topModules = [...published]
      .sort((a, b) => b.totalInstalls - a.totalInstalls)
      .slice(0, 5);

    return {
      overview: {
        totalModules: allModules.length,
        publishedModules: published.length,
        pendingReview: pending.length,
        totalPublishers: publishers.length,
        activePublishers: activePublishers.length,
        totalInstallations: installations.length,
        activeInstallations: activeInstalls.length,
        pendingReviews: pendingReviews.length,
        openDisputes: openDisputes.length,
        totalRevenueCents,
        totalCommissionCents,
      },
      categories: categoriesWithCounts.sort((a, b) => a.sortOrder - b.sortOrder),
      topModules,
      recentActivity,
    };
  },
});

export const getPendingModules = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const pending = await ctx.db
      .query("marketplaceModules")
      .withIndex("by_status", (q) => q.eq("status", "pending_review"))
      .collect();

    const enriched = await Promise.all(
      pending.map(async (mod) => {
        const publisher = await ctx.db
          .query("marketplacePublishers")
          .withIndex("by_userId", (q) => q.eq("userId", mod.publisherId))
          .first();
        return {
          ...mod,
          publisherVerification: publisher?.verificationLevel || "basic",
        };
      })
    );

    return enriched.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const getCategories = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const categories = await ctx.db
      .query("marketplaceCategories")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    return categories.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const getDisputes = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.union(v.literal("open"), v.literal("under_review"), v.literal("resolved"), v.literal("dismissed"))),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    let disputes;
    if (args.status) {
      disputes = await ctx.db
        .query("marketplaceDisputes")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      disputes = await ctx.db.query("marketplaceDisputes").collect();
    }

    const enriched = await Promise.all(
      disputes.map(async (d) => {
        const mod = await ctx.db
          .query("marketplaceModules")
          .withIndex("by_moduleId", (q) => q.eq("moduleId", d.moduleId))
          .first();
        return { ...d, moduleName: mod?.name || "Unknown" };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getTransactions = query({
  args: {
    sessionToken: v.string(),
    publisherId: v.optional(v.string()),
    moduleId: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    let transactions;
    if (args.publisherId) {
      transactions = await ctx.db
        .query("marketplaceTransactions")
        .withIndex("by_publisher", (q) => q.eq("publisherId", args.publisherId!))
        .order("desc")
        .collect();
    } else if (args.moduleId) {
      transactions = await ctx.db
        .query("marketplaceTransactions")
        .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId!))
        .order("desc")
        .collect();
    } else {
      transactions = await ctx.db
        .query("marketplaceTransactions")
        .collect();
    }

    if (args.status) {
      transactions = transactions.filter((t) => t.status === args.status);
    }

    return transactions.slice(0, args.limit || 50);
  },
});

export const getFeaturedPlacements = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const placements = await ctx.db.query("marketplaceFeatured").collect();
    return placements.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});
