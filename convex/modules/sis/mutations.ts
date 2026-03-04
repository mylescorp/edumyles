import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { logAction } from "../../helpers/auditLog";

export const createStudent = mutation({
    args: {
        admissionNo: v.optional(v.string()),
        firstName: v.string(),
        lastName: v.string(),
        dateOfBirth: v.string(),
        gender: v.string(),
        classId: v.optional(v.string()),
        status: v.optional(v.string()),
        guardianName: v.optional(v.string()),
        guardianEmail: v.optional(v.string()),
        guardianPhone: v.optional(v.string()),
        guardianRelationship: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "sis");
        requirePermission(tenant, "students:write");

        const admNo = args.admissionNo || `ADM-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

        const studentId = await ctx.db.insert("students", {
            tenantId: tenant.tenantId,
            admissionNo: admNo,
            firstName: args.firstName,
            lastName: args.lastName,
            dateOfBirth: args.dateOfBirth,
            gender: args.gender,
            classId: args.classId,
            status: args.status || "active",
            guardianUserId: undefined,
            enrolledAt: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        if (args.guardianName) {
            await ctx.db.insert("guardians", {
                tenantId: tenant.tenantId,
                firstName: args.guardianName.split(" ")[0] || "Guardian",
                lastName: args.guardianName.split(" ").slice(1).join(" ") || "",
                email: args.guardianEmail || "",
                phone: args.guardianPhone || "",
                relationship: args.guardianRelationship || "guardian",
                studentIds: [studentId.toString()],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }

        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "student.created",
            entityType: "student",
            entityId: studentId,
            after: { ...args, admissionNumber: admNo },
        });

        return studentId;
    },
});

export const updateStudent = mutation({
    args: {
        id: v.id("students"),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        dateOfBirth: v.optional(v.string()),
        gender: v.optional(v.string()),
        classId: v.optional(v.string()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "sis");
        requirePermission(tenant, "students:write");

        const { id, ...updates } = args;
        const existing = await ctx.db.get(id);
        if (!existing || existing.tenantId !== tenant.tenantId) {
            throw new Error("Student not found or access denied");
        }

        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now(),
        });

        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "student.updated",
            entityType: "student",
            entityId: id,
            before: existing,
            after: updates,
        });

        return id;
    },
});

export const createClass = mutation({
    args: {
        name: v.string(),
        level: v.optional(v.string()),
        stream: v.optional(v.string()),
        teacherId: v.optional(v.string()),
        capacity: v.optional(v.number()),
        academicYear: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "sis");
        requirePermission(tenant, "settings:write");

        const classId = await ctx.db.insert("classes", {
            tenantId: tenant.tenantId,
            ...args,
            createdAt: Date.now(),
        });

        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "class.created",
            entityType: "class",
            entityId: classId,
            after: args,
        });

        return classId;
    },
});

export const createGuardian = mutation({
    args: {
        firstName: v.string(),
        lastName: v.string(),
        phone: v.string(),
        email: v.string(),
        relationship: v.string(),
        studentIds: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "sis");
        requirePermission(tenant, "students:write");

        const guardianId = await ctx.db.insert("guardians", {
            tenantId: tenant.tenantId,
            ...args,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return guardianId;
    },
});
