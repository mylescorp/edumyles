import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

export const createDeal = mutation({
  args: {
    sessionToken: v.string(),
    schoolName: v.string(),
    contactPerson: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    county: v.optional(v.string()),
    schoolType: v.optional(v.string()),
    currentStudents: v.optional(v.number()),
    potentialStudents: v.optional(v.number()),
    stage: v.union(
      v.literal("lead"),
      v.literal("qualified"),
      v.literal("proposal"),
      v.literal("negotiation"),
      v.literal("closed_won"),
      v.literal("closed_lost")
    ),
    value: v.number(),
    currency: v.string(),
    source: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    expectedCloseDate: v.optional(v.number()),
    probability: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const now = Date.now();

    const dealId = await ctx.db.insert("crmDeals", {
      tenantId: session.tenantId,
      schoolName: args.schoolName,
      contactPerson: args.contactPerson,
      email: args.email,
      phone: args.phone,
      county: args.county,
      schoolType: args.schoolType,
      currentStudents: args.currentStudents,
      potentialStudents: args.potentialStudents,
      stage: args.stage,
      value: args.value,
      currency: args.currency,
      source: args.source,
      assignedTo: args.assignedTo,
      expectedCloseDate: args.expectedCloseDate,
      probability: args.probability,
      tags: args.tags ?? [],
      notes: args.notes,
      lostReason: undefined,
      createdBy: session.userId,
      createdAt: now,
      updatedAt: now,
    });

    // Audit log
    await ctx.db.insert("auditLogs", {
      tenantId: "PLATFORM",
      actorId: session.userId,
      actorEmail: session.email,
      action: "crm_deal_created",
      entityId: dealId,
      entityType: "crm_deal",
      before: null,
      after: { schoolName: args.schoolName, stage: args.stage, value: args.value },
      timestamp: now,
    });

    return { success: true, dealId, message: "Deal created successfully" };
  },
});

export const updateDeal = mutation({
  args: {
    sessionToken: v.string(),
    dealId: v.string(),
    schoolName: v.optional(v.string()),
    contactPerson: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    county: v.optional(v.string()),
    schoolType: v.optional(v.string()),
    currentStudents: v.optional(v.number()),
    potentialStudents: v.optional(v.number()),
    value: v.optional(v.number()),
    currency: v.optional(v.string()),
    source: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    expectedCloseDate: v.optional(v.number()),
    probability: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    lostReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const deal = await ctx.db.get(args.dealId as any);
    if (!deal) throw new Error("Deal not found");

    const { sessionToken, dealId, ...updates } = args;
    const cleanUpdates: Record<string, any> = {};
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) cleanUpdates[key] = val;
    }
    cleanUpdates.updatedAt = Date.now();

    await ctx.db.patch(args.dealId as any, cleanUpdates);

    return { success: true, message: "Deal updated successfully" };
  },
});

export const moveDealStage = mutation({
  args: {
    sessionToken: v.string(),
    dealId: v.string(),
    newStage: v.union(
      v.literal("lead"),
      v.literal("qualified"),
      v.literal("proposal"),
      v.literal("negotiation"),
      v.literal("closed_won"),
      v.literal("closed_lost")
    ),
    lostReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const deal = await ctx.db.get(args.dealId as any) as any;
    if (!deal) throw new Error("Deal not found");

    const previousStage = deal.stage;
    const now = Date.now();

    const updates: Record<string, any> = {
      stage: args.newStage,
      updatedAt: now,
    };
    if (args.newStage === "closed_lost" && args.lostReason) {
      updates.lostReason = args.lostReason;
    }

    await ctx.db.patch(args.dealId as any, updates);

    // Create activity for stage change
    await ctx.db.insert("crmActivities", {
      tenantId: session.tenantId,
      dealId: args.dealId,
      leadId: undefined,
      type: "stage_change",
      title: `Stage changed from ${previousStage} to ${args.newStage}`,
      description: args.lostReason ? `Reason: ${args.lostReason}` : undefined,
      outcome: undefined,
      scheduledAt: undefined,
      completedAt: now,
      createdBy: session.userId,
      createdAt: now,
    });

    return { success: true, previousStage, newStage: args.newStage, message: "Deal stage updated" };
  },
});

