import { v } from "convex/values";
import { mutation, internalMutation } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { requireTenantContext, requireTenantSession } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule, requireModuleFeatureAccess } from "../../helpers/moduleGuard";
import { logAction } from "../../helpers/auditLog";
import { publishEvent } from "../../eventBus";
import {
  buildLedgerDescription,
  getCompletedPaymentAmount,
  getInvoiceBalance,
  getInvoiceStatusFromPayments,
  resolveFinanceCurrency,
} from "./paymentUtils";

async function calculateInvoicePaymentSummary(ctx: any, invoiceId: any) {
  const payments = await ctx.db
    .query("payments")
    .withIndex("by_invoice", (q: any) => q.eq("invoiceId", invoiceId))
    .collect();

  const completedAmount = getCompletedPaymentAmount(payments);

  return {
    payments,
    completedAmount,
  };
}

async function reconcileInvoiceStatus(ctx: any, invoice: any, now: number) {
  const { completedAmount } = await calculateInvoicePaymentSummary(ctx, invoice._id);
  const newStatus = getInvoiceStatusFromPayments(invoice.amount, completedAmount);

  await ctx.db.patch(invoice._id, {
    status: newStatus,
    updatedAt: now,
  });

  return {
    amountPaid: completedAmount,
    balance: getInvoiceBalance(invoice.amount, completedAmount),
    status: newStatus,
  };
}

function isoDateFromMillis(value: number) {
  return new Date(value).toISOString().slice(0, 10);
}

function calculateFeeTotals(args: {
  components?: Array<{ amountKes: number; mandatory?: boolean }>;
  subtotalKes?: number;
  discountKes?: number;
  lateFineKes?: number;
  vatEnabled?: boolean;
  vatRatePct?: number;
}) {
  const subtotalKes =
    args.subtotalKes ??
    (args.components ?? []).reduce((sum, component) => sum + Math.max(component.amountKes, 0), 0);
  const discountKes = Math.max(args.discountKes ?? 0, 0);
  const lateFineKes = Math.max(args.lateFineKes ?? 0, 0);
  const taxable = Math.max(subtotalKes - discountKes + lateFineKes, 0);
  const vatKes = args.vatEnabled ? Math.round((taxable * (args.vatRatePct ?? 16)) / 100) : 0;
  const totalKes = taxable + vatKes;
  return { subtotalKes, discountKes, lateFineKes, vatKes, totalKes };
}

async function nextInvoiceNumber(ctx: any, tenantId: string) {
  const count = (await ctx.db
    .query("invoices")
    .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenantId))
    .collect()).length + 1;
  const suffix = String(count).padStart(5, "0");
  return `INV-${tenantId.replace(/^TENANT-/, "").slice(0, 8)}-${suffix}`;
}

async function refreshStudentLedger(ctx: any, tenantId: string, studentId: string) {
  const invoices = await ctx.db
    .query("invoices")
    .withIndex("by_tenant_student", (q: any) => q.eq("tenantId", tenantId).eq("studentId", studentId))
    .collect();
  const payments = await ctx.db
    .query("payments")
    .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenantId))
    .collect();
  const studentPayments = payments.filter((payment: any) => payment.studentId === studentId);
  const totalInvoicedKes = invoices
    .filter((invoice: any) => !invoice.isDeleted && !["voided", "cancelled"].includes(invoice.status))
    .reduce((sum: number, invoice: any) => sum + (invoice.totalKes ?? invoice.amount ?? 0), 0);
  const totalDiscountKes = invoices.reduce((sum: number, invoice: any) => sum + (invoice.discountKes ?? 0), 0);
  const totalPaidKes = studentPayments
    .filter((payment: any) => payment.status === "completed" || payment.status === "confirmed" || payment.status === "success")
    .reduce((sum: number, payment: any) => sum + (payment.amountKes ?? payment.amount ?? 0), 0);
  const outstandingKes = Math.max(totalInvoicedKes - totalPaidKes, 0);
  const today = new Date().toISOString().slice(0, 10);
  const hasOverdueInvoices = invoices.some((invoice: any) => {
    const balance = invoice.balanceKes ?? Math.max((invoice.totalKes ?? invoice.amount ?? 0) - (invoice.paidAmountKes ?? 0), 0);
    return balance > 0 && invoice.dueDate < today;
  });
  const now = Date.now();
  const existing = await ctx.db
    .query("financeStudentLedgers")
    .withIndex("by_tenant_student", (q: any) => q.eq("tenantId", tenantId).eq("studentId", studentId))
    .first();
  const payload = {
    tenantId,
    studentId,
    totalInvoicedKes,
    totalPaidKes,
    totalDiscountKes,
    outstandingKes,
    hasOverdueInvoices,
    lastPaymentAt: studentPayments.sort((a: any, b: any) => (b.paidAt ?? b.processedAt ?? 0) - (a.paidAt ?? a.processedAt ?? 0))[0]?.paidAt,
    lastUpdatedAt: now,
  };
  if (existing) {
    await ctx.db.patch(existing._id, payload);
    return existing._id;
  }
  return await ctx.db.insert("financeStudentLedgers", payload);
}

async function requireFinanceFeature(ctx: any, tenant: any, featureKey: string) {
  await requireModuleFeatureAccess(ctx, "mod_finance", tenant.tenantId, tenant.role, featureKey);
}

async function recalculateInvoiceFromPayments(ctx: any, invoice: any, now: number) {
  const payments = await ctx.db
    .query("payments")
    .withIndex("by_invoice", (q: any) => q.eq("invoiceId", invoice._id))
    .collect();
  const paidAmountKes = getCompletedPaymentAmount(payments);
  const totalKes = invoice.totalKes ?? invoice.amount;
  const balanceKes = Math.max(totalKes - paidAmountKes, 0);
  const status = balanceKes <= 0 ? "paid" : paidAmountKes > 0 ? "partial" : invoice.status;
  await ctx.db.patch(invoice._id, {
    paidAmountKes,
    balanceKes,
    status,
    updatedAt: now,
  });
  await refreshStudentLedger(ctx, invoice.tenantId, invoice.studentId);
  return { paidAmountKes, balanceKes, status };
}

