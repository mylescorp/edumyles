import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { logAction } from "../../helpers/auditLog";

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
        const routeId = await ctx.db.insert("transportRoutes", {
            tenantId: tenant.tenantId,
            name: args.name,
            stops: args.stops,
            createdAt: now,
            updatedAt: now,
        });
        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "transport.route_created",
            entityType: "transportRoute",
            entityId: routeId.toString(),
            after: { name: args.name, stops: args.stops },
        });
        return routeId;
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
        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "transport.route_updated",
            entityType: "transportRoute",
            entityId: args.routeId.toString(),
            before: route,
            after: { ...route, ...updates },
        });
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
        const vehicleId = await ctx.db.insert("vehicles", {
            tenantId: tenant.tenantId,
            plateNumber: args.plateNumber,
            capacity: args.capacity,
            routeId: args.routeId,
            driverId: args.driverId,
            status: args.status ?? "active",
            createdAt: now,
            updatedAt: now,
        });
        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "transport.vehicle_created",
            entityType: "vehicle",
            entityId: vehicleId.toString(),
            after: {
                plateNumber: args.plateNumber,
                capacity: args.capacity,
                routeId: args.routeId,
                driverId: args.driverId,
                status: args.status ?? "active",
            },
        });
        return vehicleId;
    },
});

export const updateVehicle = mutation({
    args: {
        vehicleId: v.id("vehicles"),
        plateNumber: v.optional(v.string()),
        capacity: v.optional(v.number()),
        routeId: v.optional(v.string()),
        driverId: v.optional(v.string()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "transport");
        requirePermission(tenant, "transport:write");

        const vehicle = await ctx.db.get(args.vehicleId);
        if (!vehicle || vehicle.tenantId !== tenant.tenantId) throw new Error("Vehicle not found");

        const updates: Record<string, unknown> = { updatedAt: Date.now() };
        if (args.plateNumber !== undefined) updates.plateNumber = args.plateNumber;
        if (args.capacity !== undefined) updates.capacity = args.capacity;
        if (args.routeId !== undefined) updates.routeId = args.routeId;
        if (args.driverId !== undefined) updates.driverId = args.driverId;
        if (args.status !== undefined) updates.status = args.status;

        await ctx.db.patch(args.vehicleId, updates);
        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "transport.vehicle_updated",
            entityType: "vehicle",
            entityId: args.vehicleId.toString(),
            before: vehicle,
            after: { ...vehicle, ...updates },
        });
        return args.vehicleId;
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
        const driver = await ctx.db.get(args.driverId as any) as any;
        if (!driver || driver.tenantId !== tenant.tenantId) throw new Error("Driver not found");

        if (vehicle.driverId && vehicle.driverId !== args.driverId) {
            const previousDriver = await ctx.db.get(vehicle.driverId as any) as any;
            if (previousDriver && previousDriver.tenantId === tenant.tenantId) {
                await ctx.db.patch(previousDriver._id, {
                    vehicleId: undefined,
                    updatedAt: Date.now(),
                });
            }
        }

        if (driver.vehicleId && driver.vehicleId !== args.vehicleId) {
            const previousVehicle = await ctx.db.get(driver.vehicleId as any) as any;
            if (previousVehicle && previousVehicle.tenantId === tenant.tenantId) {
                await ctx.db.patch(previousVehicle._id, {
                    driverId: undefined,
                    updatedAt: Date.now(),
                });
            }
        }

        const updates = {
            driverId: args.driverId,
            updatedAt: Date.now(),
        };
        await ctx.db.patch(args.vehicleId, updates);
        await ctx.db.patch(driver._id, {
            vehicleId: args.vehicleId,
            updatedAt: Date.now(),
        });
        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "transport.vehicle_driver_assigned",
            entityType: "vehicle",
            entityId: args.vehicleId.toString(),
            before: vehicle,
            after: { ...vehicle, ...updates },
        });
        return args.vehicleId;
    },
});

export const unassignDriverFromVehicle = mutation({
    args: { vehicleId: v.id("vehicles") },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "transport");
        requirePermission(tenant, "transport:write");

        const vehicle = await ctx.db.get(args.vehicleId);
        if (!vehicle || vehicle.tenantId !== tenant.tenantId) throw new Error("Vehicle not found");
        if (!vehicle.driverId) throw new Error("This vehicle does not have a driver assigned");

        const driver = await ctx.db.get(vehicle.driverId as any) as any;
        await ctx.db.patch(args.vehicleId, {
            driverId: undefined,
            updatedAt: Date.now(),
        });
        if (driver && driver.tenantId === tenant.tenantId) {
            await ctx.db.patch(driver._id, {
                vehicleId: undefined,
                updatedAt: Date.now(),
            });
        }

        return { success: true };
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
        const driverId = await ctx.db.insert("drivers", {
            tenantId: tenant.tenantId,
            firstName: args.firstName,
            lastName: args.lastName,
            phone: args.phone,
            status: args.status ?? "active",
            createdAt: now,
            updatedAt: now,
        });
        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "transport.driver_created",
            entityType: "driver",
            entityId: driverId.toString(),
            after: {
                firstName: args.firstName,
                lastName: args.lastName,
                phone: args.phone,
                status: args.status ?? "active",
            },
        });
        return driverId;
    },
});

export const updateDriver = mutation({
    args: {
        driverId: v.id("drivers"),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        phone: v.optional(v.string()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "transport");
        requirePermission(tenant, "transport:write");

        const driver = await ctx.db.get(args.driverId);
        if (!driver || driver.tenantId !== tenant.tenantId) throw new Error("Driver not found");

        const updates: Record<string, unknown> = { updatedAt: Date.now() };
        if (args.firstName !== undefined) updates.firstName = args.firstName;
        if (args.lastName !== undefined) updates.lastName = args.lastName;
        if (args.phone !== undefined) updates.phone = args.phone;
        if (args.status !== undefined) updates.status = args.status;

        await ctx.db.patch(args.driverId, updates);
        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "transport.driver_updated",
            entityType: "driver",
            entityId: args.driverId.toString(),
            before: driver,
            after: { ...driver, ...updates },
        });
        return args.driverId;
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
            await logAction(ctx, {
                tenantId: tenant.tenantId,
                actorId: tenant.userId,
                actorEmail: tenant.email,
                action: "transport.assignment_updated",
                entityType: "transportAssignment",
                entityId: existing._id.toString(),
                before: existing,
                after: {
                    ...existing,
                    routeId: args.routeId,
                    stopIndex: args.stopIndex,
                    updatedAt: now,
                },
            });
            return existing._id;
        }
        const assignmentId = await ctx.db.insert("transportAssignments", {
            tenantId: tenant.tenantId,
            studentId: args.studentId,
            routeId: args.routeId,
            stopIndex: args.stopIndex,
            createdAt: now,
            updatedAt: now,
        });
        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "transport.assignment_updated",
            entityType: "transportAssignment",
            entityId: assignmentId.toString(),
            after: {
                studentId: args.studentId,
                routeId: args.routeId,
                stopIndex: args.stopIndex,
            },
        });
        return assignmentId;
    },
});

export const removeStudentAssignment = mutation({
    args: { assignmentId: v.id("transportAssignments") },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "transport");
        requirePermission(tenant, "transport:write");

        const assignment = await ctx.db.get(args.assignmentId);
        if (!assignment || assignment.tenantId !== tenant.tenantId) throw new Error("Assignment not found");

        await ctx.db.delete(args.assignmentId);
        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "transport.assignment_removed",
            entityType: "transportAssignment",
            entityId: args.assignmentId.toString(),
            before: assignment,
        });
        return { success: true };
    },
});
