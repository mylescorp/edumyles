import { action, internalMutation, internalQuery, query } from "../_generated/server";
import { v } from "convex/values";
import { CORE_MODULE_IDS } from "../modules/marketplace/moduleDefinitions";
import { generateTenantId } from "../helpers/idGenerator";
import { SYSTEM_ROLE_SEEDS } from "../modules/platform/rbac";

const MARKETPLACE_SEED_ACTOR = "system_seed";
const MARKETPLACE_VERSION = "1.0.0";
const MARKETPLACE_BILLING_PERIOD = "monthly";

const MARKETPLACE_MODULE_CATALOG = [
  {
    slug: "core_sis",
    name: "Student Information System",
    tagline: "The core source of truth for student records and enrollment.",
    description: "Student profiles, enrollment, class assignment, guardian linking, and status tracking.",
    category: "Core",
    isCore: true,
    isFeatured: true,
    minimumPlan: "free",
    dependencies: [],
    supportedRoles: ["school_admin", "principal", "teacher", "student", "parent"],
  },
  {
    slug: "core_users",
    name: "User Management",
    tagline: "Identity, roles, and access control for every school user.",
    description: "User accounts, sessions, invitations, roles, and access management across the tenant.",
    category: "Core",
    isCore: true,
    isFeatured: true,
    minimumPlan: "free",
    dependencies: [],
    supportedRoles: ["school_admin", "principal"],
  },
  {
    slug: "core_notifications",
    name: "Notifications",
    tagline: "In-app, email, and SMS delivery backbone for the platform.",
    description: "Delivers notifications, tracks delivery state, and powers communication preferences.",
    category: "Core",
    isCore: true,
    isFeatured: true,
    minimumPlan: "free",
    dependencies: [],
    supportedRoles: ["school_admin", "principal", "teacher", "student", "parent"],
  },
  {
    slug: "mod_academics",
    name: "Academics",
    tagline: "Assessment, grading, and academic performance management.",
    description: "Manage exams, grading workflows, report cards, subject performance, and results publishing.",
    category: "Academic",
    isCore: false,
    isFeatured: true,
    minimumPlan: "starter",
    dependencies: ["core_sis"],
    supportedRoles: ["school_admin", "principal", "teacher", "student", "parent"],
  },
  {
    slug: "mod_attendance",
    name: "Attendance",
    tagline: "Daily attendance tracking with alerts and absence automation.",
    description: "Track daily attendance, lateness, and absence trends with automated parent notifications.",
    category: "Academic",
    isCore: false,
    isFeatured: true,
    minimumPlan: "starter",
    dependencies: ["core_sis", "core_notifications"],
    supportedRoles: ["school_admin", "principal", "teacher", "student", "parent"],
  },
  {
    slug: "mod_admissions",
    name: "Admissions",
    tagline: "Manage the student admissions pipeline end to end.",
    description: "Handle inquiries, applications, screening, acceptance decisions, and enrollment handoff.",
    category: "Academic",
    isCore: false,
    isFeatured: false,
    minimumPlan: "starter",
    dependencies: ["core_sis"],
    supportedRoles: ["school_admin", "principal"],
  },
  {
    slug: "mod_finance",
    name: "Finance & Fees",
    tagline: "Student billing, invoicing, collections, and fee management.",
    description: "Fee structures, invoices, collections, reconciliations, and financial reporting for schools.",
    category: "Finance",
    isCore: false,
    isFeatured: true,
    minimumPlan: "starter",
    dependencies: ["core_sis"],
    supportedRoles: ["school_admin", "principal", "parent"],
  },
  {
    slug: "mod_timetable",
    name: "Timetable",
    tagline: "Class scheduling and timetable planning across the school.",
    description: "Build conflict-aware timetables for teachers, classes, rooms, and school-wide schedules.",
    category: "Academic",
    isCore: false,
    isFeatured: false,
    minimumPlan: "starter",
    dependencies: ["core_sis", "core_users"],
    supportedRoles: ["school_admin", "principal", "teacher", "student", "parent"],
  },
  {
    slug: "mod_library",
    name: "Library",
    tagline: "Library catalog, borrowing, and overdue management.",
    description: "Manage books, circulation, borrowing restrictions, overdue fines, and library analytics.",
    category: "Academic",
    isCore: false,
    isFeatured: false,
    minimumPlan: "starter",
    dependencies: ["core_sis"],
    supportedRoles: ["school_admin", "principal", "teacher", "student"],
  },
  {
    slug: "mod_transport",
    name: "Transport",
    tagline: "Routes, vehicles, and school transport operations.",
    description: "Manage routes, drivers, vehicles, route rosters, and transport communication workflows.",
    category: "Operations",
    isCore: false,
    isFeatured: false,
    minimumPlan: "pro",
    dependencies: ["core_sis", "core_notifications"],
    supportedRoles: ["school_admin", "principal", "parent"],
  },
  {
    slug: "mod_hr",
    name: "HR & Payroll",
    tagline: "Staff records, leave, payroll, and HR operations.",
    description: "Manage staff records, payroll workflows, leave approvals, contracts, and HR reporting.",
    category: "HR",
    isCore: false,
    isFeatured: true,
    minimumPlan: "pro",
    dependencies: ["core_users"],
    supportedRoles: ["school_admin", "principal"],
  },
  {
    slug: "mod_communications",
    name: "Communications",
    tagline: "Targeted messaging and school-wide communications.",
    description: "Announcements, email, SMS, inbox delivery, and communication workflows across audiences.",
    category: "Communications",
    isCore: false,
    isFeatured: true,
    minimumPlan: "pro",
    dependencies: ["core_notifications"],
    supportedRoles: ["school_admin", "principal", "teacher", "parent", "student"],
  },
  {
    slug: "mod_ewallet",
    name: "E-Wallet",
    tagline: "Cashless wallet balances and top-up flows for students.",
    description: "Wallet balances, top-ups, spend tracking, and wallet-powered school transactions.",
    category: "Finance",
    isCore: false,
    isFeatured: false,
    minimumPlan: "pro",
    dependencies: ["core_sis", "mod_finance"],
    supportedRoles: ["school_admin", "parent", "student"],
  },
  {
    slug: "mod_ecommerce",
    name: "School Store",
    tagline: "Sell school items and services through a unified storefront.",
    description: "Online store management for uniforms, books, merchandise, and order fulfillment.",
    category: "Commerce",
    isCore: false,
    isFeatured: false,
    minimumPlan: "enterprise",
    dependencies: ["core_sis", "mod_ewallet"],
    supportedRoles: ["school_admin", "parent", "student"],
  },
  {
    slug: "mod_reports",
    name: "Reports & Analytics",
    tagline: "Operational analytics and cross-module reporting.",
    description: "Generate dashboards, exports, cross-functional reports, and performance snapshots.",
    category: "Analytics",
    isCore: false,
    isFeatured: true,
    minimumPlan: "pro",
    dependencies: ["core_sis"],
    supportedRoles: ["school_admin", "principal"],
  },
  {
    slug: "mod_advanced_analytics",
    name: "Advanced Analytics",
    tagline: "Deeper BI, trends, and executive reporting for larger schools.",
    description: "Advanced dashboards, cohort analysis, predictive signals, and executive analytics tooling.",
    category: "Analytics",
    isCore: false,
    isFeatured: false,
    minimumPlan: "pro",
    dependencies: ["mod_reports"],
    supportedRoles: ["school_admin", "principal"],
  },
  {
    slug: "mod_parent_portal",
    name: "Parent Portal",
    tagline: "Dedicated parent experience for school engagement.",
    description: "Parent-facing access to student updates, finance information, communication, and actions.",
    category: "Portals",
    isCore: false,
    isFeatured: true,
    minimumPlan: "free",
    dependencies: ["core_sis", "core_notifications"],
    supportedRoles: ["parent"],
  },
  {
    slug: "mod_alumni",
    name: "Alumni Portal",
    tagline: "Stay connected with graduates and alumni communities.",
    description: "Alumni records, directory, outreach, community engagement, and event workflows.",
    category: "Portals",
    isCore: false,
    isFeatured: false,
    minimumPlan: "starter",
    dependencies: ["core_sis"],
    supportedRoles: ["school_admin", "alumni"],
  },
  {
    slug: "mod_partner",
    name: "Partner Portal",
    tagline: "Partner access for sponsored programs and school collaborations.",
    description: "Enable external partner workflows, reporting access, and partnership collaboration spaces.",
    category: "Portals",
    isCore: false,
    isFeatured: false,
    minimumPlan: "starter",
    dependencies: ["core_sis", "mod_reports"],
    supportedRoles: ["school_admin", "partner"],
  },
] as const;

