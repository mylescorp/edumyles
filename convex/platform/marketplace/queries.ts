import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { ALL_MODULES, CORE_MODULE_IDS } from "../../modules/marketplace/moduleDefinitions";
import { TIER_MODULES } from "../../modules/marketplace/tierModules";

const categoryValidator = v.union(
  v.literal("academic_tools"), v.literal("communication"),
  v.literal("finance_fees"), v.literal("analytics_bi"),
  v.literal("content_packs"), v.literal("integrations"),
  v.literal("ai_automation"), v.literal("accessibility"),
  v.literal("administration"), v.literal("security_compliance")
);

function mapDefinitionCategory(category: string) {
  switch (category) {
    case "academics":
      return "academic_tools" as const;
    case "communications":
      return "communication" as const;
    case "finance":
      return "finance_fees" as const;
    case "analytics":
      return "analytics_bi" as const;
    case "integrations":
      return "integrations" as const;
    case "security":
      return "security_compliance" as const;
    case "administration":
    default:
      return "administration" as const;
  }
}

function buildBuiltinMarketplaceSummary(mod: (typeof ALL_MODULES)[number]) {
  return {
    _id: mod.moduleId as any,
    _creationTime: 0,
    moduleId: mod.moduleId,
    name: mod.name,
    description: mod.description,
    shortDescription: mod.description,
    fullDescription: mod.description,
    category: mapDefinitionCategory(mod.category),
    tier: mod.tier,
    isCore: mod.isCore,
    iconName: mod.iconName,
    version: mod.version,
    features: mod.features,
    pricingModel: mod.pricing.monthly > 0 ? "monthly" : "free",
    priceCents: mod.pricing.monthly > 0 ? mod.pricing.monthly * 100 : 0,
    currency: mod.pricing.currency || "USD",
    status: "published" as const,
    publisherId: "edumyles",
    publisherName: "EduMyles",
    isFeatured: mod.isCore,
    isVerified: true,
    isSecurityReviewed: mod.isCore,
    isGdprCompliant: false,
    totalInstalls: 0,
    activeInstalls: 0,
    totalReviews: 0,
    averageRating: 0,
    compatiblePlans: Object.entries(TIER_MODULES)
      .filter(([, mods]) => mods.includes(mod.moduleId) || CORE_MODULE_IDS.includes(mod.moduleId))
      .map(([tier]) => tier),
    tags: mod.features.slice(0, 5),
    createdAt: 0,
    updatedAt: 0,
    publishedAt: 0,
  };
}

function buildBuiltinInstallationSummary(
  mod: ReturnType<typeof buildBuiltinMarketplaceSummary>,
  installation: any,
  tenantName?: string
) {
  return {
    ...installation,
    source: "builtin" as const,
    moduleName: mod.name,
    moduleCategory: mod.category,
    moduleVersion: mod.version,
    moduleIcon: mod.iconName,
    latestVersion: mod.version,
    updateAvailable: mod.version !== installation.installedVersion,
    tenantName: tenantName || installation.tenantName,
  };
}


function mergeWithBuiltinModules(modules: any[]) {
  const merged = new Map<string, any>();

  for (const mod of ALL_MODULES) {
    merged.set(mod.moduleId, buildBuiltinMarketplaceSummary(mod));
  }

  for (const mod of modules) {
    merged.set(mod.moduleId, mod);
  }

  return Array.from(merged.values());
}

