import { v } from "convex/values";
import { query } from "../../../_generated/server";
import { requireTenantContext } from "../../../helpers/tenantGuard";
import { requirePermission } from "../../../helpers/authorize";
import { requireModule } from "../../../helpers/moduleGuard";

/**
 * Get the student record for the current authenticated user.
 */
export const getMyProfile = query({
    args: {},
    handler: async (ctx) => {
        const tenant = await requireTenantContext(ctx);
        // Student profile is part of SIS
        await requireModule(ctx, tenant.tenantId, "sis");

        const student = await ctx.db
            .query("students")
            .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
            .first();

        if (!student || student.tenantId !== tenant.tenantId) {
            return null;
        }

        return student;
    },
});

export const getMyGrades = query({
    args: {
        term: v.optional(v.string()),
<<<<<<< HEAD
        academicYearId: v.optional(v.string()),
=======
        academicYear: v.optional(v.string()),
>>>>>>> main
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "academics");
        requirePermission(tenant, "grades:read");

        const student = await ctx.db
            .query("students")
            .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
            .first();

        if (!student) return [];

        let gradesQuery = ctx.db
            .query("grades")
<<<<<<< HEAD
            .withIndex("by_tenant_student", (q) =>
                q.eq("tenantId", tenant.tenantId).eq("studentId", student._id)
            );
=======
            .withIndex("by_student", (q) =>
                q.eq("studentId", student._id.toString())
            )
            .filter((q) => q.eq(q.field("tenantId"), tenant.tenantId));
>>>>>>> main

        const grades = await gradesQuery.collect();

        return grades.filter(g =>
            (!args.term || g.term === args.term) &&
<<<<<<< HEAD
            (!args.academicYearId || g.academicYearId === args.academicYearId)
=======
            (!args.academicYear || g.academicYear === args.academicYear)
>>>>>>> main
        );
    },
});

export const getMyAttendance = query({
    args: {
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "academics");
        requirePermission(tenant, "attendance:read");

        const student = await ctx.db
            .query("students")
            .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
            .first();

        if (!student) return [];

        const records = await ctx.db
<<<<<<< HEAD
            .query("attendanceRecords")
            .withIndex("by_tenant_student", (q) =>
                q.eq("tenantId", tenant.tenantId).eq("studentId", student._id)
            )
=======
            .query("attendance")
            .withIndex("by_student_date", (q) =>
                q.eq("studentId", student._id.toString())
            )
            .filter((q) => q.eq(q.field("tenantId"), tenant.tenantId))
>>>>>>> main
            .collect();

        if (args.startDate || args.endDate) {
            return records.filter(r =>
                (!args.startDate || r.date >= args.startDate) &&
                (!args.endDate || r.date <= args.endDate)
            );
        }

        return records;
    },
});

export const getMyTimetable = query({
    args: {},
    handler: async (ctx) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "timetable");

        const student = await ctx.db
            .query("students")
            .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
            .first();

        if (!student || !student.classId) return [];

        return await ctx.db
<<<<<<< HEAD
            .query("timetableSlots")
            .withIndex("by_tenant_class", (q) =>
                q.eq("tenantId", tenant.tenantId).eq("classId", student.classId!)
            )
=======
            .query("timetables")
            .withIndex("by_class", (q) =>
                q.eq("classId", student.classId!)
            )
            .filter((q) => q.eq(q.field("tenantId"), tenant.tenantId))
>>>>>>> main
            .collect();
    },
});

export const getMyAssignments = query({
    args: {
        status: v.optional(v.union(v.literal("pending"), v.literal("submitted"), v.literal("graded"))),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "academics");

        const student = await ctx.db
            .query("students")
            .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
            .first();

        if (!student || !student.classId) return [];

        const assignments = await ctx.db
            .query("assignments")
<<<<<<< HEAD
            .withIndex("by_tenant_class", (q) =>
                q.eq("tenantId", tenant.tenantId).eq("classId", student.classId!)
            )
=======
            .withIndex("by_class", (q) =>
                q.eq("classId", student.classId!)
            )
            .filter((q) => q.eq(q.field("tenantId"), tenant.tenantId))
>>>>>>> main
            .collect();

        const submissions = await ctx.db
            .query("submissions")
<<<<<<< HEAD
            .withIndex("by_tenant_student", (q) =>
                q.eq("tenantId", tenant.tenantId).eq("studentId", student._id)
            )
=======
            .withIndex("by_student", (q) =>
                q.eq("studentId", student._id.toString())
            )
            .filter((q) => q.eq(q.field("tenantId"), tenant.tenantId))
>>>>>>> main
            .collect();

        const result = assignments.map(a => {
            const submission = submissions.find(s => s.assignmentId === a._id);
            return {
                ...a,
                submission,
<<<<<<< HEAD
                status: submission ? (submission.marks !== undefined ? "graded" : "submitted") : "pending"
=======
                status: submission ? (submission.grade !== undefined ? "graded" : "submitted") : "pending"
>>>>>>> main
            };
        });

        if (args.status) {
            return result.filter(r => r.status === args.status);
        }

        return result;
    },
});

export const getMyWalletBalance = query({
    args: {},
    handler: async (ctx) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "ewallet");

        // For now, if no wallet table exists, we return a mock or 0.
        // Looking at schema, there isn't an ewallet table yet.
        // The implementation plan says eWallet is Phase 10.
        // I'll return a mock balance for now if the table is missing.
        return { balanceCents: 0, currency: "KES" };
    },
});

export const getMyReportCards = query({
    args: {},
    handler: async (ctx) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "academics");

        const student = await ctx.db
            .query("students")
            .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
            .first();

        if (!student) return [];

        return await ctx.db
            .query("reportCards")
<<<<<<< HEAD
            .withIndex("by_tenant_student", (q) =>
                q.eq("tenantId", tenant.tenantId).eq("studentId", student._id)
            )
            .filter(q => q.eq(q.field("status"), "published"))
=======
            .withIndex("by_student_term", (q) =>
                q.eq("studentId", student._id.toString())
            )
            .filter((q) =>
                q.and(
                    q.eq(q.field("tenantId"), tenant.tenantId),
                    q.eq(q.field("status"), "published")
                )
            )
>>>>>>> main
            .collect();
    },
});

export const getAnnouncements = query({
    args: {},
    handler: async (ctx) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "communications");

<<<<<<< HEAD
        return await ctx.db
            .query("announcements")
            .withIndex("by_tenant_status", (q) =>
                q.eq("tenantId", tenant.tenantId).eq("status", "sent")
            )
            .filter(q => q.or(
                q.eq(q.field("audience"), ["all"]),
                q.eq(q.field("audience"), ["students"])
=======
        const student = await ctx.db
            .query("students")
            .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
            .first();

        return await ctx.db
            .query("announcements")
            .withIndex("by_tenant_status", (q) =>
                q.eq("tenantId", tenant.tenantId).eq("status", "published")
            )
            .filter(q => q.or(
                q.eq(q.field("audience"), "all"),
                q.eq(q.field("audience"), "students"),
                q.eq(q.field("audience"), `class:${student?.classId ?? ""}`)
>>>>>>> main
            ))
            .collect();
    },
});
