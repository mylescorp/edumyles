"use client";

import { useMemo, useState } from "react";
import { Activity, FileCode2, Layers, LayoutDashboard, Search, Waypoints } from "lucide-react";
import {
  DevConsoleShell,
  ErrorState,
  ExternalOpenButton,
  formatAreaLabel,
  healthTone,
  LoadingState,
  MetricCard,
  SourcePath,
  useDevSystemMapData,
  useRouteHealth,
} from "@/components/dev/console";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DevFrontendPage() {
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
  const [query, setQuery] = useState("");
  const searchNeedle = query.trim().toLowerCase();

  const filteredFrontend = useMemo(() => {
    if (!systemMap) return [];
    return systemMap.frontend.filter((item) => {
      if (!searchNeedle) return true;
      return [
        item.routePath,
        item.area,
        item.family,
        item.moduleKey ?? "",
        item.relativePath,
        item.kind,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchNeedle);
    });
  }, [searchNeedle, systemMap]);

  if (isLoading && !systemMap) {
    return (
      <DevConsoleShell
        title="Frontend Inventory"
        description="Pages, layouts, route handlers, and route-linked frontend artifacts."
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

  const pageCount = systemMap?.frontend.filter((item) => item.kind === "page").length ?? 0;
  const dynamicCount = systemMap?.frontend.filter((item) => item.kind === "page" && item.isDynamic).length ?? 0;
  const layoutCount = systemMap?.frontend.filter((item) => item.kind === "layout").length ?? 0;
  const apiCount = systemMap?.frontend.filter((item) => item.kind === "api").length ?? 0;

  return (
    <DevConsoleShell
      title="Frontend Inventory"
      description="Pages, layouts, route handlers, and route-linked frontend artifacts."
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
            <MetricCard title="Pages" value={pageCount} detail={`${dynamicCount} dynamic pages`} icon={LayoutDashboard} />
            <MetricCard title="API Routes" value={apiCount} detail="App router route handlers" icon={Waypoints} />
            <MetricCard title="Layouts" value={layoutCount} detail="Shared shell artifacts" icon={Layers} />
            <MetricCard title="Tracked Artifacts" value={systemMap.summary.frontendArtifacts} detail="Pages, APIs, layouts, loading, error states" icon={FileCode2} />
          </div>

          <Card className="border-border/70 bg-background/90 shadow-sm">
            <CardContent className="flex h-full items-center gap-3 p-5">
              <div className="rounded-xl bg-muted/60 p-2.5">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search routes, files, modules, portals..."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileCode2 className="h-4 w-4" />
                Frontend Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFrontend.slice(0, 150).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-foreground">{item.routePath}</span>
                          {item.isDynamic ? <Badge variant="secondary">dynamic</Badge> : null}
                          {item.isNavLinked ? <Badge variant="outline">nav</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.kind}</Badge>
                      </TableCell>
                      <TableCell className="capitalize text-sm text-muted-foreground">
                        {formatAreaLabel(item.area)}
                      </TableCell>
                      <TableCell>
                        {item.moduleKey ? <Badge variant="secondary">{item.moduleKey}</Badge> : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <SourcePath path={item.relativePath} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(item.kind === "page" || item.kind === "api") ? (
                            <>
                              <Badge className={healthTone(health[item.routePath] ?? "idle")}>
                                {health[item.routePath] ?? "idle"}
                              </Badge>
                              <Button variant="outline" size="sm" onClick={() => void checkRoute(item.routePath)}>
                                <Activity className="mr-2 h-3.5 w-3.5" />
                                Check
                              </Button>
                              <ExternalOpenButton href={item.routePath} />
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">Artifact only</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredFrontend.length > 150 ? (
                <div className="mt-3 text-xs text-muted-foreground">
                  Showing 150 of {filteredFrontend.length} frontend artifacts. Narrow the search to focus further.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </DevConsoleShell>
  );
}
