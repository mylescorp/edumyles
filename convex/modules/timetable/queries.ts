import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantContext, requireTenantSession } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";

export const listSlots = query({
    args: {
        classId: v.optional(v.string()),
        teacherId: v.optional(v.string()),
        dayOfWeek: v.optional(v.number()),
        academicYear: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "timetable");
        requirePermission(tenant, "timetable:read");

        let q = ctx.db
            .query("timetables")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId));

        if (args.classId) {
            q = ctx.db
                .query("timetables")
                .withIndex("by_class", (q) => q.eq("classId", args.classId!))
                .filter((f) => f.eq(f.field("tenantId"), tenant.tenantId));
        } else if (args.teacherId) {
            q = ctx.db
                .query("timetables")
                .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId!))
                .filter((f) => f.eq(f.field("tenantId"), tenant.tenantId));
        } else if (args.dayOfWeek !== undefined) {
            q = ctx.db
                .query("timetables")
                .withIndex("by_tenant_day", (q) =>
                    q.eq("tenantId", tenant.tenantId).eq("dayOfWeek", args.dayOfWeek!)
                );
        }

        const slots = await q.collect();
        if (args.academicYear) {
            return slots.filter((s) => s.academicYear == null || s.academicYear === args.academicYear);
        }
        return slots;
    },
});

/** Class schedule for a given class (and optional day). */
export const getClassSchedule = query({
    args: {
        classId: v.string(),
        dayOfWeek: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "timetable");
        requirePermission(tenant, "timetable:read");

        let slots = await ctx.db
            .query("timetables")
            .withIndex("by_class", (q) => q.eq("classId", args.classId))
            .filter((f) => f.eq(f.field("tenantId"), tenant.tenantId))
            .collect();

        if (args.dayOfWeek !== undefined) {
            slots = slots.filter((s) => s.dayOfWeek === args.dayOfWeek);
        }
        return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    },
});

/** Teacher schedule (and optional day). */
export const getTeacherSchedule = query({
    args: {
        teacherId: v.string(),
        dayOfWeek: v.optional(v.number()),
        sessionToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = args.sessionToken
            ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
            : await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "timetable");
        requirePermission(tenant, "timetable:read");

        let slots = await ctx.db
            .query("timetables")
            .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
            .filter((f) => f.eq(f.field("tenantId"), tenant.tenantId))
            .collect();

        if (args.dayOfWeek !== undefined) {
            slots = slots.filter((s) => s.dayOfWeek === args.dayOfWeek);
        }
        return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    },
});

/** Room schedule (slots in a given room, optional day). */
export const getRoomSchedule = query({
    args: {
        room: v.string(),
        dayOfWeek: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "timetable");
        requirePermission(tenant, "timetable:read");

        let slots: { _id: any; startTime: string; endTime: string; dayOfWeek: number }[];
        if (args.dayOfWeek !== undefined) {
            slots = await ctx.db
                .query("timetables")
                .withIndex("by_room", (q) =>
                    q.eq("tenantId", tenant.tenantId).eq("room", args.room).eq("dayOfWeek", args.dayOfWeek!)
                )
                .collect();
        } else {
            slots = await ctx.db
                .query("timetables")
                .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                .filter((f) => f.eq(f.field("room"), args.room))
                .collect();
        }
        return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    },
});

/** Conflict detection: teacher double-booking and room clash for a given day. */
export const getConflicts = query({
    args: {
        dayOfWeek: v.number(),
        academicYear: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "timetable");
        requirePermission(tenant, "timetable:read");

        const slots = await ctx.db
            .query("timetables")
            .withIndex("by_tenant_day", (q) =>
                q.eq("tenantId", tenant.tenantId).eq("dayOfWeek", args.dayOfWeek)
            )
            .collect();

        const filtered =
            args.academicYear == null
                ? slots
                : slots.filter((s) => s.academicYear == null || s.academicYear === args.academicYear);

        const conflicts: { type: string; slotIds: string[]; message: string }[] = [];

        const timeOverlap = (a: { startTime: string; endTime: string }, b: { startTime: string; endTime: string }) =>
            a.startTime < b.endTime && b.startTime < a.endTime;

        for (let i = 0; i < filtered.length; i++) {
            for (let j = i + 1; j < filtered.length; j++) {
                const si = filtered[i];
                const sj = filtered[j];
                if (!si || !sj) continue;
                if (!timeOverlap(si, sj)) continue;

                if (si.teacherId === sj.teacherId) {
                    conflicts.push({
                        type: "teacher_double_booking",
                        slotIds: [si._id, sj._id],
                        message: `Teacher ${si.teacherId} double-booked`,
                    });
                }
                if (si.room && sj.room && si.room === sj.room) {
                    conflicts.push({
                        type: "room_clash",
                        slotIds: [si._id, sj._id],
                        message: `Room ${si.room} double-booked`,
                    });
                }
            }
        }
        return conflicts;
    },
});

export const listEvents = query({
    args: {
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "timetable");
        requirePermission(tenant, "timetable:read");

        let q = ctx.db
            .query("schoolEvents")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId));

        const events = await q.order("asc").collect();

        if (args.startDate || args.endDate) {
            return events.filter((e) => {
                if (args.startDate && e.startDate < args.startDate) return false;
                if (args.endDate && e.startDate > args.endDate) return false;
                return true;
            });
        }

        return events;
    },
});
