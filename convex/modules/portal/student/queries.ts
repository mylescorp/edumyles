import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { query } from "../../../_generated/server";
import { requireTenantContext } from "../../../helpers/tenantGuard";
import { requirePermission } from "../../../helpers/authorize";
import { requireModule } from "../../../helpers/moduleGuard";
import { getMyAssignments } from "../../academics/assignments";

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

        if (!student) {
            throw new ConvexError("Student profile not found for this account");
        }

        // Verify tenant match (security check)
        if (student.tenantId !== tenant.tenantId) {
            throw new ConvexError("Student profile not found for this account");
        }

        return student;
    },
});

export const getMyGrades = query({
    args: {
        term: v.optional(v.string()),
        academicYear: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "academics");
        requirePermission(tenant, "grades:read");

        const student = await ctx.db
            .query("students")
            .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
            .first();

        if (!student) {
            throw new ConvexError("Student profile not found for this account");
        }

        let gradesQuery = ctx.db
            .query("grades")
            .withIndex("by_student", (q) => q.eq("studentId", student._id));

        if (args.term) {
            gradesQuery = gradesQuery.filter((q) =>
                q.eq(q.field("term"), args.term)
            );
        }

        if (args.academicYear) {
            gradesQuery = gradesQuery.filter((q) =>
                q.eq(q.field("academicYear"), args.academicYear)
            );
        }

        const grades = await gradesQuery.order("desc").collect();

        // Enrich with subject information
        const enrichedGrades = await Promise.all(
            grades.map(async (grade) => {
                const subject = await ctx.db.get(grade.subjectId as any);
                return {
                    ...grade,
                    subjectName: subject?.name,
                };
            })
        );

        return enrichedGrades;
    },
});

export const getMyAttendance = query({
    args: {},
    handler: async (ctx) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "academics");
        requirePermission(tenant, "attendance:read");

        const student = await ctx.db
            .query("students")
            .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
            .first();

        if (!student) {
            throw new ConvexError("Student profile not found for this account");
        }

        return await ctx.db
            .query("attendance")
            .withIndex("by_student", (q) => q.eq("studentId", student._id))
            .order("desc")
            .collect();
    },
});

export const getMyTimetable = query({
    args: {},
    handler: async (ctx) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "academics");
        requirePermission(tenant, "timetable:read");

        const student = await ctx.db
            .query("students")
            .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
            .first();

        if (!student) {
            throw new ConvexError("Student profile not found for this account");
        }

        return await ctx.db
            .query("timetables")
            .withIndex("by_class", (q) =>
                q.eq("classId", student.classId!)
            )
            .filter((q) => q.eq(q.field("tenantId"), tenant.tenantId))
            .collect();
    },
});

export const getMyNotifications = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx) => {
        const tenant = await requireTenantContext(ctx);

        const student = await ctx.db
            .query("students")
            .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
            .first();

        if (!student) {
            throw new ConvexError("Student profile not found for this account");
        }

        return await ctx.db
            .query("notifications")
            .withIndex("by_tenant", (q) =>
                q.eq("tenantId", tenant.tenantId)
            )
            .filter(q => q.or(
                q.eq(q.field("type"), "announcement"),
                q.eq(q.field("type"), "general")
            ))
            .take(args.limit ?? 20)
            .order("desc")
            .collect();
    },
});

// Export the assignment query from the academics module
export { getMyAssignments };
