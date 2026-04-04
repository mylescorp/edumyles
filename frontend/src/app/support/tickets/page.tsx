"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Headphones,
  MessageSquare,
  Plus,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { DataTable, type Column } from "@/components/shared/DataTable";
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

type Ticket = {
  _id: string;
  title?: string;
  subject?: string;
  status: "open" | "in_progress" | "pending_school" | "resolved" | "closed";
  priority: "P0" | "P1" | "P2" | "P3";
  category: string;
  createdAt: number;
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "outline",
  in_progress: "secondary",
  pending_school: "secondary",
  resolved: "default",
  closed: "secondary",
};

const priorityLabels: Record<Ticket["priority"], string> = {
  P0: "Critical",
  P1: "High",
  P2: "Medium",
  P3: "Low",
};

export default function SupportTicketsPage() {
  const { isLoading, role, sessionToken } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const tickets = useQuery(
    api.tickets.listTenantTickets,
    sessionToken
      ? {
          sessionToken,
          status: statusFilter === "all" ? undefined : (statusFilter as Ticket["status"]),
        }
      : "skip"
  );

  const ticketList = useMemo(() => ((tickets as Ticket[]) ?? []), [tickets]);

  if (isLoading || (sessionToken && tickets === undefined)) {
    return <LoadingSkeleton variant="page" />;
  }

  const openCount = ticketList.filter((ticket) => ticket.status === "open").length;
  const inProgressCount = ticketList.filter((ticket) => ticket.status === "in_progress").length;
  const resolvedCount = ticketList.filter(
    (ticket) => ticket.status === "resolved" || ticket.status === "closed"
  ).length;

  const columns: Column<Ticket>[] = [
    {
      key: "_id",
      header: "Ticket #",
      cell: (row) => <span className="font-mono text-sm">#{row._id.slice(-6).toUpperCase()}</span>,
    },
    {
      key: "title",
      header: "Subject",
      sortable: true,
      cell: (row) => row.title ?? row.subject ?? "Untitled ticket",
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
        <Badge variant={row.priority === "P0" || row.priority === "P1" ? "destructive" : "secondary"}>
          {priorityLabels[row.priority]}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={statusColors[row.status] ?? "outline"}>{row.status.replace("_", " ")}</Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      cell: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Tickets"
        description="Track issues submitted to your school and platform support queues."
        actions={
          <Link href="/support/tickets/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Ticket
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{openCount}</p>
              <p className="text-sm text-muted-foreground">Open</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{inProgressCount}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{resolvedCount}</p>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Headphones className="h-4 w-4" />
              <span>Signed in as {role ?? "user"}</span>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="pending_school">Pending School</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable
            data={ticketList}
            columns={columns}
            searchable
            searchPlaceholder="Search support tickets..."
            searchKey={(row) => `${row.title ?? row.subject ?? ""} ${row.category} ${row.status}`}
            emptyTitle="No tickets found"
            emptyDescription="No support tickets have been submitted yet."
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
          <MessageSquare className="mt-0.5 h-4 w-4" />
          <p>
            This shared workspace gives school-facing roles a real support entry point instead of a dead
            navigation link. Platform agents continue to operate from the platform ticket queue.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

