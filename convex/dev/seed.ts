import { action, internalMutation, internalQuery, mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import {
  ALL_MODULES,
  CORE_MODULE_IDS,
  type ModuleDefinition,
} from "../modules/marketplace/moduleDefinitions";
import { normalizeModuleSlug } from "../modules/marketplace/moduleAliases";
import { generateTenantId } from "../helpers/idGenerator";
import { SYSTEM_ROLE_PERMISSIONS } from "../shared/permissions";

const MARKETPLACE_SEED_ACTOR = "seed-marketplace-bootstrap";
const FULL_DEMO_MODE = "full_demo";
const DEFAULT_DEMO_TERM_DAYS = 90;

const PLATFORM_ROLE_METADATA: Record<
  string,
  { name: string; description: string; color: string; icon: string }
> = {
  master_admin: {
    name: "Master Admin",
    description: "Full unrestricted platform control.",
    color: "#dc2626",
    icon: "Crown",
  },
  super_admin: {
    name: "Super Admin",
    description: "Platform-wide administrative access.",
    color: "#7c3aed",
    icon: "Shield",
  },
  platform_manager: {
    name: "Platform Manager",
    description: "Runs daily operations across tenants, CRM, and PM.",
    color: "#0070F3",
    icon: "Briefcase",
  },
  support_agent: {
    name: "Support Agent",
    description: "Handles support, onboarding, and operational requests.",
    color: "#059669",
    icon: "Headphones",
  },
  billing_admin: {
    name: "Billing Admin",
    description: "Manages commercial, subscription, and finance operations.",
    color: "#d97706",
    icon: "CreditCard",
  },
  marketplace_reviewer: {
    name: "Marketplace Reviewer",
    description: "Reviews marketplace modules, publishers, and content.",
    color: "#ec4899",
    icon: "ShoppingBag",
  },
  content_moderator: {
    name: "Content Moderator",
    description: "Moderates communications, knowledge base, and published content.",
    color: "#6366f1",
    icon: "FileSearch",
  },
  analytics_viewer: {
    name: "Analytics Viewer",
    description: "Read-only visibility into analytics and selected PM data.",
    color: "#06b6d4",
    icon: "BarChart2",
  },
};

const CRM_PIPELINE_STAGE_SEEDS = [
  { name: "New", slug: "new", order: 1, color: "#94a3b8", icon: "Sparkles", probabilityDefault: 5, requiresNote: false, autoFollowUpDays: 1, isWon: false, isLost: false },
  { name: "Contacted", slug: "contacted", order: 2, color: "#3b82f6", icon: "PhoneCall", probabilityDefault: 15, requiresNote: false, autoFollowUpDays: 3, isWon: false, isLost: false },
  { name: "Qualified", slug: "qualified", order: 3, color: "#06b6d4", icon: "BadgeCheck", probabilityDefault: 35, requiresNote: false, autoFollowUpDays: 3, isWon: false, isLost: false },
  { name: "Demo Booked", slug: "demo_booked", order: 4, color: "#8b5cf6", icon: "CalendarDays", probabilityDefault: 45, requiresNote: true, autoFollowUpDays: 2, isWon: false, isLost: false },
  { name: "Demo Done", slug: "demo_done", order: 5, color: "#a855f7", icon: "MonitorPlay", probabilityDefault: 55, requiresNote: true, autoFollowUpDays: 2, isWon: false, isLost: false },
  { name: "Proposal Sent", slug: "proposal_sent", order: 6, color: "#f59e0b", icon: "FileText", probabilityDefault: 70, requiresNote: false, autoFollowUpDays: 4, isWon: false, isLost: false },
  { name: "Negotiation", slug: "negotiation", order: 7, color: "#f97316", icon: "Handshake", probabilityDefault: 80, requiresNote: true, autoFollowUpDays: 2, isWon: false, isLost: false },
  { name: "Won", slug: "won", order: 8, color: "#10b981", icon: "Trophy", probabilityDefault: 100, requiresNote: false, autoFollowUpDays: undefined, isWon: true, isLost: false },
  { name: "Lost", slug: "lost", order: 9, color: "#ef4444", icon: "CircleOff", probabilityDefault: 0, requiresNote: true, autoFollowUpDays: undefined, isWon: false, isLost: true },
];

async function ensureMarketplaceCatalog(ctx: any, now: number) {
  const existingModules = await ctx.db.query("marketplace_modules").collect();
  const modulesBySlug = new Map<string, any>();
  const idsBySlug = new Map<string, string>();

  for (const moduleRecord of existingModules) {
    modulesBySlug.set(moduleRecord.slug, moduleRecord);
    idsBySlug.set(moduleRecord.slug, String(moduleRecord._id));
  }

  for (const moduleDef of ALL_MODULES) {
    const moduleSlug = normalizeModuleSlug(moduleDef.moduleId);
    const existing = modulesBySlug.get(moduleSlug) as any;
    const payload = {
      slug: moduleSlug,
      name: moduleDef.name,
      tagline: existing?.tagline ?? moduleDef.description,
      description: moduleDef.description,
      category: moduleDef.category,
      status: "published" as const,
      isFeatured: existing?.isFeatured ?? moduleDef.isCore,
      isCore: moduleDef.isCore,
      minimumPlan: existing?.minimumPlan ?? mapModuleTierToMarketplacePlan(moduleDef),
      dependencies: moduleDef.dependencies.map(normalizeModuleSlug),
      supportedRoles: existing?.supportedRoles ?? [],
      version: moduleDef.version,
      iconUrl: existing?.iconUrl,
      screenshots: existing?.screenshots ?? [],
      documentationUrl: existing?.documentationUrl ?? moduleDef.documentation,
      changelogUrl: existing?.changelogUrl,
      publishedAt: existing?.publishedAt ?? now,
      averageRating: existing?.averageRating ?? 0,
      reviewCount: existing?.reviewCount ?? 0,
      installCount: existing?.installCount ?? 0,
      activeInstallCount: existing?.activeInstallCount ?? 0,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      continue;
    }

    const moduleId = await ctx.db.insert("marketplace_modules", {
      ...payload,
      createdAt: now,
    });

    idsBySlug.set(moduleSlug, String(moduleId));
  }

  return idsBySlug;
}

function mapModuleTierToMarketplacePlan(moduleDef: ModuleDefinition) {
  if (moduleDef.isCore) return "free" as const;
  if (moduleDef.tier === "pro") return "pro" as const;
  if (moduleDef.tier === "enterprise") return "enterprise" as const;
  return "starter" as const;
}

async function ensurePublishedModulesCatalog(ctx: any, now: number) {
  const existingModules = await ctx.db.query("modules").collect();
  const modulesBySlug = new Map<string, any>(
    existingModules.map((module: any) => [module.slug, module])
  );

  for (const moduleDef of ALL_MODULES) {
    const existing = modulesBySlug.get(moduleDef.moduleId) as any;
    const payload = {
      publisherId: existing?.publisherId ?? "system",
      name: moduleDef.name,
      slug: moduleDef.moduleId,
      tagline: existing?.tagline ?? moduleDef.description,
      category: moduleDef.category,
      description: moduleDef.description,
      featureList: moduleDef.features,
      supportedRoles: existing?.supportedRoles ?? [],
      minimumPlan: mapModuleTierToMarketplacePlan(moduleDef),
      pricingModel: existing?.pricingModel ?? (moduleDef.isCore ? "included" : "pilot"),
      suggestedPriceKes: existing?.suggestedPriceKes,
      platformPriceKes: existing?.platformPriceKes ?? 0,
      compatibleModuleIds: existing?.compatibleModuleIds ?? moduleDef.dependencies,
      incompatibleModuleIds: existing?.incompatibleModuleIds ?? [],
      status: "published" as const,
      isFeatured: existing?.isFeatured ?? moduleDef.isCore,
      documentationUrl: existing?.documentationUrl ?? moduleDef.documentation,
      supportEmail: existing?.supportEmail ?? moduleDef.support.email,
      termsUrl: existing?.termsUrl,
      privacyUrl: existing?.privacyUrl,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      continue;
    }

    await ctx.db.insert("modules", {
      ...payload,
      createdAt: now,
    });
  }
}

async function ensureCoreMarketplaceInstallsForTenant(
  ctx: any,
  args: {
    tenantId: string;
    installedBy: string;
    now: number;
    moduleIdsBySlug: Map<string, string>;
  }
) {
  for (const moduleSlug of CORE_MODULE_IDS.map(normalizeModuleSlug)) {
    const moduleId = args.moduleIdsBySlug.get(moduleSlug) ?? moduleSlug;
    const existingInstall = await ctx.db
      .query("module_installs")
      .withIndex("by_tenantId", (q: any) => q.eq("tenantId", args.tenantId))
      .collect()
      .then((rows: any[]) =>
        rows.find((row: any) => String(row.moduleId) === String(moduleId))
      );

    if (existingInstall) continue;

    await ctx.db.insert("module_installs", {
      moduleId,
      moduleSlug,
      tenantId: args.tenantId,
      status: "active",
      billingPeriod: "monthly",
      currentPriceKes: 0,
      hasPriceOverride: false,
      isFree: true,
      firstInstalledAt: args.now,
      billingStartsAt: args.now,
      nextBillingDate: args.now,
      installedAt: args.now,
      installedBy: args.installedBy,
      version: "1.0.0",
      paymentFailureCount: 0,
      createdAt: args.now,
      updatedAt: args.now,
    } as any);
  }
}

async function ensureAllMarketplaceModulesForTenant(
  ctx: any,
  args: {
    tenantId: string;
    installedBy: string;
    now: number;
    moduleIdsBySlug: Map<string, string>;
  }
) {
  for (const moduleDef of ALL_MODULES) {
    const moduleSlug = normalizeModuleSlug(moduleDef.moduleId);
    const moduleId = args.moduleIdsBySlug.get(moduleSlug) ?? moduleSlug;
    const existingInstall = await ctx.db
      .query("module_installs")
      .withIndex("by_tenantId_moduleSlug", (q: any) =>
        q.eq("tenantId", args.tenantId).eq("moduleSlug", moduleSlug)
      )
      .first();

    if (existingInstall) {
      await ctx.db.patch(existingInstall._id, {
        status: "active",
        updatedAt: args.now,
      });
      continue;
    }

    await ctx.db.insert("module_installs", {
      tenantId: args.tenantId,
      moduleId,
      moduleSlug,
      status: "active",
      billingPeriod: "monthly",
      currentPriceKes: 0,
      hasPriceOverride: false,
      isFree: moduleDef.isCore,
      firstInstalledAt: args.now,
      billingStartsAt: args.now,
      nextBillingDate: args.now,
      installedAt: args.now,
      installedBy: args.installedBy,
      version: moduleDef.version,
      paymentFailureCount: 0,
      createdAt: args.now,
      updatedAt: args.now,
    });
  }
}

async function ensureTenantSubscriptionState(
  ctx: any,
  args: {
    tenantId: string;
    tenantName: string;
    adminEmail: string;
    now: number;
    pilotEndsAt: number;
  }
) {
  const tenant = await ctx.db
    .query("tenants")
    .withIndex("by_tenantId", (q: any) => q.eq("tenantId", args.tenantId))
    .first();

  if (tenant) {
    await ctx.db.patch(tenant._id, {
      name: args.tenantName,
      email: args.adminEmail,
      plan: "enterprise",
      status: "trial",
      trialStartedAt: args.now,
      trialEndsAt: args.pilotEndsAt,
      updatedAt: args.now,
    });
  }

  const organization = await ctx.db
    .query("organizations")
    .withIndex("by_tenant", (q: any) => q.eq("tenantId", args.tenantId))
    .first();

  if (organization) {
    await ctx.db.patch(organization._id, {
      name: args.tenantName,
      tier: "enterprise",
      isActive: true,
    });
  }

  const existingSubscription = await ctx.db
    .query("tenant_subscriptions")
    .withIndex("by_tenantId", (q: any) => q.eq("tenantId", args.tenantId))
    .first();

  const subscriptionPatch = {
    planId: "enterprise",
    status: "trialing" as const,
    currentPeriodStart: args.now,
    currentPeriodEnd: args.pilotEndsAt,
    cancelAtPeriodEnd: false,
    customPriceMonthlyKes: 0,
    customPriceAnnualKes: 0,
    customPricingNotes:
      "Full Demo School pilot | Billing cycle: termly | Demo access: all modules | Pricing: pilot access free for one term",
    nextPaymentDue: args.pilotEndsAt,
    trialEndsAt: args.pilotEndsAt,
    cancelledAt: undefined,
    cancellationReason: undefined,
    updatedAt: args.now,
  };

  if (existingSubscription) {
    await ctx.db.patch(existingSubscription._id, subscriptionPatch);
  } else {
    await ctx.db.insert("tenant_subscriptions", {
      tenantId: args.tenantId,
      studentCountAtBilling: 3,
      paymentProvider: undefined,
      paymentReference: undefined,
      createdAt: args.now,
      ...subscriptionPatch,
    });
  }
}

async function ensureDemoAdminAccess(
  ctx: any,
  args: {
    tenantId: string;
    subdomain: string;
    adminEmail: string;
    now: number;
  }
) {
  const organization = await ctx.db
    .query("organizations")
    .withIndex("by_tenant", (q: any) => q.eq("tenantId", args.tenantId))
    .first();

  const eduMylesUserId = `seed-admin-${args.subdomain}`;
  const workosUserId = `pending-seed-admin-${args.subdomain}`;
  const sessionToken = `seed-admin-${args.subdomain}`;

  const existingUser = await ctx.db
    .query("users")
    .withIndex("by_tenant_email", (q: any) =>
      q.eq("tenantId", args.tenantId).eq("email", args.adminEmail)
    )
    .first();

  if (existingUser) {
    await ctx.db.patch(existingUser._id, {
      eduMylesUserId: existingUser.eduMylesUserId ?? eduMylesUserId,
      workosUserId: existingUser.workosUserId ?? workosUserId,
      firstName: existingUser.firstName ?? "Demo",
      lastName: existingUser.lastName ?? "Admin",
      role: "school_admin",
      permissions: existingUser.permissions?.length ? existingUser.permissions : ["*"],
      organizationId: existingUser.organizationId ?? organization?._id,
      isActive: true,
      status: "active",
      createdAt: existingUser.createdAt ?? args.now,
    });
  } else {
    await ctx.db.insert("users", {
      tenantId: args.tenantId,
      eduMylesUserId,
      workosUserId,
      email: args.adminEmail,
      firstName: "Demo",
      lastName: "Admin",
      role: "school_admin",
      permissions: ["*"],
      organizationId: organization?._id,
      isActive: true,
      status: "active",
      createdAt: args.now,
    });
  }

  const existingSession = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("sessionToken", sessionToken))
    .first();

  if (existingSession) {
    await ctx.db.patch(existingSession._id, {
      tenantId: args.tenantId,
      userId: existingUser?.eduMylesUserId ?? eduMylesUserId,
      email: args.adminEmail,
      role: "school_admin",
      expiresAt: args.now + 365 * 24 * 60 * 60 * 1000,
      isActive: true,
    });
  } else {
    await ctx.db.insert("sessions", {
      sessionToken,
      tenantId: args.tenantId,
      userId: existingUser?.eduMylesUserId ?? eduMylesUserId,
      email: args.adminEmail,
      role: "school_admin",
      expiresAt: args.now + 365 * 24 * 60 * 60 * 1000,
      createdAt: args.now,
      isActive: true,
    });
  }

  return {
    eduMylesUserId: existingUser?.eduMylesUserId ?? eduMylesUserId,
    sessionToken,
  };
}

