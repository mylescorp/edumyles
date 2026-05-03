"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Globe2, LayoutDashboard, Search, Waypoints } from "lucide-react";
import {
  DevConsoleShell,
  ErrorState,
  formatAreaLabel,
  LoadingState,
  MetricCard,
  SourcePath,
  useDevSystemMapData,
} from "@/components/dev/console";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMarketingSitePath } from "@/lib/marketingSite";

function formatLandingTitle(routePath: string, routeSegments: string[]) {
  if (routePath === "/") return "Home";
  const segment = routeSegments.at(-1) ?? routePath;
  return segment.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function DevLandingPage() {
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
  const searchNeedle = query.trim().toLowerCase();

  const filteredLanding = useMemo(() => {
    if (!systemMap) return [];
    return systemMap.landing.filter((item) => {
      if (!searchNeedle) return true;
      return [
        item.routePath,
        item.area,
        item.family,
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
        title="Landing Inventory"
        description="Marketing-site pages discovered from the landing app router."
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

  const dynamicCount = systemMap?.landing.filter((item) => item.isDynamic).length ?? 0;
  const staticCount = (systemMap?.landing.length ?? 0) - dynamicCount;
  const sectionCount = new Set(systemMap?.landing.map((item) => item.area) ?? []).size;

  return (
    <DevConsoleShell
      title="Landing Inventory"
      description="Marketing-site pages discovered from the landing app router."
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
            <MetricCard title="Landing Pages" value={systemMap.summary.landingPages} detail="Tracked marketing app pages" icon={Globe2} />
            <MetricCard title="Static Pages" value={staticCount} detail="Open directly from dev console" icon={LayoutDashboard} />
            <MetricCard title="Dynamic Pages" value={dynamicCount} detail="Parameterized marketing routes" icon={Waypoints} />
            <MetricCard title="Sections" value={sectionCount} detail="Top-level landing route families" icon={Search} />
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
                  placeholder="Search landing routes, sections, files..."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe2 className="h-4 w-4" />
                Landing Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLanding.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {formatLandingTitle(item.routePath, item.routeSegments)}
                          </span>
                          {item.isDynamic ? <Badge variant="secondary">dynamic</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-foreground">{item.routePath}</span>
                      </TableCell>
                      <TableCell className="capitalize text-sm text-muted-foreground">
                        {formatAreaLabel(item.area)}
                      </TableCell>
                      <TableCell>
                        <SourcePath path={item.relativePath} />
                      </TableCell>
                      <TableCell className="text-right">
                        {item.isDynamic ? (
                          <span className="text-xs text-muted-foreground">Dynamic route</span>
                        ) : (
                          <Button asChild variant="outline" size="sm">
                            <a href={getMarketingSitePath(item.routePath)} target="_blank" rel="noreferrer">
                              Open
                              <ExternalLink className="ml-2 h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
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