const MODULE_PRICING_SEEDS = {
  mod_finance:  { baseRateKes: 20, band1Rate: 20, band2Rate: 17, band3Rate: 14, band4Rate: 12, band5Rate: 10 },
  mod_attendance: { baseRateKes: 10, band1Rate: 10, band2Rate: 8.5, band3Rate: 7, band4Rate: 6, band5Rate: 5 },
  mod_academics: { baseRateKes: 15, band1Rate: 15, band2Rate: 12.75, band3Rate: 10.5, band4Rate: 9, band5Rate: 7.5 },
  mod_admissions: { baseRateKes: 8, band1Rate: 8, band2Rate: 6.8, band3Rate: 5.6, band4Rate: 4.8, band5Rate: 4 },
  mod_timetable: { baseRateKes: 8, band1Rate: 8, band2Rate: 6.8, band3Rate: 5.6, band4Rate: 4.8, band5Rate: 4 },
  mod_library: { baseRateKes: 5, band1Rate: 5, band2Rate: 4.25, band3Rate: 3.5, band4Rate: 3, band5Rate: 2.5 },
  mod_transport: { baseRateKes: 12, band1Rate: 12, band2Rate: 10.2, band3Rate: 8.4, band4Rate: 7.2, band5Rate: 6 },
  mod_hr: { baseRateKes: 18, band1Rate: 18, band2Rate: 15.3, band3Rate: 12.6, band4Rate: 10.8, band5Rate: 9 },
  mod_communications: { baseRateKes: 15, band1Rate: 15, band2Rate: 12.75, band3Rate: 10.5, band4Rate: 9, band5Rate: 7.5 },
  mod_ewallet: { baseRateKes: 10, band1Rate: 10, band2Rate: 8.5, band3Rate: 7, band4Rate: 6, band5Rate: 5 },
  mod_ecommerce: { baseRateKes: 8, band1Rate: 8, band2Rate: 6.8, band3Rate: 5.6, band4Rate: 4.8, band5Rate: 4 },
  mod_reports: { baseRateKes: 12, band1Rate: 12, band2Rate: 10.2, band3Rate: 8.4, band4Rate: 7.2, band5Rate: 6 },
  mod_advanced_analytics: { baseRateKes: 25, band1Rate: 25, band2Rate: 21.25, band3Rate: 17.5, band4Rate: 15, band5Rate: 12.5 },
  mod_parent_portal: { baseRateKes: 8, band1Rate: 8, band2Rate: 6.8, band3Rate: 5.6, band4Rate: 4.8, band5Rate: 4 },
  mod_alumni: { baseRateKes: 5, band1Rate: 5, band2Rate: 4.25, band3Rate: 3.5, band4Rate: 3, band5Rate: 2.5 },
  mod_partner: { baseRateKes: 5, band1Rate: 5, band2Rate: 4.25, band3Rate: 3.5, band4Rate: 3, band5Rate: 2.5 },
} as const;

