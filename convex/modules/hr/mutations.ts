import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireTenantContext, requireTenantSession } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { logAction } from "../../helpers/auditLog";

export const createStaff = mutation({
    args: {
        sessionToken: v.optional(v.string()),
        employeeId: v.string(),
        firstName: v.string(),
        lastName: v.string(),
        email: v.string(),
        role: v.string(),
        department: v.optional(v.string()),
        phone: v.optional(v.string()),
        qualification: v.optional(v.string()),
        joinDate: v.string(),
        status: v.union(
            v.literal("active"),
            v.literal("inactive"),
            v.literal("terminated"),
            v.literal("on_leave")
        ),
    },
    handler: async (ctx, args) => {
        const tenant = args.sessionToken
            ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
            : await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "hr");
        requirePermission(tenant, "staff:write");

        if (args.firstName.length > 100) throw new Error("First name must be 100 characters or fewer");
        if (args.lastName.length > 100) throw new Error("Last name must be 100 characters or fewer");
        if (args.email.length > 254) throw new Error("Email must be 254 characters or fewer");
        if (args.employeeId.length > 50) throw new Error("Employee ID must be 50 characters or fewer");

        const { sessionToken: _sessionToken, ...staffArgs } = args;
        const staffId = await ctx.db.insert("staff", {
            tenantId: tenant.tenantId,
            ...staffArgs,
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
            after: staffArgs,
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
        status: v.optional(v.union(
            v.literal("active"),
            v.literal("inactive"),
            v.literal("terminated"),
            v.literal("on_leave")
        )),
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

export const cancelLeaveRequest = mutation({
    args: { leaveId: v.id("staffLeave") },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "hr");
        requirePermission(tenant, "staff:write");

        const leave = await ctx.db.get(args.leaveId);
        if (!leave || leave.tenantId !== tenant.tenantId) throw new Error("Leave request not found");
        if (["cancelled", "rejected"].includes(leave.status)) {
            throw new Error("This leave request is already closed");
        }

        await ctx.db.patch(args.leaveId, {
            status: "cancelled",
            updatedAt: Date.now(),
        });

        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "leave.cancelled",
            entityType: "staffLeave",
            entityId: args.leaveId,
            before: leave,
            after: { ...leave, status: "cancelled" },
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

export const generatePayrollPayslips = mutation({
    args: { payrollRunId: v.id("payrollRuns") },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "hr");
        requirePermission(tenant, "payroll:write");

        const payrollRun = await ctx.db.get(args.payrollRunId);
        if (!payrollRun || payrollRun.tenantId !== tenant.tenantId) {
            throw new Error("Payroll run not found");
        }
        if (["completed", "cancelled"].includes(payrollRun.status)) {
            throw new Error("Payslips cannot be generated for a completed or cancelled payroll run");
        }

        const staffMembers = await ctx.db
            .query("staff")
            .withIndex("by_tenant_status", (q) => q.eq("tenantId", tenant.tenantId).eq("status", "active"))
            .collect();

        const contracts = await ctx.db
            .query("staffContracts")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
            .collect();

        const existingPayslips = await ctx.db
            .query("payslips")
            .withIndex("by_payroll", (q) => q.eq("payrollRunId", args.payrollRunId))
            .collect();

        const existingByStaff = new Set(existingPayslips.map((p) => p.staffId));
        const activeContracts = new Map(
            contracts
                .filter((contract) => contract.status === "active")
                .map((contract) => [contract.staffId, contract])
        );

        let created = 0;
        let skipped = 0;
        const now = Date.now();

        for (const staff of staffMembers) {
            if (existingByStaff.has(staff._id)) {
                skipped += 1;
                continue;
            }

            const contract = activeContracts.get(staff._id);
            if (!contract) {
                skipped += 1;
                continue;
            }

            const basicCents = contract.salaryCents ?? 0;
            await ctx.db.insert("payslips", {
                tenantId: tenant.tenantId,
                payrollRunId: args.payrollRunId,
                staffId: staff._id,
                basicCents,
                allowancesCents: 0,
                deductionsCents: 0,
                netCents: basicCents,
                currency: contract.currency || "KES",
                status: "draft",
                createdAt: now,
                updatedAt: now,
            });
            created += 1;
        }

        await ctx.db.patch(args.payrollRunId, {
            status: created > 0 && payrollRun.status === "draft" ? "pending" : payrollRun.status,
            updatedAt: now,
        });

        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "payroll.processed",
            entityType: "payrollRun",
            entityId: args.payrollRunId.toString(),
            after: {
                createdPayslips: created,
                skippedStaff: skipped,
            },
        });

        return { created, skipped };
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
