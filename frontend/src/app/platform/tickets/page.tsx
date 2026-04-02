"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  Download,
  Eye,
  Grid3X3,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Table,
} from "lucide-react";
import { toast } from "sonner";

type TicketStatus = "all" | "open" | "in_progress" | "resolved" | "closed" | "escalated";
type TicketCategory = "all" | "technical" | "billing" | "account" | "feature_request" | "bug_report" | "general";
type TicketPriority = "all" | "urgent" | "high" | "medium" | "low";

interface Ticket {
  _id: string;
  title: string;
  category: Exclude<TicketCategory, "all">;
  priority: Exclude<TicketPriority, "all">;
  status: Exclude<TicketStatus, "all">;
  tenantId: string;
  tenantName: string;
  createdAt: number;
  slaResolutionDL: number;
  slaBreached?: boolean;
  assignedTo?: string;
}

const CATEGORY_LABELS: Record<Exclude<TicketCategory, "all">, string> = {
  technical: "Technical",
  billing: "Billing",
  account: "Account",
  feature_request: "Feature Request",
  bug_report: "Bug Report",
  general: "General",
};

const PRIORITY_LABELS: Record<Exclude<TicketPriority, "all">, string> = {
  urgent: "P0",
  high: "P1",
  medium: "P2",
  low: "P3",
};

