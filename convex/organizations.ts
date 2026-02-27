import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const upsertOrganization = mutation({
  args: {
    workosOrgId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_workos_org", (q) =>
        q.eq("workosOrgId", args.workosOrgId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
      });
      return existing._id;
    }

    return await ctx.db.insert("organizations", {
      workosOrgId: args.workosOrgId,
      name: args.name,
    });
  },
});
