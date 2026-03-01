"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  const { isLoading: authLoading } = useAuth();
  const { tenantId, isLoading: tenantLoading } = useTenant();

  const installedModules = useQuery(
    api.modules.marketplace.queries.getInstalledModules,
    tenantId ? { tenantId } : "skip"
  );

  const toggleStatus = useMutation(api.modules.marketplace.mutations.toggleModuleStatus);

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
  const [isProcessing, setIsProcessing] = useState(false);

  if (authLoading || tenantLoading || installedModules === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!installedModules || installedModules.length === 0) {
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
    const mod = installedModules.find((m) => m.moduleId === moduleId);
    setConfirmState({
      open: true,
      moduleId,
      moduleName: mod?.moduleId ?? moduleId,
      newStatus: newStatus as "active" | "inactive",
    });
  };

  const handleConfirmToggle = async () => {
    if (!tenantId) return;
    setIsProcessing(true);
    try {
      await toggleStatus({
        tenantId,
        moduleId: confirmState.moduleId,
        status: confirmState.newStatus,
      });
      setConfirmState((s) => ({ ...s, open: false }));
    } catch (error) {
      console.error("Failed to toggle module status:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Installed Modules"
        description="Enable, disable, or configure your installed modules"
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
          {installedModules.map((mod) => {
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
                      <span className="font-medium capitalize">
                        {mod.moduleId.replace(/-/g, " ")}
                      </span>
                      <Badge
                        variant={isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Installed{" "}
                      {new Date(mod.installedAt).toLocaleDateString("en-KE")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link href={`/admin/settings/modules/${mod.moduleId}`}>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Switch
                    checked={isActive}
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
    </div>
  );
}
