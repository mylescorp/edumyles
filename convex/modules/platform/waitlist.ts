import { mutation, query, internalMutation } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";
import { requirePlatformContext } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

const WAITLIST_STATUS = v.union(
  v.literal("waiting"),
  v.literal("invited"),
  v.literal("converted"),
  v.literal("rejected"),
  v.literal("expired")
);

const waitlistBaseArgs = {
  fullName: v.string(),
  email: v.string(),
  schoolName: v.string(),
  country: v.string(),
  county: v.optional(v.string()),
  phone: v.optional(v.string()),
  studentCount: v.optional(v.number()),
  currentSystem: v.optional(v.string()),
  biggestChallenge: v.optional(v.string()),
  referralSource: v.optional(v.string()),
  referralCode: v.optional(v.string()),
  notes: v.optional(v.string()),
  sourceChannel: v.optional(v.string()),
};

function calculateQualificationScore(args: {
  country: string;
  county?: string;
  studentCount?: number;
  phone?: string;
  currentSystem?: string;
  biggestChallenge?: string;
  referralSource?: string;
  referralCode?: string;
}) {
  let score = 0;

  if (args.studentCount) {
    if (args.studentCount >= 1200) score += 35;
    else if (args.studentCount >= 750) score += 30;
    else if (args.studentCount >= 400) score += 24;
    else if (args.studentCount >= 250) score += 18;
    else if (args.studentCount >= 100) score += 12;
    else score += 6;
  }

  const primaryMarkets = ["Kenya", "Uganda", "Tanzania", "Rwanda", "Ethiopia"];
  const secondaryMarkets = ["Nigeria", "Ghana", "South Africa", "Zambia"];
  if (primaryMarkets.includes(args.country)) score += 18;
  else if (secondaryMarkets.includes(args.country)) score += 12;
  else score += 6;

  if (args.country === "Kenya" && args.county) score += 4;
  if (args.phone) score += 8;

  switch (args.currentSystem) {
    case "Paper records":
      score += 14;
      break;
    case "Excel/Spreadsheets":
      score += 12;
      break;
    case "Nothing":
      score += 10;
      break;
    case "Another school system":
      score += 7;
      break;
    default:
      break;
  }

  if (args.biggestChallenge && args.biggestChallenge.trim().length >= 24) score += 10;

  switch (args.referralSource) {
    case "Friend/Colleague":
      score += 8;
      break;
    case "School conference":
      score += 10;
      break;
    case "Google Search":
      score += 6;
      break;
    default:
      break;
  }

  if (args.referralCode) score += 14;

  return Math.min(100, score);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function sendPlatformEmail(
  ctx: any,
  args: {
    to: string[];
    subject: string;
    text: string;
    template?: string;
    data?: Record<string, any>;
  }
) {
  await ctx.scheduler.runAfter(0, internal.actions.communications.email.sendEmailInternal, {
    tenantId: "PLATFORM",
    actorId: "system",
    actorEmail: "no-reply@edumyles.co.ke",
    to: args.to,
    subject: args.subject,
    text: args.text,
    template: args.template,
    data: args.data,
  });
}

async function resolveReseller(ctx: any, referralCode?: string) {
  const code = referralCode?.trim();
  if (!code) return null;

  const resellers = await ctx.db.query("resellers").collect();
  return (
    resellers.find(
      (reseller: any) =>
        reseller.status === "active" &&
        (reseller.resellerId === code ||
          reseller.businessName?.toLowerCase() === code.toLowerCase())
    ) ?? null
  );
}

async function syncCrmLead(
  ctx: any,
  args: {
    entry: any;
    actorId: string;
    actorEmail: string;
    allowCreate: boolean;
  }
) {
  const existingLead = args.entry.crmLeadId
    ? ((await ctx.db.get(args.entry.crmLeadId as any)) as any)
    : await ctx.db
        .query("crm_leads")
        .withIndex("by_email", (q: any) => q.eq("email", args.entry.email))
        .first();

  const patch = {
    schoolName: args.entry.schoolName,
    contactName: args.entry.fullName,
    email: args.entry.email,
    phone: args.entry.phone,
    country: args.entry.country,
    studentCount: args.entry.studentCount,
    source: args.entry.sourceChannel ?? args.entry.referralSource ?? "waitlist",
    qualificationScore: args.entry.qualificationScore,
    assignedTo: args.entry.assignedTo,
    notes: [
      args.entry.notes,
      args.entry.biggestChallenge ? `Challenge: ${args.entry.biggestChallenge}` : undefined,
      args.entry.currentSystem ? `Current system: ${args.entry.currentSystem}` : undefined,
      args.entry.referralCode ? `Referral code: ${args.entry.referralCode}` : undefined,
      args.entry.resellerId ? `Reseller: ${args.entry.resellerId}` : undefined,
    ]
      .filter(Boolean)
      .join("\n"),
    stage:
      args.entry.status === "converted"
        ? "converted"
        : args.entry.status === "rejected"
          ? "closed_lost"
          : args.entry.status === "invited"
            ? "proposal_sent"
            : (args.entry.qualificationScore ?? 0) >= 60 || (args.entry.studentCount ?? 0) >= 250
              ? "qualified"
              : "new",
    status:
      args.entry.status === "rejected"
        ? "lost"
        : args.entry.status === "converted"
          ? "won"
          : "open",
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
    timeline: undefined,
    decisionMaker: "school_admin",
    source: patch.source,
    qualificationScore: patch.qualificationScore,
    stage: patch.stage,
    assignedTo: patch.assignedTo,
    dealValueKes: undefined,
    expectedClose: undefined,
    tenantId: undefined,
    notes: patch.notes,
    status: patch.status,
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

async function upsertWaitlistEntry(
  ctx: any,
  args: {
    fullName: string;
    email: string;
    schoolName: string;
    country: string;
    county?: string;
    phone?: string;
    studentCount?: number;
    currentSystem?: string;
    biggestChallenge?: string;
    referralSource?: string;
    referralCode?: string;
    notes?: string;
    sourceChannel?: string;
    assignedTo?: string;
    actorId: string;
    actorEmail: string;
    existingId?: any;
    allowCrmCreate: boolean;
    forceHighValue?: boolean;
  }
) {
  const now = Date.now();
  const email = normalizeEmail(args.email);
  const reseller = await resolveReseller(ctx, args.referralCode);
  const qualificationScore = calculateQualificationScore(args);
  const isHighValue =
    args.forceHighValue ?? (qualificationScore >= 75 || (args.studentCount ?? 0) >= 500);

  const existing =
    args.existingId
      ? ((await ctx.db.get(args.existingId)) as any)
      : await ctx.db.query("waitlist").withIndex("by_email", (q: any) => q.eq("email", email)).first();

  const sharedFields = {
    fullName: args.fullName.trim(),
    email,
    schoolName: args.schoolName.trim(),
    country: args.country.trim(),
    county: args.county?.trim() || undefined,
    phone: args.phone?.trim() || undefined,
    studentCount: args.studentCount,
    currentSystem: args.currentSystem?.trim() || undefined,
    biggestChallenge: args.biggestChallenge?.trim() || undefined,
    referralSource: args.referralSource?.trim() || undefined,
    referralCode: args.referralCode?.trim() || undefined,
    notes: args.notes?.trim() || undefined,
    sourceChannel: args.sourceChannel?.trim() || (existing?.sourceChannel ?? "landing_waitlist"),
    resellerId: reseller?.resellerId,
    qualificationScore,
    isHighValue,
    assignedTo: args.assignedTo ?? existing?.assignedTo,
    updatedAt: now,
  };

  let waitlistId = existing?._id;
  if (existing) {
    await ctx.db.patch(existing._id, sharedFields);
  } else {
    waitlistId = await ctx.db.insert("waitlist", {
      ...sharedFields,
      status: "waiting",
      invitedAt: undefined,
      inviteEmailSentAt: undefined,
      convertedAt: undefined,
      crmLeadId: undefined,
      inviteToken: undefined,
      inviteExpiresAt: undefined,
      tenantId: undefined,
      createdAt: now,
    });
  }

  const current = (await ctx.db.get(waitlistId)) as any;
  const crmResult = await syncCrmLead(ctx, {
    entry: current,
    actorId: args.actorId,
    actorEmail: args.actorEmail,
    allowCreate: args.allowCrmCreate && (qualificationScore >= 60 || (args.studentCount ?? 0) >= 250),
  });

  if (crmResult.crmLeadId && current?.crmLeadId !== crmResult.crmLeadId) {
    await ctx.db.patch(waitlistId, {
      crmLeadId: crmResult.crmLeadId,
      updatedAt: Date.now(),
    });
  }

  return {
    waitlistId,
    qualificationScore,
    crmLeadId: crmResult.crmLeadId,
    resellerId: reseller?.resellerId,
    existed: Boolean(existing),
  };
}

async function getInviteForEntry(ctx: any, entry: any) {
  const invites = await ctx.db.query("tenant_invites").collect();
  return invites
    .filter((invite: any) => {
      if (entry?._id && invite.waitlistId && String(invite.waitlistId) === String(entry._id)) {
        return true;
      }
      return normalizeEmail(invite.email ?? "") === normalizeEmail(entry?.email ?? "");
    })
    .sort((left: any, right: any) => (right.updatedAt ?? right.createdAt ?? 0) - (left.updatedAt ?? left.createdAt ?? 0))[0];
}

async function getPlatformOperators(ctx: any) {
  const [platformUsers, users] = await Promise.all([
    ctx.db.query("platform_users").collect(),
    ctx.db.query("users").withIndex("by_tenant", (q: any) => q.eq("tenantId", "PLATFORM")).collect(),
  ]);

  return platformUsers
    .filter((user: any) => user.status === "active")
    .map((platformUser: any) => {
      const profile =
        users.find((user: any) => user.workosUserId === platformUser.userId || user.eduMylesUserId === platformUser.userId) ??
        null;
      return {
        userId: platformUser.userId,
        role: platformUser.role,
        name:
          [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim() ||
          profile?.email ||
          platformUser.userId,
        email: profile?.email,
      };
    })
    .sort((left: any, right: any) => left.name.localeCompare(right.name));
}

export const submitWaitlistForm = mutation({
  args: waitlistBaseArgs,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q: any) => q.eq("email", normalizeEmail(args.email)))
      .first();
    if (existing?.status === "converted") {
      return {
        status: "already_registered",
        waitlistId: existing._id,
        message: "This school has already moved through onboarding.",
      };
    }

    const { waitlistId, qualificationScore, existed } = await upsertWaitlistEntry(ctx, {
      ...args,
      actorId: "system",
      actorEmail: "no-reply@edumyles.co.ke",
      sourceChannel: args.sourceChannel ?? "landing_waitlist",
      allowCrmCreate: true,
    });

    const entry = (await ctx.db.get(waitlistId)) as any;
    const firstName = args.fullName.split(" ")[0] || "there";

    await sendPlatformEmail(ctx, {
      to: [entry.email],
      subject: `You're on the EduMyles waitlist, ${firstName}!`,
      text: `Hi ${firstName},\n\nThanks for joining the EduMyles waitlist for ${entry.schoolName}. We have recorded your school details and our team will review your onboarding readiness shortly.\n\nThe EduMyles Team`,
      template: "waitlist_confirmation",
      data: {
        firstName,
        schoolName: entry.schoolName,
        qualificationScore,
      },
    });

    if (qualificationScore >= 60 || (entry.studentCount ?? 0) >= 250) {
      await ctx.db.insert("notifications", {
        tenantId: "PLATFORM",
        userId: "dev-platform-admin",
        title: "Qualified waitlist lead",
        message: `${entry.schoolName} is ready for invite follow-up with a qualification score of ${qualificationScore}.`,
        type: "platform_alert",
        isRead: false,
        link: "/platform/waitlist",
        createdAt: Date.now(),
      });
    }

    if (qualificationScore >= 75) {
      await ctx.db.insert("notifications", {
        tenantId: "PLATFORM",
        userId: "dev-platform-admin",
        title: "High-value waitlist lead",
        message: `${entry.schoolName} joined the waitlist with a qualification score of ${qualificationScore}.`,
        type: "platform_alert",
        isRead: false,
        link: "/platform/waitlist",
        createdAt: Date.now(),
      });
    }

    return {
      status: existed ? "updated" : "success",
      waitlistId,
      qualificationScore,
      message: existed
        ? "Your waitlist details have been updated."
        : "Your school has been added to the EduMyles waitlist.",
    };
  },
});

export const addToWaitlist = submitWaitlistForm;

export const createPlatformWaitlistEntry = mutation({
  args: {
    sessionToken: v.string(),
    ...waitlistBaseArgs,
    assignedTo: v.optional(v.string()),
    isHighValue: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformContext(ctx, args, "waitlist.create");
    const result = await upsertWaitlistEntry(ctx, {
      ...args,
      sourceChannel: args.sourceChannel ?? "platform_manual_entry",
      actorId: platform.userId,
      actorEmail: platform.email,
      allowCrmCreate: true,
      forceHighValue: args.isHighValue,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "crm.lead_created",
      entityType: "waitlist",
      entityId: String(result.waitlistId),
      after: {
        schoolName: args.schoolName,
        email: normalizeEmail(args.email),
        sourceChannel: args.sourceChannel ?? "platform_manual_entry",
      },
    });

    return { success: true, ...result };
  },
});

export const getWaitlistEntries = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.string()),
    country: v.optional(v.string()),
    minStudents: v.optional(v.number()),
    isHighValue: v.optional(v.boolean()),
    assignedTo: v.optional(v.string()),
    search: v.optional(v.string()),
    sourceChannel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformContext(ctx, args, "waitlist.view");

    const [entries, operators] = await Promise.all([
      ctx.db.query("waitlist").collect(),
      getPlatformOperators(ctx),
    ]);

    const operatorMap = new Map(operators.map((operator: any) => [operator.userId, operator]));
    const searchNeedle = args.search?.trim().toLowerCase();

    const enriched = await Promise.all(
      entries.map(async (entry: any) => {
        const [crmLead, pendingInvite] = await Promise.all([
          entry.crmLeadId ? (ctx.db.get(entry.crmLeadId as any) as Promise<any>) : null,
          getInviteForEntry(ctx, entry),
        ]);

        const derivedStatus =
          pendingInvite?.status === "pending"
            ? "invited"
            : pendingInvite?.status === "revoked"
              ? entry.tenantId
                ? "converted"
                : "waiting"
              : pendingInvite?.status === "expired"
                ? "expired"
                : pendingInvite?.status === "accepted"
                  ? entry.tenantId
                    ? "converted"
                    : "invited"
                  : entry.status;

        return {
          ...entry,
          status: derivedStatus,
          crmLead: crmLead
            ? {
                id: String(crmLead._id),
                stage: crmLead.stage,
                status: crmLead.status,
                assignedTo: crmLead.assignedTo,
              }
            : null,
          invite: pendingInvite
            ? {
                id: String(pendingInvite._id),
                status: pendingInvite.status,
                expiresAt: pendingInvite.expiresAt,
                remindersSent: pendingInvite.remindersSent ?? 0,
                lastReminderAt: pendingInvite.lastReminderAt,
              }
            : null,
          assignedUser: entry.assignedTo ? operatorMap.get(entry.assignedTo) ?? null : null,
        };
      })
    );

    return enriched
      .filter((entry: any) => {
        if (args.status && entry.status !== args.status) return false;
        if (args.country && entry.country !== args.country) return false;
        if (args.minStudents !== undefined && (entry.studentCount ?? 0) < args.minStudents) return false;
        if (args.isHighValue !== undefined && Boolean(entry.isHighValue) !== args.isHighValue) return false;
        if (args.assignedTo && entry.assignedTo !== args.assignedTo) return false;
        if (args.sourceChannel && entry.sourceChannel !== args.sourceChannel) return false;
        if (!searchNeedle) return true;
        return [
          entry.fullName,
          entry.email,
          entry.schoolName,
          entry.country,
          entry.county ?? "",
          entry.referralSource ?? "",
          entry.currentSystem ?? "",
          entry.notes ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(searchNeedle);
      })
      .sort((left: any, right: any) => {
        const scoreDelta = (right.qualificationScore ?? 0) - (left.qualificationScore ?? 0);
        if (scoreDelta !== 0) return scoreDelta;
        return right.createdAt - left.createdAt;
      });
  },
});

