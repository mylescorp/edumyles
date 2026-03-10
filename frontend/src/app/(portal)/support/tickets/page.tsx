"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
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
  Calendar
} from "lucide-react";

interface Ticket {
  _id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt: number;
  slaResolutionDL: number;
  slaBreached?: boolean;
  assignedTo?: string;
}

export default function SchoolTicketsPage() {
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    category: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  // TODO: Get actual tenant ID from auth context
  const tenantId = "temp-tenant-id" as any;
  
  const { data: tickets, isLoading } = useQuery(api.tickets.getTenantTickets, {
    tenantId,
    status: filters.status || undefined,
  });

  // Filter tickets based on search
  const filteredTickets = tickets?.filter(ticket => 
    ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.category.toLowerCase().includes(searchQuery.toLowerCase())
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <Clock className="h-4 w-4" />;
      case "in_progress": return <Clock className="h-4 w-4" />;
      case "pending_school": return <Clock className="h-4 w-4" />;
      case "resolved": return <CheckCircle className="h-4 w-4" />;
      case "closed": return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <div>Loading tickets...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Support Tickets" 
        description="Track and manage your support requests"
        breadcrumbs={[
          { label: "Support", href: "/support" },
          { label: "Tickets", href: "/support/tickets" }
        ]}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-info">
              {filteredTickets?.filter(t => t.status === "open").length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Open Tickets</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-warning">
              {filteredTickets?.filter(t => t.status === "in_progress").length || 0}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-success">
              {filteredTickets?.filter(t => t.status === "resolved").length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-danger">
              {filteredTickets?.filter(t => t.slaBreached).length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>My Tickets</span>
              <Badge variant="secondary">{filteredTickets?.length}</Badge>
            </div>
            <Button asChild>
              <a href="/support/tickets/create">
                <Plus className="h-4 w-4 mr-1" />
                New Ticket
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 p-4 bg-muted rounded-lg">
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
                <SelectValue placeholder="All Status" />
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
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priority</SelectItem>
                <SelectItem value="P0">P0 - Critical</SelectItem>
                <SelectItem value="P1">P1 - High</SelectItem>
                <SelectItem value="P2">P2 - Medium</SelectItem>
                <SelectItem value="P3">P3 - Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardContent className="p-0">
          {filteredTickets && filteredTickets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Ticket</th>
                    <th className="text-left p-4 font-semibold">Priority</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Created</th>
                    <th className="text-left p-4 font-semibold">Response Due</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => {
                    const timeRemaining = formatTimeRemaining(ticket.slaResolutionDL);
                    return (
                      <tr key={ticket._id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{ticket.title}</div>
                            <div className="text-sm text-muted-foreground">{ticket.category}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(ticket.status)}
                            <Badge className={getStatusColor(ticket.status)}>
                              {ticket.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className={`flex items-center space-x-1 ${timeRemaining.color}`}>
                            <Clock className="h-4 w-4" />
                            <span className="text-sm font-medium">{timeRemaining.text}</span>
                            {ticket.slaBreached && <AlertTriangle className="h-4 w-4 text-danger" />}
                          </div>
                        </td>
                        <td className="p-4">
                          <Button asChild variant="outline" size="sm">
                            <a href={`/support/tickets/${ticket._id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </a>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || filters.status || filters.priority 
                  ? "No tickets match your current filters." 
                  : "You haven't created any support tickets yet."
                }
              </p>
              <Button asChild>
                <a href="/support/tickets/create">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Your First Ticket
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
