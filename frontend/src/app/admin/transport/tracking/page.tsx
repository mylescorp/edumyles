"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bus,
  MapPin,
  Users,
  Navigation,
  AlertTriangle,
  CheckCircle,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Route = {
  _id: string;
  tenantId: string;
  name: string;
  stops?: string[];
  status?: string;
  capacity?: number;
  driverId?: string;
  vehicleId?: string;
  [key: string]: unknown;
};

type Vehicle = {
  _id: string;
  tenantId: string;
  plateNumber?: string;
  capacity?: number;
  status?: string;
  make?: string;
  model?: string;
  driverId?: string;
  [key: string]: unknown;
};

type Driver = {
  _id: string;
  tenantId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: string;
  licenseNumber?: string;
  assignedVehicleId?: string;
  [key: string]: unknown;
};

export default function TransportTrackingPage() {
  const { isLoading, sessionToken } = useAuth();

  const routes = useQuery(
    api.modules.transport.queries.listRoutes,
    sessionToken ? { sessionToken } : "skip"
  );

  const vehicles = useQuery(
    api.modules.transport.queries.listVehicles,
    sessionToken ? { sessionToken } : "skip"
  );

  const drivers = useQuery(
    api.modules.transport.queries.listDrivers,
    sessionToken ? { sessionToken } : "skip"
  );

  const [detailItem, setDetailItem] = useState<{ type: "route" | "vehicle" | "driver"; data: Route | Vehicle | Driver } | null>(null);

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const allRoutes = (routes as Route[]) || [];
  const allVehicles = (vehicles as Vehicle[]) || [];
  const allDrivers = (drivers as Driver[]) || [];

  const stats = {
    totalRoutes: allRoutes.length,
    activeRoutes: allRoutes.filter((r) => r.status === "active").length,
    totalVehicles: allVehicles.length,
    activeVehicles: allVehicles.filter((v) => v.status === "active").length,
    maintenanceVehicles: allVehicles.filter((v) => v.status === "maintenance").length,
    totalDrivers: allDrivers.length,
    activeDrivers: allDrivers.filter((d) => d.status === "active").length,
  };

  const routeColumns: Column<Route>[] = [
    {
      key: "name",
      header: "Route",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          {row.stops && (
            <p className="text-sm text-muted-foreground">
              {(row.stops as string[]).length} stop{(row.stops as string[]).length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "capacity",
      header: "Capacity",
      cell: (row) => (
        <span className="text-sm font-medium">{row.capacity ?? "—"}</span>
      ),
    },
    {
      key: "driverId",
      header: "Driver",
      cell: (row) => (
        <span className="text-sm">{(row.driverId as string) ?? "—"}</span>
      ),
    },
    {
      key: "vehicleId",
      header: "Vehicle",
      cell: (row) => (
        <span className="text-sm">{(row.vehicleId as string) ?? "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge
          variant={
            row.status === "active"
              ? "default"
              : row.status === "inactive"
              ? "secondary"
              : "outline"
          }
        >
          {(row.status as string) ?? "unknown"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setDetailItem({ type: "route", data: row })}>View</Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/transport/routes?edit=${row._id}`}>Edit</Link>
          </Button>
        </div>
      ),
    },
  ];

  const vehicleColumns: Column<Vehicle>[] = [
    {
      key: "plateNumber",
      header: "Vehicle",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium">{row.plateNumber ?? "—"}</p>
          {(row.make || row.model) && (
            <p className="text-sm text-muted-foreground">
              {[row.make, row.model].filter(Boolean).join(" ")}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "capacity",
      header: "Capacity",
      cell: (row) => (
        <span className="text-sm font-medium">{row.capacity ?? "—"} seats</span>
      ),
    },
    {
      key: "driverId",
      header: "Driver",
      cell: (row) => (
        <span className="text-sm">{(row.driverId as string) ?? "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge
          variant={
            row.status === "active"
              ? "default"
              : row.status === "maintenance"
              ? "secondary"
              : "outline"
          }
        >
          {(row.status as string) ?? "unknown"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setDetailItem({ type: "vehicle", data: row })}>Track</Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/transport?edit=${row._id}`}>Edit</Link>
          </Button>
        </div>
      ),
    },
  ];

  const driverColumns: Column<Driver>[] = [
    {
      key: "name",
      header: "Driver",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium">
            {[row.firstName, row.lastName].filter(Boolean).join(" ") || "—"}
          </p>
          {row.licenseNumber && (
            <p className="text-sm text-muted-foreground">
              License: {row.licenseNumber as string}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "phone",
      header: "Contact",
      cell: (row) => (
        <span className="text-sm">{(row.phone as string) ?? "—"}</span>
      ),
    },
    {
      key: "assignedVehicleId",
      header: "Vehicle",
      cell: (row) => (
        <span className="text-sm">{(row.assignedVehicleId as string) ?? "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge
          variant={
            row.status === "active"
              ? "default"
              : row.status === "on_leave"
              ? "secondary"
              : "outline"
          }
        >
          {((row.status as string) ?? "unknown").replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setDetailItem({ type: "driver", data: row })}>View</Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/transport?edit=${row._id}`}>Edit</Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle Tracking"
        description="Monitor route progress, fleet activity, and transport assignments"
        actions={
          <div className="flex gap-2">
            <Link href="/admin/transport/routes/create">
              <Button variant="outline" className="gap-2">
                <MapPin className="h-4 w-4" />
                Create Route
              </Button>
            </Link>
            <Link href="/admin/transport">
              <Button variant="outline" className="gap-2">
                <Activity className="h-4 w-4" />
                Transport Overview
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="Active Routes"
          value={stats.activeRoutes}
          description={`${stats.totalRoutes} total routes`}
          icon={Navigation}
          variant="success"
        />
        <AdminStatsCard
          title="Active Vehicles"
          value={stats.activeVehicles}
          description={`${stats.totalVehicles} in fleet`}
          icon={Bus}
        />
        <AdminStatsCard
          title="Active Drivers"
          value={stats.activeDrivers}
          description={`${stats.totalDrivers} total drivers`}
          icon={Users}
          variant="success"
        />
        <AdminStatsCard
          title="Maintenance"
          value={stats.maintenanceVehicles}
          description="Vehicles under maintenance"
          icon={AlertTriangle}
          variant={stats.maintenanceVehicles > 0 ? "warning" : "default"}
        />
      </div>

      {/* Fleet Status Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Routes On Time</p>
                <p className="text-2xl font-bold">{stats.activeRoutes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vehicles Deployed</p>
                <p className="text-2xl font-bold">{stats.activeVehicles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alerts</p>
                <p className="text-2xl font-bold">{stats.maintenanceVehicles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Routes / Vehicles / Drivers */}
      <Tabs defaultValue="routes">
        <TabsList className="mb-4">
          <TabsTrigger value="routes" className="gap-2">
            <MapPin className="h-4 w-4" />
            Routes ({allRoutes.length})
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="gap-2">
            <Bus className="h-4 w-4" />
            Vehicles ({allVehicles.length})
          </TabsTrigger>
          <TabsTrigger value="drivers" className="gap-2">
            <Users className="h-4 w-4" />
            Drivers ({allDrivers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="routes">
          <Card>
            <CardHeader>
              <CardTitle>Transport Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={allRoutes}
                columns={routeColumns}
                searchKey={(row) => `${row.name ?? ""}`}
                searchPlaceholder="Search routes..."
                emptyTitle="No routes found"
                emptyDescription="No transport routes have been configured yet."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Fleet</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={allVehicles}
                columns={vehicleColumns}
                searchKey={(row) => `${row.plateNumber ?? ""} ${row.make ?? ""} ${row.model ?? ""}`}
                searchPlaceholder="Search vehicles..."
                emptyTitle="No vehicles found"
                emptyDescription="No vehicles have been added to the fleet yet."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers">
          <Card>
            <CardHeader>
              <CardTitle>Drivers</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={allDrivers}
                columns={driverColumns}
                searchKey={(row) => `${row.firstName ?? ""} ${row.lastName ?? ""} ${row.licenseNumber ?? ""}`}
                searchPlaceholder="Search drivers..."
                emptyTitle="No drivers found"
                emptyDescription="No drivers have been registered yet."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail / Track Dialog */}
      <Dialog open={!!detailItem} onOpenChange={(open) => { if (!open) setDetailItem(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {detailItem?.type === "route" && "Route Details"}
              {detailItem?.type === "vehicle" && "Vehicle Tracking"}
              {detailItem?.type === "driver" && "Driver Details"}
            </DialogTitle>
            <DialogDescription>
              {detailItem?.type === "vehicle"
                ? "Real-time GPS tracking is not yet enabled. Route and assignment information is shown below."
                : "Record details from the database."}
            </DialogDescription>
          </DialogHeader>

          {detailItem?.type === "route" && (() => {
            const r = detailItem.data as Route;
            return (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{r.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={r.status === "active" ? "default" : "secondary"}>{(r.status as string) ?? "—"}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Capacity</span><span>{r.capacity ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Driver ID</span><span className="font-mono text-xs">{(r.driverId as string) ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Vehicle ID</span><span className="font-mono text-xs">{(r.vehicleId as string) ?? "—"}</span></div>
                {r.stops && (r.stops as string[]).length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-1">Stops ({(r.stops as string[]).length})</p>
                    <ol className="list-decimal list-inside space-y-0.5">
                      {(r.stops as string[]).map((stop, i) => <li key={i}>{stop}</li>)}
                    </ol>
                  </div>
                )}
              </div>
            );
          })()}

          {detailItem?.type === "vehicle" && (() => {
            const v = detailItem.data as Vehicle;
            const assignedRoute = allRoutes.find((r) => r.vehicleId === v._id);
            return (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Plate</span><span className="font-medium">{v.plateNumber ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Make / Model</span><span>{[v.make, v.model].filter(Boolean).join(" ") || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Capacity</span><span>{v.capacity ?? "—"} seats</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={v.status === "active" ? "default" : "secondary"}>{(v.status as string) ?? "—"}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Assigned Route</span><span>{assignedRoute?.name ?? "Not assigned"}</span></div>
                {assignedRoute?.stops && (assignedRoute.stops as string[]).length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-1">Route Stops</p>
                    <ol className="list-decimal list-inside space-y-0.5">
                      {(assignedRoute.stops as string[]).map((stop, i) => <li key={i}>{stop}</li>)}
                    </ol>
                  </div>
                )}
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  Real-time GPS tracking coming soon. Contact your transport officer for live location updates.
                </p>
              </div>
            );
          })()}

          {detailItem?.type === "driver" && (() => {
            const d = detailItem.data as Driver;
            const assignedVehicle = allVehicles.find((v) => v._id === d.assignedVehicleId || d.assignedVehicleId === v._id);
            return (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{[d.firstName, d.lastName].filter(Boolean).join(" ") || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{(d.phone as string) ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">License</span><span>{(d.licenseNumber as string) ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={d.status === "active" ? "default" : "secondary"}>{((d.status as string) ?? "—").replace("_", " ")}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Assigned Vehicle</span><span>{assignedVehicle?.plateNumber ?? (d.assignedVehicleId ? "Vehicle ID: " + d.assignedVehicleId : "Not assigned")}</span></div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
