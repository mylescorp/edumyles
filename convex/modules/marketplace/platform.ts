import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

// SECURITY: Platform-scoped functions in this file use requirePlatformSession()
// because they are called with explicit sessionToken args rather than Convex JWT auth.

/**
 * Update a module's status in the registry (active/beta/deprecated).
 * Platform admin only.
 */
export const updateModuleStatus = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.string(),
    status: v.union(
      v.literal("published"),
      v.literal("active"),
      v.literal("beta"),
      v.literal("deprecated")
    ),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const mod = await ctx.db
      .query("moduleRegistry")
      .withIndex("by_module_id", (q) => q.eq("moduleId", args.moduleId))
      .first();

    if (!mod) {
      throw new Error("MODULE_NOT_FOUND");
    }

    await ctx.db.patch(mod._id, { status: args.status });

    return { success: true };
  },
});

/**
 * Update a module's version in the registry.
 * Platform admin only.
 */
export const updateModuleVersion = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.string(),
    version: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const mod = await ctx.db
      .query("moduleRegistry")
      .withIndex("by_module_id", (q) => q.eq("moduleId", args.moduleId))
      .first();

    if (!mod) {
      throw new Error("MODULE_NOT_FOUND");
    }

    await ctx.db.patch(mod._id, { version: args.version });

    return { success: true };
  },
});

/**
 * Get full registry listing for platform admins (includes all statuses).
 * Platform admin only.
 */
export const getFullRegistry = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    return await ctx.db.query("moduleRegistry").collect();
  },
});

/**
 * Update module metadata (name, description, tier, category).
 * Platform admin only.
 */
export const updateModuleMetadata = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    tier: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const mod = await ctx.db
      .query("moduleRegistry")
      .withIndex("by_module_id", (q) => q.eq("moduleId", args.moduleId))
      .first();

    if (!mod) {
      throw new Error("MODULE_NOT_FOUND");
    }

    const updates: Record<string, string> = {};
    if (args.name) updates.name = args.name;
    if (args.description) updates.description = args.description;
    if (args.tier) updates.tier = args.tier;
    if (args.category) updates.category = args.category;

    await ctx.db.patch(mod._id, updates);

    return { success: true };
  },
});
