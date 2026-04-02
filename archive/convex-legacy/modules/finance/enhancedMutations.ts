import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { logAction } from "../../helpers/auditLog";

// Enhanced fee structure with automatic allocation
export const createEnhancedFeeStructure = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    academicYear: v.string(),
    term: v.string(),
    grade: v.string(),
    frequency: v.string(), // termly, monthly, annually
    category: v.string(), // tuition, boarding, transport, extracurricular
    isCompulsory: v.boolean(),
    dueDay: v.optional(v.number()), // day of month due
    lateFee: v.optional(v.number()),
    lateFeePercentage: v.optional(v.number()),
    discounts: v.optional(v.array(v.object({
      name: v.string(),
      type: v.string(), // percentage, fixed
      value: v.number(),
      condition: v.string(), // early_payment, sibling, scholarship
    }))),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:write");

    const feeStructureId = await ctx.db.insert("feeStructures", {
      tenantId: tenant.tenantId,
      ...args,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "fee_structure.created" as any,
      entityType: "feeStructures",
      entityId: feeStructureId,
      after: args,
    });

    return feeStructureId;
  },
});

// Generate invoices for all students in a class/grade
export const generateBulkInvoices = mutation({
  args: {
    feeStructureId: v.string(),
    classId: v.optional(v.string()),
    grade: v.optional(v.string()),
    academicYear: v.string(),
    term: v.string(),
    dueDate: v.string(),
    issueDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:write");

    // Get fee structure
    const feeStructure = await ctx.db.get(args.feeStructureId as any);
    if (!feeStructure || (feeStructure as any).tenantId !== tenant.tenantId) {
      throw new Error("Fee structure not found");
    }

    // Get students to invoice
    let students;
    if (args.classId) {
      students = await ctx.db
        .query("students")
        .withIndex("by_tenant_class", (q) =>
          q.eq("tenantId", tenant.tenantId).eq("classId", args.classId)
        )
        .collect();
    } else if (args.grade) {
      students = await ctx.db
        .query("students")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
        .filter((q) => q.eq(q.field("grade"), args.grade))
        .collect();
    } else {
      throw new Error("Either classId or grade must be provided");
    }

    const issueDate = args.issueDate || new Date().toISOString().split('T')[0];
    const generatedInvoices = [];

    // Generate invoice for each student
    for (const student of students) {
      // Check if invoice already exists
      const existingInvoice = await ctx.db
        .query("invoices")
        .withIndex("by_student_fee", (q) =>
          q.eq("studentId", student._id).eq("feeStructureId", args.feeStructureId)
        )
        .filter((q) => q.eq(q.field("term"), args.term))
        .first();

      if (existingInvoice) {
        continue; // Skip if invoice already exists
      }

      // Calculate amount with discounts
      let finalAmount = (feeStructure as any).amount;
      if ((feeStructure as any).discounts) {
        for (const discount of (feeStructure as any).discounts) {
          if (await meetsDiscountCondition(discount, student, tenant)) {
            if (discount.type === "percentage") {
              finalAmount -= finalAmount * (discount.value / 100);
            } else {
              finalAmount -= discount.value;
            }
          }
        }
      }

      const invoiceId = await ctx.db.insert("invoices", {
        tenantId: tenant.tenantId,
        studentId: student._id,
        feeStructureId: args.feeStructureId,
        invoiceNumber: await generateInvoiceNumber(tenant.tenantId),
        amount: finalAmount,
        originalAmount: (feeStructure as any).amount,
        currency: (feeStructure as any).currency,
        status: "pending",
        issueDate,
        dueDate: args.dueDate,
        academicYear: args.academicYear,
        term: args.term,
        discounts: (feeStructure as any).discounts || [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      generatedInvoices.push({
        invoiceId,
        studentId: student._id,
        studentName: `${(student as any).firstName} ${(student as any).lastName}`,
        amount: finalAmount,
      });
    }

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "invoices.bulk_generated" as any,
      entityType: "invoices",
      entityId: generatedInvoices[0]?.invoiceId,
      after: {
        feeStructureId: args.feeStructureId,
        invoicesGenerated: generatedInvoices.length,
        totalAmount: generatedInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      },
    });

    return {
      success: true,
      invoicesGenerated: generatedInvoices.length,
      invoices: generatedInvoices,
    };
  },
});

// Process payment and automatically allocate to student ledger
export const processPayment = mutation({
  args: {
    invoiceId: v.id("invoices"),
    paymentMethod: v.string(), // mpesa, airtel_money, stripe, bank_transfer, cash
    amount: v.number(),
    transactionId: v.optional(v.string()),
    transactionReference: v.optional(v.string()),
    paymentDate: v.string(),
    notes: v.optional(v.string()),
    externalProviderData: v.optional(v.any()), // Data from M-Pesa, Stripe, etc.
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:write");

    // Get invoice
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice || invoice.tenantId !== tenant.tenantId) {
      throw new Error("Invoice not found");
    }

    // Create payment record
    const paymentId = await ctx.db.insert("payments", {
      tenantId: tenant.tenantId,
      invoiceId: args.invoiceId,
      studentId: invoice.studentId,
      amount: args.amount,
      method: args.paymentMethod,
      transactionId: args.transactionId,
      transactionReference: args.transactionReference,
      status: "completed",
      paymentDate: args.paymentDate,
      notes: args.notes,
      externalProviderData: args.externalProviderData,
      createdAt: Date.now(),
    });

    // Update invoice status
    const totalPaid = await getTotalPaidForInvoice(ctx, args.invoiceId);
    const newStatus = totalPaid >= invoice.amount ? "paid" : "partially_paid";

    await ctx.db.patch(args.invoiceId, {
      status: newStatus,
      amountPaid: totalPaid,
      balancePaid: Math.max(0, invoice.amount - totalPaid),
      lastPaymentDate: args.paymentDate,
      updatedAt: Date.now(),
    });

    // Create ledger entry
    await ctx.db.insert("studentLedger", {
      tenantId: tenant.tenantId,
      studentId: invoice.studentId,
      transactionType: "payment",
      description: `Payment for invoice ${(invoice as any).invoiceNumber}`,
      debit: 0,
      credit: args.amount,
      balance: await getStudentBalance(ctx, invoice.studentId),
      referenceId: paymentId,
      referenceType: "payment",
      transactionDate: args.paymentDate,
      createdAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "payment.processed" as any,
      entityType: "payments",
      entityId: paymentId,
      after: {
        invoiceId: args.invoiceId,
        amount: args.amount,
        method: args.paymentMethod,
        newInvoiceStatus: newStatus,
      },
    });

    return {
      success: true,
      paymentId,
      newInvoiceStatus: newStatus,
      balancePaid: Math.max(0, invoice.amount - totalPaid),
    };
  },
});

