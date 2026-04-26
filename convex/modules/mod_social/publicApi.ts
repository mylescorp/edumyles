import { internalQuery } from "../../_generated/server";
import { v } from "convex/values";
import { requireModuleAccess } from "../../helpers/moduleGuard";

export const getPublishedPostSummary = internalQuery({
  args: {
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireModuleAccess(ctx, "mod_social", args.tenantId);
    const posts = await ctx.db
      .query("social_posts")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .collect();
    const active = posts.filter((post) => !post.isDeleted);
    return {
      total: active.length,
      published: active.filter((post) => post.status === "published").length,
      scheduled: active.filter((post) => post.status === "scheduled").length,
    };
  },
});
