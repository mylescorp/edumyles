"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { formatRelativeTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Eye, 
  Server,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Target,
  Zap,
  BarChart3,
  Download,
  RefreshCw,
  Settings,
  ShieldCheck,
  Ban,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface SecurityIncident {
  _id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "unauthorized_access" | "data_breach" | "malware" | "phishing" | "denial_of_service" | "vulnerability" | "policy_violation" | "other";
  status: "open" | "investigating" | "contained" | "resolved" | "closed";
  affectedSystems: string[];
  affectedTenants: string[];
  discoveredAt: number;
  reportedAt: number;
  reportedBy: string;
  assignee?: string;
  tags: string[];
  timeline?: Array<{
    timestamp: number;
    action: string;
    description: string;
    user: string;
  }>;
  mitigations?: Array<{
    id: string;
    description: string;
    effectiveness: "low" | "medium" | "high";
    implementedAt: number;
    implementedBy: string;
    verified: boolean;
  }>;
  rootCause: string;
  impactAssessment: {
    affectedUsers: number;
    dataExposed: boolean;
    systemIntegrity: string;
    businessImpact: string;
  };
  resolvedAt?: number;
}

interface Threat {
  _id: string;
  type: "malware" | "phishing" | "brute_force" | "ddos" | "injection" | "xss" | "social_engineering" | "insider_threat";
  severity: "low" | "medium" | "high" | "critical";
  status: "active" | "mitigated" | "resolved" | "false_positive";
  source: {
    ip: string;
    country: string;
    userAgent?: string;
    email?: string;
  };
  target: {
    system: string;
    user?: string;
    data?: string;
  };
  detectedAt: number;
  mitigatedAt?: number;
  description: string;
  indicators: string[];
  confidence: number;
  falsePositive?: boolean;
}

interface SecurityMetrics {
  overall: {
    score: number;
    level: "excellent" | "good" | "fair" | "poor" | "critical";
    trend: "improving" | "stable" | "degrading";
  };
  threats: {
    active: number;
    mitigated: number;
    falsePositives: number;
    trend: "increasing" | "decreasing" | "stable";
  };
  incidents: {
    open: number;
    investigating: number;
    resolved: number;
    averageResolutionTime: number;
  };
  compliance: {
    score: number;
    violations: number;
    lastAudit: number;
  };
  access: {
    totalAttempts: number;
    failedAttempts: number;
    suspiciousIPs: number;
    blockedAttempts: number;
  };
}

