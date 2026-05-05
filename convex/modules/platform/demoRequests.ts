import { v } from "convex/values";
import { internal } from "../../_generated/api";
import { internalMutation, mutation, query } from "../../_generated/server";
import { logAction } from "../../helpers/auditLog";
import { requirePlatformContext } from "../../helpers/platformGuard";
import { createPlatformNotificationRecord } from "./notificationHelpers";
import {
  formatAttributionSummary,
  marketingAttributionValidator,
  mergeMarketingAttribution,
  normalizeMarketingAttribution,
} from "./leadAttribution";

const DEMO_STATUS = v.union(
  v.literal("requested"),
  v.literal("contacted"),
  v.literal("scheduled"),
  v.literal("completed"),
  v.literal("cancelled")
);

const DEMO_PRIORITY = v.union(v.literal("low"), v.literal("medium"), v.literal("high"));
const DEMO_NOTIFICATION_TYPE = "crm" as const;
const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

const demoBaseArgs = {
  fullName: v.string(),
  email: v.string(),
  phone: v.optional(v.string()),
  schoolName: v.string(),
  schoolType: v.optional(v.string()),
  jobTitle: v.optional(v.string()),
  preferredDemoDate: v.optional(v.string()),
  needs: v.optional(v.string()),
  country: v.optional(v.string()),
  county: v.optional(v.string()),
  studentCount: v.optional(v.number()),
  currentSystem: v.optional(v.string()),
  referralSource: v.optional(v.string()),
  referralCode: v.optional(v.string()),
  sourceChannel: v.optional(v.string()),
  marketingAttribution: v.optional(marketingAttributionValidator),
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function cleanString(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function splitName(name: string) {
  const trimmed = name.trim();
  const [firstName, ...rest] = trimmed.split(/\s+/);
  return {
    firstName: firstName || "there",
    lastName: rest.join(" ") || "Lead",
  };
}

function parseDateInput(date?: string | null) {
  if (!date) return undefined;
  const value = Date.parse(date);
  return Number.isFinite(value) ? value : undefined;
}

function calculateDemoQualificationScore(args: {
  studentCount?: number;
  phone?: string;
  preferredDemoDate?: string;
  needs?: string;
  currentSystem?: string;
  country?: string;
  jobTitle?: string;
}) {
  let score = 30;

  if (args.studentCount) {
    if (args.studentCount >= 1200) score += 28;
    else if (args.studentCount >= 600) score += 22;
    else if (args.studentCount >= 250) score += 16;
    else if (args.studentCount >= 100) score += 10;
  }

  if (args.phone) score += 10;
  if (args.preferredDemoDate) score += 8;
  if (args.needs && args.needs.trim().length >= 20) score += 10;
  if (args.currentSystem) score += 6;
  if (args.jobTitle && /(principal|director|head|owner|admin)/i.test(args.jobTitle)) score += 6;
  if (args.country && ["Kenya", "Uganda", "Tanzania", "Rwanda"].includes(args.country)) score += 8;

  return Math.min(100, score);
}

function derivePriority(score: number, studentCount?: number) {
  if (score >= 80 || (studentCount ?? 0) >= 800) return "high" as const;
  if (score >= 55 || (studentCount ?? 0) >= 250) return "medium" as const;
  return "low" as const;
}

function deriveCrmStage(status: string, score?: number) {
  switch (status) {
    case "scheduled":
      return "demo_booked";
    case "completed":
      return "demo_done";
    case "cancelled":
      return "lost";
    case "contacted":
      return "contacted";
    default:
      return (score ?? 0) >= 60 ? "qualified" : "new";
  }
}

function deriveNextActionLabel(status: string) {
  switch (status) {
    case "requested":
      return "Call within 24h";
    case "contacted":
      return "Confirm meeting slot";
    case "scheduled":
      return "Prepare walkthrough";
    case "completed":
      return "Send follow-up";
    case "cancelled":
      return "Review recovery";
    default:
      return undefined;
  }
}

async function recordDemoEvent(
  ctx: any,
  args: {
    demoRequestId: any;
    eventType: string;
    title: string;
    body?: string;
    actorUserId?: string;
    actorEmail?: string;
    metadata?: any;
  }
) {
  await ctx.db.insert("demo_request_events", {
    demoRequestId: args.demoRequestId,
    eventType: args.eventType,
    title: args.title,
    body: args.body,
    actorUserId: args.actorUserId,
    actorEmail: args.actorEmail,
    metadata: args.metadata,
    createdAt: Date.now(),
  });
}

async function hasPlatformNotificationFor(ctx: any, userId: string, dedupeKey: string) {
  const rows = await ctx.db
    .query("platform_notifications")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .collect();

  return rows.some((row: any) => row.metadata?.dedupeKey === dedupeKey);
}

async function notifyDemoOwner(
  ctx: any,
  args: {
    userId?: string;
    title: string;
    body: string;
    actionUrl?: string;
    dedupeKey?: string;
    metadata?: any;
  }
) {
  if (!args.userId) return false;
  if (args.dedupeKey && (await hasPlatformNotificationFor(ctx, args.userId, args.dedupeKey))) {
    return false;
  }

  await createPlatformNotificationRecord(ctx, {
    userId: args.userId,
    title: args.title,
    body: args.body,
    type: DEMO_NOTIFICATION_TYPE,
    actionUrl: args.actionUrl,
    metadata: {
      ...(args.metadata ?? {}),
      dedupeKey: args.dedupeKey,
    },
  });
  return true;
}

async function sendPlatformEmail(
  ctx: any,
  args: {
    to: string[];
    subject: string;
    text: string;
  }
) {
  await ctx.scheduler.runAfter(0, internal.actions.communications.email.sendEmailInternal, {
    tenantId: "PLATFORM",
    actorId: "system",
    actorEmail: "no-reply@edumyles.co.ke",
    to: args.to,
    subject: args.subject,
    text: args.text,
    template: undefined,
    data: undefined,
  });
}

async function markReferralConversion(
  ctx: any,
  args: {
    referralClickId?: string;
    referralCode?: string;
    conversionId: string;
  }
) {
  let click =
    (args.referralClickId
      ? await ctx.db
          .query("resellerReferralClicks")
          .withIndex("by_clickId", (q: any) => q.eq("clickId", args.referralClickId))
          .first()
      : null) ?? null;

  if (!click && args.referralCode) {
    click = (
      await ctx.db
        .query("resellerReferralClicks")
        .withIndex("by_referralCode", (q: any) => q.eq("referralCode", args.referralCode))
        .collect()
    )
      .filter((item: any) => !item.converted)
      .sort((left: any, right: any) => right.timestamp - left.timestamp)[0];
  }

  if (!click) return;

  await ctx.db.patch(click._id, {
    converted: true,
    conversionId: args.conversionId,
  });
}

async function getPlatformOperators(ctx: any) {
  const [platformUsers, users] = await Promise.all([
    ctx.db.query("platform_users").collect(),
    ctx.db.query("users").withIndex("by_tenant", (q: any) => q.eq("tenantId", "PLATFORM")).collect(),
  ]);

  return platformUsers
    .filter((user: any) => user.status === "active" && !user.deletedAt)
    .map((platformUser: any) => {
      const profile =
        users.find(
          (user: any) => user.workosUserId === platformUser.userId || user.eduMylesUserId === platformUser.userId
        ) ?? null;

      return {
        userId: platformUser.userId,
        role: platformUser.role,
        department: platformUser.department,
        name:
          [platformUser.firstName, platformUser.lastName].filter(Boolean).join(" ").trim() ||
          [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim() ||
          platformUser.email ||
          profile?.email ||
          platformUser.userId,
        email: platformUser.email || profile?.email,
      };
    })
    .sort((left: any, right: any) => left.name.localeCompare(right.name));
}

async function syncCrmLeadForDemoRequest(
  ctx: any,
  args: {
    request: any;
    actorId: string;
    actorEmail: string;
    allowCreate: boolean;
  }
) {
  const request = args.request;
  const existingLead = request.crmLeadId
    ? await ctx.db.get(request.crmLeadId as any)
    : await ctx.db
        .query("crm_leads")
        .withIndex("by_email", (q: any) => q.eq("email", request.email))
        .first();

  const stage = deriveCrmStage(request.status, request.qualificationScore);
  const notes = [
    existingLead?.notes,
    request.needs ? `Demo request needs: ${request.needs}` : undefined,
    request.currentSystem ? `Current system: ${request.currentSystem}` : undefined,
    request.preferredDemoDate ? `Preferred demo date: ${request.preferredDemoDate}` : undefined,
    request.scheduledFor ? `Scheduled for: ${new Date(request.scheduledFor).toISOString()}` : undefined,
    request.meetingUrl ? `Meeting URL: ${request.meetingUrl}` : undefined,
    request.referralCode ? `Referral code: ${request.referralCode}` : undefined,
    request.notesInternal ? `Internal notes: ${request.notesInternal}` : undefined,
    ...formatAttributionSummary(request.marketingAttribution),
  ]
    .filter(Boolean)
    .join("\n");

  const patch = {
    schoolName: request.schoolName,
    contactName: request.fullName,
    email: request.email,
    phone: request.phone,
    country: request.country || existingLead?.country || "Kenya",
    studentCount: request.studentCount,
    source: request.sourceChannel ?? "demo_request",
    sourceType: "demo_request",
    qualificationScore: Math.max(existingLead?.qualificationScore ?? 0, request.qualificationScore ?? 0),
    notes,
    marketingAttribution: mergeMarketingAttribution(existingLead?.marketingAttribution, request.marketingAttribution),
    tags: [...new Set([...(existingLead?.tags ?? []), "demo_request", "inbound"])],
    stage:
      existingLead?.stage === "won" || existingLead?.stage === "converted"
        ? existingLead.stage
        : stage,
    status:
      existingLead?.status === "won"
        ? existingLead.status
        : request.status === "cancelled"
          ? "lost"
          : request.status === "completed"
            ? "open"
            : "open",
    assignedTo: request.assignedTo,
    timeline: request.preferredDemoDate,
    decisionMaker: request.jobTitle || existingLead?.decisionMaker || "school_admin",
    nextFollowUpAt: request.nextActionAt,
    nextFollowUpNote: request.nextActionLabel,
    lastContactedAt: request.lastContactedAt,
    updatedAt: Date.now(),
  };

  if (existingLead) {
    await ctx.db.patch(existingLead._id, patch);
    return { crmLeadId: String(existingLead._id), created: false };
  }

  if (!args.allowCreate) {
    return { crmLeadId: undefined, created: false };
  }

  const leadId = await ctx.db.insert("crm_leads", {
    schoolName: patch.schoolName,
    contactName: patch.contactName,
    email: patch.email,
    phone: patch.phone,
    country: patch.country,
    studentCount: patch.studentCount,
    budgetConfirmed: undefined,
    timeline: patch.timeline,
    decisionMaker: patch.decisionMaker,
    source: patch.source,
    qualificationScore: patch.qualificationScore,
    probability: (request.qualificationScore ?? 0) >= 70 ? 55 : 35,
    stage: patch.stage,
    assignedTo: patch.assignedTo,
    ownerId: undefined,
    dealValueKes: undefined,
    expectedClose: undefined,
    tenantId: undefined,
    notes: patch.notes,
    status: patch.status,
    sourceType: patch.sourceType,
    marketingAttribution: request.marketingAttribution,
    isArchived: false,
    isDeleted: false,
    tags: patch.tags,
    lastContactedAt: patch.lastContactedAt,
    nextFollowUpAt: patch.nextFollowUpAt,
    nextFollowUpNote: patch.nextFollowUpNote,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  await logAction(ctx, {
    tenantId: "PLATFORM",
    actorId: args.actorId,
    actorEmail: args.actorEmail,
    action: "crm.lead_created",
    entityType: "crm_lead",
    entityId: String(leadId),
    after: {
      source: patch.source,
      schoolName: patch.schoolName,
      email: patch.email,
    },
  });

  return { crmLeadId: String(leadId), created: true };
}

async function enrichDemoRequests(ctx: any, requests: any[]) {
  const operators = await getPlatformOperators(ctx);
      const operatorMap = new Map<string, any>(operators.map((operator: any) => [operator.userId, operator]));
  const crmLeadIds = requests.map((request: any) => request.crmLeadId).filter(Boolean);
  const requestIds = requests.map((request: any) => String(request._id));
  const crmLeads = crmLeadIds.length
    ? await Promise.all(
        crmLeadIds.map((leadId: string) => ctx.db.get(leadId as any))
      )
    : [];
  const crmMap = new Map(
    crmLeads
      .filter(Boolean)
      .map((lead: any) => [
        String(lead._id),
        {
          id: String(lead._id),
          stage: lead.stage,
          status: lead.status,
          assignedTo: lead.assignedTo,
        },
      ])
  );
  const allEvents = requestIds.length
    ? await ctx.db.query("demo_request_events").withIndex("by_createdAt").order("desc").take(500)
    : [];
  const eventsByRequest = new Map<string, any[]>();
  for (const event of allEvents) {
    const key = String(event.demoRequestId);
    if (!requestIds.includes(key)) continue;
    const bucket = eventsByRequest.get(key) ?? [];
    if (bucket.length < 12) {
      bucket.push(event);
      eventsByRequest.set(key, bucket);
    }
  }

  return requests.map((request: any) => ({
    ...request,
    assignedUser: request.assignedTo ? operatorMap.get(request.assignedTo) ?? null : null,
    crmLead: request.crmLeadId ? crmMap.get(request.crmLeadId) ?? null : null,
    timeline: eventsByRequest.get(String(request._id)) ?? [],
  }));
}

function computeDashboardMetrics(requests: any[]) {
  const active = requests.filter((request) => !request.deletedAt);
  const scheduled = active.filter((request) => request.status === "scheduled");
  const completed = active.filter((request) => request.status === "completed");
  const overdue = active.filter(
    (request) =>
      request.nextActionAt &&
      request.nextActionAt < Date.now() &&
      !["completed", "cancelled"].includes(request.status)
  );
  const highIntent = active.filter((request) => Boolean(request.isHighValue)).length;
  const byCampaign = active.reduce<Record<string, number>>((accumulator, request) => {
    const key = request.marketingAttribution?.utmCampaign || request.marketingAttribution?.ctaSource || "Direct";
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});

  return {
    total: active.length,
    scheduled: scheduled.length,
    completed: completed.length,
    overdue: overdue.length,
    highIntent,
    thisWeek:
      scheduled.filter((request) => {
        const date = request.scheduledFor ?? parseDateInput(request.preferredDemoDate);
        if (!date) return false;
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        return date >= start.getTime() && date < end.getTime();
      }).length,
    topCampaigns: Object.entries(byCampaign)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([label, count]) => ({ label, count })),
  };
}

async function persistDemoRequest(ctx: any, args: { existing?: any; data: any; actorId: string; actorEmail: string }) {
  const now = Date.now();
  const data = args.data;
  const qualificationScore =
    data.qualificationScore ??
    calculateDemoQualificationScore({
      studentCount: data.studentCount,
      phone: data.phone,
      preferredDemoDate: data.preferredDemoDate,
      needs: data.needs,
      currentSystem: data.currentSystem,
      country: data.country,
      jobTitle: data.jobTitle,
    });
  const priority = data.priority ?? derivePriority(qualificationScore, data.studentCount);
  const scheduledFor = data.scheduledFor ?? parseDateInput(data.preferredDemoDate);
  const marketingAttribution = normalizeMarketingAttribution(data.marketingAttribution);
  const nextActionLabel = data.nextActionLabel ?? deriveNextActionLabel(data.status);
  const nextActionAt =
    data.nextActionAt ??
    (data.status === "requested" ? now + 24 * 60 * 60 * 1000 : data.status === "contacted" ? now + 2 * 24 * 60 * 60 * 1000 : undefined);

  const record = {
    fullName: data.fullName.trim(),
    email: normalizeEmail(data.email),
    phone: cleanString(data.phone),
    schoolName: data.schoolName.trim(),
    schoolType: cleanString(data.schoolType),
    jobTitle: cleanString(data.jobTitle),
    preferredDemoDate: cleanString(data.preferredDemoDate),
    needs: cleanString(data.needs),
    country: cleanString(data.country),
    county: cleanString(data.county),
    studentCount: data.studentCount,
    currentSystem: cleanString(data.currentSystem),
    referralSource: cleanString(data.referralSource),
    referralCode: cleanString(data.referralCode),
    sourceChannel: cleanString(data.sourceChannel) || "demo_request",
    marketingAttribution,
    qualificationScore,
    isHighValue: data.isHighValue ?? (qualificationScore >= 75 || (data.studentCount ?? 0) >= 500),
    status: data.status,
    priority,
    assignedTo: cleanString(data.assignedTo),
    assignedTeam: cleanString(data.assignedTeam),
    crmLeadId: cleanString(data.crmLeadId),
    scheduledFor,
    scheduledEndAt: data.scheduledEndAt,
    meetingUrl: cleanString(data.meetingUrl),
    bookingSource: cleanString(data.bookingSource),
    externalBookingId: cleanString(data.externalBookingId),
    externalBookingUid: cleanString(data.externalBookingUid),
    nextActionAt,
    nextActionLabel: cleanString(nextActionLabel),
    lastContactedAt: data.lastContactedAt,
    notesInternal: cleanString(data.notesInternal),
    outcome: cleanString(data.outcome),
    deletedAt: data.deletedAt,
    deletedBy: data.deletedBy,
    createdAt: args.existing?.createdAt ?? now,
    updatedAt: now,
  };

  const crmResult = await syncCrmLeadForDemoRequest(ctx, {
    request: record,
    actorId: args.actorId,
    actorEmail: args.actorEmail,
    allowCreate: true,
  });

  record.crmLeadId = crmResult.crmLeadId ?? record.crmLeadId;

  if (args.existing) {
    await ctx.db.patch(args.existing._id, record);
    return { ...record, _id: args.existing._id };
  }

  const demoRequestId = await ctx.db.insert("demo_requests", record);
  return { ...record, _id: demoRequestId };
}

export const submitDemoRequest = mutation({
  args: demoBaseArgs,
  handler: async (ctx, args) => {
    const request = await persistDemoRequest(ctx, {
      data: {
        ...args,
        status: "requested",
      },
      actorId: "system",
      actorEmail: "no-reply@edumyles.co.ke",
    });

    await recordDemoEvent(ctx, {
      demoRequestId: request._id,
      eventType: "created",
      title: "Demo request created",
      body: `Inbound request captured for ${request.schoolName}.`,
      actorUserId: "system",
      actorEmail: "no-reply@edumyles.co.ke",
      metadata: {
        sourceChannel: request.sourceChannel,
        qualificationScore: request.qualificationScore,
      },
    });

    if (request.crmLeadId) {
      await ctx.db.insert("crm_activities", {
        leadId: request.crmLeadId as any,
        createdByUserId: "system",
        type: "demo_request",
        subject: "Demo request submitted",
        body: [
          request.needs ? `Needs: ${request.needs}` : undefined,
          request.currentSystem ? `Current system: ${request.currentSystem}` : undefined,
          request.preferredDemoDate ? `Preferred demo date: ${request.preferredDemoDate}` : undefined,
        ]
          .filter(Boolean)
          .join("\n"),
        isPrivate: false,
        scheduledAt: request.scheduledFor,
        completedAt: undefined,
        metadata: {
          demoRequestId: String(request._id),
          marketingAttribution: request.marketingAttribution,
        },
        outcome: undefined,
        durationMinutes: undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    await markReferralConversion(ctx, {
      referralClickId: request.marketingAttribution?.referralClickId,
      referralCode: request.referralCode,
      conversionId: String(request._id),
    });

    const name = splitName(args.fullName);
    await sendPlatformEmail(ctx, {
      to: [request.email],
      subject: `Your EduMyles demo request is in, ${name.firstName}`,
      text: `Hi ${name.firstName},\n\nWe have received your demo request for ${request.schoolName}. Our team will reach out shortly to confirm timing and prepare your walkthrough.\n\nThe EduMyles Team`,
    });

    return {
      success: true,
      demoRequestId: String(request._id),
      crmLeadId: request.crmLeadId,
      qualificationScore: request.qualificationScore,
    };
  },
});

export const getDemoRequestsDashboard = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(DEMO_STATUS),
    assignedTo: v.optional(v.string()),
    priority: v.optional(DEMO_PRIORITY),
    sourceChannel: v.optional(v.string()),
    country: v.optional(v.string()),
    search: v.optional(v.string()),
    includeDeleted: v.optional(v.boolean()),
    scheduledOnly: v.optional(v.boolean()),
    ctaSource: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformContext(ctx, args, "demo_requests.view");
    const searchNeedle = args.search?.trim().toLowerCase();
    const rows = await ctx.db.query("demo_requests").withIndex("by_createdAt").order("desc").take(500);
    const filtered = rows.filter((request: any) => {
      if (!args.includeDeleted && request.deletedAt) return false;
      if (args.status && request.status !== args.status) return false;
      if (args.assignedTo && request.assignedTo !== args.assignedTo) return false;
      if (args.priority && request.priority !== args.priority) return false;
      if (args.sourceChannel && (request.sourceChannel ?? "demo_request") !== args.sourceChannel) return false;
      if (args.country && request.country !== args.country) return false;
      if (args.scheduledOnly && !request.scheduledFor && request.status !== "scheduled") return false;
      if (args.ctaSource && request.marketingAttribution?.ctaSource !== args.ctaSource) return false;
      if (args.utmCampaign && request.marketingAttribution?.utmCampaign !== args.utmCampaign) return false;
      if (!searchNeedle) return true;
      return [
        request.fullName,
        request.email,
        request.schoolName,
        request.country ?? "",
        request.county ?? "",
        request.jobTitle ?? "",
        request.sourceChannel ?? "",
        request.referralSource ?? "",
        request.notesInternal ?? "",
        request.marketingAttribution?.utmCampaign ?? "",
        request.marketingAttribution?.ctaSource ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchNeedle);
    });

    const enriched = await enrichDemoRequests(ctx, filtered);
    const operators = await getPlatformOperators(ctx);

    return {
      requests: enriched.sort((left: any, right: any) => {
        const leftAnchor = left.scheduledFor ?? left.nextActionAt ?? left.updatedAt;
        const rightAnchor = right.scheduledFor ?? right.nextActionAt ?? right.updatedAt;
        if (left.status === "scheduled" && right.status !== "scheduled") return -1;
        if (left.status !== "scheduled" && right.status === "scheduled") return 1;
        return (rightAnchor ?? 0) - (leftAnchor ?? 0);
      }),
      operators,
      metrics: computeDashboardMetrics(enriched),
    };
  },
});

export const getDemoRequestOperators = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformContext(ctx, args, "demo_requests.view");
    return getPlatformOperators(ctx);
  },
});

export const createPlatformDemoRequest = mutation({
  args: {
    sessionToken: v.string(),
    ...demoBaseArgs,
    status: v.optional(DEMO_STATUS),
    priority: v.optional(DEMO_PRIORITY),
    assignedTo: v.optional(v.string()),
    assignedTeam: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
    scheduledEndAt: v.optional(v.number()),
    meetingUrl: v.optional(v.string()),
    nextActionAt: v.optional(v.number()),
    nextActionLabel: v.optional(v.string()),
    lastContactedAt: v.optional(v.number()),
    notesInternal: v.optional(v.string()),
    outcome: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformContext(ctx, args, "demo_requests.create");
    const request = await persistDemoRequest(ctx, {
      data: {
        ...args,
        status: args.status ?? "requested",
      },
      actorId: platform.userId,
      actorEmail: platform.email,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "demo_request.created" as any,
      entityType: "demo_request",
      entityId: String(request._id),
      after: {
        schoolName: request.schoolName,
        status: request.status,
        assignedTo: request.assignedTo,
      },
    });

    await recordDemoEvent(ctx, {
      demoRequestId: request._id,
      eventType: "created",
      title: "Demo request added from platform",
      body: `Added manually by ${platform.email}.`,
      actorUserId: platform.userId,
      actorEmail: platform.email,
      metadata: {
        status: request.status,
        assignedTo: request.assignedTo,
      },
    });

    return { success: true, demoRequestId: String(request._id) };
  },
});

export const updateDemoRequest = mutation({
  args: {
    sessionToken: v.string(),
    demoRequestId: v.id("demo_requests"),
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    schoolName: v.optional(v.string()),
    schoolType: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    preferredDemoDate: v.optional(v.string()),
    needs: v.optional(v.string()),
    country: v.optional(v.string()),
    county: v.optional(v.string()),
    studentCount: v.optional(v.number()),
    currentSystem: v.optional(v.string()),
    referralSource: v.optional(v.string()),
    referralCode: v.optional(v.string()),
    sourceChannel: v.optional(v.string()),
    marketingAttribution: v.optional(marketingAttributionValidator),
    status: v.optional(DEMO_STATUS),
    priority: v.optional(DEMO_PRIORITY),
    assignedTo: v.optional(v.string()),
    assignedTeam: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
    scheduledEndAt: v.optional(v.number()),
    meetingUrl: v.optional(v.string()),
    nextActionAt: v.optional(v.number()),
    nextActionLabel: v.optional(v.string()),
    lastContactedAt: v.optional(v.number()),
    notesInternal: v.optional(v.string()),
    outcome: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformContext(ctx, args, "demo_requests.edit");
    const existing = await ctx.db.get(args.demoRequestId);
    if (!existing) throw new Error("Demo request not found");

    const request = await persistDemoRequest(ctx, {
      existing,
      data: {
        ...existing,
        ...args,
        marketingAttribution: mergeMarketingAttribution(existing.marketingAttribution, args.marketingAttribution),
      },
      actorId: platform.userId,
      actorEmail: platform.email,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "demo_request.updated" as any,
      entityType: "demo_request",
      entityId: String(request._id),
      before: {
        status: existing.status,
        assignedTo: existing.assignedTo,
        scheduledFor: existing.scheduledFor,
      },
      after: {
        status: request.status,
        assignedTo: request.assignedTo,
        scheduledFor: request.scheduledFor,
      },
    });

    await recordDemoEvent(ctx, {
      demoRequestId: request._id,
      eventType: "updated",
      title: "Demo request updated",
      body: `Status is ${request.status}.`,
      actorUserId: platform.userId,
      actorEmail: platform.email,
      metadata: {
        previousStatus: existing.status,
        newStatus: request.status,
        assignedTo: request.assignedTo,
      },
    });

    return { success: true };
  },
});

export const assignDemoRequest = mutation({
  args: {
    sessionToken: v.string(),
    demoRequestId: v.id("demo_requests"),
    assignedTo: v.optional(v.string()),
    assignedTeam: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformContext(ctx, args, "demo_requests.assign");
    const existing = await ctx.db.get(args.demoRequestId);
    if (!existing) throw new Error("Demo request not found");

    await ctx.db.patch(args.demoRequestId, {
      assignedTo: cleanString(args.assignedTo),
      assignedTeam: cleanString(args.assignedTeam),
      updatedAt: Date.now(),
    });

    if (existing.crmLeadId) {
      const crmLead: any = await ctx.db.get(existing.crmLeadId as any);
      if (crmLead) {
        await ctx.db.patch(crmLead._id, {
          assignedTo: cleanString(args.assignedTo),
          updatedAt: Date.now(),
        });
      }
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "demo_request.assigned" as any,
      entityType: "demo_request",
      entityId: String(args.demoRequestId),
      before: { assignedTo: existing.assignedTo, assignedTeam: existing.assignedTeam },
      after: { assignedTo: args.assignedTo, assignedTeam: args.assignedTeam },
    });

    await recordDemoEvent(ctx, {
      demoRequestId: args.demoRequestId,
      eventType: "assigned",
      title: "Owner updated",
      body: cleanString(args.assignedTo)
        ? `Assigned to ${cleanString(args.assignedTo)}.`
        : "Returned to unassigned queue.",
      actorUserId: platform.userId,
      actorEmail: platform.email,
      metadata: {
        previousAssignedTo: existing.assignedTo,
        assignedTo: cleanString(args.assignedTo),
        assignedTeam: cleanString(args.assignedTeam),
      },
    });

    await notifyDemoOwner(ctx, {
      userId: cleanString(args.assignedTo),
      title: "New demo request assigned",
      body: `${existing.schoolName} has been assigned to you for follow-up.`,
      actionUrl: `/platform/demo-requests`,
      dedupeKey: `demo_assignment:${String(args.demoRequestId)}:${cleanString(args.assignedTo)}`,
      metadata: {
        demoRequestId: String(args.demoRequestId),
      },
    });

    return { success: true };
  },
});

