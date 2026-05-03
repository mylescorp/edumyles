import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query } from "../../_generated/server";
import { requireTenantContext, requireTenantSession } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { getCompletedPaymentAmount, getInvoiceBalance } from "./paymentUtils";

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

export const getFeeStructures = query({
    args: {
        sessionToken: v.optional(v.string()),
        termId: v.optional(v.string()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = args.sessionToken
            ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
            : await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "finance");
        requirePermission(tenant, "finance:read");
        const structures = await ctx.db
            .query("feeStructures")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
            .collect();
        return structures
            .filter((structure) => !structure.isDeleted)
            .filter((structure) => !args.termId || structure.termId === args.termId)
            .filter((structure) => !args.status || (structure.status ?? "draft") === args.status)
            .sort((a, b) => b.updatedAt - a.updatedAt);
    },
});

export const getFeeStructure = query({
    args: { feeStructureId: v.id("feeStructures"), sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const tenant = args.sessionToken
            ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
            : await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "finance");
        requirePermission(tenant, "finance:read");
        const feeStructure = await ctx.db.get(args.feeStructureId);
        if (!feeStructure || feeStructure.tenantId !== tenant.tenantId || feeStructure.isDeleted) return null;
        return feeStructure;
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

            return invoices.map((invoice) => {
                const amountPaid = getCompletedPaymentAmount(
                    allPayments.filter((payment) => payment.invoiceId === invoice._id.toString())
                );

                return {
                    ...invoice,
                    amountPaid,
                    balance: getInvoiceBalance(invoice.amount, amountPaid),
                };
            });
        } catch {
            return [];
        }
    },
});

export const getInvoices = query({
    args: {
        sessionToken: v.optional(v.string()),
        studentId: v.optional(v.string()),
        classId: v.optional(v.string()),
        status: v.optional(v.string()),
        termId: v.optional(v.string()),
        dateFrom: v.optional(v.number()),
        dateTo: v.optional(v.number()),
        minBalance: v.optional(v.number()),
        hasOverdue: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const tenant = args.sessionToken
            ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
            : await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "finance");
        requirePermission(tenant, "finance:read");
        const [invoices, students, payments] = await Promise.all([
            ctx.db.query("invoices").withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId)).collect(),
            ctx.db.query("students").withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId)).collect(),
            ctx.db.query("payments").withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId)).collect(),
        ]);
        const studentMap = new Map(students.map((student) => [student._id.toString(), student]));
        const today = new Date().toISOString().slice(0, 10);
        return invoices
            .filter((invoice) => !invoice.isDeleted)
            .filter((invoice) => !args.studentId || invoice.studentId === args.studentId)
            .filter((invoice) => !args.status || invoice.status === args.status)
            .filter((invoice) => !args.termId || invoice.termId === args.termId)
            .filter((invoice) => {
                if (!args.classId) return true;
                const student = studentMap.get(invoice.studentId);
                return student?.classId === args.classId;
            })
            .map((invoice) => {
                const invoicePayments = payments.filter((payment) => payment.invoiceId === invoice._id.toString());
                const paidAmount = getCompletedPaymentAmount(invoicePayments);
                const totalKes = invoice.totalKes ?? invoice.amount;
                const balanceKes = invoice.balanceKes ?? getInvoiceBalance(totalKes, paidAmount);
                const student = studentMap.get(invoice.studentId);
                return {
                    ...invoice,
                    totalKes,
                    paidAmountKes: invoice.paidAmountKes ?? paidAmount,
                    balanceKes,
                    studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown Student",
                    classId: student?.classId,
                    hasOverdue: balanceKes > 0 && invoice.dueDate < today,
                };
            })
            .filter((invoice) => args.minBalance === undefined || invoice.balanceKes >= args.minBalance)
            .filter((invoice) => args.hasOverdue === undefined || invoice.hasOverdue === args.hasOverdue)
            .filter((invoice) => args.dateFrom === undefined || Date.parse(invoice.dueDate) >= args.dateFrom)
            .filter((invoice) => args.dateTo === undefined || Date.parse(invoice.dueDate) <= args.dateTo)
            .sort((a, b) => b.createdAt - a.createdAt);
    },
});

/**
 * Cursor-paginated invoice list — use with usePaginatedQuery on the frontend.
 * Enriches each page item with payment totals without fetching all payments.
 */
