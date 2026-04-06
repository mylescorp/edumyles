"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDateTime } from "@/lib/formatters";
import {
  AlertTriangle,
  CheckCircle2,
  Flag,
  Globe,
  Loader2,
  Megaphone,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Wrench,
} from "lucide-react";
import {
  applyDbSettings,
  BACKUP_FREQUENCIES,
  DATE_FORMATS,
  DEFAULT_SETTINGS_DRAFT,
  PAYMENT_GATEWAYS,
  PLATFORM_TIMEZONES,
  SettingsDraft,
  SMS_PROVIDERS,
} from "./settingsDraft";

type PlatformSetting = {
  _id?: string;
  key: string;
  value: unknown;
  updatedAt: number;
};

type FeatureFlagRow = {
  _id: string;
  key: string;
  enabledGlobally: boolean;
  enabledTenantIds: string[];
  rolloutPct?: number;
  updatedAt: number;
};

type MaintenanceWindow = {
  _id: string;
  startAt: number;
  endAt: number;
  reason: string;
  affectsTenants: string[];
  bypassIps: string[];
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  createdAt: number;
};

type PlatformAnnouncement = {
  _id: string;
  title: string;
  body: string;
  targetPlans: string[];
  targetCountries: string[];
  channels: string[];
  isCritical: boolean;
  startsAt: number;
  endsAt?: number;
  status: "draft" | "scheduled" | "active" | "archived";
  createdAt: number;
};

function formatSettingsForDraft(settings: PlatformSetting[]) {
  const grouped: Record<string, Record<string, string>> = {};

  for (const entry of settings) {
    const [section, ...rest] = entry.key.split(".");
    if (!section || rest.length === 0) continue;
    if (!grouped[section]) grouped[section] = {};
    grouped[section][rest.join(".")] = String(entry.value);
  }

  return grouped;
}

function flattenDraft(draft: SettingsDraft) {
  return [
    ...Object.entries(draft.general).map(([key, value]) => ({ key: `general.${key}`, value })),
    ...Object.entries(draft.security).map(([key, value]) => ({ key: `security.${key}`, value })),
    ...Object.entries(draft.integrations).map(([key, value]) => ({ key: `integrations.${key}`, value })),
    ...Object.entries(draft.operations).map(([key, value]) => ({ key: `operations.${key}`, value })),
  ];
}

function statusClass(status: string) {
  switch (status) {
    case "active":
    case "scheduled":
      return "border-sky-500/20 bg-sky-500/10 text-sky-700";
    case "in_progress":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700";
    case "completed":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
    case "archived":
    case "cancelled":
      return "border-slate-500/20 bg-slate-500/10 text-slate-700";
    case "draft":
      return "border-purple-500/20 bg-purple-500/10 text-purple-700";
    default:
      return "border-slate-500/20 bg-slate-500/10 text-slate-700";
  }
}

