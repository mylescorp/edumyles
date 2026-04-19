import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(convexUrl);
}

export async function POST(request: NextRequest) {
  try {
    console.info("[api/tenants/invite/validate] Request received");
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const convex = getConvexClient();
    console.info("[api/tenants/invite/validate] Querying invite", { tokenLength: token.length });
    const invite = await convex.query(api.platform.tenants.queries.getTenantInviteByToken, {
      token,
    });
    console.info("[api/tenants/invite/validate] Query completed", { found: Boolean(invite) });

    if (!invite) {
      return NextResponse.json({ error: "invalid" }, { status: 404 });
    }

    if (invite.isRevoked) {
      return NextResponse.json({ error: "revoked" }, { status: 400 });
    }

    if (invite.isUsed) {
      return NextResponse.json({ error: "used" }, { status: 400 });
    }

    if (invite.isExpired || !invite.isValid) {
      return NextResponse.json({ error: "expired" }, { status: 400 });
    }

    return NextResponse.json({
      invite,
    });
  } catch (error) {
    console.error("[api/tenants/invite/validate] Failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
