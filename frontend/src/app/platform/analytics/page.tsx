"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Activity,
  Eye,
  MousePointer,
  Clock,
  Server,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  Calendar,
  Filter
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalRevenue: number;
    conversionRate: number;
    avgSessionDuration: number;
    bounceRate: number;
  };
  userMetrics: {
    dailyActive: number;
    weeklyActive: number;
    monthlyActive: number;
    newSignups: number;
    userRetention: number;
    churnRate: number;
  };
  systemMetrics: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    activeConnections: number;
    serverLoad: number;
    databasePerformance: number;
  };
  trafficMetrics: {
    pageViews: number;
    uniqueVisitors: number;
    avgPagesPerSession: number;
    topPages: Array<{ page: string; views: number; percentage: number }>;
    referralSources: Array<{ source: string; visitors: number; percentage: number }>;
  };
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // Mock analytics data
  const mockAnalyticsData: AnalyticsData = {
    overview: {
      totalUsers: 48392,
      activeUsers: 12456,
      totalRevenue: 124580,
      conversionRate: 3.2,
      avgSessionDuration: 847, // seconds
      bounceRate: 32.5
    },
    userMetrics: {
      dailyActive: 3247,
      weeklyActive: 12456,
      monthlyActive: 28934,
      newSignups: 234,
      userRetention: 87.3,
      churnRate: 2.1
    },
    systemMetrics: {
      uptime: 99.9,
      responseTime: 245, // milliseconds
      errorRate: 0.12,
      activeConnections: 1847,
      serverLoad: 67,
      databasePerformance: 94
    },
    trafficMetrics: {
      pageViews: 284756,
      uniqueVisitors: 45623,
      avgPagesPerSession: 4.2,
      topPages: [
        { page: "/dashboard", views: 45678, percentage: 16.0 },
        { page: "/students", views: 34234, percentage: 12.0 },
        { page: "/assignments", views: 28567, percentage: 10.0 },
        { page: "/grades", views: 22856, percentage: 8.0 },
        { page: "/communications", views: 19945, percentage: 7.0 }
      ],
      referralSources: [
        { source: "Direct", visitors: 18234, percentage: 40.0 },
        { source: "Google", visitors: 13787, percentage: 30.2 },
        { source: "Email", visitors: 6849, percentage: 15.0 },
        { source: "Social Media", visitors: 4523, percentage: 9.9 },
        { source: "Referrals", visitors: 2230, percentage: 4.9 }
      ]
    }
  };

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAnalyticsData(mockAnalyticsData);
      setIsLoading(false);
    };

    loadAnalytics();
  }, [timeRange]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getChangeIndicator = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    const isPositive = change >= 0;
    
    return (
      <div className="flex items-center space-x-1">
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        )}
        <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {Math.abs(change).toFixed(1)}%
        </span>
      </div>
    );
  };

  if (isLoading || !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#056C40]"></div>
          <span className="text-muted-foreground">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Monitoring"
        description="Comprehensive insights into platform performance and user behavior"
        breadcrumbs={[
          { label: "Dashboard", href: "/platform" },
          { label: "Analytics", href: "/platform/analytics" }
        ]}
        actions={
          <div className="flex items-center space-x-2">
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
                <Users className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analyticsData.overview.totalUsers)}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                  <span>All registered users</span>
                  {getChangeIndicator(analyticsData.overview.totalUsers, 45000)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Users
                </CardTitle>
                <Activity className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analyticsData.overview.activeUsers)}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                  <span>Currently active</span>
                  {getChangeIndicator(analyticsData.overview.activeUsers, 11000)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Revenue
                </CardTitle>
                <DollarSign className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analyticsData.overview.totalRevenue)}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                  <span>This month</span>
                  {getChangeIndicator(analyticsData.overview.totalRevenue, 115000)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Conversion Rate
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.conversionRate}%</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                  <span>Sign-up to active</span>
                  {getChangeIndicator(analyticsData.overview.conversionRate, 2.8)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Metrics */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Avg Session Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatDuration(analyticsData.overview.avgSessionDuration)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Time users spend on platform per session
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointer className="h-5 w-5" />
                  Bounce Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analyticsData.overview.bounceRate}%</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Percentage of single-page sessions
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Metrics Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daily Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analyticsData.userMetrics.dailyActive)}</div>
                <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Weekly Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analyticsData.userMetrics.weeklyActive)}</div>
                <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analyticsData.userMetrics.monthlyActive)}</div>
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">New Signups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analyticsData.userMetrics.newSignups)}</div>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">User Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.userMetrics.userRetention}%</div>
                <p className="text-xs text-muted-foreground mt-1">Month-over-month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Churn Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{analyticsData.userMetrics.churnRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">Users lost this month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Uptime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{analyticsData.systemMetrics.uptime}%</div>
                <Badge className="bg-green-100 text-green-800 mt-2">Operational</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.systemMetrics.responseTime}ms</div>
                <p className="text-xs text-muted-foreground mt-1">Average API response</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Error Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.systemMetrics.errorRate}%</div>
                <Badge className="bg-green-100 text-green-800 mt-2">Healthy</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Active Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analyticsData.systemMetrics.activeConnections)}</div>
                <p className="text-xs text-muted-foreground mt-1">Current connections</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Server Load</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.systemMetrics.serverLoad}%</div>
                <p className="text-xs text-muted-foreground mt-1">CPU utilization</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Database Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.systemMetrics.databasePerformance}%</div>
                <p className="text-xs text-muted-foreground mt-1">Query efficiency</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Traffic Analysis Tab */}
        <TabsContent value="traffic" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Page Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatNumber(analyticsData.trafficMetrics.pageViews)}</div>
                <p className="text-sm text-muted-foreground mt-2">Total page views</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Unique Visitors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatNumber(analyticsData.trafficMetrics.uniqueVisitors)}</div>
                <p className="text-sm text-muted-foreground mt-2">Unique visitors</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Pages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top Pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.trafficMetrics.topPages.map((page, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{page.page}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatNumber(page.views)} views
                        </span>
                      </div>
                      <Badge variant="secondary">{page.percentage}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Referral Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Referral Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.trafficMetrics.referralSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{source.source}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatNumber(source.visitors)} visitors
                        </span>
                      </div>
                      <Badge variant="secondary">{source.percentage}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
