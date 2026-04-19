import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const { token, firstName, lastName, password } = await request.json();
    if (!token || !firstName || !lastName || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ error: "Convex not configured" }, { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);
    const result = await convex.action(api.staffInvites.acceptStaffInvite, {
      token,
      firstName,
      lastName,
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
          permissions: [],
          workosUserId: undefined,
        });
        sessionProvisioned = true;
      } catch (error) {
        console.warn("[api/staff/invite/accept] Session bootstrap fallback:", error);
      }
    }

    const response = NextResponse.json({
      success: true,
      redirectTo: result.redirectTo,
      tenantId: result.tenantId,
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
    const message = error instanceof Error ? error.message : "Failed to accept staff invite";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
