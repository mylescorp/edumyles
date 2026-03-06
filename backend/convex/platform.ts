import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createPlatformSession = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    userId: v.string(),
    email: v.string(),
    role: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("platformSessions", {
      token: args.sessionToken,
      userId: args.userId,
      role: args.role,
      permissions: [], // TODO: Calculate based on role
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });
    return { success: true };
  },
});

export const getSession = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("platformSessions")
      .withIndex("by_token")
      .eq("token", args.sessionToken)
      .first();
    
    if (!session) {
      return null;
    }
    
    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      await ctx.db.delete(session._id);
      return null;
    }
    
    return session;
  },
});
