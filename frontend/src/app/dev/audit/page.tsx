"use client";

import { useMemo, useState } from "react";
import { Clock3, Database, FileCode2, History, ScanSearch } from "lucide-react";
import {
  DevConsoleShell,
  ErrorState,
  formatTimestamp,
  LoadingState,
  MetricCard,
  useDevSystemMapData,
} from "@/components/dev/console";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function DevAuditPage() {
  const {
    systemMap,
    isLoading,
    isRefreshing,
    error,
    autoRefresh,
    setAutoRefresh,
    loadSystemMap,
  } = useDevSystemMapData();
  const [query, setQuery] = useState("");
  const filteredAudit = useMemo(() => {
    if (!systemMap) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return systemMap.auditTrail;

    return systemMap.auditTrail.filter((entry) =>
      [
        entry.title,
        entry.summary,
        entry.category,
        entry.scope,
        entry.path ?? "",
        entry.routePath ?? "",
        entry.tenantName ?? "",
        entry.actorEmail ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [query, systemMap]);

  if (isLoading && !systemMap) {
    return (
      <DevConsoleShell
        title="Development Audit Trail"
        description="Timestamped development history across frontend features, backend services, and scan events."
        systemMap={null}
        isRefreshing={isRefreshing}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        onRefresh={() => void loadSystemMap("refresh")}
      >
        <LoadingState />
      </DevConsoleShell>
    );
  }

  const frontendEntries = systemMap?.auditTrail.filter((entry) => entry.scope === "frontend").length ?? 0;
  const backendEntries = systemMap?.auditTrail.filter((entry) => entry.scope === "backend").length ?? 0;
  const runtimeEntries = systemMap?.auditTrail.filter((entry) => entry.category === "runtime").length ?? 0;
  const lastScanDate = systemMap ? new Date(systemMap.summary.generatedAt).toLocaleDateString("en-KE", { dateStyle: "medium" }) : "-";

  return (
    <DevConsoleShell
      title="Development Audit Trail"
      description="Timestamped development history across frontend features, backend services, and scan events."
      systemMap={systemMap}
      isRefreshing={isRefreshing}
      autoRefresh={autoRefresh}
      setAutoRefresh={setAutoRefresh}
      onRefresh={() => void loadSystemMap("refresh")}
    >
      {error ? <ErrorState error={error} /> : null}

      {systemMap ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Audit Events" value={systemMap.auditTrail.length} detail="Recent timestamped development entries" icon={History} />
            <MetricCard title="Frontend Trail" value={frontendEntries} detail="Recent route and feature file changes" icon={FileCode2} />
            <MetricCard title="Backend Trail" value={backendEntries} detail="Recent Convex service changes" icon={Database} />
            <MetricCard title="Runtime Events" value={runtimeEntries} detail={formatTimestamp(systemMap.summary.generatedAt)} icon={Clock3} />
          </div>

          <Card className="border-border/70 bg-background/90 shadow-sm">
            <CardContent className="flex h-full items-center gap-3 p-5">
              <div className="rounded-xl bg-muted/60 p-2.5">
                <ScanSearch className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search titles, actors, tenants, paths, routes..."
                />
              </div>
              <div className="hidden text-xs text-muted-foreground xl:block">
                Last scan {lastScanDate}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ScanSearch className="h-4 w-4" />
                Timestamped Development Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredAudit.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium text-foreground">{entry.title}</div>
                        <Badge variant="outline">{entry.scope}</Badge>
                        <Badge variant="secondary">{entry.category}</Badge>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">{entry.summary}</div>
                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                        {entry.actorEmail ? <span>{entry.actorEmail}</span> : null}
                        {entry.tenantName ? <span>{entry.tenantName}</span> : null}
                        {entry.routePath ? <span className="font-mono">{entry.routePath}</span> : null}
                        {entry.path ? <span className="font-mono">{entry.path}</span> : null}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{formatTimestamp(entry.timestamp)}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </DevConsoleShell>
  );
}
