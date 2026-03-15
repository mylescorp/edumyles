"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ModuleCard } from "./components/ModuleCard";
import { InstallDialog } from "./components/InstallDialog";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/shared/SearchInput";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardList,
  Shield,
  Download,
  Package,
  CheckCircle2,
  Lock,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

/** Core module IDs — client-side constant matching the backend */
const CORE_MODULE_IDS = ["sis", "communications", "users"];

export default function MarketplacePage() {
  const { isLoading: authLoading, sessionToken } = useAuth();
  const { tenantId, installedModules, tier, isLoading: tenantLoading } = useTenant();

  const availableModules = useQuery(
    api.modules.marketplace.queries.getAvailableForTier,
    { sessionToken: sessionToken ?? "" },
    !!sessionToken
  );

  const installModule = useMutation(api.modules.marketplace.mutations.installModule);
  const uninstallModule = useMutation(api.modules.marketplace.mutations.uninstallModule);

  const [dialogState, setDialogState] = useState<{
    open: boolean;
    moduleId: string;
    moduleName: string;
    requiredTier: string;
    action: "install" | "uninstall";
  }>({
    open: false,
    moduleId: "",
    moduleName: "",
    requiredTier: "",
    action: "install",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  // Separate core and optional modules
  const { coreModules, optionalModules, installedCount, totalCount } = useMemo(() => {
    if (!availableModules) return { coreModules: [], optionalModules: [], installedCount: 0, totalCount: 0 };

    const modules = availableModules as any[];
    const core = modules.filter((m) => CORE_MODULE_IDS.includes(m.moduleId) || m.isCore);
    const optional = modules.filter((m) => !CORE_MODULE_IDS.includes(m.moduleId) && !m.isCore);

    const installed = optional.filter((m) => installedModules.includes(m.moduleId));

    return {
      coreModules: core,
      optionalModules: optional,
      installedCount: installed.length,
      totalCount: optional.length,
    };
  }, [availableModules, installedModules]);

  // Filter optional modules by search and tab
  const filteredOptional = useMemo(() => {
    let result = optionalModules;

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (m: any) =>
          m.name.toLowerCase().includes(lower) ||
          m.description.toLowerCase().includes(lower) ||
          m.moduleId.toLowerCase().includes(lower)
      );
    }

    if (tab === "installed") {
      result = result.filter((m: any) => installedModules.includes(m.moduleId));
    } else if (tab === "available") {
      result = result.filter(
        (m: any) => !installedModules.includes(m.moduleId) && m.availableForTier
      );
    } else if (tab === "upgrade") {
      result = result.filter((m: any) => !m.availableForTier);
    }

    return result;
  }, [optionalModules, search, tab, installedModules]);

  if (authLoading || tenantLoading || availableModules === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const handleInstall = (moduleId: string) => {
    const mod = (availableModules as any[])?.find((m) => m.moduleId === moduleId);
    if (!mod) return;
    setDialogState({
      open: true,
      moduleId,
      moduleName: mod.name,
      requiredTier: mod.tier,
      action: "install",
    });
  };

  const handleUninstall = (moduleId: string) => {
    if (CORE_MODULE_IDS.includes(moduleId)) return; // Safety check
    const mod = (availableModules as any[])?.find((m) => m.moduleId === moduleId);
    if (!mod) return;
    setDialogState({
      open: true,
      moduleId,
      moduleName: mod.name,
      requiredTier: mod.tier,
      action: "uninstall",
    });
  };

  const handleConfirm = async () => {
    if (!tenantId) return;
    setIsProcessing(true);
    try {
      if (dialogState.action === "install") {
        await installModule({
          sessionToken: sessionToken ?? "",
          tenantId,
          moduleId: dialogState.moduleId,
        });
      } else {
        await uninstallModule({
          sessionToken: sessionToken ?? "",
          tenantId,
          moduleId: dialogState.moduleId,
        });
      }
      setDialogState((s) => ({ ...s, open: false }));
    } catch (error) {
      console.error("Module operation failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Module Marketplace"
        description={`Manage your school's modules. Current plan: ${tier ?? "Free"}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Marketplace" },
        ]}
        actions={
          <Link href="/admin/marketplace/requests">
            <Button variant="outline">
              <ClipboardList className="mr-2 h-4 w-4" />
              Access Requests
            </Button>
          </Link>
        }
      />

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{coreModules.length}</p>
              <p className="text-xs text-muted-foreground">Core Modules</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{installedCount}</p>
              <p className="text-xs text-muted-foreground">Installed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Download className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCount - installedCount}</p>
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Shield className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold capitalize">{tier}</p>
              <p className="text-xs text-muted-foreground">Current Plan</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Core Modules Section */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-semibold">Core Modules</h2>
          <Badge variant="secondary" className="gap-1">
            <Lock className="h-3 w-3" />
            Always Active
          </Badge>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          These modules are included with every plan and cannot be uninstalled. They provide the foundation for your school management.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coreModules.map((mod: any) => (
            <Card key={mod.moduleId} className="relative overflow-hidden ring-1 ring-primary/20">
              <div className="absolute right-2 top-2">
                <Badge variant="default" className="gap-1 bg-blue-600">
                  <Shield className="h-3 w-3" />
                  Core
                </Badge>
              </div>
              <CardContent className="p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{mod.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {mod.description}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                  <span className="text-xs text-muted-foreground">Free</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Optional Modules Section */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Optional Modules</h2>
          <p className="text-sm text-muted-foreground">
            Install additional modules to extend your school&apos;s capabilities. Modules available depend on your subscription plan.
          </p>
        </div>

        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search modules..."
            className="max-w-sm"
          />
          <Tabs value={tab} onValueChange={setTab} className="w-auto">
            <TabsList>
              <TabsTrigger value="all">All ({optionalModules.length})</TabsTrigger>
              <TabsTrigger value="installed">
                Installed ({installedCount})
              </TabsTrigger>
              <TabsTrigger value="available">Available</TabsTrigger>
              <TabsTrigger value="upgrade">Upgrade Required</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOptional.map((mod: any) => (
            <ModuleCard
              key={mod.moduleId}
              moduleId={mod.moduleId}
              name={mod.name}
              description={mod.description}
              tier={mod.tier}
              category={mod.category}
              status={mod.status}
              isInstalled={installedModules.includes(mod.moduleId)}
              availableForTier={mod.availableForTier}
              onInstall={() => handleInstall(mod.moduleId)}
              onUninstall={() => handleUninstall(mod.moduleId)}
            />
          ))}
        </div>

        {filteredOptional.length === 0 && (
          <div className="py-12 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              {search
                ? "No modules match your search."
                : tab === "installed"
                  ? "No optional modules installed yet. Browse available modules to get started."
                  : tab === "upgrade"
                    ? "All modules available for your plan are shown. Upgrade to access more."
                    : "No modules available."}
            </p>
          </div>
        )}
      </div>

      {/* Dependency Info */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <h3 className="font-medium text-amber-900">Module Dependencies</h3>
            <p className="mt-1 text-sm text-amber-800">
              Some modules require other modules to be installed first. For example, Timetable requires
              both SIS and Academics. The system will prevent you from uninstalling a module that other
              installed modules depend on.
            </p>
          </div>
        </CardContent>
      </Card>

      <InstallDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((s) => ({ ...s, open }))}
        moduleName={dialogState.moduleName}
        moduleId={dialogState.moduleId}
        requiredTier={dialogState.requiredTier}
        action={dialogState.action}
        onConfirm={handleConfirm}
        isLoading={isProcessing}
      />
    </div>
  );
}
// Trigger deployment 03/15/2026 02:09:06
