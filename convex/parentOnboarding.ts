import { ConvexError, v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";

const OTP_EXPIRY_MS = 10 * 60 * 1000;

function normalizeIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) {
    return {
      type: "email" as const,
      value: trimmed.toLowerCase(),
    };
  }

  const digits = trimmed.replace(/[^\d+]/g, "");
  return {
    type: "phone" as const,
    value: digits,
  };
}

function maskIdentifier(identifier: { type: "email" | "phone"; value: string }) {
  if (identifier.type === "email") {
    const [name, domain] = identifier.value.split("@");
    const safeName = name ?? "";
    if (!domain) return identifier.value;
    const visible = safeName.length <= 2 ? safeName[0] ?? "*" : `${safeName.slice(0, 2)}***`;
    return `${visible}@${domain}`;
  }

  const lastFour = identifier.value.slice(-4);
  return `***${lastFour}`;
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function getTenantBySchoolCode(ctx: any, schoolCode: string) {
  const normalizedCode = schoolCode.trim().toLowerCase();
  return await ctx.db
    .query("tenants")
    .withIndex("by_subdomain", (q: any) => q.eq("subdomain", normalizedCode))
    .first();
}

async function getMatchingGuardians(ctx: any, tenantId: string, identifier: { type: "email" | "phone"; value: string }) {
  const guardians = await ctx.db
    .query("guardians")
    .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenantId))
    .collect();

  return guardians.filter((guardian: any) => {
    const guardianEmail = guardian.email?.trim().toLowerCase() || "";
    const guardianPhone = guardian.phone?.trim().replace(/[^\d+]/g, "") || "";
    return identifier.type === "email"
      ? guardianEmail === identifier.value
      : guardianPhone === identifier.value;
  });
}

async function ensureParentUser(ctx: any, args: {
  tenantId: string;
  guardian: any;
  identifier: { type: "email" | "phone"; value: string };
}) {
  const existingByUserId = args.guardian.userId
    ? await ctx.db
        .query("users")
        .withIndex("by_user_id", (q: any) => q.eq("eduMylesUserId", args.guardian.userId))
        .first()
    : null;

  if (existingByUserId) {
    return existingByUserId;
  }

  const email =
    (args.identifier.type === "email" ? args.identifier.value : args.guardian.email?.trim().toLowerCase()) ||
    `pending-parent-${crypto.randomUUID()}@pending.edumyles.local`;

  const existingByEmail = await ctx.db
    .query("users")
    .withIndex("by_tenant_email", (q: any) => q.eq("tenantId", args.tenantId).eq("email", email))
    .first();

  if (existingByEmail) {
    if (!args.guardian.userId || args.guardian.userId !== existingByEmail.eduMylesUserId) {
      await ctx.db.patch(args.guardian._id, {
        userId: existingByEmail.eduMylesUserId,
        updatedAt: Date.now(),
      });
    }
    return existingByEmail;
  }

  const parentUserId = `USR-${crypto.randomUUID()}`;
  const userDocId = await ctx.db.insert("users", {
    tenantId: args.tenantId,
    eduMylesUserId: parentUserId,
    workosUserId: `pending-parent-${crypto.randomUUID()}`,
    inviteToken: undefined,
    email,
    firstName: args.guardian.firstName || "Parent",
    lastName: args.guardian.lastName || "",
    role: "parent",
    permissions: [],
    organizationId: undefined,
    isActive: false,
    status: "pending_activation",
    avatarUrl: undefined,
    phone:
      (args.identifier.type === "phone" ? args.identifier.value : args.guardian.phone?.trim()) || undefined,
    bio: undefined,
    location: undefined,
    passwordHash: undefined,
    twoFactorEnabled: undefined,
    twoFactorSecret: undefined,
    tempTwoFactorSecret: undefined,
    recoveryCodes: undefined,
    lastPasswordChangeAt: undefined,
    createdAt: Date.now(),
  });

  await ctx.db.patch(args.guardian._id, {
    userId: parentUserId,
    updatedAt: Date.now(),
  });

  return await ctx.db.get(userDocId);
}

export const getJoinSchoolContext = query({
  args: {
    schoolCode: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await getTenantBySchoolCode(ctx, args.schoolCode);
    if (!tenant) {
      return null;
    }

    const branding = await ctx.db
      .query("whiteLabelConfigs")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .first();

    return {
      tenantId: tenant.tenantId,
      schoolCode: tenant.subdomain,
      schoolName: tenant.name,
      logoUrl: branding?.logoUrl ?? tenant.logoUrl ?? null,
      primaryColor: branding?.primaryColor ?? "#0F3D2E",
      secondaryColor: branding?.secondaryColor ?? "#D1A23C",
      accentColor: branding?.accentColor ?? "#1F7A52",
    };
  },
});