export default function TicketsPage() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewType, setViewType] = useState<"table" | "kanban" | "calendar">("table");
  const [statusFilter, setStatusFilter] = useState<TicketStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority>("all");
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory>("all");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const ticketsData = usePlatformQuery(
    api.platform.support.queries.getAISupportTickets,
    sessionToken
      ? {
          sessionToken,
          ...(statusFilter !== "all" ? { status: statusFilter } : {}),
          ...(priorityFilter !== "all" ? { priority: priorityFilter } : {}),
          ...(categoryFilter !== "all" ? { category: categoryFilter } : {}),
          ...(tenantFilter !== "all" ? { tenantId: tenantFilter } : {}),
          ...(assigneeFilter !== "all" ? { assignedTo: assigneeFilter } : {}),
          limit: 200,
        }
      : "skip",
    !!sessionToken
  );

  const tenants = usePlatformQuery(
    api.platform.tenants.queries.listAllTenants,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  );

  const platformUsers = usePlatformQuery(
    api.platform.users.queries.listAllUsers,
    sessionToken ? { sessionToken, status: "active" } : "skip",
    !!sessionToken
  );

  const allTickets = useMemo(
    () =>
      ((ticketsData ?? []) as any[]).map((ticket) => ({
        _id: String(ticket._id),
        title: ticket.title ?? ticket.subject ?? "Untitled",
        category: (ticket.category ?? "general") as Ticket["category"],
        priority: (ticket.priority ?? "medium") as Ticket["priority"],
        status: (ticket.status ?? "open") as Ticket["status"],
        tenantId: ticket.tenantId,
        tenantName: ticket.tenantName ?? ticket.tenantId ?? "Unknown",
        createdAt: ticket.createdAt ?? Date.now(),
        slaResolutionDL: ticket.slaResolutionDL ?? ticket.createdAt + 7 * 24 * 60 * 60 * 1000,
        slaBreached: ticket.slaBreached ?? false,
        assignedTo: ticket.assignedTo,
      })) as Ticket[],
    [ticketsData]
  );

  const filteredTickets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return allTickets;

    return allTickets.filter((ticket) =>
      [
        ticket.title,
        ticket.tenantName,
        ticket.assignedTo ?? "",
        ticket.category,
        ticket.status,
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [allTickets, searchQuery]);

  const now = Date.now();
  const breachedCount = filteredTickets.filter(
    (ticket) =>
      ticket.slaBreached ||
      ((ticket.status === "open" || ticket.status === "in_progress" || ticket.status === "escalated") &&
        ticket.slaResolutionDL < now)
  ).length;
  const resolvedTickets = filteredTickets.filter(
    (ticket) => ticket.status === "resolved" || ticket.status === "closed"
  );
  const slaCompliance =
    resolvedTickets.length > 0
      ? Math.round(
          ((resolvedTickets.length -
            resolvedTickets.filter((ticket) => ticket.slaBreached).length) /
            resolvedTickets.length) *
            100
        )
      : 100;

  const getPriorityColor = (priority: Ticket["priority"]) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "low":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusColor = (status: Ticket["status"]) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "escalated":
        return "bg-red-100 text-red-700 border-red-200";
      case "resolved":
        return "bg-green-100 text-green-700 border-green-200";
      case "closed":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatTimeRemaining = (deadline: number) => {
    const timeLeft = deadline - Date.now();
    if (timeLeft < 0) {
      return { text: "Overdue", color: "text-red-600" };
    }

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return { text: `${days}d ${hours % 24}h`, color: "text-yellow-600" };
    }

    return { text: `${hours}h ${minutes}m`, color: hours < 2 ? "text-red-600" : "text-yellow-600" };
  };

  const handleExport = () => {
    const csvContent = [
      ["ID", "Title", "School", "Priority", "Status", "Category", "Assigned To"],
      ...filteredTickets.map((ticket) => [
        ticket._id,
        ticket.title,
        ticket.tenantName,
        PRIORITY_LABELS[ticket.priority],
        ticket.status,
        CATEGORY_LABELS[ticket.category],
        ticket.assignedTo ?? "Unassigned",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "platform-support-tickets.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    toast.info("Ticket data refreshes automatically from Convex. Adjust a filter to reload a scoped view.");
  };

  if (!sessionToken || ticketsData === undefined || tenants === undefined || platformUsers === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ticket Management"
        description="Manage and track support tickets across all schools."
        breadcrumbs={[{ label: "Platform", href: "/platform" }, { label: "Tickets", href: "/platform/tickets" }]}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Ticket Queue</span>
              <Badge variant="secondary">{filteredTickets.length}</Badge>
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={viewType === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewType("table")}
              >
                <Table className="mr-1 h-4 w-4" />
                Table
              </Button>
              <Button
                variant={viewType === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setViewType("kanban");
                  toast.info("Kanban layout is not implemented yet. Staying on the live table view.");
                }}
              >
                <Grid3X3 className="mr-1 h-4 w-4" />
                Kanban
              </Button>
              <Button
                variant={viewType === "calendar" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setViewType("calendar");
                  toast.info("Calendar layout is not implemented yet. Staying on the live table view.");
                }}
              >
                <CalendarDays className="mr-1 h-4 w-4" />
                Calendar
              </Button>
              <Button onClick={() => router.push("/platform/tickets/create")}>
                <Plus className="mr-1 h-4 w-4" />
                New Ticket
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-4 rounded-lg bg-muted p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets by title, tenant, assignee, or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full xl:w-96"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="mr-1 h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TicketStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as TicketPriority)}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">P0 - Critical</SelectItem>
                  <SelectItem value="high">P1 - High</SelectItem>
                  <SelectItem value="medium">P2 - Medium</SelectItem>
                  <SelectItem value="low">P3 - Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as TicketCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={tenantFilter} onValueChange={setTenantFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tenant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tenants</SelectItem>
                  {(tenants as any[]).map((tenant) => (
                    <SelectItem key={tenant.tenantId} value={tenant.tenantId}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {(platformUsers as any[]).map((platformUser) => (
                    <SelectItem key={platformUser._id} value={platformUser.email}>
                      {`${platformUser.firstName ?? ""} ${platformUser.lastName ?? ""}`.trim() || platformUser.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-green-50 p-4 lg:grid-cols-5">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{filteredTickets.length}</div>
              <div className="text-sm text-muted-foreground">Visible Tickets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredTickets.filter((ticket) => ticket.status === "open").length}
              </div>
              <div className="text-sm text-muted-foreground">Open</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredTickets.filter((ticket) => ticket.priority === "urgent" || ticket.priority === "high").length}
              </div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{breachedCount}</div>
              <div className="text-sm text-muted-foreground">Breached / Overdue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{slaCompliance}%</div>
              <div className="text-sm text-muted-foreground">Resolved SLA Compliance</div>
            </div>
          </div>

          {filteredTickets.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No tickets matched the current filters.
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left font-semibold">Ticket</th>
                    <th className="p-3 text-left font-semibold">School</th>
                    <th className="p-3 text-left font-semibold">Priority</th>
                    <th className="p-3 text-left font-semibold">Status</th>
                    <th className="p-3 text-left font-semibold">Assigned To</th>
                    <th className="p-3 text-left font-semibold">SLA</th>
                    <th className="p-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => {
                    const timeRemaining = formatTimeRemaining(ticket.slaResolutionDL);

                    return (
                      <tr key={ticket._id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-3">
                          <div className="max-w-xs">
                            <div className="font-medium">{ticket.title}</div>
                            <div className="text-sm text-muted-foreground">{CATEGORY_LABELS[ticket.category]}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{ticket.tenantName}</div>
                        </td>
                        <td className="p-3">
                          <Badge className={getPriorityColor(ticket.priority)}>{PRIORITY_LABELS[ticket.priority]}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{ticket.assignedTo || "Unassigned"}</div>
                        </td>
                        <td className="p-3">
                          <div className={`flex items-center space-x-1 ${timeRemaining.color}`}>
                            <Clock className="h-4 w-4" />
                            <span className="text-sm font-medium">{timeRemaining.text}</span>
                            {(ticket.slaBreached || ticket.slaResolutionDL < now) ? (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            ) : null}
                          </div>
                        </td>
                        <td className="p-3">
                          <Button variant="outline" size="sm" onClick={() => router.push(`/platform/tickets/${ticket._id}`)}>
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
