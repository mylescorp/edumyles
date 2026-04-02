import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";

// Fine calculation rules
export interface FineRule {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  type: "daily" | "weekly" | "monthly" | "one_time";
  amount: number;
  maxAmount?: number;
  gracePeriodDays: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface BookLoan {
  id: string;
  tenantId: string;
  bookId: string;
  studentId: string;
  borrowedAt: number;
  dueDate: number;
  returnedAt?: number;
  status: "active" | "returned" | "overdue";
  fineAccrued: number;
  finePaid: number;
  createdAt: number;
}

export interface FineCalculation {
  loanId: string;
  daysOverdue: number;
  fineAmount: number;
  appliedRules: string[];
  breakdown: {
    ruleId: string;
    ruleName: string;
    amount: number;
    days: number;
  }[];
}

// Create fine rules
export const createFineRule = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    type: v.string(),
    amount: v.number(),
    maxAmount: v.optional(v.number()),
    gracePeriodDays: v.number(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "library");
    requirePermission(tenant, "library:write");

    const now = Date.now();
    const ruleId = await ctx.db.insert("fineRules", {
      tenantId: tenant.tenantId,
      name: args.name,
      description: args.description,
      type: args.type as "daily" | "weekly" | "monthly" | "one_time",
      amount: args.amount,
      maxAmount: args.maxAmount,
      gracePeriodDays: args.gracePeriodDays,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return ruleId;
  },
});

// Calculate fines for overdue books
export const calculateOverdueFines = mutation({
  args: {
    loanId: v.id("bookLoans"),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "library");
    requirePermission(tenant, "library:write");

    const loan = await ctx.db.get(args.loanId);
    if (!loan || loan.tenantId !== tenant.tenantId) {
      throw new Error("Loan not found");
    }

    if (loan.status !== "active" && loan.status !== "overdue") {
      throw new Error("Loan is not active or overdue");
    }

    const now = Date.now();
    const dueDate = loan.dueDate;
    const daysOverdue = Math.max(0, Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)));

    if (daysOverdue <= 0) {
      return {
        loanId: args.loanId,
        daysOverdue: 0,
        fineAmount: 0,
        appliedRules: [],
        breakdown: [],
      } as FineCalculation;
    }

    // Get active fine rules
    const rules = await ctx.db
      .query("fineRules")
      .withIndex("by_tenant_active", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("isActive", true)
      )
      .collect();

    let totalFine = 0;
    const breakdown: FineCalculation["breakdown"] = [];
    const appliedRules: string[] = [];

    // Apply grace period
    const effectiveDaysOverdue = Math.max(0, daysOverdue - (rules[0]?.gracePeriodDays || 0));

    if (effectiveDaysOverdue > 0) {
      for (const rule of rules) {
        let ruleFine = 0;

        switch (rule.type) {
          case "daily":
            ruleFine = rule.amount * effectiveDaysOverdue;
            break;
          case "weekly":
            const weeks = Math.ceil(effectiveDaysOverdue / 7);
            ruleFine = rule.amount * weeks;
            break;
          case "monthly":
            const months = Math.ceil(effectiveDaysOverdue / 30);
            ruleFine = rule.amount * months;
            break;
          case "one_time":
            ruleFine = effectiveDaysOverdue > 0 ? rule.amount : 0;
            break;
        }

        // Apply maximum fine limit if set
        if (rule.maxAmount && ruleFine > rule.maxAmount) {
          ruleFine = rule.maxAmount;
        }

        totalFine += ruleFine;
        appliedRules.push(rule.name);

        breakdown.push({
          ruleId: rule._id,
          ruleName: rule.name,
          amount: ruleFine,
          days: effectiveDaysOverdue,
        });
      }
    }

    // Update loan with new fine amount
    await ctx.db.patch(args.loanId, {
      fineAccrued: totalFine,
      status: daysOverdue > 0 ? "overdue" : "active",
      updatedAt: now,
    });

    return {
      loanId: args.loanId,
      daysOverdue,
      fineAmount: totalFine,
      appliedRules,
      breakdown,
    } as FineCalculation;
  },
});

// Calculate fines for all overdue books for a student
export const calculateStudentFines = mutation({
  args: {
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "library");
    requirePermission(tenant, "library:write");

    // Get all active/overdue loans for the student
    const loans = await ctx.db
      .query("bookLoans")
      .withIndex("by_student_status", (q) =>
        q.eq("studentId", args.studentId).eq("status", "active")
      )
      .collect();

    const overdueLoans = await ctx.db
      .query("bookLoans")
      .withIndex("by_student_status", (q) =>
        q.eq("studentId", args.studentId).eq("status", "overdue")
      )
      .collect();

    const allLoans = [...loans, ...overdueLoans];
    const results: FineCalculation[] = [];
    let totalStudentFine = 0;

    for (const loan of allLoans) {
      const calculation = await ctx.runMutation(
        (ctx as any).internal.modules.library.fines.calculateOverdueFines,
        { loanId: loan._id }
      );
      results.push(calculation);
      totalStudentFine += calculation.fineAmount;
    }

    return {
      studentId: args.studentId,
      totalFine: totalStudentFine,
      loanCalculations: results,
    };
  },
});

