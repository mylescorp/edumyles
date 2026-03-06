import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";

const MASTER_ADMIN_EMAIL = process.env.MASTER_ADMIN_EMAIL ?? "";

function resolveRole(email: string, _orgId?: string): string {
  if (MASTER_ADMIN_EMAIL && email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
    return "master_admin";
  }
  // Default new users to school_admin — refine once user records exist
  return "school_admin";
}

function getRoleDashboard(role: string): string {
  switch (role) {
    case "master_admin":
    case "super_admin":
      return "/platform";
    case "teacher":
      return "/portal/teacher";
    case "parent":
      return "/portal/parent";
    case "student":
      return "/portal/student";
    case "alumni":
      return "/portal/alumni";
    case "partner":
      return "/portal/partner";
    default:
      return "/admin";
  }
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const stateParam = req.nextUrl.searchParams.get("state");

  if (error) {
    console.error("[auth/callback] WorkOS returned error:", error);
    return NextResponse.redirect(
      new URL("/auth/login?error=" + encodeURIComponent(error), req.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth/login?error=no_code", req.url)
    );
  }

  try {
    const apiKey = process.env.WORKOS_API_KEY;
    const clientId =
      process.env.WORKOS_CLIENT_ID || process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!apiKey || !clientId || !convexUrl) {
      console.error("[auth/callback] Missing required auth environment variables", {
        hasApiKey: !!apiKey,
        hasClientId: !!clientId,
        hasConvexUrl: !!convexUrl,
      });
      return NextResponse.redirect(
        new URL("/auth/login?error=config_error", req.url)
      );
    }

    const workos = new WorkOS(apiKey);
    const convex = new ConvexHttpClient(convexUrl);

    // --- Exchange authorization code for user profile ----------------------
    const { user, organizationId } =
      await workos.userManagement.authenticateWithCode({
        clientId,
        code,
      });

    const email = user.email;
    const firstName = user.firstName ?? "";
    const lastName = user.lastName ?? "";
    const workosUserId = user.id;

    // --- Determine role & tenant ------------------------------------------
    const role = resolveRole(email, organizationId ?? undefined);
    const tenantId = organizationId ?? "PLATFORM";

    // --- Decode optional state (e.g. schoolName from signup) --------------
    let _stateData: Record<string, string> = {};
    if (stateParam) {
      try {
        // Fix base64url decoding - replace URL-safe chars first
        const base64 = stateParam.replace(/-/g, '+').replace(/_/g, '/');
        const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);
        _stateData = JSON.parse(
          Buffer.from(paddedBase64, 'base64').toString()
        );
      } catch (err) {
        console.log("[auth/callback] Failed to decode state:", err);
        // non-critical — ignore bad state
      }
    }

    // --- Create session in Convex -----------------------------------------
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    // Skip session creation for now due to schema conflicts
    // TODO: Fix backend schema and enable session creation
    console.log("[auth/callback] Session creation skipped due to schema conflicts");
    console.log("[auth/callback] Generated token:", sessionToken);

    // --- Set cookies & redirect -------------------------------------------
    const dashboard = getRoleDashboard(role);
    
    // Debug logging
    console.log(`[auth/callback] Redirecting to: ${dashboard}`);
    console.log(`[auth/callback] Full URL: ${req.url}`);
    console.log(`[auth/callback] Base URL: ${req.nextUrl.origin}`);
    
    const response = NextResponse.redirect(new URL(dashboard, req.url));
    const isProduction = process.env.NODE_ENV === "production";

    response.cookies.set("edumyles_session", sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    response.cookies.set("edumyles_user", JSON.stringify({ email, firstName, lastName, role }), {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    response.cookies.set("edumyles_role", role, {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    console.log(`[auth/callback] ✅ ${email} authenticated as ${role} → ${dashboard}`);
    console.log(`[auth/callback] Cookies set: session=${!!sessionToken}, role=${role}`);
    return response;
  } catch (err) {
    console.error("[auth/callback] ❌ Token exchange failed:", err);
    return NextResponse.redirect(
      new URL("/auth/login?error=callback_failed", req.url)
    );
  }
}
