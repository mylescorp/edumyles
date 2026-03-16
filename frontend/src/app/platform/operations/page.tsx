"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "convex/react";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { formatRelativeTime } from "@/lib/utils";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Activity, 
  AlertCircle, 
  Plus, 
  Edit, 
  Trash2, 
  Bell, 
  Calendar,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Shield,
  TrendingUp,
  Users,
  Eye,
  EyeOff,
  RefreshCw,
  Play,
  Pause,
  Square
} from "lucide-react";

interface Incident {
  _id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "active" | "investigating" | "resolved" | "closed";
  services: string[];
  impact: string;
  assignedTo?: string;
  tags: string[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  startTime: number;
  endTime?: number;
  duration?: number;
  resolution?: string;
  resolvedBy?: string;
  acknowledged: boolean;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  notifications: string[];
  metrics: {
    affectedUsers: number;
    affectedTenants: number;
    businessImpact: string;
    recoveryTime?: number;
  };
  timeline?: Array<{
    type: "status_change" | "note" | "action" | "notification";
    message: string;
    metadata?: any;
    internal: boolean;
    createdBy: string;
    createdAt: number;
  }>;
}

interface MaintenanceWindow {
  _id: string;
  title: string;
  description: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  scheduledStart: number;
  scheduledEnd: number;
  actualStart?: number;
  actualEnd?: number;
  impact: "no_impact" | "degraded_performance" | "service_unavailable";
  affectedServices: string[];
  notificationChannels: string[];
  autoNotify: boolean;
  createdBy: string;
  tenantId: string;
  createdAt: number;
  updatedAt: number;
  notifications: string[];
  duration?: number;
  scheduledDuration: number;
}

interface OperationsAlert {
  _id: string;
  type: "system" | "security" | "performance" | "capacity";
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  status: "active" | "resolved";
  source: string;
  metrics?: Record<string, any>;
  autoResolve: boolean;
  resolveCondition?: string;
  createdBy: string;
  tenantId: string;
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
  resolution?: string;
  acknowledgements: string[];
  acknowledged: boolean;
}

interface SystemHealth {
  overall: string;
  score: number;
  lastChecked: number;
  services: Array<{
    name: string;
    status: string;
    responseTime: number;
    uptime: number;
    lastCheck: number;
    metrics: Record<string, any>;
  }>;
}

export default function OperationsCenterPage() {
  const { sessionToken } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isIncidentDialogOpen, setIsIncidentDialogOpen] = useState(false);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);

  // Get operations overview
  const overview = usePlatformQuery(
    api.platform.operations.queries.getOperationsOverview,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );

  // Get incidents
  const incidents = usePlatformQuery(
    api.platform.operations.queries.getIncidents,
    { sessionToken: sessionToken || "", status: "active" },
    !!sessionToken
  );

  // Get maintenance windows
  const maintenance = usePlatformQuery(
    api.platform.operations.queries.getMaintenanceWindows,
    { sessionToken: sessionToken || "", status: "upcoming" },
    !!sessionToken
  );

  // Get alerts
  const alerts = usePlatformQuery(
    api.platform.operations.queries.getAlerts,
    { sessionToken: sessionToken || "", status: "active" },
    !!sessionToken
  );

  // Mutations
  const createIncidentMutation = useMutation(api.platform.operations.mutations.createIncident);
  const updateIncidentMutation = useMutation(api.platform.operations.mutations.updateIncident);
  const createMaintenanceMutation = useMutation(api.platform.operations.mutations.createMaintenanceWindow);
  const acknowledgeAlertMutation = useMutation(api.platform.operations.mutations.acknowledgeAlert);
  const resolveAlertMutation = useMutation(api.platform.operations.mutations.resolveAlert);
  const updateMaintenanceMutation = useMutation(api.platform.operations.mutations.updateMaintenanceStatus);
  const cancelMaintenanceMutation = useMutation(api.platform.operations.mutations.cancelMaintenance);

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-red-100 text-red-800";
      case "investigating": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Handle incident creation
  const handleCreateIncident = async (formData: any) => {
    try {
      await createIncidentMutation({
        sessionToken,
        ...formData,
      });
      setIsIncidentDialogOpen(false);
      // Reset form
      const form = document.getElementById("incident-form") as HTMLFormElement;
      if (form) form.reset();
    } catch (error: any) {
      console.error("Failed to create incident:", error);
    }
  };

  // Handle incident update
  const handleUpdateIncident = async (updates: any) => {
    if (!selectedIncident) return;
    
    try {
      await updateIncidentMutation({
        sessionToken,
        incidentId: selectedIncident._id,
        updates,
      });
    } catch (error: any) {
      console.error("Failed to update incident:", error);
    }
  };

  // Handle maintenance creation
  const handleCreateMaintenance = async (formData: any) => {
    try {
      await createMaintenanceMutation({
        sessionToken,
        ...formData,
      });
      setIsMaintenanceDialogOpen(false);
      // Reset form
      const form = document.getElementById("maintenance-form") as HTMLFormElement;
      if (form) form.reset();
    } catch (error: any) {
      console.error("Failed to create maintenance window:", error);
    }
  };

  // Handle alert acknowledgment
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await acknowledgeAlertMutation({
        sessionToken,
        alertId,
        notes: "Acknowledged by operations team",
      });
    } catch (error: any) {
      console.error("Failed to acknowledge alert:", error);
    }
  };

  if (!sessionToken) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading operations center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operations Center</h1>
          <p className="text-gray-600 mt-1">System monitoring, incident management, and operational oversight</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsIncidentDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Incident
          </Button>
          <Button onClick={() => setIsMaintenanceDialogOpen(true)} variant="outline" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Schedule Maintenance
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Active Incidents</CardTitle>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{overview.incidents.active}</div>
              <p className="text-sm text-gray-600">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Critical Incidents</CardTitle>
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{overview.incidents.critical}</div>
              <p className="text-sm text-gray-600">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Active Alerts</CardTitle>
              <Bell className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{overview.alerts.active}</div>
              <p className="text-sm text-gray-600">Requiring attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">System Health</CardTitle>
              <Server className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{overview.systemHealth.score}%</div>
              <p className="text-sm text-gray-600">Overall health score</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Upcoming Maintenance</CardTitle>
              <Calendar className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{overview.maintenance.upcoming}</div>
              <p className="text-sm text-gray-600">Scheduled windows</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  System Health
                </CardTitle>
                <CardDescription>Real-time system health monitoring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {overview?.systemHealth?.services?.map((service: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{service.name}</div>
                      <div className="text-sm text-gray-600">{service.status}</div>
                    </div>
                    <div className="text-right">
                      <div className={`w-3 h-3 rounded-full ${service.status === "healthy" ? "bg-green-500" : "bg-red-500"}`}></div>
                      <div className="text-sm text-gray-600 mt-1">
                        <div>Response: {service.responseTime}ms</div>
                        <div>Uptime: {service.uptime}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest system events and notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Recent Incidents</h4>
                  {incidents?.slice(0, 3).map((incident: Incident) => (
                    <div key={incident._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{incident.title}</div>
                        <div className="text-sm text-gray-600">{incident.services.join(", ")}</div>
                      </div>
                      <div className="text-right">
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatRelativeTime(incident.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Select>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => setIsIncidentDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Incident
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {incidents?.map((incident: Incident) => (
              <Card key={incident._id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{incident.title}</CardTitle>
                      <CardDescription className="mt-1">{incident.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(incident.severity)}>
                        {incident.severity}
                      </Badge>
                      <Badge className={getStatusColor(incident.status)}>
                        {incident.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Services:</span>
                      <div className="text-gray-600">{incident.services.join(", ")}</div>
                    </div>
                    <div>
                      <span className="font-medium">Assigned to:</span>
                      <div className="text-gray-600">{incident.assignedTo || "Unassigned"}</div>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>
                      <div className="text-gray-600">{formatRelativeTime(incident.createdAt)}</div>
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span>
                      <div className="text-gray-600">
                        {incident.duration ? `${Math.round(incident.duration / (1000 * 60 * 60))}h` : "Ongoing"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-gray-600">
                      {incident.acknowledged ? (
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          Acknowledged by {incident.acknowledgedBy}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <EyeOff className="w-4 h-4" />
                          Not acknowledged
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedIncident(incident)}>
                        <Edit className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                      {incident.status === "active" && (
                        <Button variant="outline" size="sm" onClick={() => handleUpdateIncident({ status: "investigating" })}>
                          <Play className="w-4 h-4 mr-1" />
                          Start Investigation
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Select>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => setIsMaintenanceDialogOpen(true)}>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Maintenance
            </Button>
          </div>

          <div className="space-y-4">
            {maintenance?.map((window: MaintenanceWindow) => (
              <Card key={window._id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{window.title}</CardTitle>
                      <CardDescription className="mt-1">{window.description}</CardDescription>
                    </div>
                    <Badge className={
                      window.status === "scheduled" ? "bg-blue-100 text-blue-800" :
                      window.status === "in_progress" ? "bg-yellow-100 text-yellow-800" :
                      "bg-green-100 text-green-800"
                    }>
                      {window.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Impact:</span>
                      <div className="text-gray-600">{window.impact}</div>
                    </div>
                    <div>
                      <span className="font-medium">Services:</span>
                      <div className="text-gray-600">{window.affectedServices.join(", ")}</div>
                    </div>
                    <div>
                      <span className="font-medium">Scheduled:</span>
                      <div className="text-gray-600">
                        {new Date(window.scheduledStart).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span>
                      <div className="text-gray-600">
                        {window.scheduledDuration ? `${Math.round(window.scheduledDuration / (1000 * 60 * 60))}h` : "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-gray-600">
                      Auto-notify: {window.autoNotify ? "Enabled" : "Disabled"}
                    </div>
                    <div className="flex items-center gap-2">
                      {window.status === "scheduled" && (
                        <Button variant="outline" size="sm" onClick={async () => {
                          if (!sessionToken) return;
                          try {
                            await updateMaintenanceMutation({ sessionToken, maintenanceId: window._id, status: "in_progress" });
                          } catch (e) { console.error(e); }
                        }}>
                          <Pause className="w-4 h-4 mr-1" />
                          Start Now
                        </Button>
                      )}
                      {window.status === "in_progress" && (
                        <Button variant="outline" size="sm" onClick={async () => {
                          if (!sessionToken) return;
                          try {
                            await updateMaintenanceMutation({ sessionToken, maintenanceId: window._id, status: "completed" });
                          } catch (e) { console.error(e); }
                        }}>
                          <Square className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Select>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="capacity">Capacity</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {alerts?.map((alert: OperationsAlert) => (
              <Card key={alert._id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{alert.title}</CardTitle>
                      <CardDescription className="mt-1">{alert.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        alert.severity === "critical" ? "bg-red-100 text-red-800" :
                        alert.severity === "warning" ? "bg-orange-100 text-orange-800" :
                        "bg-blue-100 text-blue-800"
                      }>
                        {alert.severity}
                      </Badge>
                      <Badge className={
                        alert.acknowledged ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }>
                        {alert.acknowledged ? "Acknowledged" : "Unacknowledged"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Type:</span>
                      <div className="text-gray-600">{alert.type}</div>
                    </div>
                    <div>
                      <span className="font-medium">Source:</span>
                      <div className="text-gray-600">{alert.source}</div>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>
                      <div className="text-gray-600">{formatRelativeTime(alert.createdAt)}</div>
                    </div>
                  </div>

                  {alert.metrics && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Metrics:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(alert.metrics).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium">{key}:</span>
                            <div className="text-gray-600">{String(value)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-gray-600">
                      Auto-resolve: {alert.autoResolve ? "Enabled" : "Disabled"}
                    </div>
                    <div className="flex items-center gap-2">
                      {!alert.acknowledged && (
                        <Button variant="outline" size="sm" onClick={() => handleAcknowledgeAlert(alert._id)}>
                          <Eye className="w-4 h-4 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                      {alert.status === "active" && (
                        <Button variant="outline" size="sm" onClick={async () => {
                          if (!sessionToken) return;
                          try {
                            await resolveAlertMutation({ sessionToken, alertId: alert._id, resolution: "Manually resolved by admin" });
                          } catch (e) { console.error(e); }
                        }}>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Incident Dialog */}
      <Dialog open={isIncidentDialogOpen} onOpenChange={setIsIncidentDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Incident</DialogTitle>
            <DialogDescription>
              Report a new system incident for tracking and resolution
            </DialogDescription>
          </DialogHeader>
          <form id="incident-form" onSubmit={(e) => { e.preventDefault(); handleCreateIncident(Object.fromEntries(new FormData(e.currentTarget))); }}>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" name="title" required placeholder="Brief description of the incident" />
                </div>
                <div>
                  <Label htmlFor="severity">Severity *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" name="description" required placeholder="Detailed description of the incident" rows={4} />
              </div>

              <div>
                <Label htmlFor="services">Affected Services *</Label>
                <Input id="services" name="services" placeholder="e.g., API Server, Database, Email Service" />
              </div>

              <div>
                <Label htmlFor="impact">Business Impact</Label>
                <Input id="impact" name="impact" placeholder="Describe the business impact" />
              </div>

              <div>
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input id="assignedTo" name="assignedTo" placeholder="Email or team name" />
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input id="tags" name="tags" placeholder="e.g., database, api, security" />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsIncidentDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create Incident
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Maintenance Dialog */}
      <Dialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Schedule Maintenance Window</DialogTitle>
            <DialogDescription>
              Schedule a planned maintenance window for system updates or improvements
            </DialogDescription>
          </DialogHeader>
          <form id="maintenance-form" onSubmit={(e) => { e.preventDefault(); handleCreateMaintenance(Object.fromEntries(new FormData(e.currentTarget))); }}>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" name="title" required placeholder="Maintenance title" />
                </div>
                <div>
                  <Label htmlFor="impact">Impact *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select impact level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_impact">No Impact</SelectItem>
                      <SelectItem value="degraded_performance">Degraded Performance</SelectItem>
                      <SelectItem value="service_unavailable">Service Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" name="description" required placeholder="Describe the maintenance activities" rows={4} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduledStart">Scheduled Start *</Label>
                  <Input id="scheduledStart" name="scheduledStart" type="datetime-local" required />
                </div>
                <div>
                  <Label htmlFor="scheduledEnd">Scheduled End *</Label>
                  <Input id="scheduledEnd" name="scheduledEnd" type="datetime-local" required />
                </div>
              </div>

              <div>
                <Label htmlFor="affectedServices">Affected Services *</Label>
                <Input id="affectedServices" name="affectedServices" placeholder="e.g., API Server, Database" />
              </div>

              <div>
                <Label htmlFor="notificationChannels">Notification Channels</Label>
                <Input id="notificationChannels" name="notificationChannels" placeholder="e.g., email, slack, dashboard" />
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="autoNotify" name="autoNotify" defaultChecked />
                <Label htmlFor="autoNotify">Send automatic notifications</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMaintenanceDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Schedule Maintenance
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
