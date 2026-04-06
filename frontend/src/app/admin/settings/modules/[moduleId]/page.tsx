"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { USER_ROLES } from "@shared/constants";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ExternalLink, Save, Shield, Trash2 } from "lucide-react";

const CORE_MODULE_IDS = ["sis", "communications", "users"];

const MODULE_CONFIG_TEMPLATES: Record<string, Record<string, any>> = {
  sis: { enableBulkImport: true, requireAdmissionNumber: true, defaultCountry: "Kenya" },
  communications: { smsEnabled: true, emailEnabled: true, pushEnabled: true },
  users: { inviteOnly: true, enforceTwoFactorForAdmins: false },
  admissions: { onlineApplications: true, autoAssignAdmissionNumber: true, reviewWorkflow: "standard" },
  academics: { gradingSystem: "CBC", reportCardTemplate: "default", allowTeacherComments: true },
  finance: { currency: "KES", allowMpesaPayments: true, autoGenerateInvoices: true },
  timetable: { conflictDetection: true, allowRoomOverrides: false, schoolWeekStartsOn: "Monday" },
  hr: { payrollEnabled: true, leaveApprovalFlow: "manager_then_hr" },
  library: { overdueFineEnabled: true, maxBooksPerStudent: 3 },
  transport: { gpsTrackingEnabled: false, requireGuardianPickupCode: false },
  ewallet: { topUpEnabled: true, lowBalanceThreshold: 500 },
  ecommerce: { storefrontEnabled: true, inventorySync: true },
  tickets: { slaTracking: true, allowParentTickets: true },
};

