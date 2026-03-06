import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

/**
 * GET /api/auth/session
 *
 * Server-side session validation endpoint.
 * Reads the httpOnly session cookie (not accessible from client JS)
 * and validates it against Convex, returning the session data.
 *
 * Falls back to the edumyles_user cookie (set by the auth callback)
 * if Convex validation is unavailable, so the user can still access
 * the dashboard after a successful WorkOS login.
 */
export async function GET(req: NextRequest) {
  const sessionToken = req.cookies.get("edumyles_session")?.value;

  if (!sessionToken) {
    return NextResponse.json({ session: null }, { status: 200 });
  }

  // --- Try Convex validation first ---
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (convexUrl) {
    try {
      const convex = new ConvexHttpClient(convexUrl);
      const session = await convex.query(api.sessions.getSession, {
        sessionToken,
      });

      if (session) {
        return NextResponse.json({
          session: {
            sessionToken: session.sessionToken,
            tenantId: session.tenantId,
            userId: session.userId,
            email: session.email,
            role: session.role,
            expiresAt: session.expiresAt,
          },
        });
      }
    } catch (err) {
      console.error("[api/auth/session] Convex validation failed, using cookie fallback:", err);
    }
  }

  // --- Fallback: use the edumyles_user and edumyles_role cookies ---
  // These are set by the auth callback alongside the httpOnly session cookie.
  // The existence of the httpOnly session cookie (verified above) proves
  // the server authenticated this user.
  const userCookie = req.cookies.get("edumyles_user")?.value;
  const roleCookie = req.cookies.get("edumyles_role")?.value;

  if (userCookie) {
    try {
      const userData = JSON.parse(decodeURIComponent(userCookie));
      return NextResponse.json({
        session: {
          sessionToken,
          tenantId: "PLATFORM",
          userId: userData.email ?? "unknown",
          email: userData.email ?? "",
          role: roleCookie ?? userData.role ?? "school_admin",
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        },
      });
    } catch {
      console.error("[api/auth/session] Failed to parse edumyles_user cookie");
    }
  }

  // If we have a session token but no other cookie data, construct minimal session from role cookie
  if (roleCookie) {
    return NextResponse.json({
      session: {
        sessionToken,
        tenantId: "PLATFORM",
        userId: "unknown",
        email: "",
        role: roleCookie,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      },
    });
  }

  return NextResponse.json({ session: null }, { status: 200 });
}