export const scheduleDemoRequest = mutation({
  args: {
    sessionToken: v.string(),
    demoRequestId: v.id("demo_requests"),
    scheduledFor: v.number(),
    scheduledEndAt: v.optional(v.number()),
    meetingUrl: v.optional(v.string()),
    nextActionAt: v.optional(v.number()),
    nextActionLabel: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformContext(ctx, args, "demo_requests.schedule");
    const existing = await ctx.db.get(args.demoRequestId);
    if (!existing) throw new Error("Demo request not found");

    const nextActionAt = args.nextActionAt ?? args.scheduledFor - 4 * 60 * 60 * 1000;
    const nextActionLabel = cleanString(args.nextActionLabel) ?? "Send meeting prep";

    await ctx.db.patch(args.demoRequestId, {
      status: "scheduled",
      assignedTo: cleanString(args.assignedTo) ?? existing.assignedTo,
      scheduledFor: args.scheduledFor,
      scheduledEndAt: args.scheduledEndAt,
      meetingUrl: cleanString(args.meetingUrl),
      nextActionAt,
      nextActionLabel,
      updatedAt: Date.now(),
    });

    if (existing.crmLeadId) {
      const crmLead: any = await ctx.db.get(existing.crmLeadId as any);
      if (crmLead) {
        await ctx.db.patch(crmLead._id, {
          stage: "demo_booked",
          assignedTo: cleanString(args.assignedTo) ?? existing.assignedTo,
          nextFollowUpAt: nextActionAt,
          nextFollowUpNote: nextActionLabel,
          updatedAt: Date.now(),
        });
      }
    }

    if (existing.crmLeadId) {
      await ctx.db.insert("crm_activities", {
        leadId: existing.crmLeadId as any,
        createdByUserId: platform.userId,
        type: "demo_scheduled",
        subject: "Demo scheduled",
        body: cleanString(args.meetingUrl)
          ? `Meeting URL: ${cleanString(args.meetingUrl)}`
          : "Demo scheduled from platform panel",
        isPrivate: false,
        scheduledAt: args.scheduledFor,
        completedAt: undefined,
        metadata: {
          demoRequestId: String(args.demoRequestId),
          scheduledEndAt: args.scheduledEndAt,
        },
        outcome: undefined,
        durationMinutes:
          args.scheduledEndAt && args.scheduledEndAt > args.scheduledFor
            ? Math.round((args.scheduledEndAt - args.scheduledFor) / 60000)
            : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    const name = splitName(existing.fullName);
    await sendPlatformEmail(ctx, {
      to: [existing.email],
      subject: `Your EduMyles demo is scheduled, ${name.firstName}`,
      text: `Hi ${name.firstName},\n\nYour EduMyles demo for ${existing.schoolName} is scheduled for ${new Date(args.scheduledFor).toLocaleString()}${args.meetingUrl ? `.\n\nJoin here: ${args.meetingUrl}` : "."}\n\nThe EduMyles Team`,
    });

    await recordDemoEvent(ctx, {
      demoRequestId: args.demoRequestId,
      eventType: "scheduled",
      title: "Demo scheduled",
      body: `Booked for ${new Date(args.scheduledFor).toISOString()}.`,
      actorUserId: platform.userId,
      actorEmail: platform.email,
      metadata: {
        scheduledFor: args.scheduledFor,
        scheduledEndAt: args.scheduledEndAt,
        meetingUrl: cleanString(args.meetingUrl),
      },
    });

    await notifyDemoOwner(ctx, {
      userId: cleanString(args.assignedTo) ?? existing.assignedTo,
      title: "Demo booked",
      body: `${existing.schoolName} is booked for ${new Date(args.scheduledFor).toLocaleString()}.`,
      actionUrl: "/platform/demo-requests",
      dedupeKey: `demo_scheduled:${String(args.demoRequestId)}:${args.scheduledFor}`,
      metadata: {
        demoRequestId: String(args.demoRequestId),
        scheduledFor: args.scheduledFor,
      },
    });

    return { success: true };
  },
});

export const setDemoRequestStatus = mutation({
  args: {
    sessionToken: v.string(),
    demoRequestId: v.id("demo_requests"),
    status: DEMO_STATUS,
    outcome: v.optional(v.string()),
    lastContactedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformContext(ctx, args, "demo_requests.edit");
    const existing = await ctx.db.get(args.demoRequestId);
    if (!existing) throw new Error("Demo request not found");

    await ctx.db.patch(args.demoRequestId, {
      status: args.status,
      outcome: cleanString(args.outcome),
      lastContactedAt: args.lastContactedAt ?? existing.lastContactedAt,
      updatedAt: Date.now(),
    });

    if (existing.crmLeadId) {
      const crmLead: any = await ctx.db.get(existing.crmLeadId as any);
      if (crmLead) {
        await ctx.db.patch(crmLead._id, {
          stage: deriveCrmStage(args.status, existing.qualificationScore),
          status: args.status === "cancelled" ? "lost" : (crmLead as any).status,
          lastContactedAt: args.lastContactedAt ?? (crmLead as any).lastContactedAt,
          updatedAt: Date.now(),
        });
      }
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "demo_request.status_changed" as any,
      entityType: "demo_request",
      entityId: String(args.demoRequestId),
      before: { status: existing.status },
      after: { status: args.status, outcome: args.outcome },
    });

    await recordDemoEvent(ctx, {
      demoRequestId: args.demoRequestId,
      eventType: "status_changed",
      title: `Status changed to ${args.status}`,
      body: cleanString(args.outcome),
      actorUserId: platform.userId,
      actorEmail: platform.email,
      metadata: {
        previousStatus: existing.status,
        status: args.status,
      },
    });

    return { success: true };
  },
});

export const deleteDemoRequest = mutation({
  args: {
    sessionToken: v.string(),
    demoRequestId: v.id("demo_requests"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformContext(ctx, args, "demo_requests.delete");
    const existing = await ctx.db.get(args.demoRequestId);
    if (!existing) throw new Error("Demo request not found");

    await ctx.db.patch(args.demoRequestId, {
      deletedAt: Date.now(),
      deletedBy: platform.userId,
      updatedAt: Date.now(),
      notesInternal: [existing.notesInternal, `Deleted reason: ${args.reason.trim()}`].filter(Boolean).join("\n"),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "demo_request.deleted" as any,
      entityType: "demo_request",
      entityId: String(args.demoRequestId),
      after: { reason: args.reason.trim() },
    });

    await recordDemoEvent(ctx, {
      demoRequestId: args.demoRequestId,
      eventType: "archived",
      title: "Demo request archived",
      body: args.reason.trim(),
      actorUserId: platform.userId,
      actorEmail: platform.email,
    });

    return { success: true };
  },
});

export const restoreDemoRequest = mutation({
  args: {
    sessionToken: v.string(),
    demoRequestId: v.id("demo_requests"),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformContext(ctx, args, "demo_requests.delete");
    const existing = await ctx.db.get(args.demoRequestId);
    if (!existing) throw new Error("Demo request not found");

    await ctx.db.patch(args.demoRequestId, {
      deletedAt: undefined,
      deletedBy: undefined,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "demo_request.restored" as any,
      entityType: "demo_request",
      entityId: String(args.demoRequestId),
    });

    await recordDemoEvent(ctx, {
      demoRequestId: args.demoRequestId,
      eventType: "restored",
      title: "Demo request restored",
      actorUserId: platform.userId,
      actorEmail: platform.email,
    });

    return { success: true };
  },
});

export const ingestCalendarBookingWebhook = mutation({
  args: {
    triggerEvent: v.string(),
    createdAt: v.optional(v.string()),
    bookingUid: v.optional(v.string()),
    bookingId: v.optional(v.union(v.string(), v.number())),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    meetingUrl: v.optional(v.string()),
    eventTypeTitle: v.optional(v.string()),
    demoRequestId: v.optional(v.string()),
    attendeeName: v.optional(v.string()),
    attendeeEmail: v.string(),
    attendeeNotes: v.optional(v.string()),
    rawPayload: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.attendeeEmail);
    const normalizedDemoRequestId = args.demoRequestId
      ? ctx.db.normalizeId("demo_requests", args.demoRequestId)
      : null;
    const requestById = normalizedDemoRequestId ? await ctx.db.get(normalizedDemoRequestId) : null;
    const request =
      requestById && !requestById.deletedAt
        ? requestById
        : (
            await ctx.db
              .query("demo_requests")
              .withIndex("by_email", (q: any) => q.eq("email", email))
              .collect()
          )
            .filter((item: any) => !item.deletedAt)
            .sort((left: any, right: any) => right.updatedAt - left.updatedAt)[0];

    if (!request) {
      return { matched: false };
    }

    const bookingUid = cleanString(args.bookingUid);
    const bookingId = args.bookingId !== undefined ? String(args.bookingId) : undefined;
    const scheduledFor = parseDateInput(args.startTime);
    const scheduledEndAt = parseDateInput(args.endTime);

    if (args.triggerEvent === "BOOKING_CREATED" || args.triggerEvent === "BOOKING_RESCHEDULED") {
      await ctx.db.patch(request._id, {
        status: "scheduled",
        scheduledFor: scheduledFor ?? request.scheduledFor,
        scheduledEndAt: scheduledEndAt ?? request.scheduledEndAt,
        meetingUrl: cleanString(args.meetingUrl) ?? request.meetingUrl,
        bookingSource: "cal.com",
        externalBookingUid: bookingUid ?? request.externalBookingUid,
        externalBookingId: bookingId ?? request.externalBookingId,
        nextActionAt: (scheduledFor ?? request.scheduledFor ?? Date.now()) - 4 * 60 * 60 * 1000,
        nextActionLabel: "Send meeting prep",
        updatedAt: Date.now(),
      });

      await recordDemoEvent(ctx, {
        demoRequestId: request._id,
        eventType: args.triggerEvent === "BOOKING_RESCHEDULED" ? "calendar_rescheduled" : "calendar_booked",
        title: args.triggerEvent === "BOOKING_RESCHEDULED" ? "Booking rescheduled from Cal.com" : "Booking created from Cal.com",
        body: scheduledFor ? `Cal.com booked ${new Date(scheduledFor).toISOString()}.` : undefined,
        actorUserId: "system",
        actorEmail: "cal.com",
        metadata: {
          bookingUid,
          bookingId,
          meetingUrl: cleanString(args.meetingUrl),
          rawPayload: args.rawPayload,
        },
      });
    } else if (args.triggerEvent === "BOOKING_CANCELLED") {
      await ctx.db.patch(request._id, {
        status: "cancelled",
        bookingSource: "cal.com",
        externalBookingUid: bookingUid ?? request.externalBookingUid,
        externalBookingId: bookingId ?? request.externalBookingId,
        updatedAt: Date.now(),
      });

      await recordDemoEvent(ctx, {
        demoRequestId: request._id,
        eventType: "calendar_cancelled",
        title: "Booking cancelled from Cal.com",
        body: cleanString(args.attendeeNotes),
        actorUserId: "system",
        actorEmail: "cal.com",
        metadata: {
          bookingUid,
          bookingId,
          rawPayload: args.rawPayload,
        },
      });
    } else if (args.triggerEvent === "MEETING_ENDED") {
      await ctx.db.patch(request._id, {
        status: request.status === "cancelled" ? request.status : "completed",
        updatedAt: Date.now(),
      });
      await recordDemoEvent(ctx, {
        demoRequestId: request._id,
        eventType: "meeting_ended",
        title: "Meeting ended",
        actorUserId: "system",
        actorEmail: "cal.com",
        metadata: { bookingUid, bookingId, rawPayload: args.rawPayload },
      });
    } else if (args.triggerEvent === "MEETING_STARTED") {
      await recordDemoEvent(ctx, {
        demoRequestId: request._id,
        eventType: "meeting_started",
        title: "Meeting started",
        actorUserId: "system",
        actorEmail: "cal.com",
        metadata: { bookingUid, bookingId, rawPayload: args.rawPayload },
      });
    }

    return { matched: true, demoRequestId: String(request._id) };
  },
});

export const sendUpcomingDemoReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const upperBound = now + REMINDER_WINDOW_MS;
    const requests = await ctx.db.query("demo_requests").collect();
    const operators = await getPlatformOperators(ctx);
      const operatorMap = new Map<string, any>(operators.map((operator: any) => [operator.userId, operator]));
    let notifications = 0;
    let emails = 0;

    for (const request of requests) {
      if (request.deletedAt || request.status !== "scheduled" || !request.scheduledFor || !request.assignedTo) continue;
      if (request.scheduledFor < now || request.scheduledFor > upperBound) continue;

      const dedupeKey = `demo_reminder:${String(request._id)}:${request.scheduledFor}`;
      const notified = await notifyDemoOwner(ctx, {
        userId: request.assignedTo,
        title: "Demo happening within 24 hours",
        body: `${request.schoolName} is booked for ${new Date(request.scheduledFor).toLocaleString()}.`,
        actionUrl: "/platform/demo-requests",
        dedupeKey,
        metadata: { demoRequestId: String(request._id), scheduledFor: request.scheduledFor },
      });

      if (notified) {
        notifications += 1;
        await recordDemoEvent(ctx, {
          demoRequestId: request._id,
          eventType: "reminder_sent",
          title: "Upcoming demo reminder sent",
          actorUserId: "system",
          actorEmail: "no-reply@edumyles.co.ke",
          metadata: { scheduledFor: request.scheduledFor, dedupeKey },
        });
      }

      const operator: any = operatorMap.get(request.assignedTo);
      if (operator?.email && notified) {
        await sendPlatformEmail(ctx, {
          to: [operator.email],
          subject: `Upcoming demo: ${request.schoolName}`,
          text: `${request.schoolName} is booked for ${new Date(request.scheduledFor).toLocaleString()}.\n\nOpen Demo Ops to review context and prep the walkthrough.`,
        });
        emails += 1;
      }
    }

    return { notifications, emails };
  },
});

