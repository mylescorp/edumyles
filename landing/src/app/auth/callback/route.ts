import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import { saveSession } from "@workos-inc/authkit-nextjs";
import { ConvexHttpClient } from "convex/browser";
import crypto from "crypto";
import { api } from "@/convex/_generated/api";
import {
  buildPostAuthRedirectUrl,
  decodeAuthState,
  resolveRole,
} from "@/lib/auth";

function clearStateCookie(response: NextResponse) {
  response.cookies.set("workos_state", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");
  const errorDescription = request.nextUrl.searchParams.get("error_description");
  const savedState = request.cookies.get("workos_state")?.value;
  const baseUrl = request.nextUrl.origin;

  if (error) {
    const response = NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
    clearStateCookie(response);
    return response;
  }

  if (!code) {
    const response = NextResponse.redirect(new URL("/auth/login?error=no_code", request.url));
    clearStateCookie(response);
    return response;
  }

  if (savedState && stateParam !== savedState) {
    console.error("[landing auth callback] Invalid WorkOS state");
    const response = NextResponse.redirect(new URL("/auth/login?error=invalid_state", request.url));
    clearStateCookie(response);
    return response;
  }

  const authState = decodeAuthState(stateParam);
  const apiKey = process.env.WORKOS_API_KEY;
  const clientId =
    process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID || process.env.WORKOS_CLIENT_ID;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!apiKey || !clientId || !convexUrl) {
    console.error("[landing auth callback] Missing required environment variables", {
      hasApiKey: !!apiKey,
      hasClientId: !!clientId,
      hasConvexUrl: !!convexUrl,
    });
    const response = NextResponse.redirect(new URL("/auth/login?error=config_error", request.url));
    clearStateCookie(response);
    return response;
  }

  try {
    const workos = new WorkOS(apiKey);
    const convex = new ConvexHttpClient(convexUrl);
    const { user, accessToken, refreshToken, organizationId } =
      await workos.userManagement.authenticateWithCode({
        clientId,
        code,
      });

    const role = resolveRole(user.email, organizationId ?? undefined);
    const tenantId = organizationId ?? "PLATFORM";
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    await convex.mutation(api.sessions.createSession, {
      sessionToken,
      tenantId,
      userId: user.id,
      email: user.email,
      role,
      expiresAt: Date.now() + thirtyDays,
    });

    const redirectUrl = buildPostAuthRedirectUrl({
      origin: baseUrl,
      role,
      returnTo: authState?.returnTo,
    });

    const response = NextResponse.redirect(redirectUrl);

    if (process.env.WORKOS_COOKIE_PASSWORD) {
      await saveSession(response as never, { accessToken, refreshToken } as never);
    }

    response.cookies.set("edumyles_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
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
        avatar: user.profilePictureUrl ?? "",
        role,
        tenantId,
        ...(authState?.schoolName ? { schoolName: authState.schoolName } : {}),
      }),
      {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      }
    );

    response.cookies.set("edumyles_role", role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    clearStateCookie(response);
    return response;
  } catch (err) {
    console.error("[landing auth callback] Authentication failed:", err);
    const message = err instanceof Error ? err.message : "callback_failed";
    const response = NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(message)}`, request.url)
    );
    clearStateCookie(response);
    return response;
  }
}
