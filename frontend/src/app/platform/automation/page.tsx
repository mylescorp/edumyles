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
  Zap,
  Play,
  Pause,
  Square,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  FileText,
  Database,
  Mail,
  Shield,
  Key,
  Workflow,
  Bot,
  Timer,
  Target,
  Activity,
  GitBranch,
  Layers,
  ArrowRight,
  MoreHorizontal,
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
  const { sessionToken } = useAuth();
  const [activeTab, setActiveTab] = useState("workflows");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isCreateWorkflowOpen, setIsCreateWorkflowOpen] = useState(false);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);

  // Real Convex queries
  const workflowsData = usePlatformQuery(
    api.platform.automation.queries.getWorkflows,
    { sessionToken: sessionToken || "" }
  );

  const executionsData = usePlatformQuery(
    api.platform.automation.queries.getWorkflowExecutions,
    { sessionToken: sessionToken || "" }
  );

  const templatesData = usePlatformQuery(
    api.platform.automation.queries.getWorkflowTemplates,
    { sessionToken: sessionToken || "" }
  );

  const metricsData = usePlatformQuery(
    api.platform.automation.queries.getAutomationMetrics,
    { sessionToken: sessionToken || "" }
  );

  const triggerWorkflow = useMutation(api.platform.automation.mutations.triggerWorkflow);
  const updateWorkflowStatus = useMutation(api.platform.automation.mutations.updateWorkflowStatus);

  if (!workflowsData) return <LoadingSkeleton variant="page" />;

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

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case "action": return <Zap className="h-4 w-4" />;
      case "condition": return <GitBranch className="h-4 w-4" />;
      case "approval": return <CheckCircle className="h-4 w-4" />;
      case "notification": return <Mail className="h-4 w-4" />;
      case "delay": return <Timer className="h-4 w-4" />;
      case "integration": return <Layers className="h-4 w-4" />;
      case "data_operation": return <Database className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-100";
      case "running": return "text-blue-600 bg-blue-100";
      case "failed": return "text-red-600 bg-red-100";
      case "cancelled": return "text-gray-600 bg-gray-100";
      case "pending": return "text-yellow-600 bg-yellow-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "running": return <Activity className="h-4 w-4" />;
      case "failed": return <XCircle className="h-4 w-4" />;
      case "cancelled": return <Square className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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

  const formatDuration = (hours: number) => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes}m`;
    } else if (hours < 24) {
      return `${Math.round(hours)}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round((hours % 24));
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
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
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
                  <Input id="workflow-name" placeholder="Enter workflow name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="workflow-description">Description</Label>
                  <Textarea id="workflow-description" placeholder="Describe the workflow purpose" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select>
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
                    <Select>
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
                      Add workflow steps using the visual workflow builder
                    </div>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Step
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateWorkflowOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsCreateWorkflowOpen(false)}>
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
            <div className="text-2xl font-bold">{metricsData?.overview?.totalWorkflows ?? workflows.length}</div>
            <p className="text-xs text-muted-foreground">{metricsData?.overview?.activeWorkflows ?? workflows.filter(w => w.isActive).length} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metricsData?.overview?.totalExecutions ?? workflowExecutions.length).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{metricsData?.overview?.successfulExecutions ?? 0} successful</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metricsData?.overview?.successRate ?? 0}%</div>
            <p className="text-xs text-muted-foreground">Avg duration: {metricsData?.overview?.averageExecutionTime ?? 0}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metricsData?.timeSaved?.totalHoursSaved ?? 0).toLocaleString()}h</div>
            <p className="text-xs text-muted-foreground">≈ KES {(metricsData?.timeSaved?.estimatedCostSavings ?? 0).toLocaleString()} saved</p>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {workflows.map((workflow) => (
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
                          <span>2 days ago</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Status</span>
                          <span className="text-green-600">Completed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button variant="outline" size="sm">
                    <Play className="h-4 w-4 mr-1" />
                    Run
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
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

  const ExecutionsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search executions..."
              className="pl-10 w-80"
            />
          </div>
          <Select>
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

      {/* Executions List */}
      <div className="space-y-4">
        {workflowExecutions.map((execution) => (
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
                      {execution.steps.map((step, index) => (
                        <div key={step.id} className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(step.status)}`}>
                            {getStatusIcon(step.status)}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{step.name}</div>
                            {step.status === "completed" && step.output && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {Object.entries(step.output).map(([key, value]) => (
                                  <span key={key}>{key}: {JSON.stringify(value)}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {step.status === "completed" ? formatDuration(step.duration) : 
                             step.status === "running" ? "Running..." : "Pending"}
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
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  {execution.status === "running" && (
                    <Button variant="outline" size="sm">
                      <Square className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
            />
          </div>
          <Select>
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
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
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
                  <Input id="template-name" placeholder="Enter template name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea id="template-description" placeholder="Describe the template" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select>
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
                    <Select>
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
                  <Input placeholder="Enter tags (comma separated)" />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateTemplateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsCreateTemplateOpen(false)}>
                  Create Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflowTemplates.map((template) => (
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
                <Button variant="outline" size="sm" className="flex-1">
                  <Target className="h-4 w-4 mr-1" />
                  Use Template
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
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
        title="Automation Center" 
        description="Workflow automation and process management platform"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Automation Center", href: "/platform/automation" }
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
