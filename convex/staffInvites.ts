import { action, internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { requireTenantSession } from "./helpers/tenantGuard";
import { requirePermission } from "./helpers/authorize";
import { logAction } from "./helpers/auditLog";

const DAY_MS = 24 * 60 * 60 * 1000;

function createInviteToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

function isWorkOSNotConfigured(error: unknown) {
  return error instanceof Error && error.message.includes("WORKOS_NOT_CONFIGURED");
}

function getStaffRedirectPath(role: string) {
  return role === "teacher" ? "/portal/teacher" : "/admin";
}

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

type AcceptStaffInviteResult = {
  userId: string;
  userDocId: unknown;
  tenantId: string;
  email: string;
  role: string;
  redirectTo: string;
};

async function createStaffInviteRecord(
  ctx: any,
  args: {
    tenantId: string;
    actorId: string;
    actorEmail: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    department?: string;
    phone?: string;
    staffNumber?: string;
    jobTitle?: string;
  }
) {
  const email = args.email.trim().toLowerCase();
  const now = Date.now();

  const existingUser = await ctx.db
    .query("users")
    .withIndex("by_tenant_email", (q: any) => q.eq("tenantId", args.tenantId).eq("email", email))
    .first();
  if (existingUser) {
    throw new Error("A user with this email already exists in this tenant");
  }

  const existingInvite = (
    await ctx.db
      .query("staff_invites")
      .withIndex("by_tenantId", (q: any) => q.eq("tenantId", args.tenantId))
      .collect()
  ).find((invite: any) => invite.email.toLowerCase() === email && invite.status === "pending");

  if (existingInvite) {
    throw new Error("A pending staff invitation already exists for this email");
  }

  const token = createInviteToken();
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000;
  const staffNumber = args.staffNumber?.trim() || `EMP-${String(now).slice(-6)}`;
  const tenantRecord = await ctx.db
    .query("tenants")
    .withIndex("by_tenantId", (q: any) => q.eq("tenantId", args.tenantId))
    .first();

  const staffInviteId = await ctx.db.insert("staff_invites", {
    tenantId: args.tenantId,
    email,
    firstName: args.firstName?.trim(),
    lastName: args.lastName?.trim(),
    role: args.role,
    department: args.department?.trim(),
    phone: args.phone?.trim(),
    staffNumber,
    jobTitle: args.jobTitle?.trim(),
    token,
    status: "pending",
    invitedBy: args.actorId,
    expiresAt,
    acceptedAt: undefined,
    workosUserId: undefined,
    createdAt: now,
  });

  await ctx.db.insert("staff", {
    tenantId: args.tenantId,
    userId: undefined,
    firstName: args.firstName?.trim() || "Pending",
    lastName: args.lastName?.trim() || "Invite",
    email,
    phone: args.phone?.trim(),
    role: args.role,
    department: args.department?.trim(),
    employeeId: staffNumber,
    qualification: undefined,
    joinDate: new Date(now).toISOString().slice(0, 10),
    status: "pending_invite",
    createdAt: now,
    updatedAt: now,
  });

  await ctx.scheduler.runAfter(0, internal.actions.communications.email.sendEmailInternal, {
    tenantId: args.tenantId,
    actorId: args.actorId,
    actorEmail: args.actorEmail,
    to: [email],
    subject: `You've been invited to join EduMyles`,
    text: `You have been invited to join EduMyles as ${args.role}. Open http://localhost:3000/staff/accept?token=${token} before ${new Date(expiresAt).toUTCString()}.`,
    template: "staff_invite",
    data: {
      firstName: args.firstName?.trim() || "there",
      schoolName: tenantRecord?.name ?? args.tenantId,
      role: args.role,
      inviteUrl: `${getAppUrl()}/staff/accept?token=${token}`,
      expiryDate: new Date(expiresAt).toUTCString(),
    },
  });

  await logAction(ctx, {
    tenantId: args.tenantId,
    actorId: args.actorId,
    actorEmail: args.actorEmail,
    action: "user.invited",
    entityType: "staff_invite",
    entityId: String(staffInviteId),
    after: { email, role: args.role, department: args.department },
  });

  return { staffInviteId, inviteToken: token, expiresAt };
}

export const inviteStaffMember = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.optional(v.string()),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.string(),
    department: v.optional(v.string()),
    phone: v.optional(v.string()),
    staffNumber: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken, tenantId: args.tenantId });
    requirePermission(tenant, "users:manage");
    return await createStaffInviteRecord(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role,
      department: args.department,
      phone: args.phone,
      staffNumber: args.staffNumber,
      jobTitle: args.jobTitle,
    });
  },
});