const PLAN_INCLUSION_MAP: Record<string, readonly string[]> = {
  free: [],
  starter: ["mod_finance", "mod_attendance", "mod_academics", "mod_parent_portal"],
  pro: [
    "mod_finance",
    "mod_attendance",
    "mod_academics",
    "mod_parent_portal",
    "mod_hr",
    "mod_timetable",
    "mod_transport",
    "mod_library",
    "mod_communications",
    "mod_ewallet",
    "mod_admissions",
    "mod_reports",
  ],
  enterprise: [
    "mod_finance",
    "mod_attendance",
    "mod_academics",
    "mod_parent_portal",
    "mod_hr",
    "mod_timetable",
    "mod_transport",
    "mod_library",
    "mod_communications",
    "mod_ewallet",
    "mod_admissions",
    "mod_reports",
    "mod_advanced_analytics",
    "mod_ecommerce",
    "mod_alumni",
    "mod_partner",
  ],
};

async function ensureMarketplaceCatalog(ctx: any, now: number) {
  const moduleIdsBySlug = new Map<string, any>();

  for (const moduleDef of MARKETPLACE_MODULE_CATALOG) {
    const existingModule = await ctx.db
      .query("marketplace_modules")
      .withIndex("by_slug", (q: any) => q.eq("slug", moduleDef.slug))
      .unique();

    const moduleRecord = {
      slug: moduleDef.slug,
      name: moduleDef.name,
      tagline: moduleDef.tagline,
      description: moduleDef.description,
      category: moduleDef.category,
      status: "published" as const,
      isFeatured: moduleDef.isFeatured,
      isCore: moduleDef.isCore,
      minimumPlan: moduleDef.minimumPlan,
      dependencies: [...moduleDef.dependencies],
      supportedRoles: [...moduleDef.supportedRoles],
      version: MARKETPLACE_VERSION,
      screenshots: [],
      publishedAt: now,
      averageRating: 0,
      reviewCount: 0,
      installCount: 0,
      activeInstallCount: 0,
      createdAt: existingModule?.createdAt ?? now,
      updatedAt: now,
    };

    let marketplaceModuleId = existingModule?._id;
    if (existingModule) {
      await ctx.db.patch(existingModule._id, moduleRecord);
    } else {
      marketplaceModuleId = await ctx.db.insert("marketplace_modules", moduleRecord);
    }

    moduleIdsBySlug.set(moduleDef.slug, marketplaceModuleId);
  }

  for (const [slug, pricing] of Object.entries(MODULE_PRICING_SEEDS)) {
    const moduleId = moduleIdsBySlug.get(slug);
    if (!moduleId) {
      continue;
    }

    const existingPricing = await ctx.db
      .query("module_pricing")
      .withIndex("by_moduleId", (q: any) => q.eq("moduleId", moduleId))
      .unique();

    const pricingRecord = {
      moduleId,
      ...pricing,
      monthlyMultiplier: 1,
      termlyMultiplier: 0.95,
      quarterlyMultiplier: 0.95,
      annualMultiplier: 0.82,
      planOverrides: [],
      vatRatePct: 16,
      updatedBy: MARKETPLACE_SEED_ACTOR,
      updatedAt: now,
    };

    if (existingPricing) {
      await ctx.db.patch(existingPricing._id, pricingRecord);
    } else {
      await ctx.db.insert("module_pricing", pricingRecord);
    }
  }

  for (const moduleDef of MARKETPLACE_MODULE_CATALOG) {
    const moduleId = moduleIdsBySlug.get(moduleDef.slug);
    if (!moduleId) {
      continue;
    }

    for (const plan of ["free", "starter", "pro", "enterprise"] as const) {
      const existingInclusion = await ctx.db
        .query("module_plan_inclusions")
        .withIndex("by_moduleId_plan", (q: any) => q.eq("moduleId", moduleId).eq("plan", plan))
        .unique();

      const inclusionRecord = {
        moduleId,
        moduleSlug: moduleDef.slug,
        plan,
        isIncluded: moduleDef.isCore || (PLAN_INCLUSION_MAP[plan] ?? []).includes(moduleDef.slug),
        updatedBy: MARKETPLACE_SEED_ACTOR,
        updatedAt: now,
      };

      if (existingInclusion) {
        await ctx.db.patch(existingInclusion._id, inclusionRecord);
      } else {
        await ctx.db.insert("module_plan_inclusions", inclusionRecord);
      }
    }
  }

  return moduleIdsBySlug;
}

