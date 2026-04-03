"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { DataTable, Column } from "@/components/shared/DataTable";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { MapPin, Plus, Navigation, Route as RouteIcon } from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

type Route = {
  _id: string;
  name: string;
  stops: string[];
  createdAt?: number;
  updatedAt?: number;
};

export default function TransportRoutesPage() {
  const { isLoading, sessionToken } = useAuth();
  const { toast } = useToast();
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [routeName, setRouteName] = useState("");
  const [routeStops, setRouteStops] = useState("");
  const [saving, setSaving] = useState(false);

  const routes = useQuery(
    api.modules.transport.queries.listRoutes,
    sessionToken ? { sessionToken } : "skip"
  );
  const updateRoute = useMutation(api.modules.transport.mutations.updateRoute);

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const routeList: Route[] = (routes as any[]) || [];
  const routeSummary = useMemo(() => ({
    totalStops: routeList.reduce((sum, route) => sum + route.stops.length, 0),
    active: routeList.filter((r) => r.stops.length > 0).length,
  }), [routeList]);

  const openEditDialog = (route: Route) => {
    setSelectedRoute(route);
    setRouteName(route.name);
    setRouteStops(route.stops.join(", "));
  };

  const handleSaveRoute = async () => {
    if (!selectedRoute) return;
    const normalizedName = routeName.trim();
    const normalizedStops = routeStops
      .split(",")
      .map((stop) => stop.trim())
      .filter(Boolean);

    if (!normalizedName || normalizedStops.length === 0) {
      toast({
        title: "Route details required",
        description: "Provide a route name and at least one stop.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await updateRoute({
        routeId: selectedRoute._id as Id<"transportRoutes">,
        name: normalizedName,
        stops: normalizedStops,
      });
      toast({
        title: "Route updated",
        description: `${normalizedName} now has ${normalizedStops.length} configured stop${normalizedStops.length === 1 ? "" : "s"}.`,
      });
      setSelectedRoute(null);
    } catch (error) {
      toast({
        title: "Unable to update route",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

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
      key: "stopCount",
      header: "Stop Count",
      cell: (row) => (
        <span className="text-sm font-medium">{row.stops.length}</span>
      ),
    },
    {
      key: "updatedAt",
      header: "Last Updated",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline">Configured</Badge>
          <Button size="sm" variant="ghost" onClick={() => openEditDialog(row)}>
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
              {routeSummary.active}
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
              {routeSummary.totalStops}
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
            searchKey={(row) => `${row.name} ${row.stops.join(" ")}`}
            emptyTitle="No routes found"
            emptyDescription="Create your first transport route to get started."
          />
        </CardContent>
      </Card>

      <Dialog open={!!selectedRoute} onOpenChange={(open) => !open && setSelectedRoute(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transport Route</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="route-name">Route name</Label>
              <Input
                id="route-name"
                value={routeName}
                onChange={(event) => setRouteName(event.target.value)}
                placeholder="Eastern Bypass Route"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="route-stops">Stops</Label>
              <Input
                id="route-stops"
                value={routeStops}
                onChange={(event) => setRouteStops(event.target.value)}
                placeholder="Gate A, Kasarani Stage, Mwiki"
              />
              <p className="text-xs text-muted-foreground">
                Separate stops with commas in the order the vehicle should follow.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setSelectedRoute(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveRoute} disabled={saving}>
                {saving ? "Saving..." : "Save route"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
