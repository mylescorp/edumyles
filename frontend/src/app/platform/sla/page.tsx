"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "convex/react";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/convex/_generated/api";
import {
  Timer,
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Shield,
  Loader2,
  Trash2,
  Edit,
} from "lucide-react";

export default function SLAManagementPage() {
  const { sessionToken } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPriority, setNewPriority] = useState("");
  const [newResponseTime, setNewResponseTime] = useState("");
  const [newResolutionTime, setNewResolutionTime] = useState("");

  const configs = usePlatformQuery(
    api.platform.sla.queries.listSLAConfigurations,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );

  const metrics = usePlatformQuery(
    api.platform.sla.queries.getSLAMetrics,
    { sessionToken: sessionToken || "", timeRange: "30d" },
    !!sessionToken
  );

  const breaches = usePlatformQuery(
    api.platform.sla.queries.listBreaches,
    { sessionToken: sessionToken || "", limit: 20 },
    !!sessionToken
  );

  const createConfig = useMutation(api.platform.sla.mutations.createSLAConfig);
  const deleteConfig = useMutation(api.platform.sla.mutations.deleteSLAConfig);

  const handleCreate = async () => {
    if (!sessionToken || !newName || !newPriority) return;
    try {
      await createConfig({
        sessionToken,
        name: newName,
        priority: newPriority,
        responseTimeHours: parseFloat(newResponseTime) || 1,
        resolutionTimeHours: parseFloat(newResolutionTime) || 24,
      });
      setIsCreateOpen(false);
      setNewName("");
      setNewPriority("");
      setNewResponseTime("");
      setNewResolutionTime("");
    } catch (error) {
      console.error("Failed to create SLA:", error);
    }
  };

  if (!configs) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="SLA Management"
        description="Configure and monitor Service Level Agreements"
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> New SLA Configuration
          </Button>
        }
      />

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{metrics ? `${Math.round((metrics.complianceRate || 0) * 100)}%` : "—"}</p>
                <p className="text-sm text-muted-foreground">Compliance Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Timer className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{configs.length}</p>
                <p className="text-sm text-muted-foreground">Active SLAs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{metrics?.totalBreaches || 0}</p>
                <p className="text-sm text-muted-foreground">Total Breaches</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{metrics?.responseBreaches || 0}</p>
                <p className="text-sm text-muted-foreground">Response Breaches</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA Configurations */}
      <Card>
        <CardHeader>
          <CardTitle>SLA Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Timer className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No SLA configurations yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {configs.map((config: any) => (
                <div key={config._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{config.name}</p>
                      <p className="text-sm text-muted-foreground">Priority: {config.priority}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm"><Clock className="h-3 w-3 inline mr-1" />Response: {config.responseTimeHours}h</p>
                      <p className="text-sm"><CheckCircle className="h-3 w-3 inline mr-1" />Resolution: {config.resolutionTimeHours}h</p>
                    </div>
                    <Badge variant={config.isActive ? "default" : "secondary"}>
                      {config.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (!sessionToken) return;
                        await deleteConfig({ sessionToken, configId: config._id });
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Breach Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Breaches</CardTitle>
        </CardHeader>
        <CardContent>
          {!breaches || breaches.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500 opacity-50" />
              <p>No SLA breaches recorded.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {breaches.map((breach: any) => (
                <div key={breach._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Ticket: {breach.ticketId}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(breach.breachedAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="destructive">{breach.breachType}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create SLA Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Critical Priority SLA" />
            </div>
            <div className="space-y-2">
              <Label>Priority Level</Label>
              <Select value={newPriority} onValueChange={setNewPriority}>
                <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Response Time (hours)</Label>
                <Input type="number" value={newResponseTime} onChange={(e) => setNewResponseTime(e.target.value)} placeholder="1" />
              </div>
              <div className="space-y-2">
                <Label>Resolution Time (hours)</Label>
                <Input type="number" value={newResolutionTime} onChange={(e) => setNewResolutionTime(e.target.value)} placeholder="24" />
              </div>
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!newName || !newPriority}>
              Create SLA Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
