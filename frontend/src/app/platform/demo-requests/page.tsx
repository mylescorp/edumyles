"use client";

import { useMemo, useState, type ComponentType } from "react";
import { api } from "@/convex/_generated/api";
import { PermissionGate } from "@/components/platform/PermissionGate";
import { TenantsAdminRail } from "@/components/platform/TenantsAdminRail";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformPermissions } from "@/hooks/usePlatformPermissions";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDateTime, formatRelativeTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CalendarPlus2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Flag,
  LayoutList,
  LineChart,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  ShieldAlert,
  Star,
  Trash2,
  UserRoundCheck,
  Users,
} from "lucide-react";

const STATUS_OPTIONS = ["all", "requested", "contacted", "scheduled", "completed", "cancelled"] as const;
const PRIORITY_OPTIONS = ["all", "high", "medium", "low"] as const;
const SOURCE_OPTIONS = ["all", "demo_request", "landing_page", "platform_manual_entry"] as const;
const EMPTY_FIELD = "__empty__";

type DemoStatus = "requested" | "contacted" | "scheduled" | "completed" | "cancelled";
type DemoPriority = "low" | "medium" | "high";

type Operator = {
  userId: string;
  name: string;
  email?: string;
  role: string;
  department?: string;
};

type DemoRequest = {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  schoolName: string;
  schoolType?: string;
  jobTitle?: string;
  preferredDemoDate?: string;
  needs?: string;
  country?: string;
  county?: string;
  studentCount?: number;
  currentSystem?: string;
  referralSource?: string;
  referralCode?: string;
  sourceChannel?: string;
  marketingAttribution?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    ctaSource?: string;
    landingPage?: string;
    originPath?: string;
  };
  qualificationScore?: number;
  isHighValue?: boolean;
  status: DemoStatus;
  priority?: DemoPriority;
  assignedTo?: string;
  assignedTeam?: string;
  crmLeadId?: string;
  scheduledFor?: number;
  scheduledEndAt?: number;
  meetingUrl?: string;
  nextActionAt?: number;
  nextActionLabel?: string;
  lastContactedAt?: number;
  notesInternal?: string;
  outcome?: string;
  deletedAt?: number;
  deletedBy?: string;
  createdAt: number;
  updatedAt: number;
  assignedUser?: Operator | null;
  crmLead?: { id: string; stage?: string; status?: string; assignedTo?: string } | null;
  timeline?: Array<{
    _id: string;
    eventType: string;
    title: string;
    body?: string;
    actorUserId?: string;
    actorEmail?: string;
    createdAt: number;
    metadata?: Record<string, unknown>;
  }>;
};

type DashboardPayload = {
  requests: DemoRequest[];
  operators: Operator[];
  metrics: {
    total: number;
    scheduled: number;
    completed: number;
    overdue: number;
    highIntent: number;
    thisWeek: number;
    topCampaigns: Array<{ label: string; count: number }>;
  };
};

type DemoFormState = {
  fullName: string;
  email: string;
  phone: string;
  schoolName: string;
  schoolType: string;
  jobTitle: string;
  preferredDemoDate: string;
  needs: string;
  country: string;
  county: string;
  studentCount: string;
  currentSystem: string;
  referralSource: string;
  referralCode: string;
  sourceChannel: string;
  status: DemoStatus;
  priority: DemoPriority;
  assignedTo: string;
  assignedTeam: string;
  nextActionAt: string;
  nextActionLabel: string;
  meetingUrl: string;
  notesInternal: string;
  outcome: string;
};

type ScheduleState = {
  scheduledFor: string;
  scheduledEndAt: string;
  meetingUrl: string;
  nextActionAt: string;
  nextActionLabel: string;
  assignedTo: string;
};

const EMPTY_FORM: DemoFormState = {
  fullName: "",
  email: "",
  phone: "",
  schoolName: "",
  schoolType: "",
  jobTitle: "",
  preferredDemoDate: "",
  needs: "",
  country: "Kenya",
  county: "",
  studentCount: "",
  currentSystem: "",
  referralSource: "",
  referralCode: "",
  sourceChannel: "platform_manual_entry",
  status: "requested",
  priority: "medium",
  assignedTo: "",
  assignedTeam: "sales",
  nextActionAt: "",
  nextActionLabel: "",
  meetingUrl: "",
  notesInternal: "",
  outcome: "",
};

const EMPTY_SCHEDULE: ScheduleState = {
  scheduledFor: "",
  scheduledEndAt: "",
  meetingUrl: "",
  nextActionAt: "",
  nextActionLabel: "",
  assignedTo: "",
};

