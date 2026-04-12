import { query } from "../../../_generated/server";
import { v } from "convex/values";
import { requireResellerContext } from "../../../helpers/resellerGuard";

export const getReferralClicks = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);
    const clicks = await ctx.db
      .query("resellerReferralClicks")
      .withIndex("by_reseller", (q) => q.eq("resellerId", reseller.resellerId))
      .collect();

    return clicks
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, args.limit ?? 100);
  },
});
