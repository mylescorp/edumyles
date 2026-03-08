"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
} from "lucide-react";

type SettingsDraft = {
  general: {
    platformName: string;
    platformDescription: string;
    timezone: string;
    dateFormat: string;
  };
  security: {
    passwordMinLength: number;
    sessionTimeoutMinutes: number;
    maxLoginAttempts: number;
    twoFactorRequired: boolean;
    allowedDomains: string[];
  };
  integrations: {
    paymentGateway: string;
    smsProvider: string;
    analyticsEnabled: boolean;
  };
  operations: {
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    backupFrequency: string;
    retentionDays: number;
  };
};

const DEFAULT_DRAFT: SettingsDraft = {
  general: {
    platformName: "EduMyles",
    platformDescription: "Comprehensive school management platform",
    timezone: "Africa/Nairobi",
    dateFormat: "DD/MM/YYYY",
  },
  security: {
    passwordMinLength: 8,
    sessionTimeoutMinutes: 480,
    maxLoginAttempts: 5,
    twoFactorRequired: false,
    allowedDomains: ["edumyles.com"],
  },
  integrations: {
    paymentGateway: "stripe",
    smsProvider: "africastalking",
    analyticsEnabled: true,
  },
  operations: {
    maintenanceMode: false,
    registrationEnabled: true,
    backupFrequency: "daily",
    retentionDays: 30,
  },
};

export default function PlatformSettingsPage() {
  const { isLoading, sessionToken } = useAuth();
  const { hasRole } = usePermissions();
  const { toast } = useToast();
  const isMasterAdmin = hasRole("master_admin");
  const isPlatformAdmin = hasRole("master_admin", "super_admin");

  const [draft, setDraft] = useState<SettingsDraft>(DEFAULT_DRAFT);
  const [dirty, setDirty] = useState(false);

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
    const activeTenants = platformStats?.activeTenants ?? 0;
    const totalTenants = platformStats?.totalTenants ?? 0;
    const health = totalTenants === 0 ? 100 : Math.round((activeTenants / totalTenants) * 100);
    return {
      securityEvents,
      settingsChanges,
      health,
      subscriptions: subscriptions?.length ?? 0,
    };
  }, [auditLogs, platformStats, subscriptions]);

  const saveDraft = () => {
    setDirty(false);
    toast({
      title: "Draft saved locally",
      description: "Persistent platform settings API is not implemented yet.",
    });
  };

  const resetDraft = () => {
    setDraft(DEFAULT_DRAFT);
    setDirty(false);
    toast({
      title: "Reset complete",
      description: "Local settings draft reset to defaults.",
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
            <Button variant="outline" onClick={resetDraft}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset Draft
            </Button>
            <Button className="bg-[#056C40] hover:bg-[#023c24]" onClick={saveDraft}>
              <Save className="mr-2 h-4 w-4" />
              Save Draft
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
              <CheckCircle2 className="h-5 w-5 text-green-600" />
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
                  <Input
                    value={draft.integrations.paymentGateway}
                    onChange={(e) => {
                      setDirty(true);
                      setDraft({ ...draft, integrations: { ...draft.integrations, paymentGateway: e.target.value } });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMS Provider</Label>
                  <Input
                    value={draft.integrations.smsProvider}
                    onChange={(e) => {
                      setDirty(true);
                      setDraft({ ...draft, integrations: { ...draft.integrations, smsProvider: e.target.value } });
                    }}
                  />
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
                  <Input
                    value={draft.operations.backupFrequency}
                    onChange={(e) => {
                      setDirty(true);
                      setDraft({ ...draft, operations: { ...draft.operations, backupFrequency: e.target.value } });
                    }}
                  />
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
          <CardContent className="pt-4 text-sm text-amber-800">
            Settings edits are currently local draft only. Persisted platform settings endpoints are not implemented yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