export const getWaitlistOperators = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformContext(ctx, args, "waitlist.view");
    return getPlatformOperators(ctx);
  },
});

export const updateWaitlistEntry = mutation({
  args: {
    sessionToken: v.string(),
    waitlistId: v.id("waitlist"),
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    schoolName: v.optional(v.string()),
    country: v.optional(v.string()),
    county: v.optional(v.string()),
    phone: v.optional(v.string()),
    studentCount: v.optional(v.number()),
    currentSystem: v.optional(v.string()),
    biggestChallenge: v.optional(v.string()),
    referralSource: v.optional(v.string()),
    referralCode: v.optional(v.string()),
    notes: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    isHighValue: v.optional(v.boolean()),
    sourceChannel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformContext(ctx, args, "waitlist.edit");
    const existing = (await ctx.db.get(args.waitlistId)) as any;
    if (!existing) throw new Error("Waitlist entry not found");

    const result = await upsertWaitlistEntry(ctx, {
      fullName: args.fullName ?? existing.fullName,
      email: args.email ?? existing.email,
      schoolName: args.schoolName ?? existing.schoolName,
      country: args.country ?? existing.country,
      county: args.county ?? existing.county,
      phone: args.phone ?? existing.phone,
      studentCount: args.studentCount ?? existing.studentCount,
      currentSystem: args.currentSystem ?? existing.currentSystem,
      biggestChallenge: args.biggestChallenge ?? existing.biggestChallenge,
      referralSource: args.referralSource ?? existing.referralSource,
      referralCode: args.referralCode ?? existing.referralCode,
      notes: args.notes ?? existing.notes,
      sourceChannel: args.sourceChannel ?? existing.sourceChannel,
      assignedTo: args.assignedTo ?? existing.assignedTo,
      actorId: platform.userId,
      actorEmail: platform.email,
      existingId: args.waitlistId,
      allowCrmCreate: true,
      forceHighValue: args.isHighValue,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "crm.lead_updated",
      entityType: "waitlist",
      entityId: String(args.waitlistId),
      before: {
        schoolName: existing.schoolName,
        email: existing.email,
        assignedTo: existing.assignedTo,
        status: existing.status,
      },
      after: {
        schoolName: args.schoolName ?? existing.schoolName,
        email: normalizeEmail(args.email ?? existing.email),
        assignedTo: args.assignedTo ?? existing.assignedTo,
        qualificationScore: result.qualificationScore,
      },
    });

    return { success: true, ...result };
  },
});

