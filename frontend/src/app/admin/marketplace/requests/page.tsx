"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/formatters";
import { Inbox, Plus, Check, X } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  new_module: "New Module",
  plan_locked: "Plan Locked",
  rbac_restricted: "RBAC Restricted",
  beta_suspended: "Beta / Suspended",
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  new_module: "Request a new module to be added to the marketplace",
  plan_locked: "Request access to a module locked behind a higher plan",
  rbac_restricted: "Request an exception for a module that requires specific staff roles",
  beta_suspended: "Request early access to a beta or temporarily suspended module",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "border-amber-500/20 bg-amber-500/10 text-amber-700",
  submitted: "border-amber-500/20 bg-amber-500/10 text-amber-700",
  under_review: "border-sky-500/20 bg-sky-500/10 text-sky-700",
  approved: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
  approved_plan_upgrade_required: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
  approved_exception_granted: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
  approved_forwarded: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
  rejected: "border-rose-500/20 bg-rose-500/10 text-rose-700",
  waitlisted: "border-violet-500/20 bg-violet-500/10 text-violet-700",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  approved_plan_upgrade_required: "Approved — Upgrade Required",
  approved_exception_granted: "Approved — Exception Granted",
  approved_forwarded: "Approved — Forwarded",
  rejected: "Rejected",
  waitlisted: "Waitlisted",
};

