"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { normalizeArray } from "@/lib/normalizeData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Package,
  Settings,
  GraduationCap,
  ClipboardList,
  DollarSign,
  BookOpen,
  Calendar,
  MessageSquare,
  UserCog,
  Library,
  Bus,
  Wallet,
  ShoppingCart,
  Trash2,
  Shield,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

const MODULE_ICONS: Record<string, LucideIcon> = {
  sis: GraduationCap,
  admissions: ClipboardList,
  finance: DollarSign,
  academics: BookOpen,
  timetable: Calendar,
  communications: MessageSquare,
  hr: UserCog,
  library: Library,
  transport: Bus,
  ewallet: Wallet,
  ecommerce: ShoppingCart,
};

export default function ModuleSettingsPage() {
  const { isLoading: authLoading, isAuthenticated, sessionToken } = useAuth();
  const { tenantId, tier, isLoading: tenantLoading } = useTenant();
  const hasLiveTenantSession =
    !!sessionToken && sessionToken !== "dev_session_token";
  const canQueryModules =
    !authLoading && isAuthenticated && hasLiveTenantSession;

  const installedModules = useQuery(
    api.modules.marketplace.queries.getInstalledModules,
    canQueryModules ? { sessionToken } : "skip"
  );
  const availableModules = useQuery(
    api.modules.marketplace.queries.getAvailableForTier,
    canQueryModules ? { sessionToken } : "skip"
  );
  const resolvedInstalledModules = normalizeArray<any>(installedModules);
  const resolvedAvailableModules = normalizeArray<any>(availableModules);

  const toggleStatus = useMutation(api.modules.marketplace.mutations.toggleModuleStatus);
  const uninstallModule = useMutation(api.modules.marketplace.mutations.uninstallModule);

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    moduleId: string;
    moduleName: string;
    newStatus: "active" | "inactive";
  }>({
    open: false,
    moduleId: "",
    moduleName: "",
    newStatus: "inactive",
  });
  const [uninstallState, setUninstallState] = useState<{
    open: boolean;
    moduleId: string;
    moduleName: string;
  }>({
    open: false,
    moduleId: "",
    moduleName: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const modules = useMemo(() => {
    const installed = resolvedInstalledModules;
    const catalogue = resolvedAvailableModules;
    const installedMap = new Map(
      installed.map((mod) => [String(mod.moduleSlug ?? mod.moduleId), mod])
    );

    return catalogue
      .filter((mod: any) => mod.isCore || installedMap.has(String(mod.moduleId)))
      .map((mod: any) => {
        const installedRecord = installedMap.get(String(mod.moduleId));
        return {
          moduleId: mod.moduleId,
          name: mod.name,
          description: mod.description,
          category: mod.category,
          tier: mod.tier,
          version: mod.version,
          isCore: Boolean(mod.isCore),
          status: installedRecord?.status ?? "active",
          installedAt: installedRecord?.installedAt ?? 0,
          config: installedRecord?.config ?? {},
        };
      })
      .sort((a, b) => Number(b.isCore) - Number(a.isCore) || a.name.localeCompare(b.name));
  }, [resolvedAvailableModules, resolvedInstalledModules]);

  const isModulesLoading =
    authLoading ||
    tenantLoading ||
    (canQueryModules &&
      (installedModules === undefined || availableModules === undefined));

  if (isModulesLoading) {
    return <LoadingSkeleton variant="page" />;
  }

  if (modules.length === 0) {
    return (
      <div>
        <PageHeader
          title="Installed Modules"
          description="Manage your installed modules"
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Settings", href: "/admin/settings" },
            { label: "Modules" },
          ]}
        />
        <EmptyState
          icon={Package}
          title="No modules installed"
          description="Visit the marketplace to install modules for your school."
          action={
            <Link href="/admin/marketplace">
              <Button>Browse Marketplace</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const handleToggle = (moduleId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const mod = modules.find((m) => m.moduleId === moduleId);
    setConfirmState({
      open: true,
      moduleId,
      moduleName: mod?.name ?? moduleId,
      newStatus: newStatus as "active" | "inactive",
    });
  };

  const handleConfirmToggle = async () => {
    if (!tenantId || !sessionToken) return;
    setIsProcessing(true);
    try {
      await toggleStatus({
        sessionToken,
        tenantId,
        moduleId: confirmState.moduleId,
        status: confirmState.newStatus,
      });
      setConfirmState((s) => ({ ...s, open: false }));
      toast.success(`Module ${confirmState.newStatus === "active" ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Failed to toggle module status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update module status");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUninstall = async () => {
    if (!tenantId || !sessionToken) return;
    setIsProcessing(true);
    try {
      await uninstallModule({
        sessionToken,
        tenantId,
        moduleId: uninstallState.moduleId,
      });
      setUninstallState({ open: false, moduleId: "", moduleName: "" });
      toast.success("Module uninstalled");
    } catch (error) {
      console.error("Failed to uninstall module:", error);
      toast.error(error instanceof Error ? error.message : "Failed to uninstall module");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Installed Modules"
        description={`Manage core and optional modules for your school. Current plan: ${tier}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Modules" },
        ]}
        actions={
          <Link href="/admin/marketplace">
            <Button variant="outline">
              <Package className="mr-2 h-4 w-4" />
              Marketplace
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="divide-y p-0">
          {modules.map((mod) => {
            const Icon = MODULE_ICONS[mod.moduleId] ?? Package;
            const isActive = mod.status === "active";

            return (
              <div
                key={mod.moduleId}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{mod.name}</span>
                      <Badge
                        variant={isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {isActive ? "Active" : "Inactive"}
                      </Badge>
                      {mod.isCore && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Shield className="h-3 w-3" />
                          Core
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{mod.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {mod.isCore
                        ? "Always available to every school"
                        : `Installed ${new Date(mod.installedAt).toLocaleDateString("en-KE")}`}{" "}
                      · <span className="capitalize">{mod.category}</span> · v{mod.version}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!mod.isCore && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() =>
                        setUninstallState({
                          open: true,
                          moduleId: mod.moduleId,
                          moduleName: mod.name,
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Link href={`/admin/settings/modules/${mod.moduleId}`}>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Switch
                    checked={isActive}
                    disabled={!sessionToken || mod.isCore}
                    onCheckedChange={() =>
                      handleToggle(mod.moduleId, mod.status)
                    }
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState((s) => ({ ...s, open }))}
        title={
          confirmState.newStatus === "active"
            ? "Enable Module"
            : "Disable Module"
        }
        description={
          confirmState.newStatus === "active"
            ? `Enable "${confirmState.moduleName}" module? This will make all its features available.`
            : `Disable "${confirmState.moduleName}" module? Its features will be temporarily unavailable. Your data will be preserved.`
        }
        confirmLabel={
          confirmState.newStatus === "active" ? "Enable" : "Disable"
        }
        variant={
          confirmState.newStatus === "active" ? "default" : "destructive"
        }
        onConfirm={handleConfirmToggle}
        isLoading={isProcessing}
      />

      <ConfirmDialog
        open={uninstallState.open}
        onOpenChange={(open) => setUninstallState((s) => ({ ...s, open }))}
        title="Uninstall Module"
        description={`Uninstall "${uninstallState.moduleName}"? This removes the optional module from your school while preserving existing records.`}
        confirmLabel="Uninstall"
        variant="destructive"
        onConfirm={handleUninstall}
        isLoading={isProcessing}
      />
    </div>
  );
}
