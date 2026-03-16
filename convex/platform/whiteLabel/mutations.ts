import { mutation } from "../../_generated/server";
import { v } from "convex/values";

export const updateWhiteLabelConfig = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    brandName: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    favicon: v.optional(v.string()),
    customDomain: v.optional(v.string()),
    emailFromName: v.optional(v.string()),
    emailFromAddress: v.optional(v.string()),
    footerText: v.optional(v.string()),
    customCSS: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) throw new Error("Invalid session");

    const existing = await ctx.db
      .query("whiteLabelConfigs")
      .collect();
    const config = existing.find((c) => c.tenantId === args.tenantId);

    const data: any = {
      tenantId: args.tenantId,
      updatedAt: Date.now(),
      isActive: true,
    };
    if (args.brandName !== undefined) data.brandName = args.brandName;
    if (args.logoUrl !== undefined) data.logoUrl = args.logoUrl;
    if (args.primaryColor !== undefined) data.primaryColor = args.primaryColor;
    if (args.secondaryColor !== undefined) data.secondaryColor = args.secondaryColor;
    if (args.accentColor !== undefined) data.accentColor = args.accentColor;
    if (args.favicon !== undefined) data.favicon = args.favicon;
    if (args.customDomain !== undefined) data.customDomain = args.customDomain;
    if (args.emailFromName !== undefined) data.emailFromName = args.emailFromName;
    if (args.emailFromAddress !== undefined) data.emailFromAddress = args.emailFromAddress;
    if (args.footerText !== undefined) data.footerText = args.footerText;
    if (args.customCSS !== undefined) data.customCSS = args.customCSS;

    if (config) {
      await ctx.db.patch(config._id, data);
      return config._id;
    } else {
      return await ctx.db.insert("whiteLabelConfigs", data);
    }
  },
});

export const resetToDefault = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) throw new Error("Invalid session");

    const configs = await ctx.db.query("whiteLabelConfigs").collect();
    const config = configs.find((c) => c.tenantId === args.tenantId);

    if (config) {
      await ctx.db.delete(config._id);
    }
    return { success: true };
  },
});