export const lookupParentRegistration = query({
  args: {
    schoolCode: v.string(),
    identifier: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await getTenantBySchoolCode(ctx, args.schoolCode);
    if (!tenant) {
      return {
        schoolFound: false,
        matches: [],
      };
    }

    const identifier = normalizeIdentifier(args.identifier);
    const guardians = await getMatchingGuardians(ctx, tenant.tenantId, identifier);
    const students = await ctx.db
      .query("students")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .collect();
    const studentMap = new Map(students.map((student: any) => [student._id.toString(), student]));

    return {
      schoolFound: true,
      schoolName: tenant.name,
      schoolCode: tenant.subdomain,
      identifierType: identifier.type,
      matches: guardians.map((guardian: any) => ({
        guardianId: guardian._id,
        guardianName: `${guardian.firstName} ${guardian.lastName}`.trim(),
        email: guardian.email || null,
        phone: guardian.phone || null,
        relationship: guardian.relationship,
        children: (guardian.studentIds ?? [])
          .map((studentId: string) => studentMap.get(studentId))
          .filter(Boolean)
          .map((student: any) => ({
            studentId: student._id.toString(),
            firstName: student.firstName,
            lastName: student.lastName,
            classId: student.classId,
            admissionNo: student.admissionNo,
          })),
      })),
    };
  },
});

