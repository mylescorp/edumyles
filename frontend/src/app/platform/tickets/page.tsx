"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  MessageSquare, 
  Filter,
  Plus,
  Eye,
  Calendar,
  Layout
} from "lucide-react";

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
  const [viewType, setViewType] = useState<ViewType>("table");
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    category: "",
    assignedTo: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tickets, isLoading } = useQuery(api.tickets.getTickets, {
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    category: filters.category || undefined,
    assignedTo: filters.assignedTo || undefined,
    limit: 100,
  });

  const { data: slaStats } = useQuery(api.tickets.getSLAStats, {});

  // Filter tickets based on search
  const filteredTickets = tickets?.filter(ticket => 
    ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.tenantName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
            <Button>
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
              <SelectItem value="">All Status</SelectItem>
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
              <SelectItem value="">All Priority</SelectItem>
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
              <SelectItem value="">All Categories</SelectItem>
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
        {slaStats && (
          <div className="grid grid-cols-5 gap-4 mb-6 p-4 bg-success-bg/10 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{slaStats.total}</div>
              <div className="text-sm text-muted-foreground">Total Tickets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-info">{slaStats.open}</div>
              <div className="text-sm text-muted-foreground">Open</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{slaStats.atRisk}</div>
              <div className="text-sm text-muted-foreground">At Risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-danger">{slaStats.breached}</div>
              <div className="text-sm text-muted-foreground">Breached</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-em-accent">{slaStats.compliance}%</div>
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
                      <Button variant="outline" size="sm">
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

  if (isLoading) {
    return <div>Loading tickets...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Ticket Management" 
        description="Manage and track support tickets across all schools"
        breadcrumbs={[{ label: "Tickets", href: "/platform/tickets" }]}
      />
      
      <TableView />
    </div>
  );
}