function buildFallbackMarketplaceModule(moduleId: string) {
  const mod = ALL_MODULES.find((entry) => entry.moduleId === moduleId);
  if (!mod) return null;

  return {
    module: {
      ...buildBuiltinMarketplaceSummary(mod),
      subCategory: undefined,
      iconUrl: undefined,
      screenshots: [],
      demoVideoUrl: undefined,
      featureHighlights: mod.features,
      edumylesMinVersion: undefined,
      edumylesMaxVersion: undefined,
      permissions: [],
      supportsOffline: false,
      dataResidency: [],
      trialDays: undefined,
      pricingTiers: undefined,
      systemRequirements: undefined,
      supportUrl: undefined,
      documentationUrl: mod.documentation,
      privacyPolicyUrl: undefined,
    },
    publisher: {
      _id: "edumyles" as any,
      legalName: "EduMyles",
      verificationLevel: "featured_partner",
      totalModules: ALL_MODULES.length,
      averageRating: 0,
      contactEmail: mod.support.email,
      website: mod.documentation,
      logoUrl: undefined,
      bio: "Built-in EduMyles modules managed by the platform team.",
    },
    versions: [
      {
        _id: `${mod.moduleId}-${mod.version}` as any,
        _creationTime: 0,
        moduleId: mod.moduleId,
        version: mod.version,
        releaseNotes: "Built-in EduMyles module",
        status: "published",
        createdAt: 0,
        publishedAt: 0,
      },
    ],
    reviews: [],
    otherModulesByPublisher: ALL_MODULES.filter((entry) => entry.moduleId !== mod.moduleId)
      .slice(0, 4)
      .map((entry) => ({
        moduleId: entry.moduleId,
        name: entry.name,
        shortDescription: entry.description,
        category: mapDefinitionCategory(entry.category),
        averageRating: 0,
        totalReviews: 0,
        totalInstalls: 0,
      })),
    installStats: {
      total: 0,
      active: 0,
    },
  };
}

// ── Storefront Queries ────────────────────────────────────────────────

