import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");
  const errorDescription = request.nextUrl.searchParams.get("error_description");
  const baseUrl = request.nextUrl.origin;

  // Handle errors from WorkOS
  if (error) {
    console.error("WorkOS auth error:", error, errorDescription);
    return NextResponse.redirect(
      `${baseUrl}/?auth_error=${encodeURIComponent(errorDescription || error)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=no_code`);
  }

  // Decode signup state if present (contains schoolName from signup flow)
  let signupState: { schoolName?: string } = {};
  if (stateParam) {
    try {
      signupState = JSON.parse(
        Buffer.from(stateParam, "base64url").toString("utf-8")
      );
    } catch {
      // Invalid state — ignore
    }
  }

  try {
    const apiKey = process.env.WORKOS_API_KEY;
    const clientId =
      process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID ||
      process.env.WORKOS_CLIENT_ID;

    if (!apiKey || !clientId) {
      console.error("Missing WorkOS configuration — WORKOS_API_KEY or WORKOS_CLIENT_ID not set");
      return NextResponse.redirect(
        new URL("/auth/login?error=config_error", request.url)
      );
    }

    // Use the official WorkOS SDK to exchange code for user profile
    const workos = new WorkOS(apiKey);
    const authResponse = await workos.userManagement.authenticateWithCode({
      code,
      clientId,
    });

    const user = authResponse.user;
    if (!user) {
      console.error("No user in auth response:", authResponse);
      return NextResponse.redirect(
        new URL("/auth/login?error=no_profile", request.url)
      );
    }

    console.log("WorkOS user received:", user.id, user.email);

    // Build session data
    const sessionToken = generateSessionToken();
    const userData = {
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      avatar: user.profilePictureUrl || "",
      role: "school_admin", // Default role for new users
      tenantId: `TENANT-${Math.floor(100000 + Math.random() * 900000)}`,
      ...(signupState.schoolName ? { schoolName: signupState.schoolName } : {}),
    };

    // Redirect to home after successful authentication
    const dashboardUrl = "/";
    console.log("Redirecting to:", dashboardUrl);

    const response = NextResponse.redirect(new URL(dashboardUrl, request.url));

    // Set session cookie
    response.cookies.set("edumyles_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    // Set user data cookie (non-httpOnly for UI display)
    response.cookies.set("edumyles_user", JSON.stringify(userData), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    // Set role cookie (non-httpOnly so middleware can read it for RBAC)
    response.cookies.set("edumyles_role", userData.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Auth callback error:", err);
    const message =
      err instanceof Error ? err.message : "callback_failed";
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
