"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  CreditCard,
  ExternalLink,
  FileText,
  Flag,
  Mail,
  Package,
  Settings,
  Shield,
  Ticket,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";

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

  const tenantDetail = usePlatformQuery(
    api.platform.tenants.queries.getTenantDetailBundle,
    { sessionToken: sessionToken || "", tenantId }
  );
  const dependencySummary = usePlatformQuery(
    api.platform.tenants.queries.getTenantDependencySummary,
    { sessionToken: sessionToken || "", tenantId }
  );

  const archiveTenant = useMutation(api.platform.tenants.mutations.archiveTenant);
  const deleteTenant = useMutation(api.platform.tenants.mutations.deleteTenant);

  if (isLoading || tenantDetail === undefined || dependencySummary === undefined) {
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
    overview,
    users,
    pendingInvites,
    modules,
    pilotGrants,
    finance,
    communications,
    auditLogs,
    settings,
  } = tenantDetail;

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
                  { label: "Admin Email", value: tenant.email },
                  { label: "Admin Phone", value: tenant.phone ? formatPhone(tenant.phone) : "—" },
                  { label: "County / Region", value: tenant.county },
                  { label: "Country", value: tenant.country },
                  { label: "Created", value: formatDateTime(tenant.createdAt) },
                  { label: "Updated", value: formatDateTime(tenant.updatedAt) },
                  { label: "Organization", value: organization?.name ?? "Pending WorkOS org sync" },
                ]}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Current Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <InfoGrid
                  items={[
                    { label: "Students", value: usage?.studentCount ?? 0 },
                    { label: "Staff", value: usage?.staffCount ?? 0 },
                    { label: "Storage", value: `${usage?.storageUsedGb ?? 0} GB` },
                    { label: "Recorded At", value: usage?.recordedAt ? formatDateTime(usage.recordedAt) : "No usage snapshot yet" },
                  ]}
                />
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
                  ]}
                />
              </CardContent>
            </Card>
          </div>
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
                    { label: "Current Period Start", value: formatDate(subscription.currentPeriodStart) },
                    { label: "Current Period End", value: formatDate(subscription.currentPeriodEnd) },
                    { label: "Trial Ends", value: subscription.trialEndsAt ? formatDate(subscription.trialEndsAt) : "—" },
                    { label: "Payment Provider", value: subscription.paymentProvider ?? "Not set" },
                    { label: "Monthly Price", value: formatKes(subscription.customPriceMonthlyKes ?? subscription.plan?.priceMonthlyKes ?? 0) },
                    { label: "Annual Price", value: formatKes(subscription.customPriceAnnualKes ?? subscription.plan?.priceAnnualKes ?? 0) },
                    { label: "Student Limit", value: subscription.plan?.studentLimit ?? "Unlimited" },
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
    </div>
  );
}
