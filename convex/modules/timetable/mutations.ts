import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { logAction } from "../../helpers/auditLog";

export const createSlot = mutation({
    args: {
        classId: v.string(),
        subjectId: v.string(),
        teacherId: v.string(),
        dayOfWeek: v.number(),
        startTime: v.string(),
        endTime: v.string(),
        room: v.optional(v.string()),
        academicYear: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "timetable");
        requirePermission(tenant, "timetable:write");

        const id = await ctx.db.insert("timetables", {
            tenantId: tenant.tenantId,
            ...args,
            createdAt: Date.now(),
        });

        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "timetable.slot_created",
            entityType: "timetables",
            entityId: id,
            after: args,
        });

        return id;
    },
});

export const updateSlot = mutation({
    args: {
        slotId: v.id("timetables"),
        classId: v.optional(v.string()),
        subjectId: v.optional(v.string()),
        teacherId: v.optional(v.string()),
        dayOfWeek: v.optional(v.number()),
        startTime: v.optional(v.string()),
        endTime: v.optional(v.string()),
        room: v.optional(v.string()),
        academicYear: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "timetable");
        requirePermission(tenant, "timetable:write");

        const { slotId, ...updates } = args;
        const existing = await ctx.db.get(slotId);
        if (!existing || existing.tenantId !== tenant.tenantId) {
            throw new Error("Slot not found");
        }

        await ctx.db.patch(slotId, updates);
        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "timetable.slot_updated",
            entityType: "timetables",
            entityId: slotId,
            before: existing,
            after: updates,
        });

        return slotId;
    },
});

export const deleteSlot = mutation({
    args: { slotId: v.id("timetables") },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "timetable");
        requirePermission(tenant, "timetable:write");

        const existing = await ctx.db.get(args.slotId);
        if (!existing || existing.tenantId !== tenant.tenantId) {
            throw new Error("Slot not found");
        }

        await ctx.db.delete(args.slotId);
        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "timetable.slot_deleted",
            entityType: "timetables",
            entityId: args.slotId,
        });

        return { success: true };
    },
});

export const assignSubstitute = mutation({
    args: {
        slotId: v.id("timetables"),
        substituteTeacherId: v.string(),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "timetable");
        requirePermission(tenant, "timetable:write");

        const existing = await ctx.db.get(args.slotId);
        if (!existing || existing.tenantId !== tenant.tenantId) {
            throw new Error("Slot not found");
        }

        await ctx.db.patch(args.slotId, {
            substituteTeacherId: args.substituteTeacherId,
        });

        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "timetable.substitute_assigned",
            entityType: "timetables",
            entityId: args.slotId,
            after: { substituteTeacherId: args.substituteTeacherId },
        });

        return args.slotId;
    },
});

export const createEvent = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        eventType: v.string(),
        startDate: v.string(),
        endDate: v.optional(v.string()),
        startTime: v.optional(v.string()),
        endTime: v.optional(v.string()),
        location: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "timetable");
        requirePermission(tenant, "timetable:write");

        const now = Date.now();
        const id = await ctx.db.insert("schoolEvents", {
            tenantId: tenant.tenantId,
            title: args.title,
            description: args.description,
            eventType: args.eventType,
            startDate: args.startDate,
            endDate: args.endDate,
            startTime: args.startTime,
            endTime: args.endTime,
            location: args.location,
            createdBy: tenant.userId,
            createdAt: now,
            updatedAt: now,
        });

        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "timetable.slot_created",
            entityType: "schoolEvents",
            entityId: id,
            after: args,
        });

        return id;
    },
});
