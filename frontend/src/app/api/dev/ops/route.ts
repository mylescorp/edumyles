import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { canRunPrivilegedDevActions, normalizeDevRole } from "@/lib/dev/access";
import type {
  DevImpersonationCandidate,
  DevModuleCatalogItem,
  DevPortalLauncher,
  DevTenantModule,
  DevTenantSummary,
} from "@/lib/dev/types";
import { getRoleDashboard, getRoleLabel } from "@/lib/routes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }

  return new ConvexHttpClient(convexUrl);
}

async function requirePrivilegedDevSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("edumyles_session")?.value ?? null;
  const role = normalizeDevRole(cookieStore.get("edumyles_role")?.value ?? null);

  if (!sessionToken || !canRunPrivilegedDevActions(role)) {
    return null;
  }

  return { cookieStore, sessionToken, role };
}

function buildPortalLaunchers(candidates: DevImpersonationCandidate[]): DevPortalLauncher[] {
  const launchRoles = [
    "school_admin",
    "principal",
    "teacher",
    "parent",
    "student",
    "alumni",
    "partner",
  ];

  return launchRoles.map((role) => ({
    role,
    label: getRoleLabel(role),
    dashboard: getRoleDashboard(role),
    candidate:
      candidates.find((candidate) => candidate.role === role && candidate.isActive && candidate.recommended) ??
      candidates.find((candidate) => candidate.role === role && candidate.isActive) ??
      null,
  }));
}

function setImpersonationCookies(
  response: NextResponse,
  impersonationToken: string,
  role: string,
  adminSessionToken: string
) {
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set("edumyles_session", impersonationToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 2 * 60 * 60,
  });

  response.cookies.set("edumyles_role", role, {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 2 * 60 * 60,
  });

  response.cookies.set("edumyles_admin_session", adminSessionToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 2 * 60 * 60,
  });

  response.cookies.set("edumyles_impersonating", "true", {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 2 * 60 * 60,
  });
}

export async function GET(request: NextRequest) {
  try {
    const privilegedSession = await requirePrivilegedDevSession();
    if (!privilegedSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const convex = getConvexClient();
    const selectedTenantId = request.nextUrl.searchParams.get("tenantId");

    const tenantsRaw = (await convex.query((api.platform.tenants.queries as any).listAllTenants, {
      sessionToken: privilegedSession.sessionToken,
    })) as any[];

    const tenants: DevTenantSummary[] = Array.isArray(tenantsRaw)
      ? tenantsRaw
          .filter((tenant) => tenant?.tenantId && tenant.tenantId !== "PLATFORM")
          .map((tenant) => ({
            tenantId: String(tenant.tenantId),
            name: String(tenant.name ?? tenant.tenantId),
            subdomain: tenant.subdomain ? String(tenant.subdomain) : undefined,
            plan: tenant.plan ? String(tenant.plan) : undefined,
            status: tenant.status ? String(tenant.status) : undefined,
          }))
          .sort((left, right) => left.name.localeCompare(right.name))
      : [];

    const moduleCatalogRaw = (await convex.query((api.modules.marketplace.queries as any).getAvailableForTier, {
      sessionToken: privilegedSession.sessionToken,
    })) as any[];

    const moduleCatalog: DevModuleCatalogItem[] = Array.isArray(moduleCatalogRaw)
      ? moduleCatalogRaw
          .map((item) => ({
            moduleId: String(item.moduleId),
            name: String(item.name ?? item.moduleId),
            category: item.category ? String(item.category) : undefined,
            tier: item.tier ? String(item.tier) : undefined,
            version: item.version ? String(item.version) : undefined,
            isCore: Boolean(item.isCore),
            availableForTier: item.availableForTier !== false,
          }))
          .sort((left, right) => left.name.localeCompare(right.name))
      : [];

    let tenantModules: DevTenantModule[] = [];
    let impersonationCandidates: DevImpersonationCandidate[] = [];

    if (selectedTenantId) {
      const [tenantModulesRaw, impersonationRaw] = await Promise.all([
        convex.query((api.platform.tenants.queries as any).getTenantModules, {
          sessionToken: privilegedSession.sessionToken,
          tenantId: selectedTenantId,
        }),
        convex.query((api.platform.impersonation.queries as any).searchImpersonationCandidates, {
          sessionToken: privilegedSession.sessionToken,
          tenantId: selectedTenantId,
        }),
      ]);

      tenantModules = Array.isArray(tenantModulesRaw)
        ? tenantModulesRaw.map((module) => ({
            moduleId: String(module.moduleId ?? module.moduleSlug),
            moduleSlug: module.moduleSlug ? String(module.moduleSlug) : undefined,
            name: module.name ? String(module.name) : undefined,
            category: module.category ? String(module.category) : undefined,
            status: module.status ? String(module.status) : undefined,
            installedAt: typeof module.installedAt === "number" ? module.installedAt : undefined,
            updatedAt: typeof module.updatedAt === "number" ? module.updatedAt : undefined,
            isInstalled: true,
          }))
        : [];

      impersonationCandidates = Array.isArray((impersonationRaw as any)?.users)
        ? (impersonationRaw as any).users.map((candidate: any) => ({
            id: String(candidate.id),
            name: String(candidate.name ?? candidate.email),
            email: String(candidate.email),
            role: String(candidate.role),
            isActive: Boolean(candidate.isActive),
            recommended: Boolean(candidate.recommended),
            tenantId: String(candidate.tenantId),
            tenantName: String(candidate.tenantName),
          }))
        : [];
    }

    return NextResponse.json(
      {
        selectedTenantId,
        tenants,
        moduleCatalog,
        tenantModules,
        impersonationCandidates,
        portalLaunchers: buildPortalLaunchers(impersonationCandidates),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("[api/dev/ops] Failed to load privileged ops data", error);
    return NextResponse.json({ error: "Failed to load developer operations data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const privilegedSession = await requirePrivilegedDevSession();
    if (!privilegedSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const convex = getConvexClient();

    if (body?.action === "installModule") {
      await convex.mutation((api.platform.marketplace.mutations as any).installModule, {
        sessionToken: privilegedSession.sessionToken,
        tenantId: body.tenantId,
        moduleId: body.moduleId,
        assignedRoles: [],
      });

      return NextResponse.json({ success: true });
    }

    if (body?.action === "uninstallModule") {
      await convex.mutation((api.platform.marketplace.mutations as any).uninstallCatalogModule, {
        sessionToken: privilegedSession.sessionToken,
        tenantId: body.tenantId,
        moduleId: body.moduleId,
        reason: body.reason ?? "Removed from developer control panel",
      });

      return NextResponse.json({ success: true });
    }

    if (body?.action === "setModuleStatus") {
      await convex.mutation((api.platform.marketplace.mutations as any).setTenantModuleStatus, {
        sessionToken: privilegedSession.sessionToken,
        tenantId: body.tenantId,
        moduleId: body.moduleId,
        status: body.status,
      });

      return NextResponse.json({ success: true });
    }

    if (body?.action === "startImpersonation") {
      const result = await convex.mutation((api.platform.impersonation.mutations as any).beginImpersonationSession, {
        sessionToken: privilegedSession.sessionToken,
        targetUserId: body.targetUserId,
        targetTenantId: body.tenantId,
        reason: body.reason ?? "Developer control panel launch",
      });

      const response = NextResponse.json({
        success: true,
        dashboard: getRoleDashboard(String(result.targetUser.role)),
      });

      setImpersonationCookies(
        response,
        String(result.impersonationToken),
        String(result.targetUser.role),
        privilegedSession.sessionToken
      );

      return response;
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Developer operation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