function calculateScholarshipDiscount(invoice: any, scholarship: any) {
  const componentNames = new Set(scholarship.applicableFeeComponents ?? []);
  const components = invoice.components ?? [{ name: invoice.description ?? "Invoice", amountKes: invoice.subtotalKes ?? invoice.amount, mandatory: true }];
  const eligibleAmount = components
    .filter((component: any) => componentNames.size === 0 || componentNames.has(component.name))
    .reduce((sum: number, component: any) => sum + component.amountKes, 0);
  if (scholarship.type === "percentage") {
    return Math.min(eligibleAmount, Math.round((eligibleAmount * scholarship.value) / 100));
  }
  return Math.min(eligibleAmount, scholarship.value);
}

async function ensureLedgerEntryForPayment(ctx: any, args: {
  tenantId: string;
  invoice: any;
  paymentId: string;
  amount: number;
  method: string;
  reference: string;
  processedAt: number;
}) {
  const existingEntry = await ctx.db
    .query("ledgerEntries")
    .withIndex("by_payment", (q: any) => q.eq("paymentId", args.paymentId))
    .first();

  if (existingEntry) {
    return existingEntry._id;
  }

  return await ctx.db.insert("ledgerEntries", {
    tenantId: args.tenantId,
    studentId: args.invoice.studentId,
    invoiceId: args.invoice._id,
    paymentId: args.paymentId,
    type: "payment",
    amount: args.amount,
    currency: resolveFinanceCurrency(args.invoice),
    description: buildLedgerDescription({
      method: args.method,
      reference: args.reference,
      invoiceId: String(args.invoice._id),
    }),
    createdAt: args.processedAt,
  });
}

async function postConfirmedPayment(ctx: any, args: {
  tenantId: string;
  invoice: any;
  amount: number;
  method: string;
  reference: string;
  processedAt: number;
}) {
  const paymentId = await ctx.db.insert("payments", {
    tenantId: args.tenantId,
    invoiceId: args.invoice._id,
    studentId: args.invoice.studentId,
    amount: args.amount,
    amountKes: args.amount,
    paymentMethod: args.method,
    method: args.method,
    reference: args.reference,
    referenceNumber: args.reference,
    recordedBy: args.invoice.createdBy,
    paidAt: args.processedAt,
    receiptNumber: `RCP-${args.processedAt}-${Math.floor(Math.random() * 1000)}`,
    isDeleted: false,
    status: "completed",
    processedAt: args.processedAt,
  });

  const ledgerEntryId = await ensureLedgerEntryForPayment(ctx, {
    tenantId: args.tenantId,
    invoice: args.invoice,
    paymentId,
    amount: args.amount,
    method: args.method,
    reference: args.reference,
    processedAt: args.processedAt,
  });

  const summary = await reconcileInvoiceStatus(ctx, args.invoice, args.processedAt);
  await ctx.db.patch(args.invoice._id, {
    paidAmountKes: summary.amountPaid,
    balanceKes: summary.balance,
  });
  await refreshStudentLedger(ctx, args.tenantId, args.invoice.studentId);

  return {
    paymentId,
    ledgerEntryId,
    summary,
  };
}

async function findPaymentCallback(ctx: any, args: {
  gateway: string;
  externalId?: string;
  checkoutSessionId?: string;
  paymentIntentId?: string;
}) {
  if (args.checkoutSessionId) {
    const byCheckoutSessionId = await ctx.db
      .query("paymentCallbacks")
      .withIndex("by_checkout_session_id", (q: any) =>
        q.eq("gateway", args.gateway).eq("checkoutSessionId", args.checkoutSessionId)
      )
      .first();

    if (byCheckoutSessionId) {
      return byCheckoutSessionId;
    }
  }

  if (args.paymentIntentId) {
    const byPaymentIntentId = await ctx.db
      .query("paymentCallbacks")
      .withIndex("by_payment_intent_id", (q: any) =>
        q.eq("gateway", args.gateway).eq("paymentIntentId", args.paymentIntentId)
      )
      .first();

    if (byPaymentIntentId) {
      return byPaymentIntentId;
    }
  }

  if (args.externalId) {
    return await ctx.db
      .query("paymentCallbacks")
      .withIndex("by_external_id", (q: any) =>
        q.eq("gateway", args.gateway).eq("externalId", args.externalId)
      )
      .first();
  }

  return null;
}

