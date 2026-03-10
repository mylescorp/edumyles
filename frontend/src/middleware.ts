import { NextRequest, NextResponse } from "next/server";

// ── Route Classification ──────────────────────────────────────
const PROTECTED_ROUTES = ["/admin", "/dashboard", "/portal", "/platform"];
const PUBLIC_ROUTES = ["/auth/login", "/auth/callback"];

// ── RBAC: Which roles can access which route prefixes ─────────
const ROUTE_ROLE_MAP: Record<string, string[]> = {
  "/platform": ["super_admin", "admin"],
  "/admin": [
    "school_admin",
    "principal",
    "bursar",
    "hr_manager",
    "librarian",
    "transport_manager",
    "super_admin",
    "admin",
  ],
  "/portal/teacher": [
    "teacher",
    "super_admin",
    "admin",
    "school_admin",
    "principal",
  ],
  "/portal/student": [
    "student",
    "super_admin",
    "admin",
    "school_admin",
    "principal",
    "teacher",
  ],
  "/portal/parent": [
    "parent",
    "super_admin",
    "admin",
    "school_admin",
    "principal",
  ],
  "/portal/alumni": [
    "alumni",
    "super_admin",
    "admin",
    "school_admin",
  ],
  "/portal/partner": [
    "partner",
    "super_admin",
    "admin",
    "school_admin",
  ],
};

// ── Permission-based route protection ───────────────────────────────
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/platform/users": ["user:read"],
  "/platform/users/create": ["user:create"],
  "/platform/users/[userId]/edit": ["user:update"],
  "/platform/tenants": ["tenant:read"],
  "/platform/tenants/create": ["tenant:create"],
  "/platform/tenants/[tenantId]/edit": ["tenant:update"],
  "/platform/tickets": ["ticket:read"],
  "/platform/tickets/create": ["ticket:create"],
  "/platform/tickets/[ticketId]/edit": ["ticket:update"],
  "/platform/crm": ["crm:read"],
  "/platform/crm/create": ["crm:create"],
  "/platform/crm/proposals": ["proposal:create"],
  "/platform/communications": ["communication:read"],
  "/platform/communications/create": ["communication:create"],
  "/platform/billing": ["billing:read"],
  "/platform/analytics": ["analytics:read"],
  "/platform/feature-flags": ["feature_flag:read"],
  "/platform/marketplace": ["marketplace:read"],
  "/platform/staff-performance": ["staff_performance:read"],
  "/platform/impersonation": ["impersonate:user"],
  "/platform/settings": ["system:config"],
};

function getRoleDashboard(role: string): string {
  switch (role) {
    case "super_admin":
    case "admin":
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
  const sortedPrefixes = Object.keys(ROUTE_ROLE_MAP).sort(
    (a, b) => b.length - a.length
  );

  for (const prefix of sortedPrefixes) {
    if (pathname.startsWith(prefix)) {
      const allowedRoles = ROUTE_ROLE_MAP[prefix];
      return allowedRoles ? allowedRoles.includes(role) : true;
    }
  }

  return true;
}

function hasRequiredPermissions(pathname: string, userPermissions: string[]): boolean {
  const requiredPermissions = ROUTE_PERMISSIONS[pathname];
  if (!requiredPermissions) return true; // No specific permissions required
  
  return requiredPermissions.some(permission => 
    userPermissions.includes(permission) || 
    userPermissions.includes("all:access")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("edumyles_session");
  const role = request.cookies.get("edumyles_role")?.value;
  const permissions = request.cookies.get("edumyles_permissions")?.value?.split(',') || [];

  // Development bypass - skip middleware for admin routes in development
  if (process.env.NODE_ENV === "development" && pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // 1. Redirect unauthenticated users from protected routes to auth (landing when NEXT_PUBLIC_AUTH_BASE_URL is set)
  if (isProtected && !session) {
    const authBase =
      process.env.NEXT_PUBLIC_AUTH_BASE_URL || request.nextUrl.origin;
    const loginUrl = new URL("/auth/login", authBase);
    loginUrl.searchParams.set("next", request.url);
    return NextResponse.redirect(loginUrl.toString());
  }

  // 2. Redirect authenticated users away from auth pages to dashboard
  if (isPublic && session && pathname === "/auth/login") {
    const dashboard = getRoleDashboard(role ?? "school_admin");
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  // 3. Redirect root to role-based dashboard
  if (pathname === "/" && session) {
    const dashboard = getRoleDashboard(role ?? "school_admin");
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  // 4. RBAC enforcement - Role-based access
  if (isProtected && session && role) {
    if (!isRoleAllowedForPath(pathname, role)) {
      const correctDashboard = getRoleDashboard(role);
      if (!pathname.startsWith(correctDashboard)) {
        const redirectUrl = new URL(correctDashboard, request.url);
        redirectUrl.searchParams.set("error", "unauthorized");
        return NextResponse.redirect(redirectUrl);
      }
    }
    
    // 5. Permission-based access control
    if (!hasRequiredPermissions(pathname, permissions)) {
      const redirectUrl = new URL("/unauthorized", request.url);
      redirectUrl.searchParams.set("error", "insufficient_permissions");
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 6. Extract tenant slug from subdomain
  const host = request.headers.get("host") ?? "";
  const parts = host.split(".");
  const response = NextResponse.next();

  const firstPart = parts[0] ?? "";
  if (parts.length >= 3 || (parts.length === 2 && !firstPart.includes("localhost"))) {
    if (firstPart !== "www" && firstPart !== "app" && firstPart !== "") {
      response.headers.set("x-tenant-slug", firstPart);
    }
  }

  // 7. Add security headers
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");

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