export const deleteWaitlistEntry = mutation({
  args: {
    sessionToken: v.string(),
    waitlistId: v.id("waitlist"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformContext(ctx, args, "waitlist.delete");
    const existing = (await ctx.db.get(args.waitlistId)) as any;
    if (!existing) throw new Error("Waitlist entry not found");
    if (existing.status === "converted") {
      throw new Error("Converted waitlist entries cannot be deleted");
    }

    const invite = await getInviteForEntry(ctx, existing);
    if (invite && invite.status === "pending") {
      await ctx.db.patch(invite._id, {
        status: "revoked",
        updatedAt: Date.now(),
      });
    }

    if (existing.crmLeadId) {
      const crmLead = (await ctx.db.get(existing.crmLeadId as any)) as any;
      if (crmLead) {
        await ctx.db.patch(crmLead._id, {
          stage: "closed_lost",
          status: "lost",
          notes: [crmLead.notes, `Waitlist entry deleted: ${args.reason}`].filter(Boolean).join("\n"),
          updatedAt: Date.now(),
        });
      }
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "user.deleted",
      entityType: "waitlist",
      entityId: String(args.waitlistId),
      before: existing,
      after: { reason: args.reason },
    });

    await ctx.db.delete(args.waitlistId);
    return { success: true };
  },
});

