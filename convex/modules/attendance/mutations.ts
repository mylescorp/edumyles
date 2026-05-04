import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { publishEvent } from "../../eventBus";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { requireTenantContext, requireTenantSession } from "../../helpers/tenantGuard";

async function tenantFromArgs(ctx: any, sessionToken?: string) {
  return sessionToken
    ? await requireTenantSession(ctx, { sessionToken })
    : await requireTenantContext(ctx);
}

function previousDate(date: string, daysBack: number) {
  const current = new Date(`${date}T00:00:00.000Z`);
  current.setUTCDate(current.getUTCDate() - daysBack);
  return current.toISOString().slice(0, 10);
}

async function countAbsenceStreak(ctx: any, tenantId: string, studentId: string, fromDate: string) {
  const records = await ctx.db
    .query("attendance")
    .withIndex("by_student_date", (q: any) => q.eq("studentId", studentId))
    .collect();
  const byDate = new Map(
    records
      .filter((record: any) => record.tenantId === tenantId)
      .map((record: any) => [record.date, record.status])
  );
  let streak = 0;
  for (let offset = 0; offset < 30; offset += 1) {
    const status = byDate.get(previousDate(fromDate, offset));
    if (status === "absent" || status === "medical") {
      streak += 1;
      continue;
    }
    break;
  }
  return streak;
}

async function raiseConsecutiveAbsenceAlert(ctx: any, args: {
  tenantId: string;
  studentId: string;
  classId: string;
  date: string;
  streakDays: number;
}) {
  const openAlerts = await ctx.db
    .query("attendanceAlerts")
    .withIndex("by_student", (q: any) => q.eq("studentId", args.studentId))
    .collect();
  const existing = openAlerts.find((alert: any) =>
    alert.tenantId === args.tenantId &&
    alert.type === "consecutive_absence" &&
    alert.status === "open"
  );
  const message = `Student has been absent for ${args.streakDays} consecutive school days as of ${args.date}.`;
  if (existing) {
    await ctx.db.patch(existing._id, {
      streakDays: args.streakDays,
      message,
    });
    return existing._id;
  }
  return await ctx.db.insert("attendanceAlerts", {
    tenantId: args.tenantId,
    studentId: args.studentId,
    classId: args.classId,
    type: "consecutive_absence",
    severity: args.streakDays >= 5 ? "high" : "medium",
    message,
    streakDays: args.streakDays,
    status: "open",
    createdAt: Date.now(),
  });
}

async function writeClassAttendance(ctx: any, args: {
  sessionToken?: string;
  classId: string;
  date: string;
  records: Array<{ studentId: string; status: string; remarks?: string }>;
}) {
  const tenant = await tenantFromArgs(ctx, args.sessionToken);
  await requireModule(ctx, tenant.tenantId, "attendance");
  requirePermission(tenant, "attendance:write");

  const now = Date.now();
  let created = 0;
  let updated = 0;
  for (const record of args.records) {
    const student = await ctx.db.get(record.studentId as any);
    if (!student || (student as any).tenantId !== tenant.tenantId) {
      continue;
    }
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_student_date", (q: any) => q.eq("studentId", record.studentId).eq("date", args.date))
      .first();
    const payload = {
      tenantId: tenant.tenantId,
      classId: args.classId,
      studentId: record.studentId,
      date: args.date,
      status: record.status,
      remarks: record.remarks,
      recordedBy: tenant.userId,
    };
    if (existing && existing.tenantId === tenant.tenantId) {
      await ctx.db.patch(existing._id, payload);
      updated += 1;
    } else {
      await ctx.db.insert("attendance", {
        ...payload,
        createdAt: now,
      });
      created += 1;
    }
    if (record.status === "absent" || record.status === "medical") {
      await publishEvent(ctx, {
        eventType: "attendance.student.absent",
        publisherModule: "mod_attendance",
        tenantId: tenant.tenantId,
        payload: {
          studentId: record.studentId,
          classId: args.classId,
          date: args.date,
          status: record.status,
        },
      });
      const streakDays = await countAbsenceStreak(ctx, tenant.tenantId, record.studentId, args.date);
      if (streakDays >= 3) {
        await raiseConsecutiveAbsenceAlert(ctx, {
          tenantId: tenant.tenantId,
          studentId: record.studentId,
          classId: args.classId,
          date: args.date,
          streakDays,
        });
        await publishEvent(ctx, {
          eventType: "attendance.student.absent.consecutive",
          publisherModule: "mod_attendance",
          tenantId: tenant.tenantId,
          payload: {
            studentId: record.studentId,
            classId: args.classId,
            date: args.date,
            streakDays,
          },
        });
      }
    }
  }

  return { success: true, created, updated };
}

