"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDate, formatDateTime, formatName, formatPhone } from "@/lib/formatters";
import { formatTenantHostname } from "@/lib/domains";
import {
  AlertTriangle,
  ArrowLeft,
  Archive,
  Building2,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  Flag,
  Mail,
  MessageSquareMore,
  Package,
  Settings,
  Shield,
  Ticket,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

function normalizeArray<T>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.rows)) return value.rows;
  return [];
}

function formatKes(amount?: number) {
  return `KES ${(amount ?? 0).toLocaleString()}`;
}

function statusBadgeClass(status?: string) {
  switch (status) {
    case "active":
    case "published":
    case "paid":
    case "resolved":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
    case "trial":
    case "trialing":
    case "sent":
    case "in_progress":
      return "border-sky-500/20 bg-sky-500/10 text-sky-700";
    case "suspended":
    case "archived":
    case "cancelled":
    case "revoked":
    case "expired":
      return "border-rose-500/20 bg-rose-500/10 text-rose-700";
    default:
      return "border-amber-500/20 bg-amber-500/10 text-amber-700";
  }
}

function InfoGrid({
  items,
}: {
  items: Array<{ label: string; value: string | number | null | undefined }>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">{item.label}</p>
          <p className="mt-1 font-medium">{item.value || "—"}</p>
        </div>
      ))}
    </div>
  );
}