export const listInvoicesPaginated = query({
    args: {
        sessionToken: v.optional(v.string()),
        studentId: v.optional(v.string()),
        status: v.optional(v.string()),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const tenant = args.sessionToken
            ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
            : await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "finance");
        requirePermission(tenant, "finance:read");

        let baseQuery = ctx.db
            .query("invoices")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId));

        if (args.studentId) {
            baseQuery = ctx.db
                .query("invoices")
                .withIndex("by_tenant_student", (q) =>
                    q.eq("tenantId", tenant.tenantId).eq("studentId", args.studentId!)
                );
        } else if (args.status) {
            baseQuery = ctx.db
                .query("invoices")
                .withIndex("by_tenant_status", (q) =>
                    q.eq("tenantId", tenant.tenantId).eq("status", args.status!)
                );
        }

        const paginated = await baseQuery.order("desc").paginate(args.paginationOpts);

        // Enrich only the page items with payment data (avoids fetching all payments)
        const enrichedPage = await Promise.all(
            paginated.page.map(async (invoice) => {
                const invoicePayments = await ctx.db
                    .query("payments")
                    .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                    .filter((q) => q.eq(q.field("invoiceId"), invoice._id.toString()))
                    .collect();
                const amountPaid = getCompletedPaymentAmount(invoicePayments);
                return {
                    ...invoice,
                    amountPaid,
                    balance: getInvoiceBalance(invoice.amount, amountPaid),
                };
            })
        );

        return { ...paginated, page: enrichedPage };
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
            const [payments, student, feeStructure] = await Promise.all([
                ctx.db.query("payments").withIndex("by_invoice", (q) => q.eq("invoiceId", args.invoiceId)).collect(),
                ctx.db.get(invoice.studentId as any),
                invoice.feeStructureId !== "manual" ? ctx.db.get(invoice.feeStructureId as any) : Promise.resolve(null),
            ]);
            return { ...invoice, invoice, payments, student, feeStructure };
        } catch {
            return null;
        }
    },
});

export const getFeeCollectionSummary = query({
    args: { sessionToken: v.optional(v.string()), termId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const tenant = args.sessionToken
            ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
            : await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "finance");
        requirePermission(tenant, "finance:read");
        const invoices = (await ctx.db.query("invoices").withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId)).collect())
            .filter((invoice) => !args.termId || invoice.termId === args.termId);
        const payments = await ctx.db.query("payments").withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId)).collect();
        const totalInvoiced = invoices.reduce((sum, invoice) => sum + (invoice.totalKes ?? invoice.amount), 0);
        const confirmedPayments = payments.filter((payment) => payment.status === "completed" || payment.status === "confirmed" || payment.status === "success");
        const totalCollected = confirmedPayments.reduce((sum, payment) => sum + (payment.amountKes ?? payment.amount), 0);
        const totalOutstanding = Math.max(totalInvoiced - totalCollected, 0);
        const today = new Date().toISOString().slice(0, 10);
        const overdue = invoices.filter((invoice) => {
            const paid = confirmedPayments
                .filter((payment) => payment.invoiceId === invoice._id.toString())
                .reduce((sum, payment) => sum + (payment.amountKes ?? payment.amount), 0);
            return (invoice.totalKes ?? invoice.amount) - paid > 0 && invoice.dueDate < today;
        });
        const byPaymentMethod = confirmedPayments.reduce((acc, payment) => {
            const method = payment.paymentMethod ?? payment.method;
            acc[method] = (acc[method] ?? 0) + (payment.amountKes ?? payment.amount);
            return acc;
        }, {} as Record<string, number>);
        return {
            totalInvoiced,
            totalCollected,
            totalOutstanding,
            collectionRatePct: totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 1000) / 10 : 0,
            overdueCount: overdue.length,
            overdueAmountKes: overdue.reduce((sum, invoice) => sum + (invoice.balanceKes ?? invoice.totalKes ?? invoice.amount), 0),
            byPaymentMethod,
        };
    },
});

export const getStudentLedger = query({
    args: { sessionToken: v.optional(v.string()), studentId: v.string() },
    handler: async (ctx, args) => {
        const tenant = args.sessionToken
            ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
            : await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "finance");
        requirePermission(tenant, "finance:read");
        return await ctx.db
            .query("financeStudentLedgers")
            .withIndex("by_tenant_student", (q) => q.eq("tenantId", tenant.tenantId).eq("studentId", args.studentId))
            .first();
    },
});