export const markClassAttendance = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    classId: v.string(),
    date: v.string(),
    records: v.array(v.object({
      studentId: v.string(),
      status: v.string(),
      remarks: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    return await writeClassAttendance(ctx, args);
  },
});

export const openAttendanceSession = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    classId: v.string(),
    date: v.string(),
    sessionType: v.optional(v.string()),
    periodLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await tenantFromArgs(ctx, args.sessionToken);
    await requireModule(ctx, tenant.tenantId, "attendance");
    requirePermission(tenant, "attendance:write");
    const existing = await ctx.db
      .query("attendanceSessions")
      .withIndex("by_class_date", (q) => q.eq("classId", args.classId).eq("date", args.date))
      .collect();
    const open = existing.find((session) => session.tenantId === tenant.tenantId && session.status === "open");
    if (open) return open._id;
    return await ctx.db.insert("attendanceSessions", {
      tenantId: tenant.tenantId,
      classId: args.classId,
      date: args.date,
      sessionType: args.sessionType ?? "daily",
      periodLabel: args.periodLabel,
      openedBy: tenant.userId,
      openedAt: Date.now(),
      status: "open",
    });
  },
});

export const closeAttendanceSession = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    sessionId: v.id("attendanceSessions"),
  },
  handler: async (ctx, args) => {
    const tenant = await tenantFromArgs(ctx, args.sessionToken);
    await requireModule(ctx, tenant.tenantId, "attendance");
    requirePermission(tenant, "attendance:write");
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.tenantId !== tenant.tenantId) throw new Error("Attendance session not found");
    await ctx.db.patch(args.sessionId, {
      closedAt: Date.now(),
      status: "closed",
    });
    return { success: true };
  },
});

export const createQrAttendanceToken = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    sessionId: v.id("attendanceSessions"),
    expiresInMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tenant = await tenantFromArgs(ctx, args.sessionToken);
    await requireModule(ctx, tenant.tenantId, "attendance");
    requirePermission(tenant, "attendance:write");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.tenantId !== tenant.tenantId) {
      throw new Error("Attendance session not found");
    }
    if (session.status !== "open") {
      throw new Error("Attendance session must be open before creating a QR token");
    }

    const now = Date.now();
    const token = `att_${args.sessionId}_${Math.random().toString(36).slice(2)}_${now.toString(36)}`;
    const tokenId = await ctx.db.insert("attendanceQrTokens", {
      tenantId: tenant.tenantId,
      sessionId: args.sessionId.toString(),
      classId: session.classId,
      date: session.date,
      token,
      expiresAt: now + (args.expiresInMinutes ?? 15) * 60 * 1000,
      createdBy: tenant.userId,
      createdAt: now,
    });

    return {
      tokenId,
      token,
      expiresAt: now + (args.expiresInMinutes ?? 15) * 60 * 1000,
    };
  },
});

export const markAttendanceByQrToken = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    token: v.string(),
    studentId: v.string(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await tenantFromArgs(ctx, args.sessionToken);
    await requireModule(ctx, tenant.tenantId, "attendance");
    requirePermission(tenant, "attendance:write");

    const qrToken = await ctx.db
      .query("attendanceQrTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!qrToken || qrToken.tenantId !== tenant.tenantId || qrToken.revokedAt) {
      throw new Error("QR token is invalid");
    }
    if (qrToken.expiresAt < Date.now()) {
      throw new Error("QR token has expired");
    }

    return await writeClassAttendance(ctx, {
      sessionToken: args.sessionToken,
      classId: qrToken.classId,
      date: qrToken.date,
      records: [{ studentId: args.studentId, status: args.status ?? "present" }],
    });
  },
});

export const revokeQrAttendanceToken = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    tokenId: v.id("attendanceQrTokens"),
  },
  handler: async (ctx, args) => {
    const tenant = await tenantFromArgs(ctx, args.sessionToken);
    await requireModule(ctx, tenant.tenantId, "attendance");
    requirePermission(tenant, "attendance:write");

    const qrToken = await ctx.db.get(args.tokenId);
    if (!qrToken || qrToken.tenantId !== tenant.tenantId) {
      throw new Error("QR token not found");
    }
    await ctx.db.patch(args.tokenId, { revokedAt: Date.now() });
    return { success: true };
  },
});

export const markStudentAttendance = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    classId: v.string(),
    studentId: v.string(),
    date: v.string(),
    status: v.string(),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await writeClassAttendance(ctx, {
      sessionToken: args.sessionToken,
      classId: args.classId,
      date: args.date,
      records: [{ studentId: args.studentId, status: args.status, remarks: args.remarks }],
    });
    return result;
  },
});
