import { internalMutation, mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformContext, requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";
import { generateTenantId } from "../../helpers/idGenerator";
import { CORE_MODULE_IDS } from "../../modules/marketplace/moduleDefinitions";
import { normalizeModuleSlug } from "../../modules/marketplace/moduleAliases";
import { api, internal } from "../../_generated/api";
import { normalizeSchoolCurriculumCodes } from "../../../shared/src/constants/curricula";
import { tenantCurriculumSelectionSchema } from "../../../shared/src/validators";

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
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://app.edumyles.com").replace(/\/$/, "");
}

function getRootDomain() {
  return (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "edumyles.com")
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

function resolveTenantCurriculumSelection(args: {
  curriculumMode?: "single" | "multi";
  primaryCurriculumCode?: string;
  activeCurriculumCodes?: string[];
}) {
  const normalizedActiveCurriculumCodes = normalizeSchoolCurriculumCodes(args.activeCurriculumCodes ?? []);
  const hasCurriculumSelection =
    !!args.curriculumMode ||
    !!args.primaryCurriculumCode ||
    normalizedActiveCurriculumCodes.length > 0;

  if (!hasCurriculumSelection) {
    return null;
  }

  const result = tenantCurriculumSelectionSchema.safeParse({
    curriculumMode: args.curriculumMode,
    primaryCurriculumCode: args.primaryCurriculumCode,
    activeCurriculumCodes: normalizedActiveCurriculumCodes,
  });

  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(`INVALID_ARGUMENT: ${issue?.message ?? "Invalid curriculum selection"}`);
  }

  return result.data;
}

function buildSuggestedModules(studentCountEstimate?: number) {
  const base = ["mod_finance", "mod_attendance", "mod_academics"];
  if ((studentCountEstimate ?? 0) >= 250) {
    base.push("mod_reports");
  }
  return base;
}

const CORE_MARKETPLACE_MODULE_SLUGS = ["core_sis", "core_users", "core_notifications"] as const;

async function ensureTenantModuleInstall(
  ctx: any,
  args: {
    tenantId: string;
    moduleId: string;
    installedBy: string;
    now: number;
    isFree?: boolean;
  }
) {
  const moduleSlug = normalizeModuleSlug(args.moduleId);
  const moduleRecord = await ctx.db
    .query("marketplace_modules")
    .withIndex("by_slug", (q: any) => q.eq("slug", moduleSlug))
    .first();
  const existing = await ctx.db
    .query("module_installs")
    .withIndex("by_tenantId_moduleSlug", (q: any) =>
      q.eq("tenantId", args.tenantId).eq("moduleSlug", moduleSlug)
    )
    .first();

  if (existing) {
    await ctx.db.patch(existing._id, {
      status: "active",
      updatedAt: args.now,
    });
    return existing._id;
  }

  return await ctx.db.insert("module_installs", {
    tenantId: args.tenantId,
    moduleId: moduleRecord?._id ?? moduleSlug,
    moduleSlug,
    status: "active",
    billingPeriod: "monthly",
    currentPriceKes: 0,
    hasPriceOverride: false,
    isFree: args.isFree ?? moduleSlug.startsWith("core_"),
    firstInstalledAt: args.now,
    billingStartsAt: args.now,
    nextBillingDate: args.now,
    installedAt: args.now,
    installedBy: args.installedBy,
    version: moduleRecord?.version ?? "1.0.0",
    paymentFailureCount: 0,
    createdAt: args.now,
    updatedAt: args.now,
  });
}

const RESERVED_SUBDOMAINS = new Set([
  "app",
  "www",
  "api",
  "admin",
  "auth",
  "mail",
  "email",
  "support",
  "help",
  "status",
  "cdn",
  "static",
  "assets",
  "blog",
  "docs",
  "security",
  "platform",
]);

function slugifySchoolName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "school";
}

function normalizeSubdomain(value?: string | null, fallbackName = "school") {
  const candidate = slugifySchoolName(value?.trim() || fallbackName);
  return RESERVED_SUBDOMAINS.has(candidate) ? `${candidate}-school` : candidate;
}

async function generateUniqueSubdomain(
  ctx: any,
  preferredValue: string,
  fallbackName?: string,
  taken: Set<string> = new Set()
) {
  const base = normalizeSubdomain(preferredValue, fallbackName);
  let candidate = base;
  let counter = 2;

  while (true) {
    if (RESERVED_SUBDOMAINS.has(candidate) || taken.has(candidate)) {
      candidate = `${base}-${counter}`;
      counter += 1;
      continue;
    }

    const existing = await ctx.db
      .query("tenants")
      .withIndex("by_subdomain", (q: any) => q.eq("subdomain", candidate))
      .first();

    if (!existing) {
      taken.add(candidate);
      return candidate;
    }

    candidate = `${base}-${counter}`;
    counter += 1;
  }
}

