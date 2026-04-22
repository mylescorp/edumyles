import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

/**
 * POST /api/platform/invite-user
 *
 * 1. Creates a platform invite record in Convex.
 * 2. Tries to send a WorkOS invitation email.
 * 3. Always returns a direct acceptance URL the admin can share manually,
 *    plus the platform invite token for support fallback.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      role,
      department,
      personalMessage,
      sessionToken,
      addedPermissions,
      removedPermissions,
      scopeCountries,
      scopeTenantIds,
      scopePlans,
      accessExpiresAt,
      notifyInviter,
    } = body as {
      email: string;
      role:
        | "master_admin"
        | "super_admin"
        | "platform_manager"
        | "support_agent"
        | "billing_admin"
        | "marketplace_reviewer"
        | "content_moderator"
        | "analytics_viewer";
      department?: string;
      personalMessage?: string;
      sessionToken: string;
      addedPermissions?: string[];
      removedPermissions?: string[];
      scopeCountries?: string[];
      scopeTenantIds?: string[];
      scopePlans?: string[];
      accessExpiresAt?: number;
      notifyInviter?: boolean;
    };

    if (!email || !role || !sessionToken) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ── 1. Create platform invite record ──────────────────────────────────────
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ error: "Convex not configured" }, { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);
    let convexResult: {
      success: boolean;
      inviteId: string;
      token: string;
      email: string;
      roleName: any;
    };
    try {
      convexResult = await convex.mutation(api.modules.platform.rbac.invitePlatformUser, {
        sessionToken,
        email,
        role,
        department: department?.trim() || undefined,
        personalMessage: personalMessage?.trim() || undefined,
        addedPermissions,
        removedPermissions,
        scopeCountries,
        scopeTenantIds,
        scopePlans,
        accessExpiresAt,
        notifyInviter,
      });
    } catch (convexErr: any) {
      const msg: string = convexErr?.message ?? String(convexErr);
      if (msg.includes("CONFLICT")) {
        return NextResponse.json(
          { error: "A user with this email already exists on the platform." },
          { status: 409 }
        );
      }
      console.error("[invite-user] Convex error:", msg);
      return NextResponse.json({ error: "Failed to create invite record" }, { status: 500 });
    }

    const acceptUrl = `${req.nextUrl.origin}/platform/invite/accept?token=${convexResult.token}`;

    // ── 2. Try to send WorkOS invitation email (optional) ───────────────────
    const workosApiKey = process.env.WORKOS_API_KEY;

    if (!workosApiKey) {
      console.warn("[invite-user] WORKOS_API_KEY not set — skipping invitation email");
      return NextResponse.json({
        success: true,
        emailSent: false,
        inviteId: convexResult.inviteId,
        token: convexResult.token,
        signUpUrl: acceptUrl,
        workosError:
          "WORKOS_API_KEY is not set in the frontend Vercel project. Go to Vercel → edumyles-frontend → Settings → Environment Variables and add it.",
      });
    }

    const workos = new WorkOS(workosApiKey);
    try {
      const invitation = await workos.userManagement.sendInvitation({
        email,
        expiresInDays: 7,
      });
      console.info("[invite-user] ✅ WorkOS invitation sent:", invitation.id, invitation.state);

      return NextResponse.json({
        success: true,
        emailSent: true,
        inviteId: convexResult.inviteId,
        token: convexResult.token,
        signUpUrl: acceptUrl,
      });
    } catch (workosErr: any) {
      const errMsg: string = workosErr?.rawData?.message ?? workosErr?.message ?? String(workosErr);
      const errCode: string = workosErr?.rawData?.code ?? workosErr?.code ?? "";
      console.error("[invite-user] WorkOS sendInvitation failed:", errCode, errMsg);

      return NextResponse.json({
        success: true,
        emailSent: false,
        inviteId: convexResult.inviteId,
        token: convexResult.token,
        signUpUrl: acceptUrl,
        workosError: errCode ? `${errCode}: ${errMsg}` : errMsg,
      });
    }
  } catch (err: any) {
    console.error("[invite-user] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
