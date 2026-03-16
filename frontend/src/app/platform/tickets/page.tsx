"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  Search,
  Plus,
  Eye,
  Table,
  Grid3X3,
  CalendarDays,
  Download,
  RefreshCw
} from "lucide-react";

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
  const { sessionToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewType, setViewType] = useState<"table" | "kanban" | "calendar">("table");

  // Real Convex query
  const ticketsData = usePlatformQuery(
    api.platform.support.queries.getAISupportTickets,
    { sessionToken: sessionToken || "" }
  );

  if (!ticketsData) return <div className="p-6">Loading...</div>;

  // Map backend data to component Ticket shape
  const allTickets: Ticket[] = ticketsData.map((t: any) => ({
    _id: t._id,
    title: t.title ?? t.subject ?? "Untitled",
    category: t.category ?? "general",
    priority: t.priority === "urgent" ? "P0" : t.priority === "high" ? "P1" : t.priority === "medium" ? "P2" : "P3",
    status: t.status ?? "open",
    tenantName: t.tenantName ?? t.tenantId ?? "Unknown",
    createdAt: t.createdAt ?? Date.now(),
    slaResolutionDL: t.slaResolutionDL ?? t.createdAt + 7 * 24 * 60 * 60 * 1000,
    slaBreached: t.slaBreached ?? false,
    assignedTo: t.assignedTo,
  }));

  // Filter tickets based on search
  const filteredTickets = allTickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.tenantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "P0": return "bg-red-100 text-red-700 border-red-200";
      case "P1": return "bg-orange-100 text-orange-700 border-orange-200";
      case "P2": return "bg-blue-100 text-blue-700 border-blue-200";
      case "P3": return "bg-gray-100 text-gray-700 border-gray-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-700 border-blue-200";
      case "in_progress": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "pending_school": return "bg-purple-100 text-purple-700 border-purple-200";
      case "resolved": return "bg-green-100 text-green-700 border-green-200";
      case "closed": return "bg-gray-100 text-gray-700 border-gray-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatTimeRemaining = (deadline: number) => {
    const now = Date.now();
    const timeLeft = deadline - now;
    
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
      ["ID", "Title", "School", "Priority", "Status", "Category"],
      ...filteredTickets.map(ticket => [
        ticket._id,
        ticket.title,
        ticket.tenantName,
        ticket.priority,
        ticket.status,
        ticket.category
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tickets.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Ticket Management" 
        description="Manage and track support tickets across all schools"
        breadcrumbs={[{ label: "Tickets", href: "/platform/tickets" }]}
      />
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Ticket Queue</span>
              <Badge variant="secondary">{filteredTickets.length}</Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewType === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewType("table")}
              >
                <Table className="h-4 w-4 mr-1" />
                Table
              </Button>
              <Button
                variant={viewType === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewType("kanban")}
              >
                <Grid3X3 className="h-4 w-4 mr-1" />
                Kanban
              </Button>
              <Button
                variant={viewType === "calendar" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewType("calendar")}
              >
                <CalendarDays className="h-4 w-4 mr-1" />
                Calendar
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-1" />
                New Ticket
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Actions */}
          <div className="flex items-center justify-between mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets by title or school..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>

          {/* SLA Stats */}
          <div className="grid grid-cols-5 gap-4 mb-6 p-4 bg-green-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{allTickets.length}</div>
              <div className="text-sm text-muted-foreground">Total Tickets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {allTickets.filter(t => t.status === "open").length}
              </div>
              <div className="text-sm text-muted-foreground">Open</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {allTickets.filter(t => t.priority === "P0" || t.priority === "P1").length}
              </div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">0</div>
              <div className="text-sm text-muted-foreground">Breached</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">85%</div>
              <div className="text-sm text-muted-foreground">SLA Compliance</div>
            </div>
          </div>

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
                {filteredTickets.map((ticket) => {
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
                          {ticket.slaBreached && <AlertTriangle className="h-4 w-4 text-red-600" />}
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
    </div>
  );
}
