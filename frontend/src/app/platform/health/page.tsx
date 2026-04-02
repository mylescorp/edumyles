"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatRelativeTime } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Download,
  Eye,
  HardDrive,
  Loader2,
  Mail,
  MemoryStick,
  Network,
  RefreshCw,
  Server,
  Smartphone,
  TrendingDown,
  TrendingUp,
  Wifi,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

type ServiceHealth = {
  name: string;
  status: "healthy" | "warning" | "critical" | "down" | "degraded";
  responseTime: number;
  uptime: number;
  lastCheck: number;
  metrics: Record<string, unknown>;
};

type AlertRecord = {
  _id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  status: "active" | "resolved";
  source: string;
  createdAt: number;
  metrics?: Record<string, unknown>;
  resolution?: string;
  resolvedAt?: number;
};

type ResourceRange = "1h" | "6h" | "24h" | "7d";
type PerformanceRange = "1h" | "24h" | "7d" | "30d";
type UptimePeriod = "24h" | "7d" | "30d" | "90d";
type AlertStatusFilter = "all" | "active" | "resolved";
type AlertSeverityFilter = "all" | "critical" | "warning" | "info";

const PERFORMANCE_RANGE_BY_RESOURCE_RANGE: Record<ResourceRange, PerformanceRange> = {
  "1h": "1h",
  "6h": "24h",
  "24h": "24h",
  "7d": "7d",
};

const UPTIME_PERIOD_BY_RESOURCE_RANGE: Record<ResourceRange, UptimePeriod> = {
  "1h": "24h",
  "6h": "24h",
  "24h": "24h",
  "7d": "7d",
};

