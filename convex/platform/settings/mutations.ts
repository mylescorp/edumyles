import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

export const updateSettings = mutation({
  args: {
    sessionToken: v.string(),
    section: v.string(),
    settings: v.array(v.object({ key: v.string(), value: v.string() })),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    // Must be master_admin to change settings
    if (session.role !== "master_admin") {
      throw new Error("UNAUTHORIZED: Only Master Admins can update platform settings");
    }

    const beforeSettings: Record<string, string> = {};
    const afterSettings: Record<string, string> = {};

    for (const { key, value } of args.settings) {
      // Check if setting already exists
      const existing = await ctx.db
        .query("platformSettings")
        .withIndex("by_section_key", (q) =>
          q.eq("section", args.section).eq("key", key)
        )
        .first();

      if (existing) {
        beforeSettings[key] = existing.value;
        await ctx.db.patch(existing._id, {
          value,
          updatedBy: session.userId,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("platformSettings", {
          section: args.section,
          key,
          value,
          updatedBy: session.userId,
          updatedAt: Date.now(),
        });
      }
      afterSettings[key] = value;
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: session.userId,
      actorEmail: session.email,
      action: "settings.updated",
      entityType: "platformSettings",
      entityId: args.section,
      before: beforeSettings,
      after: afterSettings,
    });
  },
});

export const resetSectionToDefaults = mutation({
  args: {
    sessionToken: v.string(),
    section: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    if (session.role !== "master_admin") {
      throw new Error("UNAUTHORIZED: Only Master Admins can reset platform settings");
    }

    const settings = await ctx.db
      .query("platformSettings")
      .withIndex("by_section_key", (q) => q.eq("section", args.section))
      .collect();

    for (const s of settings) {
      await ctx.db.delete(s._id);
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: session.userId,
      actorEmail: session.email,
      action: "settings.updated",
      entityType: "platformSettings",
      entityId: args.section,
      after: { reset: true },
    });
  },
});
