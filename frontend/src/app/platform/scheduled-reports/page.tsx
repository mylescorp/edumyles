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
import { Switch } from "@/components/ui/switch";
import { useMutation } from "convex/react";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useAuth } from "@/hooks/useAuth";
import { api } from "../../../../../convex/_generated/api";
import {
  Clock,
  Plus,
  Play,
  Pause,
  Trash2,
  Mail,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart3,
} from "lucide-react";

export default function ScheduledReportsPage() {
  const { sessionToken } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [reportType, setReportType] = useState("");
  const [schedule, setSchedule] = useState("weekly");
  const [format, setFormat] = useState("csv");
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

  const handleCreate = async () => {
    if (!sessionToken || !name || !reportType) return;
    try {
      await createReport({
        sessionToken,
        name,
        reportType,
        schedule,
        format,
        recipients: recipients.split(",").map((r) => r.trim()).filter(Boolean),
      });
      setIsCreateOpen(false);
      setName("");
      setReportType("");
      setSchedule("weekly");
      setFormat("csv");
      setRecipients("");
    } catch (error) {
      console.error("Failed to create report:", error);
    }
  };

  if (!reports) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Scheduled Reports"
        description="Automate recurring reports delivered to your inbox"
        action={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Report Schedule
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{reports.length}</p>
                <p className="text-sm text-muted-foreground">Total Schedules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Play className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{reports.filter((r: any) => r.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {reports.reduce((sum: number, r: any) => sum + (r.recipients?.length || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Recipients</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No scheduled reports yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report: any) => (
                <div key={report._id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{report.name}</p>
                        <Badge variant={report.isActive ? "default" : "secondary"}>
                          {report.isActive ? "Active" : "Paused"}
                        </Badge>
                        <Badge variant="outline">{report.schedule}</Badge>
                        <Badge variant="outline">{report.format?.toUpperCase()}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="capitalize">Type: {report.reportType?.replace(/_/g, " ")}</span>
                        {report.lastRun && (
                          <span>Last run: {new Date(report.lastRun).toLocaleString()}</span>
                        )}
                        {report.nextRun && (
                          <span>Next: {new Date(report.nextRun).toLocaleString()}</span>
                        )}
                        {report.recipients?.length > 0 && (
                          <span><Mail className="h-3 w-3 inline mr-1" />{report.recipients.length} recipients</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!sessionToken) return;
                          try { await runNow({ sessionToken, reportId: report._id }); } catch {}
                        }}
                      >
                        <Play className="h-4 w-4 mr-1" /> Run Now
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!sessionToken) return;
                          try { await toggleActive({ sessionToken, reportId: report._id }); } catch {}
                        }}
                      >
                        {report.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (!sessionToken) return;
                          await deleteReport({ sessionToken, reportId: report._id });
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
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
            <DialogTitle>Create Scheduled Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Report Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Weekly Tenant Summary" />
            </div>
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user_analytics">User Analytics</SelectItem>
                  <SelectItem value="ticket_analytics">Ticket Analytics</SelectItem>
                  <SelectItem value="tenant_analytics">Tenant Analytics</SelectItem>
                  <SelectItem value="billing_summary">Billing Summary</SelectItem>
                  <SelectItem value="system_health">System Health</SelectItem>
                  <SelectItem value="security_audit">Security Audit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Schedule</Label>
                <Select value={schedule} onValueChange={setSchedule}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Recipients (comma-separated emails)</Label>
              <Input value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="admin@school.com, manager@school.com" />
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!name || !reportType}>
              Create Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
