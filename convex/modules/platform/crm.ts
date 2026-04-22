import { ConvexError, v } from "convex/values";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { internalMutation, mutation, query } from "../../_generated/server";
import { logAction } from "../../helpers/auditLog";
import { requireRole } from "../../helpers/authorize";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { hasPermission, requirePermission } from "./rbac";

const PLATFORM_TENANT_ID = "PLATFORM";
const FOLLOW_UP_DAY_MS = 24 * 60 * 60 * 1000;
const PROPOSAL_VALIDITY_MS = 7 * FOLLOW_UP_DAY_MS;

const leadSortValidator = v.union(
  v.literal("created_desc"),
  v.literal("value_desc"),
  v.literal("follow_up_asc"),
  v.literal("updated_desc")
);

const followUpPriorityValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high")
);

const shareAccessValidator = v.union(v.literal("view"), v.literal("edit"));

const billingPeriodValidator = v.union(
  v.literal("monthly"),
  v.literal("termly"),
  v.literal("annual")
);

const proposalStatusValidator = v.union(
  v.literal("draft"),
  v.literal("sent"),
  v.literal("viewed"),
  v.literal("accepted"),
  v.literal("rejected"),
  v.literal("expired")
);

function sanitizeHtml(value?: string) {
  if (!value) return undefined;
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

function normalizeString(value?: string) {
  const normalized = sanitizeHtml(value?.trim() || undefined);
  return normalized && normalized.length > 0 ? normalized : undefined;
}

function splitName(name?: string): { firstName: string; lastName: string } {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return { firstName: "EduMyles", lastName: "Lead" };
  const [firstName, ...rest] = trimmed.split(/\s+/);
  return {
    firstName: firstName ?? "EduMyles",
    lastName: rest.join(" ") || "Lead",
  };
}

function formatKes(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function uniqueStrings(values: Array<string | undefined | null>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function calculateQualificationScore(args: {
  studentCount?: number;
  dealValueKes?: number;
  sourceType?: string;
  timeline?: string;
  decisionMaker?: string;
  tags?: string[];
}) {
  let score = 25;

  const studentCount = args.studentCount ?? 0;
  if (studentCount >= 1000) score += 22;
  else if (studentCount >= 500) score += 18;
  else if (studentCount >= 250) score += 12;
  else if (studentCount >= 100) score += 8;

  const dealValueKes = args.dealValueKes ?? 0;
  if (dealValueKes >= 500_000) score += 18;
  else if (dealValueKes >= 250_000) score += 12;
  else if (dealValueKes >= 100_000) score += 8;

  const timeline = (args.timeline ?? "").toLowerCase();
  if (/(this week|immediately|urgent|asap|this month|30 day)/.test(timeline)) score += 12;
  else if (/(quarter|term|60 day|next month)/.test(timeline)) score += 6;

  const decisionMaker = (args.decisionMaker ?? "").toLowerCase();
  if (/(owner|principal|director|head|administrator|bursar)/.test(decisionMaker)) score += 10;

  const sourceType = (args.sourceType ?? "").toLowerCase();
  if (/(referral|partner|reseller|waitlist)/.test(sourceType)) score += 8;
  else if (/(event|demo|inbound)/.test(sourceType)) score += 5;

  const tags = args.tags ?? [];
  if (tags.includes("high_value")) score += 5;
  if (tags.includes("urgent")) score += 4;

  return Math.max(0, Math.min(100, score));
}

async function insertNotification(ctx: any, params: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}) {
  await ctx.db.insert("notifications", {
    tenantId: PLATFORM_TENANT_ID,
    userId: params.userId,
    title: params.title,
    message: params.message,
    type: params.type ?? "crm",
    isRead: false,
    link: params.link,
    createdAt: Date.now(),
  });
}

async function getPlatformUserName(ctx: any, userId?: string) {
  if (!userId) return undefined;

  const userProfile =
    (await ctx.db
      .query("users")
      .withIndex("by_workos_user", (q: any) => q.eq("workosUserId", userId))
      .first()) ??
    (await ctx.db
      .query("users")
      .withIndex("by_user_id", (q: any) => q.eq("eduMylesUserId", userId))
      .first());

  if (userProfile) {
    const fullName = [userProfile.firstName, userProfile.lastName].filter(Boolean).join(" ").trim();
    return fullName || userProfile.email || userId;
  }

  const platformUser = await ctx.db
    .query("platform_users")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();

  return platformUser?.department ? `${platformUser.department} · ${platformUser.role}` : userId;
}

async function getAccessibleLeadEntries(ctx: any, userId: string, permissions: string[]) {
  const includeAll = hasPermission(permissions, "crm.view_all");
  const includeOwn = hasPermission(permissions, "crm.view_own") || includeAll;
  const includeShared = hasPermission(permissions, "crm.view_shared") || includeAll;
  const leadMap = new Map<string, { lead: any; accessLevel: "owner" | "assignee" | "shared_view" | "shared_edit" | "all" }>();

  const addLead = (lead: any, accessLevel: "owner" | "assignee" | "shared_view" | "shared_edit" | "all") => {
    if (!lead || lead.isDeleted) return;
    const key = String(lead._id);
    const current = leadMap.get(key);
    const rank = { shared_view: 1, assignee: 2, shared_edit: 3, owner: 4, all: 5 } as const;
    if (!current || rank[accessLevel] > rank[current.accessLevel]) {
      leadMap.set(key, { lead, accessLevel });
    }
  };

  if (includeAll) {
    const leads = await ctx.db.query("crm_leads").withIndex("by_createdAt").collect();
    for (const lead of leads) addLead(lead, "all");
    return leadMap;
  }

  if (includeOwn) {
    const [owned, assigned] = await Promise.all([
      ctx.db.query("crm_leads").withIndex("by_ownerId", (q: any) => q.eq("ownerId", userId)).collect(),
      ctx.db.query("crm_leads").withIndex("by_assignedTo", (q: any) => q.eq("assignedTo", userId)).collect(),
    ]);

    for (const lead of owned) addLead(lead, "owner");
    for (const lead of assigned) addLead(lead, lead.ownerId === userId ? "owner" : "assignee");
  }

  if (includeShared) {
    const shares = await ctx.db
      .query("crm_lead_shares")
      .withIndex("by_sharedWithUserId", (q: any) => q.eq("sharedWithUserId", userId))
      .collect();

    for (const share of shares) {
      if (share.expiresAt && share.expiresAt < Date.now()) continue;
      const lead = await ctx.db.get(share.leadId);
      addLead(lead, share.accessLevel === "edit" ? "shared_edit" : "shared_view");
    }
  }

  return leadMap;
}

async function getLeadsForUser(ctx: any, userId: string, permissions: string[]) {
  const entries = await getAccessibleLeadEntries(ctx, userId, permissions);
  return [...entries.values()].map((entry) => entry.lead);
}

async function getLeadAccess(ctx: any, leadId: any, userId: string, permissions: string[]) {
  const entries = await getAccessibleLeadEntries(ctx, userId, permissions);
  const access = entries.get(String(leadId));
  if (!access) {
    throw new ConvexError({ code: "FORBIDDEN", message: "You do not have access to this lead" });
  }
  return access;
}

async function buildLeadSummary(ctx: any, lead: any) {
  const [ownerName, assignedToName] = await Promise.all([
    getPlatformUserName(ctx, lead.ownerId),
    getPlatformUserName(ctx, lead.assignedTo),
  ]);

  return {
    ...lead,
    ownerName,
    assignedToName,
  };
}

async function ensureLeadEditable(ctx: any, leadId: any, userId: string, permissions: string[]) {
  const access = await getLeadAccess(ctx, leadId, userId, permissions);
  if (hasPermission(permissions, "crm.edit_any_lead")) return access.lead;

  const canEdit =
    access.accessLevel === "owner" ||
    access.accessLevel === "all" ||
    access.accessLevel === "shared_edit";

  if (!canEdit) {
    throw new ConvexError({ code: "FORBIDDEN", message: "You do not have permission to edit this lead" });
  }

  return access.lead;
}

async function createActivityRecord(
  ctx: any,
  params: {
    leadId: any;
    userId: string;
    type: string;
    subject?: string;
    body?: string;
    isPrivate?: boolean;
    scheduledAt?: number;
    completedAt?: number;
    metadata?: any;
    outcome?: string;
    durationMinutes?: number;
  }
) {
  const now = Date.now();
  return await ctx.db.insert("crm_activities", {
    leadId: params.leadId,
    createdByUserId: params.userId,
    type: params.type,
    subject: normalizeString(params.subject),
    body: normalizeString(params.body),
    isPrivate: params.isPrivate ?? false,
    scheduledAt: params.scheduledAt,
    completedAt: params.completedAt,
    metadata: params.metadata,
    outcome: normalizeString(params.outcome),
    durationMinutes: params.durationMinutes,
    createdAt: now,
    updatedAt: now,
  });
}

async function syncLeadNextFollowUp(ctx: any, leadId: any) {
  const pending = (
    await ctx.db.query("crm_follow_ups").withIndex("by_leadId", (q: any) => q.eq("leadId", leadId)).collect()
  )
    .filter((item: any) => !item.completedAt)
    .sort((a: any, b: any) => a.dueAt - b.dueAt);

  await ctx.db.patch(leadId, {
    nextFollowUpAt: pending[0]?.dueAt,
    nextFollowUpNote: pending[0]?.notes ?? pending[0]?.title,
    updatedAt: Date.now(),
  });
}

async function scheduleAutoFollowUpIfNeeded(ctx: any, leadId: any, stageSlug: string, assignedToUserId?: string, actorUserId?: string) {
  const stage = await ctx.db
    .query("crm_pipeline_stages")
    .withIndex("by_slug", (q: any) => q.eq("slug", stageSlug))
    .unique();

  if (!stage?.autoFollowUpDays) return;

  const now = Date.now();
  await ctx.db.insert("crm_follow_ups", {
    leadId,
    assignedToUserId: assignedToUserId ?? actorUserId ?? "",
    title: `Follow up after ${stage.name}`,
    notes: `Auto follow-up created when the lead moved to ${stage.name}.`,
    dueAt: now + stage.autoFollowUpDays * FOLLOW_UP_DAY_MS,
    priority: "medium",
    isOverdue: false,
    completedAt: undefined,
    createdAt: now,
    updatedAt: now,
  });

  await syncLeadNextFollowUp(ctx, leadId);
}

async function getPlanForProposal(ctx: any, recommendedPlan?: string) {
  if (!recommendedPlan) return null;
  return await ctx.db
    .query("subscription_plans")
    .withIndex("by_name", (q: any) => q.eq("name", recommendedPlan))
    .first();
}

function calculateProposalTotals(params: {
  plan: any | null;
  billingPeriod: "monthly" | "termly" | "annual";
  customItems?: Array<{ amountKes: number; quantity?: number }>;
}) {
  const planMonthly = params.plan?.priceMonthlyKes ?? 0;
  const planAnnual = params.plan?.priceAnnualKes ?? planMonthly * 10;
  const extras = (params.customItems ?? []).reduce(
    (sum, item) => sum + item.amountKes * Math.max(1, item.quantity ?? 1),
    0
  );

  return {
    totalMonthlyKes: planMonthly + extras,
    totalAnnualKes: planAnnual + extras,
    totalKes:
      params.billingPeriod === "annual"
        ? planAnnual + extras
        : params.billingPeriod === "termly"
          ? Math.round(planMonthly * 3 + extras)
          : planMonthly + extras,
  };
}

export const getLeads = query({
  args: {
    sessionToken: v.string(),
    stage: v.optional(v.string()),
    country: v.optional(v.string()),
    search: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    hasFollowUpDue: v.optional(v.boolean()),
    isArchived: v.optional(v.boolean()),
    sortBy: v.optional(leadSortValidator),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.view_own", args.sessionToken);
    const accessibleLeads = await getLeadsForUser(ctx, actor.userId, actor.permissions);
    const normalizedSearch = args.search?.trim().toLowerCase();

    let leads = accessibleLeads.filter((lead) => !lead.isDeleted);

    if (args.isArchived === undefined) {
      leads = leads.filter((lead) => !lead.isArchived);
    } else {
      leads = leads.filter((lead) => Boolean(lead.isArchived) === args.isArchived);
    }

    if (args.stage) leads = leads.filter((lead) => lead.stage === args.stage);
    if (args.country) leads = leads.filter((lead) => lead.country === args.country);
    if (args.tags?.length) {
      leads = leads.filter((lead) => args.tags!.every((tag) => (lead.tags ?? []).includes(tag)));
    }
    if (args.hasFollowUpDue) {
      leads = leads.filter((lead) => Boolean(lead.nextFollowUpAt && lead.nextFollowUpAt <= Date.now()));
    }
    if (normalizedSearch) {
      leads = leads.filter((lead) =>
        [lead.schoolName, lead.contactName, lead.email, lead.phone, lead.country, lead.stage, ...(lead.tags ?? [])]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch))
      );
    }

    const sortBy = args.sortBy ?? "updated_desc";
    leads.sort((a, b) => {
      switch (sortBy) {
        case "created_desc":
          return b.createdAt - a.createdAt;
        case "value_desc":
          return (b.dealValueKes ?? 0) - (a.dealValueKes ?? 0);
        case "follow_up_asc":
          return (a.nextFollowUpAt ?? Number.MAX_SAFE_INTEGER) - (b.nextFollowUpAt ?? Number.MAX_SAFE_INTEGER);
        default:
          return b.updatedAt - a.updatedAt;
      }
    });

    return await Promise.all(leads.map((lead) => buildLeadSummary(ctx, lead)));
  },
});

