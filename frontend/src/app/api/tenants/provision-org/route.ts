/**
 * POST /api/tenants/provision-org
 *
 * Creates a real WorkOS Organization for a tenant that was provisioned with
 * a placeholder workosOrgId (format: "edumyles-<tenantId>").
 *
 * This route is called:
 *  a) As part of the tenant creation wizard (TenantProvisioningWizard step 4).
 *  b) On-demand from the tenant detail page to retroactively create the org.
 *
 * Body:
 *  {
 *    sessionToken: string,
 *    tenantId: string,
 *  }
 *
 * Returns:
 *  {
 *    workosOrgId: string,
 *    organizationId: string,  // Convex _id
 *  }
 */

import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionToken, tenantId } = body as {
      sessionToken: string;
      tenantId: string;
    };

    if (!sessionToken || !tenantId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    const workosApiKey = process.env.WORKOS_API_KEY;

    if (!convexUrl) {
      return NextResponse.json({ error: "CONVEX_URL not configured" }, { status: 500 });
    }
    if (!workosApiKey) {
      return NextResponse.json({ error: "WORKOS_API_KEY not configured" }, { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);

    // ── 1. Verify caller is a platform admin ────────────────────────────────
    // (The Convex mutation will enforce this again, but validate early.)
    const tenant = await convex.query(api.tenants.getTenantByTenantId, { tenantId });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // ── 2. Look up existing org ──────────────────────────────────────────────
    const existingOrg = await convex.query(api.organizations.getOrgBySubdomain, {
      subdomain: tenant.subdomain,
    });

    // If org already has a real WorkOS ID, return it without re-creating
    if (
      existingOrg?.workosOrgId &&
      !existingOrg.workosOrgId.startsWith("edumyles-") &&
      !existingOrg.workosOrgId.startsWith("platform-")
    ) {
      return NextResponse.json({
        workosOrgId: existingOrg.workosOrgId,
        organizationId: existingOrg._id,
        alreadyExists: true,
      });
    }

    // ── 3. Create WorkOS Organization ────────────────────────────────────────
    const workos = new WorkOS(workosApiKey);

    const workosOrg = await workos.organizations.createOrganization({
      name: tenant.name,
      // Domains can be added later via the WorkOS dashboard or API
    });

    console.log(
      `[provision-org] ✅ Created WorkOS org for "${tenant.name}": ${workosOrg.id}`
    );

    // ── 4. Update the Convex organization record with the real WorkOS org ID ─
    const orgId = await convex.mutation(api.organizations.upsertOrganization, {
      tenantId,
      workosOrgId: workosOrg.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      tier: (tenant.plan as "free" | "starter" | "growth" | "enterprise") ?? "starter",
    });

    console.log(
      `[provision-org] ✅ Updated Convex org ${orgId} with WorkOS org ${workosOrg.id}`
    );

    return NextResponse.json({
      workosOrgId: workosOrg.id,
      organizationId: orgId,
    });
  } catch (err: any) {
    console.error("[provision-org] Error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to provision WorkOS organization" },
      { status: 500 }
    );
  }
}
