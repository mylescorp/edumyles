"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePaginatedQuery } from "convex/react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Eye, Plus, TrendingUp, Users, Activity, Ban, Edit2, PlayCircle } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { formatTenantHostname } from "@/lib/domains";
import { TenantDialog } from "./TenantDialog";
import { SuspendDialog } from "./SuspendDialog";

type TenantRow = {
  _id: string;
  tenantId: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  email: string;
  county: string;
  country: string;
  createdAt: number;
  userCount?: number;
  modules?: string[];
};

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "active"
      ? "border-[#26A65B]/20 bg-[rgba(38,166,91,0.08)] text-[#26A65B]"
      : status === "trial"
        ? "border-[#1565C0]/20 bg-[rgba(21,101,192,0.08)] text-[#1565C0]"
        : status === "archived"
          ? "border-slate-300 bg-slate-100 text-slate-700"
          : "border-[#D64545]/20 bg-[rgba(214,69,69,0.08)] text-[#D64545]";

  return (
    <Badge variant="outline" className={className}>
      {status}
    </Badge>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const className =
    plan === "enterprise"
      ? "border-violet-300 bg-violet-100 text-violet-700"
      : plan === "pro"
        ? "border-[#E8A020]/20 bg-[rgba(232,160,32,0.08)] text-[#C17B00]"
        : plan === "standard" || plan === "growth"
          ? "border-[#1565C0]/20 bg-[rgba(21,101,192,0.08)] text-[#1565C0]"
          : "border-[#26A65B]/20 bg-[rgba(38,166,91,0.08)] text-[#26A65B]";

  return (
    <Badge variant="outline" className={className}>
      {plan}
    </Badge>
  );
}

export default function TenantsPage() {
  const { isLoading, sessionToken } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [tenantDialogOpen, setTenantDialogOpen] = useState(false);
  const [tenantDialogMode, setTenantDialogMode] = useState<"create" | "edit">("create");
  const [selectedTenant, setSelectedTenant] = useState<TenantRow | null>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<TenantRow | null>(null);

  const {
    results: tenants,
    status: tenantsStatus,
    loadMore,
  } = usePaginatedQuery(
    api.platform.tenants.queries.listAllTenantsPaginated,
    sessionToken
      ? {
          sessionToken,
          status: statusFilter === "all" ? undefined : (statusFilter as "active" | "suspended" | "trial" | "archived"),
        }
      : "skip",
    { initialNumItems: 25 }
  );

  const platformStats = usePlatformQuery(
    api.platform.tenants.queries.getPlatformStats,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );

  const filteredTenants = useMemo(() => {
    const tenantRows = (tenants as TenantRow[] | undefined) ?? [];
    if (planFilter === "all") {
      return tenantRows;
    }
    return tenantRows.filter((tenant) => tenant.plan === planFilter);
  }, [tenants, planFilter]);

  const planOptions = useMemo(() => {
    const counts = platformStats?.planCounts ?? {};
    const plans = Object.keys(counts).sort();
    return plans.map((plan) => ({
      value: plan,
      label: `${plan} (${counts[plan]})`,
    }));
  }, [platformStats]);

  const statusCards = platformStats ?? {
    totalTenants: 0,
    activeTenants: 0,
    trialTenants: 0,
    suspendedTenants: 0,
    totalUsers: 0,
  };

  const openEditDialog = (tenant: TenantRow) => {
    setSelectedTenant(tenant);
    setTenantDialogMode("edit");
    setTenantDialogOpen(true);
  };

  const openSuspendDialog = (tenant: TenantRow) => {
    setSuspendTarget(tenant);
    setSuspendDialogOpen(true);
  };

  if (isLoading || (sessionToken && platformStats === undefined && tenants === undefined)) {
    return <LoadingSkeleton variant="page" />;
  }

  const columns: Column<TenantRow>[] = [
    {
      key: "name",
      header: "School",
      sortable: true,
      cell: (row) => (
        <div className="space-y-1">
          <Link href={`/platform/tenants/${row.tenantId}`} className="font-medium text-primary hover:underline">
            {row.name}
          </Link>
          <div className="text-xs text-muted-foreground">{formatTenantHostname(row.subdomain)}</div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      cell: (row) => (
        <div className="space-y-1 text-sm">
          <div>{row.email}</div>
          <div className="text-xs text-muted-foreground">
            {row.county}, {row.country}
          </div>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      sortable: true,
      cell: (row) => <PlanBadge plan={row.plan} />,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "users",
      header: "Users",
      sortable: true,
      cell: (row) => row.userCount?.toLocaleString() ?? "0",
    },
    {
      key: "modules",
      header: "Modules",
      cell: (row) => row.modules?.length?.toLocaleString() ?? "0",
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      cell: (row) => formatDate(row.createdAt),
    },
    {
      key: "actions",
      header: "",
      className: "w-[220px]",
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/platform/tenants/${row.tenantId}`}>
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              View
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openEditDialog(row)}>
            <Edit2 className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openSuspendDialog(row)}
            className={row.status === "suspended" ? "text-[#26A65B]" : "text-destructive"}
          >
            {row.status === "suspended" ? (
              <>
                <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
                Activate
              </>
            ) : (
              <>
                <Ban className="mr-1.5 h-3.5 w-3.5" />
                Suspend
              </>
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description="Manage school tenants, monitor onboarding status, and jump into tenant operations."
        actions={
          <div className="flex items-center gap-3">
            <Link href="/platform/analytics">
              <Button variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </Link>
            <Link href="/platform/tenants/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Provision School
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{statusCards.totalTenants}</div>
            <p className="text-xs text-muted-foreground">All schools on the platform</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Schools</CardTitle>
            <Users className="h-4 w-4 text-[#26A65B]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-[#26A65B]">{statusCards.activeTenants}</div>
            <p className="text-xs text-muted-foreground">Production tenants currently active</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Schools</CardTitle>
            <Activity className="h-4 w-4 text-[#1565C0]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-[#1565C0]">{statusCards.trialTenants}</div>
            <p className="text-xs text-muted-foreground">Tenants still in onboarding or trial</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-[#E8A020]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-[#C17B00]">{statusCards.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Active and pending tenant users</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plans</SelectItem>
                {planOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredTenants.length} loaded tenants
            {platformStats ? ` of ${platformStats.totalTenants}` : ""}
          </div>
        </CardContent>
      </Card>

      <DataTable
        data={filteredTenants}
        columns={columns}
        searchable
        searchPlaceholder="Search by school, contact email, county, subdomain, or tenant ID..."
        searchKey={(row) =>
          `${row.name} ${row.email} ${row.county} ${row.subdomain} ${row.tenantId}`.toLowerCase()
        }
        emptyTitle="No tenants found"
        emptyDescription={
          statusFilter !== "all" || planFilter !== "all"
            ? "Try a different filter combination or load more tenants."
            : "Provision your first school tenant to get started."
        }
        serverPagination={{
          isDone: tenantsStatus === "Exhausted",
          loadMore: (items) => loadMore(items),
          isLoading: tenantsStatus === "LoadingMore",
          totalCount: platformStats?.totalTenants,
        }}
      />

      <TenantDialog
        open={tenantDialogOpen}
        onOpenChange={setTenantDialogOpen}
        sessionToken={sessionToken ?? ""}
        tenant={selectedTenant}
        mode={tenantDialogMode}
      />

      <SuspendDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        sessionToken={sessionToken ?? ""}
        tenant={suspendTarget}
      />
    </div>
  );
}
