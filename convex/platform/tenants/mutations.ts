import { internalMutation, mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformContext, requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";
import { generateTenantId } from "../../helpers/idGenerator";
import { CORE_MODULE_IDS } from "../../modules/marketplace/moduleDefinitions";
import { api, internal } from "../../_generated/api";

const planInputValidator = v.union(
  v.literal("free"),
  v.literal("starter"),
  v.literal("growth"),
  v.literal("standard"),
  v.literal("pro"),
  v.literal("enterprise")
);

const normalizePlan = (
  plan: "free" | "starter" | "growth" | "standard" | "pro" | "enterprise" | string
): "starter" | "standard" | "pro" | "enterprise" => {
  if (plan === "free") return "starter";
  if (plan === "growth") return "standard";
  if (plan === "starter" || plan === "standard" || plan === "pro" || plan === "enterprise") {
    return plan;
  }
  return "starter";
};

function buildDefaultOnboardingSteps(initialModulesConfigured = 0) {
  return {
    schoolProfile: { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
    academicYear: { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
    gradingSystem: { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
    subjects: { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
    classes: { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
    feeStructure: { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
    staffAdded: { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
    studentsAdded: { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
    modulesConfigured: initialModulesConfigured > 0
      ? { completed: true, completedAt: Date.now(), count: initialModulesConfigured, pointsAwarded: 0 }
      : { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
    portalCustomized: { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
    parentsInvited: { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
    firstAction: { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
  };
}

function createInviteToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function buildSuggestedModules(studentCountEstimate?: number) {
  const base = ["mod_finance", "mod_attendance", "mod_academics"];
  if ((studentCountEstimate ?? 0) >= 250) {
    base.push("mod_reports");
  }
  return base;
}

const CORE_MARKETPLACE_MODULE_SLUGS = ["core_sis", "core_users", "core_notifications"] as const;

const LEGACY_CORE_MODULE_MAP: Record<(typeof CORE_MARKETPLACE_MODULE_SLUGS)[number], string> = {
  core_sis: "sis",
  core_users: "users",
  core_notifications: "communications",
};

function slugifySchoolName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "school";
}

async function generateUniqueSubdomain(ctx: any, schoolName: string) {
  const base = slugifySchoolName(schoolName);
  let candidate = base;
  let counter = 2;

  while (true) {
    const existing = await ctx.db
      .query("tenants")
      .withIndex("by_subdomain", (q: any) => q.eq("subdomain", candidate))
      .first();

    if (!existing) {
      return candidate;
    }

    candidate = `${base}-${counter}`;
    counter += 1;
  }
}

export const createTenantFromInvite = internalMutation({
  args: {
    inviteToken: v.string(),
    workosOrgId: v.string(),
    workosUserId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("tenant_invites")
      .withIndex("by_token", (q) => q.eq("token", args.inviteToken))
      .first();

    if (!invite) {
      throw new Error("Invalid invitation");
    }

    if (invite.status !== "pending") {
      throw new Error("Invitation is no longer active");
    }

    if (invite.expiresAt < Date.now()) {
      throw new Error("Invitation has expired");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", invite.email.trim().toLowerCase()))
      .first();

    if (existingUser && !existingUser.workosUserId.startsWith("pending-")) {
      throw new Error("A user with this email already exists");
    }

    const now = Date.now();
    const tenantId = generateTenantId();
    const subdomain = await generateUniqueSubdomain(ctx, invite.schoolName ?? `${args.firstName} School`);
    const normalizedPlan = normalizePlan(invite.suggestedPlan ?? "starter");

    const tenantDocId = await ctx.db.insert("tenants", {
      tenantId,
      name: invite.schoolName ?? `${args.firstName} School`,
      subdomain,
      workosOrgId: args.workosOrgId,
      email: invite.email.trim().toLowerCase(),
      phone: args.phone ?? invite.phone ?? "",
      plan: normalizedPlan,
      status: "pending_setup",
      schoolType: undefined,
      levels: undefined,
      boardingType: undefined,
      county: invite.county ?? "Unknown",
      country: invite.country ?? "Kenya",
      trialStartedAt: undefined,
      trialEndsAt: undefined,
      activatedAt: undefined,
      engagementScore: 0,
      isVatExempt: false,
      resellerId: invite.resellerId,
      inviteId: invite._id,
      createdAt: now,
      updatedAt: now,
    });

    const organizationId = await ctx.db.insert("organizations", {
      tenantId,
      workosOrgId: args.workosOrgId,
      name: invite.schoolName ?? `${args.firstName} School`,
      subdomain,
      tier: normalizedPlan,
      isActive: true,
      createdAt: now,
    });

    const eduMylesUserId = `USR-${crypto.randomUUID()}`;
    const userId = existingUser?._id
      ? await (async () => {
          await ctx.db.patch(existingUser._id, {
            tenantId,
            eduMylesUserId,
            workosUserId: args.workosUserId,
            inviteToken: args.inviteToken,
            email: invite.email.trim().toLowerCase(),
            firstName: args.firstName,
            lastName: args.lastName,
            role: "school_admin",
            permissions: ["*"],
            organizationId,
            isActive: true,
            status: "active",
            phone: args.phone ?? invite.phone,
            createdAt: existingUser.createdAt,
          });
          return existingUser._id;
        })()
      : await ctx.db.insert("users", {
          tenantId,
          eduMylesUserId,
          workosUserId: args.workosUserId,
          inviteToken: args.inviteToken,
          email: invite.email.trim().toLowerCase(),
          firstName: args.firstName,
          lastName: args.lastName,
          role: "school_admin",
          permissions: ["*"],
          organizationId,
          isActive: true,
          status: "active",
          phone: args.phone ?? invite.phone,
          createdAt: now,
        });

    for (const moduleSlug of CORE_MARKETPLACE_MODULE_SLUGS) {
      const moduleRecord = await ctx.db
        .query("marketplace_modules")
        .withIndex("by_slug", (q: any) => q.eq("slug", moduleSlug))
        .first();

      if (!moduleRecord) {
        continue;
      }

      const existingInstall = await ctx.db
        .query("module_installs")
        .withIndex("by_tenantId_moduleSlug", (q: any) =>
          q.eq("tenantId", tenantId).eq("moduleSlug", moduleSlug)
        )
        .first();

      if (!existingInstall) {
        await ctx.db.insert("module_installs", {
          moduleId: moduleRecord._id,
          moduleSlug,
          tenantId,
          status: "active",
          billingPeriod: "monthly",
          currentPriceKes: 0,
          hasPriceOverride: false,
          isFree: true,
          firstInstalledAt: now,
          billingStartsAt: undefined,
          nextBillingDate: undefined,
          installedAt: now,
          installedBy: eduMylesUserId,
          version: moduleRecord.version,
          paymentFailureCount: 0,
          createdAt: now,
          updatedAt: now,
        });
      }

      const legacyModuleId = LEGACY_CORE_MODULE_MAP[moduleSlug];
      const legacyInstall = await ctx.db
        .query("installedModules")
        .withIndex("by_tenant_module", (q: any) => q.eq("tenantId", tenantId).eq("moduleId", legacyModuleId))
        .first();

      if (!legacyInstall) {
        await ctx.db.insert("installedModules", {
          tenantId,
          moduleId: legacyModuleId,
          installedAt: now,
          installedBy: eduMylesUserId,
          config: {
            provisionedBy: "tenant_invite_acceptance",
          },
          status: "active",
          updatedAt: now,
        });
      }
    }

    await ctx.db.insert("tenant_onboarding", {
      tenantId,
      wizardCompleted: false,
      wizardCompletedAt: undefined,
      currentStep: 1,
      isActivated: false,
      steps: buildDefaultOnboardingSteps(0),
      healthScore: 0,
      lastActivityAt: now,
      stalled: false,
      isStalled: false,
      stalledSince: undefined,
      stalledAtStep: undefined,
      assignedAccountManager: undefined,
      interventionsSent: [],
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("tenant_subscriptions", {
      tenantId,
      planId: invite.suggestedPlan ?? "starter",
      status: "trialing",
      currentPeriodStart: now,
      currentPeriodEnd: now + 14 * 24 * 60 * 60 * 1000,
      cancelAtPeriodEnd: false,
      studentCountAtBilling: invite.studentCountEstimate,
      paymentProvider: undefined,
      paymentReference: undefined,
      customPriceMonthlyKes: undefined,
      customPriceAnnualKes: undefined,
      customPricingNotes: "Onboarding trial subscription",
      nextPaymentDue: now + 14 * 24 * 60 * 60 * 1000,
      trialEndsAt: now + 14 * 24 * 60 * 60 * 1000,
      cancelledAt: undefined,
      cancellationReason: undefined,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(invite._id, {
      status: "accepted",
      acceptedAt: now,
      tenantId,
      updatedAt: now,
    });

    if (invite.waitlistId) {
      await ctx.db.patch(invite.waitlistId, {
        status: "converted",
        tenantId,
        convertedAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.insert("notifications", {
      tenantId,
      userId: eduMylesUserId,
      title: "Welcome to EduMyles",
      message: "Your school workspace is ready. Continue with setup to activate your trial.",
      type: "onboarding",
      isRead: false,
      link: "/admin/setup",
      createdAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.actions.communications.email.sendEmailInternal, {
      tenantId,
      actorId: eduMylesUserId,
      actorEmail: invite.email.trim().toLowerCase(),
      to: [invite.email.trim().toLowerCase()],
      subject: `Welcome to EduMyles, ${args.firstName}`,
      template: "tenant_welcome",
      data: {
        firstName: args.firstName,
        schoolName: invite.schoolName,
        setupUrl: `${getAppUrl()}/admin/setup`,
      },
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: eduMylesUserId,
      actorEmail: invite.email.trim().toLowerCase(),
      action: "tenant.created",
      entityType: "tenant",
      entityId: tenantId,
      after: {
        tenantId,
        subdomain,
        organizationId,
        inviteId: invite._id,
      },
    });

    return {
      tenantId,
      tenantDocId,
      userId: eduMylesUserId,
      email: invite.email.trim().toLowerCase(),
      role: "school_admin",
      slug: subdomain,
      workosUserId: args.workosUserId,
    };
  },
});

export const createTenant = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    subdomain: v.string(),
    email: v.string(),
    phone: v.string(),
    plan: planInputValidator,
    county: v.string(),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requirePlatformSession(ctx, args);

    const existing = await ctx.db
      .query("tenants")
      .withIndex("by_subdomain", (q) => q.eq("subdomain", args.subdomain))
      .first();

    if (existing) {
      throw new Error(`CONFLICT: Subdomain '${args.subdomain}' already taken`);
    }

    const tenantId = generateTenantId();
    const now = Date.now();
    const normalizedPlan = normalizePlan(args.plan);

    // 1. Create tenant record
    const id = await ctx.db.insert("tenants", {
      tenantId,
      name: args.name,
      subdomain: args.subdomain,
      email: args.email,
      phone: args.phone,
      plan: normalizedPlan,
      status: "trial",
      county: args.county,
      country: args.country ?? "KE",
      createdAt: now,
      updatedAt: now,
    });

    // 2. Create organization record — required so user records can reference it
    const orgId = await ctx.db.insert("organizations", {
      tenantId,
      workosOrgId: `edumyles-${tenantId}`,
      name: args.name,
      subdomain: args.subdomain,
      tier: normalizedPlan,
      isActive: true,
      createdAt: now,
    });

    // 3. Auto-provision core modules (SIS, Communications, Users Management)
    for (const moduleId of CORE_MODULE_IDS) {
      await ctx.db.insert("installedModules", {
        tenantId,
        moduleId,
        installedAt: now,
        installedBy: tenantCtx.userId,
        config: {},
        status: "active",
        updatedAt: now,
      });
    }

    await logAction(ctx, {
      tenantId: tenantCtx.tenantId,
      actorId: tenantCtx.userId,
      actorEmail: tenantCtx.email,
      action: "tenant.created",
      entityType: "tenant",
      entityId: tenantId,
      after: {
        name: args.name,
        subdomain: args.subdomain,
        plan: normalizedPlan,
        coreModulesInstalled: CORE_MODULE_IDS,
      },
    });

    return { id, tenantId, organizationId: orgId };
  },
});

export const provisionTenant = mutation({
  args: {
    sessionToken: v.string(),
    schoolName: v.string(),
    schoolType: v.optional(v.string()),
    country: v.string(),
    county: v.string(),
    address: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    adminFirstName: v.string(),
    adminLastName: v.string(),
    adminEmail: v.string(),
    adminPhone: v.optional(v.string()),
    adminJobTitle: v.optional(v.string()),
    sendMagicLink: v.boolean(),
    planId: v.string(),
    billingCycle: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annual")),
    customPriceMonthlyKes: v.optional(v.number()),
    customPriceAnnualKes: v.optional(v.number()),
    trialDays: v.number(),
    studentCountEstimate: v.optional(v.number()),
    paymentCollectionMode: v.union(v.literal("collect_now"), v.literal("prompt_later")),
    subdomain: v.string(),
    customDomain: v.optional(v.string()),
    timezone: v.string(),
    displayCurrency: v.string(),
    academicYearStartMonth: v.number(),
    termStructure: v.string(),
    selectedModuleIds: v.array(v.string()),
    pilotGrantModuleIds: v.array(v.string()),
    welcomeTemplate: v.optional(v.string()),
    welcomeMessage: v.optional(v.string()),
    sendWelcomeImmediately: v.boolean(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);

    const existing = await ctx.db
      .query("tenants")
      .withIndex("by_subdomain", (q) => q.eq("subdomain", args.subdomain))
      .first();
    if (existing) {
      throw new Error(`CONFLICT: Subdomain '${args.subdomain}' already taken`);
    }

    const plan = (await ctx.db.query("subscription_plans").collect()).find(
      (record) => record.name === args.planId
    );
    if (!plan) {
      throw new Error("NOT_FOUND: Subscription plan not found");
    }

    const now = Date.now();
    const tenantId = generateTenantId();
    const normalizedPlan = normalizePlan(args.planId as any);
    const selectedModuleIds = Array.from(new Set(args.selectedModuleIds));
    const trialEndsAt = args.trialDays > 0 ? now + args.trialDays * 24 * 60 * 60 * 1000 : undefined;
    const billingCycleDays =
      args.billingCycle === "annual"
        ? 365
        : args.billingCycle === "quarterly"
          ? 90
          : 30;
    const currentPeriodEnd = trialEndsAt ?? now + billingCycleDays * 24 * 60 * 60 * 1000;

    const tenantDocId = await ctx.db.insert("tenants", {
      tenantId,
      name: args.schoolName,
      subdomain: args.subdomain,
      email: args.adminEmail,
      phone: args.adminPhone ?? "",
      plan: normalizedPlan,
      status: args.trialDays > 0 ? "trial" : "active",
      county: args.county,
      country: args.country,
      createdAt: now,
      updatedAt: now,
    });

    const organizationId = await ctx.db.insert("organizations", {
      tenantId,
      workosOrgId: `edumyles-${tenantId}`,
      name: args.schoolName,
      subdomain: args.subdomain,
      tier: normalizedPlan,
      isActive: true,
      createdAt: now,
    });

    await ctx.db.insert("tenant_subscriptions", {
      tenantId,
      planId: args.planId,
      status: args.trialDays > 0 ? "trialing" : "active",
      currentPeriodStart: now,
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
      studentCountAtBilling: args.studentCountEstimate,
      paymentProvider: undefined,
      paymentReference: undefined,
      customPriceMonthlyKes: args.customPriceMonthlyKes,
      customPriceAnnualKes: args.customPriceAnnualKes,
      customPricingNotes: [
        args.schoolType ? `School type: ${args.schoolType}` : null,
        args.address ? `Address: ${args.address}` : null,
        args.websiteUrl ? `Website: ${args.websiteUrl}` : null,
        args.customDomain ? `Custom domain: ${args.customDomain}` : null,
        `Billing cycle: ${args.billingCycle}`,
        `Timezone: ${args.timezone}`,
        `Display currency: ${args.displayCurrency}`,
        `Academic year start month: ${args.academicYearStartMonth}`,
        `Term structure: ${args.termStructure}`,
        `Payment collection: ${args.paymentCollectionMode}`,
      ]
        .filter(Boolean)
        .join(" | "),
      nextPaymentDue: currentPeriodEnd,
      trialEndsAt,
      cancelledAt: undefined,
      cancellationReason: undefined,
      createdAt: now,
      updatedAt: now,
    });

    if (args.studentCountEstimate !== undefined) {
      await ctx.db.insert("tenant_usage_stats", {
        tenantId,
        studentCount: args.studentCountEstimate,
        staffCount: 1,
        storageUsedGb: 0,
        recordedAt: now,
        createdAt: now,
      });
    }

    await ctx.db.insert("tenant_onboarding", {
      tenantId,
      wizardCompleted: false,
      wizardCompletedAt: undefined,
      currentStep: 1,
      isActivated: false,
      steps: buildDefaultOnboardingSteps(selectedModuleIds.length),
      healthScore: selectedModuleIds.length > 0 ? 8 : 5,
      lastActivityAt: now,
      stalled: false,
      assignedAccountManager: undefined,
      createdAt: now,
      updatedAt: now,
    });

    const installedModuleIds = selectedModuleIds.length > 0 ? selectedModuleIds : CORE_MODULE_IDS;
    for (const moduleId of installedModuleIds) {
      await ctx.db.insert("installedModules", {
        tenantId,
        moduleId,
        installedAt: now,
        installedBy: platform.userId,
        config: {
          provisionedByPlatform: true,
          provisioningSource: "platform_tenant_create",
        },
        status: "active",
        updatedAt: now,
      });
    }

    for (const moduleId of args.pilotGrantModuleIds) {
      await ctx.db.insert("pilot_grants", {
        moduleId,
        tenantId,
        grantType: "free_trial",
        discountPct: undefined,
        customPriceKes: 0,
        startDate: now,
        endDate: trialEndsAt ?? currentPeriodEnd,
        grantedBy: platform.userId,
        reason: "Platform-admin tenant provisioning pilot grant",
        stealthMode: false,
        status: "active",
        convertedToPaid: false,
        notificationsSent: [],
        createdAt: now,
        updatedAt: now,
      });
    }

    const pendingUserId = await ctx.db.insert("users", {
      tenantId,
      eduMylesUserId: crypto.randomUUID(),
      workosUserId: `pending-${crypto.randomUUID()}`,
      email: args.adminEmail,
      firstName: args.adminFirstName,
      lastName: args.adminLastName,
      role: "school_admin",
      permissions: [],
      organizationId,
      isActive: false,
      phone: args.adminPhone,
      bio: args.adminJobTitle,
      createdAt: now,
    });

    await logAction(ctx, {
      tenantId: platform.tenantId,
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "tenant.created",
      entityType: "tenant",
      entityId: tenantId,
      after: {
        tenantDocId,
        organizationId,
        pendingUserId,
        planId: args.planId,
        billingCycle: args.billingCycle,
        trialDays: args.trialDays,
        installedModuleIds,
        pilotGrantModuleIds: args.pilotGrantModuleIds,
        sendMagicLink: args.sendMagicLink,
        invitationProvider: "workos",
        welcomeTemplate: args.welcomeTemplate,
      },
    });

    return {
      success: true,
      tenantId,
      tenantDocId,
      organizationId,
      pendingUserId,
      requiresOrgProvisioning: true,
    };
  },
});

export const suspendTenant = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requirePlatformSession(ctx, args);

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (!tenant) throw new Error("NOT_FOUND: Tenant not found");

    await ctx.db.patch(tenant._id, {
      status: "suspended",
      suspendedAt: Date.now(),
      suspendReason: args.reason,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: tenantCtx.tenantId,
      actorId: tenantCtx.userId,
      actorEmail: tenantCtx.email,
      action: "tenant.suspended",
      entityType: "tenant",
      entityId: args.tenantId,
      after: { reason: args.reason },
    });
  },
});

export const activateTenant = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requirePlatformSession(ctx, args);

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (!tenant) throw new Error("NOT_FOUND: Tenant not found");

    await ctx.db.patch(tenant._id, {
      status: "active",
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: tenantCtx.tenantId,
      actorId: tenantCtx.userId,
      actorEmail: tenantCtx.email,
      action: "tenant.activated",
      entityType: "tenant",
      entityId: args.tenantId,
      after: { status: "active" },
    });
  },
});

export const updateTenant = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    plan: v.optional(planInputValidator),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("suspended"),
      v.literal("trial"),
      v.literal("archived")
    )),
    county: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requirePlatformSession(ctx, args);

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (!tenant) throw new Error("NOT_FOUND: Tenant not found");

    const before = {
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      plan: tenant.plan,
      status: tenant.status,
      county: tenant.county,
      country: tenant.country,
    };

    const patch: Record<string, any> = { updatedAt: Date.now() };
    if (args.name !== undefined) patch.name = args.name;
    if (args.email !== undefined) patch.email = args.email;
    if (args.phone !== undefined) patch.phone = args.phone;
    if (args.plan !== undefined) patch.plan = normalizePlan(args.plan);
    if (args.status !== undefined) patch.status = args.status;
    if (args.county !== undefined) patch.county = args.county;
    if (args.country !== undefined) patch.country = args.country;

    await ctx.db.patch(tenant._id, patch);

    await logAction(ctx, {
      tenantId: tenantCtx.tenantId,
      actorId: tenantCtx.userId,
      actorEmail: tenantCtx.email,
      action: "tenant.updated",
      entityType: "tenant",
      entityId: args.tenantId,
      before,
      after: patch,
    });
  },
});

export const archiveTenant = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    confirmationName: v.string(),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requirePlatformSession(ctx, args);

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (!tenant) throw new Error("NOT_FOUND: Tenant not found");
    if (tenant.status !== "suspended") {
      throw new Error("CONFLICT: Tenant must be suspended before it can be archived");
    }
    if (tenant.name.trim().toLowerCase() !== args.confirmationName.trim().toLowerCase()) {
      throw new Error("CONFIRMATION_FAILED: Tenant name confirmation does not match");
    }

    const now = Date.now();
    await ctx.db.patch(tenant._id, {
      status: "archived",
      updatedAt: now,
    });

    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();
    if (organization) {
      await ctx.db.patch(organization._id, {
        isActive: false,
      });
    }

    await logAction(ctx, {
      tenantId: tenantCtx.tenantId,
      actorId: tenantCtx.userId,
      actorEmail: tenantCtx.email,
      action: "tenant.archived",
      entityType: "tenant",
      entityId: args.tenantId,
      before: { status: tenant.status },
      after: { status: "archived" },
    });

    return { success: true };
  },
});

export const deleteTenant = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    confirmationName: v.string(),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requirePlatformSession(ctx, args);

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (!tenant) throw new Error("NOT_FOUND: Tenant not found");
    if (tenant.status !== "archived") {
      throw new Error("CONFLICT: Tenant must be archived before it can be deleted");
    }
    if (tenant.name.trim().toLowerCase() !== args.confirmationName.trim().toLowerCase()) {
      throw new Error("CONFIRMATION_FAILED: Tenant name confirmation does not match");
    }

    const [users, students, invoices, payments] = await Promise.all([
      ctx.db.query("users").withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId)).collect(),
      ctx.db.query("students").withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId)).collect(),
      ctx.db.query("invoices").withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId)).collect(),
      ctx.db.query("payments").withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId)).collect(),
    ]);

    if (users.length || students.length || invoices.length || payments.length) {
      throw new Error("CONFLICT: Tenant still has dependent users, students, invoices, or payments and cannot be deleted");
    }

    const modules = await ctx.db
      .query("installedModules")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
    for (const module of modules) {
      await ctx.db.delete(module._id);
    }

    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();
    if (organization) {
      await ctx.db.delete(organization._id);
    }

    await ctx.db.delete(tenant._id);

    await logAction(ctx, {
      tenantId: tenantCtx.tenantId,
      actorId: tenantCtx.userId,
      actorEmail: tenantCtx.email,
      action: "tenant.deleted",
      entityType: "tenant",
      entityId: args.tenantId,
      before: tenant,
    });

    return { success: true };
  },
});

