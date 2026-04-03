import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";
import { generateTenantId } from "../../helpers/idGenerator";
import { CORE_MODULE_IDS } from "../../modules/marketplace/moduleDefinitions";
import { api } from "../../_generated/api";

const planInputValidator = v.union(
  v.literal("free"),
  v.literal("starter"),
  v.literal("growth"),
  v.literal("standard"),
  v.literal("pro"),
  v.literal("enterprise")
);

const normalizePlan = (
  plan: "free" | "starter" | "growth" | "standard" | "pro" | "enterprise"
): "starter" | "standard" | "pro" | "enterprise" => {
  if (plan === "free") return "starter";
  if (plan === "growth") return "standard";
  return plan;
};

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
 * Schedules an invite email via Resend.
 */
export const inviteTenantAdmin = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
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
    if (existingUser) {
      throw new Error("CONFLICT: A user with this email already exists in this tenant");
    }

    // Resolve organization for the tenant
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();
    if (!org) throw new Error("ORG_NOT_FOUND: Organization not created for tenant yet");

    const now = Date.now();
    const pendingId = `pending-${crypto.randomUUID()}`;
    const eduMylesUserId = crypto.randomUUID();

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
        targetTenantId: args.tenantId,
        tenantName: tenant.name,
      },
    });

    // Schedule invite email (non-blocking — don't fail invite if email fails)
    await ctx.scheduler.runAfter(0, api.platform.tenants.emailActions.sendInviteEmail, {
      to: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role,
      tenantName: tenant.name,
      subdomain: tenant.subdomain,
      invitedByEmail: tenantCtx.email,
    });

    return { success: true, email: args.email, role: args.role };
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