export const createFeeStructure = mutation({
  args: {
    name: v.string(),
    amount: v.optional(v.number()),
    academicYear: v.optional(v.string()),
    grade: v.optional(v.string()),
    frequency: v.optional(v.string()),
    termId: v.optional(v.string()),
    academicYearId: v.optional(v.string()),
    feeCategory: v.optional(v.string()),
    applicableToClassIds: v.optional(v.array(v.string())),
    components: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      amountKes: v.number(),
      mandatory: v.boolean(),
      description: v.optional(v.string()),
    }))),
    dueDate: v.optional(v.number()),
    lateFineEnabled: v.optional(v.boolean()),
    lateFineType: v.optional(v.string()),
    lateFineAmount: v.optional(v.number()),
    gracePeriodDays: v.optional(v.number()),
    vatEnabled: v.optional(v.boolean()),
    vatRatePct: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:write");

    const mandatoryComponents = (args.components ?? []).filter((component) => component.mandatory);
    const totalAmountKes =
      args.amount ??
      mandatoryComponents.reduce((sum, component) => sum + Math.max(component.amountKes, 0), 0);
    const feeStructureId = await ctx.db.insert("feeStructures", {
      tenantId: tenant.tenantId,
      name: args.name,
      amount: totalAmountKes,
      academicYear: args.academicYear ?? args.academicYearId ?? new Date().getFullYear().toString(),
      academicYearId: args.academicYearId,
      termId: args.termId,
      feeCategory: args.feeCategory,
      applicableToClassIds: args.applicableToClassIds ?? [],
      components: args.components,
      totalAmountKes,
      dueDate: args.dueDate,
      lateFineEnabled: args.lateFineEnabled ?? false,
      lateFineType: args.lateFineType ?? "fixed_kes",
      lateFineAmount: args.lateFineAmount ?? 0,
      gracePeriodDays: args.gracePeriodDays ?? 0,
      vatEnabled: args.vatEnabled ?? false,
      vatRatePct: args.vatRatePct ?? 16,
      status: "draft",
      isDeleted: false,
      createdBy: tenant.userId,
      grade: args.grade ?? "all",
      frequency: args.frequency ?? "termly",
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

export const recordManualPayment = mutation({
  args: {
    invoiceId: v.id("invoices"),
    amountKes: v.number(),
    paymentMethod: v.string(),
    referenceNumber: v.optional(v.string()),
    bankSlipUrl: v.optional(v.string()),
    paidAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:write");
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice || invoice.tenantId !== tenant.tenantId || invoice.isDeleted) {
      throw new Error("Invoice not found");
    }
    if (["voided", "waived", "cancelled"].includes(invoice.status)) {
      throw new Error("Cannot record payment for a closed invoice");
    }
    const reference = args.referenceNumber ?? `MANUAL-${Date.now()}`;
    const processedAt = args.paidAt ?? Date.now();
    const { paymentId, summary } = await postConfirmedPayment(ctx, {
      tenantId: tenant.tenantId,
      invoice,
      amount: args.amountKes,
      method: args.paymentMethod,
      reference,
      processedAt,
    });
    await ctx.db.patch(paymentId as any, {
      bankSlipUrl: args.bankSlipUrl,
      recordedBy: tenant.userId,
      referenceNumber: reference,
    });
    await publishEvent(ctx, {
      eventType: "finance.payment.received",
      publisherModule: "mod_finance",
      tenantId: tenant.tenantId,
      payload: {
        paymentId,
        studentId: invoice.studentId,
        amountKes: args.amountKes,
        provider: args.paymentMethod,
        transactionId: reference,
        invoiceIds: [args.invoiceId],
        remainingOutstandingKes: summary.balance,
      },
    });
    if (summary.balance <= 0) {
      await publishEvent(ctx, {
        eventType: "finance.invoice.paid",
        publisherModule: "mod_finance",
        tenantId: tenant.tenantId,
        payload: { invoiceId: args.invoiceId, studentId: invoice.studentId, totalKes: invoice.totalKes ?? invoice.amount, paidAt: processedAt },
      });
    }
    return paymentId;
  },
});

export const waiveInvoice = mutation({
  args: { invoiceId: v.id("invoices"), reason: v.string() },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:approve");
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice || invoice.tenantId !== tenant.tenantId) throw new Error("Invoice not found");
    await ctx.db.patch(args.invoiceId, {
      status: "waived",
      balanceKes: 0,
      cancellationReason: args.reason,
      cancelledBy: tenant.userId,
      cancelledAt: Date.now(),
      updatedAt: Date.now(),
    });
    await refreshStudentLedger(ctx, tenant.tenantId, invoice.studentId);
    return { success: true };
  },
});

export const voidInvoice = mutation({
  args: { invoiceId: v.id("invoices"), reason: v.string() },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:approve");
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice || invoice.tenantId !== tenant.tenantId) throw new Error("Invoice not found");
    if (!["pending", "draft"].includes(invoice.status)) throw new Error("Only pending or draft invoices can be voided");
    await ctx.db.patch(args.invoiceId, {
      status: "voided",
      balanceKes: 0,
      cancellationReason: args.reason,
      cancelledBy: tenant.userId,
      cancelledAt: Date.now(),
      updatedAt: Date.now(),
    });
    await refreshStudentLedger(ctx, tenant.tenantId, invoice.studentId);
    return { success: true };
  },
});

export const cancelInvoice = mutation({
  args: { invoiceId: v.id("invoices"), reason: v.string() },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:write");
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice || invoice.tenantId !== tenant.tenantId) throw new Error("Invoice not found");
    await ctx.db.patch(args.invoiceId, {
      status: "voided",
      cancelledAt: Date.now(),
      cancelledBy: tenant.userId,
      cancellationReason: args.reason,
      balanceKes: 0,
      updatedAt: Date.now(),
    });
    await refreshStudentLedger(ctx, tenant.tenantId, invoice.studentId);
    return { success: true };
  },
});

