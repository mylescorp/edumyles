import { NextRequest, NextResponse } from "next/server";

// ── Route Classification ──────────────────────────────────────
const PROTECTED_ROUTES = ["/admin", "/dashboard", "/portal", "/platform", "/student"];
const PUBLIC_ROUTES = ["/auth/callback", "/auth/error", "/auth/pending"];

// Master admin emails — these always get master_admin role regardless of the
// stored cookie value (handles legacy sessions where role was set before DB sync).
const MASTER_ADMIN_EMAILS = [
  process.env.MASTER_ADMIN_EMAIL,
  "ayany004@gmail.com",
]
  .filter((v): v is string => Boolean(v))
  .map((v) => v.toLowerCase());

function isMasterAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return MASTER_ADMIN_EMAILS.includes(email.toLowerCase());
}

// ── RBAC: Which roles can access which route prefixes ─────────
const ROUTE_ROLE_MAP: Record<string, string[]> = {
  "/platform": ["master_admin", "super_admin"],
  "/admin": [
    "school_admin", "principal", "bursar", "hr_manager",
    "librarian", "transport_manager", "master_admin", "super_admin",
  ],
  "/portal/teacher": ["teacher", "master_admin", "super_admin", "school_admin", "principal"],
  "/portal/student": ["student", "master_admin", "super_admin", "school_admin", "principal", "teacher"],
  "/portal/parent": ["parent", "master_admin", "super_admin", "school_admin", "principal"],
  "/portal/alumni": ["alumni", "master_admin", "super_admin", "school_admin"],
  "/portal/partner": ["partner", "master_admin", "super_admin", "school_admin"],
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
  switch (role) {
    case "master_admin":
    case "super_admin":
      return "/platform";
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 0. IP blocking enforcement ────────────────────────────────
  // Skip the check for the blocked-ips endpoint itself and static assets
  const isStaticAsset = pathname.startsWith("/_next") || pathname.startsWith("/favicon");
  if (!isStaticAsset) {
    const clientIP = getClientIP(request);
    if (clientIP && clientIP !== "unknown") {
      const blocked = await getBlockedIPs();
      if (blocked.has(clientIP)) {
        return new NextResponse(
          JSON.stringify({ error: "Access denied", code: "IP_BLOCKED" }),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json",
              "X-Blocked-IP": clientIP,
            },
          }
        );
      }
    }
  }

  // Dev bypass — skip ALL auth checks. Only allowed outside production to prevent
  // the redirect loop: /admin → login → bypass → /admin → login → ...
  if (
    process.env.ENABLE_DEV_AUTH_BYPASS === "true" &&
    process.env.NODE_ENV !== "production"
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get("edumyles_session");
  let role = request.cookies.get("edumyles_role")?.value;

  // Override role for known master admins — handles sessions created before role
  // was correctly set in DB (cookie may still say "school_admin").
  try {
    const userCookie = request.cookies.get("edumyles_user")?.value;
    if (userCookie) {
      const user = JSON.parse(userCookie);
      if (isMasterAdminEmail(user?.email)) {
        role = "master_admin";
      }
    }
  } catch {
    // Malformed cookie — ignore; fall back to raw role cookie
  }

  // Debug logging for protected routes
  if (pathname.startsWith("/platform") || pathname.startsWith("/admin")) {
    console.log(`[middleware] ${pathname} - session: ${session ? "present" : "missing"}, role: ${role || "none"}`);
  }

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // 0b. Maintenance mode
  const maintenanceMode = request.cookies.get("edumyles_maintenance")?.value === "true";
  if (maintenanceMode && !pathname.startsWith("/platform") && !pathname.startsWith("/maintenance") && !pathname.startsWith("/auth")) {
    const isPlatformAdmin = role === "master_admin" || role === "super_admin";
    if (!isPlatformAdmin) {
      return NextResponse.redirect(new URL("/maintenance", request.url));
    }
  }

  // 1. Unauthenticated → login
  if (isProtected && !session) {
    console.log(`[middleware] Redirecting unauthenticated user from ${pathname} to login`);
    const loginUrl = new URL("/auth/login/api", request.nextUrl.origin);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Root redirect
  if (pathname === "/" && session) {
    return NextResponse.redirect(new URL(getRoleDashboard(role ?? "school_admin"), request.url));
  }

  // 3. RBAC enforcement
  if (isProtected && session && role) {
    if (!isRoleAllowedForPath(pathname, role)) {
      const correctDashboard = getRoleDashboard(role);
      if (!pathname.startsWith(correctDashboard)) {
        const redirectUrl = new URL(correctDashboard, request.url);
        redirectUrl.searchParams.set("error", "unauthorized");
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // 4. Tenant slug from subdomain
  const host = request.headers.get("host") ?? "";
  const parts = host.split(".");
  const firstPart = parts[0] ?? "";

  const response = NextResponse.next();

  // Prevent browser from caching authenticated pages — ensures back button
  // always hits the server (and middleware) rather than serving a stale page
  // after logout.
  if (isProtected) {
    response.headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate, max-age=0");
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
    "/",
    "/admin/:path*",
    "/dashboard/:path*",
    "/portal/:path*",
    "/platform/:path*",
    "/auth/:path*",
    "/student/:path*",
    "/api/auth/:path*",
    "/api/waitlist/:path*",
    "/api/tenants/:path*",
  ],
};
