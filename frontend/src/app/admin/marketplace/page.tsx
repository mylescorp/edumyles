"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ModuleGrid } from "./components/ModuleGrid";
import { InstallDialog } from "./components/InstallDialog";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";
import Link from "next/link";

export default function MarketplacePage() {
  const { isLoading: authLoading } = useAuth();
  const { tenantId, installedModules, tier, isLoading: tenantLoading } = useTenant();

  const availableModules = useQuery(
    api.modules.marketplace.queries.getAvailableForTier,
    tenantId ? { tenantId } : "skip"
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

  if (authLoading || tenantLoading || availableModules === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const handleInstall = (moduleId: string) => {
    const mod = availableModules?.find((m) => m.moduleId === moduleId);
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
    const mod = availableModules?.find((m) => m.moduleId === moduleId);
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
          tenantId,
          moduleId: dialogState.moduleId,
        });
      } else {
        await uninstallModule({
          tenantId,
          moduleId: dialogState.moduleId,
        });
      }
      setDialogState((s) => ({ ...s, open: false }));
    } catch (error) {
      // Error will show in console; Convex handles error propagation
      console.error("Module operation failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Module Marketplace"
        description={`Browse and install modules for your school. Current plan: ${tier ?? "Free"}`}
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

      <ModuleGrid
        modules={availableModules ?? []}
        installedModuleIds={installedModules}
        onInstall={handleInstall}
        onUninstall={handleUninstall}
      />

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