function UsageMetricCard({
  label,
  value,
  helper,
  progress,
}: {
  label: string;
  value: string;
  helper: string;
  progress?: number | null;
}) {
  const toneClass =
    typeof progress !== "number"
      ? "border-slate-500/20 bg-slate-500/10 text-slate-700"
      : progress >= 90
        ? statusBadgeClass("suspended")
        : progress >= 70
          ? statusBadgeClass("trialing")
          : statusBadgeClass("active");

  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        {typeof progress === "number" ? (
          <Badge variant="outline" className={toneClass}>
            {progress}%
          </Badge>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
      {typeof progress === "number" ? <Progress className="mt-3 h-2" value={progress} /> : null}
    </div>
  );
}

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isLoading, sessionToken } = useAuth();
  const tenantId = params.tenantId as string;

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archiveConfirmation, setArchiveConfirmation] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [submittingArchive, setSubmittingArchive] = useState(false);
  const [submittingDelete, setSubmittingDelete] = useState(false);
  const [repairingOrg, setRepairingOrg] = useState(false);
  const [resendingInvite, setResendingInvite] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("stalled_step_auto");
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const [nudgeMessage, setNudgeMessage] = useState("");
  const [nudgeChannel, setNudgeChannel] = useState("email_sms");
  const [savingNudge, setSavingNudge] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [platformNote, setPlatformNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const tenantDetail = usePlatformQuery(
    api.platform.tenants.queries.getTenantDetailBundle,
    { sessionToken: sessionToken || "", tenantId }
  );
  const dependencySummary = usePlatformQuery(
    api.platform.tenants.queries.getTenantDependencySummary,
    { sessionToken: sessionToken || "", tenantId }
  );
  const onboardingRecord = usePlatformQuery(
    api.modules.platform.onboarding.getPlatformOnboardingRecord,
    { sessionToken: sessionToken || "", tenantId }
  ) as any;
  const platformAdmins = usePlatformQuery(
    api.platform.users.queries.listPlatformAdmins,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as Array<{ eduMylesUserId: string; firstName?: string; lastName?: string; email: string }> | undefined;

  const archiveTenant = useMutation(api.platform.tenants.mutations.archiveTenant);
  const deleteTenant = useMutation(api.platform.tenants.mutations.deleteTenant);
  const assignAccountManager = useMutation(api.modules.platform.onboarding.assignAccountManager);
  const sendOnboardingNudge = useMutation(api.modules.platform.onboarding.sendOnboardingNudge);
  const addPlatformOnboardingNote = useMutation(api.modules.platform.onboarding.addPlatformOnboardingNote);

  if (isLoading || tenantDetail === undefined || dependencySummary === undefined || onboardingRecord === undefined || platformAdmins === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!tenantDetail) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/platform/tenants")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tenants
        </Button>
        <EmptyState
          icon={Building2}
          title="Tenant not found"
          description="The tenant record could not be found, or your platform session no longer has access to it."
          action={
            <Button asChild>
              <Link href="/platform/tenants">Return to tenant list</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const {
    tenant,
    organization,
    subscription,
    usage,
    schoolProfile,
    health,
    overview,
    adminAccess,
    users,
    primaryAdmin,
    pendingInvites,
    modules,
    pilotGrants,
    finance,
    communications,
    auditLogs,
    settings,
  } = tenantDetail;

  const pendingInviteRows = normalizeArray<any>(pendingInvites);
  const nudgeTemplateRows = normalizeArray<any>(onboardingRecord?.nudgeTemplates);
  const onboardingNoteRows = normalizeArray<any>(onboardingRecord?.notes);

  const pendingSchoolAdmin =
    pendingInviteRows.find((invite: any) => invite.role === "school_admin") ?? null;
  const adminInviteTarget = pendingSchoolAdmin ?? primaryAdmin ?? null;
  const activeNudgeTemplate =
    nudgeTemplateRows.find((template: any) => template.key === selectedTemplate) ??
    nudgeTemplateRows[0] ??
    null;

  const handleProvisionOrg = async () => {
    if (!sessionToken) return;
    setRepairingOrg(true);
    try {
      const response = await fetch("/api/tenants/provision-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, tenantId }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to provision WorkOS organization");
      }
      toast({
        title: payload.alreadyExists ? "WorkOS organization already linked" : "WorkOS organization provisioned",
        description: payload.warning ?? payload.workosOrgId ?? "The tenant organization is ready for invitations.",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Unable to provision organization",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setRepairingOrg(false);
    }
  };

  const handleResendAdminInvite = async () => {
    if (!sessionToken || !adminInviteTarget?.email) return;
    setResendingInvite(true);
    try {
      const response = await fetch("/api/tenants/invite-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          tenantId,
          email: adminInviteTarget.email,
          firstName: adminInviteTarget.firstName ?? "",
          lastName: adminInviteTarget.lastName ?? "",
          role: "school_admin",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to send tenant admin invite");
      }
      toast({
        title: "Admin invite sent",
        description: payload.warning ?? `Invitation sent to ${adminInviteTarget.email}.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Unable to send admin invite",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setResendingInvite(false);
    }
  };

  const handleArchive = async () => {
    if (!sessionToken) return;
    setSubmittingArchive(true);
    try {
      await archiveTenant({
        sessionToken,
        tenantId,
        confirmationName: archiveConfirmation,
      });
      toast({
        title: "Tenant archived",
        description: `${tenant.name} has been archived.`,
      });
      setArchiveOpen(false);
      setArchiveConfirmation("");
    } catch (error) {
      toast({
        title: "Unable to archive tenant",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingArchive(false);
    }
  };

  const handleDelete = async () => {
    if (!sessionToken) return;
    setSubmittingDelete(true);
    try {
      await deleteTenant({
        sessionToken,
        tenantId,
        confirmationName: deleteConfirmation,
      });
      toast({
        title: "Tenant deleted",
        description: `${tenant.name} has been permanently removed.`,
      });
      router.push("/platform/tenants");
    } catch (error) {
      toast({
        title: "Unable to delete tenant",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingDelete(false);
    }
  };

  const handleAssignAccountManager = async (accountManagerUserId: string) => {
    if (!sessionToken || !accountManagerUserId) return;
    try {
      await assignAccountManager({
        sessionToken,
        tenantId,
        accountManagerUserId,
      });
      toast({
        title: "Account manager assigned",
        description: "The tenant onboarding owner has been updated.",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Unable to assign account manager",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendNudge = async () => {
    if (!sessionToken || !onboardingRecord) return;
    setSavingNudge(true);
    try {
      await sendOnboardingNudge({
        sessionToken,
        tenantId,
        template: selectedTemplate,
        message: nudgeMessage.trim() || undefined,
        sendEmail: nudgeChannel !== "sms_only",
        sendSms: nudgeChannel !== "email_only",
      });
      toast({
        title: "Intervention sent",
        description: `A platform nudge was sent to ${tenant.name}.`,
      });
      setNudgeOpen(false);
      setSelectedTemplate("stalled_step_auto");
      setNudgeMessage("");
      setNudgeChannel("email_sms");
      router.refresh();
    } catch (error) {
      toast({
        title: "Unable to send intervention",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingNudge(false);
    }
  };

  const handleAddNote = async () => {
    if (!sessionToken || !platformNote.trim()) return;
    setSavingNote(true);
    try {
      await addPlatformOnboardingNote({
        sessionToken,
        tenantId,
        note: platformNote.trim(),
      });
      toast({
        title: "Note added",
        description: "The onboarding note was saved to this tenant.",
      });
      setNoteOpen(false);
      setPlatformNote("");
      router.refresh();
    } catch (error) {
      toast({
        title: "Unable to add note",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={tenant.name}
        description={`${tenant.plan} plan tenant on ${formatTenantHostname(tenant.subdomain)}`}
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Tenants", href: "/platform/tenants" },
          { label: tenant.name },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={() => router.push("/platform/tenants")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button variant="outline" asChild>
          <Link href={`https://${formatTenantHostname(tenant.subdomain)}`} target="_blank">
            <ExternalLink className="mr-2 h-4 w-4" />
            Visit Site
          </Link>
        </Button>
        <Button variant="outline" onClick={handleProvisionOrg} disabled={repairingOrg}>
          <Building2 className="mr-2 h-4 w-4" />
          {repairingOrg ? "Provisioning Org..." : adminAccess.organizationReady ? "Repair WorkOS Org" : "Provision WorkOS Org"}
        </Button>
        <Button variant="outline" onClick={handleResendAdminInvite} disabled={resendingInvite || !adminInviteTarget?.email}>
          <Mail className="mr-2 h-4 w-4" />
          {resendingInvite ? "Sending Invite..." : "Send Admin Invite"}
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/platform/onboarding?tenantId=${tenantId}`}>
            <Shield className="mr-2 h-4 w-4" />
            View Setup Flow
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setArchiveConfirmation("");
            setArchiveOpen(true);
          }}
          disabled={!dependencySummary.canArchive}
        >
          <Archive className="mr-2 h-4 w-4" />
          Archive
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            setDeleteConfirmation("");
            setDeleteOpen(true);
          }}
          disabled={!dependencySummary.canDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
        <Badge variant="outline" className={statusBadgeClass(tenant.status)}>
          {tenant.status}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{overview.userCount}</p>
            <p className="text-sm text-muted-foreground">
              {overview.activeUserCount} active, {overview.pendingInviteCount} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{overview.activeModuleCount}</p>
            <p className="text-sm text-muted-foreground">{overview.moduleCount} provisioned total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pilot Grants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{overview.pilotGrantCount}</p>
            <p className="text-sm text-muted-foreground">Marketplace pilots on this tenant</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Support</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{overview.openTicketCount}</p>
            <p className="text-sm text-muted-foreground">{overview.auditEventCount} audit events logged</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Lifecycle Safety Checks</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div>
            <p className="text-sm text-muted-foreground">Users</p>
            <p className="text-xl font-semibold">{dependencySummary.users}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active Users</p>
            <p className="text-xl font-semibold">{dependencySummary.activeUsers}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Students</p>
            <p className="text-xl font-semibold">{dependencySummary.students}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Invoices</p>
            <p className="text-xl font-semibold">{dependencySummary.invoices}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Open Invoices</p>
            <p className="text-xl font-semibold">{dependencySummary.openInvoices}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Modules</p>
            <p className="text-xl font-semibold">{dependencySummary.modules}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-xl border bg-muted/30 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="pilot-grants">Pilot Grants</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="audit-log">Audit Log</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoGrid
                items={[
                  { label: "School Name", value: tenant.name },
                  { label: "Hostname", value: formatTenantHostname(tenant.subdomain) },
                  { label: "School Type", value: schoolProfile.schoolType ?? "—" },
                  { label: "Admin Email", value: primaryAdmin?.email ?? tenant.email },
                  {
                    label: "Admin Phone",
                    value: primaryAdmin?.phone ? formatPhone(primaryAdmin.phone) : tenant.phone ? formatPhone(tenant.phone) : "—",
                  },
                  { label: "Admin Title", value: primaryAdmin?.bio ?? "School administrator" },
                  { label: "County / Region", value: tenant.county },
                  { label: "Country", value: tenant.country },
                  { label: "Address", value: schoolProfile.address ?? "—" },
                  { label: "Website", value: schoolProfile.websiteUrl ?? "—" },
                  { label: "Custom Domain", value: schoolProfile.customDomain ?? "—" },
                  { label: "Created", value: formatDateTime(tenant.createdAt) },
                  { label: "Updated", value: formatDateTime(tenant.updatedAt) },
                  { label: "Organization", value: organization?.name ?? "Pending WorkOS org sync" },
                  { label: "WorkOS Org", value: adminAccess.workosOrgId ?? "Not provisioned" },
                  { label: "Admin Invite Status", value: adminAccess.primaryAdminInvite?.status ?? "not_sent" },
                ]}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Current Usage</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <UsageMetricCard
                  label="Students"
                  value={`${health.studentCount}`}
                  helper={
                    health.studentLimit
                      ? `${health.studentCount} of ${health.studentLimit} student seats in use`
                      : "No student cap configured for this plan"
                  }
                  progress={health.studentUsagePct}
                />
                <UsageMetricCard
                  label="Staff"
                  value={`${health.staffCount}`}
                  helper={
                    health.staffLimit
                      ? `${health.staffCount} of ${health.staffLimit} staff seats in use`
                      : "No staff cap configured for this plan"
                  }
                  progress={health.staffUsagePct}
                />
                <UsageMetricCard
                  label="Storage"
                  value={`${health.storageUsedGb} GB`}
                  helper={
                    health.storageLimitGb
                      ? `${health.storageUsedGb} GB of ${health.storageLimitGb} GB allocated`
                      : "No storage ceiling configured for this plan"
                  }
                  progress={health.storageUsagePct}
                />
                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">Latest snapshot</p>
                  <p className="mt-2 font-medium">
                    {usage?.recordedAt ? formatDateTime(usage.recordedAt) : "No usage snapshot yet"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operational Signals</CardTitle>
              </CardHeader>
              <CardContent>
                <InfoGrid
                  items={[
                    { label: "Open Support Tickets", value: overview.openTicketCount },
                    { label: "Audit Events", value: overview.auditEventCount },
                    { label: "Pending Invites", value: overview.pendingInviteCount },
                    { label: "Active Modules", value: overview.activeModuleCount },
                    { label: "Display Currency", value: schoolProfile.displayCurrency ?? "KES" },
                    { label: "Timezone", value: schoolProfile.timezone ?? "Africa/Nairobi" },
                    { label: "Term Structure", value: schoolProfile.termStructure ?? "—" },
                    { label: "Outstanding Balance", value: formatKes(health.outstandingInvoiceAmountKes) },
                  ]}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Admin Access Readiness</CardTitle>
              </CardHeader>
              <CardContent>
                <InfoGrid
                  items={[
                    { label: "WorkOS Organization", value: adminAccess.organizationReady ? "Ready" : "Pending" },
                    { label: "WorkOS Org ID", value: adminAccess.workosOrgId ?? "—" },
                    { label: "Primary Invite Status", value: adminAccess.primaryAdminInvite?.status ?? "not_sent" },
                    { label: "Invite Email", value: adminAccess.primaryAdminInvite?.email ?? pendingSchoolAdmin?.email ?? primaryAdmin?.email ?? "—" },
                    { label: "Invite Expires", value: adminAccess.primaryAdminInvite?.expiresAt ? formatDateTime(adminAccess.primaryAdminInvite.expiresAt) : "—" },
                    { label: "Accepted At", value: adminAccess.primaryAdminInvite?.acceptedAt ? formatDateTime(adminAccess.primaryAdminInvite.acceptedAt) : "—" },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-4">
          {!onboardingRecord ? (
            <EmptyState
              icon={TrendingUp}
              title="No onboarding record"
              description="This tenant has not started the shared onboarding flow yet."
            />
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Onboarding Health</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-3xl font-semibold">{onboardingRecord.healthScore}/100</p>
                        <p className="text-sm text-muted-foreground">
                          {onboardingRecord.completedCount}/{onboardingRecord.totalSteps} steps complete
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={statusBadgeClass(onboardingRecord.status)}>
                          {onboardingRecord.status}
                        </Badge>
                        {onboardingRecord.stalled ? (
                          <Badge variant="outline" className={statusBadgeClass("suspended")}>
                            stalled
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <Progress value={onboardingRecord.progressPct} className="h-3" />
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-lg border bg-muted/20 p-4">
                        <p className="text-sm text-muted-foreground">Current step</p>
                        <p className="mt-1 font-medium">{onboardingRecord.currentStepLabel}</p>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-4">
                        <p className="text-sm text-muted-foreground">Last activity</p>
                        <p className="mt-1 font-medium">{formatDateTime(onboardingRecord.lastActivityAt)}</p>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-4">
                        <p className="text-sm text-muted-foreground">Plan</p>
                        <p className="mt-1 font-medium">{onboardingRecord.planId ?? "Not assigned"}</p>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-4">
                        <p className="text-sm text-muted-foreground">Trial ends</p>
                        <p className="mt-1 font-medium">{onboardingRecord.trialEndsAt ? formatDate(onboardingRecord.trialEndsAt) : "Not active"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Account Manager</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {onboardingRecord.assignedAccountManagerName ? (
                      <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{onboardingRecord.assignedAccountManagerInitials ?? "AM"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{onboardingRecord.assignedAccountManagerName}</p>
                          <p className="text-sm text-muted-foreground">Assigned owner</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No account manager assigned yet.</p>
                    )}
                    <div className="space-y-2">
                      <Label>Assign / reassign</Label>
                      <Select
                        value={onboardingRecord.assignedAccountManager ?? ""}
                        onValueChange={handleAssignAccountManager}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account manager" />
                        </SelectTrigger>
                        <SelectContent>
                          {platformAdmins.map((admin) => (
                            <SelectItem key={admin.eduMylesUserId} value={admin.eduMylesUserId}>
                              {[admin.firstName, admin.lastName].filter(Boolean).join(" ") || admin.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => setNudgeOpen(true)}>
                        Send Intervention
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setNoteOpen(true)}>
                        Add Note
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Step Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Step</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Points</TableHead>
                          <TableHead>Completed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(onboardingRecord.steps ?? {}).map(([stepKey, stepValue]: [string, any]) => (
                          <TableRow key={stepKey}>
                            <TableCell>{stepKey}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={stepValue?.completed ? statusBadgeClass("active") : statusBadgeClass("trialing")}>
                                {stepValue?.completed ? "completed" : "pending"}
                              </Badge>
                            </TableCell>
                            <TableCell>{stepValue?.pointsAwarded ?? 0}</TableCell>
                            <TableCell>{stepValue?.completedAt ? formatDateTime(stepValue.completedAt) : "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Intervention Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {onboardingRecord.interventionsSent?.length ? (
                      <ScrollArea className="h-[360px] pr-4">
                        <div className="space-y-3">
                          {onboardingRecord.interventionsSent
                            .slice()
                            .sort((a: any, b: any) => b.sentAt - a.sentAt)
                            .map((entry: any, index: number) => (
                              <div key={`${entry.type}-${entry.channel}-${index}`} className="rounded-lg border bg-muted/20 p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="font-medium">{entry.type}</p>
                                  <Badge variant="outline">{entry.channel}</Badge>
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(entry.sentAt)}</p>
                              </div>
                            ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <EmptyState
                        icon={CheckCircle2}
                        title="No interventions yet"
                        description="Platform nudges and scheduled interventions will appear here."
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {onboardingRecord.notes?.length ? (
                    <ScrollArea className="h-[240px] pr-4">
                      <div className="space-y-3">
                        {onboardingRecord.notes
                          .slice()
                          .reverse()
                          .map((note: any) => (
                            <div key={note.id} className="rounded-lg border bg-muted/20 p-4">
                              <p>{note.note}</p>
                              <p className="mt-2 text-xs text-muted-foreground">
                                {note.authorEmail} · {formatDateTime(note.createdAt)}
                              </p>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <EmptyState
                      icon={Settings}
                      title="No notes yet"
                      description="Add internal onboarding notes for account managers and platform operations."
                    />
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <InfoGrid
                  items={[
                    { label: "Plan", value: subscription.plan?.name ?? subscription.planId },
                    { label: "Status", value: subscription.status },
                    { label: "Billing Cycle", value: subscription.billingCycleLabel },
                    { label: "Current Period Start", value: formatDate(subscription.currentPeriodStart) },
                    { label: "Current Period End", value: formatDate(subscription.currentPeriodEnd) },
                    { label: "Trial Ends", value: subscription.trialEndsAt ? formatDate(subscription.trialEndsAt) : "—" },
                    { label: "Payment Provider", value: subscription.paymentProvider ?? "Not set" },
                    { label: "Monthly Price", value: formatKes(subscription.customPriceMonthlyKes ?? subscription.plan?.priceMonthlyKes ?? 0) },
                    { label: "Annual Price", value: formatKes(subscription.customPriceAnnualKes ?? subscription.plan?.priceAnnualKes ?? 0) },
                    { label: "Student Limit", value: subscription.plan?.studentLimit ?? "Unlimited" },
                    { label: "Support Tier", value: subscription.plan?.supportTier ?? "—" },
                    { label: "API Access", value: subscription.plan?.apiAccess ?? "—" },
                    { label: "White Label", value: subscription.plan?.whiteLabel ?? "—" },
                  ]}
                />
              ) : (
                <EmptyState
                  icon={CreditCard}
                  title="No subscription record"
                  description="This tenant has not been linked to a subscription record yet."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Subscription Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {finance.subscriptionInvoices.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No subscription invoices yet"
                  description="Invoices will appear here once billing activity starts."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Provider</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {finance.subscriptionInvoices.map((invoice: any) => (
                      <TableRow key={String(invoice._id)}>
                        <TableCell>
                          <Badge variant="outline" className={statusBadgeClass(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell>{formatKes(invoice.totalAmountKes)}</TableCell>
                        <TableCell>{invoice.paymentProvider ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pilot-grants">
          <Card>
            <CardHeader>
              <CardTitle>Pilot Grants</CardTitle>
            </CardHeader>
            <CardContent>
              {pilotGrants.length === 0 ? (
                <EmptyState
                  icon={Flag}
                  title="No pilot grants"
                  description="This tenant does not have any active or historical pilot grants yet."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pilotGrants.map((grant: any) => (
                      <TableRow key={String(grant._id)}>
                        <TableCell>{grant.moduleId}</TableCell>
                        <TableCell>{grant.grantType}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusBadgeClass(grant.status)}>
                            {grant.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(grant.startDate)}</TableCell>
                        <TableCell>{grant.endDate ? formatDate(grant.endDate) : "Open-ended"}</TableCell>
                        <TableCell className="max-w-xs truncate">{grant.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>Installed Modules</CardTitle>
            </CardHeader>
            <CardContent>
              {modules.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No modules provisioned"
                  description="Modules installed during onboarding or marketplace setup will appear here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Installed</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Flags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modules.map((module: any) => (
                      <TableRow key={module.moduleId}>
                        <TableCell>{module.name}</TableCell>
                        <TableCell>{module.category}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusBadgeClass(module.status)}>
                            {module.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{module.installedAt ? formatDate(module.installedAt) : "—"}</TableCell>
                        <TableCell>{Object.keys(module.rolePermissions ?? {}).length}</TableCell>
                        <TableCell>{Object.keys(module.featureFlags ?? {}).length}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No active users"
                  description="User records will appear here after invites are accepted or users are created."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: any) => (
                      <TableRow key={String(user._id)}>
                        <TableCell>{formatName(user.firstName, user.lastName)}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusBadgeClass(user.isActive ? "active" : "suspended")}>
                            {user.isActive ? "active" : "inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Invites</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingInvites.length === 0 ? (
                <EmptyState
                  icon={Mail}
                  title="No pending invites"
                  description="Outstanding school-admin or staff invites will appear here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvites.map((invite: any) => (
                      <TableRow key={String(invite._id)}>
                        <TableCell>{formatName(invite.firstName, invite.lastName)}</TableCell>
                        <TableCell>{invite.email}</TableCell>
                        <TableCell>{invite.role}</TableCell>
                        <TableCell>{formatDate(invite.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Subscription Invoiced</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{formatKes(finance.totals.totalInvoiceAmountKes)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Collected</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{formatKes(finance.totals.totalCollectedKes)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{finance.totals.outstandingInvoiceCount}</p>
                <p className="text-sm text-muted-foreground">{formatKes(finance.totals.outstandingInvoiceAmountKes)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>School Finance Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {finance.invoices.length === 0 ? (
                <EmptyState
                  icon={Wallet}
                  title="No school invoices"
                  description="School-facing finance invoices for this tenant will appear here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {finance.invoices.map((invoice: any) => (
                      <TableRow key={String(invoice._id)}>
                        <TableCell>{invoice.invoiceNumber ?? String(invoice._id)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusBadgeClass(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(invoice.dueDate ?? invoice.createdAt)}</TableCell>
                        <TableCell>{formatKes(invoice.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {finance.payments.length === 0 ? (
                <EmptyState
                  icon={CreditCard}
                  title="No payments recorded"
                  description="Payments posted against this tenant will appear here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {finance.payments.map((payment: any) => (
                      <TableRow key={String(payment._id)}>
                        <TableCell>{payment.reference ?? String(payment._id)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusBadgeClass(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{payment.method ?? payment.provider ?? "—"}</TableCell>
                        <TableCell>{formatDate(payment.createdAt)}</TableCell>
                        <TableCell>{formatKes(payment.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              {communications.supportTickets.length === 0 ? (
                <EmptyState
                  icon={Ticket}
                  title="No support tickets"
                  description="Platform and tenant support conversations will appear here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {communications.supportTickets.map((ticket: any) => (
                      <TableRow key={String(ticket._id)}>
                        <TableCell>{ticket.subject}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusBadgeClass(ticket.status)}>
                            {ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{ticket.priority}</TableCell>
                        <TableCell>{formatDateTime(ticket.updatedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Relevant Platform Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              {communications.announcements.length === 0 ? (
                <EmptyState
                  icon={Mail}
                  title="No active announcements"
                  description="Platform-wide announcements that target this tenant's plan or country will show here."
                />
              ) : (
                <div className="space-y-3">
                  {communications.announcements.map((announcement: any) => (
                    <div key={String(announcement._id)} className="rounded-lg border p-4">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{announcement.title}</p>
                        {announcement.isCritical ? (
                          <Badge variant="outline" className="border-rose-500/20 bg-rose-500/10 text-rose-700">
                            critical
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{announcement.body}</p>
                      <p className="mt-3 text-xs text-muted-foreground">
                        Starts {formatDateTime(announcement.startsAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit-log">
          <Card>
            <CardHeader>
              <CardTitle>Recent Audit Log</CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <EmptyState
                  icon={Shield}
                  title="No audit activity yet"
                  description="Audit events for this tenant will appear here once changes start flowing through the platform."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log: any) => (
                      <TableRow key={String(log._id)}>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.actorEmail}</TableCell>
                        <TableCell>{log.entityType}</TableCell>
                        <TableCell>{formatDateTime(log.timestamp)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
            </CardHeader>
            <CardContent>
              {settings.featureFlags.length === 0 ? (
                <EmptyState
                  icon={Settings}
                  title="No feature flags"
                  description="Platform or tenant-specific feature toggles affecting this school will appear here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settings.featureFlags.map((flag: any) => (
                      <TableRow key={String(flag._id)}>
                        <TableCell>{flag.key}</TableCell>
                        <TableCell>{flag.enabledGlobally ? "Global" : "Tenant override"}</TableCell>
                        <TableCell>{formatDateTime(flag.updatedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance Windows</CardTitle>
            </CardHeader>
            <CardContent>
              {settings.maintenanceWindows.length === 0 ? (
                <EmptyState
                  icon={AlertTriangle}
                  title="No maintenance windows"
                  description="Scheduled maintenance affecting this tenant will appear here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settings.maintenanceWindows.map((window: any) => (
                      <TableRow key={String(window._id)}>
                        <TableCell>
                          <Badge variant="outline" className={statusBadgeClass(window.status)}>
                            {window.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(window.startAt)}</TableCell>
                        <TableCell>{formatDateTime(window.endAt)}</TableCell>
                        <TableCell>{window.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Archive Tenant"
        description={
          dependencySummary.canArchive
            ? `Archive ${tenant.name}? Type the tenant name exactly before confirming.`
            : "Suspend this tenant before archiving it."
        }
        onConfirm={handleArchive}
        confirmLabel="Archive Tenant"
        variant="destructive"
        isLoading={submittingArchive}
      />

      {archiveOpen ? (
        <Card className="border-dashed">
          <CardContent className="space-y-2 pt-6">
            <Label htmlFor="archive-confirmation">Type tenant name to archive</Label>
            <Input
              id="archive-confirmation"
              value={archiveConfirmation}
              onChange={(event) => setArchiveConfirmation(event.target.value)}
              placeholder={tenant.name}
            />
          </CardContent>
        </Card>
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Tenant"
        description={
          dependencySummary.canDelete
            ? `Permanently delete ${tenant.name}. This cannot be undone.`
            : "Only archived tenants with no dependent records can be deleted."
        }
        onConfirm={handleDelete}
        confirmLabel="Delete Tenant"
        variant="destructive"
        isLoading={submittingDelete}
      />

      {deleteOpen ? (
        <Card className="border-dashed">
          <CardContent className="space-y-2 pt-6">
            <Label htmlFor="delete-confirmation">Type tenant name to delete</Label>
            <Input
              id="delete-confirmation"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              placeholder={tenant.name}
            />
          </CardContent>
        </Card>
      ) : null}

      <Dialog
        open={nudgeOpen}
        onOpenChange={(open) => {
          setNudgeOpen(open);
          if (!open) {
            setSelectedTemplate("stalled_step_auto");
            setNudgeMessage("");
            setNudgeChannel("email_sms");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send onboarding intervention</DialogTitle>
            <DialogDescription>
              Send a platform intervention to help {tenant.name} continue the shared onboarding flow.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(onboardingRecord?.nudgeTemplates ?? []).map((template: any) => (
                    <SelectItem key={template.key} value={template.key}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeNudgeTemplate ? (
                <p className="text-xs text-muted-foreground">{activeNudgeTemplate.description}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select value={nudgeChannel} onValueChange={setNudgeChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email_sms">Email + SMS</SelectItem>
                  <SelectItem value="email_only">Email only</SelectItem>
                  <SelectItem value="sms_only">SMS only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Message preview / override</Label>
              <Textarea
                value={nudgeMessage || activeNudgeTemplate?.message || ""}
                onChange={(event) => setNudgeMessage(event.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNudgeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendNudge} disabled={savingNudge}>
              Send Intervention
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={noteOpen}
        onOpenChange={(open) => {
          setNoteOpen(open);
          if (!open) {
            setPlatformNote("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add platform onboarding note</DialogTitle>
            <DialogDescription>
              Capture platform-only context for {tenant.name}. These notes stay with the onboarding record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                value={platformNote}
                onChange={(event) => setPlatformNote(event.target.value)}
                rows={5}
                placeholder="Record blockers, AM follow-up, promises made to the school, or intervention context."
              />
            </div>
            {onboardingRecord?.notes?.length ? (
              <div className="space-y-2">
                <Label>Recent notes</Label>
                <ScrollArea className="h-40 rounded-lg border p-3">
                  <div className="space-y-3">
                    {onboardingRecord.notes
                      .slice()
                      .reverse()
                      .map((note: any) => (
                        <div key={note.id} className="text-sm">
                          <p>{note.note}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {note.authorEmail} · {formatDateTime(note.createdAt)}
                          </p>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={savingNote || !platformNote.trim()}>
              <MessageSquareMore className="mr-2 h-4 w-4" />
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
