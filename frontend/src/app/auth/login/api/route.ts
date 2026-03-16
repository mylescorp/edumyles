import { NextRequest, NextResponse } from "next/server";
import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Dev bypass — only when ENABLE_DEV_AUTH_BYPASS=true is explicitly set
    if (process.env.ENABLE_DEV_AUTH_BYPASS === "true") {
      console.log("[auth/login] Dev bypass: redirecting to /admin");
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    const returnTo = req.nextUrl.searchParams.get("returnTo") ?? "/platform";
    
    // Generate CSRF state for consistency with POST
    const state = crypto.randomBytes(16).toString("hex");
    
    const authUrl = await getSignInUrl({ returnTo, state });
    
    const response = NextResponse.redirect(authUrl);
    // Set state cookie for validation on callback
    response.cookies.set("workos_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    
    return response;
  } catch (error) {
    console.error("[auth/login] Failed to build sign-in URL:", error);
    return NextResponse.redirect(
      new URL("/", req.url)
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Dev bypass — only when ENABLE_DEV_AUTH_BYPASS=true is explicitly set
    if (process.env.ENABLE_DEV_AUTH_BYPASS === "true") {
      console.log("[auth/login] Dev bypass: returning /admin");
      return NextResponse.json({ redirectUrl: "/admin" });
    }

    const body = await req.json().catch(() => ({}));
    const email: string | undefined = body?.email;
    const returnTo: string = body?.returnTo ?? "/platform";

    // Generate CSRF state
    const state = crypto.randomBytes(16).toString("hex");
    const authUrl = await getSignInUrl({
      loginHint: email,
      returnTo,
      state,
    });

    const response = NextResponse.json({ authUrl });
    response.cookies.set("workos_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("[auth/login] POST failed:", error);
    const message = error instanceof Error ? error.message : "Auth service unavailable";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