export const rejectWaitlistEntry = mutation({
  args: {
    sessionToken: v.string(),
    waitlistId: v.id("waitlist"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformContext(ctx, args, "waitlist.reject");
    const existing = (await ctx.db.get(args.waitlistId)) as any;
    if (!existing) throw new Error("Waitlist entry not found");

    const now = Date.now();
    await ctx.db.patch(args.waitlistId, {
      status: "rejected",
      notes: args.reason.trim(),
      updatedAt: now,
    });

    if (existing.crmLeadId) {
      const crmLead = (await ctx.db.get(existing.crmLeadId as any)) as any;
      if (crmLead) {
        await ctx.db.patch(crmLead._id, {
          stage: "closed_lost",
          status: "lost",
          notes: [crmLead.notes, `Waitlist rejected: ${args.reason.trim()}`].filter(Boolean).join("\n"),
          updatedAt: now,
        });
      }
    }

    await sendPlatformEmail(ctx, {
      to: [existing.email],
      subject: `Update on your EduMyles request, ${existing.fullName.split(" ")[0]}`,
      text: `Hi ${existing.fullName.split(" ")[0]},\n\nThank you for your interest in EduMyles. We are unable to progress your request right now.\n\nReason: ${args.reason}\n\nIf your needs change, please feel free to reach out again.\n\nThe EduMyles Team`,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "waitlist.rejected",
      entityType: "waitlist",
      entityId: String(args.waitlistId),
      before: { status: existing.status, notes: existing.notes },
      after: { status: "rejected", reason: args.reason.trim() },
    });

    return { success: true };
  },
});

export const updateWaitlistStatus = mutation({
  args: {
    sessionToken: v.string(),
    waitlistId: v.id("waitlist"),
    status: WAITLIST_STATUS,
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.status === "rejected") {
      const platform = await requirePlatformContext(ctx, args, "waitlist.reject");
      const existing = (await ctx.db.get(args.waitlistId)) as any;
      if (!existing) throw new Error("Waitlist entry not found");

      const now = Date.now();
      await ctx.db.patch(args.waitlistId, {
        status: "rejected",
        notes: args.reason ?? "Rejected by platform admin",
        updatedAt: now,
      });

      if (existing.crmLeadId) {
        const crmLead = (await ctx.db.get(existing.crmLeadId as any)) as any;
        if (crmLead) {
          await ctx.db.patch(crmLead._id, {
            stage: "closed_lost",
            status: "lost",
            notes: [crmLead.notes, `Waitlist rejected: ${args.reason ?? "Rejected by platform admin"}`]
              .filter(Boolean)
              .join("\n"),
            updatedAt: now,
          });
        }
      }

      await sendPlatformEmail(ctx, {
        to: [existing.email],
        subject: `Update on your EduMyles request, ${existing.fullName.split(" ")[0]}`,
        text: `Hi ${existing.fullName.split(" ")[0]},\n\nThank you for your interest in EduMyles. We are unable to progress your request right now.\n\nReason: ${args.reason ?? "Rejected by platform admin"}\n\nThe EduMyles Team`,
      });

      await logAction(ctx, {
        tenantId: "PLATFORM",
        actorId: platform.userId,
        actorEmail: platform.email,
        action: "waitlist.rejected",
        entityType: "waitlist",
        entityId: String(args.waitlistId),
        after: { status: "rejected", reason: args.reason ?? "Rejected by platform admin" },
      });

      return { success: true };
    }

    const platform = await requirePlatformContext(ctx, args, "waitlist.edit");
    const existing = (await ctx.db.get(args.waitlistId)) as any;
    if (!existing) throw new Error("Waitlist entry not found");

    await ctx.db.patch(args.waitlistId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    if (existing.crmLeadId) {
      const crmLead = (await ctx.db.get(existing.crmLeadId as any)) as any;
      if (crmLead) {
        await ctx.db.patch(crmLead._id, {
          stage:
            args.status === "converted"
              ? "converted"
              : args.status === "invited"
                ? "proposal_sent"
                : crmLead.stage,
          status: args.status === "converted" ? "won" : crmLead.status,
          updatedAt: Date.now(),
        });
      }
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: args.status === "converted" ? "waitlist.approved" : "crm.lead_updated",
      entityType: "waitlist",
      entityId: String(args.waitlistId),
      before: { status: existing.status },
      after: { status: args.status, reason: args.reason },
    });

    return { success: true };
  },
});

