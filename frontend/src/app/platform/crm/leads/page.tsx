"use client";

import { useState, useMemo } from "react";
import { CrmAdminRail } from "@/components/platform/CrmAdminRail";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { normalizeArray } from "@/lib/normalizeData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Plus, Users, TrendingUp, Clock, CheckCircle, ArrowRight, LayoutGrid, Rows3 } from "lucide-react";
import { formatRelativeTime } from "@/lib/formatters";
import { useToast } from "@/components/ui/use-toast";

type Deal = {
  _id: string;
  title: string;
  contactName: string;
  contactEmail?: string;
  schoolName?: string;
  stage: string;
  value?: number;
  currency?: string;
  assignedTo?: string;
  createdAt: number;
  updatedAt: number;
};

const STAGE_COLORS: Record<string, string> = {
  lead:        "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  prospecting: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  qualified:   "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  proposal:    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  negotiation: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  won:         "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  lost:        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const LEAD_STAGES = ["lead", "prospecting", "qualified"];

export default function CRMLeadsPage() {
  const { isLoading, sessionToken } = useAuth();
  const { toast } = useToast();
  const [stageFilter, setStageFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [movingDeal, setMovingDeal] = useState<string | null>(null);

  const deals = useQuery(
    api.platform.crm.queries.listDeals,
    sessionToken ? { sessionToken } : "skip"
  );

  const moveDealStage = useMutation(api.platform.crm.mutations.moveDealStage);
  const dealRows = useMemo(() => normalizeArray<Deal>(deals), [deals]);

  // Leads = deals in early pipeline stages
  const leads = useMemo(() => {
    return dealRows.filter((d) => LEAD_STAGES.includes(d.stage));
  }, [dealRows]);

  const filtered = useMemo(() => {
    if (stageFilter === "all") return leads;
    return leads.filter((d) => d.stage === stageFilter);
  }, [leads, stageFilter]);

  const kanbanColumns = useMemo(
    () =>
      [
        { stage: "lead", label: "New Leads" },
        { stage: "prospecting", label: "Prospecting" },
        { stage: "qualified", label: "Qualified" },
      ].map((column) => ({
        ...column,
        deals: filtered.filter((deal) => deal.stage === column.stage),
      })),
    [filtered]
  );

  const stats = useMemo(() => ({
    total:       leads.length,
    lead:        leads.filter((d) => d.stage === "lead").length,
    prospecting: leads.filter((d) => d.stage === "prospecting").length,
    qualified:   leads.filter((d) => d.stage === "qualified").length,
  }), [leads]);

  const handleQualify = async (deal: Deal) => {
    setMovingDeal(deal._id);
    try {
      await moveDealStage({ sessionToken, dealId: deal._id, stage: "qualified" });
      toast({ title: "Lead qualified", description: `${deal.title} moved to Qualified.` });
    } catch (err) {
      toast({ title: "Failed", description: String(err), variant: "destructive" });
    } finally {
      setMovingDeal(null);
    }
  };

  const columns: Column<Deal>[] = [
    {
      key: "title",
      header: "Lead",
      sortable: true,
      cell: (row) => (
        <div>
          <Link href={`/platform/crm/${row._id}`} className="font-medium text-primary hover:underline">
            {row.title}
          </Link>
          {row.schoolName && (
            <p className="text-xs text-muted-foreground mt-0.5">{row.schoolName}</p>
          )}
        </div>
      ),
    },
    {
      key: "contactName",
      header: "Contact",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="text-sm font-medium">{row.contactName}</p>
          {row.contactEmail && (
            <p className="text-xs text-muted-foreground">{row.contactEmail}</p>
          )}
        </div>
      ),
    },
    {
      key: "stage",
      header: "Stage",
      sortable: true,
      cell: (row) => (
        <Badge className={`${STAGE_COLORS[row.stage] ?? STAGE_COLORS.lead} border-0 capitalize`}>
          {row.stage}
        </Badge>
      ),
    },
    {
      key: "value",
      header: "Est. Value",
      sortable: true,
      cell: (row) =>
        row.value
          ? <span className="font-medium">{row.currency ?? "USD"} {row.value.toLocaleString()}</span>
          : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      cell: (row) => <span className="text-sm">{formatRelativeTime(row.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Link href={`/platform/crm/${row._id}`}>
            <Button size="sm" variant="outline">View</Button>
          </Link>
          {row.stage !== "qualified" && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-green-700 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950/30"
              disabled={movingDeal === row._id}
              onClick={() => handleQualify(row)}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Qualify
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading || deals === undefined) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Manage inbound leads and early-stage pipeline prospects"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/platform/crm">
              <Button variant="outline" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Full Pipeline
              </Button>
            </Link>
            <Link href="/platform/crm/leads/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Lead
              </Button>
            </Link>
          </div>
        }
        breadcrumbs={[
          { label: "CRM", href: "/platform/crm" },
          { label: "Leads" },
        ]}
      />

      <CrmAdminRail currentHref="/platform/crm/leads" />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Leads</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Clock className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.lead}</p>
              <p className="text-sm text-muted-foreground">New Leads</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/30">
              <ArrowRight className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.prospecting}</p>
              <p className="text-sm text-muted-foreground">Prospecting</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.qualified}</p>
              <p className="text-sm text-muted-foreground">Qualified</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage filter */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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

        <div className="flex items-center gap-3">
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="prospecting">Prospecting</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {filtered.length} lead{filtered.length !== 1 ? "s" : ""}
        </p>
        </div>
      </div>

      {viewMode === "kanban" ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {kanbanColumns.map((column) => (
            <Card key={column.stage} className="border-border/70 bg-muted/15">
              <CardContent className="space-y-3 pt-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`${STAGE_COLORS[column.stage] ?? STAGE_COLORS.lead} border-0 capitalize`}>
                      {column.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{column.deals.length}</span>
                  </div>
                </div>
                {column.deals.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    No leads in this stage.
                  </div>
                ) : (
                  column.deals.map((deal) => (
                    <div key={deal._id} className="rounded-lg border bg-background p-4 shadow-sm">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{deal.title}</p>
                            {deal.schoolName ? (
                              <p className="text-sm text-muted-foreground">{deal.schoolName}</p>
                            ) : null}
                          </div>
                          <Badge className={`${STAGE_COLORS[deal.stage] ?? STAGE_COLORS.lead} border-0 capitalize`}>
                            {deal.stage}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>{deal.contactName}</p>
                          {deal.contactEmail ? <p>{deal.contactEmail}</p> : null}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">
                            {deal.value ? `${deal.currency ?? "USD"} ${deal.value.toLocaleString()}` : "No value set"}
                          </span>
                          <span className="text-muted-foreground">{formatRelativeTime(deal.createdAt)}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Link href={`/platform/crm/${deal._id}`}>
                            <Button size="sm" variant="outline">View</Button>
                          </Link>
                          {deal.stage !== "qualified" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-green-700 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950/30"
                              disabled={movingDeal === deal._id}
                              onClick={() => handleQualify(deal)}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Qualify
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          searchPlaceholder="Search leads by name or school…"
          emptyMessage="No leads found. Add your first lead to start building your pipeline."
        />
      )}
    </div>
  );
}