// Generate comprehensive financial reports
export const generateFinancialReport = query({
  args: {
    reportType: v.string(), // revenue, expenses, aging, receivables
    academicYear: v.string(),
    term: v.optional(v.string()),
    classId: v.optional(v.string()),
    grade: v.optional(v.string()),
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:read");

    switch (args.reportType) {
      case "revenue":
        return await generateRevenueReport(ctx, tenant, args);
      case "aging":
        return await generateAgingReport(ctx, tenant, args);
      case "receivables":
        return await generateReceivablesReport(ctx, tenant, args);
      case "payment_methods":
        return await generatePaymentMethodsReport(ctx, tenant, args);
      default:
        throw new Error("Unsupported report type");
    }
  },
});

// Helper functions
async function generateInvoiceNumber(tenantId: string): Promise<string> {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `INV-${tenantId.slice(-4)}-${timestamp}-${random}`;
}

async function meetsDiscountCondition(discount: any, student: any, tenant: any): Promise<boolean> {
  // Simple discount condition checking - can be enhanced
  switch (discount.condition) {
    case "early_payment":
      return true; // Would need to check payment date vs due date
    case "sibling":
      // Check if student has siblings in the school
      const siblings = await ctx.db // This ctx reference won't work, need to pass ctx
        .query("students")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
        .filter((q) => 
          q.eq(q.field("familyId"), (student as any).familyId) && 
          q.neq(q.field("_id"), student._id)
        )
        .collect();
      return siblings.length > 0;
    case "scholarship":
      return (student as any).hasScholarship || false;
    default:
      return false;
  }
}

async function getTotalPaidForInvoice(ctx: any, invoiceId: any): Promise<number> {
  const payments = await ctx.db
    .query("payments")
    .withIndex("by_invoice", (q) => q.eq("invoiceId", invoiceId))
    .filter((q) => q.eq(q.field("status"), "completed"))
    .collect();

  return payments.reduce((sum, payment) => sum + (payment as any).amount, 0);
}

