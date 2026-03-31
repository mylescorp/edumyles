import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const FALLBACK_MASTER_ADMIN_EMAILS = ["ayany004@gmail.com"];
const MASTER_ADMIN_EMAILS = [
  process.env.MASTER_ADMIN_EMAIL,
  ...FALLBACK_MASTER_ADMIN_EMAILS,
]
  .filter((value): value is string => Boolean(value))
  .map((value) => value.toLowerCase());

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(convexUrl);
}

function isConfiguredMasterAdmin(email?: string | null) {
  if (!email) return false;
  return MASTER_ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * GET /api/auth/session
 *
 * Server-side session validation endpoint.
 * Reads the httpOnly session cookie (not accessible from client JS)
 * and validates it against Convex, returning the session data.
 */
export async function GET(req: NextRequest) {
  try {
    // Development bypass - only when explicitly enabled AND not in production
    if (
      process.env.ENABLE_DEV_AUTH_BYPASS === "true" &&
      process.env.NODE_ENV !== "production" &&
      !req.cookies.get("edumyles_session")?.value
    ) {
      console.log("[api/auth/session] Dev bypass: Creating mock session");
      return NextResponse.json({
        session: {
          sessionToken: "dev_session_token",
          tenantId: "PLATFORM",
          userId: "dev_user_id",
          email: "admin@edumyles.local",
          role: "master_admin",
          expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
    }

    const sessionToken = req.cookies.get("edumyles_session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ session: null }, { status: 200 });
    }

    // Try Convex first
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (convexUrl) {
      try {
        const convex = getConvexClient();
        const session = await convex.query(api.sessions.getSession, {
          sessionToken,
        });

        if (session) {
          if (isConfiguredMasterAdmin(session.email) && session.role !== "master_admin") {
            try {
              await convex.mutation(api.users.syncMasterAdminRole, {
                workosUserId: session.userId,
                email: session.email,
              });
              await convex.mutation(api.sessions.updateSessionRole, {
                sessionToken,
                role: "master_admin",
              });
            } catch (repairError) {
              console.error("[api/auth/session] Failed to repair master admin role:", repairError);
            }

            const repairedResponse = NextResponse.json({
              session: {
                sessionToken: session.sessionToken,
                tenantId: "PLATFORM",
                userId: session.userId,
                email: session.email,
                role: "master_admin",
                expiresAt: session.expiresAt,
              },
            });
            // Update the role cookie so the middleware sees master_admin on
            // the next request without needing to parse the user cookie.
            const isProduction = process.env.NODE_ENV === "production";
            repairedResponse.cookies.set("edumyles_role", "master_admin", {
              httpOnly: false,
              secure: isProduction,
              sameSite: "lax",
              maxAge: 30 * 24 * 60 * 60,
              path: "/",
            });
            return repairedResponse;
          }

          return NextResponse.json({
            session: {
              sessionToken: session.sessionToken,
              tenantId: session.tenantId,
              userId: session.userId,
              email: session.email,
              role: session.role,
              expiresAt: session.expiresAt,
            },
          });
        }
      } catch (convexError) {
        console.log("[api/auth/session] Convex unavailable, trying fallback:", convexError);
      }
    }

    // Fallback: when Convex is unavailable or session not found in DB,
    // reconstruct session from the companion cookies set at login time.
    // The httpOnly edumyles_session cookie (which cannot be set via JS) is the
    // security gate — if it exists, it was set server-side during auth callback.
    const userCookie = req.cookies.get("edumyles_user")?.value;
    const roleCookie = req.cookies.get("edumyles_role")?.value;

    if (userCookie && roleCookie) {
      try {
        const user = JSON.parse(userCookie);
        const effectiveRole = isConfiguredMasterAdmin(user.email) ? "master_admin" : roleCookie;
        const effectiveTenantId = effectiveRole === "master_admin" ? "PLATFORM" : user.tenantId || "PLATFORM";
        return NextResponse.json({
          session: {
            sessionToken,
            tenantId: effectiveTenantId,
            userId: user.email,
            email: user.email,
            role: effectiveRole,
            expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });
      } catch (parseError) {
        console.error("[api/auth/session] Failed to parse user cookie:", parseError);
      }
    }

    return NextResponse.json({ session: null }, { status: 200 });
  } catch (err) {
    console.error("[api/auth/session] Session validation failed:", err);
    return NextResponse.json({ session: null }, { status: 200 });
  }
}
