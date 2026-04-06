import { internal } from "../../_generated/api";
import { mutation, query } from "../../_generated/server";
import { ConvexError, v } from "convex/values";
import { logAction } from "../../helpers/auditLog";
import { generateTenantId } from "../../helpers/idGenerator";
import { requirePlatformRole } from "../../helpers/platformGuard";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { CORE_MODULE_IDS } from "../marketplace/moduleDefinitions";

const tenantPlanValidator = v.union(
  v.literal("starter"),
  v.literal("standard"),
  v.literal("pro"),
  v.literal("enterprise")
);

function buildDefaultOnboardingSteps() {
  return {
    schoolProfile: { completed: true, completedAt: Date.now(), count: 1 },
    rolesConfigured: { completed: false, completedAt: undefined, count: undefined },
    staffAdded: { completed: false, completedAt: undefined, count: undefined },
    studentsAdded: { completed: false, completedAt: undefined, count: undefined },
    classesCreated: { completed: false, completedAt: undefined, count: undefined },
    modulesConfigured: { completed: false, completedAt: undefined, count: undefined },
    portalCustomized: { completed: false, completedAt: undefined, count: undefined },
    parentsInvited: { completed: false, completedAt: undefined, count: undefined },
    firstPaymentProcessed: { completed: false, completedAt: undefined, count: undefined },
  };
}

async function getLeadRecord(ctx: any, leadId: string) {
  const lead = await ctx.db.get(leadId as any);
  if (!lead) {
    throw new ConvexError({ code: "NOT_FOUND", message: "Lead not found" });
  }
  return lead;
}

async function getDealRecord(ctx: any, dealId: string) {
  const deal = await ctx.db.get(dealId as any);
  if (!deal) {
    throw new ConvexError({ code: "NOT_FOUND", message: "Deal not found" });
  }
  return deal;
}

async function getProposalRecord(ctx: any, proposalId: string) {
  const proposal = await ctx.db.get(proposalId as any);
  if (!proposal) {
    throw new ConvexError({ code: "NOT_FOUND", message: "Proposal not found" });
  }
  return proposal;
}

async function resolvePlanId(ctx: any, planId?: string) {
  if (planId) return planId;

  const defaultPlan = await ctx.db
    .query("subscription_plans")
    .withIndex("by_isDefault", (q: any) => q.eq("isDefault", true))
    .first();

  if (!defaultPlan) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "No default subscription plan is configured",
    });
  }

  return String(defaultPlan._id);
}

