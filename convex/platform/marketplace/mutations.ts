import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

const categoryValidator = v.union(
  v.literal("academic_tools"), v.literal("communication"),
  v.literal("finance_fees"), v.literal("analytics_bi"),
  v.literal("content_packs"), v.literal("integrations"),
  v.literal("ai_automation"), v.literal("accessibility"),
  v.literal("administration"), v.literal("security_compliance")
);

const pricingModelValidator = v.union(
  v.literal("free"), v.literal("freemium"), v.literal("one_time"),
  v.literal("monthly"), v.literal("annual"), v.literal("per_student"),
  v.literal("per_user"), v.literal("free_trial")
);

// ── Module CRUD ───────────────────────────────────────────────────────

export const createModule = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    shortDescription: v.string(),
    fullDescription: v.string(),
    category: categoryValidator,
    subCategory: v.optional(v.string()),
    tags: v.array(v.string()),
    iconUrl: v.optional(v.string()),
    screenshots: v.array(v.string()),
    demoVideoUrl: v.optional(v.string()),
    featureHighlights: v.array(v.string()),
    version: v.string(),
    edumylesMinVersion: v.optional(v.string()),
    permissions: v.array(v.string()),
    supportsOffline: v.boolean(),
    dataResidency: v.array(v.string()),
    pricingModel: pricingModelValidator,
    priceCents: v.optional(v.number()),
    currency: v.optional(v.string()),
    trialDays: v.optional(v.number()),
    pricingTiers: v.optional(v.array(v.object({
      name: v.string(),
      priceCents: v.number(),
      features: v.array(v.string()),
    }))),
    compatiblePlans: v.array(v.string()),
    systemRequirements: v.optional(v.string()),
    publisherId: v.string(),
    supportUrl: v.optional(v.string()),
    documentationUrl: v.optional(v.string()),
    privacyPolicyUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const moduleId = crypto.randomUUID();
    const now = Date.now();

    // Fetch publisher name
    const publisher = await ctx.db
      .query("marketplacePublishers")
      .withIndex("by_userId", (q) => q.eq("userId", args.publisherId))
      .first();

    const id = await ctx.db.insert("marketplaceModules", {
      moduleId,
      name: args.name,
      shortDescription: args.shortDescription,
      fullDescription: args.fullDescription,
      category: args.category,
      subCategory: args.subCategory,
      tags: args.tags,
      iconUrl: args.iconUrl,
      screenshots: args.screenshots,
      demoVideoUrl: args.demoVideoUrl,
      featureHighlights: args.featureHighlights,
      version: args.version,
      edumylesMinVersion: args.edumylesMinVersion,
      edumylesMaxVersion: undefined,
      permissions: args.permissions,
      supportsOffline: args.supportsOffline,
      dataResidency: args.dataResidency,
      pricingModel: args.pricingModel,
      priceCents: args.priceCents,
      currency: args.currency || "KES",
      trialDays: args.trialDays,
      pricingTiers: args.pricingTiers,
      compatiblePlans: args.compatiblePlans,
      systemRequirements: args.systemRequirements,
      publisherId: args.publisherId,
      publisherName: publisher?.legalName || "Unknown Publisher",
      supportUrl: args.supportUrl,
      documentationUrl: args.documentationUrl,
      privacyPolicyUrl: args.privacyPolicyUrl,
      totalInstalls: 0,
      activeInstalls: 0,
      averageRating: 0,
      totalReviews: 0,
      status: "draft",
      isFeatured: false,
      isVerified: false,
      isSecurityReviewed: false,
      isGdprCompliant: false,
      createdAt: now,
      updatedAt: now,
    });

    // Create initial version entry
    await ctx.db.insert("marketplaceModuleVersions", {
      moduleId,
      version: args.version,
      releaseNotes: "Initial release",
      status: "draft",
      createdAt: now,
    });

    // Log activity
    await ctx.db.insert("marketplaceActivity", {
      type: "submission",
      moduleId,
      moduleName: args.name,
      publisherId: args.publisherId,
      actorId: session.userId,
      actorEmail: session.email,
      createdAt: now,
    });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "marketplace.module_submitted",
      entityType: "marketplace_module",
      entityId: moduleId,
      after: { name: args.name, category: args.category, version: args.version },
    });

    return { success: true, moduleId, _id: id };
  },
});

