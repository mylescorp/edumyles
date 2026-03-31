"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { DataTable, Column } from "@/components/shared/DataTable";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Navigation } from "lucide-react";
import Link from "next/link";

type Route = {
  _id: string;
  name: string;
  stops: string[];
  status: string;
  capacity: number;
  activeStudents: number;
  driver?: string;
  vehicle?: string;
};

export default function TransportRoutesPage() {
  const { isLoading, sessionToken } = useAuth();

  const routes = usePlatformQuery(
    api.modules.transport.queries.listRoutes,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  );

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const routeList: Route[] = (routes as any[]) || [];

  const columns: Column<Route>[] = [
    {
      key: "name",
      header: "Route Name",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.stops.length} stop{row.stops.length !== 1 ? "s" : ""}
          </p>
        </div>
      ),
    },
    {
      key: "stops",
      header: "Stops",
      cell: (row) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {row.stops.slice(0, 3).map((stop, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {stop}
            </Badge>
          ))}
          {row.stops.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{row.stops.length - 3} more
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "capacity",
      header: "Utilisation",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {row.activeStudents}/{row.capacity}
          </span>
          <div className="w-16 bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-2 rounded-full"
              style={{
                width:
                  row.capacity > 0
                    ? `${Math.min((row.activeStudents / row.capacity) * 100, 100)}%`
                    : "0%",
              }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "driver",
      header: "Driver",
      cell: (row) => row.driver || <span className="text-muted-foreground">—</span>,
    },
    {
      key: "vehicle",
      header: "Vehicle",
      cell: (row) => row.vehicle || <span className="text-muted-foreground">—</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge
          variant={row.status === "active" ? "default" : "secondary"}
          className="capitalize"
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transport Routes"
        description="Manage all school transport routes"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Transport", href: "/admin/transport" },
          { label: "Routes" },
        ]}
        actions={
          <div className="flex gap-2">
            <Link href="/admin/transport/tracking">
              <Button variant="outline" className="gap-2">
                <Navigation className="h-4 w-4" />
                Live Tracking
              </Button>
            </Link>
            <Link href="/admin/transport/routes/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Route
              </Button>
            </Link>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{routeList.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-green-600">
              {routeList.filter((r) => r.status === "active").length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {routeList.reduce((sum, r) => sum + (r.capacity || 0), 0)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Routes table */}
      <Card>
        <CardHeader>
          <CardTitle>All Routes</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={routeList}
            columns={columns}
            searchable
            searchPlaceholder="Search routes..."
            emptyTitle="No routes found"
            emptyDescription="Create your first transport route to get started."
          />
        </CardContent>
      </Card>
    </div>
  );
}
