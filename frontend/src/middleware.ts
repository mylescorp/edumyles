import { NextRequest, NextResponse } from "next/server";

// ── Route Classification ──────────────────────────────────────
const PROTECTED_ROUTES = ["/admin", "/dashboard", "/portal", "/platform", "/student"];
const PUBLIC_ROUTES = ["/auth/callback", "/auth/error"];

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

  // Dev bypass — skip ALL auth checks. Only allowed outside production to prevent
  // the redirect loop: /admin → login → bypass → /admin → login → ...
  if (
    process.env.ENABLE_DEV_AUTH_BYPASS === "true" &&
    process.env.NODE_ENV !== "production"
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get("edumyles_session");
  const role = request.cookies.get("edumyles_role")?.value;

  // Debug logging for protected routes
  if (pathname.startsWith("/platform") || pathname.startsWith("/admin")) {
    console.log(`[middleware] ${pathname} - session: ${session ? "present" : "missing"}, role: ${role || "none"}`);
  }

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // 0. Maintenance mode
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
  if (parts.length >= 3 || (parts.length === 2 && !firstPart.includes("localhost"))) {
    if (firstPart !== "www" && firstPart !== "app" && firstPart !== "") {
      response.headers.set("x-tenant-slug", firstPart);
    }
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
    "/student/:path*",
    "/auth/:path*",
    "/student/:path*",
  ],
};
