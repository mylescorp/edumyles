import { NextRequest, NextResponse } from "next/server";
import {
  getVerifiedSession,
  hasSameOriginRequest,
  impersonationCookieOptions,
  isPlatformAdministrator,
} from "@/lib/server/impersonation";

/**
 * POST /api/impersonation/switch
 * Body: { impersonationToken }
 *
 * Sets the impersonation session cookies so the browser navigates
 * as the target user. Stores the admin's original session so it can
 * be restored on exit.
 */
export async function POST(req: NextRequest) {
  if (!hasSameOriginRequest(req)) {
    return NextResponse.json(
      { success: false, message: "We could not process that request. Please refresh the page and try again." },
      { status: 403 }
    );
  }

  let impersonationToken: unknown;
  try {
    ({ impersonationToken } = await req.json());
  } catch {
    return NextResponse.json(
      { success: false, message: "We could not process that request. Please try again." },
      { status: 400 }
    );
  }

  if (typeof impersonationToken !== "string" || !impersonationToken) {
    return NextResponse.json(
      { success: false, message: "We could not start impersonation. Please try again." },
      { status: 400 }
    );
  }

  const adminSessionToken = req.cookies.get("edumyles_session")?.value;
  if (!adminSessionToken) {
    return NextResponse.json(
      { success: false, message: "Your session has expired. Please sign in to continue." },
      { status: 401 }
    );
  }

  try {
    const [adminSession, targetSession] = await Promise.all([
      getVerifiedSession(adminSessionToken),
      getVerifiedSession(impersonationToken),
    ]);

    if (!adminSession || !isPlatformAdministrator(adminSession.role)) {
      return NextResponse.json(
        { success: false, message: "You do not have permission to start impersonation." },
        { status: 403 }
      );
    }

    if (!targetSession || !targetSession.impersonatedBy) {
      return NextResponse.json(
        { success: false, message: "This impersonation session is no longer available. Please try again." },
        { status: 400 }
      );
    }

    const maxAge = Math.max(0, Math.floor((targetSession.expiresAt - Date.now()) / 1000));
    if (maxAge === 0) {
      return NextResponse.json(
        { success: false, message: "This impersonation session has expired. Please try again." },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set("edumyles_session", targetSession.sessionToken, impersonationCookieOptions(maxAge));
    response.cookies.set("edumyles_role", targetSession.role, impersonationCookieOptions(maxAge));
    response.cookies.set("edumyles_admin_session", adminSession.sessionToken, impersonationCookieOptions(maxAge));
    response.cookies.set("edumyles_impersonating", "true", impersonationCookieOptions(maxAge));

    return response;
  } catch (error) {
    console.error("[api/impersonation/switch] Session verification failed", error);
    return NextResponse.json(
      { success: false, message: "We could not start impersonation. Please try again." },
      { status: 500 }
    );
  }
}
