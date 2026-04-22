"use client";

import Link from "next/link";
import { useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { CrmAdminRail } from "@/components/platform/CrmAdminRail";
import { PermissionGate } from "@/components/platform/PermissionGate";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformPermissions } from "@/hooks/usePlatformPermissions";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { formatRelativeTime } from "@/lib/formatters";
import { normalizeArray } from "@/lib/normalizeData";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  DollarSign,
  FileText,
  Plus,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

type CRMStats = {
  totalLeads: number;
  inDemoStage: number;
  pipelineValueKes: number;
  conversionRate: number;
  overdueFollowUps: number;
  wonValueKes: number;
};

type PipelineView = {
  stages: Array<{
    stage: {
      slug: string;
      name: string;
      color: string;
    };
    totalValueKes: number;
    count: number;
    leads: Array<{
      _id: string;
      schoolName: string;
      contactName: string;
      dealValueKes?: number;
      updatedAt: number;
    }>;
  }>;
};

type LeadRow = {
  _id: string;
  schoolName: string;
  contactName: string;
  stage: string;
  nextFollowUpAt?: number;
  nextFollowUpNote?: string;
  updatedAt: number;
  ownerName?: string;
  assignedToName?: string;
};

type RecentActivity = {
  _id: string;
  type: string;
  subject?: string;
  body?: string;
  createdAt: number;
  createdByName?: string;
  lead?: {
    _id: string;
    schoolName: string;
    stage: string;
  } | null;
};

