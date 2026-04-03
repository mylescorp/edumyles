import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantContext, requireTenantSession } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";

async function enrichBorrowRecords(ctx: any, borrows: any[]) {
    const bookIds = Array.from(new Set(borrows.map((borrow) => borrow.bookId)));
    const studentIds = Array.from(
        new Set(borrows.filter((borrow) => borrow.borrowerType === "student").map((borrow) => borrow.borrowerId))
    );
    const staffIds = Array.from(
        new Set(borrows.filter((borrow) => borrow.borrowerType === "staff").map((borrow) => borrow.borrowerId))
    );

    const [books, students, staff] = await Promise.all([
        Promise.all(bookIds.map((bookId) => ctx.db.get(bookId as any))),
        Promise.all(studentIds.map((studentId) => ctx.db.get(studentId as any))),
        Promise.all(staffIds.map((staffId) => ctx.db.get(staffId as any))),
    ]);

    const bookMap = new Map(
        books.filter(Boolean).map((book: any) => [book._id.toString(), book])
    );
    const studentMap = new Map(
        students.filter(Boolean).map((student: any) => [student._id.toString(), student])
    );
    const staffMap = new Map(
        staff.filter(Boolean).map((member: any) => [member._id.toString(), member])
    );

    return borrows.map((borrow) => {
        const book = bookMap.get(borrow.bookId);
        const borrower =
            borrow.borrowerType === "student"
                ? studentMap.get(borrow.borrowerId)
                : staffMap.get(borrow.borrowerId);

        const borrowerName = borrower
            ? [borrower.firstName, borrower.lastName].filter(Boolean).join(" ").trim()
            : borrow.borrowerId;

        return {
            ...borrow,
            bookTitle: book?.title ?? borrow.bookId,
            bookAuthor: book?.author ?? null,
            borrowerName,
            borrowerReference:
                borrow.borrowerType === "student"
                    ? borrower?.admissionNumber ?? borrow.borrowerId
                    : borrower?.employeeId ?? borrow.borrowerId,
        };
    });
}

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
            const filtered = args.borrowerId
                ? list.filter((b) => b.borrowerId === args.borrowerId)
                : args.bookId
                    ? list.filter((b) => b.bookId === args.bookId)
                    : list;
            return await enrichBorrowRecords(ctx, filtered);
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
            return await enrichBorrowRecords(
                ctx,
                borrowed.filter((b) => b.dueDate < now)
            );
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

            // Average reading time: mean of (returnedAt - borrowedAt) in days for returned borrows
            const returnedBorrows = borrows.filter(b => b.status === "returned" && b.returnedAt != null);
            let averageReadingTime: number | null = null;
            if (returnedBorrows.length > 0) {
                const totalDays = returnedBorrows.reduce((sum, b) => {
                    const days = (b.returnedAt! - b.borrowedAt) / (1000 * 60 * 60 * 24);
                    return sum + days;
                }, 0);
                averageReadingTime = Math.round((totalDays / returnedBorrows.length) * 10) / 10;
            }

            // Collection efficiency: distinct books borrowed in last 30 days / total books * 100
            const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
            const recentBorrows = borrows.filter(b => b.borrowedAt >= thirtyDaysAgo);
            const distinctBorrowedBookIds = new Set(recentBorrows.map(b => b.bookId));
            let collectionEfficiency: number | null = null;
            if (totalBooks > 0) {
                collectionEfficiency = Math.round((distinctBorrowedBookIds.size / totalBooks) * 1000) / 10;
            }

            // Monthly circulation for last 6 months
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const circulationData: { name: string; borrowed: number; returned: number; overdue: number }[] = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const start = d.getTime();
                const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
                const monthBorrows = borrows.filter(b => b.borrowedAt >= start && b.borrowedAt < end);
                const monthReturned = borrows.filter(b => b.returnedAt != null && b.returnedAt >= start && b.returnedAt < end);
                const monthOverdue = monthBorrows.filter(b => b.dueDate < end && b.status !== "returned");
                circulationData.push({
                    name: monthNames[d.getMonth()] ?? "",
                    borrowed: monthBorrows.length,
                    returned: monthReturned.length,
                    overdue: monthOverdue.length,
                });
            }

            // Popular categories from actual books
            const categoryCounts = books.reduce((acc, book) => {
                acc[book.category] = (acc[book.category] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const popularCategories = Object.entries(categoryCounts)
                .map(([name, value], idx) => ({
                    name,
                    value: totalBooks > 0 ? Math.round((value / totalBooks) * 100) : 0,
                    color: chartColors.categorical[idx % chartColors.categorical.length] ?? "#8884d8",
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);

            // Borrower stats by borrowerType
            const borrowerTypeCounts = borrows.reduce((acc, b) => {
                const type = b.borrowerType ?? "unknown";
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            const borrowerStats = Object.entries(borrowerTypeCounts).map(([name, value], idx) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                value,
                color: chartColors.categorical[idx % chartColors.categorical.length] ?? "#8884d8",
            }));

            // Top 5 books by borrow count
            const bookBorrowCounts = borrows.reduce((acc, b) => {
                acc[b.bookId] = (acc[b.bookId] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            const bookMap = new Map(books.map(b => [b._id.toString(), b]));
            const topBooks = Object.entries(bookBorrowCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([bookId, count]) => {
                    const book = bookMap.get(bookId);
                    return {
                        title: book?.title ?? "Unknown",
                        author: book?.author ?? "Unknown",
                        borrows: count,
                        rating: null as number | null,
                    };
                });

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
