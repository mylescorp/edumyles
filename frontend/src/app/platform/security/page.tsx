"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  FileText,
  Settings,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Lock,
  Key,
  Database,
  Wifi,
  Globe,
  Bug,
  UserX,
  AlertCircle,
  Info,
  Zap,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";

interface SecurityIncident {
  _id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  status: "open" | "investigating" | "contained" | "resolved" | "closed";
  affectedSystems: string[];
  affectedTenants: string[];
  discoveredAt: number;
  reportedAt: number;
  reportedBy: string;
  assignee?: string;
  tags: string[];
  timeline: Array<{
    timestamp: number;
    action: string;
    description: string;
    user: string;
  }>;
  mitigations: Array<{
    id: string;
    description: string;
    effectiveness: string;
    implementedAt: number;
    implementedBy: string;
    verified: boolean;
  }>;
  rootCause?: string;
  impactAssessment?: any;
  resolvedAt?: number;
}

interface SecurityPolicy {
  _id: string;
  name: string;
  description: string;
  category: string;
  severity: string;
  content: string;
  enforcementType: string;
  applicableRoles: string[];
  status: string;
  version: number;
  reviewFrequency: string;
  lastReviewed: number;
  nextReview: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  compliance: Array<{
    tenantId: string;
    status: string;
    notes: string;
    evidence: string[];
    reviewedAt: number;
    reviewedBy: string;
  }>;
}

