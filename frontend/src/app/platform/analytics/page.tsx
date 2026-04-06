"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import {
  AlertTriangle,
  Brain,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Eye,
  FileText,
  LineChart,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";

type BusinessTimeRange = "7d" | "30d" | "90d" | "1y";
type ReportTimeRange = "7d" | "30d" | "90d";
type ReportFormat = "csv" | "excel" | "pdf";
type ReportType =
  | "user_analytics"
  | "ticket_analytics"
  | "workflow_analytics"
  | "tenant_analytics"
  | "system_analytics"
  | "custom";
type AvailableReportTemplate = {
  id: string;
  name: string;
  description: string;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getTrendIcon(trend: number) {
  return trend > 0 ? (
    <TrendingUp className="h-4 w-4 text-green-600" />
  ) : (
    <TrendingDown className="h-4 w-4 text-red-600" />
  );
}

function getReportTimeRange(timeRange: BusinessTimeRange): ReportTimeRange {
  return timeRange === "1y" ? "90d" : timeRange;
}

function getRelativeTime(timestamp: number | undefined, now: number) {
  if (!timestamp) return "Never";
  const diffMs = now - timestamp;
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function getReportTypeLabel(reportType: string) {
  return reportType.replace(/_/g, " ");
}

export default function AdvancedAnalyticsPage() {
  const { sessionToken } = useAuth();
  const [timeRange, setTimeRange] = useState<BusinessTimeRange>("30d");
  const [selectedReport, setSelectedReport] = useState<string>("all");
  const [isCreateReportOpen, setIsCreateReportOpen] = useState(false);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [exportingReportId, setExportingReportId] = useState<string | null>(null);
  const [previewReportId, setPreviewReportId] = useState<string | null>(null);
  const [pageLoadedAt] = useState(() => Date.now());

  const [reportName, setReportName] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [reportFormat, setReportFormat] = useState<ReportFormat | "pdf">("pdf");
  const [reportSchedule, setReportSchedule] = useState<string>("once");
  const [reportRecipients, setReportRecipients] = useState("");

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
    {
      sessionToken: sessionToken || "",
      reportType: selectedReport === "all" ? undefined : selectedReport,
    },
    !!sessionToken
  );

  const createCustomReport = useMutation(api.platform.analytics.mutations.createCustomReport);
  const exportReport = useMutation(api.platform.analytics.mutations.exportReport);
  const generateReport = useMutation(api.platform.analytics.queries.generateReport);

  const recentReports = useMemo(() => reportsData?.recentReports ?? [], [reportsData?.recentReports]);
  const scheduledReports = useMemo(
    () => reportsData?.scheduledReports ?? [],
    [reportsData?.scheduledReports]
  );
  const availableReports = useMemo(
    () => ((reportsData?.availableReports ?? []) as AvailableReportTemplate[]),
    [reportsData?.availableReports]
  );

  const templatesById = useMemo(
    () => new Map<string, AvailableReportTemplate>(availableReports.map((report) => [report.id, report])),
    [availableReports]
  );
  const previewReport = useMemo(
    () => recentReports.find((report: any) => report._id === previewReportId) ?? null,
    [previewReportId, recentReports]
  );

  const handleExportReport = async (reportId: string, format: ReportFormat) => {
    if (!sessionToken) {
      toast.error("You need an active session to export reports.");
      return;
    }

    setExportingReportId(reportId);
    try {
      const result = await exportReport({ sessionToken, reportId, format });
      if (result?.exportUrl) {
        window.open(result.exportUrl, "_blank", "noopener,noreferrer");
        toast.success(`Export prepared as ${format.toUpperCase()}.`);
      } else {
        toast.success("Export request submitted.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export report.");
    } finally {
      setExportingReportId(null);
    }
  };

  const handleGenerateTemplate = async (templateId: string, format: ReportFormat) => {
    if (!sessionToken) {
      toast.error("You need an active session to generate reports.");
      return;
    }

    setExportingReportId(templateId);
    try {
      const result = await generateReport({
        sessionToken,
        reportId: templateId,
        format,
      });
      toast.success(result.message || "Report generation queued.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to queue report generation.");
    } finally {
      setExportingReportId(null);
    }
  };

  const handleCreateReport = async () => {
    if (!sessionToken || !reportName || !reportType) {
      toast.error("Report name and report type are required.");
      return;
    }

    setIsCreatingReport(true);
    try {
      const result = await createCustomReport({
        sessionToken,
        name: reportName,
        description: reportDescription || `Custom ${getReportTypeLabel(reportType)} report`,
        reportType,
        config: {
          timeRange: getReportTimeRange(timeRange),
          metrics: ["all"],
          chartType: "table",
        },
        schedule:
          reportSchedule !== "once"
            ? {
                enabled: true,
                frequency: reportSchedule as "daily" | "weekly" | "monthly",
                recipients: reportRecipients
                  .split(",")
                  .map((email) => email.trim())
                  .filter(Boolean),
              }
            : undefined,
      });

      await handleExportReport(result.reportId, reportFormat);
      setIsCreateReportOpen(false);
      setReportName("");
      setReportDescription("");
      setReportType("");
      setReportFormat("pdf");
      setReportSchedule("once");
      setReportRecipients("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create report.");
    } finally {
      setIsCreatingReport(false);
    }
  };

  if (!businessIntelligence || !reportsData) {
    return <LoadingSkeleton variant="page" />;
  }

  const BusinessIntelligenceTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue (MRR)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(businessIntelligence.overview.totalRevenue)}
            </div>
            <p className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(businessIntelligence.overview.revenueGrowth)}
              <span className="ml-1">
                {businessIntelligence.overview.revenueGrowth}% from last period
              </span>
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
            <div className="text-2xl font-bold">
              {formatCurrency(businessIntelligence.overview.avgRevenuePerUser)}
            </div>
            <p className="text-xs text-muted-foreground">
              ARR: {formatCurrency(businessIntelligence.revenueAnalytics.arr)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {businessIntelligence.revenueAnalytics.revenueByPlan.map((plan: any) => (
              <div key={plan.plan} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{plan.plan}</span>
                  <span className="font-medium">{formatCurrency(plan.revenue)}</span>
                </div>
                <Progress
                  value={
                    businessIntelligence.revenueAnalytics.mrr > 0
                      ? (plan.revenue / businessIntelligence.revenueAnalytics.mrr) * 100
                      : 0
                  }
                  className="h-2"
                />
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

      <Card>
        <CardHeader>
          <CardTitle>Tenant Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-3 text-center">
              <div className="text-2xl font-bold">{businessIntelligence.tenantAnalytics.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                {businessIntelligence.tenantAnalytics.active}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {businessIntelligence.tenantAnalytics.new}
              </div>
              <div className="text-sm text-muted-foreground">New</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="text-2xl font-bold text-red-600">
                {businessIntelligence.tenantAnalytics.churned}
              </div>
              <div className="text-sm text-muted-foreground">Churned</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {businessIntelligence.usageAnalytics.featureAdoption.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Adoption</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {businessIntelligence.usageAnalytics.featureAdoption.map((item: any) => (
              <div
                key={item.feature}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <span className="font-medium capitalize">{item.feature}</span>
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span>Churn Risk Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {churnPrediction && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Predicted Churn (Next Month)</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {Math.round(churnPrediction.nextMonthChurnRate * 10) / 10}%
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
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
                  <div key={index} className="flex items-center justify-between rounded border p-2">
                    <div>
                      <div className="text-sm font-medium">{tenant.tenantName}</div>
                      <div className="text-xs text-muted-foreground">
                        {tenant.riskFactors.join(", ")}
                      </div>
                    </div>
                    <div
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        tenant.churnProbability > 0.7
                          ? "bg-red-100 text-red-700"
                          : tenant.churnProbability > 0.5
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {Math.round(tenant.churnProbability * 100)}% risk
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Retention Opportunities</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {retentionOpportunities.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No retention opportunities at this time.
                </p>
              )}
              {retentionOpportunities.map((opportunity: any, index: number) => (
                <div key={index} className="space-y-2 rounded-lg border p-3">
                  <div className="font-medium">{opportunity.tenantName}</div>
                  <div className="text-sm text-muted-foreground">
                    {opportunity.recommendedActions?.map((action: string, actionIndex: number) => (
                      <div key={actionIndex}>&#8226; {action}</div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span>AI-Powered Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Tenant Health</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {businessIntelligence.tenantAnalytics.active} of{" "}
                  {businessIntelligence.tenantAnalytics.total} tenants are active (
                  {businessIntelligence.tenantAnalytics.total > 0
                    ? Math.round(
                        (businessIntelligence.tenantAnalytics.active /
                          businessIntelligence.tenantAnalytics.total) *
                          100
                      )
                    : 0}
                  % health rate).
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center space-x-2">
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

              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center space-x-2">
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as BusinessTimeRange)}
          >
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

          <Select value={selectedReport} onValueChange={setSelectedReport}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Filter report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All report types</SelectItem>
              <SelectItem value="user_analytics">User Analytics</SelectItem>
              <SelectItem value="ticket_analytics">Ticket Analytics</SelectItem>
              <SelectItem value="workflow_analytics">Workflow Analytics</SelectItem>
              <SelectItem value="tenant_analytics">Tenant Analytics</SelectItem>
              <SelectItem value="system_analytics">System Analytics</SelectItem>
              <SelectItem value="custom">Custom Reports</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateReportOpen} onOpenChange={setIsCreateReportOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
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
                  onChange={(event) => setReportName(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="report-description">Description</Label>
                <Textarea
                  id="report-description"
                  placeholder="Describe your report"
                  value={reportDescription}
                  onChange={(event) => setReportDescription(event.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Report Type</Label>
                  <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user_analytics">User Analytics</SelectItem>
                      <SelectItem value="ticket_analytics">Ticket Analytics</SelectItem>
                      <SelectItem value="workflow_analytics">Workflow Analytics</SelectItem>
                      <SelectItem value="tenant_analytics">Tenant Analytics</SelectItem>
                      <SelectItem value="system_analytics">System Analytics</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Format</Label>
                  <Select
                    value={reportFormat}
                    onValueChange={(value) => setReportFormat(value as ReportFormat)}
                  >
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
                  onChange={(event) => setReportRecipients(event.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateReportOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateReport} disabled={isCreatingReport || !reportName || !reportType}>
                {isCreatingReport ? "Creating..." : "Create Report"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Report Templates</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {availableReports.length === 0 && (
            <EmptyState
              title="No report templates yet"
              description="Report templates will appear here once analytics templates are available in Convex."
            />
          )}
          {availableReports.map((report: any) => (
            <div key={report.id} className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">{report.name}</h3>
                </div>
                <Badge variant="secondary">Template</Badge>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">{report.description}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateTemplate(report.id, "pdf")}
                  disabled={exportingReportId === report.id}
                >
                  <Eye className="mr-1 h-4 w-4" />
                  Queue PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateTemplate(report.id, "csv")}
                  disabled={exportingReportId === report.id}
                >
                  <Download className="mr-1 h-4 w-4" />
                  Queue CSV
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scheduledReports.length === 0 && (
              <EmptyState
                title="No scheduled reports"
                description="Create a report with a daily, weekly, or monthly schedule to monitor recurring analytics."
              />
            )}
            {scheduledReports.map((report: any) => (
              <div key={report._id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{report.name}</h3>
                      <Badge variant="secondary">
                        {getReportTypeLabel(report.reportType)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {report.description || "No description provided."}
                    </p>
                  </div>
                  <Badge>{report.schedule?.frequency || "scheduled"}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Next run: {getRelativeTime(report.nextScheduled, pageLoadedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Status: {report.status}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Generated Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentReports.length === 0 && (
              <EmptyState
                title="No generated reports yet"
                description="Queue a report from a template or create a custom report to build your reporting history."
              />
            )}
            {recentReports.map((report: any) => {
              const template = templatesById.get(report.name);
              return (
                <div key={report._id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{template?.name || report.name}</h3>
                        <Badge variant="secondary">
                          {getReportTypeLabel(report.reportType)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {report.description || template?.description || "Generated platform report."}
                      </p>
                    </div>
                    <Badge variant={report.status === "completed" ? "default" : "outline"}>
                      {report.status}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created {getRelativeTime(report.createdAt, pageLoadedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Last generated {getRelativeTime(report.lastGenerated, pageLoadedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      Format: {(report.exportFormat || "pdf").toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewReportId(report._id)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      Preview Report
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportReport(report._id, "pdf")}
                      disabled={exportingReportId === report._id}
                    >
                      <Download className="mr-1 h-4 w-4" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportReport(report._id, "excel")}
                      disabled={exportingReportId === report._id}
                    >
                      <Download className="mr-1 h-4 w-4" />
                      Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportReport(report._id, "csv")}
                      disabled={exportingReportId === report._id}
                    >
                      <Download className="mr-1 h-4 w-4" />
                      CSV
                    </Button>
                    {Array.isArray(report.schedule?.recipients) &&
                      report.schedule.recipients.length > 0 && (
                        <Badge variant="outline">
                          {report.schedule.recipients.length} recipient(s)
                        </Badge>
                      )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reporting Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Template actions queue generation in Convex and show the latest saved report records below.
          </p>
          <p>
            Scheduled delivery recipients are stored with the report, but delivery automation still depends on the platform reporting worker.
          </p>
        </CardContent>
      </Card>

      <Dialog open={previewReportId !== null} onOpenChange={(open) => !open && setPreviewReportId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewReport ? previewReport.name : "Report preview"}</DialogTitle>
          </DialogHeader>
          {previewReport ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Type</div>
                  <div className="mt-1 font-medium">
                    {getReportTypeLabel(previewReport.reportType)}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
                  <div className="mt-1 font-medium">{previewReport.status}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Created</div>
                  <div className="mt-1 font-medium">
                    {getRelativeTime(previewReport.createdAt, pageLoadedAt)}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Last generated</div>
                  <div className="mt-1 font-medium">
                    {getRelativeTime(previewReport.lastGenerated, pageLoadedAt)}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Description</div>
                <div className="mt-1 text-foreground">
                  {previewReport.description || "No description provided for this report."}
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Configuration</div>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
                  {JSON.stringify(previewReport.config ?? {}, null, 2)}
                </pre>
              </div>

              {Array.isArray(previewReport.schedule?.recipients) &&
              previewReport.schedule.recipients.length > 0 ? (
                <div className="rounded-lg border p-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Recipients</div>
                  <div className="mt-1 text-foreground">
                    {previewReport.schedule.recipients.join(", ")}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState
              title="Report not found"
              description="The selected report is no longer available."
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Advanced Analytics & Business Intelligence"
        description="Comprehensive analytics, predictive insights, and custom reporting"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Advanced Analytics", href: "/platform/analytics" },
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