export const getScholarships = query({
    args: { sessionToken: v.optional(v.string()), includeInactive: v.optional(v.boolean()) },
    handler: async (ctx, args) => {
        const tenant = args.sessionToken
            ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
            : await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "finance");
        requirePermission(tenant, "finance:read");
        return (await ctx.db.query("financeScholarships").withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId)).collect())
            .filter((scholarship) => !scholarship.isDeleted)
            .filter((scholarship) => args.includeInactive || scholarship.isActive);
    },
});

export const getMpesaStkStatus = query({
    args: { checkoutRequestId: v.string(), sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const tenant = args.sessionToken
            ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
            : await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "finance");
        const request = await ctx.db
            .query("mpesaStkRequests")
            .withIndex("by_checkoutRequestId", (q) => q.eq("checkoutRequestId", args.checkoutRequestId))
            .first();
        if (!request || request.tenantId !== tenant.tenantId) return null;
        return { status: request.status, receiptNumber: request.mpesaReceiptNumber, resultDesc: request.resultDesc };
    },
});

export const getDailyCollectionReport = query({
    args: { sessionToken: v.optional(v.string()), date: v.string() },
    handler: async (ctx, args) => {
        const tenant = args.sessionToken
            ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
            : await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "finance");
        requirePermission(tenant, "finance:read");
        const start = Date.parse(`${args.date}T00:00:00.000Z`);
        const end = Date.parse(`${args.date}T23:59:59.999Z`);
        const payments = (await ctx.db.query("payments").withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId)).collect())
            .filter((payment) => {
                const paidAt = payment.paidAt ?? payment.processedAt;
                return paidAt >= start && paidAt <= end && (payment.status === "completed" || payment.status === "confirmed" || payment.status === "success");
            });
        const byMethod = payments.reduce((acc, payment) => {
            const method = payment.paymentMethod ?? payment.method;
            acc[method] = (acc[method] ?? 0) + (payment.amountKes ?? payment.amount);
            return acc;
        }, {} as Record<string, number>);
        return {
            payments,
            totalKes: payments.reduce((sum, payment) => sum + (payment.amountKes ?? payment.amount), 0),
            byMethod,
            invoicesSettled: new Set(payments.map((payment) => payment.invoiceId)).size,
        };
    },
});

export const getArrearsReport = query({
    args: {
        sessionToken: v.optional(v.string()),
        termId: v.optional(v.string()),
        classId: v.optional(v.string()),
        minDaysOverdue: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const tenant = args.sessionToken
            ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
            : await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "finance");
        requirePermission(tenant, "finance:read");
        const [invoices, students] = await Promise.all([
            ctx.db.query("invoices").withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId)).collect(),
            ctx.db.query("students").withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId)).collect(),
        ]);
        const studentMap = new Map(students.map((student) => [student._id.toString(), student]));
        const now = Date.now();
        const arrearsByStudent = new Map<string, { outstandingKes: number; oldestInvoiceDays: number }>();
        for (const invoice of invoices) {
            const balance = invoice.balanceKes ?? Math.max((invoice.totalKes ?? invoice.amount) - (invoice.paidAmountKes ?? 0), 0);
            if (invoice.isDeleted || balance <= 0 || (args.termId && invoice.termId !== args.termId)) continue;
            const days = Math.max(Math.floor((now - Date.parse(invoice.dueDate)) / 86400000), 0);
            if (args.minDaysOverdue && days < args.minDaysOverdue) continue;
            const student = studentMap.get(invoice.studentId);
            if (args.classId && student?.classId !== args.classId) continue;
            const current = arrearsByStudent.get(invoice.studentId) ?? { outstandingKes: 0, oldestInvoiceDays: 0 };
            arrearsByStudent.set(invoice.studentId, {
                outstandingKes: current.outstandingKes + balance,
                oldestInvoiceDays: Math.max(current.oldestInvoiceDays, days),
            });
        }
        const studentsWithArrears = Array.from(arrearsByStudent.entries()).map(([studentId, arrears]) => {
            const student = studentMap.get(studentId);
            return {
                studentId,
                name: student ? `${student.firstName} ${student.lastName}` : "Unknown Student",
                class: student?.classId ?? null,
                ...arrears,
            };
        });
        return {
            students: studentsWithArrears.sort((a, b) => b.outstandingKes - a.outstandingKes),
            totalOutstandingKes: studentsWithArrears.reduce((sum, student) => sum + student.outstandingKes, 0),
        };
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

            const paid = getCompletedPaymentAmount(payments);

            return {
                invoiceId: invoice._id,
                amount: invoice.amount,
                status: invoice.status,
                amountPaid: paid,
                balance: getInvoiceBalance(invoice.amount, paid),
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
