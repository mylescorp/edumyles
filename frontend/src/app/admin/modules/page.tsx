"use client";

import { ModuleInstallationPanel } from "@/components/admin/ModuleInstallationPanel";
import { ModuleDependencyVisualizer } from "@/components/admin/ModuleDependencyVisualizer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Settings, Download, Star, GitBranch } from "lucide-react";
import { useInstalledModules } from "@/hooks/useInstalledModules";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";

type AvailableModule = {
  moduleId: string;
  name: string;
  isCore?: boolean;
  dependencies?: string[];
};

type InstalledModule = {
  moduleId: string;
  status?: string;
};

export default function ModuleManagementPage() {
  const { sessionToken } = useAuth();
  const { tenantId } = useTenant();
  const {
    installedModuleIds,
    installedModules,
    availableModules,
  } = useInstalledModules();
  const moduleIds = installedModuleIds as string[];
  const installed = (installedModules ?? []) as InstalledModule[];
  const available = (availableModules ?? []) as AvailableModule[];
  
  const installModule = useMutation(api.modules.marketplace.mutations.installModule);
  const uninstallModule = useMutation(api.modules.marketplace.mutations.uninstallModule);
  const toggleModuleStatus = useMutation(api.modules.marketplace.mutations.toggleModuleStatus);

  const handleModuleAction = async (moduleId: string, action: 'install' | 'uninstall' | 'activate' | 'deactivate') => {
    if (!sessionToken || !tenantId) return;
    
    try {
      switch (action) {
        case 'install':
          await installModule({ sessionToken, tenantId, moduleId });
          toast.success("Module installed successfully.");
          break;

        case 'uninstall':
          await uninstallModule({ sessionToken, tenantId, moduleId });
          toast.success("Module removed from your system.");
          break;

        case 'activate':
          await toggleModuleStatus({ sessionToken, tenantId, moduleId, status: "active" });
          toast.success("Module activated.");
          break;

        case 'deactivate':
          await toggleModuleStatus({ sessionToken, tenantId, moduleId, status: "inactive" });
          toast.success("Module deactivated.");
          break;
      }
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to perform module action.");
    }
  };

  // Prepare data for dependency visualizer
  const dependencyData = available.map((module: AvailableModule) => ({
    moduleId: module.moduleId,
    name: module.name,
    isInstalled: moduleIds.includes(module.moduleId),
    isActive: module.isCore || installed.find((m: InstalledModule) => m.moduleId === module.moduleId)?.status === "active",
    isCore: Boolean(module.isCore),
    dependencies: module.dependencies || [],
    dependents: [], // This would need to be calculated based on reverse dependencies
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl border bg-gradient-to-r from-primary-dark to-primary p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Module Management</h1>
            <p className="text-white/80">Install, configure, and manage platform modules</p>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-em-primary/10 text-em-primary">
                <Package className="h-4 w-4" />
              </div>
              <CardTitle className="text-base">Browse Modules</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Discover and install new modules to extend your platform capabilities
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-em-success/10 text-em-success">
                <Settings className="h-4 w-4" />
              </div>
              <CardTitle className="text-base">Configure Modules</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Customize module settings and preferences to match your needs
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <Star className="h-4 w-4" />
              </div>
              <CardTitle className="text-base">Core Modules</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Essential modules that are always available and cannot be removed
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                <GitBranch className="h-4 w-4" />
              </div>
              <CardTitle className="text-base">Dependencies</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View and manage module dependencies and relationships
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Module management tabs */}
      <Tabs defaultValue="installation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="installation" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Installation
          </TabsTrigger>
          <TabsTrigger value="dependencies" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Dependencies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="installation" className="space-y-6">
          <ModuleInstallationPanel />
        </TabsContent>

        <TabsContent value="dependencies" className="space-y-6">
          <ModuleDependencyVisualizer 
            modules={dependencyData}
            onModuleAction={handleModuleAction}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
