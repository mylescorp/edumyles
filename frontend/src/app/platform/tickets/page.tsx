"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  MessageSquare, 
  Filter,
  Plus,
  Eye,
  Calendar,
  Layout,
  User,
  Building,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type ViewType = "table" | "kanban" | "calendar";

interface Ticket {
  _id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  tenantName: string;
  createdAt: number;
  slaResolutionDL: number;
  slaBreached?: boolean;
  assignedTo?: string;
}

export default function TicketsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [viewType, setViewType] = useState<ViewType>("table");
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    category: "all",
    assignedTo: "all",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: "",
    body: "",
    category: "technical",
    priority: "P2",
  });

  const createTicketMutation = useMutation(api.tickets.createTicket);
  const ticketsQuery = useQuery(api.tickets.getTickets, {
    status: filters.status === "all" ? undefined : filters.status,
    priority: filters.priority === "all" ? undefined : filters.priority,
    category: filters.category === "all" ? undefined : filters.category,
    assignedTo: filters.assignedTo === "all" ? undefined : filters.assignedTo,
    limit: 100,
  });

  const slaStatsQuery = useQuery(api.tickets.getSLAStats, {});

  // Filter tickets based on search and filters
  const filteredTickets = ticketsQuery?.data?.filter(ticket => {
    const matchesSearch = searchQuery === "" || 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.tenantName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filters.status === "all" || ticket.status === filters.status;
    const matchesPriority = filters.priority === "all" || ticket.priority === filters.priority;
    const matchesCategory = filters.category === "all" || ticket.category === filters.category;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  }) || [];

  // Debug information
  console.log("Debug Info:", {
    totalTickets: ticketsQuery?.data?.length || 0,
    filteredCount: filteredTickets.length,
    searchQuery,
    filters,
    userTenantId: user?.tenantId,
  });

  const handleCreateTicket = async () => {
    if (!newTicket.title.trim() || !newTicket.body.trim()) {
      return;
    }
    
    try {
      // For platform admin, we need to create or use a system tenant
      // Let's try using a string ID first, if that fails we'll create a tenant
      const tenantId = user?.tenantId || "system-tenant";
      
      await createTicketMutation({
        tenantId: tenantId,
        title: newTicket.title,
        body: newTicket.body,
        category: newTicket.category as any,
        priority: newTicket.priority as any,
      });
      
      setNewTicket({
        title: "",
        body: "",
        category: "technical",
        priority: "P2",
      });
      setIsCreateDialogOpen(false);
      
      // Show success message
      alert("Ticket created successfully!");
    } catch (error) {
      console.error("Failed to create ticket:", error);
      alert("Failed to create ticket: " + (error as Error).message);
    }
  };

  const KanbanView = () => {
    const columns = [
      { id: "open", title: "Open", status: "open" },
      { id: "in_progress", title: "In Progress", status: "in_progress" },
      { id: "pending_school", title: "Pending School", status: "pending_school" },
      { id: "resolved", title: "Resolved", status: "resolved" },
      { id: "closed", title: "Closed", status: "closed" },
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Kanban Board</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewType === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("table")}
            >
              <Layout className="h-4 w-4 mr-1" />
              Table
            </Button>
            <Button
              variant={viewType === "kanban" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("kanban")}
            >
              <Layout className="h-4 w-4 mr-1" />
              Kanban
            </Button>
            <Button
              variant={viewType === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("calendar")}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Calendar
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New Ticket
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {columns.map((column) => (
            <Card key={column.id} className="min-h-[400px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{column.title}</CardTitle>
                <Badge variant="secondary" className="w-fit">
                  {filteredTickets.filter(t => t.status === column.status).length}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredTickets
                  .filter(ticket => ticket.status === column.status)
                  .map((ticket) => (
                    <Card key={ticket._id} className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => router.push(`/platform/tickets/${ticket._id}`)}>
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge className={getPriorityColor(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {ticket.category}
                            </span>
                          </div>
                          <h4 className="font-medium text-sm line-clamp-2">{ticket.title}</h4>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Building className="h-3 w-3 mr-1" />
                            {ticket.tenantName}
                          </div>
                          <div className={`flex items-center text-xs ${formatTimeRemaining(ticket.slaResolutionDL).color}`}>
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimeRemaining(ticket.slaResolutionDL).text}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const CalendarView = () => {
    const getTicketsByDate = () => {
      const ticketsByDate: { [key: string]: typeof filteredTickets } = {};
      
      filteredTickets.forEach(ticket => {
        const date = new Date(ticket.createdAt).toDateString();
        if (!ticketsByDate[date]) {
          ticketsByDate[date] = [];
        }
        ticketsByDate[date].push(ticket);
      });
      
      return ticketsByDate;
    };

    const ticketsByDate = getTicketsByDate();
    const dates = Object.keys(ticketsByDate).sort();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Calendar View</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewType === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("table")}
            >
              <Layout className="h-4 w-4 mr-1" />
              Table
            </Button>
            <Button
              variant={viewType === "kanban" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("kanban")}
            >
              <Layout className="h-4 w-4 mr-1" />
              Kanban
            </Button>
            <Button
              variant={viewType === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("calendar")}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Calendar
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New Ticket
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {dates.map((date) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardTitle>
                <Badge variant="secondary">
                  {ticketsByDate[date].length} tickets
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ticketsByDate[date].map((ticket) => (
                    <div key={ticket._id} 
                         className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                         onClick={() => router.push(`/platform/tickets/${ticket._id}`)}>
                      <div className="flex items-center space-x-3">
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <div>
                          <h4 className="font-medium">{ticket.title}</h4>
                          <div className="flex items-center text-sm text-muted-foreground space-x-2">
                            <span>{ticket.category}</span>
                            <span>•</span>
                            <span>{ticket.tenantName}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status.replace("_", " ")}
                        </Badge>
                        <div className={`flex items-center text-xs ${formatTimeRemaining(ticket.slaResolutionDL).color}`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeRemaining(ticket.slaResolutionDL).text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "P0": return "bg-danger-bg text-danger border-danger";
      case "P1": return "bg-warning-bg text-em-accent-dark border-warning";
      case "P2": return "bg-info-bg text-info border-info";
      case "P3": return "bg-muted text-muted-foreground border-muted";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-info-bg text-info";
      case "in_progress": return "bg-warning-bg text-em-accent-dark";
      case "pending_school": return "bg-secondary-bg text-secondary";
      case "resolved": return "bg-success-bg text-success";
      case "closed": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatTimeRemaining = (deadline: number) => {
    const now = Date.now();
    const timeLeft = deadline - now;
    
    if (timeLeft < 0) {
      return { text: "Overdue", color: "text-danger" };
    }
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return { text: `${days}d ${hours % 24}h`, color: "text-warning" };
    }
    
    return { text: `${hours}h ${minutes}m`, color: hours < 2 ? "text-danger" : "text-warning" };
  };

  const TableView = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Ticket Queue</span>
            <Badge variant="secondary">{filteredTickets?.length}</Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Button
                variant={viewType === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewType("table")}
              >
                <Layout className="h-4 w-4 mr-1" />
                Table
              </Button>
              <Button
                variant={viewType === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewType("kanban")}
              >
                <Layout className="h-4 w-4 mr-1" />
                Kanban
              </Button>
              <Button
                variant={viewType === "calendar" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewType("calendar")}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Calendar
              </Button>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New Ticket
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6 p-4 bg-muted rounded-lg">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>
          <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="pending_school">Pending School</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="P0">P0 - Critical</SelectItem>
              <SelectItem value="P1">P1 - High</SelectItem>
              <SelectItem value="P2">P2 - Medium</SelectItem>
              <SelectItem value="P3">P3 - Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="data">Data</SelectItem>
              <SelectItem value="feature">Feature</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="account">Account</SelectItem>
              <SelectItem value="legal">Legal</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* SLA Stats */}
        {slaStatsQuery?.data && (
          <div className="grid grid-cols-5 gap-4 mb-6 p-4 bg-success-bg/10 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{slaStatsQuery.data?.total || 0}</div>
              <div className="text-sm text-muted-foreground">Total Tickets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-info">{slaStatsQuery.data?.open || 0}</div>
              <div className="text-sm text-muted-foreground">Open</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{slaStatsQuery.data?.atRisk || 0}</div>
              <div className="text-sm text-muted-foreground">At Risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-danger">{slaStatsQuery.data?.reached || 0}</div>
              <div className="text-sm text-muted-foreground">Breached</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-em-accent">{slaStatsQuery.data?.compliance || 0}%</div>
              <div className="text-sm text-muted-foreground">SLA Compliance</div>
            </div>
          </div>
        )}

        {/* Tickets Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Ticket</th>
                <th className="text-left p-3 font-semibold">School</th>
                <th className="text-left p-3 font-semibold">Priority</th>
                <th className="text-left p-3 font-semibold">Status</th>
                <th className="text-left p-3 font-semibold">Assigned To</th>
                <th className="text-left p-3 font-semibold">SLA</th>
                <th className="text-left p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets?.map((ticket) => {
                const timeRemaining = formatTimeRemaining(ticket.slaResolutionDL);
                return (
                  <tr key={ticket._id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-3">
                      <div className="max-w-xs">
                        <div className="font-medium">{ticket.title}</div>
                        <div className="text-sm text-muted-foreground">{ticket.category}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">{ticket.tenantName}</div>
                    </td>
                    <td className="p-3">
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        {ticket.assignedTo || "Unassigned"}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className={`flex items-center space-x-1 ${timeRemaining.color}`}>
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">{timeRemaining.text}</span>
                        {ticket.slaBreached && <AlertTriangle className="h-4 w-4 text-danger" />}
                      </div>
                    </td>
                    <td className="p-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/platform/tickets/${ticket._id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  if (ticketsQuery.isLoading) {
    return <div>Loading tickets...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Ticket Management" 
        description="Manage and track support tickets across all schools"
        breadcrumbs={[{ label: "Tickets", href: "/platform/tickets" }]}
      />
      
      {/* Create Ticket Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTicket.title}
                onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter ticket title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={newTicket.category} 
                onValueChange={(value) => setNewTicket(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="data">Data</SelectItem>
                  <SelectItem value="feature">Feature</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={newTicket.priority} 
                onValueChange={(value) => setNewTicket(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P0">P0 - Critical</SelectItem>
                  <SelectItem value="P1">P1 - High</SelectItem>
                  <SelectItem value="P2">P2 - Medium</SelectItem>
                  <SelectItem value="P3">P3 - Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="body">Description</Label>
              <Textarea
                id="body"
                value={newTicket.body}
                onChange={(e) => setNewTicket(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Describe the issue in detail"
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTicket}>
              Create Ticket
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Render the appropriate view */}
      {viewType === "table" && <TableView />}
      {viewType === "kanban" && <KanbanView />}
      {viewType === "calendar" && <CalendarView />}
    </div>
  );
}
