import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getRootDomain } from "@/lib/domains";
import { getMarketingSiteUrl } from "@/lib/marketingSite";

// Extract subdomain from request hostname
function extractSubdomain(req: NextRequest): string | null {
  const hostname = req.headers.get("host") || "";
  const normalizedHost = hostname.split(":")[0] || "";
  const parts = normalizedHost.split(".");
  const rootDomain = getRootDomain();
  const rootParts = rootDomain.split(".");
  
  // Handle localhost development
  if (normalizedHost.includes("localhost")) {
    const subdomain = req.nextUrl.searchParams.get("subdomain");
    return subdomain || null;
  }
  
  // Handle production domains ({subdomain}.{rootDomain})
  if (parts.length > rootParts.length && parts.slice(-rootParts.length).join(".") === rootDomain) {
    return parts.slice(0, parts.length - rootParts.length).join(".") || null;
  }
  
  return null;
}

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return null;
  return new ConvexHttpClient(convexUrl);
}

function getAppUrl(origin: string) {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredAppUrl) {
    return configuredAppUrl.replace(/\/+$/, "");
  }

  const currentUrl = new URL(origin);
  if (currentUrl.hostname === "localhost" || currentUrl.hostname === "127.0.0.1") {
    return `${currentUrl.protocol}//${currentUrl.hostname}:3005`;
  }

  return "https://edumyles-frontend.vercel.app";
}

// Handle tenant-specific routing
export async function GET(req: NextRequest) {
  const subdomain = extractSubdomain(req);
  
  if (!subdomain) {
    // No subdomain - redirect to landing page
    const landingUrl = getMarketingSiteUrl(req.nextUrl.origin);
    return NextResponse.redirect(landingUrl);
  }

  const convex = getConvexClient();
  if (!convex) {
    return NextResponse.json({ error: "Tenant routing is not configured" }, { status: 500 });
  }

  // First, check if this is a reseller subdomain
  const resellerQuery = (api as any)?.modules?.reseller?.getResellerBySubdomain;
  const reseller = resellerQuery ? await convex.query(resellerQuery, { subdomain }) : null;
  
  if (reseller && reseller.status === "active") {
    // This is a reseller white-label subdomain
    const appUrl = getAppUrl(req.nextUrl.origin);
    const redirect = new URL(appUrl);
    
    // Set reseller context
    redirect.searchParams.set("reseller", reseller.resellerId);
    redirect.searchParams.set("resellerName", reseller.businessName);
    redirect.searchParams.set("subdomain", subdomain);
    
    // Include reseller branding configuration
    if (reseller.subdomainConfig) {
      redirect.searchParams.set("branding", JSON.stringify(reseller.subdomainConfig));
    }
    
    return NextResponse.redirect(redirect.toString());
  }

  // If not a reseller subdomain, check for regular tenant
  const tenant = await convex.query(api.tenants.getTenantBySubdomain, { subdomain });
  if (!tenant || tenant.status !== "active") {
    const landingUrl = getMarketingSiteUrl(req.nextUrl.origin);
    const redirect = new URL(landingUrl);
    redirect.searchParams.set("tenant", subdomain);
    redirect.searchParams.set("error", tenant ? "tenant_inactive" : "tenant_not_found");
    return NextResponse.redirect(redirect.toString());
  }

  // Redirect to the main app with validated tenant context
  const appUrl = getAppUrl(req.nextUrl.origin);
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
