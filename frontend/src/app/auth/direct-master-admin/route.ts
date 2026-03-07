import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(convexUrl);
}

/**
 * GET /auth/direct-master-admin
 *
 * Development / demo bypass route.
 * Creates a master_admin session in Convex and redirects to /platform.
 * No WorkOS authentication is required.
 */
export async function GET(req: NextRequest) {
  // SECURITY: Block this route in production
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_BYPASS !== "true") {
    return NextResponse.json(
      { error: "Access denied: Development bypass is disabled in production" },
      { status: 403 }
    );
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_CONVEX_URL is not configured" },
      { status: 500 }
    );
  }

  const masterEmail = process.env.MASTER_ADMIN_EMAIL ?? "admin@edumyles.com";
  const tenantId = process.env.MASTER_TENANT_ID ?? "PLATFORM";
  const userId = "master-admin-bypass";

  // Generate a cryptographically secure session token
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  try {
    const convex = getConvexClient();
    // Create a session directly in Convex
    await convex.mutation(api.sessions.createSession, {
      sessionToken,
      tenantId,
      userId,
      email: masterEmail,
      role: "master_admin",
      expiresAt: Date.now() + thirtyDays,
    });
  } catch (err) {
    console.error("Failed to create bypass session:", err);
    return NextResponse.json(
      { error: "Failed to create session. Is Convex running?" },
      { status: 500 }
    );
  }

  // Redirect to the platform dashboard
  const response = NextResponse.redirect(new URL("/platform", req.url));

  // Set session cookie (httpOnly so it's used by the server)
  response.cookies.set("edumyles_session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  // Set role cookie (readable by client-side middleware/guards)
  response.cookies.set("edumyles_role", "master_admin", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  return response;
}