async function ensureCoreMarketplaceInstallsForTenant(
  ctx: any,
  args: { tenantId: string; installedBy: string; now: number; moduleIdsBySlug: Map<string, any> }
) {
  for (const coreSlug of ["core_sis", "core_users", "core_notifications"]) {
    const moduleId = args.moduleIdsBySlug.get(coreSlug);
    if (!moduleId) {
      continue;
    }

    const existingInstall = await ctx.db
      .query("module_installs")
      .withIndex("by_tenantId_moduleSlug", (q: any) =>
        q.eq("tenantId", args.tenantId).eq("moduleSlug", coreSlug)
      )
      .unique();

    const installRecord = {
      moduleId,
      moduleSlug: coreSlug,
      tenantId: args.tenantId,
      status: "active" as const,
      billingPeriod: MARKETPLACE_BILLING_PERIOD,
      currentPriceKes: 0,
      hasPriceOverride: false,
      isFree: true,
      firstInstalledAt: existingInstall?.firstInstalledAt ?? args.now,
      billingStartsAt: existingInstall?.billingStartsAt ?? args.now,
      nextBillingDate: existingInstall?.nextBillingDate ?? args.now,
      installedAt: existingInstall?.installedAt ?? args.now,
      installedBy: existingInstall?.installedBy ?? args.installedBy,
      version: MARKETPLACE_VERSION,
      paymentFailureCount: existingInstall?.paymentFailureCount ?? 0,
      createdAt: existingInstall?.createdAt ?? args.now,
      updatedAt: args.now,
    };

    if (existingInstall) {
      await ctx.db.patch(existingInstall._id, installRecord);
    } else {
      await ctx.db.insert("module_installs", installRecord);
    }
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

    for (const seed of Object.values(SYSTEM_ROLE_SEEDS)) {
      const existing = await ctx.db
        .query("platform_roles")
        .withIndex("by_slug", (q) => q.eq("slug", seed.slug))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          name: seed.name,
          description: seed.description,
          isSystem: true,
          isActive: true,
          color: seed.color,
          icon: seed.icon,
          permissions: seed.permissions,
          updatedAt: now,
        });
        continue;
      }

      await ctx.db.insert("platform_roles", {
        name: seed.name,
        slug: seed.slug,
        description: seed.description,
        baseRole: undefined,
        isSystem: true,
        isActive: true,
        color: seed.color,
        icon: seed.icon,
        permissions: seed.permissions,
        createdBy: "system",
        createdAt: now,
        updatedAt: now,
      });
      rolesCreated += 1;
    }

    const masterAdminEmail = process.env.MASTER_ADMIN_EMAIL?.trim().toLowerCase();
    if (!masterAdminEmail) {
      return { rolesCreated, platformUserSeeded: false };
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
        role: "master_admin",
        department: "Platform",
        addedPermissions: [],
        removedPermissions: [],
        scopeCountries: [],
        scopeTenantIds: [],
        scopePlans: [],
        status: "active",
        accessExpiresAt: undefined,
        invitedBy: undefined,
        acceptedAt: now,
        lastLogin: undefined,
        notes: "Seeded from MASTER_ADMIN_EMAIL",
        createdAt: now,
        updatedAt: now,
      });
    }

    return { rolesCreated, platformUserSeeded: true };
  },
});

