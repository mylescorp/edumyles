"use client";

import React from "react";
import { ConvexAuthProvider } from "@/components/ConvexAuthProvider";
import { ReactNode } from "react";
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
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center space-y-4">
              <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
              <div>
                <h3 className="font-semibold text-lg">Something went wrong</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {this.state.error?.message
                    ?.replace(/^(UNAUTHENTICATED|UNAUTHORIZED): /, "")
                    .replace(/^\[CONVEX [^\]]+\] /, "") ||
                    "An unexpected error occurred."}
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

export default function PlatformLayout({ children }: { children: ReactNode }) {
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
