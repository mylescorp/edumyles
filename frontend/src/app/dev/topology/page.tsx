"use client";

import { useMemo } from "react";
import { Boxes, Layers3, Network, Rows3 } from "lucide-react";
import {
  DevConsoleShell,
  ErrorState,
  ExternalOpenButton,
  formatTimestamp,
  LoadingState,
  MetricCard,
  useDevSystemMapData,
} from "@/components/dev/console";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DevTopologyPage() {
  const {
    systemMap,
    isLoading,
    isRefreshing,
    error,
    autoRefresh,
    setAutoRefresh,
    loadSystemMap,
  } = useDevSystemMapData();

  const groupedTopology = useMemo(() => {
    if (!systemMap) return { panel: [], portal: [], module: [] } as const;
    return {
      panel: systemMap.topology.filter((bucket) => bucket.kind === "panel"),
      portal: systemMap.topology.filter((bucket) => bucket.kind === "portal"),
      module: systemMap.topology.filter((bucket) => bucket.kind === "module"),
    };
  }, [systemMap]);

  if (isLoading && !systemMap) {
    return (
      <DevConsoleShell
        title="System Topology"
        description="Every panel, portal, module, and the feature routes living inside each one."
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
      title="System Topology"
      description="Every panel, portal, module, and the feature routes living inside each one."
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
            <MetricCard title="Panels" value={groupedTopology.panel.length} detail="Operational panel groupings" icon={Rows3} />
            <MetricCard title="Portals" value={groupedTopology.portal.length} detail="Role-facing portal surfaces" icon={Boxes} />
            <MetricCard title="Modules" value={groupedTopology.module.length} detail="Module-driven feature families" icon={Network} />
            <MetricCard title="Features" value={systemMap.topology.reduce((sum, bucket) => sum + bucket.featureCount, 0)} detail="Frontend artifacts mapped into topology" icon={Layers3} />
          </div>

          {([
            ["panel", "Panels", groupedTopology.panel],
            ["portal", "Portals", groupedTopology.portal],
            ["module", "Modules", groupedTopology.module],
          ] as const).map(([key, label, buckets]) => (
            <Card key={key} className="border-border/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {key === "panel" ? <Rows3 className="h-4 w-4" /> : key === "portal" ? <Boxes className="h-4 w-4" /> : <Network className="h-4 w-4" />}
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {buckets.map((bucket) => (
                  <div key={`${bucket.kind}:${bucket.key}`} className="rounded-xl border border-border/70 bg-muted/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-foreground">{bucket.label}</div>
                        <div className="text-xs text-muted-foreground">{bucket.featureCount} feature artifacts</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{bucket.kind}</Badge>
                        <Badge variant="secondary">{bucket.launchableFeatureCount} openable</Badge>
                        {bucket.launchPath ? (
                          <ExternalOpenButton href={bucket.launchPath} />
                        ) : (
                          <span className="text-xs text-muted-foreground">No concrete launch route</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2">
                      {bucket.features.map((feature) => (
                        <div key={feature.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/80 px-3 py-2.5">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-foreground">{feature.title}</span>
                              <Badge variant="secondary">{feature.kind}</Badge>
                              {feature.moduleKey ? <Badge variant="outline">{feature.moduleKey}</Badge> : null}
                              {feature.isDynamic ? <Badge variant="secondary">dynamic</Badge> : null}
                              {feature.isLaunchable ? <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">openable</Badge> : null}
                            </div>
                            <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                              {feature.routePath} • {feature.relativePath}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-xs text-muted-foreground">
                              {formatTimestamp(feature.modifiedAt)}
                            </div>
                            {feature.launchPath ? (
                              <ExternalOpenButton href={feature.launchPath} />
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {feature.isDynamic ? "Dynamic route" : "Not a page"}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </DevConsoleShell>
  );
}
