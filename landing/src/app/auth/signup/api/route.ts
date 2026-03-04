import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { email, schoolName, provider } = await req.json();
        const clientId = process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID || process.env.WORKOS_CLIENT_ID;
        const redirectUri =
            process.env.WORKOS_REDIRECT_URI ||
            process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ||
            req.nextUrl.origin + "/auth/callback";

        if (!clientId) {
            return NextResponse.json({ error: "Authentication service not configured" }, { status: 500 });
        }

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: "code",
            screen_hint: "sign-up",
        });

        // Pass provider for direct social login (requires provider enabled in WorkOS dashboard)
        if (provider) {
            params.set("provider", provider);
        }

        // Pre-fill email and pass school name as state
        if (email) {
            params.set("login_hint", email);
        }
        if (schoolName) {
            const state = Buffer.from(JSON.stringify({ schoolName })).toString("base64url");
            params.set("state", state);
        }

        // WorkOS AuthKit (User Management) hosted UI
        const authUrl = "https://api.workos.com/user_management/authorize?" + params.toString();
        return NextResponse.json({ authUrl });
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
