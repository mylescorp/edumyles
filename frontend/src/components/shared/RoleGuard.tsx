"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSkeleton } from "./LoadingSkeleton";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      // Clear stale session cookies first to prevent middleware redirect loop,
      // then navigate to login.
      fetch("/auth/logout", { method: "POST" }).finally(() => {
        router.replace(`/auth/login?returnTo=${encodeURIComponent(pathname)}`);
      });
    }
  }, [isLoading, user, router, pathname]);

  if (isLoading || !user) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You do not have permission to access this page.</p>
          <p className="mt-1 text-sm text-gray-500">Required roles: {allowedRoles.join(", ")}</p>
          {role && <p className="mt-1 text-sm text-gray-500">Your role: {role}</p>}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