export const getLead = query({
  args: {
    sessionToken: v.string(),
    leadId: v.id("crm_leads"),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.view_own", args.sessionToken);
    const access = await getLeadAccess(ctx, args.leadId, actor.userId, actor.permissions);
    const lead = access.lead;

    const [contacts, activities, proposals, followUps, shares, enrichedLead] = await Promise.all([
      ctx.db.query("crm_contacts").withIndex("by_leadId", (q: any) => q.eq("leadId", args.leadId)).collect(),
      ctx.db.query("crm_activities").withIndex("by_leadId", (q: any) => q.eq("leadId", args.leadId)).collect(),
      ctx.db.query("crm_proposals").withIndex("by_leadId", (q: any) => q.eq("leadId", args.leadId)).collect(),
      ctx.db.query("crm_follow_ups").withIndex("by_leadId", (q: any) => q.eq("leadId", args.leadId)).collect(),
      ctx.db.query("crm_lead_shares").withIndex("by_leadId", (q: any) => q.eq("leadId", args.leadId)).collect(),
      buildLeadSummary(ctx, lead),
    ]);

    const createdByIds = uniqueStrings(activities.map((activity: any) => activity.createdByUserId));
    const userNames = new Map<string, string>();
    for (const userId of createdByIds) {
      userNames.set(userId, (await getPlatformUserName(ctx, userId)) ?? userId);
    }

    const canEdit =
      hasPermission(actor.permissions, "crm.edit_any_lead") ||
      access.accessLevel === "owner" ||
      access.accessLevel === "all" ||
      access.accessLevel === "shared_edit";

    return {
      lead: enrichedLead,
      contacts: contacts.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || b.updatedAt - a.updatedAt),
      activities: activities
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 50)
        .map((activity) => ({
          ...activity,
          createdByName: userNames.get(activity.createdByUserId) ?? activity.createdByUserId,
        })),
      proposals: proposals.sort((a, b) => b.updatedAt - a.updatedAt),
      followUps: followUps.sort((a, b) => a.dueAt - b.dueAt),
      shares: await Promise.all(
        shares.map(async (share) => ({
          ...share,
          sharedWithName: await getPlatformUserName(ctx, share.sharedWithUserId),
          sharedByName: await getPlatformUserName(ctx, share.sharedByUserId),
        }))
      ),
      accessLevel: access.accessLevel,
      canEdit,
    };
  },
});

