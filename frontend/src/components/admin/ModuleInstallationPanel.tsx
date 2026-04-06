"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useInstalledModules } from "@/hooks/useInstalledModules";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import {
  Package,
  Star,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  DollarSign,
  BookOpen,
  Calendar,
  Bus,
  Library,
  MessageSquare,
  Headphones,
  Wallet,
  ShoppingCart,
  UserCog,
  ClipboardList,
  GraduationCap,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const MODULE_ICONS: Record<string, any> = {
  sis: GraduationCap,
  communications: MessageSquare,
  users: Users,
  admissions: ClipboardList,
  academics: BookOpen,
  finance: DollarSign,
  timetable: Calendar,
  hr: UserCog,
  library: Library,
  transport: Bus,
  ewallet: Wallet,
  ecommerce: ShoppingCart,
  tickets: Headphones,
};

const TIER_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-800 border-gray-200",
  starter: "bg-blue-100 text-blue-800 border-blue-200",
  standard: "bg-violet-100 text-violet-800 border-violet-200",
  growth: "bg-violet-100 text-violet-800 border-violet-200",
  pro: "bg-purple-100 text-purple-800 border-purple-200",
  premium: "bg-purple-100 text-purple-800 border-purple-200",
  enterprise: "bg-em-primary/10 text-em-primary border-em-primary/20",
};

const CATEGORY_COLORS: Record<string, string> = {
  academics: "bg-emerald-100 text-emerald-800",
  administration: "bg-blue-100 text-blue-800",
  communications: "bg-indigo-100 text-indigo-800",
  finance: "bg-amber-100 text-amber-800",
  analytics: "bg-rose-100 text-rose-800",
  security: "bg-red-100 text-red-800",
  integrations: "bg-violet-100 text-violet-800",
};

