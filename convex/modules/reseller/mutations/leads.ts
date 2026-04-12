import { v } from "convex/values";
import { mutation, query } from "../../../_generated/server";
import { requireResellerContext, requireCreationLimit } from "../../../helpers/resellerGuard";
import { logAction } from "../../../helpers/auditLog";

export const getLeads = query({
  args: {
    status: v.optional(v.union(
      v.literal("new"),
      v.literal("contacted"),
      v.literal("qualified"),
      v.literal("proposal_sent"),
      v.literal("negotiation"),
      v.literal("closed_won"),
      v.literal("closed_lost")
    )),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);
    
    const page = args.page || 1;
    const pageSize = args.pageSize || 25;
    const skip = (page - 1) * pageSize;

    let leads = await ctx.db
      .query("resellerLeads")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .collect();

    // Filter by status if provided
    if (args.status) {
      leads = leads.filter(l => l.status === args.status);
    }

    // Filter by priority if provided
    if (args.priority) {
      leads = leads.filter(l => l.priority === args.priority);
    }

    // Sort by priority and assigned date
    leads.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.assignedAt - a.assignedAt;
    });

    // Apply pagination
    const paginatedLeads = leads.slice(skip, skip + pageSize);

    return {
      leads: paginatedLeads,
      total: leads.length,
      page,
      pageSize,
      hasMore: skip + pageSize < leads.length,
    };
  },
});

