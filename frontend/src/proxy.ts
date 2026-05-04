import { authkit, handleAuthkitHeaders } from "@workos-inc/authkit-nextjs";
import { NextRequest, NextResponse } from "next/server";
import { getSharedCookieDomain, getTenantSubdomainFromHost } from "@/lib/tenant-host";

// ── Route Classification ──────────────────────────────────────
const PROTECTED_ROUTES = ["/admin", "/dashboard", "/portal", "/platform", "/student", "/support"];
const AUTH_PAGES = ["/auth/login", "/auth/signup"];

// Master admin emails — these always get master_admin role regardless of the
// stored cookie value (handles legacy sessions where role was set before DB sync).
const MASTER_ADMIN_EMAILS = [process.env.MASTER_ADMIN_EMAIL]
  .filter((v): v is string => Boolean(v))
  .map((v) => v.toLowerCase());

function isMasterAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return MASTER_ADMIN_EMAILS.includes(email.toLowerCase());
}

function isPlatformRole(role?: string | null): boolean {
  if (!role) return false;
  const normalizedRole = role === "platform_admin" ? "super_admin" : role;
  return [
    "master_admin",
    "super_admin",
    "platform_manager",
    "support_agent",
    "billing_admin",
    "marketplace_reviewer",
    "content_moderator",
    "analytics_viewer",
  ].includes(normalizedRole);
}

// ── RBAC: Which roles can access which route prefixes ─────────
const ROUTE_ROLE_MAP: Record<string, string[]> = {
  "/platform": [
    "master_admin",
    "super_admin",
    "platform_manager",
    "support_agent",
    "billing_admin",
    "marketplace_reviewer",
    "content_moderator",
    "analytics_viewer",
  ],
  "/admin": [
    "school_admin",
    "principal",
    "bursar",
    "hr_manager",
    "librarian",
    "transport_manager",
    "master_admin",
    "super_admin",
  ],
  "/portal/admin": [
    "school_admin",
    "principal",
    "bursar",
    "hr_manager",
    "librarian",
    "transport_manager",
    "master_admin",
    "super_admin",
  ],
  "/portal/teacher": ["teacher", "master_admin", "super_admin", "school_admin", "principal"],
  "/portal/student": [
    "student",
    "master_admin",
    "super_admin",
    "school_admin",
    "principal",
    "teacher",
  ],
  "/portal/parent": ["parent", "master_admin", "super_admin", "school_admin", "principal"],
  "/portal/alumni": ["alumni", "master_admin", "super_admin", "school_admin"],
  "/portal/partner": ["partner", "master_admin", "super_admin", "school_admin"],
  "/portal/affiliate": ["affiliate", "master_admin", "super_admin"],
  "/portal/reseller": ["reseller", "master_admin", "super_admin"],
  "/portal/developer": ["developer", "master_admin", "super_admin"],
  "/student": ["student", "master_admin", "super_admin", "school_admin", "principal", "teacher"],
};

// ── In-process blocked IP cache (refreshed every 60 s) ────────
let blockedIPCache: Set<string> = new Set();
let blockedIPCacheExpiry = 0;
const BLOCKED_IP_CACHE_TTL_MS = 60_000;

async function getBlockedIPs(): Promise<Set<string>> {
  const now = Date.now();
  if (now < blockedIPCacheExpiry && blockedIPCache.size > 0) {
    return blockedIPCache;
  }
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
    if (!convexUrl) return blockedIPCache;

    // Derive the HTTP Actions URL from the Convex deployment URL.
    // Convex HTTP actions are served at the same domain as the deployment.
    const httpBase = convexUrl.replace(/\.cloud$/, ".site");
    const res = await fetch(`${httpBase}/security/blocked-ips`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data: { ips: string[] } = await res.json();
      blockedIPCache = new Set(data.ips);
      blockedIPCacheExpiry = now + BLOCKED_IP_CACHE_TTL_MS;
    }
  } catch {
    // Non-fatal — degrade gracefully (don't block legitimate traffic if Convex is unreachable)
  }
  return blockedIPCache;
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function getRoleDashboard(role: string): string {
  const normalizedRole = role === "platform_admin" ? "super_admin" : role;
  if (isPlatformRole(normalizedRole)) {
    return "/platform";
  }
  switch (normalizedRole) {
    case "teacher":
      return "/portal/teacher";
    case "parent":
      return "/portal/parent";
    case "student":
      return "/portal/student";
    case "alumni":
      return "/portal/alumni";
    case "partner":
      return "/portal/partner";
    case "affiliate":
      return "/portal/affiliate";
    case "reseller":
      return "/portal/reseller";
    case "developer":
      return "/portal/developer";
    default:
      return "/admin";
  }
}

