import { mutation, query } from "../../_generated/server";
import { ConvexError, v } from "convex/values";
import { logAction } from "../../helpers/auditLog";
import { requirePlatformRole } from "../../helpers/platformGuard";
import { requireTenantContext } from "../../helpers/tenantGuard";

const flagReasonValidator = v.union(
  v.literal("misleading_description"),
  v.literal("not_working"),
  v.literal("inappropriate"),
  v.literal("security_concern"),
  v.literal("pricing_dispute")
);

const resolutionStatusValidator = v.union(
  v.literal("resolved_no_action"),
  v.literal("resolved_warning"),
  v.literal("resolved_suspended"),
  v.literal("resolved_banned")
);

async function getModuleByRef(ctx: any, moduleId: string) {
  const direct = await ctx.db
    .query("modules")
    .withIndex("by_slug", (q: any) => q.eq("slug", moduleId))
    .first();
  if (direct) return direct;

  const modules = await ctx.db
    .query("modules")
    .withIndex("by_publisherId", (q: any) => q.gt("publisherId", ""))
    .collect();
  return modules.find((record: any) => String(record._id) === moduleId) ?? null;
}

export const flagModule = mutation({
  args: {
    moduleId: v.string(),
    reason: flagReasonValidator,
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireTenantContext(ctx);
    const module = await getModuleByRef(ctx, args.moduleId);

    if (!module) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Module not found" });
    }

    const existingFlags = await ctx.db
      .query("module_flags")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", actor.tenantId))
      .collect();
    const duplicate = existingFlags.find(
      (flag) =>
        flag.moduleId === String(module._id) &&
        ["flagged", "under_investigation"].includes(flag.status)
    );
    if (duplicate) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "This module already has an open flag from your tenant",
      });
    }

    const now = Date.now();
    const flagId = await ctx.db.insert("module_flags", {
      moduleId: String(module._id),
      tenantId: actor.tenantId,
      flaggedBy: actor.userId,
      reason: args.reason,
      status: "flagged",
      resolution: args.details,
      adminNotes: undefined,
      publisherResponse: undefined,
      createdAt: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: actor.tenantId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "marketplace.dispute_filed",
      entityType: "module_flag",
      entityId: String(flagId),
      after: { moduleId: String(module._id), reason: args.reason },
    });

    return { success: true, flagId };
  },
});

export const getFlags = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(
      v.union(
        v.literal("flagged"),
        v.literal("under_investigation"),
        v.literal("resolved_no_action"),
        v.literal("resolved_warning"),
        v.literal("resolved_suspended"),
        v.literal("resolved_banned")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requirePlatformRole(ctx, args, [
      "marketplace_reviewer",
      "content_moderator",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    let flags = await ctx.db.query("module_flags").collect();

    if (args.status) {
      flags = flags.filter((flag) => flag.status === args.status);
    }

    return flags.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const investigateFlag = mutation({
  args: {
    sessionToken: v.string(),
    flagId: v.id("module_flags"),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "marketplace_reviewer",
      "content_moderator",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    const flag = await ctx.db.get(args.flagId);

    if (!flag) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Flag not found" });
    }

    await ctx.db.patch(args.flagId, {
      status: "under_investigation",
      adminNotes: args.adminNotes ?? flag.adminNotes,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "marketplace.dispute_resolved",
      entityType: "module_flag",
      entityId: String(args.flagId),
      after: { status: "under_investigation" },
    });

    return { success: true };
  },
});

export const resolveFlag = mutation({
  args: {
    sessionToken: v.string(),
    flagId: v.id("module_flags"),
    status: resolutionStatusValidator,
    resolution: v.string(),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "marketplace_reviewer",
      "content_moderator",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    const flag = await ctx.db.get(args.flagId);

    if (!flag) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Flag not found" });
    }

    await ctx.db.patch(args.flagId, {
      status: args.status,
      resolution: args.resolution,
      adminNotes: args.adminNotes ?? flag.adminNotes,
      updatedAt: Date.now(),
    });

    const module = await getModuleByRef(ctx, flag.moduleId);
    if (module && args.status === "resolved_suspended") {
      await ctx.db.patch(module._id, {
        status: "suspended",
        updatedAt: Date.now(),
      });
    }
    if (module && args.status === "resolved_banned") {
      await ctx.db.patch(module._id, {
        status: "banned",
        updatedAt: Date.now(),
      });
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "marketplace.dispute_resolved",
      entityType: "module_flag",
      entityId: String(args.flagId),
      after: { status: args.status, resolution: args.resolution },
    });

    return { success: true };
  },
});
