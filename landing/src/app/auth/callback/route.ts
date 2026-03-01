import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const errorDescription = request.nextUrl.searchParams.get(
    "error_description",
  );
  const baseUrl = request.nextUrl.origin;

  // Handle errors from WorkOS
  if (error) {
    console.error("WorkOS auth error:", error, errorDescription);
    return NextResponse.redirect(
      `${baseUrl}/?auth_error=${encodeURIComponent(errorDescription || error)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=no_code`);
  }

  const clientId =
    process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID || process.env.WORKOS_CLIENT_ID;
  const apiKey = process.env.WORKOS_API_KEY;

  if (!clientId || !apiKey) {
    console.error(
      "WorkOS credentials not configured. Ensure NEXT_PUBLIC_WORKOS_CLIENT_ID and WORKOS_API_KEY are set.",
    );
    return NextResponse.redirect(`${baseUrl}/?auth_error=config`);
  }

  try {
    // Exchange the authorization code for user info
    const tokenRes = await fetch(
      "https://api.workos.com/user-management/authenticate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: apiKey,
          grant_type: "authorization_code",
          code,
        }),
      },
    );

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("WorkOS token exchange failed:", tokenRes.status, errBody);
      return NextResponse.redirect(`${baseUrl}/?auth_error=token_exchange`);
    }

    const data = await tokenRes.json();
    const user = data.user;
    const accessToken = data.access_token;

    if (!user) {
      console.error("No user in WorkOS response");
      return NextResponse.redirect(`${baseUrl}/?auth_error=no_user`);
    }

    // Create a simple session token (user info encoded as base64)
    const sessionPayload = {
      userId: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      profilePictureUrl: user.profile_picture_url,
      accessToken,
      createdAt: Date.now(),
    };

    const sessionToken = Buffer.from(JSON.stringify(sessionPayload)).toString(
      "base64url",
    );

    // Set session cookie and redirect to home
    const response = NextResponse.redirect(`${baseUrl}/`);

    response.cookies.set("edumyles_session", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Set a readable user info cookie for the client
    response.cookies.set(
      "edumyles_user",
      JSON.stringify({
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email,
        avatar: user.profile_picture_url || "",
      }),
      {
        httpOnly: false,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      },
    );

    return response;
  } catch (err) {
    console.error("Auth callback error:", err);
    return NextResponse.redirect(`${baseUrl}/?auth_error=unknown`);
  }

}
