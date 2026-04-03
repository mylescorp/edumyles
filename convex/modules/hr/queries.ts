import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantContext, requireTenantSession } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";

export const listStaff = query({
  args: {
    sessionToken: v.optional(v.string()),
    status: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const tenant = args.sessionToken
        ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
        : await requireTenantContext(ctx);
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
    } catch {
      return [];
    }
  },
});

/**
 * Get recent HR activities for the dashboard.
 */
export const getRecentActivities = query({
  args: {
    sessionToken: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const tenant = args.sessionToken
        ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
        : await requireTenantContext(ctx);
      await requireModule(ctx, tenant.tenantId, "hr");
      requirePermission(tenant, "staff:read");

      const limit = args.limit || 10;

      // Get recent audit logs for HR activities
      const hrActivities = await ctx.db
        .query("auditLogs")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
        .filter((q) =>
          q.or(
            q.eq(q.field("action"), "staff.created"),
            q.eq(q.field("action"), "staff.updated"),
            q.eq(q.field("action"), "leave.requested"),
            q.eq(q.field("action"), "payroll.processed")
          )
        )
        .order("desc")
        .take(limit);

      // Transform audit logs to activity format
      return hrActivities.map((activity, index) => ({
        _id: activity._id,
        type: activity.action,
        title: getActivityTitle(activity.action),
        employee: activity.actorEmail,
        department: "Unknown",
        date: activity.timestamp,
        status: getActivityStatus(activity.action),
      }));
    } catch (error) {
      console.error("getRecentActivities failed", error);
      return [];
    }
  },
});

// Helper functions for activity formatting
function getActivityTitle(action: string): string {
  const titles: Record<string, string> = {
    "staff.created": "New Staff Member Added",
    "staff.updated": "Staff Profile Updated",
    "leave.requested": "Leave Request Submitted",
    "payroll.processed": "Payroll Processed",
  };
  return titles[action] || action.replace(/\./g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function getActivityStatus(action: string): string {
  const statuses: Record<string, string> = {
    "staff.created": "completed",
    "staff.updated": "completed",
    "leave.requested": "pending",
    "payroll.processed": "completed",
  };
  return statuses[action] || "completed";
}

export const getStaffMember = query({
  args: { staffId: v.id("staff"), sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
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
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    try {
      const tenant = args.sessionToken
        ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
        : await requireTenantContext(ctx);
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
    } catch {
      return { total: 0, active: 0, on_leave: 0 };
    }
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
