"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDate, formatRelativeTime } from "@/lib/formatters";
import {
  ArrowUpDown,
  CheckCircle2,
  Clock3,
  HeartPulse,
  MessageSquareMore,
  SearchX,
  ShieldCheck,
  Sparkles,
  TimerReset,
  TrendingUp,
} from "lucide-react";
import { TenantsAdminRail } from "@/components/platform/TenantsAdminRail";

type TenantSuccessRow = {
  tenantId: string;
  tenantName: string;
  country: string;
  county?: string | null;
  healthScore: number;
  stalled: boolean;
  wizardCompleted: boolean;
  currentStep: number;
  currentStepLabel: string;
  completedCount: number;
  totalSteps: number;
  progressPct: number;
  lastActivityAt: number;
  status: "converted" | "stalled" | "activated" | "at_risk" | "in_progress";
  tenantStatus: string;
  planId?: string | null;
  trialEndsAt?: number | null;
  currentPeriodEnd?: number | null;
  assignedAccountManager?: string | null;
  assignedAccountManagerName?: string | null;
  assignedAccountManagerInitials?: string | null;
  notes: Array<{ id: string; note: string; authorId: string; authorEmail: string; createdAt: number }>;
  interventionsSent: Array<{ type: string; sentAt: number; channel: string }>;
};

type TenantSuccessDashboard = {
  stats: {
    activeTrialsCount: number;
    activatedPercentage: number;
    stalledCount: number;
    averageHealthScore: number;
    convertingThisWeek: number;
  };
  rows: TenantSuccessRow[];
  stalledQueue: TenantSuccessRow[];
  nudgeTemplates: Array<{
    key: string;
    label: string;
    description: string;
    message: string;
  }>;
};

type PlatformAdmin = {
  eduMylesUserId: string;
  firstName?: string;
  lastName?: string;
  email: string;
};

type FilterKey = "all" | "at_risk" | "stalled" | "almost" | "activated" | "converted";
type SortKey = "tenant" | "country" | "health" | "status" | "lastActivity";

function healthClass(score: number) {
  if (score >= 80) return "text-emerald-700";
  if (score >= 60) return "text-amber-700";
  return "text-rose-700";
}

function healthBadgeClass(score: number) {
  if (score >= 80) return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
  if (score >= 60) return "border-amber-500/20 bg-amber-500/10 text-amber-700";
  return "border-rose-500/20 bg-rose-500/10 text-rose-700";
}

function statusBadgeClass(status: TenantSuccessRow["status"]) {
  switch (status) {
    case "converted":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
    case "activated":
      return "border-sky-500/20 bg-sky-500/10 text-sky-700";
    case "stalled":
      return "border-rose-500/20 bg-rose-500/10 text-rose-700";
    case "at_risk":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700";
    default:
      return "border-slate-500/20 bg-slate-500/10 text-slate-700";
  }
}

function statusLabel(status: TenantSuccessRow["status"]) {
  switch (status) {
    case "converted":
      return "Converted";
    case "activated":
      return "Activated";
    case "stalled":
      return "Stalled";
    case "at_risk":
      return "At risk";
    default:
      return "In progress";
  }
}