export const sendOverdueDemoAlerts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const requests = await ctx.db.query("demo_requests").collect();
    let created = 0;

    for (const request of requests) {
      if (request.deletedAt || !request.nextActionAt || request.nextActionAt > Date.now()) continue;
      if (["completed", "cancelled"].includes(request.status) || !request.assignedTo) continue;

      const dedupeKey = `demo_overdue:${String(request._id)}:${request.nextActionAt}`;
      const notified = await notifyDemoOwner(ctx, {
        userId: request.assignedTo,
        title: "Overdue demo follow-up",
        body: `${request.schoolName} needs attention: ${request.nextActionLabel ?? "follow-up overdue"}.`,
        actionUrl: "/platform/demo-requests",
        dedupeKey,
        metadata: { demoRequestId: String(request._id), nextActionAt: request.nextActionAt },
      });

      if (notified) {
        created += 1;
        await recordDemoEvent(ctx, {
          demoRequestId: request._id,
          eventType: "overdue_alert_sent",
          title: "Overdue follow-up alert sent",
          actorUserId: "system",
          actorEmail: "no-reply@edumyles.co.ke",
          metadata: { nextActionAt: request.nextActionAt, dedupeKey },
        });
      }
    }

    return { created };
  },
});

export const sendDailyDemoDigest = internalMutation({
  args: {},
  handler: async (ctx) => {
    const operators = await getPlatformOperators(ctx);
    const requests = await ctx.db.query("demo_requests").collect();
    let emails = 0;

    for (const operator of operators) {
      if (!operator.email) continue;
      const owned = requests.filter((request: any) => request.assignedTo === operator.userId && !request.deletedAt);
      if (owned.length === 0) continue;

      const upcoming = owned
        .filter((request: any) => request.scheduledFor && request.scheduledFor > Date.now())
        .sort((left: any, right: any) => (left.scheduledFor ?? 0) - (right.scheduledFor ?? 0))
        .slice(0, 5);
      const overdue = owned.filter(
        (request: any) =>
          request.nextActionAt &&
          request.nextActionAt < Date.now() &&
          !["completed", "cancelled"].includes(request.status)
      );

      if (upcoming.length === 0 && overdue.length === 0) continue;

      const dedupeKey = `demo_digest:${operator.userId}:${new Date().toISOString().slice(0, 10)}`;
      if (await hasPlatformNotificationFor(ctx, operator.userId, dedupeKey)) continue;

      await notifyDemoOwner(ctx, {
        userId: operator.userId,
        title: "Daily demo ops digest",
        body: `${upcoming.length} upcoming demo(s) and ${overdue.length} overdue follow-up(s) need review.`,
        actionUrl: "/platform/demo-requests",
        dedupeKey,
      });

      await sendPlatformEmail(ctx, {
        to: [operator.email],
        subject: "Daily Demo Ops Digest",
        text: [
          `You have ${upcoming.length} upcoming demo(s) and ${overdue.length} overdue follow-up(s).`,
          "",
          ...upcoming.map((request: any) => `Upcoming: ${request.schoolName} at ${new Date(request.scheduledFor).toLocaleString()}`),
          ...overdue.map((request: any) => `Overdue: ${request.schoolName} (${request.nextActionLabel ?? "follow-up"})`),
        ].join("\n"),
      });
      emails += 1;
    }

    return { emails };
  },
});

export const getDemoRequests = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformContext(ctx, args, "demo_requests.view");
    return await ctx.db.query("demo_requests").withIndex("by_createdAt").order("desc").take(200);
  },
});
