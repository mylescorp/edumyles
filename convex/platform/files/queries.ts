import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

export const listFiles = query({
  args: {
    sessionToken: v.string(),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    let files;
    if (args.category) {
      files = await ctx.db
        .query("platformFiles")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .order("desc")
        .collect();
    } else {
      files = await ctx.db
        .query("platformFiles")
        .order("desc")
        .collect();
    }

    if (args.limit) {
      files = files.slice(0, args.limit);
    }

    return files;
  },
});

export const getFileById = query({
  args: {
    sessionToken: v.string(),
    fileId: v.id("platformFiles"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    return await ctx.db.get(args.fileId);
  },
});
