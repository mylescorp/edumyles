import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { logAction } from "../../helpers/auditLog";

export const createStaff = mutation({
    args: {
        employeeId: v.string(),
        firstName: v.string(),
        lastName: v.string(),
        email: v.string(),
        role: v.string(),
        department: v.optional(v.string()),
        phone: v.optional(v.string()),
        qualification: v.optional(v.string()),
        joinDate: v.string(),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "hr");
        requirePermission(tenant, "staff:write");

        const staffId = await ctx.db.insert("staff", {
            tenantId: tenant.tenantId,
            ...args,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "staff.created",
            entityType: "staff",
            entityId: staffId,
            after: args,
        });

        return staffId;
    },
});

export const updateStaff = mutation({
    args: {
        id: v.id("staff"),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        email: v.optional(v.string()),
        role: v.optional(v.string()),
        department: v.optional(v.string()),
        phone: v.optional(v.string()),
        qualification: v.optional(v.string()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "hr");
        requirePermission(tenant, "staff:write");

        const { id, ...updates } = args;
        const existing = await ctx.db.get(id);
        if (!existing || existing.tenantId !== tenant.tenantId) {
            throw new Error("Staff member not found or access denied");
        }

        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now(),
        });

        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "staff.updated",
            entityType: "staff",
            entityId: id,
            before: existing,
            after: updates,
        });

        return id;
    },
});

export const assignRole = mutation({
    args: {
        staffId: v.id("staff"),
        role: v.string(),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "hr");
        requirePermission(tenant, "users:manage");

        const existing = await ctx.db.get(args.staffId);
        if (!existing || existing.tenantId !== tenant.tenantId) {
            throw new Error("Staff member not found or access denied");
        }

        await ctx.db.patch(args.staffId, {
            role: args.role,
            updatedAt: Date.now(),
        });

        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "staff.role_assigned",
            entityType: "staff",
            entityId: args.staffId,
            before: { role: existing.role },
            after: { role: args.role },
        });

        return args.staffId;
    },
});

export const createContract = mutation({
    args: {
        staffId: v.string(),
        type: v.string(),
        startDate: v.string(),
        endDate: v.optional(v.string()),
        salaryCents: v.optional(v.number()),
        currency: v.string(),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "hr");
        requirePermission(tenant, "staff:write");

        const staff = await ctx.db.get(args.staffId as any);
        if (!staff || (staff as any).tenantId !== tenant.tenantId) throw new Error("Staff not found");

        const id = await ctx.db.insert("staffContracts", {
            tenantId: tenant.tenantId,
            staffId: args.staffId,
            type: args.type,
            startDate: args.startDate,
            endDate: args.endDate,
            salaryCents: args.salaryCents,
            currency: args.currency,
            status: "active",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "staff.created",
            entityType: "staffContract",
            entityId: id,
            after: args,
        });
        return id;
    },
});

export const createLeaveRequest = mutation({
    args: {
        staffId: v.string(),
        type: v.string(),
        startDate: v.string(),
        endDate: v.string(),
        days: v.number(),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "hr");
        requirePermission(tenant, "staff:write");

        const id = await ctx.db.insert("staffLeave", {
            tenantId: tenant.tenantId,
            staffId: args.staffId,
            type: args.type,
            startDate: args.startDate,
            endDate: args.endDate,
            days: args.days,
            status: "pending",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return id;
    },
});

export const approveLeaveRequest = mutation({
    args: { leaveId: v.id("staffLeave"), approved: v.boolean() },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "hr");
        requirePermission(tenant, "staff:write");

        const leave = await ctx.db.get(args.leaveId);
        if (!leave || leave.tenantId !== tenant.tenantId) throw new Error("Leave request not found");
        await ctx.db.patch(args.leaveId, {
            status: args.approved ? "approved" : "rejected",
            approvedBy: tenant.userId,
            approvedAt: Date.now(),
            updatedAt: Date.now(),
        });
        return args.leaveId;
    },
});

export const createPayrollRun = mutation({
    args: {
        periodLabel: v.string(),
        startDate: v.string(),
        endDate: v.string(),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "hr");
        requirePermission(tenant, "payroll:write");

        const id = await ctx.db.insert("payrollRuns", {
            tenantId: tenant.tenantId,
            periodLabel: args.periodLabel,
            startDate: args.startDate,
            endDate: args.endDate,
            status: "draft",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return id;
    },
});

export const addPayslip = mutation({
    args: {
        payrollRunId: v.string(),
        staffId: v.string(),
        basicCents: v.number(),
        allowancesCents: v.number(),
        deductionsCents: v.number(),
        currency: v.string(),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "hr");
        requirePermission(tenant, "payroll:write");

        const netCents =
            args.basicCents + args.allowancesCents - args.deductionsCents;
        const id = await ctx.db.insert("payslips", {
            tenantId: tenant.tenantId,
            payrollRunId: args.payrollRunId,
            staffId: args.staffId,
            basicCents: args.basicCents,
            allowancesCents: args.allowancesCents,
            deductionsCents: args.deductionsCents,
            netCents,
            currency: args.currency,
            status: "draft",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return id;
    },
});

export const approvePayrollRun = mutation({
    args: { payrollRunId: v.id("payrollRuns") },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "hr");
        requirePermission(tenant, "payroll:approve");

        const run = await ctx.db.get(args.payrollRunId);
        if (!run || run.tenantId !== tenant.tenantId) throw new Error("Payroll run not found");
        await ctx.db.patch(args.payrollRunId, {
            status: "approved",
            approvedBy: tenant.userId,
            approvedAt: Date.now(),
            updatedAt: Date.now(),
        });
        return args.payrollRunId;
    },
});

export const completePayrollRun = mutation({
    args: { payrollRunId: v.id("payrollRuns") },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "hr");
        requirePermission(tenant, "payroll:approve");

        const run = await ctx.db.get(args.payrollRunId);
        if (!run || run.tenantId !== tenant.tenantId) throw new Error("Payroll run not found");
        if (run.status !== "approved") {
            throw new Error("Only approved payroll runs can be completed");
        }

        await ctx.db.patch(args.payrollRunId, {
            status: "completed",
            updatedAt: Date.now(),
        });
        return args.payrollRunId;
    },
});

export const cancelPayrollRun = mutation({
    args: { payrollRunId: v.id("payrollRuns") },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "hr");
        requirePermission(tenant, "payroll:approve");

        const run = await ctx.db.get(args.payrollRunId);
        if (!run || run.tenantId !== tenant.tenantId) throw new Error("Payroll run not found");
        if (!["draft", "pending", "approved"].includes(run.status)) {
            throw new Error("This payroll run can no longer be cancelled");
        }

        await ctx.db.patch(args.payrollRunId, {
            status: "cancelled",
            updatedAt: Date.now(),
        });
        return args.payrollRunId;
    },
});
