import { query, mutation } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";
import { idGenerator } from "../../helpers/idGenerator";

function ensureMasterAdmin(role: string) {
  if (role !== "master_admin") {
    throw new Error("FORBIDDEN: master_admin access required");
  }
}

async function enrichPlatformUser(ctx: any, doc: any) {
  const [session, profile] = await Promise.all([
    ctx.db
      .query("sessions")
      .withIndex("by_userId", (q: any) => q.eq("userId", doc.userId))
      .first(),
    ctx.db
      .query("users")
      .withIndex("by_user_id", (q: any) => q.eq("eduMylesUserId", doc.userId))
      .first(),
  ]);

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

    await ctx.scheduler.runAfter(0, internal.actions.communications.email.sendEmailInternal, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      to: [args.email],
      subject: "EduMyles platform access invite",
      text: `You have been invited to the EduMyles platform as ${args.role}. Use invite token: ${token}`,
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
    ensureMasterAdmin(platform.role);

    await ctx.db.patch(args.platformUserId, {
      role: args.role as any,
      updatedAt: Date.now(),
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

    await ctx.db.patch(args.platformUserId, {
      addedPermissions: args.addedPermissions,
      removedPermissions: args.removedPermissions,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const suspendPlatformUser = mutation({
  args: {
    sessionToken: v.string(),
    platformUserId: v.id("platform_users"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    await ctx.db.patch(args.platformUserId, {
      status: "suspended",
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const deletePlatformUser = mutation({
  args: {
    sessionToken: v.string(),
    platformUserId: v.id("platform_users"),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    ensureMasterAdmin(platform.role);
    await ctx.db.delete(args.platformUserId);
    return { success: true };
  },
});

export const revokePlatformInvite = mutation({
  args: {
    sessionToken: v.string(),
    inviteId: v.id("platform_user_invites"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    await ctx.db.patch(args.inviteId, {
      status: "revoked",
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const resendPlatformInvite = mutation({
  args: {
    sessionToken: v.string(),
    inviteId: v.id("platform_user_invites"),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
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

    return { success: true, token };
  },
});