export const convertWaitlistEntry = mutation({
  args: {
    sessionToken: v.string(),
    waitlistId: v.id("waitlist"),
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformContext(ctx, args, "crm.convert_to_tenant");
    const existing = (await ctx.db.get(args.waitlistId)) as any;
    if (!existing) throw new Error("Waitlist entry not found");

    await ctx.db.patch(args.waitlistId, {
      status: "converted",
      convertedAt: Date.now(),
      tenantId: args.tenantId,
      updatedAt: Date.now(),
    });

    if (existing.crmLeadId) {
      const crmLead = (await ctx.db.get(existing.crmLeadId as any)) as any;
      if (crmLead) {
        await ctx.db.patch(crmLead._id, {
          stage: "converted",
          status: "won",
          tenantId: args.tenantId,
          updatedAt: Date.now(),
        });
      }
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "waitlist.approved",
      entityType: "waitlist",
      entityId: String(args.waitlistId),
      before: { status: existing.status, tenantId: existing.tenantId },
      after: { status: "converted", tenantId: args.tenantId },
    });

    return { success: true };
  },
});

export const expireOldInvites = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const entries = await ctx.db
      .query("waitlist")
      .withIndex("by_status", (q) => q.eq("status", "invited"))
      .collect();

    let expired = 0;
    for (const entry of entries) {
      if (!entry.inviteExpiresAt || entry.inviteExpiresAt > now) continue;
      await ctx.db.patch(entry._id, {
        status: "expired",
        updatedAt: now,
      });
      if (entry.crmLeadId) {
        const crmLead = (await ctx.db.get(entry.crmLeadId as any)) as any;
        if (crmLead) {
          await ctx.db.patch(crmLead._id, {
            stage: "nurturing",
            status: "open",
            updatedAt: now,
          });
        }
      }
      expired += 1;
    }

    return { expired };
  },
});
