"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function RootPage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user) {
      const getRoleDashboard = (role: string) => {
        switch (role) {
          case "master_admin":
          case "super_admin":
            return "/platform";
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
      router.replace(getRoleDashboard(user.role));
      return;
    }

    // Unauthenticated — go to sign in
    router.replace("/auth/login/api");
  }, [isAuthenticated, user, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto" />
        <p className="mt-4 text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}
