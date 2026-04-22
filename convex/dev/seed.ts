import { action, internalMutation, internalQuery, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { ALL_MODULES, CORE_MODULE_IDS } from "../modules/marketplace/moduleDefinitions";
import { generateTenantId } from "../helpers/idGenerator";
import { SYSTEM_ROLE_PERMISSIONS } from "../shared/permissions";

const MARKETPLACE_SEED_ACTOR = "seed-marketplace-bootstrap";

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
  const idsBySlug = new Map<string, string>();

  for (const moduleRecord of existingModules) {
    idsBySlug.set(moduleRecord.slug, String(moduleRecord._id));
  }

  for (const moduleDef of ALL_MODULES) {
    if (idsBySlug.has(moduleDef.moduleId)) continue;

    const moduleId = await ctx.db.insert("marketplace_modules", {
      slug: moduleDef.moduleId,
      name: moduleDef.name,
      description: moduleDef.description,
      shortDescription: moduleDef.description,
      category: moduleDef.category,
      status: "published",
      version: moduleDef.version,
      isCore: CORE_MODULE_IDS.includes(moduleDef.moduleId),
      pricingModel: "included",
      priceCents: 0,
      platformPriceKes: 0,
      featureHighlights: moduleDef.features.slice(0, 5),
      supportedRoles: [],
      createdAt: now,
      updatedAt: now,
    } as any);

    idsBySlug.set(moduleDef.moduleId, String(moduleId));
  }

  return idsBySlug;
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
  for (const moduleSlug of CORE_MODULE_IDS) {
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
      tenantId: args.tenantId,
      status: "active",
      installedAt: args.now,
      installedBy: args.installedBy,
      createdAt: args.now,
      updatedAt: args.now,
    } as any);
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
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const moduleIdsBySlug = await ensureMarketplaceCatalog(ctx, now);

    const existingTenant = await ctx.db
      .query("tenants")
      .withIndex("by_subdomain", (q) => q.eq("subdomain", args.subdomain))
      .first();

    if (existingTenant) {
      await ensureCoreMarketplaceInstallsForTenant(ctx, {
        tenantId: existingTenant.tenantId,
        installedBy: MARKETPLACE_SEED_ACTOR,
        now,
        moduleIdsBySlug,
      });

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
      plan: "starter",
      status: "active",
      county: "Nairobi",
      country: "KE",
      createdAt: now,
      updatedAt: now,
    });

    const organizationId = await ctx.db.insert("organizations", {
      tenantId,
      workosOrgId: `seed-org-${args.subdomain}`,
      name: args.tenantName,
      subdomain: args.subdomain,
      tier: "starter",
      isActive: true,
      createdAt: now,
    });

    for (const moduleId of [...CORE_MODULE_IDS, "finance", "hr", "academics", "timetable"]) {
      const existingModule = await ctx.db
        .query("installedModules")
        .withIndex("by_tenant_module", (q) => q.eq("tenantId", tenantId).eq("moduleId", moduleId))
        .first();

      if (!existingModule) {
        await ctx.db.insert("installedModules", {
          tenantId,
          moduleId,
          installedAt: now,
          installedBy: adminUserId,
          config: {},
          status: "active",
          updatedAt: now,
        });
      }
    }

    const allTenants = await ctx.db.query("tenants").collect();
    for (const tenant of allTenants) {
      await ensureCoreMarketplaceInstallsForTenant(ctx, {
        tenantId: tenant.tenantId,
        installedBy: adminUserId,
        now,
        moduleIdsBySlug,
      });
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
    };
  },
});

export const seedDevData = action({
  args: {
    webhookSecret: v.string(),
    tenantName: v.string(),
    subdomain: v.string(),
    adminEmail: v.string(),
  },
  handler: async (ctx, args) => {
    requireWebhookSecret(args.webhookSecret);
    return await ctx.runMutation((ctx as any).internal.dev.seed.seedDevDataInternal, {
      tenantName: args.tenantName,
      subdomain: args.subdomain,
      adminEmail: args.adminEmail,
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
