import { v } from "convex/values";
import { internalQuery } from "../../_generated/server";
import { requireModuleAccess } from "../../helpers/moduleGuard";

function getCompletedPaymentsTotal(payments: Array<{ amount: number; status: string }>) {
  return payments
    .filter((payment) => payment.status === "completed" || payment.status === "success")
    .reduce((sum, payment) => sum + payment.amount, 0);
}

function getOutstandingInvoices(invoices: Array<{ _id: any; amount: number; dueDate: string }>, payments: Array<{ invoiceId: string; amount: number; status: string }>) {
  return invoices.map((invoice) => {
    const paidAmount = getCompletedPaymentsTotal(
      payments.filter((payment) => payment.invoiceId === invoice._id.toString())
    );
    return {
      ...invoice,
      outstandingKes: Math.max(invoice.amount - paidAmount, 0),
    };
  });
}

export const getStudentBalance = internalQuery({
  args: {
    tenantId: v.string(),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireModuleAccess(ctx, "mod_finance", args.tenantId);

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_tenant_student", (q) =>
        q.eq("tenantId", args.tenantId).eq("studentId", args.studentId)
      )
      .collect();
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    const outstanding = getOutstandingInvoices(invoices, payments);
    const balanceKes = outstanding.reduce((sum, invoice) => sum + invoice.outstandingKes, 0);
    const today = new Date().toISOString().slice(0, 10);

    return {
      balanceKes,
      hasOverdueInvoices: outstanding.some(
        (invoice) => invoice.outstandingKes > 0 && invoice.dueDate < today
      ),
      lastUpdatedAt: Date.now(),
    };
  },
});

export const getStudentInvoiceSummary = internalQuery({
  args: {
    tenantId: v.string(),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireModuleAccess(ctx, "mod_finance", args.tenantId);

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_tenant_student", (q) =>
        q.eq("tenantId", args.tenantId).eq("studentId", args.studentId)
      )
      .collect();
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    const outstanding = getOutstandingInvoices(invoices, payments);
    const today = new Date().toISOString().slice(0, 10);
    const overdue = outstanding.filter(
      (invoice) => invoice.outstandingKes > 0 && invoice.dueDate < today
    );
    const oldestOverdue = overdue
      .map((invoice) => Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / 86400000))
      .sort((a, b) => b - a)[0] ?? 0;

    return {
      totalOutstandingKes: outstanding.reduce((sum, invoice) => sum + invoice.outstandingKes, 0),
      overdueCount: overdue.length,
      oldestOverdueDays: oldestOverdue,
    };
  },
});

export const getFeeStructureForClass = internalQuery({
  args: {
    tenantId: v.string(),
    classId: v.string(),
    termId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireModuleAccess(ctx, "mod_finance", args.tenantId);

    const classes = await ctx.db
      .query("classes")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
    const schoolClass = classes.find((entry) => entry._id.toString() === args.classId);

    if (!schoolClass) {
      return null;
    }

    const feeStructures = await ctx.db
      .query("feeStructures")
      .withIndex("by_tenant_grade", (q) =>
        q.eq("tenantId", args.tenantId).eq("grade", schoolClass.level ?? schoolClass.name)
      )
      .collect();

    if (args.termId) {
      const matchingAcademicYear = args.termId.slice(0, 4);
      return (
        feeStructures.find((structure) => structure.academicYear === matchingAcademicYear) ?? null
      );
    }

    return feeStructures.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
  },
});

export const getStudentOutstandingAmount = internalQuery({
  args: {
    tenantId: v.string(),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireModuleAccess(ctx, "mod_finance", args.tenantId);

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_tenant_student", (q) =>
        q.eq("tenantId", args.tenantId).eq("studentId", args.studentId)
      )
      .collect();
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    return getOutstandingInvoices(invoices, payments).reduce(
      (sum, invoice) => sum + invoice.outstandingKes,
      0
    );
  },
});
