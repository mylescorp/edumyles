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

export async function POST(req: NextRequest) {
  try {
    const serverSecret = process.env.CONVEX_WEBHOOK_SECRET;
    if (!serverSecret) {
      return NextResponse.json({ error: "Mobile auth is not configured" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const sessionToken = String((body as { sessionToken?: string }).sessionToken ?? "").trim();

    if (!sessionToken) {
      return NextResponse.json({ error: "sessionToken is required" }, { status: 400 });
    }

    const convex = getConvexClient();
    await convex.mutation(api.sessions.deleteSession, {
      sessionToken,
      serverSecret,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/auth/mobile/logout] Failed to revoke session", error);
    return NextResponse.json({ error: "Failed to sign out mobile session" }, { status: 500 });
  }
}
