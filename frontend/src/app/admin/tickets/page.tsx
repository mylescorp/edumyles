"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Headphones, Plus, MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

type Ticket = {
  _id: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  createdAt: number;
  updatedAt: number;
  submittedByName?: string;
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "outline",
  in_progress: "secondary",
  resolved: "default",
  closed: "secondary",
};

const priorityColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  low: "outline",
  medium: "secondary",
  high: "destructive",
  urgent: "destructive",
};

export default function TicketsPage() {
  const { isLoading, sessionToken } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const tickets = useQuery(
    api.tickets.listTenantTickets,
    sessionToken ? { sessionToken, status: statusFilter === "all" ? undefined : statusFilter } : "skip"
  );

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const ticketList = (tickets as Ticket[]) ?? [];
  const openCount = ticketList.filter((t) => t.status === "open").length;
  const inProgressCount = ticketList.filter((t) => t.status === "in_progress").length;
  const resolvedCount = ticketList.filter((t) => t.status === "resolved").length;

  const columns: Column<Ticket>[] = [
    {
      key: "_id",
      header: "Ticket #",
      cell: (row) => (
        <Link
          href={`/admin/tickets/${row._id}`}
          className="font-mono text-primary hover:underline text-sm"
        >
          #{row._id.slice(-6).toUpperCase()}
        </Link>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      cell: (row) => (
        <Link href={`/admin/tickets/${row._id}`} className="hover:underline">
          {row.subject}
        </Link>
      ),
      sortable: true,
    },
    {
      key: "category",
      header: "Category",
      cell: (row) => <Badge variant="outline">{row.category}</Badge>,
    },
    {
      key: "priority",
      header: "Priority",
      cell: (row) => (
        <Badge variant={priorityColors[row.priority] ?? "outline"}>
          {row.priority}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={statusColors[row.status] ?? "outline"}>
          {row.status.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "submittedByName",
      header: "Submitted By",
      cell: (row) => row.submittedByName ?? "—",
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      cell: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <Link href={`/admin/tickets/${row._id}`}>
          <Button variant="ghost" size="sm">
            View
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Tickets"
        description="Manage and respond to support requests from staff and students"
        actions={
          <Link href="/admin/tickets/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Ticket
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{openCount}</p>
              <p className="text-sm text-muted-foreground">Open</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{inProgressCount}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{resolvedCount}</p>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable
        data={ticketList}
        columns={columns}
        searchable
        searchPlaceholder="Search tickets..."
        searchKey={(row) => `${row.subject} ${row.category}`}
        emptyTitle="No tickets found"
        emptyDescription="No support tickets have been submitted yet."
      />
    </div>
  );
}
