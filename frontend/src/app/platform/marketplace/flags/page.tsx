"use client";

import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDateTime } from "@/lib/formatters";
import { AlertTriangle, CheckCircle2, Flag, SearchX } from "lucide-react";

const FLAG_STATUSES = [
  "all",
  "flagged",
  "under_investigation",
  "resolved_no_action",
  "resolved_warning",
  "resolved_suspended",
  "resolved_banned",
] as const;

const RESOLUTION_OPTIONS = [
  "resolved_no_action",
  "resolved_warning",
  "resolved_suspended",
  "resolved_banned",
] as const;

function badgeClass(status: string) {
  switch (status) {
    case "flagged":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700";
    case "under_investigation":
      return "border-sky-500/20 bg-sky-500/10 text-sky-700";
    case "resolved_warning":
      return "border-orange-500/20 bg-orange-500/10 text-orange-700";
    case "resolved_suspended":
    case "resolved_banned":
      return "border-rose-500/20 bg-rose-500/10 text-rose-700";
    default:
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
  }
}

function formatReason(reason: string) {
  return reason.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function MarketplaceFlagsPage() {
  const { sessionToken, isLoading } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<(typeof FLAG_STATUSES)[number]>("all");
  const [investigateTarget, setInvestigateTarget] = useState<any>(null);
  const [resolveTarget, setResolveTarget] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [resolution, setResolution] = useState<(typeof RESOLUTION_OPTIONS)[number]>("resolved_no_action");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const flags = usePlatformQuery(
    api.modules.marketplace.flags.getFlags,
    sessionToken
      ? {
          sessionToken,
          ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        }
      : "skip",
    !!sessionToken
  ) as Array<any> | undefined;

  const investigateFlag = useMutation(api.modules.marketplace.flags.investigateFlag);
  const resolveFlag = useMutation(api.modules.marketplace.flags.resolveFlag);

  const stats = useMemo(() => {
    const rows = flags ?? [];
    return {
      total: rows.length,
      new: rows.filter((flag) => flag.status === "flagged").length,
      investigating: rows.filter((flag) => flag.status === "under_investigation").length,
      resolved: rows.filter((flag) => flag.status.startsWith("resolved_")).length,
    };
  }, [flags]);

  if (isLoading || flags === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const handleInvestigate = async () => {
    if (!sessionToken || !investigateTarget) return;
    setSaving(true);
    try {
      await investigateFlag({
        sessionToken,
        flagId: investigateTarget._id,
        adminNotes: adminNotes || undefined,
      });
      toast({
        title: "Flag moved to investigation",
        description: "The moderation workflow has been updated.",
      });
      setInvestigateTarget(null);
      setAdminNotes("");
    } catch (error) {
      toast({
        title: "Unable to update flag",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async () => {
    if (!sessionToken || !resolveTarget || !resolutionNotes.trim()) return;
    setSaving(true);
    try {
      await resolveFlag({
        sessionToken,
        flagId: resolveTarget._id,
        status: resolution,
        resolution: resolutionNotes.trim(),
        adminNotes: adminNotes || undefined,
      });
      toast({
        title: "Flag resolved",
        description: "The resolution has been recorded.",
      });
      setResolveTarget(null);
      setAdminNotes("");
      setResolutionNotes("");
      setResolution("resolved_no_action");
    } catch (error) {
      toast({
        title: "Unable to resolve flag",
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
        title="Marketplace Flags"
        description="Investigate reported marketplace modules, record moderation notes, and apply resolution outcomes."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
          { label: "Flags" },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total flags</p>
            <p className="text-3xl font-semibold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">New reports</p>
            <p className="text-3xl font-semibold">{stats.new}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Under investigation</p>
            <p className="text-3xl font-semibold">{stats.investigating}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Resolved</p>
            <p className="text-3xl font-semibold">{stats.resolved}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as (typeof FLAG_STATUSES)[number])}>
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-xl border bg-muted/30 p-1">
          {FLAG_STATUSES.map((status) => (
            <TabsTrigger key={status} value={status}>
              {status === "all" ? "All" : formatReason(status)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={statusFilter} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Flag Queue</CardTitle>
            </CardHeader>
            <CardContent>
              {flags.length === 0 ? (
                <EmptyState
                  icon={statusFilter === "all" ? SearchX : CheckCircle2}
                  title={statusFilter === "all" ? "No module flags yet" : `No ${formatReason(statusFilter)} flags`}
                  description="Reported marketplace issues will appear here for moderation once tenants submit them."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[220px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flags.map((flag) => (
                      <TableRow key={String(flag._id)}>
                        <TableCell className="font-medium">{flag.moduleId}</TableCell>
                        <TableCell>{flag.tenantId}</TableCell>
                        <TableCell>{formatReason(flag.reason)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badgeClass(flag.status)}>
                            {formatReason(flag.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{flag.adminNotes || flag.resolution || "—"}</TableCell>
                        <TableCell>{formatDateTime(flag.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {flag.status === "flagged" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setInvestigateTarget(flag);
                                  setAdminNotes(flag.adminNotes || "");
                                }}
                              >
                                <AlertTriangle className="mr-1 h-4 w-4" />
                                Investigate
                              </Button>
                            ) : null}
                            {flag.status === "flagged" || flag.status === "under_investigation" ? (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setResolveTarget(flag);
                                  setAdminNotes(flag.adminNotes || "");
                                  setResolutionNotes(flag.resolution || "");
                                }}
                              >
                                <Flag className="mr-1 h-4 w-4" />
                                Resolve
                              </Button>
                            ) : null}
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
      </Tabs>

      <Dialog open={!!investigateTarget} onOpenChange={(open) => !open && setInvestigateTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Investigate Module Flag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p><span className="font-medium">Module:</span> {investigateTarget?.moduleId}</p>
              <p><span className="font-medium">Tenant:</span> {investigateTarget?.tenantId}</p>
              <p><span className="font-medium">Reason:</span> {investigateTarget ? formatReason(investigateTarget.reason) : "—"}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="investigation-notes">Admin notes</Label>
              <Textarea
                id="investigation-notes"
                value={adminNotes}
                onChange={(event) => setAdminNotes(event.target.value)}
                rows={4}
                placeholder="Capture investigation steps, evidence, or follow-up actions"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvestigateTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleInvestigate} disabled={saving}>
              Move to Investigation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resolveTarget} onOpenChange={(open) => !open && setResolveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Module Flag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Resolution outcome</Label>
              <Select value={resolution} onValueChange={(value) => setResolution(value as (typeof RESOLUTION_OPTIONS)[number])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOLUTION_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {formatReason(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resolution-notes">Resolution summary</Label>
              <Textarea
                id="resolution-notes"
                value={resolutionNotes}
                onChange={(event) => setResolutionNotes(event.target.value)}
                rows={4}
                placeholder="Describe the final outcome and any enforcement taken"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-resolution-notes">Internal admin notes</Label>
              <Textarea
                id="admin-resolution-notes"
                value={adminNotes}
                onChange={(event) => setAdminNotes(event.target.value)}
                rows={3}
                placeholder="Optional internal notes for the moderation team"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={saving || !resolutionNotes.trim()}>
              Save Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
