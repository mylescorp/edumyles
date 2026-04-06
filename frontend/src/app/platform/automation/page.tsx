"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import {
  Zap,
  Play,
  Square,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Database,
  Mail,
  Workflow,
  Bot,
  Timer,
  Target,
  Activity,
  GitBranch,
  Layers,
  ArrowRight,
  Star,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

interface Workflow {
  _id: string;
  name: string;
  description: string;
  category: string;
  trigger: string;
  status: string;
  steps: Array<{
    id: string;
    name: string;
    type: string;
    config: Record<string, any>;
    position: number;
  }>;
  isActive: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  executionCount: number;
  successRate: number;
  averageDuration: number;
}

interface WorkflowExecution {
  _id: string;
  workflowId: string;
  workflowName: string;
  executionId: string;
  status: string;
  startedAt: number;
  completedAt: number | null;
  duration: number;
  triggeredBy: string;
  triggerData: Record<string, any>;
  steps: Array<{
    id: string;
    name: string;
    status: string;
    startedAt: number;
    completedAt: number | null;
    duration: number;
    output: Record<string, any> | null;
  }>;
  error: string | null;
}

interface WorkflowTemplate {
  _id: string;
  name: string;
  description: string;
  category: string;
  templateSteps: Array<{
    id: string;
    name: string;
    type: string;
    config: Record<string, any>;
    position: number;
  }>;
  isPublic: boolean;
  tags: string[];
  usageCount: number;
  rating: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export default function AutomationCenterPage() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const [activeTab, setActiveTab] = useState("workflows");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [workflowSearch, setWorkflowSearch] = useState("");
  const [executionSearch, setExecutionSearch] = useState("");
  const [executionStatus, setExecutionStatus] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateCategory, setTemplateCategory] = useState("");
  const [isCreateWorkflowOpen, setIsCreateWorkflowOpen] = useState(false);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isRefreshing, startRefreshing] = useTransition();

  // Workflow form state
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [workflowCategory, setWorkflowCategory] = useState<string>("");
  const [workflowTrigger, setWorkflowTrigger] = useState<string>("");
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateCategoryValue, setTemplateCategoryValue] = useState("");
  const [templateVisibility, setTemplateVisibility] = useState("public");
  const [templateTags, setTemplateTags] = useState("");

  // Real Convex queries
  const workflowsData = usePlatformQuery(
    api.platform.automation.queries.getWorkflows,
    {
      sessionToken: sessionToken || "",
      category: selectedCategory && selectedCategory !== "all" ? (selectedCategory as any) : undefined,
      status: selectedStatus && selectedStatus !== "all" ? (selectedStatus as any) : undefined,
    },
    !!sessionToken
  );

  const executionsData = usePlatformQuery(
    api.platform.automation.queries.getWorkflowExecutions,
    {
      sessionToken: sessionToken || "",
      status: executionStatus && executionStatus !== "all" ? (executionStatus as any) : undefined,
    },
    !!sessionToken
  );

  const templatesData = usePlatformQuery(
    api.platform.automation.queries.getWorkflowTemplates,
    {
      sessionToken: sessionToken || "",
      category: templateCategory && templateCategory !== "all" ? templateCategory : undefined,
    },
    !!sessionToken
  );

  const metricsData = usePlatformQuery(
    api.platform.automation.queries.getAutomationMetrics,
    {
      sessionToken: sessionToken || "",
    },
    !!sessionToken
  );

  const triggerWorkflow = useMutation(api.platform.automation.mutations.triggerWorkflow);
  const updateWorkflowStatus = useMutation(api.platform.automation.mutations.updateWorkflowStatus);
  const createWorkflowMutation = useMutation(api.platform.automation.mutations.createWorkflow);
  const cancelWorkflowExecution = useMutation(api.platform.automation.mutations.cancelWorkflowExecution);
  const createWorkflowTemplate = useMutation(api.platform.automation.mutations.createWorkflowTemplate);

  const handleCreateWorkflow = async () => {
    if (!sessionToken || !workflowName || !workflowCategory || !workflowTrigger) {
      toast.error("Workflow name, category, and trigger are required.");
      return;
    }
    try {
      await createWorkflowMutation({
        sessionToken,
        name: workflowName,
        description: workflowDescription,
        category: workflowCategory as any,
        trigger: workflowTrigger as any,
        steps: [],
        isActive: false,
        createdBy: sessionToken,
      });
      toast.success("Workflow created.");
      setIsCreateWorkflowOpen(false);
      setWorkflowName("");
      setWorkflowDescription("");
      setWorkflowCategory("");
      setWorkflowTrigger("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create workflow.");
    }
  };

  const handleCreateTemplate = async () => {
    if (!sessionToken || !templateName || !templateCategoryValue) {
      toast.error("Template name and category are required.");
      return;
    }

    try {
      await createWorkflowTemplate({
        sessionToken,
        name: templateName,
        description: templateDescription,
        category: templateCategoryValue,
        templateSteps: [],
        isPublic: templateVisibility === "public",
        tags: templateTags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        createdBy: sessionToken,
      });
      toast.success("Workflow template created.");
      setIsCreateTemplateOpen(false);
      setTemplateName("");
      setTemplateDescription("");
      setTemplateCategoryValue("");
      setTemplateVisibility("public");
      setTemplateTags("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create template.");
    }
  };

  const workflows: Workflow[] = (workflowsData || []).map((w: any) => ({
    _id: w._id,
    name: w.name,
    description: w.description,
    category: w.category,
    trigger: w.trigger,
    status: w.isActive ? "active" : "inactive",
    steps: w.steps || [],
    isActive: w.isActive,
    createdBy: w.createdBy,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
    executionCount: w.executionCount || 0,
    successRate: w.successRate || 0,
    averageDuration: w.averageDuration || 0,
  }));

  const workflowExecutions: WorkflowExecution[] = (executionsData || []).map((e: any) => ({
    _id: e._id,
    workflowId: e.workflowId,
    workflowName: e.workflowName,
    executionId: e.executionId,
    status: e.status,
    startedAt: e.startedAt,
    completedAt: e.completedAt || null,
    duration: e.duration || 0,
    triggeredBy: e.triggeredBy,
    triggerData: e.triggerData || {},
    steps: (e.steps || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      startedAt: s.startedAt,
      completedAt: s.completedAt || null,
      duration: s.duration || 0,
      output: s.output || null,
    })),
    error: e.error || null,
  }));

  const workflowTemplates: WorkflowTemplate[] = (templatesData || []).map((t: any) => ({
    _id: t._id,
    name: t.name,
    description: t.description,
    category: t.category,
    templateSteps: t.templateSteps || [],
    isPublic: t.isPublic,
    tags: t.tags || [],
    usageCount: t.usageCount || 0,
    rating: t.rating || 0,
    createdBy: t.createdBy,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));

  const filteredWorkflows = useMemo(() => {
    const search = workflowSearch.trim().toLowerCase();
    if (!search) return workflows;
    return workflows.filter((workflow) =>
      `${workflow.name} ${workflow.description} ${workflow.category} ${workflow.trigger}`
        .toLowerCase()
        .includes(search)
    );
  }, [workflowSearch, workflows]);

  const filteredExecutions = useMemo(() => {
    const search = executionSearch.trim().toLowerCase();
    if (!search) return workflowExecutions;
    return workflowExecutions.filter((execution) =>
      `${execution.workflowName} ${execution.executionId} ${execution.triggeredBy} ${execution.status}`
        .toLowerCase()
        .includes(search)
    );
  }, [executionSearch, workflowExecutions]);

  const filteredTemplates = useMemo(() => {
    const search = templateSearch.trim().toLowerCase();
    if (!search) return workflowTemplates;
    return workflowTemplates.filter((template) =>
      `${template.name} ${template.description} ${template.category} ${template.tags.join(" ")}`
        .toLowerCase()
        .includes(search)
    );
  }, [templateSearch, workflowTemplates]);

  if (!workflowsData || !executionsData || !templatesData || !metricsData) {
    return <LoadingSkeleton variant="page" />;
  }

  const refreshPage = () => startRefreshing(() => router.refresh());

  const handleRunWorkflow = async (workflowId: string) => {
    if (!sessionToken) return;
    setActionLoadingId(workflowId);
    try {
      await triggerWorkflow({ sessionToken, workflowId });
      toast.success("Workflow execution started.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to run workflow.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleWorkflow = async (workflowId: string, isActive: boolean) => {
    if (!sessionToken) return;
    setActionLoadingId(workflowId);
    try {
      await updateWorkflowStatus({ sessionToken, workflowId, isActive: !isActive });
      toast.success(`Workflow ${isActive ? "paused" : "activated"}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update workflow status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelExecution = async (executionId: string) => {
    if (!sessionToken) return;
    setActionLoadingId(executionId);
    try {
      await cancelWorkflowExecution({ sessionToken, executionId });
      toast.success("Execution cancelled.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel execution.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUseTemplate = (template: WorkflowTemplate) => {
    setWorkflowName(template.name);
    setWorkflowDescription(template.description);
    setWorkflowCategory(template.category);
    setWorkflowTrigger("manual");
    setIsCreateWorkflowOpen(true);
    setActiveTab("workflows");
    toast.success("Template copied into the workflow form.");
  };

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case "action":
        return <Zap className="h-4 w-4" />;
      case "condition":
        return <GitBranch className="h-4 w-4" />;
      case "approval":
        return <CheckCircle className="h-4 w-4" />;
      case "notification":
        return <Mail className="h-4 w-4" />;
      case "delay":
        return <Timer className="h-4 w-4" />;
      case "integration":
        return <Layers className="h-4 w-4" />;
      case "data_operation":
        return <Database className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "running":
        return "text-blue-600 bg-blue-100";
      case "failed":
        return "text-red-600 bg-red-100";
      case "cancelled":
        return "text-gray-600 bg-gray-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "running":
        return <Activity className="h-4 w-4" />;
      case "failed":
        return <XCircle className="h-4 w-4" />;
      case "cancelled":
        return <Square className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
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

  const formatDuration = (hours: number) => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes}m`;
    } else if (hours < 24) {
      return `${Math.round(hours)}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      return `${days}d ${remainingHours}h`;
    }
  };

  const WorkflowsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workflows..."
              className="pl-10 w-80"
              value={workflowSearch}
              onChange={(e) => setWorkflowSearch(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="offboarding">Offboarding</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="communications">Communications</SelectItem>
              <SelectItem value="data_management">Data Management</SelectItem>
              <SelectItem value="approval">Approval</SelectItem>
              <SelectItem value="notification">Notification</SelectItem>
              <SelectItem value="integration">Integration</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={refreshPage} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={isCreateWorkflowOpen} onOpenChange={setIsCreateWorkflowOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create New Workflow</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="workflow-name">Workflow Name</Label>
                  <Input id="workflow-name" placeholder="Enter workflow name" value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="workflow-description">Description</Label>
                  <Textarea id="workflow-description" placeholder="Describe the workflow purpose" rows={3} value={workflowDescription} onChange={(e) => setWorkflowDescription(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select value={workflowCategory} onValueChange={setWorkflowCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="onboarding">Onboarding</SelectItem>
                        <SelectItem value="offboarding">Offboarding</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="communications">Communications</SelectItem>
                        <SelectItem value="data_management">Data Management</SelectItem>
                        <SelectItem value="approval">Approval</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                        <SelectItem value="integration">Integration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Trigger Type</Label>
                    <Select value={workflowTrigger} onValueChange={setWorkflowTrigger}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select trigger" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="event_based">Event Based</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Workflow Steps</Label>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-2">
                      Workflow creation currently stores metadata only. Step-builder editing is still pending.
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateWorkflowOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWorkflow} disabled={!workflowName || !workflowCategory || !workflowTrigger}>
                  Create Workflow
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Automation Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsData?.overview?.totalWorkflows ?? workflows.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {metricsData?.overview?.activeWorkflows ?? workflows.filter((w) => w.isActive).length}{" "}
              active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                metricsData?.overview?.totalExecutions ?? workflowExecutions.length
              ).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {metricsData?.overview?.successfulExecutions ?? 0} successful
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metricsData?.overview?.successRate ?? 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Avg duration: {metricsData?.overview?.averageExecutionTime ?? 0}h
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metricsData?.timeSaved?.totalHoursSaved ?? 0).toLocaleString()}h
            </div>
            <p className="text-xs text-muted-foreground">
              ≈ KES {(metricsData?.timeSaved?.estimatedCostSavings ?? 0).toLocaleString()} saved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {filteredWorkflows.map((workflow) => (
          <Card key={workflow._id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant={workflow.isActive ? "default" : "secondary"}>
                      {workflow.isActive ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                    <Badge variant="outline">{workflow.category.toUpperCase()}</Badge>
                    <div className="flex items-center space-x-1">
                      <Bot className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{workflow.trigger}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg">{workflow.name}</h3>
                    <p className="text-muted-foreground mt-1">{workflow.description}</p>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <span>Created {formatRelativeTime(workflow.createdAt)}</span>
                    <span>by {workflow.createdBy}</span>
                    <span>{workflow.steps.length} steps</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm font-medium mb-2">Performance</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Executions</span>
                          <span>{workflow.executionCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Success Rate</span>
                          <span className="text-green-600">{workflow.successRate}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Avg Duration</span>
                          <span>{formatDuration(workflow.averageDuration)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="text-sm font-medium mb-2">Steps</div>
                      <div className="space-y-2">
                        {workflow.steps.slice(0, 3).map((step) => (
                          <div key={step.id} className="flex items-center space-x-2">
                            {getStepIcon(step.type)}
                            <span className="text-sm">{step.name}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          </div>
                        ))}
                        {workflow.steps.length > 3 && (
                          <div className="text-sm text-muted-foreground">
                            +{workflow.steps.length - 3} more steps
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="text-sm font-medium mb-2">Recent Activity</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Last Execution</span>
                          <span>
                            {workflowExecutions.find((execution) => execution.workflowId === workflow._id)?.startedAt
                              ? formatRelativeTime(
                                  workflowExecutions.find((execution) => execution.workflowId === workflow._id)!.startedAt
                                )
                              : "No runs yet"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Status</span>
                          <span className={workflow.isActive ? "text-green-600" : "text-muted-foreground"}>
                            {workflow.isActive ? "Ready" : "Paused"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRunWorkflow(workflow._id)}
                    disabled={actionLoadingId === workflow._id || !workflow.isActive}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Run
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toast.message("Detailed workflow designer is still pending. This card reflects live workflow state.")
                    }
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleWorkflow(workflow._id, workflow.isActive)}
                    disabled={actionLoadingId === workflow._id}
                  >
                    <Square className="h-4 w-4 mr-1" />
                    {workflow.isActive ? "Pause" : "Activate"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredWorkflows.length === 0 && (
          <Card>
            <CardContent>
              <EmptyState
                icon={Workflow}
                title="No workflows matched"
                description="Try another workflow search, category, or status filter."
                className="py-10"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const ExecutionsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search executions..."
              className="pl-10 w-80"
              value={executionSearch}
              onChange={(e) => setExecutionSearch(e.target.value)}
            />
          </div>
          <Select value={executionStatus || "all"} onValueChange={setExecutionStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={refreshPage} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Executions List */}
      <div className="space-y-4">
        {filteredExecutions.map((execution) => (
          <Card key={execution._id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(execution.status)}>
                      {getStatusIcon(execution.status)}
                      <span>{execution.status.toUpperCase()}</span>
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Workflow className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{execution.workflowName}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <span>Execution ID: {execution.executionId}</span>
                    <span>Started {formatRelativeTime(execution.startedAt)}</span>
                    <span>Duration: {formatDuration(execution.duration)}</span>
                    <span>Triggered by {execution.triggeredBy}</span>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Execution Progress</div>
                    <div className="space-y-2">
                      {execution.steps.map((step) => (
                        <div key={step.id} className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(step.status)}`}
                          >
                            {getStatusIcon(step.status)}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{step.name}</div>
                            {step.status === "completed" && step.output && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {Object.entries(step.output).map(([key, value]) => (
                                  <span key={key}>
                                    {key}: {JSON.stringify(value)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {step.status === "completed"
                              ? formatDuration(step.duration)
                              : step.status === "running"
                                ? "Running..."
                                : "Pending"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {execution.triggerData && Object.keys(execution.triggerData).length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Trigger Data</div>
                      <div className="p-2 bg-muted rounded text-xs">
                        {Object.entries(execution.triggerData).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium">{key}:</span> {JSON.stringify(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toast.message("Execution drill-down is not implemented yet, but this row reflects live execution data.")
                    }
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  {execution.status === "running" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelExecution(execution.executionId)}
                      disabled={actionLoadingId === execution.executionId}
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredExecutions.length === 0 && (
          <Card>
            <CardContent>
              <EmptyState
                icon={Clock}
                title="No workflow executions matched"
                description="Adjust the execution search or status filter to inspect another run history slice."
                className="py-10"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const TemplatesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="pl-10 w-80"
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
            />
          </div>
          <Select value={templateCategory || "all"} onValueChange={setTemplateCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="offboarding">Offboarding</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="communications">Communications</SelectItem>
              <SelectItem value="data_management">Data Management</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={refreshPage} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={isCreateTemplateOpen} onOpenChange={setIsCreateTemplateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Workflow Template</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    placeholder="Enter template name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea
                    id="template-description"
                    placeholder="Describe the template"
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select value={templateCategoryValue} onValueChange={setTemplateCategoryValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="onboarding">Onboarding</SelectItem>
                        <SelectItem value="offboarding">Offboarding</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="communications">Communications</SelectItem>
                        <SelectItem value="data_management">Data Management</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Visibility</Label>
                    <Select value={templateVisibility} onValueChange={setTemplateVisibility}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Tags</Label>
                  <Input
                    placeholder="Enter tags (comma separated)"
                    value={templateTags}
                    onChange={(e) => setTemplateTags(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateTemplateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate}>Create Template</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{template.name}</CardTitle>
                <div className="flex items-center space-x-2">
                  {template.isPublic ? (
                    <Badge variant="secondary">PUBLIC</Badge>
                  ) : (
                    <Badge variant="outline">PRIVATE</Badge>
                  )}
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">{template.rating}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{template.description}</p>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{template.category}</span>
                <span className="text-muted-foreground">{template.templateSteps.length} steps</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Used {template.usageCount} times</span>
                <span>Created {formatRelativeTime(template.createdAt)}</span>
              </div>

              <div className="flex flex-wrap gap-1">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleUseTemplate(template)}
                >
                  <Target className="h-4 w-4 mr-1" />
                  Use Template
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toast.message("Template preview is limited to the summary card until the visual builder is added.")
                  }
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredTemplates.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent>
              <EmptyState
                icon={Layers}
                title="No templates matched"
                description="Try another template search or category filter."
                className="py-10"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automation Center"
        description="Workflow automation and process management platform"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Automation Center", href: "/platform/automation" },
        ]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows">
          <WorkflowsTab />
        </TabsContent>

        <TabsContent value="executions">
          <ExecutionsTab />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
