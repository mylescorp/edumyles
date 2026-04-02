import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

export const createSession = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    userId: v.string(),
    email: v.string(),
    role: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Remove any existing session for this user
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return await ctx.db.insert("sessions", {
      sessionToken: args.sessionToken,
      tenantId: args.tenantId,
      userId: args.userId,
      email: args.email,
      role: args.role,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });
  },
});

export const getSession = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session) return null;
    if (session.expiresAt < Date.now()) return null;

    return session;
  },
});

export const deleteSession = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
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
    // Validate the requesting session first
    const currentSession = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!currentSession || currentSession.expiresAt < Date.now()) return [];

    // Get all sessions for this user
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", currentSession.userId))
      .collect();

    return sessions
      .filter((s) => s.expiresAt > Date.now())
      .map((s) => ({
        _id: s._id,
        sessionToken: s.sessionToken,
        deviceInfo: s.deviceInfo ?? "Unknown device",
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isCurrent: s.sessionToken === args.sessionToken,
      }));
  },
});

export const deleteSessionById = mutation({
  args: { sessionToken: v.string(), targetSessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    // Validate the requesting session
    const currentSession = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!currentSession || currentSession.expiresAt < Date.now()) {
      throw new ConvexError({ code: "UNAUTHENTICATED", message: "Session is invalid or expired" });
    }

    const targetSession = await ctx.db.get(args.targetSessionId);
    if (!targetSession || targetSession.userId !== currentSession.userId) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Cannot terminate another user's session" });
    }

    await ctx.db.delete(args.targetSessionId);
  },
});

export const updateSessionRole = mutation({
  args: { sessionToken: v.string(), role: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) {
      throw new ConvexError({ code: "UNAUTHENTICATED", message: "Session is invalid or expired" });
    }
    await ctx.db.patch(session._id, { role: args.role });
  },
});

export const deleteAllUserSessions = mutation({
  args: { sessionToken: v.string(), exceptCurrent: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const currentSession = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!currentSession || currentSession.expiresAt < Date.now()) {
      throw new ConvexError({ code: "UNAUTHENTICATED", message: "Session is invalid or expired" });
    }

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
