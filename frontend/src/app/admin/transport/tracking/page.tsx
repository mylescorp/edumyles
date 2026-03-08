"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bus, 
  MapPin, 
  Users, 
  Navigation, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Activity,
  Fuel,
  Wrench
} from "lucide-react";
import { useState } from "react";

export default function TransportTrackingPage() {
  const { isLoading } = useAuth();
  const [selectedVehicle, setSelectedVehicle] = useState("all");
  const [trackingView, setTrackingView] = useState("live");

  if (isLoading) return <LoadingSkeleton variant="page" />;

  // Mock data for demonstration
  const vehicles = [
    {
      id: "vehicle1",
      plateNumber: "ABC-123",
      route: "Downtown - School",
      driver: "John Kamau",
      capacity: 45,
      currentPassengers: 32,
      status: "active",
      location: "Nairobi CBD",
      lastUpdate: "2 minutes ago",
      fuel: 75,
      speed: 45,
      nextStop: "Central Park",
      estimatedArrival: "8:45 AM",
      coordinates: { lat: -1.2921, lng: 36.8219 },
    },
    {
      id: "vehicle2",
      plateNumber: "XYZ-789",
      route: "Westlands - School",
      driver: "Mary Wanjiku",
      capacity: 15,
      currentPassengers: 12,
      status: "active",
      location: "Westlands Mall",
      lastUpdate: "1 minute ago",
      fuel: 60,
      speed: 35,
      nextStop: "Sarit Centre",
      estimatedArrival: "8:30 AM",
      coordinates: { lat: -1.2681, lng: 36.8102 },
    },
    {
      id: "vehicle3",
      plateNumber: "DEF-456",
      route: "Eastlands - School",
      driver: "James Otieno",
      capacity: 25,
      currentPassengers: 18,
      status: "maintenance",
      location: "Garage",
      lastUpdate: "1 hour ago",
      fuel: 40,
      speed: 0,
      nextStop: "N/A",
      estimatedArrival: "N/A",
      coordinates: { lat: -1.2833, lng: 36.8167 },
    },
  ];

  const stats = {
    activeVehicles: vehicles.filter(v => v.status === "active").length,
    totalPassengers: vehicles.reduce((sum, v) => sum + v.currentPassengers, 0),
    averageFuel: Math.round(vehicles.reduce((sum, v) => sum + v.fuel, 0) / vehicles.length),
    maintenanceAlerts: vehicles.filter(v => v.status === "maintenance").length,
  };

  const filteredVehicles = selectedVehicle === "all" 
    ? vehicles 
    : vehicles.filter(v => v.id === selectedVehicle);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "maintenance": return "secondary";
      case "inactive": return "outline";
      default: return "outline";
    }
  };

  const getFuelColor = (fuel: number) => {
    if (fuel > 50) return "text-green-600";
    if (fuel > 25) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle Tracking"
        description="Real-time monitoring of school transport fleet"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Navigation className="h-4 w-4" />
              View Map
            </Button>
            <Button className="gap-2">
              <Activity className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="Active Vehicles"
          value={stats.activeVehicles}
          description="Currently on route"
          icon={Bus}
          trend={{ value: 0, isPositive: true }}
        />
        <AdminStatsCard
          title="Total Passengers"
          value={stats.totalPassengers}
          description="Currently transported"
          icon={Users}
          trend={{ value: 8, isPositive: true }}
        />
        <AdminStatsCard
          title="Avg Fuel Level"
          value={`${stats.averageFuel}%`}
          description="Fleet average"
          icon={Fuel}
          variant={stats.averageFuel > 50 ? "success" : stats.averageFuel > 25 ? "warning" : "danger"}
        />
        <AdminStatsCard
          title="Maintenance Alerts"
          value={stats.maintenanceAlerts}
          description="Require attention"
          icon={Wrench}
          variant={stats.maintenanceAlerts > 0 ? "warning" : "default"}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Tracking Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Vehicle</label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.plateNumber} - {vehicle.route}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">View Mode</label>
              <Select value={trackingView} onValueChange={setTrackingView}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="live">Live Tracking</SelectItem>
                  <SelectItem value="history">Route History</SelectItem>
                  <SelectItem value="maintenance">Maintenance Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Map View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Interactive map would be displayed here</p>
              <p className="text-sm text-muted-foreground mt-2">
                Showing {filteredVehicles.length} vehicle(s)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredVehicles.map((vehicle) => (
          <Card key={vehicle.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{vehicle.plateNumber}</CardTitle>
                <Badge variant={getStatusColor(vehicle.status)}>
                  {vehicle.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{vehicle.route}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Driver Info */}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{vehicle.driver}</span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{vehicle.location}</p>
                  <p className="text-xs text-muted-foreground">{vehicle.lastUpdate}</p>
                </div>
              </div>

              {/* Passengers */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Passengers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {vehicle.currentPassengers}/{vehicle.capacity}
                  </span>
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div 
                      className="bg-forest-600 h-2 rounded-full"
                      style={{ width: `${(vehicle.currentPassengers / vehicle.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Fuel & Speed */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fuel</p>
                    <p className={`text-sm font-medium ${getFuelColor(vehicle.fuel)}`}>
                      {vehicle.fuel}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Speed</p>
                    <p className="text-sm font-medium">{vehicle.speed} km/h</p>
                  </div>
                </div>
              </div>

              {/* Next Stop */}
              {vehicle.status === "active" && (
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Next Stop</p>
                        <p className="text-sm font-medium">{vehicle.nextStop}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">ETA</p>
                      <p className="text-sm font-medium">{vehicle.estimatedArrival}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Alert */}
              {vehicle.status === "maintenance" && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded">
                  <Wrench className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-800">Under maintenance</span>
                </div>
              )}

              {vehicle.fuel < 25 && (
                <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                  <Fuel className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">Low fuel - Refill required</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
