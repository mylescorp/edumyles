"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, MapPin, Plus, X, Clock, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Stop {
  id: string;
  name: string;
  address: string;
  estimatedTime: number;
  order: number;
}

export default function CreateRoutePage() {
  const { isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    vehicleId: "",
    driverId: "",
    morningDeparture: "",
    afternoonDeparture: "",
    capacity: 0,
    fare: 0,
  });
  
  const [stops, setStops] = useState<Stop[]>([]);
  const [newStop, setNewStop] = useState({ name: "", address: "", estimatedTime: 10 });

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addStop = () => {
    if (newStop.name && newStop.address) {
      const stop: Stop = {
        id: Date.now().toString(),
        name: newStop.name,
        address: newStop.address,
        estimatedTime: newStop.estimatedTime,
        order: stops.length + 1,
      };
      setStops([...stops, stop]);
      setNewStop({ name: "", address: "", estimatedTime: 10 });
    }
  };

  const removeStop = (id: string) => {
    setStops(stops.filter(stop => stop.id !== id));
  };

  const moveStop = (id: string, direction: 'up' | 'down') => {
    const index = stops.findIndex(stop => stop.id === id);
    if (index === -1) return;
    
    const newStops = [...stops];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < stops.length) {
      [newStops[index], newStops[newIndex]] = [newStops[newIndex], newStops[index]];
      newStops.forEach((stop, i) => stop.order = i + 1);
      setStops(newStops);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to createRoute mutation when transport module is configured
    alert("Route creation will be available once the transport module is configured.");
  };

  const totalEstimatedTime = stops.reduce((total, stop) => total + stop.estimatedTime, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Transport Route"
        description="Design a new transport route with stops and schedule"
        actions={
          <Link href="/admin/transport">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Transport
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Route Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Route Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="e.g., Downtown - School Route"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="capacity">Capacity *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => handleInputChange("capacity", parseInt(e.target.value) || 0)}
                      placeholder="Number of students"
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe the route and areas covered"
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="fare">Fare (KES)</Label>
                    <Input
                      id="fare"
                      type="number"
                      min="0"
                      value={formData.fare}
                      onChange={(e) => handleInputChange("fare", parseInt(e.target.value) || 0)}
                      placeholder="500"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="morningDeparture">Morning Departure</Label>
                    <Input
                      id="morningDeparture"
                      type="time"
                      value={formData.morningDeparture}
                      onChange={(e) => handleInputChange("morningDeparture", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="afternoonDeparture">Afternoon Departure</Label>
                    <Input
                      id="afternoonDeparture"
                      type="time"
                      value={formData.afternoonDeparture}
                      onChange={(e) => handleInputChange("afternoonDeparture", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Route Stops */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Route Stops
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Stop */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium">Add New Stop</h4>
                  <div className="grid gap-3 md:grid-cols-4">
                    <div>
                      <Label htmlFor="stopName">Stop Name</Label>
                      <Input
                        id="stopName"
                        value={newStop.name}
                        onChange={(e) => setNewStop({ ...newStop, name: e.target.value })}
                        placeholder="e.g., Central Park"
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="stopAddress">Address</Label>
                      <Input
                        id="stopAddress"
                        value={newStop.address}
                        onChange={(e) => setNewStop({ ...newStop, address: e.target.value })}
                        placeholder="Full address"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="estimatedTime">Est. Time (min)</Label>
                      <Input
                        id="estimatedTime"
                        type="number"
                        min="1"
                        value={newStop.estimatedTime}
                        onChange={(e) => setNewStop({ ...newStop, estimatedTime: parseInt(e.target.value) || 10 })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button type="button" onClick={addStop} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Stop
                  </Button>
                </div>

                {/* Stops List */}
                <div className="space-y-2">
                  {stops.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No stops added yet. Add stops to create the route.
                    </div>
                  ) : (
                    stops.map((stop, index) => (
                      <div key={stop.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <div className="w-8 h-8 bg-success-bg rounded-full flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium">{stop.name}</h5>
                          <p className="text-sm text-muted-foreground">{stop.address}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {stop.estimatedTime} min
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => moveStop(stop.id, 'up')}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => moveStop(stop.id, 'down')}
                            disabled={index === stops.length - 1}
                          >
                            ↓
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => removeStop(stop.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {stops.length > 0 && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Estimated Time:</span>
                      <span className="text-sm font-bold">{totalEstimatedTime} minutes</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle & Driver</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="vehicleId">Vehicle</Label>
                  <Select value={formData.vehicleId} onValueChange={(value) => handleInputChange("vehicleId", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vehicle1">Bus ABC-123 (45 seats)</SelectItem>
                      <SelectItem value="vehicle2">Van XYZ-789 (15 seats)</SelectItem>
                      <SelectItem value="vehicle3">Minibus DEF-456 (25 seats)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="driverId">Driver</Label>
                  <Select value={formData.driverId} onValueChange={(value) => handleInputChange("driverId", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="driver1">John Kamau</SelectItem>
                      <SelectItem value="driver2">Mary Wanjiku</SelectItem>
                      <SelectItem value="driver3">James Otieno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Route Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Stops:</span>
                    <span className="font-medium">{stops.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Capacity:</span>
                    <span className="font-medium">{formData.capacity} students</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Route Time:</span>
                    <span className="font-medium">{totalEstimatedTime} min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Daily Fare:</span>
                    <span className="font-medium">KES {formData.fare}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p>• Order stops in the sequence they'll be visited</p>
                  <p>• Consider traffic patterns for timing</p>
                  <p>• Ensure capacity matches vehicle size</p>
                  <p>• Set reasonable pickup times</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1 gap-2" disabled={stops.length === 0}>
                <Save className="h-4 w-4" />
                Create Route
              </Button>
              <Link href="/admin/transport">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
