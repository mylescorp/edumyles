/**
 * Waitlist management — queries and mutations.
 *
 * Flow:
 *  1. A new user signs up via WorkOS.  The auth callback sees they are not in
 *     the `users` table and calls `submitWaitlistApplication`.
 *  2. The user is redirected to /auth/pending where they can check their status.
 *  3. The master admin reviews the queue at /platform/waitlist.
 *  4. On approval the master admin supplies a tenantId and role.  The API route
 *     /api/waitlist/approve calls `approveWaitlistApplication` which creates the
 *     Convex user record; the route also adds the user to the WorkOS Organization.
 *  5. On rejection `rejectWaitlistApplication` marks the record and the user
 *     is notified via email (handled in the API route).
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "./helpers/platformGuard";
import { logAction } from "./helpers/auditLog";

function isProvisionableWorkosUserId(workosUserId: string): boolean {
  return !workosUserId.startsWith("landing:");
}

function buildLandingWaitlistUserId(email: string): string {
  return `landing:${email.trim().toLowerCase()}`;
}

// ── Public mutations (called from auth callback, no session required) ──────

/**
 * Called from the auth callback when a new WorkOS user completes sign-up
 * but has no record in the `users` table yet.  Idempotent — if an application
 * already exists for the given workosUserId the existing record is returned.
 */
export const submitWaitlistApplication = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    country: v.optional(v.string()),
    county: v.optional(v.string()),
    schoolName: v.optional(v.string()),
    requestedRole: v.optional(v.string()),
    message: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const waitlistWorkosUserId =
      args.workosUserId?.trim() || buildLandingWaitlistUserId(normalizedEmail);

    const existing = args.workosUserId?.trim()
      ? await ctx.db
          .query("waitlistApplications")
          .withIndex("by_workos_user", (q) => q.eq("workosUserId", waitlistWorkosUserId))
          .first()
      : await ctx.db
          .query("waitlistApplications")
          .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
          .first();

    if (existing) {
      return { id: existing._id, status: existing.status, isNew: false };
    }

    const id = await ctx.db.insert("waitlistApplications", {
      workosUserId: waitlistWorkosUserId,
      email: normalizedEmail,
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      country: args.country,
      county: args.county,
      schoolName: args.schoolName,
      requestedRole: args.requestedRole ?? "school_admin",
      message: args.message,
      source: args.source ?? (args.workosUserId ? "workos_auth_signup" : "landing_public_signup"),
      status: "pending",
      requestedAt: Date.now(),
    });

    const platformAdmins = await ctx.db
      .query("users")
      .withIndex("by_tenant", (q) => q.eq("tenantId", "PLATFORM"))
      .collect();

    const recipients = platformAdmins.filter(
      (user) =>
        user.isActive &&
        ["master_admin", "super_admin"].includes(user.role) &&
        Boolean(user.workosUserId)
    );

    const applicantName =
      [args.firstName?.trim(), args.lastName?.trim()].filter(Boolean).join(" ") ||
      normalizedEmail;

    for (const admin of recipients) {
      await ctx.db.insert("notifications", {
        tenantId: "PLATFORM",
        userId: admin.workosUserId,
        title: "New client application received",
        message: `${applicantName} submitted a signup application${args.schoolName ? ` for ${args.schoolName}` : ""}${args.country ? ` in ${args.country}` : ""}. Review it from the platform waitlist.`,
        type: "waitlist_application",
        isRead: false,
        link: "/platform/waitlist",
        createdAt: Date.now(),
      });
    }

    return { id, status: "pending", isNew: true };
  },
});

/**
 * Returns the waitlist application for a given WorkOS user ID.
 * Used by /auth/pending to show the user their current status.
 */
export const getApplicationByWorkosUserId = query({
  args: { workosUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("waitlistApplications")
      .withIndex("by_workos_user", (q) => q.eq("workosUserId", args.workosUserId))
      .first();
  },
});

// ── Platform admin queries & mutations (require master_admin session) ───────

/**
 * List waitlist applications filtered by status.
 * Requires a valid master_admin / super_admin session.
 */
export const listApplications = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.string()), // undefined → all
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (
      !session ||
      session.expiresAt < Date.now() ||
      !["master_admin", "super_admin"].includes(session.role)
    ) {
      throw new Error("UNAUTHORIZED");
    }

    if (args.status) {
      return await ctx.db
        .query("waitlistApplications")
        .withIndex("by_status", (q) => q.eq("status", args.status as string))
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("waitlistApplications")
      .order("desc")
      .collect();
  },
});

/**
 * Returns aggregate counts per status — useful for the platform dashboard badge.
 */
