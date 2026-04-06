"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { formatDate } from "@/lib/formatters";
import { formatTenantHostname } from "@/lib/domains";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  Ban,
  Building2,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  Mail,
  MoreHorizontal,
  Plus,
  ShieldUser,
  TrendingUp,
  Users,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { SuspendDialog } from "./SuspendDialog";
import { TenantsAdminRail } from "@/components/platform/TenantsAdminRail";

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
  studentCount?: number;
  staffCount?: number;
  mrrKes?: number;
  lastActiveAt?: number;
  modules?: string[];
};

type SortOption =
  | "name_asc"
  | "name_desc"
  | "signup_desc"
  | "signup_asc"
  | "students_desc"
  | "students_asc"
  | "revenue_desc"
  | "revenue_asc"
  | "last_active_desc"
  | "last_active_asc";

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

function formatKes(value: number | undefined) {
  return `KES ${(value ?? 0).toLocaleString()}`;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function TenantsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isLoading, sessionToken } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [studentMin, setStudentMin] = useState("");
  const [studentMax, setStudentMax] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("signup_desc");
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantRow | null>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [bulkSuspendOpen, setBulkSuspendOpen] = useState(false);
  const [bulkSuspendReason, setBulkSuspendReason] = useState("");
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  const activateTenant = useMutation(api.platform.tenants.mutations.activateTenant);
  const suspendTenant = useMutation(api.platform.tenants.mutations.suspendTenant);

  const {
    results: tenants,
    status: tenantsStatus,
    loadMore,
  } = usePaginatedQuery(
    api.platform.tenants.queries.listAllTenantsPaginated,
    sessionToken
      ? {
          sessionToken,
          status:
            statusFilter === "all"
              ? undefined
              : (statusFilter as "active" | "suspended" | "trial" | "archived"),
        }
      : "skip",
    { initialNumItems: 25 }
  );

  const platformStats = usePlatformQuery(
    api.platform.tenants.queries.getPlatformStats,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );

  const tenantRows = useMemo(() => ((tenants as TenantRow[] | undefined) ?? []), [tenants]);

  const countryOptions = useMemo(() => {
    const counts = platformStats?.countryCounts ?? {};
    return Object.keys(counts)
      .sort((a, b) => a.localeCompare(b))
      .map((country) => ({
        value: country,
        label: `${country} (${counts[country]})`,
      }));
  }, [platformStats]);

  const planOptions = useMemo(() => {
    const counts = platformStats?.planCounts ?? {};
    return Object.keys(counts)
      .sort()
      .map((plan) => ({
        value: plan,
        label: `${plan} (${counts[plan]})`,
      }));
  }, [platformStats]);

  const filteredTenants = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const minStudents = studentMin ? Number(studentMin) : undefined;
    const maxStudents = studentMax ? Number(studentMax) : undefined;
    const fromTimestamp = dateFrom ? new Date(dateFrom).getTime() : undefined;
    const toTimestamp = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1 : undefined;

    const filtered = tenantRows.filter((tenant) => {
      if (planFilter !== "all" && tenant.plan !== planFilter) return false;
      if (countryFilter !== "all" && tenant.country !== countryFilter) return false;
      if (minStudents !== undefined && (tenant.studentCount ?? 0) < minStudents) return false;
      if (maxStudents !== undefined && (tenant.studentCount ?? 0) > maxStudents) return false;
      if (fromTimestamp !== undefined && tenant.createdAt < fromTimestamp) return false;
      if (toTimestamp !== undefined && tenant.createdAt > toTimestamp) return false;
      if (!normalizedSearch) return true;
      return [
        tenant.name,
        tenant.email,
        tenant.subdomain,
        tenant.tenantId,
        tenant.country,
        tenant.county,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "signup_asc":
          return a.createdAt - b.createdAt;
        case "students_asc":
          return (a.studentCount ?? 0) - (b.studentCount ?? 0);
        case "students_desc":
          return (b.studentCount ?? 0) - (a.studentCount ?? 0);
        case "revenue_asc":
          return (a.mrrKes ?? 0) - (b.mrrKes ?? 0);
        case "revenue_desc":
          return (b.mrrKes ?? 0) - (a.mrrKes ?? 0);
        case "last_active_asc":
          return (a.lastActiveAt ?? 0) - (b.lastActiveAt ?? 0);
        case "last_active_desc":
          return (b.lastActiveAt ?? 0) - (a.lastActiveAt ?? 0);
        case "signup_desc":
        default:
          return b.createdAt - a.createdAt;
      }
    });
  }, [
    countryFilter,
    dateFrom,
    dateTo,
    planFilter,
    search,
    sortBy,
    studentMax,
    studentMin,
    tenantRows,
  ]);

  const selectedTenants = useMemo(
    () => filteredTenants.filter((tenant) => selectedTenantIds.includes(tenant.tenantId)),
    [filteredTenants, selectedTenantIds]
  );

  const allVisibleSelected =
    filteredTenants.length > 0 &&
    filteredTenants.every((tenant) => selectedTenantIds.includes(tenant.tenantId));

  const statusCards = platformStats ?? {
    totalTenants: 0,
    activeTenants: 0,
    trialTenants: 0,
    suspendedTenants: 0,
    totalMonthlyRecurringKes: 0,
  };

  const exportRows = (rows: TenantRow[], prefix: string) => {
    downloadCsv(`${prefix}-tenants.csv`, [
      [
        "School",
        "Tenant ID",
        "Domain",
        "Plan",
        "Status",
        "Country",
        "County",
        "Students",
        "Staff",
        "MRR (KES)",
        "Signup Date",
        "Last Active",
        "Admin Email",
      ],
      ...rows.map((tenant) => [
        tenant.name,
        tenant.tenantId,
        formatTenantHostname(tenant.subdomain),
        tenant.plan,
        tenant.status,
        tenant.country,
        tenant.county,
        String(tenant.studentCount ?? 0),
        String(tenant.staffCount ?? 0),
        String(tenant.mrrKes ?? 0),
        formatDate(tenant.createdAt),
        tenant.lastActiveAt ? formatDate(tenant.lastActiveAt) : "Never",
        tenant.email,
      ]),
    ]);
  };

  const toggleTenantSelection = (tenantId: string) => {
    setSelectedTenantIds((current) =>
      current.includes(tenantId)
        ? current.filter((id) => id !== tenantId)
        : [...current, tenantId]
    );
  };

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedTenantIds((current) =>
        current.filter((tenantId) => !filteredTenants.some((tenant) => tenant.tenantId === tenantId))
      );
      return;
    }
    setSelectedTenantIds((current) => {
      const next = new Set(current);
      for (const tenant of filteredTenants) next.add(tenant.tenantId);
      return Array.from(next);
    });
  };

  const handleBulkEmail = () => {
    if (selectedTenants.length === 0) return;
    const recipients = selectedTenants.map((tenant) => tenant.email).join(",");
    window.location.href = `mailto:${recipients}?subject=${encodeURIComponent("EduMyles platform follow-up")}`;
  };

  const handleBulkSuspend = async () => {
    if (!sessionToken || selectedTenants.length === 0 || !bulkSuspendReason.trim()) return;

    setIsBulkSubmitting(true);
    try {
      await Promise.all(
        selectedTenants
          .filter((tenant) => tenant.status !== "suspended")
          .map((tenant) =>
            suspendTenant({
              sessionToken,
              tenantId: tenant.tenantId,
              reason: bulkSuspendReason.trim(),
            })
          )
      );

      setBulkSuspendOpen(false);
      setBulkSuspendReason("");
      setSelectedTenantIds([]);
      toast({
        title: "Tenants suspended",
        description: `${selectedTenants.length} tenant records were updated.`,
      });
    } catch (error: any) {
      toast({
        title: "Bulk suspend failed",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const handleQuickActivate = async (tenant: TenantRow) => {
    if (!sessionToken) return;
    try {
      await activateTenant({ sessionToken, tenantId: tenant.tenantId });
      toast({
        title: "Tenant reactivated",
        description: `${tenant.name} is active again.`,
      });
    } catch (error: any) {
      toast({
        title: "Activation failed",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || (sessionToken && platformStats === undefined && tenants === undefined)) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description="Monitor tenant growth, filter by operational risk, and jump directly into school-level actions."
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
                Create Tenant
              </Button>
            </Link>
          </div>
        }
      />

      <TenantsAdminRail currentHref="/platform/tenants" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{statusCards.totalTenants}</div>
            <p className="text-xs text-muted-foreground">All school accounts on the platform</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active + Trial</CardTitle>
            <Users className="h-4 w-4 text-[#26A65B]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-[#26A65B]">
              {statusCards.activeTenants + statusCards.trialTenants}
            </div>
            <p className="text-xs text-muted-foreground">
              {statusCards.activeTenants} active and {statusCards.trialTenants} trialing
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <Ban className="h-4 w-4 text-[#D64545]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-[#D64545]">{statusCards.suspendedTenants}</div>
            <p className="text-xs text-muted-foreground">Tenants requiring intervention</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total MRR</CardTitle>
            <Activity className="h-4 w-4 text-[#E8A020]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-[#C17B00]">
              {formatKes(statusCards.totalMonthlyRecurringKes)}
            </div>
            <p className="text-xs text-muted-foreground">
              Live recurring platform revenue from tenant subscriptions
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search school, domain, tenant ID, email, country..."
              className="md:col-span-2 xl:col-span-4"
            />

            <div className="xl:col-span-2">
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Plan" />
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

            <div className="xl:col-span-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="xl:col-span-2">
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All countries</SelectItem>
                  {countryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Input
              type="number"
              min="0"
              value={studentMin}
              onChange={(event) => setStudentMin(event.target.value)}
              placeholder="Min students"
              className="xl:col-span-1"
            />

            <Input
              type="number"
              min="0"
              value={studentMax}
              onChange={(event) => setStudentMax(event.target.value)}
              placeholder="Max students"
              className="xl:col-span-1"
            />

            <div className="md:col-span-2 xl:col-span-2">
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="signup_desc">Newest signup</SelectItem>
                  <SelectItem value="signup_asc">Oldest signup</SelectItem>
                  <SelectItem value="name_asc">Name A-Z</SelectItem>
                  <SelectItem value="name_desc">Name Z-A</SelectItem>
                  <SelectItem value="students_desc">Students high-low</SelectItem>
                  <SelectItem value="students_asc">Students low-high</SelectItem>
                  <SelectItem value="revenue_desc">MRR high-low</SelectItem>
                  <SelectItem value="revenue_asc">MRR low-high</SelectItem>
                  <SelectItem value="last_active_desc">Last active newest</SelectItem>
                  <SelectItem value="last_active_asc">Last active oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
            <div className="grid gap-1.5 xl:col-span-6">
              <Label className="text-xs font-medium text-muted-foreground">Signup date from</Label>
              <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            </div>
            <div className="grid gap-1.5 xl:col-span-6">
              <Label className="text-xs font-medium text-muted-foreground">Signup date to</Label>
              <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredTenants.length} loaded tenants
              {platformStats ? ` of ${platformStats.totalTenants}` : ""}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setPlanFilter("all");
                setCountryFilter("all");
                setStudentMin("");
                setStudentMax("");
                setDateFrom("");
                setDateTo("");
                setSortBy("signup_desc");
                setSelectedTenantIds([]);
              }}
            >
              Reset filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedTenantIds.length > 0 && (
        <Card className="border-[#E8A020]/25 bg-[rgba(232,160,32,0.06)] shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {selectedTenantIds.length} tenant{selectedTenantIds.length === 1 ? "" : "s"} selected
              </p>
              <p className="text-xs text-muted-foreground">
                Apply bulk suspend, email, or export to the current selection.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={handleBulkEmail}>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </Button>
              <Button variant="outline" onClick={() => exportRows(selectedTenants, "selected")}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="destructive" onClick={() => setBulkSuspendOpen(true)}>
                <Ban className="mr-2 h-4 w-4" />
                Suspend
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-0">
          {filteredTenants.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground/50" />
              <div>
                <p className="text-lg font-semibold">No tenants match these filters</p>
                <p className="text-sm text-muted-foreground">
                  Adjust the plan, country, student range, or signup window to widen the results.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px] text-sm">
                  <thead className="border-b bg-muted/20 text-left">
                    <tr>
                      <th className="w-12 px-4 py-3">
                        <Checkbox checked={allVisibleSelected} onCheckedChange={toggleAllVisible} />
                      </th>
                      <th className="px-4 py-3 font-medium">School</th>
                      <th className="px-4 py-3 font-medium">Domain</th>
                      <th className="px-4 py-3 font-medium">Plan</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Students</th>
                      <th className="px-4 py-3 font-medium">MRR</th>
                      <th className="px-4 py-3 font-medium">Signup date</th>
                      <th className="px-4 py-3 font-medium">Last active</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenants.map((tenant) => (
                      <tr
                        key={tenant.tenantId}
                        className="cursor-pointer border-b transition-colors hover:bg-muted/20"
                        onClick={() => router.push(`/platform/tenants/${tenant.tenantId}`)}
                      >
                        <td className="px-4 py-4" onClick={(event) => event.stopPropagation()}>
                          <Checkbox
                            checked={selectedTenantIds.includes(tenant.tenantId)}
                            onCheckedChange={() => toggleTenantSelection(tenant.tenantId)}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(21,101,192,0.08)] text-[#1565C0]">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div className="space-y-1">
                              <div className="font-medium text-foreground">{tenant.name}</div>
                              <div className="text-xs text-muted-foreground">{tenant.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="font-medium">{formatTenantHostname(tenant.subdomain)}</div>
                            <div className="text-xs text-muted-foreground">
                              {tenant.county}, {tenant.country}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <PlanBadge plan={tenant.plan} />
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={tenant.status} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="font-medium">{(tenant.studentCount ?? 0).toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">
                              {(tenant.staffCount ?? tenant.userCount ?? 0).toLocaleString()} staff
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-medium">{formatKes(tenant.mrrKes)}</td>
                        <td className="px-4 py-4 text-muted-foreground">{formatDate(tenant.createdAt)}</td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {tenant.lastActiveAt ? formatDate(tenant.lastActiveAt) : "Never"}
                        </td>
                        <td className="px-4 py-4 text-right" onClick={(event) => event.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem asChild>
                                <Link href={`/platform/tenants/${tenant.tenantId}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/platform/impersonation?tenantId=${tenant.tenantId}`}>
                                  <ShieldUser className="mr-2 h-4 w-4" />
                                  Impersonate
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => (window.location.href = `mailto:${tenant.email}`)}>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => exportRows([tenant], tenant.subdomain || tenant.tenantId)}>
                                <Download className="mr-2 h-4 w-4" />
                                Export
                              </DropdownMenuItem>
                              {tenant.status === "suspended" ? (
                                <DropdownMenuItem onClick={() => void handleQuickActivate(tenant)}>
                                  <ChevronRight className="mr-2 h-4 w-4" />
                                  Unsuspend
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    setSelectedTenant(tenant);
                                    setSuspendDialogOpen(true);
                                  }}
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Suspend
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t px-4 py-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                <div>
                  Showing {filteredTenants.length} loaded tenants
                  {platformStats ? ` of ${platformStats.totalTenants}` : ""}
                </div>
                {tenantsStatus !== "Exhausted" && (
                  <Button
                    variant="outline"
                    onClick={() => loadMore(25)}
                    disabled={tenantsStatus === "LoadingMore"}
                  >
                    {tenantsStatus === "LoadingMore" ? "Loading..." : "Load more"}
                    {tenantsStatus !== "LoadingMore" && <ChevronDown className="ml-2 h-4 w-4" />}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <SuspendDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        sessionToken={sessionToken ?? ""}
        tenant={selectedTenant}
      />

      <Dialog open={bulkSuspendOpen} onOpenChange={setBulkSuspendOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Bulk suspend selected tenants</DialogTitle>
            <DialogDescription>
              Add the reason that should be recorded in the audit log for each selected tenant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-suspend-reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="bulk-suspend-reason"
              value={bulkSuspendReason}
              onChange={(event) => setBulkSuspendReason(event.target.value)}
              placeholder="Explain why these tenant accounts are being suspended."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {selectedTenants.length} tenant{selectedTenants.length === 1 ? "" : "s"} will be updated.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkSuspendOpen(false)} disabled={isBulkSubmitting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleBulkSuspend()}
              disabled={isBulkSubmitting || !bulkSuspendReason.trim()}
            >
              {isBulkSubmitting ? "Suspending..." : "Suspend selected"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