export const updateModule = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.string(),
    name: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    fullDescription: v.optional(v.string()),
    category: v.optional(categoryValidator),
    subCategory: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    iconUrl: v.optional(v.string()),
    screenshots: v.optional(v.array(v.string())),
    demoVideoUrl: v.optional(v.string()),
    featureHighlights: v.optional(v.array(v.string())),
    permissions: v.optional(v.array(v.string())),
    supportsOffline: v.optional(v.boolean()),
    pricingModel: v.optional(pricingModelValidator),
    priceCents: v.optional(v.number()),
    currency: v.optional(v.string()),
    trialDays: v.optional(v.number()),
    pricingTiers: v.optional(v.array(v.object({
      name: v.string(),
      priceCents: v.number(),
      features: v.array(v.string()),
    }))),
    compatiblePlans: v.optional(v.array(v.string())),
    systemRequirements: v.optional(v.string()),
    supportUrl: v.optional(v.string()),
    documentationUrl: v.optional(v.string()),
    privacyPolicyUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const mod = await ctx.db
      .query("marketplaceModules")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", args.moduleId))
      .first();
    if (!mod) throw new Error("Module not found");

    const { sessionToken, moduleId, ...updates } = args;
    const filtered: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) filtered[key] = value;
    }
    filtered.updatedAt = Date.now();

    await ctx.db.patch(mod._id, filtered);
    return { success: true };
  },
});

// ── Module Lifecycle ──────────────────────────────────────────────────

export const submitModuleForReview = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const mod = await ctx.db
      .query("marketplaceModules")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", args.moduleId))
      .first();
    if (!mod) throw new Error("Module not found");
    if (mod.status !== "draft" && mod.status !== "rejected") {
      throw new Error("Module can only be submitted from draft or rejected state");
    }

    await ctx.db.patch(mod._id, {
      status: "pending_review",
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "marketplace.module_submitted",
      entityType: "marketplace_module",
      entityId: args.moduleId,
    });

    return { success: true };
  },
});

export const reviewModule = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.string(),
    decision: v.union(v.literal("approved"), v.literal("rejected"), v.literal("requires_changes")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const mod = await ctx.db
      .query("marketplaceModules")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", args.moduleId))
      .first();
    if (!mod) throw new Error("Module not found");

    const now = Date.now();
    const newStatus = args.decision === "requires_changes" ? "rejected" : args.decision;

    await ctx.db.patch(mod._id, {
      status: newStatus,
      reviewNotes: args.notes,
      reviewedBy: session.userId,
      reviewedAt: now,
      updatedAt: now,
    });

    const action = args.decision === "approved"
      ? "marketplace.module_approved" as const
      : "marketplace.module_rejected" as const;

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action,
      entityType: "marketplace_module",
      entityId: args.moduleId,
      after: { decision: args.decision, notes: args.notes },
    });

    await ctx.db.insert("marketplaceActivity", {
      type: args.decision === "approved" ? "approval" : "rejection",
      moduleId: args.moduleId,
      moduleName: mod.name,
      publisherId: mod.publisherId,
      actorId: session.userId,
      actorEmail: session.email,
      details: { notes: args.notes },
      createdAt: now,
    });

    return { success: true };
  },
});

export const publishModule = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const mod = await ctx.db
      .query("marketplaceModules")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", args.moduleId))
      .first();
    if (!mod) throw new Error("Module not found");
    if (mod.status !== "approved") throw new Error("Only approved modules can be published");

    const now = Date.now();
    await ctx.db.patch(mod._id, {
      status: "published",
      publishedAt: now,
      updatedAt: now,
    });

    // Update version status too
    const version = await ctx.db
      .query("marketplaceModuleVersions")
      .withIndex("by_module_version", (q) => q.eq("moduleId", args.moduleId).eq("version", mod.version))
      .first();
    if (version) {
      await ctx.db.patch(version._id, { status: "published", publishedAt: now });
    }

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "marketplace.module_published",
      entityType: "marketplace_module",
      entityId: args.moduleId,
    });

    return { success: true };
  },
});

