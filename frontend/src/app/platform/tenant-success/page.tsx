"use client";

import { useState } from "react";
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
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  BarChart3,
  Activity,
  Zap,
  Star,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Square,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Heart,
  Shield,
  Brain,
  DollarSign,
  Headphones,
  Wrench,
  GraduationCap,
  Rocket,
  Flag,
  Timer,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface TenantHealthScore {
  _id: string;
  tenantId: string;
  tenantName: string;
  category: string;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  metrics: Record<string, number>;
  factors: Array<{
    name: string;
    weight: number;
    value: number;
    impact: string;
  }>;
  recommendations: string[];
  trends: Array<{
    date: string;
    score: number;
  }>;
  calculatedAt: number;
  calculatedBy: string;
  previousScore: number;
  scoreChange: number;
}

interface SuccessInitiative {
  _id: string;
  tenantId: string;
  tenantName: string;
  title: string;
  description: string;
  category: string;
  priority: "high" | "medium" | "low";
  targetScore: number;
  currentScore: number;
  progress: number;
  actions: Array<{
    id: string;
    title: string;
    description: string;
    assignee: string;
    dueDate: number;
    status: "pending" | "in_progress" | "completed";
    completedAt?: number;
  }>;
  milestones: Array<{
    id: string;
    title: string;
    description: string;
    targetDate: number;
    completed: boolean;
    completedAt?: number;
  }>;
  createdBy: string;
  assignedTo: string;
  startDate: number;
  targetDate: number;
  status: "planned" | "active" | "completed" | "cancelled";
  createdAt: number;
  updatedAt: number;
}

