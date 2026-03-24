import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";

export const createNote = mutation({
    args: {
        title: v.string(),
        content: v.optional(v.string()),
        color: v.string(),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        const now = Date.now();
        return await ctx.db.insert("adminNotes", {
            tenantId: tenant.tenantId,
            userId: tenant.userId,
            title: args.title,
            content: args.content,
            color: args.color,
            pinned: false,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const updateNote = mutation({
    args: {
        id: v.id("adminNotes"),
        title: v.string(),
        content: v.optional(v.string()),
        color: v.string(),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        const note = await ctx.db.get(args.id);
        if (!note || note.userId !== tenant.userId) throw new Error("Note not found");
        await ctx.db.patch(args.id, {
            title: args.title,
            content: args.content,
            color: args.color,
            updatedAt: Date.now(),
        });
    },
});

export const deleteNote = mutation({
    args: { id: v.id("adminNotes") },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        const note = await ctx.db.get(args.id);
        if (!note || note.userId !== tenant.userId) throw new Error("Note not found");
        await ctx.db.delete(args.id);
    },
});

export const togglePin = mutation({
    args: { id: v.id("adminNotes") },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        const note = await ctx.db.get(args.id);
        if (!note || note.userId !== tenant.userId) throw new Error("Note not found");
        await ctx.db.patch(args.id, { pinned: !note.pinned, updatedAt: Date.now() });
    },
});
