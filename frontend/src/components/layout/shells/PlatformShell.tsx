"use client";

import React, { ReactNode } from "react";
import { ConvexAuthProvider } from "@/components/ConvexAuthProvider";
import { GlobalShell } from "@/components/layout/GlobalShell";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { platformNavItems } from "@/lib/routes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

class PlatformErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Platform layout error:", error, info);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardContent className="space-y-4 pt-6 text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
              <div>
                <h3 className="text-lg font-semibold">Something went wrong</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {this.state.error?.message
                    ?.replace(/^(UNAUTHENTICATED|UNAUTHORIZED): /, "")
                    .replace(/^\[CONVEX [^\]]+\] /, "") || "An unexpected error occurred."}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Try again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

const PLATFORM_ROLES = ["master_admin", "super_admin"];

export function PlatformShell({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthProvider>
      <RoleGuard allowedRoles={PLATFORM_ROLES}>
        <GlobalShell navItems={platformNavItems}>
          <PlatformErrorBoundary>
            <div className="p-4 md:p-6">
              <div className="mx-auto max-w-[1600px]">{children}</div>
            </div>
          </PlatformErrorBoundary>
        </GlobalShell>
      </RoleGuard>
    </ConvexAuthProvider>
  );
}
