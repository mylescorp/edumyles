"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ModuleConfigPage() {
  const params = useParams();
  const moduleId = params.moduleId as string;
  const { isLoading: authLoading } = useAuth();
  const { isLoading: tenantLoading } = useTenant();

  const moduleDetails = useQuery(
    api.modules.marketplace.queries.getModuleDetails,
    { moduleId }
  );

  if (authLoading || tenantLoading || moduleDetails === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!moduleDetails || !moduleDetails.installed) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Module not found or not installed.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`${moduleDetails.name} Settings`}
        description="Configure module-specific settings"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Modules", href: "/admin/settings/modules" },
          { label: moduleDetails.name },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Module Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Module ID</span>
              <span className="font-mono text-xs">{moduleId}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono text-xs">{moduleDetails.version}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge
                variant={
                  moduleDetails.installed.status === "active"
                    ? "default"
                    : "secondary"
                }
              >
                {moduleDetails.installed.status}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Installed On</span>
              <span>
                {new Date(moduleDetails.installed.installedAt).toLocaleDateString(
                  "en-KE",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                )}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Category</span>
              <span className="capitalize">{moduleDetails.category}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Module-specific configuration options will be available here as
              features are built out. Currently using default settings.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
