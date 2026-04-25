"use client";

import { useMemo, useState } from "react";
import { Database, Network, Search, Server, Zap } from "lucide-react";
import {
  BackendCard,
  DevConsoleShell,
  ErrorState,
  LoadingState,
  MetricCard,
  useDevSystemMapData,
} from "@/components/dev/console";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function DevBackendPage() {
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

  const filteredBackend = useMemo(() => {
    if (!systemMap) return [];
    return systemMap.backend.filter((item) => {
      if (!searchNeedle) return true;
      return [
        item.relativePath,
        item.area,
        item.family,
        item.endpoints.map((endpoint) => endpoint.signature).join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchNeedle);
    });
  }, [searchNeedle, systemMap]);

  if (isLoading && !systemMap) {
    return (
      <DevConsoleShell
        title="Backend Inventory"
        description="Convex files, exported endpoints, and service-family visibility."
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

  const uniqueAreas = new Set(systemMap?.backend.map((item) => item.area) ?? []);
  const uniqueFamilies = new Set(systemMap?.backend.map((item) => item.family) ?? []);

  return (
    <DevConsoleShell
      title="Backend Inventory"
      description="Convex files, exported endpoints, and service-family visibility."
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
            <MetricCard title="Backend Files" value={systemMap.summary.backendFiles} detail="Tracked Convex TypeScript files" icon={Database} />
            <MetricCard title="Endpoints" value={systemMap.summary.backendEndpoints} detail="Queries, mutations, actions, internals" icon={Zap} />
            <MetricCard title="Areas" value={uniqueAreas.size} detail="Top-level backend domains" icon={Server} />
            <MetricCard title="Families" value={uniqueFamilies.size} detail="Grouped service slices" icon={Network} />
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
                  placeholder="Search files, endpoint names, backend families..."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-4 w-4" />
                Convex Backend Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredBackend.slice(0, 120).map((item) => (
                <BackendCard key={item.id} item={item} />
              ))}
              {filteredBackend.length > 120 ? (
                <div className="text-xs text-muted-foreground">
                  Showing 120 of {filteredBackend.length} backend files. Refine the search to inspect a tighter slice.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </DevConsoleShell>
  );
}