export const getPipelineView = query({
  args: {
    sessionToken: v.string(),
    ownerId: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.view_own", args.sessionToken);
    const stages = await ctx.db.query("crm_pipeline_stages").withIndex("by_order").collect();
    let leads = (await getLeadsForUser(ctx, actor.userId, actor.permissions)).filter((lead) => !lead.isDeleted && !lead.isArchived);

    if (args.ownerId && hasPermission(actor.permissions, "crm.view_all")) {
      leads = leads.filter((lead) => lead.ownerId === args.ownerId);
    }
    if (args.country) leads = leads.filter((lead) => lead.country === args.country);

    const buckets = stages.map((stage) => {
      const stageLeads = leads
        .filter((lead) => lead.stage === stage.slug)
        .sort((a, b) => (b.dealValueKes ?? 0) - (a.dealValueKes ?? 0));
      return {
        stage,
        totalValueKes: stageLeads.reduce((sum, lead) => sum + (lead.dealValueKes ?? 0), 0),
        count: stageLeads.length,
        leads: stageLeads,
      };
    });

    return {
      stages: buckets,
      totalLeads: leads.length,
      totalValueKes: leads.reduce((sum, lead) => sum + (lead.dealValueKes ?? 0), 0),
    };
  },
});

export const getCRMStats = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.view_own", args.sessionToken);
    const leads = (await getLeadsForUser(ctx, actor.userId, actor.permissions)).filter((lead) => !lead.isDeleted);
    const overdueFollowUps = (
      await ctx.db.query("crm_follow_ups").withIndex("by_assignedToUserId", (q: any) => q.eq("assignedToUserId", actor.userId)).collect()
    ).filter((item) => !item.completedAt && item.dueAt < Date.now());

    const wonLeads = leads.filter((lead) => lead.stage === "won");
    const demoStages = ["demo_booked", "demo_done"];

    return {
      totalLeads: leads.filter((lead) => !lead.isArchived).length,
      inDemoStage: leads.filter((lead) => demoStages.includes(lead.stage)).length,
      pipelineValueKes: leads
        .filter((lead) => !["won", "lost"].includes(lead.stage))
        .reduce((sum, lead) => sum + (lead.dealValueKes ?? 0), 0),
      conversionRate: leads.length ? Math.round((wonLeads.length / leads.length) * 100) : 0,
      overdueFollowUps: overdueFollowUps.length,
      wonValueKes: wonLeads.reduce((sum, lead) => sum + (lead.dealValueKes ?? 0), 0),
    };
  },
});

export const getRecentActivities = query({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.view_own", args.sessionToken);
    const accessibleLeadIds = new Set(
      (await getLeadsForUser(ctx, actor.userId, actor.permissions)).map((lead) => String(lead._id))
    );
    const activities = (await ctx.db.query("crm_activities").collect())
      .filter((activity) => accessibleLeadIds.has(String(activity.leadId)))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, Math.max(1, Math.min(args.limit ?? 8, 25)));

    const [leadEntries, userNames] = await Promise.all([
      Promise.all(
        uniqueStrings(activities.map((activity) => String(activity.leadId))).map(async (leadId) => {
          const lead = await ctx.db.get(leadId as Id<"crm_leads">);
          return [leadId, lead] as const;
        })
      ),
      Promise.all(
        uniqueStrings(activities.map((activity) => activity.createdByUserId)).map(async (userId) => {
          return [userId, (await getPlatformUserName(ctx, userId)) ?? userId] as const;
        })
      ),
    ]);

    const leadsById = new Map<string, any>(leadEntries);
    const usersById = new Map(userNames);

    return activities.map((activity) => {
      const lead = leadsById.get(String(activity.leadId));
      return {
        ...activity,
        lead: lead
          ? {
              _id: lead._id,
              schoolName: lead.schoolName,
              stage: lead.stage,
            }
          : null,
        createdByName: usersById.get(activity.createdByUserId) ?? activity.createdByUserId,
      };
    });
  },
});

export const getCRMReports = query({
  args: {
    sessionToken: v.string(),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    ownerId: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.view_reports", args.sessionToken);
    let leads = (await getLeadsForUser(ctx, actor.userId, actor.permissions)).filter((lead) => !lead.isDeleted);

    if (args.dateFrom) leads = leads.filter((lead) => lead.createdAt >= args.dateFrom!);
    if (args.dateTo) leads = leads.filter((lead) => lead.createdAt <= args.dateTo!);
    if (args.ownerId && hasPermission(actor.permissions, "crm.view_all")) {
      leads = leads.filter((lead) => lead.ownerId === args.ownerId);
    }
    if (args.country) leads = leads.filter((lead) => lead.country === args.country);

    const byStage = new Map<string, number>();
    const byCountry = new Map<string, number>();
    const byOwner = new Map<string, number>();
    const monthlyCreated = new Map<string, number>();

    for (const lead of leads) {
      byStage.set(lead.stage, (byStage.get(lead.stage) ?? 0) + 1);
      byCountry.set(lead.country, (byCountry.get(lead.country) ?? 0) + 1);
      byOwner.set(lead.ownerId ?? "unassigned", (byOwner.get(lead.ownerId ?? "unassigned") ?? 0) + (lead.dealValueKes ?? 0));
      const monthKey = new Date(lead.createdAt).toISOString().slice(0, 7);
      monthlyCreated.set(monthKey, (monthlyCreated.get(monthKey) ?? 0) + 1);
    }

    const ownerLabels = new Map<string, string>();
    for (const ownerId of byOwner.keys()) {
      ownerLabels.set(ownerId, ownerId === "unassigned" ? "Unassigned" : (await getPlatformUserName(ctx, ownerId)) ?? ownerId);
    }

    return {
      totals: {
        leads: leads.length,
        pipelineValueKes: leads.reduce((sum, lead) => sum + (lead.dealValueKes ?? 0), 0),
        wonValueKes: leads.filter((lead) => lead.stage === "won").reduce((sum, lead) => sum + (lead.dealValueKes ?? 0), 0),
      },
      stageBreakdown: [...byStage.entries()].map(([name, value]) => ({ name, value })),
      countryBreakdown: [...byCountry.entries()].map(([name, value]) => ({ name, value })),
      ownerValueBreakdown: [...byOwner.entries()].map(([ownerId, value]) => ({
        ownerId,
        name: ownerLabels.get(ownerId) ?? ownerId,
        value,
      })),
      monthlyLeadCreation: [...monthlyCreated.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, value]) => ({ month, value })),
    };
  },
});

