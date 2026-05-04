import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requirePlatformRole } from "./helpers/platformGuard";
import { logAction } from "./helpers/auditLog";

const CHANNELS = ["live_chat", "whatsapp"] as const;
const STATUSES = ["new", "open", "contacted", "qualified", "closed", "spam"] as const;
const PLATFORM_REVIEW_ROLES = ["master_admin", "super_admin", "platform_manager", "support_agent"];

function clean(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 2000) : undefined;
}

function normalizeEmail(value?: string) {
  return clean(value)?.toLowerCase();
}

function derivePriority(topic: string, message: string) {
  const combined = `${topic} ${message}`.toLowerCase();
  return combined.includes("urgent") ||
    combined.includes("pricing") ||
    combined.includes("demo") ||
    combined.includes("enterprise")
    ? "high"
    : "normal";
}

export const submitLandingEngagement = mutation({
  args: {
    channel: v.union(v.literal("live_chat"), v.literal("whatsapp")),
    topic: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    schoolName: v.optional(v.string()),
    role: v.optional(v.string()),
    country: v.optional(v.string()),
    message: v.string(),
    composedWhatsAppMessage: v.optional(v.string()),
    whatsappUrl: v.optional(v.string()),
    pagePath: v.optional(v.string()),
    referrer: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    marketingAttribution: v.optional(v.any()),
    source: v.optional(v.string()),
    visitorToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const topic = clean(args.topic) ?? "General enquiry";
    const message = clean(args.message) ?? "";
    const email = normalizeEmail(args.email);
    const phone = clean(args.phone);

    const recentByEmail = email
      ? await ctx.db
          .query("landingEngagements")
          .withIndex("by_email", (q) => q.eq("email", email))
          .order("desc")
          .first()
      : null;
    const recentByPhone =
      !recentByEmail && phone
        ? await ctx.db
            .query("landingEngagements")
            .withIndex("by_phone", (q) => q.eq("phone", phone))
            .order("desc")
            .first()
        : null;

    const duplicate = recentByEmail ?? recentByPhone;
    const duplicateWindowMs = 1000 * 60 * 60 * 24;
    const isDuplicate =
      Boolean(duplicate) &&
      duplicate!.channel === args.channel &&
      duplicate!.topic === topic &&
      now - duplicate!.createdAt < duplicateWindowMs;

    if (isDuplicate) {
      await ctx.db.patch(duplicate!._id, {
        message,
        composedWhatsAppMessage: clean(args.composedWhatsAppMessage),
        whatsappUrl: clean(args.whatsappUrl),
        pagePath: clean(args.pagePath),
        referrer: clean(args.referrer),
        userAgent: clean(args.userAgent),
        marketingAttribution: args.marketingAttribution,
        updatedAt: now,
      });
      return { success: true, engagementId: duplicate!._id, alreadyExists: true };
    }

    const initialMessages =
      args.channel === "live_chat"
        ? [
            {
              sender: "visitor" as const,
              body: message,
              authorName: clean(args.name) ?? "Visitor",
              createdAt: now,
            },
            {
              sender: "system" as const,
              body: "Thanks. Your message is in the queue and an EduMyles specialist can join this chat shortly.",
              authorName: "EduMyles",
              createdAt: now + 1,
            },
          ]
        : undefined;

    const engagementId = await ctx.db.insert("landingEngagements", {
      channel: args.channel,
      status: "new",
      priority: derivePriority(topic, message),
      topic,
      name: clean(args.name) ?? "Landing visitor",
      email,
      phone,
      schoolName: clean(args.schoolName),
      role: clean(args.role),
      country: clean(args.country),
      message,
      composedWhatsAppMessage: clean(args.composedWhatsAppMessage),
      whatsappUrl: clean(args.whatsappUrl),
      pagePath: clean(args.pagePath),
      referrer: clean(args.referrer),
      userAgent: clean(args.userAgent),
      marketingAttribution: args.marketingAttribution,
      source: clean(args.source) ?? "landing_contact_widget",
      visitorToken: clean(args.visitorToken),
      chatStatus: args.channel === "live_chat" ? "waiting" : undefined,
      messages: initialMessages,
      createdAt: now,
      updatedAt: now,
    });

    const platformAdmins = await ctx.db
      .query("users")
      .withIndex("by_tenant", (q) => q.eq("tenantId", "PLATFORM"))
      .collect();

    for (const admin of platformAdmins.filter(
      (user) =>
        user.isActive &&
        ["master_admin", "super_admin", "platform_manager", "support_agent"].includes(user.role) &&
        Boolean(user.workosUserId)
    )) {
      await ctx.db.insert("notifications", {
        tenantId: "PLATFORM",
        userId: admin.workosUserId,
        title: args.channel === "whatsapp" ? "WhatsApp lead captured" : "Live chat message received",
        message: `${clean(args.name) ?? "A landing visitor"} asked about ${topic}.`,
        type: "support",
        isRead: false,
        link: "/platform/landing-engagements",
        createdAt: now,
      });
    }

    return { success: true, engagementId, alreadyExists: false };
  },
});

