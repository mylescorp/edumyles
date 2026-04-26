"use client";

import { Activity, Network, TestTube2 } from "lucide-react";
import {
  DevConsoleShell,
  ErrorState,
  healthTone,
  LoadingState,
  MetricCard,
  OpenRouteButton,
  useDevSystemMapData,
  useRouteHealth,
} from "@/components/dev/console";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DevTestingPage() {
  const {
    systemMap,
    isLoading,
    isRefreshing,
    error,
    autoRefresh,
    setAutoRefresh,
    loadSystemMap,
  } = useDevSystemMapData();
  const { health, checkedRoutes, checkRoute, checkSmokeSuite, runModuleSmokeSuite } = useRouteHealth(systemMap);

  if (isLoading && !systemMap) {
    return (
      <DevConsoleShell
        title="Testing Lab"
        description="Route smoke testing, module-family suites, and live health checks."
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

  const moduleSuites =
    systemMap?.modules
      .map((group) => ({
        ...group,
        routes: systemMap.frontend
          .filter((item) => item.kind === "page" && !item.isDynamic && item.moduleKey === group.key)
          .map((item) => item.routePath)
          .slice(0, 12),
      }))
      .filter((group) => group.routes.length > 0) ?? [];

  return (
    <DevConsoleShell
      title="Testing Lab"
      description="Route smoke testing, module-family suites, and live health checks."
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
            <MetricCard title="Smoke Targets" value={systemMap.smokeRoutes.length} detail="Preferred routes tracked for fast checks" icon={TestTube2} />
            <MetricCard title="Checked Routes" value={checkedRoutes} detail="Routes tested in this browser session" icon={Activity} />
            <MetricCard title="Module Suites" value={moduleSuites.length} detail="Module-family test bundles" icon={Network} />
            <MetricCard title="Nav Coverage" value={`${systemMap.summary.navCoveragePercent}%`} detail="Helpful signal before release verification" icon={Activity} />
          </div>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TestTube2 className="h-4 w-4" />
                Route Test Lab
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => void checkSmokeSuite()}>
                  <Activity className="mr-2 h-4 w-4" />
                  Run smoke suite
                </Button>
                <div className="text-sm text-muted-foreground">
                  Uses `GET` checks with manual redirect handling for app-router pages.
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {systemMap.smokeRoutes.map((routePath) => (
                  <div key={routePath} className="rounded-xl border border-border/70 bg-muted/25 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-mono text-sm text-foreground">{routePath}</div>
                      <Badge className={healthTone(health[routePath] ?? "idle")}>
                        {health[routePath] ?? "idle"}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => void checkRoute(routePath)}>
                        Check
                      </Button>
                      <OpenRouteButton routePath={routePath} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Network className="h-4 w-4" />
                Module Family Smoke Suites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {moduleSuites.map((suite) => (
                  <div key={suite.key} className="rounded-xl border border-border/70 bg-muted/25 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium capitalize text-foreground">{suite.label}</div>
                        <div className="text-xs text-muted-foreground">{suite.routes.length} static routes</div>
                      </div>
                      <Badge variant="outline">{suite.count}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {suite.routes.slice(0, 3).map((routePath) => (
                        <Badge key={routePath} variant="secondary" className="font-mono text-[11px]">
                          {routePath}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-3">
                      <Button variant="outline" size="sm" onClick={() => void runModuleSmokeSuite(suite.key)}>
                        <TestTube2 className="mr-2 h-3.5 w-3.5" />
                        Run {suite.label} suite
                      </Button>
                    </div>
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
