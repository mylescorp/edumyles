import { query } from "../../_generated/server";

export const isMaintenanceMode = query({
  args: {},
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("platformSettings")
      .withIndex("by_section_key", (q) =>
        q.eq("section", "operations").eq("key", "maintenanceMode")
      )
      .first();

    return setting?.value === "true";
  },
});
