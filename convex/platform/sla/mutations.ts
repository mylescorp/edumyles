import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

const escalationRuleValidator = v.array(
  v.object({
    afterHours: v.number(),
    action: v.string(),
    notifyRole: v.string(),
  })
);

export const createSLAConfig = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    priority: v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low")),
    responseTimeHours: v.number(),
    resolutionTimeHours: v.number(),
    escalationRules: v.optional(escalationRuleValidator),
    tenantId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const configId = await ctx.db.insert("slaConfigurations", {
      name: args.name,
      priority: args.priority,
      responseTimeHours: args.responseTimeHours,
      resolutionTimeHours: args.resolutionTimeHours,
      escalationRules: args.escalationRules || [],
      isActive: true,
      tenantId: args.tenantId || session.tenantId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "sla.created",
      entityType: "sla_configuration",
      entityId: configId,
      after: {
        name: args.name,
        priority: args.priority,
        tenantId: args.tenantId || session.tenantId,
      },
    });

    return configId;
  },
});

export const updateSLAConfig = mutation({
  args: {
    sessionToken: v.string(),
    configId: v.id("slaConfigurations"),
    name: v.optional(v.string()),
    responseTimeHours: v.optional(v.number()),
    resolutionTimeHours: v.optional(v.number()),
    escalationRules: v.optional(escalationRuleValidator),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const existing = await ctx.db.get(args.configId);
    if (!existing) throw new Error("SLA config not found");

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.responseTimeHours !== undefined) updates.responseTimeHours = args.responseTimeHours;
    if (args.resolutionTimeHours !== undefined) updates.resolutionTimeHours = args.resolutionTimeHours;
    if (args.escalationRules !== undefined) updates.escalationRules = args.escalationRules;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.configId, updates);

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "sla.updated",
      entityType: "sla_configuration",
      entityId: args.configId,
      before: {
        name: existing.name,
        responseTimeHours: existing.responseTimeHours,
        resolutionTimeHours: existing.resolutionTimeHours,
        escalationRules: existing.escalationRules,
        isActive: existing.isActive,
      },
      after: {
        name: updates.name ?? existing.name,
        responseTimeHours: updates.responseTimeHours ?? existing.responseTimeHours,
        resolutionTimeHours: updates.resolutionTimeHours ?? existing.resolutionTimeHours,
        escalationRules: updates.escalationRules ?? existing.escalationRules,
        isActive: updates.isActive ?? existing.isActive,
      },
    });

    return { success: true };
  },
});

export const deleteSLAConfig = mutation({
  args: {
    sessionToken: v.string(),
    configId: v.id("slaConfigurations"),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const existing = await ctx.db.get(args.configId);
    if (!existing) throw new Error("SLA config not found");

    await ctx.db.delete(args.configId);

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "sla.deleted",
      entityType: "sla_configuration",
      entityId: args.configId,
      before: {
        name: existing.name,
        priority: existing.priority,
      },
    });

    return { success: true };
  },
});
