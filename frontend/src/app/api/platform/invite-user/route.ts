import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";

/**
 * POST /api/platform/invite-user
 *
 * 1. Creates a platform invite record in Convex.
 * 2. Tries to send a WorkOS invitation email.
 * 3. Always returns a direct sign-up URL the admin can share manually,
 *    plus the platform invite token for support fallback.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, role, department, personalMessage, sessionToken } = body as {
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
    let convexResult: { success: boolean; inviteId: string; token: string; email: string; roleName: any };
    try {
      convexResult = await convex.mutation(
        api.modules.platform.rbac.invitePlatformUser,
        {
          sessionToken,
          email,
          role,
          department: department?.trim() || undefined,
          personalMessage: personalMessage?.trim() || undefined,
        }
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
      return NextResponse.json({ error: "Failed to create invite record" }, { status: 500 });
    }

    // ── 2. Build a direct WorkOS sign-up URL (always — even without API key) ─
    // This URL lets the invitee sign up without needing the email.
    const workosApiKey = process.env.WORKOS_API_KEY;
    const clientId =
      process.env.WORKOS_CLIENT_ID || process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;
    const redirectUri =
      process.env.WORKOS_REDIRECT_URI ||
      `${req.nextUrl.origin}/auth/callback`;

    let signUpUrl: string | null = null;
    if (workosApiKey && clientId) {
      try {
        const workos = new WorkOS(workosApiKey);
        const nonce = crypto.randomBytes(8).toString("hex");
        signUpUrl = workos.userManagement.getAuthorizationUrl({
          clientId,
          redirectUri,
          provider: "authkit",
          screenHint: "sign-up",
          loginHint: email, // pre-fills the email field
          state: Buffer.from(JSON.stringify({ nonce })).toString("base64url"),
        });
      } catch (urlErr: any) {
        console.warn("[invite-user] Could not build sign-up URL:", urlErr?.message);
      }
    }

    // Fallback: a plain login URL the admin can share
    if (!signUpUrl) {
      signUpUrl = `${req.nextUrl.origin}/auth/login/api`;
    }

    // ── 3. Try to send WorkOS invitation email ────────────────────────────────
    if (!workosApiKey) {
      console.warn("[invite-user] WORKOS_API_KEY not set — skipping invitation email");
      return NextResponse.json({
        success: true,
        emailSent: false,
        inviteId: convexResult.inviteId,
        token: convexResult.token,
        signUpUrl,
        workosError: "WORKOS_API_KEY is not set in the frontend Vercel project. Go to Vercel → edumyles-frontend → Settings → Environment Variables and add it.",
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
        signUpUrl, // always returned so admin has it as backup
      });
    } catch (workosErr: any) {
      const errMsg: string =
        workosErr?.rawData?.message ?? workosErr?.message ?? String(workosErr);
      const errCode: string = workosErr?.rawData?.code ?? workosErr?.code ?? "";
      console.error("[invite-user] WorkOS sendInvitation failed:", errCode, errMsg);

      return NextResponse.json({
        success: true,
        emailSent: false,
        inviteId: convexResult.inviteId,
        token: convexResult.token,
        signUpUrl,
        workosError: errCode ? `${errCode}: ${errMsg}` : errMsg,
      });
    }
  } catch (err: any) {
    console.error("[invite-user] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
