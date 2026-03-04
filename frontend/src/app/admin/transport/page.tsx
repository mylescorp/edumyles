"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bus, MapPin, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Route = {
    _id: string;
    name: string;
    stops: string[];
};

type Vehicle = {
    _id: string;
    plateNumber: string;
    capacity: number;
    status: string;
};

type Driver = {
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
        sessionToken ? {} : "skip"
    );

    const vehicles = useQuery(
        api.modules.transport.queries.listVehicles,
        sessionToken ? {} : "skip"
    );

    const drivers = useQuery(
        api.modules.transport.queries.listDrivers,
        sessionToken ? {} : "skip"
    );

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const routeColumns: Column<Route>[] = [
        {
            key: "name",
            header: "Route Name",
            sortable: true,
        },
        {
            key: "stops",
            header: "Stops",
            cell: (row: Route) => row.stops.length,
        },
    ];

    const vehicleColumns: Column<Vehicle>[] = [
        {
            key: "plateNumber",
            header: "Plate Number",
            sortable: true,
        },
        {
            key: "capacity",
            header: "Capacity",
            cell: (row: Vehicle) => `${row.capacity} Seats`,
        },
        {
            key: "status",
            header: "Status",
            cell: (row: Vehicle) => (
                <Badge variant={row.status === "active" ? "default" : "secondary"}>
                    {row.status}
                </Badge>
            ),
        },
    ];

    const driverColumns: Column<Driver>[] = [
        {
            key: "name",
            header: "Name",
            cell: (row: Driver) => `${row.firstName} ${row.lastName}`,
            sortable: true,
        },
        {
            key: "phone",
            header: "Phone",
            cell: (row: Driver) => row.phone,
        },
        {
            key: "status",
            header: "Status",
            cell: (row: Driver) => (
                <Badge variant={row.status === "active" ? "default" : "secondary"}>
                    {row.status}
                </Badge>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Transport Management"
                description="Manage school routes, vehicles, and drivers"
            />

            <Tabs defaultValue="routes">
                <TabsList className="mb-4">
                    <TabsTrigger value="routes" className="gap-2">
                        <MapPin className="h-4 w-4" />
                        Routes
                    </TabsTrigger>
                    <TabsTrigger value="vehicles" className="gap-2">
                        <Bus className="h-4 w-4" />
                        Vehicles
                    </TabsTrigger>
                    <TabsTrigger value="drivers" className="gap-2">
                        <Users className="h-4 w-4" />
                        Drivers
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="routes">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Transport Routes</CardTitle>
                            <Button size="sm" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Route
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                data={routes ?? []}
                                columns={routeColumns}
                                searchable
                                searchPlaceholder="Search routes..."
                                emptyTitle="No routes found"
                                emptyDescription="Define your first transport route."
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="vehicles">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Vehicle Fleet</CardTitle>
                            <Button size="sm" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Vehicle
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                data={vehicles ?? []}
                                columns={vehicleColumns}
                                searchable
                                searchPlaceholder="Search vehicles..."
                                emptyTitle="No vehicles found"
                                emptyDescription="Add vehicles to your transport fleet."
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="drivers">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Drivers</CardTitle>
                            <Button size="sm" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Driver
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                data={drivers ?? []}
                                columns={driverColumns}
                                searchable
                                searchPlaceholder="Search drivers..."
                                emptyTitle="No drivers found"
                                emptyDescription="Register drivers for your vehicles."
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
