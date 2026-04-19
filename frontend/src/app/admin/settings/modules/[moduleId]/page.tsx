"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { USER_ROLES } from "@shared/constants";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save } from "lucide-react";

type ModuleConfigRecord = {
  rolePermissions?: Record<string, string[]>;
  featureFlags?: Record<string, boolean>;
};

export default function ModuleSettingsPage() {
  const params = useParams();
  const moduleId = params.moduleId as string;
  const { isLoading: authLoading, isAuthenticated, sessionToken } = useAuth();
  const hasLiveTenantSession =
    !!sessionToken && sessionToken !== "dev_session_token";
  const canQueryModule = !authLoading && isAuthenticated && hasLiveTenantSession;

  const moduleDetails = useQuery(
    api.modules.marketplace.queries.getModuleDetails,
    canQueryModule ? { sessionToken, moduleId } : "skip"
  ) as any;

  const moduleConfig = useQuery(
    api.modules.marketplace.modules.getModuleConfig,
    canQueryModule ? { moduleId } : "skip"
  ) as ModuleConfigRecord | undefined;

  const updateModuleConfig = useMutation(
    api.modules.marketplace.modules.updateModuleConfig
  );

  const [isSaving, setIsSaving] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>({});
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({});

  const roleOptions = useMemo(() => {
    const platformRoles = new Set(["master_admin", "super_admin"]);
    const supportedRoles = (moduleDetails?.supportedRoles as string[] | undefined) ?? [];
    const fallbackRoles = Object.keys(USER_ROLES).filter(
      (role) => !platformRoles.has(role)
    );
    const roles = supportedRoles.length ? supportedRoles : fallbackRoles;
    return roles.map((role) => ({
      value: role,
      label: USER_ROLES[role as keyof typeof USER_ROLES]?.label ?? role,
    }));
  }, [moduleDetails?.supportedRoles]);

  useEffect(() => {
    const configuredPermissions = moduleConfig?.rolePermissions ?? {};
    const nextRolePermissions = roleOptions.reduce<Record<string, boolean>>(
      (acc, role) => {
        acc[role.value] = (configuredPermissions[role.value]?.length ?? 0) > 0;
        return acc;
      },
      {}
    );

    if (Object.keys(rolePermissions).length === 0 && roleOptions.length > 0) {
      setRolePermissions(nextRolePermissions);
    }

    if (
      Object.keys(featureFlags).length === 0 &&
      moduleConfig?.featureFlags &&
      Object.keys(moduleConfig.featureFlags).length > 0
    ) {
      setFeatureFlags(moduleConfig.featureFlags);
    }
  }, [
    featureFlags,
    moduleConfig?.featureFlags,
    moduleConfig?.rolePermissions,
    roleOptions,
    rolePermissions,
  ]);

  if (
    authLoading ||
    (canQueryModule && (moduleDetails === undefined || moduleConfig === undefined))
  ) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!moduleDetails) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Module settings could not be loaded.
      </div>
    );
  }

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const normalizedRolePermissions = Object.entries(rolePermissions).reduce<
        Record<string, string[]>
      >((acc, [role, enabled]) => {
        if (enabled) {
          acc[role] = ["access"];
        }
        return acc;
      }, {});

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
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${moduleDetails.name} Settings`}
        description="Manage role access and feature toggles for this module."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Modules", href: "/admin/modules" },
          { label: moduleDetails.name },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Module ID</span>
              <span className="font-mono text-xs">{moduleId}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Version</span>
              <span>{moduleDetails.version ?? "1.0.0"}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge>{moduleDetails.installed?.status ?? "not installed"}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Category</span>
              <span className="capitalize">{moduleDetails.category}</span>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground">Description</p>
              <p className="mt-2">{moduleDetails.description}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissions & Feature Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                  Enable or disable optional module behaviors for this tenant.
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
      </div>
    </div>
  );
}
