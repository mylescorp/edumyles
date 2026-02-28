import { WorkOS } from "@workos-inc/node";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import crypto from "crypto";

const workos = new WorkOS(process.env.WORKOS_API_KEY!);
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Temporary: derive tenantId from email domain until WorkOS org mapping is done
function deriveTenantId(email: string): string {
  const domain = email.split("@")[1] ?? "unknown";
  const hash = crypto.createHash("md5").update(domain).digest("hex").slice(0, 6).toUpperCase();
  return `TENANT-${hash}`;
}

// Temporary: assign role (replace with DB lookup once user table exists)
function deriveRole(email: string): string {
  if (email === process.env.MASTER_ADMIN_EMAIL) return "master_admin";
  return "school_admin"; // default for now
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") ?? "/admin";

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  try {
    const { user, accessToken } = await workos.userManagement.authenticateWithCode({
      clientId: process.env.WORKOS_CLIENT_ID!,
      code,
    });

    console.log("✅ WorkOS auth success:", user.email);

    // Build EduMyles session
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const tenantId = deriveTenantId(user.email);
    const role = deriveRole(user.email);
    const userId = `${tenantId}-ADM-000001`; // temp — replace with DB lookup
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days

    // Persist session in Convex
    await convex.mutation(api.sessions.createSession, {
      sessionToken,
      tenantId,
      userId,
      email: user.email,
      role,
      expiresAt,
    });

    console.log(`✅ Convex session created | tenant: ${tenantId} | role: ${role}`);

    // Set secure session cookie
    const response = NextResponse.redirect(new URL(next, request.url));
    response.cookies.set("edumyles-session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("❌ Auth failed:", error);
    return NextResponse.redirect(new URL("/auth/login?error=auth_failed", request.url));
  }
}
