"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import {
  AlertTriangle,
  Bot,
  Brain,
  Building2,
  CheckCircle2,
  Clock3,
  Lightbulb,
  MessageSquare,
  Plus,
  Sparkles,
  Star,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed" | "escalated";
type TicketCategory = "technical" | "billing" | "account" | "feature_request" | "bug_report" | "general";
type TicketPriority = "low" | "medium" | "high" | "urgent";
type InsightType = "ticketTrends" | "agentPerformance" | "customerSatisfaction" | "aiEffectiveness";

interface SupportTicket {
  _id: string;
  ticketId: string;
  title: string;
  description: string;
  status: TicketStatus;
  category: TicketCategory;
  priority: TicketPriority;
  tenantId: string;
  tenantName?: string;
  userId: string;
  assignedTo?: string;
  createdAt: number;
  updatedAt: number;
  aiResponses?: Array<{
    type: string;
    content: string;
    tone: string;
    generatedAt: number;
  }>;
  aiAnalysis?: {
    sentiment?: string;
    category?: string;
    priority?: string;
    escalation?: {
      recommended?: boolean;
      confidence?: number;
    };
  };
  satisfaction?: number | null;
}

interface TenantOption {
  _id: string;
  tenantId: string;
  name: string;
  status: string;
}

interface TenantUserOption {
  _id?: string;
  userId?: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

interface TicketTrendsInsight {
  totalTickets?: number;
  resolvedTickets?: number;
  avgResolutionTime?: number;
  topCategories?: Array<{ category: string; count: number }>;
  recommendations?: string[];
}

interface AgentPerformanceInsight {
  totalAgents?: number;
  avgTicketsPerAgent?: number;
  avgResponseTime?: number;
  satisfactionScore?: number;
  topPerformers?: Array<{ agentId: string; tickets: number; resolved: number; name?: string }>;
  recommendations?: string[];
}

interface CustomerSatisfactionInsight {
  averageRating?: number;
  responseRate?: number;
  netPromoterScore?: number;
  feedback?: string[];
  recommendations?: string[];
}

interface AIEffectivenessInsight {
  aiHandledTickets?: number;
  aiResolutionRate?: number;
  avgResponseTime?: number;
  customerSatisfaction?: number;
  escalationRate?: number;
  costSavings?: number;
  timeSavings?: number;
  recommendations?: string[];
}

const CATEGORY_OPTIONS: Array<{ value: TicketCategory; label: string }> = [
  { value: "technical", label: "Technical" },
  { value: "billing", label: "Billing" },
  { value: "account", label: "Account" },
  { value: "feature_request", label: "Feature Request" },
  { value: "bug_report", label: "Bug Report" },
  { value: "general", label: "General" },
];

const PRIORITY_OPTIONS: Array<{ value: TicketPriority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const STATUS_OPTIONS: Array<{ value: "all" | TicketStatus; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "escalated", label: "Escalated" },
];

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  resolved: "bg-green-100 text-green-700 border-green-200",
  closed: "bg-slate-100 text-slate-700 border-slate-200",
  escalated: "bg-red-100 text-red-700 border-red-200",
};

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-200",
  medium: "bg-orange-100 text-orange-700 border-orange-200",
  high: "bg-red-100 text-red-700 border-red-200",
  urgent: "bg-purple-100 text-purple-700 border-purple-200",
};

