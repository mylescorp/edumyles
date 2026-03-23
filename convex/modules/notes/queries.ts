import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";

export const listNotes = query({
    args: {},
    handler: async (ctx) => {
        const tenant = await requireTenantContext(ctx);
        const notes = await ctx.db
            .query("adminNotes")
            .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
            .order("desc")
            .collect();
        return notes;
    },
});
