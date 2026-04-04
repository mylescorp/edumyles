"use client";

/**
 * /platform/waitlist
 *
 * Master admin review queue for users who signed up via WorkOS but are not
 * yet provisioned in the EduMyles database.
 *
 * Actions:
 *  • Approve  — assigns a tenant and role, then calls /api/waitlist/approve
 *               which creates the Convex user record and adds the user to the
 *               corresponding WorkOS Organization.
 *  • Reject   — calls /api/waitlist/reject with an optional review note.
 */

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Building2,
  Mail,
  User,
  Search,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

// ── Types ────────────────────────────────────────────────────────────────────

interface WaitlistApplication {
  _id: string;
  workosUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  schoolName?: string;
  requestedRole?: string;
  message?: string;
  source?: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: number;
  reviewedBy?: string;
  reviewedAt?: number;
  reviewNotes?: string;
  assignedTenantId?: string;
  assignedRole?: string;
}

interface TenantOption {
  tenantId: string;
  name: string;
  subdomain: string;
}

const ROLE_OPTIONS = [
  { value: "school_admin", label: "School Admin" },
  { value: "principal", label: "Principal" },
  { value: "teacher", label: "Teacher" },
  { value: "bursar", label: "Bursar" },
  { value: "hr_manager", label: "HR Manager" },
  { value: "librarian", label: "Librarian" },
  { value: "transport_manager", label: "Transport Manager" },
  { value: "board_member", label: "Board Member" },
  { value: "parent", label: "Parent / Guardian" },
  { value: "student", label: "Student" },
  { value: "alumni", label: "Alumni" },
  { value: "partner", label: "Partner" },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function WaitlistPage() {
  const { isLoading, sessionToken } = useAuth();

  // Data
  const applications = usePlatformQuery(
    api.waitlist.listApplications,
    { sessionToken: sessionToken ?? "" }
  ) as WaitlistApplication[] | undefined;

  const counts = usePlatformQuery(
    api.waitlist.getApplicationCounts,
    { sessionToken: sessionToken ?? "" }
  );

  const tenants = usePlatformQuery(
    api.platform.tenants.queries.listAllTenants,
    { sessionToken: sessionToken ?? "" }
  ) as TenantOption[] | undefined;

  // UI state
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [search, setSearch] = useState("");
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<WaitlistApplication | null>(null);

  // Approve form state
  const [assignedTenantId, setAssignedTenantId] = useState("");
  const [assignedRole, setAssignedRole] = useState("school_admin");
  const [approveNotes, setApproveNotes] = useState("");

  // Reject form state
  const [rejectNotes, setRejectNotes] = useState("");

  const [processing, setProcessing] = useState(false);

  const isProvisionableApplication = (app: WaitlistApplication | null) =>
    Boolean(app?.workosUserId) && !app!.workosUserId.startsWith("landing:");

  if (isLoading || !applications) {
    return <LoadingSkeleton variant="page" />;
  }

  // ── Filter ───────────────────────────────────────────────────────────────

  const filtered = applications
    .filter((a) => a.status === tab)
    .filter((a) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        a.email.toLowerCase().includes(q) ||
        (a.firstName ?? "").toLowerCase().includes(q) ||
        (a.lastName ?? "").toLowerCase().includes(q) ||
        (a.schoolName ?? "").toLowerCase().includes(q)
      );
    });

  // ── Actions ──────────────────────────────────────────────────────────────

  function openApprove(app: WaitlistApplication) {
    setSelectedApp(app);
    setAssignedTenantId(app.assignedTenantId ?? "");
    setAssignedRole(app.requestedRole ?? "school_admin");
    setApproveNotes("");
    setApproveDialogOpen(true);
  }

  function openReject(app: WaitlistApplication) {
    setSelectedApp(app);
    setRejectNotes("");
    setRejectDialogOpen(true);
  }

  async function handleApprove() {
    if (!selectedApp || !sessionToken) return;
    const needsProvisioning = isProvisionableApplication(selectedApp);
    if (needsProvisioning && (!assignedTenantId || !assignedRole)) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/waitlist/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          applicationId: selectedApp._id,
          assignedTenantId: needsProvisioning ? assignedTenantId : undefined,
          assignedRole: needsProvisioning ? assignedRole : undefined,
          reviewNotes: approveNotes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Approval failed");
      toast.success(
        data.provisioned
          ? `${selectedApp.email} approved and provisioned`
          : `${selectedApp.email} approved and queued for follow-up`
      );
      setApproveDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to approve");
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    if (!selectedApp || !sessionToken) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/waitlist/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          applicationId: selectedApp._id,
          reviewNotes: rejectNotes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Rejection failed");
      toast.success(`${selectedApp.email} application rejected`);
      setRejectDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to reject");
    } finally {
      setProcessing(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Waitlist & Approvals"
        description="Review sign-up requests and provision users to their tenant"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Waitlist" },
        ]}
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          label="Pending review"
          value={counts?.pending ?? 0}
          bg="bg-amber-50 dark:bg-amber-950/20"
        />
        <StatsCard
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
          label="Approved"
          value={counts?.approved ?? 0}
          bg="bg-green-50 dark:bg-green-950/20"
        />
        <StatsCard
          icon={<XCircle className="h-5 w-5 text-red-400" />}
          label="Rejected"
          value={counts?.rejected ?? 0}
          bg="bg-red-50 dark:bg-red-950/20"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Applications
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="pending">
                Pending
                {(counts?.pending ?? 0) > 0 && (
                  <Badge variant="destructive" className="ml-1.5 h-4 min-w-4 text-[10px]">
                    {counts?.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            {(["pending", "approved", "rejected"] as const).map((t) => (
              <TabsContent key={t} value={t} className="mt-4">
                {filtered.length === 0 ? (
                  <EmptyState tab={t} />
                ) : (
                  <div className="divide-y">
                    {filtered.map((app) => (
                      <ApplicationRow
                        key={app._id}
                        app={app}
                        onApprove={() => openApprove(app)}
                        onReject={() => openReject(app)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* ── Approve dialog ── */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Approve application</DialogTitle>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-5">
              {/* Applicant info */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-1 text-sm">
                <p className="font-medium">
                  {selectedApp.firstName} {selectedApp.lastName}
                </p>
                <p className="text-muted-foreground">{selectedApp.email}</p>
                {selectedApp.phone && (
                  <p className="text-muted-foreground">Phone: {selectedApp.phone}</p>
                )}
                {selectedApp.schoolName && (
                  <p className="text-muted-foreground">
                    School: {selectedApp.schoolName}
                  </p>
                )}
                {selectedApp.source === "landing_public_signup" && (
                  <p className="text-muted-foreground">
                    Source: Landing page application
                  </p>
                )}
              </div>

              {isProvisionableApplication(selectedApp) ? (
                <>
                  <div className="space-y-2">
                    <Label>Assign to tenant *</Label>
                    <Select value={assignedTenantId} onValueChange={setAssignedTenantId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a school / tenant…" />
                      </SelectTrigger>
                      <SelectContent>
                        {(tenants ?? []).map((t) => (
                          <SelectItem key={t.tenantId} value={t.tenantId}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Assign role *</Label>
                    <Select value={assignedRole} onValueChange={setAssignedRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-950/20 dark:text-blue-100">
                  This application came from the public landing page. Approving it will mark it as reviewed so your team can follow up directly with the applicant.
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Review notes (optional)</Label>
                <Textarea
                  placeholder="Any notes to attach to this decision…"
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={
                processing ||
                (isProvisionableApplication(selectedApp) &&
                  (!assignedTenantId || !assignedRole))
              }
            >
              {processing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {isProvisionableApplication(selectedApp)
                ? "Approve & provision"
                : "Approve application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject dialog ── */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                You are about to reject the application from{" "}
                <span className="font-medium text-foreground">
                  {selectedApp.email}
                </span>
                .
              </p>
              <div className="space-y-2">
                <Label>Reason / notes (optional)</Label>
                <Textarea
                  placeholder="Explain why the application is being rejected…"
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing}
            >
              {processing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatsCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
}) {
  return (
    <Card className={bg}>
      <CardContent className="pt-5 pb-5 flex items-center gap-4">
        <div className="p-2 rounded-lg bg-background/60">{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ApplicationRow({
  app,
  onApprove,
  onReject,
}: {
  app: WaitlistApplication;
  onApprove: () => void;
  onReject: () => void;
}) {
  const displayName =
    app.firstName || app.lastName
      ? `${app.firstName ?? ""} ${app.lastName ?? ""}`.trim()
      : null;

  return (
    <div className="flex items-start justify-between py-4 gap-4 flex-wrap">
      <div className="flex items-start gap-3 min-w-0">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 space-y-0.5">
          {displayName && (
            <p className="font-medium text-sm truncate">{displayName}</p>
          )}
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" />
            {app.email}
          </p>
          {app.schoolName && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {app.schoolName}
            </p>
          )}
          {app.phone && (
            <p className="text-xs text-muted-foreground">{app.phone}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Applied {formatDistanceToNow(app.requestedAt, { addSuffix: true })}
          </p>
          {app.source === "landing_public_signup" && (
            <p className="text-xs font-medium text-blue-600">
              Landing application
            </p>
          )}
          {app.message && (
            <p className="text-xs text-muted-foreground italic max-w-xs truncate">
              "{app.message}"
            </p>
          )}
          {app.reviewNotes && app.status !== "pending" && (
            <p className="text-xs text-muted-foreground">
              Note: {app.reviewNotes}
            </p>
          )}
          {app.assignedTenantId && app.status === "approved" && (
            <p className="text-xs text-green-600">
              Assigned to {app.assignedTenantId} as {app.assignedRole}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusBadge status={app.status} />
        {app.status === "pending" && (
          <>
            <Button size="sm" onClick={onApprove} className="h-8">
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Reject
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: {
      label: "Pending",
      className:
        "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
    },
    approved: {
      label: "Approved",
      className:
        "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400",
    },
    rejected: {
      label: "Rejected",
      className:
        "bg-red-100 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400",
    },
  };
  const config = (map[status] ?? map.pending ?? {
    label: "Pending",
    className: "",
  }) as { label: string; className: string };
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

function EmptyState({ tab }: { tab: string }) {
  const msgs: Record<string, string> = {
    pending: "No pending applications. All sign-up requests have been reviewed.",
    approved: "No approved applications yet.",
    rejected: "No rejected applications.",
  };
  return (
    <div className="py-12 text-center text-muted-foreground text-sm">
      {msgs[tab] ?? "No applications found."}
    </div>
  );
}
