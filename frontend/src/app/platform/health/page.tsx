"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Server,
  Database,
  HardDrive,
  Wifi,
  Mail,
  Smartphone,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Zap,
  Cpu,
  MemoryStick,
  Network,
  RefreshCw,
  Download,
  Bell,
  Eye,
  Settings,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

interface ServiceHealth {
  name: string;
  status: "healthy" | "warning" | "critical" | "down";
  responseTime: number;
  uptime: number;
  lastCheck: number;
  metrics: Record<string, any>;
}

interface Alert {
  _id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  status: "active" | "resolved";
  service: string;
  createdAt: number;
  acknowledged: boolean;
  assignedTo?: string;
  metrics?: Record<string, any>;
}

export default function SystemHealthPage() {
  const { sessionToken } = useAuth();
  const [timeRange, setTimeRange] = useState("24h");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Real Convex queries
  const systemHealthData = usePlatformQuery(
    api.platform.health.queries.getSystemHealth,
    { sessionToken: sessionToken || "" }
  );

  const alertsData = usePlatformQuery(
    api.platform.health.queries.getAlerts,
    { sessionToken: sessionToken || "", status: "active" as const }
  );

  const resourceUsageData = usePlatformQuery(
    api.platform.health.queries.getResourceUsage,
    { sessionToken: sessionToken || "", timeRange: timeRange as "1h" | "6h" | "24h" | "7d" }
  );

  if (!systemHealthData) return <LoadingSkeleton variant="page" />;

  const systemHealth = {
    overall: systemHealthData.overall,
    score: systemHealthData.score,
    lastChecked: systemHealthData.lastChecked,
    services: (systemHealthData.services || []) as ServiceHealth[],
  };

  const alerts: Alert[] = (alertsData || []).map((a: any) => ({
    _id: a._id,
    title: a.title || a.alertType || "Alert",
    description: a.description || a.message || "",
    severity: a.severity,
    status: a.status || "active",
    service: a.service || a.source || "System",
    createdAt: a.createdAt || a.triggeredAt,
    acknowledged: a.acknowledged || false,
    assignedTo: a.assignedTo,
    metrics: a.metrics || a.metadata,
  }));

  const resourceUsage = resourceUsageData ? {
    current: {
      cpu: { overall: resourceUsageData.current.cpu.overall, cores: resourceUsageData.current.cpu.cores || [] },
      memory: {
        total: `${Math.round(resourceUsageData.current.memory.total / 1024)}GB`,
        used: `${Math.round(resourceUsageData.current.memory.used / 1024 * 10) / 10}GB`,
        available: `${Math.round(resourceUsageData.current.memory.available / 1024 * 10) / 10}GB`,
        percentage: resourceUsageData.current.memory.percentage,
      },
      disk: {
        total: `${resourceUsageData.current.disk.total}GB`,
        used: `${resourceUsageData.current.disk.used}GB`,
        available: `${resourceUsageData.current.disk.available}GB`,
        percentage: resourceUsageData.current.disk.percentage,
      },
      network: {
        incoming: `${resourceUsageData.current.network.in}KB/s`,
        outgoing: `${resourceUsageData.current.network.out}KB/s`,
        totalRequests: resourceUsageData.current.network.totalRequests,
      },
    },
  } : {
    current: {
      cpu: { overall: 0, cores: [] },
      memory: { total: "0GB", used: "0GB", available: "0GB", percentage: 0 },
      disk: { total: "0GB", used: "0GB", available: "0GB", percentage: 0 },
      network: { incoming: "0KB/s", outgoing: "0KB/s", totalRequests: 0 },
    },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-600 bg-green-100";
      case "warning": return "text-yellow-600 bg-yellow-100";
      case "critical": return "text-red-600 bg-red-100";
      case "down": return "text-gray-600 bg-gray-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="h-4 w-4" />;
      case "warning": return <AlertTriangle className="h-4 w-4" />;
      case "critical": return <XCircle className="h-4 w-4" />;
      case "down": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-700 border-red-200";
      case "warning": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "info": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return "Just now";
  };

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName) {
      case "Database": return <Database className="h-5 w-5" />;
      case "API Server": return <Server className="h-5 w-5" />;
      case "File Storage": return <HardDrive className="h-5 w-5" />;
      case "Email Service": return <Mail className="h-5 w-5" />;
      case "SMS Service": return <Smartphone className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Overall Health Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">System Health Score</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-8 border-green-500 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{systemHealth.score}%</div>
                  <div className="text-sm text-muted-foreground">Healthy</div>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Last Checked</div>
                <div className="font-medium">{formatRelativeTime(systemHealth.lastChecked)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Active Services</div>
                <div className="font-medium">{systemHealth.services.length} / {systemHealth.services.length}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Avg Response Time</div>
                <div className="font-medium">
                  {Math.round(systemHealth.services.reduce((sum, s) => sum + s.responseTime, 0) / systemHealth.services.length)}ms
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">System Uptime</div>
                <div className="font-medium">99.94%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {systemHealth.services.map((service) => (
          <Card key={service.name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getServiceIcon(service.name)}
                  <CardTitle className="text-base">{service.name}</CardTitle>
                </div>
                <Badge className={getStatusColor(service.status)}>
                  {getStatusIcon(service.status)}
                  <span className="ml-1">{service.status}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
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
                {Object.entries(service.metrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="capitalize text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-medium">{typeof value === 'number' ? value.toFixed(2) : value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const AlertsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select defaultValue="all">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="active">
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button>
          <Bell className="h-4 w-4 mr-2" />
          Configure Alerts
        </Button>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <Card key={alert._id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <h3 className="font-semibold">{alert.title}</h3>
                    {!alert.acknowledged && (
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        Unacknowledged
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{alert.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center space-x-1">
                      {getServiceIcon(alert.service)}
                      <span>{alert.service}</span>
                    </span>
                    <span>{formatRelativeTime(alert.createdAt)}</span>
                    {alert.assignedTo && <span>Assigned to {alert.assignedTo}</span>}
                  </div>
                  {alert.metrics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 p-3 bg-muted rounded-lg">
                      {Object.entries(alert.metrics).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <div className="capitalize text-muted-foreground">{key}</div>
                          <div className="font-medium">{typeof value === 'number' ? value : value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {alert.status === "active" && (
                    <Button variant="outline" size="sm">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Acknowledge
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const ResourcesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Auto-refresh</span>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Activity className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Configure Thresholds
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Usage */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Cpu className="h-5 w-5" />
                <span>CPU Usage</span>
              </CardTitle>
              <span className="text-2xl font-bold text-blue-600">{resourceUsage.current.cpu.overall}%</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={resourceUsage.current.cpu.overall} className="h-2" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Core 1</div>
                <div className="font-medium">{resourceUsage.current.cpu.cores[0]}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Core 2</div>
                <div className="font-medium">{resourceUsage.current.cpu.cores[1]}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Core 3</div>
                <div className="font-medium">{resourceUsage.current.cpu.cores[2]}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Core 4</div>
                <div className="font-medium">{resourceUsage.current.cpu.cores[3]}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <MemoryStick className="h-5 w-5" />
                <span>Memory Usage</span>
              </CardTitle>
              <span className="text-2xl font-bold text-purple-600">{resourceUsage.current.memory.percentage}%</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={resourceUsage.current.memory.percentage} className="h-2" />
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total</div>
                <div className="font-medium">{resourceUsage.current.memory.total}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Used</div>
                <div className="font-medium text-orange-600">{resourceUsage.current.memory.used}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Available</div>
                <div className="font-medium text-green-600">{resourceUsage.current.memory.available}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disk Usage */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <HardDrive className="h-5 w-5" />
                <span>Disk Usage</span>
              </CardTitle>
              <span className="text-2xl font-bold text-green-600">{resourceUsage.current.disk.percentage}%</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={resourceUsage.current.disk.percentage} className="h-2" />
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total</div>
                <div className="font-medium">{resourceUsage.current.disk.total}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Used</div>
                <div className="font-medium text-orange-600">{resourceUsage.current.disk.used}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Available</div>
                <div className="font-medium text-green-600">{resourceUsage.current.disk.available}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Usage */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Network className="h-5 w-5" />
                <span>Network Usage</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">Active</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Incoming</div>
                <div className="font-medium text-blue-600">{resourceUsage.current.network.incoming}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Outgoing</div>
                <div className="font-medium text-purple-600">{resourceUsage.current.network.outgoing}</div>
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="text-sm text-muted-foreground">Total Requests</div>
              <div className="font-medium">{resourceUsage.current.network.totalRequests.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="System Health & Monitoring" 
        description="Real-time platform health monitoring and alerting"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "System Health", href: "/platform/health" }
        ]}
      />

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        
        <TabsContent value="alerts">
          <AlertsTab />
        </TabsContent>
        
        <TabsContent value="resources">
          <ResourcesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
