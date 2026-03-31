import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";

/**
 * POST /api/platform/invite-user
 *
 * 1. Creates a Convex user record (pending WorkOS ID).
 * 2. Tries to send a WorkOS invitation email.
 * 3. Always returns a direct sign-up URL the admin can share manually,
 *    so the invitee can sign up even if the email didn't arrive.
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

    // ── 1. Create Convex record ───────────────────────────────────────────────
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
        userId: convexResult.userId,
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
        userId: convexResult.userId,
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
        userId: convexResult.userId,
        signUpUrl,
        workosError: errCode ? `${errCode}: ${errMsg}` : errMsg,
      });
    }
  } catch (err: any) {
    console.error("[invite-user] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
