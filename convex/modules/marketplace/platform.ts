import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { normalizeModuleSlug } from "./moduleAliases";

const statusValidator = v.union(
  v.literal("draft"),
  v.literal("published"),
  v.literal("deprecated"),
  v.literal("suspended"),
  v.literal("banned")
);

async function getModuleBySlugOrThrow(ctx: any, moduleId: string) {
  const moduleSlug = normalizeModuleSlug(moduleId);
  const moduleRecord = await ctx.db
    .query("marketplace_modules")
    .withIndex("by_slug", (q: any) => q.eq("slug", moduleSlug))
    .first();

  if (!moduleRecord) {
    throw new Error("MODULE_NOT_FOUND");
  }

  return moduleRecord;
}

export const updateModuleStatus = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.string(),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const moduleRecord = await getModuleBySlugOrThrow(ctx, args.moduleId);
    await ctx.db.patch(moduleRecord._id, { status: args.status, updatedAt: Date.now() });
    return { success: true };
  },
});

export const updateModuleVersion = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.string(),
    version: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const moduleRecord = await getModuleBySlugOrThrow(ctx, args.moduleId);
    await ctx.db.patch(moduleRecord._id, { version: args.version, updatedAt: Date.now() });
    return { success: true };
  },
});

export const getFullRegistry = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    return await ctx.db.query("marketplace_modules").collect();
  },
});

export const updateModuleMetadata = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    tier: v.optional(v.union(v.literal("free"), v.literal("starter"), v.literal("pro"), v.literal("enterprise"))),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const moduleRecord = await getModuleBySlugOrThrow(ctx, args.moduleId);
    const updates: Record<string, any> = { updatedAt: Date.now() };
    if (args.name) updates.name = args.name;
    if (args.description) updates.description = args.description;
    if (args.tier) updates.minimumPlan = args.tier;
    if (args.category) updates.category = args.category;
    await ctx.db.patch(moduleRecord._id, updates);
    return { success: true };
  },
});