function isRoleAllowedForPath(pathname: string, role: string): boolean {
  const sortedPrefixes = Object.keys(ROUTE_ROLE_MAP).sort((a, b) => b.length - a.length);
  for (const prefix of sortedPrefixes) {
    if (pathname.startsWith(prefix)) {
      const allowedRoles = ROUTE_ROLE_MAP[prefix];
      return allowedRoles ? allowedRoles.includes(role) : true;
    }
  }
  return true;
}

function hasWorkosConfig() {
  return Boolean(process.env.WORKOS_API_KEY || process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID);
}

function applyAuthResponse(
  request: NextRequest,
  authkitHeaders: Headers | null,
  options?: { redirect?: URL }
) {
  if (authkitHeaders) {
    return handleAuthkitHeaders(request, authkitHeaders, options);
  }
  if (options?.redirect) {
    return NextResponse.redirect(options.redirect);
  }
  return NextResponse.next();
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let workosSession: { user?: unknown } = {};
  let authkitHeaders: Headers | null = null;
  let authorizationUrl: URL | null = null;

  if (hasWorkosConfig()) {
    const authkitResult = await authkit(request);
    workosSession = authkitResult.session;
    authkitHeaders = authkitResult.headers;
    authorizationUrl = authkitResult.authorizationUrl
      ? new URL(authkitResult.authorizationUrl, request.nextUrl.origin)
      : null;
  }

  // ── 0. IP blocking enforcement ────────────────────────────────
  // Skip the check for the blocked-ips endpoint itself and static assets
  const isStaticAsset = pathname.startsWith("/_next") || pathname.startsWith("/favicon");
  if (!isStaticAsset) {
    const clientIP = getClientIP(request);
    if (clientIP && clientIP !== "unknown") {
      const blocked = await getBlockedIPs();
      if (blocked.has(clientIP)) {
        return new NextResponse(JSON.stringify({ error: "Access denied", code: "IP_BLOCKED" }), {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "X-Blocked-IP": clientIP,
          },
        });
      }
    }
  }


  const session = request.cookies.get("edumyles_session");
  let role = request.cookies.get("edumyles_role")?.value;
  const host = request.headers.get("host");
  const tenantSlug = getTenantSubdomainFromHost(host);
  let cookieTenantId: string | undefined;
  if (role === "platform_admin") {
    role = "super_admin";
  }

  // Override role for known master admins — handles sessions created before role
  // was correctly set in DB (cookie may still say "school_admin").
  try {
    const userCookie = request.cookies.get("edumyles_user")?.value;
    if (userCookie) {
      const user = JSON.parse(userCookie);
      cookieTenantId = typeof user?.tenantId === "string" ? user.tenantId : undefined;
      if (!tenantSlug && isMasterAdminEmail(user?.email)) {
        role = "master_admin";
      }
    }
  } catch {
    // Malformed cookie — ignore; fall back to raw role cookie
  }

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const hasServerSession = Boolean(workosSession.user);
  const hasPlatformCookieOnTenantHost =
    Boolean(tenantSlug) && Boolean(session) && cookieTenantId === "PLATFORM";

  // Normalize legacy student routes to the canonical portal path.
  if (pathname === "/student" || pathname.startsWith("/student/")) {
    const canonicalPath = pathname.replace(/^\/student/, "/portal/student");
    const redirectUrl = new URL(canonicalPath, request.url);
    redirectUrl.search = request.nextUrl.search;
    return NextResponse.redirect(redirectUrl);
  }

  // 0b. Maintenance mode
  const maintenanceMode = request.cookies.get("edumyles_maintenance")?.value === "true";
  if (
    maintenanceMode &&
    !pathname.startsWith("/platform") &&
    !pathname.startsWith("/maintenance") &&
    !pathname.startsWith("/auth")
  ) {
    const isPlatformAdmin = role === "master_admin" || role === "super_admin";
    if (!isPlatformAdmin) {
      return NextResponse.redirect(new URL("/maintenance", request.url));
    }
  }

  // 1. Unauthenticated → WorkOS login. Legacy cookie-only sessions are allowed
  // temporarily while existing users cycle through the updated callback flow.
  if (isProtected && !hasServerSession && !session) {
    if (tenantSlug) {
      const loginUrl = new URL("/auth/login/api", request.url);
      loginUrl.searchParams.set("returnTo", pathname || "/admin");
      return NextResponse.redirect(loginUrl);
    }

    return applyAuthResponse(request, authkitHeaders, {
      redirect: authorizationUrl ?? new URL("/auth/login", request.nextUrl.origin),
    });
  }

  if (isProtected && hasPlatformCookieOnTenantHost) {
    const loginUrl = new URL("/auth/login/api", request.url);
    loginUrl.searchParams.set("returnTo", pathname || "/admin");
    const redirectResponse = NextResponse.redirect(loginUrl);
    const domain = getSharedCookieDomain(host);
    for (const cookieName of ["edumyles_session", "edumyles_user", "edumyles_role"]) {
      redirectResponse.cookies.set(cookieName, "", {
        maxAge: 0,
        path: "/",
        domain,
      });
    }
    return redirectResponse;
  }

  // 1b. Auth pages should not remain accessible once a session exists.
  if (
    (session || hasServerSession) &&
    AUTH_PAGES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  ) {
    if (tenantSlug) {
      return applyAuthResponse(request, authkitHeaders, {
        redirect: new URL("/admin", request.url),
      });
    }

    return applyAuthResponse(request, authkitHeaders, {
      redirect: new URL(getRoleDashboard(role ?? "school_admin"), request.url),
    });
  }

  // 2. Root redirect
  if (pathname === "/") {
    if (session || hasServerSession) {
      return applyAuthResponse(request, authkitHeaders, {
        redirect: new URL(getRoleDashboard(role ?? "school_admin"), request.url),
      });
    }
    // Unauthenticated at root → send to landing page
    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL;
    if (landingUrl && landingUrl.startsWith("http")) {
      return NextResponse.redirect(landingUrl);
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // 3. RBAC enforcement
  if (isProtected && session && role) {
    if (!isRoleAllowedForPath(pathname, role)) {
      const correctDashboard = getRoleDashboard(role);
      if (!pathname.startsWith(correctDashboard)) {
        const redirectUrl = new URL(correctDashboard, request.url);
        redirectUrl.searchParams.set("error", "unauthorized");
        return applyAuthResponse(request, authkitHeaders, { redirect: redirectUrl });
      }
    }
  }

  // 4. Tenant slug from subdomain
  const parts = (host ?? "").split(".");
  const firstPart = parts[0] ?? "";

  const response = applyAuthResponse(request, authkitHeaders);

  // Prevent browser from caching authenticated pages — ensures back button
  // always hits the server (and middleware) rather than serving a stale page
  // after logout.
  if (isProtected) {
    response.headers.set(
      "Cache-Control",
      "private, no-store, no-cache, must-revalidate, max-age=0"
    );
    response.headers.set("Pragma", "no-cache");
  }

  if (parts.length >= 3 || (parts.length === 2 && !firstPart.includes("localhost"))) {
    if (firstPart !== "www" && firstPart !== "app" && firstPart !== "") {
      response.headers.set("x-tenant-slug", firstPart);
    }
  }

  // 5. Pass impersonation flag to response headers for server components
  const isImpersonating = request.cookies.get("edumyles_impersonating")?.value === "true";
  if (isImpersonating) {
    response.headers.set("x-impersonating", "true");
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/portal/:path*",
    "/platform/:path*",
    "/support/:path*",
    "/student/:path*",
  ],
};
