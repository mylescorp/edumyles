import { NextRequest, NextResponse } from "next/server";
import {
  clearImpersonationCookieOptions,
  getVerifiedSession,
  hasSameOriginRequest,
  impersonationCookieOptions,
  isPlatformAdministrator,
} from "@/lib/server/impersonation";

/**
 * POST /api/impersonation/exit
 * Restores the admin's original session cookies by moving
 * edumyles_admin_session → edumyles_session and clearing impersonation flags.
 */
export async function POST(req: NextRequest) {
  if (!hasSameOriginRequest(req)) {
    return NextResponse.json(
      { success: false, message: "We could not process that request. Please refresh the page and try again." },
      { status: 403 }
    );
  }

  const adminSession = req.cookies.get("edumyles_admin_session")?.value;
  const impersonationSession = req.cookies.get("edumyles_session")?.value;
  if (!adminSession || !impersonationSession) {
    return NextResponse.json(
      { success: false, message: "There is no impersonation session to exit." },
      { status: 400 }
    );
  }

  try {
    const [admin, impersonation] = await Promise.all([
      getVerifiedSession(adminSession),
      getVerifiedSession(impersonationSession),
    ]);

    if (!admin || !isPlatformAdministrator(admin.role) || !impersonation?.impersonatedBy) {
      return NextResponse.json(
        { success: false, message: "We could not restore your session. Please sign in again." },
        { status: 401 }
      );
    }

    const remainingSeconds = Math.max(0, Math.floor((admin.expiresAt - Date.now()) / 1000));
    if (remainingSeconds === 0) {
      return NextResponse.json(
        { success: false, message: "Your session has expired. Please sign in to continue." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("edumyles_session", admin.sessionToken, impersonationCookieOptions(remainingSeconds));
    response.cookies.set("edumyles_role", admin.role, impersonationCookieOptions(remainingSeconds));
    response.cookies.set("edumyles_admin_session", "", clearImpersonationCookieOptions());
    response.cookies.set("edumyles_impersonating", "", clearImpersonationCookieOptions());

    return response;
  } catch (error) {
    console.error("[api/impersonation/exit] Session verification failed", error);
    return NextResponse.json(
      { success: false, message: "We could not restore your session. Please sign in again." },
      { status: 500 }
    );
  }
}