export const createLead = mutation({
  args: {
    schoolName: v.string(),
    contactName: v.string(),
    contactEmail: v.string(),
    contactPhone: v.string(),
    schoolSize: v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
    currentSystem: v.optional(v.string()),
    requirements: v.array(v.string()),
    budget: v.optional(v.string()),
    timeline: v.union(v.literal("immediate"), v.literal("1_month"), v.literal("3_months"), v.literal("6_months"), v.literal("exploring")),
    source: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    value: v.optional(v.number()),
    probability: v.number(),
    expectedCloseDate: v.optional(v.number()),
    notes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);

    // Generate unique lead ID
    const leadId = `LEAD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const leadDocId = await ctx.db.insert("resellerLeads", {
      resellerId: reseller.resellerId,
      leadId,
      schoolName: args.schoolName,
      contactName: args.contactName,
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      schoolSize: args.schoolSize,
      currentSystem: args.currentSystem,
      requirements: args.requirements,
      budget: args.budget,
      timeline: args.timeline,
      source: args.source,
      status: "new",
      priority: args.priority,
      value: args.value,
      probability: args.probability,
      expectedCloseDate: args.expectedCloseDate,
      notes: args.notes || [],
      assignedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log the action
    await logAction(ctx, {
      tenantId: "platform",
      actorId: reseller.userId,
      actorEmail: reseller.email,
      action: "crm.lead_created" as any,
      entityType: "lead",
      entityId: String(leadDocId),
      after: { leadId, schoolName: args.schoolName, contactName: args.contactName },
    });

    return { success: true, leadId, leadDocId };
  },
});

export const updateLead = mutation({
  args: {
    leadId: v.string(),
    status: v.optional(v.union(
      v.literal("new"),
      v.literal("contacted"),
      v.literal("qualified"),
      v.literal("proposal_sent"),
      v.literal("negotiation"),
      v.literal("closed_won"),
      v.literal("closed_lost")
    )),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    value: v.optional(v.number()),
    probability: v.optional(v.number()),
    expectedCloseDate: v.optional(v.number()),
    notes: v.optional(v.array(v.string())),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    budget: v.optional(v.string()),
    timeline: v.optional(v.union(v.literal("immediate"), v.literal("1_month"), v.literal("3_months"), v.literal("6_months"), v.literal("exploring"))),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);

    // Get the lead
    const lead = await ctx.db
      .query("resellerLeads")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .filter(q => q.eq(q.field("leadId"), args.leadId))
      .first();

    if (!lead) {
      throw new Error("Lead not found");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.status) {
      updates.status = args.status;
      
      // Set timestamps for status changes
      switch (args.status) {
        case "contacted":
          updates.contactedAt = Date.now();
          break;
        case "qualified":
          updates.qualifiedAt = Date.now();
          break;
        case "proposal_sent":
          updates.proposalSentAt = Date.now();
          break;
        case "closed_won":
        case "closed_lost":
          updates.closedAt = Date.now();
          break;
      }
    }

    if (args.priority) updates.priority = args.priority;
    if (args.value !== undefined) updates.value = args.value;
    if (args.probability !== undefined) updates.probability = args.probability;
    if (args.expectedCloseDate !== undefined) updates.expectedCloseDate = args.expectedCloseDate;
    if (args.notes) updates.notes = args.notes;
    if (args.contactName) updates.contactName = args.contactName;
    if (args.contactEmail) updates.contactEmail = args.contactEmail;
    if (args.contactPhone) updates.contactPhone = args.contactPhone;
    if (args.budget) updates.budget = args.budget;
    if (args.timeline) updates.timeline = args.timeline;

    const before = { ...lead };
    const after = { ...lead, ...updates };

    await ctx.db.patch(lead._id, updates);

    // Log the action
    await logAction(ctx, {
      tenantId: "platform",
      actorId: reseller.userId,
      actorEmail: reseller.email,
      action: "crm.lead_updated" as any,
      entityType: "lead",
      entityId: String(lead._id),
      before,
      after,
    });

    return { success: true };
  },
});

export const addLeadNote = mutation({
  args: {
    leadId: v.string(),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);

    // Get the lead
    const lead = await ctx.db
      .query("resellerLeads")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .filter(q => q.eq(q.field("leadId"), args.leadId))
      .first();

    if (!lead) {
      throw new Error("Lead not found");
    }

    const updatedNotes = [...(lead.notes || []), args.note];

    await ctx.db.patch(lead._id, {
      notes: updatedNotes,
      updatedAt: Date.now(),
    });

    // Log the action
    await logAction(ctx, {
      tenantId: "platform",
      actorId: reseller.userId,
      actorEmail: reseller.email,
      action: "crm.activity_added" as any,
      entityType: "lead",
      entityId: String(lead._id),
      after: { leadId: args.leadId, note: args.note },
    });

    return { success: true };
  },
});

export const deleteLead = mutation({
  args: {
    leadId: v.string(),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);

    // Get the lead
    const lead = await ctx.db
      .query("resellerLeads")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .filter(q => q.eq(q.field("leadId"), args.leadId))
      .first();

    if (!lead) {
      throw new Error("Lead not found");
    }

    const before = { ...lead };

    await ctx.db.delete(lead._id);

    // Log the action
    await logAction(ctx, {
      tenantId: "platform",
      actorId: reseller.userId,
      actorEmail: reseller.email,
      action: "crm.lead_updated" as any,
      entityType: "lead",
      entityId: String(lead._id),
      before,
    });

    return { success: true };
  },
});

export const convertLeadToSchool = mutation({
  args: {
    leadId: v.string(),
    tenantId: v.string(), // The actual tenant ID from the system
    subscriptionPlan: v.string(),
    subscriptionValue: v.number(),
    commissionRate: v.number(),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);

    // Get the lead
    const lead = await ctx.db
      .query("resellerLeads")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .filter(q => q.eq(q.field("leadId"), args.leadId))
      .first();

    if (!lead) {
      throw new Error("Lead not found");
    }

    // Check creation limits
    const currentSchools = await ctx.db
      .query("resellerSchools")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .collect();

    requireCreationLimit(reseller.reseller, currentSchools.length);

    // Create school record
    const schoolId = await ctx.db.insert("resellerSchools", {
      resellerId: reseller.resellerId,
      schoolId: args.tenantId,
      schoolName: lead.schoolName,
      schoolEmail: lead.contactEmail,
      schoolPhone: lead.contactPhone,
      status: "converted",
      source: lead.source,
      assignedAt: lead.assignedAt,
      convertedAt: Date.now(),
      subscriptionPlan: args.subscriptionPlan,
      subscriptionValue: args.subscriptionValue,
      commissionRate: args.commissionRate,
      commissionEarned: 0,
      notes: lead.notes || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update lead status
    await ctx.db.patch(lead._id, {
      status: "closed_won",
      closedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create commission record
    const commissionId = `COMM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const holdDays = reseller.reseller.commission.holdDays;
    const availableAt = Date.now() + (holdDays * 24 * 60 * 60 * 1000);

    await ctx.db.insert("resellerCommissions", {
      resellerId: reseller.resellerId,
      commissionId,
      sourceId: args.tenantId,
      sourceType: "school",
      type: "subscription",
      amount: args.subscriptionValue * (args.commissionRate / 100),
      rate: args.commissionRate,
      currency: "KES",
      status: "held",
      earnedAt: Date.now(),
      availableAt,
      description: `Commission for ${lead.schoolName} subscription (${args.subscriptionPlan})`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log the action
    await logAction(ctx, {
      tenantId: "platform",
      actorId: reseller.userId,
      actorEmail: reseller.email,
      action: "crm.lead_updated" as any,
      entityType: "school",
      entityId: String(schoolId),
      after: { 
        leadId: args.leadId, 
        tenantId: args.tenantId, 
        subscriptionPlan: args.subscriptionPlan 
      },
    });

    return { success: true, schoolId };
  },
});
