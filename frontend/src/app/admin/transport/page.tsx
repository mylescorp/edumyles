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
import { Bus, MapPin, Navigation, Users } from "lucide-react";
import Link from "next/link";

type RouteRecord = {
  _id: string;
  name: string;
  stops: string[];
  updatedAt?: number;
};

type VehicleRecord = {
  _id: string;
  plateNumber: string;
  capacity: number;
  routeId?: string;
  driverId?: string;
  status: string;
};

type DriverRecord = {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: string;
};

export default function TransportPage() {
  const { isLoading, sessionToken } = useAuth();

  const routes = useQuery(
    api.modules.transport.queries.listRoutes,
    sessionToken ? { sessionToken } : "skip"
  ) as RouteRecord[] | undefined;

  const vehicles = useQuery(
    api.modules.transport.queries.listVehicles,
    sessionToken ? { sessionToken } : "skip"
  ) as VehicleRecord[] | undefined;

  const drivers = useQuery(
    api.modules.transport.queries.listDrivers,
    sessionToken ? { sessionToken } : "skip"
  ) as DriverRecord[] | undefined;

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const allRoutes = routes ?? [];
  const allVehicles = vehicles ?? [];
  const allDrivers = drivers ?? [];
  const driverMap = new Map(allDrivers.map((driver) => [driver._id, `${driver.firstName} ${driver.lastName}`.trim()]));
  const routeMap = new Map(allRoutes.map((route) => [route._id, route.name]));

  const stats = {
    totalRoutes: allRoutes.length,
    totalVehicles: allVehicles.length,
    activeVehicles: allVehicles.filter((vehicle) => vehicle.status === "active").length,
    totalDrivers: allDrivers.length,
  };

  const routeColumns: Column<RouteRecord>[] = [
    {
      key: "name",
      header: "Route",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-sm text-muted-foreground">{row.stops.length} stops configured</p>
        </div>
      ),
    },
    {
      key: "stops",
      header: "Stops",
      cell: (row) => row.stops.join(", "),
    },
    {
      key: "updatedAt",
      header: "Updated",
      cell: (row) => row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "—",
    },
  ];

  const vehicleColumns: Column<VehicleRecord>[] = [
    {
      key: "plateNumber",
      header: "Vehicle",
      sortable: true,
      cell: (row) => row.plateNumber,
    },
    {
      key: "capacity",
      header: "Capacity",
      cell: (row) => `${row.capacity} seats`,
    },
    {
      key: "routeId",
      header: "Route",
      cell: (row) => routeMap.get(row.routeId ?? "") ?? "Not assigned",
    },
    {
      key: "driverId",
      header: "Driver",
      cell: (row) => driverMap.get(row.driverId ?? "") ?? "Not assigned",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge variant={row.status === "active" ? "default" : "secondary"}>{row.status}</Badge>,
    },
  ];

  const driverColumns: Column<DriverRecord>[] = [
    {
      key: "name",
      header: "Driver",
      sortable: true,
      cell: (row) => `${row.firstName} ${row.lastName}`,
    },
    {
      key: "phone",
      header: "Phone",
      cell: (row) => row.phone,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge variant={row.status === "active" ? "default" : "secondary"}>{row.status.replaceAll("_", " ")}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transport Management"
        description="Review routes, fleet records, and driver readiness from the live transport module."
        actions={(
          <div className="flex gap-2">
            <Link href="/admin/transport/routes/create">
              <Button variant="outline" className="gap-2">
                <MapPin className="h-4 w-4" />
                Create Route
              </Button>
            </Link>
            <Link href="/admin/transport/tracking">
              <Button className="gap-2">
                <Navigation className="h-4 w-4" />
                Manage Assignments
              </Button>
            </Link>
          </div>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatsCard title="Routes" value={stats.totalRoutes} description="Configured transport routes" icon={MapPin} />
        <AdminStatsCard title="Fleet Vehicles" value={stats.totalVehicles} description="Vehicles on record" icon={Bus} />
        <AdminStatsCard title="Active Vehicles" value={stats.activeVehicles} description="Vehicles marked active" icon={Bus} variant="success" />
        <AdminStatsCard title="Drivers" value={stats.totalDrivers} description="Registered drivers" icon={Users} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transport Operations</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link href="/admin/transport/routes/create" className="rounded-lg border p-4 transition-colors hover:bg-muted/40">
            <p className="font-medium">Create Route</p>
            <p className="text-sm text-muted-foreground">Add a new route and define its stops.</p>
          </Link>
          <Link href="/admin/transport/routes" className="rounded-lg border p-4 transition-colors hover:bg-muted/40">
            <p className="font-medium">Review Routes</p>
            <p className="text-sm text-muted-foreground">See configured routes and stop coverage.</p>
          </Link>
          <Link href="/admin/transport/tracking" className="rounded-lg border p-4 transition-colors hover:bg-muted/40">
            <p className="font-medium">Assign Students</p>
            <p className="text-sm text-muted-foreground">Map students to routes and pickup stops.</p>
          </Link>
          <div className="rounded-lg border p-4">
            <p className="font-medium">Live GPS Tracking</p>
            <p className="text-sm text-muted-foreground">Still pending backend/device telemetry support.</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="routes">
        <TabsList className="mb-4">
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
        </TabsList>

        <TabsContent value="routes">
          <Card>
            <CardHeader>
              <CardTitle>Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={allRoutes}
                columns={routeColumns}
                searchKey={(row) => `${row.name} ${row.stops.join(" ")}`}
                searchPlaceholder="Search routes..."
                emptyTitle="No routes found"
                emptyDescription="Create your first route to start managing transport assignments."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles">
          <Card>
            <CardHeader>
              <CardTitle>Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={allVehicles}
                columns={vehicleColumns}
                searchKey={(row) => `${row.plateNumber} ${row.status}`}
                searchPlaceholder="Search vehicles..."
                emptyTitle="No vehicles found"
                emptyDescription="Vehicle registration is available in the backend but no vehicles are recorded yet."
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
                searchKey={(row) => `${row.firstName} ${row.lastName} ${row.phone}`}
                searchPlaceholder="Search drivers..."
                emptyTitle="No drivers found"
                emptyDescription="Driver registration is available in the backend but no driver records are present."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
