import { v } from "convex/values";
import { internalQuery } from "../../_generated/server";
import { requireModuleAccess } from "../../helpers/moduleGuard";

export const getStaffLeaveBalance = internalQuery({
  args: {
    tenantId: v.string(),
    staffId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireModuleAccess(ctx, "mod_hr", args.tenantId);

    const leaveRecords = await ctx.db
      .query("staffLeave")
      .withIndex("by_staff", (q) => q.eq("staffId", args.staffId))
      .collect();
    const tenantScoped = leaveRecords.filter((leave) => leave.tenantId === args.tenantId);

    return {
      approvedDaysTaken: tenantScoped
        .filter((leave) => leave.status === "approved")
        .reduce((sum, leave) => sum + leave.days, 0),
      pendingDays: tenantScoped
        .filter((leave) => leave.status === "pending")
        .reduce((sum, leave) => sum + leave.days, 0),
      upcomingApprovedDays: tenantScoped
        .filter((leave) => leave.status === "approved" && leave.startDate >= new Date().toISOString().slice(0, 10))
        .reduce((sum, leave) => sum + leave.days, 0),
      remainingDays: null,
    };
  },
});

export const getStaffOnLeaveToday = internalQuery({
  args: {
    tenantId: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    await requireModuleAccess(ctx, "mod_hr", args.tenantId);

    const leaveRecords = await ctx.db
      .query("staffLeave")
      .withIndex("by_tenant_status", (q) => q.eq("tenantId", args.tenantId).eq("status", "approved"))
      .collect();

    return leaveRecords
      .filter((leave) => leave.startDate <= args.date && leave.endDate >= args.date)
      .map((leave) => leave.staffId);
  },
});
