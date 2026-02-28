import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = ["/admin", "/dashboard", "/portal", "/platform"];
const PUBLIC_ROUTES = ["/auth/login", "/auth/callback"];

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("edumyles_session");
  const role = request.cookies.get("edumyles_role")?.value;

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // Redirect unauthenticated users from protected routes to login
  if (isProtected && !session) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from login to their role dashboard
  if (isPublic && session && pathname === "/auth/login") {
    const dashboard = getRoleDashboard(role ?? "school_admin");
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  // Redirect root to role-based dashboard for authenticated users
  if (pathname === "/" && session) {
    const dashboard = getRoleDashboard(role ?? "school_admin");
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  // Extract tenant slug from subdomain and inject as header
  const host = request.headers.get("host") ?? "";
  const parts = host.split(".");
  const response = NextResponse.next();

  if (parts.length >= 3 || (parts.length === 2 && !parts[0].includes("localhost"))) {
    const tenantSlug = parts[0];
    if (tenantSlug !== "www" && tenantSlug !== "app") {
      response.headers.set("x-tenant-slug", tenantSlug);
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
