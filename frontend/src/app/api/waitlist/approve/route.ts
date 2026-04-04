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
      if (!sessionToken || !applicationId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    const workosApiKey = process.env.WORKOS_API_KEY;

    if (!convexUrl) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);

    // ── 1. Get application record to determine approval mode ─────────────────
    const allApplications = await convex.query(api.waitlist.listApplications, {
      sessionToken,
    });

    const appRecord = (allApplications as any[]).find(
      (a: any) => a._id === applicationId
    );

    if (!appRecord) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const provisionable =
      typeof appRecord.workosUserId === "string" &&
      !appRecord.workosUserId.startsWith("landing:");

    let tenantOrg: any = null;

    if (provisionable) {
      if (!assignedTenantId || !assignedRole) {
        return NextResponse.json(
          { error: "Tenant and role are required for provisioned approvals." },
          { status: 400 }
        );
      }

      const tenant = await convex.query(api.tenants.getTenantByTenantId, {
        tenantId: assignedTenantId,
      });

      if (!tenant) {
        return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
      }

      tenantOrg = await convex.query(api.organizations.getOrgBySubdomain, {
        sessionToken,
        subdomain: tenant.subdomain,
      });

      if (!tenantOrg) {
        return NextResponse.json(
          { error: "Organization not found for tenant. Create the tenant's WorkOS org first." },
          { status: 404 }
        );
      }

      if (workosApiKey && tenantOrg.workosOrgId && !tenantOrg.workosOrgId.startsWith("edumyles-")) {
        try {
          const workos = new WorkOS(workosApiKey);
          await workos.userManagement.createOrganizationMembership({
            organizationId: tenantOrg.workosOrgId,
            userId: appRecord.workosUserId,
            roleSlug: mapRoleToWorkOSRole(assignedRole),
          });
          console.log(
            `[waitlist/approve] ✅ Added ${appRecord.email} to WorkOS org ${tenantOrg.workosOrgId}`
          );
        } catch (workosErr: any) {
          console.warn(
            "[waitlist/approve] WorkOS org membership failed (non-fatal):",
            workosErr?.message
          );
        }
      }
    }

    const result = await convex.mutation(api.waitlist.approveWaitlistApplication, {
      sessionToken,
      applicationId: applicationId as Id<"waitlistApplications">,
      assignedTenantId: provisionable ? assignedTenantId : undefined,
      assignedRole: provisionable ? assignedRole : undefined,
      reviewNotes,
      organizationId: provisionable
        ? (tenantOrg._id as Id<"organizations">)
        : undefined,
    });

    console.log(
      provisionable
        ? `[waitlist/approve] ✅ Provisioned ${appRecord.email} → ${assignedTenantId} as ${assignedRole}`
        : `[waitlist/approve] ✅ Approved landing application for ${appRecord.email}`
    );

    return NextResponse.json({ success: true, provisioned: result.provisioned });
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
