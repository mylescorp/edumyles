"use client";

import { Activity, Boxes, Database, Gauge, LayoutDashboard, Network, Rows3 } from "lucide-react";
import {
  DevConsoleShell,
  ErrorState,
  healthTone,
  LoadingState,
  MetricCard,
  useDevSystemMapData,
  useRouteHealth,
} from "@/components/dev/console";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DevOverviewPage() {
  const {
    systemMap,
    isLoading,
    isRefreshing,
    error,
    autoRefresh,
    setAutoRefresh,
    loadSystemMap,
  } = useDevSystemMapData();
  const { health, checkRoute } = useRouteHealth(systemMap);

  if (isLoading && !systemMap) {
    return (
      <DevConsoleShell
        title="Developer Overview"
        description="Live control-room view of the full frontend and backend estate."
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

  return (
    <DevConsoleShell
      title="Developer Overview"
      description="Live control-room view of the full frontend and backend estate."
      systemMap={systemMap}
      isRefreshing={isRefreshing}
      autoRefresh={autoRefresh}
      setAutoRefresh={setAutoRefresh}
      onRefresh={() => void loadSystemMap("refresh")}
    >
      {error ? <ErrorState error={error} /> : null}

      {systemMap ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              title="Frontend Pages"
              value={systemMap.summary.frontendPages}
              detail={`${systemMap.summary.apiRoutes} API routes in app router`}
              icon={LayoutDashboard}
            />
            <MetricCard
              title="Backend Files"
              value={systemMap.summary.backendFiles}
              detail={`${systemMap.summary.backendEndpoints} exported endpoints`}
              icon={Database}
            />
            <MetricCard
              title="Panels + Portals"
              value={systemMap.summary.panelCount + systemMap.summary.portalCount}
              detail={`${systemMap.summary.panelCount} panels, ${systemMap.summary.portalCount} portals`}
              icon={Rows3}
            />
            <MetricCard
              title="Modules"
              value={systemMap.summary.moduleCount}
              detail="Module families discovered in routes"
              icon={Network}
            />
            <MetricCard
              title="Nav Coverage"
              value={`${systemMap.summary.navCoveragePercent}%`}
              detail={`${systemMap.coverage.navWithoutPage.length} nav gaps`}
              icon={Gauge}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Rows3 className="h-4 w-4" />
                  Panels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {systemMap.panels.map((group) => (
                  <div key={group.key} className="rounded-lg border border-border/70 bg-muted/25 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-foreground">{group.label}</div>
                      <Badge variant="outline">{group.count}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {group.routes.slice(0, 6).map((route) => (
                        <Badge key={route} variant="secondary" className="font-mono text-[11px]">
                          {route}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Boxes className="h-4 w-4" />
                  Portals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {systemMap.portals.map((group) => (
                  <div key={group.key} className="rounded-lg border border-border/70 bg-muted/25 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-foreground">{group.label}</div>
                      <Badge variant="outline">{group.count}</Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {group.routes.slice(0, 3).join(" • ")}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Network className="h-4 w-4" />
                  Modules Seen In Routes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {systemMap.modules.map((group) => (
                  <div key={group.key} className="rounded-lg border border-border/70 bg-muted/25 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium capitalize text-foreground">{group.label}</div>
                      <Badge variant="outline">{group.count}</Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {group.routes.slice(0, 3).join(" • ")}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                Smoke Suite Targets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {systemMap.smokeRoutes.map((routePath) => (
                  <div key={routePath} className="flex items-center gap-2 rounded-full border border-border/70 bg-muted/25 px-3 py-1.5">
                    <span className="font-mono text-xs">{routePath}</span>
                    <Badge className={healthTone(health[routePath] ?? "idle")}>{health[routePath] ?? "idle"}</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void checkRoute(routePath)}>
                      <Activity className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </DevConsoleShell>
  );
}
