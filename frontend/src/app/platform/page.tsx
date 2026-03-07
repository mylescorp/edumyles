"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  Building2,
  Users,
  Activity,
  AlertTriangle,
  Clock,
  DollarSign,
  Shield,
  UserCheck,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  BarChart3,
  Globe,
  Eye,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/formatters";
import Link from "next/link";

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

  const mockStats = {
    totalTenants: 12,
    activeTenants: 8,
    suspendedTenants: 4,
    totalUsers: 2847,
    activeUsers: 2234,
    newUsersThisMonth: 127,
    systemHealth: "99.9%",
    monthlyRevenue: "$124,580",
    securityEvents: "23",
  };

  const mockActivity = [
    {
      id: "1",
      action: "tenant.created",
      description: "New tenant registered: Nairobi Academy",
      createdAt: Date.now() - 3600000,
      user: "system@edumyles.com",
      tenantName: "Nairobi Academy",
    },
    {
      id: "2",
      action: "tenant.suspended",
      description: "Suspended tenant: Mombasa High School",
      createdAt: Date.now() - 7200000,
      user: "system@edumyles.com",
      tenantName: "Mombasa High School",
    },
    {
      id: "3",
      action: "settings.updated",
      description: "Monthly payment processed: KES 45,000",
      createdAt: Date.now() - 1800000,
      user: "system@edumyles.com",
      tenantName: "Nairobi Academy",
    },
    {
      id: "4",
      action: "user.created",
      description: "New admin user registered for Kisumu Academy",
      createdAt: Date.now() - 900000,
      user: "system@edumyles.com",
      tenantName: "Kisumu Academy",
    },
    {
      id: "5",
      action: "module.installed",
      description: "Finance module activated for Nakuru Boys",
      createdAt: Date.now() - 5400000,
      user: "admin@nakuruboys.edu",
      tenantName: "Nakuru Boys",
    },
  ];

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Admin Dashboard"
        description="Complete overview of the EduMyles platform ecosystem"
        breadcrumbs={[{ label: "Dashboard", href: "/platform" }]}
      />

      {/* Time Range Selector & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                style={
                  timeRange === range
                    ? { backgroundColor: "#056C40", borderColor: "#056C40" }
                    : {}
                }
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
              </Button>
            ))}
          </div>
        </div>

        <Button className="bg-[#056C40] hover:bg-[#023c24] w-full sm:w-auto">
          <FileText className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 ease-out border-l-4 border-l-blue-500 hover:border-l-blue-600 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Total Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold text-blue-600">
                {mockStats.totalTenants}
              </span>
              <div className="flex items-center text-green-500">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">+2</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="font-semibold text-green-600">{mockStats.activeTenants}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Suspended</p>
                <p className="font-semibold text-red-500">{mockStats.suspendedTenants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 ease-out border-l-4 border-l-green-500 hover:border-l-green-600 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold text-green-600">
                {mockStats.totalUsers.toLocaleString()}
              </span>
              <div className="flex items-center text-blue-500">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">+127</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="font-semibold">{mockStats.activeUsers.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">New This Month</p>
                <p className="font-semibold text-blue-500">{mockStats.newUsersThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 ease-out border-l-4 border-l-amber-500 hover:border-l-amber-600 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-600" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold text-amber-600">
                {mockStats.systemHealth}
              </span>
              <div className="flex items-center text-red-500">
                <ArrowDownRight className="h-4 w-4" />
                <span className="text-sm font-medium">-0.1%</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Uptime</p>
                <p className="font-semibold">99.8%</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Response</p>
                <p className="font-semibold">142ms</p>
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
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold text-purple-600">
                {mockStats.monthlyRevenue}
              </span>
              <div className="flex items-center text-green-500">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">+12%</span>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-xs text-muted-foreground">Target: $150,000</span>
                <span className="text-xs font-medium">75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: "75%" }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Security Events
            </CardTitle>
            <Shield className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.securityEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Modules
            </CardTitle>
            <ShoppingCart className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">11</div>
            <p className="text-xs text-muted-foreground mt-1">Across all tenants</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500 hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion Rate
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
            <p className="text-xs text-muted-foreground mt-1">Trial to paid</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid: Activity + Quick Actions + System Status */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
                <Badge variant="secondary" className="text-xs">
                  Live
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mockActivity.length > 0 ? (
                <div className="space-y-3">
                  {mockActivity.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors duration-200 group cursor-pointer"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${getActivityColor(item.action)}`}
                        >
                          {getActivityIcon(item.action)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <ActionLabel action={item.action} />
                          <span className="text-xs text-muted-foreground font-mono">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {item.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.tenantName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                  <p className="text-sm mt-2">No recent activity logged yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Quick Actions + System Status */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/platform/users">
                <Button
                  className="w-full justify-start hover:bg-primary hover:text-primary-foreground hover:shadow-md transition-all duration-200 group"
                  variant="outline"
                >
                  <UserCheck className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  <span className="group-hover:translate-x-1 transition-transform">
                    View All Users
                  </span>
                </Button>
              </Link>
              <Link href="/platform/tenants">
                <Button
                  className="w-full justify-start hover:bg-primary hover:text-primary-foreground hover:shadow-md transition-all duration-200 group"
                  variant="outline"
                >
                  <Building2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  <span className="group-hover:translate-x-1 transition-transform">
                    Manage Tenants
                  </span>
                </Button>
              </Link>
              <Link href="/platform/audit">
                <Button
                  className="w-full justify-start hover:bg-primary hover:text-primary-foreground hover:shadow-md transition-all duration-200 group"
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  <span className="group-hover:translate-x-1 transition-transform">
                    System Logs
                  </span>
                </Button>
              </Link>
              <Link href="/platform/analytics">
                <Button
                  className="w-full justify-start hover:bg-primary hover:text-primary-foreground hover:shadow-md transition-all duration-200 group"
                  variant="outline"
                >
                  <BarChart3 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  <span className="group-hover:translate-x-1 transition-transform">
                    Analytics
                  </span>
                </Button>
              </Link>
              <Link href="/platform/impersonation">
                <Button
                  className="w-full justify-start hover:bg-primary hover:text-primary-foreground hover:shadow-md transition-all duration-200 group"
                  variant="outline"
                >
                  <Eye className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  <span className="group-hover:translate-x-1 transition-transform">
                    Impersonation
                  </span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Service</span>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
