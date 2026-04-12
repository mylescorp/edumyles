"use client";

import React, { ReactNode } from "react";
import { ConvexAuthProvider } from "@/components/ConvexAuthProvider";
import { GlobalShell } from "@/components/layout/GlobalShell";
import { ModuleAccessGuard } from "@/components/shared/ModuleAccessGuard";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { NavItem } from "@/lib/routes";

class ShellErrorBoundary extends React.Component<
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
    console.error("Shell layout error:", error, info);
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

type AppShellBaseProps = {
  allowedRoles: string[];
  navItems: NavItem[];
  children: ReactNode;
  useModuleAccessGuard?: boolean;
  fallbackHref?: string;
};

export function AppShellBase({
  allowedRoles,
  navItems,
  children,
  useModuleAccessGuard = false,
  fallbackHref = "/admin/modules",
}: AppShellBaseProps) {
  const content = useModuleAccessGuard ? (
    <ModuleAccessGuard fallbackHref={fallbackHref}>
      <div className="px-3 pb-8 pt-4 sm:px-4 md:px-6 md:pb-10 md:pt-5 xl:px-8">
        <div className="mx-auto w-full max-w-[1480px]">{children}</div>
      </div>
    </ModuleAccessGuard>
  ) : (
    <div className="px-3 pb-8 pt-4 sm:px-4 md:px-6 md:pb-10 md:pt-5 xl:px-8">
      <div className="mx-auto w-full max-w-[1480px]">{children}</div>
    </div>
  );

  return (
    <ConvexAuthProvider>
      <RoleGuard allowedRoles={allowedRoles}>
        <GlobalShell navItems={navItems}>
          <ShellErrorBoundary>{content}</ShellErrorBoundary>
        </GlobalShell>
      </RoleGuard>
    </ConvexAuthProvider>
  );
}
