"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { UsersAdminRail } from "@/components/platform/UsersAdminRail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformPermissions } from "@/hooks/usePlatformPermissions";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDateTime } from "@/lib/formatters";
import { ArrowLeft, Clock3, KeyRound, Shield, Trash2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

const PLATFORM_ROLES = [
  "master_admin",
  "super_admin",
  "platform_manager",
  "support_agent",
  "billing_admin",
  "marketplace_reviewer",
  "content_moderator",
  "analytics_viewer",
];

function formatRoleLabel(role: string) {
  return role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusBadgeClass(status: string) {
  return status === "active"
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
    : "border-rose-500/20 bg-rose-500/10 text-rose-700";
}

export default function PlatformUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading, sessionToken } = useAuth();
  const { can, isMasterAdmin } = usePlatformPermissions();
  const userId = params.userId as string;

  const user = usePlatformQuery(
    api.modules.platform.rbac.getPlatformUser,
    sessionToken ? { sessionToken, platformUserId: userId as any } : "skip",
    !!sessionToken
  ) as any;

  const auditLogs = usePlatformQuery(
    api.platform.audit.queries.listAuditLogs,
    sessionToken && user?.userId ? { sessionToken, userId: user.userId, limit: 50 } : "skip",
    !!sessionToken && !!user?.userId
  ) as Array<any> | undefined;

  const updateRole = useMutation(api.modules.platform.rbac.updateUserRole);
  const updatePermissions = useMutation(api.modules.platform.rbac.updateUserPermissions);
  const updateScope = useMutation(api.modules.platform.rbac.updateUserScope);
  const setAccessExpiry = useMutation(api.modules.platform.rbac.setAccessExpiry);
  const suspendUser = useMutation(api.modules.platform.rbac.suspendPlatformUser);
  const activateUser = useMutation(api.modules.platform.rbac.unsuspendPlatformUser);
  const deleteUser = useMutation(api.modules.platform.rbac.deletePlatformUser);
  const revokeSessions = useMutation(api.modules.platform.rbac.revokePlatformUserSessions);

  const [role, setRole] = useState("super_admin");
  const [addedPermissions, setAddedPermissions] = useState("");
  const [removedPermissions, setRemovedPermissions] = useState("");
  const [scopeCountries, setScopeCountries] = useState("");
  const [scopeTenantIds, setScopeTenantIds] = useState("");
  const [scopePlans, setScopePlans] = useState("");
  const [accessExpiresAt, setAccessExpiresAt] = useState("");
  const [reason, setReason] = useState("");
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (!user) return;
    setRole(user.role);
    setAddedPermissions((user.addedPermissions ?? []).join(", "));
    setRemovedPermissions((user.removedPermissions ?? []).join(", "));
    setScopeCountries((user.scopeCountries ?? []).join(", "));
    setScopeTenantIds((user.scopeTenantIds ?? []).join(", "));
    setScopePlans((user.scopePlans ?? []).join(", "));
    setAccessExpiresAt(
      user.accessExpiresAt ? new Date(user.accessExpiresAt).toISOString().slice(0, 16) : ""
    );
  }, [user]);

  const permissionAudit = useMemo(() => user?.permissionAudit ?? [], [user]);
  const sessions = useMemo(() => user?.sessions ?? [], [user]);

  if (isLoading || user === undefined || auditLogs === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const canManageUsers = can("platform_users.edit_role") || can("platform_users.edit_permissions");
  const canSuspendUsers = can("platform_users.suspend") || isMasterAdmin;
  const canDeleteUsers = can("platform_users.delete") || isMasterAdmin;

  if (!user) {
    return (
      <EmptyState
        icon={Shield}
        title="Platform user not found"
        description="The requested platform user could not be loaded."
        action={
          <Button asChild>
            <Link href="/platform/users">Back to users</Link>
          </Button>
        }
      />
    );
  }

  const parseCsv = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const handleSavePermissions = async () => {
    if (!sessionToken) return;
    setSaving(true);
    try {
      await updateRole({
        sessionToken,
        targetUserId: userId as any,
        newRole: role,
        reason: reason.trim() || "Role updated from detail page",
      });
      await updatePermissions({
        sessionToken,
        targetUserId: userId as any,
        addedPermissions: parseCsv(addedPermissions),
        removedPermissions: parseCsv(removedPermissions),
        reason: reason.trim() || "Permission overrides updated from detail page",
      });
      await updateScope({
        sessionToken,
        targetUserId: userId as any,
        scopeCountries: parseCsv(scopeCountries),
        scopeTenantIds: parseCsv(scopeTenantIds),
        scopePlans: parseCsv(scopePlans),
        reason: reason.trim() || "Scope updated from detail page",
      });
      await setAccessExpiry({
        sessionToken,
        targetUserId: userId as any,
        accessExpiresAt: accessExpiresAt ? new Date(accessExpiresAt).getTime() : undefined,
        reason: reason.trim() || "Access expiry updated from detail page",
      });
      toast.success("Platform user access updated");
      setReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async () => {
    if (!sessionToken) return;
    setSaving(true);
    try {
      await suspendUser({
        sessionToken,
        targetUserId: userId as any,
        reason: reason.trim() || "Suspended from detail page",
      });
      toast.success("Platform user suspended");
      setShowSuspendDialog(false);
      setReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to suspend user");
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!sessionToken) return;
    setSaving(true);
    try {
      await activateUser({
        sessionToken,
        targetUserId: userId as any,
        reason: reason.trim() || "Unsuspended from detail page",
      });
      toast.success("Platform user reactivated");
      setReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reactivate user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!sessionToken) return;
    setSaving(true);
    try {
      await deleteUser({
        sessionToken,
        targetUserId: userId as any,
        reason: reason.trim() || "Deleted from detail page",
      });
      toast.success("Platform user deleted");
      router.push("/platform/users");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete user");
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId?: string) => {
    if (!sessionToken) return;
    try {
      await revokeSessions({
        sessionToken,
        targetUserId: userId as any,
        sessionId,
      });
      toast.success(sessionId ? "Session revoked" : "All sessions revoked");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to revoke session");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          user.firstName || user.lastName
            ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
            : user.email
        }
        description="Review platform profile, effective permissions, active sessions, and recent audit activity."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Users", href: "/platform/users" },
          { label: user.email },
        ]}
      />

      <UsersAdminRail />

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={() => router.push("/platform/users")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Badge variant="outline" className={statusBadgeClass(user.status)}>
          {user.status}
        </Badge>
        <Badge variant="secondary">{formatRoleLabel(user.role)}</Badge>
        {user.status === "active" ? (
          <Button
            variant="destructive"
            onClick={() => setShowSuspendDialog(true)}
            disabled={saving || !canSuspendUsers}
          >
            <UserX className="mr-2 h-4 w-4" />
            Suspend
          </Button>
        ) : (
          <Button variant="outline" onClick={handleActivate} disabled={saving || !canSuspendUsers}>
            <UserCheck className="mr-2 h-4 w-4" />
            Unsuspend
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => handleRevokeSession(undefined)}
          disabled={!canSuspendUsers}
        >
          <KeyRound className="mr-2 h-4 w-4" />
          Revoke All Sessions
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowDeleteDialog(true)}
          disabled={saving || !canDeleteUsers}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="h-auto w-full flex-wrap justify-start rounded-2xl border border-border/70 bg-muted/30 p-1">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Email</Label>
                <p className="mt-1 font-medium">{user.email}</p>
              </div>
              <div>
                <Label>User ID</Label>
                <p className="mt-1 font-medium">{user.userId}</p>
              </div>
              <div>
                <Label>Department</Label>
                <p className="mt-1 font-medium">{user.department ?? "—"}</p>
              </div>
              <div>
                <Label>Job title</Label>
                <p className="mt-1 font-medium">{user.jobTitle ?? "—"}</p>
              </div>
              <div>
                <Label>Last login</Label>
                <p className="mt-1 font-medium">
                  {user.lastLogin ? formatDateTime(user.lastLogin) : "No login yet"}
                </p>
              </div>
              <div>
                <Label>Member since</Label>
                <p className="mt-1 font-medium">{formatDateTime(user.createdAt)}</p>
              </div>
              <div>
                <Label>Accepted at</Label>
                <p className="mt-1 font-medium">
                  {user.acceptedAt ? formatDateTime(user.acceptedAt) : "Invite pending"}
                </p>
              </div>
              <div>
                <Label>Two-factor</Label>
                <p className="mt-1 font-medium">
                  {user.twoFactorEnabled ? "Enabled" : "Not enabled"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Role, Scope, and Permission Overrides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORM_ROLES.map((platformRole) => (
                        <SelectItem key={platformRole} value={platformRole}>
                          {formatRoleLabel(platformRole)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Access expires</Label>
                  <Input
                    type="datetime-local"
                    value={accessExpiresAt}
                    onChange={(event) => setAccessExpiresAt(event.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Added permissions</Label>
                  <Textarea
                    rows={4}
                    value={addedPermissions}
                    onChange={(event) => setAddedPermissions(event.target.value)}
                    placeholder="crm.view_all, pm.view_all"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Removed permissions</Label>
                  <Textarea
                    rows={4}
                    value={removedPermissions}
                    onChange={(event) => setRemovedPermissions(event.target.value)}
                    placeholder="platform_users.delete"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Scope countries</Label>
                  <Textarea
                    rows={3}
                    value={scopeCountries}
                    onChange={(event) => setScopeCountries(event.target.value)}
                    placeholder="KE, UG"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Scope tenant IDs</Label>
                  <Textarea
                    rows={3}
                    value={scopeTenantIds}
                    onChange={(event) => setScopeTenantIds(event.target.value)}
                    placeholder="TENANT-123, TENANT-456"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Scope plans</Label>
                  <Textarea
                    rows={3}
                    value={scopePlans}
                    onChange={(event) => setScopePlans(event.target.value)}
                    placeholder="starter, pro"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  rows={3}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Why are these access changes being made?"
                />
              </div>

              <Button onClick={handleSavePermissions} disabled={saving || !canManageUsers}>
                Save Access Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sessions</CardTitle>
              <Button variant="outline" onClick={() => handleRevokeSession(undefined)}>
                Revoke All
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {sessions.length === 0 ? (
                <EmptyState
                  icon={Clock3}
                  title="No tracked sessions"
                  description="When this user signs in, their active platform sessions will appear here."
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6">Device</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Last active</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="pr-6 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((session: any) => (
                        <TableRow key={session._id}>
                          <TableCell className="pl-6">
                            <div className="space-y-1">
                              <p className="font-medium">
                                {session.deviceLabel ?? "Unknown device"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {session.ipAddress ?? "No IP recorded"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {session.location ?? session.countryCode ?? "Unknown"}
                          </TableCell>
                          <TableCell>{formatDateTime(session.lastActiveAt)}</TableCell>
                          <TableCell>
                            {session.expiresAt
                              ? formatDateTime(session.expiresAt)
                              : "Session policy"}
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRevokeSession(session.sessionId)}
                            >
                              Kill Session
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Permission Audit Log</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {permissionAudit.length === 0 ? (
                  <EmptyState
                    icon={Shield}
                    title="No permission changes yet"
                    description="Role and permission changes for this user will appear here."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-6">Change</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead className="pr-6">When</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {permissionAudit.map((entry: any) => (
                          <TableRow key={entry._id}>
                            <TableCell className="pl-6">
                              {entry.changeSummary ?? entry.changeType}
                            </TableCell>
                            <TableCell>{entry.reason}</TableCell>
                            <TableCell className="pr-6">
                              {formatDateTime(entry.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {auditLogs.length === 0 ? (
                  <EmptyState
                    icon={Shield}
                    title="No audit activity"
                    description="Platform audit events for this user will appear here."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-6">Action</TableHead>
                          <TableHead>Tenant</TableHead>
                          <TableHead className="pr-6">When</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.map((log) => (
                          <TableRow key={String(log._id)}>
                            <TableCell className="pl-6">{log.action}</TableCell>
                            <TableCell>{log.tenantName}</TableCell>
                            <TableCell className="pr-6">{formatDateTime(log.timestamp)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={showSuspendDialog}
        onOpenChange={(open) => {
          setShowSuspendDialog(open);
          if (!open) setReason("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Platform User</DialogTitle>
            <DialogDescription>
              This immediately blocks platform access and revokes active sessions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Why is this account being suspended?"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={saving}>
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) setReason("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Platform User</DialogTitle>
            <DialogDescription>
              This performs a soft delete, scrambles identity fields, and removes platform access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Why is this account being deleted?"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
