import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    // Validate the invite token
    const invite = await convex.query(api.modules.platform.rbac.validateInviteToken, { token });

    if (!invite) {
      return NextResponse.json({ error: "invalid" }, { status: 404 });
    }

    if (invite.status !== "pending") {
      return NextResponse.json({ error: "used" }, { status: 400 });
    }

    if (invite.expiresAt < Date.now()) {
      return NextResponse.json({ error: "expired" }, { status: 400 });
    }

    // Get role details
    const role = await convex.query(api.modules.platform.rbac.getRoleBySlug, { 
      slug: invite.role 
    });

    return NextResponse.json({ 
      invite: {
        ...invite,
        roleName: role?.name || invite.role,
      }
    });
  } catch (error) {
    console.error("Error validating invite:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
