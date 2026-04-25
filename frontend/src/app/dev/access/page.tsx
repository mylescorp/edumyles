"use client";

import { Lock, ShieldCheck, Users2, Waypoints } from "lucide-react";
import {
  DevConsoleShell,
  ErrorState,
  LoadingState,
  MetricCard,
  useDevSystemMapData,
} from "@/components/dev/console";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DevAccessPage() {
  const {
    systemMap,
    isLoading,
    isRefreshing,
    error,
    autoRefresh,
    setAutoRefresh,
    loadSystemMap,
  } = useDevSystemMapData();

  if (isLoading && !systemMap) {
    return (
      <DevConsoleShell
        title="Access Matrix"
        description="Role dashboards, navigation reach, permission counts, and dev-console eligibility."
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

  const devPanelRoles = systemMap?.access.filter((entry) => entry.canAccessDevPanel).length ?? 0;
  const privilegedRoles = systemMap?.access.filter((entry) => entry.canRunPrivilegedDevActions).length ?? 0;
  const maxNav = Math.max(...(systemMap?.access.map((entry) => entry.navItemCount) ?? [0]));

  return (
    <DevConsoleShell
      title="Access Matrix"
      description="Role dashboards, navigation reach, permission counts, and dev-console eligibility."
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
            <MetricCard title="Roles Tracked" value={systemMap.access.length} detail="RBAC roles present in permission model" icon={Users2} />
            <MetricCard title="Dev Panel Roles" value={devPanelRoles} detail="Roles allowed to open /dev" icon={ShieldCheck} />
            <MetricCard title="Privileged Roles" value={privilegedRoles} detail="Roles allowed to run elevated dev ops" icon={Lock} />
            <MetricCard title="Max Navigation Load" value={maxNav} detail="Largest nav surface among tracked roles" icon={Waypoints} />
          </div>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4" />
                Production Access Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Dashboard</TableHead>
                    <TableHead>Nav</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Dev Panel</TableHead>
                    <TableHead>Privileged Ops</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemMap.access.map((entry) => (
                    <TableRow key={entry.role}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-foreground">{entry.label}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">{entry.role}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-foreground">{entry.dashboard}</span>
                      </TableCell>
                      <TableCell>{entry.navItemCount}</TableCell>
                      <TableCell>{entry.permissionCount}</TableCell>
                      <TableCell>
                        <Badge variant={entry.canAccessDevPanel ? "default" : "secondary"}>
                          {entry.canAccessDevPanel ? "allowed" : "blocked"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.canRunPrivilegedDevActions ? "default" : "secondary"}>
                          {entry.canRunPrivilegedDevActions ? "full" : "limited"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </DevConsoleShell>
  );
}
