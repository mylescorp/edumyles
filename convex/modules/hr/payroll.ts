import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { logAction } from "../../helpers/auditLog";

// Import payroll engine from shared lib
const { PayrollEngine } = require("../../../../shared/src/lib/payroll");

// Payroll calculation types
export interface PayrollPeriod {
  id: string;
  tenantId: string;
  name: string;
  startDate: number;
  endDate: number;
  payDate: number;
  status: "draft" | "processing" | "completed" | "paid";
  totalGrossPay: number;
  totalNetPay: number;
  totalDeductions: number;
  employeeCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface PayrollCalculation {
  id: string;
  tenantId: string;
  payrollPeriodId: string;
  employeeId: string;
  basicSalary: number;
  allowances: number;
  overtimeHours: number;
  overtimeRate: number;
  overtimePay: number;
  grossPay: number;
  deductions: {
    type: string;
    amount: number;
    description: string;
  }[];
  totalDeductions: number;
  netPay: number;
  payeTax: number;
  nssf: number;
  nhif: number;
  otherDeductions: number;
  status: "calculated" | "approved" | "paid";
  createdAt: number;
  updatedAt: number;
}

export interface AllowanceRule {
  id: string;
  tenantId: string;
  name: string;
  type: "fixed" | "percentage";
  amount: number;
  appliesToRoles: string[];
  conditions: {
    minSalary?: number;
    maxSalary?: number;
    department?: string;
  }[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DeductionRule {
  id: string;
  tenantId: string;
  name: string;
  type: "percentage" | "fixed";
  amount: number;
  appliesToRoles: string[];
  isTaxDeductible: boolean;
  conditions: {
    minSalary?: number;
    maxSalary?: number;
    department?: string;
  }[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// Calculate payroll for a single employee
export const calculateEmployeePayroll = mutation({
  args: {
    employeeId: v.string(),
    payrollPeriodId: v.id("payrollPeriods"),
    overtimeHours: v.optional(v.number()),
    customAllowances: v.optional(v.array(v.object({
      type: v.string(),
      amount: v.number(),
    }))),
    customDeductions: v.optional(v.array(v.object({
      type: v.string(),
      amount: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "hr");
    requirePermission(tenant, "hr:write");

    // Get employee details
    const employee = await ctx.db.get(args.employeeId as any);
    if (!employee || employee.tenantId !== tenant.tenantId) {
      throw new Error("Employee not found");
    }

    // Get payroll period
    const payrollPeriod = await ctx.db.get(args.payrollPeriodId);
    if (!payrollPeriod || payrollPeriod.tenantId !== tenant.tenantId) {
      throw new Error("Payroll period not found");
    }

    // Get allowance rules
    const allowanceRules = await ctx.db
      .query("allowanceRules")
      .withIndex("by_tenant_active", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("isActive", true)
      )
      .collect();

    // Get deduction rules
    const deductionRules = await ctx.db
      .query("deductionRules")
      .withIndex("by_tenant_active", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("isActive", true)
      )
      .collect();

    // Calculate basic salary
    const basicSalary = employee.salary || 0;

    // Calculate overtime pay
    const overtimeHours = args.overtimeHours || 0;
    const overtimeRate = basicSalary / (22 * 8) * 1.5; // 1.5x hourly rate
    const overtimePay = overtimeHours * overtimeRate;

    // Calculate allowances
    let allowances = 0;
    const allowanceBreakdown: { type: string; amount: number; description: string }[] = [];

    for (const rule of allowanceRules) {
      if (!rule.appliesToRoles.includes(employee.role)) continue;

      // Check conditions
      let applies = true;
      for (const condition of rule.conditions) {
        if (condition.minSalary && basicSalary < condition.minSalary) {
          applies = false;
          break;
        }
        if (condition.maxSalary && basicSalary > condition.maxSalary) {
          applies = false;
          break;
        }
        if (condition.department && employee.department !== condition.department) {
          applies = false;
          break;
        }
      }

      if (applies) {
        const allowanceAmount = rule.type === "percentage" 
          ? (basicSalary * rule.amount) / 100 
          : rule.amount;
        
        allowances += allowanceAmount;
        allowanceBreakdown.push({
          type: rule.name,
          amount: allowanceAmount,
          description: rule.name,
        });
      }
    }

    // Add custom allowances
    if (args.customAllowances) {
      for (const custom of args.customAllowances) {
        allowances += custom.amount;
        allowanceBreakdown.push({
          type: custom.type,
          amount: custom.amount,
          description: custom.type,
        });
      }
    }

    // Calculate gross pay
    const grossPay = basicSalary + allowances + overtimePay;

    // Calculate deductions
    let totalDeductions = 0;
    const deductionBreakdown: { type: string; amount: number; description: string }[] = [];

    // PAYE Tax calculation (Kenya rates - simplified)
    let payeTax = 0;
    if (grossPay > 24000) {
      const taxable = grossPay - 24000;
      if (taxable <= 8333) {
        payeTax = taxable * 0.1;
      } else if (taxable <= 24667) {
        payeTax = 8333 * 0.1 + (taxable - 8333) * 0.15;
      } else if (taxable <= 42333) {
        payeTax = 8333 * 0.1 + 16334 * 0.15 + (taxable - 24667) * 0.2;
      } else if (taxable <= 52333) {
        payeTax = 8333 * 0.1 + 16334 * 0.15 + 17666 * 0.2 + (taxable - 42333) * 0.25;
      } else {
        payeTax = 8333 * 0.1 + 16334 * 0.15 + 17666 * 0.2 + 10000 * 0.25 + (taxable - 52333) * 0.3;
      }
    }

    // NSSF calculation (Kenya rates)
    let nssf = 0;
    if (grossPay <= 6000) {
      nssf = grossPay * 0.06;
    } else if (grossPay <= 18000) {
      nssf = 360;
    } else {
      nssf = 720;
    }

    // NHIF calculation (Kenya rates - simplified)
    let nhif = 0;
    if (grossPay <= 5999) {
      nhif = 150;
    } else if (grossPay <= 7999) {
      nhif = 300;
    } else if (grossPay <= 11999) {
      nhif = 400;
    } else if (grossPay <= 14999) {
      nhif = 500;
    } else if (grossPay <= 19999) {
      nhif = 600;
    } else if (grossPay <= 24999) {
      nhif = 750;
    } else if (grossPay <= 29999) {
      nhif = 850;
    } else if (grossPay <= 34999) {
      nhif = 900;
    } else if (grossPay <= 39999) {
      nhif = 950;
    } else if (grossPay <= 44999) {
      nhif = 1000;
    } else if (grossPay <= 49999) {
      nhif = 1100;
    } else if (grossPay <= 59999) {
      nhif = 1200;
    } else if (grossPay <= 69999) {
      nhif = 1300;
    } else if (grossPay <= 79999) {
      nhif = 1400;
    } else if (grossPay <= 89999) {
      nhif = 1500;
    } else if (grossPay <= 99999) {
      nhif = 1600;
    } else {
      nhif = 1700;
    }

    // Add statutory deductions
    totalDeductions += payeTax + nssf + nhif;
    deductionBreakdown.push(
      { type: "PAYE Tax", amount: payeTax, description: "Pay As You Earn Tax" },
      { type: "NSSF", amount: nssf, description: "National Social Security Fund" },
      { type: "NHIF", amount: nhif, description: "National Hospital Insurance Fund" }
    );

    // Apply other deduction rules
    let otherDeductions = 0;
    for (const rule of deductionRules) {
      if (!rule.appliesToRoles.includes(employee.role)) continue;

      // Check conditions
      let applies = true;
      for (const condition of rule.conditions) {
        if (condition.minSalary && grossPay < condition.minSalary) {
          applies = false;
          break;
        }
        if (condition.maxSalary && grossPay > condition.maxSalary) {
          applies = false;
          break;
        }
        if (condition.department && employee.department !== condition.department) {
          applies = false;
          break;
        }
      }

      if (applies) {
        const deductionAmount = rule.type === "percentage" 
          ? (grossPay * rule.amount) / 100 
          : rule.amount;
        
        totalDeductions += deductionAmount;
        otherDeductions += deductionAmount;
        deductionBreakdown.push({
          type: rule.name,
          amount: deductionAmount,
          description: rule.name,
        });
      }
    }

    // Add custom deductions
    if (args.customDeductions) {
      for (const custom of args.customDeductions) {
        totalDeductions += custom.amount;
        otherDeductions += custom.amount;
        deductionBreakdown.push({
          type: custom.type,
          amount: custom.amount,
          description: custom.type,
        });
      }
    }

    // Calculate net pay
    const netPay = grossPay - totalDeductions;

    // Create or update payroll calculation
    const existingCalculation = await ctx.db
      .query("payrollCalculations")
      .withIndex("by_employee_period", (q) =>
        q.eq("employeeId", args.employeeId).eq("payrollPeriodId", args.payrollPeriodId)
      )
      .first();

    const calculationData = {
      tenantId: tenant.tenantId,
      payrollPeriodId: args.payrollPeriodId,
      employeeId: args.employeeId,
      basicSalary,
      allowances,
      overtimeHours,
      overtimeRate,
      overtimePay,
      grossPay,
      deductions: deductionBreakdown,
      totalDeductions,
      netPay,
      payeTax,
      nssf,
      nhif,
      otherDeductions,
      status: "calculated" as const,
      updatedAt: Date.now(),
    };

    let calculationId;
    if (existingCalculation) {
      await ctx.db.patch(existingCalculation._id, calculationData);
      calculationId = existingCalculation._id;
    } else {
      calculationId = await ctx.db.insert("payrollCalculations", {
        ...calculationData,
        createdAt: Date.now(),
      });
    }

    return {
      calculationId,
      employeeId: args.employeeId,
      basicSalary,
      allowances,
      overtimePay,
      grossPay,
      totalDeductions,
      netPay,
      payeTax,
      nssf,
      nhif,
      otherDeductions,
    };
  },
});

// Calculate payroll for all employees
export const calculateBulkPayroll = mutation({
  args: {
    payrollPeriodId: v.id("payrollPeriods"),
    employeeIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "hr");
    requirePermission(tenant, "hr:write");

    // Get employees to process
    let employees;
    if (args.employeeIds && args.employeeIds.length > 0) {
      employees = await Promise.all(
        args.employeeIds.map(id => ctx.db.get(id as any))
      );
    } else {
      employees = await ctx.db
        .query("staff")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
        .collect();
    }

    const results = [];
    let totalGrossPay = 0;
    let totalNetPay = 0;
    let totalDeductions = 0;

    for (const employee of employees) {
      if (!employee || employee.tenantId !== tenant.tenantId) continue;

      try {
        const calculation = await ctx.runMutation(
          (ctx as any).internal.modules.hr.payroll.calculateEmployeePayroll,
          {
            employeeId: employee._id,
            payrollPeriodId: args.payrollPeriodId,
          }
        );

        results.push(calculation);
        totalGrossPay += calculation.grossPay;
        totalNetPay += calculation.netPay;
        totalDeductions += calculation.totalDeductions;
      } catch (error) {
        console.error(`Failed to calculate payroll for employee ${employee._id}:`, error);
      }
    }

    // Update payroll period totals
    await ctx.db.patch(args.payrollPeriodId, {
      totalGrossPay,
      totalNetPay,
      totalDeductions,
      employeeCount: results.length,
      updatedAt: Date.now(),
    });

    return {
      payrollPeriodId: args.payrollPeriodId,
      totalProcessed: results.length,
      totalGrossPay,
      totalNetPay,
      totalDeductions,
      calculations: results,
    };
  },
});

// Create payroll period
export const createPayrollPeriod = mutation({
  args: {
    name: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    payDate: v.number(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "hr");
    requirePermission(tenant, "hr:write");

    const now = Date.now();
    const periodId = await ctx.db.insert("payrollPeriods", {
      tenantId: tenant.tenantId,
      name: args.name,
      startDate: args.startDate,
      endDate: args.endDate,
      payDate: args.payDate,
      status: "draft",
      totalGrossPay: 0,
      totalNetPay: 0,
      totalDeductions: 0,
      employeeCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return periodId;
  },
});

// Get payroll periods
export const getPayrollPeriods = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "hr");
    requirePermission(tenant, "hr:read");

    let periodsQuery = ctx.db
      .query("payrollPeriods")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId));

    if (args.status) {
      periodsQuery = periodsQuery.filter((q) =>
        q.eq(q.field("status"), args.status)
      );
    }

    return await periodsQuery
      .order("desc")
      .take(args.limit ?? 25)
      .collect();
  },
});

// Get payroll calculations for a period
export const getPayrollCalculations = query({
  args: {
    payrollPeriodId: v.id("payrollPeriods"),
    employeeId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "hr");
    requirePermission(tenant, "hr:read");

    let calculationsQuery = ctx.db
      .query("payrollCalculations")
      .withIndex("by_period", (q) => q.eq("payrollPeriodId", args.payrollPeriodId));

    if (args.employeeId) {
      calculationsQuery = calculationsQuery.filter((q) =>
        q.eq(q.field("employeeId"), args.employeeId)
      );
    }

    const calculations = await calculationsQuery.collect();

    // Enrich with employee information
    const enrichedCalculations = await Promise.all(
      calculations.map(async (calculation) => {
        const employee = await ctx.db.get(calculation.employeeId as any);
        return {
          ...calculation,
          employee: employee ? {
            name: `${employee.firstName} ${employee.lastName}`,
            employeeId: employee.employeeId,
            department: employee.department,
            role: employee.role,
          } : null,
        };
      })
    );

    return enrichedCalculations;
  },
});

// Approve payroll
export const approvePayroll = mutation({
  args: {
    payrollPeriodId: v.id("payrollPeriods"),
    calculationIds: v.array(v.id("payrollCalculations")),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "hr");
    requirePermission(tenant, "hr:write");

    // Update payroll period status
    await ctx.db.patch(args.payrollPeriodId, {
      status: "completed",
      updatedAt: Date.now(),
    });

    // Update individual calculations
    for (const calculationId of args.calculationIds) {
      await ctx.db.patch(calculationId, {
        status: "approved",
        updatedAt: Date.now(),
      });
    }

    return { success: true, approvedCount: args.calculationIds.length };
  },
});

// Mark payroll as paid
export const markPayrollAsPaid = mutation({
  args: {
    payrollPeriodId: v.id("payrollPeriods"),
    paymentMethod: v.string(),
    paymentReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "hr");
    requirePermission(tenant, "hr:write");

    // Update payroll period status
    await ctx.db.patch(args.payrollPeriodId, {
      status: "paid",
      updatedAt: Date.now(),
    });

    // Update all approved calculations to paid
    const calculations = await ctx.db
      .query("payrollCalculations")
      .withIndex("by_period", (q) => q.eq("payrollPeriodId", args.payrollPeriodId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    for (const calculation of calculations) {
      await ctx.db.patch(calculation._id, {
        status: "paid",
        updatedAt: Date.now(),
      });

      // Create payment record
      await ctx.db.insert("payrollPayments", {
        tenantId: tenant.tenantId,
        payrollPeriodId: args.payrollPeriodId,
        calculationId: calculation._id,
        employeeId: calculation.employeeId,
        amount: calculation.netPay,
        paymentMethod: args.paymentMethod,
        paymentReference: args.paymentReference,
        paidBy: tenant.userId,
        createdAt: Date.now(),
      });
    }

    return { success: true, paidCount: calculations.length };
  },
});
