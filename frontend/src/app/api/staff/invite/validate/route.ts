import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ error: "Convex not configured" }, { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);
    const invite = await convex.query(api.staffInvites.getStaffInviteByToken, { token });

    if (!invite) {
      return NextResponse.json({ error: "Invalid staff invitation" }, { status: 404 });
    }

    return NextResponse.json({ invite });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to validate invite" },
      { status: 500 }
    );
  }
}
