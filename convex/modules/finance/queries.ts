import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantContext, requireTenantSession } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";

export const listFeeStructures = query({
    args: {
        sessionToken: v.optional(v.string()),
        grade: v.optional(v.string()),
        academicYear: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "finance");
            requirePermission(tenant, "finance:read");

            let feeQuery = ctx.db
                .query("feeStructures")
                .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId));

            if (args.grade) {
                feeQuery = ctx.db
                    .query("feeStructures")
                    .withIndex("by_tenant_grade", (q) =>
                        q.eq("tenantId", tenant.tenantId).eq("grade", args.grade!)
                    );
            } else if (args.academicYear) {
                feeQuery = ctx.db
                    .query("feeStructures")
                    .withIndex("by_tenant_academic_year", (q) =>
                        q.eq("tenantId", tenant.tenantId).eq("academicYear", args.academicYear!)
                    );
            }

            return await feeQuery.collect();
        } catch {
            return [];
        }
    },
});

export const listInvoices = query({
    args: {
        sessionToken: v.optional(v.string()),
        studentId: v.optional(v.string()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "finance");
            requirePermission(tenant, "finance:read");

            let invoicesQuery = ctx.db
                .query("invoices")
                .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId));

            if (args.studentId) {
                invoicesQuery = ctx.db
                    .query("invoices")
                    .withIndex("by_tenant_student", (q) =>
                        q.eq("tenantId", tenant.tenantId).eq("studentId", args.studentId!)
                    );
            } else if (args.status) {
                invoicesQuery = ctx.db
                    .query("invoices")
                    .withIndex("by_tenant_status", (q) =>
                        q.eq("tenantId", tenant.tenantId).eq("status", args.status!)
                    );
            }

            const invoices = await invoicesQuery.order("desc").collect();
            const allPayments = await ctx.db
                .query("payments")
                .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                .collect();

            const completedPayments = allPayments.filter(
                (payment) => payment.status === "completed" || payment.status === "success"
            );

            return invoices.map((invoice) => {
                const amountPaid = completedPayments
                    .filter((payment) => payment.invoiceId === invoice._id.toString())
                    .reduce((sum, payment) => sum + payment.amount, 0);

                return {
                    ...invoice,
                    amountPaid,
                    balance: Math.max(invoice.amount - amountPaid, 0),
                };
            });
        } catch {
            return [];
        }
    },
});

export const getInvoice = query({
    args: { invoiceId: v.id("invoices"), sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "finance");
            requirePermission(tenant, "finance:read");

            const invoice = await ctx.db.get(args.invoiceId);
            if (!invoice || invoice.tenantId !== tenant.tenantId) return null;
            return invoice;
        } catch {
            return null;
        }
    },
});

export const getFinancialReport = query({
    args: { sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "finance");
            requirePermission(tenant, "finance:read");

            const invoices = await ctx.db
                .query("invoices")
                .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                .collect();
            const payments = await ctx.db
                .query("payments")
                .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                .collect();

            const totalBilled = invoices.reduce((s, i) => s + i.amount, 0);
            const totalPaid = payments
                .filter((p) => p.status === "completed" || p.status === "success")
                .reduce((s, p) => s + p.amount, 0);
            const outstanding = totalBilled - totalPaid;
            const collectionRate = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;
            const byStatus = invoices.reduce((acc, i) => {
                acc[i.status] = (acc[i.status] ?? 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            return { totalBilled, totalPaid, outstanding, collectionRate, invoiceCount: invoices.length, byStatus };
        } catch {
            return { totalBilled: 0, totalPaid: 0, outstanding: 0, collectionRate: 0, invoiceCount: 0, byStatus: {} };
        }
    },
});

export const getReceiptData = query({
    args: { paymentId: v.id("payments"), sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "finance");
            requirePermission(tenant, "finance:read");

            const payment = await ctx.db.get(args.paymentId);
            if (!payment || payment.tenantId !== tenant.tenantId) return null;
            const invoice = await ctx.db.get(payment.invoiceId as any);
            if (!invoice || (invoice as any).tenantId !== tenant.tenantId) return { payment, invoice: null };
            const student = await ctx.db.get((invoice as any).studentId as any);
            return { payment, invoice: invoice as any, student: (student as any) ?? undefined };
        } catch {
            return null;
        }
    },
});

export const getPaymentStatusForInvoice = query({
    args: {
        invoiceId: v.id("invoices"),
        sessionToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "finance");
            requirePermission(tenant, "finance:read");

            const invoice = await ctx.db.get(args.invoiceId);
            if (!invoice || invoice.tenantId !== tenant.tenantId) return null;

            const payments = await ctx.db
                .query("payments")
                .withIndex("by_invoice", (q) => q.eq("invoiceId", args.invoiceId))
                .collect();

            const paid = payments
                .filter((payment) => payment.status === "completed")
                .reduce((sum, payment) => sum + payment.amount, 0);

            return {
                invoiceId: invoice._id,
                amount: invoice.amount,
                status: invoice.status,
                amountPaid: paid,
                balance: Math.max(invoice.amount - paid, 0),
                payments,
            };
        } catch {
            return null;
        }
    },
});

export const getFeeReminders = query({
    args: { sessionToken: v.optional(v.string()), dueBefore: v.optional(v.string()), status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "finance");
            requirePermission(tenant, "finance:read");

            const status = args.status ?? "pending";
            let list = await ctx.db
                .query("invoices")
                .withIndex("by_tenant_status", (q) => q.eq("tenantId", tenant.tenantId).eq("status", status))
                .collect();
            if (args.dueBefore) list = list.filter((i) => i.dueDate <= args.dueBefore!);
            return list;
        } catch {
            return [];
        }
    },
});

export const listPendingBankTransfers = query({
    args: { sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "finance");
            requirePermission(tenant, "finance:read");

            const callbacks = await ctx.db
                .query("paymentCallbacks")
                .withIndex("by_tenant_gateway", (q) =>
                    q.eq("tenantId", tenant.tenantId).eq("gateway", "bank_transfer")
                )
                .collect();

            const pendingCallbacks = callbacks
                .filter((callback) => callback.status === "pending")
                .sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt));

            const invoices = await ctx.db
                .query("invoices")
                .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                .collect();
            const students = await ctx.db
                .query("students")
                .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                .collect();

            const invoiceMap = new Map(invoices.map((invoice) => [invoice._id.toString(), invoice]));
            const studentMap = new Map(students.map((student) => [student._id.toString(), student]));

            return pendingCallbacks.map((callback) => {
                const invoice = callback.invoiceId ? invoiceMap.get(callback.invoiceId) : null;
                const student = invoice ? studentMap.get(invoice.studentId) : null;

                return {
                    ...callback,
                    invoiceStatus: invoice?.status ?? "unknown",
                    invoiceAmount: invoice?.amount ?? callback.amount ?? 0,
                    dueDate: invoice?.dueDate ?? null,
                    studentId: invoice?.studentId ?? null,
                    studentName: student
                        ? `${student.firstName} ${student.lastName}`
                        : "Unknown Student",
                };
            });
        } catch {
            return [];
        }
    },
});
