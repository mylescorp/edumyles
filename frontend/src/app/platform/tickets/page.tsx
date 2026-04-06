"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Clock3, LifeBuoy, Plus, Search, RefreshCw, LayoutGrid, Rows3 } from "lucide-react";

type SupportTicket = {
  _id: string;
  tenantId: string;
  userId: string;
  moduleId?: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  assignedTo?: string;
  slaDueAt?: number;
  resolvedAt?: number;
  source?: string;
  createdAt: number;
  updatedAt: number;
};

function statusTone(status: SupportTicket["status"]) {
  switch (status) {
    case "open":
      return "bg-blue-100 text-blue-700";
    case "in_progress":
      return "bg-amber-100 text-amber-700";
    case "resolved":
      return "bg-green-100 text-green-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function priorityTone(priority: SupportTicket["priority"]) {
  switch (priority) {
    case "critical":
      return "bg-red-100 text-red-700";
    case "high":
      return "bg-orange-100 text-orange-700";
    case "medium":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function PlatformTicketsPage() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SupportTicket["status"]>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | SupportTicket["priority"]>("all");
  const [pageLoadedAt] = useState(() => Date.now());
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [isRefreshing, startRefreshing] = useTransition();

  const tickets = usePlatformQuery(
    api.modules.platform.support.getSupportTickets,
    {
      sessionToken: sessionToken || "",
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    },
    !!sessionToken
  ) as SupportTicket[] | undefined;

  const tenants = usePlatformQuery(
    api.platform.tenants.queries.listAllTenants,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as any[] | undefined;

  const ticketRows = useMemo(() => tickets ?? [], [tickets]);
  const tenantRows = useMemo(() => tenants ?? [], [tenants]);

  const tenantNameById = useMemo(() => {
    return new Map(tenantRows.map((tenant: any) => [tenant.tenantId, tenant.name ?? tenant.tenantId]));
  }, [tenantRows]);

  const filteredTickets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return ticketRows.filter((ticket) => {
      const matchesSearch =
        query.length === 0 ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.tenantId.toLowerCase().includes(query) ||
        (ticket.assignedTo ?? "").toLowerCase().includes(query) ||
        (tenantNameById.get(ticket.tenantId) ?? "").toLowerCase().includes(query);

      const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [priorityFilter, searchQuery, tenantNameById, ticketRows]);

  const metrics = useMemo(() => {
    const openCount = ticketRows.filter((ticket) => ticket.status === "open").length;
    const inProgressCount = ticketRows.filter((ticket) => ticket.status === "in_progress").length;
    const overdueCount = ticketRows.filter((ticket) => typeof ticket.slaDueAt === "number" && ticket.slaDueAt < pageLoadedAt && ticket.status !== "resolved" && ticket.status !== "closed").length;
    const resolvedCount = ticketRows.filter((ticket) => ticket.status === "resolved" || ticket.status === "closed").length;

    return { openCount, inProgressCount, overdueCount, resolvedCount };
  }, [pageLoadedAt, ticketRows]);

  const kanbanColumns = useMemo(
    () =>
      ["open", "in_progress", "resolved", "closed"].map((status) => ({
        status: status as SupportTicket["status"],
        label: status.replace("_", " "),
        tickets: filteredTickets.filter((ticket) => ticket.status === status),
      })),
    [filteredTickets]
  );

  if (!sessionToken || tickets === undefined || tenants === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tickets"
        description="Manage live support tickets across all tenants from the unified support backend."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Tickets", href: "/platform/tickets" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => startRefreshing(() => router.refresh())}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link href="/platform/tickets/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Ticket
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{ticketRows.length}</p>
              <p className="text-sm text-muted-foreground">All tickets</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.openCount + metrics.inProgressCount}</p>
              <p className="text-sm text-muted-foreground">Active queue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.overdueCount}</p>
              <p className="text-sm text-muted-foreground">Past SLA</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-700">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.resolvedCount}</p>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Support queue</CardTitle>
              <CardDescription>Search and filter the platform-wide support ticket stream.</CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "kanban")}>
                <TabsList>
                  <TabsTrigger value="list" className="gap-2">
                    <Rows3 className="h-4 w-4" />
                    List
                  </TabsTrigger>
                  <TabsTrigger value="kanban" className="gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    Kanban
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative min-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search subject, tenant, or assignee"
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as typeof priorityFilter)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <EmptyState
              icon={LifeBuoy}
              title="No tickets match this view"
              description="Adjust the filters or create a new support ticket."
            />
          ) : viewMode === "kanban" ? (
            <div className="grid gap-4 xl:grid-cols-4">
              {kanbanColumns.map((column) => (
                <div key={column.status} className="space-y-3 rounded-xl border bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge className={statusTone(column.status)}>{column.label}</Badge>
                    <span className="text-sm text-muted-foreground">{column.tickets.length}</span>
                  </div>
                  {column.tickets.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      No tickets in this column.
                    </div>
                  ) : (
                    column.tickets.map((ticket) => (
                      <div key={ticket._id} className="rounded-lg border bg-background p-3 shadow-sm">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={priorityTone(ticket.priority)}>{ticket.priority}</Badge>
                            {typeof ticket.slaDueAt === "number" && ticket.slaDueAt < pageLoadedAt ? (
                              <Badge variant="outline" className="border-red-500/20 bg-red-500/10 text-red-700">
                                Past SLA
                              </Badge>
                            ) : null}
                          </div>
                          <p className="font-medium">{ticket.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {tenantNameById.get(ticket.tenantId) ?? ticket.tenantId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Assigned to {ticket.assignedTo || "Unassigned"}
                          </p>
                          <Link href={`/platform/tickets/${ticket._id}`}>
                            <Button size="sm" variant="outline" className="mt-1 w-full">
                              Open ticket
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <div key={ticket._id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{ticket.subject}</p>
                        <Badge className={statusTone(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
                        <Badge className={priorityTone(ticket.priority)}>{ticket.priority}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>{tenantNameById.get(ticket.tenantId) ?? ticket.tenantId}</span>
                        <span>Assigned to {ticket.assignedTo || "Unassigned"}</span>
                        <span>Created {new Date(ticket.createdAt).toLocaleDateString("en-KE")}</span>
                        <span>
                          {ticket.slaDueAt
                            ? `SLA due ${new Date(ticket.slaDueAt).toLocaleString("en-KE")}`
                            : "No SLA due date"}
                        </span>
                      </div>
                    </div>
                    <Link href={`/platform/tickets/${ticket._id}`}>
                      <Button variant="outline">View ticket</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