export default function PlatformSettingsPage() {
  const { isLoading, sessionToken } = useAuth();
  const { hasRole } = usePermissions();
  const { toast } = useToast();
  const isMasterAdmin = hasRole("master_admin");
  const isPlatformAdmin = hasRole("master_admin", "super_admin", "platform_manager");

  const [draft, setDraft] = useState<SettingsDraft>(DEFAULT_SETTINGS_DRAFT);
  const [loadedFromDb, setLoadedFromDb] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);

  const [flagForm, setFlagForm] = useState({
    key: "",
    enabledGlobally: false,
    enabledTenantIds: "",
    rolloutPct: "",
  });
  const [maintenanceForm, setMaintenanceForm] = useState({
    startAt: "",
    endAt: "",
    reason: "",
    affectsTenants: "",
    bypassIps: "",
  });
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    body: "",
    targetPlans: "",
    targetCountries: "",
    channels: "in_app",
    isCritical: false,
    startsAt: "",
    endsAt: "",
    status: "draft" as PlatformAnnouncement["status"],
  });

  const platformSettings = usePlatformQuery(
    api.modules.platform.ops.getPlatformSettings,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken && isPlatformAdmin
  ) as PlatformSetting[] | undefined;

  const featureFlags = usePlatformQuery(
    api.modules.platform.ops.getFeatureFlags,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken && isPlatformAdmin
  ) as FeatureFlagRow[] | undefined;

  const maintenanceWindows = usePlatformQuery(
    api.modules.platform.ops.getMaintenanceWindows,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken && isPlatformAdmin
  ) as MaintenanceWindow[] | undefined;

  const announcements = usePlatformQuery(
    api.modules.platform.ops.getPlatformAnnouncements,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken && isPlatformAdmin
  ) as PlatformAnnouncement[] | undefined;

  const upsertPlatformSetting = useMutation(api.modules.platform.ops.upsertPlatformSetting);
  const upsertFeatureFlag = useMutation(api.modules.platform.ops.upsertFeatureFlag);
  const createMaintenanceWindow = useMutation(api.modules.platform.ops.createMaintenanceWindow);
  const createPlatformAnnouncement = useMutation(api.modules.platform.ops.createPlatformAnnouncement);
  const archivePlatformAnnouncement = useMutation(api.modules.platform.ops.archivePlatformAnnouncement);

  useEffect(() => {
    if (platformSettings && !loadedFromDb) {
      setDraft(applyDbSettings(DEFAULT_SETTINGS_DRAFT, formatSettingsForDraft(platformSettings)));
      setLoadedFromDb(true);
    }
  }, [loadedFromDb, platformSettings]);

  const stats = useMemo(() => {
    const settingsCount = platformSettings?.length ?? 0;
    const enabledFlags = (featureFlags ?? []).filter((flag) => flag.enabledGlobally).length;
    const activeMaintenance = (maintenanceWindows ?? []).filter(
      (window) => window.status === "scheduled" || window.status === "in_progress"
    ).length;
    const activeAnnouncements = (announcements ?? []).filter(
      (announcement) => announcement.status === "active" || announcement.status === "scheduled"
    ).length;
    return { settingsCount, enabledFlags, activeMaintenance, activeAnnouncements };
  }, [announcements, featureFlags, maintenanceWindows, platformSettings]);

  const featureFlagRows = featureFlags ?? [];
  const maintenanceRows = maintenanceWindows ?? [];
  const announcementRows = announcements ?? [];

  if (isLoading || (isPlatformAdmin && (!platformSettings || !featureFlags || !maintenanceWindows || !announcements))) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!isMasterAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Platform Settings"
          description="Platform configuration"
          breadcrumbs={[
            { label: "Platform", href: "/platform" },
            { label: "Settings" },
          ]}
        />
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Only platform master admins can update global settings.
          </CardContent>
        </Card>
      </div>
    );
  }

  const saveSettings = async () => {
    if (!sessionToken) return;
    setIsSaving(true);
    try {
      for (const item of flattenDraft(draft)) {
        await upsertPlatformSetting({
          sessionToken,
          key: item.key,
          value: item.value,
        });
      }
      setDirty(false);
      toast({ title: "Platform settings saved" });
    } catch (error) {
      toast({
        title: "Unable to save settings",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const createFlag = async () => {
    if (!sessionToken || !flagForm.key.trim()) return;
    try {
      await upsertFeatureFlag({
        sessionToken,
        key: flagForm.key.trim(),
        enabledGlobally: flagForm.enabledGlobally,
        enabledTenantIds: flagForm.enabledTenantIds
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        rolloutPct: flagForm.rolloutPct ? Number(flagForm.rolloutPct) : undefined,
      });
      setFlagDialogOpen(false);
      setFlagForm({ key: "", enabledGlobally: false, enabledTenantIds: "", rolloutPct: "" });
      toast({ title: "Feature flag saved" });
    } catch (error) {
      toast({
        title: "Unable to save feature flag",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const createMaintenance = async () => {
    if (!sessionToken || !maintenanceForm.startAt || !maintenanceForm.endAt || !maintenanceForm.reason.trim()) return;
    try {
      await createMaintenanceWindow({
        sessionToken,
        startAt: new Date(maintenanceForm.startAt).getTime(),
        endAt: new Date(maintenanceForm.endAt).getTime(),
        reason: maintenanceForm.reason.trim(),
        affectsTenants: maintenanceForm.affectsTenants.split(",").map((value) => value.trim()).filter(Boolean),
        bypassIps: maintenanceForm.bypassIps.split(",").map((value) => value.trim()).filter(Boolean),
      });
      setMaintenanceDialogOpen(false);
      setMaintenanceForm({ startAt: "", endAt: "", reason: "", affectsTenants: "", bypassIps: "" });
      toast({ title: "Maintenance window created" });
    } catch (error) {
      toast({
        title: "Unable to create maintenance window",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const createAnnouncement = async () => {
    if (!sessionToken || !announcementForm.title.trim() || !announcementForm.body.trim() || !announcementForm.startsAt) return;
    try {
      await createPlatformAnnouncement({
        sessionToken,
        title: announcementForm.title.trim(),
        body: announcementForm.body.trim(),
        targetPlans: announcementForm.targetPlans.split(",").map((value) => value.trim()).filter(Boolean),
        targetCountries: announcementForm.targetCountries.split(",").map((value) => value.trim()).filter(Boolean),
        channels: announcementForm.channels.split(",").map((value) => value.trim()).filter(Boolean),
        isCritical: announcementForm.isCritical,
        startsAt: new Date(announcementForm.startsAt).getTime(),
        endsAt: announcementForm.endsAt ? new Date(announcementForm.endsAt).getTime() : undefined,
        status: announcementForm.status,
      });
      setAnnouncementDialogOpen(false);
      setAnnouncementForm({
        title: "",
        body: "",
        targetPlans: "",
        targetCountries: "",
        channels: "in_app",
        isCritical: false,
        startsAt: "",
        endsAt: "",
        status: "draft",
      });
      toast({ title: "Announcement created" });
    } catch (error) {
      toast({
        title: "Unable to create announcement",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleArchiveAnnouncement = async (announcementId: string) => {
    if (!sessionToken) return;
    try {
      await archivePlatformAnnouncement({ sessionToken, announcementId: announcementId as never });
      toast({ title: "Announcement archived" });
    } catch (error) {
      toast({
        title: "Unable to archive announcement",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Settings"
        description="Manage core platform configuration, rollout controls, maintenance windows, and broadcast announcements."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Settings" },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setDraft(DEFAULT_SETTINGS_DRAFT);
              setDirty(true);
            }}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset draft
            </Button>
            <Button onClick={saveSettings} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save settings
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Stored settings" value={String(stats.settingsCount)} icon={Settings} />
        <MetricCard title="Enabled flags" value={String(stats.enabledFlags)} icon={Flag} />
        <MetricCard title="Open maintenance" value={String(stats.activeMaintenance)} icon={Wrench} />
        <MetricCard title="Live announcements" value={String(stats.activeAnnouncements)} icon={Globe} />
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="settings">Core Settings</TabsTrigger>
          <TabsTrigger value="flags">Feature Flags</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Platform Name">
                  <Input value={draft.general.platformName} onChange={(event) => {
                    setDirty(true);
                    setDraft({ ...draft, general: { ...draft.general, platformName: event.target.value } });
                  }} />
                </Field>
                <Field label="Platform Description">
                  <Textarea rows={3} value={draft.general.platformDescription} onChange={(event) => {
                    setDirty(true);
                    setDraft({ ...draft, general: { ...draft.general, platformDescription: event.target.value } });
                  }} />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Timezone">
                    <Select value={draft.general.timezone} onValueChange={(value) => {
                      setDirty(true);
                      setDraft({ ...draft, general: { ...draft.general, timezone: value } });
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PLATFORM_TIMEZONES.map((timezone) => (
                          <SelectItem key={timezone} value={timezone}>{timezone}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Date Format">
                    <Select value={draft.general.dateFormat} onValueChange={(value) => {
                      setDirty(true);
                      setDraft({ ...draft, general: { ...draft.general, dateFormat: value } });
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DATE_FORMATS.map((format) => (
                          <SelectItem key={format} value={format}>{format}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Password Min Length">
                    <Input type="number" value={draft.security.passwordMinLength} onChange={(event) => {
                      setDirty(true);
                      setDraft({ ...draft, security: { ...draft.security, passwordMinLength: Number(event.target.value || 0) } });
                    }} />
                  </Field>
                  <Field label="Session Timeout (min)">
                    <Input type="number" value={draft.security.sessionTimeoutMinutes} onChange={(event) => {
                      setDirty(true);
                      setDraft({ ...draft, security: { ...draft.security, sessionTimeoutMinutes: Number(event.target.value || 0) } });
                    }} />
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <ToggleRow
                    title="Require 2FA"
                    description="Apply two-factor auth to privileged users."
                    checked={draft.security.twoFactorRequired}
                    onCheckedChange={(checked) => {
                      setDirty(true);
                      setDraft({ ...draft, security: { ...draft.security, twoFactorRequired: checked } });
                    }}
                  />
                  <ToggleRow
                    title="Require Numbers"
                    description="Require numeric characters in passwords."
                    checked={draft.security.passwordRequireNumbers}
                    onCheckedChange={(checked) => {
                      setDirty(true);
                      setDraft({ ...draft, security: { ...draft.security, passwordRequireNumbers: checked } });
                    }}
                  />
                </div>
                <Field label="Allowed Domains (JSON array)">
                  <Textarea
                    rows={3}
                    value={JSON.stringify(draft.security.allowedDomains)}
                    onChange={(event) => {
                      setDirty(true);
                      try {
                        const parsed = JSON.parse(event.target.value);
                        if (Array.isArray(parsed)) {
                          setDraft({ ...draft, security: { ...draft.security, allowedDomains: parsed } });
                        }
                      } catch {}
                    }}
                  />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Integrations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Payment Gateway">
                  <Select value={draft.integrations.paymentGateway} onValueChange={(value) => {
                    setDirty(true);
                    setDraft({ ...draft, integrations: { ...draft.integrations, paymentGateway: value } });
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_GATEWAYS.map((gateway) => (
                        <SelectItem key={gateway} value={gateway}>{gateway}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="SMS Provider">
                  <Select value={draft.integrations.smsProvider} onValueChange={(value) => {
                    setDirty(true);
                    setDraft({ ...draft, integrations: { ...draft.integrations, smsProvider: value } });
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SMS_PROVIDERS.map((provider) => (
                        <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <ToggleRow
                  title="Analytics Enabled"
                  description="Allow analytics integrations across platform experiences."
                  checked={draft.integrations.analyticsEnabled}
                  onCheckedChange={(checked) => {
                    setDirty(true);
                    setDraft({ ...draft, integrations: { ...draft.integrations, analyticsEnabled: checked } });
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Operations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ToggleRow
                  title="Maintenance Mode"
                  description="Temporarily restrict platform access."
                  checked={draft.operations.maintenanceMode}
                  onCheckedChange={(checked) => {
                    setDirty(true);
                    setDraft({ ...draft, operations: { ...draft.operations, maintenanceMode: checked } });
                  }}
                />
                <ToggleRow
                  title="Registration Enabled"
                  description="Allow new registration and tenant onboarding."
                  checked={draft.operations.registrationEnabled}
                  onCheckedChange={(checked) => {
                    setDirty(true);
                    setDraft({ ...draft, operations: { ...draft.operations, registrationEnabled: checked } });
                  }}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Backup Frequency">
                    <Select value={draft.operations.backupFrequency} onValueChange={(value) => {
                      setDirty(true);
                      setDraft({ ...draft, operations: { ...draft.operations, backupFrequency: value } });
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BACKUP_FREQUENCIES.map((frequency) => (
                          <SelectItem key={frequency} value={frequency}>{frequency}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Retention Days">
                    <Input type="number" value={draft.operations.retentionDays} onChange={(event) => {
                      setDirty(true);
                      setDraft({ ...draft, operations: { ...draft.operations, retentionDays: Number(event.target.value || 0) } });
                    }} />
                  </Field>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="flags">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Feature Flags
              </CardTitle>
              <Button onClick={() => setFlagDialogOpen(true)}>New Flag</Button>
            </CardHeader>
            <CardContent>
              {featureFlagRows.length === 0 ? (
                <EmptyState icon={Flag} title="No feature flags yet" description="Feature flags will appear here once platform rollouts are configured." />
              ) : (
                <div className="space-y-4">
                  {featureFlagRows.map((flag) => (
                    <div key={String(flag._id)} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{flag.key}</p>
                          <p className="text-sm text-muted-foreground">
                            {flag.enabledTenantIds.length} tenant override{flag.enabledTenantIds.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        <Badge variant="outline" className={flag.enabledGlobally ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700" : "border-slate-500/20 bg-slate-500/10 text-slate-700"}>
                          {flag.enabledGlobally ? "Global" : "Scoped"}
                        </Badge>
                      </div>
                      <div className="mt-3 text-sm text-muted-foreground">
                        Rollout {flag.rolloutPct ?? 0}% · Updated {formatDateTime(flag.updatedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Maintenance Windows
              </CardTitle>
              <Button onClick={() => setMaintenanceDialogOpen(true)}>Schedule Window</Button>
            </CardHeader>
            <CardContent>
              {maintenanceRows.length === 0 ? (
                <EmptyState icon={Wrench} title="No maintenance windows" description="Scheduled maintenance windows will appear here." />
              ) : (
                <div className="space-y-4">
                  {maintenanceRows.map((window) => (
                    <div key={String(window._id)} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{window.reason}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(window.startAt)} to {formatDateTime(window.endAt)}
                          </p>
                        </div>
                        <Badge variant="outline" className={statusClass(window.status)}>
                          {window.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="mt-3 text-sm text-muted-foreground">
                        {window.affectsTenants.length > 0 ? `${window.affectsTenants.length} targeted tenant(s)` : "Global platform impact"} · Created {formatDateTime(window.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Announcements
              </CardTitle>
              <Button onClick={() => setAnnouncementDialogOpen(true)}>New Announcement</Button>
            </CardHeader>
            <CardContent>
              {announcementRows.length === 0 ? (
                <EmptyState icon={Megaphone} title="No announcements yet" description="Platform announcements will appear here once created." />
              ) : (
                <div className="space-y-4">
                  {announcementRows.map((announcement) => (
                    <div key={String(announcement._id)} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{announcement.title}</p>
                            {announcement.isCritical ? (
                              <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-700">
                                Critical
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{announcement.body}</p>
                        </div>
                        <Badge variant="outline" className={statusClass(announcement.status)}>
                          {announcement.status}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span>Starts {formatDateTime(announcement.startsAt)}</span>
                        {announcement.endsAt ? <span>Ends {formatDateTime(announcement.endsAt)}</span> : null}
                        <span>Created {formatDateTime(announcement.createdAt)}</span>
                      </div>
                      {announcement.status !== "archived" ? (
                        <div className="mt-4">
                          <Button variant="outline" size="sm" onClick={() => handleArchiveAnnouncement(announcement._id)}>
                            Archive
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {dirty ? (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-3 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
              <span>You have unpublished platform setting changes.</span>
            </div>
            <Button onClick={saveSettings} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save now
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="flex items-center gap-3 pt-6 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            <span>Platform settings are in sync with the latest saved configuration.</span>
          </CardContent>
        </Card>
      )}

      <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Feature Flag</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Field label="Key">
              <Input value={flagForm.key} onChange={(event) => setFlagForm({ ...flagForm, key: event.target.value })} placeholder="marketplace.beta_checkout" />
            </Field>
            <Field label="Tenant Overrides (comma-separated tenant IDs)">
              <Input value={flagForm.enabledTenantIds} onChange={(event) => setFlagForm({ ...flagForm, enabledTenantIds: event.target.value })} />
            </Field>
            <Field label="Rollout %">
              <Input type="number" value={flagForm.rolloutPct} onChange={(event) => setFlagForm({ ...flagForm, rolloutPct: event.target.value })} />
            </Field>
            <ToggleRow
              title="Enabled Globally"
              description="Turn this on for every tenant immediately."
              checked={flagForm.enabledGlobally}
              onCheckedChange={(checked) => setFlagForm({ ...flagForm, enabledGlobally: checked })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagDialogOpen(false)}>Cancel</Button>
            <Button onClick={createFlag}>Save Flag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Maintenance Window</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Field label="Start">
              <Input type="datetime-local" value={maintenanceForm.startAt} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, startAt: event.target.value })} />
            </Field>
            <Field label="End">
              <Input type="datetime-local" value={maintenanceForm.endAt} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, endAt: event.target.value })} />
            </Field>
            <Field label="Reason">
              <Textarea rows={3} value={maintenanceForm.reason} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, reason: event.target.value })} />
            </Field>
            <Field label="Affected Tenants (comma-separated tenant IDs)">
              <Input value={maintenanceForm.affectsTenants} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, affectsTenants: event.target.value })} />
            </Field>
            <Field label="Bypass IPs (comma-separated)">
              <Input value={maintenanceForm.bypassIps} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, bypassIps: event.target.value })} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaintenanceDialogOpen(false)}>Cancel</Button>
            <Button onClick={createMaintenance}>Create Window</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Create Announcement</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Field label="Title">
              <Input value={announcementForm.title} onChange={(event) => setAnnouncementForm({ ...announcementForm, title: event.target.value })} />
            </Field>
            <Field label="Body">
              <Textarea rows={4} value={announcementForm.body} onChange={(event) => setAnnouncementForm({ ...announcementForm, body: event.target.value })} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Start">
                <Input type="datetime-local" value={announcementForm.startsAt} onChange={(event) => setAnnouncementForm({ ...announcementForm, startsAt: event.target.value })} />
              </Field>
              <Field label="End">
                <Input type="datetime-local" value={announcementForm.endsAt} onChange={(event) => setAnnouncementForm({ ...announcementForm, endsAt: event.target.value })} />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Target Plans">
                <Input value={announcementForm.targetPlans} onChange={(event) => setAnnouncementForm({ ...announcementForm, targetPlans: event.target.value })} placeholder="starter,enterprise" />
              </Field>
              <Field label="Target Countries">
                <Input value={announcementForm.targetCountries} onChange={(event) => setAnnouncementForm({ ...announcementForm, targetCountries: event.target.value })} placeholder="Kenya,Uganda" />
              </Field>
              <Field label="Channels">
                <Input value={announcementForm.channels} onChange={(event) => setAnnouncementForm({ ...announcementForm, channels: event.target.value })} placeholder="in_app,email" />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Status">
                <Select value={announcementForm.status} onValueChange={(value) => setAnnouncementForm({ ...announcementForm, status: value as PlatformAnnouncement["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <ToggleRow
                title="Critical"
                description="Mark this announcement as high-visibility."
                checked={announcementForm.isCritical}
                onCheckedChange={(checked) => setAnnouncementForm({ ...announcementForm, isCritical: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnouncementDialogOpen(false)}>Cancel</Button>
            <Button onClick={createAnnouncement}>Create Announcement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: typeof Settings;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold">{value}</p>
          </div>
          <div className="rounded-xl border bg-muted/40 p-2">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border p-4">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
