import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Portal route patterns
const PORTAL_ROUTES = {
  developer: "/portal/developer",
  affiliate: "/portal/affiliate", 
  reseller: "/portal/reseller",
};

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  "/portal",
  "/admin",
  "/platform",
];

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/auth/signin",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/apply/publisher",
  "/apply/reseller",
  "/apply/affiliate",
  "/about",
  "/contact",
  "/pricing",
  "/features",
  "/blog",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the session token
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  // Extract referral code from URL if present
  const url = new URL(request.url);
  const referralCode = url.searchParams.get("ref");
  
  // Handle referral tracking
  if (referralCode && !request.cookies.get("referral_code")) {
    const response = NextResponse.next();
    // Set referral cookie with 30-day expiration
    response.cookies.set("referral_code", referralCode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    return response;
  }

  // Check if user is authenticated
  const isAuthenticated = !!token;

  // Redirect unauthenticated users from protected routes
  if (!isAuthenticated && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    const loginUrl = new URL("/auth/signin", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Handle portal-specific routing
  if (pathname.startsWith("/portal")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/auth/signin", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check user role and redirect to appropriate portal
    const userRole = token?.role as string;
    
    // Developer/Publisher portal access
    if (pathname.startsWith(PORTAL_ROUTES.developer)) {
      if (userRole !== "publisher") {
        // Redirect to appropriate portal or home
        if (userRole === "reseller") {
          return NextResponse.redirect(new URL(PORTAL_ROUTES.reseller, request.url));
        } else if (userRole === "affiliate") {
          return NextResponse.redirect(new URL(PORTAL_ROUTES.affiliate, request.url));
        } else {
          return NextResponse.redirect(new URL("/", request.url));
        }
      }
    }

    // Affiliate portal access
    if (pathname.startsWith(PORTAL_ROUTES.affiliate)) {
      if (userRole !== "affiliate") {
        // Redirect to appropriate portal or home
        if (userRole === "publisher") {
          return NextResponse.redirect(new URL(PORTAL_ROUTES.developer, request.url));
        } else if (userRole === "reseller") {
          return NextResponse.redirect(new URL(PORTAL_ROUTES.reseller, request.url));
        } else {
          return NextResponse.redirect(new URL("/", request.url));
        }
      }
    }

    // Reseller portal access
    if (pathname.startsWith(PORTAL_ROUTES.reseller)) {
      if (userRole !== "reseller") {
        // Redirect to appropriate portal or home
        if (userRole === "publisher") {
          return NextResponse.redirect(new URL(PORTAL_ROUTES.developer, request.url));
        } else if (userRole === "affiliate") {
          return NextResponse.redirect(new URL(PORTAL_ROUTES.affiliate, request.url));
        } else {
          return NextResponse.redirect(new URL("/", request.url));
        }
      }
    }

    // If user is at /portal root, redirect to their appropriate portal
    if (pathname === "/portal" || pathname === "/portal/") {
      if (userRole === "publisher") {
        return NextResponse.redirect(new URL(PORTAL_ROUTES.developer, request.url));
      } else if (userRole === "reseller") {
        return NextResponse.redirect(new URL(PORTAL_ROUTES.reseller, request.url));
      } else if (userRole === "affiliate") {
        return NextResponse.redirect(new URL(PORTAL_ROUTES.affiliate, request.url));
      } else {
        // User doesn't have portal access, redirect to home
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  // Handle application pages - redirect authenticated users
  if (pathname.startsWith("/apply")) {
    if (isAuthenticated) {
      const userRole = token?.role as string;
      
      // Redirect to appropriate portal if user already has the role
      if (pathname === "/apply/publisher" && userRole === "publisher") {
        return NextResponse.redirect(new URL(PORTAL_ROUTES.developer, request.url));
      }
      if ((pathname === "/apply/reseller" || pathname === "/apply/affiliate") && 
          (userRole === "reseller" || userRole === "affiliate")) {
        const targetPortal = userRole === "reseller" ? PORTAL_ROUTES.reseller : PORTAL_ROUTES.affiliate;
        return NextResponse.redirect(new URL(targetPortal, request.url));
      }
      
      // If user has different role, redirect to their portal
      if (userRole === "publisher") {
        return NextResponse.redirect(new URL(PORTAL_ROUTES.developer, request.url));
      } else if (userRole === "reseller") {
        return NextResponse.redirect(new URL(PORTAL_ROUTES.reseller, request.url));
      } else if (userRole === "affiliate") {
        return NextResponse.redirect(new URL(PORTAL_ROUTES.affiliate, request.url));
      }
    }
  }

  // Handle admin/platform access
  if (pathname.startsWith("/admin") || pathname.startsWith("/platform")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/auth/signin", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const userRole = token?.role as string;
    const isAdminRole = [
      "super_admin",
      "platform_admin", 
      "master_admin",
      "school_admin",
      "principal",
      "teacher",
      "bursar",
      "librarian",
      "transport_manager",
      "hr_manager",
      "receptionist"
    ].includes(userRole);

    if (!isAdminRole) {
      // Redirect non-admin users to their appropriate portal or home
      if (userRole === "publisher") {
        return NextResponse.redirect(new URL(PORTAL_ROUTES.developer, request.url));
      } else if (userRole === "reseller") {
        return NextResponse.redirect(new URL(PORTAL_ROUTES.reseller, request.url));
      } else if (userRole === "affiliate") {
        return NextResponse.redirect(new URL(PORTAL_ROUTES.affiliate, request.url));
      } else {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