export const createLead = mutation({
  args: {
    sessionToken: v.string(),
    schoolName: v.string(),
    contactName: v.string(),
    contactEmail: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    country: v.string(),
    studentCount: v.optional(v.number()),
    source: v.optional(v.string()),
    sourceType: v.optional(v.string()),
    timeline: v.optional(v.string()),
    decisionMaker: v.optional(v.string()),
    dealValueKes: v.optional(v.number()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.create_lead", args.sessionToken);
    const now = Date.now();
    const email = normalizeString(args.contactEmail ?? args.email);
    const tags = uniqueStrings(args.tags ?? []);
    const qualificationScore = calculateQualificationScore({
      studentCount: args.studentCount,
      dealValueKes: args.dealValueKes,
      sourceType: args.sourceType ?? args.source,
      timeline: args.timeline,
      decisionMaker: args.decisionMaker,
      tags,
    });

    const stage = "new";
    const leadId = await ctx.db.insert("crm_leads", {
      schoolName: args.schoolName.trim(),
      contactName: args.contactName.trim(),
      email: email ?? "",
      phone: normalizeString(args.phone),
      country: args.country.trim(),
      studentCount: args.studentCount,
      budgetConfirmed: undefined,
      timeline: normalizeString(args.timeline),
      decisionMaker: normalizeString(args.decisionMaker),
      source: normalizeString(args.source),
      qualificationScore,
      probability: 10,
      stage,
      assignedTo: actor.userId,
      ownerId: actor.userId,
      dealValueKes: args.dealValueKes,
      expectedClose: undefined,
      tenantId: undefined,
      notes: normalizeString(args.notes),
      status: "open",
      sourceType: normalizeString(args.sourceType ?? args.source),
      isArchived: false,
      isDeleted: false,
      tags,
      lastContactedAt: undefined,
      nextFollowUpAt: undefined,
      nextFollowUpNote: undefined,
      createdAt: now,
      updatedAt: now,
    });

    await createActivityRecord(ctx, {
      leadId,
      userId: actor.userId,
      type: "system",
      subject: "Lead created",
      body: `${args.schoolName.trim()} was added to the CRM pipeline.`,
      metadata: { qualificationScore },
    });

    await scheduleAutoFollowUpIfNeeded(ctx, leadId, stage, actor.userId, actor.userId);

    await logAction(ctx, {
      tenantId: PLATFORM_TENANT_ID,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "crm.lead_created",
      entityType: "crm_lead",
      entityId: String(leadId),
      after: { schoolName: args.schoolName, email, qualificationScore },
    });

    return { leadId };
  },
});

export const updateLead = mutation({
  args: {
    sessionToken: v.string(),
    leadId: v.id("crm_leads"),
    schoolName: v.optional(v.string()),
    contactName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    country: v.optional(v.string()),
    studentCount: v.optional(v.number()),
    source: v.optional(v.string()),
    sourceType: v.optional(v.string()),
    timeline: v.optional(v.string()),
    decisionMaker: v.optional(v.string()),
    dealValueKes: v.optional(v.number()),
    probability: v.optional(v.number()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.edit_own_lead", args.sessionToken);
    const lead = await ensureLeadEditable(ctx, args.leadId, actor.userId, actor.permissions);

    const patch: Record<string, any> = { updatedAt: Date.now() };
    if (args.schoolName !== undefined) patch.schoolName = args.schoolName.trim();
    if (args.contactName !== undefined) patch.contactName = args.contactName.trim();
    if (args.email !== undefined) patch.email = normalizeString(args.email) ?? "";
    if (args.phone !== undefined) patch.phone = normalizeString(args.phone);
    if (args.country !== undefined) patch.country = args.country.trim();
    if (args.studentCount !== undefined) patch.studentCount = args.studentCount;
    if (args.source !== undefined) patch.source = normalizeString(args.source);
    if (args.sourceType !== undefined) patch.sourceType = normalizeString(args.sourceType);
    if (args.timeline !== undefined) patch.timeline = normalizeString(args.timeline);
    if (args.decisionMaker !== undefined) patch.decisionMaker = normalizeString(args.decisionMaker);
    if (args.dealValueKes !== undefined) patch.dealValueKes = args.dealValueKes;
    if (args.probability !== undefined) patch.probability = args.probability;
    if (args.notes !== undefined) patch.notes = normalizeString(args.notes);
    if (args.tags !== undefined) patch.tags = uniqueStrings(args.tags);
    if (args.isArchived !== undefined) patch.isArchived = args.isArchived;

    patch.qualificationScore = calculateQualificationScore({
      studentCount: patch.studentCount ?? lead.studentCount,
      dealValueKes: patch.dealValueKes ?? lead.dealValueKes,
      sourceType: patch.sourceType ?? lead.sourceType,
      timeline: patch.timeline ?? lead.timeline,
      decisionMaker: patch.decisionMaker ?? lead.decisionMaker,
      tags: patch.tags ?? lead.tags,
    });

    await ctx.db.patch(args.leadId, patch);

    await logAction(ctx, {
      tenantId: PLATFORM_TENANT_ID,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "crm.lead_updated",
      entityType: "crm_lead",
      entityId: String(args.leadId),
      before: lead,
      after: patch,
    });

    return { success: true };
  },
});

export const changeLeadStage = mutation({
  args: {
    sessionToken: v.string(),
    leadId: v.id("crm_leads"),
    newStage: v.string(),
    note: v.optional(v.string()),
    lostReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.edit_own_lead", args.sessionToken);
    const lead = await ensureLeadEditable(ctx, args.leadId, actor.userId, actor.permissions);
    const stage = await ctx.db
      .query("crm_pipeline_stages")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.newStage))
      .unique();

    if (!stage) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Pipeline stage not found" });
    }
    if (stage.requiresNote && !normalizeString(args.note)) {
      throw new ConvexError({ code: "VALIDATION_ERROR", message: `${stage.name} requires a note before moving the lead.` });
    }

    const patch = {
      stage: args.newStage,
      status: stage.isWon ? "won" : stage.isLost ? "lost" : "open",
      probability: stage.probabilityDefault,
      updatedAt: Date.now(),
    };

    await ctx.db.patch(args.leadId, patch);

    await createActivityRecord(ctx, {
      leadId: args.leadId,
      userId: actor.userId,
      type: "stage_change",
      subject: `Moved to ${stage.name}`,
      body: normalizeString(args.note ?? args.lostReason),
      metadata: { previousStage: lead.stage, newStage: args.newStage, lostReason: normalizeString(args.lostReason) },
    });

    await scheduleAutoFollowUpIfNeeded(ctx, args.leadId, args.newStage, lead.assignedTo, actor.userId);

    await logAction(ctx, {
      tenantId: PLATFORM_TENANT_ID,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "crm.lead_updated",
      entityType: "crm_lead",
      entityId: String(args.leadId),
      before: { stage: lead.stage, status: lead.status },
      after: patch,
    });

    return { success: true };
  },
});