/**
 * Invite a user to a tenant as school_admin (or another role).
 * Creates a pending user record that gets linked on first WorkOS login.
 * Invitation delivery is handled by the Next.js WorkOS route.
 */
export const inviteTenantAdmin = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    personalMessage: v.optional(v.string()),
    expiresInDays: v.optional(v.number()),
    role: v.union(
      v.literal("school_admin"),
      v.literal("principal"),
      v.literal("bursar"),
      v.literal("hr_manager"),
      v.literal("librarian"),
      v.literal("transport_manager"),
      v.literal("teacher")
    ),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requirePlatformSession(ctx, args);

    // Verify tenant exists
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();
    if (!tenant) throw new Error("NOT_FOUND: Tenant not found");

    // Prevent duplicate invites for same email in same tenant
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_tenant_email", (q) =>
        q.eq("tenantId", args.tenantId).eq("email", args.email)
      )
      .first();

    if (existingUser && !existingUser.workosUserId.startsWith("pending-")) {
      throw new Error("CONFLICT: A user with this email already exists in this tenant");
    }

    // Resolve organization for the tenant
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();
    if (!org) throw new Error("ORG_NOT_FOUND: Organization not created for tenant yet");

    const now = Date.now();
    const pendingId = existingUser?.workosUserId?.startsWith("pending-")
      ? existingUser.workosUserId
      : `pending-${crypto.randomUUID()}`;
    const eduMylesUserId = existingUser?.eduMylesUserId ?? crypto.randomUUID();

    if (existingUser?._id) {
      await ctx.db.patch(existingUser._id, {
        workosUserId: pendingId,
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        role: args.role,
        permissions: existingUser.permissions ?? [],
        organizationId: org._id,
        isActive: false,
      });
    } else {
      // Create pending user — workosUserId prefixed with "pending-" so auth
      // callback can detect and link on first login.
      await ctx.db.insert("users", {
        tenantId: args.tenantId,
        eduMylesUserId,
        workosUserId: pendingId,
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        role: args.role,
        permissions: [],
        organizationId: org._id,
        isActive: false,
        createdAt: now,
      });
    }

    const inviteToken = createInviteToken();
    const expiresAt = now + (args.expiresInDays ?? 7) * 24 * 60 * 60 * 1000;
    const existingInvite = (
      await ctx.db
        .query("tenant_invites")
        .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
        .collect()
    ).find(
      (invite) =>
        invite.email.toLowerCase() === args.email.toLowerCase() &&
        invite.status === "pending"
    );

    let tenantInviteId = existingInvite?._id;
    if (existingInvite) {
      await ctx.db.patch(existingInvite._id, {
        role: args.role,
        invitedBy: tenantCtx.userId,
        token: inviteToken,
        expiresAt,
        personalMessage: args.personalMessage,
        updatedAt: now,
      });
    } else {
      tenantInviteId = await ctx.db.insert("tenant_invites", {
        email: args.email,
        tenantId: args.tenantId,
        role: args.role,
        invitedBy: tenantCtx.userId,
        token: inviteToken,
        status: "pending",
        expiresAt,
        acceptedAt: undefined,
        personalMessage: args.personalMessage,
        createdAt: now,
        updatedAt: now,
      });
    }

    await logAction(ctx, {
      tenantId: tenantCtx.tenantId,
      actorId: tenantCtx.userId,
      actorEmail: tenantCtx.email,
      action: "user.invited",
      entityType: "user",
      entityId: args.email,
      after: {
        email: args.email,
        role: args.role,
        tenantInviteId,
        targetTenantId: args.tenantId,
        tenantName: tenant.name,
      },
    });

    return {
      success: true,
      email: args.email,
      role: args.role,
      tenantName: tenant.name,
      subdomain: tenant.subdomain,
      workosOrgId: org.workosOrgId,
      organizationId: org._id,
    };
  },
});

/**
 * Revoke a pending invitation by deleting the pending user record.
 */
export const revokeInvite = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const user = await ctx.db
      .query("users")
      .withIndex("by_tenant_email", (q) =>
        q.eq("tenantId", args.tenantId).eq("email", args.email)
      )
      .first();

    if (!user) throw new Error("NOT_FOUND: User not found");
    if (!user.workosUserId.startsWith("pending-")) {
      throw new Error("CONFLICT: Cannot revoke an already-accepted invitation");
    }

    await ctx.db.delete(user._id);
    return { success: true };
  },
});
