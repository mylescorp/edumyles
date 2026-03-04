import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";

export const listStaff = query({
    args: {
        status: v.optional(v.string()),
        role: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "hr");
        requirePermission(tenant, "staff:read");

        let staffQuery = ctx.db
            .query("staff")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId));

        if (args.status) {
            staffQuery = ctx.db
                .query("staff")
                .withIndex("by_tenant_status", (q) =>
                    q.eq("tenantId", tenant.tenantId).eq("status", args.status!)
                );
        } else if (args.role) {
            staffQuery = ctx.db
                .query("staff")
                .withIndex("by_tenant_role", (q) =>
                    q.eq("tenantId", tenant.tenantId).eq("role", args.role!)
                );
        }

        return await staffQuery.order("desc").collect();
    },
});

export const getStaffMember = query({
    args: { staffId: v.id("staff") },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "hr");
        requirePermission(tenant, "staff:read");

        const member = await ctx.db.get(args.staffId);
        if (!member || member.tenantId !== tenant.tenantId) {
            return null;
        }

        return member;
    },
});

export const getStaffStats = query({
    args: {},
    handler: async (ctx) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "hr");
        requirePermission(tenant, "staff:read");

        const staff = await ctx.db
            .query("staff")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
            .collect();

        return {
            total: staff.length,
            active: staff.filter((s) => s.status === "active").length,
            on_leave: staff.filter((s) => s.status === "on_leave").length,
        };
    },
});

export const listContracts = query({
    args: { staffId: v.optional(v.string()), status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "hr");
        requirePermission(tenant, "staff:read");

        let q = ctx.db
            .query("staffContracts")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId));
        if (args.staffId) {
            q = ctx.db
                .query("staffContracts")
                .withIndex("by_staff", (q) => q.eq("staffId", args.staffId!))
                .filter((f) => f.eq(f.field("tenantId"), tenant.tenantId));
        } else if (args.status) {
            q = ctx.db
                .query("staffContracts")
                .withIndex("by_tenant_status", (q) =>
                    q.eq("tenantId", tenant.tenantId).eq("status", args.status!)
                );
        }
        return await q.collect();
    },
});

export const listLeave = query({
    args: { staffId: v.optional(v.string()), status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "hr");
        requirePermission(tenant, "staff:read");

        let q = ctx.db
            .query("staffLeave")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId));
        if (args.staffId) {
            q = ctx.db
                .query("staffLeave")
                .withIndex("by_staff", (q) => q.eq("staffId", args.staffId!))
                .filter((f) => f.eq(f.field("tenantId"), tenant.tenantId));
        } else if (args.status) {
            q = ctx.db
                .query("staffLeave")
                .withIndex("by_tenant_status", (q) =>
                    q.eq("tenantId", tenant.tenantId).eq("status", args.status!)
                );
        }
        return await q.collect();
    },
});

export const listPayrollRuns = query({
    args: { status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "hr");
        requirePermission(tenant, "payroll:read");

        let q = ctx.db
            .query("payrollRuns")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId));
        if (args.status) {
            q = ctx.db
                .query("payrollRuns")
                .withIndex("by_tenant_status", (q) =>
                    q.eq("tenantId", tenant.tenantId).eq("status", args.status!)
                );
        }
        return await q.collect();
    },
});

export const listPayslips = query({
    args: { payrollRunId: v.optional(v.string()), staffId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "hr");
        requirePermission(tenant, "payroll:read");

        if (args.payrollRunId) {
            return await ctx.db
                .query("payslips")
                .withIndex("by_payroll", (q) => q.eq("payrollRunId", args.payrollRunId!))
                .filter((f) => f.eq(f.field("tenantId"), tenant.tenantId))
                .collect();
        }
        if (args.staffId) {
            return await ctx.db
                .query("payslips")
                .withIndex("by_staff", (q) => q.eq("staffId", args.staffId!))
                .filter((f) => f.eq(f.field("tenantId"), tenant.tenantId))
                .collect();
        }
        return await ctx.db
            .query("payslips")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
            .collect();
    },
});
