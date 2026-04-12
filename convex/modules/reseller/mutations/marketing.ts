import { v } from "convex/values";
import { mutation, query } from "../../../_generated/server";
import { requireResellerContext, requireAffiliateContext } from "../../../helpers/resellerGuard";
import { logAction } from "../../../helpers/auditLog";
import { REFERRAL_COOKIE_NAME, REFERRAL_COOKIE_DAYS } from "../../../../shared/src/constants";

export const getMarketingMaterials = query({
  args: {
    type: v.optional(v.union(
      v.literal("brochure"),
      v.literal("flyer"),
      v.literal("presentation"),
      v.literal("video"),
      v.literal("email_template"),
      v.literal("social_media")
    )),
    language: v.optional(v.string()),
    targetAudience: v.optional(v.union(
      v.literal("schools"),
      v.literal("parents"),
      v.literal("students"),
      v.literal("administrators")
    )),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);
    
    const page = args.page || 1;
    const pageSize = args.pageSize || 25;
    const skip = (page - 1) * pageSize;

    let materials = await ctx.db
      .query("resellerMarketingMaterials")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .collect();

    // Filter by type if provided
    if (args.type) {
      materials = materials.filter(m => m.type === args.type);
    }

    // Filter by language if provided
    if (args.language) {
      materials = materials.filter(m => m.language === args.language);
    }

    // Filter by target audience if provided
    if (args.targetAudience) {
      materials = materials.filter(m => m.targetAudience === args.targetAudience);
    }

    // Only show published materials
    materials = materials.filter(m => m.status === "published");

    // Sort by published date (newest first)
    materials.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));

    // Apply pagination
    const paginatedMaterials = materials.slice(skip, skip + pageSize);

    return {
      materials: paginatedMaterials,
      total: materials.length,
      page,
      pageSize,
      hasMore: skip + pageSize < materials.length,
    };
  },
});