export const suspendModule = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const mod = await ctx.db
      .query("marketplaceModules")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", args.moduleId))
      .first();
    if (!mod) throw new Error("Module not found");

    await ctx.db.patch(mod._id, {
      status: "suspended",
      reviewNotes: args.reason,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "marketplace.module_suspended",
      entityType: "marketplace_module",
      entityId: args.moduleId,
      after: { reason: args.reason },
    });

    await ctx.db.insert("marketplaceActivity", {
      type: "suspension",
      moduleId: args.moduleId,
      moduleName: mod.name,
      actorId: session.userId,
      actorEmail: session.email,
      details: { reason: args.reason },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const deprecateModule = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.string(),
    notice: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const mod = await ctx.db
      .query("marketplaceModules")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", args.moduleId))
      .first();
    if (!mod) throw new Error("Module not found");

    await ctx.db.patch(mod._id, {
      status: "deprecated",
      deprecatedAt: Date.now(),
      deprecationNotice: args.notice,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "marketplace.module_deprecated",
      entityType: "marketplace_module",
      entityId: args.moduleId,
    });

    return { success: true };
  },
});

// ── Installation ──────────────────────────────────────────────────────

export const installModule = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    moduleId: v.string(),
    configuration: v.optional(v.any()),
    assignedRoles: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const mod = await ctx.db
      .query("marketplaceModules")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", args.moduleId))
      .first();
    if (!mod) throw new Error("Module not found");
    if (mod.status !== "published") throw new Error("Module is not available for installation");

    // Check if already installed
    const existing = await ctx.db
      .query("marketplaceInstallations")
      .withIndex("by_tenant_module", (q) => q.eq("tenantId", args.tenantId).eq("moduleId", args.moduleId))
      .first();
    if (existing && existing.status !== "uninstalled") {
      throw new Error("Module is already installed for this tenant");
    }

    const now = Date.now();

    // Calculate trial/billing
    let trialEndsAt: number | undefined;
    let nextBillingAt: number | undefined;
    const isTrialUsed = existing?.isTrialUsed || false;

    if (mod.pricingModel === "free_trial" && !isTrialUsed && mod.trialDays) {
      trialEndsAt = now + mod.trialDays * 24 * 60 * 60 * 1000;
    } else if (mod.pricingModel === "monthly") {
      nextBillingAt = now + 30 * 24 * 60 * 60 * 1000;
    } else if (mod.pricingModel === "annual") {
      nextBillingAt = now + 365 * 24 * 60 * 60 * 1000;
    }

    const installId = await ctx.db.insert("marketplaceInstallations", {
      tenantId: args.tenantId,
      moduleId: args.moduleId,
      installedVersion: mod.version,
      status: "active",
      licenseType: mod.pricingModel,
      trialEndsAt,
      isTrialUsed: isTrialUsed || !!trialEndsAt,
      lastPaymentAt: mod.pricingModel !== "free" && !trialEndsAt ? now : undefined,
      nextBillingAt,
      monthlyCostCents: mod.priceCents,
      configuration: args.configuration,
      assignedRoles: args.assignedRoles,
      totalApiCalls: 0,
      activeUsers: 0,
      installedBy: session.email,
      installedAt: now,
      updatedAt: now,
    });

    // Update module install counts
    await ctx.db.patch(mod._id, {
      totalInstalls: mod.totalInstalls + 1,
      activeInstalls: mod.activeInstalls + 1,
      updatedAt: now,
    });

    // Update publisher install count
    const publisher = await ctx.db
      .query("marketplacePublishers")
      .withIndex("by_userId", (q) => q.eq("userId", mod.publisherId))
      .first();
    if (publisher) {
      await ctx.db.patch(publisher._id, {
        totalInstalls: publisher.totalInstalls + 1,
        updatedAt: now,
      });
    }

    // Create transaction if paid
    if (mod.pricingModel !== "free" && mod.priceCents && !trialEndsAt) {
      const commissionRate = publisher?.verificationLevel === "featured_partner" ? 0.20
        : publisher?.verificationLevel === "verified" ? 0.25 : 0.30;
      const commissionCents = Math.round(mod.priceCents * commissionRate);

      await ctx.db.insert("marketplaceTransactions", {
        moduleId: args.moduleId,
        publisherId: mod.publisherId,
        tenantId: args.tenantId,
        installationId: installId.toString(),
        type: "purchase",
        grossAmountCents: mod.priceCents,
        commissionCents,
        netAmountCents: mod.priceCents - commissionCents,
        commissionRate,
        currency: mod.currency || "KES",
        status: "completed",
        createdAt: now,
      });
    }

    // Activity log
    await ctx.db.insert("marketplaceActivity", {
      type: "install",
      moduleId: args.moduleId,
      moduleName: mod.name,
      tenantId: args.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      details: { version: mod.version },
      createdAt: now,
    });

    await logAction(ctx, {
      tenantId: args.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "marketplace.module_installed",
      entityType: "marketplace_installation",
      entityId: args.moduleId,
      after: { moduleName: mod.name, version: mod.version },
    });

    return { success: true, installationId: installId };
  },
});