export const updateFeeStructure = mutation({
  args: {
    feeStructureId: v.id("feeStructures"),
    updates: v.object({
      name: v.optional(v.string()),
      feeCategory: v.optional(v.string()),
      applicableToClassIds: v.optional(v.array(v.string())),
      components: v.optional(v.array(v.object({
        id: v.string(),
        name: v.string(),
        amountKes: v.number(),
        mandatory: v.boolean(),
        description: v.optional(v.string()),
      }))),
      dueDate: v.optional(v.number()),
      lateFineEnabled: v.optional(v.boolean()),
      lateFineType: v.optional(v.string()),
      lateFineAmount: v.optional(v.number()),
      gracePeriodDays: v.optional(v.number()),
      vatEnabled: v.optional(v.boolean()),
      vatRatePct: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:write");
    const feeStructure = await ctx.db.get(args.feeStructureId);
    if (!feeStructure || feeStructure.tenantId !== tenant.tenantId || feeStructure.isDeleted) {
      throw new Error("Fee structure not found");
    }
    if ((feeStructure.status ?? "draft") !== "draft") {
      throw new Error("Only draft fee structures can be updated");
    }
    const updates: any = { ...args.updates, updatedAt: Date.now() };
    if (args.updates.components) {
      updates.totalAmountKes = args.updates.components
        .filter((component) => component.mandatory)
        .reduce((sum, component) => sum + Math.max(component.amountKes, 0), 0);
      updates.amount = updates.totalAmountKes;
    }
    await ctx.db.patch(args.feeStructureId, updates);
    return { success: true };
  },
});

export const activateFeeStructure = mutation({
  args: { feeStructureId: v.id("feeStructures") },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:write");
    const feeStructure = await ctx.db.get(args.feeStructureId);
    if (!feeStructure || feeStructure.tenantId !== tenant.tenantId || feeStructure.isDeleted) {
      throw new Error("Fee structure not found");
    }
    const applicableClassIds = feeStructure.applicableToClassIds ?? [];
    const students = (await ctx.db
      .query("students")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .collect()).filter((student) =>
        student.status !== "inactive" &&
        (applicableClassIds.length === 0 || (student.classId && applicableClassIds.includes(student.classId)))
      );
    const now = Date.now();
    let invoicesCreated = 0;
    for (const student of students) {
      const existing = (await ctx.db
        .query("invoices")
        .withIndex("by_tenant_student", (q) => q.eq("tenantId", tenant.tenantId).eq("studentId", student._id.toString()))
        .collect()).find((invoice) => invoice.feeStructureId === args.feeStructureId && invoice.termId === feeStructure.termId);
      if (existing) continue;
      const components = (feeStructure.components ?? [{
        name: feeStructure.name,
        amountKes: feeStructure.amount,
        mandatory: true,
      }]).map((component: any) => ({
        name: component.name,
        amountKes: component.amountKes,
        mandatory: component.mandatory,
      }));
      const totals = calculateFeeTotals({
        components,
        vatEnabled: feeStructure.vatEnabled,
        vatRatePct: feeStructure.vatRatePct,
      });
      const dueDate = isoDateFromMillis(feeStructure.dueDate ?? now);
      const invoiceId = await ctx.db.insert("invoices", {
        tenantId: tenant.tenantId,
        studentId: student._id.toString(),
        feeStructureId: args.feeStructureId,
        type: "term_fees",
        description: feeStructure.name,
        components,
        amount: totals.totalKes,
        subtotalKes: totals.subtotalKes,
        discountKes: totals.discountKes,
        lateFineKes: totals.lateFineKes,
        vatKes: totals.vatKes,
        totalKes: totals.totalKes,
        paidAmountKes: 0,
        balanceKes: totals.totalKes,
        status: "pending",
        termId: feeStructure.termId,
        academicYearId: feeStructure.academicYearId,
        invoiceNumber: await nextInvoiceNumber(ctx, tenant.tenantId),
        isDeleted: false,
        createdBy: tenant.userId,
        dueDate,
        issuedAt: isoDateFromMillis(now),
        createdAt: now,
        updatedAt: now,
      });
      await refreshStudentLedger(ctx, tenant.tenantId, student._id.toString());
      invoicesCreated += 1;
      await publishEvent(ctx, {
        eventType: "finance.invoice.created",
        publisherModule: "mod_finance",
        tenantId: tenant.tenantId,
        payload: { invoiceId, studentId: student._id.toString(), totalKes: totals.totalKes, dueDate, components },
      });
    }
    await ctx.db.patch(args.feeStructureId, { status: "active", updatedAt: now });
    await publishEvent(ctx, {
      eventType: "finance.fee.structure.activated",
      publisherModule: "mod_finance",
      tenantId: tenant.tenantId,
      payload: { feeStructureId: args.feeStructureId, termId: feeStructure.termId, invoicesCreated },
    });
    return { invoicesCreated };
  },
});

export const archiveFeeStructure = mutation({
  args: { feeStructureId: v.id("feeStructures") },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:write");
    const feeStructure = await ctx.db.get(args.feeStructureId);
    if (!feeStructure || feeStructure.tenantId !== tenant.tenantId) throw new Error("Fee structure not found");
    await ctx.db.patch(args.feeStructureId, { status: "archived", updatedAt: Date.now() });
    return { success: true };
  },
});

