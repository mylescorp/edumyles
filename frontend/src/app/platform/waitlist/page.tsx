"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDateTime, formatRelativeTime } from "@/lib/formatters";
import { Building2, CheckCircle2, Clock3, Mail, SearchX, UserPlus2, Users, XCircle } from "lucide-react";
import { TenantsAdminRail } from "@/components/platform/TenantsAdminRail";

const ROLE_OPTIONS = [
  { value: "school_admin", label: "School Admin" },
  { value: "principal", label: "Principal" },
  { value: "teacher", label: "Teacher" },
  { value: "bursar", label: "Bursar" },
  { value: "hr_manager", label: "HR Manager" },
  { value: "librarian", label: "Librarian" },
  { value: "transport_manager", label: "Transport Manager" },
  { value: "board_member", label: "Board Member" },
] as const;

const STATUS_FILTERS = ["all", "waiting", "invited", "converted", "rejected"] as const;

type WaitlistEntry = {
  _id: string;
  fullName: string;
  email: string;
  schoolName: string;
  country: string;
  studentCount?: number;
  phone?: string;
  referralSource?: string;
  biggestChallenge?: string;
  status: "waiting" | "invited" | "converted" | "rejected";
  invitedAt?: number;
  convertedAt?: number;
  crmLeadId?: string;
  inviteToken?: string;
  inviteExpiresAt?: number;
  createdAt: number;
  updatedAt: number;
};

