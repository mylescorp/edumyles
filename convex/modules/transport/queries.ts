import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";

export const listRoutes = query({
    args: {},
    handler: async (ctx) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "transport");
        requirePermission(tenant, "transport:read");

        return await ctx.db
            .query("transportRoutes")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
            .collect();
    },
});

export const listVehicles = query({
    args: { status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
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
    },
});

export const listDrivers = query({
    args: { status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
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
    },
});

export const getStudentAssignment = query({
    args: { studentId: v.string() },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "transport");
        requirePermission(tenant, "transport:read");

        return await ctx.db
            .query("transportAssignments")
            .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
            .filter((f) => f.eq(f.field("tenantId"), tenant.tenantId))
            .first();
    },
});

export const listRouteAssignments = query({
    args: { routeId: v.string() },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "transport");
        requirePermission(tenant, "transport:read");

        return await ctx.db
            .query("transportAssignments")
            .withIndex("by_route", (q) => q.eq("routeId", args.routeId))
            .filter((f) => f.eq(f.field("tenantId"), tenant.tenantId))
            .collect();
    },
});
