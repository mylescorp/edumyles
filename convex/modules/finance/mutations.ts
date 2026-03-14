import { v } from "convex/values";
import { mutation, internalMutation } from "../../_generated/server";
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

export const generateReceipt = mutation({
  args: {
    paymentId: v.id("payments"),
    format: v.union(v.literal("pdf"), v.literal("html")),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:read");

    // Get payment with related invoice and student data
    const payment = await ctx.db.get(args.paymentId);
    if (!payment || payment.tenantId !== tenant.tenantId) {
      throw new Error("Payment not found");
    }

    const invoice = await ctx.db.get(payment.invoiceId as any);
    if (!invoice || (invoice as any).tenantId !== tenant.tenantId) {
      throw new Error("Invoice not found");
    }

    const student = await ctx.db.get((invoice as any).studentId as any);
    if (!student || (student as any).tenantId !== tenant.tenantId) {
      throw new Error("Student not found");
    }

    // Generate receipt data
    const receiptData = {
      receiptNumber: `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      paymentId: payment._id,
      invoiceNumber: (invoice as any).invoiceNumber,
      issueDate: new Date().toISOString(),
      studentName: `${(student as any).firstName} ${(student as any).lastName}`,
      admissionNumber: (student as any).admissionNumber,
      class: (student as any).classId,
      amount: payment.amount,
      method: payment.method,
      reference: payment.reference,
      processedAt: payment.processedAt,
      tenantInfo: {
        name: (tenant as any).organizationName || "School Name",
        address: (tenant as any).address || "School Address",
        phone: (tenant as any).phone || "School Phone",
        email: tenant.email || "School Email",
      },
      items: [
        {
          description: `School Fees - ${(invoice as any).academicYear}`,
          amount: (invoice as any).amount,
        }
      ],
      subtotal: (invoice as any).amount,
      tax: 0, // Can be calculated based on tax rules
      total: (invoice as any).amount,
      status: "PAID",
    };

    return receiptData;
  },
});

export const updatePaymentStatus = mutation({
  args: {
    paymentId: v.id("payments"),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed"), v.literal("refunded")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:write");

    const payment = await ctx.db.get(args.paymentId);
    if (!payment || payment.tenantId !== tenant.tenantId) {
      throw new Error("Payment not found");
    }

    const updateData: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.status === "completed") {
      updateData.processedAt = Date.now();
    }

    if (args.notes) {
      updateData.notes = args.notes;
    }

    await ctx.db.patch(args.paymentId, updateData);

    // Update invoice status if payment is completed
    if (args.status === "completed") {
      const invoice = await ctx.db.get(payment.invoiceId as any);
      if (invoice && (invoice as any).tenantId === tenant.tenantId) {
        await ctx.db.patch(payment.invoiceId as any, {
          status: "paid",
          updatedAt: Date.now(),
        });
      }
    }

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "payment.status_updated",
      entityType: "payment",
      entityId: args.paymentId,
      after: { status: args.status, notes: args.notes },
    });

    return payment._id;
  },
});

// Used by payment actions to store pending callback (e.g. M-Pesa CheckoutRequestID)
export const savePaymentCallback = internalMutation({
  args: {
    tenantId: v.string(),
    gateway: v.string(),
    externalId: v.string(),
    invoiceId: v.string(),
    amount: v.number(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("paymentCallbacks", {
      tenantId: args.tenantId,
      gateway: args.gateway,
      externalId: args.externalId,
      invoiceId: args.invoiceId,
      amount: args.amount,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Called from webhooks; reconciles gateway callback and records payment
export const recordPaymentFromGatewayInternal = internalMutation({
  args: {
    gateway: v.string(),
    externalId: v.string(),
    resultCode: v.number(), // 0 = success for M-Pesa
    reference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("paymentCallbacks")
      .withIndex("by_external_id", (q) =>
        q.eq("gateway", args.gateway).eq("externalId", args.externalId)
      )
      .first();

    if (!existing) {
      throw new Error("Payment callback not found");
    }
    if (existing.status !== "pending") {
      return { success: true, alreadyProcessed: true };
    }

    const now = Date.now();
    if (args.resultCode !== 0) {
      await ctx.db.patch(existing._id, { status: "failed", updatedAt: now, payload: { resultCode: args.resultCode } });
      return { success: false, reason: "result_code_non_zero" };
    }

    const invoiceId = existing.invoiceId;
    if (!invoiceId) {
      await ctx.db.patch(existing._id, { status: "failed", updatedAt: now });
      throw new Error("Callback missing invoiceId");
    }

    const invoice = await ctx.db.get(invoiceId as any);
    if (!invoice || (invoice as any).tenantId !== existing.tenantId) {
      await ctx.db.patch(existing._id, { status: "failed", updatedAt: now });
      throw new Error("Invoice not found");
    }
    if ((invoice as any).status === "cancelled") {
      await ctx.db.patch(existing._id, { status: "failed", updatedAt: now });
      throw new Error("Invoice cancelled");
    }

    const amount = existing.amount ?? (invoice as any).amount;
    const reference = args.reference ?? existing.externalId;

    await ctx.db.insert("payments", {
      tenantId: existing.tenantId,
      invoiceId: invoiceId as any,
      amount,
      method: args.gateway,
      reference,
      status: "completed",
      processedAt: now,
    });

    const paidSoFar = (await ctx.db.query("payments").withIndex("by_invoice", (q) => q.eq("invoiceId", invoiceId as any)).collect()).reduce((s: number, p: any) => s + p.amount, 0);
    const newStatus = paidSoFar >= (invoice as any).amount ? "paid" : "partially_paid";
    await ctx.db.patch(invoiceId as any, { status: newStatus, updatedAt: now });

    await ctx.db.patch(existing._id, { status: "completed", reference, updatedAt: now });

    return { success: true, alreadyProcessed: false };
  },
});
