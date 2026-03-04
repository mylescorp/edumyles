import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { logAction } from "../../helpers/auditLog";

export const createFeeStructure = mutation({
    args: {
        name: v.string(),
        amount: v.number(),
        academicYear: v.string(),
        grade: v.string(),
        frequency: v.string(),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "finance");
        requirePermission(tenant, "finance:write");

        const feeStructureId = await ctx.db.insert("feeStructures", {
            tenantId: tenant.tenantId,
            ...args,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "settings.updated",
            entityType: "feeStructure",
            entityId: feeStructureId,
            after: args,
        });

        return feeStructureId;
    },
});

export const generateInvoice = mutation({
    args: {
        studentId: v.string(),
        feeStructureId: v.string(),
        dueDate: v.string(),
        issuedAt: v.string(),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "finance");
        requirePermission(tenant, "finance:write");

        const feeStructure = await ctx.db.get(args.feeStructureId as any);
        if (!feeStructure || !("tenantId" in feeStructure) || (feeStructure as any).tenantId !== tenant.tenantId) {
            throw new Error("Fee structure not found");
        }

        const invoiceId = await ctx.db.insert("invoices", {
            tenantId: tenant.tenantId,
            studentId: args.studentId,
            feeStructureId: args.feeStructureId,
            amount: (feeStructure as any).amount,
            status: "pending",
            dueDate: args.dueDate,
            issuedAt: args.issuedAt,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "payment.initiated",
            entityType: "invoice",
            entityId: invoiceId,
            after: { studentId: args.studentId, amount: (feeStructure as any).amount },
        });

        return invoiceId;
    },
});

export const bulkGenerateInvoices = mutation({
    args: {
        items: v.array(v.object({
            studentId: v.string(),
            feeStructureId: v.string(),
            dueDate: v.string(),
            issuedAt: v.string(),
        })),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "finance");
        requirePermission(tenant, "finance:write");

        const now = Date.now();
        const ids: string[] = [];
        for (const item of args.items) {
            const feeStructure = await ctx.db.get(item.feeStructureId as any);
            if (!feeStructure || !("tenantId" in feeStructure) || (feeStructure as any).tenantId !== tenant.tenantId) continue;
            const invoiceId = await ctx.db.insert("invoices", {
                tenantId: tenant.tenantId,
                studentId: item.studentId,
                feeStructureId: item.feeStructureId,
                amount: (feeStructure as any).amount,
                status: "pending",
                dueDate: item.dueDate,
                issuedAt: item.issuedAt,
                createdAt: now,
                updatedAt: now,
            });
            ids.push(invoiceId);
        }
        await logAction(ctx, { tenantId: tenant.tenantId, actorId: tenant.userId, actorEmail: tenant.email, action: "payment.bulk_invoices", entityType: "invoices", entityId: ids[0] ?? "", after: { count: ids.length, ids } });
        return { success: true, count: ids.length, invoiceIds: ids };
    },
});

export const recordPayment = mutation({
    args: { invoiceId: v.id("invoices"), amount: v.number(), method: v.string(), reference: v.string() },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "finance");
        requirePermission(tenant, "finance:write");

        const invoice = await ctx.db.get(args.invoiceId);
        if (!invoice || invoice.tenantId !== tenant.tenantId) throw new Error("Invoice not found");
        if (invoice.status === "cancelled") throw new Error("Cannot record payment for cancelled invoice");

        const now = Date.now();
        const paymentId = await ctx.db.insert("payments", {
            tenantId: tenant.tenantId,
            invoiceId: args.invoiceId,
            amount: args.amount,
            method: args.method,
            reference: args.reference,
            status: "completed",
            processedAt: now,
        });

        const paidSoFar = (await ctx.db.query("payments").withIndex("by_invoice", (q) => q.eq("invoiceId", args.invoiceId)).collect()).reduce((s, p) => s + p.amount, 0);
        const newStatus = paidSoFar >= invoice.amount ? "paid" : "partially_paid";
        await ctx.db.patch(args.invoiceId, { status: newStatus, updatedAt: now });

        await logAction(ctx, { tenantId: tenant.tenantId, actorId: tenant.userId, actorEmail: tenant.email, action: "payment.recorded", entityType: "payment", entityId: paymentId, after: { invoiceId: args.invoiceId, amount: args.amount } });
        return paymentId;
    },
});
