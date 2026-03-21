import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";

const MASTER_ADMIN_EMAIL = process.env.MASTER_ADMIN_EMAIL;

function isMasterAdmin(email: string): boolean {
  if (!MASTER_ADMIN_EMAIL) return false;
  return email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
}

function getRoleDashboard(role: string): string {
  switch (role) {
    case "master_admin":
    case "super_admin":
      return "/platform";
    case "teacher":
      return "/portal/teacher";
    case "parent":
      return "/portal/parent";
    case "student":
      return "/portal/student";
    case "alumni":
      return "/portal/alumni";
    case "partner":
      return "/portal/partner";
    default:
      return "/admin";
  }
}

function decodeState(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf-8"));
  } catch {
    // state may be a plain hex nonce — not JSON
    return {};
  }
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const returnedState = req.nextUrl.searchParams.get("state");

  if (error) {
    console.error("[auth/callback] WorkOS error:", error);
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(error)}`, req.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?auth_error=no_code", req.url));
  }

  // CSRF: only validate when the cookie is present (same-origin flows).
  // Cross-origin flows (landing → frontend) won't have the cookie — that's OK.
  const savedState = req.cookies.get("workos_state")?.value;
  if (savedState && returnedState !== savedState) {
    console.error("[auth/callback] CSRF state mismatch");
    return NextResponse.redirect(new URL("/?auth_error=invalid_state", req.url));
  }

  const apiKey = process.env.WORKOS_API_KEY;
  const clientId = process.env.WORKOS_CLIENT_ID || process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!apiKey || !clientId || !convexUrl) {
    console.error("[auth/callback] Missing env vars", { apiKey: !!apiKey, clientId: !!clientId, convexUrl: !!convexUrl });
    return NextResponse.redirect(new URL("/?auth_error=config_error", req.url));
  }

  try {
    const workos = new WorkOS(apiKey);
    const convex = new ConvexHttpClient(convexUrl);

    const { user, organizationId } = await workos.userManagement.authenticateWithCode({
      clientId,
      code,
    });

    // Look up existing role from Convex — don't overwrite roles set by admins.
    // Fall back: master_admin if email matches env var, otherwise school_admin.
    let role = "school_admin";
    let tenantId = organizationId ?? "PLATFORM";
    try {
      const existing = await convex.query(api.users.getUserByWorkosId, {
        workosUserId: user.id,
      });
      if (existing?.role) {
        role = existing.role;
        if (existing.tenantId) tenantId = existing.tenantId;
      } else if (isMasterAdmin(user.email)) {
        role = "master_admin";
        tenantId = "PLATFORM";
      }
    } catch {
      // Convex lookup failed — fall back to env-based check
      if (isMasterAdmin(user.email)) {
        role = "master_admin";
        tenantId = "PLATFORM";
      }
    }
    const sessionToken = crypto.randomBytes(32).toString("hex");

    await convex.mutation(api.sessions.createSession, {
      sessionToken,
      tenantId,
      userId: user.id,
      email: user.email,
      role,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    // Use returnTo from state if present, else role dashboard
    const stateData = decodeState(returnedState);
    const returnTo =
      stateData.returnTo && stateData.returnTo.startsWith("/")
        ? stateData.returnTo
        : getRoleDashboard(role);

    console.log(`[auth/callback] ✅ ${user.email} → ${role} → ${returnTo}`);

    const isProduction = process.env.NODE_ENV === "production";
    const response = NextResponse.redirect(new URL(returnTo, req.url));

    response.cookies.set("edumyles_session", sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    response.cookies.set(
      "edumyles_user",
      JSON.stringify({
        email: user.email,
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        role,
        tenantId,
      }),
      {
        httpOnly: false,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      }
    );

    response.cookies.set("edumyles_role", role, {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    // Clear CSRF state cookie
    response.cookies.set("workos_state", "", { maxAge: 0, path: "/" });

    return response;
  } catch (err) {
    console.error("[auth/callback] ❌ Token exchange failed:", err);
    return NextResponse.redirect(new URL("/?auth_error=callback_failed", req.url));
  }
}