interface SuccessMetric {
  _id: string;
  tenantId: string;
  tenantName: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  targetValue: number;
  currentValue: number;
  baselineValue: number;
  calculationMethod: string;
  frequency: string;
  isActive: boolean;
  trend: string;
  lastUpdated: number;
  history: Array<{
    date: string;
    value: number;
  }>;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export default function TenantSuccessPage() {
  const { sessionToken } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTenant, setSelectedTenant] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isCreateInitiativeOpen, setIsCreateInitiativeOpen] = useState(false);
  const [isCreateMetricOpen, setIsCreateMetricOpen] = useState(false);

  // Initiative form state
  const [initTitle, setInitTitle] = useState("");
  const [initDescription, setInitDescription] = useState("");
  const [initCategory, setInitCategory] = useState<string>("");
  const [initPriority, setInitPriority] = useState<string>("");
  const [initTargetScore, setInitTargetScore] = useState("");
  const [initAssignedTo, setInitAssignedTo] = useState("");
  const [initStartDate, setInitStartDate] = useState("");
  const [initTargetDate, setInitTargetDate] = useState("");

  // Metric form state
  const [metricName, setMetricName] = useState("");
  const [metricDescription, setMetricDescription] = useState("");
  const [metricCategory, setMetricCategory] = useState<string>("");
  const [metricUnit, setMetricUnit] = useState("");
  const [metricTargetValue, setMetricTargetValue] = useState("");
  const [metricCurrentValue, setMetricCurrentValue] = useState("");
  const [metricBaselineValue, setMetricBaselineValue] = useState("");
  const [metricCalcMethod, setMetricCalcMethod] = useState<string>("");
  const [metricFrequency, setMetricFrequency] = useState<string>("");

  const rawOverview = usePlatformQuery(
    api.platform.tenantSuccess.queries.getTenantSuccessOverview,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  );
  const rawHealthScores = usePlatformQuery(
    api.platform.tenantSuccess.queries.getTenantHealthScores,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  );
  const rawInitiatives = usePlatformQuery(
    api.platform.tenantSuccess.queries.getSuccessInitiatives,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  );

  // Mutations
  const createInitiative = useMutation(
    api.platform.tenantSuccess.mutations.createSuccessInitiative
  );
  const createMetric = useMutation(api.platform.tenantSuccess.mutations.createSuccessMetric);

  const handleCreateInitiative = async () => {
    if (!sessionToken || !initTitle || !initCategory || !initPriority) return;
    try {
      await createInitiative({
        sessionToken,
        tenantId: "",
        title: initTitle,
        description: initDescription,
        category: initCategory as any,
        priority: initPriority as any,
        targetScore: Number(initTargetScore) || 0,
        currentScore: 0,
        actions: [],
        milestones: [],
        createdBy: sessionToken,
        assignedTo: initAssignedTo,
        startDate: initStartDate || new Date().toISOString(),
        targetDate: initTargetDate || new Date().toISOString(),
        status: "planned",
      });
      setIsCreateInitiativeOpen(false);
      setInitTitle("");
      setInitDescription("");
      setInitCategory("");
      setInitPriority("");
      setInitTargetScore("");
      setInitAssignedTo("");
      setInitStartDate("");
      setInitTargetDate("");
    } catch (err) {
      console.error("Failed to create initiative:", err);
    }
  };

  const handleCreateMetric = async () => {
    if (!sessionToken || !metricName || !metricCategory) return;
    try {
      await createMetric({
        sessionToken,
        tenantId: "",
        name: metricName,
        description: metricDescription,
        category: metricCategory as any,
        unit: metricUnit,
        targetValue: Number(metricTargetValue) || 0,
        currentValue: Number(metricCurrentValue) || 0,
        baselineValue: Number(metricBaselineValue) || 0,
        calculationMethod: (metricCalcMethod || "manual") as any,
        frequency: (metricFrequency || "monthly") as any,
        isActive: true,
        createdBy: sessionToken,
      });
      setIsCreateMetricOpen(false);
      setMetricName("");
      setMetricDescription("");
      setMetricCategory("");
      setMetricUnit("");
      setMetricTargetValue("");
      setMetricCurrentValue("");
      setMetricBaselineValue("");
      setMetricCalcMethod("");
      setMetricFrequency("");
    } catch (err) {
      console.error("Failed to create metric:", err);
    }
  };

  // Map API data to UI shape; fall back to zeros while loading
  const overview = rawOverview as any;
  const tenantSuccessOverview = {
    overview: {
      totalTenants: overview?.overview?.totalTenants ?? 0,
      activeTenants: overview?.overview?.activeTenants ?? 0,
      averageHealthScore: overview?.overview?.averageHealthScore ?? 0,
      gradeDistribution: overview?.overview?.gradeDistribution ?? { A: 0, B: 0, C: 0, D: 0, F: 0 },
      totalInitiatives: overview?.overview?.initiatives?.total ?? 0,
      activeInitiatives: overview?.overview?.initiatives?.active ?? 0,
      completedInitiatives: overview?.overview?.initiatives?.completed ?? 0,
      averageInitiativeProgress: (() => {
        const inits = (rawInitiatives as any[]) ?? [];
        if (!inits.length) return 0;
        return (
          Math.round(
            (inits.reduce((s: number, i: any) => s + (i.progress ?? 0), 0) / inits.length) * 10
          ) / 10
        );
      })(),
    },
    trends: overview?.trends ?? {
      healthScores: [],
      initiativeCompletions: [],
      engagementMetrics: [],
    },
    topPerformers: {
      tenants: (overview?.topPerformers ?? []).map((t: any) => ({
        tenantId: t.tenantId,
        tenantName: t.tenantName,
        healthScore: t.healthScore,
        grade: t.grade,
        initiativesCompleted: 0,
        trend: "stable",
      })),
      initiatives: ((rawInitiatives as any[]) ?? [])
        .sort((a: any, b: any) => b.progress - a.progress)
        .slice(0, 3)
        .map((i: any) => ({
          initiativeId: i._id,
          title: i.title,
          tenantName: i.tenantName ?? i.tenantId,
          progress: i.progress ?? 0,
          impact: i.description ?? "",
          category: i.category,
        })),
    },
    atRiskTenants: (overview?.atRiskTenants ?? []).map((t: any) => ({
      tenantId: t.tenantId,
      tenantName: t.tenantName,
      healthScore: t.healthScore,
      grade: t.grade,
      riskFactors: t.riskFactors ?? [],
      recommendedActions: t.recommendedActions ?? [],
    })),
    categoryBreakdown: overview?.categoryBreakdown ?? [],
  };

  const tenantHealthScores: TenantHealthScore[] = ((rawHealthScores as any[]) ??
    []) as TenantHealthScore[];

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-green-100 text-green-700 border-green-200";
      case "B":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "C":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "D":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "F":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case "declining":
        return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      case "stable":
        return <Minus className="h-4 w-4 text-gray-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "adoption":
        return <Users className="h-4 w-4" />;
      case "engagement":
        return <Heart className="h-4 w-4" />;
      case "support":
        return <Headphones className="h-4 w-4" />;
      case "technical":
        return <Wrench className="h-4 w-4" />;
      case "financial":
        return <DollarSign className="h-4 w-4" />;
      case "onboarding":
        return <GraduationCap className="h-4 w-4" />;
      case "training":
        return <Brain className="h-4 w-4" />;
      case "optimization":
        return <Zap className="h-4 w-4" />;
      case "retention":
        return <Shield className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenantSuccessOverview.overview.totalTenants}</div>
            <p className="text-xs text-muted-foreground">
              {tenantSuccessOverview.overview.activeTenants} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Health Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tenantSuccessOverview.overview.averageHealthScore}
            </div>
            <p className="text-xs text-muted-foreground">+2.5 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Initiatives</CardTitle>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenantSuccessOverview.overview.activeInitiatives}
            </div>
            <p className="text-xs text-muted-foreground">
              {tenantSuccessOverview.overview.completedInitiatives} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenantSuccessOverview.overview.averageInitiativeProgress}%
            </div>
            <p className="text-xs text-muted-foreground">Across all initiatives</p>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(tenantSuccessOverview.overview.gradeDistribution).map(
              ([grade, count]) => (
                <div key={grade} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getGradeColor(grade)}>{grade}</Badge>
                    <span className="text-sm text-muted-foreground">{String(count)} tenants</span>
                  </div>
                  <Progress
                    value={(Number(count) / tenantSuccessOverview.overview.totalTenants) * 100}
                    className="w-32"
                  />
                </div>
              )
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tenantSuccessOverview.topPerformers.tenants.map((tenant) => (
              <div key={tenant.tenantId} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(tenant.trend)}
                    <div>
                      <div className="font-medium">{tenant.tenantName}</div>
                      <div className="text-sm text-muted-foreground">
                        {tenant.healthScore} points
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getGradeColor(tenant.grade)}>{tenant.grade}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {tenant.initiativesCompleted} initiatives
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* At Risk Tenants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span>At Risk Tenants</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tenantSuccessOverview.atRiskTenants.map((tenant) => (
              <div key={tenant.tenantId} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{tenant.tenantName}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-lg font-bold ${getScoreColor(tenant.healthScore)}`}>
                        {tenant.healthScore}
                      </span>
                      <Badge className={getGradeColor(tenant.grade)}>{tenant.grade}</Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Risk Factors</div>
                    <div className="space-y-1">
                      {tenant.riskFactors.map((factor, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                          <span className="text-sm text-muted-foreground">{factor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Recommended Actions</div>
                    <div className="space-y-1">
                      {tenant.recommendedActions.map((action, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Target className="h-3 w-3 text-blue-500" />
                          <span className="text-sm text-muted-foreground">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const HealthScoresTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tenants..." className="pl-10 w-80" />
          </div>
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="B">B</SelectItem>
              <SelectItem value="C">C</SelectItem>
              <SelectItem value="D">D</SelectItem>
              <SelectItem value="F">F</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="adoption">Adoption</SelectItem>
              <SelectItem value="engagement">Engagement</SelectItem>
              <SelectItem value="support">Support</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
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
        </div>
      </div>

      {/* Health Scores List */}
      <div className="space-y-4">
        {tenantHealthScores.map((healthScore) => (
          <Card key={healthScore._id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Badge className={getGradeColor(healthScore.grade)}>
                      {healthScore.grade} Grade
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <span className={`text-2xl font-bold ${getScoreColor(healthScore.score)}`}>
                        {healthScore.score}
                      </span>
                      <span className="text-sm text-muted-foreground">points</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {healthScore.scoreChange > 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {Math.abs(healthScore.scoreChange)} from previous
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg">{healthScore.tenantName}</h3>
                    <p className="text-muted-foreground">
                      Calculated {formatRelativeTime(healthScore.calculatedAt)} by{" "}
                      {healthScore.calculatedBy}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(healthScore.metrics).map(([metric, value]) => (
                      <div key={metric} className="text-center">
                        <div className={`text-lg font-semibold ${getScoreColor(value)}`}>
                          {value}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">{metric}</div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Key Factors</div>
                    <div className="space-y-2">
                      {healthScore.factors.slice(0, 3).map((factor) => (
                        <div
                          key={factor.name}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>{factor.name}</span>
                          <div className="flex items-center space-x-2">
                            <span className={getScoreColor(factor.value)}>{factor.value}</span>
                            <span className="text-muted-foreground">
                              ({(factor.weight * 100).toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Recommendations</div>
                    <div className="space-y-1">
                      {healthScore.recommendations.slice(0, 3).map((rec, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <Target className="h-3 w-3 text-blue-500" />
                          <span className="text-muted-foreground">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const InitiativesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search initiatives..." className="pl-10 w-80" />
          </div>
          <Select>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="optimization">Optimization</SelectItem>
              <SelectItem value="support">Support</SelectItem>
              <SelectItem value="engagement">Engagement</SelectItem>
              <SelectItem value="retention">Retention</SelectItem>
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
          <Dialog open={isCreateInitiativeOpen} onOpenChange={setIsCreateInitiativeOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Initiative
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Success Initiative</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="initiative-title">Initiative Title</Label>
                  <Input id="initiative-title" placeholder="Enter initiative title" value={initTitle} onChange={(e) => setInitTitle(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="initiative-description">Description</Label>
                  <Textarea id="initiative-description" placeholder="Describe the initiative" rows={3} value={initDescription} onChange={(e) => setInitDescription(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select value={initCategory} onValueChange={setInitCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="onboarding">Onboarding</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="optimization">Optimization</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="engagement">Engagement</SelectItem>
                        <SelectItem value="retention">Retention</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Priority</Label>
                    <Select value={initPriority} onValueChange={setInitPriority}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Target Score</Label>
                    <Input type="number" placeholder="Enter target score" value={initTargetScore} onChange={(e) => setInitTargetScore(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Assigned To</Label>
                    <Input placeholder="Enter assignee email" value={initAssignedTo} onChange={(e) => setInitAssignedTo(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={initStartDate} onChange={(e) => setInitStartDate(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Target Date</Label>
                    <Input type="date" value={initTargetDate} onChange={(e) => setInitTargetDate(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateInitiativeOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateInitiative} disabled={!initTitle || !initCategory || !initPriority}>
                  Create Initiative
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Top Initiatives */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Initiatives</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tenantSuccessOverview.topPerformers.initiatives.map((initiative) => (
              <div
                key={initiative.initiativeId}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold">{initiative.title}</h4>
                    <Badge variant="outline">{initiative.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{initiative.tenantName}</p>
                  <p className="text-sm text-muted-foreground">{initiative.impact}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-lg font-semibold">{initiative.progress}%</div>
                    <div className="text-sm text-muted-foreground">Progress</div>
                  </div>
                  <Progress value={initiative.progress} className="w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenant Success Platform"
        description="Comprehensive tenant health scoring and success management platform"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Tenant Success", href: "/platform/tenant-success" },
        ]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health-scores">Health Scores</TabsTrigger>
          <TabsTrigger value="initiatives">Initiatives</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="health-scores">
          <HealthScoresTab />
        </TabsContent>

        <TabsContent value="initiatives">
          <InitiativesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
