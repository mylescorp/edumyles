import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantContext, requireTenantSession } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";

export const listRoutes = query({
    args: { sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "transport");
            requirePermission(tenant, "transport:read");

            return await ctx.db
                .query("transportRoutes")
                .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                .collect();
        } catch (error) {
            console.error("listRoutes failed", error);
            return [];
        }
    },
});

export const listVehicles = query({
    args: { status: v.optional(v.string()), sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "transport");
            requirePermission(tenant, "transport:read");

            if (args.status) {
                return await ctx.db
                    .query("vehicles")
                    .withIndex("by_tenant_status", (q) =>
                        q.eq("tenantId", tenant.tenantId).eq("status", args.status!)
                    )
                    .collect();
            }
            return await ctx.db
                .query("vehicles")
                .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                .collect();
        } catch (error) {
            console.error("listVehicles failed", error);
            return [];
        }
    },
});

export const listDrivers = query({
    args: { status: v.optional(v.string()), sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "transport");
            requirePermission(tenant, "transport:read");

            if (args.status) {
                return await ctx.db
                    .query("drivers")
                    .withIndex("by_tenant_status", (q) =>
                        q.eq("tenantId", tenant.tenantId).eq("status", args.status!)
                    )
                    .collect();
            }
            return await ctx.db
                .query("drivers")
                .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                .collect();
        } catch (error) {
            console.error("listDrivers failed", error);
            return [];
        }
    },
});

export const getStudentAssignment = query({
    args: { studentId: v.string(), sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "transport");
            requirePermission(tenant, "transport:read");

            return await ctx.db
                .query("transportAssignments")
                .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
                .filter((f) => f.eq(f.field("tenantId"), tenant.tenantId))
                .first();
        } catch (error) {
            console.error("getStudentAssignment failed", error);
            return null;
        }
    },
});

export const listRouteAssignments = query({
    args: { routeId: v.string(), sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "transport");
            requirePermission(tenant, "transport:read");

            return await ctx.db
                .query("transportAssignments")
                .withIndex("by_route", (q) => q.eq("routeId", args.routeId))
                .filter((f) => f.eq(f.field("tenantId"), tenant.tenantId))
                .collect();
        } catch (error) {
            console.error("listRouteAssignments failed", error);
            return [];
        }
    },
});

export const getVehicleLocations = query({
    args: { sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "transport");
            requirePermission(tenant, "transport:read");

            const vehicles = await ctx.db
                .query("vehicles")
                .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
                .collect();

            return vehicles
                .filter((v: any) => v.lastLatitude !== undefined && v.lastLongitude !== undefined)
                .map((v: any) => ({
                    _id: v._id,
                    plateNumber: v.plateNumber,
                    status: v.status,
                    routeId: v.routeId,
                    lastLatitude: v.lastLatitude,
                    lastLongitude: v.lastLongitude,
                    lastSpeed: v.lastSpeed,
                    lastHeading: v.lastHeading,
                    lastLocationAt: v.lastLocationAt,
                }));
        } catch {
            return [];
        }
    },
});
