import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

/**
 * POST /api/platform/invite-user
 *
 * Creates a platform admin user in Convex (with a pending WorkOS ID) and
 * sends a real WorkOS invitation email so the invitee can set a password and
 * sign in.  On first sign-in the auth callback will link the real WorkOS ID to
 * the pending Convex record.
 *
 * Body: { email, firstName, lastName, role, sessionToken }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, firstName, lastName, role, sessionToken } = body as {
      email: string;
      firstName: string;
      lastName: string;
      role: "master_admin" | "super_admin";
      sessionToken: string;
    };

    if (!email || !firstName || !lastName || !role || !sessionToken) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ── 1. Create the Convex record first (gives us the pending ID) ──────────
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ error: "Convex not configured" }, { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);
    let convexResult: { id: string; userId: string };
    try {
      convexResult = await convex.mutation(
        api.platform.users.mutations.createPlatformAdmin,
        { email, firstName, lastName, role, sessionToken }
      );
    } catch (convexErr: any) {
      const msg: string = convexErr?.message ?? String(convexErr);
      if (msg.includes("CONFLICT")) {
        return NextResponse.json(
          { error: "A user with this email already exists on the platform." },
          { status: 409 }
        );
      }
      console.error("[invite-user] Convex error:", msg);
      return NextResponse.json({ error: "Failed to create user record" }, { status: 500 });
    }

    // ── 2. Send the WorkOS invitation email ──────────────────────────────────
    const workosApiKey = process.env.WORKOS_API_KEY;
    if (!workosApiKey) {
      console.warn("[invite-user] WORKOS_API_KEY not set — invitation email not sent");
      return NextResponse.json({
        success: true,
        emailSent: false,
        userId: convexResult.userId,
        workosError: "WORKOS_API_KEY environment variable is not set on this deployment. Add it in Vercel → Project Settings → Environment Variables.",
      });
    }

    const workos = new WorkOS(workosApiKey);

    try {
      const invitation = await workos.userManagement.sendInvitation({
        email,
        expiresInDays: 7,
      });
      console.info("[invite-user] WorkOS invitation sent:", invitation.id, "state:", invitation.state);
    } catch (workosErr: any) {
      const errMsg: string =
        workosErr?.rawData?.message ??
        workosErr?.message ??
        String(workosErr);
      const errCode: string = workosErr?.rawData?.code ?? workosErr?.code ?? "";
      console.error("[invite-user] WorkOS sendInvitation failed:", errCode, errMsg);
      return NextResponse.json({
        success: true,
        emailSent: false,
        userId: convexResult.userId,
        workosError: errCode ? `${errCode}: ${errMsg}` : errMsg,
      });
    }

    return NextResponse.json({
      success: true,
      emailSent: true,
      userId: convexResult.userId,
    });
  } catch (err: any) {
    console.error("[invite-user] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
