import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/impersonation/exit
 * Body: { adminRole }
 *
 * Restores the admin's original session cookies by moving
 * edumyles_admin_session → edumyles_session and clearing impersonation flags.
 */
export async function POST(req: NextRequest) {
  const { adminRole } = await req.json();

  const adminSession = req.cookies.get("edumyles_admin_session")?.value;
  if (!adminSession) {
    return NextResponse.json({ error: "No admin session to restore" }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });

  // Restore original session
  response.cookies.set("edumyles_session", adminSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60, // restore to 8h (standard session length)
  });

  response.cookies.set("edumyles_role", adminRole ?? "master_admin", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });

  // Clear impersonation cookies
  response.cookies.delete("edumyles_admin_session");
  response.cookies.delete("edumyles_impersonating");

  return response;
}
