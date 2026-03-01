import { NextRequest, NextResponse } from "next/server";

// ── Route Classification ──────────────────────────────────────
const PROTECTED_ROUTES = ["/admin", "/dashboard", "/portal", "/platform"];
const PUBLIC_ROUTES = ["/auth/login", "/auth/signup", "/auth/callback"];

// ── RBAC: Which roles can access which route prefixes ─────────
const ROUTE_ROLE_MAP: Record<string, string[]> = {
  "/platform": ["master_admin", "super_admin"],
  "/admin": [
    "school_admin",
    "principal",
    "bursar",
    "hr_manager",
    "librarian",
    "transport_manager",
    // Platform admins can also access admin panel
    "master_admin",
    "super_admin",
  ],
  "/portal/teacher": [
    "teacher",
    "master_admin",
    "super_admin",
    "school_admin",
    "principal",
  ],
  "/portal/student": [
    "student",
    "master_admin",
    "super_admin",
    "school_admin",
    "principal",
    "teacher",
  ],
  "/portal/parent": [
    "parent",
    "master_admin",
    "super_admin",
    "school_admin",
    "principal",
  ],
  "/portal/alumni": [
    "alumni",
    "master_admin",
    "super_admin",
    "school_admin",
  ],
  "/portal/partner": [
    "partner",
    "master_admin",
    "super_admin",
    "school_admin",
  ],
};

function getRoleDashboard(role: string): string {
  switch (role) {
    case "master_admin":
    case "super_admin":
      return "/platform";
    case "school_admin":
    case "principal":
    case "bursar":
    case "hr_manager":
    case "librarian":
    case "transport_manager":
      return "/admin";
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
  // Check route prefixes from most specific to least specific
  const sortedPrefixes = Object.keys(ROUTE_ROLE_MAP).sort(
    (a, b) => b.length - a.length
  );

  for (const prefix of sortedPrefixes) {
    if (pathname.startsWith(prefix)) {
      const allowedRoles = ROUTE_ROLE_MAP[prefix];
      return allowedRoles ? allowedRoles.includes(role) : true;
    }
  }

  // If no matching route found in RBAC map, deny access by default
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("edumyles_session");
  const role = request.cookies.get("edumyles_role")?.value;

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // ── 1. Redirect unauthenticated users from protected routes ──
  if (isProtected && !session) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 2. Redirect authenticated users from auth pages to dashboard ──
  if (isPublic && session && (pathname === "/auth/login" || pathname === "/auth/signup")) {
    const dashboard = getRoleDashboard(role ?? "school_admin");
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  // ── 3. Redirect root to role-based dashboard ──
  if (pathname === "/" && session) {
    const dashboard = getRoleDashboard(role ?? "school_admin");
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  // ── 4. RBAC enforcement: check role against route access map ──
  if (isProtected && session && role) {
    if (!isRoleAllowedForPath(pathname, role)) {
      // Redirect unauthorized users to their own dashboard
      const correctDashboard = getRoleDashboard(role);
      if (!pathname.startsWith(correctDashboard)) {
        const redirectUrl = new URL(correctDashboard, request.url);
        redirectUrl.searchParams.set("error", "unauthorized");
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // ── 5. Extract tenant slug from subdomain ──
  const host = request.headers.get("host") ?? "";
  const parts = host.split(".");
  const response = NextResponse.next();

  const firstPart = parts[0] ?? "";
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
    "/auth/:path*",
  ],
};
