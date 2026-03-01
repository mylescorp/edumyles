import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");
    const stateParam = req.nextUrl.searchParams.get("state");

    if (!code) {
        return NextResponse.redirect(
            new URL("/auth/login?error=missing_code", req.url)
        );
    }

    // Decode signup state if present (contains schoolName from signup flow)
    let signupState: { schoolName?: string } = {};
    if (stateParam) {
        try {
            signupState = JSON.parse(
                Buffer.from(stateParam, "base64url").toString("utf-8")
            );
        } catch {
            // Invalid state — ignore
        }
    }

    try {
        const apiKey = process.env.WORKOS_API_KEY;
        const clientId = process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;

        if (!apiKey || !clientId) {
            return NextResponse.redirect(
                new URL("/auth/login?error=config_error", req.url)
            );
        }

        // Exchange code for user profile via WorkOS User Management API
        const tokenRes = await fetch(
            "https://api.workos.com/user-management/authenticate",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    client_id: clientId,
                    client_secret: apiKey,
                    grant_type: "authorization_code",
                    code,
                }),
            }
        );

        if (!tokenRes.ok) {
            // Fallback to SSO token endpoint for backward compatibility
            const ssoTokenRes = await fetch("https://api.workos.com/sso/token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    client_id: clientId,
                    client_secret: apiKey,
                    grant_type: "authorization_code",
                    code,
                }),
            });

            if (!ssoTokenRes.ok) {
                return NextResponse.redirect(
                    new URL("/auth/login?error=token_exchange_failed", req.url)
                );
            }

            const ssoData = await ssoTokenRes.json();
            return handleAuthResult(req, ssoData.profile, signupState);
        }

        const authData = await tokenRes.json();

        // WorkOS User Management returns user object directly
        const user = authData.user;
        if (!user) {
            return NextResponse.redirect(
                new URL("/auth/login?error=no_profile", req.url)
            );
        }

        // Normalize to a common profile shape
        const profile = {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            organization_id: authData.organization_id,
        };

        return handleAuthResult(req, profile, signupState);
    } catch {
        return NextResponse.redirect(
            new URL("/auth/login?error=callback_failed", req.url)
        );
    }
}

async function handleAuthResult(
    req: NextRequest,
    profile: {
        id: string;
        email: string;
        first_name?: string;
        last_name?: string;
        organization_id?: string;
    },
    signupState: { schoolName?: string }
) {
    // Generate session token
    const sessionToken = generateSessionToken();
    const thirtyDays = 30 * 24 * 60 * 60;

    // For now, redirect to the homepage with the session set
    // Full Convex session creation will be handled by the frontend app
    const role = signupState.schoolName ? "school_admin" : "user";
    const dashboardPath = "/";

    const response = NextResponse.redirect(new URL(dashboardPath, req.url));

    // Set session cookie
    response.cookies.set("edumyles_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: thirtyDays,
        path: "/",
    });

    // Set user info cookie (non-httpOnly for client-side access)
    response.cookies.set("edumyles_user", JSON.stringify({
        id: profile.id,
        email: profile.email,
        name: [profile.first_name, profile.last_name].filter(Boolean).join(" "),
        role,
    }), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: thirtyDays,
        path: "/",
    });

    return response;
}

function generateSessionToken(): string {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    for (let i = 0; i < 64; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}
