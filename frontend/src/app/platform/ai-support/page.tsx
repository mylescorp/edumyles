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
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Bot,
  Brain,
  MessageSquare,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  FileText,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Settings,
  Play,
  Pause,
  Square,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Star,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Send,
  Reply,
  Forward,
  Archive,
  Flag,
  Paperclip,
  Calendar,
  Phone,
  Mail,
  Globe,
  Shield,
  Cpu,
  Database,
  Cloud,
  Wifi,
  Lock,
  Key,
  User,
  HelpCircle,
  Info,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ExternalLink,
  Copy,
  Share2,
  Link2,
  Unlink,
  Save,
  SaveAll,
  Undo,
  Redo,
  Scissors,
  Clipboard,
  File,
  Folder,
  FolderOpen,
  Home,
  Grid,
  List,
  Layout,
  Columns,
  Layers,
  Package,
  ShoppingBag,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Activity as ActivityIcon,
  AlertCircle,
  CheckCircle2,
  XCircle as XCircleIcon,
  AlertTriangle as AlertTriangleIcon,
  Info as InfoIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";

interface AITicket {
  _id: string;
  ticketId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  tenantId: string;
  tenantName: string;
  userId: string;
  userName: string;
  userEmail: string;
  contactInfo: {
    email: string;
    phone?: string;
  };
  submittedBy: string;
  assignedTo: string;
  assignedAgentName: string;
  createdAt: number;
  updatedAt: number;
  resolvedAt: number | null;
  aiAnalysis: {
    sentiment: {
      score: number;
      label: string;
      confidence: number;
      emotions: string[];
      keyPhrases: string[];
    };
    category: {
      predicted: string;
      confidence: number;
      reasoning: string;
      alternatives: string[];
    };
    priority: {
      predicted: string;
      confidence: number;
      factors: string[];
      reasoning: string;
    };
    escalation: {
      recommended: boolean;
      confidence: number;
      reason: string;
      suggestedLevel: string;
    };
  };
  aiResponses: Array<{
    _id: string;
    type: string;
    content: string;
    tone: string;
    confidence: number;
    generatedAt: number;
    generatedBy: string;
    suggestedActions: string[];
  }>;
  attachments: string[];
  tags: string[];
  satisfaction: number | null;
  resolutionTime: number | null;
  escalationHistory: Array<{
    escalatedAt: number;
    escalatedTo: string;
    escalatedBy: string;
    reason: string;
    level: string;
  }>;
  knowledgeBaseReferences: string[];
}

interface AIInsight {
  totalTickets?: number;
  resolvedTickets?: number;
  averageResolutionTime?: number;
  topCategories?: string[];
  trends?: Array<{
    date: string;
    tickets: number;
    resolved: number;
    aiHandled?: number;
  }>;
  aiPerformance?: {
    aiHandledTickets: number;
    aiResolutionRate: number;
    averageResponseTime: number;
    customerSatisfaction: number;
    escalationRate: number;
    costSavings?: number;
    timeSavings?: number;
  };
  recommendations?: string[];
  totalAgents?: number;
  averageTicketsPerAgent?: number;
  averageResponseTime?: number;
  satisfactionScore?: number;
  topPerformers?: Array<{
    agentId: string;
    name: string;
    tickets: number;
    satisfaction: number;
    averageResponseTime?: number;
    aiAssistedTickets?: number;
  }>;
  averageRating?: number;
  responseRate?: number;
  netPromoterScore?: number;
  feedback?: string[];
  aiHandledTickets?: number;
  aiResolutionRate?: number;
  costSavings?: number;
  timeSavings?: number;
}

