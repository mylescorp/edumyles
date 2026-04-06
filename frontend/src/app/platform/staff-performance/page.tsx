"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Activity,
  CheckCircle,
  Download,
  Eye,
  RefreshCw,
  Search,
  Star,
  Timer,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

type StaffPerformanceRow = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  currentScore: number;
  trend: "up" | "down" | "stable";
  achievements: string[];
  metrics: {
    ticketsResolved: number;
    avgResponseTime: number;
    avgResolutionTime: number;
    satisfactionScore: number;
    slaCompliance: number;
    firstContactResolution: number;
    escalationRate: number;
  };
};

function mapBackendRecord(record: any): StaffPerformanceRow {
  const [firstName = "Unknown", ...rest] = String(record.userName || "Unknown").split(" ");
  return {
    _id: record.userId,
    firstName,
    lastName: rest.join(" "),
    email: record.userEmail || "",
    role: record.role || "support",
    department: record.department || "General",
    currentScore: record.overallScore ?? 0,
    trend: record.trend ?? "stable",
    achievements: record.achievements || [],
    metrics: {
      ticketsResolved: record.metrics?.ticketsResolved ?? 0,
      avgResponseTime: record.metrics?.avgResponseTime ?? 0,
      avgResolutionTime: record.metrics?.avgResolutionTime ?? 0,
      satisfactionScore: record.metrics?.satisfactionScore ?? 0,
      slaCompliance: record.metrics?.slaCompliance ?? 0,
      firstContactResolution: record.metrics?.firstContactResolution ?? 0,
      escalationRate: record.metrics?.escalationRate ?? 0,
    },
  };
}

