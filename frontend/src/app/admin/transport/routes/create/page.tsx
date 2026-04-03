"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Plus, Save, X } from "lucide-react";
import { createTransportRouteSchema } from "@shared/validators";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateRoutePage() {
  const { isLoading } = useAuth();
  const router = useRouter();
  const createRoute = useMutation(api.modules.transport.mutations.createRoute);
  const [name, setName] = useState("");
  const [currentStop, setCurrentStop] = useState("");
  const [stops, setStops] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const addStop = () => {
    const trimmed = currentStop.trim();
    if (!trimmed) return;
    setStops((prev) => [...prev, trimmed]);
    setCurrentStop("");
  };

  const removeStop = (index: number) => {
    setStops((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    const parsed = createTransportRouteSchema.safeParse({
      name: name.trim(),
      stops: stops.map((stop) => stop.trim()).filter(Boolean),
    });

    if (!parsed.success) {
      setSubmitError(parsed.error.errors[0]?.message ?? "Route details are invalid.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createRoute(parsed.data);
      router.push("/admin/transport/routes");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create route");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Transport Route"
        description="Create a real route record and ordered stop list"
        actions={
          <Link href="/admin/transport/routes">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Routes
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Route Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="route-name">Route Name</Label>
                <Input
                  id="route-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Westlands Pickup Route"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Route Stops
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={currentStop}
                  onChange={(event) => setCurrentStop(event.target.value)}
                  placeholder="Add a stop name"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addStop();
                    }
                  }}
                />
                <Button type="button" onClick={addStop} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Stop
                </Button>
              </div>

              <div className="space-y-2">
                {stops.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Add at least one stop to create the route.</p>
                ) : (
                  stops.map((stop, index) => (
                    <div key={`${stop}-${index}`} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="font-medium">{stop}</span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeStop(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Route name</span>
                <span className="font-medium">{name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stops</span>
                <span className="font-medium">{stops.length}</span>
              </div>
            </CardContent>
          </Card>

          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

          <div className="flex gap-2">
            <Button type="submit" className="flex-1 gap-2" disabled={isSubmitting}>
              <Save className="h-4 w-4" />
              {isSubmitting ? "Creating..." : "Create Route"}
            </Button>
            <Link href="/admin/transport/routes">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
