"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function RootPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to their appropriate dashboard
    if (isAuthenticated && user) {
      const getRoleDashboard = (role: string) => {
        switch (role) {
          case "master_admin":
          case "super_admin":
            return "/platform";
          case "school_admin":
          case "principal":
          case "bursar":
          case "hr_manager":
          case "librarian":
          case "transport_manager":
            return "/admin";
          case "teacher":
            return "/portal/teacher";
          case "parent":
            return "/portal/parent";
          case "student":
            return "/portal/student";
          case "alumni":
            return "/portal/alumni";
          case "partner":
            return "/portal/partner";
          default:
            return "/admin";
        }
      };

      const dashboard = getRoleDashboard(user.role);
      console.log(`[root page] Redirecting authenticated user ${user.email} to ${dashboard}`);
      router.replace(dashboard);
      return;
    }

    // Redirect unauthenticated users to landing page
    console.log("[root page] Redirecting unauthenticated user to landing page");
    router.replace("/landing");
  }, [isAuthenticated, user, router]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
        <p className="mt-4 text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
