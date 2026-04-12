"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { FileUploader } from "@/components/platform/FileUploader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Database, Globe, Loader2, Mail, Save, Shield, Smartphone, Wrench } from "lucide-react";
import { DATE_FORMATS, DEFAULT_SETTINGS_DRAFT, PLATFORM_LANGUAGES, PLATFORM_TIMEZONES, SettingsDraft, WEEK_START_OPTIONS, applyDbSettings, getSectionEntries } from "./settingsDraft";

type PlatformSetting = { key: string; value: unknown; updatedAt: number };
type MaintenanceWindow = { _id: string; startAt: number; endAt: number; reason: string; affectsTenants: string[]; bypassIps: string[]; status: "scheduled" | "in_progress" | "completed" | "cancelled" };
type TabKey = keyof SettingsDraft;

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "general", label: "General" },
  { key: "branding", label: "Branding" },
  { key: "domain", label: "Domain & Routing" },
  { key: "email", label: "Email" },
  { key: "sms", label: "SMS" },
  { key: "push", label: "Push" },
  { key: "payments", label: "Payment Providers" },
  { key: "security", label: "Security" },
  { key: "dataPrivacy", label: "Data & Privacy" },
  { key: "integrations", label: "Integrations" },
  { key: "maintenance", label: "Maintenance" },
];

const EMAIL_TEMPLATES = [
  "Welcome email",
  "Invite email",
  "Password reset",
  "Trial expiry warning",
  "Payment success receipt",
  "Payment failed notification",
  "Subscription cancelled",
  "Module installed confirmation",
  "Pilot grant activated",
  "Pilot grant expiry warning",
  "Publisher application received",
  "Publisher application approved",
  "Publisher application rejected",
  "Module approved",
  "Module rejected",
  "Module changes requested",
  "Payout processed",
  "Reseller application approved",
  "Reseller commission statement",
];

const groupSettings = (rows: PlatformSetting[]) =>
  rows.reduce<Record<string, Record<string, string>>>((acc, row) => {
    const [section, ...rest] = row.key.split(".");
    if (!section || rest.length === 0) return acc;
    if (!acc[section]) acc[section] = {};
    acc[section][rest.join(".")] =
      typeof row.value === "string" ? row.value : JSON.stringify(row.value ?? "");
    return acc;
  }, {});

const secretPreview = (value: string) => (value ? `••••••${value.slice(-4)}` : "Not configured");

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function SectionHeader({
  title,
  dirty,
  saving,
  onReset,
  onSave,
}: {
  title: string;
  dirty: boolean;
  saving: boolean;
  onReset: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-background/80 p-5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Badge
          variant="outline"
          className={
            dirty
              ? "border-amber-500/20 bg-amber-500/10 text-amber-700"
              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
          }
        >
          {dirty ? "Unsaved changes" : "Synced"}
        </Badge>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onReset}>Reset tab</Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}

function Metric({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 pt-6">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-3">
          <Icon className="h-5 w-5 text-emerald-700" />
        </div>
      </CardContent>
    </Card>
  );
}

function JsonEditor({ label, value, onChange }: { label: string; value: unknown; onChange: (next: unknown) => void }) {
  return (
    <Field label={label}>
      <Textarea
        rows={18}
        value={JSON.stringify(value, null, 2)}
        onChange={(e) => {
          try {
            onChange(JSON.parse(e.target.value));
          } catch {}
        }}
      />
    </Field>
  );
}

