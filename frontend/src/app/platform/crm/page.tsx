"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  Building2,
  Clock3,
  DollarSign,
  FileText,
  Plus,
  Search,
  Target,
  TrendingUp,
  Users,
  RefreshCw,
  LayoutGrid,
  Rows3,
} from "lucide-react";

type LeadRecord = {
  _id: string;
  schoolName: string;
  contactName: string;
  email: string;
  phone?: string;
  country: string;
  studentCount?: number;
  source?: string;
  qualificationScore?: number;
  stage: string;
  assignedTo?: string;
  dealValueKes?: number;
  expectedClose?: number;
  status: string;
  updatedAt: number;
  createdAt: number;
};

type DealRecord = {
  _id: string;
  leadId: string;
  tenantId?: string;
  valueKes: number;
  stage: string;
  proposalId?: string;
  closedAt?: number;
  status: "open" | "won" | "lost";
  lossReason?: string;
  createdAt: number;
  updatedAt: number;
};

const stageTone: Record<string, string> = {
  new: "bg-slate-100 text-slate-700",
  contacted: "bg-blue-100 text-blue-700",
  qualified: "bg-cyan-100 text-cyan-700",
  proposal: "bg-amber-100 text-amber-700",
  negotiation: "bg-orange-100 text-orange-700",
  won: "bg-green-100 text-green-700",
  converted: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
  open: "bg-slate-100 text-slate-700",
};

