"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bus, MapPin, Navigation, Users } from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

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
  const { toast } = useToast();
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [isDriverDialogOpen, setIsDriverDialogOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [vehicleForm, setVehicleForm] = useState({
    plateNumber: "",
    capacity: "",
    routeId: "",
    driverId: "",
    status: "active",
  });
  const [driverForm, setDriverForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    status: "active",
  });
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [savingDriver, setSavingDriver] = useState(false);
  const [assigningDriver, setAssigningDriver] = useState(false);

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
  const createVehicle = useMutation(api.modules.transport.mutations.createVehicle);
  const createDriver = useMutation(api.modules.transport.mutations.createDriver);
  const assignDriverToVehicle = useMutation(api.modules.transport.mutations.assignDriverToVehicle);

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

  const handleCreateVehicle = async () => {
    const capacity = Number(vehicleForm.capacity);
    if (!vehicleForm.plateNumber.trim() || !Number.isFinite(capacity) || capacity <= 0) {
      toast({
        title: "Vehicle details required",
        description: "Provide a plate number and valid seating capacity.",
        variant: "destructive",
      });
      return;
    }

    setSavingVehicle(true);
    try {
      await createVehicle({
        plateNumber: vehicleForm.plateNumber.trim().toUpperCase(),
        capacity,
        routeId: vehicleForm.routeId || undefined,
        driverId: vehicleForm.driverId || undefined,
        status: vehicleForm.status,
      });
      toast({
        title: "Vehicle created",
        description: `${vehicleForm.plateNumber.toUpperCase()} is now part of the fleet.`,
      });
      setVehicleForm({
        plateNumber: "",
        capacity: "",
        routeId: "",
        driverId: "",
        status: "active",
      });
      setIsVehicleDialogOpen(false);
    } catch (error) {
      toast({
        title: "Unable to create vehicle",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleCreateDriver = async () => {
    if (!driverForm.firstName.trim() || !driverForm.lastName.trim() || !driverForm.phone.trim()) {
      toast({
        title: "Driver details required",
        description: "Provide the driver's full name and phone number.",
        variant: "destructive",
      });
      return;
    }

    setSavingDriver(true);
    try {
      await createDriver({
        firstName: driverForm.firstName.trim(),
        lastName: driverForm.lastName.trim(),
        phone: driverForm.phone.trim(),
        status: driverForm.status,
      });
      toast({
        title: "Driver created",
        description: `${driverForm.firstName} ${driverForm.lastName} is now available for assignment.`,
      });
      setDriverForm({
        firstName: "",
        lastName: "",
        phone: "",
        status: "active",
      });
      setIsDriverDialogOpen(false);
    } catch (error) {
      toast({
        title: "Unable to create driver",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingDriver(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedVehicleId || !selectedDriverId) {
      toast({
        title: "Assignment incomplete",
        description: "Select both a vehicle and a driver.",
        variant: "destructive",
      });
      return;
    }

    setAssigningDriver(true);
    try {
      await assignDriverToVehicle({
        vehicleId: selectedVehicleId as Id<"vehicles">,
        driverId: selectedDriverId,
      });
      toast({
        title: "Driver assigned",
        description: "The selected driver is now linked to the vehicle.",
      });
      setSelectedVehicleId("");
      setSelectedDriverId("");
    } catch (error) {
      toast({
        title: "Unable to assign driver",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setAssigningDriver(false);
    }
  };

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
            <Button variant="outline" className="gap-2" onClick={() => setIsDriverDialogOpen(true)}>
              <Users className="h-4 w-4" />
              Add Driver
            </Button>
            <Button className="gap-2" onClick={() => setIsVehicleDialogOpen(true)}>
              <Bus className="h-4 w-4" />
              Add Vehicle
            </Button>
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
          <div className="rounded-lg border p-4 space-y-3">
            <div>
              <p className="font-medium">Driver Allocation</p>
              <p className="text-sm text-muted-foreground">Link drivers to the active fleet without leaving this screen.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {allVehicles.map((vehicle) => (
                    <SelectItem key={vehicle._id} value={vehicle._id}>
                      {vehicle.plateNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {allDrivers.map((driver) => (
                    <SelectItem key={driver._id} value={driver._id}>
                      {driver.firstName} {driver.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={handleAssignDriver} disabled={assigningDriver}>
              {assigningDriver ? "Saving Assignment..." : "Assign Driver to Vehicle"}
            </Button>
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

      <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vehicle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plateNumber">Plate Number</Label>
              <Input
                id="plateNumber"
                value={vehicleForm.plateNumber}
                onChange={(event) => setVehicleForm((prev) => ({ ...prev, plateNumber: event.target.value }))}
                placeholder="KDA 123A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={vehicleForm.capacity}
                onChange={(event) => setVehicleForm((prev) => ({ ...prev, capacity: event.target.value }))}
                placeholder="33"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Route</Label>
                <Select value={vehicleForm.routeId} onValueChange={(value) => setVehicleForm((prev) => ({ ...prev, routeId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional route" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {allRoutes.map((route) => (
                      <SelectItem key={route._id} value={route._id}>
                        {route.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Driver</Label>
                <Select value={vehicleForm.driverId} onValueChange={(value) => setVehicleForm((prev) => ({ ...prev, driverId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {allDrivers.map((driver) => (
                      <SelectItem key={driver._id} value={driver._id}>
                        {driver.firstName} {driver.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={vehicleForm.status} onValueChange={(value) => setVehicleForm((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsVehicleDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleCreateVehicle} disabled={savingVehicle}>
                {savingVehicle ? "Saving..." : "Create Vehicle"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDriverDialogOpen} onOpenChange={setIsDriverDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Driver</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="driverFirstName">First Name</Label>
                <Input
                  id="driverFirstName"
                  value={driverForm.firstName}
                  onChange={(event) => setDriverForm((prev) => ({ ...prev, firstName: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="driverLastName">Last Name</Label>
                <Input
                  id="driverLastName"
                  value={driverForm.lastName}
                  onChange={(event) => setDriverForm((prev) => ({ ...prev, lastName: event.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="driverPhone">Phone</Label>
              <Input
                id="driverPhone"
                value={driverForm.phone}
                onChange={(event) => setDriverForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="+2547..."
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={driverForm.status} onValueChange={(value) => setDriverForm((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDriverDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleCreateDriver} disabled={savingDriver}>
                {savingDriver ? "Saving..." : "Create Driver"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
