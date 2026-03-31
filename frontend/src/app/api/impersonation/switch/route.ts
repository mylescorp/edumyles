import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/impersonation/switch
 * Body: { impersonationToken, role, adminSessionToken }
 *
 * Sets the impersonation session cookies so the browser navigates
 * as the target user. Stores the admin's original session so it can
 * be restored on exit.
 */
export async function POST(req: NextRequest) {
  const { impersonationToken, role, adminSessionToken } = await req.json();

  if (!impersonationToken || !role || !adminSessionToken) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });

  // Swap edumyles_session → impersonation token
  response.cookies.set("edumyles_session", impersonationToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 2 * 60 * 60, // 2 hours — matches backend TTL
  });

  // Store role for middleware RBAC
  response.cookies.set("edumyles_role", role, {
    httpOnly: false, // read by client-side RBAC
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 2 * 60 * 60,
  });

  // Stash the admin's real session so we can restore it on exit
  response.cookies.set("edumyles_admin_session", adminSessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 2 * 60 * 60,
  });

  // Flag that lets the banner know we're in impersonation mode
  response.cookies.set("edumyles_impersonating", "true", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 2 * 60 * 60,
  });

  return response;
}
