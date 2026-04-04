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
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bus, MapPin, Navigation, Route, Users } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { assignStudentToRouteSchema } from "@shared/validators";
import { Id } from "@/convex/_generated/dataModel";

type TransportRoute = {
  _id: string;
  name: string;
  stops?: string[];
};

type Vehicle = {
  _id: string;
  plateNumber?: string;
  capacity?: number;
  routeId?: string;
  driverId?: string;
  status?: string;
};

type Driver = {
  _id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: string;
};

type Student = {
  _id: string;
  firstName: string;
  lastName: string;
  admissionNumber?: string;
};

type Assignment = {
  _id: string;
  studentId: string;
  routeId: string;
  stopIndex: number;
  updatedAt?: number;
};

export default function TransportTrackingPage() {
  const { isLoading, sessionToken } = useAuth();
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedStopIndex, setSelectedStopIndex] = useState("0");
  const [isAssigning, setIsAssigning] = useState(false);

  const routes = useQuery(
    api.modules.transport.queries.listRoutes,
    sessionToken ? { sessionToken } : "skip"
  ) as TransportRoute[] | undefined;

  const vehicles = useQuery(
    api.modules.transport.queries.listVehicles,
    sessionToken ? { sessionToken } : "skip"
  ) as Vehicle[] | undefined;

  const drivers = useQuery(
    api.modules.transport.queries.listDrivers,
    sessionToken ? { sessionToken } : "skip"
  ) as Driver[] | undefined;

  const students = useQuery(
    api.modules.sis.queries.listStudents,
    sessionToken ? { sessionToken, status: "active" } : "skip"
  ) as Student[] | undefined;

  const assignments = useQuery(
    api.modules.transport.queries.listRouteAssignments,
    sessionToken && selectedRouteId ? { sessionToken, routeId: selectedRouteId } : "skip"
  ) as Assignment[] | undefined;

  const vehicleLocations = useQuery(
    api.modules.transport.queries.getVehicleLocations,
    sessionToken ? { sessionToken } : "skip"
  ) as Array<{ _id: string; plateNumber?: string; status?: string; routeId?: string; lastLatitude: number; lastLongitude: number; lastSpeed?: number; lastHeading?: number; lastLocationAt?: number }> | undefined;

  const assignStudentToRoute = useMutation(api.modules.transport.mutations.assignStudentToRoute);
  const removeStudentAssignment = useMutation(api.modules.transport.mutations.removeStudentAssignment);

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const allRoutes = routes ?? [];
  const allVehicles = vehicles ?? [];
  const allDrivers = drivers ?? [];
  const allStudents = students ?? [];
  const currentAssignments = assignments ?? [];

  const selectedRoute = allRoutes.find((route) => route._id === selectedRouteId) ?? allRoutes[0];
  const selectedRouteAssignments = selectedRouteId ? currentAssignments : [];

  const studentMap = new Map(allStudents.map((student) => [student._id, student]));
  const stats = {
    totalRoutes: allRoutes.length,
    totalVehicles: allVehicles.length,
    totalDrivers: allDrivers.length,
    assignedStudents: selectedRouteAssignments.length,
  };

  const routeColumns: Column<TransportRoute>[] = [
    {
      key: "name",
      header: "Route",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-sm text-muted-foreground">{row.stops?.length ?? 0} stops configured</p>
        </div>
      ),
    },
    {
      key: "stops",
      header: "Stops",
      cell: (row) => row.stops?.join(", ") || "No stops configured",
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <Button size="sm" variant={selectedRouteId === row._id ? "default" : "outline"} onClick={() => setSelectedRouteId(row._id)}>
          Manage Assignments
        </Button>
      ),
    },
  ];

  const vehicleColumns: Column<Vehicle>[] = [
    {
      key: "plateNumber",
      header: "Vehicle",
      sortable: true,
      cell: (row) => row.plateNumber ?? "Unnamed vehicle",
    },
    {
      key: "capacity",
      header: "Capacity",
      cell: (row) => row.capacity ? `${row.capacity} seats` : "—",
    },
    {
      key: "routeId",
      header: "Route",
      cell: (row) => allRoutes.find((route) => route._id === row.routeId)?.name ?? "Not assigned",
    },
    {
      key: "driverId",
      header: "Driver",
      cell: (row) => {
        const driver = allDrivers.find((candidate) => candidate._id === row.driverId);
        return driver ? `${driver.firstName ?? ""} ${driver.lastName ?? ""}`.trim() : "Not assigned";
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge variant={row.status === "active" ? "default" : "secondary"}>{row.status ?? "unknown"}</Badge>,
    },
  ];

  const driverColumns: Column<Driver>[] = [
    {
      key: "name",
      header: "Driver",
      sortable: true,
      cell: (row) => `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim() || "Unnamed driver",
    },
    {
      key: "phone",
      header: "Phone",
      cell: (row) => row.phone ?? "—",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge variant={row.status === "active" ? "default" : "secondary"}>{(row.status ?? "unknown").replaceAll("_", " ")}</Badge>,
    },
  ];

  const assignmentColumns: Column<Assignment>[] = [
    {
      key: "studentId",
      header: "Student",
      cell: (row) => {
        const student = studentMap.get(row.studentId);
        return (
          <div>
            <p className="font-medium">{student ? `${student.firstName} ${student.lastName}` : row.studentId}</p>
            <p className="text-sm text-muted-foreground">{student?.admissionNumber ?? "No admission number"}</p>
          </div>
        );
      },
    },
    {
      key: "stopIndex",
      header: "Pickup Stop",
      cell: (row) => selectedRoute?.stops?.[row.stopIndex] ?? `Stop #${row.stopIndex + 1}`,
    },
    {
      key: "updatedAt",
      header: "Updated",
      cell: (row) => row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "—",
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleRemoveAssignment(row._id as Id<"transportAssignments">)}
        >
          Remove
        </Button>
      ),
    },
  ];

  const handleAssignStudent = async (event: React.FormEvent) => {
    event.preventDefault();

    const parsed = assignStudentToRouteSchema.safeParse({
      studentId: selectedStudentId,
      routeId: selectedRouteId,
      stopIndex: Number(selectedStopIndex),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please select a student, route, and stop.");
      return;
    }

    setIsAssigning(true);
    try {
      await assignStudentToRoute(parsed.data);
      toast.success("Student transport assignment saved.");
      setSelectedStudentId("");
      setSelectedStopIndex("0");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save transport assignment.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: Id<"transportAssignments">) => {
    try {
      await removeStudentAssignment({ assignmentId });
      toast.success("Transport assignment removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove assignment.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transport Tracking"
        description="Manage route assignments and review the current transport setup using live backend data."
        actions={(
          <div className="flex gap-2">
            <Link href="/admin/transport/routes/create">
              <Button variant="outline" className="gap-2">
                <MapPin className="h-4 w-4" />
                Create Route
              </Button>
            </Link>
            <Link href="/admin/transport">
              <Button variant="outline" className="gap-2">
                <Navigation className="h-4 w-4" />
                Transport Overview
              </Button>
            </Link>
          </div>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatsCard title="Routes" value={stats.totalRoutes} description="Configured transport routes" icon={Route} />
        <AdminStatsCard title="Vehicles" value={stats.totalVehicles} description="Vehicles recorded in the fleet" icon={Bus} />
        <AdminStatsCard title="Drivers" value={stats.totalDrivers} description="Active driver records" icon={Users} />
        <AdminStatsCard title="Assigned Students" value={stats.assignedStudents} description={selectedRoute ? `For ${selectedRoute.name}` : "Select a route to review"} icon={Navigation} variant="success" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>Assign Student to Route</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleAssignStudent}>
              <div className="space-y-2">
                <Label htmlFor="routeId">Route</Label>
                <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                  <SelectTrigger id="routeId">
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    {allRoutes.map((route) => (
                      <SelectItem key={route._id} value={route._id}>
                        {route.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentId">Student</Label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger id="studentId">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {allStudents.map((student) => (
                      <SelectItem key={student._id} value={student._id}>
                        {student.firstName} {student.lastName}
                        {student.admissionNumber ? ` (${student.admissionNumber})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stopIndex">Pickup Stop</Label>
                <Select value={selectedStopIndex} onValueChange={setSelectedStopIndex} disabled={!selectedRoute}>
                  <SelectTrigger id="stopIndex">
                    <SelectValue placeholder="Select stop" />
                  </SelectTrigger>
                  <SelectContent>
                    {(selectedRoute?.stops ?? []).map((stop, index) => (
                      <SelectItem key={`${stop}-${index}`} value={String(index)}>
                        {index + 1}. {stop}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={isAssigning}>
                {isAssigning ? "Saving..." : "Save Assignment"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Route Assignments</CardTitle>
            <span className="text-sm text-muted-foreground">
              {selectedRoute ? selectedRoute.name : "Choose a route"}
            </span>
          </CardHeader>
          <CardContent>
            {!selectedRoute ? (
              <p className="text-sm text-muted-foreground">Select a route to review and manage its student assignments.</p>
            ) : (
              <DataTable
                data={selectedRouteAssignments}
                columns={assignmentColumns}
                searchable
                searchPlaceholder="Search assigned students..."
                searchKey={(row) => {
                  const student = studentMap.get(row.studentId);
                  return `${student?.firstName ?? ""} ${student?.lastName ?? ""} ${student?.admissionNumber ?? ""}`;
                }}
                emptyTitle="No assignments yet"
                emptyDescription="This route does not have any students assigned yet."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live Vehicle Locations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            <CardTitle>Live Vehicle Locations</CardTitle>
          </div>
          <Badge variant={vehicleLocations && vehicleLocations.length > 0 ? "default" : "secondary"}>
            {vehicleLocations?.length ?? 0} reporting
          </Badge>
        </CardHeader>
        <CardContent>
          {!vehicleLocations || vehicleLocations.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Navigation className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium text-muted-foreground">No live locations yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Vehicle locations appear here when drivers update their position via the mobile app or GPS integration.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Location table */}
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Vehicle</th>
                      <th className="text-left p-3 font-medium">Route</th>
                      <th className="text-right p-3 font-medium">Latitude</th>
                      <th className="text-right p-3 font-medium">Longitude</th>
                      <th className="text-right p-3 font-medium">Speed</th>
                      <th className="text-right p-3 font-medium">Last Updated</th>
                      <th className="text-right p-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicleLocations.map((v) => (
                      <tr key={v._id} className="border-t">
                        <td className="p-3 font-medium">{v.plateNumber ?? "Unknown"}</td>
                        <td className="p-3 text-muted-foreground">{allRoutes.find((r) => r._id === v.routeId)?.name ?? "—"}</td>
                        <td className="p-3 text-right font-mono text-xs">{v.lastLatitude.toFixed(5)}</td>
                        <td className="p-3 text-right font-mono text-xs">{v.lastLongitude.toFixed(5)}</td>
                        <td className="p-3 text-right">{v.lastSpeed != null ? `${v.lastSpeed} km/h` : "—"}</td>
                        <td className="p-3 text-right text-muted-foreground text-xs">
                          {v.lastLocationAt ? new Date(v.lastLocationAt).toLocaleTimeString() : "—"}
                        </td>
                        <td className="p-3 text-right">
                          <a
                            href={`https://www.google.com/maps?q=${v.lastLatitude},${v.lastLongitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary underline underline-offset-2"
                          >
                            Map ↗
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* OSM static map tiles for first vehicle */}
              {vehicleLocations[0] && (
                <div className="rounded-lg overflow-hidden border">
                  <iframe
                    title="Vehicle location map"
                    width="100%"
                    height="280"
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${vehicleLocations[0].lastLongitude - 0.02},${vehicleLocations[0].lastLatitude - 0.02},${vehicleLocations[0].lastLongitude + 0.02},${vehicleLocations[0].lastLatitude + 0.02}&layer=mapnik&marker=${vehicleLocations[0].lastLatitude},${vehicleLocations[0].lastLongitude}`}
                    className="w-full border-0"
                  />
                  <p className="text-xs text-muted-foreground px-3 py-2 bg-muted/30">
                    Showing most recent vehicle · {vehicleLocations[0].plateNumber} · Powered by OpenStreetMap
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={allRoutes}
              columns={routeColumns}
              searchKey={(row) => `${row.name} ${row.stops?.join(" ") ?? ""}`}
              searchPlaceholder="Search routes..."
              emptyTitle="No routes found"
              emptyDescription="Create transport routes to start assigning students."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fleet and Driver Readiness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <DataTable
              data={allVehicles}
              columns={vehicleColumns}
              searchKey={(row) => `${row.plateNumber ?? ""} ${row.status ?? ""}`}
              searchPlaceholder="Search vehicles..."
              emptyTitle="No vehicles found"
              emptyDescription="Add vehicles to map them to routes and drivers."
            />
            <DataTable
              data={allDrivers}
              columns={driverColumns}
              searchKey={(row) => `${row.firstName ?? ""} ${row.lastName ?? ""} ${row.phone ?? ""}`}
              searchPlaceholder="Search drivers..."
              emptyTitle="No drivers found"
              emptyDescription="Add drivers to complete transport operations."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
