import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import crypto from "crypto";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL ?? "");

function getRoleDashboard(role: string): string {
  switch (role) {
    case "master_admin":
    case "super_admin":
      return "/platform";
    case "school_admin":
    case "principal":
    case "bursar":
    case "hr_manager":
    case "librarian":
    case "transport_manager":
      return "/admin";
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

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Decode signup state if present
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
    const clientId = process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;

    if (!apiKey || !clientId) {
      return NextResponse.redirect(
        new URL("/auth/login?error=config_error", request.url)
      );
    }

    // Exchange code for user profile via WorkOS User Management API
    const tokenRes = await fetch(
      "https://api.workos.com/user-management/authenticate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: apiKey,
          grant_type: "authorization_code",
          code,
        }),
      }
    );

    if (!tokenRes.ok) {
      return NextResponse.redirect(
        new URL("/auth/login?error=token_exchange_failed", request.url)
      );
    }

    const authData = await tokenRes.json();
    const user = authData.user;

    if (!user) {
      return NextResponse.redirect(
        new URL("/auth/login?error=no_profile", request.url)
      );
    }

    // Derive tenant from email domain
    const email: string = user.email;
    const domain = email.split("@")[1] ?? "unknown";
    const hash = crypto
      .createHash("md5")
      .update(domain)
      .digest("hex")
      .slice(0, 6)
      .toUpperCase();
    const tenantId = `TENANT-${hash}`;

    // Determine role — master admin check, then default for new signups
    let role = "school_admin";
    if (email === process.env.MASTER_ADMIN_EMAIL) {
      role = "master_admin";
    } else if (signupState.schoolName) {
      role = "school_admin";
    }

    // Try to look up existing user for their actual role
    try {
      const { api } = await import("../../convex/_generated/api");
      const existingUser = await convex.query(api.users.getUserByWorkosId, {
        tenantId,
        workosUserId: user.id,
      });
      if (existingUser) {
        role = existingUser.role;
      }
    } catch {
      // Convex API not available yet — use derived role
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    // Create session in Convex
    try {
      const { api } = await import("../../convex/_generated/api");
      await convex.mutation(api.sessions.createSession, {
        sessionToken,
        tenantId,
        userId: user.id,
        email,
        role,
        expiresAt: Date.now() + thirtyDays,
      });
    } catch {
      // If Convex is not available, we still set cookies for local dev
    }

    // Redirect to role-based dashboard
    const dashboardPath = getRoleDashboard(role);
    const response = NextResponse.redirect(new URL(dashboardPath, request.url));

    // Set session cookie (unified name: edumyles_session)
    response.cookies.set("edumyles_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    // Set role cookie for middleware RBAC
    response.cookies.set("edumyles_role", role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/auth/login?error=auth_failed", request.url)
    );
  }
}
