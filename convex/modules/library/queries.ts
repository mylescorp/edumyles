import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantContext, requireTenantSession } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";

export const listBooks = query({
    args: {
        category: v.optional(v.string()),
        isbn: v.optional(v.string()),
        sessionToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
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
        } catch (error) {
            console.error("listBooks failed", error);
            return [];
        }
    },
});

export const getBook = query({
    args: { bookId: v.id("books"), sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "library");
            requirePermission(tenant, "library:read");

            const book = await ctx.db.get(args.bookId);
            if (!book || book.tenantId !== tenant.tenantId) return null;
            return book;
        } catch (error) {
            console.error("getBook failed", error);
            return null;
        }
    },
});

/** Borrows currently out (not returned). */
export const listActiveBorrows = query({
    args: {
        borrowerId: v.optional(v.string()),
        bookId: v.optional(v.string()),
        sessionToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
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
        } catch (error) {
            console.error("listActiveBorrows failed", error);
            return [];
        }
    },
});

/** Overdue borrows (dueDate < now, not returned). */
export const getOverdueBorrows = query({
    args: { sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
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
        } catch (error) {
            console.error("getOverdueBorrows failed", error);
            return [];
        }
    },
});

/** Low stock: books where availableQuantity <= threshold. */
export const getLowStockBooks = query({
    args: { threshold: v.optional(v.number()), sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "library");
            requirePermission(tenant, "library:read");

            const threshold = args.threshold ?? 2;
            const books = await ctx.db
                .query("books")
                .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                .collect();
            return books.filter((b) => b.availableQuantity <= threshold);
        } catch (error) {
            console.error("getLowStockBooks failed", error);
            return [];
        }
    },
});

/**
 * Get library dashboard statistics and reports data.
 */
export const getLibraryReports = query({
    args: { sessionToken: v.optional(v.string()), period: v.optional(v.string()) },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "library");
            requirePermission(tenant, "library:read");

            const period = args.period || "monthly";
            const now = new Date();
            
            // Calculate period start date
            let periodStart: Date;
            switch (period) {
                case "weekly":
                    periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case "monthly":
                    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case "quarterly":
                    const quarter = Math.floor(now.getMonth() / 3);
                    periodStart = new Date(now.getFullYear(), quarter * 3, 1);
                    break;
                case "yearly":
                    periodStart = new Date(now.getFullYear(), 0, 1);
                    break;
                default:
                    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
            }
            const periodStartTime = periodStart.getTime();

            // Get all library data
            const [books, borrows, borrowers] = await Promise.all([
                ctx.db
                    .query("books")
                    .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                    .collect(),
                ctx.db
                    .query("bookBorrows")
                    .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                    .collect(),
                ctx.db
                    .query("bookBorrows")
                    .withIndex("by_tenant_status", (q) => 
                        q.eq("tenantId", tenant.tenantId).eq("status", "borrowed")
                    )
                    .collect(),
            ]);

            // Calculate statistics
            const totalBooks = books.length;
            const activeBorrowers = new Set(borrows.map(b => b.borrowerId)).size;
            const monthlyCirculation = borrows.filter(b => b.createdAt >= periodStartTime).length;
            
            const overdueBorrows = borrowers.filter(b => b.dueDate < now.getTime());
            const overdueRate = borrowers.length > 0 ? (overdueBorrows.length / borrowers.length) * 100 : 0;
            
            // Calculate average reading time (mock data for now)
            const averageReadingTime = 14;
            const collectionEfficiency = 94.5;

            // Calculate circulation trends (mock data for now)
            const circulationData = [
                { name: "Jan", borrowed: 145, returned: 132, overdue: 8 },
                { name: "Feb", borrowed: 167, returned: 158, overdue: 12 },
                { name: "Mar", borrowed: 189, returned: 176, overdue: 15 },
                { name: "Apr", borrowed: 156, returned: 148, overdue: 10 },
                { name: "May", borrowed: 178, returned: 165, overdue: 18 },
                { name: "Jun", borrowed: 195, returned: 182, overdue: 22 },
            ];

            // Calculate popular categories
            const categoryCounts = books.reduce((acc, book) => {
                acc[book.category] = (acc[book.category] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            
            const popularCategories = Object.entries(categoryCounts)
                .map(([name, value]) => ({
                    name,
                    value: Math.round((value / totalBooks) * 100),
                    color: chartColors.categorical[Object.keys(categoryCounts).indexOf(name) % chartColors.categorical.length]
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);

            // Calculate borrower stats (mock data for now)
            const borrowerStats = [
                { name: "Students", value: 245, color: chartColors.categorical[0] },
                { name: "Teachers", value: 67, color: chartColors.categorical[1] },
                { name: "Staff", value: 23, color: chartColors.categorical[2] },
            ];

            // Calculate top books (mock data for now)
            const topBooks = [
                { title: "Introduction to Mathematics", author: "John Smith", borrows: 45, rating: 4.8 },
                { title: "Science Explorations", author: "Dr. Sarah Lee", borrows: 38, rating: 4.6 },
                { title: "History of Africa", author: "Prof. Michael Okonkwo", borrows: 32, rating: 4.7 },
                { title: "Literature Classics", author: "Jane Austen", borrows: 28, rating: 4.9 },
                { title: "Computer Science Fundamentals", author: "Tech Writers", borrows: 25, rating: 4.5 },
            ];

            return {
                stats: {
                    totalBooks,
                    activeBorrowers,
                    monthlyCirculation,
                    overdueRate: Math.round(overdueRate * 10) / 10,
                    averageReadingTime,
                    collectionEfficiency,
                },
                circulationData,
                popularCategories,
                borrowerStats,
                topBooks,
            };
        } catch (error) {
            console.error("getLibraryReports failed", error);
            return {
                stats: {
                    totalBooks: 0,
                    activeBorrowers: 0,
                    monthlyCirculation: 0,
                    overdueRate: 0,
                    averageReadingTime: 0,
                    collectionEfficiency: 0,
                },
                circulationData: [],
                popularCategories: [],
                borrowerStats: [],
                topBooks: [],
            };
        }
    },
});

// Chart colors helper (matching frontend)
const chartColors = {
    categorical: [
        "#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1",
        "#d084d0", "#ffb347", "#67b7dc", "#f47560", "#96ceb4"
    ]
};
