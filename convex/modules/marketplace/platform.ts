import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requireRole } from "../../helpers/authorize";

/**
 * All 11 EduMyles modules with metadata.
 */
const MODULE_CATALOG = [
  {
    moduleId: "sis",
    name: "Student Information System",
    description:
      "Core student records, enrollment lifecycle, bulk import/export, NEMIS tracking. The foundation for all student-related modules.",
    tier: "free",
    category: "core",
    version: "1.0.0",
  },
  {
    moduleId: "admissions",
    name: "Admissions & Enrollment",
    description:
      "Online application forms, pipeline management (submitted > reviewed > interview > accepted > enrolled), document uploads, waiting lists.",
    tier: "starter",
    category: "core",
    version: "1.0.0",
  },
  {
    moduleId: "finance",
    name: "Fee & Finance Management",
    description:
      "Fee structure builder, invoice generation, M-Pesa/Stripe/Airtel Money payments, receipts, bursar dashboard, aging reports.",
    tier: "starter",
    category: "core",
    version: "1.0.0",
  },
  {
    moduleId: "academics",
    name: "Academics & Gradebook",
    description:
      "Grade entry with multi-curriculum support (CBC, 8-4-4, IGCSE), report card generation, assignment management, exam scheduling.",
    tier: "standard",
    category: "academics",
    version: "1.0.0",
  },
  {
    moduleId: "timetable",
    name: "Timetable & Scheduling",
    description:
      "Visual timetable builder with conflict detection, period templates, substitute teacher assignment, room management.",
    tier: "standard",
    category: "academics",
    version: "1.0.0",
  },
  {
    moduleId: "communications",
    name: "Communications & Notifications",
    description:
      "SMS (Africa's Talking), email (Resend), in-app notifications, announcement system, emergency broadcasts with acknowledgment.",
    tier: "starter",
    category: "operations",
    version: "1.0.0",
  },
  {
    moduleId: "hr",
    name: "HR & Payroll",
    description:
      "Staff records, contract management, leave workflows, payroll with Kenya statutory deductions (PAYE, NSSF, SHIF, Housing Levy), payslip generation.",
    tier: "pro",
    category: "operations",
    version: "1.0.0",
  },
  {
    moduleId: "library",
    name: "Library Management",
    description:
      "Book catalogue, borrowing/return tracking, overdue fine automation (charged to eWallet), low-stock alerts, librarian dashboard.",
    tier: "pro",
    category: "operations",
    version: "1.0.0",
  },
  {
    moduleId: "transport",
    name: "Transport Management",
    description:
      "Route and stop management, vehicle fleet tracking, student-route assignment, transport fee billing, arrival/departure notifications.",
    tier: "pro",
    category: "operations",
    version: "1.0.0",
  },
  {
    moduleId: "ewallet",
    name: "eWallet",
    description:
      "Digital wallet for students/parents. Top up via M-Pesa/card, spend on fees, canteen, library fines, events. Ledger-based — funds go directly to school account.",
    tier: "enterprise",
    category: "finance",
    version: "1.0.0",
  },
  {
    moduleId: "ecommerce",
    name: "eCommerce",
    description:
      "Per-school shop for uniforms, books, stationery. Product listings, stock tracking, checkout via eWallet or M-Pesa, order management.",
    tier: "enterprise",
    category: "finance",
    version: "1.0.0",
  },
];

/**
 * Seed the module registry with all 11 EduMyles modules.
 * Idempotent — skips modules that already exist.
 */
export const seedModuleRegistry = mutation({
  args: {},
  handler: async (ctx) => {
    let seeded = 0;

    for (const mod of MODULE_CATALOG) {
      const existing = await ctx.db
        .query("moduleRegistry")
        .withIndex("by_module_id", (q) => q.eq("moduleId", mod.moduleId))
        .first();

      if (!existing) {
        await ctx.db.insert("moduleRegistry", {
          moduleId: mod.moduleId,
          name: mod.name,
          description: mod.description,
          tier: mod.tier,
          category: mod.category,
          status: "active",
          version: mod.version,
        });
        seeded++;
      }
    }

    return { seeded, total: MODULE_CATALOG.length };
  },
});

/**
 * Update a module's status in the registry (active/beta/deprecated).
 * Platform admin only.
 */
export const updateModuleStatus = mutation({
  args: {
    moduleId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("beta"),
      v.literal("deprecated")
    ),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantContext(ctx);
    requireRole(tenantCtx, "master_admin", "super_admin");

    const mod = await ctx.db
      .query("moduleRegistry")
      .withIndex("by_module_id", (q) => q.eq("moduleId", args.moduleId))
      .first();

    if (!mod) {
      throw new Error("MODULE_NOT_FOUND");
    }

    await ctx.db.patch(mod._id, { status: args.status });

    return { success: true };
  },
});

/**
 * Update a module's version in the registry.
 * Platform admin only.
 */
export const updateModuleVersion = mutation({
  args: {
    moduleId: v.string(),
    version: v.string(),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantContext(ctx);
    requireRole(tenantCtx, "master_admin", "super_admin");

    const mod = await ctx.db
      .query("moduleRegistry")
      .withIndex("by_module_id", (q) => q.eq("moduleId", args.moduleId))
      .first();

    if (!mod) {
      throw new Error("MODULE_NOT_FOUND");
    }

    await ctx.db.patch(mod._id, { version: args.version });

    return { success: true };
  },
});

/**
 * Get full registry listing for platform admins (includes all statuses).
 */
export const getFullRegistry = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("moduleRegistry").collect();
  },
});

/**
 * Update module metadata (name, description, tier, category).
 * Platform admin only.
 */
export const updateModuleMetadata = mutation({
  args: {
    moduleId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    tier: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantContext(ctx);
    requireRole(tenantCtx, "master_admin", "super_admin");

    const mod = await ctx.db
      .query("moduleRegistry")
      .withIndex("by_module_id", (q) => q.eq("moduleId", args.moduleId))
      .first();

    if (!mod) {
      throw new Error("MODULE_NOT_FOUND");
    }

    const updates: Record<string, string> = {};
    if (args.name) updates.name = args.name;
    if (args.description) updates.description = args.description;
    if (args.tier) updates.tier = args.tier;
    if (args.category) updates.category = args.category;

    await ctx.db.patch(mod._id, updates);

    return { success: true };
  },
});