export const getMarketplaceHome = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const now = Date.now();

    // Helper to safely query tables that may not exist yet
    async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
      try {
        return await fn();
      } catch {
        return fallback;
      }
    }

    // Get published modules
    const allModules = await safeQuery(
      () => ctx.db.query("marketplaceModules")
        .withIndex("by_status", (q) => q.eq("status", "published"))
        .collect(),
      []
    );

    // Featured banners
    const featuredPlacements = await safeQuery(
      () => ctx.db.query("marketplaceFeatured")
        .withIndex("by_type", (q) => q.eq("type", "banner").eq("isActive", true))
        .collect(),
      []
    );
    const activeBanners = featuredPlacements.filter(
      (f) => f.startDate <= now && f.endDate >= now
    );

    // Staff picks
    const staffPicks = await safeQuery(
      () => ctx.db.query("marketplaceFeatured")
        .withIndex("by_type", (q) => q.eq("type", "staff_pick").eq("isActive", true))
        .collect(),
      []
    );

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
    const categories = await safeQuery(
      () => ctx.db.query("marketplaceCategories")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect(),
      []
    );

    const mergedModules = mergeWithBuiltinModules(allModules);

    // Count modules per category
    const categoryWithCounts = categories
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((cat) => ({
        ...cat,
        moduleCount: mergedModules.filter((m) => m.category === cat.slug).length,
      }));

    // Stats
    const totalInstalls = mergedModules.reduce((sum, m) => sum + (m.totalInstalls || 0), 0);
    const ratedModules = mergedModules.filter((m) => (m.totalReviews || 0) > 0);
    const avgRating = mergedModules.length > 0
      ? ratedModules.reduce((sum, m) => sum + (m.averageRating || 0), 0) /
        Math.max(1, ratedModules.length)
      : 0;

    // Recent activity
    const recentActivity = await safeQuery(
      () => ctx.db.query("marketplaceActivity")
        .withIndex("by_created")
        .order("desc")
        .take(10),
      []
    );

    // Publishers count
    const publishers = await safeQuery(
      () => ctx.db.query("marketplacePublishers")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect(),
      []
    );

    return {
      stats: {
        totalModules: mergedModules.length,
        totalInstalls,
        averageRating: Math.round(avgRating * 10) / 10,
        totalPublishers: Math.max(1, publishers.length),
      },
      featuredBanners: activeBanners,
      staffPicks,
      newAndNoteworthy: newModules.length > 0
        ? newModules
        : mergedModules.filter((m) => m.isFeatured).slice(0, 8),
      topRated,
      trending: trending.length > 0 ? trending : mergedModules.slice(0, 8),
      categories: categoryWithCounts.length > 0
        ? categoryWithCounts
        : [
            ...new Map(
              mergedModules.map((m) => [
                m.category,
                {
                  slug: m.category,
                  name: m.category.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
                  moduleCount: mergedModules.filter((entry) => entry.category === m.category).length,
                },
              ])
            ).values(),
          ],
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

    let modules: any[];
    try {
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
    } catch {
      modules = [];
    }

    modules = mergeWithBuiltinModules(modules);

    // Apply filters
    if (args.category) {
      modules = modules.filter((m) => m.category === args.category);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      modules = modules.filter((m) =>
        m.name.toLowerCase().includes(searchLower) ||
        m.shortDescription.toLowerCase().includes(searchLower) ||
        m.tags.some((t: string) => t.toLowerCase().includes(searchLower)) ||
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
    if (!mod) {
      const fallback = buildFallbackMarketplaceModule(args.moduleId);
      if (fallback) {
        return fallback;
      }
      throw new Error("Module not found");
    }

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

    // Enrich with marketplace module info
    const marketplaceInstallations = await Promise.all(
      installations.map(async (inst) => {
        const mod = await ctx.db
          .query("marketplaceModules")
          .withIndex("by_moduleId", (q) => q.eq("moduleId", inst.moduleId))
          .first();
        return {
          ...inst,
          source: "marketplace" as const,
          moduleName: mod?.name || "Unknown Module",
          moduleCategory: mod?.category,
          moduleVersion: mod?.version,
          moduleIcon: mod?.iconUrl,
          updateAvailable: mod ? mod.version !== inst.installedVersion : false,
          latestVersion: mod?.version,
        };
      })
    );

    let builtinInstallations: any[] = [];
    try {
      const installedModules = await ctx.db
        .query("installedModules")
        .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
        .collect();

      builtinInstallations = installedModules
        .filter((inst) => !args.status || inst.status === args.status)
        .map((inst) => {
          const builtin = ALL_MODULES.find((entry) => entry.moduleId === inst.moduleId);
          const summary = builtin ? buildBuiltinMarketplaceSummary(builtin) : null;
          return summary
            ? buildBuiltinInstallationSummary(summary, {
                ...inst,
                installedVersion: summary.version,
                assignedRoles: [],
                configuration: inst.config,
              })
            : {
                ...inst,
                source: "builtin" as const,
                moduleName: inst.moduleId,
                moduleCategory: undefined,
                moduleVersion: undefined,
                moduleIcon: undefined,
                latestVersion: undefined,
                updateAvailable: false,
              };
        });
    } catch {
      builtinInstallations = [];
    }

    return [...marketplaceInstallations, ...builtinInstallations].sort(
      (a, b) => (b.installedAt || 0) - (a.installedAt || 0)
    );
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
    const marketplaceInstallations = await Promise.all(
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
          source: "marketplace" as const,
          moduleName: mod?.name || "Unknown",
          tenantName: tenant?.name || "Unknown",
        };
      })
    );

    let builtinInstallations: any[] = [];
    try {
      let installedModules = await ctx.db.query("installedModules").collect();
      if (args.moduleId) {
        installedModules = installedModules.filter((inst) => inst.moduleId === args.moduleId);
      }
      if (args.status) {
        installedModules = installedModules.filter((inst) => inst.status === args.status);
      }

      builtinInstallations = await Promise.all(
        installedModules.slice(0, args.limit || 100).map(async (inst) => {
          const builtin = ALL_MODULES.find((entry) => entry.moduleId === inst.moduleId);
          const summary = builtin ? buildBuiltinMarketplaceSummary(builtin) : null;
          const tenant = await ctx.db
            .query("tenants")
            .withIndex("by_tenantId", (q) => q.eq("tenantId", inst.tenantId))
            .first();
          return summary
            ? buildBuiltinInstallationSummary(
                summary,
                {
                  ...inst,
                  installedVersion: summary.version,
                  assignedRoles: [],
                  configuration: inst.config,
                },
                tenant?.name || "Unknown"
              )
            : {
                ...inst,
                source: "builtin" as const,
                moduleName: inst.moduleId,
                tenantName: tenant?.name || "Unknown",
              };
        })
      );
    } catch {
      builtinInstallations = [];
    }

    return [...marketplaceInstallations, ...builtinInstallations]
      .sort((a, b) => (b.installedAt || 0) - (a.installedAt || 0))
      .slice(0, args.limit || 100);
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

    // Helper to safely query tables
    async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
      try { return await fn(); } catch { return fallback; }
    }

    const allModules = await safeQuery(() => ctx.db.query("marketplaceModules").collect(), []);
    const mergedModules = mergeWithBuiltinModules(allModules);
    const published = allModules.filter((m: any) => m.status === "published");
    const pending = allModules.filter((m: any) => m.status === "pending_review");
    const publishers = await safeQuery(() => ctx.db.query("marketplacePublishers").collect(), []);
    const activePublishers = publishers.filter((p: any) => p.isActive);

    const installations = await safeQuery(() => ctx.db.query("marketplaceInstallations").collect(), []);
    const builtinInstallations = await safeQuery(() => ctx.db.query("installedModules").collect(), []);
    const activeInstalls = installations.filter((i: any) => i.status === "active");
    const activeBuiltinInstalls = builtinInstallations.filter((i: any) => i.status === "active");

    const pendingReviews = await safeQuery(
      () => ctx.db.query("marketplaceReviews")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect(),
      []
    );

    const openDisputes = await safeQuery(
      () => ctx.db.query("marketplaceDisputes")
        .withIndex("by_status", (q) => q.eq("status", "open"))
        .collect(),
      []
    );

    const transactions = await safeQuery(() => ctx.db.query("marketplaceTransactions").collect(), []);
    const completedTx = transactions.filter((t: any) => t.status === "completed");
    const totalRevenueCents = completedTx.reduce((sum: number, t: any) => sum + t.grossAmountCents, 0);
    const totalCommissionCents = completedTx.reduce((sum: number, t: any) => sum + t.commissionCents, 0);

    const categories = await safeQuery(
      () => ctx.db.query("marketplaceCategories")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect(),
      []
    );

    const categoriesWithCounts = categories.map((cat: any) => ({
      ...cat,
      moduleCount: mergedModules.filter((m: any) => m.category === cat.slug).length,
      installCount: [...installations, ...builtinInstallations].filter((i: any) => {
        const mod = mergedModules.find((m: any) => m.moduleId === i.moduleId);
        return mod?.category === cat.slug;
      }).length,
    }));

    // Recent activity
    const recentActivity = await safeQuery(
      () => ctx.db.query("marketplaceActivity")
        .withIndex("by_created")
        .order("desc")
        .take(20),
      []
    );

    // Top modules by installs
    const builtinInstallCounts = builtinInstallations.reduce((acc: Record<string, number>, inst: any) => {
      acc[inst.moduleId] = (acc[inst.moduleId] || 0) + 1;
      return acc;
    }, {});

    const topModules = mergedModules
      .map((mod: any) => ({
        ...mod,
        totalInstalls: Math.max(mod.totalInstalls || 0, builtinInstallCounts[mod.moduleId] || 0),
      }))
      .sort((a: any, b: any) => b.totalInstalls - a.totalInstalls)
      .slice(0, 5);

    return {
      overview: {
        totalModules: mergedModules.length,
        publishedModules: mergedModules.length,
        pendingReview: pending.length,
        totalPublishers: Math.max(1, publishers.length),
        activePublishers: Math.max(1, activePublishers.length),
        totalInstallations: installations.length + builtinInstallations.length,
        activeInstallations: activeInstalls.length + activeBuiltinInstalls.length,
        pendingReviews: pendingReviews.length,
        openDisputes: openDisputes.length,
        totalRevenueCents,
        totalCommissionCents,
      },
      categories: categoriesWithCounts.sort((a: any, b: any) => a.sortOrder - b.sortOrder),
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