export const verifyMarketplaceSeedInternal = internalQuery({
  args: {
    tenantId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const marketplaceModules = await ctx.db.query("marketplace_modules").collect();
    const modulePricing = await ctx.db.query("module_pricing").collect();
    const modulePlanInclusions = await ctx.db.query("module_plan_inclusions").collect();
    const tenantCoreInstalls = args.tenantId
      ? await ctx.db
          .query("module_installs")
          .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId!))
          .collect()
      : [];

    return {
      marketplaceModuleCount: marketplaceModules.length,
      marketplaceModuleSlugs: marketplaceModules.map((module) => module.slug).sort(),
      modulePricingCount: modulePricing.length,
      modulePlanInclusionCount: modulePlanInclusions.length,
      tenantCoreInstalls: tenantCoreInstalls
        .filter((install) =>
          ["core_sis", "core_users", "core_notifications"].includes(install.moduleSlug ?? "")
        )
        .map((install) => ({
          moduleSlug: install.moduleSlug,
          status: install.status,
          isFree: install.isFree ?? false,
        })),
    };
  },
});

export const verifyMarketplaceSeed = query({
  args: {
    tenantId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const marketplaceModules = await ctx.db.query("marketplace_modules").collect();
    const modulePricing = await ctx.db.query("module_pricing").collect();
    const modulePlanInclusions = await ctx.db.query("module_plan_inclusions").collect();
    const tenantInstalls = args.tenantId
      ? await ctx.db
          .query("module_installs")
          .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId!))
          .collect()
      : [];

    return {
      marketplaceModuleCount: marketplaceModules.length,
      marketplaceModuleSlugs: marketplaceModules.map((module) => module.slug).sort(),
      modulePricingCount: modulePricing.length,
      modulePlanInclusionCount: modulePlanInclusions.length,
      tenantCoreInstalls: tenantInstalls
        .filter((install) =>
          ["core_sis", "core_users", "core_notifications"].includes(install.moduleSlug ?? "")
        )
        .map((install) => ({
          moduleSlug: install.moduleSlug,
          status: install.status,
          isFree: install.isFree ?? false,
        })),
    };
  },
});
