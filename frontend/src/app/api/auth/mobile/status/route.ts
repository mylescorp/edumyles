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
    const requestId = req.nextUrl.searchParams.get("requestId");
    const serverSecret = process.env.CONVEX_WEBHOOK_SECRET;

    if (!requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 });
    }

    if (!serverSecret) {
      return NextResponse.json({ error: "Mobile auth is not configured" }, { status: 500 });
    }

    const convex = getConvexClient();
    const request = await convex.query(api.sessions.getMobileAuthRequest, {
      serverSecret,
      requestId,
    });

    if (!request) {
      return NextResponse.json({ error: "Mobile auth request not found" }, { status: 404 });
    }

    if (request.status === "completed" && request.sessionToken) {
      const session = await convex.query(api.sessions.getSession, {
        sessionToken: request.sessionToken,
        serverSecret,
      });

      if (!session) {
        await convex.mutation(api.sessions.cancelMobileAuthRequest, {
          serverSecret,
          requestId,
        });
        return NextResponse.json({ status: "expired" }, { status: 410 });
      }

      await convex.mutation(api.sessions.consumeMobileAuthRequest, {
        serverSecret,
        requestId,
      });

      return NextResponse.json({
        status: "completed",
        session: {
          sessionToken: session.sessionToken,
          email: session.email,
          role: session.role,
          tenantId: session.tenantId,
          userId: session.userId,
        },
      });
    }

    if (request.status === "expired" || request.expiresAt < Date.now()) {
      return NextResponse.json({ status: "expired" }, { status: 410 });
    }

    if (request.status === "cancelled" || request.status === "consumed") {
      return NextResponse.json({ status: request.status }, { status: 409 });
    }

    return NextResponse.json({
      status: "pending",
      expiresAt: request.expiresAt,
    });
  } catch (error) {
    console.error("[api/auth/mobile/status] Failed to check auth status", error);
    return NextResponse.json({ error: "Failed to check mobile sign-in status" }, { status: 500 });
  }
}
