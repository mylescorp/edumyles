"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LifeBuoy,
  Plus,
  Shield,
  Timer,
} from "lucide-react";

type SlaConfig = {
  _id: string;
  supportTier: "community" | "email" | "priority" | "dedicated";
  firstResponseHours: number;
  resolutionHours: number;
  businessHoursOnly: boolean;
  escalationRules: unknown;
  createdAt: number;
  updatedAt: number;
};

type SupportTicket = {
  _id: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  assignedTo?: string;
  slaDueAt?: number;
  resolvedAt?: number;
  createdAt: number;
  updatedAt: number;
};

const emptyEscalationRules = `[
  { "afterHours": 2, "notifyRole": "support_agent" }
]`;

export default function PlatformSlaPage() {
  const { sessionToken } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [supportTier, setSupportTier] = useState<SlaConfig["supportTier"]>("community");
  const [firstResponseHours, setFirstResponseHours] = useState("4");
  const [resolutionHours, setResolutionHours] = useState("48");
  const [businessHoursOnly, setBusinessHoursOnly] = useState(true);
  const [escalationRules, setEscalationRules] = useState(emptyEscalationRules);
  const [pageLoadedAt] = useState(() => Date.now());

  const slaConfigs = usePlatformQuery(
    api.modules.platform.support.getSlaConfigs,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  ) as SlaConfig[] | undefined;

  const supportTickets = usePlatformQuery(
    api.modules.platform.support.getSupportTickets,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  ) as SupportTicket[] | undefined;

  const upsertSlaConfig = useMutation(api.modules.platform.support.upsertSlaConfig);

  const configRows = useMemo(() => slaConfigs ?? [], [slaConfigs]);
  const ticketRows = useMemo(() => supportTickets ?? [], [supportTickets]);

  const metrics = useMemo(() => {
    const openTickets = ticketRows.filter((ticket) => ticket.status === "open" || ticket.status === "in_progress");
    const resolvedTickets = ticketRows.filter((ticket) => ticket.status === "resolved" || ticket.status === "closed");
    const breachedTickets = openTickets.filter((ticket) => typeof ticket.slaDueAt === "number" && ticket.slaDueAt < pageLoadedAt);
    const complianceRate = openTickets.length + resolvedTickets.length > 0
      ? Math.round(((openTickets.length + resolvedTickets.length - breachedTickets.length) / (openTickets.length + resolvedTickets.length)) * 100)
      : 100;

    return {
      activeConfigs: configRows.length,
      openTickets: openTickets.length,
      breachedTickets: breachedTickets.length,
      complianceRate,
      resolvedTickets: resolvedTickets.length,
      breachedList: breachedTickets.slice(0, 10),
    };
  }, [configRows.length, pageLoadedAt, ticketRows]);

  const handleSaveConfig = async () => {
    if (!sessionToken) return;

    try {
      await upsertSlaConfig({
        sessionToken,
        supportTier,
        firstResponseHours: Number(firstResponseHours) || 0,
        resolutionHours: Number(resolutionHours) || 0,
        businessHoursOnly,
        escalationRules: JSON.parse(escalationRules || "[]"),
      });

      toast.success("SLA configuration saved.");
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Failed to save SLA configuration:", error);
      toast.error(error?.message || "Failed to save SLA configuration.");
    }
  };

  if (!sessionToken || slaConfigs === undefined || supportTickets === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SLA"
        description="Manage support response targets and monitor live breach pressure across platform support tickets."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "SLA", href: "/platform/sla" },
        ]}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Configure SLA
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upsert SLA configuration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Support tier</Label>
                  <Select value={supportTier} onValueChange={(value) => setSupportTier(value as SlaConfig["supportTier"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="community">Community</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="dedicated">Dedicated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>First response hours</Label>
                    <Input
                      type="number"
                      min="0"
                      value={firstResponseHours}
                      onChange={(event) => setFirstResponseHours(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Resolution hours</Label>
                    <Input
                      type="number"
                      min="0"
                      value={resolutionHours}
                      onChange={(event) => setResolutionHours(event.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">Business hours only</p>
                    <p className="text-sm text-muted-foreground">Restrict SLA timers to configured support hours.</p>
                  </div>
                  <Switch checked={businessHoursOnly} onCheckedChange={setBusinessHoursOnly} />
                </div>
                <div className="space-y-2">
                  <Label>Escalation rules (JSON)</Label>
                  <Input value={escalationRules} onChange={(event) => setEscalationRules(event.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveConfig}>Save configuration</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-700">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.complianceRate}%</p>
              <p className="text-sm text-muted-foreground">Compliance rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.activeConfigs}</p>
              <p className="text-sm text-muted-foreground">Configured tiers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.openTickets}</p>
              <p className="text-sm text-muted-foreground">Open support tickets</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.breachedTickets}</p>
              <p className="text-sm text-muted-foreground">Tickets past SLA</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SLA configurations</CardTitle>
          <CardDescription>Persisted support-tier response targets from Convex.</CardDescription>
        </CardHeader>
        <CardContent>
          {configRows.length === 0 ? (
            <EmptyState
              icon={Timer}
              title="No SLA configurations yet"
              description="Create the first support tier target to begin tracking response expectations."
            />
          ) : (
            <div className="space-y-3">
              {configRows.map((config) => (
                <div key={config._id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium capitalize">{config.supportTier}</p>
                        <Badge variant="outline">{config.businessHoursOnly ? "Business hours" : "24/7"}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>First response: {config.firstResponseHours}h</span>
                        <span>Resolution: {config.resolutionHours}h</span>
                        <span>Updated {new Date(config.updatedAt).toLocaleDateString("en-KE")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Persisted in platform support settings
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live breach monitor</CardTitle>
          <CardDescription>Derived from support tickets whose `slaDueAt` timestamp has already elapsed.</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.breachedList.length === 0 ? (
            <EmptyState
              icon={Clock3}
              title="No active SLA breaches"
              description="Tickets that fall past their due timestamp will appear here for follow-up."
            />
          ) : (
            <div className="space-y-3">
              {metrics.breachedList.map((ticket) => (
                <div key={ticket._id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{ticket.subject}</p>
                        <Badge variant="destructive">{ticket.priority}</Badge>
                        <Badge variant="outline">{ticket.status}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>Due {ticket.slaDueAt ? new Date(ticket.slaDueAt).toLocaleString("en-KE") : "Not set"}</span>
                        <span>Assigned to {ticket.assignedTo || "Unassigned"}</span>
                        <span>Updated {new Date(ticket.updatedAt).toLocaleDateString("en-KE")}</span>
                      </div>
                    </div>
                    <div className="text-sm text-red-700">Needs escalation review</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
