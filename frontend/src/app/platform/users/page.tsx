"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { UsersNavigationRail } from "@/components/platform/UsersNavigationRail";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformPermissions } from "@/hooks/usePlatformPermissions";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDateTime } from "@/lib/formatters";
import {
  Clock3,
  Pencil,
  RotateCcw,
  Shield,
  Trash2,
  UserCheck,
  Users,
  UserPlus,
  UserX,
} from "lucide-react";
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

function badgeClass(status: string) {
  switch (status) {
    case "active":
    case "accepted":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
    case "suspended":
    case "revoked":
    case "expired":
      return "border-rose-500/20 bg-rose-500/10 text-rose-700";
    default:
      return "border-sky-500/20 bg-sky-500/10 text-sky-700";
  }
}

export default function PlatformUsersPage() {
  const { isLoading, sessionToken } = useAuth();
const { can, isMasterAdmin } = usePlatformPermissions();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inviteBusyId, setInviteBusyId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    role: "super_admin",
    department: "",
    addedPermissions: "",
    removedPermissions: "",
    notes: "",
  });
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<any | null>(null);
  const [activateTarget, setActivateTarget] = useState<any | null>(null);
  const [revokeInviteTarget, setRevokeInviteTarget] = useState<any | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [saving, setSaving] = useState(false);

  const updatePlatformUser = useMutation(api.modules.platform.users.updatePlatformUser);
  const suspendPlatformUser = useMutation(api.modules.platform.users.suspendPlatformUser);
  const activatePlatformUser = useMutation(api.modules.platform.users.activatePlatformUser);
  const deletePlatformUser = useMutation(api.modules.platform.users.deletePlatformUser);
  const resendPlatformInvite = useMutation(api.modules.platform.users.resendPlatformInvite);
  const revokePlatformInvite = useMutation(api.modules.platform.users.revokePlatformInvite);

  const users = usePlatformQuery(
    api.modules.platform.users.getPlatformUsers,
    sessionToken
      ? {
          sessionToken,
          ...(roleFilter !== "all" ? { role: roleFilter } : {}),
          ...(statusFilter !== "all" ? { status: statusFilter } : {}),
          ...(search.trim() ? { search: search.trim() } : {}),
        }
      : "skip",
    !!sessionToken
  ) as Array<any> | undefined;

  const invites = usePlatformQuery(
    api.modules.platform.users.getPlatformInvites,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as Array<any> | undefined;
  const tenantUsers = usePlatformQuery(
    api.platform.users.queries.listAllUsers,
    sessionToken
      ? {
          sessionToken,
          ...(roleFilter !== "all" ? { role: roleFilter } : {}),
          ...(statusFilter !== "all" ? { status: statusFilter } : {}),
          ...(search.trim() ? { search: search.trim() } : {}),
        }
      : "skip",
    !!sessionToken
  ) as Array<any> | undefined;
  const tenantOptions = usePlatformQuery(
    api.platform.users.queries.listTenantFilterOptions,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as Array<any> | undefined;
  const [tenantFilter, setTenantFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("staff");

  const filteredInvites = (invites ?? []).filter((invite) => {
    const matchesSearch =
      search.trim().length === 0 ||
      invite.email.toLowerCase().includes(search.toLowerCase()) ||
      invite.role.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || invite.status === statusFilter;
    const matchesRole = roleFilter === "all" || invite.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const stats = useMemo(
    () => ({
      totalUsers: (users ?? []).length,
      activeUsers: (users ?? []).filter((user) => user.status === "active").length,
      suspendedUsers: (users ?? []).filter((user) => user.status === "suspended").length,
      pendingInvites: (invites ?? []).filter((invite) => invite.status === "pending").length,
      totalTenantUsers: (tenantUsers ?? []).filter((user) => user.tenantId !== "PLATFORM").length,
    }),
    [invites, users, tenantUsers]
  );

  const resolvedTab =
    activeTab === "staff" && stats.totalUsers === 0 && stats.pendingInvites > 0 ? "invites" : activeTab;

  const roleOptions = Array.from(
    new Set([...(users ?? []).map((user) => user.role), ...(invites ?? []).map((invite) => invite.role)])
  ).sort();

  if (isLoading || users === undefined || invites === undefined || tenantUsers === undefined || tenantOptions === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

const canManageUsers = can("platform_users.edit_role") || can("platform_users.edit_permissions");
  const canInviteUsers = can("platform_users.invite");
  const canSuspendUsers = can("platform_users.suspend");
  const canDeleteUsers = can("platform_users.delete") || isMasterAdmin;

  const resetActionState = () => {
    setDeleteTarget(null);
    setSuspendTarget(null);
    setActivateTarget(null);
    setRevokeInviteTarget(null);
    setActionReason("");
  };

  const openEditDialog = (user: any) => {
    setEditingUser(user);
    setEditForm({
      role: user.role,
      department: user.department ?? "",
      addedPermissions: (user.addedPermissions ?? []).join(", "),
      removedPermissions: (user.removedPermissions ?? []).join(", "),
      notes: user.notes ?? "",
    });
  };

  const handleSaveUser = async () => {
    if (!sessionToken || !editingUser) return;

    setSaving(true);
    try {
      await updatePlatformUser({
        sessionToken,
        platformUserId: editingUser.id as any,
        role: editForm.role,
        department: editForm.department.trim() || undefined,
        notes: editForm.notes.trim() || undefined,
        addedPermissions: editForm.addedPermissions
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        removedPermissions: editForm.removedPermissions
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      toast.success("Platform user updated");
      setEditingUser(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update platform user");
    } finally {
      setSaving(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!sessionToken || !suspendTarget) return;
    setSaving(true);
    try {
      await suspendPlatformUser({
        sessionToken,
        platformUserId: suspendTarget.id as any,
        reason: actionReason.trim() || undefined,
      });
      toast.success("Platform user suspended");
      resetActionState();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to suspend platform user");
    } finally {
      setSaving(false);
    }
  };

  const handleActivateUser = async () => {
    if (!sessionToken || !activateTarget) return;
    setSaving(true);
    try {
      await activatePlatformUser({
        sessionToken,
        platformUserId: activateTarget.id as any,
      });
      toast.success("Platform user reactivated");
      resetActionState();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reactivate platform user");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!sessionToken || !deleteTarget) return;
    setSaving(true);
    try {
      await deletePlatformUser({
        sessionToken,
        platformUserId: deleteTarget.id as any,
        reason: actionReason.trim() || undefined,
      });
      toast.success("Platform user deleted");
      resetActionState();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete platform user");
    } finally {
      setSaving(false);
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    if (!sessionToken) return;
    setInviteBusyId(inviteId);
    try {
      await resendPlatformInvite({ sessionToken, inviteId: inviteId as any });
      toast.success("Invite resent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to resend invite");
    } finally {
      setInviteBusyId(null);
    }
  };

  const handleRevokeInvite = async () => {
    if (!sessionToken || !revokeInviteTarget) return;
    setSaving(true);
    try {
      await revokePlatformInvite({ sessionToken, inviteId: revokeInviteTarget.id as any });
      toast.success("Invite revoked");
      resetActionState();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to revoke invite");
    } finally {
      setSaving(false);
    }
  };

  const filteredTenantUsers = (tenantUsers ?? []).filter((user) => {
    if (tenantFilter !== "all" && user.tenantId !== tenantFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Users"
        description="Manage platform staff, access roles, and pending invitations from the platform user registry."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Users" },
        ]}
      />

      <UsersAdminRail />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by email, user ID, department, or role"
          className="max-w-sm"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {roleOptions.map((role) => (
              <SelectItem key={role} value={role}>
                {formatRoleLabel(role)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending">Pending Invite</SelectItem>
            <SelectItem value="accepted">Accepted Invite</SelectItem>
            <SelectItem value="revoked">Revoked Invite</SelectItem>
            <SelectItem value="expired">Expired Invite</SelectItem>
          </SelectContent>
        </Select>
        {canInviteUsers ? (
          <Button asChild>
            <Link href="/platform/users/invite">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Staff
            </Link>
          </Button>
        ) : (
          <Button disabled>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Staff
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Platform staff</p>
            <p className="text-3xl font-semibold">{stats.totalUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-3xl font-semibold">{stats.activeUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Suspended</p>
            <p className="text-3xl font-semibold">{stats.suspendedUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending invites</p>
            <p className="text-3xl font-semibold">{stats.pendingInvites}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={resolvedTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="h-auto w-full justify-start rounded-xl border bg-muted/30 p-1">
          <TabsTrigger value="staff">Platform Staff</TabsTrigger>
          <TabsTrigger value="tenant-users">Tenant Users</TabsTrigger>
          <TabsTrigger value="invites">Invites</TabsTrigger>
        </TabsList>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>Platform Staff Registry</CardTitle>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <EmptyState
                  icon={Shield}
                  title="No platform users yet"
                  description="Invited and accepted platform staff will appear here once the first access grants are created."
                  action={
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <Button asChild>
                        <Link href="/platform/users/invite">Invite first staff member</Link>
                      </Button>
                      {stats.pendingInvites > 0 ? (
                        <Button variant="outline" onClick={() => setActiveTab("invites")}>
                          Review pending invites
                        </Button>
                      ) : null}
                    </div>
                  }
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Access Expires</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <Link href={`/platform/users/${user.id}`} className="font-medium hover:underline">
                              {user.firstName || user.lastName
                                ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                                : user.email}
                            </Link>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatRoleLabel(user.role)}</TableCell>
                        <TableCell>{user.department ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badgeClass(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.accessExpiresAt ? formatDateTime(user.accessExpiresAt) : "No expiry"}</TableCell>
                        <TableCell>{formatDateTime(user.updatedAt)}</TableCell>
                        <TableCell className="w-[280px]">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(user)} disabled={!canManageUsers}>
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </Button>
                            {user.status === "active" ? (
                              <Button variant="outline" size="sm" onClick={() => setSuspendTarget(user)} disabled={!canSuspendUsers}>
                                <UserX className="mr-2 h-3.5 w-3.5" />
                                Suspend
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => setActivateTarget(user)} disabled={!canSuspendUsers}>
                                <UserCheck className="mr-2 h-3.5 w-3.5" />
                                Activate
                              </Button>
                            )}
                            <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(user)} disabled={!canDeleteUsers}>
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </Button>
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

        <TabsContent value="tenant-users">
          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Tenant Users</CardTitle>
              </div>
              <Select value={tenantFilter} onValueChange={setTenantFilter}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="Filter by tenant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tenants</SelectItem>
                  {tenantOptions.map((tenant) => (
                    <SelectItem key={tenant.tenantId} value={tenant.tenantId}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {filteredTenantUsers.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No tenant users match these filters"
                  description="Tenant user records across all schools will appear here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenantUsers.map((user) => (
                      <TableRow key={String(user._id)}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">
                              {user.firstName || user.lastName
                                ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                                : user.email}
                            </p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{user.tenantId}</TableCell>
                        <TableCell>{formatRoleLabel(user.role)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badgeClass(user.isActive ? "active" : "suspended")}>
                            {user.isActive ? "active" : "inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites">
          <Card>
            <CardHeader>
              <CardTitle>Platform Staff Invites</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredInvites.length === 0 ? (
                <EmptyState
                  icon={Clock3}
                  title="No invites match these filters"
                  description="Pending, accepted, revoked, or expired invites will appear here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invited By</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell>{invite.email}</TableCell>
                        <TableCell>{formatRoleLabel(invite.role)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badgeClass(invite.status)}>
                            {invite.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{invite.inviterEmail}</TableCell>
                        <TableCell>{formatDateTime(invite.createdAt)}</TableCell>
                        <TableCell>{formatDateTime(invite.expiresAt)}</TableCell>
                        <TableCell className="w-[240px]">
                          <div className="flex flex-wrap justify-end gap-2">
                            {invite.status === "pending" ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={inviteBusyId === invite.id || !canInviteUsers}
                                  onClick={() => handleResendInvite(invite.id)}
                                >
                                  <RotateCcw className="mr-2 h-3.5 w-3.5" />
                                  Resend
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => setRevokeInviteTarget(invite)} disabled={!canInviteUsers}>
                                  Revoke
                                </Button>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">No actions</span>
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
      </Tabs>

      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Platform User</DialogTitle>
            <DialogDescription>
              Update role assignment, department, notes, and permission overrides.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(value) => setEditForm((current) => ({ ...current, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {formatRoleLabel(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <Input
                value={editForm.department}
                onChange={(event) => setEditForm((current) => ({ ...current, department: event.target.value }))}
                placeholder="Operations"
              />
            </div>

            <div className="space-y-2">
              <Label>Added Permissions</Label>
              <Textarea
                rows={3}
                value={editForm.addedPermissions}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, addedPermissions: event.target.value }))
                }
                placeholder="billing:write, tenants:delete"
              />
            </div>

            <div className="space-y-2">
              <Label>Removed Permissions</Label>
              <Textarea
                rows={3}
                value={editForm.removedPermissions}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, removedPermissions: event.target.value }))
                }
                placeholder="payments:config"
              />
            </div>

            <div className="space-y-2">
              <Label>Internal Notes</Label>
              <Textarea
                rows={3}
                value={editForm.notes}
                onChange={(event) => setEditForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Optional internal note"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={saving}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(suspendTarget)} onOpenChange={(open) => !open && resetActionState()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Platform User</DialogTitle>
            <DialogDescription>
              This will immediately block the user from platform access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              rows={3}
              value={actionReason}
              onChange={(event) => setActionReason(event.target.value)}
              placeholder="Why is this account being suspended?"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetActionState} disabled={saving}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSuspendUser} disabled={saving}>
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(activateTarget)}
        onOpenChange={(open) => !open && resetActionState()}
        title="Reactivate platform user?"
        description="This restores access to the platform for this staff account."
        confirmLabel="Reactivate"
        onConfirm={handleActivateUser}
        isLoading={saving}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && resetActionState()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Platform User</DialogTitle>
            <DialogDescription>
              This permanently removes the platform staff record. Use only when access should not be restored.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              rows={3}
              value={actionReason}
              onChange={(event) => setActionReason(event.target.value)}
              placeholder="Why is this account being deleted?"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetActionState} disabled={saving}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={saving}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(revokeInviteTarget)}
        onOpenChange={(open) => !open && resetActionState()}
        title="Revoke platform invite?"
        description="This stops the invite link from being used again."
        confirmLabel="Revoke Invite"
        variant="destructive"
        onConfirm={handleRevokeInvite}
        isLoading={saving}
      />
    </div>
  );
}