function getRoleColor(role: string) {
  switch (role) {
    case "super_admin":
      return "bg-purple-100 text-purple-800";
    case "admin":
      return "bg-blue-100 text-blue-800";
    case "manager":
      return "bg-green-100 text-green-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}

function getTrendIcon(trend: StaffPerformanceRow["trend"]) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-600" />;
  return <Activity className="h-4 w-4 text-muted-foreground" />;
}

export default function StaffPerformancePage() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [isRefreshing, startRefreshing] = useTransition();

  const rawRecords = usePlatformQuery(
    api.platform.staffPerformance.queries.listStaffPerformance,
    {
      sessionToken: sessionToken || "",
      period: selectedPeriod,
      department: selectedDepartment !== "all" ? selectedDepartment : undefined,
      search: searchQuery || undefined,
    },
    !!sessionToken
  ) as any[] | undefined;

  const trends = usePlatformQuery(
    api.platform.staffPerformance.queries.getPerformanceTrends,
    {
      sessionToken: sessionToken || "",
      period: selectedPeriod,
    },
    !!sessionToken
  ) as any;

  const rows = useMemo(() => (rawRecords ?? []).map(mapBackendRecord), [rawRecords]);
  const departments = useMemo(
    () => Array.from(new Set(rows.map((row) => row.department).filter(Boolean))).sort(),
    [rows]
  );
  const roles = useMemo(
    () => Array.from(new Set(rows.map((row) => row.role).filter(Boolean))).sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchQuery.toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        normalizedSearch === "" ||
        row.firstName.toLowerCase().includes(normalizedSearch) ||
        row.lastName.toLowerCase().includes(normalizedSearch) ||
        row.email.toLowerCase().includes(normalizedSearch);
      const matchesDepartment = selectedDepartment === "all" || row.department === selectedDepartment;
      const matchesRole = selectedRole === "all" || row.role === selectedRole;
      return matchesSearch && matchesDepartment && matchesRole;
    });
  }, [rows, searchQuery, selectedDepartment, selectedRole]);

  const fallbackSummary = useMemo(() => {
    if (filteredRows.length === 0) {
      return {
        totalStaff: 0,
        avgScore: 0,
        avgSatisfaction: 0,
        avgResponseTime: 0,
        avgSlaCompliance: 0,
        trendUp: 0,
        trendDown: 0,
        trendStable: 0,
      };
    }

    return {
      totalStaff: filteredRows.length,
      avgScore: Math.round(filteredRows.reduce((sum, row) => sum + row.currentScore, 0) / filteredRows.length),
      avgSatisfaction: Math.round(filteredRows.reduce((sum, row) => sum + row.metrics.satisfactionScore, 0) / filteredRows.length),
      avgResponseTime: Math.round(filteredRows.reduce((sum, row) => sum + row.metrics.avgResponseTime, 0) / filteredRows.length),
      avgSlaCompliance: Math.round(filteredRows.reduce((sum, row) => sum + row.metrics.slaCompliance, 0) / filteredRows.length),
      trendUp: filteredRows.filter((row) => row.trend === "up").length,
      trendDown: filteredRows.filter((row) => row.trend === "down").length,
      trendStable: filteredRows.filter((row) => row.trend === "stable").length,
    };
  }, [filteredRows]);

  const summary = trends ?? fallbackSummary;

  if (rawRecords === undefined || trends === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const handleExport = () => {
    const csv = [
      [
        "Name",
        "Email",
        "Role",
        "Department",
        "Overall Score",
        "Trend",
        "Tickets Resolved",
        "Avg Response Time",
        "Avg Resolution Time",
        "Satisfaction Score",
        "SLA Compliance",
        "First Contact Resolution",
        "Escalation Rate",
      ],
      ...filteredRows.map((row) => [
        `${row.firstName} ${row.lastName}`.trim(),
        row.email,
        row.role,
        row.department,
        row.currentScore,
        row.trend,
        row.metrics.ticketsResolved,
        row.metrics.avgResponseTime,
        row.metrics.avgResolutionTime,
        row.metrics.satisfactionScore,
        row.metrics.slaCompliance,
        row.metrics.firstContactResolution,
        row.metrics.escalationRate,
      ]),
    ]
      .map((line) => line.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `staff-performance-${selectedPeriod}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Performance"
        description="Track backend-recorded score, response, SLA, and quality trends without synthetic metrics."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Staff Performance", href: "/platform/staff-performance" },
        ]}
        actions={
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => startRefreshing(() => router.refresh())}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{summary.totalStaff}</div>
              <div className="text-sm text-muted-foreground">Staff Records</div>
            </div>
            <Users className="h-7 w-7 text-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{summary.avgScore}</div>
              <div className="text-sm text-muted-foreground">Average Score</div>
            </div>
            <Star className="h-7 w-7 text-yellow-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{summary.avgSlaCompliance}%</div>
              <div className="text-sm text-muted-foreground">Avg SLA Compliance</div>
            </div>
            <CheckCircle className="h-7 w-7 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{summary.avgResponseTime}m</div>
              <div className="text-sm text-muted-foreground">Avg Response Time</div>
            </div>
            <Timer className="h-7 w-7 text-orange-500" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{summary.trendUp}</div>
              <div className="text-sm text-muted-foreground">Improving</div>
            </div>
            <TrendingUp className="h-7 w-7 text-green-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{summary.trendStable}</div>
              <div className="text-sm text-muted-foreground">Stable</div>
            </div>
            <Activity className="h-7 w-7 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{summary.trendDown}</div>
              <div className="text-sm text-muted-foreground">Needs Attention</div>
            </div>
            <TrendingDown className="h-7 w-7 text-red-600" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left font-semibold">Staff Member</th>
                <th className="p-3 text-left font-semibold">Role</th>
                <th className="p-3 text-left font-semibold">Department</th>
                <th className="p-3 text-left font-semibold">Score</th>
                <th className="p-3 text-left font-semibold">Trend</th>
                <th className="p-3 text-left font-semibold">Tickets</th>
                <th className="p-3 text-left font-semibold">Response</th>
                <th className="p-3 text-left font-semibold">SLA</th>
                <th className="p-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row._id} className="border-b hover:bg-muted/50">
                  <td className="p-3">
                    <div className="space-y-1">
                      <div className="font-medium">{`${row.firstName} ${row.lastName}`.trim()}</div>
                      <div className="text-sm text-muted-foreground">{row.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.achievements.length} achievement{row.achievements.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge className={getRoleColor(row.role)}>{row.role.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="p-3 text-sm">{row.department}</td>
                  <td className="p-3">
                    <span className={`font-medium ${getScoreColor(row.currentScore)}`}>{row.currentScore}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 capitalize">
                      {getTrendIcon(row.trend)}
                      {row.trend}
                    </div>
                  </td>
                  <td className="p-3">{row.metrics.ticketsResolved}</td>
                  <td className="p-3">{row.metrics.avgResponseTime}m</td>
                  <td className="p-3">{row.metrics.slaCompliance}%</td>
                  <td className="p-3">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/platform/staff-performance/${row._id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 ? null : null}
            </tbody>
          </table>
          {filteredRows.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="No staff performance records"
                description="Try another department, role, or reporting period."
                className="py-10"
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