export const createManualInvoice = mutation({
  args: {
    studentId: v.string(),
    type: v.optional(v.string()),
    description: v.string(),
    components: v.array(v.object({ name: v.string(), amountKes: v.number(), mandatory: v.boolean() })),
    dueDate: v.number(),
    discountKes: v.optional(v.number()),
    vatEnabled: v.optional(v.boolean()),
    vatRatePct: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:write");
    const student = await ctx.db.get(args.studentId as any);
    if (!student || (student as any).tenantId !== tenant.tenantId) throw new Error("Student not found");
    const now = Date.now();
    const totals = calculateFeeTotals(args);
    const invoiceId = await ctx.db.insert("invoices", {
      tenantId: tenant.tenantId,
      studentId: args.studentId,
      feeStructureId: "manual",
      type: args.type ?? "other",
      description: args.description,
      components: args.components,
      amount: totals.totalKes,
      subtotalKes: totals.subtotalKes,
      discountKes: totals.discountKes,
      lateFineKes: totals.lateFineKes,
      vatKes: totals.vatKes,
      totalKes: totals.totalKes,
      paidAmountKes: 0,
      balanceKes: totals.totalKes,
      status: "pending",
      invoiceNumber: await nextInvoiceNumber(ctx, tenant.tenantId),
      isDeleted: false,
      createdBy: tenant.userId,
      dueDate: isoDateFromMillis(args.dueDate),
      issuedAt: isoDateFromMillis(now),
      createdAt: now,
      updatedAt: now,
    });
    await refreshStudentLedger(ctx, tenant.tenantId, args.studentId);
    await publishEvent(ctx, {
      eventType: "finance.invoice.created",
      publisherModule: "mod_finance",
      tenantId: tenant.tenantId,
      payload: { invoiceId, studentId: args.studentId, totalKes: totals.totalKes, dueDate: args.dueDate, components: args.components },
    });
    return invoiceId;
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
    if (
      !feeStructure ||
      !("tenantId" in feeStructure) ||
      (feeStructure as any).tenantId !== tenant.tenantId
    ) {
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

    await ctx.scheduler.runAfter(0, internal.modules.platform.onboarding.completeFirstActionForTenant, {
      tenantId: tenant.tenantId,
      userId: tenant.userId,
      source: "invoice",
      count: 1,
    });

    return invoiceId;
  },
});

export const bulkGenerateInvoices = mutation({
  args: {
    items: v.array(
      v.object({
        studentId: v.string(),
        feeStructureId: v.string(),
        dueDate: v.string(),
        issuedAt: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:write");

    const now = Date.now();
    const ids: string[] = [];
    for (const item of args.items) {
      const feeStructure = await ctx.db.get(item.feeStructureId as any);
      if (
        !feeStructure ||
        !("tenantId" in feeStructure) ||
        (feeStructure as any).tenantId !== tenant.tenantId
      )
        continue;
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
    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "payment.bulk_invoices",
      entityType: "invoices",
      entityId: ids[0] ?? "",
      after: { count: ids.length, ids },
    });

    if (ids.length > 0) {
      await ctx.scheduler.runAfter(0, internal.modules.platform.onboarding.completeFirstActionForTenant, {
        tenantId: tenant.tenantId,
        userId: tenant.userId,
        source: "invoice",
        count: ids.length,
      });
    }

    return { success: true, count: ids.length, invoiceIds: ids };
  },
});

export const recordPayment = mutation({
  args: {
    invoiceId: v.id("invoices"),
    amount: v.number(),
    method: v.string(),
    reference: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:write");

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice || invoice.tenantId !== tenant.tenantId) throw new Error("Invoice not found");
    if (invoice.status === "cancelled")
      throw new Error("Cannot record payment for cancelled invoice");

    const now = Date.now();
    const { paymentId, ledgerEntryId, summary } = await postConfirmedPayment(ctx, {
      tenantId: tenant.tenantId,
      invoice,
      amount: args.amount,
      method: args.method,
      reference: args.reference,
      processedAt: now,
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "payment.recorded",
      entityType: "payment",
      entityId: paymentId,
      after: {
        invoiceId: args.invoiceId,
        amount: args.amount,
        invoiceStatus: summary.status,
        balance: summary.balance,
        ledgerEntryId,
      },
    });
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
        },
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
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
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
        await reconcileInvoiceStatus(ctx, invoice, Date.now());
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

export const createScholarship = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("percentage"), v.literal("fixed_kes")),
    value: v.number(),
    applicableFeeComponents: v.optional(v.array(v.string())),
    maxStudents: v.optional(v.number()),
    academicYearId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    await requireFinanceFeature(ctx, tenant, "manage_scholarships");
    requirePermission(tenant, "finance:write");
    return await ctx.db.insert("financeScholarships", {
      tenantId: tenant.tenantId,
      name: args.name,
      type: args.type,
      value: args.value,
      applicableFeeComponents: args.applicableFeeComponents ?? [],
      maxStudents: args.maxStudents,
      currentRecipients: 0,
      academicYearId: args.academicYearId,
      isActive: true,
      isDeleted: false,
      createdBy: tenant.userId,
      createdAt: Date.now(),
    });
  },
});

export const assignScholarship = mutation({
  args: {
    scholarshipId: v.id("financeScholarships"),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    await requireFinanceFeature(ctx, tenant, "manage_scholarships");
    requirePermission(tenant, "finance:write");
    const scholarship = await ctx.db.get(args.scholarshipId);
    if (!scholarship || scholarship.tenantId !== tenant.tenantId || !scholarship.isActive || scholarship.isDeleted) {
      throw new Error("Scholarship not found");
    }
    if (scholarship.maxStudents && scholarship.currentRecipients >= scholarship.maxStudents) {
      throw new Error("Scholarship recipient limit reached");
    }
    const existing = await ctx.db
      .query("financeScholarshipRecipients")
      .withIndex("by_tenant_student", (q) => q.eq("tenantId", tenant.tenantId).eq("studentId", args.studentId))
      .collect();
    if (existing.some((recipient) => recipient.scholarshipId === args.scholarshipId && recipient.isActive)) {
      return { success: true, alreadyAssigned: true };
    }
    const now = Date.now();
    await ctx.db.insert("financeScholarshipRecipients", {
      tenantId: tenant.tenantId,
      scholarshipId: args.scholarshipId,
      studentId: args.studentId,
      assignedBy: tenant.userId,
      assignedAt: now,
      isActive: true,
    });
    await ctx.db.patch(args.scholarshipId, {
      currentRecipients: scholarship.currentRecipients + 1,
    });
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_tenant_student", (q) => q.eq("tenantId", tenant.tenantId).eq("studentId", args.studentId))
      .collect();
    let recalculated = 0;
    for (const invoice of invoices) {
      if (invoice.isDeleted || ["paid", "voided", "waived", "cancelled"].includes(invoice.status)) continue;
      const discountKes = calculateScholarshipDiscount(invoice, scholarship);
      const subtotalKes = invoice.subtotalKes ?? invoice.amount;
      const lateFineKes = invoice.lateFineKes ?? 0;
      const vatRatePct = invoice.vatKes ? 16 : 0;
      const taxable = Math.max(subtotalKes - discountKes + lateFineKes, 0);
      const vatKes = vatRatePct > 0 ? Math.round((taxable * vatRatePct) / 100) : 0;
      const totalKes = taxable + vatKes;
      const paidAmountKes = invoice.paidAmountKes ?? 0;
      await ctx.db.patch(invoice._id, {
        discountKes,
        scholarshipId: args.scholarshipId,
        vatKes,
        totalKes,
        amount: totalKes,
        balanceKes: Math.max(totalKes - paidAmountKes, 0),
        updatedAt: now,
      });
      recalculated += 1;
    }
    await refreshStudentLedger(ctx, tenant.tenantId, args.studentId);
    return { success: true, alreadyAssigned: false, recalculated };
  },
});

