import { v } from "convex/values";
import { query } from "../../../_generated/server";
import { requireTenantContext } from "../../../helpers/tenantGuard";
import { requirePermission } from "../../../helpers/authorize";
import { requireModule } from "../../../helpers/moduleGuard";

async function getStudentRecord(ctx: any, tenant: any) {
  const student = await ctx.db
    .query("students")
    .withIndex("by_user", (q: any) => q.eq("userId", tenant.userId))
    .first();
  if (!student || student.tenantId !== tenant.tenantId) {
    throw new Error("Student profile not found");
  }
  return student;
}

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "sis");
    requirePermission(tenant, "students:read");
    return await getStudentRecord(ctx, tenant);
  },
});

export const getMyTimetable = query({
  args: {},
  handler: async (ctx) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "timetable");
    requirePermission(tenant, "timetable:read");
    const student = await getStudentRecord(ctx, tenant);
    if (!student.classId) return [];

    return await ctx.db
      .query("timetables")
      .withIndex("by_class", (q: any) => q.eq("classId", student.classId))
      .filter((q: any) => q.eq(q.field("tenantId"), tenant.tenantId))
      .collect();
  },
});

export const getMyReportCards = query({
  args: {},
  handler: async (ctx) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:read");
    const student = await getStudentRecord(ctx, tenant);

    return await ctx.db
      .query("reportCards")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .filter((q: any) => q.eq(q.field("studentId"), student._id.toString()))
      .collect();
  },
});

export const getAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    const tenant = await requireTenantContext(ctx);
    requirePermission(tenant, "students:read");
    return await ctx.db
      .query("notifications")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .order("desc")
      .collect();
  },
});

export const getMyGrades = query({
  args: {},
  handler: async (ctx) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:read");
    const student = await getStudentRecord(ctx, tenant);

    return await ctx.db
      .query("grades")
      .withIndex("by_tenant_student", (q: any) =>
        q.eq("tenantId", tenant.tenantId).eq("studentId", student._id.toString())
      )
      .collect();
  },
});

export const getMyAttendance = query({
  args: {},
  handler: async (ctx) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "students:read");
    const student = await getStudentRecord(ctx, tenant);

    return await ctx.db
      .query("attendance")
      .withIndex("by_student", (q: any) => q.eq("studentId", student._id.toString()))
      .filter((q: any) => q.eq(q.field("tenantId"), tenant.tenantId))
      .collect();
  },
});

export const getMyAssignments = query({
  args: {},
  handler: async (ctx) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:read");
    const student = await getStudentRecord(ctx, tenant);
    if (!student.classId) return [];

    return await ctx.db
      .query("assignments")
      .withIndex("by_class", (q: any) => q.eq("classId", student.classId))
      .filter((q: any) => q.eq(q.field("tenantId"), tenant.tenantId))
      .collect();
  },
});

export const getMyWalletBalance = query({
  args: {},
  handler: async (ctx) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "ewallet");
    requirePermission(tenant, "ewallet:read");
    const student = await getStudentRecord(ctx, tenant);

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_owner", (q: any) =>
        q.eq("tenantId", tenant.tenantId).eq("ownerId", student._id.toString())
      )
      .first();

    return wallet
      ? { balanceCents: wallet.balanceCents, currency: wallet.currency }
      : { balanceCents: 0, currency: "KES" };
  },
});

