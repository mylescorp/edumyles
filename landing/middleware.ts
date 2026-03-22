import { NextRequest, NextResponse } from "next/server";
import {
  buildPostAuthRedirectUrl,
  getRoleDashboardPath,
  sanitizeReturnTo,
} from "./src/lib/auth";

// These paths belong to the frontend app — always redirect to it
const APP_PREFIXES = ["/admin", "/portal", "/platform"];
const AUTH_PAGES = ["/auth/login", "/auth/signup"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionToken = request.cookies.get("edumyles_session")?.value;
  const role = request.cookies.get("edumyles_role")?.value || "school_admin";
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL || "";

  // Any /admin, /platform, /portal hit on the landing domain should go to the frontend app
  const isAppRoute = APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isAppRoute) {
    if (!appOrigin) {
      // No app URL configured — show auth error
      return NextResponse.redirect(new URL("/auth/error?reason=not_configured", request.url));
    }
    if (!sessionToken) {
      // Not authenticated — send to login with returnTo so they land in the right place after auth
      const returnTo = sanitizeReturnTo(`${pathname}${search}`, getRoleDashboardPath(role));
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("returnTo", returnTo);
      return NextResponse.redirect(loginUrl);
    }
    // Authenticated — forward to the frontend app
    return NextResponse.redirect(new URL(`${pathname}${search}`, appOrigin));
  }

  if (sessionToken && AUTH_PAGES.includes(pathname)) {
    // Redirect to the frontend app, not the landing domain
    return NextResponse.redirect(
      buildPostAuthRedirectUrl({
        origin: appOrigin || request.nextUrl.origin,
        role,
      })
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/platform", "/platform/:path*", "/portal", "/portal/:path*", "/auth/login", "/auth/signup"],
};