export const uninstallModule = mutation({
  args: {
    sessionToken: v.string(),
    installationId: v.id("marketplaceInstallations"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const installation = await ctx.db.get(args.installationId);
    if (!installation) throw new Error("Installation not found");

    const now = Date.now();
    await ctx.db.patch(args.installationId, {
      status: "uninstalled",
      uninstalledAt: now,
      uninstalledBy: session.email,
      uninstallReason: args.reason,
      updatedAt: now,
    });

    // Decrement active installs on the module
    const mod = await ctx.db
      .query("marketplaceModules")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", installation.moduleId))
      .first();
    if (mod) {
      await ctx.db.patch(mod._id, {
        activeInstalls: Math.max(0, mod.activeInstalls - 1),
        updatedAt: now,
      });
    }

    await ctx.db.insert("marketplaceActivity", {
      type: "uninstall",
      moduleId: installation.moduleId,
      moduleName: mod?.name,
      tenantId: installation.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      details: { reason: args.reason },
      createdAt: now,
    });

    await logAction(ctx, {
      tenantId: installation.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "marketplace.module_uninstalled",
      entityType: "marketplace_installation",
      entityId: installation.moduleId,
      after: { reason: args.reason },
    });

    return { success: true };
  },
});

export const updateInstallationConfig = mutation({
  args: {
    sessionToken: v.string(),
    installationId: v.id("marketplaceInstallations"),
    configuration: v.optional(v.any()),
    assignedRoles: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const installation = await ctx.db.get(args.installationId);
    if (!installation) throw new Error("Installation not found");

    const updates: Record<string, any> = { updatedAt: Date.now() };
    if (args.configuration !== undefined) updates.configuration = args.configuration;
    if (args.assignedRoles !== undefined) updates.assignedRoles = args.assignedRoles;

    await ctx.db.patch(args.installationId, updates);
    return { success: true };
  },
});

// ── Reviews ───────────────────────────────────────────────────────────

export const submitReview = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.string(),
    rating: v.number(),
    content: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    if (args.rating < 1 || args.rating > 5) throw new Error("Rating must be between 1 and 5");
    if (args.content.length < 50) throw new Error("Review must be at least 50 characters");
    if (args.content.length > 2000) throw new Error("Review must not exceed 2000 characters");

    // Check one review per tenant per module
    const existing = await ctx.db
      .query("marketplaceReviews")
      .withIndex("by_tenant_module", (q) => q.eq("tenantId", session.tenantId).eq("moduleId", args.moduleId))
      .first();
    if (existing) throw new Error("Your institution has already submitted a review for this module");

    const now = Date.now();
    const reviewId = await ctx.db.insert("marketplaceReviews", {
      moduleId: args.moduleId,
      tenantId: session.tenantId,
      reviewerId: session.userId,
      reviewerEmail: session.email,
      reviewerRole: session.role,
      rating: args.rating,
      content: args.content,
      tags: args.tags,
      status: "pending",
      helpfulVotes: 0,
      unhelpfulVotes: 0,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("marketplaceActivity", {
      type: "review",
      moduleId: args.moduleId,
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      details: { rating: args.rating },
      createdAt: now,
    });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "marketplace.review_submitted",
      entityType: "marketplace_review",
      entityId: reviewId.toString(),
      after: { moduleId: args.moduleId, rating: args.rating },
    });

    return { success: true, reviewId };
  },
});

