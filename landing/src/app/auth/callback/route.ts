import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";

const MASTER_ADMIN_EMAIL = process.env.MASTER_ADMIN_EMAIL ?? "ayany004@gmail.com";

function resolveRole(email: string, _orgId?: string): string {
  if (
    MASTER_ADMIN_EMAIL &&
    email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()
  ) {
    return "master_admin";
  }
  return "school_admin";
}

/** Returns the dashboard path for the role (e.g. /platform, /admin). */
function getRoleDashboardPath(role: string): string {
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

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");
  const errorDescription = request.nextUrl.searchParams.get("error_description");
  const baseUrl = request.nextUrl.origin;

  if (error) {
    console.error("[auth/callback] WorkOS error:", error, errorDescription);
    return NextResponse.redirect(
      `${baseUrl}/auth/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/auth/login?error=no_code`);
  }

  let signupState: { schoolName?: string } = {};
  if (stateParam) {
    try {
      signupState = JSON.parse(
        Buffer.from(stateParam, "base64url").toString("utf-8")
      );
    } catch {
      // ignore invalid state
    }
  }

  const apiKey = process.env.WORKOS_API_KEY;
  const clientId =
    process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID || process.env.WORKOS_CLIENT_ID;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  // Debug logging for production
  console.log("[auth/callback] Environment check:", {
    hasApiKey: !!apiKey,
    hasClientId: !!clientId,
    hasConvexUrl: !!convexUrl,
    redirectUri: process.env.WORKOS_REDIRECT_URI,
    publicRedirectUri: process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
  });

  if (!apiKey || !clientId) {
    console.error("[auth/callback] Missing WORKOS_API_KEY or WORKOS_CLIENT_ID");
    return NextResponse.redirect(`${baseUrl}/auth/login?error=config_error`);
  }

  try {
    const workos = new WorkOS(apiKey);
    const { user, organizationId } =
      await workos.userManagement.authenticateWithCode({
        code,
        clientId,
      });

    const email = user.email;
    const firstName = user.firstName ?? "";
    const lastName = user.lastName ?? "";
    const workosUserId = user.id;
    const role = resolveRole(email, organizationId ?? undefined);
    const tenantId = organizationId ?? "PLATFORM";

    const sessionToken = crypto.randomBytes(32).toString("hex");
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const isProduction = process.env.NODE_ENV === "production";

    if (convexUrl) {
      try {
        const convex = new ConvexHttpClient(convexUrl);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await convex.mutation((api as any).sessions.createSession, {
          sessionToken,
          tenantId,
          userId: workosUserId,
          email,
          role,
          expiresAt: Date.now() + thirtyDays,
        });
        console.log("[auth/callback] ✅ Session created in Convex");
      } catch (convexErr) {
        console.error("[auth/callback] Convex session creation failed (non-fatal):", convexErr);
        // Continue — cookies will still be set for the cookie-based fallback
      }
    }

    const dashboard = getRoleDashboardPath(role);
    const response = NextResponse.redirect(new URL(dashboard, request.url));

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
        email,
        firstName,
        lastName,
        avatar: user.profilePictureUrl ?? "",
        role,
        tenantId,
        ...(signupState.schoolName ? { schoolName: signupState.schoolName } : {}),
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

    console.log(`[auth/callback] ${email} → ${role} → ${redirectUrl}`);
    return response;
  } catch (err) {
    console.error("[auth/callback] Full error details:", {
      error: err,
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
      name: err instanceof Error ? err.name : undefined,
    });
    const message = err instanceof Error ? err.message : "callback_failed";
    return NextResponse.redirect(
      `${baseUrl}/auth/login?error=${encodeURIComponent(message)}`
    );
  }
}
