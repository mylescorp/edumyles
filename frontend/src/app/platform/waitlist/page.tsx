"use client";

import { useMemo, useState, type ComponentType } from "react";
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
import { TenantsAdminRail } from "@/components/platform/TenantsAdminRail";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDateTime, formatRelativeTime } from "@/lib/formatters";
import { BadgeCheck, Building2, CheckCircle2, Clock3, Eye, Mail, Pencil, Plus, SearchX, ShieldAlert, Trash2, UserPlus2, Users, XCircle } from "lucide-react";

const STATUS_FILTERS = ["all", "waiting", "invited", "converted", "rejected", "expired"] as const;
const SOURCE_FILTERS = ["all", "landing_waitlist", "platform_manual_entry"] as const;
const CURRENT_SYSTEM_OPTIONS = [
  "Paper records",
  "Excel/Spreadsheets",
  "Nothing",
  "Another school system",
] as const;
const REFERRAL_OPTIONS = [
  "Google Search",
  "Facebook or Instagram",
  "LinkedIn",
  "Friend/Colleague",
  "School conference",
  "EduMyles ad campaign",
  "Sales outreach",
  "Other",
] as const;

type WaitlistEntry = {
  _id: string;
  fullName: string;
  email: string;
  schoolName: string;
  country: string;
  county?: string;
  studentCount?: number;
  phone?: string;
  currentSystem?: string;
  referralSource?: string;
  referralCode?: string;
  sourceChannel?: string;
  biggestChallenge?: string;
  notes?: string;
  status: "waiting" | "invited" | "converted" | "rejected" | "expired";
  qualificationScore?: number;
  isHighValue?: boolean;
  assignedTo?: string;
  assignedUser?: { userId: string; name: string; email?: string; role: string } | null;
  crmLeadId?: string;
  resellerId?: string;
  inviteToken?: string;
  inviteExpiresAt?: number;
  invitedAt?: number;
  convertedAt?: number;
  tenantId?: string;
  createdAt: number;
  updatedAt: number;
  crmLead?: { id: string; stage?: string; status?: string; assignedTo?: string } | null;
  invite?: { id: string; status: string; expiresAt: number; remindersSent: number; lastReminderAt?: number } | null;
};

type WaitlistOperator = {
  userId: string;
  name: string;
  email?: string;
  role: string;
};

type WaitlistFormState = {
  fullName: string;
  email: string;
  schoolName: string;
  country: string;
  county: string;
  phone: string;
  studentCount: string;
  currentSystem: string;
  referralSource: string;
  referralCode: string;
  sourceChannel: string;
  biggestChallenge: string;
  notes: string;
  assignedTo: string;
};

const EMPTY_FORM: WaitlistFormState = {
  fullName: "",
  email: "",
  schoolName: "",
  country: "Kenya",
  county: "",
  phone: "",
  studentCount: "",
  currentSystem: "",
  referralSource: "",
  referralCode: "",
  sourceChannel: "platform_manual_entry",
  biggestChallenge: "",
  notes: "",
  assignedTo: "",
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
    case "expired":
      return "border-slate-500/20 bg-slate-500/10 text-slate-700";
    default:
      return "";
  }
}

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function toForm(entry: WaitlistEntry): WaitlistFormState {
  return {
    fullName: entry.fullName ?? "",
    email: entry.email ?? "",
    schoolName: entry.schoolName ?? "",
    country: entry.country ?? "Kenya",
    county: entry.county ?? "",
    phone: entry.phone ?? "",
    studentCount: entry.studentCount ? String(entry.studentCount) : "",
    currentSystem: entry.currentSystem ?? "",
    referralSource: entry.referralSource ?? "",
    referralCode: entry.referralCode ?? "",
    sourceChannel: entry.sourceChannel ?? "platform_manual_entry",
    biggestChallenge: entry.biggestChallenge ?? "",
    notes: entry.notes ?? "",
    assignedTo: entry.assignedTo ?? "",
  };
}

