"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bus, 
  MapPin, 
  Users, 
  Plus, 
  Navigation,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3
} from "lucide-react";
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

type Vehicle = {
    _id: string;
    plateNumber: string;
    capacity: number;
    status: string;
    fuel: number;
    lastMaintenance: string;
    driver?: string;
    route?: string;
};

type Driver = {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    status: string;
    licenseNumber: string;
    experience: string;
    assignedVehicle?: string;
};

export default function TransportPage() {
    const { isLoading, sessionToken } = useAuth();

    const routes = usePlatformQuery(
        api.modules.transport.queries.listRoutes,
        sessionToken ? { sessionToken } : "skip",
        !!sessionToken
    );

    const vehicles = usePlatformQuery(
        api.modules.transport.queries.listVehicles,
        sessionToken ? { sessionToken } : "skip",
        !!sessionToken
    );

    const drivers = usePlatformQuery(
        api.modules.transport.queries.listDrivers,
        sessionToken ? { sessionToken } : "skip",
        !!sessionToken
    );

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const stats = {
        totalRoutes: (routes as any[])?.length || 0,
        activeRoutes: (routes as any[])?.filter((r: any) => r.status === "active").length || 0,
        totalVehicles: (vehicles as any[])?.length || 0,
        activeVehicles: (vehicles as any[])?.filter((v: any) => v.status === "active").length || 0,
        totalDrivers: (drivers as any[])?.length || 0,
        activeDrivers: (drivers as any[])?.filter((d: any) => d.status === "active").length || 0,
        totalStudents: 0, // Will be calculated from assignments
        maintenanceAlerts: (vehicles as any[])?.filter((v: any) => v.status === "maintenance").length || 0,
    };

    const routeColumns: Column<Route>[] = [
        {
            key: "name",
            header: "Route Name",
            sortable: true,
            cell: (row: Route) => (
                <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-sm text-muted-foreground">{row.stops.length} stops</p>
                </div>
            ),
        },
        {
            key: "capacity",
            header: "Capacity",
            cell: (row: Route) => (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                        {row.activeStudents}/{row.capacity}
                    </span>
                    <div className="w-12 bg-muted rounded-full h-2">
                        <div 
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${(row.activeStudents / row.capacity) * 100}%` }}
                        />
                    </div>
                </div>
            ),
        },
        {
            key: "driver",
            header: "Driver",
            cell: (row: Route) => row.driver || "—",
        },
        {
            key: "status",
            header: "Status",
            cell: (row: Route) => (
                <Badge variant={row.status === "active" ? "default" : "secondary"}>
                    {row.status}
                </Badge>
            ),
        },
        {
            key: "actions",
            header: "Actions",
            cell: (row: Route) => (
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">Edit</Button>
                    <Button size="sm" variant="outline">View</Button>
                </div>
            ),
        },
    ];

    const vehicleColumns: Column<Vehicle>[] = [
        {
            key: "plateNumber",
            header: "Vehicle",
            sortable: true,
            cell: (row: Vehicle) => (
                <div>
                    <p className="font-medium">{row.plateNumber}</p>
                    <p className="text-sm text-muted-foreground">{row.capacity} seats</p>
                </div>
            ),
        },
        {
            key: "driver",
            header: "Driver",
            cell: (row: Vehicle) => row.driver || "—",
        },
        {
            key: "fuel",
            header: "Fuel",
            cell: (row: Vehicle) => (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{row.fuel}%</span>
                    <div className="w-12 bg-muted rounded-full h-2">
                        <div 
                            className={`h-2 rounded-full ${
                                row.fuel > 50 ? "bg-green-600" : 
                                row.fuel > 25 ? "bg-amber-600" : "bg-red-600"
                            }`}
                            style={{ width: `${row.fuel}%` }}
                        />
                    </div>
                </div>
            ),
        },
        {
            key: "status",
            header: "Status",
            cell: (row: Vehicle) => (
                <Badge variant={
                    row.status === "active" ? "default" : 
                    row.status === "maintenance" ? "secondary" : "outline"
                }>
                    {row.status}
                </Badge>
            ),
        },
        {
            key: "actions",
            header: "Actions",
            cell: (row: Vehicle) => (
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">Edit</Button>
                    <Button size="sm" variant="outline">Track</Button>
                </div>
            ),
        },
    ];

    const driverColumns: Column<Driver>[] = [
        {
            key: "name",
            header: "Name",
            cell: (row: Driver) => (
                <div>
                    <p className="font-medium">{row.firstName} {row.lastName}</p>
                    <p className="text-sm text-muted-foreground">{row.experience}</p>
                </div>
            ),
            sortable: true,
        },
        {
            key: "phone",
            header: "Contact",
            cell: (row: Driver) => row.phone,
        },
        {
            key: "assignedVehicle",
            header: "Vehicle",
            cell: (row: Driver) => row.assignedVehicle || "—",
        },
        {
            key: "status",
            header: "Status",
            cell: (row: Driver) => (
                <Badge variant={
                    row.status === "active" ? "default" : 
                    row.status === "on_leave" ? "secondary" : "outline"
                }>
                    {row.status.replace("_", " ")}
                </Badge>
            ),
        },
        {
            key: "actions",
            header: "Actions",
            cell: (row: Driver) => (
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">Edit</Button>
                    <Button size="sm" variant="outline">View</Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Transport Management"
                description="Manage school routes, vehicles, and drivers with real-time tracking"
                actions={
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
                                Live Tracking
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <AdminStatsCard
                    title="Active Routes"
                    value={stats.activeRoutes}
                    description="Currently operational"
                    icon={MapPin}
                    trend={{ value: 0, isPositive: true }}
                />
                <AdminStatsCard
                    title="Active Vehicles"
                    value={stats.activeVehicles}
                    description="On route today"
                    icon={Bus}
                    trend={{ value: 0, isPositive: true }}
                />
                <AdminStatsCard
                    title="Students Transported"
                    value={stats.totalStudents}
                    description="Currently on routes"
                    icon={Users}
                    trend={{ value: 5, isPositive: true }}
                />
                <AdminStatsCard
                    title="Maintenance Alerts"
                    value={stats.maintenanceAlerts}
                    description="Require attention"
                    icon={AlertTriangle}
                    variant={stats.maintenanceAlerts > 0 ? "warning" : "default"}
                />
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Link href="/admin/transport/routes/create">
                            <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
                                    <MapPin className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="font-medium text-center">Create Route</h3>
                                <p className="text-sm text-muted-foreground text-center mt-1">
                                    Design new transport routes
                                </p>
                            </div>
                        </Link>
                        <Link href="/admin/transport/tracking">
                            <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-3">
                                    <Navigation className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="font-medium text-center">Live Tracking</h3>
                                <p className="text-sm text-muted-foreground text-center mt-1">
                                    Monitor vehicles in real-time
                                </p>
                            </div>
                        </Link>
                        <Link href="/admin/transport/reports">
                            <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-3">
                                    <BarChart3 className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="font-medium text-center">Reports</h3>
                                <p className="text-sm text-muted-foreground text-center mt-1">
                                    View transport analytics
                                </p>
                            </div>
                        </Link>
                        <Link href="/admin/transport/schedule">
                            <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-3">
                                    <Clock className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="font-medium text-center">Schedule</h3>
                                <p className="text-sm text-muted-foreground text-center mt-1">
                                    Manage pickup times
                                </p>
                            </div>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="routes">
                <TabsList className="mb-4">
                    <TabsTrigger value="routes" className="gap-2">
                        <MapPin className="h-4 w-4" />
                        Routes ({mockRoutes.length})
                    </TabsTrigger>
                    <TabsTrigger value="vehicles" className="gap-2">
                        <Bus className="h-4 w-4" />
                        Vehicles ({mockVehicles.length})
                    </TabsTrigger>
                    <TabsTrigger value="drivers" className="gap-2">
                        <Users className="h-4 w-4" />
                        Drivers ({mockDrivers.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="routes">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Transport Routes</CardTitle>
                            <Link href="/admin/transport/routes/create">
                                <Button size="sm" className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Route
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                data={mockRoutes}
                                columns={routeColumns}
                                searchable
                                searchPlaceholder="Search routes..."
                                emptyTitle="No routes found"
                                emptyDescription="Create your first transport route."
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
                                data={mockVehicles}
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
                                data={mockDrivers}
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
