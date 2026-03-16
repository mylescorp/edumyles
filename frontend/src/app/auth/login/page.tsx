"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get the returnTo parameter or default to /admin
    const returnTo = searchParams.get("returnTo") || "/admin";
    
    // Redirect to the WorkOS API endpoint
    const loginApiUrl = `/auth/login/api${returnTo !== "/admin" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`;
    
    router.replace(loginApiUrl);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    </div>
  );
}
