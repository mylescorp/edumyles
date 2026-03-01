import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ?? ""
);

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth/login?error=missing_code", req.url)
    );
  }

  try {
    const apiKey = process.env.WORKOS_API_KEY;
    const clientId = process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;

    if (!apiKey || !clientId) {
      return NextResponse.redirect(
        new URL("/auth/login?error=config_error", req.url)
      );
    }

    // Exchange code for user profile via WorkOS
    const tokenRes = await fetch(
      "https://api.workos.com/sso/token",
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
        new URL("/auth/login?error=token_exchange_failed", req.url)
      );
    }

    const tokenData = await tokenRes.json();
    const profile = tokenData.profile;

    if (!profile) {
      return NextResponse.redirect(
        new URL("/auth/login?error=no_profile", req.url)
      );
    }

    // Resolve tenant from organization or email domain
    const email: string = profile.email;
    const orgId: string | undefined = profile.organization_id;
    let tenantId: string | undefined;
    let role = "school_admin";

    if (orgId) {
      // Look up organization in Convex to get tenantId
      const org = await convex.query(api.organizations.getOrgBySubdomain, {
        subdomain: orgId,
      });
      if (org) {
        tenantId = org.tenantId;
      }
    }

    // Fallback: derive tenant from email domain
    if (!tenantId) {
      const domain = email.split("@")[1] ?? "";
      // Look up by subdomain matching domain prefix
      const slug = domain.split(".")[0];
      const org = await convex.query(api.organizations.getOrgBySubdomain, {
        subdomain: slug,
      });
      if (org) {
        tenantId = org.tenantId;
      } else {
        // Generate a temporary tenant ID for new users
        tenantId = `TENANT-${Math.floor(100000 + Math.random() * 900000)}`;
      }
    }

    // Look up user to get their actual role
    const existingUser = await convex.query(api.users.getUserByWorkosId, {
      tenantId,
      workosUserId: profile.id,
    });

    if (existingUser) {
      role = existingUser.role;
    }

    // Generate session token
    const sessionToken = generateSessionToken();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    // Create session in Convex
    await convex.mutation(api.sessions.createSession, {
      sessionToken,
      tenantId,
      userId: profile.id,
      email,
      role,
      expiresAt: Date.now() + thirtyDays,
    });

    // Determine redirect based on role
    const dashboardPath = getRoleDashboard(role);

    const response = NextResponse.redirect(new URL(dashboardPath, req.url));

    // Set session cookie
    response.cookies.set("edumyles_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    // Set role cookie (non-httpOnly so middleware can read it)
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
      new URL("/auth/login?error=callback_failed", req.url)
    );
  }
}

function generateSessionToken(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function getRoleDashboard(role: string): string {
  switch (role) {
    case "master_admin":
    case "super_admin":
      return "/platform";
    case "school_admin":
    case "principal":
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
    case "bursar":
      return "/admin";
    case "hr_manager":
      return "/admin";
    case "librarian":
      return "/admin";
    case "transport_manager":
      return "/admin";
    default:
      return "/";
  }
}