// Bulk calculate fines for all overdue books
export const calculateAllOverdueFines = mutation({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "library");
    requirePermission(tenant, "library:write");

    // Get all overdue loans
    const overdueLoans = await ctx.db
      .query("bookLoans")
      .withIndex("by_status", (q) => q.eq("status", "overdue"))
      .take(args.limit ?? 100)
      .collect();

    const results: FineCalculation[] = [];
    let totalFineAmount = 0;

    for (const loan of overdueLoans) {
      if (loan.tenantId !== tenant.tenantId) continue;

      try {
        const calculation = await ctx.runMutation(
          (ctx as any).internal.modules.library.fines.calculateOverdueFines,
          { loanId: loan._id }
        );
        results.push(calculation);
        totalFineAmount += calculation.fineAmount;
      } catch (error) {
        console.error(`Failed to calculate fine for loan ${loan._id}:`, error);
      }
    }

    return {
      totalProcessed: results.length,
      totalFineAmount,
      calculations: results,
    };
  },
});

// Get fine rules
export const getFineRules = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "library");
    requirePermission(tenant, "library:read");

    let rulesQuery = ctx.db
      .query("fineRules")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId));

    if (!args.includeInactive) {
      rulesQuery = rulesQuery.filter((q) => q.eq(q.field("isActive"), true));
    }

    return await rulesQuery.collect();
  },
});

// Update fine rule
export const updateFineRule = mutation({
  args: {
    ruleId: v.id("fineRules"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    maxAmount: v.optional(v.number()),
    gracePeriodDays: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "library");
    requirePermission(tenant, "library:write");

    const rule = await ctx.db.get(args.ruleId);
    if (!rule || rule.tenantId !== tenant.tenantId) {
      throw new Error("Fine rule not found");
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.amount !== undefined) updates.amount = args.amount;
    if (args.maxAmount !== undefined) updates.maxAmount = args.maxAmount;
    if (args.gracePeriodDays !== undefined) updates.gracePeriodDays = args.gracePeriodDays;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.ruleId, updates);
    return args.ruleId;
  },
});

// Pay fine
export const payFine = mutation({
  args: {
    loanId: v.id("bookLoans"),
    amount: v.number(),
    paymentMethod: v.string(),
    paymentReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "library");
    requirePermission(tenant, "library:write");

    const loan = await ctx.db.get(args.loanId);
    if (!loan || loan.tenantId !== tenant.tenantId) {
      throw new Error("Loan not found");
    }

    if (args.amount > loan.fineAccrued - loan.finePaid) {
      throw new Error("Payment amount exceeds outstanding fine");
    }

    // Create fine payment record
    await ctx.db.insert("finePayments", {
      tenantId: tenant.tenantId,
      loanId: args.loanId,
      amount: args.amount,
      paymentMethod: args.paymentMethod,
      paymentReference: args.paymentReference,
      paidBy: tenant.userId,
      createdAt: Date.now(),
    });

    // Update loan fine paid amount
    await ctx.db.patch(args.loanId, {
      finePaid: loan.finePaid + args.amount,
      updatedAt: Date.now(),
    });

    return { success: true, amountPaid: args.amount, remainingFine: loan.fineAccrued - loan.finePaid - args.amount };
  },
});

// Get fine payment history
export const getFinePaymentHistory = query({
  args: {
    studentId: v.optional(v.string()),
    loanId: v.optional(v.id("bookLoans")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "library");
    requirePermission(tenant, "library:read");

    let paymentsQuery = ctx.db
      .query("finePayments")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId));

    if (args.studentId) {
      // Get loans for student first, then get payments for those loans
      const studentLoans = await ctx.db
        .query("bookLoans")
        .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
        .collect();

      const loanIds = studentLoans.map(loan => loan._id);
      paymentsQuery = paymentsQuery.filter((q) =>
        loanIds.includes(q.field("loanId"))
      );
    }

    if (args.loanId) {
      paymentsQuery = paymentsQuery.filter((q) =>
        q.eq(q.field("loanId"), args.loanId)
      );
    }

    const payments = await paymentsQuery
      .order("desc")
      .take(args.limit ?? 50)
      .collect();

    // Enrich with loan and student information
    const enrichedPayments = await Promise.all(
      payments.map(async (payment) => {
        const loan = await ctx.db.get(payment.loanId);
        const student = loan ? await ctx.db.get(loan.studentId as any) : null;

        return {
          ...payment,
          loan: {
            ...loan,
            bookTitle: loan ? (await ctx.db.get(loan.bookId as any))?.title : "Unknown",
          },
          student: student ? {
            name: `${student.firstName} ${student.lastName}`,
            admissionNumber: student.admissionNumber,
          } : null,
        };
      })
    );

    return enrichedPayments;
  },
});
