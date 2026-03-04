import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { logAction } from "../../helpers/auditLog";

export const updateApplicationStatus = mutation({
    args: {
        applicationId: v.id("admissionApplications"),
        status: v.string(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "admissions");
        requirePermission(tenant, "students:write");

        const application = await ctx.db.get(args.applicationId);
        if (!application || application.tenantId !== tenant.tenantId) {
            throw new Error("Application not found or access denied");
        }

        await ctx.db.patch(args.applicationId, {
            status: args.status,
            notes: args.notes ?? application.notes,
            reviewedBy: tenant.userId,
            reviewedAt: Date.now(),
            updatedAt: Date.now(),
        });

        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "admission.status_updated",
            entityType: "admissionApplication",
            entityId: args.applicationId,
            before: { status: application.status },
            after: { status: args.status },
        });

        return args.applicationId;
    },
});

export const enrollFromApplication = mutation({
    args: {
        applicationId: v.id("admissionApplications"),
        admissionNo: v.string(),
        classId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "admissions");
        await requireModule(ctx, tenant.tenantId, "sis");
        requirePermission(tenant, "students:write");

        const application = await ctx.db.get(args.applicationId);
        if (!application || application.tenantId !== tenant.tenantId) {
            throw new Error("Application not found or access denied");
        }

        if (application.status !== "accepted") {
            throw new Error("Only accepted applications can be enrolled");
        }

        // 1. Create Student record
        const studentId = await ctx.db.insert("students", {
            tenantId: tenant.tenantId,
            admissionNo: args.admissionNo,
            firstName: application.studentInfo.firstName,
            lastName: application.studentInfo.lastName,
            dateOfBirth: application.studentInfo.dateOfBirth,
            gender: application.studentInfo.gender,
            classId: args.classId,
            status: "active",
            enrolledAt: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // 2. Create Guardian record
        const guardianId = await ctx.db.insert("guardians", {
            tenantId: tenant.tenantId,
            firstName: application.guardianInfo.firstName,
            lastName: application.guardianInfo.lastName,
            phone: application.guardianInfo.phone,
            email: application.guardianInfo.email || "",
            relationship: application.guardianInfo.relationship as any,
            studentIds: [studentId.toString()],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // 4. Update Application status
        await ctx.db.patch(args.applicationId, {
            status: "enrolled",
            updatedAt: Date.now(),
        });

        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "admission.enrolled",
            entityType: "admissionApplication",
            entityId: args.applicationId,
            after: { studentId, guardianId },
        });

        return studentId;
    },
});
