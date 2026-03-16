"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useMutation } from "convex/react";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useAuth } from "@/hooks/useAuth";
import { api } from "../../../../convex/_generated/api";
import {
  Webhook,
  Plus,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

const EVENT_TYPES = [
  "tenant.created", "tenant.updated", "tenant.deleted",
  "user.created", "user.updated", "ticket.created",
  "ticket.resolved", "payment.received", "subscription.changed",
];

export default function WebhooksPage() {
  const { sessionToken } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newSecret, setNewSecret] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const endpoints = usePlatformQuery(
    api.platform.webhooks.queries.listEndpoints,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );

  const createEndpoint = useMutation(api.platform.webhooks.mutations.createEndpoint);
  const deleteEndpoint = useMutation(api.platform.webhooks.mutations.deleteEndpoint);
  const testEndpoint = useMutation(api.platform.webhooks.mutations.testEndpoint);

  const handleCreate = async () => {
    if (!sessionToken || !newUrl || selectedEvents.length === 0) return;
    try {
      await createEndpoint({
        sessionToken,
        url: newUrl,
        events: selectedEvents,
        secret: newSecret || undefined,
      });
      setIsCreateOpen(false);
      setNewUrl("");
      setNewSecret("");
      setSelectedEvents([]);
    } catch (error) {
      console.error("Failed to create webhook:", error);
    }
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  if (!endpoints) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Webhook Management"
        description="Configure webhook endpoints for real-time event notifications"
        action={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Endpoint
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Webhook className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{endpoints.length}</p>
                <p className="text-sm text-muted-foreground">Total Endpoints</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{endpoints.filter((e: any) => e.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">
                  {endpoints.filter((e: any) => (e.failureCount || 0) > 0).length}
                </p>
                <p className="text-sm text-muted-foreground">With Failures</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          {endpoints.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Webhook className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No webhook endpoints configured.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {endpoints.map((endpoint: any) => (
                <div key={endpoint._id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <code className="text-sm bg-muted px-2 py-1 rounded">{endpoint.url}</code>
                      <Badge variant={endpoint.isActive ? "default" : "secondary"}>
                        {endpoint.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!sessionToken) return;
                          try { await testEndpoint({ sessionToken, endpointId: endpoint._id }); } catch {}
                        }}
                      >
                        <Send className="h-4 w-4 mr-1" /> Test
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (!sessionToken) return;
                          await deleteEndpoint({ sessionToken, endpointId: endpoint._id });
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {endpoint.events?.map((event: string) => (
                      <Badge key={event} variant="outline" className="text-xs">{event}</Badge>
                    ))}
                  </div>
                  {endpoint.lastTriggeredAt && (
                    <p className="text-xs text-muted-foreground">
                      Last triggered: {new Date(endpoint.lastTriggeredAt).toLocaleString()}
                      {endpoint.failureCount > 0 && (
                        <span className="text-red-500 ml-2">({endpoint.failureCount} failures)</span>
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Webhook Endpoint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Endpoint URL</Label>
              <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://your-app.com/webhook" />
            </div>
            <div className="space-y-2">
              <Label>Secret (optional)</Label>
              <Input value={newSecret} onChange={(e) => setNewSecret(e.target.value)} placeholder="webhook signing secret" type="password" />
            </div>
            <div className="space-y-2">
              <Label>Events</Label>
              <div className="grid grid-cols-2 gap-2">
                {EVENT_TYPES.map((event) => (
                  <label key={event} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event)}
                      onChange={() => toggleEvent(event)}
                      className="rounded"
                    />
                    <span className="text-sm">{event}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!newUrl || selectedEvents.length === 0}>
              Create Endpoint
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
