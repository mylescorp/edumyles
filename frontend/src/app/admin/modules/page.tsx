"use client";

import Link from "next/link";
import { ModuleDependencyVisualizer } from "@/components/admin/ModuleDependencyVisualizer";
import { ModuleInstallationPanel } from "@/components/admin/ModuleInstallationPanel";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Store } from "lucide-react";

export default function AdminModulesPage() {
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
            <ModuleDependencyVisualizer modules={[]} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
