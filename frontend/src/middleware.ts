import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "edumyles_session";
const ROLE_COOKIE = "edumyles_role";

const ROUTE_ROLE_RULES: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/platform", roles: ["master_admin", "super_admin"] },
  {
    prefix: "/admin",
    roles: [
      "school_admin",
      "principal",
      "bursar",
      "hr_manager",
      "librarian",
      "transport_manager",
      "master_admin",
      "super_admin",
    ],
  },
  { prefix: "/portal/admin", roles: ["school_admin", "principal", "master_admin", "super_admin"] },
  { prefix: "/portal/teacher", roles: ["teacher"] },
  { prefix: "/portal/student", roles: ["student"] },
  { prefix: "/portal/parent", roles: ["parent"] },
  { prefix: "/portal/alumni", roles: ["alumni"] },
  { prefix: "/portal/partner", roles: ["partner"] },
  {
    prefix: "/support/tickets",
    roles: ["teacher", "student", "parent", "alumni", "partner", "school_admin", "principal"],
  },
];

function normalizeRole(role?: string | null) {
  if (!role) return null;
  return role === "platform_admin" ? "super_admin" : role;
}

function getRoleDashboard(role: string | null) {
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
    case "student":
      return "/portal/student";
    case "parent":
      return "/portal/parent";
    case "alumni":
      return "/portal/alumni";
    case "partner":
      return "/portal/partner";
    default:
      return "/auth/login";
  }
}

function getMatchingRule(pathname: string) {
  return ROUTE_ROLE_RULES.find(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)
  );
}

export function middleware(request: NextRequest) {
  const rule = getMatchingRule(request.nextUrl.pathname);

  if (!rule) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  const role = normalizeRole(request.cookies.get(ROLE_COOKIE)?.value);

  if (!sessionToken) {
    const loginUrl = new URL("/auth/login/api", request.url);
    loginUrl.searchParams.set(
      "returnTo",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(loginUrl);
  }

  if (!role || !rule.roles.includes(role)) {
    const destination = new URL(getRoleDashboard(role), request.url);
    destination.searchParams.set("deniedFrom", request.nextUrl.pathname);
    return NextResponse.redirect(destination);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/platform/:path*", "/admin/:path*", "/portal/:path*", "/support/tickets/:path*"],
};