export const moderateReview = mutation({
  args: {
    sessionToken: v.string(),
    reviewId: v.id("marketplaceReviews"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("Review not found");

    const now = Date.now();
    await ctx.db.patch(args.reviewId, {
      status: args.decision,
      moderatedBy: session.userId,
      moderatedAt: now,
      rejectionReason: args.rejectionReason,
      updatedAt: now,
    });

    // If approved, recalculate module average rating
    if (args.decision === "approved") {
      const allApproved = await ctx.db
        .query("marketplaceReviews")
        .withIndex("by_module", (q) => q.eq("moduleId", review.moduleId).eq("status", "approved"))
        .collect();

      // Include the just-approved review
      const allRatings = [...allApproved.map((r) => r.rating), review.rating];
      const avg = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;

      const mod = await ctx.db
        .query("marketplaceModules")
        .withIndex("by_moduleId", (q) => q.eq("moduleId", review.moduleId))
        .first();
      if (mod) {
        await ctx.db.patch(mod._id, {
          averageRating: Math.round(avg * 10) / 10,
          totalReviews: allRatings.length,
          updatedAt: now,
        });
      }
    }

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "marketplace.review_moderated",
      entityType: "marketplace_review",
      entityId: args.reviewId.toString(),
      after: { decision: args.decision },
    });

    return { success: true };
  },
});

