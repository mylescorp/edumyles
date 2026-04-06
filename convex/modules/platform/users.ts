import { query, mutation, internalMutation } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";
import { idGenerator } from "../../helpers/idGenerator";

function isTrustedServerCall(serverSecret?: string) {
  return Boolean(
    serverSecret &&
      process.env.CONVEX_WEBHOOK_SECRET &&
      serverSecret === process.env.CONVEX_WEBHOOK_SECRET
  );
}

function ensureMasterAdmin(role: string) {
  if (role !== "master_admin") {
    throw new Error("FORBIDDEN: master_admin access required");
  }
}

function ensurePlatformAdmin(role: string) {
  if (!["master_admin", "super_admin"].includes(role)) {
    throw new Error("FORBIDDEN: platform admin access required");
  }
}

async function getPlatformUserByIdOrThrow(ctx: any, platformUserId: any) {
  const user = await ctx.db.get(platformUserId);
  if (!user) {
    throw new Error("Platform user not found");
  }
  return user;
}

async function countActiveMasterAdmins(ctx: any) {
  const users = await ctx.db
    .query("platform_users")
    .withIndex("by_role", (q: any) => q.eq("role", "master_admin"))
    .collect();

  return users.filter((user: any) => user.status === "active").length;
}

async function enrichPlatformUser(ctx: any, doc: any) {
  const [session, profileByWorkos, profileByEduMylesId] = await Promise.all([
    ctx.db
      .query("sessions")
      .withIndex("by_userId", (q: any) => q.eq("userId", doc.userId))
      .first(),
    ctx.db
      .query("users")
      .withIndex("by_workos_user", (q: any) => q.eq("workosUserId", doc.userId))
      .first(),
    ctx.db
      .query("users")
      .withIndex("by_user_id", (q: any) => q.eq("eduMylesUserId", doc.userId))
      .first(),
  ]);

  const profile = profileByWorkos ?? profileByEduMylesId;

  return {
    ...doc,
    id: String(doc._id),
    email: profile?.email ?? session?.email ?? doc.userId,
    firstName: profile?.firstName,
    lastName: profile?.lastName,
  };
}

const PLATFORM_INVITE_EXPIRY_MS = 72 * 60 * 60 * 1000;

export const getplatformUsers = query({
  args: {
    sessionToken: v.string(),
    role: v.optional(v.string()),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    let users = await ctx.db.query("platform_users").collect();

    if (args.role) {
      users = users.filter((user) => user.role === args.role);
    }
    if (args.status) {
      users = users.filter((user) => user.status === args.status);
    }
    if (args.search) {
      const search = args.search.toLowerCase();
      users = users.filter((user) =>
        [user.userId, user.department ?? ""].some((value) =>
          value.toLowerCase().includes(search)
        )
      );
    }

    return await Promise.all(users.map((user) => enrichPlatformUser(ctx, user)));
  },
});

export const getPlatformUsers = getplatformUsers;

export const getPlatformAccessByWorkosIdentity = query({
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

    const now = Date.now();
    const normalizedEmail = args.email.trim().toLowerCase();

    const [platformUser, invites] = await Promise.all([
      ctx.db
        .query("platform_users")
        .withIndex("by_userId", (q) => q.eq("userId", args.workosUserId))
        .first(),
      ctx.db
        .query("platform_user_invites")
        .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
        .collect(),
    ]);

    const pendingInvite = invites
      .filter((invite) => invite.status === "pending" && invite.expiresAt >= now)
      .sort((a, b) => b.createdAt - a.createdAt)[0];

    return {
      platformUser: platformUser
        ? {
            id: String(platformUser._id),
            role: platformUser.role,
            status: platformUser.status,
            accessExpiresAt: platformUser.accessExpiresAt,
          }
        : null,
      pendingInvite: pendingInvite
        ? {
            id: String(pendingInvite._id),
            token: pendingInvite.token,
            role: pendingInvite.role,
            expiresAt: pendingInvite.expiresAt,
          }
        : null,
    };
  },
});

