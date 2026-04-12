"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDate, formatRelativeTime } from "@/lib/formatters";
import { AlertTriangle, CheckCircle2, Clock3, HeartPulse, SearchX, TimerReset, TrendingUp } from "lucide-react";
import { TenantsAdminRail } from "@/components/platform/TenantsAdminRail";

type TrialTenant = {
  tenantId: string;
  tenantName: string;
  trialEndsAt?: number;
  currentPeriodEnd: number;
  healthScore: number;
  stalled: boolean;
  wizardCompleted: boolean;
};

type StalledOnboarding = {
  _id: string;
  tenantId: string;
  tenantName: string;
  healthScore: number;
  wizardCompleted: boolean;
  lastActivityAt: number;
  updatedAt: number;
};

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

function daysUntil(timestamp?: number) {
  if (!timestamp) return null;
  return Math.ceil((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function TenantSuccessPage() {
  const { sessionToken, isLoading } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [extendTarget, setExtendTarget] = useState<TrialTenant | null>(null);
  const [extendDays, setExtendDays] = useState("7");
  const [extensionNote, setExtensionNote] = useState("");
  const [saving, setSaving] = useState(false);

  const trialDashboard = usePlatformQuery(
    api.modules.platform.onboarding.getTrialDashboard,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as TrialTenant[] | undefined;

  const stalledOnboardings = usePlatformQuery(
    api.modules.platform.onboarding.getStalledOnboardings,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as StalledOnboarding[] | undefined;

  const extendTrial = useMutation(api.modules.platform.subscriptions.extendTrial);

  const filteredTrials = useMemo(() => {
    const rows = trialDashboard ?? [];
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return rows;
    }
    return rows.filter((row) => row.tenantName.toLowerCase().includes(needle) || row.tenantId.toLowerCase().includes(needle));
  }, [search, trialDashboard]);

  const stalledIds = useMemo(
    () => new Set((stalledOnboardings ?? []).map((entry) => entry.tenantId)),
    [stalledOnboardings]
  );

  const stats = useMemo(() => {
    const rows = trialDashboard ?? [];
    const total = rows.length;
    const avgHealth = total
      ? Math.round(rows.reduce((sum, row) => sum + row.healthScore, 0) / total)
      : 0;
    const expiringSoon = rows.filter((row) => {
      const daysLeft = daysUntil(row.trialEndsAt ?? row.currentPeriodEnd);
      return daysLeft !== null && daysLeft <= 7;
    }).length;

    return {
      total,
      completed: rows.filter((row) => row.wizardCompleted).length,
      stalled: rows.filter((row) => row.stalled).length,
      avgHealth,
      expiringSoon,
    };
  }, [trialDashboard]);

  if (isLoading || trialDashboard === undefined || stalledOnboardings === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const handleExtendTrial = async () => {
    if (!sessionToken || !extendTarget || !extendDays) return;
    setSaving(true);
    try {
      await extendTrial({
        sessionToken,
        tenantId: extendTarget.tenantId,
        days: Number(extendDays),
      });
      toast({
        title: "Trial extended",
        description: extensionNote.trim()
          ? `${extendTarget.tenantName} received a ${extendDays}-day extension. Note captured locally for follow-up.`
          : `${extendTarget.tenantName} received a ${extendDays}-day extension.`,
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenant Success"
        description="Track trial health, spot stalled onboardings, and intervene before evaluation periods expire."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Tenant Success" },
        ]}
      />

      <TenantsAdminRail currentHref="/platform/tenant-success" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Trial tenants" value={stats.total} icon={Clock3} />
        <MetricCard title="Expiring in 7 days" value={stats.expiringSoon} icon={AlertTriangle} />
        <MetricCard title="Onboarding complete" value={stats.completed} icon={CheckCircle2} />
        <MetricCard title="Stalled" value={stats.stalled} icon={TimerReset} />
        <MetricCard title="Average health" value={stats.avgHealth} icon={HeartPulse} suffix="/100" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Trial management</CardTitle>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tenants"
                className="w-full md:w-80"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredTrials.length === 0 ? (
              <EmptyState
                icon={search ? SearchX : TrendingUp}
                title={search ? "No trial tenants match this search" : "No trial tenants right now"}
                description="As new schools start their EduMyles trial, their onboarding health will appear here."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Health</TableHead>
                    <TableHead>Onboarding</TableHead>
                    <TableHead>Trial end</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[220px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrials.map((tenant) => {
                    const trialEnd = tenant.trialEndsAt ?? tenant.currentPeriodEnd;
                    const daysLeft = daysUntil(trialEnd);

                    return (
                      <TableRow key={tenant.tenantId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{tenant.tenantName}</div>
                            <div className="text-sm text-muted-foreground">{tenant.tenantId}</div>
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
                          <div className="space-y-2">
                            <Badge variant="outline" className={tenant.wizardCompleted ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700" : "border-amber-500/20 bg-amber-500/10 text-amber-700"}>
                              {tenant.wizardCompleted ? "Complete" : "In progress"}
                            </Badge>
                            {tenant.stalled ? (
                              <p className="text-xs text-rose-700">Needs intervention</p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{formatDate(trialEnd)}</div>
                          <div className="text-xs text-muted-foreground">
                            {daysLeft !== null ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : "No end date"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <Badge variant="outline" className={healthBadgeClass(tenant.healthScore)}>
                              {tenant.healthScore >= 80 ? "Healthy" : tenant.healthScore >= 60 ? "Watch" : "At risk"}
                            </Badge>
                            {stalledIds.has(tenant.tenantId) ? (
                              <Badge variant="outline" className="border-rose-500/20 bg-rose-500/10 text-rose-700">
                                Stalled
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/platform/tenants/${tenant.tenantId}`}>Open tenant</Link>
                            </Button>
                            <Button size="sm" onClick={() => setExtendTarget(tenant)}>
                              Extend trial
                            </Button>
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
          </CardHeader>
          <CardContent>
            {stalledOnboardings.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No stalled onboardings"
                description="The current trial cohort is moving without stalled onboarding records."
                className="py-10"
              />
            ) : (
              <div className="space-y-4">
                {stalledOnboardings.map((entry) => (
                  <div key={String(entry._id)} className="rounded-xl border p-4">
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
                      <p>Last activity {formatRelativeTime(entry.lastActivityAt)}</p>
                      <p>{entry.wizardCompleted ? "Wizard completed" : "Wizard not completed"}</p>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/platform/tenants/${entry.tenantId}`}>Review tenant</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!extendTarget} onOpenChange={(open) => !open && setExtendTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend tenant trial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              Extend the evaluation window for {extendTarget?.tenantName} to give the school more time to complete onboarding and convert.
            </div>
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
                placeholder="Capture why we are extending this trial and what success milestone we expect next."
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
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  suffix,
}: {
  title: string;
  value: number;
  icon: typeof Clock3;
  suffix?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold">
              {value}
              {suffix ? <span className="text-lg text-muted-foreground">{suffix}</span> : null}
            </p>
          </div>
          <div className="rounded-xl border bg-muted/40 p-2">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