function statusClass(status: WaitlistEntry["status"]) {
  switch (status) {
    case "waiting":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700";
    case "invited":
      return "border-sky-500/20 bg-sky-500/10 text-sky-700";
    case "converted":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
    case "rejected":
      return "border-rose-500/20 bg-rose-500/10 text-rose-700";
    default:
      return "";
  }
}

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function WaitlistPage() {
  const { sessionToken, isLoading } = useAuth();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [search, setSearch] = useState("");
  const [inviteTarget, setInviteTarget] = useState<WaitlistEntry | null>(null);
  const [rejectTarget, setRejectTarget] = useState<WaitlistEntry | null>(null);
  const [convertTarget, setConvertTarget] = useState<WaitlistEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    tenantId: "",
    role: "school_admin",
    personalMessage: "",
  });
  const [rejectionReason, setRejectionReason] = useState("");
  const [convertTenantId, setConvertTenantId] = useState("");

  const entries = usePlatformQuery(
    api.modules.platform.waitlist.getWaitlistEntries,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as WaitlistEntry[] | undefined;

  const tenants = usePlatformQuery(
    api.platform.tenants.queries.listAllTenants,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as Array<{ tenantId: string; name: string; subdomain?: string }> | undefined;

  const inviteFromWaitlist = useMutation(api.modules.platform.waitlist.inviteFromWaitlist);
  const updateWaitlistStatus = useMutation(api.modules.platform.waitlist.updateWaitlistStatus);
  const convertWaitlistEntry = useMutation(api.modules.platform.waitlist.convertWaitlistEntry);

  const tenantMap = useMemo(
    () => new Map((tenants ?? []).map((tenant) => [tenant.tenantId, tenant.name])),
    [tenants]
  );

  const sortedEntries = useMemo(
    () => [...(entries ?? [])].sort((left, right) => right.createdAt - left.createdAt),
    [entries]
  );

  const filteredEntries = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return sortedEntries.filter((entry) => {
      const statusMatches = statusFilter === "all" || entry.status === statusFilter;
      if (!statusMatches) return false;
      if (!needle) return true;
      return [
        entry.fullName,
        entry.email,
        entry.schoolName,
        entry.country,
        entry.referralSource ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [search, sortedEntries, statusFilter]);

  const stats = useMemo(() => {
    const all = sortedEntries;
    return {
      total: all.length,
      waiting: all.filter((entry) => entry.status === "waiting").length,
      invited: all.filter((entry) => entry.status === "invited").length,
      converted: all.filter((entry) => entry.status === "converted").length,
      rejected: all.filter((entry) => entry.status === "rejected").length,
    };
  }, [sortedEntries]);

  if (isLoading || entries === undefined || tenants === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const resetDialogs = () => {
    setInviteTarget(null);
    setRejectTarget(null);
    setConvertTarget(null);
    setInviteForm({ tenantId: "", role: "school_admin", personalMessage: "" });
    setRejectionReason("");
    setConvertTenantId("");
  };

  const handleInvite = async () => {
    if (!sessionToken || !inviteTarget || !inviteForm.tenantId || !inviteForm.role) return;
    setSaving(true);
    try {
      await inviteFromWaitlist({
        sessionToken,
        waitlistId: inviteTarget._id as never,
        tenantId: inviteForm.tenantId,
        role: inviteForm.role,
        personalMessage: inviteForm.personalMessage.trim() || undefined,
      });
      toast({ title: "Invite sent", description: `${inviteTarget.email} has been invited to join EduMyles.` });
      resetDialogs();
    } catch (error) {
      toast({
        title: "Unable to send invite",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!sessionToken || !rejectTarget || !rejectionReason.trim()) return;
    setSaving(true);
    try {
      await updateWaitlistStatus({
        sessionToken,
        waitlistId: rejectTarget._id as never,
        status: "rejected",
        reason: rejectionReason.trim(),
      });
      toast({ title: "Waitlist entry rejected" });
      resetDialogs();
    } catch (error) {
      toast({
        title: "Unable to reject entry",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConvert = async () => {
    if (!sessionToken || !convertTarget || !convertTenantId) return;
    setSaving(true);
    try {
      await convertWaitlistEntry({
        sessionToken,
        waitlistId: convertTarget._id as never,
        tenantId: convertTenantId,
      });
      toast({ title: "Waitlist entry converted" });
      resetDialogs();
    } catch (error) {
      toast({
        title: "Unable to convert entry",
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
        title="Waitlist"
        description="Review inbound school interest, send tenant invites, and convert qualified schools into active tenants."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Waitlist" },
        ]}
      />

      <TenantsAdminRail currentHref="/platform/waitlist" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Total entries" value={stats.total} icon={Users} />
        <MetricCard title="Waiting" value={stats.waiting} icon={Clock3} />
        <MetricCard title="Invited" value={stats.invited} icon={Mail} />
        <MetricCard title="Converted" value={stats.converted} icon={CheckCircle2} />
        <MetricCard title="Rejected" value={stats.rejected} icon={XCircle} />
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Waitlist pipeline</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search schools, contacts, and sources"
                className="w-full md:w-80"
              />
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as (typeof STATUS_FILTERS)[number])}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === "all" ? "All statuses" : labelize(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <EmptyState
              icon={search || statusFilter !== "all" ? SearchX : Building2}
              title={search || statusFilter !== "all" ? "No waitlist entries match these filters" : "No waitlist entries yet"}
              description="New school interest from the landing page will appear here as soon as prospects join the EduMyles waitlist."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>CRM</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last update</TableHead>
                  <TableHead className="w-[250px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={String(entry._id)}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entry.schoolName}</div>
                        <div className="text-sm text-muted-foreground">{entry.country}</div>
                        {entry.studentCount ? (
                          <div className="text-xs text-muted-foreground">{entry.studentCount.toLocaleString()} students</div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entry.fullName}</div>
                        <div className="text-sm text-muted-foreground">{entry.email}</div>
                        {entry.phone ? <div className="text-xs text-muted-foreground">{entry.phone}</div> : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusClass(entry.status)}>
                        {labelize(entry.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.crmLeadId ? (
                        <Link href="/platform/crm" className="text-sm text-primary hover:underline">
                          Lead linked
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not linked</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDateTime(entry.createdAt)}</div>
                      <div className="text-xs text-muted-foreground">{formatRelativeTime(entry.createdAt)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDateTime(entry.updatedAt)}</div>
                      {entry.inviteExpiresAt ? (
                        <div className="text-xs text-muted-foreground">
                          Invite expires {formatDateTime(entry.inviteExpiresAt)}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {entry.status === "waiting" ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setInviteTarget(entry);
                                setInviteForm({ tenantId: "", role: "school_admin", personalMessage: "" });
                              }}
                            >
                              Invite
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setRejectTarget(entry)}>
                              Reject
                            </Button>
                          </>
                        ) : null}
                        {entry.status === "invited" ? (
                          <>
                            <Button size="sm" variant="outline" onClick={() => {
                              setInviteTarget(entry);
                              setInviteForm({ tenantId: "", role: "school_admin", personalMessage: "" });
                            }}>
                              Resend invite
                            </Button>
                            <Button size="sm" onClick={() => {
                              setConvertTarget(entry);
                              setConvertTenantId("");
                            }}>
                              Convert
                            </Button>
                          </>
                        ) : null}
                        {entry.status === "converted" ? (
                          <Button asChild size="sm" variant="outline">
                            <Link href="/platform/tenants">View tenants</Link>
                          </Button>
                        ) : null}
                      </div>
                      {entry.biggestChallenge ? (
                        <p className="mt-2 max-w-xs text-xs text-muted-foreground">{entry.biggestChallenge}</p>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!inviteTarget} onOpenChange={(open) => !open && resetDialogs()}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{inviteTarget?.status === "invited" ? "Resend tenant invite" : "Invite school from waitlist"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <div className="font-medium">{inviteTarget?.schoolName}</div>
              <div className="text-muted-foreground">{inviteTarget?.fullName} · {inviteTarget?.email}</div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tenant</Label>
                <Select
                  value={inviteForm.tenantId}
                  onValueChange={(value) => setInviteForm((current) => ({ ...current, tenantId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.tenantId} value={tenant.tenantId}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={inviteForm.role}
                  onValueChange={(value) => setInviteForm((current) => ({ ...current, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Personal message</Label>
              <Textarea
                value={inviteForm.personalMessage}
                onChange={(event) => setInviteForm((current) => ({ ...current, personalMessage: event.target.value }))}
                rows={4}
                placeholder="Share rollout notes, onboarding context, or next steps for the school contact."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetDialogs}>Cancel</Button>
            <Button onClick={handleInvite} disabled={saving || !inviteForm.tenantId || !inviteForm.role}>
              <UserPlus2 className="mr-2 h-4 w-4" />
              {inviteTarget?.status === "invited" ? "Resend invite" : "Send invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && resetDialogs()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject waitlist entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              rows={4}
              placeholder="Capture why this school is not moving forward right now."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetDialogs}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={saving || !rejectionReason.trim()}>
              Reject entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!convertTarget} onOpenChange={(open) => !open && resetDialogs()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert invited school</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              Mark this waitlist record as converted after the school has been provisioned into a live tenant.
            </div>
            <div className="space-y-2">
              <Label>Tenant</Label>
              <Select value={convertTenantId} onValueChange={setConvertTenantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.tenantId} value={tenant.tenantId}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {convertTenantId ? (
                <p className="text-xs text-muted-foreground">
                  This will link the waitlist entry to {tenantMap.get(convertTenantId) ?? convertTenantId}.
                </p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetDialogs}>Cancel</Button>
            <Button onClick={handleConvert} disabled={saving || !convertTenantId}>
              Convert entry
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
  value: number;
  icon: typeof Users;
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