export default function SystemHealthPage() {
  const { sessionToken } = useAuth();
  const [resourceRange, setResourceRange] = useState<ResourceRange>("24h");
  const [alertStatus, setAlertStatus] = useState<AlertStatusFilter>("active");
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverityFilter>("all");
  const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);
  const [pendingAlertId, setPendingAlertId] = useState<string | null>(null);

  const queriesEnabled = !!sessionToken;
  const performanceRange = PERFORMANCE_RANGE_BY_RESOURCE_RANGE[resourceRange];
  const uptimePeriod = UPTIME_PERIOD_BY_RESOURCE_RANGE[resourceRange];

  const systemHealthData = usePlatformQuery(
    api.platform.health.queries.getSystemHealth,
    { sessionToken: sessionToken || "" },
    queriesEnabled
  );
  const performanceMetricsData = usePlatformQuery(
    api.platform.health.queries.getPerformanceMetrics,
    { sessionToken: sessionToken || "", timeRange: performanceRange },
    queriesEnabled
  );
  const uptimeStatsData = usePlatformQuery(
    api.platform.health.queries.getUptimeStats,
    { sessionToken: sessionToken || "", period: uptimePeriod },
    queriesEnabled
  );
  const alertsData = usePlatformQuery(
    api.platform.health.queries.getAlerts,
    {
      sessionToken: sessionToken || "",
      status: alertStatus,
      ...(alertSeverity !== "all" ? { severity: alertSeverity } : {}),
    },
    queriesEnabled
  );
  const alertAcknowledgements = usePlatformQuery(
    api.platform.operations.queries.getAlertAcknowledgements,
    { sessionToken: sessionToken || "", alertId: selectedAlert?._id || "" },
    !!sessionToken && !!selectedAlert
  );
  const resourceUsageData = usePlatformQuery(
    api.platform.health.queries.getResourceUsage,
    { sessionToken: sessionToken || "", timeRange: resourceRange },
    queriesEnabled
  );

  const acknowledgeAlertMutation = useMutation(api.platform.operations.mutations.acknowledgeAlert);
  const resolveAlertMutation = useMutation(api.platform.operations.mutations.resolveAlert);

  const services = useMemo(
    () => ((systemHealthData?.services || []) as ServiceHealth[]),
    [systemHealthData?.services]
  );
  const alerts = useMemo(
    () =>
      ((alertsData || []) as any[]).map((alert) => ({
        _id: String(alert._id),
        title: alert.title || alert.alertType || "Alert",
        description: alert.description || alert.message || "",
        severity: alert.severity,
        status: alert.status || "active",
        source: alert.source || alert.service || "System",
        createdAt: alert.createdAt || alert.triggeredAt || Date.now(),
        metrics: alert.metrics || alert.metadata,
        resolution: alert.resolution,
        resolvedAt: alert.resolvedAt,
      })) as AlertRecord[],
    [alertsData]
  );

  const healthyServiceCount = services.filter((service) => service.status === "healthy").length;
  const degradedServiceCount = services.filter((service) => service.status !== "healthy").length;
  const averageServiceResponseTime =
    services.length > 0
      ? Math.round(services.reduce((sum, service) => sum + service.responseTime, 0) / services.length)
      : 0;
  const criticalAlertCount = alerts.filter((alert) => alert.severity === "critical").length;
  const alertAcknowledgementCount = alertAcknowledgements?.length ?? 0;
  const currentResourceUsage = resourceUsageData?.current;
  const resourcePredictions = resourceUsageData?.predictions;
  const performanceOverview = performanceMetricsData?.overview;
  const uptimeOverview = uptimeStatsData?.overall;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-700 bg-green-100 border-green-200";
      case "warning":
      case "degraded":
        return "text-yellow-700 bg-yellow-100 border-yellow-200";
      case "critical":
        return "text-red-700 bg-red-100 border-red-200";
      case "down":
        return "text-slate-700 bg-slate-100 border-slate-200";
      default:
        return "text-slate-700 bg-slate-100 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4" />;
      case "warning":
      case "degraded":
        return <AlertTriangle className="h-4 w-4" />;
      case "critical":
      case "down":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "warning":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "info":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getTrendIcon = (trend?: string) => {
    if (trend === "increasing") return <TrendingUp className="h-4 w-4 text-orange-600" />;
    if (trend === "decreasing") return <TrendingDown className="h-4 w-4 text-green-600" />;
    return <Activity className="h-4 w-4 text-slate-500" />;
  };

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName) {
      case "Database":
        return <Database className="h-5 w-5" />;
      case "API Server":
        return <Server className="h-5 w-5" />;
      case "Authentication":
        return <Wifi className="h-5 w-5" />;
      case "Email Service":
        return <Mail className="h-5 w-5" />;
      case "SMS Service":
        return <Smartphone className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const formatMetricValue = (value: unknown) => {
    if (typeof value === "number") {
      return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2);
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    return String(value);
  };

  const handleRefresh = () => {
    toast.info("Convex health queries refresh automatically. Change a filter to reload a specific slice.");
  };

  const handleExport = () => {
    toast.info("Export is not wired yet. The dashboard is now using live data, but report download still needs a backend export endpoint.");
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    if (!sessionToken) return;
    setPendingAlertId(alertId);
    try {
      await acknowledgeAlertMutation({
        sessionToken,
        alertId,
        notes: "Acknowledged from platform health dashboard",
      });
      toast.success("Alert acknowledged.");
    } catch (error: any) {
      console.error("Failed to acknowledge alert:", error);
      toast.error(error?.message || "Failed to acknowledge alert.");
    } finally {
      setPendingAlertId(null);
    }
  };

  const handleResolveAlert = async (alert: AlertRecord) => {
    if (!sessionToken) return;
    setPendingAlertId(alert._id);
    try {
      await resolveAlertMutation({
        sessionToken,
        alertId: alert._id,
        resolution: `Resolved from platform health dashboard for ${alert.source}.`,
      });
      toast.success("Alert resolved.");
      if (selectedAlert?._id === alert._id) {
        setSelectedAlert({
          ...alert,
          status: "resolved",
          resolution: `Resolved from platform health dashboard for ${alert.source}.`,
          resolvedAt: Date.now(),
        });
      }
    } catch (error: any) {
      console.error("Failed to resolve alert:", error);
      toast.error(error?.message || "Failed to resolve alert.");
    } finally {
      setPendingAlertId(null);
    }
  };

  if (!sessionToken || !systemHealthData || !performanceMetricsData || !uptimeStatsData || !alertsData || !resourceUsageData) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Health & Monitoring"
        description="Live platform health, uptime trends, alert resolution, and capacity signals."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "System Health", href: "/platform/health" },
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Overall Health</CardTitle>
            <CardDescription>{String(systemHealthData.overall).replace(/_/g, " ")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{systemHealthData.score}%</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Last checked {formatRelativeTime(systemHealthData.lastChecked)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Service Coverage</CardTitle>
            <CardDescription>Healthy vs degraded services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {healthyServiceCount}/{services.length}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {degradedServiceCount} service{degradedServiceCount === 1 ? "" : "s"} need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Uptime</CardTitle>
            <CardDescription>{uptimePeriod} incident window</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{uptimeOverview?.uptime ?? 0}%</div>
            <p className="mt-1 text-sm text-muted-foreground">
              {uptimeOverview?.incidents ?? 0} incidents, {uptimeOverview?.downtime ?? 0} minutes downtime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Alerts</CardTitle>
            <CardDescription>Current filtered alert workload</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">{alerts.length}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              {criticalAlertCount} critical, {performanceOverview?.errorRate ?? 0}% error rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Platform Overview</CardTitle>
                  <CardDescription>These cards now come from the live health, uptime, and performance queries.</CardDescription>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                  <div className="rounded-lg border p-3">
                    <div className="text-muted-foreground">Avg Response</div>
                    <div className="font-semibold">{performanceOverview?.avgResponseTime ?? averageServiceResponseTime}ms</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-muted-foreground">Throughput</div>
                    <div className="font-semibold">{performanceOverview?.throughput?.toLocaleString() ?? 0}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-muted-foreground">Active Sessions</div>
                    <div className="font-semibold">{systemHealthData.activeSessions.toLocaleString()}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-muted-foreground">Recent Activity</div>
                    <div className="font-semibold">{systemHealthData.recentActivityCount.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {getServiceIcon(service.name)}
                      <CardTitle className="text-base">{service.name}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(service.status)}>
                      {getStatusIcon(service.status)}
                      <span className="ml-1 capitalize">{service.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Response Time</div>
                      <div className="font-medium">{service.responseTime}ms</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Uptime</div>
                      <div className="font-medium">{service.uptime}%</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(service.metrics || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-3 text-sm">
                        <span className="capitalize text-muted-foreground">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span className="font-medium">{formatMetricValue(value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Summary
                </CardTitle>
                <CardDescription>{performanceRange} performance window</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-3">
                    <div className="text-sm text-muted-foreground">Error Rate</div>
                    <div className="text-2xl font-bold">{performanceOverview?.errorRate ?? 0}%</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-sm text-muted-foreground">CPU Usage</div>
                    <div className="text-2xl font-bold">{performanceOverview?.cpuUsage ?? 0}%</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-sm text-muted-foreground">Memory Usage</div>
                    <div className="text-2xl font-bold">{performanceOverview?.memoryUsage ?? 0}%</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-sm text-muted-foreground">Disk Usage</div>
                    <div className="text-2xl font-bold">{performanceOverview?.diskUsage ?? 0}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Operational Follow-up
                </CardTitle>
                <CardDescription>Alert rules and incident workflows are managed in the operations center.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">
                    Use the health dashboard to assess live status and resolve alerts. For maintenance windows, alert suppressions,
                    and incident orchestration, continue in platform operations.
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/platform/operations">Open Operations Center</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="alerts" className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select value={alertSeverity} onValueChange={(value) => setAlertSeverity(value as AlertSeverityFilter)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>

              <Select value={alertStatus} onValueChange={(value) => setAlertStatus(value as AlertStatusFilter)}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button asChild variant="outline">
              <Link href="/platform/operations">Manage Alert Rules</Link>
            </Button>
          </div>

          {alerts.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No alerts matched the current filters.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => {
                const isPending = pendingAlertId === alert._id;
                const isResolved = alert.status === "resolved";

                return (
                  <Card key={alert._id}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={getSeverityColor(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                            <Badge variant="outline" className="capitalize">
                              {alert.status}
                            </Badge>
                            <h3 className="font-semibold">{alert.title}</h3>
                          </div>

                          <p className="text-sm text-muted-foreground">{alert.description}</p>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {getServiceIcon(alert.source)}
                              <span>{alert.source}</span>
                            </span>
                            <span>{formatRelativeTime(alert.createdAt)}</span>
                            {alert.resolvedAt ? <span>Resolved {formatRelativeTime(alert.resolvedAt)}</span> : null}
                          </div>

                          {alert.metrics && Object.keys(alert.metrics).length > 0 ? (
                            <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 md:grid-cols-3">
                              {Object.entries(alert.metrics).map(([key, value]) => (
                                <div key={key} className="text-sm">
                                  <div className="capitalize text-muted-foreground">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                  </div>
                                  <div className="font-medium">{formatMetricValue(value)}</div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 lg:ml-4">
                          <Button variant="outline" size="sm" onClick={() => setSelectedAlert(alert)}>
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Button>
                          {!isResolved ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isPending}
                                onClick={() => handleAcknowledgeAlert(alert._id)}
                              >
                                {isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1 h-4 w-4" />}
                                Acknowledge
                              </Button>
                              <Button size="sm" disabled={isPending} onClick={() => handleResolveAlert(alert)}>
                                {isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1 h-4 w-4" />}
                                Resolve
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Select value={resourceRange} onValueChange={(value) => setResourceRange(value as ResourceRange)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="6h">Last 6 Hours</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline">Active sessions: {currentResourceUsage?.activeSessions ?? 0}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Thresholds are driven by backend alerting rules, not client-side dashboard settings.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    CPU Usage
                  </CardTitle>
                  <span className="text-2xl font-bold text-blue-700">{currentResourceUsage?.cpu.overall ?? 0}%</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={currentResourceUsage?.cpu.overall ?? 0} className="h-2" />
                <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                  Per-core telemetry is not returned by the current backend query yet, so this dashboard shows overall CPU usage only.
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {getTrendIcon(resourcePredictions?.cpu?.trend)}
                  <span>
                    Predicted {Math.round(resourcePredictions?.cpu?.prediction ?? 0)}% CPU with {Math.round((resourcePredictions?.cpu?.confidence ?? 0) * 100)}% confidence
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MemoryStick className="h-5 w-5" />
                    Memory Usage
                  </CardTitle>
                  <span className="text-2xl font-bold text-purple-700">{currentResourceUsage?.memory.percentage ?? 0}%</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={currentResourceUsage?.memory.percentage ?? 0} className="h-2" />
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Total</div>
                    <div className="font-medium">{Math.round((currentResourceUsage?.memory.total ?? 0) / 1024)}GB</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Used</div>
                    <div className="font-medium">{Math.round(((currentResourceUsage?.memory.used ?? 0) / 1024) * 10) / 10}GB</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Available</div>
                    <div className="font-medium">{Math.round(((currentResourceUsage?.memory.available ?? 0) / 1024) * 10) / 10}GB</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {getTrendIcon(resourcePredictions?.memory?.trend)}
                  <span>
                    Predicted {Math.round(resourcePredictions?.memory?.prediction ?? 0)}% memory with {Math.round((resourcePredictions?.memory?.confidence ?? 0) * 100)}% confidence
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    Disk Usage
                  </CardTitle>
                  <span className="text-2xl font-bold text-green-700">{currentResourceUsage?.disk.percentage ?? 0}%</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={currentResourceUsage?.disk.percentage ?? 0} className="h-2" />
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Total</div>
                    <div className="font-medium">{currentResourceUsage?.disk.total ?? 0}GB</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Used</div>
                    <div className="font-medium">{currentResourceUsage?.disk.used ?? 0}GB</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Available</div>
                    <div className="font-medium">{currentResourceUsage?.disk.available ?? 0}GB</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {getTrendIcon(resourcePredictions?.disk?.trend)}
                  <span>
                    Predicted {Math.round(resourcePredictions?.disk?.prediction ?? 0)}% disk usage with {Math.round((resourcePredictions?.disk?.confidence ?? 0) * 100)}% confidence
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Network Activity
                  </CardTitle>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">Live</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Incoming</div>
                    <div className="font-medium">{currentResourceUsage?.network.in ?? 0} KB/s</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Outgoing</div>
                    <div className="font-medium">{currentResourceUsage?.network.out ?? 0} KB/s</div>
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-sm text-muted-foreground">Total Requests</div>
                  <div className="text-2xl font-bold">{(currentResourceUsage?.network.totalRequests ?? 0).toLocaleString()}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAlert?.title ?? "Alert Details"}</DialogTitle>
            <DialogDescription>
              Review live alert metadata and acknowledgement history from platform operations.
            </DialogDescription>
          </DialogHeader>

          {selectedAlert ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={getSeverityColor(selectedAlert.severity)}>{selectedAlert.severity.toUpperCase()}</Badge>
                <Badge variant="outline" className="capitalize">
                  {selectedAlert.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Source:</span> {selectedAlert.source}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {formatRelativeTime(selectedAlert.createdAt)}
                </div>
                {selectedAlert.resolution ? (
                  <div>
                    <span className="font-medium">Resolution:</span> {selectedAlert.resolution}
                  </div>
                ) : null}
                <p className="text-muted-foreground">{selectedAlert.description}</p>
              </div>

              {selectedAlert.metrics && Object.keys(selectedAlert.metrics).length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Metrics</h4>
                  <div className="grid gap-2 rounded-lg border p-3 text-sm">
                    {Object.entries(selectedAlert.metrics).map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-4">
                        <span className="capitalize text-muted-foreground">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span>{formatMetricValue(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Acknowledgements</h4>
                <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                  {selectedAlert.status === "resolved"
                    ? `This alert has been resolved. ${alertAcknowledgementCount} acknowledgement record${alertAcknowledgementCount === 1 ? "" : "s"} found.`
                    : alertAcknowledgementCount > 0
                      ? `${alertAcknowledgementCount} acknowledgement record${alertAcknowledgementCount === 1 ? "" : "s"} found for this alert.`
                      : "No acknowledgement records have been stored for this alert yet."}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
