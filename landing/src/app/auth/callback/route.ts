import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";
import { getRoleDashboardPath } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MASTER_ADMIN_EMAIL = process.env.MASTER_ADMIN_EMAIL;

function isMasterAdmin(email: string): boolean {
  if (!MASTER_ADMIN_EMAIL) return false;
  return email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
}

function decodeState(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf-8"));
  } catch {
    return {};
  }
}

function authError(req: NextRequest, reason: string): NextResponse {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const currentHost = req.nextUrl.host;
  const appHost = appUrl ? new URL(appUrl).host : currentHost;
  const errorBase = appHost !== currentHost ? appUrl! : req.nextUrl.origin;
  return NextResponse.redirect(`${errorBase}/auth/error?reason=${encodeURIComponent(reason)}`);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const returnedState = req.nextUrl.searchParams.get("state");

  if (error) {
    console.error("[landing/auth/callback] WorkOS error:", error);
    return authError(req, error);
  }

  if (!code) {
    return authError(req, "no_code");
  }

  // ── Forward to frontend app only if it lives on a DIFFERENT domain ─────
  // If APP_URL equals this domain, forwarding would create an infinite loop.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (appUrl) {
    try {
      const appHost = new URL(appUrl).host;
      const currentHost = req.nextUrl.host;
      if (appHost !== currentHost) {
        const params = req.nextUrl.searchParams.toString();
        const target = `${appUrl}/auth/callback${params ? `?${params}` : ""}`;
        console.log("[landing/auth/callback] Forwarding to frontend app:", target);
        return NextResponse.redirect(target);
      }
    } catch {
      // Invalid APP_URL — fall through to local processing
    }
  }

  // ── Process auth locally (same domain or APP_URL not set) ──────────────
  const apiKey = process.env.WORKOS_API_KEY;
  const clientId = process.env.WORKOS_CLIENT_ID || process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!apiKey || !clientId) {
    console.error("[landing/auth/callback] Missing WorkOS env vars");
    return authError(req, "not_configured");
  }

  try {
    const workos = new WorkOS(apiKey);

    const { user, organizationId } = await workos.userManagement.authenticateWithCode({
      clientId,
      code,
    });

    // Determine role — look up in Convex if available, else fall back to env check
    let role = "school_admin";
    let tenantId = organizationId ?? "PLATFORM";

    if (convexUrl) {
      try {
        const convex = new ConvexHttpClient(convexUrl);
        const existing = await convex.query(api.users.getUserByWorkosIdGlobal, {
          workosUserId: user.id,
        });
        if (existing?.role) {
          role = existing.role;
          if (existing.tenantId) tenantId = existing.tenantId;
        } else if (isMasterAdmin(user.email)) {
          role = "master_admin";
          tenantId = "PLATFORM";
        } else {
          const hasMasterAdmin = await convex.query(api.users.hasMasterAdmin, {});
          if (!hasMasterAdmin) {
            role = "master_admin";
            tenantId = "PLATFORM";
          }
        }
      } catch {
        if (isMasterAdmin(user.email)) {
          role = "master_admin";
          tenantId = "PLATFORM";
        }
      }
    } else if (isMasterAdmin(user.email)) {
      role = "master_admin";
      tenantId = "PLATFORM";
    }

    const sessionToken = crypto.randomBytes(32).toString("hex");

    // Persist session in Convex if available
    if (convexUrl) {
      try {
        const convex = new ConvexHttpClient(convexUrl);
        await convex.mutation(api.sessions.createSession, {
          sessionToken,
          tenantId,
          userId: user.id,
          email: user.email,
          role,
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        });
      } catch (err) {
        console.error("[landing/auth/callback] Failed to persist session:", err);
        return authError(req, "callback_failed");
      }
    }

    // Decode returnTo from state
    const stateData = decodeState(returnedState);
    const dashboardPath =
      stateData.returnTo && stateData.returnTo.startsWith("/")
        ? stateData.returnTo
        : getRoleDashboardPath(role);

    console.log(`[landing/auth/callback] ✅ ${user.email} → ${role} → ${dashboardPath}`);

    const isProduction = process.env.NODE_ENV === "production";

    // Build the final destination URL:
    // - If APP_URL is a different domain, send the user there (frontend app)
    // - If same domain or not set, stay on the landing's /auth/welcome page
    //   (avoids 404s since the dashboard routes don't exist on the landing)
    const currentHost = req.nextUrl.host;
    const isCrossDomain =
      appUrl &&
      (() => {
        try {
          return new URL(appUrl).host !== currentHost;
        } catch {
          return false;
        }
      })();

    const destination = isCrossDomain
      ? `${appUrl}${dashboardPath}`
      : new URL("/auth/welcome", req.url).toString();

    const response = NextResponse.redirect(destination);

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
    response.cookies.set("workos_state", "", { maxAge: 0, path: "/" });

    return response;
  } catch (err) {
    console.error("[landing/auth/callback] ❌ Token exchange failed:", err);
    return authError(req, "callback_failed");
  }
}
