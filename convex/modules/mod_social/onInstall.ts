import { v } from "convex/values";
import { internalMutation } from "../../_generated/server";
import { runModuleOnInstallSetup } from "../moduleRuntime";

export const onInstall = internalMutation({
  args: {
    tenantId: v.string(),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await runModuleOnInstallSetup(ctx, {
      moduleSlug: "mod_social",
      tenantId: args.tenantId,
      updatedBy: args.updatedBy,
    });

    const existingFlow = await ctx.db
      .query("social_approval_flows")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (!existingFlow) {
      await ctx.db.insert("social_approval_flows", {
        tenantId: args.tenantId,
        name: "Default Social Approval Flow",
        isDefault: true,
        requiresApproval: true,
        approverRoles: ["school_admin"],
        approverUserIds: [],
        notifyOnSubmit: true,
        autoPublishOnApproval: true,
        allowSelfApproval: false,
        createdAt: Date.now(),
      });
    }

    return result;
  },
});
