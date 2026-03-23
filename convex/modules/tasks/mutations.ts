import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";

export const createTask = mutation({
    args: {
        title: v.string(),
        priority: v.string(),
        dueDate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        const now = Date.now();
        return await ctx.db.insert("adminTasks", {
            tenantId: tenant.tenantId,
            userId: tenant.userId,
            title: args.title,
            priority: args.priority,
            done: false,
            dueDate: args.dueDate,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const toggleTask = mutation({
    args: { id: v.id("adminTasks") },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        const task = await ctx.db.get(args.id);
        if (!task || task.userId !== tenant.userId) throw new Error("Task not found");
        await ctx.db.patch(args.id, { done: !task.done, updatedAt: Date.now() });
    },
});

export const deleteTask = mutation({
    args: { id: v.id("adminTasks") },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        const task = await ctx.db.get(args.id);
        if (!task || task.userId !== tenant.userId) throw new Error("Task not found");
        await ctx.db.delete(args.id);
    },
});
