import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { logAction } from "../../helpers/auditLog";

export const updateApplicationStatus = mutation({
    args: {
        applicationId: v.id("admissionApplications"),
        status: v.union(
            v.literal("pending"),
            v.literal("review"),
            v.literal("accepted"),
            v.literal("rejected"),
            v.literal("waitlisted"),
            v.literal("enrolled")
        ),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "admissions");
        requirePermission(tenant, "students:write");

        if (args.notes && args.notes.length > 2000) {
            throw new Error("Notes must be 2000 characters or fewer");
        }

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
            admissionNumber: args.admissionNo,
            firstName: application.firstName,
            lastName: application.lastName,
            dateOfBirth: application.dateOfBirth,
            gender: application.gender,
            ...(args.classId ? { classId: args.classId } : {}),
            status: "active",
            enrolledAt: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // 2. Create Guardian record
        const guardianNameParts = application.guardianName.split(" ");
        const guardianId = await ctx.db.insert("guardians", {
            tenantId: tenant.tenantId,
            firstName: guardianNameParts[0] ?? "",
            lastName: guardianNameParts.slice(1).join(" ") || "",
            phone: application.guardianPhone,
            email: application.guardianEmail || "",
            relationship: "guardian",
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
