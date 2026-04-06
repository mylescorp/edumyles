"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { formatDateTime, formatRelativeTime } from "@/lib/formatters";
import { Clock3, LogIn, Search, Shield, UserCheck } from "lucide-react";

type TenantCandidate = {
  tenantId: string;
  name: string;
  plan: string;
  status: string;
  email: string;
  studentCount: number;
};

type UserCandidate = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  recommended: boolean;
  tenantId: string;
  tenantName: string;
};

type ImpersonationSession = {
  _id: string;
  adminId: string;
  targetUserId: string;
  targetTenantId: string;
  reason: string;
  startedAt: number;
  endedAt?: number;
  active: boolean;
  adminName: string;
  adminEmail: string;
  targetUserName: string;
  targetUserEmail: string;
  tenantName: string;
};

function formatRoleLabel(role: string) {
  return role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getRoleDashboard(role: string): string {
  switch (role) {
    case "master_admin":
    case "super_admin":
      return "/platform";
    case "teacher":
      return "/portal/teacher";
    case "parent":
      return "/portal/parent";
    case "student":
      return "/portal/student";
    case "alumni":
      return "/portal/alumni";
    case "partner":
      return "/portal/partner";
    default:
      return "/admin";
  }
}

export default function ImpersonationPage() {
  const { isLoading, sessionToken } = useAuth();
  const { hasRole } = usePermissions();
  const router = useRouter();
  const { toast } = useToast();
  const isPlatformAdmin = hasRole("master_admin", "super_admin");

  const [search, setSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<TenantCandidate | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserCandidate | null>(null);
  const [reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [endDialog, setEndDialog] = useState<ImpersonationSession | null>(null);

  const candidateResults = usePlatformQuery(
    api.platform.impersonation.queries.searchImpersonationCandidates,
    sessionToken
      ? {
          sessionToken,
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(selectedTenant ? { tenantId: selectedTenant.tenantId } : {}),
        }
      : "skip",
    !!sessionToken && isPlatformAdmin
  ) as { tenants: TenantCandidate[]; users: UserCandidate[] } | undefined;

  const allSessions = usePlatformQuery(
    api.platform.impersonation.queries.listImpersonationSessions,
    sessionToken ? { sessionToken } : "skip",
    isPlatformAdmin && !!sessionToken
  ) as ImpersonationSession[] | undefined;
  const activeSessions = usePlatformQuery(
    api.platform.impersonation.queries.listImpersonationSessions,
    sessionToken ? { sessionToken, activeOnly: true } : "skip",
    isPlatformAdmin && !!sessionToken
  ) as ImpersonationSession[] | undefined;

  const beginImpersonationSession = useMutation(api.platform.impersonation.mutations.beginImpersonationSession);
  const endImpersonation = useMutation(api.platform.impersonation.mutations.endImpersonation);

  const activeSession = useMemo(
    () => (activeSessions ?? []).find((session) => session.active),
    [activeSessions]
  );

  if (isLoading || (isPlatformAdmin && (candidateResults === undefined || allSessions === undefined || activeSessions === undefined))) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!isPlatformAdmin || !sessionToken) {
    return (
      <EmptyState
        icon={Shield}
        title="Impersonation restricted"
        description="Only Master Admins and Super Admins can start or manage impersonation sessions."
      />
    );
  }

  const handleStart = async () => {
    if (!selectedTenant || !selectedUser || reason.trim().length < 20) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await beginImpersonationSession({
        sessionToken,
        targetUserId: selectedUser.id,
        targetTenantId: selectedTenant.tenantId,
        reason: reason.trim(),
      });

      await fetch("/api/impersonation/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          impersonationToken: result.impersonationToken,
          role: result.targetUser.role,
          adminSessionToken: sessionToken,
        }),
      });

      toast({
        title: "Impersonation started",
        description: `You are now browsing as ${result.targetUser.name}.`,
      });

      router.push(getRoleDashboard(result.targetUser.role));
    } catch (error) {
      toast({
        title: "Unable to start impersonation",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnd = async () => {
    if (!endDialog) return;
    setActionLoading(true);
    try {
      await endImpersonation({
        sessionToken,
        targetUserId: endDialog.targetUserId,
      });
      toast({
        title: "Impersonation ended",
        description: `Ended session for ${endDialog.targetUserName}.`,
      });
      setEndDialog(null);
    } catch (error) {
      toast({
        title: "Unable to end session",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Impersonation"
        description="Search for a tenant, choose a non-platform user, and start a time-limited impersonation session with a required reason."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Impersonation" },
        ]}
      />

      {activeSession ? (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="text-sm font-medium text-amber-800">
                Active impersonation: {activeSession.targetUserName} at {activeSession.tenantName}
              </p>
              <p className="text-sm text-amber-700">
                Started {formatRelativeTime(activeSession.startedAt)}. Reason: {activeSession.reason}
              </p>
            </div>
            <Button variant="destructive" onClick={() => setEndDialog(activeSession)}>
              End Impersonation
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Start Impersonation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Step 1: Search tenant or user</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setSelectedTenant(null);
                    setSelectedUser(null);
                  }}
                  className="pl-9"
                  placeholder="Search by school name, email, or user name"
                />
              </div>

              {!selectedTenant ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {(candidateResults?.tenants ?? []).map((tenant) => (
                    <button
                      key={tenant.tenantId}
                      type="button"
                      onClick={() => {
                        setSelectedTenant(tenant);
                        setSelectedUser(null);
                      }}
                      className="rounded-xl border p-4 text-left transition hover:border-primary/40 hover:bg-primary/5"
                    >
                      <p className="font-medium">{tenant.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{tenant.email}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{tenant.plan}</Badge>
                        <Badge variant="outline">{tenant.studentCount} students</Badge>
                        <Badge variant="outline">{tenant.status}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{selectedTenant.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedTenant.email}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedTenant(null);
                        setSelectedUser(null);
                      }}
                    >
                      Change Tenant
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Step 2: Select user</Label>
              {!selectedTenant ? (
                <p className="text-sm text-muted-foreground">Choose a tenant first to load impersonation candidates.</p>
              ) : candidateResults?.users?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidateResults.users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{user.name}</p>
                              {user.recommended ? (
                                <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700">
                                  Recommended
                                </Badge>
                              ) : null}
                            </div>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatRoleLabel(user.role)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={user.isActive ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700" : "border-rose-500/20 bg-rose-500/10 text-rose-700"}>
                            {user.isActive ? "active" : "inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={selectedUser?.id === user.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  icon={UserCheck}
                  title="No eligible users"
                  description="No tenant users match this search, or only protected platform roles were found."
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Step 3: Provide reason</Label>
              <Textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={4}
                placeholder="Why are you impersonating this user? Minimum 20 characters."
              />
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Session expires after 2 hours.</span>
                <span>{reason.trim().length}/20</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleStart}
                disabled={!selectedTenant || !selectedUser || reason.trim().length < 20 || actionLoading}
              >
                <LogIn className="mr-2 h-4 w-4" />
                {actionLoading ? "Starting..." : "Start Impersonation"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Impersonation History</CardTitle>
            </CardHeader>
            <CardContent>
              {(allSessions ?? []).length === 0 ? (
                <EmptyState
                  icon={Clock3}
                  title="No impersonation history"
                  description="Recent sessions will appear here once support or admin browsing starts."
                />
              ) : (
                <div className="space-y-3">
                  {(allSessions ?? []).slice(0, 20).map((session) => (
                    <div key={String(session._id)} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{session.targetUserName}</p>
                          <p className="text-sm text-muted-foreground">
                            by {session.adminName} at {session.tenantName}
                          </p>
                        </div>
                        <Badge variant="outline" className={session.active ? "border-amber-500/20 bg-amber-500/10 text-amber-700" : "border-slate-500/20 bg-slate-500/10 text-slate-700"}>
                          {session.active ? "Active" : "Ended"}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">{session.reason}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>Started {formatDateTime(session.startedAt)}</span>
                        <span>{session.endedAt ? `Ended ${formatDateTime(session.endedAt)}` : "Still active"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={!!endDialog}
        onOpenChange={(open) => !open && setEndDialog(null)}
        title="End impersonation"
        description={`End impersonation for ${endDialog?.targetUserName ?? "this user"}?`}
        confirmLabel="End session"
        variant="destructive"
        onConfirm={handleEnd}
        isLoading={actionLoading}
      />
    </div>
  );
}