export const uploadMarketingMaterial = mutation({
  args: {
    type: v.union(
      v.literal("brochure"),
      v.literal("flyer"),
      v.literal("presentation"),
      v.literal("video"),
      v.literal("email_template"),
      v.literal("social_media")
    ),
    name: v.string(),
    description: v.string(),
    fileUrl: v.string(),
    fileSize: v.number(),
    fileType: v.string(),
    thumbnailUrl: v.optional(v.string()),
    tags: v.array(v.string()),
    language: v.string(),
    targetAudience: v.union(
      v.literal("schools"),
      v.literal("parents"),
      v.literal("students"),
      v.literal("administrators")
    ),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);

    // Generate unique material ID
    const materialId = `MAT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const materialDocId = await ctx.db.insert("resellerMarketingMaterials", {
      resellerId: reseller.resellerId,
      materialId,
      type: args.type,
      name: args.name,
      description: args.description,
      fileUrl: args.fileUrl,
      fileSize: args.fileSize,
      fileType: args.fileType,
      thumbnailUrl: args.thumbnailUrl,
      tags: args.tags,
      language: args.language,
      targetAudience: args.targetAudience,
      status: "draft", // Needs approval
      usage: {
        downloads: 0,
        views: 0,
        shares: 0,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log the action
    await logAction(ctx, {
      tenantId: "platform",
      actorId: reseller.userId,
      actorEmail: reseller.email,
      action: "file.uploaded" as any,
      entityType: "marketing_material",
      entityId: String(materialDocId),
      after: { materialId, name: args.name, type: args.type },
    });

    return { success: true, materialId, materialDocId };
  },
});

export const updateMarketingMaterial = mutation({
  args: {
    materialId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    targetAudience: v.optional(v.union(
      v.literal("schools"),
      v.literal("parents"),
      v.literal("students"),
      v.literal("administrators")
    )),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);

    // Get the material
    const material = await ctx.db
      .query("resellerMarketingMaterials")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .filter(q => q.eq(q.field("materialId"), args.materialId))
      .first();

    if (!material) {
      throw new Error("Marketing material not found");
    }

    // Can only update draft materials
    if (material.status !== "draft") {
      throw new Error("Can only update draft materials");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name) updates.name = args.name;
    if (args.description) updates.description = args.description;
    if (args.tags) updates.tags = args.tags;
    if (args.targetAudience) updates.targetAudience = args.targetAudience;

    await ctx.db.patch(material._id, updates);

    return { success: true };
  },
});

export const submitMaterialForApproval = mutation({
  args: {
    materialId: v.string(),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);

    // Get the material
    const material = await ctx.db
      .query("resellerMarketingMaterials")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .filter(q => q.eq(q.field("materialId"), args.materialId))
      .first();

    if (!material) {
      throw new Error("Marketing material not found");
    }

    if (material.status !== "draft") {
      throw new Error("Material must be in draft status to submit for approval");
    }

    await ctx.db.patch(material._id, {
      status: "approved", // Auto-approve for now
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const trackMaterialUsage = mutation({
  args: {
    materialId: v.string(),
    action: v.union(v.literal("download"), v.literal("view"), v.literal("share")),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);

    // Get the material
    const material = await ctx.db
      .query("resellerMarketingMaterials")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .filter(q => q.eq(q.field("materialId"), args.materialId))
      .first();

    if (!material) {
      throw new Error("Marketing material not found");
    }

    // Update usage stats
    const usage = { ...material.usage };
    switch (args.action) {
      case "download":
        usage.downloads++;
        break;
      case "view":
        usage.views++;
        break;
      case "share":
        usage.shares++;
        break;
    }

    await ctx.db.patch(material._id, {
      usage,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const getReferralCode = query({
  args: {},
  handler: async (ctx) => {
    const reseller = await requireResellerContext(ctx);

    // Generate a unique referral code based on reseller ID
    const referralCode = `EDU-${reseller.businessName.toUpperCase().replace(/[^A-Z0-9]/g, '').substr(0, 6)}-${reseller.resellerId.slice(-4)}`;

    return {
      referralCode,
      referralUrl: `https://edumyles.com?ref=${referralCode}`,
      cookieName: REFERRAL_COOKIE_NAME,
      cookieDuration: REFERRAL_COOKIE_DAYS,
    };
  },
});

