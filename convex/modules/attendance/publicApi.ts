import { v } from "convex/values";
import { internalQuery } from "../../_generated/server";
import { requireModuleAccess } from "../../helpers/moduleGuard";

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function countConsecutiveAbsences(records: Array<{ date: string; status: string }>) {
  const absentDates = records
    .filter((record) => record.status === "absent")
    .map((record) => record.date)
    .sort((a, b) => b.localeCompare(a));

  let streak = 0;
  let expectedDate: string | null = null;

  for (const absentDate of absentDates) {
    if (!expectedDate) {
      streak += 1;
      expectedDate = toDateOnly(new Date(new Date(absentDate).getTime() - 86400000));
      continue;
    }

    if (absentDate === expectedDate) {
      streak += 1;
      expectedDate = toDateOnly(new Date(new Date(absentDate).getTime() - 86400000));
      continue;
    }

    break;
  }

  return streak;
}

async function getFilteredAttendance(ctx: any, tenantId: string, studentId: string, termId?: string) {
  const records = await ctx.db
    .query("attendance")
    .withIndex("by_student_date", (q: any) => q.eq("studentId", studentId))
    .collect();

  const tenantScoped = records.filter((record: any) => record.tenantId === tenantId);

  if (!termId) {
    return tenantScoped;
  }

  const terms = await ctx.db
    .query("academicTerms")
    .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenantId))
    .collect();
  const term = terms.find((entry: any) => entry._id.toString() === termId || entry.term === termId);

  if (!term) {
    return tenantScoped;
  }

  return tenantScoped.filter(
    (record: any) => record.date >= term.startDate && record.date <= term.endDate
  );
}

export const getStudentAttendanceRate = internalQuery({
  args: {
    tenantId: v.string(),
    studentId: v.string(),
    termId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireModuleAccess(ctx, "mod_attendance", args.tenantId);

    const records = await getFilteredAttendance(ctx, args.tenantId, args.studentId, args.termId);
    const presentCount = records.filter((record: any) => record.status === "present").length;
    const attendanceRatePct =
      records.length > 0 ? Math.round((presentCount / records.length) * 1000) / 10 : 0;

    return {
      attendanceRatePct,
      consecutiveAbsences: countConsecutiveAbsences(records),
    };
  },
});

export const getClassAttendanceSummary = internalQuery({
  args: {
    tenantId: v.string(),
    classId: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    await requireModuleAccess(ctx, "mod_attendance", args.tenantId);

    const records = await ctx.db
      .query("attendance")
      .withIndex("by_class_date", (q) => q.eq("classId", args.classId).eq("date", args.date))
      .collect();

    const tenantScoped = records.filter((record) => record.tenantId === args.tenantId);

    return {
      presentCount: tenantScoped.filter((record) => record.status === "present").length,
      absentCount: tenantScoped.filter((record) => record.status === "absent").length,
      lateCount: tenantScoped.filter((record) => record.status === "late").length,
    };
  },
});

export const getConsecutiveAbsences = internalQuery({
  args: {
    tenantId: v.string(),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireModuleAccess(ctx, "mod_attendance", args.tenantId);
    const records = await getFilteredAttendance(ctx, args.tenantId, args.studentId);
    return countConsecutiveAbsences(records);
  },
});
