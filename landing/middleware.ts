import { NextRequest, NextResponse } from "next/server";
import {
  buildPostAuthRedirectUrl,
  getRoleDashboardPath,
  sanitizeReturnTo,
} from "./src/lib/auth";

const PROTECTED_PREFIXES = ["/admin", "/portal"];
const AUTH_PAGES = ["/auth/login", "/auth/signup"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionToken = request.cookies.get("edumyles_session")?.value;
  const role = request.cookies.get("edumyles_role")?.value || "school_admin";

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !sessionToken) {
    const returnTo = sanitizeReturnTo(`${pathname}${search}`, getRoleDashboardPath(role));
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(url);
  }

  if (sessionToken && AUTH_PAGES.includes(pathname)) {
    // Redirect to the frontend app, not the landing domain
    const appOrigin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    return NextResponse.redirect(
      buildPostAuthRedirectUrl({
        origin: appOrigin,
        role,
      })
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*", "/auth/login", "/auth/signup"],
};