export const requestParentOtp = mutation({
  args: {
    schoolCode: v.string(),
    identifier: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await getTenantBySchoolCode(ctx, args.schoolCode);
    if (!tenant) {
      throw new ConvexError({ code: "NOT_FOUND", message: "School not found" });
    }

    const identifier = normalizeIdentifier(args.identifier);
    const guardians = await getMatchingGuardians(ctx, tenant.tenantId, identifier);
    if (guardians.length === 0) {
      throw new ConvexError({
        code: "PARENT_NOT_FOUND",
        message: "We could not find a parent record matching that email or phone number.",
      });
    }

    const otpCode = generateOtpCode();
    const now = Date.now();
    let childCount = 0;

    for (const guardian of guardians) {
      const parentUser = await ensureParentUser(ctx, {
        tenantId: tenant.tenantId,
        guardian,
        identifier,
      });

      childCount += guardian.studentIds?.length ?? 0;

      const existingInvite = (
        await ctx.db
          .query("parent_invites")
          .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenant.tenantId))
          .collect()
      ).find((invite: any) => {
        const inviteEmail = invite.email?.trim().toLowerCase() || "";
        const invitePhone = invite.phone?.trim().replace(/[^\d+]/g, "") || "";
        return invite.status === "pending" && (
          (identifier.type === "email" && inviteEmail === identifier.value) ||
          (identifier.type === "phone" && invitePhone === identifier.value)
        );
      });

      if (existingInvite) {
        await ctx.db.patch(existingInvite._id, {
          token: otpCode,
          expiresAt: now + OTP_EXPIRY_MS,
          invitedBy: guardian.userId ?? parentUser.eduMylesUserId,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("parent_invites", {
          tenantId: tenant.tenantId,
          studentId: guardian.studentIds?.[0],
          email: identifier.type === "email" ? identifier.value : guardian.email?.trim().toLowerCase() || undefined,
          phone: identifier.type === "phone" ? identifier.value : guardian.phone?.trim() || undefined,
          token: otpCode,
          status: "pending",
          invitedBy: guardian.userId ?? parentUser.eduMylesUserId,
          expiresAt: now + OTP_EXPIRY_MS,
          acceptedAt: undefined,
          workosUserId: undefined,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    const message = `${tenant.name} verification code: ${otpCode}. This code expires in 10 minutes.`;
    if (identifier.type === "email") {
      await ctx.scheduler.runAfter(0, internal.actions.communications.email.sendEmailInternal, {
        tenantId: tenant.tenantId,
        actorId: "system",
        actorEmail: tenant.email ?? "system@edumyles.co.ke",
        to: [identifier.value],
        subject: `Your ${tenant.name} parent access code`,
        text: `${message}\n\nUse this code to finish signing in to the EduMyles parent portal.`,
      });
    } else {
      await ctx.scheduler.runAfter(0, internal.actions.communications.sms.sendSmsInternal, {
        tenantId: tenant.tenantId,
        actorId: "system",
        actorEmail: tenant.email ?? "system@edumyles.co.ke",
        phone: identifier.value,
        message,
      });
    }

    return {
      success: true,
      schoolName: tenant.name,
      deliveryChannel: identifier.type,
      maskedDestination: maskIdentifier(identifier),
      expiresInMinutes: OTP_EXPIRY_MS / 60000,
      childCount,
    };
  },
});

export const finalizeParentLogin = internalMutation({
  args: {
    schoolCode: v.string(),
    identifier: v.string(),
    code: v.string(),
    workosUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await getTenantBySchoolCode(ctx, args.schoolCode);
    if (!tenant) {
      throw new Error("School not found");
    }

    const identifier = normalizeIdentifier(args.identifier);
    const now = Date.now();
    const invites = (
      await ctx.db
        .query("parent_invites")
        .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenant.tenantId))
        .collect()
    ).filter((invite: any) => {
      const inviteEmail = invite.email?.trim().toLowerCase() || "";
      const invitePhone = invite.phone?.trim().replace(/[^\d+]/g, "") || "";
      return (
        invite.status === "pending" &&
        invite.token === args.code &&
        invite.expiresAt >= now &&
        (
          (identifier.type === "email" && inviteEmail === identifier.value) ||
          (identifier.type === "phone" && invitePhone === identifier.value)
        )
      );
    });

    if (invites.length === 0) {
      throw new Error("Invalid or expired verification code");
    }

    const guardians = await getMatchingGuardians(ctx, tenant.tenantId, identifier);
    if (guardians.length === 0) {
      throw new Error("Parent profile not found");
    }

    let parentUser = guardians[0]?.userId
      ? await ctx.db
          .query("users")
          .withIndex("by_user_id", (q: any) => q.eq("eduMylesUserId", guardians[0].userId))
          .first()
      : null;

    if (!parentUser) {
      parentUser = await ensureParentUser(ctx, {
        tenantId: tenant.tenantId,
        guardian: guardians[0],
        identifier,
      });
    }

    if (!parentUser) {
      throw new Error("Unable to provision parent account");
    }

    await ctx.db.patch(parentUser._id, {
      workosUserId: args.workosUserId,
      isActive: true,
      status: "active",
      phone:
        identifier.type === "phone"
          ? identifier.value
          : parentUser.phone,
    });

    const students = await ctx.db
      .query("students")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .collect();
    const studentMap = new Map(students.map((student: any) => [student._id.toString(), student]));

    for (const guardian of guardians) {
      await ctx.db.patch(guardian._id, {
        userId: parentUser.eduMylesUserId,
        updatedAt: now,
      });

      for (const studentId of guardian.studentIds ?? []) {
        const student = studentMap.get(studentId);
        if (student) {
          await ctx.db.patch(student._id, {
            guardianUserId: parentUser.eduMylesUserId,
          });
        }
      }
    }

    for (const invite of invites) {
      await ctx.db.patch(invite._id, {
        status: "accepted",
        acceptedAt: now,
        workosUserId: args.workosUserId,
        updatedAt: now,
      });
    }

    const schoolAdmins = await ctx.db
      .query("users")
      .withIndex("by_tenant_role", (q: any) => q.eq("tenantId", tenant.tenantId).eq("role", "school_admin"))
      .collect();

    for (const admin of schoolAdmins) {
      await ctx.db.insert("notifications", {
        tenantId: tenant.tenantId,
        userId: admin.eduMylesUserId,
        title: "Parent portal activated",
        message: `${guardians[0].firstName} ${guardians[0].lastName} joined the parent portal.`,
        type: "user_management",
        isRead: false,
        link: "/admin/setup",
        createdAt: now,
      });
    }

    return {
      tenantId: tenant.tenantId,
      userId: parentUser.eduMylesUserId,
      email: parentUser.email,
      role: "parent",
      schoolCode: tenant.subdomain,
      workosUserId: args.workosUserId,
    };
  },
});

export const acceptParentOtp = action({
  args: {
    schoolCode: v.string(),
    identifier: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args): Promise<{
    tenantId: string;
    userId: string;
    email: string;
    role: string;
    schoolCode: string;
    workosUserId: string;
    redirectTo: string;
  }> => {
    const match = await ctx.runQuery((api as any).parentOnboarding.lookupParentRegistration, {
      schoolCode: args.schoolCode,
      identifier: args.identifier,
    });

    if (!match.schoolFound || !match.matches.length) {
      throw new Error("Parent profile not found");
    }

    let workosUserId: string;
    try {
      workosUserId = await ctx.runAction(internal.actions.auth.workos.createUser, {
        email:
          normalizeIdentifier(args.identifier).type === "email"
            ? normalizeIdentifier(args.identifier).value
            : match.matches[0]?.email || `parent-${crypto.randomUUID()}@pending.edumyles.local`,
        firstName: match.matches[0]?.guardianName?.split(" ")[0] || "Parent",
        lastName: match.matches[0]?.guardianName?.split(" ").slice(1).join(" ") || "",
        password: crypto.randomUUID(),
      });

      const serverSecret = process.env.CONVEX_WEBHOOK_SECRET;
      const tenantContext = await ctx.runQuery((api as any).parentOnboarding.getJoinSchoolContext, {
        schoolCode: args.schoolCode,
      });

      if (serverSecret && tenantContext?.tenantId) {
        const organization = await ctx.runQuery(api.organizations.getOrgByTenantId, {
          serverSecret,
          tenantId: tenantContext.tenantId,
        });

        if (organization?.workosOrgId) {
          await ctx.runAction(internal.actions.auth.workos.createOrganizationMembership, {
            userId: workosUserId,
            organizationId: organization.workosOrgId,
            roleSlug: "member",
          });
        }
      }
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("WORKOS_NOT_CONFIGURED")) {
        throw error;
      }
      workosUserId = `placeholder-parent-${crypto.randomUUID()}`;
    }

    const result: {
      tenantId: string;
      userId: string;
      email: string;
      role: string;
      schoolCode: string;
      workosUserId: string;
    } = await ctx.runMutation((internal as any).parentOnboarding.finalizeParentLogin, {
      schoolCode: args.schoolCode,
      identifier: args.identifier,
      code: args.code,
      workosUserId,
    });

    return {
      ...result,
      redirectTo: "/portal/parent",
    };
  },
});
