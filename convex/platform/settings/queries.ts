import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

export const getSettings = query({
  args: { sessionToken: v.string(), section: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    let settings;
    if (args.section) {
      settings = await ctx.db
        .query("platformSettings")
        .withIndex("by_section_key", (q) => q.eq("section", args.section!))
        .collect();
    } else {
      settings = await ctx.db.query("platformSettings").collect();
    }

    // Convert to a section-keyed object
    const result: Record<string, Record<string, string>> = {};
    for (const s of settings) {
      if (!result[s.section]) result[s.section] = {};
      const sectionSettings = result[s.section];
      if (sectionSettings) {
        sectionSettings[s.key] = s.value;
      }
    }
    return result;
  },
});
