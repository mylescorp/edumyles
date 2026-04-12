import { v } from "convex/values";
import { mutation, query } from "../../../_generated/server";
import { requireResellerApplication } from "../../../helpers/resellerGuard";

export const submitApplication = mutation({
  args: {
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Check if user already has an application
    const existingApplication = await ctx.db
      .query("resellerApplications")
      .withIndex("by_applicant", q => q.eq("applicantId", identity.subject))
      .first();

    if (existingApplication) {
      throw new Error("You already have a reseller application");
    }

    // Check if user is already a reseller
    const existingReseller = await ctx.db
      .query("resellers")
      .withIndex("by_userId", q => q.eq("userId", identity.subject))
      .first();

    if (existingReseller) {
      throw new Error("You are already a reseller");
    }

    const applicationId = await ctx.db.insert("resellerApplications", {
      applicantId: identity.subject,
      applicantEmail: identity.email || "",
      businessName: args.businessName,
      businessType: args.businessType,
      businessDescription: args.businessDescription,
      website: args.website,
      contactPhone: args.contactPhone,
      contactAddress: args.contactAddress,
      country: args.country,
      targetMarket: args.targetMarket,
      experience: args.experience,
      marketingChannels: args.marketingChannels,
      expectedVolume: args.expectedVolume,
      status: "submitted",
      submittedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, applicationId };
  },
});

export const updateApplication = mutation({
  args: {
    businessName: v.optional(v.string()),
    businessDescription: v.optional(v.string()),
    website: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    contactAddress: v.optional(v.string()),
    targetMarket: v.optional(v.string()),
    experience: v.optional(v.string()),
    marketingChannels: v.optional(v.array(v.string())),
    expectedVolume: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const application = await requireResellerApplication(ctx);

    if (application.status !== "submitted" && application.status !== "on_hold") {
      throw new Error("Cannot update application in current status");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.businessName) updates.businessName = args.businessName;
    if (args.businessDescription) updates.businessDescription = args.businessDescription;
    if (args.website !== undefined) updates.website = args.website;
    if (args.contactPhone) updates.contactPhone = args.contactPhone;
    if (args.contactAddress) updates.contactAddress = args.contactAddress;
    if (args.targetMarket) updates.targetMarket = args.targetMarket;
    if (args.experience) updates.experience = args.experience;
    if (args.marketingChannels) updates.marketingChannels = args.marketingChannels;
    if (args.expectedVolume) updates.expectedVolume = args.expectedVolume;

    await ctx.db.patch(application._id, updates);

    return { success: true };
  },
});

export const getMyApplication = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const application = await ctx.db
      .query("resellerApplications")
      .withIndex("by_applicant", q => q.eq("applicantId", identity.subject))
      .first();

    return application;
  },
});

export const withdrawApplication = mutation({
  args: {},
  handler: async (ctx) => {
    const application = await requireResellerApplication(ctx);

    if (application.status !== "submitted" && application.status !== "under_review" && application.status !== "on_hold") {
      throw new Error("Cannot withdraw application in current status");
    }

    await ctx.db.patch(application._id, {
      status: "withdrawn",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
