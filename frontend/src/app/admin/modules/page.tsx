"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings2, Power, Trash2, Store } from "lucide-react";

export default function AdminModulesPage() {
  const { sessionToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const canQuery = !authLoading && isAuthenticated && !!sessionToken;

  const installedModules = useQuery(
    api.modules.marketplace.settings.getInstalledModulesForTenant,
    canQuery ? { sessionToken } : "skip"
  )?.data as any[] | undefined;

  const disableModule = useMutation(api.modules.marketplace.installation.disableModule);
  const enableModule = useMutation(api.modules.marketplace.installation.enableModule);
  const uninstallModule = useMutation(api.modules.marketplace.installation.uninstallModule);

  if (authLoading || (canQuery && installedModules === undefined)) {
    return <LoadingSkeleton variant="page" />;
  }

  async function handleDisable(moduleSlug: string) {
    try {
      await disableModule({ sessionToken, moduleSlug });
      toast.success("Module disabled");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to disable module");
    }
  }

  async function handleEnable(moduleSlug: string) {
    try {
      await enableModule({ sessionToken, moduleSlug });
      toast.success("Module enabled");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to enable module");
    }
  }

  async function handleUninstall(moduleSlug: string) {
    try {
      await uninstallModule({ sessionToken, moduleSlug });
      toast.success("Module uninstalled");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to uninstall module");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Installed Modules"
        description="Manage active modules, billing state, and configuration for your school."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Modules" },
        ]}
        actions={
          <Button asChild>
            <Link href="/admin/marketplace">
              <Store className="mr-2 h-4 w-4" />
              Open Marketplace
            </Link>
          </Button>
        }
      />

      {!installedModules || installedModules.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No modules are currently installed for this school.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {installedModules.map((module) => (
            <Card key={module._id}>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>{module.module?.name ?? module.moduleSlug}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {module.module?.tagline ?? "Marketplace module"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{module.status}</Badge>
                    <Badge variant="outline">{module.moduleSlug}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Version</p>
                    <p className="text-sm font-medium">{module.version ?? module.module?.version ?? "1.0.0"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Billing period</p>
                    <p className="text-sm font-medium capitalize">{module.billingPeriod ?? "monthly"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Current price</p>
                    <p className="text-sm font-medium">KES {module.currentPriceKes ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Next billing</p>
                    <p className="text-sm font-medium">
                      {module.nextBillingDate
                        ? new Date(module.nextBillingDate).toLocaleDateString("en-KE")
                        : "Not scheduled"}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" asChild>
                    <Link href={`/admin/settings/modules/${module.moduleSlug}`}>
                      <Settings2 className="mr-2 h-4 w-4" />
                      Configure
                    </Link>
                  </Button>

                  {module.status === "active" ? (
                    <Button variant="outline" onClick={() => handleDisable(module.moduleSlug)}>
                      <Power className="mr-2 h-4 w-4" />
                      Disable
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => handleEnable(module.moduleSlug)}>
                      <Power className="mr-2 h-4 w-4" />
                      Enable
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleUninstall(module.moduleSlug)}
                    disabled={module.moduleSlug?.startsWith("core_")}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {module.moduleSlug?.startsWith("core_") ? "Core module" : "Uninstall"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