function formatCurrencyKes(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(timestamp?: number) {
  if (!timestamp) return "Not set";
  return new Date(timestamp).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatRelative(timestamp: number) {
  const diff = Date.now() - timestamp;
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return "Today";
  if (diff < 2 * day) return "Yesterday";
  const days = Math.floor(diff / day);
  return `${days}d ago`;
}

export default function PlatformCrmDashboardPage() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [dealStatusFilter, setDealStatusFilter] = useState<"all" | "open" | "won" | "lost">("all");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [isRefreshing, startRefreshing] = useTransition();

  const leads = usePlatformQuery(
    api.modules.platform.crm.getLeads,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  ) as LeadRecord[] | undefined;

  const deals = usePlatformQuery(
    api.modules.platform.crm.getDeals,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  ) as DealRecord[] | undefined;

  const leadRows = useMemo(() => leads ?? [], [leads]);
  const dealRows = useMemo(() => deals ?? [], [deals]);

  const leadById = useMemo(() => {
    return new Map(leadRows.map((lead) => [String(lead._id), lead]));
  }, [leadRows]);

  const filteredDeals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return dealRows.filter((deal) => {
      const lead = leadById.get(String(deal.leadId));
      const matchesSearch =
        query.length === 0 ||
        lead?.schoolName.toLowerCase().includes(query) ||
        lead?.contactName.toLowerCase().includes(query) ||
        lead?.email.toLowerCase().includes(query) ||
        deal.stage.toLowerCase().includes(query);

      const matchesStatus = dealStatusFilter === "all" || deal.status === dealStatusFilter;
      return Boolean(matchesSearch && matchesStatus);
    });
  }, [dealRows, leadById, searchQuery, dealStatusFilter]);

  const dashboard = useMemo(() => {
    const openDeals = dealRows.filter((deal) => deal.status === "open");
    const wonDeals = dealRows.filter((deal) => deal.status === "won");
    const lostDeals = dealRows.filter((deal) => deal.status === "lost");
    const proposalDeals = dealRows.filter((deal) => Boolean(deal.proposalId));
    const weightedPipelineKes = openDeals.reduce((sum, deal) => {
      const lead = leadById.get(String(deal.leadId));
      const probability = Math.max(0, Math.min(100, lead?.qualificationScore ?? 0));
      return sum + Math.round((deal.valueKes * probability) / 100);
    }, 0);

    return {
      totalLeads: leadRows.length,
      openDeals: openDeals.length,
      wonDeals: wonDeals.length,
      lostDeals: lostDeals.length,
      proposalsSent: proposalDeals.length,
      pipelineKes: openDeals.reduce((sum, deal) => sum + deal.valueKes, 0),
      wonKes: wonDeals.reduce((sum, deal) => sum + deal.valueKes, 0),
      weightedPipelineKes,
      conversionRate:
        dealRows.length > 0 ? Math.round((wonDeals.length / dealRows.length) * 100) : 0,
    };
  }, [dealRows, leadById, leadRows.length]);

  const recentLeads = useMemo(() => leadRows.slice(0, 5), [leadRows]);
  const recentDeals = useMemo(() => filteredDeals.slice(0, 8), [filteredDeals]);
  const kanbanColumns = useMemo(
    () =>
      [
        "new",
        "contacted",
        "qualified",
        "proposal",
        "negotiation",
        "won",
        "lost",
      ].map((stage) => ({
        stage,
        label: stage === "new" ? "New" : stage.charAt(0).toUpperCase() + stage.slice(1),
        deals: filteredDeals.filter((deal) => deal.stage === stage),
      })),
    [filteredDeals]
  );

  if (!sessionToken || leads === undefined || deals === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        description="Track lead qualification, active deals, proposal activity, and conversions into live tenants."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "CRM", href: "/platform/crm" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/platform/crm/proposals">
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                Proposals
              </Button>
            </Link>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => startRefreshing(() => router.refresh())}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link href="/platform/crm/leads/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Lead
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{dashboard.totalLeads}</p>
              <p className="text-sm text-muted-foreground">Active leads</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{dashboard.openDeals}</p>
              <p className="text-sm text-muted-foreground">Open deals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-700">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrencyKes(dashboard.pipelineKes)}</p>
              <p className="text-sm text-muted-foreground">Open pipeline</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{dashboard.conversionRate}%</p>
              <p className="text-sm text-muted-foreground">Win rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline performance</CardTitle>
            <CardDescription>Derived from live deals and lead qualification data.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Weighted pipeline</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrencyKes(dashboard.weightedPipelineKes)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Uses live lead qualification scores as the probability signal.
              </p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Closed won revenue</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrencyKes(dashboard.wonKes)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Based on deals marked as won and ready for tenant conversion.
              </p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Proposals linked</p>
              <p className="mt-2 text-2xl font-semibold">{dashboard.proposalsSent}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Deals currently carrying a generated proposal record.
              </p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Deal outcomes</p>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span className="font-medium text-green-700">{dashboard.wonDeals} won</span>
                <span className="font-medium text-red-700">{dashboard.lostDeals} lost</span>
                <span className="font-medium text-slate-700">{dashboard.openDeals} open</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent leads</CardTitle>
            <CardDescription>Newest CRM entries awaiting follow-up or qualification.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLeads.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No leads yet"
                description="Create the first lead to start building the pipeline."
                action={
                  <Link href="/platform/crm/leads/create">
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add lead
                    </Button>
                  </Link>
                }
                className="py-8"
              />
            ) : (
              recentLeads.map((lead) => (
                <div key={lead._id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{lead.schoolName}</p>
                      <p className="text-sm text-muted-foreground">{lead.contactName} · {lead.email}</p>
                    </div>
                    <Badge className={stageTone[lead.stage] ?? stageTone.open}>{lead.stage}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{lead.source ?? "No source recorded"}</span>
                    <span>{formatRelative(lead.updatedAt)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Deals in motion</CardTitle>
              <CardDescription>Search and review real deals from the current CRM pipeline.</CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "kanban")}>
                <TabsList>
                  <TabsTrigger value="list" className="gap-2">
                    <Rows3 className="h-4 w-4" />
                    List
                  </TabsTrigger>
                  <TabsTrigger value="kanban" className="gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    Kanban
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative min-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search school, contact, email, or stage"
                  className="pl-9"
                />
              </div>
              <Select value={dealStatusFilter} onValueChange={(value) => setDealStatusFilter(value as typeof dealStatusFilter)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Deal status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recentDeals.length === 0 ? (
            <EmptyState
              icon={Clock3}
              title="No deals match this view"
              description="Adjust the filters or qualify more leads into active deals."
            />
          ) : viewMode === "kanban" ? (
            <div className="grid gap-4 xl:grid-cols-4 2xl:grid-cols-7">
              {kanbanColumns.map((column) => (
                <div key={column.stage} className="space-y-3 rounded-xl border bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className={stageTone[column.stage] ?? stageTone.open}>{column.label}</Badge>
                      <span className="text-sm text-muted-foreground">{column.deals.length}</span>
                    </div>
                  </div>
                  {column.deals.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      No deals in this stage.
                    </div>
                  ) : (
                    column.deals.map((deal) => {
                      const lead = leadById.get(String(deal.leadId));
                      return (
                        <div key={deal._id} className="rounded-lg border bg-background p-3 shadow-sm">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium">{lead?.schoolName ?? "Unknown school"}</p>
                              <Badge variant="outline">{deal.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {lead?.contactName ?? "Unassigned contact"}
                            </p>
                            <p className="text-sm font-semibold">{formatCurrencyKes(deal.valueKes)}</p>
                            <p className="text-xs text-muted-foreground">
                              {lead?.qualificationScore ?? 0}% qualification · Updated {formatRelative(deal.updatedAt)}
                            </p>
                            <Link href={`/platform/crm/${deal._id}`}>
                              <Button size="sm" variant="outline" className="mt-1 w-full">
                                Open deal
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {recentDeals.map((deal) => {
                const lead = leadById.get(String(deal.leadId));

                return (
                  <div key={deal._id} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{lead?.schoolName ?? "Unknown school"}</p>
                          <Badge className={stageTone[deal.stage] ?? stageTone.open}>{deal.stage}</Badge>
                          <Badge variant="outline">{deal.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {lead?.contactName ?? "Unassigned contact"} · {lead?.email ?? "No email"}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted-foreground">
                          <span>Created {formatDate(deal.createdAt)}</span>
                          <span>Updated {formatRelative(deal.updatedAt)}</span>
                          <span>
                            {lead?.expectedClose ? `Expected close ${formatDate(lead.expectedClose)}` : "No close date"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-semibold">{formatCurrencyKes(deal.valueKes)}</p>
                          <p className="text-xs text-muted-foreground">
                            {lead?.qualificationScore ?? 0}% qualification score
                          </p>
                        </div>
                        <Link href={`/platform/crm/${deal._id}`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            View deal
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/platform/crm/leads">
          <Card className="h-full transition-colors hover:border-primary/40">
            <CardContent className="flex h-full items-center justify-between pt-6">
              <div>
                <p className="font-medium">Lead pipeline</p>
                <p className="text-sm text-muted-foreground">Review and qualify incoming opportunities.</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/platform/crm/proposals">
          <Card className="h-full transition-colors hover:border-primary/40">
            <CardContent className="flex h-full items-center justify-between pt-6">
              <div>
                <p className="font-medium">Proposals</p>
                <p className="text-sm text-muted-foreground">Manage proposal generation and send status.</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/platform/crm/leads/create">
          <Card className="h-full transition-colors hover:border-primary/40">
            <CardContent className="flex h-full items-center justify-between pt-6">
              <div>
                <p className="font-medium">Create a new lead</p>
                <p className="text-sm text-muted-foreground">Capture a new school and move it into the funnel.</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