export const assignLead = mutation({
  args: {
    sessionToken: v.string(),
    leadId: v.id("crm_leads"),
    assignedToId: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.assign_lead", args.sessionToken);
    const access = await getLeadAccess(ctx, args.leadId, actor.userId, actor.permissions);
    const lead = access.lead;

    await ctx.db.patch(args.leadId, {
      assignedTo: args.assignedToId,
      updatedAt: Date.now(),
    });

    await createActivityRecord(ctx, {
      leadId: args.leadId,
      userId: actor.userId,
      type: "assignment_change",
      subject: "Lead assignment updated",
      body: normalizeString(args.note),
      metadata: { previousAssignedTo: lead.assignedTo, assignedTo: args.assignedToId },
    });

    if (args.assignedToId && args.assignedToId !== actor.userId) {
      await insertNotification(ctx, {
        userId: args.assignedToId,
        title: "CRM lead assigned",
        message: `${lead.schoolName} has been assigned to you.`,
        link: `/platform/crm/${String(args.leadId)}`,
      });
    }

    await logAction(ctx, {
      tenantId: PLATFORM_TENANT_ID,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "crm.lead_updated",
      entityType: "crm_lead",
      entityId: String(args.leadId),
      before: { assignedTo: lead.assignedTo },
      after: { assignedTo: args.assignedToId },
    });

    return { success: true };
  },
});

export const shareLead = mutation({
  args: {
    sessionToken: v.string(),
    leadId: v.id("crm_leads"),
    sharedWithUserId: v.string(),
    accessLevel: shareAccessValidator,
    message: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.share_lead", args.sessionToken);
    const access = await getLeadAccess(ctx, args.leadId, actor.userId, actor.permissions);

    if (!hasPermission(actor.permissions, "crm.view_all") && access.accessLevel !== "owner" && access.accessLevel !== "all") {
      throw new ConvexError({ code: "FORBIDDEN", message: "Only lead owners can share this lead" });
    }

    const existing = (
      await ctx.db.query("crm_lead_shares").withIndex("by_leadId", (q: any) => q.eq("leadId", args.leadId)).collect()
    ).find((share) => share.sharedWithUserId === args.sharedWithUserId);

    const payload = {
      sharedWithUserId: args.sharedWithUserId,
      sharedByUserId: actor.userId,
      accessLevel: args.accessLevel,
      message: normalizeString(args.message),
      expiresAt: args.expiresAt,
      updatedAt: Date.now(),
    };

    let shareId = existing?._id;
    if (existing) {
      await ctx.db.patch(existing._id, payload);
    } else {
      shareId = await ctx.db.insert("crm_lead_shares", {
        leadId: args.leadId,
        ...payload,
        createdAt: Date.now(),
      });
    }

    await insertNotification(ctx, {
      userId: args.sharedWithUserId,
      title: "CRM lead shared with you",
      message: `${access.lead.schoolName} is now shared with ${args.accessLevel} access.`,
      link: `/platform/crm/${String(args.leadId)}`,
    });

    await logAction(ctx, {
      tenantId: PLATFORM_TENANT_ID,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "crm.lead_updated",
      entityType: "crm_lead_share",
      entityId: String(shareId),
      after: payload,
    });

    return { success: true, shareId };
  },
});

export const revokeLeadShare = mutation({
  args: {
    sessionToken: v.string(),
    shareId: v.id("crm_lead_shares"),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.share_lead", args.sessionToken);
    const share = await ctx.db.get(args.shareId);
    if (!share) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Share not found" });
    }

    const access = await getLeadAccess(ctx, share.leadId, actor.userId, actor.permissions);
    if (!hasPermission(actor.permissions, "crm.view_all") && access.accessLevel !== "owner" && access.accessLevel !== "all") {
      throw new ConvexError({ code: "FORBIDDEN", message: "Only the lead owner can revoke sharing" });
    }

    await ctx.db.delete(args.shareId);

    await logAction(ctx, {
      tenantId: PLATFORM_TENANT_ID,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "crm.lead_updated",
      entityType: "crm_lead_share",
      entityId: String(args.shareId),
      before: share,
      after: { revoked: true },
    });

    return { success: true };
  },
});

export const logActivity = mutation({
  args: {
    sessionToken: v.string(),
    leadId: v.id("crm_leads"),
    type: v.string(),
    subject: v.optional(v.string()),
    body: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
    scheduledAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
    outcome: v.optional(v.string()),
    durationMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.view_own", args.sessionToken);
    await getLeadAccess(ctx, args.leadId, actor.userId, actor.permissions);

    const activityId = await createActivityRecord(ctx, {
      leadId: args.leadId,
      userId: actor.userId,
      type: args.type,
      subject: args.subject,
      body: args.body,
      isPrivate: args.isPrivate,
      scheduledAt: args.scheduledAt,
      completedAt: args.completedAt,
      metadata: args.metadata,
      outcome: args.outcome,
      durationMinutes: args.durationMinutes,
    });

    await ctx.db.patch(args.leadId, {
      lastContactedAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: PLATFORM_TENANT_ID,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "crm.activity_added",
      entityType: "crm_activity",
      entityId: String(activityId),
      after: { leadId: String(args.leadId), type: args.type },
    });

    return { activityId };
  },
});

