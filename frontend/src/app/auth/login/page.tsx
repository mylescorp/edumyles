"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for authentication errors first
    const error = searchParams.get("error");
    if (error) {
      // For errors, redirect to the platform dashboard
      router.replace("/platform");
      return;
    }

    // Get the returnTo parameter or default to /platform
    const returnTo = searchParams.get("returnTo") || "/platform";
    
    // Instant redirect to the WorkOS API endpoint
    const loginApiUrl = `/auth/login/api${returnTo !== "/platform" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`;
    
    // Use window.location for instant redirect (no React delay)
    window.location.href = loginApiUrl;
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Redirecting to login...</p>
      </div>
    </div>
  );
}
