import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return null;
  }
  return new ConvexHttpClient(convexUrl);
}

export async function POST(request: NextRequest) {
  try {
    // Read the session token BEFORE clearing cookies so we can invalidate it server-side
    const sessionToken = request.cookies.get("edumyles_session")?.value;

    // Invalidate the session in the database
    if (sessionToken) {
      try {
        const convex = getConvexClient();
        if (convex) {
          await convex.mutation(api.sessions.deleteSession, { sessionToken });
        }
      } catch (err) {
        // Log but don't block logout if Convex is unavailable
        console.error("[logout] Failed to invalidate server session:", err);
      }
    }

    // Clear all session cookies
    const response = NextResponse.json({ success: true, message: "Logged out successfully" });

    response.cookies.set("edumyles_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    response.cookies.set("edumyles_user", "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    response.cookies.set("edumyles_role", "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, message: "Logout failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