function statusClass(status: DemoStatus) {
  switch (status) {
    case "requested":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700";
    case "contacted":
      return "border-sky-500/20 bg-sky-500/10 text-sky-700";
    case "scheduled":
      return "border-violet-500/20 bg-violet-500/10 text-violet-700";
    case "completed":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
    case "cancelled":
      return "border-rose-500/20 bg-rose-500/10 text-rose-700";
  }
}

function priorityClass(priority?: DemoPriority) {
  switch (priority) {
    case "high":
      return "border-rose-500/20 bg-rose-500/10 text-rose-700";
    case "medium":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700";
    default:
      return "border-slate-500/20 bg-slate-500/10 text-slate-700";
  }
}

function MetricCard({
  title,
  value,
  icon: Icon,
  hint,
}: {
  title: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <div className="text-sm text-muted-foreground">{title}</div>
          <div className="mt-2 text-3xl font-semibold">{value}</div>
          {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
        </div>
        <div className="rounded-full border bg-muted/40 p-3">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function toForm(request: DemoRequest): DemoFormState {
  return {
    fullName: request.fullName ?? "",
    email: request.email ?? "",
    phone: request.phone ?? "",
    schoolName: request.schoolName ?? "",
    schoolType: request.schoolType ?? "",
    jobTitle: request.jobTitle ?? "",
    preferredDemoDate: request.preferredDemoDate ?? "",
    needs: request.needs ?? "",
    country: request.country ?? "Kenya",
    county: request.county ?? "",
    studentCount: request.studentCount ? String(request.studentCount) : "",
    currentSystem: request.currentSystem ?? "",
    referralSource: request.referralSource ?? "",
    referralCode: request.referralCode ?? "",
    sourceChannel: request.sourceChannel ?? "platform_manual_entry",
    status: request.status,
    priority: request.priority ?? "medium",
    assignedTo: request.assignedTo ?? "",
    assignedTeam: request.assignedTeam ?? "sales",
    nextActionAt: request.nextActionAt ? toDateTimeLocal(request.nextActionAt) : "",
    nextActionLabel: request.nextActionLabel ?? "",
    meetingUrl: request.meetingUrl ?? "",
    notesInternal: request.notesInternal ?? "",
    outcome: request.outcome ?? "",
  };
}

function toScheduleState(request: DemoRequest): ScheduleState {
  return {
    scheduledFor: request.scheduledFor ? toDateTimeLocal(request.scheduledFor) : "",
    scheduledEndAt: request.scheduledEndAt ? toDateTimeLocal(request.scheduledEndAt) : "",
    meetingUrl: request.meetingUrl ?? "",
    nextActionAt: request.nextActionAt ? toDateTimeLocal(request.nextActionAt) : "",
    nextActionLabel: request.nextActionLabel ?? "Send meeting prep",
    assignedTo: request.assignedTo ?? "",
  };
}

function toDateTimeLocal(timestamp: number) {
  const date = new Date(timestamp);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function parseDateTimeLocal(value: string) {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toDateKey(timestamp: number) {
  const date = new Date(timestamp);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function DemoRequestsPage() {
  const { sessionToken, isLoading } = useAuth();
  const { toast } = useToast();
  const permissions = usePlatformPermissions();
  const canEdit = permissions.can("demo_requests.edit");
  const canAssign = permissions.can("demo_requests.assign");
  const canSchedule = permissions.can("demo_requests.schedule");
  const canDelete = permissions.can("demo_requests.delete");
  const canCalendar = permissions.can("demo_requests.view_calendar");

  const [activeTab, setActiveTab] = useState<"pipeline" | "calendar" | "insights">("pipeline");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [priorityFilter, setPriorityFilter] = useState<(typeof PRIORITY_OPTIONS)[number]>("all");
  const [sourceFilter, setSourceFilter] = useState<(typeof SOURCE_OPTIONS)[number]>("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DemoRequest | null>(null);
  const [detailTarget, setDetailTarget] = useState<DemoRequest | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<DemoRequest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DemoRequest | null>(null);
  const [form, setForm] = useState<DemoFormState>(EMPTY_FORM);
  const [scheduleForm, setScheduleForm] = useState<ScheduleState>(EMPTY_SCHEDULE);
  const [deleteReason, setDeleteReason] = useState("");
  const [saving, setSaving] = useState(false);

  const dashboard = usePlatformQuery(
    api.modules.platform.demoRequests.getDemoRequestsDashboard,
    sessionToken
      ? {
          sessionToken,
          includeDeleted,
        }
      : "skip",
    !!sessionToken
  ) as DashboardPayload | undefined;

  const createDemoRequest = useMutation(api.modules.platform.demoRequests.createPlatformDemoRequest);
  const updateDemoRequest = useMutation(api.modules.platform.demoRequests.updateDemoRequest);
  const assignDemoRequest = useMutation(api.modules.platform.demoRequests.assignDemoRequest);
  const scheduleDemoRequest = useMutation(api.modules.platform.demoRequests.scheduleDemoRequest);
  const setDemoRequestStatus = useMutation(api.modules.platform.demoRequests.setDemoRequestStatus);
  const deleteDemoRequest = useMutation(api.modules.platform.demoRequests.deleteDemoRequest);
  const restoreDemoRequest = useMutation(api.modules.platform.demoRequests.restoreDemoRequest);

  const requests = useMemo(() => dashboard?.requests ?? [], [dashboard]);
  const operators = useMemo(() => dashboard?.operators ?? [], [dashboard]);
  const metrics = dashboard?.metrics;

  const filteredRequests = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return requests.filter((request) => {
      if (statusFilter !== "all" && request.status !== statusFilter) return false;
      if (priorityFilter !== "all" && (request.priority ?? "low") !== priorityFilter) return false;
      if (sourceFilter !== "all" && (request.sourceChannel ?? "demo_request") !== sourceFilter) return false;
      if (ownerFilter !== "all" && (request.assignedTo ?? EMPTY_FIELD) !== ownerFilter) return false;
      if (!needle) return true;
      return [
        request.fullName,
        request.email,
        request.schoolName,
        request.country ?? "",
        request.jobTitle ?? "",
        request.marketingAttribution?.utmCampaign ?? "",
        request.marketingAttribution?.ctaSource ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [ownerFilter, priorityFilter, requests, search, sourceFilter, statusFilter]);

  const upcomingAgenda = useMemo(
    () =>
      filteredRequests
        .filter((request) => request.scheduledFor && !request.deletedAt)
        .sort((left, right) => (left.scheduledFor ?? 0) - (right.scheduledFor ?? 0))
        .slice(0, 8),
    [filteredRequests]
  );

  const monthDays = useMemo(() => {
    const first = startOfMonth(monthCursor);
    const start = new Date(first);
    start.setDate(start.getDate() - first.getDay());

    return Array.from({ length: 42 }).map((_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = toDateKey(date.getTime());
      const items = filteredRequests.filter((request) => {
        const anchor = request.scheduledFor;
        return anchor ? toDateKey(anchor) === key : false;
      });
      return {
        key,
        date,
        items,
        inMonth: date.getMonth() === monthCursor.getMonth(),
      };
    });
  }, [filteredRequests, monthCursor]);

  const staleRequests = useMemo(
    () =>
      filteredRequests
        .filter(
          (request) =>
            !request.deletedAt &&
            !["completed", "cancelled"].includes(request.status) &&
            request.nextActionAt &&
            request.nextActionAt < Date.now()
        )
        .slice(0, 6),
    [filteredRequests]
  );

  const topCampaigns = metrics?.topCampaigns ?? [];

  function resetDialogs() {
    setCreateOpen(false);
    setEditTarget(null);
    setDetailTarget(null);
    setScheduleTarget(null);
    setDeleteTarget(null);
    setDeleteReason("");
    setForm(EMPTY_FORM);
    setScheduleForm(EMPTY_SCHEDULE);
  }

  async function handleCreateOrUpdate() {
    if (!sessionToken) return;
    setSaving(true);
    try {
      const payload = {
        sessionToken,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        schoolName: form.schoolName.trim(),
        schoolType: form.schoolType.trim() || undefined,
        jobTitle: form.jobTitle.trim() || undefined,
        preferredDemoDate: form.preferredDemoDate || undefined,
        needs: form.needs.trim() || undefined,
        country: form.country.trim() || undefined,
        county: form.county.trim() || undefined,
        studentCount: form.studentCount ? Number(form.studentCount) : undefined,
        currentSystem: form.currentSystem.trim() || undefined,
        referralSource: form.referralSource.trim() || undefined,
        referralCode: form.referralCode.trim() || undefined,
        sourceChannel: form.sourceChannel.trim() || undefined,
        status: form.status,
        priority: form.priority,
        assignedTo: form.assignedTo || undefined,
        assignedTeam: form.assignedTeam.trim() || undefined,
        nextActionAt: parseDateTimeLocal(form.nextActionAt),
        nextActionLabel: form.nextActionLabel.trim() || undefined,
        meetingUrl: form.meetingUrl.trim() || undefined,
        notesInternal: form.notesInternal.trim() || undefined,
        outcome: form.outcome.trim() || undefined,
      };

      if (editTarget) {
        await updateDemoRequest({
          ...payload,
          demoRequestId: editTarget._id as any,
        });
        toast({ title: "Demo request updated" });
      } else {
        await createDemoRequest(payload);
        toast({ title: "Demo request created" });
      }

      resetDialogs();
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error?.message ?? "Could not save demo request.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSchedule() {
    if (!sessionToken || !scheduleTarget) return;
    setSaving(true);
    try {
      await scheduleDemoRequest({
        sessionToken,
        demoRequestId: scheduleTarget._id as any,
        scheduledFor: parseDateTimeLocal(scheduleForm.scheduledFor)!,
        scheduledEndAt: parseDateTimeLocal(scheduleForm.scheduledEndAt),
        meetingUrl: scheduleForm.meetingUrl.trim() || undefined,
        nextActionAt: parseDateTimeLocal(scheduleForm.nextActionAt),
        nextActionLabel: scheduleForm.nextActionLabel.trim() || undefined,
        assignedTo: scheduleForm.assignedTo || undefined,
      });
      toast({ title: "Demo scheduled" });
      resetDialogs();
    } catch (error: any) {
      toast({
        title: "Scheduling failed",
        description: error?.message ?? "Could not schedule demo.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!sessionToken || !deleteTarget) return;
    setSaving(true);
    try {
      await deleteDemoRequest({
        sessionToken,
        demoRequestId: deleteTarget._id as any,
        reason: deleteReason.trim() || "Removed from active demo pipeline",
      });
      toast({ title: "Demo request archived" });
      resetDialogs();
    } catch (error: any) {
      toast({
        title: "Archive failed",
        description: error?.message ?? "Could not archive demo request.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleRestore(request: DemoRequest) {
    if (!sessionToken) return;
    try {
      await restoreDemoRequest({
        sessionToken,
        demoRequestId: request._id as any,
      });
      toast({ title: "Demo request restored" });
    } catch (error: any) {
      toast({
        title: "Restore failed",
        description: error?.message ?? "Could not restore demo request.",
        variant: "destructive",
      });
    }
  }

  async function handleStatusChange(request: DemoRequest, status: DemoStatus) {
    if (!sessionToken) return;
    try {
      await setDemoRequestStatus({
        sessionToken,
        demoRequestId: request._id as any,
        status,
        lastContactedAt: status === "contacted" ? Date.now() : undefined,
        outcome: status === "completed" ? "Demo completed from ops panel" : undefined,
      });
      toast({ title: `Marked as ${labelize(status)}` });
    } catch (error: any) {
      toast({
        title: "Status update failed",
        description: error?.message ?? "Could not update status.",
        variant: "destructive",
      });
    }
  }

  async function handleAssign(requestId: string, ownerId: string) {
    if (!sessionToken) return;
    try {
      await assignDemoRequest({
        sessionToken,
        demoRequestId: requestId as any,
        assignedTo: ownerId === EMPTY_FIELD ? undefined : ownerId,
      });
      toast({ title: "Owner updated" });
    } catch (error: any) {
      toast({
        title: "Assignment failed",
        description: error?.message ?? "Could not update owner.",
        variant: "destructive",
      });
    }
  }

  if (isLoading || (sessionToken && dashboard === undefined) || !permissions.isLoaded) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!permissions.can("demo_requests.view")) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={ShieldAlert}
            title="Demo operations access required"
            description="Your current platform role does not include access to demo request operations."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demo Operations"
        description="Run the full paid-traffic demo funnel from first CTA click through booking, follow-up, and conversion readiness."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Demo Ops" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setIncludeDeleted((current) => !current)}
            >
              <RefreshCcw className="h-4 w-4" />
              {includeDeleted ? "Hide archived" : "Show archived"}
            </Button>
            <PermissionGate permission="demo_requests.create">
              <Button
                className="gap-2"
                onClick={() => {
                  setForm(EMPTY_FORM);
                  setCreateOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                New demo request
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <TenantsAdminRail currentHref="/platform/demo-requests" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Active requests" value={metrics?.total ?? 0} icon={Users} />
        <MetricCard title="Booked demos" value={metrics?.scheduled ?? 0} icon={CalendarDays} hint={`${metrics?.thisWeek ?? 0} this week`} />
        <MetricCard title="Completed demos" value={metrics?.completed ?? 0} icon={UserRoundCheck} />
        <MetricCard title="Overdue follow-up" value={metrics?.overdue ?? 0} icon={Clock3} />
        <MetricCard title="High-intent schools" value={metrics?.highIntent ?? 0} icon={Star} />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search school, contact, campaign, CTA..."
              className="pl-9"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-4 xl:flex">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as (typeof STATUS_OPTIONS)[number])}>
              <SelectTrigger className="w-full xl:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "all" ? "All statuses" : labelize(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as (typeof PRIORITY_OPTIONS)[number])}>
              <SelectTrigger className="w-full xl:w-36">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "all" ? "All priority" : labelize(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="w-full xl:w-48">
                <SelectValue placeholder="Owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All owners</SelectItem>
                <SelectItem value={EMPTY_FIELD}>Unassigned</SelectItem>
                {operators.map((operator) => (
                  <SelectItem key={operator.userId} value={operator.userId}>
                    {operator.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as (typeof SOURCE_OPTIONS)[number])}>
              <SelectTrigger className="w-full xl:w-44">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "all" ? "All sources" : labelize(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "pipeline" | "calendar" | "insights")} className="space-y-6">
        <TabsList className={cn("grid w-full", canCalendar ? "grid-cols-3" : "grid-cols-2")}>
          <TabsTrigger value="pipeline" className="gap-2">
            <LayoutList className="h-4 w-4" />
            Pipeline
          </TabsTrigger>
          {canCalendar ? (
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Calendar
            </TabsTrigger>
          ) : null}
          <TabsTrigger value="insights" className="gap-2">
            <LineChart className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pipeline Queue</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track every high-intent CTA, route owners quickly, and move schools toward booked demos.
                </p>
              </div>
              <Badge variant="outline" className="gap-1">
                <Filter className="h-3.5 w-3.5" />
                {filteredRequests.length} visible
              </Badge>
            </CardHeader>
            <CardContent>
              {filteredRequests.length === 0 ? (
                <EmptyState
                  icon={CalendarPlus2}
                  title="No demo requests match these filters"
                  description="Adjust the filters or create a manual demo request to seed the pipeline."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Next step</TableHead>
                      <TableHead>Booked</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request._id} className={request.deletedAt ? "opacity-60" : ""}>
                        <TableCell className="align-top">
                          <button
                            type="button"
                            className="text-left"
                            onClick={() => setDetailTarget(request)}
                          >
                            <div className="font-medium hover:text-emerald-700">{request.schoolName}</div>
                            <div className="text-sm text-muted-foreground">
                              {request.fullName} · {request.email}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span>{request.country ?? "Unknown market"}</span>
                              {request.marketingAttribution?.utmCampaign ? (
                                <span>{request.marketingAttribution.utmCampaign}</span>
                              ) : null}
                              {request.marketingAttribution?.ctaSource ? (
                                <span>{request.marketingAttribution.ctaSource}</span>
                              ) : null}
                            </div>
                          </button>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-col gap-2">
                            <Badge variant="outline" className={statusClass(request.status)}>
                              {labelize(request.status)}
                            </Badge>
                            {request.isHighValue ? (
                              <Badge variant="outline" className="w-fit border-emerald-500/20 bg-emerald-500/10 text-emerald-700">
                                High intent
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge variant="outline" className={priorityClass(request.priority)}>
                            <Flag className="mr-1 h-3 w-3" />
                            {labelize(request.priority ?? "low")}
                          </Badge>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Score {request.qualificationScore ?? 0}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          {canAssign ? (
                            <Select
                              value={request.assignedTo ?? EMPTY_FIELD}
                              onValueChange={(value) => void handleAssign(request._id, value)}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Assign owner" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={EMPTY_FIELD}>Unassigned</SelectItem>
                                {operators.map((operator) => (
                                  <SelectItem key={operator.userId} value={operator.userId}>
                                    {operator.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div>
                              <div className="font-medium">{request.assignedUser?.name ?? "Unassigned"}</div>
                              <div className="text-xs text-muted-foreground">{request.assignedTeam ?? "Sales"}</div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="text-sm">{request.nextActionLabel ?? "No follow-up set"}</div>
                          <div className="text-xs text-muted-foreground">
                            {request.nextActionAt ? formatRelativeTime(request.nextActionAt) : "Action missing"}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          {request.scheduledFor ? (
                            <div>
                              <div className="text-sm font-medium">{formatDateTime(request.scheduledFor)}</div>
                              <div className="text-xs text-muted-foreground">
                                {request.meetingUrl ? "Meeting link ready" : "Link pending"}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not booked</span>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex justify-end gap-2">
                            {request.deletedAt ? (
                              <PermissionGate permission="demo_requests.delete">
                                <Button variant="outline" size="sm" onClick={() => void handleRestore(request)}>
                                  Restore
                                </Button>
                              </PermissionGate>
                            ) : (
                              <>
                                <Button variant="outline" size="sm" onClick={() => setDetailTarget(request)}>
                                  Open
                                </Button>
                                {canSchedule ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setScheduleTarget(request);
                                      setScheduleForm(toScheduleState(request));
                                    }}
                                  >
                                    Schedule
                                  </Button>
                                ) : null}
                                <Select
                                  value={request.status}
                                  onValueChange={(value) => void handleStatusChange(request, value as DemoStatus)}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATUS_OPTIONS.filter((option) => option !== "all").map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {labelize(option)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {canCalendar ? (
          <TabsContent value="calendar" className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1.65fr_0.95fr]">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Booked Demo Calendar</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Month view for all scheduled demos, filtered by owner, campaign, and priority.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-[180px] text-center text-sm font-medium">
                      {monthCursor.toLocaleString(undefined, { month: "long", year: "numeric" })}
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
                      <div key={label}>{label}</div>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-7 gap-2">
                    {monthDays.map((day) => (
                      <div
                        key={day.key}
                        className={cn(
                          "min-h-[120px] rounded-xl border p-2",
                          day.inMonth ? "bg-white" : "bg-muted/30 text-muted-foreground"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{day.date.getDate()}</span>
                          {day.items.length > 0 ? (
                            <Badge variant="outline" className="text-[10px]">
                              {day.items.length}
                            </Badge>
                          ) : null}
                        </div>
                        <div className="mt-2 space-y-2">
                          {day.items.slice(0, 3).map((item) => (
                            <button
                              key={item._id}
                              type="button"
                              onClick={() => setDetailTarget(item)}
                              className="block w-full rounded-lg border border-violet-500/15 bg-violet-500/8 px-2 py-1 text-left"
                            >
                              <div className="truncate text-xs font-medium">{item.schoolName}</div>
                              <div className="truncate text-[11px] text-muted-foreground">
                                {item.scheduledFor ? new Date(item.scheduledFor).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Time TBC"}
                              </div>
                            </button>
                          ))}
                          {day.items.length > 3 ? (
                            <div className="text-[11px] text-muted-foreground">+{day.items.length - 3} more</div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Agenda</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {upcomingAgenda.length === 0 ? (
                      <EmptyState
                        icon={CalendarDays}
                        title="No booked demos yet"
                        description="Use the schedule action from the pipeline to add upcoming demos here."
                        className="py-8"
                      />
                    ) : (
                      upcomingAgenda.map((request) => (
                        <button
                          key={request._id}
                          type="button"
                          onClick={() => setDetailTarget(request)}
                          className="w-full rounded-xl border p-4 text-left hover:border-emerald-200 hover:bg-emerald-50/40"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-medium">{request.schoolName}</div>
                              <div className="text-sm text-muted-foreground">{request.fullName}</div>
                            </div>
                            <Badge variant="outline" className={priorityClass(request.priority)}>
                              {labelize(request.priority ?? "low")}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm">{request.scheduledFor ? formatDateTime(request.scheduledFor) : "Time pending"}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {request.assignedUser?.name ?? "Unassigned"} · {request.marketingAttribution?.utmCampaign ?? request.marketingAttribution?.ctaSource ?? "Direct"}
                          </div>
                        </button>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recovery Queue</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {staleRequests.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No overdue follow-ups right now.</p>
                    ) : (
                      staleRequests.map((request) => (
                        <div key={request._id} className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
                          <div className="font-medium">{request.schoolName}</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {request.nextActionLabel ?? "Follow-up pending"} · {request.nextActionAt ? formatRelativeTime(request.nextActionAt) : "No date"}
                          </div>
                          <div className="mt-3">
                            <Button variant="outline" size="sm" onClick={() => setDetailTarget(request)}>
                              Open
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        ) : null}

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Pull</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topCampaigns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Campaign data will appear once attributed leads enter the demo flow.</p>
                ) : (
                  topCampaigns.map((campaign) => (
                    <div key={campaign.label} className="flex items-center justify-between rounded-xl border p-4">
                      <div>
                        <div className="font-medium">{campaign.label}</div>
                        <div className="text-sm text-muted-foreground">Attributed demo demand</div>
                      </div>
                      <Badge variant="outline">{campaign.count}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operator Focus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {operators.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active operators available for assignment.</p>
                ) : (
                  operators.map((operator) => {
                    const owned = requests.filter((request) => request.assignedTo === operator.userId && !request.deletedAt);
                    const booked = owned.filter((request) => request.status === "scheduled").length;
                    return (
                      <div key={operator.userId} className="rounded-xl border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{operator.name}</div>
                            <div className="text-sm text-muted-foreground">{operator.department ?? operator.role}</div>
                          </div>
                          <Badge variant="outline">{owned.length} owned</Badge>
                        </div>
                        <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                          <span>{booked} booked</span>
                          <span>{owned.filter((request) => request.isHighValue).length} high intent</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen || Boolean(editTarget)} onOpenChange={(open) => !open && resetDialogs()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit demo request" : "Create demo request"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>School name</Label>
              <Input value={form.schoolName} onChange={(event) => setForm((current) => ({ ...current, schoolName: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>School type</Label>
              <Input value={form.schoolType} onChange={(event) => setForm((current) => ({ ...current, schoolType: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Job title</Label>
              <Input value={form.jobTitle} onChange={(event) => setForm((current) => ({ ...current, jobTitle: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>County / region</Label>
              <Input value={form.county} onChange={(event) => setForm((current) => ({ ...current, county: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Student count</Label>
              <Input value={form.studentCount} onChange={(event) => setForm((current) => ({ ...current, studentCount: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Preferred demo date</Label>
              <Input type="date" value={form.preferredDemoDate} onChange={(event) => setForm((current) => ({ ...current, preferredDemoDate: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value as DemoStatus }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.filter((option) => option !== "all").map((option) => (
                    <SelectItem key={option} value={option}>
                      {labelize(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(value) => setForm((current) => ({ ...current, priority: value as DemoPriority }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assigned owner</Label>
              <Select value={form.assignedTo || EMPTY_FIELD} onValueChange={(value) => setForm((current) => ({ ...current, assignedTo: value === EMPTY_FIELD ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_FIELD}>Unassigned</SelectItem>
                  {operators.map((operator) => (
                    <SelectItem key={operator.userId} value={operator.userId}>
                      {operator.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Team</Label>
              <Input value={form.assignedTeam} onChange={(event) => setForm((current) => ({ ...current, assignedTeam: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Source channel</Label>
              <Input value={form.sourceChannel} onChange={(event) => setForm((current) => ({ ...current, sourceChannel: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Referral source</Label>
              <Input value={form.referralSource} onChange={(event) => setForm((current) => ({ ...current, referralSource: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Referral code</Label>
              <Input value={form.referralCode} onChange={(event) => setForm((current) => ({ ...current, referralCode: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Next action at</Label>
              <Input type="datetime-local" value={form.nextActionAt} onChange={(event) => setForm((current) => ({ ...current, nextActionAt: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Next action label</Label>
              <Input value={form.nextActionLabel} onChange={(event) => setForm((current) => ({ ...current, nextActionLabel: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Needs / context</Label>
              <Textarea value={form.needs} onChange={(event) => setForm((current) => ({ ...current, needs: event.target.value }))} rows={4} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Meeting URL</Label>
              <Input value={form.meetingUrl} onChange={(event) => setForm((current) => ({ ...current, meetingUrl: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Internal notes</Label>
              <Textarea value={form.notesInternal} onChange={(event) => setForm((current) => ({ ...current, notesInternal: event.target.value }))} rows={4} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Outcome</Label>
              <Textarea value={form.outcome} onChange={(event) => setForm((current) => ({ ...current, outcome: event.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetDialogs}>
              Cancel
            </Button>
            <Button disabled={saving || !form.fullName || !form.email || !form.schoolName} onClick={() => void handleCreateOrUpdate()}>
              {saving ? "Saving..." : editTarget ? "Save changes" : "Create request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(scheduleTarget)} onOpenChange={(open) => !open && resetDialogs()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Schedule demo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Start time</Label>
              <Input type="datetime-local" value={scheduleForm.scheduledFor} onChange={(event) => setScheduleForm((current) => ({ ...current, scheduledFor: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>End time</Label>
              <Input type="datetime-local" value={scheduleForm.scheduledEndAt} onChange={(event) => setScheduleForm((current) => ({ ...current, scheduledEndAt: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Meeting URL</Label>
              <Input value={scheduleForm.meetingUrl} onChange={(event) => setScheduleForm((current) => ({ ...current, meetingUrl: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Owner</Label>
              <Select value={scheduleForm.assignedTo || EMPTY_FIELD} onValueChange={(value) => setScheduleForm((current) => ({ ...current, assignedTo: value === EMPTY_FIELD ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_FIELD}>Keep current / unassigned</SelectItem>
                  {operators.map((operator) => (
                    <SelectItem key={operator.userId} value={operator.userId}>
                      {operator.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prep reminder at</Label>
              <Input type="datetime-local" value={scheduleForm.nextActionAt} onChange={(event) => setScheduleForm((current) => ({ ...current, nextActionAt: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Prep reminder label</Label>
              <Input value={scheduleForm.nextActionLabel} onChange={(event) => setScheduleForm((current) => ({ ...current, nextActionLabel: event.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetDialogs}>
              Cancel
            </Button>
            <Button disabled={saving || !scheduleForm.scheduledFor} onClick={() => void handleSchedule()}>
              {saving ? "Scheduling..." : "Save schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detailTarget)} onOpenChange={(open) => !open && resetDialogs()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          {detailTarget ? (
            <>
              <DialogHeader>
                <DialogTitle>{detailTarget.schoolName}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="space-y-3 pt-6">
                    <div>
                      <div className="text-sm text-muted-foreground">Contact</div>
                      <div className="font-medium">{detailTarget.fullName}</div>
                      <div className="text-sm text-muted-foreground">{detailTarget.email}</div>
                      {detailTarget.phone ? <div className="text-sm text-muted-foreground">{detailTarget.phone}</div> : null}
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Lifecycle</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge variant="outline" className={statusClass(detailTarget.status)}>
                          {labelize(detailTarget.status)}
                        </Badge>
                        <Badge variant="outline" className={priorityClass(detailTarget.priority)}>
                          {labelize(detailTarget.priority ?? "low")}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Owner</div>
                      <div className="font-medium">{detailTarget.assignedUser?.name ?? "Unassigned"}</div>
                      <div className="text-sm text-muted-foreground">{detailTarget.assignedTeam ?? "Sales"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Qualification</div>
                      <div className="font-medium">{detailTarget.qualificationScore ?? 0}</div>
                      <div className="text-sm text-muted-foreground">
                        {detailTarget.studentCount ? `${detailTarget.studentCount} students` : "Student count missing"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="space-y-3 pt-6">
                    <div>
                      <div className="text-sm text-muted-foreground">Attribution</div>
                      <div className="font-medium">{detailTarget.marketingAttribution?.utmCampaign ?? "Direct / unknown"}</div>
                      <div className="text-sm text-muted-foreground">
                        {detailTarget.marketingAttribution?.ctaSource ?? detailTarget.sourceChannel ?? "Direct"}
                      </div>
                      {detailTarget.marketingAttribution?.originPath ? (
                        <div className="text-sm text-muted-foreground">
                          CTA origin: {detailTarget.marketingAttribution.originPath}
                        </div>
                      ) : null}
                      {detailTarget.marketingAttribution?.landingPage ? (
                        <div className="text-sm text-muted-foreground">{detailTarget.marketingAttribution.landingPage}</div>
                      ) : null}
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Scheduling</div>
                      <div className="font-medium">
                        {detailTarget.scheduledFor ? formatDateTime(detailTarget.scheduledFor) : "Not booked"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {detailTarget.nextActionAt ? `${detailTarget.nextActionLabel ?? "Next step"} · ${formatRelativeTime(detailTarget.nextActionAt)}` : "No next action set"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">CRM</div>
                      <div className="font-medium">{detailTarget.crmLead?.stage ?? "Not linked"}</div>
                      <div className="text-sm text-muted-foreground">{detailTarget.crmLead?.status ?? "No CRM status"}</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="md:col-span-2">
                  <CardContent className="space-y-3 pt-6">
                    <div>
                      <div className="text-sm text-muted-foreground">Needs</div>
                      <p className="mt-1 text-sm">{detailTarget.needs ?? "No needs captured."}</p>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Internal notes</div>
                      <p className="mt-1 text-sm whitespace-pre-wrap">{detailTarget.notesInternal ?? "No internal notes yet."}</p>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Outcome</div>
                      <p className="mt-1 text-sm whitespace-pre-wrap">{detailTarget.outcome ?? "No outcome recorded yet."}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="md:col-span-2">
                  <CardContent className="space-y-3 pt-6">
                    <div className="text-sm text-muted-foreground">Activity timeline</div>
                    {detailTarget.timeline && detailTarget.timeline.length > 0 ? (
                      <div className="space-y-3">
                        {detailTarget.timeline.map((event) => (
                          <div key={event._id} className="rounded-xl border p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-medium">{event.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {event.actorEmail ?? event.actorUserId ?? "System"} · {formatDateTime(event.createdAt)}
                                </div>
                              </div>
                              <Badge variant="outline">{labelize(event.eventType)}</Badge>
                            </div>
                            {event.body ? (
                              <p className="mt-2 text-sm whitespace-pre-wrap text-muted-foreground">{event.body}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No activity captured yet.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
              <DialogFooter className="gap-2">
                {canEdit ? (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      setEditTarget(detailTarget);
                      setForm(toForm(detailTarget));
                      setDetailTarget(null);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                ) : null}
                {canSchedule && !detailTarget.deletedAt ? (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      setScheduleTarget(detailTarget);
                      setScheduleForm(toScheduleState(detailTarget));
                      setDetailTarget(null);
                    }}
                  >
                    <CalendarPlus2 className="h-4 w-4" />
                    Schedule
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button
                    variant="outline"
                    className="gap-2 text-rose-600"
                    onClick={() => {
                      setDeleteTarget(detailTarget);
                      setDetailTarget(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Archive
                  </Button>
                ) : null}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && resetDialogs()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Archive demo request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The record stays in history and can be restored later, but it will leave the active queue.
            </p>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetDialogs}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={saving} onClick={() => void handleDelete()}>
              {saving ? "Archiving..." : "Archive request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
