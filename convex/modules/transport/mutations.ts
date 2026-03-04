import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";

export const createRoute = mutation({
    args: {
        name: v.string(),
        stops: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "transport");
        requirePermission(tenant, "transport:write");

        const now = Date.now();
        return await ctx.db.insert("transportRoutes", {
            tenantId: tenant.tenantId,
            name: args.name,
            stops: args.stops,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const updateRoute = mutation({
    args: {
        routeId: v.id("transportRoutes"),
        name: v.optional(v.string()),
        stops: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "transport");
        requirePermission(tenant, "transport:write");

        const route = await ctx.db.get(args.routeId);
        if (!route || route.tenantId !== tenant.tenantId) throw new Error("Route not found");

        const updates: Record<string, unknown> = { updatedAt: Date.now() };
        if (args.name !== undefined) updates.name = args.name;
        if (args.stops !== undefined) updates.stops = args.stops;
        await ctx.db.patch(args.routeId, updates);
        return args.routeId;
    },
});

export const createVehicle = mutation({
    args: {
        plateNumber: v.string(),
        capacity: v.number(),
        routeId: v.optional(v.string()),
        driverId: v.optional(v.string()),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "transport");
        requirePermission(tenant, "transport:write");

        const now = Date.now();
        return await ctx.db.insert("vehicles", {
            tenantId: tenant.tenantId,
            plateNumber: args.plateNumber,
            capacity: args.capacity,
            routeId: args.routeId,
            driverId: args.driverId,
            status: args.status ?? "active",
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const assignDriverToVehicle = mutation({
    args: { vehicleId: v.id("vehicles"), driverId: v.string() },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "transport");
        requirePermission(tenant, "transport:write");

        const vehicle = await ctx.db.get(args.vehicleId);
        if (!vehicle || vehicle.tenantId !== tenant.tenantId) throw new Error("Vehicle not found");

        await ctx.db.patch(args.vehicleId, {
            driverId: args.driverId,
            updatedAt: Date.now(),
        });
        return args.vehicleId;
    },
});

export const createDriver = mutation({
    args: {
        firstName: v.string(),
        lastName: v.string(),
        phone: v.string(),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "transport");
        requirePermission(tenant, "transport:write");

        const now = Date.now();
        return await ctx.db.insert("drivers", {
            tenantId: tenant.tenantId,
            firstName: args.firstName,
            lastName: args.lastName,
            phone: args.phone,
            status: args.status ?? "active",
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const assignStudentToRoute = mutation({
    args: {
        studentId: v.string(),
        routeId: v.string(),
        stopIndex: v.number(),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "transport");
        requirePermission(tenant, "transport:write");

        const existing = await ctx.db
            .query("transportAssignments")
            .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
            .filter((f) => f.eq(f.field("tenantId"), tenant.tenantId))
            .first();

        const now = Date.now();
        if (existing) {
            await ctx.db.patch(existing._id, {
                routeId: args.routeId,
                stopIndex: args.stopIndex,
                updatedAt: now,
            });
            return existing._id;
        }
        return await ctx.db.insert("transportAssignments", {
            tenantId: tenant.tenantId,
            studentId: args.studentId,
            routeId: args.routeId,
            stopIndex: args.stopIndex,
            createdAt: now,
            updatedAt: now,
        });
    },
});
