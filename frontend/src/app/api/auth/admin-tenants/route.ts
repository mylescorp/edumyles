import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const MASTER_SESSION_BACKUP_COOKIE = "edumyles_master_session";
const ADMIN_TENANT_COOKIE = "edumyles_admin_tenant";

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(convexUrl);
}

export async function GET(req: NextRequest) {
  try {
    const masterSessionToken =
      req.cookies.get(MASTER_SESSION_BACKUP_COOKIE)?.value ??
      req.cookies.get("edumyles_session")?.value;

    if (!masterSessionToken) {
      return NextResponse.json({ tenants: [] }, { status: 200 });
    }

    const convex = getConvexClient();
    const tenants = await convex.query((api.platform.tenants.queries as any).listAllTenants, {
      sessionToken: masterSessionToken,
    });

    const currentTenantId = req.cookies.get(ADMIN_TENANT_COOKIE)?.value ?? null;

    return NextResponse.json({
      currentTenantId,
      tenants: Array.isArray(tenants)
        ? tenants
            .filter((tenant: any) => tenant?.tenantId && tenant?.status !== "archived")
            .map((tenant: any) => ({
              tenantId: tenant.tenantId as string,
              name: tenant.name as string,
              subdomain: (tenant.subdomain as string | undefined) ?? "",
              plan: (tenant.plan as string | undefined) ?? "starter",
              status: (tenant.status as string | undefined) ?? "active",
            }))
            .sort((a, b) => a.name.localeCompare(b.name))
        : [],
    });
  } catch (error) {
    console.error("[api/auth/admin-tenants] Failed to load admin workspace tenants:", error);
    return NextResponse.json({ tenants: [] }, { status: 200 });
  }
}
