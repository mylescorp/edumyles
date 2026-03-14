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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";

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

  // Mock data - replace with actual queries
  const workflows: Workflow[] = [
    {
      _id: "workflow_1",
      name: "New Employee Onboarding",
      description: "Automated onboarding process for new staff members including account setup, training assignments, and equipment allocation",
      category: "onboarding",
      trigger: "manual",
      status: "active",
      steps: [
        {
          id: "step_1",
          name: "Create User Account",
          type: "action",
          config: {
            action: "create_user",
            parameters: {
              role: "staff",
              send_welcome_email: true,
            },
          },
          position: 1,
        },
        {
          id: "step_2",
          name: "Assign Required Training",
          type: "action",
          config: {
            action: "assign_training",
            courses: ["safety_training", "system_training", "compliance_training"],
            due_date: "30_days",
          },
          position: 2,
        },
        {
          id: "step_3",
          name: "Notify IT Department",
          type: "notification",
          config: {
            recipients: ["it@edumyles.com"],
            subject: "New Employee Equipment Setup",
            template: "equipment_setup_notification",
          },
          position: 3,
        },
        {
          id: "step_4",
          name: "Schedule Welcome Meeting",
          type: "action",
          config: {
            action: "create_meeting",
            attendees: ["hr", "manager", "department_head"],
            duration: "1_hour",
          },
          position: 4,
        },
      ],
      isActive: true,
      createdBy: "hr_admin@edumyles.com",
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
      executionCount: 45,
      successRate: 95.6,
      averageDuration: 2.5,
    },
    {
      _id: "workflow_2",
      name: "Monthly Compliance Check",
      description: "Automated monthly compliance verification and reporting for regulatory requirements",
      category: "compliance",
      trigger: "scheduled",
      status: "active",
      steps: [
        {
          id: "step_1",
          name: "Generate Compliance Report",
          type: "data_operation",
          config: {
            operation: "generate_report",
            report_type: "compliance_summary",
            time_range: "monthly",
          },
          position: 1,
        },
        {
          id: "step_2",
          name: "Check Policy Compliance",
          type: "condition",
          config: {
            condition: "compliance_score >= 90",
            on_true: "step_3",
            on_false: "step_4",
          },
          position: 2,
        },
        {
          id: "step_3",
          name: "Send Compliance Confirmation",
          type: "notification",
          config: {
            recipients: ["compliance_officer@edumyles.com"],
            subject: "Monthly Compliance Check - PASSED",
            template: "compliance_success_notification",
          },
          position: 3,
        },
        {
          id: "step_4",
          name: "Create Compliance Tasks",
          type: "action",
          config: {
            action: "create_tasks",
            priority: "high",
            assignee: "compliance_team@edumyles.com",
            due_date: "7_days",
          },
          position: 4,
        },
      ],
      isActive: true,
      createdBy: "compliance_admin@edumyles.com",
      createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
      executionCount: 12,
      successRate: 100,
      averageDuration: 0.5,
    },
    {
      _id: "workflow_3",
      name: "Student Data Backup",
      description: "Automated daily backup of critical student data with verification and notification",
      category: "data_management",
      trigger: "scheduled",
      status: "active",
      steps: [
        {
          id: "step_1",
          name: "Initiate Database Backup",
          type: "integration",
          config: {
            integration: "database_backup",
            backup_type: "full",
            compression: true,
          },
          position: 1,
        },
        {
          id: "step_2",
          name: "Verify Backup Integrity",
          type: "condition",
          config: {
            condition: "backup_verification.success",
            on_true: "step_3",
            on_false: "step_4",
          },
          position: 2,
        },
        {
          id: "step_3",
          name: "Store Backup to Cloud Storage",
          type: "integration",
          config: {
            integration: "cloud_storage",
            storage_location: "backups/student_data",
            encryption: true,
          },
          position: 3,
        },
        {
          id: "step_4",
          name: "Send Backup Failure Alert",
          type: "notification",
          config: {
            recipients: ["admin@edumyles.com", "it@edumyles.com"],
            subject: "BACKUP FAILURE - Student Data",
            priority: "high",
          },
          position: 4,
        },
      ],
      isActive: true,
      createdBy: "it_admin@edumyles.com",
      createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      executionCount: 365,
      successRate: 98.9,
      averageDuration: 0.1,
    },
  ];

  const workflowExecutions: WorkflowExecution[] = [
    {
      _id: "execution_1",
      workflowId: "workflow_1",
      workflowName: "New Employee Onboarding",
      executionId: "exec_123456",
      status: "completed",
      startedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      completedAt: Date.now() - 1.8 * 24 * 60 * 60 * 1000,
      duration: 4.8,
      triggeredBy: "hr_admin@edumyles.com",
      triggerData: {
        employeeId: "emp_789",
        employeeName: "John Doe",
        department: "Academics",
        position: "Teacher",
      },
      steps: [
        {
          id: "step_1",
          name: "Create User Account",
          status: "completed",
          startedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
          completedAt: Date.now() - 1.95 * 24 * 60 * 60 * 1000,
          duration: 0.3,
          output: {
            userId: "user_456",
            email: "john.doe@edumyles.com",
            accountCreated: true,
          },
        },
        {
          id: "step_2",
          name: "Assign Required Training",
          status: "completed",
          startedAt: Date.now() - 1.95 * 24 * 60 * 60 * 1000,
          completedAt: Date.now() - 1.8 * 24 * 60 * 60 * 1000,
          duration: 0.15,
          output: {
            coursesAssigned: 3,
            trainingIds: ["course_1", "course_2", "course_3"],
            dueDate: "2024-04-15",
          },
        },
        {
          id: "step_3",
          name: "Notify IT Department",
          status: "completed",
          startedAt: Date.now() - 1.8 * 24 * 60 * 60 * 1000,
          completedAt: Date.now() - 1.75 * 24 * 60 * 60 * 1000,
          duration: 0.05,
          output: {
            notificationSent: true,
            recipients: ["it@edumyles.com"],
            emailId: "email_789",
          },
        },
        {
          id: "step_4",
          name: "Schedule Welcome Meeting",
          status: "completed",
          startedAt: Date.now() - 1.75 * 24 * 60 * 60 * 1000,
          completedAt: Date.now() - 1.8 * 24 * 60 * 60 * 1000,
          duration: 0.03,
          output: {
            meetingScheduled: true,
            meetingId: "meeting_123",
            attendees: ["hr", "manager", "department_head"],
            startTime: "2024-03-20T10:00:00Z",
          },
        },
      ],
      error: null,
    },
    {
      _id: "execution_2",
      workflowId: "workflow_2",
      workflowName: "Monthly Compliance Check",
      executionId: "exec_123457",
      status: "running",
      startedAt: Date.now() - 1 * 60 * 60 * 1000,
      completedAt: null,
      duration: 1.0,
      triggeredBy: "system",
      triggerData: {
        scheduleType: "monthly",
        runDate: "2024-03-15",
      },
      steps: [
        {
          id: "step_1",
          name: "Generate Compliance Report",
          status: "completed",
          startedAt: Date.now() - 1 * 60 * 60 * 1000,
          completedAt: Date.now() - 0.9 * 60 * 60 * 1000,
          duration: 0.1,
          output: {
            reportGenerated: true,
            reportId: "report_456",
            complianceScore: 92,
          },
        },
        {
          id: "step_2",
          name: "Check Policy Compliance",
          status: "running",
          startedAt: Date.now() - 0.9 * 60 * 60 * 1000,
          completedAt: null,
          duration: 0.9,
          output: null,
        },
        {
          id: "step_3",
          name: "Send Compliance Confirmation",
          status: "pending",
          startedAt: null,
          completedAt: null,
          duration: null,
          output: null,
        },
        {
          id: "step_4",
          name: "Create Compliance Tasks",
          status: "pending",
          startedAt: null,
          completedAt: null,
          duration: null,
          output: null,
        },
      ],
      error: null,
    },
  ];

  const workflowTemplates: WorkflowTemplate[] = [
    {
      _id: "template_1",
      name: "Standard Employee Onboarding",
      description: "Complete onboarding workflow template for new staff members",
      category: "onboarding",
      templateSteps: [
        {
          id: "step_1",
          name: "Create User Account",
          type: "action",
          config: {
            action: "create_user",
            parameters: {
              role: "staff",
              send_welcome_email: true,
            },
          },
          position: 1,
        },
        {
          id: "step_2",
          name: "Assign Required Training",
          type: "action",
          config: {
            action: "assign_training",
            courses: ["safety_training", "system_training"],
          },
          position: 2,
        },
        {
          id: "step_3",
          name: "Notify IT Department",
          type: "notification",
          config: {
            recipients: ["it@edumyles.com"],
            subject: "New Employee Equipment Setup",
          },
          position: 3,
        },
      ],
      isPublic: true,
      tags: ["onboarding", "hr", "staff"],
      usageCount: 156,
      rating: 4.8,
      createdBy: "hr_admin@edumyles.com",
      createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    },
    {
      _id: "template_2",
      name: "Data Backup Verification",
      description: "Automated backup workflow with integrity verification",
      category: "data_management",
      templateSteps: [
        {
          id: "step_1",
          name: "Initiate Database Backup",
          type: "integration",
          config: {
            integration: "database_backup",
            backup_type: "full",
          },
          position: 1,
        },
        {
          id: "step_2",
          name: "Verify Backup Integrity",
          type: "condition",
          config: {
            condition: "backup_verification.success",
          },
          position: 2,
        },
        {
          id: "step_3",
          name: "Store to Cloud Storage",
          type: "integration",
          config: {
            integration: "cloud_storage",
            encryption: true,
          },
          position: 3,
        },
      ],
      isPublic: true,
      tags: ["backup", "data", "security"],
      usageCount: 89,
      rating: 4.6,
      createdBy: "it_admin@edumyles.com",
      createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    },
  ];

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
              <SelectItem value="">All Categories</SelectItem>
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
              <SelectItem value="">All Status</SelectItem>
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
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">18 active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,245</div>
            <p className="text-xs text-muted-foreground">+156 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">95.5%</div>
            <p className="text-xs text-muted-foreground">+2.3% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,240h</div>
            <p className="text-xs text-muted-foreground">≈ KES 15,600 saved</p>
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
              <SelectItem value="">All Status</SelectItem>
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
              <SelectItem value="">All Categories</SelectItem>
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
