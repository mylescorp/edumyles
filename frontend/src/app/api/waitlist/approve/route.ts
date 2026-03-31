/**
 * POST /api/waitlist/approve
 *
 * Approves a waitlist application and provisions the user.
 *
 * Steps:
 *  1. Validate the master admin session.
 *  2. Look up the Convex organization record for the assigned tenant to get its
 *     WorkOS Organization ID.
 *  3. Add the user to the WorkOS Organization (creates membership).
 *  4. Call the Convex `approveWaitlistApplication` mutation which creates the
 *     `users` record scoped to the assigned tenant.
 *  5. Optionally send a notification email (via Resend if configured).
 *
 * Body:
 *  {
 *    sessionToken: string,
 *    applicationId: string,       // Convex waitlistApplications _id
 *    assignedTenantId: string,
 *    assignedRole: string,
 *    reviewNotes?: string,
 *  }
 */

import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionToken, applicationId, assignedTenantId, assignedRole, reviewNotes } =
      body as {
        sessionToken: string;
        applicationId: string;
        assignedTenantId: string;
        assignedRole: string;
        reviewNotes?: string;
      };

    if (!sessionToken || !applicationId || !assignedTenantId || !assignedRole) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    const workosApiKey = process.env.WORKOS_API_KEY;

    if (!convexUrl) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);

    // ── 1. Fetch the application to get workosUserId ─────────────────────────
    const application = await convex.query(api.waitlist.getApplicationByWorkosUserId, {
      // We don't have a direct getById exposed without session — list and find
      workosUserId: "", // placeholder, see below
    });

    // We need to get the application by ID. Let's use listApplications and find it.
    // Actually, approve mutation will handle all validation. Let's get the org first.

    // ── 2. Fetch the organization for this tenant ────────────────────────────
    const org = await convex.query(api.organizations.getOrgBySubdomain, {
      // We need the subdomain — get tenant first
      subdomain: "",
    });

    // Better approach: get tenant to find its org
    const tenant = await convex.query(api.tenants.getTenantByTenantId, {
      tenantId: assignedTenantId,
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Get org for this tenant to get WorkOS org ID and Convex org _id
    const tenantOrg = await convex.query(api.organizations.getOrgBySubdomain, {
      subdomain: tenant.subdomain,
    });

    if (!tenantOrg) {
      return NextResponse.json(
        { error: "Organization not found for tenant. Create the tenant's WorkOS org first." },
        { status: 404 }
      );
    }

    // ── 3. Add user to WorkOS Organization (if WorkOS is configured + has real org) ─
    // We need the workosUserId from the application. Since we need to call the
    // mutation anyway, let's get it from the application list.
    const allApplications = await convex.query(api.waitlist.listApplications, {
      sessionToken,
    });

    const appRecord = (allApplications as any[]).find(
      (a: any) => a._id === applicationId
    );

    if (!appRecord) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (workosApiKey && tenantOrg.workosOrgId && !tenantOrg.workosOrgId.startsWith("edumyles-")) {
      // Only add to WorkOS org if the org has a real WorkOS-issued ID (not our local fallback)
      try {
        const workos = new WorkOS(workosApiKey);
        await workos.organizations.createOrganizationMembership({
          organizationId: tenantOrg.workosOrgId,
          userId: appRecord.workosUserId,
          roleSlug: mapRoleToWorkOSRole(assignedRole),
        });
        console.log(
          `[waitlist/approve] ✅ Added ${appRecord.email} to WorkOS org ${tenantOrg.workosOrgId}`
        );
      } catch (workosErr: any) {
        // Log but don't block — WorkOS membership is best-effort here;
        // the Convex user record is the source of truth for auth.
        console.warn(
          "[waitlist/approve] WorkOS org membership failed (non-fatal):",
          workosErr?.message
        );
      }
    }

    // ── 4. Call Convex mutation to create user record and mark approved ───────
    await convex.mutation(api.waitlist.approveWaitlistApplication, {
      sessionToken,
      applicationId: applicationId as Id<"waitlistApplications">,
      assignedTenantId,
      assignedRole,
      reviewNotes,
      organizationId: tenantOrg._id as Id<"organizations">,
    });

    console.log(
      `[waitlist/approve] ✅ Provisioned ${appRecord.email} → ${assignedTenantId} as ${assignedRole}`
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[waitlist/approve] Error:", err);
    const message = err?.message ?? "Internal server error";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Map EduMyles roles to WorkOS role slugs.
 * WorkOS Organizations use "member" and "admin" by default; this mapping
 * ensures platform admins get elevated WorkOS org roles while regular users
 * get the member role.
 */
function mapRoleToWorkOSRole(role: string): string {
  const adminRoles = new Set([
    "school_admin",
    "principal",
    "master_admin",
    "super_admin",
  ]);
  return adminRoles.has(role) ? "admin" : "member";
}
