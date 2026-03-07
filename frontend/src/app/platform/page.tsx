"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { 
  Building2, 
  Users, 
  GraduationCap, 
  Activity, 
  AlertTriangle, 
  Clock,
  Settings,
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

function getActivityColor(action: string) {
  const colors: Record<string, string> = {
    "tenant.created": "bg-blue-500",
    "tenant.suspended": "bg-red-500", 
    "user.created": "bg-green-500",
    "user.updated": "bg-yellow-500",
    "user.deleted": "bg-red-500",
    "module.installed": "bg-purple-500",
    "module.uninstalled": "bg-orange-500",
    "settings.updated": "bg-gray-500",
    "impersonation.started": "bg-amber-500",
    "impersonation.ended": "bg-amber-500",
  };
  return colors[action] || "bg-gray-500";
}

function getActivityIcon(action: string) {
  const icons: Record<string, React.ReactNode> = {
    "tenant.created": <Building2 className="h-4 w-4" />,
    "tenant.suspended": <AlertTriangle className="h-4 w-4" />,
    "user.created": <UserCheck className="h-4 w-4" />,
    "user.updated": <Users className="h-4 w-4" />,
    "user.deleted": <Shield className="h-4 w-4" />,
    "module.installed": <Globe className="h-4 w-4" />,
    "module.uninstalled": <FileText className="h-4 w-4" />,
    "settings.updated": <Settings className="h-4 w-4" />,
    "impersonation.started": <Clock className="h-4 w-4" />,
    "impersonation.ended": <Clock className="h-4 w-4" />,
  };
  return icons[action] || <Activity className="h-4 w-4" />;
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
    monthlyRevenue: "$124,580",
    securityEvents: "23"
  };

  const mockActivity = [
    {
      id: "1",
      action: "tenant.created",
      description: "New tenant registered: Nairobi Academy",
      createdAt: Date.now() - 3600000,
      user: "system@edumyles.com",
      tenantName: "Nairobi Academy"
    },
    {
      id: "2", 
      action: "tenant.suspended",
      description: "Suspended tenant: Mombasa High School",
      createdAt: Date.now() - 7200000,
      user: "system@edumyles.com",
      tenantName: "Mombasa High School"
    },
    {
      id: "3",
      action: "settings.updated",
      description: "Monthly payment processed: KES 45,000",
      createdAt: Date.now() - 1800000,
      user: "system@edumyles.com",
      tenantName: "Nairobi Academy"
    },
    {
      id: "4",
      action: "user.created",
      description: "Automated backup completed successfully",
      createdAt: Date.now() - 900000,
      user: "system@edumyles.com",
      tenantName: "Nairobi Academy"
    }
  ];


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
        <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 ease-out border-l-4 border-l-blue-500 hover:border-l-blue-600 hover:scale-[1.02]">
          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              Live
            </div>
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600 animate-pulse" />
              Total Tenants
            </CardTitle>
            <div className="flex items-center space-x-1">
              <span className="text-2xl font-bold text-blue-600">{mockStats.totalTenants}</span>
              <div className="flex items-center text-green-500">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">+2</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{mockStats.activeTenants}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Suspended</p>
                <p className="text-2xl font-bold text-red-500">{mockStats.suspendedTenants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 ease-out border-l-4 border-l-green-500 hover:border-l-green-600 hover:scale-[1.02]">
          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Live
            </div>
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600 animate-pulse" />
              Total Users
            </CardTitle>
            <div className="flex items-center space-x-1">
              <span className="text-2xl font-bold text-green-600">{mockStats.totalUsers.toLocaleString()}</span>
              <div className="flex items-center text-blue-500">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">+127</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{mockStats.activeUsers.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">New This Month</p>
                <p className="text-2xl font-bold text-blue-500">{mockStats.newUsersThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 ease-out border-l-4 border-l-amber-500 hover:border-l-amber-600 hover:scale-[1.02]">
          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
              Alert
            </div>
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-600" />
              System Health
            </CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-amber-600">{mockStats.systemHealth}</span>
              <div className="flex items-center text-red-500">
                <ArrowDownRight className="h-4 w-4" />
                <span className="text-sm font-medium">-0.1%</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold">99.8%</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Response Time</p>
                <p className="text-2xl font-bold">142ms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 ease-out border-l-4 border-l-purple-500 hover:border-l-purple-600 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              Monthly Revenue
            </CardTitle>
            <div className="flex items-center space-x-1">
              <span className="text-2xl font-bold text-purple-600">{mockStats.monthlyRevenue}</span>
              <div className="flex items-center text-green-500">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">+12%</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">This Month</span>
                <span className="text-lg font-bold">{mockStats.monthlyRevenue}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full transition-all duration-500" style={{width: "75%"}}></div>
              </div>
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

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
            <Badge variant="secondary" className="text-xs">Live</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockActivity.map((activity, index) => (
            <div 
              key={activity.id}
              className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors duration-200 group cursor-pointer"
            >
              <div className="flex-shrink-0">
                <div className={`w-2 h-2 rounded-full flex items-center justify-center text-xs font-medium text-white ${getActivityColor(activity.action)}`}>
                  {getActivityIcon(activity.action)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {activity.description}
                </p>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>{activity.user}</span>
                  <span>•</span>
                  <span>{activity.tenantName}</span>
                  <span>•</span>
                  <span className="font-mono">{formatRelativeTime(activity.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            className="w-full justify-start hover:bg-primary hover:text-primary-foreground hover:shadow-md transition-all duration-200 group" 
            variant="outline"
          >
            <UserCheck className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            <span className="group-hover:translate-x-1 transition-transform">View All Users</span>
          </Button>
          <Button 
            className="w-full justify-start hover:bg-primary hover:text-primary-foreground hover:shadow-md transition-all duration-200 group" 
            variant="outline"
          >
            <Building2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            <span className="group-hover:translate-x-1 transition-transform">Manage Tenants</span>
          </Button>
          <Button 
            className="w-full justify-start hover:bg-primary hover:text-primary-foreground hover:shadow-md transition-all duration-200 group" 
            variant="outline"
          >
            <FileText className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            <span className="group-hover:translate-x-1 transition-transform">System Logs</span>
          </Button>
          <Button 
            className="w-full justify-start hover:bg-primary hover:text-primary-foreground hover:shadow-md transition-all duration-200 group" 
            variant="outline"
          >
            <AlertTriangle className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            <span className="group-hover:translate-x-1 transition-transform">Security Center</span>
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
            <Badge className="bg-green-100 text-green-800 animate-pulse">Operational</Badge>
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
            <Badge className="bg-amber-100 text-amber-800 animate-pulse">In Progress</Badge>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
