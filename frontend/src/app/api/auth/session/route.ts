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
    const sessionToken = req.cookies.get("edumyles_session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ session: null }, { status: 200 });
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ session: null }, { status: 200 });
    }

    const convex = getConvexClient();
    const session = await convex.query(api.sessions.getSession, {
      sessionToken,
    });

    if (!session) {
      return NextResponse.json({ session: null }, { status: 200 });
    }

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
  } catch (err) {
    console.error("[api/auth/session] Session validation failed:", err);
    return NextResponse.json({ session: null }, { status: 200 });
  }
}
