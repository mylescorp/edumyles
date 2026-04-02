import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { requirePlatformSession } from "./helpers/platformGuard";
import { requireTenantContext, requireTenantSession } from "./helpers/tenantGuard";
import { requirePermission } from "./helpers/authorize";
import { logAction } from "./helpers/auditLog";

function isTrustedServerCall(serverSecret?: string) {
  return Boolean(
    serverSecret &&
      process.env.CONVEX_WEBHOOK_SECRET &&
      serverSecret === process.env.CONVEX_WEBHOOK_SECRET
  );
}

// Upsert user after WorkOS authentication
export const upsertUser = mutation({
  args: {
    tenantId: v.string(),
    eduMylesUserId: v.string(),
    workosUserId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.string(),
    permissions: v.array(v.string()),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    // ── 1. Try to find an existing record by real WorkOS ID ──────────────────
    const existing = await ctx.db
      .query("users")
      .withIndex("by_workos_user", (q) => q.eq("workosUserId", args.workosUserId))
      .first();

    if (existing) {
      if (existing.tenantId !== args.tenantId) {
        throw new Error("Tenant mismatch — access denied");
      }
      await ctx.db.patch(existing._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        role: args.role,
        permissions: args.permissions,
      });
      return existing._id;
    }

    // ── 2. Check for a pending invite record with the same email ─────────────
    // When an admin is invited via createPlatformAdmin / inviteTenantUser the
    // record is written with workosUserId = "pending-<eduMylesUserId>".  On
    // first sign-in through WorkOS we arrive here with the real WorkOS user ID
    // but the pending record has not been linked yet — so we find it by email
    // and upgrade it in-place instead of creating a duplicate.
    const pendingByEmail = await ctx.db
      .query("users")
      .withIndex("by_tenant_email", (q) => q.eq("tenantId", args.tenantId).eq("email", args.email))
      .first();

    if (pendingByEmail && pendingByEmail.workosUserId.startsWith("pending-")) {
      await ctx.db.patch(pendingByEmail._id, {
        workosUserId: args.workosUserId,
        firstName: args.firstName ?? pendingByEmail.firstName,
        lastName: args.lastName ?? pendingByEmail.lastName,
        permissions: args.permissions,
        isActive: true,
      });
      return pendingByEmail._id;
    }

    // ── 3. Brand-new user — create a fresh record ────────────────────────────
    return await ctx.db.insert("users", {
      tenantId: args.tenantId,
      eduMylesUserId: args.eduMylesUserId,
      workosUserId: args.workosUserId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role,
      permissions: args.permissions,
      organizationId: args.organizationId,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

// Get user by WorkOS ID — always scoped to tenantId
export const getUserByWorkosId = query({
  args: {
    tenantId: v.string(),
    workosUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_user", (q) => q.eq("workosUserId", args.workosUserId))
      .first();

    if (!user || user.tenantId !== args.tenantId) return null;
    return user;
  },
});

// Check whether any master_admin exists in the system — used during first sign-in auto-bootstrap
export const hasMasterAdmin = query({
  args: {
    sessionToken: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isTrustedServerCall(args.serverSecret)) {
      await requirePlatformSession(ctx, { sessionToken: args.sessionToken ?? "" });
    }
    const admin = await ctx.db
      .query("users")
      .withIndex("by_tenant_role", (q) => q.eq("tenantId", "PLATFORM").eq("role", "master_admin"))
      .first();
    return admin !== null;
  },
});

// Get user by WorkOS ID across all tenants — used during auth callback
export const getUserByWorkosIdGlobal = query({
  args: {
    workosUserId: v.string(),
    sessionToken: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isTrustedServerCall(args.serverSecret)) {
      await requirePlatformSession(ctx, { sessionToken: args.sessionToken ?? "" });
    }
    return await ctx.db
      .query("users")
      .withIndex("by_workos_user", (q) => q.eq("workosUserId", args.workosUserId))
      .first();
  },
});

// Force-set a user's role to master_admin by WorkOS ID.
// Called from the auth callback when MASTER_ADMIN_EMAIL matches — ensures the
// stored Convex record is always in sync with the env-configured override.
export const syncMasterAdminRole = mutation({
  args: {
    workosUserId: v.string(),
    email: v.string(),
    sessionToken: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isTrustedServerCall(args.serverSecret)) {
      await requirePlatformSession(ctx, { sessionToken: args.sessionToken ?? "" });
    }
    const existing = await ctx.db
      .query("users")
      .withIndex("by_workos_user", (q) => q.eq("workosUserId", args.workosUserId))
      .first();

    if (existing) {
      if (existing.role !== "master_admin" || existing.tenantId !== "PLATFORM") {
        await ctx.db.patch(existing._id, { role: "master_admin", tenantId: "PLATFORM" });
      }
    } else {
      await ctx.db.insert("users", {
        tenantId: "PLATFORM",
        eduMylesUserId: `USR-PLATFORM-${args.workosUserId}`,
        workosUserId: args.workosUserId,
        email: args.email,
        role: "master_admin",
        permissions: ["*"],
        organizationId: "PLATFORM" as any,
        isActive: true,
        createdAt: Date.now(),
      });
    }
    return { success: true };
  },
});

// Emergency repair: promote every user/session for the given email to master_admin.
// Used to recover access when an account was created with a tenant role first.
export const promoteUserEmailToMasterAdmin = mutation({
  args: {
    email: v.string(),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requirePlatformSession(ctx, args);
    let platformOrg = await ctx.db
      .query("organizations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", "PLATFORM"))
      .first();

    if (!platformOrg) {
      const platformOrgId = await ctx.db.insert("organizations", {
        tenantId: "PLATFORM",
        workosOrgId: "platform-default",
        name: "EduMyles Platform",
        subdomain: "platform",
        tier: "enterprise",
        isActive: true,
        createdAt: Date.now(),
      });
      platformOrg = await ctx.db.get(platformOrgId);
    }

    if (!platformOrg) {
      throw new Error("PLATFORM_ORGANIZATION_NOT_AVAILABLE");
    }

    const normalizedEmail = args.email.toLowerCase();
    const users = await ctx.db.query("users").collect();
    const matchingUsers = users.filter((user) => user.email.toLowerCase() === normalizedEmail);

    const updatedUserIds: string[] = [];
    for (const user of matchingUsers) {
      await ctx.db.patch(user._id, {
        tenantId: "PLATFORM",
        role: "master_admin",
        organizationId: platformOrg._id,
        permissions: user.permissions.includes("*") ? user.permissions : ["*", ...user.permissions],
        isActive: true,
      });
      updatedUserIds.push(user._id);
    }

    const sessions = await ctx.db.query("sessions").collect();
    let updatedSessions = 0;
    for (const session of sessions) {
      if (session.email?.toLowerCase() !== normalizedEmail) continue;
      await ctx.db.patch(session._id, {
        tenantId: "PLATFORM",
        role: "master_admin",
      });
      updatedSessions += 1;
    }

    return {
      success: true,
      updatedUsers: updatedUserIds.length,
      updatedSessions,
    };
  },
});

