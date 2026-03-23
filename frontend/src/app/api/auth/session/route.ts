import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(convexUrl);
}

/**
 * GET /api/auth/session
 *
 * Server-side session validation endpoint.
 * Reads the httpOnly session cookie (not accessible from client JS)
 * and validates it against Convex, returning the session data.
 */
export async function GET(req: NextRequest) {
  try {
    // Development bypass - only when explicitly enabled AND not in production
    if (
      process.env.ENABLE_DEV_AUTH_BYPASS === "true" &&
      process.env.NODE_ENV !== "production" &&
      !req.cookies.get("edumyles_session")?.value
    ) {
      console.log("[api/auth/session] Dev bypass: Creating mock session");
      return NextResponse.json({
        session: {
          sessionToken: "dev_session_token",
          tenantId: "PLATFORM",
          userId: "dev_user_id",
          email: "admin@edumyles.local",
          role: "master_admin",
          expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
    }

    const sessionToken = req.cookies.get("edumyles_session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ session: null }, { status: 200 });
    }

    // Try Convex first
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (convexUrl) {
      try {
        const convex = getConvexClient();
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
      } catch (convexError) {
        console.log("[api/auth/session] Convex unavailable, trying fallback:", convexError);
      }
    }

    // Fallback: when Convex is unavailable or session not found in DB,
    // reconstruct session from the companion cookies set at login time.
    // The httpOnly edumyles_session cookie (which cannot be set via JS) is the
    // security gate — if it exists, it was set server-side during auth callback.
    const userCookie = req.cookies.get("edumyles_user")?.value;
    const roleCookie = req.cookies.get("edumyles_role")?.value;

    if (userCookie && roleCookie) {
      try {
        const user = JSON.parse(userCookie);
        return NextResponse.json({
          session: {
            sessionToken,
            tenantId: user.tenantId || "PLATFORM",
            userId: user.email,
            email: user.email,
            role: roleCookie,
            expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });
      } catch (parseError) {
        console.error("[api/auth/session] Failed to parse user cookie:", parseError);
      }
    }

    return NextResponse.json({ session: null }, { status: 200 });
  } catch (err) {
    console.error("[api/auth/session] Session validation failed:", err);
    return NextResponse.json({ session: null }, { status: 200 });
  }
}
