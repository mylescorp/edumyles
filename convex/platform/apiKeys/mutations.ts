import { mutation } from "../../_generated/server";
import { v } from "convex/values";

function generateApiKey(): { full: string; prefix: string; suffix: string; hash: string } {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "edu_";
  for (let i = 0; i < 40; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return {
    full: key,
    prefix: key.substring(0, 8),
    suffix: key.substring(key.length - 4),
    hash: key, // In production, store a proper hash
  };
}

export const createApiKey = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    tenantId: v.optional(v.string()),
    permissions: v.array(v.string()),
    rateLimit: v.optional(v.number()),
    expiresInDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) throw new Error("Invalid session");

    const { full, prefix, suffix, hash } = generateApiKey();

    const keyId = await ctx.db.insert("apiKeys", {
      name: args.name,
      keyHash: hash,
      keyPrefix: prefix,
      keySuffix: suffix,
      tenantId: args.tenantId || session.tenantId,
      permissions: args.permissions,
      rateLimit: args.rateLimit || 1000,
      isActive: true,
      createdBy: session.userId,
      createdAt: Date.now(),
      expiresAt: args.expiresInDays ? Date.now() + args.expiresInDays * 86400000 : undefined,
    });

    return { keyId, apiKey: full };
  },
});

export const revokeApiKey = mutation({
  args: {
    sessionToken: v.string(),
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) throw new Error("Invalid session");

    await ctx.db.patch(args.keyId, { isActive: false, revokedAt: Date.now() });
    return { success: true };
  },
});

export const rotateApiKey = mutation({
  args: {
    sessionToken: v.string(),
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) throw new Error("Invalid session");

    const existing = await ctx.db.get(args.keyId);
    if (!existing) throw new Error("API key not found");

    const { full, prefix, suffix, hash } = generateApiKey();

    await ctx.db.patch(args.keyId, {
      keyHash: hash,
      keyPrefix: prefix,
      keySuffix: suffix,
      rotatedAt: Date.now(),
    });

    return { apiKey: full };
  },
});
