import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const COOKIE_CLEAR_OPTIONS = {
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 0,
  expires: new Date(0),
};

const WORKOS_COOKIE_NAME = process.env.WORKOS_COOKIE_NAME || "wos-session";

function clearSessionCookies(response: NextResponse): void {
  response.cookies.set("edumyles_session", "", { ...COOKIE_CLEAR_OPTIONS, httpOnly: true });
  response.cookies.set("edumyles_user", "", { ...COOKIE_CLEAR_OPTIONS, httpOnly: false });
  response.cookies.set("edumyles_role", "", { ...COOKIE_CLEAR_OPTIONS, httpOnly: false });
  response.cookies.set("workos_state", "", { ...COOKIE_CLEAR_OPTIONS, httpOnly: true });
  response.cookies.set(WORKOS_COOKIE_NAME, "", { ...COOKIE_CLEAR_OPTIONS, httpOnly: true });
  response.cookies.set("workos-access-token", "", { ...COOKIE_CLEAR_OPTIONS, httpOnly: true });
}

async function invalidateSession(sessionToken: string): Promise<void> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const serverSecret = process.env.CONVEX_WEBHOOK_SECRET;
  if (!convexUrl) return;
  try {
    const convex = new ConvexHttpClient(convexUrl);
    await convex.mutation(api.sessions.deleteSession, { sessionToken, serverSecret });
  } catch (err) {
    // Log but don't block logout if Convex is unavailable
    console.error("[logout] Failed to invalidate server session:", err);
  }
}

// POST — called by client-side fetch in useAuth.logout()
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("edumyles_session")?.value;
    if (sessionToken) {
      await invalidateSession(sessionToken);
    }

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    clearSessionCookies(response);
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    // Even on error, clear cookies and report success to client
    const response = NextResponse.json({ success: true, message: "Logged out" });
    clearSessionCookies(response);
    return response;
  }
}

// GET — for direct browser navigation to /auth/logout (e.g., bookmarks, links)
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("edumyles_session")?.value;
    if (sessionToken) {
      await invalidateSession(sessionToken);
    }
  } catch {
    // Ignore errors — still redirect to login
  }

  const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL;
  const destination = landingUrl && landingUrl.startsWith("http")
    ? landingUrl
    : new URL("/", request.url).toString();
  const response = NextResponse.redirect(destination);
  clearSessionCookies(response);
  return response;
}
