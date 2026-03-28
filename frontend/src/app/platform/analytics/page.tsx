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
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Building2,
  AlertTriangle,
  CheckCircle,
  Target,
  Brain,
  FileText,
  Download,
  Calendar,
  Filter,
  Plus,
  Settings,
  Eye,
  Mail,
  Smartphone,
  Clock,
  Zap,
  Activity,
  PieChart,
  LineChart,
  Globe,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function AdvancedAnalyticsPage() {
  const { sessionToken } = useAuth();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [selectedReport, setSelectedReport] = useState("");
  const [isCreateReportOpen, setIsCreateReportOpen] = useState(false);

  // Report form state
  const [reportName, setReportName] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportType, setReportType] = useState<string>("");
  const [reportFormat, setReportFormat] = useState<string>("");
  const [reportSchedule, setReportSchedule] = useState<string>("");
  const [reportRecipients, setReportRecipients] = useState("");

  // Backend queries
  const businessIntelligence = usePlatformQuery(
    api.platform.analytics.queries.getBusinessIntelligence,
    { sessionToken: sessionToken || "", timeRange },
    !!sessionToken
  );

  const predictiveData = usePlatformQuery(
    api.platform.analytics.queries.getPredictiveAnalytics,
    { sessionToken: sessionToken || "", modelType: "churn" as const },
    !!sessionToken
  );

  const reportsData = usePlatformQuery(
    api.platform.analytics.queries.getCustomReports,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );

  // Backend mutations
  const createCustomReport = useMutation(api.platform.analytics.mutations.createCustomReport);
  const exportReport = useMutation(api.platform.analytics.mutations.exportReport);

  const handleCreateReport = async () => {
    if (!sessionToken || !reportName || !reportType) return;
    try {
      await createCustomReport({
        sessionToken,
        name: reportName,
        description: reportDescription,
        reportType: reportType as any,
        config: {
          timeRange: timeRange as "7d" | "30d" | "90d",
          metrics: ["all"],
          chartType: "table" as const,
        },
        schedule: reportSchedule && reportSchedule !== "once" ? {
          enabled: true,
          frequency: reportSchedule as "daily" | "weekly" | "monthly",
          recipients: reportRecipients.split(",").map((e) => e.trim()).filter(Boolean),
        } : undefined,
      });
      setIsCreateReportOpen(false);
      setReportName("");
      setReportDescription("");
      setReportType("");
      setReportFormat("");
      setReportSchedule("");
      setReportRecipients("");
    } catch (err) {
      console.error("Failed to create report:", err);
    }
  };

  const handleExportReport = async (reportId: string, format: "csv" | "excel" | "pdf") => {
    if (!sessionToken) return;
    try {
      const result = await exportReport({ sessionToken, reportId, format });
      if (result?.exportUrl) {
        window.open(result.exportUrl, "_blank");
      }
    } catch (err) {
      console.error("Failed to export report:", err);
    }
  };

  if (!businessIntelligence) return <LoadingSkeleton variant="page" />;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getTrendIcon = (trend: number) => {
    return trend > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const BusinessIntelligenceTab = () => (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue (MRR)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(businessIntelligence.overview.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {getTrendIcon(businessIntelligence.overview.revenueGrowth)}
              <span className="ml-1">{businessIntelligence.overview.revenueGrowth}% from last period</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessIntelligence.overview.activeTenants}</div>
            <p className="text-xs text-muted-foreground">
              +{businessIntelligence.overview.newTenants} new this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessIntelligence.overview.churnRate}%</div>
            <p className="text-xs text-muted-foreground">
              CLV: {formatCurrency(businessIntelligence.overview.customerLifetimeValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Revenue / Tenant</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(businessIntelligence.overview.avgRevenuePerUser)}</div>
            <p className="text-xs text-muted-foreground">
              ARR: {formatCurrency(businessIntelligence.revenueAnalytics.arr)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {businessIntelligence.revenueAnalytics.revenueByPlan.map((plan: any) => (
              <div key={plan.plan} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="capitalize font-medium">{plan.plan}</span>
                  <span className="font-medium">{formatCurrency(plan.revenue)}</span>
                </div>
                <div className="space-y-1">
                  <Progress
                    value={businessIntelligence.revenueAnalytics.mrr > 0
                      ? (plan.revenue / businessIntelligence.revenueAnalytics.mrr) * 100
                      : 0}
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenant Growth by Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {businessIntelligence.revenueAnalytics.tenantGrowth.map((item: any) => (
              <div key={item.month} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{item.month}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{item.count} new tenants</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Tenant Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 border rounded-lg text-center">
              <div className="text-2xl font-bold">{businessIntelligence.tenantAnalytics.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{businessIntelligence.tenantAnalytics.active}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{businessIntelligence.tenantAnalytics.new}</div>
              <div className="text-sm text-muted-foreground">New</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{businessIntelligence.tenantAnalytics.churned}</div>
              <div className="text-sm text-muted-foreground">Churned</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Adoption */}
      {businessIntelligence.usageAnalytics.featureAdoption.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Adoption</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {businessIntelligence.usageAnalytics.featureAdoption.map((item: any) => (
              <div key={item.feature} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="capitalize font-medium">{item.feature}</span>
                <Badge variant="secondary">{item.count} installations</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );

  const PredictiveAnalyticsTab = () => {
    if (!predictiveData) return <LoadingSkeleton variant="page" />;

    const churnPrediction = predictiveData.churnPrediction;
    const atRiskTenants = predictiveData.atRiskTenants || [];
    const retentionOpportunities = predictiveData.retentionOpportunities || [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Churn Prediction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span>Churn Risk Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {churnPrediction && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Predicted Churn (Next Month)</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {Math.round(churnPrediction.nextMonthChurnRate * 10) / 10}%
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {churnPrediction.highRiskCount} high-risk tenants identified
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-medium">At-Risk Tenants</h4>
                {atRiskTenants.length === 0 && (
                  <p className="text-sm text-muted-foreground">No at-risk tenants detected.</p>
                )}
                {atRiskTenants.map((tenant: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium text-sm">{tenant.tenantName}</div>
                      <div className="text-xs text-muted-foreground">{tenant.riskFactors.join(", ")}</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      tenant.churnProbability > 0.7 ? 'bg-red-100 text-red-700' :
                      tenant.churnProbability > 0.5 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {Math.round(tenant.churnProbability * 100)}% risk
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Retention Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Retention Opportunities</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {retentionOpportunities.length === 0 && (
                <p className="text-sm text-muted-foreground">No retention opportunities at this time.</p>
              )}
              {retentionOpportunities.map((opp: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <div className="font-medium">{opp.tenantName}</div>
                  <div className="text-sm text-muted-foreground">
                    {opp.recommendedActions?.map((action: string, i: number) => (
                      <div key={i}>&#8226; {action}</div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span>AI-Powered Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Tenant Health</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {businessIntelligence.tenantAnalytics.active} of {businessIntelligence.tenantAnalytics.total} tenants
                  are active ({businessIntelligence.tenantAnalytics.total > 0
                    ? Math.round((businessIntelligence.tenantAnalytics.active / businessIntelligence.tenantAnalytics.total) * 100)
                    : 0}% health rate).
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Churn Alert</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {businessIntelligence.overview.churnRate}% churn rate detected.
                  {businessIntelligence.tenantAnalytics.churned > 0
                    ? ` ${businessIntelligence.tenantAnalytics.churned} tenants have churned this period.`
                    : " No churned tenants this period."}
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Growth Opportunity</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {businessIntelligence.tenantAnalytics.new > 0
                    ? `${businessIntelligence.tenantAnalytics.new} new tenants this period. Continue onboarding momentum.`
                    : "Focus on acquisition to grow tenant base."}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const CustomReportsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as "7d" | "30d" | "90d" | "1y")}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
        <Dialog open={isCreateReportOpen} onOpenChange={setIsCreateReportOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Custom Report</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="report-name">Report Name</Label>
                <Input
                  id="report-name"
                  placeholder="Enter report name"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="report-description">Description</Label>
                <Textarea
                  id="report-description"
                  placeholder="Describe your report"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant_analytics">Financial</SelectItem>
                      <SelectItem value="workflow_analytics">Operational</SelectItem>
                      <SelectItem value="user_analytics">Usage Analytics</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Format</Label>
                  <Select value={reportFormat} onValueChange={setReportFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Schedule</Label>
                <Select value={reportSchedule} onValueChange={setReportSchedule}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Run Once</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Recipients</Label>
                <Input
                  placeholder="Enter email addresses (comma separated)"
                  value={reportRecipients}
                  onChange={(e) => setReportRecipients(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateReportOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateReport}>
                Create Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Available Reports */}
      <div className="grid gap-4">
        {[
          {
            name: "Revenue Summary Report",
            description: "Comprehensive revenue analysis by plan, region, and time",
            category: "financial",
            lastGenerated: "2 hours ago",
            schedule: "weekly",
            format: "PDF",
          },
          {
            name: "Tenant Performance Dashboard",
            description: "Detailed tenant health and performance metrics",
            category: "operational",
            lastGenerated: "6 hours ago",
            schedule: "daily",
            format: "Dashboard",
          },
          {
            name: "Product Usage Analytics",
            description: "Feature adoption and user engagement analysis",
            category: "product",
            lastGenerated: "1 day ago",
            schedule: "monthly",
            format: "Excel",
          },
        ].map((report, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{report.name}</h3>
                    <Badge variant="secondary">{report.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Last generated: {report.lastGenerated}</span>
                    <span>Schedule: {report.schedule}</span>
                    <span>Format: {report.format}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Advanced Analytics & Business Intelligence" 
        description="Comprehensive analytics, predictive insights, and custom reporting"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Advanced Analytics", href: "/platform/analytics" }
        ]}
      />

      <Tabs defaultValue="business-intelligence">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="business-intelligence">Business Intelligence</TabsTrigger>
          <TabsTrigger value="predictive-analytics">Predictive Analytics</TabsTrigger>
          <TabsTrigger value="custom-reports">Custom Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="business-intelligence">
          <BusinessIntelligenceTab />
        </TabsContent>
        
        <TabsContent value="predictive-analytics">
          <PredictiveAnalyticsTab />
        </TabsContent>
        
        <TabsContent value="custom-reports">
          <CustomReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
