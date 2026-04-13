import { v } from "convex/values";
import { internalQuery } from "../../_generated/server";
import { requireModuleAccess } from "../../helpers/moduleGuard";

export const getStudentWalletBalance = internalQuery({
  args: {
    tenantId: v.string(),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireModuleAccess(ctx, "mod_ewallet", args.tenantId);

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_owner", (q) =>
        q.eq("tenantId", args.tenantId).eq("ownerId", args.studentId)
      )
      .first();

    return {
      balanceKes: wallet ? wallet.balanceCents / 100 : 0,
      lastUpdatedAt: wallet?.updatedAt ?? wallet?.createdAt ?? Date.now(),
    };
  },
});
