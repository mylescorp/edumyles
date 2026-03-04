import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { logAction } from "../../helpers/auditLog";

const OVERDUE_FINE_CENTS_PER_DAY = 10;

export const createBook = mutation({
    args: {
        isbn: v.optional(v.string()),
        title: v.string(),
        author: v.string(),
        category: v.string(),
        quantity: v.number(),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "library");
        requirePermission(tenant, "library:write");

        const q = Math.max(0, args.quantity);
        const id = await ctx.db.insert("books", {
            tenantId: tenant.tenantId,
            isbn: args.isbn,
            title: args.title,
            author: args.author,
            category: args.category,
            quantity: q,
            availableQuantity: q,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return id;
    },
});

export const updateBook = mutation({
    args: {
        bookId: v.id("books"),
        title: v.optional(v.string()),
        author: v.optional(v.string()),
        category: v.optional(v.string()),
        quantity: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "library");
        requirePermission(tenant, "library:write");

        const book = await ctx.db.get(args.bookId);
        if (!book || book.tenantId !== tenant.tenantId) throw new Error("Book not found");

        const updates: Record<string, unknown> = { updatedAt: Date.now() };
        if (args.title !== undefined) updates.title = args.title;
        if (args.author !== undefined) updates.author = args.author;
        if (args.category !== undefined) updates.category = args.category;
        if (args.quantity !== undefined) {
            const diff = args.quantity - book.quantity;
            updates.quantity = args.quantity;
            (updates as any).availableQuantity = Math.max(0, book.availableQuantity + diff);
        }
        await ctx.db.patch(args.bookId, updates);
        return args.bookId;
    },
});

export const borrowBook = mutation({
    args: {
        bookId: v.id("books"),
        borrowerId: v.string(),
        borrowerType: v.string(),
        dueDate: v.number(),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "library");
        requirePermission(tenant, "library:write");

        const book = await ctx.db.get(args.bookId);
        if (!book || book.tenantId !== tenant.tenantId) throw new Error("Book not found");
        if (book.availableQuantity < 1) throw new Error("Book not available");

        const now = Date.now();
        const borrowId = await ctx.db.insert("bookBorrows", {
            tenantId: tenant.tenantId,
            bookId: args.bookId,
            borrowerId: args.borrowerId,
            borrowerType: args.borrowerType,
            borrowedAt: now,
            dueDate: args.dueDate,
            status: "borrowed",
            createdAt: now,
            updatedAt: now,
        });

        await ctx.db.patch(args.bookId, {
            availableQuantity: book.availableQuantity - 1,
            updatedAt: now,
        });

        return borrowId;
    },
});

export const returnBook = mutation({
    args: { borrowId: v.id("bookBorrows"), fineCents: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "library");
        requirePermission(tenant, "library:write");

        const borrow = await ctx.db.get(args.borrowId);
        if (!borrow || borrow.tenantId !== tenant.tenantId) throw new Error("Borrow record not found");
        if (borrow.status !== "borrowed") throw new Error("Already returned");

        const now = Date.now();
        let fineCents = args.fineCents ?? 0;
        if (borrow.dueDate < now && fineCents === 0) {
            const daysOverdue = Math.ceil((now - borrow.dueDate) / (24 * 60 * 60 * 1000));
            fineCents = daysOverdue * OVERDUE_FINE_CENTS_PER_DAY;
        }

        await ctx.db.patch(args.borrowId, {
            returnedAt: now,
            fineCents,
            status: "returned",
            updatedAt: now,
        });

        const book = await ctx.db.get(borrow.bookId as any);
        if (book) {
            await ctx.db.patch(borrow.bookId as any, {
                availableQuantity: book.availableQuantity + 1,
                updatedAt: now,
            });
        }

        return { success: true, fineCents };
    },
});