export const deleteLead = mutation({
  args: {
    sessionToken: v.string(),
    leadId: v.id("crm_leads"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.delete_own_lead", args.sessionToken);
    const access = await getLeadAccess(ctx, args.leadId, actor.userId, actor.permissions);
    if (!hasPermission(actor.permissions, "crm.delete_any_lead") && access.accessLevel !== "owner" && access.accessLevel !== "all") {
      throw new ConvexError({ code: "FORBIDDEN", message: "You cannot delete this lead" });
    }

    await ctx.db.patch(args.leadId, {
      isDeleted: true,
      updatedAt: Date.now(),
    });

    await createActivityRecord(ctx, {
      leadId: args.leadId,
      userId: actor.userId,
      type: "system",
      subject: "Lead deleted",
      body: args.reason,
      isPrivate: true,
    });

    await logAction(ctx, {
      tenantId: PLATFORM_TENANT_ID,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "crm.lead_updated",
      entityType: "crm_lead",
      entityId: String(args.leadId),
      after: { isDeleted: true, reason: args.reason },
    });

    return { success: true };
  },
});

export const addContact = mutation({
  args: {
    sessionToken: v.string(),
    leadId: v.id("crm_leads"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    title: v.optional(v.string()),
    isPrimary: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.edit_own_lead", args.sessionToken);
    await ensureLeadEditable(ctx, args.leadId, actor.userId, actor.permissions);

    if (args.isPrimary) {
      const contacts = await ctx.db.query("crm_contacts").withIndex("by_leadId", (q: any) => q.eq("leadId", args.leadId)).collect();
      for (const contact of contacts) {
        if (contact.isPrimary) {
          await ctx.db.patch(contact._id, { isPrimary: false, updatedAt: Date.now() });
        }
      }
    }

    const contactId = await ctx.db.insert("crm_contacts", {
      leadId: args.leadId,
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      email: normalizeString(args.email),
      phone: normalizeString(args.phone),
      title: normalizeString(args.title),
      isPrimary: args.isPrimary ?? false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { contactId };
  },
});

export const updateContact = mutation({
  args: {
    sessionToken: v.string(),
    contactId: v.id("crm_contacts"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    title: v.optional(v.string()),
    isPrimary: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.edit_own_lead", args.sessionToken);
    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Contact not found" });
    }
    await ensureLeadEditable(ctx, contact.leadId, actor.userId, actor.permissions);

    if (args.isPrimary) {
      const contacts = await ctx.db.query("crm_contacts").withIndex("by_leadId", (q: any) => q.eq("leadId", contact.leadId)).collect();
      for (const sibling of contacts) {
        if (String(sibling._id) !== String(args.contactId) && sibling.isPrimary) {
          await ctx.db.patch(sibling._id, { isPrimary: false, updatedAt: Date.now() });
        }
      }
    }

    await ctx.db.patch(args.contactId, {
      firstName: args.firstName?.trim() ?? contact.firstName,
      lastName: args.lastName?.trim() ?? contact.lastName,
      email: args.email !== undefined ? normalizeString(args.email) : contact.email,
      phone: args.phone !== undefined ? normalizeString(args.phone) : contact.phone,
      title: args.title !== undefined ? normalizeString(args.title) : contact.title,
      isPrimary: args.isPrimary ?? contact.isPrimary,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const deleteContact = mutation({
  args: {
    sessionToken: v.string(),
    contactId: v.id("crm_contacts"),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.edit_own_lead", args.sessionToken);
    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Contact not found" });
    }
    await ensureLeadEditable(ctx, contact.leadId, actor.userId, actor.permissions);
    await ctx.db.delete(args.contactId);
    return { success: true };
  },
});

export const createProposal = mutation({
  args: {
    sessionToken: v.string(),
    leadId: v.id("crm_leads"),
    recommendedPlan: v.string(),
    billingPeriod: billingPeriodValidator,
    studentCount: v.number(),
    customItems: v.optional(
      v.array(
        v.object({
          description: v.string(),
          amountKes: v.number(),
          quantity: v.optional(v.number()),
        })
      )
    ),
    customNotes: v.optional(v.string()),
    validUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.create_proposal", args.sessionToken);
    const lead = await ensureLeadEditable(ctx, args.leadId, actor.userId, actor.permissions);
    const plan = await getPlanForProposal(ctx, args.recommendedPlan);
    const totals = calculateProposalTotals({
      plan,
      billingPeriod: args.billingPeriod,
      customItems: args.customItems,
    });

    const proposalId = await ctx.db.insert("crm_proposals", {
      dealId: String(args.leadId),
      leadId: args.leadId,
      tenantId: lead.tenantId,
      planId: plan ? String(plan._id) : undefined,
      recommendedPlan: args.recommendedPlan,
      billingPeriod: args.billingPeriod,
      studentCount: args.studentCount,
      customItems: args.customItems,
      totalKes: totals.totalKes,
      totalMonthlyKes: totals.totalMonthlyKes,
      totalAnnualKes: totals.totalAnnualKes,
      trackingToken: crypto.randomUUID(),
      viewCount: 0,
      viewedAt: undefined,
      viewerIp: undefined,
      status: "draft",
      sentAt: undefined,
      acceptedAt: undefined,
      rejectedAt: undefined,
      rejectionReason: undefined,
      validUntil: args.validUntil ?? Date.now() + PROPOSAL_VALIDITY_MS,
      pdfUrl: undefined,
      customNotes: normalizeString(args.customNotes),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await createActivityRecord(ctx, {
      leadId: args.leadId,
      userId: actor.userId,
      type: "proposal",
      subject: "Proposal created",
      body: `${args.recommendedPlan} proposal prepared for ${args.studentCount} students.`,
      metadata: { proposalId: String(proposalId), totalKes: totals.totalKes },
    });

    await logAction(ctx, {
      tenantId: PLATFORM_TENANT_ID,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "crm.proposal_created",
      entityType: "crm_proposal",
      entityId: String(proposalId),
      after: { leadId: String(args.leadId), totalKes: totals.totalKes },
    });

    return { proposalId };
  },
});

export const getProposals = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(proposalStatusValidator),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.view_own", args.sessionToken);
    const accessibleLeadIds = new Set((await getLeadsForUser(ctx, actor.userId, actor.permissions)).map((lead) => String(lead._id)));
    const proposals = (await ctx.db.query("crm_proposals").withIndex("by_createdAt").collect()).filter(
      (proposal) => proposal.leadId && accessibleLeadIds.has(String(proposal.leadId)) && (!args.status || proposal.status === args.status)
    );

    return await Promise.all(
      proposals.sort((a, b) => b.updatedAt - a.updatedAt).map(async (proposal) => {
        const lead = proposal.leadId ? await ctx.db.get(proposal.leadId) : null;
        return { ...proposal, lead };
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
    const actor = await requirePermission(ctx, "crm.view_own", args.sessionToken);
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal || !proposal.leadId) return null;
    await getLeadAccess(ctx, proposal.leadId, actor.userId, actor.permissions);

    const [lead, plan] = await Promise.all([
      ctx.db.get(proposal.leadId),
      proposal.planId ? ctx.db.get(proposal.planId as any) : null,
    ]);

    return { ...proposal, lead, plan };
  },
});

export const sendProposal = mutation({
  args: {
    sessionToken: v.string(),
    proposalId: v.id("crm_proposals"),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.create_proposal", args.sessionToken);
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal || !proposal.leadId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Proposal not found" });
    }

    const lead = await ensureLeadEditable(ctx, proposal.leadId, actor.userId, actor.permissions);
    const trackingToken = proposal.trackingToken ?? crypto.randomUUID();
    const proposalUrl = `${getAppUrl()}/proposals/${trackingToken}`;

    await ctx.db.patch(args.proposalId, {
      status: "sent",
      trackingToken,
      sentAt: Date.now(),
      updatedAt: Date.now(),
    });

    if (lead.email) {
      await ctx.scheduler.runAfter(0, internal.actions.communications.email.sendEmailInternal, {
        tenantId: PLATFORM_TENANT_ID,
        actorId: actor.userId,
        actorEmail: actor.email,
        to: [lead.email],
        subject: `Your EduMyles proposal for ${lead.schoolName}`,
        html: `<p>Hello ${lead.contactName},</p><p>Your EduMyles proposal is ready.</p><p><a href="${proposalUrl}">Review proposal</a></p>`,
        text: `Your proposal is ready: ${proposalUrl}`,
      });
    }

    await createActivityRecord(ctx, {
      leadId: proposal.leadId,
      userId: actor.userId,
      type: "proposal",
      subject: "Proposal sent",
      body: `Proposal link sent to ${lead.email}.`,
      metadata: { proposalId: String(args.proposalId), trackingToken },
    });

    await logAction(ctx, {
      tenantId: PLATFORM_TENANT_ID,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "crm.proposal_sent",
      entityType: "crm_proposal",
      entityId: String(args.proposalId),
      after: { trackingToken, sentAt: Date.now() },
    });

    return { success: true, proposalUrl };
  },
});

export const trackProposalView = mutation({
  args: {
    trackingToken: v.string(),
    viewerIp: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const proposal = await ctx.db
      .query("crm_proposals")
      .withIndex("by_trackingToken", (q: any) => q.eq("trackingToken", args.trackingToken))
      .unique();

    if (!proposal || !proposal.leadId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Proposal not found" });
    }

    const lead = await ctx.db.get(proposal.leadId);
    const patch: Record<string, any> = {
      viewCount: (proposal.viewCount ?? 0) + 1,
      viewerIp: args.viewerIp,
      updatedAt: Date.now(),
    };
    if (!proposal.viewedAt) patch.viewedAt = Date.now();
    if (proposal.status === "sent") patch.status = "viewed";

    await ctx.db.patch(proposal._id, patch);

    if (lead?.ownerId) {
      await insertNotification(ctx, {
        userId: lead.ownerId,
        title: "Proposal viewed",
        message: `${lead.schoolName} has opened the proposal.`,
        link: `/platform/crm/proposals/${String(proposal._id)}`,
      });
    }

    return { proposalId: String(proposal._id), leadId: String(proposal.leadId), schoolName: lead?.schoolName };
  },
});

export const acceptProposal = mutation({
  args: {
    trackingToken: v.string(),
  },
  handler: async (ctx, args) => {
    const proposal = await ctx.db
      .query("crm_proposals")
      .withIndex("by_trackingToken", (q: any) => q.eq("trackingToken", args.trackingToken))
      .unique();
    if (!proposal || !proposal.leadId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Proposal not found" });
    }

    await ctx.db.patch(proposal._id, {
      status: "accepted",
      acceptedAt: Date.now(),
      updatedAt: Date.now(),
    });

    const lead = await ctx.db.get(proposal.leadId);
    if (lead?.ownerId) {
      await insertNotification(ctx, {
        userId: lead.ownerId,
        title: "Proposal accepted",
        message: `${lead.schoolName} accepted the proposal.`,
        link: `/platform/crm/proposals/${String(proposal._id)}`,
      });
    }
    if (lead) {
      await ctx.db.patch(lead._id, { stage: "won", status: "won", updatedAt: Date.now() });
    }

    return { success: true, proposalId: String(proposal._id) };
  },
});

export const rejectProposal = mutation({
  args: {
    trackingToken: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const proposal = await ctx.db
      .query("crm_proposals")
      .withIndex("by_trackingToken", (q: any) => q.eq("trackingToken", args.trackingToken))
      .unique();
    if (!proposal || !proposal.leadId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Proposal not found" });
    }

    await ctx.db.patch(proposal._id, {
      status: "rejected",
      rejectedAt: Date.now(),
      rejectionReason: normalizeString(args.reason),
      updatedAt: Date.now(),
    });

    const lead = await ctx.db.get(proposal.leadId);
    if (lead?.ownerId) {
      await insertNotification(ctx, {
        userId: lead.ownerId,
        title: "Proposal declined",
        message: `${lead.schoolName} declined the proposal.`,
        link: `/platform/crm/proposals/${String(proposal._id)}`,
      });
    }

    return { success: true, proposalId: String(proposal._id) };
  },
});

export const createFollowUp = mutation({
  args: {
    sessionToken: v.string(),
    leadId: v.id("crm_leads"),
    title: v.string(),
    dueAt: v.number(),
    notes: v.optional(v.string()),
    priority: v.optional(followUpPriorityValidator),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.view_own", args.sessionToken);
    const lead = await getLeadAccess(ctx, args.leadId, actor.userId, actor.permissions);
    const followUpId = await ctx.db.insert("crm_follow_ups", {
      leadId: args.leadId,
      assignedToUserId: lead.lead.assignedTo ?? actor.userId,
      title: args.title.trim(),
      notes: normalizeString(args.notes),
      dueAt: args.dueAt,
      priority: args.priority ?? "medium",
      isOverdue: args.dueAt < Date.now(),
      completedAt: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await syncLeadNextFollowUp(ctx, args.leadId);
    return { followUpId };
  },
});

export const completeFollowUp = mutation({
  args: {
    sessionToken: v.string(),
    followUpId: v.id("crm_follow_ups"),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.view_own", args.sessionToken);
    const followUp = await ctx.db.get(args.followUpId);
    if (!followUp) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Follow-up not found" });
    }
    await getLeadAccess(ctx, followUp.leadId, actor.userId, actor.permissions);
    await ctx.db.patch(args.followUpId, {
      completedAt: Date.now(),
      isOverdue: false,
      updatedAt: Date.now(),
    });
    await syncLeadNextFollowUp(ctx, followUp.leadId);
    return { success: true };
  },
});

export const snoozeFollowUp = mutation({
  args: {
    sessionToken: v.string(),
    followUpId: v.id("crm_follow_ups"),
    newDueAt: v.number(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.view_own", args.sessionToken);
    const followUp = await ctx.db.get(args.followUpId);
    if (!followUp) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Follow-up not found" });
    }
    await getLeadAccess(ctx, followUp.leadId, actor.userId, actor.permissions);
    await ctx.db.patch(args.followUpId, {
      dueAt: args.newDueAt,
      isOverdue: false,
      updatedAt: Date.now(),
    });
    await syncLeadNextFollowUp(ctx, followUp.leadId);
    return { success: true };
  },
});

export const createPipelineStage = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    slug: v.string(),
    color: v.string(),
    icon: v.string(),
    probabilityDefault: v.number(),
    requiresNote: v.optional(v.boolean()),
    autoFollowUpDays: v.optional(v.number()),
    isWon: v.optional(v.boolean()),
    isLost: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.manage_pipeline", args.sessionToken);
    const stages = await ctx.db.query("crm_pipeline_stages").withIndex("by_order").collect();
    const stageId = await ctx.db.insert("crm_pipeline_stages", {
      name: args.name.trim(),
      slug: args.slug.trim(),
      order: stages.length,
      color: args.color,
      icon: args.icon,
      requiresNote: args.requiresNote ?? false,
      autoFollowUpDays: args.autoFollowUpDays,
      isWon: args.isWon ?? false,
      isLost: args.isLost ?? false,
      probabilityDefault: args.probabilityDefault,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: PLATFORM_TENANT_ID,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "crm.lead_updated",
      entityType: "crm_pipeline_stage",
      entityId: String(stageId),
      after: { name: args.name, slug: args.slug },
    });

    return { stageId };
  },
});

export const updatePipelineStage = mutation({
  args: {
    sessionToken: v.string(),
    stageId: v.id("crm_pipeline_stages"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    probabilityDefault: v.optional(v.number()),
    requiresNote: v.optional(v.boolean()),
    autoFollowUpDays: v.optional(v.number()),
    isWon: v.optional(v.boolean()),
    isLost: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.manage_pipeline", args.sessionToken);
    const stage = await ctx.db.get(args.stageId);
    if (!stage) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Stage not found" });
    }
    await ctx.db.patch(args.stageId, {
      name: args.name?.trim() ?? stage.name,
      color: args.color ?? stage.color,
      icon: args.icon ?? stage.icon,
      probabilityDefault: args.probabilityDefault ?? stage.probabilityDefault,
      requiresNote: args.requiresNote ?? stage.requiresNote,
      autoFollowUpDays: args.autoFollowUpDays ?? stage.autoFollowUpDays,
      isWon: args.isWon ?? stage.isWon,
      isLost: args.isLost ?? stage.isLost,
      isActive: args.isActive ?? stage.isActive,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: PLATFORM_TENANT_ID,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "crm.lead_updated",
      entityType: "crm_pipeline_stage",
      entityId: String(args.stageId),
      before: stage,
      after: args,
    });

    return { success: true };
  },
});

export const reorderPipelineStages = mutation({
  args: {
    sessionToken: v.string(),
    stageIds: v.array(v.id("crm_pipeline_stages")),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.manage_pipeline", args.sessionToken);
    for (const [index, stageId] of args.stageIds.entries()) {
      await ctx.db.patch(stageId, {
        order: index,
        updatedAt: Date.now(),
      });
    }
    await logAction(ctx, {
      tenantId: PLATFORM_TENANT_ID,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "crm.lead_updated",
      entityType: "crm_pipeline_stage",
      entityId: "bulk_reorder",
      after: { stageIds: args.stageIds.map(String) },
    });
    return { success: true };
  },
});

export const convertLeadToTenant = mutation({
  args: {
    sessionToken: v.string(),
    leadId: v.id("crm_leads"),
    suggestedPlan: v.string(),
    suggestedModules: v.array(v.string()),
    personalMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crm.convert_to_tenant", args.sessionToken);
    const lead = await ensureLeadEditable(ctx, args.leadId, actor.userId, actor.permissions);
    const now = Date.now();

    if (!lead.email) {
      throw new ConvexError({ code: "VALIDATION_ERROR", message: "Lead email is required before conversion to tenant." });
    }
    const leadEmail = lead.email;

    const existingInvite = (await ctx.db.query("tenant_invites").collect()).find(
      (invite: any) => invite.email.toLowerCase() === leadEmail.toLowerCase() && invite.status === "pending"
    );

    const inviteToken = crypto.randomUUID().replace(/-/g, "");
    const names = splitName(lead.contactName);
    const invitePayload: {
      email: string;
      firstName: string;
      lastName: string;
      schoolName: string;
      country: string;
      county: undefined;
      phone: string | undefined;
      suggestedPlan: string;
      suggestedModules: string[];
      studentCountEstimate: number | undefined;
      personalMessage: string | undefined;
      token: string;
      status: "pending";
      invitedBy: string;
      expiresAt: number;
      acceptedAt: undefined;
      waitlistId: undefined;
      crmLeadId: string;
      remindersSent: number;
      lastReminderAt: undefined;
      resellerId: undefined;
      tenantId: undefined;
      updatedAt: number;
    } = {
      email: leadEmail,
      firstName: names.firstName,
      lastName: names.lastName,
      schoolName: lead.schoolName,
      country: lead.country,
      county: undefined,
      phone: lead.phone,
      suggestedPlan: args.suggestedPlan,
      suggestedModules: args.suggestedModules,
      studentCountEstimate: lead.studentCount,
      personalMessage: normalizeString(args.personalMessage),
      token: inviteToken,
      status: "pending",
      invitedBy: actor.userId,
      expiresAt: now + 7 * FOLLOW_UP_DAY_MS,
      acceptedAt: undefined,
      waitlistId: undefined,
      crmLeadId: String(args.leadId),
      remindersSent: 0,
      lastReminderAt: undefined,
      resellerId: undefined,
      tenantId: undefined,
      updatedAt: now,
    };

    let tenantInviteId = existingInvite?._id;
    if (existingInvite) {
      await ctx.db.patch(existingInvite._id, invitePayload);
    } else {
      tenantInviteId = await ctx.db.insert("tenant_invites", {
        ...invitePayload,
        createdAt: now,
      } as any);
    }

    const inviteUrl = `${getAppUrl()}/invite/accept?token=${inviteToken}`;
    await ctx.scheduler.runAfter(0, internal.actions.communications.email.sendEmailInternal, {
      tenantId: PLATFORM_TENANT_ID,
      actorId: actor.userId,
      actorEmail: actor.email,
      to: [lead.email],
      subject: `Your EduMyles invitation is ready, ${names.firstName}!`,
      html: `<p>Hello ${lead.contactName},</p><p>Your EduMyles onboarding invite is ready.</p><p><a href="${inviteUrl}">Accept invitation</a></p>`,
      text: `Accept your EduMyles invite here: ${inviteUrl}`,
    });

    await ctx.db.patch(args.leadId, {
      stage: "won",
      status: "won",
      updatedAt: now,
    });

    await createActivityRecord(ctx, {
      leadId: args.leadId,
      userId: actor.userId,
      type: "system",
      subject: "Converted to tenant invite",
      body: `Tenant invite sent to ${lead.email}.`,
      metadata: { tenantInviteId: String(tenantInviteId) },
    });

    await logAction(ctx, {
      tenantId: PLATFORM_TENANT_ID,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "crm.lead_updated",
      entityType: "crm_lead",
      entityId: String(args.leadId),
      after: { stage: "won", tenantInviteId: String(tenantInviteId) },
    });

    return { success: true, tenantInviteId, inviteUrl };
  },
});

export const requestEnterpriseConsultation = mutation({
  args: {
    notes: v.string(),
    phone: v.optional(v.string()),
    timeline: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    requireRole(tenant, "school_admin");

    const tenantRecord = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenant.tenantId))
      .first();

    if (!tenantRecord) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Tenant record not found" });
    }

    const now = Date.now();
    const existingLead = await ctx.db
      .query("crm_leads")
      .withIndex("by_email", (q: any) => q.eq("email", tenant.email))
      .first();

    if (existingLead && existingLead.tenantId === tenant.tenantId) {
      await ctx.db.patch(existingLead._id, {
        phone: args.phone ?? existingLead.phone,
        timeline: args.timeline ?? existingLead.timeline,
        notes: [existingLead.notes, args.notes].filter(Boolean).join("\n\n"),
        stage: "qualified",
        status: "open",
        updatedAt: now,
      });
      return { success: true, leadId: String(existingLead._id), created: false };
    }

    const leadId = await ctx.db.insert("crm_leads", {
      schoolName: tenantRecord.name,
      contactName: tenant.email,
      email: tenant.email,
      phone: args.phone ?? tenantRecord.phone,
      country: tenantRecord.country ?? "KE",
      studentCount: undefined,
      budgetConfirmed: undefined,
      timeline: args.timeline,
      decisionMaker: "school_admin",
      source: "enterprise_billing_request",
      qualificationScore: 70,
      probability: 40,
      stage: "qualified",
      assignedTo: undefined,
      ownerId: undefined,
      dealValueKes: undefined,
      expectedClose: undefined,
      tenantId: tenant.tenantId,
      notes: args.notes,
      status: "open",
      sourceType: "tenant_request",
      isArchived: false,
      isDeleted: false,
      tags: ["tenant_request"],
      lastContactedAt: undefined,
      nextFollowUpAt: undefined,
      nextFollowUpNote: undefined,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, leadId: String(leadId), created: true };
  },
});

export const expireCRMShares = internalMutation({
  args: {},
  handler: async (ctx) => {
    const expiredShares = (await ctx.db.query("crm_lead_shares").collect()).filter(
      (share) => share.expiresAt && share.expiresAt < Date.now()
    );
    for (const share of expiredShares) {
      await ctx.db.delete(share._id);
    }
    return { expiredCount: expiredShares.length };
  },
});

export const checkOverdueFollowUps = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const followUps = await ctx.db.query("crm_follow_ups").withIndex("by_dueAt").collect();
    let updated = 0;

    for (const followUp of followUps) {
      if (!followUp.completedAt && followUp.dueAt < now && !followUp.isOverdue) {
        await ctx.db.patch(followUp._id, {
          isOverdue: true,
          updatedAt: now,
        });
        await syncLeadNextFollowUp(ctx, followUp.leadId);
        await insertNotification(ctx, {
          userId: followUp.assignedToUserId,
          title: "CRM follow-up overdue",
          message: `${followUp.title} is overdue.`,
          link: `/platform/crm/${String(followUp.leadId)}`,
        });
        updated += 1;
      }
    }

    return { updated };
  },
});

export const sendWeeklyPipelineReport = internalMutation({
  args: {},
  handler: async (ctx) => {
    const masterAdmins = (await ctx.db.query("platform_users").withIndex("by_role", (q: any) => q.eq("role", "master_admin")).collect())
      .filter((user) => user.status === "active");
    const leadCount = (await ctx.db.query("crm_leads").collect()).filter((lead) => !lead.isDeleted).length;
    for (const admin of masterAdmins) {
      await insertNotification(ctx, {
        userId: admin.userId,
        title: "Weekly CRM pipeline report",
        message: `CRM currently has ${leadCount} active leads requiring visibility.`,
        link: "/platform/crm/reports",
      });
    }
    return { recipients: masterAdmins.length, leadCount };
  },
});
