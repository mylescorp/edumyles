"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  Building2, 
  Users, 
  GraduationCap, 
  Activity, 
  AlertTriangle, 
  Clock,
  DollarSign,
  TrendingUp,
  Globe,
  Shield,
  UserCheck,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/formatters";

function ActionLabel({ action }: { action: string }) {
  const labels: Record<string, { label: string; color: string }> = {
    "tenant.created": { label: "Tenant Created", color: "bg-green-500/10 text-green-700" },
    "tenant.suspended": { label: "Tenant Suspended", color: "bg-red-500/10 text-red-700" },
    "user.created": { label: "User Created", color: "bg-blue-500/10 text-blue-700" },
    "user.updated": { label: "User Updated", color: "bg-yellow-500/10 text-yellow-700" },
    "user.deleted": { label: "User Deactivated", color: "bg-red-500/10 text-red-700" },
    "module.installed": { label: "Module Installed", color: "bg-purple-500/10 text-purple-700" },
    "module.uninstalled": { label: "Module Removed", color: "bg-orange-500/10 text-orange-700" },
    "settings.updated": { label: "Settings Updated", color: "bg-gray-500/10 text-gray-700" },
    "impersonation.started": { label: "Impersonation Started", color: "bg-amber-500/10 text-amber-700" },
    "impersonation.ended": { label: "Impersonation Ended", color: "bg-amber-500/10 text-amber-700" },
  };
  const config = labels[action] ?? { label: action, color: "bg-gray-500/10 text-gray-700" };
  return <Badge variant="secondary" className={config.color}>{config.label}</Badge>;
}

export default function PlatformDashboardPage() {
  const { isLoading } = useAuth();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  // Mock data for demonstration since Convex API doesn't exist yet
  const mockStats = {
    totalTenants: 12,
    activeTenants: 8,
    suspendedTenants: 4,
    totalUsers: 2847,
    activeUsers: 2234,
    newUsersThisMonth: 127,
    systemHealth: "99.9%",
    monthlyRevenue: "$124,580"
  };

  const mockActivity = [
    {
      id: "1",
      type: "user_created",
      description: "New tenant registered: Nairobi Academy",
      timestamp: Date.now() - 3600000,
      user: "system@edumyles.com",
      tenantName: "Nairobi Academy"
    },
    {
      id: "2", 
      type: "user_suspended",
      description: "Suspended tenant: Mombasa High School",
      timestamp: Date.now() - 7200000,
      user: "system@edumyles.com",
      tenantName: "Mombasa High School"
    },
    {
      id: "3",
      type: "payment_processed",
      description: "Monthly payment processed: KES 45,000",
      timestamp: Date.now() - 1800000,
      user: "system@edumyles.com",
      tenantName: "Nairobi Academy"
    },
    {
      id: "4",
      type: "system_backup",
      description: "Automated backup completed successfully",
      timestamp: Date.now() - 900000,
      user: "system@edumyles.com",
      tenantName: "Nairobi Academy"
    }
  ];

  // Enhanced stats with mock data for demonstration
  const enhancedStats = {
    ...stats,
    monthlyRevenue: "$124,580",
    systemHealth: "99.9%",
    activeSessions: "3,247",
    securityEvents: "23"
  };

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Admin Dashboard"
        description="Complete overview of the EduMyles platform ecosystem"
        breadcrumbs={[
          { label: "Dashboard", href: "/platform" }
        ]}
      />

      {/* Time Range Selector & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Time Range:</span>
          <div className="flex space-x-1">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="text-xs"
                style={timeRange === range ? { 
                  backgroundColor: "#056C40", 
                  borderColor: "#056C40" 
                } : {}}
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
              </Button>
            ))}
          </div>
        </div>
        
        <Button className="bg-[#056C40] hover:bg-[#023c24]">
          <FileText className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tenants
            </CardTitle>
            <Building2 className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalTenants}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <span>Active school organizations</span>
              <div className="flex items-center space-x-1">
                <ArrowUpRight className="h-3 w-3 text-green-500" />
                <span className="text-green-500">12.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Users
            </CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.activeUsers}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <span>Across all tenants</span>
              <div className="flex items-center space-x-1">
                <ArrowUpRight className="h-3 w-3 text-green-500" />
                <span className="text-green-500">8.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden hover:shadow-lg transition-shadow border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Revenue
            </CardTitle>
            <DollarSign className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.monthlyRevenue}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <span>From all active tenants</span>
              <div className="flex items-center space-x-1">
                <ArrowUpRight className="h-3 w-3 text-green-500" />
                <span className="text-green-500">15.3%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              System Health
            </CardTitle>
            <Activity className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.systemHealth}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <span>Platform uptime</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Security Events
            </CardTitle>
            <Shield className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.securityEvents}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <span>Last 30 days</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline">
              <UserCheck className="h-4 w-4 mr-2" />
              View All Users
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Building2 className="h-4 w-4 mr-2" />
              Manage Tenants
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              System Logs
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Security Center
            </Button>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Status</span>
              <Badge className="bg-green-100 text-green-800">Operational</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <Badge className="bg-green-100 text-green-800">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">CDN</span>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Backup</span>
              <Badge className="bg-amber-100 text-amber-800">In Progress</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline">
              <UserCheck className="h-4 w-4 mr-2" />
              View All Users
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Building2 className="h-4 w-4 mr-2" />
              Manage Tenants
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              System Logs
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Security Center
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Status</span>
              <Badge className="bg-green-100 text-green-800">Operational</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <Badge className="bg-green-100 text-green-800">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">CDN</span>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Backup</span>
              <Badge className="bg-amber-100 text-amber-800">In Progress</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mockActivity ? (
                mockActivity.length > 0 ? (
                  <div className="space-y-3">
                    {mockActivity.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <ActionLabel action={item.action} />
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(item.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground truncate">
                            {item.tenantName}
                            {item.targetType && item.targetId && (
                              <span> · {item.targetType}: {item.targetId}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity logged yet.</p>
                )
              ) : (
                <p className="text-sm text-muted-foreground">Loading activity...</p>
              )}
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full">
                  View All Activity
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions & System Status */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <UserCheck className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Building2 className="h-4 w-4 mr-2" />
              Tenant Settings
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Security Center
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              System Logs
            </Button>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Status</span>
              <Badge className="bg-green-100 text-green-800">Operational</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <Badge className="bg-green-100 text-green-800">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">CDN</span>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Backup</span>
              <Badge className="bg-amber-100 text-amber-800">In Progress</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Active/Suspended Tenants */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Active Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.activeTenants ?? "--"}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently operational</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Suspended Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.suspendedTenants ?? "--"}</div>
              <p className="text-xs text-muted-foreground mt-1">Require attention</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