export default function SecurityDashboardPage() {
  const { sessionToken } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTimeRange, setSelectedTimeRange] = useState<"1h" | "24h" | "7d" | "30d">("24h");
  const [selectedCategory, setSelectedCategory] = useState<Threat["type"] | "all">("all");
  const [pendingThreatId, setPendingThreatId] = useState<string | null>(null);
  const [pendingBlockedIp, setPendingBlockedIp] = useState<string | null>(null);

  // Get security overview
  const securityOverview = usePlatformQuery(
    api.platform.security.queries.getSecurityOverview,
    { sessionToken: sessionToken || "", timeRange: selectedTimeRange },
    !!sessionToken
  );

  // Get security incidents
  const incidents = usePlatformQuery(
    api.platform.security.queries.getSecurityIncidents,
    { sessionToken: sessionToken || "", status: "open", limit: 20 },
    !!sessionToken
  );

  // Get active threats
  const threats = usePlatformQuery(
    api.platform.security.queries.getActiveThreats,
    {
      sessionToken: sessionToken || "",
      status: "active",
      ...(selectedCategory !== "all" ? { category: selectedCategory } : {}),
      limit: 50,
    },
    !!sessionToken
  );

  // Get compliance status
  const compliance = usePlatformQuery(
    api.platform.security.queries.getComplianceStatus,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );

  // Get access logs
  const accessLogs = usePlatformQuery(
    api.platform.security.queries.getAccessLogs,
    { sessionToken: sessionToken || "", timeRange: selectedTimeRange, limit: 100 },
    !!sessionToken
  );

  // Get vulnerability scan results
  const vulnerabilityScan = usePlatformQuery(
    api.platform.security.queries.getVulnerabilityScan,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );

  const blockedIPs = usePlatformQuery(
    api.platform.security.queries.listBlockedIPs,
    { sessionToken: sessionToken || "", limit: 20 },
    !!sessionToken
  );

  // Mutations
  const acknowledgeThreatMutation = useMutation(api.platform.security.mutations.acknowledgeThreat);
  const mitigateThreatMutation = useMutation(api.platform.security.mutations.mitigateThreat);
  const blockIPMutation = useMutation(api.platform.security.mutations.blockIP);

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
      case "open": return "bg-red-100 text-red-800";
      case "investigating": return "bg-yellow-100 text-yellow-800";
      case "contained": return "bg-blue-100 text-blue-800";
      case "mitigating": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      case "false_positive": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Get security level color
  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case "excellent": return "text-green-600";
      case "good": return "text-blue-600";
      case "fair": return "text-yellow-600";
      case "poor": return "text-orange-600";
      case "critical": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  // Handle threat acknowledgment
  const handleAcknowledgeThreat = async (threatId: string) => {
    setPendingThreatId(threatId);
    try {
      await acknowledgeThreatMutation({
        sessionToken,
        threatId,
        notes: "Acknowledged by security team",
      });
      toast.success("Threat acknowledged.");
    } catch (error: any) {
      console.error("Failed to acknowledge threat:", error);
      toast.error(error?.message || "Failed to acknowledge threat.");
    } finally {
      setPendingThreatId(null);
    }
  };

  // Handle threat mitigation
  const handleMitigateThreat = async (threatId: string, mitigation: string) => {
    setPendingThreatId(threatId);
    try {
      await mitigateThreatMutation({
        sessionToken,
        threatId,
        mitigation,
      });
      toast.success(mitigation === "block_ip" ? "Threat moved into mitigation." : "Threat resolved.");
    } catch (error: any) {
      console.error("Failed to mitigate threat:", error);
      toast.error(error?.message || "Failed to mitigate threat.");
    } finally {
      setPendingThreatId(null);
    }
  };

  // Handle IP blocking
  const handleBlockIP = async (ip: string) => {
    setPendingBlockedIp(ip);
    try {
      await blockIPMutation({
        sessionToken,
        ip,
        reason: "Suspicious activity detected",
        duration: 24 * 60 * 60 * 1000, // 24 hours
      });
      toast.success(`Blocked ${ip} for 24 hours.`);
    } catch (error: any) {
      console.error("Failed to block IP:", error);
      toast.error(error?.message || "Failed to block IP.");
    } finally {
      setPendingBlockedIp(null);
    }
  };

  if (
    !sessionToken ||
    !securityOverview ||
    !incidents ||
    !threats ||
    !compliance ||
    !accessLogs ||
    !vulnerabilityScan ||
    !blockedIPs
  ) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Advanced Security Dashboard"
        description="Real-time threat detection, incident tracking, compliance signals, and access monitoring."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Security", href: "/platform/security" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Select value={selectedTimeRange} onValueChange={(value) => setSelectedTimeRange(value as "1h" | "24h" | "7d" | "30d")}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => toast.info("Security data refreshes automatically from Convex queries.")}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Security Overview */}
      {securityOverview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Security Score</CardTitle>
              <Shield className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{securityOverview.overall.score}%</div>
              <p className={`text-sm ${getSecurityLevelColor(securityOverview.overall.level)}`}>
                {securityOverview.overall.level.toUpperCase()} - {securityOverview.overall.trend}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Active Threats</CardTitle>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{securityOverview.threats.active}</div>
              <p className="text-sm text-gray-600">
                {securityOverview.threats.trend === "increasing" ? "↑ Increasing" : 
                 securityOverview.threats.trend === "decreasing" ? "↓ Decreasing" : "→ Stable"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Open Incidents</CardTitle>
              <Activity className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{securityOverview.incidents.open}</div>
              <p className="text-sm text-gray-600">
                {securityOverview.incidents.investigating} investigating
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Compliance Score</CardTitle>
              <ShieldCheck className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{securityOverview.compliance.score}%</div>
              <p className="text-sm text-gray-600">
                {securityOverview.compliance.violations} violations
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="threats">Threats</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="access">Access Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Security Metrics
                </CardTitle>
                <CardDescription>Real-time security indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Failed Login Attempts</span>
                    <span className="text-lg font-bold text-red-600">
                      {securityOverview?.access?.failedAttempts || 0}
                    </span>
                  </div>
                  <Progress value={75} className="h-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Blocked IPs</span>
                    <span className="text-lg font-bold text-orange-600">
                      {securityOverview?.access?.blockedAttempts || 0}
                    </span>
                  </div>
                  <Progress value={60} className="h-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Suspicious Activities</span>
                    <span className="text-lg font-bold text-yellow-600">
                      {securityOverview?.access?.suspiciousIPs || 0}
                    </span>
                  </div>
                  <Progress value={30} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Threat Intelligence */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Threat Intelligence
                </CardTitle>
                <CardDescription>Live threat breakdown from currently active detections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Malware Detected:</span>
                      <div className="text-lg font-bold text-red-600">{threats.filter((threat: Threat) => threat.type === "malware").length}</div>
                    </div>
                    <div>
                      <span className="font-medium">Phishing Attempts:</span>
                      <div className="text-lg font-bold text-orange-600">{threats.filter((threat: Threat) => threat.type === "phishing").length}</div>
                    </div>
                    <div>
                      <span className="font-medium">Brute Force:</span>
                      <div className="text-lg font-bold text-yellow-600">{threats.filter((threat: Threat) => threat.type === "brute_force").length}</div>
                    </div>
                    <div>
                      <span className="font-medium">DDoS Attacks:</span>
                      <div className="text-lg font-bold text-purple-600">{threats.filter((threat: Threat) => threat.type === "ddos").length}</div>
                    </div>
                  </div>
                  {threats[0] ? (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-800">Highest-priority active threat</span>
                      </div>
                      <p className="mt-2 text-sm text-red-700">
                        {threats[0].description}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                      No active threats are currently recorded for the selected filter window.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Compliance Areas
                </CardTitle>
                <CardDescription>Computed from real compliance query data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(compliance?.areas ?? []).map((area: any) => (
                  <div key={area.area} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{area.area}</p>
                      <p className="text-sm text-muted-foreground">
                        {area.violations?.length ? area.violations[0] : "No current violations recorded"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{area.score ?? "N/A"}{area.score !== null ? "%" : ""}</p>
                      <Badge variant="outline">{String(area.status).replace(/_/g, " ")}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ban className="w-5 h-5" />
                  Blocked IPs
                </CardTitle>
                <CardDescription>Active IP blocks applied through security workflows</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {blockedIPs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No blocked IPs are currently active.</p>
                ) : (
                  blockedIPs.slice(0, 8).map((blocked: any) => (
                    <div key={blocked._id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-mono text-sm">{blocked.ip}</p>
                        <p className="text-xs text-muted-foreground">{blocked.reason}</p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>Blocked {formatRelativeTime(blocked.blockedAt)}</p>
                        <p>Expires {blocked.expiresAt ? formatRelativeTime(blocked.expiresAt) : "never"}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="threats" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as Threat["type"] | "all")}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="malware">Malware</SelectItem>
                  <SelectItem value="phishing">Phishing</SelectItem>
                  <SelectItem value="brute_force">Brute Force</SelectItem>
                  <SelectItem value="ddos">DDoS</SelectItem>
                  <SelectItem value="injection">Injection</SelectItem>
                  <SelectItem value="social_engineering">Social Engineering</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {threats?.map((threat: Threat) => (
              <Card key={threat._id} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        {threat.type.replace('_', ' ').toUpperCase()}
                      </CardTitle>
                      <CardDescription>{threat.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(threat.severity)}>
                        {threat.severity}
                      </Badge>
                      <Badge className={getStatusColor(threat.status)}>
                        {threat.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Source IP:</span>
                      <div className="text-gray-600">{threat.source.ip}</div>
                      <div className="text-xs text-gray-500">{threat.source.country}</div>
                    </div>
                    <div>
                      <span className="font-medium">Target:</span>
                      <div className="text-gray-600">{threat.target.system}</div>
                      {threat.target.user && (
                        <div className="text-xs text-gray-500">User: {threat.target.user}</div>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Confidence:</span>
                      <div className="text-gray-600">{Math.round(threat.confidence * 100)}%</div>
                    </div>
                    <div>
                      <span className="font-medium">Detected:</span>
                      <div className="text-gray-600">{formatRelativeTime(threat.detectedAt)}</div>
                    </div>
                  </div>

                  {threat.indicators && threat.indicators.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Threat Indicators:</h4>
                      <div className="flex flex-wrap gap-1">
                        {threat.indicators.map((indicator, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {indicator}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-gray-600">
                      {threat.falsePositive ? "Marked as false positive" : "Active threat"}
                    </div>
                    <div className="flex items-center gap-2">
                      {threat.status === "active" && (
                        <>
                          <Button variant="outline" size="sm" disabled={pendingThreatId === threat._id} onClick={() => handleAcknowledgeThreat(threat._id)}>
                            {pendingThreatId === threat._id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Eye className="w-4 h-4 mr-1" />}
                            Acknowledge
                          </Button>
                          <Button variant="outline" size="sm" disabled={pendingThreatId === threat._id || pendingBlockedIp === threat.source.ip} onClick={() => handleMitigateThreat(threat._id, "block_ip")}>
                            {pendingThreatId === threat._id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Ban className="w-4 h-4 mr-1" />}
                            Block IP
                          </Button>
                          <Button variant="outline" size="sm" disabled={pendingBlockedIp === threat.source.ip} onClick={() => handleBlockIP(threat.source.ip)}>
                            {pendingBlockedIp === threat.source.ip ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Shield className="w-4 h-4 mr-1" />}
                            Manual Block
                          </Button>
                        </>
                      )}
                      {(threat.status as string) === "mitigating" && (
                        <Button variant="outline" size="sm" disabled={pendingThreatId === threat._id} onClick={() => handleMitigateThreat(threat._id, "resolve")}>
                          {pendingThreatId === threat._id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
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

        <TabsContent value="incidents" className="space-y-6">
          <div className="space-y-4">
            {incidents?.map((incident: SecurityIncident) => (
              <Card key={incident._id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{incident.title}</CardTitle>
                      <CardDescription>{incident.description}</CardDescription>
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
                      <span className="font-medium">Category:</span>
                      <div className="text-gray-600">{incident.category.replace('_', ' ')}</div>
                    </div>
                    <div>
                      <span className="font-medium">Affected Systems:</span>
                      <div className="text-gray-600">{incident.affectedSystems.join(", ")}</div>
                    </div>
                    <div>
                      <span className="font-medium">Discovered:</span>
                      <div className="text-gray-600">{formatRelativeTime(incident.discoveredAt)}</div>
                    </div>
                    <div>
                      <span className="font-medium">Impact:</span>
                      <div className="text-gray-600">{incident.impactAssessment.businessImpact}</div>
                    </div>
                  </div>

                  {incident.rootCause && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium mb-2">Root Cause Analysis:</h4>
                      <p className="text-sm text-yellow-800">{incident.rootCause}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-gray-600">
                      {incident.affectedTenants.length} tenants affected
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                      {incident.status === "open" && (
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-1" />
                          Assign
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Compliance Score
                </CardTitle>
                <CardDescription>Overall security compliance status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className={`text-6xl font-bold ${getSecurityLevelColor(compliance?.level || 'fair')}`}>
                    {compliance?.score || 0}%
                  </div>
                  <p className="text-lg font-medium mt-2">{compliance?.level?.toUpperCase() || 'FAIR'}</p>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Last Audit:</span>
                    <span className="text-sm text-gray-600">
                      {compliance?.lastAudit ? formatRelativeTime(compliance.lastAudit) : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Violations:</span>
                    <span className="text-sm text-red-600 font-medium">
                      {compliance?.violations || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compliance Areas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Compliance Areas
                </CardTitle>
                <CardDescription>Detailed compliance by category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {(compliance?.areas ?? []).map((item: any) => (
                    <div key={item.area} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.area}</div>
                        <div className="text-sm text-gray-600">
                          {item.violations?.length ? item.violations[0] : "Compliance status"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          item.status === 'compliant' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {item.score ?? "N/A"}{item.score !== null ? "%" : ""}
                        </div>
                        <Badge className={
                          item.status === 'compliant' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }>
                          {String(item.status).replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="access" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Access Logs
                </CardTitle>
                <CardDescription>System access and authentication events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {accessLogs?.slice(0, 20).map((log: any, index: number) => (
                    <div key={index} className="flex items-center justify-between border-b p-3">
                      <div className="flex flex-1 items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${log.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <div className="font-medium">{log.action}</div>
                          <div className="text-sm text-gray-600">
                            {log.user} • {log.ip} • {formatRelativeTime(log.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {log.success ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Vulnerability Scan
                </CardTitle>
                <CardDescription>Latest recorded vulnerability scan results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Status:</span>
                    <div className="text-gray-600">{vulnerabilityScan?.status ?? "not started"}</div>
                  </div>
                  <div>
                    <span className="font-medium">Last Completed:</span>
                    <div className="text-gray-600">
                      {vulnerabilityScan?.completedAt ? formatRelativeTime(vulnerabilityScan.completedAt) : "Never"}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Vulnerabilities Found:</span>
                    <div className="text-gray-600">{vulnerabilityScan?.vulnerabilitiesFound ?? 0}</div>
                  </div>
                  <div>
                    <span className="font-medium">High Risk:</span>
                    <div className="text-red-600 font-medium">{vulnerabilityScan?.highRiskVulnerabilities ?? 0}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {(vulnerabilityScan?.vulnerabilities ?? []).slice(0, 5).map((vulnerability: any) => (
                    <div key={vulnerability._id ?? vulnerability.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{vulnerability.title}</p>
                          <p className="text-sm text-muted-foreground">{vulnerability.affectedSystem}</p>
                        </div>
                        <Badge className={getSeverityColor(vulnerability.severity)}>{vulnerability.severity}</Badge>
                      </div>
                    </div>
                  ))}
                  {(!vulnerabilityScan?.vulnerabilities || vulnerabilityScan.vulnerabilities.length === 0) && (
                    <p className="text-sm text-muted-foreground">No vulnerability findings are stored yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
