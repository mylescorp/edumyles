import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

/**
 * List all feature flags, with optional environment filter.
 */
export const listFeatureFlags = query({
  args: {
    sessionToken: v.string(),
    environment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    if (args.environment) {
      return await ctx.db
        .query("featureFlags")
        .withIndex("by_environment", (q) => q.eq("environment", args.environment!))
        .order("desc")
        .collect();
    }

    return await ctx.db.query("featureFlags").order("desc").collect();
  },
});

/**
 * Get a single feature flag by its unique key.
 */
export const getFeatureFlagByKey = query({
  args: {
    sessionToken: v.string(),
    key: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    return await ctx.db
      .query("featureFlags")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
  },
});

/**
 * Evaluate whether a flag is enabled for a given context (tenant / user).
 *
 * Returns `{ enabled: boolean }`.
 *
 * Evaluation rules:
 *  - If the flag does not exist or is globally disabled → false
 *  - targetType "all" → use the flag's enabled value
 *  - targetType "percentage" → hash-based deterministic check
 *  - targetType "tenants" → check if tenantId is in targetValue array
 *  - targetType "users" → check if userId is in targetValue array
 */
export const evaluateFlag = query({
  args: {
    sessionToken: v.string(),
    key: v.string(),
    tenantId: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const flag = await ctx.db
      .query("featureFlags")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (!flag || !flag.enabled) {
      return { enabled: false };
    }

    const targetType = flag.targetType ?? "all";

    if (targetType === "all") {
      return { enabled: true };
    }

    if (targetType === "percentage") {
      const pct = typeof flag.targetValue === "number" ? flag.targetValue : 0;
      // Simple deterministic hash using the key + identifier
      const identifier = args.userId || args.tenantId || "";
      let hash = 0;
      const str = `${args.key}:${identifier}`;
      for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) | 0;
      }
      const bucket = Math.abs(hash) % 100;
      return { enabled: bucket < pct };
    }

    if (targetType === "tenants") {
      const tenantIds = Array.isArray(flag.targetValue) ? flag.targetValue : [];
      return { enabled: args.tenantId ? tenantIds.includes(args.tenantId) : false };
    }

    if (targetType === "users") {
      const userIds = Array.isArray(flag.targetValue) ? flag.targetValue : [];
      return { enabled: args.userId ? userIds.includes(args.userId) : false };
    }

    return { enabled: false };
  },
});