function formatDateTime(value: number) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(value: number) {
  const diffHours = Math.max(0, Math.floor((Date.now() - value) / (1000 * 60 * 60)));
  if (diffHours < 1) return "Updated just now";
  if (diffHours < 24) return `Updated ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `Updated ${diffDays}d ago`;
}

function formatUserLabel(user: TenantUserOption) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  if (user.name) return user.name;
  if (user.email) return user.email;
  return user.userId ?? "Unknown user";
}

function InsightSummaryCard({
  title,
  value,
  helper,
  icon,
}: {
  title: string;
  value: string;
  helper: string;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

export default function AISupportPage() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "tickets" | "insights">("overview");
  const [statusFilter, setStatusFilter] = useState<"all" | TicketStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | TicketCategory>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | TicketPriority>("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState<TicketCategory | "">("");
  const [newPriority, setNewPriority] = useState<TicketPriority | "">("");
  const [newEmail, setNewEmail] = useState("");
  const [newTags, setNewTags] = useState("");
  const [isRefreshing, startRefreshing] = useTransition();

  const dateRange = useMemo(() => {
    const end = Date.now();
    return {
      start: end - 30 * 24 * 60 * 60 * 1000,
      end,
    };
  }, []);

  const aiTickets = usePlatformQuery<SupportTicket[]>(
    api.platform.support.queries.getAISupportTickets,
    {
      sessionToken: sessionToken ?? "",
      status: statusFilter === "all" ? undefined : statusFilter,
      category: categoryFilter === "all" ? undefined : categoryFilter,
      priority: priorityFilter === "all" ? undefined : priorityFilter,
      dateRange,
      limit: 100,
    },
    !!sessionToken
  );

  const tenants = usePlatformQuery<TenantOption[]>(
    api.platform.tenants.queries.listAllTenants,
    { sessionToken: sessionToken ?? "" },
    !!sessionToken
  );

  const tenantUsers = usePlatformQuery<TenantUserOption[]>(
    api.platform.tenants.queries.getTenantUsers,
    { sessionToken: sessionToken ?? "", tenantId: selectedTenantId },
    !!sessionToken && !!selectedTenantId
  );

  const trendsInsight = usePlatformQuery<TicketTrendsInsight>(
    api.platform.support.queries.getAIInsights,
    { sessionToken: sessionToken ?? "", insightType: "ticketTrends" as InsightType, dateRange },
    !!sessionToken
  );

  const effectivenessInsight = usePlatformQuery<AIEffectivenessInsight>(
    api.platform.support.queries.getAIInsights,
    { sessionToken: sessionToken ?? "", insightType: "aiEffectiveness" as InsightType, dateRange },
    !!sessionToken
  );

  const satisfactionInsight = usePlatformQuery<CustomerSatisfactionInsight>(
    api.platform.support.queries.getAIInsights,
    { sessionToken: sessionToken ?? "", insightType: "customerSatisfaction" as InsightType, dateRange },
    !!sessionToken
  );

  const agentInsight = usePlatformQuery<AgentPerformanceInsight>(
    api.platform.support.queries.getAIInsights,
    { sessionToken: sessionToken ?? "", insightType: "agentPerformance" as InsightType, dateRange },
    !!sessionToken
  );

  const createTicket = useMutation(api.platform.support.mutations.createAISupportTicket);
  const analyzeTicket = useMutation(api.platform.support.mutations.analyzeTicketWithAI);
  const generateResponse = useMutation(api.platform.support.mutations.generateAIResponse);
  const escalateTicket = useMutation(api.platform.support.mutations.escalateToHumanAgent);

  const selectedUser = tenantUsers?.find((user) => String(user._id ?? user.userId ?? "") === selectedUserId);

  const ticketCounts = useMemo(() => {
    const tickets = aiTickets ?? [];
    return {
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "open").length,
      escalated: tickets.filter((ticket) => ticket.status === "escalated").length,
      resolved: tickets.filter((ticket) => ticket.status === "resolved" || ticket.status === "closed").length,
    };
  }, [aiTickets]);

  const isLoadingInsights =
    !!sessionToken &&
    (!aiTickets || !trendsInsight || !effectivenessInsight || !satisfactionInsight || !agentInsight || !tenants);

  const resetCreateForm = () => {
    setSelectedTenantId("");
    setSelectedUserId("");
    setNewTitle("");
    setNewDescription("");
    setNewCategory("");
    setNewPriority("");
    setNewEmail("");
    setNewTags("");
  };

  const handleCreateTicket = async () => {
    if (!sessionToken || !selectedTenantId || !selectedUserId || !newTitle || !newDescription || !newCategory || !newPriority) {
      return;
    }

    setIsCreating(true);
    try {
      await createTicket({
        sessionToken,
        title: newTitle,
        description: newDescription,
        category: newCategory,
        priority: newPriority,
        tenantId: selectedTenantId,
        userId: selectedUserId,
        submittedBy: "super_admin",
        contactInfo: newEmail ? { email: newEmail } : selectedUser?.email ? { email: selectedUser.email } : undefined,
        tags: newTags
          ? newTags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : undefined,
      });
      toast.success("AI support ticket created");
      setIsCreateOpen(false);
      resetCreateForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create ticket");
    } finally {
      setIsCreating(false);
    }
  };

  const handleAnalyzeTicket = async (ticket: SupportTicket) => {
    if (!sessionToken) return;

    try {
      await analyzeTicket({
        sessionToken,
        ticketId: String(ticket._id),
        analysisType: "sentiment",
        context: `${ticket.title}\n${ticket.description}`,
        requestedBy: "super_admin",
      });
      toast.success("AI analysis refreshed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to analyze ticket");
    }
  };

  const handleGenerateResponse = async (ticket: SupportTicket, responseType: "initial" | "follow_up" | "resolution") => {
    if (!sessionToken) return;

    try {
      const response = await generateResponse({
        sessionToken,
        ticketId: String(ticket._id),
        responseType,
        tone: "professional",
        includeSuggestions: true,
        requestedBy: "super_admin",
      });
      toast.success(response?.message ?? "AI response generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate response");
    }
  };

  const handleEscalate = async (ticket: SupportTicket) => {
    if (!sessionToken) return;

    try {
      const response = await escalateTicket({
        sessionToken,
        ticketId: String(ticket._id),
        escalationReason: "Platform admin requested human follow-up after AI review.",
        urgency: ticket.priority === "urgent" ? "critical" : ticket.priority === "high" ? "high" : "medium",
        escalatedBy: "super_admin",
      });
      toast.success(response?.message ?? "Ticket escalated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to escalate ticket");
    }
  };

  if (isLoadingInsights) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="AI Support"
          description="Review AI-assisted support operations, ticket quality, and human escalation flow."
        />
        <LoadingSkeleton variant="page" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Support"
        description="Operate the live AI support queue with real tenant tickets, analytics, and human escalation controls."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => startRefreshing(() => router.refresh())} disabled={isRefreshing}>
              <Clock3 className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Ticket
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "overview" | "tickets" | "insights")} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tickets">AI Tickets</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InsightSummaryCard
              title="Tickets In Window"
              value={String(trendsInsight?.totalTickets ?? ticketCounts.total)}
              helper={`${trendsInsight?.resolvedTickets ?? ticketCounts.resolved} resolved in the last 30 days`}
              icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
            />
            <InsightSummaryCard
              title="AI Handled"
              value={String(effectivenessInsight?.aiHandledTickets ?? 0)}
              helper={`${effectivenessInsight?.aiResolutionRate ?? 0}% AI resolution rate`}
              icon={<Bot className="h-4 w-4 text-muted-foreground" />}
            />
            <InsightSummaryCard
              title="Escalations"
              value={String(ticketCounts.escalated)}
              helper={`${effectivenessInsight?.escalationRate ?? 0}% of recent tickets required humans`}
              icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
            />
            <InsightSummaryCard
              title="Satisfaction"
              value={String(satisfactionInsight?.averageRating ?? 0)}
              helper={`${satisfactionInsight?.responseRate ?? 0}% feedback response rate`}
              icon={<Star className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>AI Effectiveness</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Resolution rate</span>
                    <span>{effectivenessInsight?.aiResolutionRate ?? 0}%</span>
                  </div>
                  <Progress value={effectivenessInsight?.aiResolutionRate ?? 0} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Escalation rate</span>
                    <span>{effectivenessInsight?.escalationRate ?? 0}%</span>
                  </div>
                  <Progress value={effectivenessInsight?.escalationRate ?? 0} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">Estimated cost savings</div>
                    <div className="mt-1 text-xl font-semibold">
                      {(effectivenessInsight?.costSavings ?? 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">Estimated time savings</div>
                    <div className="mt-1 text-xl font-semibold">
                      {effectivenessInsight?.timeSavings ?? 0} hours
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Ticket Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(trendsInsight?.topCategories ?? []).length === 0 ? (
                  <EmptyState
                    icon={Lightbulb}
                    title="No category trends available"
                    description="This reporting window does not yet have enough AI support ticket volume."
                    className="py-8"
                  />
                ) : (
                  (trendsInsight?.topCategories ?? []).map((entry) => (
                    <div key={entry.category} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-blue-100 p-2">
                          <Lightbulb className="h-4 w-4 text-blue-700" />
                        </div>
                        <div>
                          <div className="font-medium capitalize">{entry.category.replaceAll("_", " ")}</div>
                          <div className="text-xs text-muted-foreground">Recent AI support demand</div>
                        </div>
                      </div>
                      <Badge variant="secondary">{entry.count} tickets</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Queue Filters</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | TicketStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as "all" | TicketCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as "all" | TicketPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[1.5fr,1fr]">
            <div className="space-y-4">
              {(aiTickets ?? []).length === 0 ? (
                <Card>
                  <CardContent>
                    <EmptyState
                      icon={MessageSquare}
                      title="No AI support tickets matched"
                      description="Try another ticket status, category, or priority filter."
                      className="py-10"
                    />
                  </CardContent>
                </Card>
              ) : (
                (aiTickets ?? []).map((ticket) => (
                  <Card key={ticket._id} className={selectedTicket?._id === ticket._id ? "border-primary" : ""}>
                    <CardContent className="space-y-4 p-5">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={STATUS_STYLES[ticket.status]}>{ticket.status.replaceAll("_", " ")}</Badge>
                            <Badge className={PRIORITY_STYLES[ticket.priority]}>{ticket.priority}</Badge>
                            <Badge variant="outline">{ticket.category.replaceAll("_", " ")}</Badge>
                          </div>
                          <div>
                            <div className="text-lg font-semibold">{ticket.title}</div>
                            <div className="text-sm text-muted-foreground">{ticket.tenantName ?? ticket.tenantId}</div>
                          </div>
                          <p className="line-clamp-2 text-sm text-muted-foreground">{ticket.description}</p>
                        </div>
                        <Button variant="outline" onClick={() => setSelectedTicket(ticket)}>
                          View Ticket
                        </Button>
                      </div>

                      <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4" />
                          {formatRelativeTime(ticket.updatedAt)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {ticket.tenantName ?? ticket.tenantId}
                        </div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          {(ticket.aiResponses ?? []).length} AI responses saved
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Queue Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">Open</div>
                    <div className="text-2xl font-semibold">{ticketCounts.open}</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">Resolved</div>
                    <div className="text-2xl font-semibold">{ticketCounts.resolved}</div>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">Escalated</div>
                  <div className="mt-1 text-2xl font-semibold">{ticketCounts.escalated}</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Human review is required for tickets with operational or urgent impact.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">Response recommendations</div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    AI response generation and escalation are live. Routing and richer agent assignment still happen elsewhere in platform support.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Agent Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">Agents with workload</div>
                    <div className="text-2xl font-semibold">{agentInsight?.totalAgents ?? 0}</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">Average tickets per agent</div>
                    <div className="text-2xl font-semibold">{agentInsight?.avgTicketsPerAgent ?? 0}</div>
                  </div>
                </div>
                {(agentInsight?.topPerformers ?? []).length === 0 ? (
                  <div className="text-sm text-muted-foreground">No assigned-agent performance data is available yet.</div>
                ) : (
                  (agentInsight?.topPerformers ?? []).map((agent) => (
                    <div key={agent.agentId} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-emerald-100 p-2">
                          <Users className="h-4 w-4 text-emerald-700" />
                        </div>
                        <div>
                          <div className="font-medium">{agent.name ?? agent.agentId}</div>
                          <div className="text-xs text-muted-foreground">{agent.tickets} tickets handled</div>
                        </div>
                      </div>
                      <Badge variant="secondary">{agent.resolved} resolved</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  ...(trendsInsight?.recommendations ?? []),
                  ...(effectivenessInsight?.recommendations ?? []),
                  ...(satisfactionInsight?.recommendations ?? []),
                ].length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No generated recommendations are stored yet. This page only shows live recommendation output from the backend.
                  </div>
                ) : (
                  [
                    ...(trendsInsight?.recommendations ?? []),
                    ...(effectivenessInsight?.recommendations ?? []),
                    ...(satisfactionInsight?.recommendations ?? []),
                  ].map((item, index) => (
                    <div key={`${item}-${index}`} className="flex gap-3 rounded-lg border p-3">
                      <div className="rounded-full bg-yellow-100 p-2">
                        <Brain className="h-4 w-4 text-yellow-700" />
                      </div>
                      <div className="text-sm text-muted-foreground">{item}</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create AI Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tenant</Label>
              <Select
                value={selectedTenantId}
                onValueChange={(value) => {
                  setSelectedTenantId(value);
                  setSelectedUserId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {(tenants ?? []).map((tenant) => (
                    <SelectItem key={tenant.tenantId} value={tenant.tenantId}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>School User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={!selectedTenantId}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedTenantId ? "Select user" : "Choose a tenant first"} />
                </SelectTrigger>
                <SelectContent>
                  {(tenantUsers ?? []).map((user) => {
                    const value = String(user._id ?? user.userId ?? "");
                    if (!value) return null;
                    return (
                      <SelectItem key={value} value={value}>
                        {formatUserLabel(user)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Title</Label>
              <Input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Brief summary of the issue" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={newDescription}
                onChange={(event) => setNewDescription(event.target.value)}
                placeholder="Describe the customer issue, observed behavior, and impact."
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={newCategory} onValueChange={(value) => setNewCategory(value as TicketCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={newPriority} onValueChange={(value) => setNewPriority(value as TicketPriority)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input value={newEmail} onChange={(event) => setNewEmail(event.target.value)} placeholder="Optional override email" />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <Input value={newTags} onChange={(event) => setNewTags(event.target.value)} placeholder="comma,separated,tags" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                resetCreateForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTicket}
              disabled={
                isCreating ||
                !selectedTenantId ||
                !selectedUserId ||
                !newTitle ||
                !newDescription ||
                !newCategory ||
                !newPriority
              }
            >
              {isCreating ? "Creating..." : "Create Ticket"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-3xl">
          {selectedTicket ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTicket.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={STATUS_STYLES[selectedTicket.status]}>{selectedTicket.status.replaceAll("_", " ")}</Badge>
                  <Badge className={PRIORITY_STYLES[selectedTicket.priority]}>{selectedTicket.priority}</Badge>
                  <Badge variant="outline">{selectedTicket.category.replaceAll("_", " ")}</Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      Tenant
                    </div>
                    <div className="mt-2 font-medium">{selectedTicket.tenantName ?? selectedTicket.tenantId}</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      Requester
                    </div>
                    <div className="mt-2 font-medium">{selectedTicket.userId}</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      Last updated
                    </div>
                    <div className="mt-2 font-medium">{formatDateTime(selectedTicket.updatedAt)}</div>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Issue Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg border p-4">
                        <div className="text-sm text-muted-foreground">AI sentiment</div>
                        <div className="mt-1 font-medium">{selectedTicket.aiAnalysis?.sentiment ?? "Not analyzed yet"}</div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-sm text-muted-foreground">Escalation recommendation</div>
                        <div className="mt-1 font-medium">
                          {selectedTicket.aiAnalysis?.escalation?.recommended ? "Recommended" : "Not recommended"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Saved AI Responses</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(selectedTicket.aiResponses ?? []).length === 0 ? (
                      <div className="text-sm text-muted-foreground">No AI drafts have been generated for this ticket yet.</div>
                    ) : (
                      (selectedTicket.aiResponses ?? []).map((response, index) => (
                        <div key={`${response.generatedAt}-${index}`} className="rounded-lg border p-4">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="outline">{response.type.replaceAll("_", " ")}</Badge>
                            <div className="text-xs text-muted-foreground">{formatDateTime(response.generatedAt)}</div>
                          </div>
                          <p className="mt-3 text-sm text-muted-foreground">{response.content}</p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" onClick={() => handleAnalyzeTicket(selectedTicket)}>
                    <Brain className="mr-2 h-4 w-4" />
                    Refresh Analysis
                  </Button>
                  <Button variant="outline" onClick={() => handleGenerateResponse(selectedTicket, "initial")}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Reply
                  </Button>
                  <Button variant="outline" onClick={() => handleEscalate(selectedTicket)}>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Escalate to Human
                  </Button>
                  <Button onClick={() => handleGenerateResponse(selectedTicket, "resolution")}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Generate Resolution
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
