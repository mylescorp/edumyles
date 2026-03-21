import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { createHash } from "node:crypto";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

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
    hash: createHash("sha256").update(key).digest("hex"),
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
    const session = await requirePlatformSession(ctx, args);

    const { full, prefix, suffix, hash } = generateApiKey();

    const keyId = await ctx.db.insert("apiKeys", {
      name: args.name,
      keyHash: hash,
      keyPrefix: prefix,
      tenantId: args.tenantId || session.tenantId,
      permissions: args.permissions,
      rateLimit: args.rateLimit || 1000,
      isActive: true,
      createdBy: session.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: args.expiresInDays ? Date.now() + args.expiresInDays * 86400000 : undefined,
    });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "api_key.created",
      entityType: "api_key",
      entityId: keyId,
      after: {
        name: args.name,
        tenantId: args.tenantId || session.tenantId,
        permissions: args.permissions,
        rateLimit: args.rateLimit || 1000,
        keyPrefix: prefix,
        keySuffix: suffix,
      },
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
    const session = await requirePlatformSession(ctx, args);

    const existing = await ctx.db.get(args.keyId);
    if (!existing) throw new Error("API key not found");

    await ctx.db.patch(args.keyId, { isActive: false, updatedAt: Date.now() });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "api_key.revoked",
      entityType: "api_key",
      entityId: args.keyId,
      before: { isActive: existing.isActive, name: existing.name },
      after: { isActive: false, name: existing.name },
    });

    return { success: true };
  },
});

export const rotateApiKey = mutation({
  args: {
    sessionToken: v.string(),
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const existing = await ctx.db.get(args.keyId);
    if (!existing) throw new Error("API key not found");

    const { full, prefix, suffix, hash } = generateApiKey();

    await ctx.db.patch(args.keyId, {
      keyHash: hash,
      keyPrefix: prefix,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "api_key.rotated",
      entityType: "api_key",
      entityId: args.keyId,
      before: { keyPrefix: existing.keyPrefix, updatedAt: existing.updatedAt },
      after: { keyPrefix: prefix, updatedAt: Date.now() },
    });

    return { apiKey: full };
  },
});
