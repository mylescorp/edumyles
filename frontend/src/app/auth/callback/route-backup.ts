import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  console.log("Callback received:", req.url);
  
  const code = req.nextUrl.searchParams.get("code");
  const stateParam = req.nextUrl.searchParams.get("state");

  console.log("Code present:", !!code);
  console.log("State present:", !!stateParam);

  if (!code) {
    console.log("No code provided, redirecting to login");
    return NextResponse.redirect(
      new URL("/auth/login?error=missing_code", req.url)
    );
  }

  try {
    // For now, just create a simple session and redirect to test
    const sessionToken = generateSessionToken();
    const userData = {
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      role: "school_admin",
      tenantId: "TEST-TENANT"
    };

    const response = NextResponse.redirect(new URL("/admin", req.url));

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

    // Set role cookie
    response.cookies.set("edumyles_role", userData.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    console.log("Redirecting to /admin with session");
    return response;
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(
      new URL("/auth/login?error=callback_failed", req.url)
    );
  }
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
