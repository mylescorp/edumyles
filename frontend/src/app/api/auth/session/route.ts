import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { isBypassAllowed } from "@/lib/auth-bypass";

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

    // Fallback for development/demo only when bypass is explicitly allowed.
    const userCookie = req.cookies.get("edumyles_user")?.value;
    const roleCookie = req.cookies.get("edumyles_role")?.value;
    
    if (isBypassAllowed() && userCookie && roleCookie) {
      try {
        const user = JSON.parse(userCookie);
        return NextResponse.json({
          session: {
            sessionToken,
            tenantId: user.tenantId || "PLATFORM",
            userId: user.email, // Use email as userId fallback
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
