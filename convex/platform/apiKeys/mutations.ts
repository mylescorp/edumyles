import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

// Web Crypto API — available in Convex runtime (no node:crypto needed)
async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateRawKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(40);
  crypto.getRandomValues(bytes);
  return "edu_" + Array.from(bytes).map((b) => chars[b % chars.length]).join("");
}

async function generateApiKey(): Promise<{ full: string; prefix: string; suffix: string; hash: string }> {
  const full = generateRawKey();
  return {
    full,
    prefix: full.substring(0, 8),
    suffix: full.substring(full.length - 4),
    hash: await sha256Hex(full),
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
    const platform = await requirePlatformSession(ctx, args);

    const { full, prefix, suffix, hash } = await generateApiKey();

    const keyId = await ctx.db.insert("apiKeys", {
      name: args.name,
      keyHash: hash,
      keyPrefix: prefix,
      tenantId: args.tenantId || platform.tenantId,
      permissions: args.permissions,
      rateLimit: args.rateLimit || 1000,
      isActive: true,
      createdBy: platform.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: args.expiresInDays ? Date.now() + args.expiresInDays * 86400000 : undefined,
    });

    await logAction(ctx, {
      tenantId: platform.tenantId,
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "api_key.created",
      entityType: "api_key",
      entityId: keyId,
      after: {
        name: args.name,
        tenantId: args.tenantId || platform.tenantId,
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
    const platform = await requirePlatformSession(ctx, args);

    const existing = await ctx.db.get(args.keyId);
    if (!existing) throw new Error("API key not found");

    await ctx.db.patch(args.keyId, { isActive: false, updatedAt: Date.now() });

    await logAction(ctx, {
      tenantId: platform.tenantId,
      actorId: platform.userId,
      actorEmail: platform.email,
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
    const platform = await requirePlatformSession(ctx, args);

    const existing = await ctx.db.get(args.keyId);
    if (!existing) throw new Error("API key not found");

    const { full, prefix, hash } = await generateApiKey();

    await ctx.db.patch(args.keyId, {
      keyHash: hash,
      keyPrefix: prefix,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: platform.tenantId,
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "api_key.rotated",
      entityType: "api_key",
      entityId: args.keyId,
      before: { keyPrefix: existing.keyPrefix, updatedAt: existing.updatedAt },
      after: { keyPrefix: prefix, updatedAt: Date.now() },
    });

    return { apiKey: full };
  },
});