function getDisplayStatus(entry: WaitlistEntry): WaitlistEntry["status"] {
  if (entry.invite?.status === "pending") return "invited";
  if (entry.invite?.status === "expired") return "expired";
  if (entry.invite?.status === "revoked") return entry.tenantId ? "converted" : "waiting";
  if (entry.invite?.status === "accepted") return entry.tenantId ? "converted" : "invited";
  return entry.status;
}

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <div className="text-sm text-muted-foreground">{title}</div>
          <div className="mt-2 text-3xl font-semibold">{value.toLocaleString()}</div>
        </div>
        <div className="rounded-full border bg-muted/40 p-3">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function WaitlistPage() {
  const { sessionToken, isLoading } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [sourceFilter, setSourceFilter] = useState<(typeof SOURCE_FILTERS)[number]>("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WaitlistEntry | null>(null);
  const [detailTarget, setDetailTarget] = useState<WaitlistEntry | null>(null);
  const [inviteTarget, setInviteTarget] = useState<WaitlistEntry | null>(null);
  const [rejectTarget, setRejectTarget] = useState<WaitlistEntry | null>(null);
  const [convertTarget, setConvertTarget] = useState<WaitlistEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WaitlistEntry | null>(null);
  const [inviteMessage, setInviteMessage] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [convertTenantId, setConvertTenantId] = useState("");
  const [form, setForm] = useState<WaitlistFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const rawEntries = usePlatformQuery(
    api.modules.platform.waitlist.getWaitlistEntries,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  );
  const rawOperators = usePlatformQuery(
    api.modules.platform.waitlist.getWaitlistOperators,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  );
  const tenants = usePlatformQuery(
    api.platform.tenants.queries.listAllTenants,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as Array<{ tenantId: string; name: string; subdomain?: string }> | undefined;

  const createWaitlistEntry = useMutation(api.modules.platform.waitlist.createPlatformWaitlistEntry);
  const updateWaitlistEntry = useMutation(api.modules.platform.waitlist.updateWaitlistEntry);
  const deleteWaitlistEntry = useMutation(api.modules.platform.waitlist.deleteWaitlistEntry);
  const rejectWaitlistEntry = useMutation(api.modules.platform.waitlist.rejectWaitlistEntry);
  const convertWaitlistEntry = useMutation(api.modules.platform.waitlist.convertWaitlistEntry);
  const inviteTenantAdmin = useMutation(api.platform.tenants.mutations.inviteTenantAdmin);
  const revokeTenantInvite = useMutation(api.platform.tenants.mutations.revokeInvite);

  const entries = useMemo(
    () =>
      ((Array.isArray(rawEntries) ? rawEntries : []) as WaitlistEntry[]).map((entry) => ({
        ...entry,
        status: getDisplayStatus(entry),
      })),
    [rawEntries]
  );
  const operators = useMemo(() => (Array.isArray(rawOperators) ? rawOperators : []) as WaitlistOperator[], [rawOperators]);
  const tenantOptions = useMemo(() => (Array.isArray(tenants) ? tenants : []), [tenants]);

  const filteredEntries = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (statusFilter !== "all" && entry.status !== statusFilter) return false;
      if (sourceFilter !== "all" && (entry.sourceChannel ?? "landing_waitlist") !== sourceFilter) return false;
      if (!needle) return true;
      return [
        entry.fullName,
        entry.email,
        entry.schoolName,
        entry.country,
        entry.county ?? "",
        entry.currentSystem ?? "",
        entry.referralSource ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [entries, search, sourceFilter, statusFilter]);

  const stats = useMemo(() => {
    const all = entries;
    return {
      total: all.length,
      waiting: all.filter((entry) => entry.status === "waiting").length,
      invited: all.filter((entry) => entry.status === "invited").length,
      converted: all.filter((entry) => entry.status === "converted").length,
      highValue: all.filter((entry) => entry.isHighValue).length,
    };
  }, [entries]);

  const resetDialogs = () => {
    setCreateOpen(false);
    setEditTarget(null);
    setDetailTarget(null);
    setInviteTarget(null);
    setRejectTarget(null);
    setConvertTarget(null);
    setDeleteTarget(null);
    setInviteMessage("");
    setRejectionReason("");
    setDeleteReason("");
    setConvertTenantId("");
    setForm(EMPTY_FORM);
  };

  if (isLoading || rawEntries === undefined || rawOperators === undefined || tenants === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  async function handleCreateOrUpdate() {
    if (!sessionToken) return;
    setSaving(true);
    try {
      const payload = {
        sessionToken,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        schoolName: form.schoolName.trim(),
        country: form.country.trim(),
        county: form.county.trim() || undefined,
        phone: form.phone.trim() || undefined,
        studentCount: form.studentCount ? Number(form.studentCount) : undefined,
        currentSystem: form.currentSystem || undefined,
        referralSource: form.referralSource || undefined,
        referralCode: form.referralCode.trim() || undefined,
        sourceChannel: form.sourceChannel,
        biggestChallenge: form.biggestChallenge.trim() || undefined,
        notes: form.notes.trim() || undefined,
        assignedTo: form.assignedTo || undefined,
      };

      if (editTarget) {
        await updateWaitlistEntry({
          ...payload,
          waitlistId: editTarget._id as never,
        });
        toast({ title: "Waitlist entry updated" });
      } else {
        await createWaitlistEntry(payload);
        toast({ title: "Waitlist entry created" });
      }

      resetDialogs();
    } catch (error) {
      toast({
        title: editTarget ? "Unable to update waitlist entry" : "Unable to create waitlist entry",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleInvite() {
    if (!sessionToken || !inviteTarget) return;
    setSaving(true);
    try {
      const parts = inviteTarget.fullName.split(/\s+/).filter(Boolean);
      if (inviteTarget.invite?.id && inviteTarget.status === "invited") {
        await inviteTenantAdmin({
          sessionToken,
          tenantId: inviteTarget.tenantId,
          email: inviteTarget.email,
          firstName: parts[0] ?? inviteTarget.fullName,
          lastName: parts.slice(1).join(" ") || "Admin",
          role: "school_admin",
          personalMessage: inviteMessage.trim() || undefined,
          expiresInDays: 7,
        });
        toast({ title: "Tenant invite resent" });
      } else {
        if (!inviteTarget.tenantId) {
          throw new Error("Create or convert a tenant before sending a direct tenant admin invite.");
        }
        await inviteTenantAdmin({
          sessionToken,
          tenantId: inviteTarget.tenantId,
          email: inviteTarget.email,
          firstName: parts[0] ?? inviteTarget.fullName,
          lastName: parts.slice(1).join(" ") || "Admin",
          role: "school_admin",
          personalMessage: inviteMessage.trim() || undefined,
          expiresInDays: 7,
        });
        toast({ title: "Tenant invite sent" });
      }
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
  }

  async function handleReject() {
    if (!sessionToken || !rejectTarget || !rejectionReason.trim()) return;
    setSaving(true);
    try {
      await rejectWaitlistEntry({
        sessionToken,
        waitlistId: rejectTarget._id as never,
        reason: rejectionReason.trim(),
      });
      toast({ title: "Waitlist entry rejected" });
      resetDialogs();
    } catch (error) {
      toast({
        title: "Unable to reject waitlist entry",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleConvert() {
    if (!sessionToken || !convertTarget || !convertTenantId) return;
    setSaving(true);
    try {
      await convertWaitlistEntry({
        sessionToken,
        waitlistId: convertTarget._id as never,
        tenantId: convertTenantId,
      });
      toast({ title: "Waitlist entry converted to tenant" });
      resetDialogs();
    } catch (error) {
      toast({
        title: "Unable to convert waitlist entry",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!sessionToken || !deleteTarget || !deleteReason.trim()) return;
    setSaving(true);
    try {
      await deleteWaitlistEntry({
        sessionToken,
        waitlistId: deleteTarget._id as never,
        reason: deleteReason.trim(),
      });
      toast({ title: "Waitlist entry deleted" });
      resetDialogs();
    } catch (error) {
      toast({
        title: "Unable to delete waitlist entry",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleRevokeInvite(entry: WaitlistEntry) {
    if (!sessionToken || !entry.invite?.id) return;
    try {
      await revokeTenantInvite({
        sessionToken,
        tenantId: entry.tenantId,
        email: entry.email,
      });
      toast({ title: "Tenant invite revoked" });
    } catch (error) {
      toast({
        title: "Unable to revoke invite",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Waitlist"
        description="Track inbound school demand from the landing page, ads, and manual platform entries. Qualify, assign, invite, reject, and convert schools in real time."
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
        <MetricCard title="High value" value={stats.highValue} icon={BadgeCheck} />
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Waitlist pipeline</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search schools, contacts, current system, source"
                className="w-full md:w-80"
              />
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as (typeof STATUS_FILTERS)[number])}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === "all" ? "All statuses" : labelize(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as (typeof SOURCE_FILTERS)[number])}>
                <SelectTrigger className="w-[220px]"><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  <SelectItem value="landing_waitlist">Landing waitlist</SelectItem>
                  <SelectItem value="platform_manual_entry">Manual platform entry</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => { setForm(EMPTY_FORM); setCreateOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Create Waitlist
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <EmptyState
              icon={search || statusFilter !== "all" || sourceFilter !== "all" ? SearchX : Building2}
              title={search || statusFilter !== "all" || sourceFilter !== "all" ? "No waitlist entries match these filters" : "No waitlist entries yet"}
              description="Landing-page applications, ad-driven demand, and manual platform-created entries will all appear here in real time."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Qualification</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>CRM</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead className="w-[320px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entry.schoolName}</div>
                        <div className="text-sm text-muted-foreground">{entry.country}{entry.county ? ` · ${entry.county}` : ""}</div>
                        <div className="text-xs text-muted-foreground">
                          {entry.studentCount ? `${entry.studentCount.toLocaleString()} students` : "Student count pending"}
                        </div>
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
                      <div className="space-y-1">
                        <div className="font-medium">{entry.qualificationScore ?? 0}/100</div>
                        <div className="flex flex-wrap gap-1">
                          {entry.isHighValue ? (
                            <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-700">High value</Badge>
                          ) : null}
                          {entry.sourceChannel ? <Badge variant="outline">{labelize(entry.sourceChannel)}</Badge> : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.assignedUser ? (
                        <div>
                          <div className="font-medium">{entry.assignedUser.name}</div>
                          <div className="text-xs text-muted-foreground">{labelize(entry.assignedUser.role)}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className={statusClass(entry.status)}>{labelize(entry.status)}</Badge>
                        {entry.invite?.expiresAt ? (
                          <div className="text-xs text-muted-foreground">Invite expires {formatDateTime(entry.invite.expiresAt)}</div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.crmLead ? (
                        <div>
                          <div className="font-medium">{labelize(entry.crmLead.stage ?? "open")}</div>
                          <div className="text-xs text-muted-foreground">{labelize(entry.crmLead.status ?? "open")}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No lead yet</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatRelativeTime(entry.updatedAt)}</div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setDetailTarget(entry)}><Eye className="mr-2 h-4 w-4" />View</Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditTarget(entry); setForm(toForm(entry)); }}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
                        {entry.status !== "converted" ? (
                          <Button size="sm" onClick={() => { setInviteTarget(entry); setInviteMessage(""); }}>
                            <UserPlus2 className="mr-2 h-4 w-4" />
                            {entry.status === "invited" ? "Resend" : "Invite"}
                          </Button>
                        ) : null}
                        {entry.status === "invited" && entry.invite?.id ? <Button size="sm" variant="outline" onClick={() => handleRevokeInvite(entry)}>Revoke</Button> : null}
                        {entry.status !== "converted" ? <Button size="sm" variant="outline" onClick={() => setRejectTarget(entry)}>Reject</Button> : null}
                        {(entry.status === "invited" || entry.status === "waiting") ? <Button size="sm" variant="outline" onClick={() => { setConvertTarget(entry); setConvertTenantId(""); }}>Convert</Button> : null}
                        {entry.status !== "converted" ? <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(entry)}><Trash2 className="h-4 w-4" /></Button> : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={createOpen || !!editTarget} onOpenChange={(open) => !open && resetDialogs()}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editTarget ? "Edit waitlist entry" : "Create waitlist entry"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Full name</Label><Input value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></div>
            <div className="space-y-2"><Label>School name</Label><Input value={form.schoolName} onChange={(event) => setForm((current) => ({ ...current, schoolName: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Country</Label><Input value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} /></div>
            <div className="space-y-2"><Label>County</Label><Input value={form.county} onChange={(event) => setForm((current) => ({ ...current, county: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Student count</Label><Input type="number" min="0" value={form.studentCount} onChange={(event) => setForm((current) => ({ ...current, studentCount: event.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Current system</Label>
              <Select value={form.currentSystem || "__none"} onValueChange={(value) => setForm((current) => ({ ...current, currentSystem: value === "__none" ? "" : value }))}>
                <SelectTrigger><SelectValue placeholder="Select current system" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Not specified</SelectItem>
                  {CURRENT_SYSTEM_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Referral source</Label>
              <Select value={form.referralSource || "__none"} onValueChange={(value) => setForm((current) => ({ ...current, referralSource: value === "__none" ? "" : value }))}>
                <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Not specified</SelectItem>
                  {REFERRAL_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Referral code</Label><Input value={form.referralCode} onChange={(event) => setForm((current) => ({ ...current, referralCode: event.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Assigned owner</Label>
              <Select value={form.assignedTo || "__none"} onValueChange={(value) => setForm((current) => ({ ...current, assignedTo: value === "__none" ? "" : value }))}>
                <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Unassigned</SelectItem>
                  {operators.map((operator) => <SelectItem key={operator.userId} value={operator.userId}>{operator.name} · {labelize(operator.role)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source channel</Label>
              <Select value={form.sourceChannel} onValueChange={(value) => setForm((current) => ({ ...current, sourceChannel: value }))}>
                <SelectTrigger><SelectValue placeholder="Select source channel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform_manual_entry">Manual platform entry</SelectItem>
                  <SelectItem value="landing_waitlist">Landing waitlist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2"><Label>Biggest challenge</Label><Textarea rows={4} value={form.biggestChallenge} onChange={(event) => setForm((current) => ({ ...current, biggestChallenge: event.target.value }))} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Internal notes</Label><Textarea rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={resetDialogs}>Cancel</Button><Button onClick={handleCreateOrUpdate} disabled={saving}>{editTarget ? "Save changes" : "Create waitlist entry"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailTarget} onOpenChange={(open) => !open && resetDialogs()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{detailTarget?.schoolName}</DialogTitle></DialogHeader>
          {detailTarget ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card><CardHeader><CardTitle className="text-base">Lead profile</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
                <div><span className="font-medium">Contact:</span> {detailTarget.fullName}</div>
                <div><span className="font-medium">Email:</span> {detailTarget.email}</div>
                <div><span className="font-medium">Phone:</span> {detailTarget.phone ?? "Not provided"}</div>
                <div><span className="font-medium">Location:</span> {detailTarget.country}{detailTarget.county ? `, ${detailTarget.county}` : ""}</div>
                <div><span className="font-medium">Student count:</span> {detailTarget.studentCount?.toLocaleString() ?? "Not provided"}</div>
                <div><span className="font-medium">Current system:</span> {detailTarget.currentSystem ?? "Not provided"}</div>
              </CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Pipeline</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
                <div><span className="font-medium">Status:</span> {labelize(detailTarget.status)}</div>
                <div><span className="font-medium">Qualification:</span> {detailTarget.qualificationScore ?? 0}/100</div>
                <div><span className="font-medium">Assigned:</span> {detailTarget.assignedUser?.name ?? "Unassigned"}</div>
                <div><span className="font-medium">CRM stage:</span> {detailTarget.crmLead ? labelize(detailTarget.crmLead.stage ?? "open") : "No lead"}</div>
                <div><span className="font-medium">Referral source:</span> {detailTarget.referralSource ?? "Not specified"}</div>
                <div><span className="font-medium">Referral code:</span> {detailTarget.referralCode ?? "Not provided"}</div>
              </CardContent></Card>
              <Card className="md:col-span-2"><CardHeader><CardTitle className="text-base">Challenge and notes</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
                <div><div className="font-medium">Biggest challenge</div><div className="text-muted-foreground">{detailTarget.biggestChallenge ?? "No challenge supplied yet."}</div></div>
                <div><div className="font-medium">Internal notes</div><div className="text-muted-foreground">{detailTarget.notes ?? "No notes yet."}</div></div>
              </CardContent></Card>
            </div>
          ) : null}
          <DialogFooter><Button variant="outline" onClick={resetDialogs}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!inviteTarget} onOpenChange={(open) => !open && resetDialogs()}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{inviteTarget?.status === "invited" ? "Resend tenant invite" : "Send tenant invite"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <div className="font-medium">{inviteTarget?.schoolName}</div>
              <div className="text-muted-foreground">{inviteTarget?.fullName} · {inviteTarget?.email}</div>
              {inviteTarget?.crmLead ? <div className="mt-2 text-xs text-muted-foreground">CRM stage: {labelize(inviteTarget.crmLead.stage ?? "open")}</div> : null}
            </div>
            <div className="space-y-2"><Label>Personal message</Label><Textarea value={inviteMessage} onChange={(event) => setInviteMessage(event.target.value)} rows={4} placeholder="Share rollout context, onboarding notes, or a warm handoff message." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={resetDialogs}>Cancel</Button><Button onClick={handleInvite} disabled={saving}><UserPlus2 className="mr-2 h-4 w-4" />{inviteTarget?.status === "invited" ? "Resend invite" : "Send invite"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && resetDialogs()}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Reject waitlist entry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Add a clear reason so the school gets a polite rejection email and the CRM record stays accurate.</p>
            <div className="space-y-2"><Label>Reason</Label><Textarea rows={5} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={resetDialogs}>Cancel</Button><Button variant="destructive" onClick={handleReject} disabled={saving || !rejectionReason.trim()}>Reject entry</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!convertTarget} onOpenChange={(open) => !open && resetDialogs()}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Convert to tenant</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Link this waitlist entry to an already-created tenant record after onboarding or manual provisioning.</p>
            <div className="space-y-2">
              <Label>Select tenant</Label>
              <Select value={convertTenantId} onValueChange={setConvertTenantId}>
                <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                <SelectContent>
                  {tenantOptions.map((tenant) => <SelectItem key={tenant.tenantId} value={tenant.tenantId}>{tenant.name} · {tenant.tenantId}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={resetDialogs}>Cancel</Button><Button onClick={handleConvert} disabled={saving || !convertTenantId}>Convert entry</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && resetDialogs()}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Delete waitlist entry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-800">
              <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>This removes the waitlist entry from the live pipeline. Converted entries cannot be deleted.</p>
            </div>
            <div className="space-y-2"><Label>Reason</Label><Textarea rows={4} value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={resetDialogs}>Cancel</Button><Button variant="destructive" onClick={handleDelete} disabled={saving || !deleteReason.trim()}>Delete entry</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