export function ModuleInstallationPanel() {
  const router = useRouter();
  const { sessionToken, isLoading, isAuthenticated } = useAuth();
  const { tenantId } = useTenant();
  const { isModuleInstalled, isModuleActive, installedModuleIds } = useInstalledModules();
  const hasLiveTenantSession =
    !!sessionToken && sessionToken !== "dev_session_token";
  const canQueryModules =
    !isLoading && isAuthenticated && hasLiveTenantSession;
  
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [isInstalling, setIsInstalling] = useState<string | null>(null);
  const [accessCheckModuleId, setAccessCheckModuleId] = useState<string | null>(null);

  // Mutations
  const installModule = useMutation(api.modules.marketplace.mutations.installModule);
  const uninstallModule = useMutation(api.modules.marketplace.mutations.uninstallModule);
  const toggleModuleStatus = useMutation(api.modules.marketplace.mutations.toggleModuleStatus);

  // Queries
  const availableModules = useQuery(
    api.modules.marketplace.queries.getAvailableForTier,
    canQueryModules ? { sessionToken } : "skip"
  );
  const accessStatus = useQuery(
    api.modules.marketplace.queries.getModuleAccessStatus,
    accessCheckModuleId && sessionToken
      ? { sessionToken, moduleId: accessCheckModuleId }
      : "skip"
  ) as
    | {
        status:
          | "allowed"
          | "plan_upgrade_required"
          | "rbac_escalation_required"
          | "payment_required"
          | "waitlist_only";
        reason: string;
        platformPriceKes?: number;
      }
    | undefined;
  const resolvedAvailableModules = (availableModules as any[]) ?? [];

  const handleInstall = useCallback(async (moduleId: string) => {
    if (!sessionToken || !tenantId) return;
    
    setIsInstalling(moduleId);
    try {
      await installModule({
        sessionToken,
        tenantId,
        moduleId,
      });
      
      toast({
        title: "Module Installed",
        description: "The module has been successfully installed and is now available.",
      });
    } catch (error: any) {
      toast({
        title: "Installation Failed",
        description: error.message || "Failed to install module. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInstalling(null);
    }
  }, [installModule, sessionToken, tenantId]);

  useEffect(() => {
    if (!accessCheckModuleId || !accessStatus) return;

    const moduleId = accessCheckModuleId;
    setAccessCheckModuleId(null);

    if (accessStatus.status === "allowed") {
      void handleInstall(moduleId);
      return;
    }

    if (accessStatus.status === "plan_upgrade_required") {
      toast({
        title: "Plan upgrade required",
        description: accessStatus.reason,
      });
      router.push("/admin/settings/billing");
      return;
    }

    if (accessStatus.status === "rbac_escalation_required") {
      toast({
        title: "Role assignment required",
        description: accessStatus.reason,
      });
      router.push("/admin/users");
      return;
    }

    if (accessStatus.status === "payment_required") {
      toast({
        title: "Payment required",
        description: "Complete payment from the marketplace module detail page to continue.",
      });
      router.push(`/admin/marketplace/${moduleId}`);
      return;
    }

    toast({
      title: "Module unavailable",
      description: accessStatus.reason,
      variant: "destructive",
    });
    router.push("/admin/marketplace/requests");
  }, [accessCheckModuleId, accessStatus, handleInstall, router]);

  const handleInstallRequest = (moduleId: string) => {
    setAccessCheckModuleId(moduleId);
  };

  const handleUninstall = async (moduleId: string) => {
    if (!sessionToken || !tenantId) return;
    
    try {
      await uninstallModule({
        sessionToken,
        tenantId,
        moduleId,
      });
      
      toast({
        title: "Module Uninstalled",
        description: "The module has been removed from your system.",
      });
    } catch (error: any) {
      toast({
        title: "Uninstallation Failed",
        description: error.message || "Failed to uninstall module. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (moduleId: string, status: "active" | "inactive") => {
    if (!sessionToken || !tenantId) return;
    
    try {
      await toggleModuleStatus({
        sessionToken,
        tenantId,
        moduleId,
        status,
      });
      
      toast({
        title: `Module ${status === "active" ? "Activated" : "Deactivated"}`,
        description: `The module has been ${status === "active" ? "enabled" : "disabled"}.`,
      });
    } catch (error: any) {
      toast({
        title: "Status Update Failed",
        description: error.message || "Failed to update module status.",
        variant: "destructive",
      });
    }
  };

  const renderModuleCard = (module: any) => {
    const Icon = MODULE_ICONS[module.moduleId] || Package;
    const isInstalled = isModuleInstalled(module.moduleId);
    const isActive = isModuleActive(module.moduleId);
    const isInstallingThis = isInstalling === module.moduleId;
    const isSelected = selectedModule === module.moduleId;

    return (
      <Card
        key={module.moduleId}
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-md",
          isSelected && "ring-2 ring-em-primary",
          isInstalled && "bg-gradient-to-r from-em-primary/5 to-transparent"
        )}
        onClick={() => setSelectedModule(isSelected ? null : module.moduleId)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                module.isCore ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-600"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{module.name}</CardTitle>
                  {module.isCore && (
                    <Badge variant="outline" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Core
                    </Badge>
                  )}
                  {isInstalled && (
                    <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                      {isActive ? "Active" : "Inactive"}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Module metadata */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={TIER_COLORS[module.tier] ?? TIER_COLORS.starter}>
              {module.tier.charAt(0).toUpperCase() + module.tier.slice(1)}
            </Badge>
            <Badge variant="outline" className={CATEGORY_COLORS[module.category] ?? CATEGORY_COLORS.academics}>
              {module.category}
            </Badge>
            <span className="text-xs text-muted-foreground">v{module.version}</span>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Key Features:</p>
            <div className="flex flex-wrap gap-1">
              {module.features.slice(0, 3).map((feature: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
              {module.features.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{module.features.length - 3} more
                </Badge>
              )}
            </div>
          </div>

          {/* Pricing */}
          {!module.isCore && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pricing:</span>
              <span className="font-medium">
                {module.platformPriceKes
                  ? `KES ${Number(module.platformPriceKes).toLocaleString()}`
                  : "Included in plan"}
                {module.pricing?.annual && module.platformPriceKes && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({module.pricing.annual}/yr)
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            {isInstalled ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleStatus(module.moduleId, isActive ? "inactive" : "active");
                  }}
                  disabled={module.isCore || isInstallingThis}
                >
                  {isActive ? (
                    <>
                      <XCircle className="h-4 w-4 mr-1" />
                      Disable
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Enable
                    </>
                  )}
                </Button>
                {!module.isCore && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUninstall(module.moduleId);
                    }}
                    disabled={isInstallingThis}
                  >
                    <Download className="h-4 w-4 mr-1 rotate-180" />
                    Remove
                  </Button>
                )}
              </>
            ) : (
              <Button
                className="flex-1"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleInstallRequest(module.moduleId);
                }}
                disabled={!module.availableForTier || isInstallingThis || accessCheckModuleId === module.moduleId}
              >
                {isInstallingThis ? (
                  <>
                    <Clock className="h-4 w-4 mr-1 animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    {isInstallingThis || accessCheckModuleId === module.moduleId
                      ? "Checking..."
                      : module.availableForTier
                        ? "Install"
                        : "Upgrade Required"}
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (canQueryModules && availableModules === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-em-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{resolvedAvailableModules.length}</p>
                <p className="text-xs text-muted-foreground">Available Modules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-em-success" />
              <div>
                <p className="text-2xl font-bold">{installedModuleIds.length}</p>
                <p className="text-xs text-muted-foreground">Installed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">
                  {resolvedAvailableModules.filter((m: any) => m.isCore).length}
                </p>
                <p className="text-xs text-muted-foreground">Core Modules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-em-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {installedModuleIds.filter(id => isModuleActive(id)).length}
                </p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module grid */}
      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resolvedAvailableModules.map(renderModuleCard)}
        </div>
      </ScrollArea>
    </div>
  );
}
