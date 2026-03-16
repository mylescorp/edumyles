import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email") ?? undefined;
    const apiKey = process.env.WORKOS_API_KEY;
    const clientId =
      process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID || process.env.WORKOS_CLIENT_ID;
    const redirectUri =
      process.env.WORKOS_REDIRECT_URI ||
      process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ||
      req.nextUrl.origin + "/auth/callback";

    if (!clientId || !apiKey) {
      return NextResponse.redirect(new URL("/?authError=not_configured", req.url));
    }

    const workos = new WorkOS(apiKey);
    const authUrl = workos.userManagement.getAuthorizationUrl({
      clientId,
      redirectUri,
      provider: "authkit",
      screenHint: "sign-up",
      ...(email ? { loginHint: email } : {}),
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Signup GET redirect error:", error);
    return NextResponse.redirect(new URL("/?authError=signup_unavailable", req.url));
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body?.email;
    const schoolName = body?.schoolName;
    const provider = body?.provider || "authkit";
    const apiKey = process.env.WORKOS_API_KEY;
    const clientId =
      process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID ||
      process.env.WORKOS_CLIENT_ID;
    const redirectUri =
      process.env.WORKOS_REDIRECT_URI ||
      process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ||
      req.nextUrl.origin + "/auth/callback";

    if (!clientId || !apiKey) {
      return NextResponse.json(
        { error: "Authentication service not configured" },
        { status: 500 }
      );
    }

    const state = schoolName
      ? Buffer.from(JSON.stringify({ schoolName })).toString("base64url")
      : undefined;

    const workos = new WorkOS(apiKey);
    
    // Configure provider based on selection
    let providerConfig: any = {
      clientId,
      redirectUri,
      screenHint: "sign-up",
      ...(email ? { loginHint: email } : {}),
      ...(state ? { state } : {}),
    };

    // Set specific provider if Google or Microsoft is selected
    if (provider === "google") {
      providerConfig.provider = "Google";
    } else if (provider === "microsoft") {
      providerConfig.provider = "Microsoft";
    } else {
      providerConfig.provider = "authkit"; // Default to AuthKit for email
    }

    const authUrl = workos.userManagement.getAuthorizationUrl(providerConfig);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Signup API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