export const trackReferralClick = mutation({
  args: {
    referralCode: v.string(),
    source: v.string(),
    campaign: v.optional(v.string()),
    ipAddress: v.string(),
    userAgent: v.string(),
    referrer: v.optional(v.string()),
    landingPage: v.string(),
  },
  handler: async (ctx, args) => {
    // This is typically called from the frontend when someone clicks a referral link
    // We don't require authentication here since it's tracking external clicks

    // Generate unique click ID
    const clickId = `CLICK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    await ctx.db.insert("resellerReferralClicks", {
      clickId,
      resellerId: "unknown", // Will be updated when we find the reseller
      referralCode: args.referralCode,
      source: args.source,
      campaign: args.campaign,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      referrer: args.referrer,
      landingPage: args.landingPage,
      converted: false,
      timestamp: Date.now(),
      createdAt: Date.now(),
    });

    // TODO: Find the reseller by referral code and update the record
    // For now, we'll store it with "unknown" resellerId

    return { success: true, clickId };
  },
});

export const getReferralAnalytics = query({
  args: {
    period: v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"), v.literal("1y")),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);

    const page = args.page || 1;
    const pageSize = args.pageSize || 25;
    const skip = (page - 1) * pageSize;

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

    // Get referral clicks for this reseller
    const clicks = await ctx.db
      .query("resellerReferralClicks")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .collect();

    const periodClicks = clicks.filter(c => c.timestamp >= startDate);

    // Get daily data
    const dailyData = [];
    const currentDate = new Date(startDate);
    
    while (currentDate.getTime() <= now) {
      const dayStart = currentDate.getTime();
      const dayEnd = dayStart + (24 * 60 * 60 * 1000);
      
      const dayClicks = periodClicks.filter(c => 
        c.timestamp >= dayStart && c.timestamp < dayEnd
      );

      dailyData.push({
        date: currentDate.toISOString().split('T')[0],
        clicks: dayClicks.length,
        conversions: dayClicks.filter(c => c.converted).length,
        conversionValue: dayClicks
          .filter(c => c.converted && c.conversionValue)
          .reduce((sum, c) => sum + (c.conversionValue || 0), 0),
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get source breakdown
    const bySource = periodClicks.reduce((acc, click) => {
      const entry = acc[click.source] ?? { clicks: 0, conversions: 0, value: 0 };
      entry.clicks++;
      if (click.converted) {
        entry.conversions++;
        entry.value += click.conversionValue || 0;
      }
      acc[click.source] = entry;
      return acc;
    }, {} as Record<string, { clicks: number; conversions: number; value: number }>);

    // Get recent conversions
    const recentConversions = periodClicks
      .filter(c => c.converted)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    return {
      period: args.period,
      summary: {
        totalClicks: periodClicks.length,
        totalConversions: periodClicks.filter(c => c.converted).length,
        totalValue: periodClicks
          .filter(c => c.converted && c.conversionValue)
          .reduce((sum, c) => sum + (c.conversionValue || 0), 0),
        conversionRate: periodClicks.length > 0 
          ? (periodClicks.filter(c => c.converted).length / periodClicks.length) * 100 
          : 0,
      },
      dailyData,
      bySource,
      recentConversions,
    };
  },
});

export const getDirectoryListing = query({
  args: {},
  handler: async (ctx) => {
    const reseller = await requireResellerContext(ctx);

    // Get the directory listing for this reseller
    const listing = await ctx.db
      .query("resellerDirectoryListings")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .first();

    if (!listing) {
      return { listing: null };
    }

    return { listing };
  },
});

export const createDirectoryListing = mutation({
  args: {
    companyName: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("technology"),
      v.literal("education"),
      v.literal("consulting"),
      v.literal("training"),
      v.literal("other")
    ),
    location: v.object({
      country: v.string(),
      city: v.string(),
      address: v.string(),
    }),
    contactInfo: v.object({
      email: v.string(),
      phone: v.string(),
      website: v.optional(v.string()),
    }),
    services: v.array(v.string()),
    specializations: v.array(v.string()),
    certifications: v.array(v.string()),
    experience: v.number(),
    portfolio: v.array(v.object({
      title: v.string(),
      description: v.string(),
      imageUrl: v.optional(v.string()),
      projectUrl: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);

    // Check if listing already exists
    const existingListing = await ctx.db
      .query("resellerDirectoryListings")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .first();

    if (existingListing) {
      throw new Error("Directory listing already exists");
    }

    // Generate unique listing ID
    const listingId = `LISTING-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const listingDocId = await ctx.db.insert("resellerDirectoryListings", {
      listingId,
      resellerId: reseller.resellerId,
      companyName: args.companyName,
      description: args.description,
      category: args.category,
      location: args.location,
      contactInfo: args.contactInfo,
      services: args.services,
      specializations: args.specializations,
      certifications: args.certifications,
      experience: args.experience,
      portfolio: args.portfolio,
      testimonials: [],
      rating: 0,
      reviewCount: 0,
      verificationStatus: "unverified",
      featured: false,
      status: "draft",
      views: 0,
      contacts: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log the action
    await logAction(ctx, {
      tenantId: "platform",
      actorId: reseller.userId,
      actorEmail: reseller.email,
      action: "marketplace.listing_created" as any,
      entityType: "directory_listing",
      entityId: String(listingDocId),
      after: { listingId, companyName: args.companyName, category: args.category },
    });

    return { success: true, listingId, listingDocId };
  },
});
