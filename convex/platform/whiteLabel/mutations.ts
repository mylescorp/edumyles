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
    const session = await requirePlatformSession(ctx, args);

    const existing = await ctx.db
      .query("whiteLabelConfigs")
      .collect();
    const config = existing.find((c) => c.tenantId === args.tenantId);

    const data: any = {
      tenantId: args.tenantId,
      updatedAt: Date.now(),
      isActive: true,
      createdBy: config?.createdBy || session.userId,
      createdAt: config?.createdAt || Date.now(),
      brandName: args.brandName ?? config?.brandName ?? "EduMyles",
      primaryColor: args.primaryColor ?? config?.primaryColor ?? "#2563eb",
      secondaryColor: args.secondaryColor ?? config?.secondaryColor ?? "#1e293b",
      accentColor: args.accentColor ?? config?.accentColor ?? "#10b981",
    };
    if (args.logoUrl !== undefined) data.logoUrl = args.logoUrl;
    if (args.favicon !== undefined) data.favicon = args.favicon;
    if (args.customDomain !== undefined) data.customDomain = args.customDomain;
    if (args.emailFromName !== undefined) data.emailFromName = args.emailFromName;
    if (args.emailFromAddress !== undefined) data.emailFromAddress = args.emailFromAddress;
    if (args.footerText !== undefined) data.footerText = args.footerText;
    if (args.customCSS !== undefined) data.customCSS = args.customCSS;

    if (config) {
      await ctx.db.patch(config._id, data);
      await logAction(ctx, {
        tenantId: session.tenantId,
        actorId: session.userId,
        actorEmail: session.email,
        action: "white_label.updated",
        entityType: "white_label_config",
        entityId: config._id,
        before: config,
        after: data,
      });
      return config._id;
    } else {
      const configId = await ctx.db.insert("whiteLabelConfigs", data);
      await logAction(ctx, {
        tenantId: session.tenantId,
        actorId: session.userId,
        actorEmail: session.email,
        action: "white_label.updated",
        entityType: "white_label_config",
        entityId: configId,
        after: data,
      });
      return configId;
    }
  },
});

export const resetToDefault = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const configs = await ctx.db.query("whiteLabelConfigs").collect();
    const config = configs.find((c) => c.tenantId === args.tenantId);

    if (config) {
      await ctx.db.delete(config._id);
      await logAction(ctx, {
        tenantId: session.tenantId,
        actorId: session.userId,
        actorEmail: session.email,
        action: "white_label.reset",
        entityType: "white_label_config",
        entityId: config._id,
        before: config,
      });
    }
    return { success: true };
  },
});