export default function PlatformSettingsPage() {
  const { isLoading, sessionToken, user } = useAuth();
  const { hasRole } = usePermissions();
  const { toast } = useToast();
  const isMasterAdmin = hasRole("master_admin");
  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const [draft, setDraft] = useState<SettingsDraft>(DEFAULT_SETTINGS_DRAFT);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState<Partial<Record<TabKey, boolean>>>({});
  const [saving, setSaving] = useState<TabKey | null>(null);
  const [sending, setSending] = useState<"email" | "sms" | "push" | null>(null);
  const [emailTo, setEmailTo] = useState(user?.email ?? "");
  const [smsPhone, setSmsPhone] = useState("");
  const [pushToken, setPushToken] = useState("");
  const [maintenanceForm, setMaintenanceForm] = useState({ startAt: "", endAt: "", reason: "", affectsTenants: "", bypassIps: "" });

  const platformSettings = usePlatformQuery(
    api.modules.platform.ops.getPlatformSettings,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken && isMasterAdmin
  ) as PlatformSetting[] | undefined;
  const maintenanceWindows = usePlatformQuery(
    api.modules.platform.ops.getMaintenanceWindows,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken && isMasterAdmin
  ) as MaintenanceWindow[] | undefined;
  const updatePlatformSettings = useMutation(api.modules.platform.ops.updatePlatformSettings);
  const createMaintenanceWindow = useMutation(api.modules.platform.ops.createMaintenanceWindow);
  const updateMaintenanceWindow = useMutation(api.modules.platform.ops.updateMaintenanceWindow);
  const sendPlatformTestEmail = useMutation(api.modules.platform.ops.sendPlatformTestEmail);
  const sendPlatformTestSms = useMutation(api.modules.platform.ops.sendPlatformTestSms);
  const sendPlatformTestPush = useMutation(api.modules.platform.ops.sendPlatformTestPush);

  useEffect(() => {
    if (platformSettings && !loaded) {
      setDraft(applyDbSettings(DEFAULT_SETTINGS_DRAFT, groupSettings(platformSettings)));
      setLoaded(true);
    }
  }, [loaded, platformSettings]);

  const stats = useMemo(
    () => ({
      savedCount: platformSettings?.length ?? 0,
      activeWindows: (maintenanceWindows ?? []).filter(
        (window) => window.status === "scheduled" || window.status === "in_progress"
      ).length,
      encryptedCount: (platformSettings ?? []).filter((row) =>
        /(apiKey|secret|token|webhook|credential|passkey|dsn)/i.test(row.key)
      ).length,
      lastUpdatedAt: (platformSettings ?? []).reduce(
        (latest, row) => Math.max(latest, row.updatedAt),
        0
      ),
    }),
    [maintenanceWindows, platformSettings]
  );

  const updateValue = (section: TabKey, key: string, value: unknown) => {
    setDraft((current) => ({
      ...current,
      [section]: { ...(current[section] as Record<string, unknown>), [key]: value },
    }) as SettingsDraft);
    setDirty((current) => ({ ...current, [section]: true }));
  };

  const setWholeSection = (section: TabKey, value: unknown) => {
    setDraft((current) => ({ ...current, [section]: value as SettingsDraft[TabKey] }));
    setDirty((current) => ({ ...current, [section]: true }));
  };

  const resetSection = (section: TabKey) => {
    setDraft((current) => ({
      ...current,
      [section]: structuredClone(DEFAULT_SETTINGS_DRAFT[section]),
    }));
    setDirty((current) => ({ ...current, [section]: true }));
  };

  const saveSection = async (section: TabKey) => {
    if (!sessionToken) return;
    setSaving(section);
    try {
      await updatePlatformSettings({
        sessionToken,
        updates: getSectionEntries(draft, section),
      });
      setDirty((current) => ({ ...current, [section]: false }));
      toast({
        title: `${TABS.find((tab) => tab.key === section)?.label ?? "Section"} saved`,
        description: "Platform settings were updated and audit logged.",
      });
    } catch (error) {
      toast({
        title: "Unable to save settings",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const queueTest = async (
    kind: "email" | "sms" | "push",
    fn: () => Promise<void>,
    success: string
  ) => {
    setSending(kind);
    try {
      await fn();
      toast({ title: success, description: "The request has been queued successfully." });
    } catch (error) {
      toast({
        title: `Unable to send test ${kind}`,
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(null);
    }
  };

  if (isLoading || (isMasterAdmin && (!platformSettings || !maintenanceWindows))) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!isMasterAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Platform Settings"
          description="Only platform master admins can update global settings."
          breadcrumbs={[{ label: "Platform", href: "/platform" }, { label: "Settings" }]}
        />
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Your role can access the platform shell, but global settings remain master-admin only.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Platform Settings"
        description="End-to-end control of platform identity, branding, routing, messaging, payments, security, privacy, integrations, and maintenance."
        breadcrumbs={[{ label: "Platform", href: "/platform" }, { label: "Settings" }]}
        badge={
          <Badge
            variant="outline"
            className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
          >
            Master Admin
          </Badge>
        }
        actions={
          <Button onClick={() => saveSection(activeTab)} disabled={saving === activeTab}>
            {saving === activeTab ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save current tab
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-4">
        <Metric title="Saved Keys" value={`${stats.savedCount}`} icon={Database} />
        <Metric title="Primary Domain" value={draft.domain.primaryDomain} icon={Globe} />
        <Metric
          title="Maintenance"
          value={draft.maintenance.maintenanceMode ? "Enabled" : "Standby"}
          icon={Wrench}
        />
        <Metric title="Protected Secrets" value={`${stats.encryptedCount}`} icon={Shield} />
      </div>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)} className="space-y-6">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 rounded-2xl border bg-background/90 p-2">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="rounded-xl border border-transparent px-4 py-2 data-[state=active]:border-emerald-500/20 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              {tab.label}
              {dirty[tab.key] ? (
                <span className="ml-2 inline-block h-2 w-2 rounded-full bg-amber-300" />
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="general" className="space-y-6">
          <SectionHeader title="General" dirty={!!dirty.general} saving={saving === "general"} onReset={() => resetSection("general")} onSave={() => saveSection("general")} />
          <div className="grid gap-6 xl:grid-cols-2">
            <Card><CardHeader><CardTitle>Key General Fields</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><Field label="Platform name"><Input value={draft.general.platformName} onChange={(e) => updateValue("general", "platformName", e.target.value)} /></Field><Field label="Platform tagline"><Input value={draft.general.platformTagline} onChange={(e) => updateValue("general", "platformTagline", e.target.value)} /></Field><Field label="Support email"><Input value={draft.general.supportEmail} onChange={(e) => updateValue("general", "supportEmail", e.target.value)} /></Field><Field label="Support phone"><Input value={draft.general.supportPhone} onChange={(e) => updateValue("general", "supportPhone", e.target.value)} /></Field><Field label="Timezone"><Select value={draft.general.timezone} onValueChange={(value) => updateValue("general", "timezone", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PLATFORM_TIMEZONES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><Field label="Language"><Select value={draft.general.language} onValueChange={(value) => updateValue("general", "language", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PLATFORM_LANGUAGES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><Field label="Date format"><Select value={draft.general.dateFormat} onValueChange={(value) => updateValue("general", "dateFormat", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DATE_FORMATS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><Field label="Week starts on"><Select value={draft.general.weekStartsOn} onValueChange={(value) => updateValue("general", "weekStartsOn", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{WEEK_START_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><div className="md:col-span-2"><Field label="Platform banner message"><Textarea rows={3} value={draft.general.announcementMessage} onChange={(e) => updateValue("general", "announcementMessage", e.target.value)} /></Field></div><div className="md:col-span-2"><div className="flex items-center justify-between rounded-xl border p-4"><div><p className="text-sm font-medium">Global announcement banner</p><p className="text-sm text-muted-foreground">Enable or disable the shared banner across tenant portals.</p></div><Switch checked={draft.general.announcementEnabled} onCheckedChange={(checked) => updateValue("general", "announcementEnabled", checked)} /></div></div></CardContent></Card>
            <div className="space-y-6"><FileUploader category="platform-general-assets" title="General Assets" description="Upload platform logos and favicon assets." /><Card><CardHeader><CardTitle>Full General Settings JSON</CardTitle><CardDescription>Edit every general setting from the full spec, including banner behavior and regional defaults.</CardDescription></CardHeader><CardContent><JsonEditor label="general" value={draft.general} onChange={(next) => setWholeSection("general", next)} /></CardContent></Card></div>
          </div>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <SectionHeader title="Branding" dirty={!!dirty.branding} saving={saving === "branding"} onReset={() => resetSection("branding")} onSave={() => saveSection("branding")} />
          <div className="grid gap-6 xl:grid-cols-2">
            <Card><CardHeader><CardTitle>Key Branding Fields</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><Field label="Primary color"><Input type="color" value={draft.branding.primaryColor} onChange={(e) => updateValue("branding", "primaryColor", e.target.value)} /></Field><Field label="Secondary color"><Input type="color" value={draft.branding.secondaryColor} onChange={(e) => updateValue("branding", "secondaryColor", e.target.value)} /></Field><Field label="Login layout"><Input value={draft.branding.loginLayout} onChange={(e) => updateValue("branding", "loginLayout", e.target.value)} /></Field><Field label="Login background type"><Input value={draft.branding.loginBackgroundType} onChange={(e) => updateValue("branding", "loginBackgroundType", e.target.value)} /></Field><Field label="Email header logo URL"><Input value={draft.branding.emailHeaderLogoUrl} onChange={(e) => updateValue("branding", "emailHeaderLogoUrl", e.target.value)} /></Field><Field label="SMS sender name"><Input value={draft.branding.smsSenderName} onChange={(e) => updateValue("branding", "smsSenderName", e.target.value)} /></Field></CardContent></Card>
            <div className="space-y-6"><FileUploader category="platform-branding-assets" title="Branding Assets" description="Upload login, email, and branded experience assets." /><Card><CardHeader><CardTitle>Full Branding Settings JSON</CardTitle><CardDescription>Includes color system, login page, email branding, SMS branding, and tenant portal branding.</CardDescription></CardHeader><CardContent><JsonEditor label="branding" value={draft.branding} onChange={(next) => setWholeSection("branding", next)} /></CardContent></Card></div>
          </div>
        </TabsContent>

        <TabsContent value="domain" className="space-y-6">
          <SectionHeader title="Domain & Routing" dirty={!!dirty.domain} saving={saving === "domain"} onReset={() => resetSection("domain")} onSave={() => saveSection("domain")} />
          <div className="grid gap-6 xl:grid-cols-2">
            <Card><CardHeader><CardTitle>Key Domain Fields</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><Field label="Primary domain"><Input value={draft.domain.primaryDomain} onChange={(e) => updateValue("domain", "primaryDomain", e.target.value)} /></Field><Field label="Platform admin URL"><Input value={draft.domain.platformAdminUrl} onChange={(e) => updateValue("domain", "platformAdminUrl", e.target.value)} /></Field><Field label="API base URL"><Input value={draft.domain.apiBaseUrl} onChange={(e) => updateValue("domain", "apiBaseUrl", e.target.value)} /></Field><Field label="Subdomain pattern"><Input value={draft.domain.subdomainPattern} onChange={(e) => updateValue("domain", "subdomainPattern", e.target.value)} /></Field><Field label="Reserved subdomains"><Textarea rows={4} value={draft.domain.reservedSubdomains.join("\n")} onChange={(e) => updateValue("domain", "reservedSubdomains", e.target.value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean))} /></Field><Field label="Collision handling"><Input value={draft.domain.subdomainCollisionHandling} onChange={(e) => updateValue("domain", "subdomainCollisionHandling", e.target.value)} /></Field></CardContent></Card>
            <Card><CardHeader><CardTitle>Full Domain Settings JSON</CardTitle><CardDescription>Includes canonical rules, custom domains, role redirects, and developer or reseller routes.</CardDescription></CardHeader><CardContent><JsonEditor label="domain" value={draft.domain} onChange={(next) => setWholeSection("domain", next)} /></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <SectionHeader title="Email" dirty={!!dirty.email} saving={saving === "email"} onReset={() => resetSection("email")} onSave={() => saveSection("email")} />
          <div className="grid gap-6 xl:grid-cols-2">
            <Card><CardHeader><CardTitle>Key Email Fields</CardTitle></CardHeader><CardContent className="space-y-4"><Field label="Resend API key"><Input type="password" value={draft.email.resendApiKey} placeholder={secretPreview(draft.email.resendApiKey)} onChange={(e) => updateValue("email", "resendApiKey", e.target.value)} /></Field><div className="grid gap-4 md:grid-cols-2"><Field label="From name"><Input value={draft.email.fromName} onChange={(e) => updateValue("email", "fromName", e.target.value)} /></Field><Field label="From email"><Input value={draft.email.fromEmail} onChange={(e) => updateValue("email", "fromEmail", e.target.value)} /></Field><Field label="Reply-to"><Input value={draft.email.replyToEmail} onChange={(e) => updateValue("email", "replyToEmail", e.target.value)} /></Field><Field label="Sending domain"><Input value={draft.email.sendingDomain} onChange={(e) => updateValue("email", "sendingDomain", e.target.value)} /></Field></div><Field label="Templates in scope"><Textarea rows={8} value={EMAIL_TEMPLATES.join("\n")} readOnly /></Field><Field label="Send test to"><Input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} /></Field><Button onClick={() => queueTest("email", () => sendPlatformTestEmail({ sessionToken: sessionToken!, to: emailTo.trim(), subject: "EduMyles settings test", body: "This is a test email from platform settings." }), "Test email queued")} disabled={sending === "email"}>{sending === "email" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}Send test email</Button></CardContent></Card>
            <Card><CardHeader><CardTitle>Full Email Settings JSON</CardTitle><CardDescription>Includes provider, sender identity, tracking, DNS verification, and template control surface.</CardDescription></CardHeader><CardContent><JsonEditor label="email" value={draft.email} onChange={(next) => setWholeSection("email", next)} /></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="sms" className="space-y-6">
          <SectionHeader title="SMS" dirty={!!dirty.sms} saving={saving === "sms"} onReset={() => resetSection("sms")} onSave={() => saveSection("sms")} />
          <div className="grid gap-6 xl:grid-cols-2">
            <Card><CardHeader><CardTitle>Key SMS Fields</CardTitle></CardHeader><CardContent className="space-y-4"><Field label="Africa's Talking API key"><Input type="password" value={draft.sms.apiKey} placeholder={secretPreview(draft.sms.apiKey)} onChange={(e) => updateValue("sms", "apiKey", e.target.value)} /></Field><div className="grid gap-4 md:grid-cols-2"><Field label="Username"><Input value={draft.sms.username} onChange={(e) => updateValue("sms", "username", e.target.value)} /></Field><Field label="Default sender ID"><Input value={draft.sms.defaultSenderId} onChange={(e) => updateValue("sms", "defaultSenderId", e.target.value)} /></Field><Field label="Fallback sender ID"><Input value={draft.sms.fallbackSenderId} onChange={(e) => updateValue("sms", "fallbackSenderId", e.target.value)} /></Field><Field label="Approval status"><Input value={draft.sms.defaultSenderApprovalStatus} onChange={(e) => updateValue("sms", "defaultSenderApprovalStatus", e.target.value)} /></Field></div><Field label="Test phone number"><Input value={smsPhone} onChange={(e) => setSmsPhone(e.target.value)} /></Field><Button onClick={() => queueTest("sms", () => sendPlatformTestSms({ sessionToken: sessionToken!, phone: smsPhone.trim(), message: "EduMyles platform settings SMS test.", country: "KE" }), "Test SMS queued")} disabled={sending === "sms"}>{sending === "sms" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Smartphone className="mr-2 h-4 w-4" />}Send test SMS</Button></CardContent></Card>
            <Card><CardHeader><CardTitle>Full SMS Settings JSON</CardTitle><CardDescription>Includes sender IDs by country, unicode options, quotas, and opt-out behavior.</CardDescription></CardHeader><CardContent><JsonEditor label="sms" value={draft.sms} onChange={(next) => setWholeSection("sms", next)} /></CardContent></Card>
          </div>
        </TabsContent>
        <TabsContent value="push" className="space-y-6">
          <SectionHeader title="Push Notifications" dirty={!!dirty.push} saving={saving === "push"} onReset={() => resetSection("push")} onSave={() => saveSection("push")} />
          <div className="grid gap-6 xl:grid-cols-2">
            <Card><CardHeader><CardTitle>Key Push Fields</CardTitle></CardHeader><CardContent className="space-y-4"><Field label="Expo access token"><Input type="password" value={draft.push.expoAccessToken} placeholder={secretPreview(draft.push.expoAccessToken)} onChange={(e) => updateValue("push", "expoAccessToken", e.target.value)} /></Field><div className="grid gap-4 md:grid-cols-2"><Field label="Icon URL"><Input value={draft.push.notificationIconUrl} onChange={(e) => updateValue("push", "notificationIconUrl", e.target.value)} /></Field><Field label="Notification color"><Input type="color" value={draft.push.notificationColor} onChange={(e) => updateValue("push", "notificationColor", e.target.value)} /></Field><Field label="Priority"><Input value={draft.push.deliveryPriority} onChange={(e) => updateValue("push", "deliveryPriority", e.target.value)} /></Field><Field label="TTL seconds"><Input type="number" value={draft.push.ttlSeconds} onChange={(e) => updateValue("push", "ttlSeconds", Number(e.target.value || 0))} /></Field></div><Field label="Device token"><Textarea rows={4} value={pushToken} onChange={(e) => setPushToken(e.target.value)} /></Field><Button onClick={() => queueTest("push", () => sendPlatformTestPush({ sessionToken: sessionToken!, pushToken: pushToken.trim(), title: "EduMyles settings test", body: "Push delivery is configured correctly." }), "Test push queued")} disabled={sending === "push"}>{sending === "push" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}Send test push</Button></CardContent></Card>
            <Card><CardHeader><CardTitle>Full Push Settings JSON</CardTitle><CardDescription>Includes badge behavior, sounds, delivery rules, and cleanup policy.</CardDescription></CardHeader><CardContent><JsonEditor label="push" value={draft.push} onChange={(next) => setWholeSection("push", next)} /></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <SectionHeader title="Payment Providers" dirty={!!dirty.payments} saving={saving === "payments"} onReset={() => resetSection("payments")} onSave={() => saveSection("payments")} />
          <div className="grid gap-6 xl:grid-cols-2">
            <Card><CardHeader><CardTitle>Key Payment Fields</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><Field label="VAT rate %"><Input type="number" value={draft.payments.vatRatePct} onChange={(e) => updateValue("payments", "vatRatePct", Number(e.target.value || 0))} /></Field><Field label="Grace period days"><Input type="number" value={draft.payments.paymentGracePeriodDays} onChange={(e) => updateValue("payments", "paymentGracePeriodDays", Number(e.target.value || 0))} /></Field><Field label="Invoice prefix"><Input value={draft.payments.invoiceNumberPrefix} onChange={(e) => updateValue("payments", "invoiceNumberPrefix", e.target.value)} /></Field><Field label="Invoice start"><Input type="number" value={draft.payments.invoiceNumberStart} onChange={(e) => updateValue("payments", "invoiceNumberStart", Number(e.target.value || 0))} /></Field><Field label="M-Pesa short code"><Input value={draft.payments.mpesaShortCode} onChange={(e) => updateValue("payments", "mpesaShortCode", e.target.value)} /></Field><Field label="Stripe publishable key"><Input value={draft.payments.stripePublishableKey} onChange={(e) => updateValue("payments", "stripePublishableKey", e.target.value)} /></Field><Field label="Bank name"><Input value={draft.payments.bankName} onChange={(e) => updateValue("payments", "bankName", e.target.value)} /></Field><Field label="Bank account number"><Input value={draft.payments.bankAccountNumber} onChange={(e) => updateValue("payments", "bankAccountNumber", e.target.value)} /></Field></CardContent></Card>
            <div className="space-y-6"><FileUploader category="platform-invoice-assets" title="Invoice Assets" description="Upload PDF invoice branding assets." /><Card><CardHeader><CardTitle>Full Payment Settings JSON</CardTitle><CardDescription>Includes M-Pesa, Airtel, Stripe, bank transfer, retries, invoice sequencing, and payout instructions.</CardDescription></CardHeader><CardContent><JsonEditor label="payments" value={draft.payments} onChange={(next) => setWholeSection("payments", next)} /></CardContent></Card></div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SectionHeader title="Security" dirty={!!dirty.security} saving={saving === "security"} onReset={() => resetSection("security")} onSave={() => saveSection("security")} />
          <div className="grid gap-6 xl:grid-cols-2">
            <Card><CardHeader><CardTitle>Key Security Fields</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><Field label="Minimum password length"><Input type="number" value={draft.security.passwordMinLength} onChange={(e) => updateValue("security", "passwordMinLength", Number(e.target.value || 0))} /></Field><Field label="Session timeout minutes"><Input type="number" value={draft.security.sessionTimeoutMinutes} onChange={(e) => updateValue("security", "sessionTimeoutMinutes", Number(e.target.value || 0))} /></Field><Field label="Max login attempts"><Input type="number" value={draft.security.maxLoginAttempts} onChange={(e) => updateValue("security", "maxLoginAttempts", Number(e.target.value || 0))} /></Field><Field label="Lockout duration minutes"><Input type="number" value={draft.security.lockoutDurationMinutes} onChange={(e) => updateValue("security", "lockoutDurationMinutes", Number(e.target.value || 0))} /></Field><Field label="MFA master_admin"><Input value={draft.security.mfaMasterAdmin} onChange={(e) => updateValue("security", "mfaMasterAdmin", e.target.value)} /></Field><Field label="MFA super_admin"><Input value={draft.security.mfaSuperAdmin} onChange={(e) => updateValue("security", "mfaSuperAdmin", e.target.value)} /></Field><Field label="CORS origins"><Textarea rows={4} value={draft.security.corsAllowedOrigins.join("\n")} onChange={(e) => updateValue("security", "corsAllowedOrigins", e.target.value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean))} /></Field><Field label="Admin IP allowlist"><Textarea rows={4} value={draft.security.ipAllowlist.join("\n")} onChange={(e) => updateValue("security", "ipAllowlist", e.target.value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean))} /></Field></CardContent></Card>
            <Card><CardHeader><CardTitle>Full Security Settings JSON</CardTitle><CardDescription>Includes password policy, sessions, login controls, MFA rules, geo-blocking, rate limits, CSP, and notifications.</CardDescription></CardHeader><CardContent><JsonEditor label="security" value={draft.security} onChange={(next) => setWholeSection("security", next)} /></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="dataPrivacy" className="space-y-6">
          <SectionHeader title="Data & Privacy" dirty={!!dirty.dataPrivacy} saving={saving === "dataPrivacy"} onReset={() => resetSection("dataPrivacy")} onSave={() => saveSection("dataPrivacy")} />
          <div className="grid gap-6 xl:grid-cols-2">
            <Card><CardHeader><CardTitle>Key Data & Privacy Fields</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><Field label="Audit logs retention days"><Input type="number" value={draft.dataPrivacy.auditLogsRetentionDays} onChange={(e) => updateValue("dataPrivacy", "auditLogsRetentionDays", Number(e.target.value || 0))} /></Field><Field label="Session logs retention days"><Input type="number" value={draft.dataPrivacy.sessionLogsRetentionDays} onChange={(e) => updateValue("dataPrivacy", "sessionLogsRetentionDays", Number(e.target.value || 0))} /></Field><Field label="Data export format"><Input value={draft.dataPrivacy.dataExportFormat} onChange={(e) => updateValue("dataPrivacy", "dataExportFormat", e.target.value)} /></Field><Field label="Export delivery"><Input value={draft.dataPrivacy.exportDeliveryMethod} onChange={(e) => updateValue("dataPrivacy", "exportDeliveryMethod", e.target.value)} /></Field><Field label="Privacy policy URL"><Input value={draft.dataPrivacy.privacyPolicyUrl} onChange={(e) => updateValue("dataPrivacy", "privacyPolicyUrl", e.target.value)} /></Field><Field label="Terms URL"><Input value={draft.dataPrivacy.termsOfServiceUrl} onChange={(e) => updateValue("dataPrivacy", "termsOfServiceUrl", e.target.value)} /></Field></CardContent></Card>
            <Card><CardHeader><CardTitle>Full Data & Privacy Settings JSON</CardTitle><CardDescription>Includes GDPR export settings, cookie consent, policy URLs, and data residency notes.</CardDescription></CardHeader><CardContent><JsonEditor label="dataPrivacy" value={draft.dataPrivacy} onChange={(next) => setWholeSection("dataPrivacy", next)} /></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <SectionHeader title="Integrations" dirty={!!dirty.integrations} saving={saving === "integrations"} onReset={() => resetSection("integrations")} onSave={() => saveSection("integrations")} />
          <div className="grid gap-6 xl:grid-cols-2">
            <Card><CardHeader><CardTitle>Key Integration Fields</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><Field label="WorkOS API key"><Input type="password" value={draft.integrations.workosApiKey} placeholder={secretPreview(draft.integrations.workosApiKey)} onChange={(e) => updateValue("integrations", "workosApiKey", e.target.value)} /></Field><Field label="WorkOS Client ID"><Input type="password" value={draft.integrations.workosClientId} placeholder={secretPreview(draft.integrations.workosClientId)} onChange={(e) => updateValue("integrations", "workosClientId", e.target.value)} /></Field><Field label="Sentry DSN"><Input type="password" value={draft.integrations.sentryDsn} placeholder={secretPreview(draft.integrations.sentryDsn)} onChange={(e) => updateValue("integrations", "sentryDsn", e.target.value)} /></Field><Field label="Slack webhook URL"><Input type="password" value={draft.integrations.slackWebhookUrl} placeholder={secretPreview(draft.integrations.slackWebhookUrl)} onChange={(e) => updateValue("integrations", "slackWebhookUrl", e.target.value)} /></Field><Field label="Google Analytics Measurement ID"><Input value={draft.integrations.googleAnalyticsMeasurementId} onChange={(e) => updateValue("integrations", "googleAnalyticsMeasurementId", e.target.value)} /></Field><Field label="Exchange rate provider"><Input value={draft.integrations.exchangeRateProvider} onChange={(e) => updateValue("integrations", "exchangeRateProvider", e.target.value)} /></Field></CardContent></Card>
            <Card><CardHeader><CardTitle>Full Integrations Settings JSON</CardTitle><CardDescription>Includes WorkOS, Sentry, Slack, analytics scope, and exchange rate API settings.</CardDescription></CardHeader><CardContent><JsonEditor label="integrations" value={draft.integrations} onChange={(next) => setWholeSection("integrations", next)} /></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <SectionHeader title="Maintenance" dirty={!!dirty.maintenance} saving={saving === "maintenance"} onReset={() => resetSection("maintenance")} onSave={() => saveSection("maintenance")} />
          <div className="grid gap-6 xl:grid-cols-2">
            <Card><CardHeader><CardTitle>Key Maintenance Fields</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex items-center justify-between rounded-xl border p-4"><div><p className="text-sm font-medium">Maintenance mode</p><p className="text-sm text-muted-foreground">Show a maintenance page to tenant portals while platform admin remains accessible.</p></div><Switch checked={draft.maintenance.maintenanceMode} onCheckedChange={(checked) => updateValue("maintenance", "maintenanceMode", checked)} /></div><Field label="Maintenance title"><Input value={draft.maintenance.maintenancePageTitle} onChange={(e) => updateValue("maintenance", "maintenancePageTitle", e.target.value)} /></Field><Field label="Maintenance message"><Textarea rows={4} value={draft.maintenance.maintenanceMessage} onChange={(e) => updateValue("maintenance", "maintenanceMessage", e.target.value)} /></Field><Field label="Expected duration"><Input value={draft.maintenance.expectedDuration} onChange={(e) => updateValue("maintenance", "expectedDuration", e.target.value)} /></Field><Field label="Bypass IPs"><Textarea rows={3} value={draft.maintenance.bypassIps.join("\n")} onChange={(e) => updateValue("maintenance", "bypassIps", e.target.value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean))} /></Field><Field label="Create maintenance window"><div className="grid gap-4"><Input type="datetime-local" value={maintenanceForm.startAt} onChange={(e) => setMaintenanceForm((current) => ({ ...current, startAt: e.target.value }))} /><Input type="datetime-local" value={maintenanceForm.endAt} onChange={(e) => setMaintenanceForm((current) => ({ ...current, endAt: e.target.value }))} /><Textarea rows={3} value={maintenanceForm.reason} onChange={(e) => setMaintenanceForm((current) => ({ ...current, reason: e.target.value }))} placeholder="Reason" /><Button onClick={async () => { try { await createMaintenanceWindow({ sessionToken: sessionToken!, startAt: new Date(maintenanceForm.startAt).getTime(), endAt: new Date(maintenanceForm.endAt).getTime(), reason: maintenanceForm.reason.trim(), affectsTenants: maintenanceForm.affectsTenants.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean), bypassIps: maintenanceForm.bypassIps.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean) }); setMaintenanceForm({ startAt: "", endAt: "", reason: "", affectsTenants: "", bypassIps: "" }); toast({ title: "Maintenance window created" }); } catch (error) { toast({ title: "Unable to create maintenance window", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" }); } }}><Wrench className="mr-2 h-4 w-4" />Create maintenance window</Button></div></Field></CardContent></Card>
            <Card><CardHeader><CardTitle>Full Maintenance Settings JSON</CardTitle><CardDescription>Includes health checks, backup metadata, bypass controls, and operational defaults.</CardDescription></CardHeader><CardContent><JsonEditor label="maintenance" value={draft.maintenance} onChange={(next) => setWholeSection("maintenance", next)} /></CardContent></Card>
          </div>
          <Card><CardHeader><CardTitle>Scheduled Windows</CardTitle><CardDescription>{stats.activeWindows} active or scheduled windows. Last update: {stats.lastUpdatedAt ? formatDateTime(stats.lastUpdatedAt) : "Not yet saved"}.</CardDescription></CardHeader><CardContent>{(maintenanceWindows ?? []).length > 0 ? <div className="space-y-4">{(maintenanceWindows ?? []).map((window) => <div key={window._id} className="rounded-2xl border p-4"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div className="space-y-2"><div className="flex items-center gap-2"><Badge variant="outline">{window.status.replace("_", " ")}</Badge><span className="text-sm font-medium">{window.reason}</span></div><div className="text-sm text-muted-foreground">{formatDateTime(window.startAt)} to {formatDateTime(window.endAt)}</div></div>{window.status !== "cancelled" && window.status !== "completed" ? <Button variant="outline" onClick={async () => { try { await updateMaintenanceWindow({ sessionToken: sessionToken!, maintenanceWindowId: window._id as never, status: "cancelled" }); toast({ title: "Maintenance window cancelled" }); } catch (error) { toast({ title: "Unable to cancel maintenance window", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" }); } }}>Cancel window</Button> : null}</div></div>)}</div> : <EmptyState icon={Wrench} title="No maintenance windows" description="Schedule a maintenance window to track outages, tenant impact, and bypass rules." />}</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