function buildTenantUrl(subdomain: string) {
  return `https://${subdomain}.${getRootDomain()}`;
}

function buildTenantInviteUrl(inviteToken: string) {
  return `${getAppUrl()}/invite/accept?token=${encodeURIComponent(inviteToken)}`;
}

function formatEmailDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function generateNetworkId() {
  return `NETWORK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function dedupeStrings(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function buildCampusDraftRows(
  additionalCampuses: Array<{
    campusName: string;
    schoolName?: string;
    schoolType?: string;
    subdomain: string;
    county?: string;
    country?: string;
    campusCode?: string;
  }>,
  fallback: { schoolType?: string; county: string; country: string }
) {
  return additionalCampuses.map((campus) => ({
    campusName: campus.campusName,
    schoolName: campus.schoolName ?? campus.campusName,
    schoolType: campus.schoolType ?? fallback.schoolType,
    subdomain: campus.subdomain,
    county: campus.county ?? fallback.county,
    country: campus.country ?? fallback.country,
    campusCode: campus.campusCode,
  }));
}

async function getSessionRecord(ctx: any, sessionToken: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("sessionToken", sessionToken))
    .first();

  if (!session || session.expiresAt < Date.now()) {
    throw new Error("UNAUTHENTICATED: Session not found");
  }

  return session;
}

function isPlatformActorSession(session: any) {
  return (
    session.tenantId === "PLATFORM" ||
    ["master_admin", "super_admin", "platform_manager"].includes(session.role)
  );
}

async function requireNetworkManagementAccess(
  ctx: any,
  args: { sessionToken: string; networkId: string },
  allowedRoles: string[] = ["network_owner", "network_admin"]
) {
  const session = await getSessionRecord(ctx, args.sessionToken);
  const network = await ctx.db
    .query("tenant_networks")
    .withIndex("by_networkId", (q: any) => q.eq("networkId", args.networkId))
    .first();

  if (!network) {
    throw new Error("NOT_FOUND: Network not found");
  }

  const isPlatform = isPlatformActorSession(session);
  const membership =
    !isPlatform && session.identityId
      ? await ctx.db
          .query("network_memberships")
          .withIndex("by_network_identity", (q: any) =>
            q.eq("networkId", args.networkId).eq("identityId", session.identityId)
          )
          .first()
      : null;

  if (!isPlatform && !membership) {
    throw new Error("FORBIDDEN: You do not have access to manage this network");
  }

  if (!isPlatform && membership && !allowedRoles.includes(membership.role)) {
    throw new Error(`FORBIDDEN: Network role '${membership.role}' cannot manage this action`);
  }

  return { session, network, membership, isPlatform };
}

async function syncNetworkCampusState(ctx: any, args: {
  networkId: string;
  campusTenantId: string;
  currentSessionId?: any;
  now: number;
}) {
  const memberships = await ctx.db
    .query("network_memberships")
    .withIndex("by_networkId", (q: any) => q.eq("networkId", args.networkId))
    .collect();

  for (const membership of memberships) {
    const nextAccessibleTenantIds = dedupeStrings([
      ...(membership.accessibleTenantIds ?? []),
      args.campusTenantId,
    ]);

    if (nextAccessibleTenantIds.length !== (membership.accessibleTenantIds ?? []).length) {
      await ctx.db.patch(membership._id, {
        accessibleTenantIds: nextAccessibleTenantIds,
        updatedAt: args.now,
      });
    }
  }

  const identityIds = new Set(
    memberships
      .map((membership: any) => membership.identityId)
      .filter((identityId: string | undefined): identityId is string => Boolean(identityId))
  );

  const sessions = await ctx.db.query("sessions").collect();
  let currentSessionAccessibleTenantIds: string[] | null = null;

  for (const session of sessions) {
    if (
      session.networkId !== args.networkId ||
      !session.identityId ||
      !identityIds.has(session.identityId) ||
      session.expiresAt < Date.now()
    ) {
      continue;
    }

    const nextAccessibleTenantIds = dedupeStrings([
      ...(session.accessibleTenantIds ?? [session.activeTenantId ?? session.tenantId]),
      args.campusTenantId,
    ]);

    if (nextAccessibleTenantIds.length !== (session.accessibleTenantIds ?? [session.activeTenantId ?? session.tenantId]).length) {
      await ctx.db.patch(session._id, {
        accessibleTenantIds: nextAccessibleTenantIds,
      });
    }

    if (String(session._id) === String(args.currentSessionId)) {
      currentSessionAccessibleTenantIds = nextAccessibleTenantIds;
    }
  }

  const campuses = await ctx.db
    .query("network_campuses")
    .withIndex("by_networkId", (q: any) => q.eq("networkId", args.networkId))
    .collect();
  const provisionedCampusTenantIds = campuses
    .slice()
    .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
    .map((campus: any) => campus.tenantId);
  const networkTenants = await ctx.db
    .query("tenants")
    .withIndex("by_networkId", (q: any) => q.eq("networkId", args.networkId))
    .collect();

  for (const tenant of networkTenants) {
    const onboarding = await ctx.db
      .query("tenant_onboarding")
      .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenant.tenantId))
      .first();

    if (onboarding) {
      await ctx.db.patch(onboarding._id, {
        provisionedCampusTenantIds,
        updatedAt: args.now,
      });
    }
  }

  return {
    currentSessionAccessibleTenantIds:
      currentSessionAccessibleTenantIds ?? provisionedCampusTenantIds,
    provisionedCampusTenantIds,
  };
}

async function createNetworkCampusRecord(ctx: any, args: {
  sessionToken: string;
  networkId: string;
  campusName: string;
  campusCode?: string;
  schoolName?: string;
  subdomain?: string;
  schoolType?: string;
  county: string;
  country: string;
}) {
  const { session, network, membership } = await requireNetworkManagementAccess(ctx, args);
  const subdomain = await generateUniqueSubdomain(
    ctx,
    args.subdomain ?? args.schoolName ?? args.campusName,
    args.schoolName ?? args.campusName
  );

  const primaryTenant = network.primaryTenantId
    ? await ctx.db.query("tenants").withIndex("by_tenantId", (q: any) => q.eq("tenantId", network.primaryTenantId!)).first()
    : null;
  if (!primaryTenant) {
    throw new Error("CONFLICT: Network is missing its primary campus");
  }

  const primarySubscription = await ctx.db
    .query("tenant_subscriptions")
    .withIndex("by_tenantId", (q: any) => q.eq("tenantId", primaryTenant.tenantId))
    .first();
  if (!primarySubscription) {
    throw new Error("CONFLICT: Primary campus subscription not found");
  }

  const activeModules = await ctx.db
    .query("module_installs")
    .withIndex("by_tenantId", (q: any) => q.eq("tenantId", primaryTenant.tenantId))
    .collect();

  const networkCampuses = await ctx.db
    .query("network_campuses")
    .withIndex("by_networkId", (q: any) => q.eq("networkId", args.networkId))
    .collect();
  const networkMemberships = await ctx.db
    .query("network_memberships")
    .withIndex("by_networkId", (q: any) => q.eq("networkId", args.networkId))
    .collect();
  const ownerMembership =
    networkMemberships.find((entry: any) => entry.role === "network_owner") ??
    networkMemberships.find((entry: any) => entry.role === "network_admin") ??
    membership;
  const ownerIdentity = ownerMembership
    ? await ctx.db
        .query("user_identities")
        .withIndex("by_identityId", (q: any) => q.eq("identityId", ownerMembership.identityId))
        .first()
    : null;
  const campusAdminEmail =
    ownerIdentity?.email?.toLowerCase() ??
    session.email?.toLowerCase() ??
    primaryTenant.email.toLowerCase();
  const campusAdminWorkosUserId =
    ownerIdentity?.workosUserId ??
    (session.email?.toLowerCase() === campusAdminEmail ? session.workosUserId : undefined);
  const campusAdminIsActive = Boolean(campusAdminWorkosUserId);

  const now = Date.now();
  const tenantId = generateTenantId();
  const organizationId = await ctx.db.insert("organizations", {
    tenantId,
    workosOrgId: `edumyles-${tenantId}`,
    name: args.schoolName?.trim() || args.campusName.trim(),
    subdomain,
    tier: primaryTenant.plan,
    isActive: true,
    createdAt: now,
  });

  await ctx.db.insert("tenants", {
    tenantId,
    networkId: args.networkId,
    name: args.schoolName?.trim() || args.campusName.trim(),
    campusName: args.campusName.trim(),
    campusCode: args.campusCode,
    isPrimaryCampus: false,
    subdomain,
    email: primaryTenant.email,
    phone: primaryTenant.phone,
    website: primaryTenant.website,
    logoUrl: primaryTenant.logoUrl,
    plan: primaryTenant.plan,
    status: primaryTenant.status,
    schoolType: args.schoolType ?? primaryTenant.schoolType,
    county: args.county,
    country: args.country,
    createdAt: now,
    updatedAt: now,
  });

  await ctx.db.insert("tenant_subscriptions", {
    tenantId,
    planId: primarySubscription.planId,
    status: primarySubscription.status,
    currentPeriodStart: primarySubscription.currentPeriodStart,
    currentPeriodEnd: primarySubscription.currentPeriodEnd,
    cancelAtPeriodEnd: primarySubscription.cancelAtPeriodEnd,
    studentCountAtBilling: primarySubscription.studentCountAtBilling,
    paymentProvider: primarySubscription.paymentProvider,
    paymentReference: primarySubscription.paymentReference,
    customPriceMonthlyKes: primarySubscription.customPriceMonthlyKes,
    customPriceAnnualKes: primarySubscription.customPriceAnnualKes,
    customPricingNotes: `Inherited from primary network campus ${primaryTenant.tenantId}`,
    nextPaymentDue: primarySubscription.nextPaymentDue,
    trialEndsAt: primarySubscription.trialEndsAt,
    cancelledAt: primarySubscription.cancelledAt,
    cancellationReason: primarySubscription.cancellationReason,
    createdAt: now,
    updatedAt: now,
  });

  await ctx.db.insert("tenant_onboarding", {
    tenantId,
    wizardCompleted: false,
    wizardCompletedAt: undefined,
    currentStep: 1,
    isActivated: false,
    organizationMode: "multi_campus_network",
    networkId: args.networkId,
    steps: buildDefaultOnboardingSteps(activeModules.length),
    healthScore: activeModules.length > 0 ? 8 : 5,
    lastActivityAt: now,
    stalled: false,
    assignedAccountManager: undefined,
    createdAt: now,
    updatedAt: now,
  });

  for (const module of activeModules) {
    await ensureTenantModuleInstall(ctx, {
      tenantId,
      moduleId: module.moduleSlug ?? String(module.moduleId),
      installedBy: session.userId,
      now,
      isFree: module.isFree,
    });
  }

  if (campusAdminEmail) {
    await ctx.db.insert("users", {
      tenantId,
      eduMylesUserId: crypto.randomUUID(),
      workosUserId: campusAdminWorkosUserId ?? `pending-${crypto.randomUUID()}`,
      identityId: ownerMembership?.identityId ?? session.identityId,
      email: campusAdminEmail,
      firstName: ownerIdentity?.firstName,
      lastName: ownerIdentity?.lastName,
      role: "school_admin",
      permissions: [],
      organizationId,
      isActive: campusAdminIsActive,
      status: campusAdminIsActive ? "active" : "pending_invite",
      phone: ownerIdentity?.phone,
      createdAt: now,
    });
  }

  await ctx.db.insert("network_campuses", {
    networkId: args.networkId,
    tenantId,
    campusName: args.campusName.trim(),
    campusCode: args.campusCode,
    isPrimary: false,
    lifecycleStatus: "active",
    sortOrder: networkCampuses.length,
    createdAt: now,
    updatedAt: now,
  });

  const { currentSessionAccessibleTenantIds } = await syncNetworkCampusState(ctx, {
    networkId: args.networkId,
    campusTenantId: tenantId,
    currentSessionId: session._id,
    now,
  });

  if (ownerMembership?.identityId) {
    const linkedUsers = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", campusAdminEmail))
      .collect();
    for (const user of linkedUsers) {
      if (user.identityId !== ownerMembership.identityId) {
        await ctx.db.patch(user._id, { identityId: ownerMembership.identityId });
      }
    }
  }

  await logAction(ctx, {
    tenantId: session.activeTenantId ?? session.tenantId,
    actorId: session.userId,
    actorEmail: session.email ?? "",
    action: "tenant.created",
    entityType: "network_campus",
    entityId: tenantId,
    after: {
      networkId: args.networkId,
      campusName: args.campusName,
      subdomain,
    },
  });

  return {
    success: true,
    tenantId,
    organizationId,
    networkId: args.networkId,
    subdomain,
    tenantUrl: buildTenantUrl(subdomain),
    accessibleTenantIds: currentSessionAccessibleTenantIds,
  };
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
    subdomain: v.optional(v.string()),
    email: v.string(),
    phone: v.string(),
    plan: planInputValidator,
    county: v.string(),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requirePlatformSession(ctx, args);
    const subdomain = await generateUniqueSubdomain(ctx, args.subdomain ?? args.name, args.name);

    const tenantId = generateTenantId();
    const now = Date.now();
    const normalizedPlan = normalizePlan(args.plan);

    // 1. Create tenant record
    const id = await ctx.db.insert("tenants", {
      tenantId,
      name: args.name,
      subdomain,
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
      subdomain,
      tier: normalizedPlan,
      isActive: true,
      createdAt: now,
    });

    // 3. Auto-provision core modules (SIS, Communications, Users Management)
    for (const moduleId of CORE_MODULE_IDS) {
      await ensureTenantModuleInstall(ctx, {
        tenantId,
        moduleId,
        installedBy: tenantCtx.userId,
        now,
        isFree: true,
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
        subdomain,
        tenantUrl: buildTenantUrl(subdomain),
        plan: normalizedPlan,
        coreModulesInstalled: CORE_MODULE_IDS,
      },
    });

    return { id, tenantId, organizationId: orgId, subdomain, tenantUrl: buildTenantUrl(subdomain) };
  },
});

export const provisionTenant = mutation({
  args: {
    sessionToken: v.string(),
    organizationMode: v.optional(v.union(v.literal("single_campus"), v.literal("multi_campus_network"))),
    networkName: v.optional(v.string()),
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
    subdomain: v.optional(v.string()),
    customDomain: v.optional(v.string()),
    timezone: v.string(),
    displayCurrency: v.string(),
    academicYearStartMonth: v.number(),
    termStructure: v.string(),
    curriculumMode: v.optional(v.union(v.literal("single"), v.literal("multi"))),
    primaryCurriculumCode: v.optional(v.string()),
    activeCurriculumCodes: v.optional(v.array(v.string())),
    selectedModuleIds: v.array(v.string()),
    pilotGrantModuleIds: v.array(v.string()),
    welcomeTemplate: v.optional(v.string()),
    welcomeMessage: v.optional(v.string()),
    sendWelcomeImmediately: v.boolean(),
    primaryCampus: v.optional(v.object({
      campusName: v.optional(v.string()),
      campusCode: v.optional(v.string()),
      schoolName: v.optional(v.string()),
      subdomain: v.optional(v.string()),
      county: v.optional(v.string()),
      country: v.optional(v.string()),
      schoolType: v.optional(v.string()),
    })),
    additionalCampuses: v.optional(v.array(v.object({
      campusName: v.string(),
      campusCode: v.optional(v.string()),
      schoolName: v.optional(v.string()),
      subdomain: v.optional(v.string()),
      county: v.optional(v.string()),
      country: v.optional(v.string()),
      schoolType: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);

    const plan = (await ctx.db.query("subscription_plans").collect()).find(
      (record) => record.name === args.planId
    );
    if (!plan) {
      throw new Error("NOT_FOUND: Subscription plan not found");
    }

    const now = Date.now();
    const selectedModuleIds = Array.from(new Set(args.selectedModuleIds));
    const normalizedPlan = normalizePlan(args.planId as any);
    const organizationMode = args.organizationMode ?? "single_campus";
    const curriculumSelection = resolveTenantCurriculumSelection({
      curriculumMode: args.curriculumMode,
      primaryCurriculumCode: args.primaryCurriculumCode,
      activeCurriculumCodes: args.activeCurriculumCodes,
    });
    const allocatedSubdomains = new Set<string>();
    const primaryCampus = {
      campusName: args.primaryCampus?.campusName?.trim() || args.schoolName,
      campusCode: args.primaryCampus?.campusCode,
      schoolName: args.primaryCampus?.schoolName?.trim() || args.schoolName,
      subdomain: await generateUniqueSubdomain(
        ctx,
        args.primaryCampus?.subdomain ?? args.subdomain ?? args.schoolName,
        args.schoolName,
        allocatedSubdomains
      ),
      county: args.primaryCampus?.county?.trim() || args.county,
      country: args.primaryCampus?.country?.trim() || args.country,
      schoolType: args.primaryCampus?.schoolType?.trim() || args.schoolType,
    };
    const additionalCampuses = [];
    for (const campus of args.additionalCampuses ?? []) {
      additionalCampuses.push({
        ...campus,
        campusName: campus.campusName.trim(),
        schoolName: campus.schoolName?.trim(),
        subdomain: await generateUniqueSubdomain(
        ctx,
        campus.subdomain || campus.schoolName || campus.campusName,
          campus.schoolName || campus.campusName,
          allocatedSubdomains
        ),
        county: campus.county?.trim(),
        country: campus.country?.trim(),
        schoolType: campus.schoolType?.trim(),
      });
    }

    const trialEndsAt = args.trialDays > 0 ? now + args.trialDays * 24 * 60 * 60 * 1000 : undefined;
    const billingCycleDays =
      args.billingCycle === "annual"
        ? 365
        : args.billingCycle === "quarterly"
        ? 90
          : 30;
    const currentPeriodEnd = trialEndsAt ?? now + billingCycleDays * 24 * 60 * 60 * 1000;
    const networkId =
      organizationMode === "multi_campus_network" ? generateNetworkId() : undefined;
    const campusDrafts = buildCampusDraftRows(additionalCampuses, {
      schoolType: args.schoolType,
      county: args.county,
      country: args.country,
    });

    if (networkId) {
      const networkName = args.networkName?.trim() || `${args.schoolName} Network`;
      const existingNetwork = await ctx.db
        .query("tenant_networks")
        .withIndex("by_slug", (q: any) => q.eq("slug", slugifySchoolName(networkName)))
        .first();
      if (existingNetwork) {
        throw new Error(`CONFLICT: Network '${networkName}' already exists`);
      }

      await ctx.db.insert("tenant_networks", {
        networkId,
        name: networkName,
        slug: slugifySchoolName(networkName),
        organizationMode,
        status: "active",
        billingMode: "standalone",
        primaryTenantId: undefined,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("user_identities", {
        identityId: `${networkId}-${args.adminEmail.toLowerCase()}`,
        email: args.adminEmail.toLowerCase(),
        workosUserId: undefined,
        firstName: args.adminFirstName,
        lastName: args.adminLastName,
        phone: args.adminPhone,
        createdAt: now,
        updatedAt: now,
      });
    }

    const tenantId = generateTenantId();
    const tenantDocId = await ctx.db.insert("tenants", {
      tenantId,
      networkId,
      name: primaryCampus.schoolName,
      campusName: primaryCampus.campusName,
      campusCode: primaryCampus.campusCode,
      isPrimaryCampus: networkId ? true : undefined,
      subdomain: primaryCampus.subdomain,
      email: args.adminEmail,
      phone: args.adminPhone ?? "",
      website: args.websiteUrl,
      logoUrl: args.logoUrl,
      plan: normalizedPlan,
      status: args.trialDays > 0 ? "trial" : "active",
      schoolType: primaryCampus.schoolType,
      primaryCurriculumCode: curriculumSelection?.primaryCurriculumCode,
      activeCurriculumCodes: curriculumSelection?.activeCurriculumCodes,
      curriculumMode: curriculumSelection?.curriculumMode,
      curriculumConfiguredAt: curriculumSelection ? now : undefined,
      curriculumConfiguredBy: curriculumSelection ? platform.userId : undefined,
      county: primaryCampus.county,
      country: primaryCampus.country,
      createdAt: now,
      updatedAt: now,
    });

    if (curriculumSelection) {
      for (const curriculumCode of curriculumSelection.activeCurriculumCodes) {
        await ctx.db.insert("tenant_curricula", {
          tenantId,
          curriculumCode,
          isPrimary: curriculumCode === curriculumSelection.primaryCurriculumCode,
          isActive: true,
          configuredFrom: "platform_onboarding",
          notes: undefined,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    const organizationId = await ctx.db.insert("organizations", {
      tenantId,
      workosOrgId: `edumyles-${tenantId}`,
      name: primaryCampus.schoolName,
      subdomain: primaryCampus.subdomain,
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
        primaryCampus.schoolType ? `School type: ${primaryCampus.schoolType}` : null,
        args.address ? `Address: ${args.address}` : null,
        args.websiteUrl ? `Website: ${args.websiteUrl}` : null,
        args.customDomain ? `Custom domain: ${args.customDomain}` : null,
        `Billing cycle: ${args.billingCycle}`,
        `Timezone: ${args.timezone}`,
        `Display currency: ${args.displayCurrency}`,
        `Academic year start month: ${args.academicYearStartMonth}`,
        `Term structure: ${args.termStructure}`,
        curriculumSelection
          ? `Curricula: ${curriculumSelection.activeCurriculumCodes.join(", ")} | Primary: ${curriculumSelection.primaryCurriculumCode} | Mode: ${curriculumSelection.curriculumMode}`
          : null,
        `Payment collection: ${args.paymentCollectionMode}`,
        networkId ? `Network ID: ${networkId}` : null,
        `Organization mode: ${organizationMode}`,
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
      organizationMode,
      networkId,
      campusDrafts,
      provisionedCampusTenantIds: [],
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
      await ensureTenantModuleInstall(ctx, {
        tenantId,
        moduleId,
        installedBy: platform.userId,
        now,
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
      identityId: networkId ? `${networkId}-${args.adminEmail.toLowerCase()}` : undefined,
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

    const provisionedCampusTenantIds = [tenantId];

    if (networkId) {
      const network = await ctx.db
        .query("tenant_networks")
        .withIndex("by_networkId", (q: any) => q.eq("networkId", networkId))
        .first();

      if (network) {
        await ctx.db.patch(network._id, {
          primaryTenantId: tenantId,
          updatedAt: now,
        });
      }

      await ctx.db.insert("network_campuses", {
        networkId,
        tenantId,
        campusName: primaryCampus.campusName,
        campusCode: primaryCampus.campusCode,
        isPrimary: true,
        lifecycleStatus: "active",
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      });

      for (const [index, campus] of additionalCampuses.entries()) {
        const campusTenantId = generateTenantId();
        const campusOrganizationId = await ctx.db.insert("organizations", {
          tenantId: campusTenantId,
          workosOrgId: `edumyles-${campusTenantId}`,
          name: campus.schoolName ?? campus.campusName,
          subdomain: campus.subdomain,
          tier: normalizedPlan,
          isActive: true,
          createdAt: now,
        });

        await ctx.db.insert("tenants", {
          tenantId: campusTenantId,
          networkId,
          name: campus.schoolName ?? campus.campusName,
          campusName: campus.campusName,
          campusCode: campus.campusCode,
          isPrimaryCampus: false,
          subdomain: campus.subdomain,
          email: args.adminEmail,
          phone: args.adminPhone ?? "",
          website: args.websiteUrl,
          logoUrl: args.logoUrl,
          plan: normalizedPlan,
          status: args.trialDays > 0 ? "trial" : "active",
          schoolType: campus.schoolType ?? args.schoolType,
          county: campus.county ?? args.county,
          country: campus.country ?? args.country,
          createdAt: now,
          updatedAt: now,
        });

        await ctx.db.insert("tenant_subscriptions", {
          tenantId: campusTenantId,
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
          customPricingNotes: `Organization mode: ${organizationMode} | Network ID: ${networkId}`,
          nextPaymentDue: currentPeriodEnd,
          trialEndsAt,
          cancelledAt: undefined,
          cancellationReason: undefined,
          createdAt: now,
          updatedAt: now,
        });

        await ctx.db.insert("tenant_onboarding", {
          tenantId: campusTenantId,
          wizardCompleted: false,
          wizardCompletedAt: undefined,
          currentStep: 1,
          isActivated: false,
          organizationMode,
          networkId,
          campusDrafts,
          provisionedCampusTenantIds: [],
          steps: buildDefaultOnboardingSteps(selectedModuleIds.length),
          healthScore: selectedModuleIds.length > 0 ? 8 : 5,
          lastActivityAt: now,
          stalled: false,
          assignedAccountManager: undefined,
          createdAt: now,
          updatedAt: now,
        });

        for (const moduleId of installedModuleIds) {
          await ensureTenantModuleInstall(ctx, {
            tenantId: campusTenantId,
            moduleId,
            installedBy: platform.userId,
            now,
          });
        }

        await ctx.db.insert("users", {
          tenantId: campusTenantId,
          eduMylesUserId: crypto.randomUUID(),
          workosUserId: `pending-${crypto.randomUUID()}`,
          identityId: `${networkId}-${args.adminEmail.toLowerCase()}`,
          email: args.adminEmail,
          firstName: args.adminFirstName,
          lastName: args.adminLastName,
          role: "school_admin",
          permissions: [],
          organizationId: campusOrganizationId,
          isActive: false,
          status: "pending_invite",
          phone: args.adminPhone,
          bio: args.adminJobTitle,
          createdAt: now,
        });

        await ctx.db.insert("network_campuses", {
          networkId,
          tenantId: campusTenantId,
          campusName: campus.campusName,
          campusCode: campus.campusCode,
          isPrimary: false,
          lifecycleStatus: "active",
          sortOrder: index + 1,
          createdAt: now,
          updatedAt: now,
        });

        provisionedCampusTenantIds.push(campusTenantId);
      }

      await ctx.db.insert("network_memberships", {
        networkId,
        identityId: `${networkId}-${args.adminEmail.toLowerCase()}`,
        role: "network_owner",
        accessibleTenantIds: provisionedCampusTenantIds,
        createdAt: now,
        updatedAt: now,
      });

      const onboardingRecord = await ctx.db
        .query("tenant_onboarding")
        .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenantId))
        .first();
      if (onboardingRecord) {
        await ctx.db.patch(onboardingRecord._id, {
          provisionedCampusTenantIds,
          updatedAt: now,
        });
      }
    }

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
        organizationMode,
        networkId,
        provisionedCampusTenantIds,
        subdomain: primaryCampus.subdomain,
        tenantUrl: buildTenantUrl(primaryCampus.subdomain),
      },
    });

    return {
      success: true,
      tenantId,
      tenantDocId,
      organizationId,
      pendingUserId,
      requiresOrgProvisioning: true,
      organizationMode,
      networkId,
      provisionedCampusTenantIds,
      subdomain: primaryCampus.subdomain,
      tenantUrl: buildTenantUrl(primaryCampus.subdomain),
    };
  },
});

export const createNetworkCampus = mutation({
  args: {
    sessionToken: v.string(),
    networkId: v.string(),
    campusName: v.string(),
    campusCode: v.optional(v.string()),
    schoolName: v.optional(v.string()),
    subdomain: v.optional(v.string()),
    schoolType: v.optional(v.string()),
    county: v.string(),
    country: v.string(),
  },
  handler: async (ctx, args) => {
    return await createNetworkCampusRecord(ctx, args);
  },
});

export const completeCampusProvisioningFromOnboarding = mutation({
  args: {
    sessionToken: v.string(),
    networkId: v.string(),
    campusName: v.string(),
    campusCode: v.optional(v.string()),
    schoolName: v.optional(v.string()),
    subdomain: v.optional(v.string()),
    schoolType: v.optional(v.string()),
    county: v.string(),
    country: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await createNetworkCampusRecord(ctx, args);
    return {
      ...result,
      completedFrom: "tenant_onboarding",
    };
  },
});

export const inviteNetworkAdmin = mutation({
  args: {
    sessionToken: v.string(),
    networkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.optional(v.union(
      v.literal("network_owner"),
      v.literal("network_admin"),
      v.literal("network_finance"),
      v.literal("network_academics"),
      v.literal("network_viewer")
    )),
  },
  handler: async (ctx, args) => {
    const { session, network, isPlatform } = await requireNetworkManagementAccess(ctx, args);

    const campuses = await ctx.db
      .query("network_campuses")
      .withIndex("by_networkId", (q: any) => q.eq("networkId", args.networkId))
      .collect();

    const identityId = `${args.networkId}-${args.email.toLowerCase()}`;
    const now = Date.now();
    const existingIdentity = await ctx.db
      .query("user_identities")
      .withIndex("by_identityId", (q: any) => q.eq("identityId", identityId))
      .first();

    if (existingIdentity) {
      await ctx.db.patch(existingIdentity._id, {
        firstName: args.firstName,
        lastName: args.lastName,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("user_identities", {
        identityId,
        email: args.email.toLowerCase(),
        workosUserId: undefined,
        firstName: args.firstName,
        lastName: args.lastName,
        phone: undefined,
        createdAt: now,
        updatedAt: now,
      });
    }

    const existingMembership = await ctx.db
      .query("network_memberships")
      .withIndex("by_network_identity", (q: any) =>
        q.eq("networkId", args.networkId).eq("identityId", identityId)
      )
      .first();

    if (existingMembership) {
      await ctx.db.patch(existingMembership._id, {
        role: args.role ?? existingMembership.role,
        accessibleTenantIds: campuses.map((campus: any) => campus.tenantId),
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("network_memberships", {
        networkId: args.networkId,
        identityId,
        role: args.role ?? "network_admin",
        accessibleTenantIds: campuses.map((campus: any) => campus.tenantId),
        createdAt: now,
        updatedAt: now,
      });
    }

    await logAction(ctx, {
      tenantId: isPlatform ? "PLATFORM" : (session.activeTenantId ?? session.tenantId),
      actorId: session.userId,
      actorEmail: session.email ?? "",
      action: "user.invited",
      entityType: "network_admin",
      entityId: args.email.toLowerCase(),
      after: {
        networkId: args.networkId,
        role: args.role ?? "network_admin",
      },
    });

    return {
      success: true,
      networkId: args.networkId,
      identityId,
      accessibleTenantIds: campuses.map((campus: any) => campus.tenantId),
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
      .query("module_installs")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
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

    const inviteUrl = buildTenantInviteUrl(inviteToken);
    const tenantUrl = buildTenantUrl(tenant.subdomain);
    await ctx.scheduler.runAfter(0, internal.actions.communications.email.sendEmailInternal, {
      tenantId: tenantCtx.tenantId,
      actorId: tenantCtx.userId,
      actorEmail: tenantCtx.email,
      to: [args.email],
      subject: `Your EduMyles admin invite for ${tenant.name}`,
      template: "tenant_invite",
      data: {
        firstName: args.firstName,
        schoolName: tenant.name,
        role: args.role,
        inviteUrl,
        tenantUrl,
        setupUrl: `${getAppUrl()}/admin/setup`,
        appUrl: getAppUrl(),
        expiryDate: formatEmailDate(expiresAt),
        personalMessage: args.personalMessage,
      },
    });

    return {
      success: true,
      email: args.email,
      role: args.role,
      tenantName: tenant.name,
      subdomain: tenant.subdomain,
      tenantUrl,
      inviteToken,
      inviteUrl,
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
