"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/convex/_generated/api";
import {
  BarChart3,
  Calendar,
  Clock,
  FileText,
  Loader2,
  Mail,
  Pause,
  Play,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { OperationsSuiteRail } from "@/components/platform/OperationsSuiteRail";

type ScheduledReportFormat = "csv" | "excel" | "pdf";
type ScheduledReportFrequency = "daily" | "weekly" | "monthly";
type ScheduledReportType =
  | "user_analytics"
  | "ticket_analytics"
  | "tenant_analytics"
  | "billing_summary"
  | "system_health"
  | "security_audit";

function formatDateTime(timestamp?: number) {
  if (!timestamp) return "Never";
  return new Date(timestamp).toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getReportTypeLabel(reportType: string) {
  return reportType.replace(/_/g, " ");
}

export default function ScheduledReportsPage() {
  const { sessionToken } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all");
  const [creating, setCreating] = useState(false);
  const [actionReportId, setActionReportId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  const [name, setName] = useState("");
  const [reportType, setReportType] = useState<ScheduledReportType | "">("");
  const [schedule, setSchedule] = useState<ScheduledReportFrequency>("weekly");
  const [format, setFormat] = useState<ScheduledReportFormat>("csv");
  const [recipients, setRecipients] = useState("");

  const reports = usePlatformQuery(
    api.platform.scheduledReports.queries.listScheduledReports,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );

  const createReport = useMutation(api.platform.scheduledReports.mutations.createScheduledReport);
  const deleteReport = useMutation(api.platform.scheduledReports.mutations.deleteScheduledReport);
  const toggleActive = useMutation(api.platform.scheduledReports.mutations.toggleActive);
  const runNow = useMutation(api.platform.scheduledReports.mutations.runNow);

  const filteredReports = useMemo(() => {
    const list = reports ?? [];
    const query = search.trim().toLowerCase();
    return list.filter((report: any) => {
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? report.isActive
            : !report.isActive;
      const haystack = [
        report.name,
        report.reportType,
        ...(Array.isArray(report.recipients) ? report.recipients : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = query.length === 0 || haystack.includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [reports, search, statusFilter]);

  const metrics = useMemo(() => {
    const list = reports ?? [];
    return {
      total: list.length,
      active: list.filter((report: any) => report.isActive).length,
      recipients: list.reduce(
        (sum: number, report: any) => sum + (Array.isArray(report.recipients) ? report.recipients.length : 0),
        0
      ),
    };
  }, [reports]);

  const resetCreateForm = () => {
    setName("");
    setReportType("");
    setSchedule("weekly");
    setFormat("csv");
    setRecipients("");
  };

  const handleCreate = async () => {
    if (!sessionToken || !name || !reportType) {
      toast.error("Report name and type are required.");
      return;
    }

    setCreating(true);
    try {
      await createReport({
        sessionToken,
        name,
        reportType,
        schedule,
        format,
        recipients: recipients
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      });
      toast.success("Scheduled report created.");
      setIsCreateOpen(false);
      resetCreateForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create scheduled report.");
    } finally {
      setCreating(false);
    }
  };

  const handleRunNow = async (reportId: string) => {
    if (!sessionToken) return;
    setActionReportId(reportId);
    try {
      await runNow({ sessionToken, reportId });
      toast.success("Report run queued.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to queue report run.");
    } finally {
      setActionReportId(null);
    }
  };

  const handleToggleActive = async (reportId: string) => {
    if (!sessionToken) return;
    setActionReportId(reportId);
    try {
      const result = await toggleActive({ sessionToken, reportId });
      toast.success(result?.isActive ? "Schedule resumed." : "Schedule paused.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update schedule.");
    } finally {
      setActionReportId(null);
    }
  };

  const handleDelete = async () => {
    if (!sessionToken || !deleteTarget || !deleteReason.trim()) {
      toast.error("A reason is required before deleting this schedule.");
      return;
    }

    setActionReportId(deleteTarget._id);
    try {
      await deleteReport({
        sessionToken,
        reportId: deleteTarget._id,
        reason: deleteReason.trim(),
      });
      toast.success("Scheduled report deleted.");
      setDeleteTarget(null);
      setDeleteReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete scheduled report.");
    } finally {
      setActionReportId(null);
    }
  };

  if (!reports) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduled Reports"
        description="Manage recurring report delivery, recipients, and execution status."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Scheduled Reports", href: "/platform/scheduled-reports" },
        ]}
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New schedule
          </Button>
        }
      />

      <OperationsSuiteRail currentHref="/platform/scheduled-reports" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{metrics.total}</p>
                <p className="text-sm text-muted-foreground">Total schedules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Play className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{metrics.active}</p>
                <p className="text-sm text-muted-foreground">Active schedules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{metrics.recipients}</p>
                <p className="text-sm text-muted-foreground">Total recipients</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <CardTitle>Report schedules</CardTitle>
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, type, or recipient"
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All schedules</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title={reports.length === 0 ? "No scheduled reports yet" : "No schedules match these filters"}
              description={
                reports.length === 0
                  ? "Create your first recurring report to automate delivery for platform stakeholders."
                  : "Adjust your search or status filter to find the schedule you need."
              }
              action={
                reports.length === 0 ? (
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create schedule
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report: any) => (
                <div key={report._id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{report.name}</p>
                        <Badge variant={report.isActive ? "default" : "secondary"}>
                          {report.isActive ? "Active" : "Paused"}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {report.schedule}
                        </Badge>
                        <Badge variant="outline">{(report.format || "csv").toUpperCase()}</Badge>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="capitalize">
                          Type: {getReportTypeLabel(report.reportType || "unknown")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Next run: {formatDateTime(report.nextRun)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Last run: {formatDateTime(report.lastRun)}
                        </span>
                      </div>

                      {Array.isArray(report.recipients) && report.recipients.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {report.recipients.map((recipient: string) => (
                            <Badge key={recipient} variant="secondary">
                              {recipient}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No explicit recipients configured for this schedule.
                        </p>
                      )}

                      {report.latestRun ? (
                        <div className="rounded-md border bg-muted/30 p-3 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={report.latestRun.status === "completed" ? "default" : "destructive"}>
                              {report.latestRun.status}
                            </Badge>
                            <span className="text-muted-foreground">
                              Started {formatDateTime(report.latestRun.startedAt)}
                            </span>
                            {report.latestRun.completedAt ? (
                              <span className="text-muted-foreground">
                                Completed {formatDateTime(report.latestRun.completedAt)}
                              </span>
                            ) : null}
                          </div>
                          {report.latestRun.error ? (
                            <p className="mt-2 text-sm text-destructive">{report.latestRun.error}</p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRunNow(report._id)}
                        disabled={actionReportId === report._id}
                      >
                        {actionReportId === report._id ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="mr-1 h-4 w-4" />
                        )}
                        Run now
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(report._id)}
                        disabled={actionReportId === report._id}
                      >
                        {report.isActive ? (
                          <Pause className="mr-1 h-4 w-4" />
                        ) : (
                          <Play className="mr-1 h-4 w-4" />
                        )}
                        {report.isActive ? "Pause" : "Resume"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(report)}>
                        <Trash2 className="mr-1 h-4 w-4 text-destructive" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create scheduled report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="report-name">Report name</Label>
              <Input
                id="report-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Weekly tenant success summary"
              />
            </div>

            <div className="space-y-2">
              <Label>Report type</Label>
              <Select value={reportType} onValueChange={(value) => setReportType(value as ScheduledReportType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user_analytics">User analytics</SelectItem>
                  <SelectItem value="ticket_analytics">Ticket analytics</SelectItem>
                  <SelectItem value="tenant_analytics">Tenant analytics</SelectItem>
                  <SelectItem value="billing_summary">Billing summary</SelectItem>
                  <SelectItem value="system_health">System health</SelectItem>
                  <SelectItem value="security_audit">Security audit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Schedule</Label>
                <Select value={schedule} onValueChange={(value) => setSchedule(value as ScheduledReportFrequency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={format} onValueChange={(value) => setFormat(value as ScheduledReportFormat)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-recipients">Recipients</Label>
              <Input
                id="report-recipients"
                value={recipients}
                onChange={(event) => setRecipients(event.target.value)}
                placeholder="ops@edumyles.com, billing@edumyles.com"
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple email addresses with commas.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating || !name || !reportType}>
                {creating ? "Creating..." : "Create schedule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete scheduled report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              This permanently removes <span className="font-medium text-foreground">{deleteTarget?.name}</span>.
              Enter a reason so the audit trail reflects why this schedule was deleted.
            </p>
            <div className="space-y-2">
              <Label htmlFor="delete-reason">Reason</Label>
              <Textarea
                id="delete-reason"
                value={deleteReason}
                onChange={(event) => setDeleteReason(event.target.value)}
                placeholder="Duplicate schedule replaced by a consolidated monthly report"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={actionReportId === deleteTarget?._id || !deleteReason.trim()}
              >
                {actionReportId === deleteTarget?._id ? "Deleting..." : "Delete schedule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
