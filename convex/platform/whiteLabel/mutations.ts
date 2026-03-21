import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

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
    const platform = await requirePlatformSession(ctx, args);

    const config = await ctx.db
      .query("whiteLabelConfigs")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (config) {
      const data: any = { updatedAt: Date.now() };
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

      await ctx.db.patch(config._id, data);

      await logAction(ctx, {
        tenantId: platform.tenantId,
        actorId: platform.userId,
        actorEmail: platform.email,
        action: "white_label.updated",
        entityType: "white_label_config",
        entityId: config._id,
        before: config,
        after: data,
      });

      return config._id;
    } else {
      const now = Date.now();
      const newConfigId = await ctx.db.insert("whiteLabelConfigs", {
        tenantId: args.tenantId,
        brandName: args.brandName || args.tenantId,
        primaryColor: args.primaryColor || "#3B82F6",
        secondaryColor: args.secondaryColor || "#1E40AF",
        accentColor: args.accentColor || "#F59E0B",
        logoUrl: args.logoUrl,
        favicon: args.favicon,
        customDomain: args.customDomain,
        emailFromName: args.emailFromName,
        emailFromAddress: args.emailFromAddress,
        footerText: args.footerText,
        customCSS: args.customCSS,
        isActive: true,
        createdBy: platform.userId,
        createdAt: now,
        updatedAt: now,
      });

      await logAction(ctx, {
        tenantId: platform.tenantId,
        actorId: platform.userId,
        actorEmail: platform.email,
        action: "white_label.updated",
        entityType: "white_label_config",
        entityId: newConfigId,
        after: { tenantId: args.tenantId, brandName: args.brandName },
      });

      return newConfigId;
    }
  },
});

export const resetToDefault = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);

    const config = await ctx.db
      .query("whiteLabelConfigs")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (config) {
      await ctx.db.delete(config._id);

      await logAction(ctx, {
        tenantId: platform.tenantId,
        actorId: platform.userId,
        actorEmail: platform.email,
        action: "white_label.reset",
        entityType: "white_label_config",
        entityId: config._id,
        before: config,
      });
    }
    return { success: true };
  },
});
