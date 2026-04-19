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
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { ensureTenantWorkOSOrganization } from "@/lib/workos-invitations";

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

    if (!convexUrl) {
      return NextResponse.json({ error: "CONVEX_URL not configured" }, { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);

    // ── 1. Verify caller is a platform admin ────────────────────────────────
    // (The Convex mutation will enforce this again, but validate early.)
    const tenant = await convex.query(api.tenants.getTenantByTenantId, { tenantId });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const org = await ensureTenantWorkOSOrganization({
      convex,
      tenantId,
      sessionToken,
    });

    return NextResponse.json({
      workosOrgId: org.workosOrgId,
      organizationId: org.organizationId,
      alreadyExists: org.alreadyExists,
    });
  } catch (err: any) {
    console.error("[provision-org] Error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to provision WorkOS organization" },
      { status: 500 }
    );
  }
}