export const bulkInviteStaff = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.optional(v.string()),
    staff: v.array(
      v.object({
        email: v.string(),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        role: v.string(),
        department: v.optional(v.string()),
        phone: v.optional(v.string()),
        staffNumber: v.optional(v.string()),
        jobTitle: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken, tenantId: args.tenantId });
    requirePermission(tenant, "users:manage");

    const sent: string[] = [];
    const failed: Array<{ email: string; error: string }> = [];
    for (const staffMember of args.staff) {
      try {
        await createStaffInviteRecord(ctx, {
          tenantId: tenant.tenantId,
          actorId: tenant.userId,
          actorEmail: tenant.email,
          ...staffMember,
        });
        sent.push(staffMember.email);
      } catch (error) {
        failed.push({
          email: staffMember.email,
          error: error instanceof Error ? error.message : "Failed to invite staff member",
        });
      }
    }

    return { sent: sent.length, failed };
  },
});

export const listPendingStaffInvites = query({
  args: {
    sessionToken: v.string(),
    tenantId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken, tenantId: args.tenantId });
    requirePermission(tenant, "users:manage");

    const invites = await ctx.db
      .query("staff_invites")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();

    return invites
      .filter((invite) => invite.status === "pending")
      .sort((left, right) => right.createdAt - left.createdAt);
  },
});

export const resendStaffInvite = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.optional(v.string()),
    inviteId: v.id("staff_invites"),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken, tenantId: args.tenantId });
    requirePermission(tenant, "users:manage");

    const invite = await ctx.db.get(args.inviteId);
    if (!invite || invite.tenantId !== tenant.tenantId) {
      throw new Error("Staff invite not found");
    }
    if (invite.status !== "pending") {
      throw new Error("Only pending staff invites can be resent");
    }

    const token = createInviteToken();
    const now = Date.now();
    const expiresAt = now + 7 * DAY_MS;
    const tenantRecord = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenant.tenantId))
      .first();

    await ctx.db.patch(invite._id, {
      token,
      expiresAt,
      createdAt: invite.createdAt,
    });

    await ctx.scheduler.runAfter(0, internal.actions.communications.email.sendEmailInternal, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      to: [invite.email],
      subject: `You've been invited to join ${tenantRecord?.name ?? "EduMyles"} on EduMyles`,
      template: "staff_invite",
      data: {
        firstName: invite.firstName?.trim() || "there",
        schoolName: tenantRecord?.name ?? tenant.tenantId,
        role: invite.role,
        inviteUrl: `${getAppUrl()}/staff/accept?token=${token}`,
        expiryDate: new Date(expiresAt).toUTCString(),
      },
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "user.invited",
      entityType: "staff_invite",
      entityId: String(invite._id),
      after: { resentAt: now, expiresAt },
    });

    return { success: true, expiresAt };
  },
});

export const getStaffInviteByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("staff_invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite) {
      return null;
    }

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", invite.tenantId))
      .first();

    const isExpired = invite.expiresAt < Date.now();
    const isUsed = invite.status === "accepted";

    return {
      ...invite,
      schoolName: tenant?.name ?? invite.tenantId,
      isExpired,
      isUsed,
      isValid: invite.status === "pending" && !isExpired,
    };
  },
});

