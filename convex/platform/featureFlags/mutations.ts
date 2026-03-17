import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

/**
 * Create a new feature flag.
 */
export const createFeatureFlag = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    key: v.string(),
    description: v.optional(v.string()),
    enabled: v.boolean(),
    targetType: v.optional(v.string()),
    targetValue: v.optional(v.any()),
    tenantId: v.optional(v.string()),
    environment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { email } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    // Ensure key is unique
    const existing = await ctx.db
      .query("featureFlags")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (existing) {
      throw new Error(`Feature flag with key "${args.key}" already exists`);
    }

    const id = await ctx.db.insert("featureFlags", {
      name: args.name,
      key: args.key,
      description: args.description,
      enabled: args.enabled,
      targetType: args.targetType,
      targetValue: args.targetValue,
      tenantId: args.tenantId,
      environment: args.environment,
      createdBy: email,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, id, message: "Feature flag created" };
  },
});

/**
 * Update an existing feature flag's fields.
 */
export const updateFeatureFlag = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("featureFlags"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    targetType: v.optional(v.string()),
    targetValue: v.optional(v.any()),
    environment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const flag = await ctx.db.get(args.id);
    if (!flag) throw new Error("Feature flag not found");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.enabled !== undefined) updates.enabled = args.enabled;
    if (args.targetType !== undefined) updates.targetType = args.targetType;
    if (args.targetValue !== undefined) updates.targetValue = args.targetValue;
    if (args.environment !== undefined) updates.environment = args.environment;

    await ctx.db.patch(args.id, updates);
    return { success: true, message: "Feature flag updated" };
  },
});

/**
 * Toggle a feature flag's enabled state.
 */
export const toggleFeatureFlag = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("featureFlags"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const flag = await ctx.db.get(args.id);
    if (!flag) throw new Error("Feature flag not found");

    await ctx.db.patch(args.id, {
      enabled: !flag.enabled,
      updatedAt: Date.now(),
    });

    return { success: true, enabled: !flag.enabled, message: `Feature flag ${!flag.enabled ? "enabled" : "disabled"}` };
  },
});

/**
 * Delete a feature flag.
 */
export const deleteFeatureFlag = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("featureFlags"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const flag = await ctx.db.get(args.id);
    if (!flag) throw new Error("Feature flag not found");

    await ctx.db.delete(args.id);
    return { success: true, message: "Feature flag deleted" };
  },
});