export default function SecurityOperationsPage() {
  const { sessionToken } = useAuth();
  const [activeTab, setActiveTab] = useState("incidents");
  const [selectedSeverity, setSelectedSeverity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isCreateIncidentOpen, setIsCreateIncidentOpen] = useState(false);
  const [isCreatePolicyOpen, setIsCreatePolicyOpen] = useState(false);

  // Mock data - replace with actual queries
  const securityIncidents: SecurityIncident[] = [
    {
      _id: "incident_1",
      title: "Suspicious Login Activity Detected",
      description: "Multiple failed login attempts from unusual IP addresses detected for several tenant accounts",
      severity: "high",
      category: "unauthorized_access",
      status: "investigating",
      affectedSystems: ["authentication", "user_management"],
      affectedTenants: ["tenant_1", "tenant_2", "tenant_3"],
      discoveredAt: Date.now() - 2 * 60 * 60 * 1000,
      reportedAt: Date.now() - 2 * 60 * 60 * 1000,
      reportedBy: "security_monitor@edumyles.com",
      assignee: "security_team@edumyles.com",
      tags: ["brute_force", "ip_anomaly", "automated_detection"],
      timeline: [
        {
          timestamp: Date.now() - 2 * 60 * 60 * 1000,
          action: "incident_detected",
          description: "Automated security monitoring detected unusual login patterns",
          user: "security_monitor@edumyles.com",
        },
        {
          timestamp: Date.now() - 1.8 * 60 * 60 * 1000,
          action: "incident_created",
          description: "Security incident created and assigned to investigation team",
          user: "security_monitor@edumyles.com",
        },
        {
          timestamp: Date.now() - 1 * 60 * 60 * 1000,
          action: "investigation_started",
          description: "Security team began investigation of the incident",
          user: "security_team@edumyles.com",
        },
      ],
      mitigations: [
        {
          id: "mitigation_1",
          description: "IP blocking implemented for suspicious addresses",
          effectiveness: "high",
          implementedAt: Date.now() - 1.5 * 60 * 60 * 1000,
          implementedBy: "security_team@edumyles.com",
          verified: true,
        },
        {
          id: "mitigation_2",
          description: "Temporary account lockout for affected users",
          effectiveness: "medium",
          implementedAt: Date.now() - 1.2 * 60 * 60 * 1000,
          implementedBy: "security_team@edumyles.com",
          verified: true,
        },
      ],
      rootCause: "Potential brute force attack attempt from botnet",
      impactAssessment: {
        affectedUsers: 15,
        dataExposed: false,
        systemIntegrity: "maintained",
        businessImpact: "low",
      },
    },
    {
      _id: "incident_2",
      title: "Data Access Anomaly in Billing Module",
      description: "Unusual data access patterns detected in billing module, potential data exfiltration attempt",
      severity: "critical",
      category: "data_breach",
      status: "contained",
      affectedSystems: ["billing", "database"],
      affectedTenants: ["tenant_4"],
      discoveredAt: Date.now() - 6 * 60 * 60 * 1000,
      reportedAt: Date.now() - 5.5 * 60 * 60 * 1000,
      reportedBy: "billing_admin@edumyles.com",
      assignee: "incident_response@edumyles.com",
      tags: ["data_access", "billing", "potential_breach"],
      timeline: [
        {
          timestamp: Date.now() - 6 * 60 * 60 * 1000,
          action: "anomaly_detected",
          description: "Unusual data access patterns detected by automated monitoring",
          user: "security_monitor@edumyles.com",
        },
        {
          timestamp: Date.now() - 5.5 * 60 * 60 * 1000,
          action: "incident_created",
          description: "Security incident created and escalated to critical",
          user: "billing_admin@edumyles.com",
        },
        {
          timestamp: Date.now() - 4 * 60 * 60 * 1000,
          action: "containment_initiated",
          description: "Immediate containment measures implemented",
          user: "incident_response@edumyles.com",
        },
      ],
      mitigations: [
        {
          id: "mitigation_3",
          description: "Access revoked for suspicious user accounts",
          effectiveness: "high",
          implementedAt: Date.now() - 4.5 * 60 * 60 * 1000,
          implementedBy: "incident_response@edumyles.com",
          verified: true,
        },
        {
          id: "mitigation_4",
          description: "Database access logs secured and backed up",
          effectiveness: "high",
          implementedAt: Date.now() - 4 * 60 * 60 * 1000,
          implementedBy: "security_team@edumyles.com",
          verified: true,
        },
      ],
      rootCause: "Compromised user credentials leading to unauthorized data access",
      impactAssessment: {
        affectedUsers: 1,
        dataExposed: "investigating",
        systemIntegrity: "maintained",
        businessImpact: "medium",
      },
    },
  ];

  const securityPolicies: SecurityPolicy[] = [
    {
      _id: "policy_1",
      name: "Password Security Policy",
      description: "Comprehensive password security requirements and guidelines for all users",
      category: "access_control",
      severity: "critical",
      content: "All users must create passwords that are at least 12 characters long, contain uppercase and lowercase letters, numbers, and special characters. Passwords must be changed every 90 days.",
      enforcementType: "mandatory",
      applicableRoles: ["all"],
      status: "active",
      version: 2,
      reviewFrequency: "quarterly",
      lastReviewed: Date.now() - 30 * 24 * 60 * 60 * 1000,
      nextReview: Date.now() + 60 * 24 * 60 * 60 * 1000,
      createdBy: "security_admin@edumyles.com",
      createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      compliance: [
        { tenantId: "tenant_1", status: "compliant", notes: "All users compliant with password policy", reviewedAt: Date.now() - 7 * 24 * 60 * 60 * 1000, reviewedBy: "admin@tenant1.com" },
        { tenantId: "tenant_2", status: "partially_compliant", notes: "Some users still using old passwords", reviewedAt: Date.now() - 5 * 24 * 60 * 60 * 1000, reviewedBy: "admin@tenant2.com" },
        { tenantId: "tenant_3", status: "compliant", notes: "Full compliance achieved", reviewedAt: Date.now() - 3 * 24 * 60 * 60 * 1000, reviewedBy: "admin@tenant3.com" },
      ],
    },
    {
      _id: "policy_2",
      name: "Data Protection and Privacy Policy",
      description: "Guidelines for handling sensitive student and staff data in compliance with data protection regulations",
      category: "data_protection",
      severity: "critical",
      content: "All sensitive data must be encrypted at rest and in transit. Data access must be logged and audited regularly. Personal data retention policies must be followed.",
      enforcementType: "mandatory",
      applicableRoles: ["admin", "teacher", "staff"],
      status: "active",
      version: 1,
      reviewFrequency: "annually",
      lastReviewed: Date.now() - 15 * 24 * 60 * 60 * 1000,
      nextReview: Date.now() + 350 * 24 * 60 * 60 * 1000,
      createdBy: "compliance_officer@edumyles.com",
      createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
      compliance: [
        { tenantId: "tenant_1", status: "compliant", notes: "All data protection measures in place", reviewedAt: Date.now() - 10 * 24 * 60 * 60 * 1000, reviewedBy: "admin@tenant1.com" },
        { tenantId: "tenant_2", status: "non_compliant", notes: "Some data not properly encrypted", reviewedAt: Date.now() - 8 * 24 * 60 * 60 * 1000, reviewedBy: "admin@tenant2.com" },
      ],
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-700 border-red-200";
      case "high": return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-red-100 text-red-700 border-red-200";
      case "investigating": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "contained": return "bg-blue-100 text-blue-700 border-blue-200";
      case "resolved": return "bg-green-100 text-green-700 border-green-200";
      case "closed": return "bg-gray-100 text-gray-700 border-gray-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "unauthorized_access": return <UserX className="h-4 w-4" />;
      case "data_breach": return <Database className="h-4 w-4" />;
      case "malware": return <Bug className="h-4 w-4" />;
      case "phishing": return <Globe className="h-4 w-4" />;
      case "denial_of_service": return <Wifi className="h-4 w-4" />;
      case "vulnerability": return <AlertTriangle className="h-4 w-4" />;
      case "policy_violation": return <Shield className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return "Just now";
  };

  const IncidentsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search incidents..."
              className="pl-10 w-80"
            />
          </div>
          <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              <SelectItem value="unauthorized_access">Unauthorized Access</SelectItem>
              <SelectItem value="data_breach">Data Breach</SelectItem>
              <SelectItem value="malware">Malware</SelectItem>
              <SelectItem value="phishing">Phishing</SelectItem>
              <SelectItem value="denial_of_service">Denial of Service</SelectItem>
              <SelectItem value="vulnerability">Vulnerability</SelectItem>
              <SelectItem value="policy_violation">Policy Violation</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isCreateIncidentOpen} onOpenChange={setIsCreateIncidentOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Security Incident</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="incident-title">Incident Title</Label>
                  <Input id="incident-title" placeholder="Enter incident title" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="incident-description">Description</Label>
                  <Textarea id="incident-description" placeholder="Describe the incident in detail" rows={4} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Severity</Label>
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
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unauthorized_access">Unauthorized Access</SelectItem>
                        <SelectItem value="data_breach">Data Breach</SelectItem>
                        <SelectItem value="malware">Malware</SelectItem>
                        <SelectItem value="phishing">Phishing</SelectItem>
                        <SelectItem value="denial_of_service">Denial of Service</SelectItem>
                        <SelectItem value="vulnerability">Vulnerability</SelectItem>
                        <SelectItem value="policy_violation">Policy Violation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Affected Systems</Label>
                  <Input placeholder="Enter affected systems (comma separated)" />
                </div>
                <div className="grid gap-2">
                  <Label>Assign To</Label>
                  <Input placeholder="Enter assignee email" />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateIncidentOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsCreateIncidentOpen(false)}>
                  Create Incident
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Security Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+3 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">3</div>
            <p className="text-xs text-muted-foreground">2 critical, 1 high</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2h</div>
            <p className="text-xs text-muted-foreground">-30min from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MTTR</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2h</div>
            <p className="text-xs text-muted-foreground">Within SLA</p>
          </CardContent>
        </Card>
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {securityIncidents.map((incident) => (
          <Card key={incident._id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Badge className={getSeverityColor(incident.severity)}>
                      {incident.severity.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(incident.status)}>
                      {incident.status.replace("_", " ").toUpperCase()}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      {getCategoryIcon(incident.category)}
                      <span className="text-sm text-muted-foreground capitalize">{incident.category.replace("_", " ")}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg">{incident.title}</h3>
                    <p className="text-muted-foreground mt-1">{incident.description}</p>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <span>Discovered {formatRelativeTime(incident.discoveredAt)}</span>
                    <span>Reported by {incident.reportedBy}</span>
                    {incident.assignee && <span>Assigned to {incident.assignee}</span>}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {incident.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  {incident.affectedSystems.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Affected Systems:</div>
                      <div className="flex flex-wrap gap-2">
                        {incident.affectedSystems.map((system) => (
                          <Badge key={system} variant="secondary" className="text-xs">
                            {system}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {incident.mitigations.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Mitigations Applied:</div>
                      <div className="space-y-1">
                        {incident.mitigations.map((mitigation) => (
                          <div key={mitigation.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                            <span>{mitigation.description}</span>
                            <Badge variant={mitigation.verified ? "default" : "secondary"} className="text-xs">
                              {mitigation.verified ? "Verified" : "Pending"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const PoliciesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search policies..."
              className="pl-10 w-80"
            />
          </div>
          <Select>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              <SelectItem value="access_control">Access Control</SelectItem>
              <SelectItem value="data_protection">Data Protection</SelectItem>
              <SelectItem value="incident_response">Incident Response</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isCreatePolicyOpen} onOpenChange={setIsCreatePolicyOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Policy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Security Policy</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="policy-name">Policy Name</Label>
                  <Input id="policy-name" placeholder="Enter policy name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="policy-description">Description</Label>
                  <Textarea id="policy-description" placeholder="Describe the policy" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="access_control">Access Control</SelectItem>
                        <SelectItem value="data_protection">Data Protection</SelectItem>
                        <SelectItem value="incident_response">Incident Response</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Severity</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="informational">Informational</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Policy Content</Label>
                  <Textarea placeholder="Enter the full policy content" rows={6} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Enforcement Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select enforcement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="advisory">Advisory</SelectItem>
                        <SelectItem value="mandatory">Mandatory</SelectItem>
                        <SelectItem value="automated">Automated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Review Frequency</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreatePolicyOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsCreatePolicyOpen(false)}>
                  Create Policy
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Policies List */}
      <div className="space-y-4">
        {securityPolicies.map((policy) => (
          <Card key={policy._id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Badge className={getSeverityColor(policy.severity)}>
                      {policy.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="secondary">{policy.category.replace("_", " ").toUpperCase()}</Badge>
                    <Badge variant="outline">v{policy.version}</Badge>
                    <Badge variant={policy.status === "active" ? "default" : "secondary"}>
                      {policy.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg">{policy.name}</h3>
                    <p className="text-muted-foreground mt-1">{policy.description}</p>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <span>Created by {policy.createdBy}</span>
                    <span>Last reviewed {formatRelativeTime(policy.lastReviewed)}</span>
                    <span>Next review {formatRelativeTime(policy.nextReview)}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm font-medium mb-2">Compliance Overview</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Compliant</span>
                          <span className="text-green-600">{policy.compliance.filter(c => c.status === "compliant").length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Partially Compliant</span>
                          <span className="text-yellow-600">{policy.compliance.filter(c => c.status === "partially_compliant").length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Non-Compliant</span>
                          <span className="text-red-600">{policy.compliance.filter(c => c.status === "non_compliant").length}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm font-medium mb-2">Enforcement</div>
                      <div className="text-sm">{policy.enforcementType}</div>
                      <div className="text-xs text-muted-foreground mt-1">Applies to {policy.applicableRoles.length} roles</div>
                    </div>
                    
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm font-medium mb-2">Review Schedule</div>
                      <div className="text-sm capitalize">{policy.reviewFrequency}</div>
                      <div className="text-xs text-muted-foreground mt-1">Next: {formatRelativeTime(policy.nextReview)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const ThreatIntelligenceTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Threat Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="malware">Malware</SelectItem>
              <SelectItem value="phishing">Phishing</SelectItem>
              <SelectItem value="vulnerability">Vulnerability</SelectItem>
              <SelectItem value="social_engineering">Social Engineering</SelectItem>
              <SelectItem value="insider_threat">Insider Threat</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Threat Intel
        </Button>
      </div>

      {/* Threat Intelligence Cards */}
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-orange-600" />
                <span>Education Sector Phishing Campaign</span>
              </CardTitle>
              <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                HIGH
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Targeted phishing campaign against educational institutions in East Africa
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium">Threat Type</div>
                <div>Phishing</div>
              </div>
              <div>
                <div className="font-medium">Confidence</div>
                <div className="text-orange-600">85%</div>
              </div>
              <div>
                <div className="font-medium">First Seen</div>
                <div>7 days ago</div>
              </div>
              <div>
                <div className="font-medium">Last Seen</div>
                <div>2 days ago</div>
              </div>
            </div>
            
            <div>
              <div className="font-medium mb-2">Indicators</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <span>Domain: edumyles-support.com</span>
                  <Badge variant="outline" className="text-xs">90% confidence</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <span>IP: 192.168.1.100</span>
                  <Badge variant="outline" className="text-xs">70% confidence</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <span>URL: /login/verify-account</span>
                  <Badge variant="outline" className="text-xs">80% confidence</Badge>
                </div>
              </div>
            </div>
            
            <div>
              <div className="font-medium mb-2">Mitigations Applied</div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Email filtering updated</Badge>
                <Badge variant="secondary">User training conducted</Badge>
                <Badge variant="secondary">Domain blocklisted</Badge>
              </div>
            </div>
            
            <div>
              <div className="font-medium mb-2">Recommendations</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Implement advanced email filtering</li>
                <li>• Conduct user awareness training</li>
                <li>• Monitor for suspicious login attempts</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Bug className="h-5 w-5 text-red-600" />
                <span>Student Management System Vulnerability</span>
              </CardTitle>
              <Badge className="bg-red-100 text-red-700 border-red-200">
                CRITICAL
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Critical vulnerability discovered in student data management module
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium">Threat Type</div>
                <div>Vulnerability</div>
              </div>
              <div>
                <div className="font-medium">Confidence</div>
                <div className="text-red-600">95%</div>
              </div>
              <div>
                <div className="font-medium">First Seen</div>
                <div>3 days ago</div>
              </div>
              <div>
                <div className="font-medium">Last Seen</div>
                <div>1 day ago</div>
              </div>
            </div>
            
            <div>
              <div className="font-medium mb-2">Indicators</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <span>CVE: CVE-2024-1234</span>
                  <Badge variant="outline" className="text-xs">100% confidence</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <span>Module: student_management</span>
                  <Badge variant="outline" className="text-xs">90% confidence</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <span>Version: 2.1.0</span>
                  <Badge variant="outline" className="text-xs">80% confidence</Badge>
                </div>
              </div>
            </div>
            
            <div>
              <div className="font-medium mb-2">Mitigations Applied</div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Security patch deployed</Badge>
                <Badge variant="secondary">Access restrictions applied</Badge>
                <Badge variant="secondary">Enhanced monitoring</Badge>
              </div>
            </div>
            
            <div>
              <div className="font-medium mb-2">Recommendations</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Apply security patches immediately</li>
                <li>• Implement additional access controls</li>
                <li>• Conduct security audit of related modules</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Security Operations Center" 
        description="Comprehensive security incident management, policy enforcement, and threat intelligence"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Security Operations", href: "/platform/security" }
        ]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="threat-intel">Threat Intelligence</TabsTrigger>
        </TabsList>
        
        <TabsContent value="incidents">
          <IncidentsTab />
        </TabsContent>
        
        <TabsContent value="policies">
          <PoliciesTab />
        </TabsContent>
        
        <TabsContent value="threat-intel">
          <ThreatIntelligenceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
