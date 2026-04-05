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

export async function GET(req: NextRequest) {
  try {
    // Accept token from Authorization header (preferred) or legacy query param
    const authHeader = req.headers.get("authorization") ?? "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    const sessionToken = bearerToken || req.nextUrl.searchParams.get("sessionToken");
    const serverSecret = process.env.CONVEX_WEBHOOK_SECRET;

    if (!sessionToken) {
      return NextResponse.json({ error: "sessionToken is required" }, { status: 400 });
    }

    if (!serverSecret) {
      return NextResponse.json({ error: "Mobile auth is not configured" }, { status: 500 });
    }

    const convex = getConvexClient();
    const session = await convex.query(api.sessions.getSession, {
      sessionToken,
      serverSecret,
    });

    if (!session) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    return NextResponse.json({
      session: {
        sessionToken: session.sessionToken,
        email: session.email,
        role: session.role,
        tenantId: session.tenantId,
        userId: session.userId,
      },
    });
  } catch (error) {
    console.error("[api/auth/mobile/session] Failed to validate session", error);
    return NextResponse.json({ error: "Failed to validate mobile session" }, { status: 500 });
  }
}