export const getPlatformUser = query({
  args: {
    sessionToken: v.string(),
    platformUserId: v.id("platform_users"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const user = await ctx.db.get(args.platformUserId);
    if (!user) {
      throw new Error("Platform user not found");
    }
    return await enrichPlatformUser(ctx, user);
  },
});

export const getPlatformInvites = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    let invites = await ctx.db.query("platform_user_invites").collect();
    if (args.status) {
      invites = invites.filter((invite) => invite.status === args.status);
    }

    const enriched = await Promise.all(
      invites.map(async (invite) => {
        const inviterSession = await ctx.db
          .query("sessions")
          .withIndex("by_userId", (q: any) => q.eq("userId", invite.invitedBy))
          .first();

        return {
          ...invite,
          id: String(invite._id),
          inviterEmail: inviterSession?.email ?? invite.invitedBy,
        };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const invitePlatformUser = mutation({
  args: {
    sessionToken: v.string(),
    email: v.string(),
    role: v.string(),
    department: v.optional(v.string()),
    addedPermissions: v.optional(v.array(v.string())),
    removedPermissions: v.optional(v.array(v.string())),
    accessExpiresAt: v.optional(v.number()),
    personalMessage: v.optional(v.string()),
    notifyInviter: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    ensurePlatformAdmin(platform.role);
    const now = Date.now();
    const token = idGenerator("platform_invite");

    const inviteId = await ctx.db.insert("platform_user_invites", {
      email: args.email,
      role: args.role,
      department: args.department,
      addedPermissions: args.addedPermissions,
      removedPermissions: args.removedPermissions,
      accessExpiresAt: args.accessExpiresAt,
      invitedBy: platform.userId,
      token,
      status: "pending",
      expiresAt: now + PLATFORM_INVITE_EXPIRY_MS,
      acceptedAt: undefined,
      notifyInviter: args.notifyInviter,
      personalMessage: args.personalMessage,
      createdAt: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "user.invited",
      entityType: "platform_user_invite",
      entityId: String(inviteId),
      after: { email: args.email, role: args.role },
    });

    return { success: true, inviteId, token };
  },
});

export const acceptPlatformInvite = mutation({
  args: {
    token: v.string(),
    userId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const invite = await ctx.db
      .query("platform_user_invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite) {
      throw new Error("Invite not found");
    }
    if (invite.status !== "pending") {
      throw new Error("Invite is no longer valid");
    }
    if (invite.expiresAt < now) {
      await ctx.db.patch(invite._id, { status: "expired", updatedAt: now });
      throw new Error("Invite expired");
    }

    const existing = await ctx.db
      .query("platform_users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    let platformUserId = existing?._id;
    if (existing) {
      await ctx.db.patch(existing._id, {
        role: invite.role as any,
        department: invite.department,
        addedPermissions: invite.addedPermissions,
        removedPermissions: invite.removedPermissions,
        status: "active",
        accessExpiresAt: invite.accessExpiresAt,
        acceptedAt: now,
        updatedAt: now,
      });
    } else {
      platformUserId = await ctx.db.insert("platform_users", {
        userId: args.userId,
        role: invite.role as any,
        department: invite.department,
        addedPermissions: invite.addedPermissions,
        removedPermissions: invite.removedPermissions,
        status: "active",
        accessExpiresAt: invite.accessExpiresAt,
        invitedBy: invite.invitedBy,
        acceptedAt: now,
        lastLogin: undefined,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(invite._id, {
      status: "accepted",
      acceptedAt: now,
      updatedAt: now,
    });

    const inviterSession = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", invite.invitedBy))
      .first();

    if (inviterSession?.email) {
      await ctx.scheduler.runAfter(0, internal.actions.communications.email.sendEmailInternal, {
        tenantId: "PLATFORM",
        actorId: args.userId,
        actorEmail: args.email,
        to: [inviterSession.email],
        subject: "Platform invite accepted",
        text: `${args.email} accepted the EduMyles platform invite.`,
      });
    }

    return { success: true, platformUserId };
  },
});

export const updatePlatformUserRole = mutation({
  args: {
    sessionToken: v.string(),
    platformUserId: v.id("platform_users"),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    ensurePlatformAdmin(platform.role);
    ensureMasterAdmin(platform.role);

    const existing = await getPlatformUserByIdOrThrow(ctx, args.platformUserId);

    if (
      existing.userId === platform.userId &&
      existing.role === "master_admin" &&
      args.role !== "master_admin"
    ) {
      const masterAdminCount = await countActiveMasterAdmins(ctx);
      if (masterAdminCount <= 1) {
        throw new Error("Cannot demote the last master admin");
      }
    }

    await ctx.db.patch(args.platformUserId, {
      role: args.role as any,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "user.updated",
      entityType: "platform_user",
      entityId: String(args.platformUserId),
      before: { role: existing.role },
      after: { role: args.role },
    });

    return { success: true };
  },
});

export const updatePlatformUserPermissions = mutation({
  args: {
    sessionToken: v.string(),
    platformUserId: v.id("platform_users"),
    addedPermissions: v.optional(v.array(v.string())),
    removedPermissions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    ensureMasterAdmin(platform.role);

    const existing = await getPlatformUserByIdOrThrow(ctx, args.platformUserId);

    await ctx.db.patch(args.platformUserId, {
      addedPermissions: args.addedPermissions,
      removedPermissions: args.removedPermissions,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "user.updated",
      entityType: "platform_user",
      entityId: String(args.platformUserId),
      before: {
        addedPermissions: existing.addedPermissions,
        removedPermissions: existing.removedPermissions,
      },
      after: {
        addedPermissions: args.addedPermissions,
        removedPermissions: args.removedPermissions,
      },
    });

    return { success: true };
  },
});

export const suspendPlatformUser = mutation({
  args: {
    sessionToken: v.string(),
    platformUserId: v.id("platform_users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    ensurePlatformAdmin(platform.role);
    const existing = await getPlatformUserByIdOrThrow(ctx, args.platformUserId);

    if (existing.userId === platform.userId) {
      throw new Error("You cannot suspend your own platform account");
    }

    if (existing.role === "master_admin") {
      const masterAdminCount = await countActiveMasterAdmins(ctx);
      if (masterAdminCount <= 1) {
        throw new Error("Cannot suspend the last master admin");
      }
    }

    await ctx.db.patch(args.platformUserId, {
      status: "suspended",
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "user.updated",
      entityType: "platform_user",
      entityId: String(args.platformUserId),
      before: { status: existing.status },
      after: { status: "suspended", reason: args.reason ?? null },
    });
    return { success: true };
  },
});

export const syncPlatformUserProfile = mutation({
  args: {
    workosUserId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.string(),
    lastLoginAt: v.optional(v.number()),
    sessionToken: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isTrustedServerCall(args.serverSecret)) {
      await requirePlatformSession(ctx, { sessionToken: args.sessionToken ?? "" });
    }

    const now = Date.now();
    const normalizedEmail = args.email.trim().toLowerCase();

    const [existingUser, existingByEmail, platformUser] = await Promise.all([
      ctx.db
        .query("users")
        .withIndex("by_workos_user", (q: any) => q.eq("workosUserId", args.workosUserId))
        .first(),
      ctx.db
        .query("users")
        .withIndex("by_tenant_email", (q: any) => q.eq("tenantId", "PLATFORM").eq("email", normalizedEmail))
        .first(),
      ctx.db
        .query("platform_users")
        .withIndex("by_userId", (q: any) => q.eq("userId", args.workosUserId))
        .first(),
    ]);

    if (platformUser) {
      await ctx.db.patch(platformUser._id, {
        lastLogin: args.lastLoginAt ?? now,
        updatedAt: now,
      });
    }

    const target = existingUser ?? existingByEmail;
    const profilePatch = {
      tenantId: "PLATFORM",
      eduMylesUserId: target?.eduMylesUserId ?? `USR-PLATFORM-${args.workosUserId}`,
      workosUserId: args.workosUserId,
      email: normalizedEmail,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role,
      permissions: target?.permissions ?? [],
      isActive: true,
      createdAt: target?.createdAt ?? now,
    };

    if (target) {
      await ctx.db.patch(target._id, {
        tenantId: "PLATFORM",
        workosUserId: args.workosUserId,
        email: normalizedEmail,
        firstName: args.firstName,
        lastName: args.lastName,
        role: args.role,
        isActive: true,
      });
      return { success: true, userId: target._id };
    }

    const createdId = await ctx.db.insert("users", profilePatch);
    return { success: true, userId: createdId };
  },
});

export const activatePlatformUser = mutation({
  args: {
    sessionToken: v.string(),
    platformUserId: v.id("platform_users"),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    ensurePlatformAdmin(platform.role);
    const existing = await getPlatformUserByIdOrThrow(ctx, args.platformUserId);

    await ctx.db.patch(args.platformUserId, {
      status: "active",
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "user.updated",
      entityType: "platform_user",
      entityId: String(args.platformUserId),
      before: { status: existing.status },
      after: { status: "active" },
    });

    return { success: true };
  },
});

export const deletePlatformUser = mutation({
  args: {
    sessionToken: v.string(),
    platformUserId: v.id("platform_users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    ensureMasterAdmin(platform.role);
    const existing = await getPlatformUserByIdOrThrow(ctx, args.platformUserId);

    if (existing.userId === platform.userId) {
      throw new Error("You cannot delete your own platform account");
    }

    if (existing.role === "master_admin") {
      const masterAdminCount = await countActiveMasterAdmins(ctx);
      if (masterAdminCount <= 1) {
        throw new Error("Cannot delete the last master admin");
      }
    }

    await ctx.db.delete(args.platformUserId);

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "user.deleted",
      entityType: "platform_user",
      entityId: String(args.platformUserId),
      before: {
        userId: existing.userId,
        role: existing.role,
        status: existing.status,
        reason: args.reason ?? null,
      },
    });
    return { success: true };
  },
});

export const revokePlatformInvite = mutation({
  args: {
    sessionToken: v.string(),
    inviteId: v.id("platform_user_invites"),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    ensurePlatformAdmin(platform.role);
    const existing = await ctx.db.get(args.inviteId);
    if (!existing) {
      throw new Error("Invite not found");
    }
    await ctx.db.patch(args.inviteId, {
      status: "revoked",
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "user.updated",
      entityType: "platform_user_invite",
      entityId: String(args.inviteId),
      before: { status: existing.status, email: existing.email, role: existing.role },
      after: { status: "revoked" },
    });
    return { success: true };
  },
});

export const updatePlatformUser = mutation({
  args: {
    sessionToken: v.string(),
    platformUserId: v.id("platform_users"),
    role: v.string(),
    department: v.optional(v.string()),
    accessExpiresAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    addedPermissions: v.optional(v.array(v.string())),
    removedPermissions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    ensureMasterAdmin(platform.role);

    const existing = await getPlatformUserByIdOrThrow(ctx, args.platformUserId);

    if (
      existing.userId === platform.userId &&
      existing.role === "master_admin" &&
      args.role !== "master_admin"
    ) {
      const masterAdminCount = await countActiveMasterAdmins(ctx);
      if (masterAdminCount <= 1) {
        throw new Error("Cannot demote the last master admin");
      }
    }

    const patch = {
      role: args.role as any,
      department: args.department,
      accessExpiresAt: args.accessExpiresAt,
      notes: args.notes,
      addedPermissions: args.addedPermissions ?? [],
      removedPermissions: args.removedPermissions ?? [],
      updatedAt: Date.now(),
    };

    await ctx.db.patch(args.platformUserId, patch);

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "user.updated",
      entityType: "platform_user",
      entityId: String(args.platformUserId),
      before: {
        role: existing.role,
        department: existing.department,
        accessExpiresAt: existing.accessExpiresAt,
        notes: existing.notes,
        addedPermissions: existing.addedPermissions,
        removedPermissions: existing.removedPermissions,
      },
      after: patch,
    });

    return { success: true };
  },
});

export const expireOldInvites = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const invites = await ctx.db
      .query("platform_user_invites")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    let expired = 0;
    for (const invite of invites) {
      if (invite.expiresAt > now) continue;

      await ctx.db.patch(invite._id, {
        status: "expired",
        updatedAt: now,
      });
      expired += 1;
    }

    return { expired };
  },
});

export const resendPlatformInvite = mutation({
  args: {
    sessionToken: v.string(),
    inviteId: v.id("platform_user_invites"),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    ensurePlatformAdmin(platform.role);
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw new Error("Invite not found");
    }

    const now = Date.now();
    const token = idGenerator("platform_invite");
    await ctx.db.patch(args.inviteId, {
      token,
      status: "pending",
      expiresAt: now + PLATFORM_INVITE_EXPIRY_MS,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.actions.communications.email.sendEmailInternal, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      to: [invite.email],
      subject: "EduMyles platform invite reminder",
      text: `Your updated EduMyles platform invite token is: ${token}`,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "user.updated",
      entityType: "platform_user_invite",
      entityId: String(args.inviteId),
      before: { token: invite.token, expiresAt: invite.expiresAt },
      after: { token, expiresAt: now + PLATFORM_INVITE_EXPIRY_MS },
    });

    return { success: true, token };
  },
});