export const createTenantUserFromInvite = internalMutation({
  args: {
    token: v.string(),
    workosUserId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("staff_invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite) {
      throw new Error("Invalid staff invitation");
    }

    if (invite.status !== "pending") {
      throw new Error("This staff invitation is no longer active");
    }

    if (invite.expiresAt < Date.now()) {
      throw new Error("This staff invitation has expired");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_tenant_email", (q) => q.eq("tenantId", invite.tenantId).eq("email", invite.email))
      .first();

    if (existingUser && !existingUser.workosUserId.startsWith("pending-")) {
      throw new Error("A user with this email already exists");
    }

    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", invite.tenantId))
      .first();
    if (!organization) {
      throw new Error("Organization not found for tenant");
    }

    const now = Date.now();
    const eduMylesUserId = existingUser?.eduMylesUserId ?? `USR-${crypto.randomUUID()}`;

    const userDocId = existingUser?._id
      ? await (async () => {
          await ctx.db.patch(existingUser._id, {
            eduMylesUserId,
            workosUserId: args.workosUserId,
            firstName: args.firstName,
            lastName: args.lastName,
            role: invite.role,
            organizationId: organization._id,
            isActive: true,
            status: "active",
            phone: invite.phone,
          });
          return existingUser._id;
        })()
      : await ctx.db.insert("users", {
          tenantId: invite.tenantId,
          eduMylesUserId,
          workosUserId: args.workosUserId,
          email: invite.email,
          firstName: args.firstName,
          lastName: args.lastName,
          role: invite.role,
          permissions: [],
          organizationId: organization._id,
          isActive: true,
          status: "active",
          phone: invite.phone,
          createdAt: now,
        });

    const staffRecord = (
      await ctx.db
        .query("staff")
        .withIndex("by_tenant", (q) => q.eq("tenantId", invite.tenantId))
        .collect()
    ).find((record) => record.email.toLowerCase() === invite.email.toLowerCase());

    if (staffRecord) {
      await ctx.db.patch(staffRecord._id, {
        userId: eduMylesUserId,
        firstName: args.firstName,
        lastName: args.lastName,
        status: "active",
        updatedAt: now,
      });
    }

    await ctx.db.patch(invite._id, {
      status: "accepted",
      acceptedAt: now,
      workosUserId: args.workosUserId,
    });

    const schoolAdmin = await ctx.db
      .query("users")
      .withIndex("by_tenant_role", (q) => q.eq("tenantId", invite.tenantId).eq("role", "school_admin"))
      .first();

    if (schoolAdmin) {
      await ctx.db.insert("notifications", {
        tenantId: invite.tenantId,
        userId: schoolAdmin.eduMylesUserId,
        title: "Staff member joined",
        message: `${args.firstName} ${args.lastName} joined as ${invite.role}.`,
        type: "user_management",
        isRead: false,
        link: "/admin/staff",
        createdAt: now,
      });
    }

    const onboarding = await ctx.db
      .query("tenant_onboarding")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", invite.tenantId))
      .first();
    if (onboarding) {
      const currentCount = onboarding.steps.staffAdded?.count ?? 0;
      await ctx.db.patch(onboarding._id, {
        steps: {
          ...onboarding.steps,
          staffAdded: {
            completed: true,
            completedAt: onboarding.steps.staffAdded?.completedAt ?? now,
            count: currentCount + 1,
            pointsAwarded: Math.max(onboarding.steps.staffAdded?.pointsAwarded ?? 0, 5),
          },
        },
        healthScore: Math.max(onboarding.healthScore, 43),
        lastActivityAt: now,
        updatedAt: now,
      });
    }

    return {
      userId: eduMylesUserId,
      userDocId,
      tenantId: invite.tenantId,
      email: invite.email,
      role: invite.role,
      redirectTo: getStaffRedirectPath(invite.role),
    };
  },
});

export const acceptStaffInvite = action({
  args: {
    token: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<AcceptStaffInviteResult> => {
    const invite = await ctx.runQuery(api.staffInvites.getStaffInviteByToken, {
      token: args.token,
    });

    if (!invite || !invite.isValid) {
      throw new Error(invite?.isExpired ? "This staff invitation has expired" : "Invalid staff invitation");
    }

    let workosUserId: string;

    try {
      workosUserId = await ctx.runAction(internal.actions.auth.workos.createUser, {
        email: invite.email,
        firstName: args.firstName,
        lastName: args.lastName,
        password: args.password,
      });

      const serverSecret = process.env.CONVEX_WEBHOOK_SECRET;
      const organization = serverSecret
        ? await ctx.runQuery(api.organizations.getOrgByTenantId, {
            serverSecret,
            tenantId: invite.tenantId,
          })
        : null;

      if (organization?.workosOrgId) {
        await ctx.runAction(internal.actions.auth.workos.createOrganizationMembership, {
          userId: workosUserId,
          organizationId: organization.workosOrgId,
          roleSlug: invite.role === "teacher" ? "member" : "admin",
        });
      }
    } catch (error) {
      if (!isWorkOSNotConfigured(error)) {
        throw error;
      }
      workosUserId = `placeholder-user-${crypto.randomUUID()}`;
    }

    const result: AcceptStaffInviteResult = await ctx.runMutation(internal.staffInvites.createTenantUserFromInvite, {
      token: args.token,
      workosUserId,
      firstName: args.firstName,
      lastName: args.lastName,
    });

    return result;
  },
});
