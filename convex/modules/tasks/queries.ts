import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";

export const listTasks = query({
    args: {},
    handler: async (ctx) => {
        const tenant = await requireTenantContext(ctx);
        const tasks = await ctx.db
            .query("adminTasks")
            .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
            .order("desc")
            .collect();
        return tasks;
    },
});
