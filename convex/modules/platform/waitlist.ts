import { mutation, query } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";
import { idGenerator } from "../../helpers/idGenerator";

export const addToWaitlist = mutation({
  args: {
    fullName: v.string(),
    email: v.string(),
    schoolName: v.string(),
    country: v.string(),
    studentCount: v.optional(v.number()),
    phone: v.optional(v.string()),
    referralSource: v.optional(v.string()),
    biggestChallenge: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      return { success: true, waitlistId: existing._id, duplicate: true };
    }

    const waitlistId = await ctx.db.insert("waitlist", {
      ...args,
      status: "waiting",
      invitedAt: undefined,
      convertedAt: undefined,
      crmLeadId: undefined,
      inviteToken: undefined,
      inviteExpiresAt: undefined,
      createdAt: now,
      updatedAt: now,
    });

    const existingLead = await ctx.db
      .query("crm_leads")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!existingLead) {
      const qualificationScore = (args.studentCount ?? 0) > 500 ? 2 : 0;
      const leadId = await ctx.db.insert("crm_leads", {
        schoolName: args.schoolName,
        contactName: args.fullName,
        email: args.email,
        phone: args.phone,
        country: args.country,
        studentCount: args.studentCount,
        budgetConfirmed: undefined,
        timeline: undefined,
        decisionMaker: args.fullName,
        source: args.referralSource ?? "waitlist",
        qualificationScore,
        stage: qualificationScore >= 2 ? "new_lead" : "new_lead",
        assignedTo: undefined,
        dealValueKes: undefined,
        expectedClose: undefined,
        tenantId: undefined,
        notes: args.biggestChallenge,
        status: qualificationScore >= 2 ? "high_value_waitlist" : "open",
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.patch(waitlistId, {
        crmLeadId: String(leadId),
        updatedAt: now,
      });
    }

    await ctx.scheduler.runAfter(0, internal.actions.communications.email.sendEmailInternal, {
      tenantId: "PLATFORM",
      actorId: "system",
      actorEmail: "no-reply@edumyles.com",
      to: [args.email],
      subject: "You are on the EduMyles waitlist",
      text: `Hi ${args.fullName}, you have been added to the EduMyles waitlist for ${args.schoolName}.`,
    });

    return { success: true, waitlistId };
  },
});

export const getWaitlistEntries = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    let entries = await ctx.db.query("waitlist").collect();
    if (args.status) {
      entries = entries.filter((entry) => entry.status === args.status);
    }
    if (args.search) {
      const search = args.search.toLowerCase();
      entries = entries.filter((entry) =>
        [entry.fullName, entry.email, entry.schoolName].some((value) =>
          value.toLowerCase().includes(search)
        )
      );
    }

    return entries;
  },
});

export const updateWaitlistStatus = mutation({
  args: {
    sessionToken: v.string(),
    waitlistId: v.id("waitlist"),
    status: v.union(
      v.literal("waiting"),
      v.literal("invited"),
      v.literal("converted"),
      v.literal("rejected")
    ),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    await ctx.db.patch(args.waitlistId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: args.status === "rejected" ? "waitlist.rejected" : "waitlist.approved",
      entityType: "waitlist",
      entityId: String(args.waitlistId),
      after: { status: args.status, reason: args.reason },
    });

    return { success: true };
  },
});

export const inviteFromWaitlist = mutation({
  args: {
    sessionToken: v.string(),
    waitlistId: v.id("waitlist"),
    tenantId: v.string(),
    role: v.string(),
    personalMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    const entry = await ctx.db.get(args.waitlistId);
    if (!entry) {
      throw new Error("Waitlist entry not found");
    }

    const now = Date.now();
    const token = idGenerator("tenant_invite");
    const inviteId = await ctx.db.insert("tenant_invites", {
      email: entry.email,
      tenantId: args.tenantId,
      role: args.role,
      invitedBy: platform.userId,
      token,
      status: "pending",
      expiresAt: now + 7 * 24 * 60 * 60 * 1000,
      acceptedAt: undefined,
      personalMessage: args.personalMessage,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.waitlistId, {
      status: "invited",
      invitedAt: now,
      inviteToken: token,
      inviteExpiresAt: now + 7 * 24 * 60 * 60 * 1000,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.actions.communications.email.sendEmailInternal, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      to: [entry.email],
      subject: "Your EduMyles invite is ready",
      text: `Your invite token is ${token}. You have been invited to join tenant ${args.tenantId} as ${args.role}.`,
    });

    return { success: true, inviteId, token };
  },
});

export const convertWaitlistEntry = mutation({
  args: {
    sessionToken: v.string(),
    waitlistId: v.id("waitlist"),
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const now = Date.now();
    const entry = await ctx.db.get(args.waitlistId);
    if (!entry) {
      throw new Error("Waitlist entry not found");
    }

    await ctx.db.patch(args.waitlistId, {
      status: "converted",
      convertedAt: now,
      updatedAt: now,
    });

    const existingLead = await ctx.db
      .query("crm_leads")
      .withIndex("by_email", (q) => q.eq("email", entry.email))
      .first();

    if (existingLead) {
      await ctx.db.patch(existingLead._id, {
        tenantId: args.tenantId,
        status: "converted",
        updatedAt: now,
      });
    }

    return { success: true };
  },
});
