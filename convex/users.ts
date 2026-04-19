import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { requirePlatformSession } from "./helpers/platformGuard";
import { requireTenantContext, requireTenantSession } from "./helpers/tenantGuard";
import { getPermissions, requirePermission } from "./helpers/authorize";
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

      const matchingInvite = (
        await ctx.db
          .query("tenant_invites")
          .withIndex("by_tenant_status", (q) => q.eq("tenantId", args.tenantId).eq("status", "pending"))
          .collect()
      ).find((invite) => invite.email.trim().toLowerCase() === args.email.trim().toLowerCase());

      if (matchingInvite) {
        await ctx.db.patch(matchingInvite._id, {
          status: "accepted",
          acceptedAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      const onboarding = await ctx.db
        .query("tenant_onboarding")
        .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
        .first();

      if (onboarding) {
        const shouldCountAsStaff = pendingByEmail.role !== "school_admin";
        const existingStaffAdded = onboarding.steps.staffAdded ?? {
          completed: false,
          completedAt: undefined,
          count: 0,
          pointsAwarded: 0,
        };
        await ctx.db.patch(onboarding._id, {
          steps: {
            ...onboarding.steps,
            staffAdded: {
              ...existingStaffAdded,
              completed: shouldCountAsStaff || existingStaffAdded.completed,
              completedAt: shouldCountAsStaff ? Date.now() : existingStaffAdded.completedAt,
              count: shouldCountAsStaff
                ? Math.max(existingStaffAdded.count ?? 0, 1)
                : existingStaffAdded.count,
            },
          },
          lastActivityAt: Date.now(),
          healthScore: Math.min(100, Math.max(onboarding.healthScore, 15)),
          updatedAt: Date.now(),
        });
      }

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
  args: {
    sessionToken: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let session: {
      tenantId: string;
      userId: string;
      role: string;
      email: string;
    } | null = null;

    if (isTrustedServerCall(args.serverSecret)) {
      if (!args.sessionToken) {
        throw new ConvexError({
          code: "UNAUTHENTICATED",
          message: "A session token is required to bootstrap the master admin",
        });
      }

      const sessionDoc = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
        .first();

      if (!sessionDoc || sessionDoc.expiresAt < Date.now()) {
        throw new ConvexError({
          code: "UNAUTHENTICATED",
          message: "Session is invalid or expired",
        });
      }

      session = {
        tenantId: sessionDoc.tenantId,
        userId: sessionDoc.userId,
        role: sessionDoc.role,
        email: sessionDoc.email ?? "",
      };
    } else {
      session = await requirePlatformSession(ctx, {
        sessionToken: args.sessionToken ?? "",
      });
    }

    // Check if any master_admin already exists
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_tenant_role", (q) => q.eq("tenantId", "PLATFORM").eq("role", "master_admin"))
      .first();

    if (existingAdmin) {
      throw new ConvexError({
        code: "ALREADY_EXISTS",
        message: "A master admin already exists",
      });
    }

    // Update session role
    const sessionDoc = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken ?? ""))
      .first();

    if (!sessionDoc) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Session is invalid or expired",
      });
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

export const getRoleDefinitions = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    requirePermission(tenant, "settings:read");

    const roleDefinitions = [
      "school_admin",
      "principal",
      "bursar",
      "hr_manager",
      "librarian",
      "transport_manager",
      "teacher",
      "parent",
      "student",
      "alumni",
      "partner",
    ] as const;

    return roleDefinitions.map((role, index) => ({
      role,
      level: Math.max(10, 100 - index * 10),
      permissions: getPermissions(role as any),
    }));
  },
});

// List users within a tenant
export const listTenantUsers = query({
  args: {
    sessionToken: v.optional(v.string()),
    tenantId: v.optional(v.string()),
    role: v.optional(v.string()),
    search: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    requirePermission(tenant, "users:manage");

    const normalizedSearch = args.search?.trim().toLowerCase();
    if (args.role) {
      const users = await ctx.db
        .query("users")
        .withIndex("by_tenant_role", (q) =>
          q.eq("tenantId", tenant.tenantId).eq("role", args.role!)
        )
        .collect();
      return users.filter((user) => {
        if (args.isActive !== undefined && user.isActive !== args.isActive) {
          return false;
        }
        if (!normalizedSearch) return true;
        const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim().toLowerCase();
        return (
          user.email.toLowerCase().includes(normalizedSearch) ||
          name.includes(normalizedSearch) ||
          user.role.toLowerCase().includes(normalizedSearch)
        );
      });
    }

    const users = await ctx.db
      .query("users")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();
    return users.filter((user) => {
      if (args.isActive !== undefined && user.isActive !== args.isActive) {
        return false;
      }
      if (!normalizedSearch) return true;
      const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim().toLowerCase();
      return (
        user.email.toLowerCase().includes(normalizedSearch) ||
        name.includes(normalizedSearch) ||
        user.role.toLowerCase().includes(normalizedSearch)
      );
    });
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
    sessionToken: v.optional(v.string()),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
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
      isActive: false,
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

    return {
      id,
      eduMylesUserId,
      tenantId: tenant.tenantId,
      organizationId: org._id,
      workosOrgId: org.workosOrgId,
      email: args.email,
      role: args.role,
    };
  },
});

export const getPendingUserInvitationByEmail = query({
  args: {
    email: v.string(),
    sessionToken: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isTrustedServerCall(args.serverSecret)) {
      await requirePlatformSession(ctx, { sessionToken: args.sessionToken ?? "" });
    }

    const normalizedEmail = args.email.trim().toLowerCase();
    const users = await ctx.db.query("users").collect();
    const pending = users
      .filter(
        (user) =>
          user.email.trim().toLowerCase() === normalizedEmail &&
          user.workosUserId.startsWith("pending-")
      )
      .sort((a, b) => b.createdAt - a.createdAt)[0];

    if (!pending) {
      return null;
    }

    return {
      _id: pending._id,
      tenantId: pending.tenantId,
      eduMylesUserId: pending.eduMylesUserId,
      organizationId: pending.organizationId,
      email: pending.email,
      firstName: pending.firstName,
      lastName: pending.lastName,
      role: pending.role,
      permissions: pending.permissions,
      isActive: pending.isActive,
      createdAt: pending.createdAt,
    };
  },
});

export const updateTenantUser = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken });
    requirePermission(tenant, "users:manage");

    const existing = await ctx.db.get(args.userId);
    if (!existing || existing.tenantId !== tenant.tenantId) {
      throw new Error("User not found");
    }

    if (existing.eduMylesUserId === tenant.userId && args.isActive === false) {
      throw new Error("You cannot deactivate your own account.");
    }

    const updates: Record<string, unknown> = {};
    if (args.firstName !== undefined) updates.firstName = args.firstName;
    if (args.lastName !== undefined) updates.lastName = args.lastName;
    if (args.role !== undefined) updates.role = args.role;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.userId, updates);

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "user.updated",
      entityType: "user",
      entityId: existing.eduMylesUserId,
      before: existing,
      after: updates,
    });

    return { success: true };
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
    const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken });
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new ConvexError("Failed to retrieve upload URL");

    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("eduMylesUserId", tenant.userId))
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
      .withIndex("by_user_id", (q) => q.eq("eduMylesUserId", args.eduMylesUserId))
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
      .withIndex("by_user_id", (q) => q.eq("eduMylesUserId", args.eduMylesUserId))
      .first();
    if (!user) return null;
    await ctx.db.patch(user._id, { isActive: false });
    return user._id;
  },
});
