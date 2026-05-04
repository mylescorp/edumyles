import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { requireTenantContext, requireTenantSession } from "../../helpers/tenantGuard";

async function tenantFromArgs(ctx: any, sessionToken?: string) {
  return sessionToken
    ? await requireTenantSession(ctx, { sessionToken })
    : await requireTenantContext(ctx);
}

function summarize(records: Array<{ status: string }>) {
  const present = records.filter((record) => record.status === "present").length;
  const absent = records.filter((record) => record.status === "absent").length;
  const late = records.filter((record) => record.status === "late").length;
  const excused = records.filter((record) => record.status === "excused").length;
  const medical = records.filter((record) => record.status === "medical").length;
  const total = records.length;
  return {
    present,
    absent,
    late,
    excused,
    medical,
    total,
    attendanceRatePct: total > 0 ? Math.round((present / total) * 1000) / 10 : 0,
  };
}

export const getClassAttendance = query({
  args: {
    sessionToken: v.optional(v.string()),
    classId: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await tenantFromArgs(ctx, args.sessionToken);
    await requireModule(ctx, tenant.tenantId, "attendance");
    requirePermission(tenant, "attendance:read");

    const records = await ctx.db
      .query("attendance")
      .withIndex("by_class_date", (q) => q.eq("classId", args.classId).eq("date", args.date))
      .collect();
    const students = await ctx.db
      .query("students")
      .withIndex("by_tenant_class", (q) => q.eq("tenantId", tenant.tenantId).eq("classId", args.classId))
      .collect();
    const recordByStudent = new Map(
      records
        .filter((record) => record.tenantId === tenant.tenantId)
        .map((record) => [record.studentId, record])
    );

    return students.map((student) => ({
      student,
      record: recordByStudent.get(student._id.toString()) ?? null,
    }));
  },
});

export const getStudentAttendanceHistory = query({
  args: {
    sessionToken: v.optional(v.string()),
    studentId: v.string(),
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await tenantFromArgs(ctx, args.sessionToken);
    await requireModule(ctx, tenant.tenantId, "attendance");
    requirePermission(tenant, "attendance:read");

    return (await ctx.db
      .query("attendance")
      .withIndex("by_student_date", (q) => q.eq("studentId", args.studentId))
      .collect())
      .filter((record) => record.tenantId === tenant.tenantId)
      .filter((record) => !args.dateFrom || record.date >= args.dateFrom)
      .filter((record) => !args.dateTo || record.date <= args.dateTo)
      .sort((a, b) => b.date.localeCompare(a.date));
  },
});

export const getAttendanceReports = query({
  args: {
    sessionToken: v.optional(v.string()),
    classId: v.optional(v.string()),
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
    chronicAbsenceThreshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tenant = await tenantFromArgs(ctx, args.sessionToken);
    await requireModule(ctx, tenant.tenantId, "attendance");
    requirePermission(tenant, "attendance:read");

    const [records, students] = await Promise.all([
      ctx.db.query("attendance").withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId)).collect(),
      ctx.db.query("students").withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId)).collect(),
    ]);
    const filtered = records
      .filter((record) => !args.classId || record.classId === args.classId)
      .filter((record) => !args.dateFrom || record.date >= args.dateFrom)
      .filter((record) => !args.dateTo || record.date <= args.dateTo);
    const byStudent = new Map<string, typeof filtered>();
    for (const record of filtered) {
      byStudent.set(record.studentId, [...(byStudent.get(record.studentId) ?? []), record]);
    }
    const threshold = args.chronicAbsenceThreshold ?? 3;
    const chronicAbsentees = Array.from(byStudent.entries())
      .map(([studentId, studentRecords]) => ({
        student: students.find((student) => student._id.toString() === studentId) ?? null,
        studentId,
        ...summarize(studentRecords),
      }))
      .filter((entry) => entry.absent + entry.medical >= threshold)
      .sort((a, b) => b.absent + b.medical - (a.absent + a.medical));

    return {
      summary: summarize(filtered),
      chronicAbsentees,
    };
  },
});

export const getAttendanceSessions = query({
  args: {
    sessionToken: v.optional(v.string()),
    classId: v.optional(v.string()),
    date: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await tenantFromArgs(ctx, args.sessionToken);
    await requireModule(ctx, tenant.tenantId, "attendance");
    requirePermission(tenant, "attendance:read");

    return (await ctx.db
      .query("attendanceSessions")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .collect())
      .filter((session) => !args.classId || session.classId === args.classId)
      .filter((session) => !args.date || session.date === args.date)
      .filter((session) => !args.status || session.status === args.status)
      .sort((a, b) => b.openedAt - a.openedAt);
  },
});

export const getAttendanceAlerts = query({
  args: {
    sessionToken: v.optional(v.string()),
    status: v.optional(v.string()),
    studentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await tenantFromArgs(ctx, args.sessionToken);
    await requireModule(ctx, tenant.tenantId, "attendance");
    requirePermission(tenant, "attendance:read");

    return (await ctx.db
      .query("attendanceAlerts")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .collect())
      .filter((alert) => !args.status || alert.status === args.status)
      .filter((alert) => !args.studentId || alert.studentId === args.studentId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});
