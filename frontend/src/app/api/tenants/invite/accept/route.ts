import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(convexUrl);
}

function setSessionCookies(
  response: NextResponse,
  sessionToken: string,
  user: { email: string; firstName?: string; lastName?: string },
  role: string,
  tenantId: string
) {
  const isProduction = process.env.NODE_ENV === "production";

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
      sessionToken,
      userId: user.email,
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
}

export async function POST(request: NextRequest) {
  try {
    const { token, firstName, lastName, phone, password } = await request.json();

    if (!token || !firstName || !lastName || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const convex = getConvexClient();
    const result = await convex.action(api.platform.tenants.actions.acceptTenantInvite, {
      token,
      firstName,
      lastName,
      phone,
      password,
    });

    const sessionToken = crypto.randomUUID();
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const serverSecret = process.env.CONVEX_WEBHOOK_SECRET;
    let sessionProvisioned = false;

    if (serverSecret) {
      try {
        await convex.mutation(api.sessions.createSession, {
          serverSecret,
          sessionToken,
          tenantId: result.tenantId,
          userId: result.userId,
          email: result.email,
          role: result.role,
          expiresAt,
          permissions: ["*"],
          workosUserId: result.workosUserId,
        });
        sessionProvisioned = true;
      } catch (error) {
        console.warn("[api/tenants/invite/accept] Session bootstrap failed, falling back to cookie-only local session:", error);
      }
    }

    const response = NextResponse.json({
      success: true,
      redirectTo: result.redirectTo ?? "/admin/setup",
      tenantId: result.tenantId,
      slug: result.slug,
      sessionProvisioned,
    });

    setSessionCookies(
      response,
      sessionToken,
      {
        email: result.email,
        firstName,
        lastName,
      },
      result.role,
      result.tenantId
    );

    return response;
  } catch (error) {
    console.error("[api/tenants/invite/accept] Failed:", error);
    const message = error instanceof Error ? error.message : "Failed to accept invitation";
    const status =
      message.includes("Invalid invitation") ? 404 :
      message.includes("expired") ? 400 :
      message.includes("already exists") ? 409 :
      500;

    return NextResponse.json({ error: message }, { status });
  }
}
