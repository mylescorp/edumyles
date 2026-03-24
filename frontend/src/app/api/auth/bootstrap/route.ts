import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";

/**
 * One-time bootstrap: promote the currently signed-in user to master_admin.
 * Only works when NO master_admin exists in the system yet.
 * After the first master_admin exists, this endpoint returns 403.
 */
export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get("edumyles_session")?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json({ error: "Convex not configured" }, { status: 500 });
  }

  const convex = new ConvexHttpClient(convexUrl);

  try {
    // Atomically check + promote in Convex (updates both session and users table)
    try {
      await convex.mutation(api.users.bootstrapMasterAdmin, { sessionToken });
    } catch (err: any) {
      if (err?.message?.includes("UNAUTHENTICATED")) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
      }
      if (err?.message?.includes("ALREADY_EXISTS")) {
        return NextResponse.json(
          { error: "A master admin already exists. Contact them to grant you access." },
          { status: 403 }
        );
      }
      throw err;
    }

    // Update the response cookies
    const response = NextResponse.json({ success: true, role: "master_admin" });
    const isProduction = process.env.NODE_ENV === "production";

    response.cookies.set("edumyles_role", "master_admin", {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    const userCookie = req.cookies.get("edumyles_user")?.value;
    if (userCookie) {
      try {
        const userData = JSON.parse(decodeURIComponent(userCookie));
        userData.role = "master_admin";
        response.cookies.set("edumyles_user", JSON.stringify(userData), {
          httpOnly: false,
          secure: isProduction,
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60,
          path: "/",
        });
      } catch { /* ignore */ }
    }

    return response;
  } catch (err) {
    console.error("[bootstrap] Error:", err);
    return NextResponse.json({ error: "Bootstrap failed" }, { status: 500 });
  }
}
