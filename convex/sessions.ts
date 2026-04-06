import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

const SERVER_SECRET = process.env.CONVEX_WEBHOOK_SECRET ?? "";

function assertTrustedServer(serverSecret?: string) {
  if (!SERVER_SECRET || serverSecret !== SERVER_SECRET) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Trusted server credentials required",
    });
  }
}

async function getActiveSessionByToken(ctx: any, sessionToken: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("sessionToken", sessionToken))
    .first();

  if (!session) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "Session not found" });
  }

  if (session.expiresAt < Date.now()) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "Session expired" });
  }

  return session;
}

export const createSession = mutation({
  args: {
    serverSecret: v.string(),
    sessionToken: v.string(),
    tenantId: v.string(),
    userId: v.string(),
    email: v.string(),
    role: v.string(),
    expiresAt: v.number(),
    deviceInfo: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
    workosUserId: v.optional(v.string()),
    impersonatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertTrustedServer(args.serverSecret);

    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const session of existing) {
      if (session.sessionToken === args.sessionToken || session.expiresAt < Date.now()) {
        await ctx.db.delete(session._id);
      }
    }

    return await ctx.db.insert("sessions", {
      sessionToken: args.sessionToken,
      tenantId: args.tenantId,
      userId: args.userId,
      email: args.email,
      role: args.role,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
      deviceInfo: args.deviceInfo,
      isActive: true,
      permissions: args.permissions,
      workosUserId: args.workosUserId,
      impersonatedBy: args.impersonatedBy,
    });
  },
});

export const getSession = query({
  args: {
    sessionToken: v.string(),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertTrustedServer(args.serverSecret);

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    return {
      _id: session._id,
      sessionToken: session.sessionToken,
      tenantId: session.tenantId,
      userId: session.userId,
      email: session.email,
      role: session.role,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      deviceInfo: session.deviceInfo,
      isActive: session.isActive ?? true,
      permissions: session.permissions ?? [],
      workosUserId: session.workosUserId,
      impersonatedBy: session.impersonatedBy,
    };
  },
});

export const getCurrentSession = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    return {
      _id: session._id,
      sessionToken: session.sessionToken,
      tenantId: session.tenantId,
      userId: session.userId,
      email: session.email,
      role: session.role,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      deviceInfo: session.deviceInfo,
      isActive: session.isActive ?? true,
      permissions: session.permissions ?? [],
      workosUserId: session.workosUserId,
      impersonatedBy: session.impersonatedBy,
    };
  },
});

export const deleteSession = mutation({
  args: {
    sessionToken: v.string(),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertTrustedServer(args.serverSecret);

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

export const listUserSessions = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const currentSession = await getActiveSessionByToken(ctx, args.sessionToken);

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", currentSession.userId))
      .collect();

    return sessions
      .filter((session) => session.expiresAt > Date.now())
      .map((session) => ({
        _id: session._id,
        sessionToken: session.sessionToken,
        deviceInfo: session.deviceInfo ?? "Unknown device",
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        isCurrent: session.sessionToken === args.sessionToken,
      }));
  },
});

export const deleteSessionById = mutation({
  args: { sessionToken: v.string(), targetSessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const currentSession = await getActiveSessionByToken(ctx, args.sessionToken);
    const targetSession = await ctx.db.get(args.targetSessionId);

    if (!targetSession || targetSession.userId !== currentSession.userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cannot terminate another user's session",
      });
    }

    await ctx.db.delete(args.targetSessionId);
  },
});

export const deleteAllUserSessions = mutation({
  args: { sessionToken: v.string(), exceptCurrent: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const currentSession = await getActiveSessionByToken(ctx, args.sessionToken);
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", currentSession.userId))
      .collect();

    for (const session of sessions) {
      if (args.exceptCurrent && session.sessionToken === args.sessionToken) {
        continue;
      }
      await ctx.db.delete(session._id);
    }
  },
});

export const createMobileAuthRequest = mutation({
  args: {
    serverSecret: v.string(),
    requestId: v.string(),
    email: v.string(),
    expiresAt: v.number(),
    deviceInfo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertTrustedServer(args.serverSecret);

    const existing = await ctx.db
      .query("mobileAuthRequests")
      .withIndex("by_requestId", (q) => q.eq("requestId", args.requestId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    await ctx.db.insert("mobileAuthRequests", {
      requestId: args.requestId,
      email: args.email.toLowerCase(),
      status: "pending",
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
      deviceInfo: args.deviceInfo,
    });
  },
});

export const getMobileAuthRequest = query({
  args: {
    serverSecret: v.string(),
    requestId: v.string(),
  },
  handler: async (ctx, args) => {
    assertTrustedServer(args.serverSecret);

    const request = await ctx.db
      .query("mobileAuthRequests")
      .withIndex("by_requestId", (q) => q.eq("requestId", args.requestId))
      .first();

    if (!request) {
      return null;
    }

    if (request.expiresAt < Date.now() && request.status === "pending") {
      return {
        ...request,
        status: "expired" as const,
      };
    }

    return request;
  },
});

export const completeMobileAuthRequest = mutation({
  args: {
    serverSecret: v.string(),
    requestId: v.string(),
    sessionToken: v.string(),
    email: v.string(),
    tenantId: v.string(),
    userId: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    assertTrustedServer(args.serverSecret);

    const request = await ctx.db
      .query("mobileAuthRequests")
      .withIndex("by_requestId", (q) => q.eq("requestId", args.requestId))
      .first();

    if (!request) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Mobile auth request not found" });
    }

    if (request.expiresAt < Date.now()) {
      await ctx.db.patch(request._id, { status: "expired" });
      throw new ConvexError({ code: "EXPIRED", message: "Mobile auth request expired" });
    }

    if (request.email !== args.email.toLowerCase()) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Authenticated user does not match mobile auth request",
      });
    }

    await ctx.db.patch(request._id, {
      status: "completed",
      sessionToken: args.sessionToken,
      tenantId: args.tenantId,
      userId: args.userId,
      role: args.role,
      completedByEmail: args.email.toLowerCase(),
      completedAt: Date.now(),
    });
  },
});

export const consumeMobileAuthRequest = mutation({
  args: {
    serverSecret: v.string(),
    requestId: v.string(),
  },
  handler: async (ctx, args) => {
    assertTrustedServer(args.serverSecret);

    const request = await ctx.db
      .query("mobileAuthRequests")
      .withIndex("by_requestId", (q) => q.eq("requestId", args.requestId))
      .first();

    if (!request) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Mobile auth request not found" });
    }

    await ctx.db.patch(request._id, {
      status: "consumed",
      consumedAt: Date.now(),
    });
  },
});

export const cancelMobileAuthRequest = mutation({
  args: {
    serverSecret: v.string(),
    requestId: v.string(),
  },
  handler: async (ctx, args) => {
    assertTrustedServer(args.serverSecret);

    const request = await ctx.db
      .query("mobileAuthRequests")
      .withIndex("by_requestId", (q) => q.eq("requestId", args.requestId))
      .first();

    if (!request) {
      return;
    }

    await ctx.db.patch(request._id, {
      status: request.status === "completed" ? "consumed" : "cancelled",
      consumedAt: Date.now(),
    });
  },
});
