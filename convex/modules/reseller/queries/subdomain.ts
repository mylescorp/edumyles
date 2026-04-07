import { query } from "../../../_generated/server";
import { v } from "convex/values";

export const getResellerBySubdomain = query({
  args: {
    subdomain: v.string(),
  },
  handler: async (ctx, args) => {
    // Get reseller by subdomain
    const reseller = await ctx.db
      .query("resellers")
      .withIndex("by_subdomain", q => q.eq("subdomain", args.subdomain))
      .first();

    return reseller;
  },
});

export const getResellerSubdomainConfig = query({
  args: {
    resellerId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get reseller subdomain configuration
    const reseller = await ctx.db
      .query("resellers")
      .withIndex("by_resellerId", q => q.eq("resellerId", args.resellerId))
      .first();

    if (!reseller || !reseller.subdomainConfig) {
      return null;
    }

    return reseller.subdomainConfig;
  },
});

export const getResellerMarketingMaterials = query({
  args: {
    resellerId: v.string(),
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get marketing materials for reseller white-label site
    const materials = await ctx.db
      .query("resellerMarketingMaterials")
      .withIndex("by_reseller", q => q.eq("resellerId", args.resellerId))
      .collect();

    let filteredMaterials = materials;
    if (args.type) {
      filteredMaterials = materials.filter(m => m.type === args.type);
    }

    // Only return published materials
    filteredMaterials = filteredMaterials.filter(m => m.status === "published");

    // Apply limit if specified
    if (args.limit) {
      filteredMaterials = filteredMaterials.slice(0, args.limit);
    }

    return filteredMaterials;
  },
});

export const getResellerDirectoryListing = query({
  args: {
    resellerId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get reseller directory listing for white-label site
    const listing = await ctx.db
      .query("resellerDirectoryListings")
      .withIndex("by_reseller", q => q.eq("resellerId", args.resellerId))
      .first();

    return listing;
  },
});

export const getResellerCourses = query({
  args: {
    resellerId: v.string(),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    // Get courses for reseller training
    const courses = await ctx.db
      .query("resellerCourses")
      .withIndex("by_reseller", q => q.eq("resellerId", args.resellerId))
      .collect();

    let filteredCourses = courses;
    if (args.status) {
      filteredCourses = courses.filter(c => c.status === args.status);
    }

    return filteredCourses;
  },
});
