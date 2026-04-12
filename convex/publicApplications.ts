import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { logAction } from "./helpers/auditLog";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function buildLandingApplicantId(email: string) {
  return `landing:${normalizeEmail(email)}`;
}

function buildReferralCode(reseller: { businessName: string; resellerId: string }) {
  return `EDU-${reseller.businessName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6)}-${reseller.resellerId.slice(-4)}`;
}

export const submitPublicPublisherApplication = mutation({
  args: {
    applicantEmail: v.string(),
    businessName: v.string(),
    businessType: v.union(v.literal("individual"), v.literal("company")),
    businessDescription: v.string(),
    website: v.optional(v.string()),
    contactPhone: v.string(),
    contactAddress: v.string(),
    country: v.string(),
    experience: v.string(),
    modules: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const applicantEmail = normalizeEmail(args.applicantEmail);
    const applicantId = buildLandingApplicantId(applicantEmail);

    const existingApplications = await ctx.db.query("publisherApplications").collect();
    const existingApplication = existingApplications.find(
      (application) =>
        normalizeEmail(application.applicantEmail) === applicantEmail &&
        ["submitted", "under_review", "on_hold", "approved"].includes(application.status)
    );

    if (existingApplication) {
      return {
        success: true,
        duplicate: true,
        applicationId: existingApplication._id,
      };
    }

    const applicationId = await ctx.db.insert("publisherApplications", {
      applicantId,
      applicantEmail,
      businessName: args.businessName.trim(),
      businessType: args.businessType,
      businessDescription: args.businessDescription.trim(),
      website: args.website?.trim(),
      contactPhone: args.contactPhone.trim(),
      contactAddress: args.contactAddress.trim(),
      country: args.country.trim(),
      experience: args.experience.trim(),
      modules: args.modules,
      status: "submitted",
      submittedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "platform",
      actorId: applicantId,
      actorEmail: applicantEmail,
      action: "marketplace.publisher_registered",
      entityType: "publisherApplication",
      entityId: String(applicationId),
      after: {
        businessName: args.businessName.trim(),
        businessType: args.businessType,
        country: args.country.trim(),
      },
    });

    return { success: true, duplicate: false, applicationId };
  },
});

export const submitPublicResellerApplication = mutation({
  args: {
    applicantEmail: v.string(),
    businessName: v.string(),
    businessType: v.union(v.literal("reseller"), v.literal("affiliate")),
    businessDescription: v.string(),
    website: v.optional(v.string()),
    contactPhone: v.string(),
    contactAddress: v.string(),
    country: v.string(),
    targetMarket: v.string(),
    experience: v.string(),
    marketingChannels: v.array(v.string()),
    expectedVolume: v.string(),
  },
  handler: async (ctx, args) => {
    const applicantEmail = normalizeEmail(args.applicantEmail);
    const applicantId = buildLandingApplicantId(applicantEmail);

    const existingApplications = await ctx.db.query("resellerApplications").collect();
    const existingApplication = existingApplications.find(
      (application) =>
        normalizeEmail(application.applicantEmail) === applicantEmail &&
        application.businessType === args.businessType &&
        ["submitted", "under_review", "on_hold", "approved"].includes(application.status)
    );

    if (existingApplication) {
      return {
        success: true,
        duplicate: true,
        applicationId: existingApplication._id,
      };
    }

    const applicationId = await ctx.db.insert("resellerApplications", {
      applicantId,
      applicantEmail,
      businessName: args.businessName.trim(),
      businessType: args.businessType,
      businessDescription: args.businessDescription.trim(),
      website: args.website?.trim(),
      contactPhone: args.contactPhone.trim(),
      contactAddress: args.contactAddress.trim(),
      country: args.country.trim(),
      targetMarket: args.targetMarket.trim(),
      experience: args.experience.trim(),
      marketingChannels: args.marketingChannels,
      expectedVolume: args.expectedVolume.trim(),
      status: "submitted",
      submittedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "platform",
      actorId: applicantId,
      actorEmail: applicantEmail,
      action: "user.invited",
      entityType: "resellerApplication",
      entityId: String(applicationId),
      after: {
        businessName: args.businessName.trim(),
        businessType: args.businessType,
        country: args.country.trim(),
      },
    });

    return { success: true, duplicate: false, applicationId };
  },
});

export const trackPublicReferralClick = mutation({
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
    const resellers = await ctx.db
      .query("resellers")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const reseller = resellers.find(
      (candidate) => buildReferralCode(candidate) === args.referralCode
    );

    if (!reseller) {
      throw new Error("Invalid referral code");
    }

    const clickId = `CLICK-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 11)
      .toUpperCase()}`;

    await ctx.db.insert("resellerReferralClicks", {
      clickId,
      resellerId: reseller.resellerId,
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

    return { success: true, clickId, resellerId: reseller.resellerId };
  },
});
