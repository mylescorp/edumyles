import { v } from "convex/values";
import { internalQuery } from "../../_generated/server";
import { requireModuleAccess } from "../../helpers/moduleGuard";

export const getStudentLibraryStatus = internalQuery({
  args: {
    tenantId: v.string(),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireModuleAccess(ctx, "mod_library", args.tenantId);

    const borrows = await ctx.db
      .query("bookBorrows")
      .withIndex("by_borrower", (q) => q.eq("borrowerId", args.studentId))
      .collect();

    const activeBorrows = borrows.filter(
      (borrow) =>
        borrow.tenantId === args.tenantId &&
        borrow.borrowerType === "student" &&
        borrow.status === "borrowed"
    );
    const overdueCount = activeBorrows.filter((borrow) => borrow.dueDate < Date.now()).length;
    const finesKes =
      activeBorrows.reduce((sum, borrow) => sum + (borrow.fineCents ?? 0), 0) / 100;

    return {
      canBorrow: overdueCount === 0,
      restrictionReason: overdueCount > 0 ? "overdue_books" : null,
      overdueCount,
      finesKes,
    };
  },
});

export const getStudentBorrowingHistory = internalQuery({
  args: {
    tenantId: v.string(),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireModuleAccess(ctx, "mod_library", args.tenantId);

    const borrows = await ctx.db
      .query("bookBorrows")
      .withIndex("by_borrower", (q) => q.eq("borrowerId", args.studentId))
      .collect();

    return borrows
      .filter((borrow) => borrow.tenantId === args.tenantId && borrow.borrowerType === "student")
      .sort((a, b) => b.borrowedAt - a.borrowedAt);
  },
});
