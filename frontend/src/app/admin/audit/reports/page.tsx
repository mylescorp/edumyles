"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/shared/DataTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Shield, Users, Activity, Download } from "lucide-react";

type AuditLog = {
  _id: string;
  action: string;
  actorId: string;
  userName?: string;
  userEmail?: string;
  entityType: string;
  entityId: string;
  createdAt: number;
};

function getActionBadgeVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (action.includes("deleted") || action.includes("failed") || action.includes("suspended")) return "destructive";
  if (action.includes("created") || action.includes("enrolled")) return "default";
  if (action.includes("updated") || action.includes("completed")) return "secondary";
  return "outline";
}

export default function AuditReportsPage() {
  const { isLoading, sessionToken } = useAuth();
  const [actionFilter, setActionFilter] = useState("all");

  const logs = useQuery(
    api.platform.audit.queries.listTenantAuditLogs,
    sessionToken
      ? { sessionToken, action: actionFilter === "all" ? undefined : actionFilter, limit: 200 }
      : "skip"
  );

  const actionTypes = useQuery(
    api.platform.audit.queries.getTenantAuditActionTypes,
    sessionToken ? { sessionToken } : "skip"
  );

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const logList = (logs as any[]) ?? [];
  const actionTypeList: string[] = (actionTypes as any[]) ?? [];

  // Summary stats
  const stats = useMemo(() => {
    const today = Date.now() - 24 * 60 * 60 * 1000;
    const week = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const uniqueUsers = new Set(logList.map((l: any) => l.actorId)).size;
    return {
      total: logList.length,
      today: logList.filter((l: any) => l.createdAt > today).length,
      thisWeek: logList.filter((l: any) => l.createdAt > week).length,
      uniqueUsers,
    };
  }, [logList]);

  const columns: Column<AuditLog>[] = [
    {
      key: "createdAt",
      header: "Time",
      cell: (row) => new Date(row.createdAt).toLocaleString(),
      sortable: true,
    },
    {
      key: "userName",
      header: "User",
      cell: (row) => (
        <div>
          <p className="text-sm font-medium">{row.userName || row.actorId}</p>
          {row.userEmail && <p className="text-xs text-muted-foreground">{row.userEmail}</p>}
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (row) => (
        <Badge variant={getActionBadgeVariant(row.action)} className="text-xs">
          {row.action}
        </Badge>
      ),
    },
    {
      key: "entityType",
      header: "Entity",
      cell: (row) => (
        <div className="text-sm">
          <span className="text-muted-foreground">{row.entityType}</span>
          <span className="ml-1 text-xs text-muted-foreground/60 truncate max-w-[100px] inline-block align-middle">
            {row.entityId}
          </span>
        </div>
      ),
    },
  ];

  const handleExport = () => {
    const rows = [
      ["Time", "User", "Email", "Action", "Entity Type", "Entity ID"],
      ...logList.map((l: any) => [
        new Date(l.createdAt).toISOString(),
        l.userName ?? l.actorId,
        l.userEmail ?? "",
        l.action,
        l.entityType,
        l.entityId,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Reports"
        description="Comprehensive audit trail analysis and security reports"
        actions={
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Logs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.today}</p>
                <p className="text-xs text-muted-foreground">Last 24 Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.thisWeek}</p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
                <p className="text-xs text-muted-foreground">Unique Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Audit Log</CardTitle>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actionTypeList.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={logList}
            searchKey={(row) => `${row.action} ${row.userName ?? ""} ${row.entityType}`}
            searchPlaceholder="Search actions..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
