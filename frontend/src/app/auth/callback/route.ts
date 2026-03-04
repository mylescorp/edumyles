import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ?? ""
);

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const stateParam = req.nextUrl.searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth/login?error=missing_code", req.url)
    );
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
    const clientId = process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;

    if (!apiKey || !clientId) {
      return NextResponse.redirect(
        new URL("/auth/login?error=config_error", req.url)
      );
    }

    // Exchange code for user profile via WorkOS SSO API
    const tokenRes = await fetch("https://api.workos.com/sso/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: apiKey,
        grant_type: "authorization_code",
        code,
      }),
    });

    if (!tokenRes.ok) {
      console.error("Token exchange failed:", tokenRes.status, tokenRes.statusText);
      return NextResponse.redirect(
        new URL("/auth/login?error=token_exchange_failed", req.url)
      );
    }

    const authData = await tokenRes.json();

    // WorkOS SSO returns profile directly
    const profile = authData.profile;
    if (!profile) {
      return NextResponse.redirect(
        new URL("/auth/login?error=no_profile", req.url)
      );
    }

    return handleAuthResult(req, profile, signupState);
  } catch {
    return NextResponse.redirect(
      new URL("/auth/login?error=callback_failed", req.url)
    );
  }
}

async function handleAuthResult(
  req: NextRequest,
  profile: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    organization_id?: string;
  },
  signupState: { schoolName?: string }
) {
  const email = profile.email;
  const orgId = profile.organization_id;
  let tenantId: string | undefined;
  let role = "school_admin";

  if (orgId) {
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
    const slug = domain.split(".")[0] || "default";
    const org = await convex.query(api.organizations.getOrgBySubdomain, {
      subdomain: slug,
    });
    if (org) {
      tenantId = org.tenantId;
    } else {
      // Generate a new tenant ID for signup or unrecognized users
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
  } else if (signupState.schoolName) {
    // New signup — default to school_admin for the account creator
    role = "school_admin";
    
    // Create the user record for new signup
    await convex.mutation(api.users.upsertUser, {
      tenantId,
      workosUserId: profile.id,
      email: profile.email,
      firstName: profile.first_name || "",
      lastName: profile.last_name || "",
      role: "school_admin",
      permissions: [], // Default permissions
      eduMylesUserId: `EDU-${profile.id}`, // Generate eduMyles user ID
      organizationId: "" as any, // Will be set by Convex if needed
    });
  } else {
    // Existing user signing in but not found in database - create with default role
    role = "school_admin";
    
    // Create the user record
    await convex.mutation(api.users.upsertUser, {
      tenantId,
      workosUserId: profile.id,
      email: profile.email,
      firstName: profile.first_name || "",
      lastName: profile.last_name || "",
      role: "school_admin",
      permissions: [], // Default permissions
      eduMylesUserId: `EDU-${profile.id}`, // Generate eduMyles user ID
      organizationId: "" as any, // Will be set by Convex if needed
    });
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
  
  // Debug logging
  console.log("Auth callback debug:", {
    email,
    tenantId,
    role,
    dashboardPath,
    existingUser: !!existingUser,
    signupState: signupState.schoolName ? "signup" : "signin"
  });

  const response = NextResponse.redirect(new URL(dashboardPath, req.url));

  // Set session cookie
  response.cookies.set("edumyles_session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  // Set role cookie (non-httpOnly so middleware can read it for RBAC)
  response.cookies.set("edumyles_role", role, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  return response;
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
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