export const respondToReview = mutation({
  args: {
    sessionToken: v.string(),
    reviewId: v.id("marketplaceReviews"),
    response: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("Review not found");

    await ctx.db.patch(args.reviewId, {
      publisherResponse: args.response,
      publisherRespondedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const voteReview = mutation({
  args: {
    sessionToken: v.string(),
    reviewId: v.id("marketplaceReviews"),
    helpful: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("Review not found");

    if (args.helpful) {
      await ctx.db.patch(args.reviewId, { helpfulVotes: review.helpfulVotes + 1 });
    } else {
      await ctx.db.patch(args.reviewId, { unhelpfulVotes: review.unhelpfulVotes + 1 });
    }

    return { success: true };
  },
});

// ── Publisher Management ──────────────────────────────────────────────

export const registerPublisher = mutation({
  args: {
    sessionToken: v.string(),
    legalName: v.string(),
    entityType: v.union(v.literal("individual"), v.literal("organization")),
    country: v.string(),
    businessRegistration: v.optional(v.string()),
    taxId: v.optional(v.string()),
    payoutMethod: v.union(v.literal("mpesa"), v.literal("bank_transfer"), v.literal("paypal")),
    payoutDetails: v.string(),
    contactEmail: v.string(),
    contactPhone: v.optional(v.string()),
    website: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    // Check if already registered
    const existing = await ctx.db
      .query("marketplacePublishers")
      .withIndex("by_userId", (q) => q.eq("userId", session.userId))
      .first();
    if (existing) throw new Error("Publisher already registered");

    const now = Date.now();
    const id = await ctx.db.insert("marketplacePublishers", {
      userId: session.userId,
      legalName: args.legalName,
      entityType: args.entityType,
      country: args.country,
      businessRegistration: args.businessRegistration,
      taxId: args.taxId,
      payoutMethod: args.payoutMethod,
      payoutDetails: args.payoutDetails,
      verificationLevel: "basic",
      totalModules: 0,
      totalInstalls: 0,
      totalEarningsCents: 0,
      pendingPayoutCents: 0,
      averageRating: 0,
      agreementAcceptedAt: now,
      isActive: true,
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      website: args.website,
      bio: args.bio,
      createdAt: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "marketplace.publisher_registered",
      entityType: "marketplace_publisher",
      entityId: id.toString(),
      after: { legalName: args.legalName, entityType: args.entityType },
    });

    return { success: true, publisherId: id };
  },
});

export const updatePublisherVerification = mutation({
  args: {
    sessionToken: v.string(),
    publisherId: v.id("marketplacePublishers"),
    verificationLevel: v.union(v.literal("basic"), v.literal("verified"), v.literal("featured_partner")),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const publisher = await ctx.db.get(args.publisherId);
    if (!publisher) throw new Error("Publisher not found");

    await ctx.db.patch(args.publisherId, {
      verificationLevel: args.verificationLevel,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "marketplace.publisher_verified",
      entityType: "marketplace_publisher",
      entityId: args.publisherId.toString(),
      after: { verificationLevel: args.verificationLevel },
    });

    return { success: true };
  },
});

// ── Categories ────────────────────────────────────────────────────────

export const upsertCategory = mutation({
  args: {
    sessionToken: v.string(),
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    parentSlug: v.optional(v.string()),
    iconName: v.optional(v.string()),
    sortOrder: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const existing = await ctx.db
      .query("marketplaceCategories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        description: args.description,
        parentSlug: args.parentSlug,
        iconName: args.iconName,
        sortOrder: args.sortOrder,
        isActive: args.isActive,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("marketplaceCategories", {
        slug: args.slug,
        name: args.name,
        description: args.description,
        parentSlug: args.parentSlug,
        iconName: args.iconName,
        sortOrder: args.sortOrder,
        moduleCount: 0,
        isActive: args.isActive,
        createdAt: now,
        updatedAt: now,
      });
    }

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "marketplace.category_updated",
      entityType: "marketplace_category",
      entityId: args.slug,
      after: { name: args.name },
    });

    return { success: true };
  },
});

// ── Featured Placements ───────────────────────────────────────────────

export const manageFeaturedPlacement = mutation({
  args: {
    sessionToken: v.string(),
    id: v.optional(v.id("marketplaceFeatured")),
    type: v.union(v.literal("banner"), v.literal("staff_pick"), v.literal("collection")),
    title: v.string(),
    description: v.optional(v.string()),
    moduleIds: v.array(v.string()),
    imageUrl: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    sortOrder: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const now = Date.now();

    if (args.id) {
      await ctx.db.patch(args.id, {
        type: args.type,
        title: args.title,
        description: args.description,
        moduleIds: args.moduleIds,
        imageUrl: args.imageUrl,
        startDate: args.startDate,
        endDate: args.endDate,
        sortOrder: args.sortOrder,
        isActive: args.isActive,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("marketplaceFeatured", {
        type: args.type,
        title: args.title,
        description: args.description,
        moduleIds: args.moduleIds,
        imageUrl: args.imageUrl,
        startDate: args.startDate,
        endDate: args.endDate,
        sortOrder: args.sortOrder,
        isActive: args.isActive,
        createdBy: session.userId,
        createdAt: now,
        updatedAt: now,
      });
    }

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "marketplace.featured_updated",
      entityType: "marketplace_featured",
      entityId: args.title,
    });

    return { success: true };
  },
});

// ── Disputes ──────────────────────────────────────────────────────────

export const fileDispute = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.string(),
    installationId: v.string(),
    transactionId: v.optional(v.string()),
    type: v.union(v.literal("refund"), v.literal("policy_violation"), v.literal("technical_failure"), v.literal("other")),
    description: v.string(),
    evidence: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const now = Date.now();

    const id = await ctx.db.insert("marketplaceDisputes", {
      moduleId: args.moduleId,
      tenantId: session.tenantId,
      installationId: args.installationId,
      transactionId: args.transactionId,
      type: args.type,
      description: args.description,
      evidence: args.evidence,
      status: "open",
      filedBy: session.userId,
      filedByEmail: session.email,
      createdAt: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "marketplace.dispute_filed",
      entityType: "marketplace_dispute",
      entityId: id.toString(),
      after: { type: args.type, moduleId: args.moduleId },
    });

    return { success: true, disputeId: id };
  },
});

