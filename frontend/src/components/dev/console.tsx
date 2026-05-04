"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { canRunPrivilegedDevActions } from "@/lib/dev/access";
import { DEV_CONSOLE_NAV } from "@/lib/dev/navigation";
import type {
  BackendArtifact,
  DevPortalLauncher,
  DevPrivilegedOpsData,
  DevSystemMap,
} from "@/lib/dev/types";
import { cn } from "@/lib/utils";

export type RouteHealth = "idle" | "loading" | "ok" | "redirect" | "missing" | "error";

const AUTO_REFRESH_MS = 20000;

export function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatAreaLabel(value: string) {
  return value
    .replace("portal:", "portal / ")
    .replace("api:", "api / ")
    .replace(/[-_]/g, " ");
}

export function formatRoleName(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function healthTone(state: RouteHealth) {
  switch (state) {
    case "ok":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "redirect":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "missing":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "error":
      return "bg-red-100 text-red-700 border-red-200";
    case "loading":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function statusFromCode(status: number) {
  if (status >= 200 && status < 300) return "ok";
  if ([301, 302, 303, 307, 308].includes(status)) return "redirect";
  if (status === 404) return "missing";
  return "error";
}

export function useDevSystemMapData() {
  const [systemMap, setSystemMap] = useState<DevSystemMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadSystemMap = useCallback(async (mode: "initial" | "refresh" = "refresh") => {
    if (mode === "initial") {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response = await fetch("/api/dev/system-map", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`System map request failed with ${response.status}`);
      }

      const payload = (await response.json()) as DevSystemMap;
      setSystemMap(payload);
      setError(null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load developer system map");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSystemMap("initial");
  }, [loadSystemMap]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => {
      void loadSystemMap("refresh");
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [autoRefresh, loadSystemMap]);

  return {
    systemMap,
    isLoading,
    isRefreshing,
    error,
    autoRefresh,
    setAutoRefresh,
    loadSystemMap,
  };
}

export function useRouteHealth(systemMap: DevSystemMap | null) {
  const [health, setHealth] = useState<Record<string, RouteHealth>>({});

  const checkRoute = useCallback(async (routePath: string) => {
    setHealth((current) => ({ ...current, [routePath]: "loading" }));
    try {
      const response = await fetch(routePath, {
        method: "GET",
        redirect: "manual",
        credentials: "same-origin",
        cache: "no-store",
      });
      setHealth((current) => ({ ...current, [routePath]: statusFromCode(response.status) }));
    } catch {
      setHealth((current) => ({ ...current, [routePath]: "error" }));
    }
  }, []);

  const checkSmokeSuite = useCallback(async () => {
    if (!systemMap) return;
    for (const routePath of systemMap.smokeRoutes) {
      await checkRoute(routePath);
    }
  }, [checkRoute, systemMap]);

  const runModuleSmokeSuite = useCallback(
    async (moduleKey: string) => {
      if (!systemMap) return;

      const routes = systemMap.frontend
        .filter((item) => item.kind === "page" && !item.isDynamic && item.moduleKey === moduleKey)
        .map((item) => item.routePath)
        .slice(0, 12);

      for (const routePath of routes) {
        await checkRoute(routePath);
      }
    },
    [checkRoute, systemMap]
  );

  const checkedRoutes = useMemo(
    () => Object.values(health).filter((value) => value !== "idle").length,
    [health]
  );

  return {
    health,
    checkedRoutes,
    checkRoute,
    checkSmokeSuite,
    runModuleSmokeSuite,
  };
}

export function useDevOps(
  role: string | null | undefined,
  onAfterMutation?: () => Promise<void> | void
) {
  const router = useRouter();
  const { toast } = useToast();
  const hasPrivilegedAccess = canRunPrivilegedDevActions(role);
  const [opsData, setOpsData] = useState<DevPrivilegedOpsData | null>(null);
  const [isOpsLoading, setIsOpsLoading] = useState(false);
  const [opsError, setOpsError] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [opsActionKey, setOpsActionKey] = useState<string | null>(null);

  const loadOpsData = useCallback(
    async (tenantIdForRequest: string | null) => {
      if (!hasPrivilegedAccess) return;

      setIsOpsLoading(true);
      try {
        const suffix = tenantIdForRequest ? `?tenantId=${encodeURIComponent(tenantIdForRequest)}` : "";
        const response = await fetch(`/api/dev/ops${suffix}`, { cache: "no-store" });
        const payload = (await response.json()) as DevPrivilegedOpsData | { error?: string };

        if (!response.ok) {
          throw new Error("error" in payload && payload.error ? payload.error : "Failed to load privileged operations");
        }

        setOpsData(payload as DevPrivilegedOpsData);
        setOpsError(null);
      } catch (fetchError) {
        setOpsError(fetchError instanceof Error ? fetchError.message : "Failed to load privileged operations");
      } finally {
        setIsOpsLoading(false);
      }
    },
    [hasPrivilegedAccess]
  );

  useEffect(() => {
    if (!hasPrivilegedAccess) return;
    void loadOpsData(selectedTenantId);
  }, [hasPrivilegedAccess, loadOpsData, selectedTenantId]);

  useEffect(() => {
    const defaultTenant = opsData?.tenants[0];
    if (!hasPrivilegedAccess || selectedTenantId || !defaultTenant) return;
    setSelectedTenantId(defaultTenant.tenantId);
  }, [hasPrivilegedAccess, opsData, selectedTenantId]);

  const runDevAction = useCallback(
    async (payload: Record<string, unknown>, successMessage: string) => {
      const actionKey = [
        String(payload.action ?? "action"),
        String(payload.tenantId ?? ""),
        String(payload.moduleId ?? payload.targetUserId ?? ""),
      ]
        .filter(Boolean)
        .join(":");

      setOpsActionKey(actionKey);
      try {
        const response = await fetch("/api/dev/ops", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = (await response.json()) as { error?: string; dashboard?: string };

        if (!response.ok) {
          throw new Error(result.error ?? "Developer operation failed");
        }

        toast({
          title: "Developer action completed",
          description: successMessage,
        });

        if (payload.action === "startImpersonation" && result.dashboard) {
          router.push(result.dashboard);
          return;
        }

        await loadOpsData(selectedTenantId);
        if (onAfterMutation) {
          await onAfterMutation();
        }
      } catch (actionError) {
        toast({
          title: "Developer action failed",
          description: actionError instanceof Error ? actionError.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        setOpsActionKey(null);
      }
    },
    [loadOpsData, onAfterMutation, router, selectedTenantId, toast]
  );

  return {
    hasPrivilegedAccess,
    opsData,
    isOpsLoading,
    opsError,
    selectedTenantId,
    setSelectedTenantId,
    opsActionKey,
    runDevAction,
  };
}

export function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="border-border/70">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
          <div className="mt-2 text-3xl font-semibold text-foreground">{value}</div>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className="rounded-lg border border-border/70 bg-muted/50 p-2.5">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

export function SourcePath({ path }: { path: string }) {
  return <span className="font-mono text-[11px] text-muted-foreground">{path}</span>;
}

export function CoverageCard({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <div className="space-y-2">
            {items.slice(0, 60).map((item) => (
              <div key={item} className="rounded-lg border border-border/70 bg-muted/25 px-3 py-2 font-mono text-xs text-foreground">
                {item}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            No items in this bucket right now.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function BackendCard({ item }: { item: BackendArtifact }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{item.family}</span>
            <Badge variant="outline">{item.area}</Badge>
            <Badge variant="secondary">{item.endpointCount} endpoints</Badge>
          </div>
          <div className="mt-1">
            <SourcePath path={item.relativePath} />
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {item.endpoints.length ? (
          item.endpoints.map((endpoint) => (
            <Badge key={`${item.id}:${endpoint.signature}`} variant="outline" className="font-mono text-[11px]">
              {endpoint.signature}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">No exported Convex endpoints detected in this file.</span>
        )}
      </div>
    </div>
  );
}

export function DevConsoleShell({
  title,
  description,
  systemMap,
  isRefreshing,
  autoRefresh,
  setAutoRefresh,
  onRefresh,
  children,
}: {
  title: string;
  description: string;
  systemMap: DevSystemMap | null;
  isRefreshing: boolean;
  autoRefresh: boolean;
  setAutoRefresh: (value: boolean) => void;
  onRefresh: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef2f6_100%)]">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title={title}
          description={description}
          breadcrumbs={[
            { label: "Platform", href: "/platform" },
            { label: "Developer", href: "/portal/developer" },
            { label: "Dev Console", href: "/dev" },
            ...(pathname !== "/dev" ? [{ label: title }] : []),
          ]}
          badge={
            <Badge className="border-blue-200 bg-blue-50 text-blue-700">
              {isRefreshing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
              Live repo scan
            </Badge>
          }
          actions={
            <>
              <div className="hidden items-center gap-2 rounded-lg border border-border/70 bg-background/80 px-3 py-2 sm:flex">
                <span className="text-xs text-muted-foreground">Auto refresh</span>
                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              </div>
              <Button variant="outline" onClick={onRefresh}>
                <Activity className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </>
          }
        />

        <Card className="mb-4 border-border/70 bg-background/95 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap">
              <Badge variant="outline">{systemMap?.summary.frontendPages ?? 0} pages</Badge>
              <Badge variant="outline">{systemMap?.summary.landingPages ?? 0} landing</Badge>
              <Badge variant="outline">{systemMap?.summary.backendEndpoints ?? 0} endpoints</Badge>
              <Badge variant="outline">{systemMap?.summary.panelCount ?? 0} panels</Badge>
              <Badge variant="outline">{systemMap?.summary.portalCount ?? 0} portals</Badge>
              <Badge variant="outline">{systemMap?.summary.moduleCount ?? 0} modules</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Last generated: <span className="font-medium text-foreground">{systemMap ? formatTimestamp(systemMap.summary.generatedAt) : "Loading"}</span>
            </div>
          </CardContent>
        </Card>

        <div className="sticky top-0 z-20 mb-6 overflow-x-auto rounded-xl border border-border/70 bg-background/95 p-2 shadow-sm backdrop-blur">
          <div className="flex min-w-max gap-2">
          {DEV_CONSOLE_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex h-12 items-center gap-2 rounded-lg border px-3 text-sm transition-all",
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                      : "border-transparent bg-transparent text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="whitespace-nowrap font-medium">{item.title}</span>
                </div>
              </Link>
            );
          })}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/90 px-5 py-4 text-sm text-muted-foreground shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Scanning frontend routes and Convex backend...
      </div>
    </div>
  );
}

export function ErrorState({ error }: { error: string }) {
  return (
    <Card className="border-rose-200 bg-rose-50">
      <CardContent className="flex items-center gap-3 p-5 text-rose-700">
        <AlertTriangle className="h-5 w-5" />
        <div>
          <div className="font-medium">Developer system map failed to load</div>
          <div className="text-sm">{error}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OpenRouteButton({ routePath }: { routePath: string }) {
  if (routePath.includes("[") || routePath.includes("]")) {
    return <span className="text-xs text-muted-foreground">Dynamic route</span>;
  }

  return (
    <Button asChild size="sm">
      <a href={routePath} target="_blank" rel="noreferrer">
        Open
        <ChevronRight className="ml-2 h-3.5 w-3.5" />
      </a>
    </Button>
  );
}

export function ExternalOpenButton({ href }: { href: string }) {
  if (href.includes("[") || href.includes("]")) {
    return <span className="text-xs text-muted-foreground">Dynamic route</span>;
  }

  return (
    <Button asChild variant="outline" size="sm">
      <a href={href} target="_blank" rel="noreferrer">
        Open
        <ExternalLink className="ml-2 h-3.5 w-3.5" />
      </a>
    </Button>
  );
}

export function PrivilegedAccessEmptyState() {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="flex items-center gap-3 p-5 text-amber-800">
        <AlertTriangle className="h-5 w-5" />
        <div>
          <div className="font-medium">Privileged operations are restricted</div>
          <div className="text-sm">
            This view is reserved for `master_admin` and `super_admin` accounts.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function useModuleRowsFromOps({
  opsData,
  searchNeedle,
}: {
  opsData: DevPrivilegedOpsData | null;
  searchNeedle: string;
}) {
  return useMemo(() => {
    if (!opsData) return [];

    const installedById = new Map(opsData.tenantModules.map((item) => [item.moduleId, item]));

    return opsData.moduleCatalog
      .filter((item) => {
        if (!searchNeedle) return true;
        return `${item.moduleId} ${item.name} ${item.category ?? ""} ${item.tier ?? ""}`
          .toLowerCase()
          .includes(searchNeedle);
      })
      .map((item) => ({
        catalog: item,
        installed: installedById.get(item.moduleId) ?? null,
      }));
  }, [opsData, searchNeedle]);
}

export function PortalLauncherCard({
  launcher,
  selectedTenantId,
  opsActionKey,
  onLaunch,
}: {
  launcher: DevPortalLauncher;
  selectedTenantId: string | null;
  opsActionKey: string | null;
  onLaunch: () => void;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/25 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-foreground">{launcher.label}</div>
          <div className="mt-1 font-mono text-[11px] text-muted-foreground">{launcher.dashboard}</div>
          <div className="mt-2 text-xs text-muted-foreground">
            {launcher.candidate
              ? `Launch with ${launcher.candidate.name} (${launcher.candidate.email})`
              : "No active impersonation candidate found for this role yet."}
          </div>
        </div>
        <ExternalOpenButton href={launcher.dashboard} />
      </div>
      {launcher.candidate ? (
        <div className="mt-3">
          <Button
            size="sm"
            onClick={onLaunch}
            disabled={opsActionKey === `startImpersonation:${selectedTenantId}:${launcher.candidate.id}`}
          >
            <Activity className="mr-2 h-3.5 w-3.5" />
            Impersonate & Launch
          </Button>
        </div>
      ) : null}
    </div>
  );
}