export const revokeScholarship = mutation({
  args: {
    scholarshipId: v.id("financeScholarships"),
    studentId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    await requireFinanceFeature(ctx, tenant, "manage_scholarships");
    requirePermission(tenant, "finance:write");
    const scholarship = await ctx.db.get(args.scholarshipId);
    if (!scholarship || scholarship.tenantId !== tenant.tenantId) throw new Error("Scholarship not found");
    const recipients = await ctx.db
      .query("financeScholarshipRecipients")
      .withIndex("by_scholarship", (q) => q.eq("scholarshipId", args.scholarshipId))
      .collect();
    const active = recipients.find((recipient) => recipient.studentId === args.studentId && recipient.isActive);
    if (!active) return { success: true, alreadyRevoked: true };
    await ctx.db.patch(active._id, {
      isActive: false,
      revokedAt: Date.now(),
      revokedBy: tenant.userId,
      revokedReason: args.reason,
    });
    await ctx.db.patch(args.scholarshipId, {
      currentRecipients: Math.max(scholarship.currentRecipients - 1, 0),
    });
    return { success: true, alreadyRevoked: false };
  },
});

export const createFeeCategory = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    await requireFinanceFeature(ctx, tenant, "manage_fee_structures");
    requirePermission(tenant, "finance:write");
    return await ctx.db.insert("financeFeeCategories", {
      tenantId: tenant.tenantId,
      name: args.name,
      description: args.description,
      isDefault: args.isDefault ?? false,
      isDeleted: false,
      createdAt: Date.now(),
    });
  },
});

export const generateDemandNotice = mutation({
  args: {
    studentIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    await requireFinanceFeature(ctx, tenant, "view_all_invoices");
    requirePermission(tenant, "finance:read");
    const notices: Array<{ studentId: string; noticeId: string; pdfUrl: string; outstandingKes: number }> = [];
    for (const studentId of args.studentIds) {
      const invoices = await ctx.db
        .query("invoices")
        .withIndex("by_tenant_student", (q) => q.eq("tenantId", tenant.tenantId).eq("studentId", studentId))
        .collect();
      const openInvoices = invoices.filter((invoice) => !invoice.isDeleted && !["paid", "voided", "waived", "cancelled"].includes(invoice.status));
      const outstandingKes = openInvoices.reduce((sum, invoice) => sum + (invoice.balanceKes ?? invoice.totalKes ?? invoice.amount), 0);
      if (outstandingKes <= 0) continue;
      const now = Date.now();
      const noticeNumber = `DN-${tenant.tenantId.replace(/^TENANT-/, "").slice(0, 8)}-${now}-${notices.length + 1}`;
      const noticeId = await ctx.db.insert("financeDemandNotices", {
        tenantId: tenant.tenantId,
        studentId,
        outstandingKes,
        invoiceIds: openInvoices.map((invoice) => invoice._id.toString()),
        noticeNumber,
        status: "generated",
        generatedBy: tenant.userId,
        generatedAt: now,
        pdfUrl: `/api/documents/demand-notice/${noticeNumber}`,
      });
      notices.push({ studentId, noticeId: noticeId.toString(), pdfUrl: `/api/documents/demand-notice/${noticeNumber}`, outstandingKes });
    }
    return { pdfUrls: notices.map((notice) => notice.pdfUrl), notices };
  },
});

export const createAdvanceFeeCollection = mutation({
  args: {
    studentId: v.string(),
    amountKes: v.number(),
    forTermId: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    await requireFinanceFeature(ctx, tenant, "create_invoices");
    requirePermission(tenant, "finance:write");
    const student = await ctx.db.get(args.studentId as any);
    if (!student || (student as any).tenantId !== tenant.tenantId) throw new Error("Student not found");
    const term = await ctx.db.get(args.forTermId as any);
    const dueDate = (term as any)?.startDate ? Date.parse((term as any).startDate) : Date.now();
    const now = Date.now();
    const invoiceId = await ctx.db.insert("invoices", {
      tenantId: tenant.tenantId,
      studentId: args.studentId,
      feeStructureId: "advance",
      type: "term_fees",
      description: args.notes ?? "Advance fee collection",
      components: [{ name: "Advance fees", amountKes: args.amountKes, mandatory: true }],
      amount: args.amountKes,
      subtotalKes: args.amountKes,
      discountKes: 0,
      lateFineKes: 0,
      vatKes: 0,
      totalKes: args.amountKes,
      paidAmountKes: 0,
      balanceKes: args.amountKes,
      termId: args.forTermId,
      status: "pending",
      invoiceNumber: await nextInvoiceNumber(ctx, tenant.tenantId),
      isDeleted: false,
      createdBy: tenant.userId,
      dueDate: isoDateFromMillis(dueDate),
      issuedAt: isoDateFromMillis(now),
      createdAt: now,
      updatedAt: now,
    });
    await refreshStudentLedger(ctx, tenant.tenantId, args.studentId);
    return invoiceId;
  },
});