// Atomically promote the signed-in user to master_admin if none exists yet.
// Updates both the session record and the users record so the role persists across sign-ins.
export const bootstrapMasterAdmin = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await requireTenantSession(ctx, args);

    // Check if any master_admin already exists
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_tenant_role", (q) => q.eq("tenantId", "PLATFORM").eq("role", "master_admin"))
      .first();

    if (existingAdmin) {
      throw new Error("ALREADY_EXISTS");
    }

    // Update session role
    const sessionDoc = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!sessionDoc) {
      throw new Error("UNAUTHENTICATED");
    }

    await ctx.db.patch(sessionDoc._id, { role: "master_admin", tenantId: "PLATFORM" });

    // Upsert user record so next sign-in preserves the role
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_workos_user", (q) => q.eq("workosUserId", session.userId))
      .first();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        role: "master_admin",
        tenantId: "PLATFORM",
      });
    } else {
      await ctx.db.insert("users", {
        tenantId: "PLATFORM",
        eduMylesUserId: `USR-PLATFORM-${session.userId}`,
        workosUserId: session.userId,
        email: session.email ?? "",
        role: "master_admin",
        permissions: ["*"],
        organizationId: "PLATFORM" as any,
        isActive: true,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Get current user by session token — used by useAuth hook
export const getCurrentUser = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_tenant_email", (q) =>
        q.eq("tenantId", session.tenantId).eq("email", session.email || "")
      )
      .first();

    if (!user) {
      return {
        _id: session.userId,
        tenantId: session.tenantId,
        email: session.email || "",
        role: session.role,
        firstName: undefined,
        lastName: undefined,
        avatarUrl: undefined,
        isActive: true,
      };
    }

    return {
      _id: user._id,
      tenantId: user.tenantId,
      eduMylesUserId: user.eduMylesUserId,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      isActive: user.isActive,
    };
  },
});

