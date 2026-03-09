"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Users, 
  Shield, 
  AlertTriangle, 
  TrendingUp,
  Activity,
  Download,
  Calendar,
  Filter,
  Eye,
  Search
} from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/formatters";
import { useState } from "react";

interface ActivityData {
  date: string;
  totalActions: number;
  criticalActions: number;
  userActions: number;
  systemActions: number;
}

interface UserActivity {
  userId: string;
  userName: string;
  userRole: string;
  totalActions: number;
  lastActivity: string;
  riskLevel: "low" | "medium" | "high";
}

interface CriticalEvent {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  entity: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
}

export default function AuditReportsPage() {
  const { isLoading } = useAuth();
  const [reportPeriod, setReportPeriod] = useState("week");
  const [reportType, setReportType] = useState("overview");

  if (isLoading) return <LoadingSkeleton variant="page" />;

  // Mock data for demonstration
  const activityData: ActivityData[] = [
    { date: "2024-03-08", totalActions: 245, criticalActions: 12, userActions: 198, systemActions: 47 },
    { date: "2024-03-07", totalActions: 189, criticalActions: 8, userActions: 156, systemActions: 33 },
    { date: "2024-03-06", totalActions: 267, criticalActions: 15, userActions: 210, systemActions: 57 },
    { date: "2024-03-05", totalActions: 198, criticalActions: 6, userActions: 167, systemActions: 31 },
    { date: "2024-03-04", totalActions: 234, criticalActions: 11, userActions: 189, systemActions: 45 },
    { date: "2024-03-03", totalActions: 156, criticalActions: 4, userActions: 134, systemActions: 22 },
    { date: "2024-03-02", totalActions: 178, criticalActions: 7, userActions: 145, systemActions: 33 },
  ];

  const userActivity: UserActivity[] = [
    {
      userId: "user1",
      userName: "Alice Johnson",
      userRole: "Admin",
      totalActions: 89,
      lastActivity: "2 hours ago",
      riskLevel: "low",
    },
    {
      userId: "user2",
      userName: "Bob Wilson",
      userRole: "Teacher",
      totalActions: 45,
      lastActivity: "1 day ago",
      riskLevel: "medium",
    },
    {
      userId: "user3",
      userName: "Mary Wanjiku",
      userRole: "Staff",
      totalActions: 67,
      lastActivity: "3 hours ago",
      riskLevel: "low",
    },
    {
      userId: "user4",
      userName: "James Otieno",
      userRole: "Student",
      totalActions: 23,
      lastActivity: "2 days ago",
      riskLevel: "high",
    },
  ];

  const criticalEvents: CriticalEvent[] = [
    {
      id: "event1",
      timestamp: "2024-03-08T10:30:00Z",
      action: "DELETED",
      user: "Alice Johnson",
      entity: "Student Record",
      severity: "critical",
      description: "Deleted student record for John Smith",
    },
    {
      id: "event2",
      timestamp: "2024-03-08T09:15:00Z",
      action: "PERMISSION_CHANGE",
      user: "Bob Wilson",
      entity: "User Role",
      severity: "high",
      description: "Changed user role from Student to Admin",
    },
    {
      id: "event3",
      timestamp: "2024-03-08T08:45:00Z",
      action: "SYSTEM_CONFIG",
      user: "System",
      entity: "Security Settings",
      severity: "high",
      description: "Modified security configuration settings",
    },
    {
      id: "event4",
      timestamp: "2024-03-07T16:20:00Z",
      action: "DATA_EXPORT",
      user: "Mary Wanjiku",
      entity: "Student Database",
      severity: "medium",
      description: "Exported complete student database",
    },
  ];

  const stats = {
    totalActions: activityData.reduce((sum, day) => sum + day.totalActions, 0),
    criticalActions: activityData.reduce((sum, day) => sum + day.criticalActions, 0),
    activeUsers: userActivity.length,
    riskEvents: criticalEvents.filter(e => e.severity === "critical" || e.severity === "high").length,
    averageDaily: Math.round(activityData.reduce((sum, day) => sum + day.totalActions, 0) / activityData.length),
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "default";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Reports"
        description="Comprehensive audit trail analysis and security reports"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
            <Button className="gap-2">
              <FileText className="h-4 w-4" />
              Generate PDF
            </Button>
          </div>
        }
      />

      {/* Report Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Report Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Report Period</label>
              <Select value={reportPeriod} onValueChange={setReportPeriod}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Last 24 Hours</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">System Overview</SelectItem>
                  <SelectItem value="security">Security Analysis</SelectItem>
                  <SelectItem value="users">User Activity</SelectItem>
                  <SelectItem value="compliance">Compliance Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="Total Actions"
          value={stats.totalActions.toLocaleString()}
          description="All logged activities"
          icon={Activity}
          trend={{ value: 12, isPositive: true }}
        />
        <AdminStatsCard
          title="Critical Actions"
          value={stats.criticalActions}
          description="High-priority events"
          icon={AlertTriangle}
          variant="warning"
        />
        <AdminStatsCard
          title="Active Users"
          value={stats.activeUsers}
          description="Users with activity"
          icon={Users}
          variant="success"
        />
        <AdminStatsCard
          title="Risk Events"
          value={stats.riskEvents}
          description="Security concerns"
          icon={Shield}
          variant={stats.riskEvents > 0 ? "danger" : "default"}
        />
      </div>

      {/* Activity Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Activity Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-7">
              {activityData.map((day, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-muted-foreground mb-2">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </div>
                  <div className="relative">
                    <div className="w-full bg-muted rounded-full h-24">
                      <div 
                        className="bg-primary rounded-full absolute bottom-0"
                        style={{ 
                          height: `${(day.totalActions / Math.max(...activityData.map(d => d.totalActions))) * 100}%`,
                          width: '100%'
                        }}
                      />
                    </div>
                    <div className="mt-2 text-sm font-medium">{day.totalActions}</div>
                    {day.criticalActions > 0 && (
                      <div className="text-xs text-danger mt-1">
                        {day.criticalActions} critical
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Activity Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userActivity.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-success-bg rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{user.userName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {user.userRole}
                      </Badge>
                      <Badge variant={getRiskLevelColor(user.riskLevel)} className="text-xs">
                        {user.riskLevel} risk
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{user.totalActions} actions</p>
                  <p className="text-xs text-muted-foreground">{user.lastActivity}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Critical Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Critical Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {criticalEvents.map((event, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="p-2 bg-muted rounded-full">
                  <AlertTriangle className={`h-4 w-4 ${
                    event.severity === 'critical' ? 'text-danger' : 
                    event.severity === 'high' ? 'text-em-accent-dark' : 'text-em-accent'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{event.action}</h4>
                    <Badge variant={getSeverityColor(event.severity)} className="text-xs">
                      {event.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{event.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>User: {event.user}</span>
                    <span>Entity: {event.entity}</span>
                    <span>{formatDateTime(event.timestamp)}</span>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Compliance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Data Access</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Authorized Access:</span>
                  <span className="text-success">98.5%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Unauthorized Attempts:</span>
                  <span className="text-danger">1.5%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Data Exports:</span>
                  <span className="text-em-accent-dark">12</span>
                </div>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">User Actions</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Normal Activity:</span>
                  <span className="text-success">89.2%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Suspicious Activity:</span>
                  <span className="text-em-accent-dark">8.3%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Policy Violations:</span>
                  <span className="text-danger">2.5%</span>
                </div>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">System Health</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Log Integrity:</span>
                  <span className="text-success">100%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Audit Completeness:</span>
                  <span className="text-success">99.8%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Retention Compliance:</span>
                  <span className="text-success">100%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
