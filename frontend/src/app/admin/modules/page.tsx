"use client";

import Link from "next/link";
import { ModuleDependencyVisualizer } from "@/components/admin/ModuleDependencyVisualizer";
import { ModuleInstallationPanel } from "@/components/admin/ModuleInstallationPanel";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useInstalledModules } from "@/hooks/useInstalledModules";
import { Package, Store } from "lucide-react";

export default function AdminModulesPage() {
  const { installedModules, availableModules, isLoading } = useInstalledModules();
  const moduleRecords = [...availableModules, ...installedModules];
  const moduleById = new Map<string, any>();

  moduleRecords.forEach((moduleRecord: any) => {
    const moduleId = moduleRecord.moduleSlug ?? moduleRecord.moduleId;
    if (!moduleId || moduleById.has(moduleId)) return;
    moduleById.set(moduleId, moduleRecord);
  });

  const dependencyModules = Array.from(moduleById.values()).map((moduleRecord: any) => {
    const moduleId = moduleRecord.moduleSlug ?? moduleRecord.moduleId;
    const install = installedModules.find(
      (installed: any) =>
        (installed.moduleSlug ?? installed.moduleId) === moduleId
    );
    const dependencies = moduleRecord.dependencySlugs ?? moduleRecord.dependencies ?? [];

    return {
      moduleId,
      name: moduleRecord.name ?? moduleId,
      isInstalled: Boolean(install) || Boolean(moduleRecord.isCore),
      isActive: moduleRecord.isCore || install?.status === "active",
      isCore: Boolean(moduleRecord.isCore),
      dependencies,
      dependents: moduleRecords
        .filter((candidate: any) => {
          const candidateDependencies = candidate.dependencySlugs ?? candidate.dependencies ?? [];
          return candidateDependencies.includes(moduleId);
        })
        .map((candidate: any) => candidate.moduleSlug ?? candidate.moduleId)
        .filter(Boolean),
    };
  });

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Installed Modules"
        description="Manage active modules, dependencies, and tenant-side module availability."
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

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ModuleInstallationPanel />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Dependency View
            </CardTitle>
            <CardDescription>
              Review module relationships and bundled dependencies before changing tenant access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ModuleDependencyVisualizer modules={dependencyModules} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