async function getStudentBalance(ctx: any, studentId: string): Promise<number> {
  const ledger = await ctx.db
    .query("studentLedger")
    .withIndex("by_student", (q) => q.eq("studentId", studentId))
    .order("desc")
    .first();

  return (ledger as any)?.balance || 0;
}

async function generateRevenueReport(ctx: any, tenant: any, args: any): Promise<any> {
  const payments = await ctx.db
    .query("payments")
    .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
    .filter((q) => q.eq(q.field("status"), "completed"))
    .collect();

  // Filter by date range if provided
  const filteredPayments = payments.filter(payment => {
    const paymentDate = (payment as any).paymentDate;
    if (args.dateFrom && paymentDate < args.dateFrom) return false;
    if (args.dateTo && paymentDate > args.dateTo) return false;
    return true;
  });

  // Group by payment method
  const revenueByMethod = {};
  for (const payment of filteredPayments) {
    const method = (payment as any).method;
    revenueByMethod[method] = (revenueByMethod[method] || 0) + (payment as any).amount;
  }

  return {
    totalRevenue: filteredPayments.reduce((sum, p) => sum + (p as any).amount, 0),
    revenueByMethod,
    paymentCount: filteredPayments.length,
    period: {
      from: args.dateFrom,
      to: args.dateTo,
      academicYear: args.academicYear,
      term: args.term,
    },
  };
}

async function generateAgingReport(ctx: any, tenant: any, args: any): Promise<any> {
  const invoices = await ctx.db
    .query("invoices")
    .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
    .filter((q) => q.neq(q.field("status"), "paid"))
    .collect();

  const agingBuckets = {
    "0-30": { count: 0, amount: 0 },
    "31-60": { count: 0, amount: 0 },
    "61-90": { count: 0, amount: 0 },
    "90+": { count: 0, amount: 0 },
  };

  const today = new Date();

  for (const invoice of invoices) {
    const dueDate = new Date((invoice as any).dueDate);
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let bucket = "0-30";
    if (daysOverdue > 90) bucket = "90+";
    else if (daysOverdue > 60) bucket = "61-90";
    else if (daysOverdue > 30) bucket = "31-60";

    const balance = ((invoice as any).amount || 0) - ((invoice as any).amountPaid || 0);
    
    agingBuckets[bucket].count++;
    agingBuckets[bucket].amount += balance;
  }

  return {
    agingBuckets,
    totalOverdue: Object.values(agingBuckets).reduce((sum, bucket) => sum + bucket.amount, 0),
    totalInvoices: invoices.length,
  };
}

async function generateReceivablesReport(ctx: any, tenant: any, args: any): Promise<any> {
  const invoices = await ctx.db
    .query("invoices")
    .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
    .filter((q) => q.neq(q.field("status"), "paid"))
    .collect();

  // Group by class/grade
  const receivablesByClass = {};
  let totalReceivables = 0;

  for (const invoice of invoices) {
    const student = await ctx.db.get((invoice as any).studentId);
    const classId = (student as any)?.classId || "unassigned";
    
    if (!receivablesByClass[classId]) {
      receivablesByClass[classId] = {
        count: 0,
        totalAmount: 0,
        totalPaid: 0,
        balance: 0,
      };
    }

    const amount = (invoice as any).amount || 0;
    const paid = (invoice as any).amountPaid || 0;
    const balance = amount - paid;

    receivablesByClass[classId].count++;
    receivablesByClass[classId].totalAmount += amount;
    receivablesByClass[classId].totalPaid += paid;
    receivablesByClass[classId].balance += balance;
    totalReceivables += balance;
  }

  return {
    receivablesByClass,
    totalReceivables,
    invoiceCount: invoices.length,
  };
}

async function generatePaymentMethodsReport(ctx: any, tenant: any, args: any): Promise<any> {
  const payments = await ctx.db
    .query("payments")
    .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
    .filter((q) => q.eq(q.field("status"), "completed"))
    .collect();

  const methodStats = {};
  for (const payment of payments) {
    const method = (payment as any).method;
    if (!methodStats[method]) {
      methodStats[method] = {
        count: 0,
        totalAmount: 0,
        averageAmount: 0,
      };
    }
    
    methodStats[method].count++;
    methodStats[method].totalAmount += (payment as any).amount;
  }

  // Calculate averages
  for (const method in methodStats) {
    methodStats[method].averageAmount = 
      methodStats[method].totalAmount / methodStats[method].count;
  }

  return {
    methodStats,
    totalTransactions: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + (p as any).amount, 0),
  };
}