function daysUntil(timestamp?: number | null) {
  if (!timestamp) return null;
  return Math.ceil((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
}

function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string;
  value: string;
  helper: string;
  icon: typeof Clock3;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
          </div>
          <div className="rounded-xl border bg-muted/40 p-2">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TenantSuccessPage() {
  const { sessionToken, isLoading } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortBy, setSortBy] = useState<SortKey>("lastActivity");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [extendTarget, setExtendTarget] = useState<TenantSuccessRow | null>(null);
  const [extendDays, setExtendDays] = useState("7");
  const [extensionNote, setExtensionNote] = useState("");
  const [nudgeTarget, setNudgeTarget] = useState<TenantSuccessRow | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("stalled_step_auto");
  const [nudgeMessage, setNudgeMessage] = useState("");
  const [nudgeChannel, setNudgeChannel] = useState("email_sms");
  const [noteTarget, setNoteTarget] = useState<TenantSuccessRow | null>(null);
  const [platformNote, setPlatformNote] = useState("");
  const [accountManagerByTenant, setAccountManagerByTenant] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const dashboard = usePlatformQuery(
    api.modules.platform.onboarding.getTenantSuccessDashboard,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as TenantSuccessDashboard | undefined;

  const platformAdmins = usePlatformQuery(
    api.platform.users.queries.listPlatformAdmins,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as PlatformAdmin[] | undefined;

  const extendTrial = useMutation(api.modules.platform.subscriptions.extendTrial);
  const sendOnboardingNudge = useMutation(api.modules.platform.onboarding.sendOnboardingNudge);
  const assignAccountManager = useMutation(api.modules.platform.onboarding.assignAccountManager);
  const addPlatformOnboardingNote = useMutation(api.modules.platform.onboarding.addPlatformOnboardingNote);

  const nudgeTemplateOptions = dashboard?.nudgeTemplates ?? [];
  const activeTemplate = useMemo(
    () => nudgeTemplateOptions.find((template) => template.key === selectedTemplate) ?? nudgeTemplateOptions[0] ?? null,
    [nudgeTemplateOptions, selectedTemplate]
  );

  const filteredRows = useMemo(() => {
    const rows = dashboard?.rows ?? [];
    const needle = search.trim().toLowerCase();
    const nextRows = rows.filter((row) => {
      const matchesSearch =
        !needle ||
        row.tenantName.toLowerCase().includes(needle) ||
        row.tenantId.toLowerCase().includes(needle) ||
        row.country.toLowerCase().includes(needle) ||
        (row.assignedAccountManagerName ?? "").toLowerCase().includes(needle);

      if (!matchesSearch) return false;

      switch (filter) {
        case "at_risk":
          return row.healthScore < 20;
        case "stalled":
          return row.stalled;
        case "almost":
          return row.healthScore >= 40 && row.healthScore < 50;
        case "activated":
          return row.healthScore >= 50;
        case "converted":
          return row.status === "converted";
        default:
          return true;
      }
    });

    return nextRows.sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      switch (sortBy) {
        case "tenant":
          return a.tenantName.localeCompare(b.tenantName) * direction;
        case "country":
          return a.country.localeCompare(b.country) * direction;
        case "health":
          return (a.healthScore - b.healthScore) * direction;
        case "status":
          return a.status.localeCompare(b.status) * direction;
        default:
          return (a.lastActivityAt - b.lastActivityAt) * direction;
      }
    });
  }, [dashboard?.rows, filter, search, sortBy, sortDirection]);

  if (isLoading || dashboard === undefined || platformAdmins === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(key);
    setSortDirection(key === "tenant" || key === "country" ? "asc" : "desc");
  };

  const handleExtendTrial = async () => {
    if (!sessionToken || !extendTarget || Number(extendDays) <= 0) return;
    setSaving(true);
    try {
      await extendTrial({
        sessionToken,
        tenantId: extendTarget.tenantId,
        days: Number(extendDays),
      });
      if (extensionNote.trim()) {
        await addPlatformOnboardingNote({
          sessionToken,
          tenantId: extendTarget.tenantId,
          note: `Trial extended by ${extendDays} day(s): ${extensionNote.trim()}`,
        });
      }
      toast({
        title: "Trial extended",
        description: `${extendTarget.tenantName} received a ${extendDays}-day extension.`,
      });
      setExtendTarget(null);
      setExtendDays("7");
      setExtensionNote("");
    } catch (error) {
      toast({
        title: "Unable to extend trial",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendNudge = async () => {
    if (!sessionToken || !nudgeTarget || !activeTemplate) return;
    setSaving(true);
    try {
      await sendOnboardingNudge({
        sessionToken,
        tenantId: nudgeTarget.tenantId,
        template: selectedTemplate,
        message: nudgeMessage.trim() || undefined,
        sendEmail: nudgeChannel !== "sms_only",
        sendSms: nudgeChannel !== "email_only",
      });
      toast({
        title: "Onboarding nudge sent",
        description: `The tenant admin team for ${nudgeTarget.tenantName} has been nudged.`,
      });
      setNudgeTarget(null);
      setNudgeMessage("");
      setSelectedTemplate("stalled_step_auto");
      setNudgeChannel("email_sms");
    } catch (error) {
      toast({
        title: "Unable to send nudge",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAssignAccountManager = async (tenantId: string, accountManagerUserId: string) => {
    if (!sessionToken || !accountManagerUserId) return;
    try {
      await assignAccountManager({
        sessionToken,
        tenantId,
        accountManagerUserId,
      });
      setAccountManagerByTenant((current) => ({ ...current, [tenantId]: accountManagerUserId }));
      toast({
        title: "Account manager assigned",
        description: "The tenant onboarding owner has been updated.",
      });
    } catch (error) {
      toast({
        title: "Unable to assign account manager",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddNote = async () => {
    if (!sessionToken || !noteTarget || !platformNote.trim()) return;
    setSaving(true);
    try {
      await addPlatformOnboardingNote({
        sessionToken,
        tenantId: noteTarget.tenantId,
        note: platformNote.trim(),
      });
      toast({
        title: "Note added",
        description: `A platform note was added for ${noteTarget.tenantName}.`,
      });
      setNoteTarget(null);
      setPlatformNote("");
    } catch (error) {
      toast({
        title: "Unable to add note",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenant Success"
        description="Monitor onboarding health, stalled schools, and conversion readiness from one platform operations workspace."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Tenant Success" },
        ]}
      />

      <TenantsAdminRail currentHref="/platform/tenant-success" />

      <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterKey)}>
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-xl border bg-muted/30 p-1">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="at_risk">At Risk</TabsTrigger>
          <TabsTrigger value="stalled">Stalled</TabsTrigger>
          <TabsTrigger value="almost">Almost</TabsTrigger>
          <TabsTrigger value="activated">Activated</TabsTrigger>
          <TabsTrigger value="converted">Converted</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Active trials"
          value={String(dashboard.stats.activeTrialsCount)}
          helper="Schools currently in trial and still moving through setup."
          icon={Clock3}
        />
        <MetricCard
          title="Activated"
          value={`${dashboard.stats.activatedPercentage}%`}
          helper="Schools at 50+ health score and ready for real usage."
          icon={ShieldCheck}
        />
        <MetricCard
          title="Stalled"
          value={String(dashboard.stats.stalledCount)}
          helper="Schools inactive for 48+ hours and needing intervention."
          icon={TimerReset}
        />
        <MetricCard
          title="Average health"
          value={`${dashboard.stats.averageHealthScore}/100`}
          helper="Average onboarding health across the tracked tenant cohort."
          icon={HeartPulse}
        />
        <MetricCard
          title="Converting this week"
          value={String(dashboard.stats.convertingThisWeek)}
          helper="Schools that moved into active paid status during the last 7 days."
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Tenant success queue</CardTitle>
                <CardDescription>Sort and act on onboarding health, stall risk, and conversion readiness.</CardDescription>
              </div>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search school, tenant ID, country, AM"
                className="w-full md:w-80"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredRows.length === 0 ? (
              <EmptyState
                icon={search ? SearchX : Sparkles}
                title={search ? "No tenants match this search" : "No tenant success records yet"}
                description="As schools are onboarded and move through setup, they will appear here."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("tenant")}>
                        School
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("country")}>
                        Country
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("health")}>
                        Health
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("status")}>
                        Status
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("lastActivity")}>
                        Last activity
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </TableHead>
                    <TableHead>Assigned AM</TableHead>
                    <TableHead className="w-[320px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((tenant) => {
                    const trialEnd = tenant.trialEndsAt ?? tenant.currentPeriodEnd;
                    const daysLeft = daysUntil(trialEnd);
                    const selectedAm = accountManagerByTenant[tenant.tenantId] ?? tenant.assignedAccountManager ?? "";

                    return (
                      <TableRow key={tenant.tenantId}>
                        <TableCell>
                          <div>
                            <Link href={`/platform/tenants/${tenant.tenantId}`} className="font-medium hover:underline">
                              {tenant.tenantName}
                            </Link>
                            <div className="text-sm text-muted-foreground">{tenant.tenantId}</div>
                            <div className="text-xs text-muted-foreground">
                              {tenant.completedCount}/{tenant.totalSteps} steps · {tenant.currentStepLabel}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{tenant.country}</div>
                            <div className="text-xs text-muted-foreground">{tenant.county ?? "—"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className={`text-lg font-semibold ${healthClass(tenant.healthScore)}`}>
                              {tenant.healthScore}
                            </div>
                            <Progress value={tenant.healthScore} className="w-24" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <Badge variant="outline" className={statusBadgeClass(tenant.status)}>
                              {statusLabel(tenant.status)}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {tenant.tenantStatus}
                              {daysLeft !== null ? ` · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : ""}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{formatRelativeTime(tenant.lastActivityAt)}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(tenant.lastActivityAt)}</div>
                        </TableCell>
                        <TableCell>
                          {tenant.assignedAccountManagerName ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{tenant.assignedAccountManagerInitials ?? "AM"}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium">{tenant.assignedAccountManagerName}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="grid gap-2 md:grid-cols-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/platform/tenants/${tenant.tenantId}`}>View</Link>
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setNudgeTarget(tenant)}>
                              Send Nudge
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setNoteTarget(tenant)}>
                              Add Note
                            </Button>
                            <Button size="sm" onClick={() => setExtendTarget(tenant)}>
                              Extend Trial
                            </Button>
                          </div>
                          <div className="mt-2">
                            <Select value={selectedAm} onValueChange={(value) => handleAssignAccountManager(tenant.tenantId, value)}>
                              <SelectTrigger className="h-8 w-full">
                                <SelectValue placeholder="Assign AM" />
                              </SelectTrigger>
                              <SelectContent>
                                {platformAdmins.map((admin) => (
                                  <SelectItem key={admin.eduMylesUserId} value={admin.eduMylesUserId}>
                                    {[admin.firstName, admin.lastName].filter(Boolean).join(" ") || admin.email}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Stalled onboarding queue</CardTitle>
            <CardDescription>Schools inactive for 48+ hours, prioritized for intervention.</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.stalledQueue.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No stalled onboardings"
                description="The current onboarding cohort is moving without stalled records."
                className="py-10"
              />
            ) : (
              <ScrollArea className="h-[640px] pr-4">
                <div className="space-y-4">
                  {dashboard.stalledQueue.map((entry) => (
                    <div key={entry.tenantId} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{entry.tenantName}</p>
                          <p className="text-sm text-muted-foreground">{entry.tenantId}</p>
                        </div>
                        <Badge variant="outline" className={healthBadgeClass(entry.healthScore)}>
                          {entry.healthScore}/100
                        </Badge>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                        <p>Step: {entry.currentStepLabel}</p>
                        <p>Last activity {formatRelativeTime(entry.lastActivityAt)}</p>
                        <p>{entry.assignedAccountManagerName ?? "No account manager assigned"}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/platform/tenants/${entry.tenantId}`}>Review tenant</Link>
                        </Button>
                        <Button size="sm" onClick={() => setNudgeTarget(entry)}>
                          Send Nudge
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setNoteTarget(entry)}>
                          Add Note
                        </Button>
                      </div>
                      {entry.notes.length > 0 ? (
                        <div className="mt-4 rounded-lg border bg-muted/30 p-3">
                          <p className="text-xs font-medium text-muted-foreground">Latest note</p>
                          <p className="mt-1 text-sm">{entry.notes[entry.notes.length - 1]?.note}</p>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!extendTarget} onOpenChange={(open) => !open && setExtendTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend tenant trial</DialogTitle>
            <DialogDescription>
              Extend the evaluation window for {extendTarget?.tenantName} and optionally capture the expected milestone in a platform note.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Extension days</Label>
              <Input type="number" min="1" value={extendDays} onChange={(event) => setExtendDays(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Internal note</Label>
              <Textarea
                value={extensionNote}
                onChange={(event) => setExtensionNote(event.target.value)}
                rows={4}
                placeholder="Capture why the trial is being extended and what success milestone we expect next."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendTarget(null)}>Cancel</Button>
            <Button onClick={handleExtendTrial} disabled={saving || Number(extendDays) <= 0}>
              Extend trial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!nudgeTarget}
        onOpenChange={(open) => {
          if (!open) {
            setNudgeTarget(null);
            setSelectedTemplate("stalled_step_auto");
            setNudgeMessage("");
            setNudgeChannel("email_sms");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send onboarding nudge</DialogTitle>
            <DialogDescription>
              Choose a template, preview the message, and send a tailored reminder to {nudgeTarget?.tenantName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {nudgeTemplateOptions.map((template) => (
                    <SelectItem key={template.key} value={template.key}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeTemplate ? <p className="text-xs text-muted-foreground">{activeTemplate.description}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select value={nudgeChannel} onValueChange={setNudgeChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email_sms">Email + SMS</SelectItem>
                  <SelectItem value="email_only">Email only</SelectItem>
                  <SelectItem value="sms_only">SMS only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Message preview / override</Label>
              <Textarea
                value={nudgeMessage || activeTemplate?.message || ""}
                onChange={(event) => setNudgeMessage(event.target.value)}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                Leaving the template text as-is uses the selected nudge template. You can tailor it before sending.
              </p>
            </div>
            {nudgeTarget ? (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="font-medium">{nudgeTarget.tenantName}</p>
                <p className="text-muted-foreground">
                  Current step: {nudgeTarget.currentStepLabel} · Health: {nudgeTarget.healthScore}/100 · Last activity: {formatRelativeTime(nudgeTarget.lastActivityAt)}
                </p>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNudgeTarget(null)}>Cancel</Button>
            <Button onClick={handleSendNudge} disabled={saving}>Send Nudge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!noteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setNoteTarget(null);
            setPlatformNote("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add platform note</DialogTitle>
            <DialogDescription>
              Capture platform-facing context for {noteTarget?.tenantName}. Notes stay with the tenant onboarding record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                value={platformNote}
                onChange={(event) => setPlatformNote(event.target.value)}
                rows={5}
                placeholder="Record blocker details, intervention context, promised next step, or AM follow-up notes."
              />
            </div>
            {noteTarget?.notes.length ? (
              <div className="space-y-2">
                <Label>Recent notes</Label>
                <ScrollArea className="h-40 rounded-lg border p-3">
                  <div className="space-y-3">
                    {noteTarget.notes
                      .slice()
                      .reverse()
                      .map((note) => (
                        <div key={note.id} className="text-sm">
                          <p>{note.note}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {note.authorEmail} · {formatDate(note.createdAt)}
                          </p>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteTarget(null)}>Cancel</Button>
            <Button onClick={handleAddNote} disabled={saving || !platformNote.trim()}>
              <MessageSquareMore className="mr-2 h-4 w-4" />
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