export default function AISupportPage() {
  const { sessionToken } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [isCreateTicketDialogOpen, setIsCreateTicketDialogOpen] = useState(false);
  const [isAnalyzeDialogOpen, setIsAnalyzeDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<AITicket | null>(null);

  // Mock data - replace with actual queries
  const aiTickets: AITicket[] = [
    {
      _id: "ticket_1",
      ticketId: "TKT-2024-001",
      title: "Login issues with mobile app",
      description: "Users are experiencing login problems when trying to access the platform through the mobile application. The app shows an error message 'Invalid credentials' even with correct login details.",
      category: "technical",
      priority: "high",
      status: "in_progress",
      tenantId: "tenant_1",
      tenantName: "Nairobi Academy",
      userId: "user_123",
      userName: "John Doe",
      userEmail: "john.doe@nairobiacademy.edu",
      contactInfo: {
        email: "john.doe@nairobiacademy.edu",
        phone: "+254 712 345 678",
      },
      submittedBy: "john.doe@nairobiacademy.edu",
      assignedTo: "agent_1",
      assignedAgentName: "Sarah Chen",
      createdAt: Date.now() - 2 * 60 * 60 * 1000,
      updatedAt: Date.now() - 30 * 60 * 1000,
      resolvedAt: null,
      aiAnalysis: {
        sentiment: {
          score: -0.3,
          label: "negative",
          confidence: 0.85,
          emotions: ["frustrated", "confused"],
          keyPhrases: ["login problems", "invalid credentials", "mobile app"],
        },
        category: {
          predicted: "technical",
          confidence: 0.92,
          reasoning: "Keywords indicate technical authentication issues",
          alternatives: ["technical", "account"],
        },
        priority: {
          predicted: "high",
          confidence: 0.78,
          factors: ["user_impact", "urgency_indicators", "multiple_users_affected"],
          reasoning: "Affects multiple users and core functionality",
        },
        escalation: {
          recommended: false,
          confidence: 0.65,
          reason: "Standard technical issue within support scope",
          suggestedLevel: "level_1",
        },
      },
      aiResponses: [
        {
          _id: "response_1",
          type: "initial",
          content: "Thank you for reporting this issue. I understand you're experiencing login problems with the mobile app. Let me help you troubleshoot this.",
          tone: "empathetic",
          confidence: 0.92,
          generatedAt: Date.now() - 2 * 60 * 60 * 1000,
          generatedBy: "ai_system",
          suggestedActions: [
            "Try clearing the mobile app cache",
            "Ensure you're using the latest app version",
            "Check if the issue occurs on different devices",
          ],
        },
        {
          _id: "response_2",
          type: "follow_up",
          content: "Based on our analysis, this appears to be related to a recent authentication update. Our team is working on a fix and will deploy it shortly.",
          tone: "professional",
          confidence: 0.88,
          generatedAt: Date.now() - 90 * 60 * 1000,
          generatedBy: "ai_system",
          suggestedActions: [
            "Monitor for authentication service updates",
            "Test with different user accounts",
            "Document affected user accounts",
          ],
        },
      ],
      attachments: ["screenshot_1.png", "error_log.txt"],
      tags: ["mobile", "login", "authentication", "urgent"],
      satisfaction: null,
      resolutionTime: null,
      escalationHistory: [],
      knowledgeBaseReferences: ["kb_123", "kb_456"],
    },
    {
      _id: "ticket_2",
      ticketId: "TKT-2024-002",
      title: "Billing inquiry about subscription renewal",
      description: "Customer wants to understand the subscription renewal process and pricing for the upcoming year. They have questions about payment methods and possible discounts.",
      category: "billing",
      priority: "medium",
      status: "resolved",
      tenantId: "tenant_2",
      tenantName: "Mombasa International School",
      userId: "user_456",
      userName: "Jane Smith",
      userEmail: "jane.smith@mombasainternational.edu",
      contactInfo: {
        email: "jane.smith@mombasainternational.edu",
      },
      submittedBy: "jane.smith@mombasainternational.edu",
      assignedTo: "agent_2",
      assignedAgentName: "John Smith",
      createdAt: Date.now() - 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 18 * 60 * 60 * 1000,
      resolvedAt: Date.now() - 18 * 60 * 60 * 1000,
      aiAnalysis: {
        sentiment: {
          score: 0.2,
          label: "neutral",
          confidence: 0.76,
          emotions: ["inquisitive", "neutral"],
          keyPhrases: ["subscription renewal", "pricing", "payment methods", "discounts"],
        },
        category: {
          predicted: "billing",
          confidence: 0.94,
          reasoning: "Clear billing-related keywords and context",
          alternatives: ["billing"],
        },
        priority: {
          predicted: "medium",
          confidence: 0.82,
          factors: ["business_criticality", "timing", "revenue_impact"],
          reasoning: "Important for revenue but not urgent",
        },
        escalation: {
          recommended: false,
          confidence: 0.91,
          reason: "Standard billing inquiry within support scope",
          suggestedLevel: "level_1",
        },
      },
      aiResponses: [
        {
          _id: "response_3",
          type: "initial",
          content: "I'd be happy to help you with your subscription renewal questions. Let me provide you with detailed information about our renewal process and pricing options.",
          tone: "friendly",
          confidence: 0.89,
          generatedAt: Date.now() - 23 * 60 * 60 * 1000,
          generatedBy: "ai_system",
          suggestedActions: [
            "Review current subscription details",
            "Check available discount programs",
            "Prepare renewal timeline",
          ],
        },
        {
          _id: "response_4",
          type: "resolution",
          content: "I've provided you with all the information about subscription renewal, including pricing options and available discounts. Is there anything specific about the renewal process you'd like me to clarify?",
          tone: "professional",
          confidence: 0.85,
          generatedAt: Date.now() - 19 * 60 * 60 * 1000,
          generatedBy: "ai_system",
          suggestedActions: [
            "Confirm understanding of renewal process",
            "Follow up on discount eligibility",
            "Schedule renewal reminder if needed",
          ],
        },
      ],
      attachments: [],
      tags: ["billing", "subscription", "renewal", "pricing"],
      satisfaction: 4.8,
      resolutionTime: 6 * 60 * 60 * 1000,
      escalationHistory: [],
      knowledgeBaseReferences: ["kb_789", "kb_012"],
    },
  ];

  const aiInsights: AIInsight = {
    totalTickets: 1247,
    resolvedTickets: 1089,
    averageResolutionTime: 4.2,
    topCategories: ["technical", "billing", "account"],
    trends: [
      { date: "2024-04-01", tickets: 45, resolved: 42, aiHandled: 18 },
      { date: "2024-04-02", tickets: 52, resolved: 48, aiHandled: 22 },
      { date: "2024-04-03", tickets: 38, resolved: 35, aiHandled: 15 },
      { date: "2024-04-04", tickets: 61, resolved: 56, aiHandled: 28 },
      { date: "2024-04-05", tickets: 47, resolved: 44, aiHandled: 21 },
    ],
    aiPerformance: {
      aiHandledTickets: 523,
      aiResolutionRate: 0.68,
      averageResponseTime: 0.5,
      customerSatisfaction: 4.1,
      escalationRate: 0.32,
    },
    recommendations: [
      "Increase AI training data for better accuracy",
      "Implement proactive AI outreach for common issues",
      "Fine-tune sentiment analysis models",
      "Optimize AI response templates for better satisfaction",
    ],
    totalAgents: 12,
    averageTicketsPerAgent: 104,
    averageResponseTime: 1.8,
    satisfactionScore: 4.6,
    topPerformers: [
      {
        agentId: "agent_1",
        name: "Sarah Chen",
        tickets: 156,
        satisfaction: 4.8,
        averageResponseTime: 1.2,
        aiAssistedTickets: 89,
      },
      {
        agentId: "agent_2",
        name: "John Smith",
        tickets: 142,
        satisfaction: 4.7,
        averageResponseTime: 1.5,
        aiAssistedTickets: 76,
      },
    ],
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "technical": return <Cpu className="h-4 w-4" />;
      case "billing": return <CreditCard className="h-4 w-4" />;
      case "account": return <User className="h-4 w-4" />;
      case "feature_request": return <Lightbulb className="h-4 w-4" />;
      case "bug_report": return <AlertTriangle className="h-4 w-4" />;
      case "general": return <MessageSquare className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-700 border-blue-200";
      case "in_progress": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "resolved": return "bg-green-100 text-green-700 border-green-200";
      case "closed": return "bg-gray-100 text-gray-700 border-gray-200";
      case "escalated": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "bg-gray-100 text-gray-700 border-gray-200";
      case "medium": return "bg-orange-100 text-orange-700 border-orange-200";
      case "high": return "bg-red-100 text-red-700 border-red-200";
      case "urgent": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return <ThumbsUp className="h-4 w-4 text-green-600" />;
      case "negative": return <ThumbsDown className="h-4 w-4 text-red-600" />;
      case "neutral": return <Minus className="h-4 w-4 text-gray-600" />;
      default: return <ActivityIcon className="h-4 w-4 text-gray-600" />;
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

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiInsights.totalTickets?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{aiInsights.resolvedTickets} resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Handled</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiInsights.aiPerformance?.aiHandledTickets}</div>
            <p className="text-xs text-muted-foreground">{((aiInsights.aiPerformance?.aiResolutionRate || 0) * 100).toFixed(1)}% resolution rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiInsights.averageResolutionTime}h</div>
            <p className="text-xs text-muted-foreground">AI: {aiInsights.aiPerformance?.averageResponseTime}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiInsights.aiPerformance?.customerSatisfaction}</div>
            <p className="text-xs text-muted-foreground">AI-powered support</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">AI Resolution Rate</span>
              <span className="text-sm font-medium">{((aiInsights.aiPerformance?.aiResolutionRate || 0) * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(aiInsights.aiPerformance?.aiResolutionRate || 0) * 100} className="w-full" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Customer Satisfaction</span>
              <span className="text-sm font-medium">{aiInsights.aiPerformance?.customerSatisfaction}</span>
            </div>
            <Progress value={(aiInsights.aiPerformance?.customerSatisfaction || 0) * 20} className="w-full" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Escalation Rate</span>
              <span className="text-sm font-medium">{((aiInsights.aiPerformance?.escalationRate || 0) * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(aiInsights.aiPerformance?.escalationRate || 0) * 100} className="w-full" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Avg Response Time</span>
              <span className="text-sm font-medium">{aiInsights.aiPerformance?.averageResponseTime}h</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top AI Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiInsights.topCategories?.map((category, index) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium capitalize">{category}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className="text-sm font-medium">{Math.floor(Math.random() * 100 + 50)}</div>
                    <div className="text-xs text-muted-foreground">tickets</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiInsights.trends?.map((trend) => (
              <div key={trend.date} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium">{trend.date}</div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-muted-foreground">Total: {trend.tickets}</div>
                    <div className="text-sm text-green-600">Resolved: {trend.resolved}</div>
                    <div className="text-sm text-blue-600">AI: {trend.aiHandled}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-muted-foreground">
                    {((trend.resolved / trend.tickets) * 100).toFixed(1)}% resolved
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const TicketsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              className="pl-10 w-80"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="account">Account</SelectItem>
              <SelectItem value="feature_request">Feature Request</SelectItem>
              <SelectItem value="bug_report">Bug Report</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateTicketDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Ticket
          </Button>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {aiTickets.map((ticket) => (
          <Card key={ticket._id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(ticket.category)}
                    <h3 className="font-semibold text-lg">{ticket.title}</h3>
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Bot className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-muted-foreground">AI-assisted</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Tenant</div>
                      <div className="text-muted-foreground">{ticket.tenantName}</div>
                    </div>
                    <div>
                      <div className="font-medium">User</div>
                      <div className="text-muted-foreground">{ticket.userName}</div>
                    </div>
                    <div>
                      <div className="font-medium">Assigned To</div>
                      <div className="text-muted-foreground">{ticket.assignedAgentName}</div>
                    </div>
                    <div>
                      <div className="font-medium">Created</div>
                      <div className="text-muted-foreground">{formatRelativeTime(ticket.createdAt)}</div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {ticket.description}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getSentimentIcon(ticket.aiAnalysis.sentiment.label)}
                    <span className="text-sm">Sentiment: {ticket.aiAnalysis.sentiment.label}</span>
                    <span className="text-sm">({(ticket.aiAnalysis.sentiment.confidence * 100).toFixed(1)}% confidence)</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">AI Analysis:</span>
                    <span className="text-sm text-muted-foreground">{ticket.aiAnalysis.category.predicted}</span>
                    <span className="text-sm text-muted-foreground">Priority: {ticket.aiAnalysis.priority.predicted}</span>
                    {ticket.aiAnalysis.escalation.recommended && (
                      <Badge variant="outline" className="text-red-600">Escalation Recommended</Badge>
                    )}
                  </div>
                  
                  {ticket.aiResponses.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">AI Responses:</div>
                      {ticket.aiResponses.map((response) => (
                        <div key={response._id} className="flex items-start space-x-2 text-sm p-2 bg-gray-50 rounded">
                          <Bot className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{response.type}</span>
                              <span className="text-muted-foreground">({(response.confidence * 100).toFixed(1)}% confidence)</span>
                            </div>
                            <div className="text-muted-foreground">{response.content}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {ticket.tags.length > 0 && (
                    <div className="flex items-center space-x-2">
                      {ticket.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setIsAnalyzeDialogOpen(true);
                    }}
                  >
                    <Brain className="h-4 w-4 mr-1" />
                    Analyze
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
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

  const InsightsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">AI Resolution Rate</span>
              <span className="text-sm font-medium">{((aiInsights.aiPerformance?.aiResolutionRate || 0) * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(aiInsights.aiPerformance?.aiResolutionRate || 0) * 100} className="w-full" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Customer Satisfaction</span>
              <span className="text-sm font-medium">{aiInsights.aiPerformance?.customerSatisfaction}</span>
            </div>
            <Progress value={(aiInsights.aiPerformance?.customerSatisfaction || 0) * 20} className="w-full" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Escalation Rate</span>
              <span className="text-sm font-medium">{((aiInsights.aiPerformance?.escalationRate || 0) * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(aiInsights.aiPerformance?.escalationRate || 0) * 100} className="w-full" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Cost Savings</span>
              <span className="text-sm font-medium">${aiInsights.aiPerformance?.costSavings?.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Agents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiInsights.topPerformers?.map((agent) => (
              <div key={agent.agentId} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`/avatars/${agent.agentId}.png`} />
                    <AvatarFallback>{agent.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-sm text-muted-foreground">{agent.tickets} tickets</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className="text-sm font-medium">{agent.satisfaction}</div>
                    <div className="text-xs text-muted-foreground">satisfaction</div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-sm">{agent.aiAssistedTickets} AI-assisted</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiInsights.recommendations?.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <div className="font-medium">Recommendation #{index + 1}</div>
                  <div className="text-sm text-muted-foreground">{recommendation}</div>
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
        title="AI-Powered Support System" 
        description="Intelligent ticket management with AI analysis and automation"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "AI Support", href: "/platform/ai-support" }
        ]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tickets">AI Tickets</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        
        <TabsContent value="tickets">
          <TicketsTab />
        </TabsContent>
        
        <TabsContent value="insights">
          <InsightsTab />
        </TabsContent>
      </Tabs>

      {/* Create Ticket Dialog */}
      <Dialog open={isCreateTicketDialogOpen} onOpenChange={setIsCreateTicketDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create AI Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Enter ticket title" />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe the issue in detail" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="feature_request">Feature Request</SelectItem>
                    <SelectItem value="bug_report">Bug Report</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label>Contact Information</Label>
              <Input placeholder="Email address" />
              <Input placeholder="Phone number (optional)" />
            </div>
            
            <div className="grid gap-2">
              <Label>Tags</Label>
              <Input placeholder="Enter tags separated by commas" />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCreateTicketDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsCreateTicketDialogOpen(false)}>
              Create Ticket
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Analysis Dialog */}
      <Dialog open={isAnalyzeDialogOpen} onOpenChange={setIsAnalyzeDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>AI Ticket Analysis</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="grid gap-4 py-4">
              <div className="space-y-4">
                <h3 className="font-semibold">{selectedTicket.title}</h3>
                <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sentiment Analysis</Label>
                    <div className="flex items-center space-x-2">
                      {getSentimentIcon(selectedTicket.aiAnalysis.sentiment.label)}
                      <span className="font-medium">{selectedTicket.aiAnalysis.sentiment.label}</span>
                      <span className="text-sm text-muted-foreground">
                        ({(selectedTicket.aiAnalysis.sentiment.confidence * 100).toFixed(1)}% confidence)
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Emotions: {selectedTicket.aiAnalysis.sentiment.emotions.join(', ')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Key phrases: {selectedTicket.aiAnalysis.sentiment.keyPhrases.join(', ')}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Category Classification</Label>
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(selectedTicket.aiAnalysis.category.predicted)}
                      <span className="font-medium">{selectedTicket.aiAnalysis.category.predicted}</span>
                      <span className="text-sm text-muted-foreground">
                        ({(selectedTicket.aiAnalysis.category.confidence * 100).toFixed(1)}% confidence)
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Reasoning: {selectedTicket.aiAnalysis.category.reasoning}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Priority Assessment</Label>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(selectedTicket.aiAnalysis.priority.predicted)}>
                        {selectedTicket.aiAnalysis.priority.predicted}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        ({(selectedTicket.aiAnalysis.priority.confidence * 100).toFixed(1)}% confidence)
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Factors: {selectedTicket.aiAnalysis.priority.factors.join(', ')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Reasoning: {selectedTicket.aiAnalysis.priority.reasoning}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Escalation Recommendation</Label>
                    <div className="flex items-center space-x-2">
                      {selectedTicket.aiAnalysis.escalation.recommended ? (
                        <>
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="font-medium text-red-600">Escalation Recommended</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-600">No Escalation Needed</span>
                        </>
                      )}
                      <span className="text-sm text-muted-foreground">
                        ({(selectedTicket.aiAnalysis.escalation.confidence * 100).toFixed(1)}% confidence)
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Reason: {selectedTicket.aiAnalysis.escalation.reason}
                    </div>
                    {selectedTicket.aiAnalysis.escalation.recommended && (
                      <div className="text-sm text-muted-foreground">
                        Suggested level: {selectedTicket.aiAnalysis.escalation.suggestedLevel}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAnalyzeDialogOpen(false)}>
              Close
            </Button>
            <Button>
              Apply AI Recommendations
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
