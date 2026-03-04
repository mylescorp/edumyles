import { v } from "convex/values";
import { query } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";

export const listFeeStructures = query({
    args: {
        grade: v.optional(v.string()),
        academicYear: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
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
    },
});

export const listInvoices = query({
    args: {
        studentId: v.optional(v.string()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
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

        return await invoicesQuery.order("desc").collect();
    },
});

export const getInvoice = query({
    args: { invoiceId: v.id("invoices") },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "finance");
        requirePermission(tenant, "finance:read");

        const invoice = await ctx.db.get(args.invoiceId);
        if (!invoice || invoice.tenantId !== tenant.tenantId) return null;
        return invoice;
    },
});

export const getFinancialReport = query({
    args: {},
    handler: async (ctx) => {
        const tenant = await requireTenantContext(ctx);
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
        const totalPaid = payments.filter((p) => p.status === "completed" || p.status === "success").reduce((s, p) => s + p.amount, 0);
        const outstanding = totalBilled - totalPaid;
        const collectionRate = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;
        const byStatus = invoices.reduce((acc, i) => {
            acc[i.status] = (acc[i.status] ?? 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return { totalBilled, totalPaid, outstanding, collectionRate, invoiceCount: invoices.length, byStatus };
    },
});

export const getReceiptData = query({
    args: { paymentId: v.id("payments") },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "finance");
        requirePermission(tenant, "finance:read");

        const payment = await ctx.db.get(args.paymentId);
        if (!payment || payment.tenantId !== tenant.tenantId) return null;
        const invoice = await ctx.db.get(payment.invoiceId as unknown as Id<"invoices">);
        if (!invoice || invoice.tenantId !== tenant.tenantId) return { payment, invoice: null };
        const student = await ctx.db.get(invoice.studentId as unknown as Id<"students">);
        return { payment, invoice, student: student ?? undefined };
    },
});

export const getFeeReminders = query({
    args: { dueBefore: v.optional(v.string()), status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "finance");
        requirePermission(tenant, "finance:read");

        const status = args.status ?? "pending";
        let list = await ctx.db
            .query("invoices")
            .withIndex("by_tenant_status", (q) => q.eq("tenantId", tenant.tenantId).eq("status", status))
            .collect();
        if (args.dueBefore) list = list.filter((i) => i.dueDate <= args.dueBefore!);
        return list;
    },
});
