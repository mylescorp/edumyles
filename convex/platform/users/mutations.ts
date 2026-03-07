import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

// Create a new platform admin
export const createPlatformAdmin = mutation({
    args: {
        sessionToken: v.string(),
        email: v.string(),
        firstName: v.string(),
        lastName: v.string(),
        role: v.union(v.literal("master_admin"), v.literal("super_admin")),
    },
    handler: async (ctx, args) => {
        const tenantCtx = await requirePlatformSession(ctx, args);

        // Check for existing user with same email
        const existing = await ctx.db
            .query("users")
            .withIndex("by_tenant_email", (q) =>
                q.eq("tenantId", tenantCtx.tenantId).eq("email", args.email)
            )
            .first();

        if (existing) {
            throw new Error(`CONFLICT: User with email '${args.email}' already exists`);
        }

        // Get the organization for this tenant
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantCtx.tenantId))
            .first();

        if (!org) {
            throw new Error("NOT_FOUND: Organization not found for tenant");
        }

        const userId = `USR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const id = await ctx.db.insert("users", {
            tenantId: tenantCtx.tenantId,
            eduMylesUserId: userId,
            workosUserId: `pending-${userId}`,
            email: args.email,
            firstName: args.firstName,
            lastName: args.lastName,
            role: args.role,
            permissions: [],
            organizationId: org._id,
            isActive: true,
            createdAt: Date.now(),
        });

        await logAction(ctx, {
            tenantId: tenantCtx.tenantId,
            actorId: tenantCtx.userId,
            actorEmail: tenantCtx.email,
            action: "user.created",
            entityType: "user",
            entityId: userId,
            after: { email: args.email, role: args.role },
        });

        return { id, userId };
    },
});

// Update platform admin role
export const updatePlatformAdminRole = mutation({
    args: {
        sessionToken: v.string(),
        userId: v.id("users"),
        role: v.union(v.literal("master_admin"), v.literal("super_admin")),
    },
    handler: async (ctx, args) => {
        const tenantCtx = await requirePlatformSession(ctx, args);

        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("NOT_FOUND: User not found");

        if (user.role !== "master_admin" && user.role !== "super_admin") {
            throw new Error("FORBIDDEN: Can only update platform admin roles");
        }

        await ctx.db.patch(args.userId, { role: args.role });

        await logAction(ctx, {
            tenantId: tenantCtx.tenantId,
            actorId: tenantCtx.userId,
            actorEmail: tenantCtx.email,
            action: "user.updated",
            entityType: "user",
            entityId: user.eduMylesUserId,
            before: { role: user.role },
            after: { role: args.role },
        });
    },
});

// Deactivate platform admin
export const deactivatePlatformAdmin = mutation({
    args: {
        sessionToken: v.string(),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const tenantCtx = await requirePlatformSession(ctx, args);

        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("NOT_FOUND: User not found");

        if (user.eduMylesUserId === tenantCtx.userId) {
            throw new Error("FORBIDDEN: Cannot deactivate your own account");
        }

        await ctx.db.patch(args.userId, { isActive: false });

        await logAction(ctx, {
            tenantId: tenantCtx.tenantId,
            actorId: tenantCtx.userId,
            actorEmail: tenantCtx.email,
            action: "user.deleted",
            entityType: "user",
            entityId: user.eduMylesUserId,
            after: { status: "deactivated" },
        });
    },
});
