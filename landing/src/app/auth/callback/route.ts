import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// The WorkOS REDIRECT_URI should point to the main app's /auth/callback.
// This route exists as a safety net: if WorkOS is misconfigured to redirect
// here, forward the code/state to the main app so auth still completes.
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.error("[landing/auth/callback] NEXT_PUBLIC_APP_URL not set");
    return new NextResponse(
      `<!doctype html><html><body style="font-family:sans-serif;padding:2rem;text-align:center">
        <h1>Configuration Error</h1>
        <p>Authentication service is not configured. Please contact your administrator.</p>
      </body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }

  // Forward all query params (code, state, error, etc.) to the main app callback
  const params = req.nextUrl.searchParams.toString();
  const target = `${appUrl}/auth/callback${params ? `?${params}` : ""}`;
  console.log("[landing/auth/callback] Forwarding to main app:", target);
  return NextResponse.redirect(target);
}