export default function ModuleConfigPage() {
  const params = useParams();
  const moduleId = params.moduleId as string;
  const { isLoading: authLoading, isAuthenticated, sessionToken } = useAuth();
  const { tenantId, isLoading: tenantLoading } = useTenant();
  const hasLiveTenantSession =
    !!sessionToken && sessionToken !== "dev_session_token";
  const canQueryModule =
    !authLoading && isAuthenticated && hasLiveTenantSession;

  const moduleDetails = useQuery(
    api.modules.marketplace.queries.getModuleDetails,
    canQueryModule ? { sessionToken, moduleId } : "skip"
  );
  const moduleConfig = useQuery(
    api.modules.marketplace.modules.getModuleConfig,
    canQueryModule ? { moduleId } : "skip",
    canQueryModule
  ) as
    | {
        rolePermissions?: Record<string, string[]>;
        featureFlags?: Record<string, boolean>;
      }
    | undefined;
  const toggleStatus = useMutation(api.modules.marketplace.mutations.toggleModuleStatus);
  const updateModuleConfig = useMutation(api.modules.marketplace.modules.updateModuleConfig);
  const uninstallModule = useMutation(api.modules.marketplace.mutations.uninstallModule);
  const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>({});
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [confirmUninstall, setConfirmUninstall] = useState(false);

  const roleOptions = useMemo(() => {
    const platformRoles = new Set(["master_admin", "super_admin"]);
    const moduleSupportedRoles = moduleDetails?.supportedRoles as string[] | undefined;
    const fallbackRoles = Object.keys(USER_ROLES).filter((role) => !platformRoles.has(role));
    return (moduleSupportedRoles?.length ? moduleSupportedRoles : fallbackRoles).map((role) => ({
      value: role,
      label: USER_ROLES[role as keyof typeof USER_ROLES]?.label ?? role,
    }));
  }, [moduleDetails?.supportedRoles]);

  useEffect(() => {
    if (!moduleDetails) return;

    const configuredPermissions = moduleConfig?.rolePermissions ?? {};
    const nextRolePermissions = roleOptions.reduce<Record<string, boolean>>((acc, role) => {
      acc[role.value] = (configuredPermissions[role.value]?.length ?? 0) > 0;
      return acc;
    }, {});

    const configuredFeatureFlags = moduleConfig?.featureFlags ?? {};
    const templateFlags = Object.entries(MODULE_CONFIG_TEMPLATES[moduleId] ?? {}).reduce<Record<string, boolean>>(
      (acc, [key, value]) => {
        if (typeof value === "boolean") {
          acc[key] = value;
        }
        return acc;
      },
      {}
    );

    setRolePermissions(nextRolePermissions);
    setFeatureFlags({
      ...templateFlags,
      ...configuredFeatureFlags,
    });
  }, [moduleConfig, moduleDetails, moduleId, roleOptions]);

  if (
    authLoading ||
    tenantLoading ||
    (canQueryModule && (moduleDetails === undefined || moduleConfig === undefined))
  ) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!moduleDetails) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Module not found.</p>
      </div>
    );
  }

  const isCore = CORE_MODULE_IDS.includes(moduleId);
  const isInstalled = Boolean(moduleDetails.installed);
  const isActive = moduleDetails.installed?.status !== "inactive";

  const handleToggle = async () => {
    if (!tenantId || !sessionToken || isCore || !isInstalled) return;
    setIsSaving(true);
    try {
      await toggleStatus({
        sessionToken,
        tenantId,
        moduleId,
        status: isActive ? "inactive" : "active",
      });
      toast.success(`Module ${isActive ? "disabled" : "enabled"}`);
      setConfirmDisable(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update module");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!tenantId || !sessionToken) return;
    setIsSaving(true);
    try {
      const normalizedRolePermissions = Object.entries(rolePermissions).reduce<Record<string, string[]>>(
        (acc, [role, enabled]) => {
          if (enabled) {
            acc[role] = ["access"];
          }
          return acc;
        },
        {}
      );

      await updateModuleConfig({
        moduleId,
        rolePermissions: normalizedRolePermissions,
        featureFlags,
      });
      toast.success("Module settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUninstall = async () => {
    if (!tenantId || !sessionToken || isCore) return;
    setIsSaving(true);
    try {
      await uninstallModule({ sessionToken, tenantId, moduleId });
      toast.success("Module uninstalled");
      setConfirmUninstall(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to uninstall module");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={`${moduleDetails.name} Settings`}
        description="Manage status, configuration, support, and lifecycle for this module"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Modules", href: "/admin/settings/modules" },
          { label: moduleDetails.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {moduleDetails.documentation && (
              <Button variant="outline" asChild>
                <a href={moduleDetails.documentation} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Docs
                </a>
              </Button>
            )}
            {!isCore && isInstalled && (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmUninstall(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Uninstall
              </Button>
            )}
          </div>
        }
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
                  isActive
                    ? "default"
                    : "secondary"
                }
              >
                {isInstalled ? moduleDetails.installed.status : "not installed"}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Installed On</span>
              <span>
                {moduleDetails.installed?.installedAt
                  ? new Date(moduleDetails.installed.installedAt).toLocaleDateString(
                      "en-KE",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )
                  : "Built-in"}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Category</span>
              <span className="capitalize">{moduleDetails.category}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Required Tier</span>
              <span className="capitalize">{moduleDetails.tier}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Support</span>
              <span>{moduleDetails.support?.email ?? "support@edumyles.com"}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Module Type</span>
              <span className="flex items-center gap-1">
                {isCore && <Shield className="h-4 w-4 text-primary" />}
                {isCore ? "Core" : "Optional"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissions & Feature Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Module status</p>
                <p className="text-sm text-muted-foreground">
                  {isCore
                    ? "Core modules stay active for every tenant."
                    : "Disable the module temporarily without uninstalling it."}
                </p>
              </div>
              <Switch
                checked={isActive}
                disabled={isCore || !isInstalled || isSaving}
                onCheckedChange={() => setConfirmDisable(true)}
              />
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Role Permissions</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose which school roles should be allowed to access this module.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {roleOptions.map((role) => (
                  <div
                    key={role.value}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{role.label}</p>
                      <p className="text-xs text-muted-foreground">{role.value}</p>
                    </div>
                    <Switch
                      checked={rolePermissions[role.value] ?? false}
                      onCheckedChange={(checked) =>
                        setRolePermissions((current) => ({
                          ...current,
                          [role.value]: checked,
                        }))
                      }
                      disabled={isSaving}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Feature Flags</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Enable or disable optional module behaviors for your school.
                </p>
              </div>
              {Object.keys(featureFlags).length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No feature toggles defined for this module yet.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(featureFlags).map(([flag, enabled]) => (
                    <div
                      key={flag}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{flag}</p>
                        <p className="text-xs text-muted-foreground">
                          Toggle module-specific behavior for this tenant.
                        </p>
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) =>
                          setFeatureFlags((current) => ({
                            ...current,
                            [flag]: checked,
                          }))
                        }
                        disabled={isSaving}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveConfig} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Included Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {(moduleDetails.features ?? []).map((feature: string) => (
                <div key={feature} className="rounded-lg border p-3 text-sm">
                  {feature}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDisable}
        onOpenChange={setConfirmDisable}
        title={isActive ? "Disable Module" : "Enable Module"}
        description={
          isActive
            ? `Disable "${moduleDetails.name}"? Its features will be hidden until you enable it again.`
            : `Enable "${moduleDetails.name}" and make its features available again?`
        }
        confirmLabel={isActive ? "Disable" : "Enable"}
        variant={isActive ? "destructive" : "default"}
        onConfirm={handleToggle}
        isLoading={isSaving}
      />

      <ConfirmDialog
        open={confirmUninstall}
        onOpenChange={setConfirmUninstall}
        title="Uninstall Module"
        description={`Uninstall "${moduleDetails.name}" from your school?`}
        confirmLabel="Uninstall"
        variant="destructive"
        onConfirm={handleUninstall}
        isLoading={isSaving}
      />
    </div>
  );
}