// List users within a tenant
export const listTenantUsers = query({
  args: {
    tenantId: v.string(),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.role) {
      return await ctx.db
        .query("users")
        .withIndex("by_tenant_role", (q) => q.eq("tenantId", args.tenantId).eq("role", args.role!))
        .collect();
    }

    return await ctx.db
      .query("users")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});

// List audit logs for a tenant
export const listUserAuditLogs = query({
  args: {
    tenantId: v.string(),
    action: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .order("desc")
      .collect();

    // Filter by action prefix if provided (e.g., "student" matches "student.created", "student.updated")
    if (args.action) {
      logs = logs.filter((l) => l.action.startsWith(args.action!));
    }

    // Limit to 200 most recent entries
    return logs.slice(0, 200);
  },
});

// Invite/create a tenant user with a pending WorkOS identity.
export const inviteTenantUser = mutation({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    requirePermission(tenant, "users:manage");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_tenant_email", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("email", args.email)
      )
      .first();

    if (existing) {
      throw new Error(`CONFLICT: User with email '${args.email}' already exists`);
    }

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .first();

    if (!org) {
      throw new Error("NOT_FOUND: Organization not found for tenant");
    }

    const eduMylesUserId = `USR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const id = await ctx.db.insert("users", {
      tenantId: tenant.tenantId,
      eduMylesUserId,
      workosUserId: `pending-${eduMylesUserId}`,
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
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "user.created",
      entityType: "user",
      entityId: eduMylesUserId,
      after: { email: args.email, role: args.role },
    });

    return { id, eduMylesUserId };
  },
});

// Step 1: Generate upload URL for tenant user avatar
export const generateAvatarUploadUrl = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requireTenantContext(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// Step 2: Save tenant user avatar URL
export const saveUserAvatar = mutation({
  args: {
    sessionToken: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new ConvexError("Failed to retrieve upload URL");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("eduMylesUserId"), tenant.userId))
      .first();

    if (!user) throw new ConvexError("User not found");
    await ctx.db.patch(user._id, { avatarUrl: url });
    return { url };
  },
});

// Called by WorkOS webhook when a user profile is updated
export const syncFromWorkOS = mutation({
  args: {
    eduMylesUserId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("eduMylesUserId"), args.eduMylesUserId))
      .first();
    if (!user) return null;
    await ctx.db.patch(user._id, {
      email: args.email || user.email,
      firstName: args.firstName || user.firstName,
      lastName: args.lastName || user.lastName,
    });
    return user._id;
  },
});

// Called by WorkOS webhook when a user is deleted
export const deactivateByWorkOSId = mutation({
  args: { eduMylesUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("eduMylesUserId"), args.eduMylesUserId))
      .first();
    if (!user) return null;
    await ctx.db.patch(user._id, { isActive: false });
    return user._id;
  },
});