export const deleteDeal = mutation({
  args: {
    sessionToken: v.string(),
    dealId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const deal = await ctx.db.get(args.dealId as any);
    if (!deal) throw new Error("Deal not found");

    await ctx.db.delete(args.dealId as any);

    await ctx.db.insert("auditLogs", {
      tenantId: "PLATFORM",
      actorId: session.userId,
      actorEmail: session.email,
      action: "crm_deal_deleted",
      entityId: args.dealId,
      entityType: "crm_deal",
      before: { schoolName: (deal as any).schoolName },
      after: null,
      timestamp: Date.now(),
    });

    return { success: true, message: "Deal deleted successfully" };
  },
});

export const createLead = mutation({
  args: {
    sessionToken: v.string(),
    schoolName: v.string(),
    contactPerson: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    county: v.optional(v.string()),
    schoolType: v.optional(v.string()),
    source: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const now = Date.now();

    const leadId = await ctx.db.insert("crmLeads", {
      tenantId: session.tenantId,
      schoolName: args.schoolName,
      contactPerson: args.contactPerson,
      email: args.email,
      phone: args.phone,
      county: args.county,
      schoolType: args.schoolType,
      source: args.source,
      status: "new",
      notes: args.notes,
      convertedDealId: undefined,
      createdBy: session.userId,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, leadId, message: "Lead created successfully" };
  },
});

export const updateLead = mutation({
  args: {
    sessionToken: v.string(),
    leadId: v.string(),
    schoolName: v.optional(v.string()),
    contactPerson: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    county: v.optional(v.string()),
    schoolType: v.optional(v.string()),
    source: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("new"),
      v.literal("contacted"),
      v.literal("qualified"),
      v.literal("converted"),
      v.literal("lost")
    )),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const lead = await ctx.db.get(args.leadId as any);
    if (!lead) throw new Error("Lead not found");

    const { sessionToken, leadId, ...updates } = args;
    const cleanUpdates: Record<string, any> = {};
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) cleanUpdates[key] = val;
    }
    cleanUpdates.updatedAt = Date.now();

    await ctx.db.patch(args.leadId as any, cleanUpdates);

    return { success: true, message: "Lead updated successfully" };
  },
});

export const convertLeadToDeal = mutation({
  args: {
    sessionToken: v.string(),
    leadId: v.string(),
    value: v.number(),
    currency: v.string(),
    stage: v.optional(v.union(
      v.literal("lead"),
      v.literal("qualified"),
      v.literal("proposal"),
      v.literal("negotiation"),
      v.literal("closed_won"),
      v.literal("closed_lost")
    )),
    assignedTo: v.optional(v.string()),
    expectedCloseDate: v.optional(v.number()),
    probability: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const lead = await ctx.db.get(args.leadId as any) as any;
    if (!lead) throw new Error("Lead not found");
    if (lead.status === "converted") throw new Error("Lead already converted");

    const now = Date.now();

    // Create deal from lead
    const dealId = await ctx.db.insert("crmDeals", {
      tenantId: session.tenantId,
      schoolName: lead.schoolName,
      contactPerson: lead.contactPerson,
      email: lead.email,
      phone: lead.phone,
      county: lead.county,
      schoolType: lead.schoolType,
      currentStudents: undefined,
      potentialStudents: undefined,
      stage: args.stage ?? "qualified",
      value: args.value,
      currency: args.currency,
      source: lead.source,
      assignedTo: args.assignedTo,
      expectedCloseDate: args.expectedCloseDate,
      probability: args.probability,
      tags: [],
      notes: lead.notes,
      lostReason: undefined,
      createdBy: session.userId,
      createdAt: now,
      updatedAt: now,
    });

    // Update lead status
    await ctx.db.patch(args.leadId as any, {
      status: "converted",
      convertedDealId: dealId,
      updatedAt: now,
    });

    return { success: true, dealId, message: "Lead converted to deal successfully" };
  },
});

export const addActivity = mutation({
  args: {
    sessionToken: v.string(),
    dealId: v.optional(v.string()),
    leadId: v.optional(v.string()),
    type: v.union(
      v.literal("call"),
      v.literal("email"),
      v.literal("meeting"),
      v.literal("note"),
      v.literal("task"),
      v.literal("stage_change"),
      v.literal("proposal_sent"),
      v.literal("follow_up")
    ),
    title: v.string(),
    description: v.optional(v.string()),
    outcome: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const now = Date.now();

    const activityId = await ctx.db.insert("crmActivities", {
      tenantId: session.tenantId,
      dealId: args.dealId,
      leadId: args.leadId,
      type: args.type,
      title: args.title,
      description: args.description,
      outcome: args.outcome,
      scheduledAt: args.scheduledAt,
      completedAt: args.completedAt,
      createdBy: session.userId,
      createdAt: now,
    });

    return { success: true, activityId, message: "Activity added successfully" };
  },
});