export const getLeads = query({
  args: {
    sessionToken: v.string(),
    stage: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformRole(ctx, args, [
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    let leads = await ctx.db.query("crm_leads").collect();

    if (args.stage) leads = leads.filter((lead) => lead.stage === args.stage);
    if (args.status) leads = leads.filter((lead) => lead.status === args.status);

    return leads.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getLead = query({
  args: {
    sessionToken: v.string(),
    leadId: v.id("crm_leads"),
  },
  handler: async (ctx, args) => {
    await requirePlatformRole(ctx, args, [
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    return await ctx.db.get(args.leadId);
  },
});

export const createLead = mutation({
  args: {
    sessionToken: v.string(),
    schoolName: v.string(),
    contactName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    country: v.string(),
    studentCount: v.optional(v.number()),
    source: v.optional(v.string()),
    timeline: v.optional(v.string()),
    decisionMaker: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    const now = Date.now();

    const leadId = await ctx.db.insert("crm_leads", {
      schoolName: args.schoolName,
      contactName: args.contactName,
      email: args.email,
      phone: args.phone,
      country: args.country,
      studentCount: args.studentCount,
      budgetConfirmed: undefined,
      timeline: args.timeline,
      decisionMaker: args.decisionMaker,
      source: args.source,
      qualificationScore: 0,
      stage: "new",
      assignedTo: platform.userId,
      dealValueKes: undefined,
      expectedClose: undefined,
      tenantId: undefined,
      notes: args.notes,
      status: "open",
      createdAt: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "crm.lead_created",
      entityType: "crm_lead",
      entityId: String(leadId),
      after: { schoolName: args.schoolName, email: args.email },
    });

    return { success: true, leadId };
  },
});

export const updateLeadStage = mutation({
  args: {
    sessionToken: v.string(),
    leadId: v.id("crm_leads"),
    stage: v.string(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    const lead = await ctx.db.get(args.leadId);

    if (!lead) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Lead not found" });
    }

    await ctx.db.patch(args.leadId, {
      stage: args.stage,
      status: args.status ?? lead.status,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "crm.lead_updated",
      entityType: "crm_lead",
      entityId: String(args.leadId),
      after: { stage: args.stage, status: args.status ?? lead.status },
    });

    return { success: true };
  },
});

export const updateLeadQualification = mutation({
  args: {
    sessionToken: v.string(),
    leadId: v.id("crm_leads"),
    qualificationScore: v.number(),
    budgetConfirmed: v.optional(v.boolean()),
    dealValueKes: v.optional(v.number()),
    expectedClose: v.optional(v.number()),
    assignedTo: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    const lead = await ctx.db.get(args.leadId);

    if (!lead) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Lead not found" });
    }

    await ctx.db.patch(args.leadId, {
      qualificationScore: args.qualificationScore,
      budgetConfirmed: args.budgetConfirmed ?? lead.budgetConfirmed,
      dealValueKes: args.dealValueKes ?? lead.dealValueKes,
      expectedClose: args.expectedClose ?? lead.expectedClose,
      assignedTo: args.assignedTo ?? lead.assignedTo,
      notes: args.notes ?? lead.notes,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "crm.lead_updated",
      entityType: "crm_lead",
      entityId: String(args.leadId),
      after: { qualificationScore: args.qualificationScore, dealValueKes: args.dealValueKes },
    });

    return { success: true };
  },
});

export const getDeals = query({
  args: {
    sessionToken: v.string(),
    stage: v.optional(v.string()),
    status: v.optional(v.union(v.literal("open"), v.literal("won"), v.literal("lost"))),
  },
  handler: async (ctx, args) => {
    await requirePlatformRole(ctx, args, [
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    let deals = await ctx.db.query("crm_deals").collect();

    if (args.stage) deals = deals.filter((deal) => deal.stage === args.stage);
    if (args.status) deals = deals.filter((deal) => deal.status === args.status);

    return deals.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getDeal = query({
  args: {
    sessionToken: v.string(),
    dealId: v.id("crm_deals"),
  },
  handler: async (ctx, args) => {
    await requirePlatformRole(ctx, args, [
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    const deal = await ctx.db.get(args.dealId);
    if (!deal) {
      return null;
    }

    const lead = await getLeadRecord(ctx, deal.leadId);
    const proposal = deal.proposalId ? await ctx.db.get(deal.proposalId as any) : null;

    return {
      ...deal,
      lead,
      proposal,
    };
  },
});

export const createDeal = mutation({
  args: {
    sessionToken: v.string(),
    leadId: v.id("crm_leads"),
    valueKes: v.number(),
    stage: v.string(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    const lead = await ctx.db.get(args.leadId);

    if (!lead) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Lead not found" });
    }

    const now = Date.now();
    const dealId = await ctx.db.insert("crm_deals", {
      leadId: String(args.leadId),
      tenantId: lead.tenantId,
      valueKes: args.valueKes,
      stage: args.stage,
      proposalId: undefined,
      closedAt: undefined,
      status: "open",
      lossReason: undefined,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.leadId, {
      stage: "qualified",
      dealValueKes: args.valueKes,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "crm.deal_created",
      entityType: "crm_deal",
      entityId: String(dealId),
      after: { leadId: String(args.leadId), valueKes: args.valueKes, stage: args.stage },
    });

    return { success: true, dealId };
  },
});

export const updateDealStage = mutation({
  args: {
    sessionToken: v.string(),
    dealId: v.id("crm_deals"),
    stage: v.string(),
    status: v.union(v.literal("open"), v.literal("won"), v.literal("lost")),
    lossReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    const deal = await ctx.db.get(args.dealId);

    if (!deal) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Deal not found" });
    }

    await ctx.db.patch(args.dealId, {
      stage: args.stage,
      status: args.status,
      lossReason: args.lossReason,
      closedAt: args.status === "open" ? undefined : Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "crm.deal_updated",
      entityType: "crm_deal",
      entityId: String(args.dealId),
      after: { stage: args.stage, status: args.status, lossReason: args.lossReason },
    });

    return { success: true };
  },
});

export const createProposal = mutation({
  args: {
    sessionToken: v.string(),
    dealId: v.id("crm_deals"),
    planId: v.optional(v.string()),
    customItems: v.optional(
      v.array(
        v.object({
          description: v.string(),
          amountKes: v.number(),
          quantity: v.optional(v.number()),
        })
      )
    ),
    totalKes: v.number(),
    validUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    const deal = await ctx.db.get(args.dealId);

    if (!deal) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Deal not found" });
    }

    const now = Date.now();
    const proposalId = await ctx.db.insert("crm_proposals", {
      dealId: String(args.dealId),
      tenantId: deal.tenantId,
      planId: args.planId,
      customItems: args.customItems,
      totalKes: args.totalKes,
      status: "draft",
      sentAt: undefined,
      acceptedAt: undefined,
      validUntil: args.validUntil,
      pdfUrl: undefined,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.dealId, {
      proposalId: String(proposalId),
      stage: "proposal",
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "crm.proposal_created",
      entityType: "crm_proposal",
      entityId: String(proposalId),
      after: { dealId: String(args.dealId), totalKes: args.totalKes },
    });

    return { success: true, proposalId };
  },
});

export const getProposals = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("sent"),
        v.literal("accepted"),
        v.literal("rejected")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requirePlatformRole(ctx, args, [
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);

    let proposals = await ctx.db.query("crm_proposals").collect();
    if (args.status) {
      proposals = proposals.filter((proposal) => proposal.status === args.status);
    }

    return await Promise.all(
      proposals
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map(async (proposal) => {
          const deal = await getDealRecord(ctx, proposal.dealId);
          const lead = await getLeadRecord(ctx, deal.leadId);
          return {
            ...proposal,
            deal,
            lead,
          };
        })
    );
  },
});

export const getProposal = query({
  args: {
    sessionToken: v.string(),
    proposalId: v.id("crm_proposals"),
  },
  handler: async (ctx, args) => {
    await requirePlatformRole(ctx, args, [
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      return null;
    }

    const deal = await getDealRecord(ctx, proposal.dealId);
    const lead = await getLeadRecord(ctx, deal.leadId);
    const plan = proposal.planId
      ? await ctx.db
          .query("subscription_plans")
          .withIndex("by_name", (q: any) => q.eq("name", proposal.planId))
          .first()
      : null;

    return {
      ...proposal,
      deal,
      lead,
      plan,
    };
  },
});

export const sendProposal = mutation({
  args: {
    sessionToken: v.string(),
    proposalId: v.id("crm_proposals"),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    const proposal = await ctx.db.get(args.proposalId);

    if (!proposal) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Proposal not found" });
    }

    const deal = await getDealRecord(ctx, proposal.dealId);
    const lead = await getLeadRecord(ctx, deal.leadId);
    const now = Date.now();

    await ctx.db.patch(args.proposalId, {
      status: "sent",
      sentAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.actions.communications.email.sendEmailInternal, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      to: [lead.email],
      subject: `EduMyles proposal for ${lead.schoolName}`,
      html: `<p>Hello ${lead.contactName},</p><p>Your proposal for ${lead.schoolName} is ready.</p><p>Total: KES ${proposal.totalKes.toLocaleString()}</p>`,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "crm.proposal_sent",
      entityType: "crm_proposal",
      entityId: String(args.proposalId),
      after: { status: "sent", sentAt: now },
    });

    return { success: true };
  },
});

export const acceptProposal = mutation({
  args: {
    proposalId: v.id("crm_proposals"),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    const proposal = await ctx.db.get(args.proposalId);

    if (!proposal) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Proposal not found" });
    }

    await ctx.db.patch(args.proposalId, {
      tenantId: tenant.tenantId,
      status: "accepted",
      acceptedAt: Date.now(),
      updatedAt: Date.now(),
    });

    const deal = await getDealRecord(ctx, proposal.dealId);
    await ctx.db.patch(deal._id, {
      tenantId: tenant.tenantId,
      status: "won",
      stage: "accepted",
      closedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const convertDealToTenant = mutation({
  args: {
    sessionToken: v.string(),
    dealId: v.id("crm_deals"),
    subdomain: v.string(),
    plan: tenantPlanValidator,
    planId: v.optional(v.string()),
    phone: v.optional(v.string()),
    county: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    const deal = await ctx.db.get(args.dealId);

    if (!deal) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Deal not found" });
    }

    const lead = await getLeadRecord(ctx, deal.leadId);
    if (deal.tenantId || lead.tenantId) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "This deal has already been converted into a tenant",
      });
    }

    const existing = await ctx.db
      .query("tenants")
      .withIndex("by_subdomain", (q) => q.eq("subdomain", args.subdomain))
      .first();
    if (existing) {
      throw new ConvexError({
        code: "CONFLICT",
        message: `Subdomain '${args.subdomain}' is already taken`,
      });
    }

    const now = Date.now();
    const tenantId = generateTenantId();
    const subscriptionPlanId = await resolvePlanId(ctx, args.planId);

    const tenantDocId = await ctx.db.insert("tenants", {
      tenantId,
      name: lead.schoolName,
      subdomain: args.subdomain,
      email: lead.email,
      phone: args.phone ?? lead.phone ?? "",
      plan: args.plan,
      status: "trial",
      county: args.county ?? "Nairobi",
      country: args.country ?? lead.country ?? "KE",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("organizations", {
      tenantId,
      workosOrgId: `edumyles-${tenantId}`,
      name: lead.schoolName,
      subdomain: args.subdomain,
      tier: args.plan,
      isActive: true,
      createdAt: now,
    });

    for (const moduleId of CORE_MODULE_IDS) {
      await ctx.db.insert("installedModules", {
        tenantId,
        moduleId,
        installedAt: now,
        installedBy: platform.userId,
        config: {},
        status: "active",
        updatedAt: now,
      });
    }

    await ctx.db.insert("tenant_subscriptions", {
      tenantId,
      planId: subscriptionPlanId,
      status: "trialing",
      currentPeriodStart: now,
      currentPeriodEnd: now + 14 * 24 * 60 * 60 * 1000,
      cancelAtPeriodEnd: false,
      studentCountAtBilling: lead.studentCount,
      paymentProvider: undefined,
      paymentReference: undefined,
      customPriceMonthlyKes: undefined,
      customPriceAnnualKes: undefined,
      customPricingNotes: undefined,
      nextPaymentDue: undefined,
      trialEndsAt: now + 14 * 24 * 60 * 60 * 1000,
      cancelledAt: undefined,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("tenant_onboarding", {
      tenantId,
      wizardCompleted: false,
      wizardCompletedAt: undefined,
      steps: buildDefaultOnboardingSteps(),
      healthScore: 6,
      lastActivityAt: now,
      stalled: false,
      assignedAccountManager: platform.userId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.dealId, {
      tenantId,
      status: "won",
      stage: "converted",
      closedAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(lead._id, {
      tenantId,
      status: "converted",
      stage: "won",
      updatedAt: now,
    });

    if (deal.proposalId) {
      const proposal = await getProposalRecord(ctx, deal.proposalId);
      await ctx.db.patch(proposal._id, {
        tenantId,
        status: proposal.status === "draft" ? "accepted" : proposal.status,
        acceptedAt: proposal.status === "draft" ? now : proposal.acceptedAt,
        updatedAt: now,
      });
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "tenant.created",
      entityType: "tenant",
      entityId: tenantId,
      after: { leadId: String(lead._id), dealId: String(args.dealId), subdomain: args.subdomain },
    });

    return { success: true, tenantDocId, tenantId };
  },
});
