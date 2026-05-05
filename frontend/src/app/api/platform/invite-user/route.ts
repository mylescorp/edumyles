import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

/**
 * POST /api/platform/invite-user
 *
 * Creates a platform invite record in Convex and immediately queues the
 * production Resend email from the backend. The returned acceptance URL is
 * still useful for support fallback and manual sharing.
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
      roleName: string;
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
      const message = convexErr?.message ?? String(convexErr);
      if (message.includes("CONFLICT")) {
        return NextResponse.json(
          { error: "A user with this email already exists on the platform." },
          { status: 409 }
        );
      }
      console.error("[invite-user] Convex error:", message);
      return NextResponse.json({ error: "Failed to create invite record" }, { status: 500 });
    }

    const acceptUrl = `${req.nextUrl.origin}/platform/invite/accept?token=${convexResult.token}`;

    return NextResponse.json({
      success: true,
      emailSent: true,
      inviteId: convexResult.inviteId,
      token: convexResult.token,
      signUpUrl: acceptUrl,
      roleName: convexResult.roleName,
    });
  } catch (error: any) {
    console.error("[invite-user] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
