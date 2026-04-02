"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  Settings,
  Shield,
  Globe,
  Database,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  applyDbSettings,
  BACKUP_FREQUENCIES,
  DATE_FORMATS,
  DEFAULT_SETTINGS_DRAFT,
  PAYMENT_GATEWAYS,
  PLATFORM_TIMEZONES,
  sectionToSettings,
  SettingsDraft,
  SMS_PROVIDERS,
} from "./settingsDraft";

export default function PlatformSettingsPage() {
  const { isLoading, sessionToken } = useAuth();
  const { hasRole } = usePermissions();
  const { toast } = useToast();
  const isMasterAdmin = hasRole("master_admin");
  const isPlatformAdmin = hasRole("master_admin", "super_admin");

  const [draft, setDraft] = useState<SettingsDraft>(DEFAULT_SETTINGS_DRAFT);
  const [dirty, setDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadedFromDb, setLoadedFromDb] = useState(false);

  // Fetch persisted settings from Convex
  const dbSettings = usePlatformQuery(
    api.platform.settings.queries.getSettings,
    { sessionToken },
    isPlatformAdmin && !!sessionToken
  ) as Record<string, Record<string, string>> | undefined;

  const updateSettings = useMutation(api.platform.settings.mutations.updateSettings);

  // Load DB settings into draft when they arrive
  useEffect(() => {
    if (dbSettings && !loadedFromDb) {
      setDraft(applyDbSettings(DEFAULT_SETTINGS_DRAFT, dbSettings));
      setLoadedFromDb(true);
    }
  }, [dbSettings, loadedFromDb]);

  const platformStats = usePlatformQuery(
    api.platform.tenants.queries.getPlatformStats,
    { sessionToken },
    isPlatformAdmin && !!sessionToken
  );
  const subscriptions = usePlatformQuery(
    api.platform.billing.queries.listSubscriptions,
    { sessionToken },
    isPlatformAdmin && !!sessionToken
  );
  const auditLogs = usePlatformQuery(
    api.platform.audit.queries.listAuditLogs,
    { sessionToken, limit: 300 },
    isPlatformAdmin && !!sessionToken
  );

  const derived = useMemo(() => {
    const logs = auditLogs ?? [];
    const securityEvents = logs.filter((l: any) =>
      /(suspend|deleted|unauthorized|failed|impersonation)/i.test(String(l.action))
    ).length;
    const settingsChanges = logs.filter((l: any) =>
      /settings\.updated/i.test(String(l.action))
    ).length;
    const activeTenants = (platformStats as any)?.activeTenants ?? 0;
    const totalTenants = (platformStats as any)?.totalTenants ?? 0;
    const health = totalTenants === 0 ? 100 : Math.round((activeTenants / totalTenants) * 100);
    return {
      securityEvents,
      settingsChanges,
      health,
      subscriptions: Array.isArray(subscriptions) ? subscriptions.length : 0,
    };
  }, [auditLogs, platformStats, subscriptions]);

  const saveSettings = async () => {
    if (!sessionToken) return;
    setIsSaving(true);
    try {
          const sections: Array<{ section: string; data: Record<string, any> }> = [
            { section: "general", data: draft.general },
            { section: "security", data: draft.security },
            { section: "integrations", data: draft.integrations },
            { section: "operations", data: draft.operations },
      ];

      for (const { section, data } of sections) {
        await updateSettings({
          sessionToken,
          section,
          settings: sectionToSettings(data),
        });
      }

      setDirty(false);
      toast({
        title: "Settings Saved",
        description: "Platform settings have been persisted successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Could not save settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = async () => {
    setDraft(DEFAULT_SETTINGS_DRAFT);
    setDirty(true);
    toast({
      title: "Reset to Defaults",
      description: "Settings reset to defaults. Click Save to persist.",
    });
  };

  if (isLoading) return <LoadingSkeleton variant="page" />;

  if (!isMasterAdmin) {
    return (
      <div>
        <PageHeader
          title="Platform Settings"
          description="Platform configuration"
          breadcrumbs={[
            { label: "Platform", href: "/platform" },
            { label: "Settings" },
          ]}
        />
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-muted-foreground">Only Master Admins can access platform settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        description="Platform-level operations settings and security posture"
        breadcrumbs={[
          { label: "Dashboard", href: "/platform" },
          { label: "Settings", href: "/platform/settings" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={resetToDefaults} disabled={isSaving}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset Defaults
            </Button>
            <Button className="bg-primary hover:bg-primary-dark" onClick={saveSettings} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Settings
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Platform Health</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold">{derived.health}%</span>
            <Badge variant={derived.health >= 80 ? "default" : "secondary"}>
              {derived.health >= 80 ? "Healthy" : "Watch"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Security Events</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold">{derived.securityEvents}</span>
            {derived.securityEvents > 0 ? (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-success" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Settings Changes</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{derived.settingsChanges}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Active Subscriptions</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{derived.subscriptions}</CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Platform Name</Label>
                <Input
                  value={draft.general.platformName}
                  onChange={(e) => {
                    setDirty(true);
                    setDraft({ ...draft, general: { ...draft.general, platformName: e.target.value } });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Platform Description</Label>
                <Textarea
                  rows={3}
                  value={draft.general.platformDescription}
                  onChange={(e) => {
                    setDirty(true);
                    setDraft({ ...draft, general: { ...draft.general, platformDescription: e.target.value } });
                  }}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={draft.general.timezone}
                    onValueChange={(value) => {
                      setDirty(true);
                      setDraft({ ...draft, general: { ...draft.general, timezone: value } });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORM_TIMEZONES.map((timezone) => (
                        <SelectItem key={timezone} value={timezone}>
                          {timezone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select
                    value={draft.general.dateFormat}
                    onValueChange={(value) => {
                      setDirty(true);
                      setDraft({ ...draft, general: { ...draft.general, dateFormat: value } });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_FORMATS.map((format) => (
                        <SelectItem key={format} value={format}>
                          {format}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Min Password Length</Label>
                  <Input
                    type="number"
                    value={draft.security.passwordMinLength}
                    onChange={(e) => {
                      setDirty(true);
                      setDraft({ ...draft, security: { ...draft.security, passwordMinLength: Number(e.target.value || 0) } });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={draft.security.sessionTimeoutMinutes}
                    onChange={(e) => {
                      setDirty(true);
                      setDraft({ ...draft, security: { ...draft.security, sessionTimeoutMinutes: Number(e.target.value || 0) } });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Login Attempts</Label>
                  <Input
                    type="number"
                    value={draft.security.maxLoginAttempts}
                    onChange={(e) => {
                      setDirty(true);
                      setDraft({ ...draft, security: { ...draft.security, maxLoginAttempts: Number(e.target.value || 0) } });
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium">Require Two-Factor Auth</p>
                  <p className="text-sm text-muted-foreground">Apply 2FA requirement for privileged users</p>
                </div>
                <Switch
                  checked={draft.security.twoFactorRequired}
                  onCheckedChange={(checked) => {
                    setDirty(true);
                    setDraft({ ...draft, security: { ...draft.security, twoFactorRequired: checked } });
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border p-3 text-sm">
                <p className="font-medium">Available Runtime Signals</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>Payment subscriptions detected: {derived.subscriptions}</li>
                  <li>Recent security events: {derived.securityEvents}</li>
                  <li>Platform tenant health: {derived.health}%</li>
                </ul>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Primary Payment Gateway</Label>
                  <Select
                    value={draft.integrations.paymentGateway}
                    onValueChange={(value) => {
                      setDirty(true);
                      setDraft({ ...draft, integrations: { ...draft.integrations, paymentGateway: value } });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_GATEWAYS.map((gateway) => (
                        <SelectItem key={gateway} value={gateway}>
                          {gateway}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>SMS Provider</Label>
                  <Select
                    value={draft.integrations.smsProvider}
                    onValueChange={(value) => {
                      setDirty(true);
                      setDraft({ ...draft, integrations: { ...draft.integrations, smsProvider: value } });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SMS_PROVIDERS.map((provider) => (
                        <SelectItem key={provider} value={provider}>
                          {provider}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium">Analytics Enabled</p>
                  <p className="text-sm text-muted-foreground">Enable client analytics integrations</p>
                </div>
                <Switch
                  checked={draft.integrations.analyticsEnabled}
                  onCheckedChange={(checked) => {
                    setDirty(true);
                    setDraft({ ...draft, integrations: { ...draft.integrations, analyticsEnabled: checked } });
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Operations Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">Temporarily disable broad platform access</p>
                </div>
                <Switch
                  checked={draft.operations.maintenanceMode}
                  onCheckedChange={(checked) => {
                    setDirty(true);
                    setDraft({ ...draft, operations: { ...draft.operations, maintenanceMode: checked } });
                  }}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium">Registration Enabled</p>
                  <p className="text-sm text-muted-foreground">Allow onboarding of new tenant users</p>
                </div>
                <Switch
                  checked={draft.operations.registrationEnabled}
                  onCheckedChange={(checked) => {
                    setDirty(true);
                    setDraft({ ...draft, operations: { ...draft.operations, registrationEnabled: checked } });
                  }}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Backup Frequency</Label>
                  <Select
                    value={draft.operations.backupFrequency}
                    onValueChange={(value) => {
                      setDirty(true);
                      setDraft({ ...draft, operations: { ...draft.operations, backupFrequency: value } });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BACKUP_FREQUENCIES.map((frequency) => (
                        <SelectItem key={frequency} value={frequency}>
                          {frequency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Retention Days</Label>
                  <Input
                    type="number"
                    value={draft.operations.retentionDays}
                    onChange={(e) => {
                      setDirty(true);
                      setDraft({ ...draft, operations: { ...draft.operations, retentionDays: Number(e.target.value || 0) } });
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {dirty && (
        <Card className="border-amber-300 bg-amber-50/60">
          <CardContent className="pt-4 text-sm text-amber-800 flex items-center justify-between">
            <span>You have unsaved changes.</span>
            <Button size="sm" onClick={saveSettings} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Now
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
