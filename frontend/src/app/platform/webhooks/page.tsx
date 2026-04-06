"use client";

import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDateTime, formatRelativeTime } from "@/lib/formatters";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  Plus,
  RefreshCw,
  Send,
  Webhook,
  XCircle,
} from "lucide-react";
import { SecurityAdminRail } from "@/components/platform/SecurityAdminRail";

type Endpoint = {
  _id: string;
  url: string;
  events: string[];
  isActive: boolean;
  description?: string;
  failureCount?: number;
  lastTriggeredAt?: number;
  createdAt: number;
};

type Delivery = {
  _id: string;
  endpointId: string;
  event: string;
  status: "pending" | "success" | "failed";
  statusCode: number;
  response?: string;
  attemptCount: number;
  createdAt: number;
  completedAt?: number;
};

function statusClass(status: Delivery["status"] | "active" | "inactive") {
  switch (status) {
    case "success":
    case "active":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
    case "failed":
    case "inactive":
      return "border-rose-500/20 bg-rose-500/10 text-rose-700";
    case "pending":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700";
    default:
      return "border-slate-500/20 bg-slate-500/10 text-slate-700";
  }
}

export default function WebhooksPage() {
  const { sessionToken, isLoading } = useAuth();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newSecret, setNewSecret] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [latestSecret, setLatestSecret] = useState<string | null>(null);
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<"all" | "pending" | "success" | "failed">("all");
  const [saving, setSaving] = useState(false);

  const endpoints = usePlatformQuery(
    api.platform.webhooks.queries.listEndpoints,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as Endpoint[] | undefined;

  const deliveries = usePlatformQuery(
    api.platform.webhooks.queries.listDeliveries,
    sessionToken
      ? {
          sessionToken,
          ...(deliveryStatusFilter !== "all" ? { status: deliveryStatusFilter } : {}),
          limit: 20,
        }
      : "skip",
    !!sessionToken
  ) as Delivery[] | undefined;

  const eventCatalog = usePlatformQuery(
    api.platform.webhooks.queries.getWebhookEventCatalog,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as string[] | undefined;

  const createEndpoint = useMutation(api.platform.webhooks.mutations.createEndpoint);
  const deleteEndpoint = useMutation(api.platform.webhooks.mutations.deleteEndpoint);
  const testEndpoint = useMutation(api.platform.webhooks.mutations.testEndpoint);
  const retryDelivery = useMutation(api.platform.webhooks.mutations.retryDelivery);

  const stats = useMemo(() => {
    const endpointRows = endpoints ?? [];
    const deliveryRows = deliveries ?? [];
    return {
      totalEndpoints: endpointRows.length,
      activeEndpoints: endpointRows.filter((endpoint) => endpoint.isActive).length,
      failingEndpoints: endpointRows.filter((endpoint) => (endpoint.failureCount ?? 0) > 0).length,
      failedDeliveries: deliveryRows.filter((delivery) => delivery.status === "failed").length,
    };
  }, [deliveries, endpoints]);

  if (isLoading || endpoints === undefined || deliveries === undefined || eventCatalog === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const toggleEvent = (eventName: string) => {
    setSelectedEvents((current) =>
      current.includes(eventName)
        ? current.filter((entry) => entry !== eventName)
        : [...current, eventName]
    );
  };

  const handleCreate = async () => {
    if (!sessionToken || !newUrl.trim() || selectedEvents.length === 0) return;
    setSaving(true);
    try {
      const result = await createEndpoint({
        sessionToken,
        url: newUrl.trim(),
        events: selectedEvents,
        description: newDescription.trim() || undefined,
        secret: newSecret.trim() || undefined,
      });
      setLatestSecret(result.secret ?? null);
      setCreateOpen(false);
      setNewUrl("");
      setNewSecret("");
      setNewDescription("");
      setSelectedEvents([]);
      toast({ title: "Webhook endpoint created" });
    } catch (error) {
      toast({
        title: "Unable to create webhook endpoint",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Webhook Management"
        description="Register outbound platform webhooks, test deliveries, and monitor endpoint health."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Webhooks" },
        ]}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Endpoint
          </Button>
        }
      />

      <SecurityAdminRail currentHref="/platform/webhooks" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Endpoints" value={String(stats.totalEndpoints)} icon={Webhook} />
        <MetricCard title="Active" value={String(stats.activeEndpoints)} icon={CheckCircle2} />
        <MetricCard title="Endpoint Failures" value={String(stats.failingEndpoints)} icon={AlertTriangle} />
        <MetricCard title="Failed Deliveries" value={String(stats.failedDeliveries)} icon={XCircle} />
      </div>

      {latestSecret ? (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex flex-col gap-3 pt-6 md:flex-row md:items-center md:justify-between">
            <div className="text-sm">
              <p className="font-medium">New endpoint secret</p>
              <code className="mt-2 inline-block rounded bg-muted px-2 py-1">{latestSecret}</code>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(latestSecret);
                toast({ title: "Secret copied" });
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy secret
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Webhook Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          {endpoints.length === 0 ? (
            <EmptyState
              icon={Webhook}
              title="No webhook endpoints configured"
              description="Add an endpoint to start receiving platform event notifications."
            />
          ) : (
            <div className="space-y-4">
              {endpoints.map((endpoint) => (
                <div key={String(endpoint._id)} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          <code className="rounded bg-muted px-2 py-1 text-sm">{endpoint.url}</code>
                        </div>
                        <Badge variant="outline" className={statusClass(endpoint.isActive ? "active" : "inactive")}>
                          {endpoint.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {(endpoint.failureCount ?? 0) > 0 ? (
                          <Badge variant="outline" className="border-rose-500/20 bg-rose-500/10 text-rose-700">
                            {endpoint.failureCount} failure{endpoint.failureCount === 1 ? "" : "s"}
                          </Badge>
                        ) : null}
                      </div>

                      {endpoint.description ? (
                        <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                      ) : null}

                      <div className="flex flex-wrap gap-2">
                        {endpoint.events.map((eventName) => (
                          <Badge key={eventName} variant="outline">
                            {eventName}
                          </Badge>
                        ))}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Created {formatDateTime(endpoint.createdAt)}
                        {endpoint.lastTriggeredAt ? ` · Last triggered ${formatRelativeTime(endpoint.lastTriggeredAt)}` : ""}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            await testEndpoint({ sessionToken: sessionToken ?? "", endpointId: endpoint._id as never });
                            toast({ title: "Test webhook queued" });
                          } catch (error) {
                            toast({
                              title: "Unable to queue test webhook",
                              description: error instanceof Error ? error.message : "Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            await deleteEndpoint({ sessionToken: sessionToken ?? "", endpointId: endpoint._id as never });
                            toast({ title: "Endpoint deleted" });
                          } catch (error) {
                            toast({
                              title: "Unable to delete endpoint",
                              description: error instanceof Error ? error.message : "Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Deliveries</CardTitle>
          <div className="flex gap-2">
            <Button variant={deliveryStatusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setDeliveryStatusFilter("all")}>All</Button>
            <Button variant={deliveryStatusFilter === "pending" ? "default" : "outline"} size="sm" onClick={() => setDeliveryStatusFilter("pending")}>Pending</Button>
            <Button variant={deliveryStatusFilter === "success" ? "default" : "outline"} size="sm" onClick={() => setDeliveryStatusFilter("success")}>Success</Button>
            <Button variant={deliveryStatusFilter === "failed" ? "default" : "outline"} size="sm" onClick={() => setDeliveryStatusFilter("failed")}>Failed</Button>
          </div>
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <EmptyState
              icon={Clock3}
              title="No webhook deliveries yet"
              description="Webhook delivery attempts will appear here once endpoints start receiving events."
            />
          ) : (
            <div className="space-y-4">
              {deliveries.map((delivery) => (
                <div key={String(delivery._id)} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{delivery.event}</p>
                        <Badge variant="outline" className={statusClass(delivery.status)}>
                          {delivery.status}
                        </Badge>
                        <Badge variant="outline">HTTP {delivery.statusCode || 0}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Attempt {delivery.attemptCount} · Created {formatDateTime(delivery.createdAt)}
                        {delivery.completedAt ? ` · Completed ${formatRelativeTime(delivery.completedAt)}` : ""}
                      </div>
                      {delivery.response ? (
                        <Textarea readOnly value={delivery.response} rows={3} className="text-xs" />
                      ) : null}
                    </div>
                    {delivery.status === "failed" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            await retryDelivery({ sessionToken: sessionToken ?? "", deliveryId: delivery._id as never });
                            toast({ title: "Retry queued" });
                          } catch (error) {
                            toast({
                              title: "Unable to retry delivery",
                              description: error instanceof Error ? error.message : "Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Webhook Endpoint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Endpoint URL">
              <Input value={newUrl} onChange={(event) => setNewUrl(event.target.value)} placeholder="https://your-app.com/webhooks/edumyles" />
            </Field>
            <Field label="Description">
              <Textarea value={newDescription} onChange={(event) => setNewDescription(event.target.value)} rows={3} placeholder="Describe what this endpoint is used for." />
            </Field>
            <Field label="Signing Secret (optional)">
              <Input value={newSecret} onChange={(event) => setNewSecret(event.target.value)} type="password" placeholder="whsec_..." />
            </Field>
            <div className="space-y-2">
              <Label>Events</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {eventCatalog.map((eventName) => (
                  <label key={eventName} className="flex items-center gap-2 rounded-xl border p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(eventName)}
                      onChange={() => toggleEvent(eventName)}
                      className="rounded"
                    />
                    <span>{eventName}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving || !newUrl.trim() || selectedEvents.length === 0}>
              Create Endpoint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: typeof Webhook;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold">{value}</p>
          </div>
          <div className="rounded-xl border bg-muted/40 p-2">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
