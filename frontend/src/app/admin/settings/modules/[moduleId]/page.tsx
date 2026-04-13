"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ModuleAccessConfig } from "@/components/modules/ModuleAccessConfig";
import { ModuleConfigForm } from "@/components/modules/ModuleConfigForm";
import { ModuleNotificationSettings } from "@/components/modules/ModuleNotificationSettings";
import { toast } from "sonner";
import { Save, Settings2, Shield, BellRing, CreditCard } from "lucide-react";

export default function ModuleSettingsPage() {
  const params = useParams();
  const moduleSlug = params.moduleId as string;
  const { sessionToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const canQuery = !authLoading && isAuthenticated && !!sessionToken;

  const moduleDetail = useQuery(
    api.modules.marketplace.settings.getModuleDetail,
    canQuery ? { sessionToken, moduleSlug } : "skip"
  )?.data as any;
  const accessConfig = useQuery(
    api.modules.marketplace.settings.getModuleAccessConfig,
    canQuery ? { sessionToken, moduleSlug } : "skip"
  )?.data as any;
  const moduleConfig = useQuery(
    api.modules.marketplace.settings.getModuleConfig,
    canQuery ? { sessionToken, moduleSlug } : "skip"
  )?.data as Record<string, any> | undefined;
  const notificationSettings = useQuery(
    api.modules.marketplace.settings.getModuleNotificationSettings,
    canQuery ? { sessionToken, moduleSlug } : "skip"
  )?.data as any;
  const billingInfo = useQuery(
    api.modules.marketplace.settings.getModuleBillingInfo,
    canQuery ? { sessionToken, moduleSlug } : "skip"
  )?.data as any;

  const updateAccessConfig = useMutation(api.modules.marketplace.settings.updateModuleAccessConfig);
  const updateModuleConfig = useMutation(api.modules.marketplace.settings.updateModuleConfig);
  const updateNotificationSettings = useMutation(
    api.modules.marketplace.settings.updateModuleNotificationSettings
  );

  const [draftRoleAccess, setDraftRoleAccess] = useState<any[] | null>(null);
  const [draftConfig, setDraftConfig] = useState<Record<string, any> | null>(null);
  const [draftNotifications, setDraftNotifications] = useState<any[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const roleAccess = draftRoleAccess ?? accessConfig?.roleAccess ?? [];
  const configValue = draftConfig ?? moduleConfig ?? {};
  const notificationsValue =
    draftNotifications ?? notificationSettings?.notifications ?? [];

  const features = useMemo(
    () =>
      (moduleDetail?.features ?? []).map((feature: any) => ({
        key: feature.key,
        label: feature.label,
        description: feature.description,
      })),
    [moduleDetail]
  );

  if (
    authLoading ||
    (canQuery &&
      (moduleDetail === undefined ||
        accessConfig === undefined ||
        moduleConfig === undefined ||
        notificationSettings === undefined ||
        billingInfo === undefined))
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

  async function handleSaveConfig() {
    setIsSaving(true);
    try {
      await updateModuleConfig({
        sessionToken,
        moduleSlug,
        config: configValue,
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
            <CardTitle>Module Workspace</CardTitle>
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
