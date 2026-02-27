import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const upsertUser = mutation({
  args: {
    workosUserId: v.string(),
    email: v.string(),
    role: v.string(),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_workos_user", (q) =>
        q.eq("workosUserId", args.workosUserId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        role: args.role,
        organizationId: args.organizationId,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      workosUserId: args.workosUserId,
      email: args.email,
      role: args.role,
      organizationId: args.organizationId,
    });
  },
});