export const getVisitorChatThread = query({
  args: {
    engagementId: v.id("landingEngagements"),
    visitorToken: v.string(),
  },
  handler: async (ctx, args) => {
    const engagement = await ctx.db.get(args.engagementId);
    if (!engagement || engagement.channel !== "live_chat") {
      throw new Error("CHAT_NOT_FOUND");
    }
    if (!engagement.visitorToken || engagement.visitorToken !== args.visitorToken) {
      throw new Error("UNAUTHORIZED");
    }

    return {
      engagementId: engagement._id,
      status: engagement.status,
      chatStatus: engagement.chatStatus ?? "waiting",
      agentName: engagement.agentName,
      messages: engagement.messages ?? [],
      updatedAt: engagement.updatedAt,
    };
  },
});

export const sendVisitorChatMessage = mutation({
  args: {
    engagementId: v.id("landingEngagements"),
    visitorToken: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const engagement = await ctx.db.get(args.engagementId);
    if (!engagement || engagement.channel !== "live_chat") {
      throw new Error("CHAT_NOT_FOUND");
    }
    if (!engagement.visitorToken || engagement.visitorToken !== args.visitorToken) {
      throw new Error("UNAUTHORIZED");
    }

    const body = clean(args.message);
    if (!body) throw new Error("MESSAGE_REQUIRED");

    const now = Date.now();
    const messages = [
      ...(engagement.messages ?? []),
      {
        sender: "visitor" as const,
        body,
        authorName: engagement.name,
        createdAt: now,
      },
    ];

    await ctx.db.patch(args.engagementId, {
      message: body,
      messages,
      status: engagement.status === "new" ? "open" : engagement.status,
      updatedAt: now,
    });

    return {
      success: true,
      messages,
      chatStatus: engagement.chatStatus ?? "waiting",
      agentName: engagement.agentName,
    };
  },
});

export const listLandingEngagements = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.union(...STATUSES.map((status) => v.literal(status)))),
    channel: v.optional(v.union(...CHANNELS.map((channel) => v.literal(channel)))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformRole(ctx, { sessionToken: args.sessionToken }, PLATFORM_REVIEW_ROLES);
    const limit = Math.min(args.limit ?? 100, 200);
    let records = args.status
      ? await ctx.db
          .query("landingEngagements")
          .withIndex("by_status_created", (q) => q.eq("status", args.status!))
          .order("desc")
          .take(limit)
      : await ctx.db.query("landingEngagements").order("desc").take(limit);

    if (args.channel) {
      records = records.filter((record) => record.channel === args.channel);
    }

    return records;
  },
});

export const getLandingEngagementStats = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformRole(ctx, { sessionToken: args.sessionToken }, PLATFORM_REVIEW_ROLES);
    const all = await ctx.db.query("landingEngagements").collect();
    return {
      total: all.length,
      new: all.filter((record) => record.status === "new").length,
      open: all.filter((record) => record.status === "open").length,
      contacted: all.filter((record) => record.status === "contacted").length,
      qualified: all.filter((record) => record.status === "qualified").length,
      whatsapp: all.filter((record) => record.channel === "whatsapp").length,
      liveChat: all.filter((record) => record.channel === "live_chat").length,
    };
  },
});