function formatKes(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PlatformCrmDashboardPage() {
  const { sessionToken } = useAuth();
  const { can } = usePlatformPermissions();

  const stats = usePlatformQuery(
    api.modules.platform.crm.getCRMStats,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as CRMStats | undefined;

  const pipeline = usePlatformQuery(
    api.modules.platform.crm.getPipelineView,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as PipelineView | undefined;

  const leads = usePlatformQuery(
    api.modules.platform.crm.getLeads,
    sessionToken ? { sessionToken, sortBy: "updated_desc" as const } : "skip",
    !!sessionToken
  ) as LeadRow[] | undefined;

  const activities = usePlatformQuery(
    api.modules.platform.crm.getRecentActivities,
    sessionToken ? { sessionToken, limit: 6 } : "skip",
    !!sessionToken
  ) as RecentActivity[] | undefined;

  const leadRows = useMemo(() => normalizeArray<LeadRow>(leads), [leads]);
  const activityRows = useMemo(() => normalizeArray<RecentActivity>(activities), [activities]);
  const dueToday = useMemo(
    () =>
      leadRows.filter(
        (lead) => Boolean(lead.nextFollowUpAt && lead.nextFollowUpAt <= Date.now() + 24 * 60 * 60 * 1000)
      ),
    [leadRows]
  );
  const stageCards = pipeline?.stages ?? [];

  if (!sessionToken || stats === undefined || pipeline === undefined || leads === undefined || activities === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM Command Center"
        description="Track conversion momentum, follow-up pressure, and proposal readiness from one live pipeline."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "CRM" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <PermissionGate permission="crm.view_reports">
              <Button asChild variant="outline" className="gap-2">
                <Link href="/platform/crm/reports">
                  <FileText className="h-4 w-4" />
                  Reports
                </Link>
              </Button>
            </PermissionGate>
            <PermissionGate permission="crm.create_lead">
              <Button asChild className="gap-2">
                <Link href="/platform/crm/leads/create">
                  <Plus className="h-4 w-4" />
                  New Lead
                </Link>
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <CrmAdminRail currentHref="/platform/crm" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Users} label="Accessible leads" value={stats.totalLeads} accent="bg-sky-100 text-sky-700" />
        <StatCard icon={Target} label="In demo motion" value={stats.inDemoStage} accent="bg-amber-100 text-amber-700" />
        <StatCard icon={DollarSign} label="Pipeline value" value={formatKes(stats.pipelineValueKes)} accent="bg-emerald-100 text-emerald-700" />
        <StatCard icon={TrendingUp} label="Conversion rate" value={`${stats.conversionRate}%`} accent="bg-violet-100 text-violet-700" />
        <StatCard icon={AlertCircle} label="Overdue follow-ups" value={stats.overdueFollowUps} accent="bg-rose-100 text-rose-700" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-emerald-100 bg-[linear-gradient(180deg,rgba(240,253,250,0.7),rgba(255,255,255,0.96))]">
          <CardHeader>
            <CardTitle>Pipeline overview</CardTitle>
            <CardDescription>Every stage is fed by live Convex records with value totals already computed server-side.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stageCards.length === 0 ? (
              <div className="md:col-span-2 xl:col-span-3">
                <EmptyState
                  icon={Target}
                  title="No pipeline stages are active"
                  description="Seed or reactivate CRM stages to start working leads through the funnel."
                />
              </div>
            ) : (
              stageCards.map((bucket) => (
                <div key={bucket.stage.slug} className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <Badge
                      variant="outline"
                      className="border-transparent px-3 py-1 text-xs font-semibold"
                      style={{ backgroundColor: `${bucket.stage.color}18`, color: bucket.stage.color }}
                    >
                      {bucket.stage.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{bucket.count} leads</span>
                  </div>
                  <p className="mt-4 text-2xl font-semibold">{formatKes(bucket.totalValueKes)}</p>
                  <div className="mt-4 space-y-3">
                    {bucket.leads.slice(0, 3).map((lead) => (
                      <Link
                        key={lead._id}
                        href={`/platform/crm/${lead._id}`}
                        className="block rounded-xl border border-slate-200 bg-slate-50/80 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/50"
                      >
                        <p className="font-medium text-slate-900">{lead.schoolName}</p>
                        <p className="text-sm text-muted-foreground">{lead.contactName}</p>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{lead.dealValueKes ? formatKes(lead.dealValueKes) : "No value yet"}</span>
                          <span>{formatRelativeTime(lead.updatedAt)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My follow-ups due today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dueToday.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title="No due follow-ups"
                  description="Your queue is clear for the next 24 hours."
                />
              ) : (
                dueToday.slice(0, 5).map((lead) => (
                  <Link key={lead._id} href={`/platform/crm/${lead._id}`} className="block rounded-xl border p-3 hover:bg-muted/30">
                    <p className="font-medium">{lead.schoolName}</p>
                    <p className="text-sm text-muted-foreground">{lead.nextFollowUpNote ?? "Follow up with this lead"}</p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent activity across my leads</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activityRows.length === 0 ? (
                <EmptyState
                  icon={ArrowRight}
                  title="No CRM activity yet"
                  description="Create or import a lead to start generating CRM activity."
                />
              ) : (
                activityRows.map((activity) => (
                  <div key={activity._id} className="rounded-xl border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          href={activity.lead ? `/platform/crm/${activity.lead._id}` : "/platform/crm/leads"}
                          className="font-medium hover:text-emerald-700"
                        >
                          {activity.lead?.schoolName ?? "CRM activity"}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {activity.createdByName ?? "Unknown teammate"} · {activity.subject ?? activity.type}
                        </p>
                      </div>
                      <Badge variant="outline">{activity.lead?.stage ?? activity.type}</Badge>
                    </div>
                    {activity.body ? <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{activity.body}</p> : null}
                    <p className="mt-2 text-xs text-muted-foreground">{formatRelativeTime(activity.createdAt)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {can("crm.view_reports") ? (
            <Card className="border-slate-900 bg-slate-950 text-white">
              <CardHeader>
                <CardTitle className="text-white">Revenue pressure</CardTitle>
                <CardDescription className="text-slate-300">
                  Won value currently stands at {formatKes(stats.wonValueKes)}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="secondary" className="w-full gap-2">
                  <Link href="/platform/crm/reports">
                    Open CRM reports
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
