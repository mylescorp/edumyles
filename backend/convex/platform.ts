import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
    const sessionId = await ctx.db.insert("sessions", {
      token: args.sessionToken,
      userId: args.userId,
      role: args.role,
      permissions: [], // TODO: Calculate based on role
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
      tenantId: args.tenantId,
      email: args.email,
      workosUserId: args.userId,
    });
    return { success: true, sessionId };
  },
});

export const getSession = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", q => q.eq("token", args.sessionToken))
      .unique();
    
    if (!session) {
      return null;
    }
    
    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      return null;
    }
    
    return session;
  },
});
