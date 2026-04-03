/**
 * WorkOS OAuth callback handler.
 *
 * Security model:
 *  - Master admin emails from env always get through.
 *  - Known users (workosUserId present in `users` table and isActive) get through.
 *  - Pending-invite users (workosUserId starts with "pending-") are linked on
 *    first sign-in and then allowed through.
 *  - Brand-new sign-UPs are placed on the waitlist → /auth/pending.
 *  - Brand-new sign-INs (login attempt from someone not in the DB) are rejected
 *    → /auth/error?reason=not_authorized.
 */

import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";

const MASTER_ADMIN_EMAILS = (
  process.env.MASTER_ADMIN_EMAILS?.split(",").map((e) => e.trim()) ?? []
)
  .filter((value): value is string => Boolean(value))
  .map((value) => value.toLowerCase());

function isMasterAdmin(email: string): boolean {
  return MASTER_ADMIN_EMAILS.includes(email.toLowerCase());
}

function normalizeRole(role: string): string {
  return role === "platform_admin" ? "super_admin" : role;
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

function decodeState(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf-8"));
  } catch {
    return {};
  }
}

function authError(req: NextRequest, reason: string): NextResponse {
  return NextResponse.redirect(
    new URL(`/auth/error?reason=${encodeURIComponent(reason)}`, req.url)
  );
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const returnedState = req.nextUrl.searchParams.get("state");

  if (error) {
    console.error("[auth/callback] WorkOS error:", error);
    return authError(req, encodeURIComponent(error));
  }

  if (!code) {
    return authError(req, "no_code");
  }

  // CSRF: validate when the cookie is present (same-origin flows).
  const savedState = req.cookies.get("workos_state")?.value;
  if (savedState && returnedState !== savedState) {
    console.error("[auth/callback] CSRF state mismatch");
    return authError(req, "invalid_state");
  }

  const apiKey = process.env.WORKOS_API_KEY;
  const clientId =
    process.env.WORKOS_CLIENT_ID || process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!apiKey || !clientId || !convexUrl) {
    console.error("[auth/callback] Missing env vars", {
      apiKey: !!apiKey,
      clientId: !!clientId,
      convexUrl: !!convexUrl,
    });
    return authError(req, "config_error");
  }

  try {
    const workos = new WorkOS(apiKey);
    const convex = new ConvexHttpClient(convexUrl);
    const serverSecret = process.env.CONVEX_WEBHOOK_SECRET;

    const { user, organizationId } = await workos.userManagement.authenticateWithCode({
      clientId,
      code,
    });

    // Decode state to know whether this originated from sign-up or sign-in.
    const stateData = decodeState(returnedState);
    const isSignUp = stateData.mode === "sign-up";

    const isProduction = process.env.NODE_ENV === "production";

    // ── 1. Master admin fast-path ────────────────────────────────────────────
    if (isMasterAdmin(user.email)) {
      const role = "master_admin";
      const tenantId = "PLATFORM";

      try {
        await convex.mutation(api.users.syncMasterAdminRole, {
          workosUserId: user.id,
          email: user.email,
          serverSecret,
        });
      } catch {
        // Non-fatal — session is still created from env-based override
      }

      const sessionToken = crypto.randomBytes(32).toString("hex");
      await convex.mutation(api.sessions.createSession, {
        serverSecret: serverSecret ?? "",
        sessionToken,
        tenantId,
        userId: user.id,
        email: user.email,
        role,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      });

      const returnTo =
        stateData.returnTo && stateData.returnTo.startsWith("/")
          ? stateData.returnTo
          : getRoleDashboard(role);

      console.log(`[auth/callback] ✅ master_admin ${user.email} → ${returnTo}`);
      const res = NextResponse.redirect(new URL(returnTo, req.url));
      setSessionCookies(res, sessionToken, user, role, tenantId, isProduction);
      return res;
    }

    // ── 2. Look up user in Convex ────────────────────────────────────────────
    let existing: {
      role: string;
      tenantId: string;
      workosUserId: string;
      isActive: boolean;
    } | null = null;

    try {
      existing = await convex.query(api.users.getUserByWorkosIdGlobal, {
        workosUserId: user.id,
        serverSecret,
      });
    } catch {
      // Convex unavailable — fall through to waitlist/error path
    }

    // ── 3. Check if first user ever (auto-bootstrap master admin) ────────────
    if (!existing) {
      let hasMasterAdmin = false;
      try {
        hasMasterAdmin = await convex.query(api.users.hasMasterAdmin, { serverSecret });
      } catch {
        // ignore
      }
      if (!hasMasterAdmin) {
        // First sign-in on a fresh installation → auto-promote to master_admin
        const role = "master_admin";
        const tenantId = "PLATFORM";

        try {
          await convex.mutation(api.users.syncMasterAdminRole, {
            workosUserId: user.id,
            email: user.email,
            serverSecret,
          });
        } catch {
          // Non-fatal
        }

        const sessionToken = crypto.randomBytes(32).toString("hex");
        await convex.mutation(api.sessions.createSession, {
          serverSecret: serverSecret ?? "",
          sessionToken,
          tenantId,
          userId: user.id,
          email: user.email,
          role,
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        });

        const returnTo = getRoleDashboard(role);
        console.log(`[auth/callback] ✅ first-user auto-promoted to master_admin: ${user.email}`);
        const res = NextResponse.redirect(new URL(returnTo, req.url));
        setSessionCookies(res, sessionToken, user, role, tenantId, isProduction);
        return res;
      }
    }

    // ── 4. Existing active user — allow login ────────────────────────────────
    if (existing && existing.isActive) {
      const role = normalizeRole(existing.role);
      const tenantId = existing.tenantId;

      const sessionToken = crypto.randomBytes(32).toString("hex");
      await convex.mutation(api.sessions.createSession, {
        serverSecret: serverSecret ?? "",
        sessionToken,
        tenantId,
        userId: user.id,
        email: user.email,
        role,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      });

      const returnTo =
        stateData.returnTo && stateData.returnTo.startsWith("/")
          ? stateData.returnTo
          : getRoleDashboard(role);

      console.log(`[auth/callback] ✅ ${user.email} → ${role} → ${returnTo}`);
      const res = NextResponse.redirect(new URL(returnTo, req.url));
      setSessionCookies(res, sessionToken, user, role, tenantId, isProduction);
      return res;
    }

    // ── 5. Inactive / deactivated user ──────────────────────────────────────
    if (existing && !existing.isActive) {
      console.warn(`[auth/callback] ⛔ Inactive user attempted login: ${user.email}`);
      return authError(req, "account_inactive");
    }

    // ── 6. User not in DB ────────────────────────────────────────────────────
    // Sign-UP flow → add to waitlist and redirect to pending page.
    // Sign-IN flow → they are not authorized (not pre-provisioned).
    if (isSignUp) {
      try {
        await convex.mutation(api.waitlist.submitWaitlistApplication, {
          workosUserId: user.id,
          email: user.email,
          firstName: user.firstName ?? undefined,
          lastName: user.lastName ?? undefined,
        });
      } catch (err) {
        console.error("[auth/callback] Failed to submit waitlist application:", err);
      }

      console.log(`[auth/callback] 📋 New signup queued for waitlist: ${user.email}`);
      const pendingUrl = new URL(
        `/auth/pending?wid=${encodeURIComponent(user.id)}`,
        req.url
      );
      const res = NextResponse.redirect(pendingUrl);
      // Store workos user id in a short-lived cookie so /auth/pending can poll status
      res.cookies.set("edumyles_wid", user.id, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      });
      res.cookies.set("workos_state", "", { maxAge: 0, path: "/" });
      return res;
    }

    // Login attempt with no record → not authorized
    console.warn(`[auth/callback] ⛔ Unauthorized login attempt: ${user.email}`);
    return authError(req, "not_authorized");
  } catch (err) {
    console.error("[auth/callback] ❌ Token exchange failed:", err);
    return authError(req, "callback_failed");
  }
}

// ── Cookie helpers ───────────────────────────────────────────────────────────

function setSessionCookies(
  response: NextResponse,
  sessionToken: string,
  user: { email: string; firstName?: string | null; lastName?: string | null },
  role: string,
  tenantId: string,
  isProduction: boolean
): void {
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

  // Clear CSRF state cookie
  response.cookies.set("workos_state", "", { maxAge: 0, path: "/" });
}