async function ensureFullDemoAccessForTenant(
  ctx: any,
  args: {
    tenantId: string;
    tenantName: string;
    adminEmail: string;
    subdomain: string;
    installedBy: string;
    now: number;
    pilotDays: number;
    moduleIdsBySlug: Map<string, string>;
  }
) {
  const pilotEndsAt = args.now + args.pilotDays * 24 * 60 * 60 * 1000;
  const expectedPilotGrantModuleIds = new Set(
    ALL_MODULES.filter((moduleDef) => !moduleDef.isCore)
      .map((moduleDef) => args.moduleIdsBySlug.get(normalizeModuleSlug(moduleDef.moduleId)))
      .filter(Boolean)
      .map(String)
  );

  await ensureTenantSubscriptionState(ctx, {
    tenantId: args.tenantId,
    tenantName: args.tenantName,
    adminEmail: args.adminEmail,
    now: args.now,
    pilotEndsAt,
  });

  await ensureDemoAdminAccess(ctx, {
    tenantId: args.tenantId,
    subdomain: args.subdomain,
    adminEmail: args.adminEmail,
    now: args.now,
  });

  await ensureAllMarketplaceModulesForTenant(ctx, {
    tenantId: args.tenantId,
    installedBy: args.installedBy,
    now: args.now,
    moduleIdsBySlug: args.moduleIdsBySlug,
  });

  for (const moduleDef of ALL_MODULES) {
    const moduleSlug = normalizeModuleSlug(moduleDef.moduleId);
    const marketplaceModuleId = args.moduleIdsBySlug.get(moduleSlug);
    const existingInstall = await ctx.db
      .query("module_installs")
      .withIndex("by_tenantId_moduleSlug", (q: any) =>
        q.eq("tenantId", args.tenantId).eq("moduleSlug", moduleSlug)
      )
      .unique();

    let pilotGrantId = existingInstall?.pilotGrantId;
    if (!moduleDef.isCore && marketplaceModuleId) {
      const existingGrants = await ctx.db
        .query("pilot_grants")
        .withIndex("by_moduleId_tenantId", (q: any) =>
          q.eq("moduleId", marketplaceModuleId).eq("tenantId", args.tenantId)
        )
        .collect();

      const activeGrant =
        existingGrants.find((grant: any) =>
          ["active", "extended"].includes(grant.status)
        ) ?? existingGrants[0];

      if (activeGrant) {
        await ctx.db.patch(activeGrant._id, {
          grantType: "free_trial",
          startDate: args.now,
          endDate: pilotEndsAt,
          grantedBy: args.installedBy,
          reason: "Demo School full-platform pilot access for one term",
          stealthMode: false,
          status: "active",
          convertedToPaid: false,
          updatedAt: args.now,
        });
        pilotGrantId = activeGrant._id;
      } else {
        pilotGrantId = await ctx.db.insert("pilot_grants", {
          moduleId: marketplaceModuleId,
          tenantId: args.tenantId,
          grantType: "free_trial",
          discountPct: undefined,
          customPriceKes: 0,
          startDate: args.now,
          endDate: pilotEndsAt,
          grantedBy: args.installedBy,
          reason: "Demo School full-platform pilot access for one term",
          stealthMode: false,
          status: "active",
          convertedToPaid: false,
          notificationsSent: [],
          createdAt: args.now,
          updatedAt: args.now,
        });
      }
    }

    const installPatch: Record<string, unknown> = {
      moduleId: marketplaceModuleId ?? moduleDef.moduleId,
      moduleSlug,
      tenantId: args.tenantId,
      status: "active",
      billingPeriod: "termly",
      currentPriceKes: 0,
      hasPriceOverride: false,
      isFree: true,
      trialEndsAt: !moduleDef.isCore ? pilotEndsAt : undefined,
      billingStartsAt: undefined,
      nextBillingDate: !moduleDef.isCore ? pilotEndsAt : undefined,
      installedAt: existingInstall?.installedAt ?? args.now,
      installedBy: existingInstall?.installedBy ?? args.installedBy,
      version: moduleDef.version,
      paymentFailureCount: 0,
      updatedAt: args.now,
      pilotGrantId: pilotGrantId,
      provisionedByPilotGrantId: pilotGrantId,
    };

    if (existingInstall) {
      await ctx.db.patch(existingInstall._id, installPatch);
      continue;
    }

    await ctx.db.insert("module_installs", {
      ...installPatch,
      firstInstalledAt: args.now,
      createdAt: args.now,
    });
  }

  const tenantPilotGrants = await ctx.db
    .query("pilot_grants")
    .withIndex("by_tenantId", (q: any) => q.eq("tenantId", args.tenantId))
    .collect();

  for (const grant of tenantPilotGrants) {
    if (!["active", "extended"].includes(grant.status)) {
      continue;
    }

    if (expectedPilotGrantModuleIds.has(String(grant.moduleId))) {
      continue;
    }

    await ctx.db.patch(grant._id, {
      status: "revoked",
      updatedAt: args.now,
    });
  }
}

