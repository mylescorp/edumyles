"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "convex/react";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { formatRelativeTime } from "@/lib/utils";
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Eye, 
  Lock, 
  Unlock, 
  TrendingUp, 
  TrendingDown,
  Users,
  Globe,
  Database,
  Wifi,
  Server,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Target,
  Zap,
  BarChart3,
  LineChart,
  PieChart,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Camera,
  Fingerprint,
  Key,
  ShieldCheck,
  Ban,
  UserCheck,
  Mail,
  Phone
} from "lucide-react";

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
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h");
  const [selectedCategory, setSelectedCategory] = useState("all");

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
    { sessionToken: sessionToken || "", status: "active", limit: 50 },
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
      case "mitigating": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
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
    try {
      await acknowledgeThreatMutation({
        sessionToken,
        threatId,
        notes: "Acknowledged by security team",
      });
    } catch (error: any) {
      console.error("Failed to acknowledge threat:", error);
    }
  };

  // Handle threat mitigation
  const handleMitigateThreat = async (threatId: string, mitigation: string) => {
    try {
      await mitigateThreatMutation({
        sessionToken,
        threatId,
        mitigation,
      });
    } catch (error: any) {
      console.error("Failed to mitigate threat:", error);
    }
  };

  // Handle IP blocking
  const handleBlockIP = async (ip: string) => {
    try {
      await blockIPMutation({
        sessionToken,
        ip,
        reason: "Suspicious activity detected",
        duration: 24 * 60 * 60 * 1000, // 24 hours
      });
    } catch (error: any) {
      console.error("Failed to block IP:", error);
    }
  };

  if (!sessionToken) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Security Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time threat detection and security monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
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
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

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
                <CardDescription>Automated threat detection and analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Malware Detected:</span>
                      <div className="text-lg font-bold text-red-600">3</div>
                    </div>
                    <div>
                      <span className="font-medium">Phishing Attempts:</span>
                      <div className="text-lg font-bold text-orange-600">12</div>
                    </div>
                    <div>
                      <span className="font-medium">Brute Force:</span>
                      <div className="text-lg font-bold text-yellow-600">8</div>
                    </div>
                    <div>
                      <span className="font-medium">DDoS Attacks:</span>
                      <div className="text-lg font-bold text-purple-600">2</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="font-medium text-red-800">High-Risk Threat Detected</span>
                    </div>
                    <p className="text-sm text-red-700 mt-2">
                      Suspicious login patterns detected from multiple IP addresses indicating potential brute force attack
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="threats" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
                          <Button variant="outline" size="sm" onClick={() => handleAcknowledgeThreat(threat._id)}>
                            <Eye className="w-4 h-4 mr-1" />
                            Acknowledge
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleMitigateThreat(threat._id, "block_ip")}>
                            <Ban className="w-4 h-4 mr-1" />
                            Block IP
                          </Button>
                        </>
                      )}
                      {(threat.status as string) === "mitigating" && (
                        <Button variant="outline" size="sm" onClick={() => handleMitigateThreat(threat._id, "resolve")}>
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
                  {[
                    { area: "Access Control", score: 95, status: "compliant" },
                    { area: "Data Protection", score: 88, status: "needs_improvement" },
                    { area: "Network Security", score: 92, status: "compliant" },
                    { area: "Incident Response", score: 78, status: "needs_improvement" },
                    { area: "Audit Logging", score: 98, status: "compliant" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.area}</div>
                        <div className="text-sm text-gray-600">Compliance status</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          item.status === 'compliant' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {item.score}%
                        </div>
                        <Badge className={
                          item.status === 'compliant' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }>
                          {item.status.replace('_', ' ')}
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
                  <div key={index} className="flex items-center justify-between p-3 border-b">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-2 h-2 rounded-full ${
                        log.success ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
