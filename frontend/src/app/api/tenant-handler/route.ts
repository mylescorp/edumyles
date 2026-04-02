import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

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

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return null;
  return new ConvexHttpClient(convexUrl);
}

// Handle tenant-specific routing
export async function GET(req: NextRequest) {
  const subdomain = extractSubdomain(req);
  
  if (!subdomain) {
    // No subdomain - redirect to landing page
    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || "https://edumyles.com";
    return NextResponse.redirect(landingUrl);
  }

  const convex = getConvexClient();
  if (!convex) {
    return NextResponse.json({ error: "Tenant routing is not configured" }, { status: 500 });
  }

  const tenant = await convex.query(api.tenants.getTenantBySubdomain, { subdomain });
  if (!tenant || tenant.status !== "active") {
    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || "https://edumyles.com";
    const redirect = new URL(landingUrl);
    redirect.searchParams.set("tenant", subdomain);
    redirect.searchParams.set("error", tenant ? "tenant_inactive" : "tenant_not_found");
    return NextResponse.redirect(redirect.toString());
  }

  // Redirect to the main app with validated tenant context
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.edumyles.com";
  const redirect = new URL(appUrl);
  redirect.searchParams.set("tenant", tenant.subdomain);
  redirect.searchParams.set("tenantId", tenant.tenantId);
  
  return NextResponse.redirect(redirect.toString());
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
