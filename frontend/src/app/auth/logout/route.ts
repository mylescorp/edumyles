import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Clear session cookie
    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    
    // Clear the session cookie
    response.cookies.set("edumyles_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Immediately expire
      expires: new Date(0) // Set to past date to ensure deletion
    });

    // Clear any other auth cookies
    response.cookies.set("edumyles_user", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0)
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
  // Handle GET requests for logout as well (for direct navigation)
  return POST(request);
}