export const resolveDispute = mutation({
  args: {
    sessionToken: v.string(),
    disputeId: v.id("marketplaceDisputes"),
    status: v.union(v.literal("resolved"), v.literal("dismissed")),
    resolution: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute not found");

    await ctx.db.patch(args.disputeId, {
      status: args.status,
      resolution: args.resolution,
      resolvedBy: session.userId,
      resolvedAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "marketplace.dispute_resolved",
      entityType: "marketplace_dispute",
      entityId: args.disputeId.toString(),
      after: { status: args.status, resolution: args.resolution },
    });

    return { success: true };
  },
});

// ── Module Install Requests (Teachers → Admins) ──────────────────────

export const createInstallRequest = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    moduleId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const id = await ctx.db.insert("marketplaceInstallRequests", {
      tenantId: args.tenantId,
      moduleId: args.moduleId,
      requestedBy: session.userId,
      requestedByEmail: session.email,
      reason: args.reason,
      status: "pending",
      createdAt: Date.now(),
    });

    return { success: true, requestId: id };
  },
});

export const reviewInstallRequest = mutation({
  args: {
    sessionToken: v.string(),
    requestId: v.id("marketplaceInstallRequests"),
    decision: v.union(v.literal("approved"), v.literal("denied")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    await ctx.db.patch(args.requestId, {
      status: args.decision,
      reviewedBy: session.userId,
      reviewedAt: Date.now(),
      reviewNotes: args.notes,
    });

    return { success: true };
  },
});

// ── Seed Categories (run once) ────────────────────────────────────────

export const seedCategories = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const categories = [
      { slug: "academic_tools", name: "Academic Tools", description: "Tools that enhance teaching, learning, and academic administration", iconName: "GraduationCap", sortOrder: 1 },
      { slug: "communication", name: "Communication", description: "Modules that extend messaging and notification capabilities", iconName: "MessageSquare", sortOrder: 2 },
      { slug: "finance_fees", name: "Finance & Fees", description: "Financial tools beyond the core fees module", iconName: "CreditCard", sortOrder: 3 },
      { slug: "analytics_bi", name: "Analytics & BI", description: "Data analysis and visualisation tools for institutional insights", iconName: "BarChart3", sortOrder: 4 },
      { slug: "content_packs", name: "Content Packs", description: "Pre-built digital content for direct classroom use", iconName: "BookOpen", sortOrder: 5 },
      { slug: "integrations", name: "Integrations", description: "Connectors and adapters to external systems and services", iconName: "Plug", sortOrder: 6 },
      { slug: "ai_automation", name: "AI & Automation", description: "Artificial intelligence and machine-learning powered tools", iconName: "Cpu", sortOrder: 7 },
      { slug: "accessibility", name: "Accessibility", description: "Tools that improve platform accessibility and inclusivity", iconName: "Heart", sortOrder: 8 },
      { slug: "administration", name: "Administration", description: "Operational tools for school administrators", iconName: "Building", sortOrder: 9 },
      { slug: "security_compliance", name: "Security & Compliance", description: "Tools that enhance security posture and regulatory compliance", iconName: "Shield", sortOrder: 10 },
    ];

    const now = Date.now();
    for (const cat of categories) {
      const existing = await ctx.db
        .query("marketplaceCategories")
        .withIndex("by_slug", (q) => q.eq("slug", cat.slug))
        .first();
      if (!existing) {
        await ctx.db.insert("marketplaceCategories", {
          ...cat,
          moduleCount: 0,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return { success: true, message: "Categories seeded" };
  },
});
