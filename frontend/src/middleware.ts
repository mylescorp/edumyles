import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/auth/login", "/auth/callback", "/api/webhooks"];
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "edumyles.com";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host") ?? "";

  // Strip port for local dev
  const host = hostname.replace(/:.*/, "");

  // Resolve tenant slug from subdomain
  const isLocalDev = host === "localhost";
  const isRootDomain = host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`;
  const slug = isLocalDev || isRootDomain
    ? null
    : host.replace(`.${ROOT_DOMAIN}`, "");

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => url.pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for session cookie
  const session = req.cookies.get("edumyles_session");
  if (!session) {
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Inject tenant slug into header for server components
  const response = NextResponse.next();
  if (slug) {
    response.headers.set("x-tenant-slug", slug);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|images).*)",
  ],
};
