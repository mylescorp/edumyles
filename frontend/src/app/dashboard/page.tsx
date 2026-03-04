"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

export default function DashboardRedirectPage() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && role) {
      // Redirect to the appropriate dashboard based on role
      switch (role) {
        case "master_admin":
        case "super_admin":
          router.push("/platform");
          break;
        case "school_admin":
        case "principal":
        case "bursar":
        case "hr_manager":
        case "librarian":
        case "transport_manager":
          router.push("/admin");
          break;
        case "teacher":
          router.push("/portal/teacher");
          break;
        case "parent":
          router.push("/portal/parent");
          break;
        case "student":
          router.push("/portal/student");
          break;
        case "alumni":
          router.push("/portal/alumni");
          break;
        case "partner":
          router.push("/portal/partner");
          break;
        default:
          router.push("/admin");
      }
    } else if (!isLoading && !role) {
      // No role, redirect to login
      router.push("/auth/login");
    }
  }, [isLoading, role, router]);

  if (isLoading) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSkeleton variant="page" />
        <p className="mt-4 text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