export const getApplicationCounts = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (
      !session ||
      session.expiresAt < Date.now() ||
      !["master_admin", "super_admin"].includes(session.role)
    ) {
      return null;
    }

    const all = await ctx.db.query("waitlistApplications").collect();
    return {
      total: all.length,
      pending: all.filter((a) => a.status === "pending").length,
      approved: all.filter((a) => a.status === "approved").length,
      rejected: all.filter((a) => a.status === "rejected").length,
    };
  },
});

/**
 * Approve a waitlist application.
 *
 * - Marks the application as approved with the assigned tenant / role.
 * - Creates the `users` record in Convex so the user can sign in.
 * - NOTE: The calling API route is responsible for adding the user to the
 *   WorkOS Organization (requires server-side WorkOS API call).
 */
export const approveWaitlistApplication = mutation({
  args: {
    sessionToken: v.string(),
    applicationId: v.id("waitlistApplications"),
    assignedTenantId: v.optional(v.string()),
    assignedRole: v.optional(v.string()),
    reviewNotes: v.optional(v.string()),
    // Convex org _id for the assigned tenant (passed from API route)
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const adminCtx = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const application = await ctx.db.get(args.applicationId);
    if (!application) throw new Error("APPLICATION_NOT_FOUND");
    if (application.status !== "pending") throw new Error("APPLICATION_ALREADY_REVIEWED");

    const now = Date.now();
    const shouldProvision = isProvisionableWorkosUserId(application.workosUserId);

    if (
      shouldProvision &&
      (!args.assignedTenantId || !args.assignedRole || !args.organizationId)
    ) {
      throw new Error("MISSING_ASSIGNMENT_DETAILS");
    }

    // Mark application as approved
    await ctx.db.patch(args.applicationId, {
      status: "approved",
      reviewedBy: adminCtx.userId,
      reviewedAt: now,
      reviewNotes: args.reviewNotes,
      assignedTenantId: args.assignedTenantId,
      assignedRole: args.assignedRole,
      assignedOrgId: args.organizationId,
    });

    if (shouldProvision) {
      // Check if user record already exists (re-approval scenario)
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_workos_user", (q) =>
          q.eq("workosUserId", application.workosUserId)
        )
        .first();

      if (existingUser) {
        // Update existing record to ensure correct tenant/role
        await ctx.db.patch(existingUser._id, {
          tenantId: args.assignedTenantId!,
          role: args.assignedRole!,
          organizationId: args.organizationId!,
          isActive: true,
        });
      } else {
        // Create new user record
        const eduMylesUserId = `USR-${args.assignedTenantId}-${application.workosUserId.slice(-8).toUpperCase()}`;
        await ctx.db.insert("users", {
          tenantId: args.assignedTenantId!,
          eduMylesUserId,
          workosUserId: application.workosUserId,
          email: application.email,
          firstName: application.firstName,
          lastName: application.lastName,
          role: args.assignedRole!,
          permissions: [],
          organizationId: args.organizationId!,
          isActive: true,
          createdAt: now,
        });
      }
    }

    await logAction(ctx, {
      tenantId: adminCtx.tenantId,
      actorId: adminCtx.userId,
      actorEmail: adminCtx.email,
      action: "waitlist.approved",
      entityType: "waitlistApplication",
      entityId: args.applicationId,
      after: {
        email: application.email,
        assignedTenantId: args.assignedTenantId,
        assignedRole: args.assignedRole,
        source: application.source ?? "workos_auth_signup",
        provisioned: shouldProvision,
      },
    });

    return { success: true, provisioned: shouldProvision };
  },
});

/**
 * Reject a waitlist application.
 */
export const rejectWaitlistApplication = mutation({
  args: {
    sessionToken: v.string(),
    applicationId: v.id("waitlistApplications"),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const adminCtx = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const application = await ctx.db.get(args.applicationId);
    if (!application) throw new Error("APPLICATION_NOT_FOUND");
    if (application.status !== "pending") throw new Error("APPLICATION_ALREADY_REVIEWED");

    const now = Date.now();

    await ctx.db.patch(args.applicationId, {
      status: "rejected",
      reviewedBy: adminCtx.userId,
      reviewedAt: now,
      reviewNotes: args.reviewNotes,
    });

    await logAction(ctx, {
      tenantId: adminCtx.tenantId,
      actorId: adminCtx.userId,
      actorEmail: adminCtx.email,
      action: "waitlist.rejected",
      entityType: "waitlistApplication",
      entityId: args.applicationId,
      after: {
        email: application.email,
        reviewNotes: args.reviewNotes,
      },
    });

    return { success: true };
  },
});