function requireWebhookSecret(provided: string) {
  const expected = process.env.CONVEX_WEBHOOK_SECRET;
  if (!expected || provided !== expected) {
    throw new Error("Unauthorized: invalid webhook secret");
  }
}

export const seedDevDataInternal = internalMutation({
  args: {
    tenantName: v.string(),
    subdomain: v.string(),
    adminEmail: v.string(),
    mode: v.optional(v.string()),
    pilotDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const moduleIdsBySlug = await ensureMarketplaceCatalog(ctx, now);
    await ensurePublishedModulesCatalog(ctx, now);
    const fullDemoMode = args.mode === FULL_DEMO_MODE;
    const pilotDays = args.pilotDays ?? DEFAULT_DEMO_TERM_DAYS;

    const existingTenant = await ctx.db
      .query("tenants")
      .withIndex("by_subdomain", (q) => q.eq("subdomain", args.subdomain))
      .first();

    if (existingTenant) {
      if (fullDemoMode) {
        await ensureFullDemoAccessForTenant(ctx, {
          tenantId: existingTenant.tenantId,
          tenantName: args.tenantName,
          adminEmail: args.adminEmail,
          subdomain: args.subdomain,
          installedBy: MARKETPLACE_SEED_ACTOR,
          now,
          pilotDays,
          moduleIdsBySlug,
        });
      } else {
        await ensureCoreMarketplaceInstallsForTenant(ctx, {
          tenantId: existingTenant.tenantId,
          installedBy: MARKETPLACE_SEED_ACTOR,
          now,
          moduleIdsBySlug,
        });
      }

      const allTenants = await ctx.db.query("tenants").collect();
      for (const tenant of allTenants) {
        await ensureCoreMarketplaceInstallsForTenant(ctx, {
          tenantId: tenant.tenantId,
          installedBy: MARKETPLACE_SEED_ACTOR,
          now,
          moduleIdsBySlug,
        });
      }

      const existingSession = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("sessionToken", `seed-admin-${args.subdomain}`))
        .first();

      return {
        tenantId: existingTenant.tenantId,
        tenantRecordId: existingTenant._id,
        adminSessionToken: existingSession?.sessionToken ?? "",
        adminRole: existingSession?.role ?? "school_admin",
        created: false,
        mode: fullDemoMode ? FULL_DEMO_MODE : "standard",
        pilotDays: fullDemoMode ? pilotDays : undefined,
      };
    }

    const tenantId = generateTenantId();
    const adminUserId = `seed-admin-${args.subdomain}`;
    const adminSessionToken = `seed-admin-${args.subdomain}`;
    const teacherUserId = `seed-teacher-${args.subdomain}`;
    const bursarUserId = `seed-bursar-${args.subdomain}`;

    const tenantRecordId = await ctx.db.insert("tenants", {
      tenantId,
      name: args.tenantName,
      subdomain: args.subdomain,
      email: args.adminEmail,
      phone: "+254700000000",
      plan: fullDemoMode ? "enterprise" : "starter",
      status: fullDemoMode ? "trial" : "active",
      county: "Nairobi",
      country: "KE",
      trialStartedAt: fullDemoMode ? now : undefined,
      trialEndsAt: fullDemoMode ? now + pilotDays * 24 * 60 * 60 * 1000 : undefined,
      createdAt: now,
      updatedAt: now,
    });

    const organizationId = await ctx.db.insert("organizations", {
      tenantId,
      workosOrgId: `seed-org-${args.subdomain}`,
      name: args.tenantName,
      subdomain: args.subdomain,
      tier: fullDemoMode ? "enterprise" : "starter",
      isActive: true,
      createdAt: now,
    });

    const allTenants = await ctx.db.query("tenants").collect();
    for (const tenant of allTenants) {
      await ensureCoreMarketplaceInstallsForTenant(ctx, {
        tenantId: tenant.tenantId,
        installedBy: adminUserId,
        now,
        moduleIdsBySlug,
      });
    }

    for (const moduleId of [...CORE_MODULE_IDS, "finance", "hr", "academics", "timetable"]) {
      const moduleSlug = normalizeModuleSlug(moduleId);
      const marketplaceModuleId = moduleIdsBySlug.get(moduleSlug) ?? moduleSlug;
      const existingModule = await ctx.db
        .query("module_installs")
        .withIndex("by_tenantId_moduleSlug", (q) => q.eq("tenantId", tenantId).eq("moduleSlug", moduleSlug))
        .first();

      if (!existingModule) {
        await ctx.db.insert("module_installs", {
          tenantId,
          moduleId: marketplaceModuleId,
          moduleSlug,
          status: "active",
          billingPeriod: "monthly",
          currentPriceKes: 0,
          hasPriceOverride: false,
          isFree: moduleSlug.startsWith("core_"),
          firstInstalledAt: now,
          billingStartsAt: now,
          nextBillingDate: now,
          installedAt: now,
          installedBy: adminUserId,
          version: "1.0.0",
          paymentFailureCount: 0,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    await ctx.db.insert("users", {
      tenantId,
      eduMylesUserId: adminUserId,
      workosUserId: `pending-${adminUserId}`,
      email: args.adminEmail,
      firstName: "Seed",
      lastName: "Admin",
      role: "school_admin",
      permissions: [],
      organizationId,
      isActive: true,
      createdAt: now,
    });

    await ctx.db.insert("sessions", {
      sessionToken: adminSessionToken,
      tenantId,
      userId: adminUserId,
      email: args.adminEmail,
      role: "school_admin",
      expiresAt: now + 1000 * 60 * 60 * 24 * 30,
      createdAt: now,
    });

    const teacherStaffId = await ctx.db.insert("staff", {
      tenantId,
      employeeId: `EMP-${args.subdomain.toUpperCase()}-001`,
      firstName: "Seed",
      lastName: "Teacher",
      email: `teacher+${args.subdomain}@example.com`,
      role: "teacher",
      department: "Academics",
      phone: "+254711111111",
      qualification: "B.Ed",
      joinDate: "2026-01-01",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    const bursarStaffId = await ctx.db.insert("staff", {
      tenantId,
      employeeId: `EMP-${args.subdomain.toUpperCase()}-002`,
      firstName: "Seed",
      lastName: "Bursar",
      email: `bursar+${args.subdomain}@example.com`,
      role: "bursar",
      department: "Finance",
      phone: "+254722222222",
      qualification: "CPA",
      joinDate: "2026-01-01",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    const classId = await ctx.db.insert("classes", {
      tenantId,
      name: "Grade 7 East",
      level: "Grade 7",
      stream: "East",
      teacherId: teacherUserId,
      capacity: 40,
      academicYear: "2026",
      createdAt: now,
    });

    const studentIds: string[] = [];
    const invoiceIds: string[] = [];
    for (let index = 1; index <= 3; index += 1) {
      const studentId = await ctx.db.insert("students", {
        tenantId,
        admissionNumber: `ADM-${args.subdomain.toUpperCase()}-00${index}`,
        firstName: `Student${index}`,
        lastName: "Seed",
        dateOfBirth: "2012-01-15",
        gender: index % 2 === 0 ? "female" : "male",
        classId: classId.toString(),
        status: "active",
        guardianUserId: undefined,
        photoUrl: undefined,
        enrolledAt: now,
        createdAt: now,
        updatedAt: now,
      });
      studentIds.push(studentId.toString());

      const invoiceId = await ctx.db.insert("invoices", {
        tenantId,
        studentId: studentId.toString(),
        feeStructureId: "",
        amount: 45000,
        status: index === 1 ? "paid" : "pending",
        dueDate: "2026-05-15",
        issuedAt: "2026-04-01",
        createdAt: now,
        updatedAt: now,
      });
      invoiceIds.push(invoiceId.toString());

      if (index === 1) {
        await ctx.db.insert("payments", {
          tenantId,
          invoiceId,
          amount: 45000,
          method: "mpesa",
          reference: `SEED-PAY-${args.subdomain.toUpperCase()}-001`,
          status: "completed",
          processedAt: now,
        });
      }
    }

    const feeStructureId = await ctx.db.insert("feeStructures", {
      tenantId,
      name: "Tuition 2026",
      amount: 45000,
      academicYear: "2026",
      grade: "Grade 7",
      frequency: "termly",
      createdAt: now,
      updatedAt: now,
    });

    const existingSubscription = await ctx.db
      .query("tenant_subscriptions")
      .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenantId))
      .first();

    if (!existingSubscription) {
      const periodEnd =
        fullDemoMode ? now + pilotDays * 24 * 60 * 60 * 1000 : now + 30 * 24 * 60 * 60 * 1000;
      await ctx.db.insert("tenant_subscriptions", {
        tenantId,
        planId: fullDemoMode ? "enterprise" : "starter",
        status: fullDemoMode ? "trialing" : "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        studentCountAtBilling: studentIds.length,
        paymentProvider: undefined,
        paymentReference: undefined,
        customPriceMonthlyKes: 0,
        customPriceAnnualKes: 0,
        customPricingNotes: fullDemoMode
          ? "Full Demo School pilot | Billing cycle: termly | Demo access: all modules | Pricing: pilot access free for one term"
          : "Seed school subscription",
        nextPaymentDue: periodEnd,
        trialEndsAt: fullDemoMode ? periodEnd : undefined,
        cancelledAt: undefined,
        cancellationReason: undefined,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (fullDemoMode) {
      await ensureFullDemoAccessForTenant(ctx, {
        tenantId,
        tenantName: args.tenantName,
        adminEmail: args.adminEmail,
        subdomain: args.subdomain,
        installedBy: adminUserId,
        now,
        pilotDays,
        moduleIdsBySlug,
      });
    }

    return {
      tenantId,
      tenantRecordId,
      organizationId,
      adminSessionToken,
      adminRole: "school_admin",
      staffIds: [teacherStaffId, bursarStaffId],
      classId,
      studentIds,
      feeStructureId,
      invoiceIds,
      created: true,
      mode: fullDemoMode ? FULL_DEMO_MODE : "standard",
      pilotDays: fullDemoMode ? pilotDays : undefined,
    };
  },
});

export const seedDevData: any = action({
  args: {
    webhookSecret: v.string(),
    tenantName: v.string(),
    subdomain: v.string(),
    adminEmail: v.string(),
    mode: v.optional(v.string()),
    pilotDays: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any> => {
    requireWebhookSecret(args.webhookSecret);
    return await ctx.runMutation(internal.dev.seed.seedDevDataInternal, {
      tenantName: args.tenantName,
      subdomain: args.subdomain,
      adminEmail: args.adminEmail,
      mode: args.mode,
      pilotDays: args.pilotDays,
    });
  },
});

export const seedPlatformRbacInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let rolesCreated = 0;

    for (const [slug, permissions] of Object.entries(SYSTEM_ROLE_PERMISSIONS)) {
      const seed = PLATFORM_ROLE_METADATA[slug];
      if (!seed) continue;

      const existing = await ctx.db
        .query("platform_roles")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          name: seed.name,
          slug,
          description: seed.description,
          isSystem: true,
          isActive: true,
          color: seed.color,
          icon: seed.icon,
          permissions,
          userCount: existing.userCount ?? 0,
          updatedAt: now,
        });
        continue;
      }

      await ctx.db.insert("platform_roles", {
        name: seed.name,
        slug,
        description: seed.description,
        baseRole: undefined,
        isSystem: true,
        isActive: true,
        color: seed.color,
        icon: seed.icon,
        permissions,
        userCount: 0,
        createdBy: "system",
        createdAt: now,
        updatedAt: now,
      });
      rolesCreated += 1;
    }

    let pipelineStagesSeeded = 0;
    for (const stage of CRM_PIPELINE_STAGE_SEEDS) {
      const existing = await ctx.db
        .query("crm_pipeline_stages")
        .withIndex("by_slug", (q: any) => q.eq("slug", stage.slug))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          name: stage.name,
          order: stage.order,
          color: stage.color,
          icon: stage.icon,
          requiresNote: stage.requiresNote,
          autoFollowUpDays: stage.autoFollowUpDays,
          isWon: stage.isWon,
          isLost: stage.isLost,
          probabilityDefault: stage.probabilityDefault,
          isActive: true,
          updatedAt: now,
        });
        continue;
      }

      await ctx.db.insert("crm_pipeline_stages", {
        ...stage,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      } as any);
      pipelineStagesSeeded += 1;
    }

    const defaultWorkspace = await ctx.db
      .query("pmWorkspaces")
      .withIndex("by_slug", (q: any) => q.eq("slug", "edumyles-platform"))
      .first();

    let defaultWorkspaceCreated = false;
    if (!defaultWorkspace) {
      await ctx.db.insert("pmWorkspaces", {
        name: "EduMyles Platform",
        slug: "edumyles-platform",
        description: "Default cross-functional workspace for EduMyles platform delivery.",
        type: "engineering",
        icon: "🏢",
        color: "#0070F3",
        isPrivate: false,
        isArchived: false,
        memberIds: [],
        customFieldSchema: [],
        defaultStatuses: ["Backlog", "Todo", "In Progress", "In Review", "Done"],
        createdBy: "system",
        createdAt: now,
        updatedAt: now,
      } as any);
      defaultWorkspaceCreated = true;
    }

    const masterAdminEmail = process.env.MASTER_ADMIN_EMAIL?.trim().toLowerCase();
    if (!masterAdminEmail) {
      return {
        rolesCreated,
        pipelineStagesSeeded,
        defaultWorkspaceCreated,
        platformUserSeeded: false,
      };
    }

    const masterAdminProfile = await ctx.db
      .query("users")
      .withIndex("by_tenant_email", (q) => q.eq("tenantId", "PLATFORM").eq("email", masterAdminEmail))
      .first();

    if (!masterAdminProfile?.workosUserId) {
      return { rolesCreated, platformUserSeeded: false };
    }

    const existingPlatformUser = await ctx.db
      .query("platform_users")
      .withIndex("by_userId", (q) => q.eq("userId", masterAdminProfile.workosUserId))
      .unique();

    if (!existingPlatformUser) {
      await ctx.db.insert("platform_users", {
        userId: masterAdminProfile.workosUserId,
        workosUserId: masterAdminProfile.workosUserId,
        email: masterAdminProfile.email,
        firstName: masterAdminProfile.firstName,
        lastName: masterAdminProfile.lastName,
        role: "master_admin",
        department: "Platform",
        addedPermissions: [],
        removedPermissions: [],
        scopeCountries: [],
        scopeTenantIds: [],
        scopePlans: [],
        status: "active",
        accessExpiresAt: undefined,
        twoFactorEnabled: masterAdminProfile.twoFactorEnabled ?? false,
        sessionCount: 0,
        invitedBy: undefined,
        acceptedAt: now,
        lastLogin: undefined,
        lastActivityAt: undefined,
        notes: "Seeded from MASTER_ADMIN_EMAIL",
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      rolesCreated,
      pipelineStagesSeeded,
      defaultWorkspaceCreated,
      platformUserSeeded: true,
    };
  },
});