export default function ModuleRequestsPage() {
  const { isLoading: authLoading, isAuthenticated, sessionToken } = useAuth();
  const { isLoading: tenantLoading } = useTenant();
  const hasLiveTenantSession = !!sessionToken && sessionToken !== "dev_session_token";
  const canQueryRequests = !authLoading && isAuthenticated && hasLiveTenantSession;
  const [activeTab, setActiveTab] = useState("all");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [form, setForm] = useState({
    type: "new_module" as "new_module" | "plan_locked" | "rbac_restricted" | "beta_suspended",
    moduleId: "",
    name: "",
    description: "",
    useCase: "",
    urgencyLevel: "normal" as string,
    budgetKes: "",
  });

  // New module_requests (4-type)
  const typedRequests = useQuery(
    api.modules.marketplace.modules.getModuleRequests,
    sessionToken ? { sessionToken } : "skip",
    canQueryRequests
  ) as any[] | undefined;

  // Legacy moduleRequests (access requests from users)
  const legacyRequests = useQuery(
    api.modules.marketplace.queries.getModuleRequests,
    sessionToken ? { sessionToken } : "skip"
    ,
    canQueryRequests
  ) as any[] | undefined;

  const submitRequest = useMutation(api.modules.marketplace.modules.submitModuleRequest);
  const reviewLegacy = useMutation(api.modules.marketplace.mutations.reviewModuleRequest);

  if (authLoading || tenantLoading || (canQueryRequests && (typedRequests === undefined || legacyRequests === undefined))) {
    return <LoadingSkeleton variant="page" />;
  }

  const allTyped = typedRequests ?? [];
  const allLegacy = legacyRequests ?? [];

  const pendingLegacy = allLegacy.filter((r) => r.status === "pending");
  const approvedLegacy = allLegacy.filter((r) => r.status === "approved");
  const rejectedLegacy = allLegacy.filter((r) => r.status === "rejected");

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitRequest({
        type: form.type,
        moduleId: form.moduleId || undefined,
        name: form.name || undefined,
        description: form.description || undefined,
        useCase: form.useCase || undefined,
        urgencyLevel: form.urgencyLevel || undefined,
        budgetKes: form.budgetKes ? Number(form.budgetKes) : undefined,
      });
      toast.success("Request submitted successfully");
      setSubmitOpen(false);
      setForm({ type: "new_module", moduleId: "", name: "", description: "", useCase: "", urgencyLevel: "normal", budgetKes: "" });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!sessionToken) return;
    setProcessing(true);
    try {
      await reviewLegacy({ sessionToken, requestId: requestId as Id<"moduleRequests">, status: "approved" });
      toast.success("Request approved");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to approve request");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!sessionToken) return;
    setProcessing(true);
    try {
      await reviewLegacy({ sessionToken, requestId: requestId as Id<"moduleRequests">, status: "rejected" });
      toast.success("Request rejected");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to reject request");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Module Requests"
        description="Submit and track requests for new modules, plan exceptions, RBAC overrides, and beta access."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Marketplace", href: "/admin/marketplace" },
          { label: "Requests" },
        ]}
        actions={
          <Button className="bg-[#0F4C2A] hover:bg-[#1A7A4A] text-white" onClick={() => setSubmitOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Submit Request
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Requests ({allTyped.length})</TabsTrigger>
          <TabsTrigger value="pending_access">Pending Access ({pendingLegacy.length})</TabsTrigger>
          <TabsTrigger value="approved_access">Approved ({approvedLegacy.length})</TabsTrigger>
          <TabsTrigger value="rejected_access">Rejected ({rejectedLegacy.length})</TabsTrigger>
        </TabsList>

        {/* Typed requests (4 types) */}
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {allTyped.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No requests yet"
                  description="Submit a request to get access to a module outside your current plan."
                  className="py-12"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Module / Name</TableHead>
                      <TableHead>Use Case</TableHead>
                      <TableHead>Urgency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Resolution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allTyped.map((req: any) => (
                      <TableRow key={req._id}>
                        <TableCell>
                          <Badge variant="outline" className="whitespace-nowrap">
                            {TYPE_LABELS[req.type] ?? req.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{req.name ?? req.moduleId ?? "—"}</p>
                          {req.moduleId && req.name && (
                            <p className="font-mono text-xs text-muted-foreground">{req.moduleId}</p>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <p className="truncate text-sm text-muted-foreground">{req.useCase ?? req.description ?? "—"}</p>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize text-sm">{req.urgencyLevel ?? "normal"}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_COLORS[req.status] ?? ""}>
                            {STATUS_LABELS[req.status] ?? req.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatRelativeTime(req.createdAt)}
                        </TableCell>
                        <TableCell className="max-w-[180px]">
                          <p className="truncate text-sm text-muted-foreground">{req.resolution ?? "—"}</p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legacy access requests — pending */}
        <TabsContent value="pending_access" className="mt-4">
          <LegacyRequestTable requests={pendingLegacy} showActions onApprove={handleApprove} onReject={handleReject} isProcessing={processing} />
        </TabsContent>

        <TabsContent value="approved_access" className="mt-4">
          <LegacyRequestTable requests={approvedLegacy} />
        </TabsContent>

        <TabsContent value="rejected_access" className="mt-4">
          <LegacyRequestTable requests={rejectedLegacy} />
        </TabsContent>
      </Tabs>

      {/* Submit Request Dialog */}
      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit Module Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Request type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{TYPE_DESCRIPTIONS[form.type]}</p>
            </div>

            {(form.type === "plan_locked" || form.type === "rbac_restricted" || form.type === "beta_suspended") && (
              <div className="space-y-2">
                <Label>Module ID <span className="text-muted-foreground">(optional)</span></Label>
                <Input
                  placeholder="e.g. timetable"
                  value={form.moduleId}
                  onChange={(e) => setForm((f) => ({ ...f, moduleId: e.target.value }))}
                />
              </div>
            )}

            {form.type === "new_module" && (
              <div className="space-y-2">
                <Label>Module name</Label>
                <Input
                  placeholder="e.g. Parent Communication Hub"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe what this module does or why you need access…"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Use case</Label>
              <Textarea
                placeholder="How will your school use this module?"
                rows={2}
                value={form.useCase}
                onChange={(e) => setForm((f) => ({ ...f, useCase: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Urgency</Label>
                <Select value={form.urgencyLevel} onValueChange={(v) => setForm((f) => ({ ...f, urgencyLevel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Budget (KES) <span className="text-muted-foreground">optional</span></Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.budgetKes}
                  onChange={(e) => setForm((f) => ({ ...f, budgetKes: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitOpen(false)} disabled={submitting}>Cancel</Button>
            <Button
              className="bg-[#0F4C2A] hover:bg-[#1A7A4A] text-white"
              onClick={handleSubmit}
              disabled={submitting || (!form.description && !form.name && !form.moduleId)}
            >
              {submitting ? "Submitting…" : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LegacyRequestTable({
  requests,
  showActions,
  onApprove,
  onReject,
  isProcessing,
}: {
  requests: any[];
  showActions?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  isProcessing?: boolean;
}) {
  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <EmptyState icon={Inbox} title="No requests" description="Module access requests will appear here." />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Status</TableHead>
              {showActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req: any) => (
              <TableRow key={req._id}>
                <TableCell className="font-mono text-xs">{req.userId}</TableCell>
                <TableCell>
                  <p className="font-medium">{req.moduleName ?? req.moduleId}</p>
                  <p className="font-mono text-xs text-muted-foreground">{req.moduleId}</p>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <p className="truncate text-sm text-muted-foreground">{req.reason ?? "—"}</p>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatRelativeTime(req.requestedAt)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATUS_COLORS[req.status] ?? ""}>
                    {STATUS_LABELS[req.status] ?? req.status}
                  </Badge>
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" disabled={isProcessing} onClick={() => onApprove?.(req._id)}>
                        <Check className="mr-1 h-3 w-3" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" disabled={isProcessing} className="text-destructive hover:text-destructive" onClick={() => onReject?.(req._id)}>
                        <X className="mr-1 h-3 w-3" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
