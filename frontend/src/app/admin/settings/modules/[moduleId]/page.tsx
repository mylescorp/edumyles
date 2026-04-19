"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { USER_ROLES } from "@shared/constants";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ModuleAccessConfig } from "@/components/modules/ModuleAccessConfig";
import { ModuleConfigForm } from "@/components/modules/ModuleConfigForm";
import { ModuleNotificationSettings } from "@/components/modules/ModuleNotificationSettings";
import { toast } from "sonner";
import { Save, Settings2, Shield, BellRing, CreditCard } from "lucide-react";

export default function ModuleSettingsPage() {
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

  if (!moduleDetail) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Module settings could not be loaded.
      </div>
    );
  }

  async function handleSaveAccess() {
    setIsSaving(true);
    try {
      await updateAccessConfig({
        sessionToken,
        moduleSlug,
        roleAccess,
      });
      toast.success("Access settings updated");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to update access settings");
    } finally {
      setIsSaving(false);
    }
  }

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
      toast.success("Module configuration saved");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveNotifications() {
    setIsSaving(true);
    try {
      await updateNotificationSettings({
        sessionToken,
        moduleSlug,
        notifications: notificationsValue,
      });
      toast.success("Notification settings saved");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to save notification settings");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${moduleDetail.name} Settings`}
        description="Manage access, configuration, notifications, and billing for this module."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Modules", href: "/admin/modules" },
          { label: moduleDetail.name },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Slug</span>
              <span className="font-mono text-xs">{moduleSlug}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Version</span>
              <span>{moduleDetail.version}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge>{moduleDetail.install?.status ?? "not installed"}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Category</span>
              <span className="capitalize">{moduleDetail.category}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
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
            <Tabs defaultValue="access" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="access" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Access
                </TabsTrigger>
                <TabsTrigger value="config" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  Configuration
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2">
                  <BellRing className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="billing" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Billing
                </TabsTrigger>
              </TabsList>

              <TabsContent value="access" className="space-y-4">
                <ModuleAccessConfig
                  roleAccess={roleAccess}
                  features={features}
                  onChange={setDraftRoleAccess}
                />
                <div className="flex justify-end">
                  <Button onClick={handleSaveAccess} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Access
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="config" className="space-y-4">
                <ModuleConfigForm
                  sections={moduleDetail.configSchema?.sections ?? []}
                  value={configValue}
                  onChange={setDraftConfig}
                />
                <div className="flex justify-end">
                  <Button onClick={handleSaveConfig} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Configuration
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4">
                <ModuleNotificationSettings
                  definitions={moduleDetail.notificationsCatalog ?? []}
                  value={notificationsValue}
                  onChange={setDraftNotifications}
                />
                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Notifications
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="billing" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Billing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Billing period</span>
                      <span className="capitalize">
                        {billingInfo?.install?.billingPeriod ?? "monthly"}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Current price</span>
                      <span>KES {billingInfo?.install?.currentPriceKes ?? 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Invoice History</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(billingInfo?.invoices ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No billing history is available for this module yet.
                      </p>
                    ) : (
                      (billingInfo.invoices as any[]).map((invoice) => (
                        <div
                          key={invoice._id}
                          className="flex items-center justify-between rounded-lg border p-3 text-sm"
                        >
                          <div>
                            <p className="font-medium">{invoice.status}</p>
                            <p className="text-muted-foreground">
                              Due {new Date(invoice.dueDate).toLocaleDateString("en-KE")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">KES {invoice.totalAmountKes}</p>
                            <p className="text-xs text-muted-foreground">
                              VAT KES {invoice.vatAmountKes}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
