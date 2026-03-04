import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";

const MASTER_ADMIN_EMAIL = process.env.MASTER_ADMIN_EMAIL ?? "";

function resolveRole(email: string, _orgId?: string): string {
  if (
    MASTER_ADMIN_EMAIL &&
    email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()
  ) {
    return "master_admin";
  }
  return "school_admin";
}

function getRoleDashboard(role: string): string {
  switch (role) {
    case "master_admin":
    case "super_admin":
      return process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/platform`
        : "/";
    case "teacher":
      return process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/portal/teacher`
        : "/";
    case "parent":
      return process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/portal/parent`
        : "/";
    case "student":
      return process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/portal/student`
        : "/";
    case "alumni":
      return process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/portal/alumni`
        : "/";
    case "partner":
      return process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/portal/partner`
        : "/";
    default:
      return process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/admin`
        : "/";
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
    }

    const dashboard = getRoleDashboard(role);
    const redirectTarget = dashboard.startsWith("http")
      ? dashboard
      : `${baseUrl}${dashboard === "/" ? "" : dashboard}`;
    const response = NextResponse.redirect(redirectTarget);

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

    console.log(`[auth/callback] ${email} → ${role} → ${dashboard}`);
    return response;
  } catch (err) {
    console.error("[auth/callback]", err);
    const message = err instanceof Error ? err.message : "callback_failed";
    return NextResponse.redirect(
      `${baseUrl}/auth/login?error=${encodeURIComponent(message)}`
    );
  }
}
