import { NextRequest, NextResponse } from "next/server";

// Extract subdomain from request hostname
function extractSubdomain(req: NextRequest): string | null {
  const hostname = req.headers.get("host") || "";
  const parts = hostname.split(".");
  
  // Handle localhost development
  if (hostname.includes("localhost")) {
    const subdomain = req.nextUrl.searchParams.get("subdomain");
    return subdomain || null;
  }
  
  // Handle production domains (subdomain.edumyles.com)
  if (parts.length >= 3 && parts[parts.length - 2] === "edumyles" && parts[parts.length - 1] === "com") {
    return parts[0] ?? null;
  }
  
  return null;
}

// Handle tenant-specific routing
export async function GET(req: NextRequest) {
  const subdomain = extractSubdomain(req);
  
  if (!subdomain) {
    // No subdomain - redirect to landing page
    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || "https://edumyles.com";
    return NextResponse.redirect(landingUrl);
  }
  
  // Redirect to the main app with tenant context
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.edumyles.com";
  const redirectUrl = `${appUrl}?tenant=${subdomain}`;
  
  return NextResponse.redirect(redirectUrl);
}

// Handle all HTTP methods for subdomain routing
export async function POST(req: NextRequest) {
  return GET(req);
}

export async function PUT(req: NextRequest) {
  return GET(req);
}

export async function PATCH(req: NextRequest) {
  return GET(req);
}

export async function DELETE(req: NextRequest) {
  return GET(req);
}
