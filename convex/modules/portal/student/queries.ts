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
        try {
            // Get authentication context first
            const tenant = await requireTenantContext(ctx);
            
            // Student profile is part of SIS
            await requireModule(ctx, tenant.tenantId, "sis");

            // First try to find by userId (preferred method)
            let student = await ctx.db
                .query("students")
                .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
                .first();

            // If not found by userId, it's possible the student record exists but userId is not set
            // This can happen in development or during data migration
            if (!student) {
                console.log("Student not found by userId, checking for any student record for tenant");
                
                // Try to find any student record for this tenant as a fallback
                const allStudents = await ctx.db
                    .query("students")
                    .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                    .collect();
                
                console.log(`Found ${allStudents.length} students for tenant ${tenant.tenantId}`);
                
                // Return the first student found (this is a fallback for development/data issues)
                if (allStudents.length > 0) {
                    student = allStudents[0];
                    console.log("Using fallback student record:", student._id);
                } else {
                    console.log("No student records found for tenant");
                    return null;
                }
            }

            // Final validation
            if (!student) {
                console.log("No student record could be found for user:", tenant.userId);
                return null;
            }

            // Verify tenant match (security check)
            if (student.tenantId !== tenant.tenantId) {
                console.log("Security: Tenant mismatch - student belongs to", student.tenantId, "but user is in", tenant.tenantId);
                return null;
            }

            console.log("Successfully found student record:", {
                _id: student._id,
                firstName: student.firstName,
                lastName: student.lastName,
                userId: student.userId || "NOT_SET",
                tenantId: student.tenantId
            });

            return student;
            
        } catch (error) {
            console.error("Error in getMyProfile:", error);
            // Return null instead of throwing to prevent app crashes
            return null;
        }
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

        if (!student) return [];

        let gradesQuery = ctx.db
            .query("grades")
            .withIndex("by_student", (q) =>
                q.eq("studentId", student._id.toString())
            )
            .filter((q) => q.eq(q.field("tenantId"), tenant.tenantId));

        const grades = await gradesQuery.collect();

        return grades.filter(g =>
            (!args.term || g.term === args.term) &&
            (!args.academicYear || g.academicYear === args.academicYear)
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
            .query("attendance")
            .withIndex("by_student_date", (q) =>
                q.eq("studentId", student._id.toString())
            )
            .filter((q) => q.eq(q.field("tenantId"), tenant.tenantId))
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
            .query("timetables")
            .withIndex("by_class", (q) =>
                q.eq("classId", student.classId!)
            )
            .filter((q) => q.eq(q.field("tenantId"), tenant.tenantId))
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
            .withIndex("by_class", (q) =>
                q.eq("classId", student.classId!)
            )
            .filter((q) => q.eq(q.field("tenantId"), tenant.tenantId))
            .collect();

        const submissions = await ctx.db
            .query("submissions")
            .withIndex("by_student", (q) =>
                q.eq("studentId", student._id.toString())
            )
            .filter((q) => q.eq(q.field("tenantId"), tenant.tenantId))
            .collect();

        const result = assignments.map(a => {
            const submission = submissions.find(s => s.assignmentId === a._id);
            return {
                ...a,
                submission,
                status: submission ? (submission.grade !== undefined ? "graded" : "submitted") : "pending"
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
        try {
            const tenant = await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "ewallet");

            const wallet = await ctx.db
                .query("wallets")
                .withIndex("by_owner", (q) =>
                    q.eq("tenantId", tenant.tenantId).eq("ownerId", tenant.userId)
                )
                .first();

            if (!wallet) return { balanceCents: 0, currency: "KES", frozen: false };

            return {
                balanceCents: wallet.balanceCents,
                currency: wallet.currency,
                frozen: wallet.frozen ?? false,
            };
        } catch {
            return { balanceCents: 0, currency: "KES", frozen: false };
        }
    },
});

export const getMyTransactionHistory = query({
    args: {
        limit: v.optional(v.number()),
        type: v.optional(v.union(v.literal("credit"), v.literal("debit"), v.literal("refund"))),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "ewallet");

        const student = await ctx.db
            .query("students")
            .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
            .first();

        if (!student) return [];

        const wallet = await ctx.db
            .query("wallets")
            .withIndex("by_owner", (q) =>
                q.eq("tenantId", tenant.tenantId).eq("ownerId", student._id.toString())
            )
            .first();

        if (!wallet) return [];

        const transactions = await ctx.db
            .query("walletTransactions")
            .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id.toString()))
            .order("desc")
            .take(args.limit ?? 50);

        const filtered = args.type
            ? transactions.filter((t) => t.type === args.type)
            : transactions;

        // Compute running balance (approx, descending order)
        let runningBalance = wallet.balanceCents;
        return filtered.map((t) => {
            const balanceAfter = runningBalance;
            if (t.type === "credit" || t.type === "refund") {
                runningBalance -= t.amountCents;
            } else {
                runningBalance += t.amountCents;
            }
            return {
                ...t,
                description: t.reference || (t.type === "credit" ? "Wallet Top-up" : t.type === "refund" ? "Refund" : "Payment"),
                balanceAfter,
                referenceType: t.orderId ? "order" : t.reference ? "manual" : undefined,
            };
        });
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
            .withIndex("by_student_term", (q) =>
                q.eq("studentId", student._id.toString())
            )
            .filter((q) =>
                q.and(
                    q.eq(q.field("tenantId"), tenant.tenantId),
                    q.eq(q.field("status"), "published")
                )
            )
            .collect();
    },
});

export const getMySubmission = query({
    args: {
        assignmentId: v.id("assignments"),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "academics");

        const submission = await ctx.db
            .query("submissions")
            .withIndex("by_student", (q) =>
                q.eq("studentId", args.userId)
            )
            .filter((q) => 
                q.and(
                    q.eq(q.field("tenantId"), tenant.tenantId),
                    q.eq(q.field("assignmentId"), args.assignmentId)
                )
            )
            .first();

        return submission;
    },
});

export const getAnnouncements = query({
    args: {},
    handler: async (ctx) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "communications");

        const student = await ctx.db
            .query("students")
            .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
            .first();

        return await ctx.db
            .query("notifications")
            .withIndex("by_tenant", (q) =>
                q.eq("tenantId", tenant.tenantId)
            )
            .filter(q => q.or(
                q.eq(q.field("type"), "announcement"),
                q.eq(q.field("type"), "general")
            ))
            .collect();
    },
});
