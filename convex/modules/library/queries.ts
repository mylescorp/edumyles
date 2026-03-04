import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";

export const listBooks = query({
    args: {
        category: v.optional(v.string()),
        isbn: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "library");
        requirePermission(tenant, "library:read");

        if (args.isbn) {
            return await ctx.db
                .query("books")
                .withIndex("by_tenant_isbn", (q) =>
                    q.eq("tenantId", tenant.tenantId).eq("isbn", args.isbn!)
                )
                .collect();
        }
        if (args.category) {
            return await ctx.db
                .query("books")
                .withIndex("by_tenant_category", (q) =>
                    q.eq("tenantId", tenant.tenantId).eq("category", args.category!)
                )
                .collect();
        }
        return await ctx.db
            .query("books")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
            .collect();
    },
});

export const getBook = query({
    args: { bookId: v.id("books") },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "library");
        requirePermission(tenant, "library:read");

        const book = await ctx.db.get(args.bookId);
        if (!book || book.tenantId !== tenant.tenantId) return null;
        return book;
    },
});

/** Borrows currently out (not returned). */
export const listActiveBorrows = query({
    args: { borrowerId: v.optional(v.string()), bookId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "library");
        requirePermission(tenant, "library:read");

        let q = ctx.db
            .query("bookBorrows")
            .withIndex("by_tenant_status", (q) =>
                q.eq("tenantId", tenant.tenantId).eq("status", "borrowed")
            );
        const list = await q.collect();
        if (args.borrowerId) return list.filter((b) => b.borrowerId === args.borrowerId);
        if (args.bookId) return list.filter((b) => b.bookId === args.bookId);
        return list;
    },
});

/** Overdue borrows (dueDate < now, not returned). */
export const getOverdueBorrows = query({
    args: {},
    handler: async (ctx) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "library");
        requirePermission(tenant, "library:read");

        const now = Date.now();
        const borrowed = await ctx.db
            .query("bookBorrows")
            .withIndex("by_tenant_status", (q) =>
                q.eq("tenantId", tenant.tenantId).eq("status", "borrowed")
            )
            .collect();
        return borrowed.filter((b) => b.dueDate < now);
    },
});

/** Low stock: books where availableQuantity <= threshold. */
export const getLowStockBooks = query({
    args: { threshold: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "library");
        requirePermission(tenant, "library:read");

        const threshold = args.threshold ?? 2;
        const books = await ctx.db
            .query("books")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
            .collect();
        return books.filter((b) => b.availableQuantity <= threshold);
    },
});