export const updateLandingEngagement = mutation({
  args: {
    sessionToken: v.string(),
    engagementId: v.id("landingEngagements"),
    status: v.optional(v.union(...STATUSES.map((status) => v.literal(status)))),
    assignedTo: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requirePlatformRole(
      ctx,
      { sessionToken: args.sessionToken },
      PLATFORM_REVIEW_ROLES
    );
    const engagement = await ctx.db.get(args.engagementId);
    if (!engagement) throw new Error("ENGAGEMENT_NOT_FOUND");

    const now = Date.now();
    const patch: Record<string, unknown> = { updatedAt: now };
    if (args.status) {
      patch.status = args.status;
      if (args.status === "contacted") patch.lastContactedAt = now;
    }
    if (args.assignedTo !== undefined) patch.assignedTo = clean(args.assignedTo);
    if (args.note?.trim()) {
      patch.adminNotes = [
        ...(engagement.adminNotes ?? []),
        {
          body: args.note.trim().slice(0, 2000),
          authorId: admin.userId,
          authorEmail: admin.email,
          createdAt: now,
        },
      ];
    }

    await ctx.db.patch(args.engagementId, patch);
    await logAction(ctx, {
      tenantId: admin.tenantId,
      actorId: admin.userId,
      actorEmail: admin.email,
      action: "support.ticket.updated",
      entityType: "landingEngagement",
      entityId: args.engagementId,
      after: patch,
    });

    return { success: true };
  },
});

export const joinLandingChat = mutation({
  args: {
    sessionToken: v.string(),
    engagementId: v.id("landingEngagements"),
  },
  handler: async (ctx, args) => {
    const admin = await requirePlatformRole(
      ctx,
      { sessionToken: args.sessionToken },
      PLATFORM_REVIEW_ROLES
    );
    const engagement = await ctx.db.get(args.engagementId);
    if (!engagement || engagement.channel !== "live_chat") throw new Error("CHAT_NOT_FOUND");

    const now = Date.now();
    const agentName = admin.email?.split("@")[0] || "EduMyles specialist";
    const messages = [
      ...(engagement.messages ?? []),
      {
        sender: "system" as const,
        body: `${agentName} has joined the chat.`,
        authorName: "EduMyles",
        authorId: admin.userId,
        createdAt: now,
      },
    ];

    await ctx.db.patch(args.engagementId, {
      chatStatus: "active",
      status: "contacted",
      assignedTo: admin.userId,
      agentName,
      agentJoinedAt: now,
      lastContactedAt: now,
      messages,
      updatedAt: now,
    });

    return { success: true, agentName, messages };
  },
});

export const sendAgentChatMessage = mutation({
  args: {
    sessionToken: v.string(),
    engagementId: v.id("landingEngagements"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requirePlatformRole(
      ctx,
      { sessionToken: args.sessionToken },
      PLATFORM_REVIEW_ROLES
    );
    const engagement = await ctx.db.get(args.engagementId);
    if (!engagement || engagement.channel !== "live_chat") throw new Error("CHAT_NOT_FOUND");
    const body = clean(args.message);
    if (!body) throw new Error("MESSAGE_REQUIRED");

    const now = Date.now();
    const agentName = engagement.agentName || admin.email?.split("@")[0] || "EduMyles specialist";
    const messages = [
      ...(engagement.messages ?? []),
      {
        sender: "agent" as const,
        body,
        authorName: agentName,
        authorId: admin.userId,
        createdAt: now,
      },
    ];

    await ctx.db.patch(args.engagementId, {
      chatStatus: "active",
      status: "contacted",
      assignedTo: engagement.assignedTo ?? admin.userId,
      agentName,
      messages,
      updatedAt: now,
      lastContactedAt: now,
    });

    return { success: true, messages };
  },
});
