import { mutation } from "../../_generated/server";
import { v } from "convex/values";

export const createSLAConfig = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    priority: v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low")),
    responseTimeHours: v.number(),
    resolutionTimeHours: v.number(),
    escalationRules: v.optional(v.any()),
    tenantId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) throw new Error("Invalid session");

    return await ctx.db.insert("slaConfigurations", {
      name: args.name,
      priority: args.priority,
      responseTimeHours: args.responseTimeHours,
      resolutionTimeHours: args.resolutionTimeHours,
      escalationRules: args.escalationRules || {},
      isActive: true,
      tenantId: args.tenantId || session.tenantId,
      createdAt: Date.now(),
    });
  },
});

export const updateSLAConfig = mutation({
  args: {
    sessionToken: v.string(),
    configId: v.id("slaConfigurations"),
    name: v.optional(v.string()),
    responseTimeHours: v.optional(v.number()),
    resolutionTimeHours: v.optional(v.number()),
    escalationRules: v.optional(v.any()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) throw new Error("Invalid session");

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.responseTimeHours !== undefined) updates.responseTimeHours = args.responseTimeHours;
    if (args.resolutionTimeHours !== undefined) updates.resolutionTimeHours = args.resolutionTimeHours;
    if (args.escalationRules !== undefined) updates.escalationRules = args.escalationRules;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.configId, updates);
    return { success: true };
  },
});

export const deleteSLAConfig = mutation({
  args: {
    sessionToken: v.string(),
    configId: v.id("slaConfigurations"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) throw new Error("Invalid session");

    await ctx.db.delete(args.configId);
    return { success: true };
  },
});