export const applyLateFines = internalMutation({
  args: {},
  handler: async (ctx) => {
    const installs = await ctx.db
      .query("module_installs")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .collect();
    const activeTenantIds = new Set(
      installs.filter((install: any) => install.moduleSlug === "mod_finance").map((install: any) => install.tenantId)
    );
    if (activeTenantIds.size === 0) {
      const tenants = await ctx.db.query("tenants").collect();
      tenants.forEach((tenant: any) => activeTenantIds.add(tenant.tenantId));
    }
    const today = new Date().toISOString().slice(0, 10);
    const now = Date.now();
    let finesApplied = 0;
    for (const tenantId of activeTenantIds) {
      const invoices = await ctx.db
        .query("invoices")
        .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenantId))
        .collect();
      for (const invoice of invoices) {
        if (invoice.isDeleted || ["paid", "voided", "waived", "cancelled"].includes(invoice.status)) continue;
        if (invoice.dueDate >= today || (invoice.lateFineKes ?? 0) > 0 || !invoice.feeStructureId || invoice.feeStructureId === "manual") continue;
        const feeStructure = await ctx.db.get(invoice.feeStructureId as any);
        if (!feeStructure || !(feeStructure as any).lateFineEnabled) continue;
        const dueTime = Date.parse(invoice.dueDate);
        const graceMs = ((feeStructure as any).gracePeriodDays ?? 0) * 86400000;
        if (now <= dueTime + graceMs) continue;
        const base = invoice.subtotalKes ?? invoice.amount;
        const fine =
          (feeStructure as any).lateFineType === "percentage"
            ? Math.round((base * ((feeStructure as any).lateFineAmount ?? 0)) / 100)
            : ((feeStructure as any).lateFineAmount ?? 0);
        if (fine <= 0) continue;
        const totalKes = (invoice.totalKes ?? invoice.amount) + fine;
        const paidAmountKes = invoice.paidAmountKes ?? 0;
        await ctx.db.patch(invoice._id, {
          lateFineKes: fine,
          totalKes,
          amount: totalKes,
          balanceKes: Math.max(totalKes - paidAmountKes, 0),
          status: "overdue",
          updatedAt: now,
        });
        await refreshStudentLedger(ctx, tenantId, invoice.studentId);
        await publishEvent(ctx, {
          eventType: "finance.invoice.overdue",
          publisherModule: "mod_finance",
          tenantId,
          payload: {
            invoiceId: invoice._id,
            studentId: invoice.studentId,
            totalKes,
            outstandingKes: Math.max(totalKes - paidAmountKes, 0),
            daysOverdue: Math.max(Math.floor((now - dueTime) / 86400000), 0),
          },
        });
        finesApplied += 1;
      }
    }
    return { finesApplied };
  },
});

export const verifyBankTransfer = mutation({
  args: {
    callbackId: v.id("paymentCallbacks"),
    sessionToken: v.optional(v.string()),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:write");

    const callback = await ctx.db.get(args.callbackId);
    if (!callback || callback.tenantId !== tenant.tenantId) {
      throw new Error("Bank transfer request not found");
    }
    if (callback.gateway !== "bank_transfer") {
      throw new Error("Invalid payment gateway");
    }
    if (callback.status === "completed") {
      return { success: true, alreadyVerified: true };
    }
    if (callback.status !== "pending") {
      throw new Error("Only pending bank transfers can be verified");
    }
    if (!callback.invoiceId) {
      throw new Error("Bank transfer request is missing invoice details");
    }

    const invoice = await ctx.db.get(callback.invoiceId as any);
    if (!invoice || (invoice as any).tenantId !== tenant.tenantId) {
      throw new Error("Invoice not found");
    }
    if ((invoice as any).status === "cancelled") {
      throw new Error("Cannot verify payment for a cancelled invoice");
    }

    const now = Date.now();
    const amount = callback.amount ?? (invoice as any).amount;
    const reference = callback.reference ?? callback.externalId;

    const { paymentId, ledgerEntryId, summary } = await postConfirmedPayment(ctx, {
      tenantId: tenant.tenantId,
      invoice,
      amount,
      method: "bank_transfer",
      reference,
      processedAt: now,
    });

    await ctx.db.patch(args.callbackId, {
      status: "completed",
      reference,
      updatedAt: now,
      payload: {
        ...(callback.payload ?? {}),
        adminNote: args.adminNote,
        verifiedAt: now,
        verifiedBy: tenant.userId,
        paymentId,
        ledgerEntryId,
        amountPaid: summary.amountPaid,
        balance: summary.balance,
      },
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "payment.verified",
      entityType: "paymentCallback",
      entityId: args.callbackId,
      after: {
        gateway: "bank_transfer",
        paymentId,
        invoiceId: callback.invoiceId,
        amount,
        invoiceStatus: summary.status,
        balance: summary.balance,
      },
    });

    return {
      success: true,
      alreadyVerified: false,
      paymentId,
      invoiceStatus: summary.status,
      balance: summary.balance,
    };
  },
});

export const saveMpesaStkRequest = internalMutation({
  args: {
    tenantId: v.string(),
    invoiceId: v.string(),
    studentId: v.optional(v.string()),
    phoneNumber: v.string(),
    amountKes: v.number(),
    checkoutRequestId: v.string(),
    merchantRequestId: v.string(),
    accountReference: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("mpesaStkRequests")
      .withIndex("by_checkoutRequestId", (q) => q.eq("checkoutRequestId", args.checkoutRequestId))
      .first();
    const invoice = await ctx.db.get(args.invoiceId as any);
    const payload = {
      tenantId: args.tenantId,
      invoiceId: args.invoiceId,
      studentId: args.studentId ?? (invoice as any)?.studentId ?? "unknown",
      phoneNumber: args.phoneNumber,
      amountKes: args.amountKes,
      checkoutRequestId: args.checkoutRequestId,
      merchantRequestId: args.merchantRequestId,
      accountReference: args.accountReference,
      status: "pending",
      initiatedAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }
    return await ctx.db.insert("mpesaStkRequests", payload);
  },
});

