"use client";

import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { buildCsv } from "@/lib/csv";
import { formatDateTime } from "@/lib/formatters";
import { AlertTriangle, Download, SearchX, ShieldCheck } from "lucide-react";
import { SecurityAdminRail } from "@/components/platform/SecurityAdminRail";

type AuditLog = {
  _id: string;
  tenantId: string;
  tenantName: string;
  actorId: string;
  userName: string;
  userEmail: string;
  actorEmail?: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt?: number;
  timestamp?: number;
  before?: unknown;
  after?: unknown;
};

function formatJson(value: unknown) {
  if (value === undefined || value === null) return "—";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function actionTone(action: string) {
  if (/deleted|revoked|failed|denied|cancelled|rejected/i.test(action)) {
    return "border-rose-500/20 bg-rose-500/10 text-rose-700";
  }
  if (/created|approved|success|completed|enabled/i.test(action)) {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
  }
  if (/updated|retried|started|paused|suspended/i.test(action)) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-700";
  }
  return "border-slate-500/20 bg-slate-500/10 text-slate-700";
}

export default function AuditLogPage() {
  const { isLoading, sessionToken } = useAuth();

  const [actionFilter, setActionFilter] = useState("all");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [search, setSearch] = useState("");

  const logs = usePlatformQuery(
    api.platform.audit.queries.listAuditLogs,
    sessionToken
      ? {
          sessionToken,
          ...(actionFilter !== "all" ? { action: actionFilter } : {}),
          ...(tenantFilter !== "all" ? { tenantId: tenantFilter } : {}),
          limit: 300,
        }
      : "skip",
    !!sessionToken
  ) as AuditLog[] | undefined;

  const actionTypes = usePlatformQuery(
    api.platform.audit.queries.getAuditActionTypes,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as string[] | undefined;

  const tenants = usePlatformQuery(
    api.platform.tenants.queries.listAllTenants,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as Array<{ tenantId: string; name: string }> | undefined;

  const filteredLogs = useMemo(() => {
    const rows = logs ?? [];
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((log) =>
      [
        log.action,
        log.entityType,
        log.entityId,
        log.userName,
        log.userEmail,
        log.actorId,
        log.tenantName,
        log.tenantId,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [logs, search]);

  const stats = useMemo(() => {
    const rows = logs ?? [];
    return {
      total: rows.length,
      security: rows.filter((log) => /login|logout|impersonation|unauthorized|failed/i.test(log.action)).length,
      destructive: rows.filter((log) => /deleted|revoked|suspended|cancelled/i.test(log.action)).length,
      changes: rows.filter((log) => /created|updated|enabled|disabled|approved/i.test(log.action)).length,
    };
  }, [logs]);

  if (isLoading || logs === undefined || actionTypes === undefined || tenants === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const exportAuditData = () => {
    const csvContent = buildCsv([
      ["Timestamp", "Action", "Tenant", "Actor", "Entity Type", "Entity Id", "Before", "After"],
      ...filteredLogs.map((log) => [
        String(log.createdAt ?? log.timestamp ?? 0),
        log.action,
        log.tenantName ?? log.tenantId,
        log.userEmail || log.userName || log.actorId,
        log.entityType,
        log.entityId,
        formatJson(log.before),
        formatJson(log.after),
      ]),
    ]);

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `platform-audit-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Review platform-wide operational, security, and configuration activity across tenants."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Audit Log" },
        ]}
        actions={
          <Button variant="outline" onClick={exportAuditData}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <SecurityAdminRail currentHref="/platform/audit" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible Logs" value={String(stats.total)} icon={ShieldCheck} />
        <MetricCard title="Security Events" value={String(stats.security)} icon={AlertTriangle} />
        <MetricCard title="Destructive Actions" value={String(stats.destructive)} icon={AlertTriangle} />
        <MetricCard title="Change Events" value={String(stats.changes)} icon={ShieldCheck} />
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Audit Console</CardTitle>
            <div className="flex flex-wrap gap-3">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search actor, tenant, action, or entity"
                className="w-full md:w-80"
              />
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {actionTypes.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tenantFilter} onValueChange={setTenantFilter}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Tenant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tenants</SelectItem>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.tenantId} value={tenant.tenantId}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <EmptyState
              icon={search || actionFilter !== "all" || tenantFilter !== "all" ? SearchX : ShieldCheck}
              title={search || actionFilter !== "all" || tenantFilter !== "all" ? "No audit logs match these filters" : "No audit logs found"}
              description="Platform activity will appear here as users perform audited operations."
            />
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div key={String(log._id)} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={actionTone(log.action)}>
                          {log.action}
                        </Badge>
                        <Badge variant="outline">{log.entityType}</Badge>
                        <span className="text-sm text-muted-foreground">{log.entityId}</span>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <InfoItem label="Tenant" value={log.tenantName ?? log.tenantId} />
                        <InfoItem label="Actor" value={log.userEmail || log.userName || log.actorId} />
                        <InfoItem label="When" value={formatDateTime(log.createdAt ?? log.timestamp ?? 0)} />
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <JsonBox title="Before" value={log.before} />
                        <JsonBox title="After" value={log.after} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: typeof ShieldCheck;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold">{value}</p>
          </div>
          <div className="rounded-xl border bg-muted/40 p-2">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function JsonBox({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
        <pre className="overflow-x-auto whitespace-pre-wrap break-all">
          {value === undefined || value === null ? "—" : JSON.stringify(value, null, 2)}
        </pre>
      </div>
    </div>
  );
}
