import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
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

// Update own profile (name, phone, bio, location)
export const updateUserProfile = mutation({
    args: {
        sessionToken: v.string(),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        phone: v.optional(v.string()),
        bio: v.optional(v.string()),
        location: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { sessionToken, ...fields } = args;
        const tenantCtx = await requirePlatformSession(ctx, { sessionToken });

        const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("eduMylesUserId"), tenantCtx.userId))
            .first();

        if (!user) throw new ConvexError("User not found");

        // Remove undefined values before patching
        const patch: Record<string, string> = {};
        if (fields.firstName !== undefined) patch.firstName = fields.firstName;
        if (fields.lastName !== undefined) patch.lastName = fields.lastName;
        if (fields.phone !== undefined) patch.phone = fields.phone;
        if (fields.bio !== undefined) patch.bio = fields.bio;
        if (fields.location !== undefined) patch.location = fields.location;

        await ctx.db.patch(user._id, patch);

        await logAction(ctx, {
            tenantId: tenantCtx.tenantId,
            actorId: tenantCtx.userId,
            actorEmail: tenantCtx.email,
            action: "profile.updated",
            entityType: "user",
            entityId: tenantCtx.userId,
            after: patch,
        });

        return { ok: true };
    },
});

// Step 1: Generate a one-time Convex storage upload URL for avatar
export const generateAvatarUploadUrl = mutation({
    args: { sessionToken: v.string() },
    handler: async (ctx, args) => {
        await requirePlatformSession(ctx, args);
        return await ctx.storage.generateUploadUrl();
    },
});

// Step 2: Persist the uploaded avatar storageId to the user record
export const saveUserAvatar = mutation({
    args: {
        sessionToken: v.string(),
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const tenantCtx = await requirePlatformSession(ctx, args);

        const url = await ctx.storage.getUrl(args.storageId);
        if (!url) throw new ConvexError("Failed to retrieve upload URL");

        const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("eduMylesUserId"), tenantCtx.userId))
            .first();

        if (!user) throw new ConvexError("User not found");

        await ctx.db.patch(user._id, { avatarUrl: url });

        await logAction(ctx, {
            tenantId: tenantCtx.tenantId,
            actorId: tenantCtx.userId,
            actorEmail: tenantCtx.email,
            action: "profile.avatar_updated",
            entityType: "user",
            entityId: tenantCtx.userId,
            after: { avatarUrl: url },
        });

        return { url };
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