export const confirmMpesaPayment = internalMutation({
  args: {
    checkoutRequestId: v.string(),
    resultCode: v.number(),
    resultDesc: v.optional(v.string()),
    mpesaReceiptNumber: v.optional(v.string()),
    transactionDate: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    amountKes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db
      .query("mpesaStkRequests")
      .withIndex("by_checkoutRequestId", (q) => q.eq("checkoutRequestId", args.checkoutRequestId))
      .first();
    const now = Date.now();
    if (request) {
      await ctx.db.patch(request._id, {
        status: args.resultCode === 0 ? "completed" : "failed",
        resultCode: args.resultCode,
        resultDesc: args.resultDesc,
        mpesaReceiptNumber: args.mpesaReceiptNumber,
        transactionDate: args.transactionDate,
        completedAt: now,
      });
    }
    const callback = await findPaymentCallback(ctx, {
      gateway: "mpesa",
      externalId: args.checkoutRequestId,
    });
    if (!callback) {
      return { success: false, reason: "payment_callback_not_found" };
    }
    if (callback.status !== "pending") {
      return { success: true, alreadyProcessed: true };
    }
    if (args.resultCode !== 0) {
      await ctx.db.patch(callback._id, {
        status: "failed",
        updatedAt: now,
        payload: { ...(callback.payload ?? {}), resultCode: args.resultCode, resultDesc: args.resultDesc },
      });
      return { success: false, reason: "result_code_non_zero" };
    }
    const invoice = await ctx.db.get(callback.invoiceId as any);
    if (!invoice || (invoice as any).tenantId !== callback.tenantId) {
      await ctx.db.patch(callback._id, { status: "failed", updatedAt: now });
      throw new Error("Invoice not found");
    }
    const amount = args.amountKes ?? callback.amount ?? (invoice as any).amount;
    const reference = args.mpesaReceiptNumber ?? callback.externalId;
    const { paymentId, ledgerEntryId, summary } = await postConfirmedPayment(ctx, {
      tenantId: callback.tenantId,
      invoice,
      amount,
      method: "mpesa",
      reference,
      processedAt: now,
    });
    await ctx.db.patch(callback._id, {
      status: "completed",
      reference,
      updatedAt: now,
      payload: {
        ...(callback.payload ?? {}),
        resultCode: args.resultCode,
        resultDesc: args.resultDesc,
        paymentId,
        ledgerEntryId,
        amountPaid: summary.amountPaid,
        balance: summary.balance,
      },
    });
    return { success: true, alreadyProcessed: false, paymentId, invoiceStatus: summary.status, balance: summary.balance };
  },
});

// Used by payment actions to store pending callback (e.g. M-Pesa CheckoutRequestID)
export const savePaymentCallback = internalMutation({
  args: {
    tenantId: v.string(),
    gateway: v.union(v.literal("mpesa"), v.literal("airtel"), v.literal("stripe"), v.literal("bank_transfer")),
    externalId: v.string(),
    checkoutSessionId: v.optional(v.string()),
    paymentIntentId: v.optional(v.string()),
    invoiceId: v.string(),
    amount: v.number(),
    reference: v.optional(v.string()),
    payload: v.optional(v.any()),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("refunded")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("paymentCallbacks", {
      tenantId: args.tenantId,
      gateway: args.gateway,
      externalId: args.externalId,
      checkoutSessionId: args.checkoutSessionId,
      paymentIntentId: args.paymentIntentId,
      invoiceId: args.invoiceId,
      amount: args.amount,
      reference: args.reference,
      payload: args.payload,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

// Called from webhooks; reconciles gateway callback and records payment
export const recordPaymentFromGatewayInternal = internalMutation({
  args: {
    gateway: v.string(),
    externalId: v.string(),
    checkoutSessionId: v.optional(v.string()),
    paymentIntentId: v.optional(v.string()),
    resultCode: v.number(), // 0 = success for M-Pesa
    reference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await findPaymentCallback(ctx, {
      gateway: args.gateway,
      externalId: args.externalId,
      checkoutSessionId: args.checkoutSessionId,
      paymentIntentId: args.paymentIntentId,
    });

    if (!existing) {
      throw new Error("Payment callback not found");
    }
    if (existing.status !== "pending") {
      return { success: true, alreadyProcessed: true };
    }

    const now = Date.now();
    if (args.resultCode !== 0) {
      await ctx.db.patch(existing._id, {
        status: "failed",
        updatedAt: now,
        payload: { resultCode: args.resultCode },
      });
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

    const { paymentId, ledgerEntryId, summary } = await postConfirmedPayment(ctx, {
      tenantId: existing.tenantId,
      invoice,
      amount,
      method: args.gateway,
      reference,
      processedAt: now,
    });

    await ctx.db.patch(existing._id, {
      status: "completed",
      reference,
      updatedAt: now,
      checkoutSessionId: args.checkoutSessionId ?? existing.checkoutSessionId,
      paymentIntentId: args.paymentIntentId ?? existing.paymentIntentId,
      payload: {
        ...(existing.payload ?? {}),
        resultCode: args.resultCode,
        paymentId,
        ledgerEntryId,
        amountPaid: summary.amountPaid,
        balance: summary.balance,
      },
    });

    return {
      success: true,
      alreadyProcessed: false,
      paymentId,
      invoiceStatus: summary.status,
      balance: summary.balance,
    };
  },
});

// Update payment callback with actual external ID
export const updatePaymentCallbackExternalId = internalMutation({
  args: {
    callbackId: v.id("paymentCallbacks"),
    externalId: v.string(),
    checkoutSessionId: v.optional(v.string()),
    paymentIntentId: v.optional(v.string()),
    reference: v.optional(v.string()),
    payload: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.callbackId, {
      externalId: args.externalId,
      ...(args.checkoutSessionId !== undefined ? { checkoutSessionId: args.checkoutSessionId } : {}),
      ...(args.paymentIntentId !== undefined ? { paymentIntentId: args.paymentIntentId } : {}),
      ...(args.reference !== undefined ? { reference: args.reference } : {}),
      ...(args.payload !== undefined
        ? {
            payload: args.payload,
            updatedAt: Date.now(),
          }
        : {}),
    });
    return args.callbackId;
  },
});
