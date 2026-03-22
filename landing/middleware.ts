import { NextRequest, NextResponse } from "next/server";
import {
  buildPostAuthRedirectUrl,
  getRoleDashboardPath,
  sanitizeReturnTo,
} from "./src/lib/auth";

// These paths belong to the frontend app — redirect to the frontend when possible
const APP_PREFIXES = ["/admin", "/portal", "/platform"];
const AUTH_PAGES = ["/auth/login", "/auth/signup"];

function isSameDomain(appUrl: string, requestHost: string): boolean {
  try {
    return new URL(appUrl).host === requestHost;
  } catch {
    return true; // Treat invalid URL as same-domain to avoid loops
  }
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionToken = request.cookies.get("edumyles_session")?.value;
  const role = request.cookies.get("edumyles_role")?.value || "school_admin";
  const appOrigin = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  const currentHost = request.nextUrl.host;

  // /admin, /platform, /portal belong to the frontend app
  const isAppRoute = APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isAppRoute) {
    // Only redirect to APP_URL when it's a *different* domain — same-domain would loop
    const canForward = appOrigin && !isSameDomain(appOrigin, currentHost);

    if (!sessionToken) {
      // Not authenticated — send to login
      const returnTo = sanitizeReturnTo(`${pathname}${search}`, getRoleDashboardPath(role));
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("returnTo", returnTo);
      return NextResponse.redirect(loginUrl);
    }

    if (canForward) {
      // Authenticated and frontend is on a different domain — forward there
      return NextResponse.redirect(new URL(`${pathname}${search}`, appOrigin));
    }

    // Authenticated but no separate frontend (same domain or APP_URL not set) — let Next.js handle it
    return NextResponse.next();
  }

  if (sessionToken && AUTH_PAGES.includes(pathname)) {
    // Already logged in — redirect to dashboard
    const dashboardOrigin =
      appOrigin && !isSameDomain(appOrigin, currentHost)
        ? appOrigin
        : request.nextUrl.origin;
    return NextResponse.redirect(
      buildPostAuthRedirectUrl({ origin: dashboardOrigin, role })
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/platform", "/platform/:path*", "/portal", "/portal/:path*", "/auth/login", "/auth/signup"],
};
