"use client";

import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDateTime } from "@/lib/formatters";
import { ArrowLeft, Shield, Trash2, UserCheck, UserX } from "lucide-react";
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
  return status === "active"
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
    : "border-rose-500/20 bg-rose-500/10 text-rose-700";
}

export default function PlatformUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading, sessionToken } = useAuth();
  const { hasPermission, hasRole } = usePermissions();
  const userId = params.userId as string;

  const user = usePlatformQuery(
    api.modules.platform.users.getPlatformUser,
    sessionToken ? { sessionToken, platformUserId: userId as any } : "skip",
    !!sessionToken
  ) as any;

  const auditLogs = usePlatformQuery(
    api.platform.audit.queries.listAuditLogs,
    sessionToken && user?.userId
      ? { sessionToken, userId: user.userId, limit: 20 }
      : "skip",
    !!sessionToken && !!user?.userId
  ) as Array<any> | undefined;

  const updateRole = useMutation(api.modules.platform.users.updatePlatformUserRole);
  const updatePermissions = useMutation(api.modules.platform.users.updatePlatformUserPermissions);
  const suspendUser = useMutation(api.modules.platform.users.suspendPlatformUser);
  const activateUser = useMutation(api.modules.platform.users.activatePlatformUser);
  const deleteUser = useMutation(api.modules.platform.users.deletePlatformUser);

  const [role, setRole] = useState("super_admin");
  const [addedPermissions, setAddedPermissions] = useState("");
  const [removedPermissions, setRemovedPermissions] = useState("");
  const [reason, setReason] = useState("");
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setRole(user.role);
    setAddedPermissions((user.addedPermissions ?? []).join(", "));
    setRemovedPermissions((user.removedPermissions ?? []).join(", "));
  }, [user]);

  if (isLoading || user === undefined || auditLogs === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const canManageUsers = hasPermission("platform:users:write") || hasRole("master_admin");
  const canSuspendUsers = hasPermission("platform:users:suspend") || hasRole("master_admin", "super_admin");
  const canDeleteUsers = hasPermission("platform:users:delete") || hasRole("master_admin");

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

  const handleSave = async () => {
    if (!sessionToken) return;
    setSaving(true);
    try {
      await updateRole({
        sessionToken,
        platformUserId: userId as any,
        role,
      });
      await updatePermissions({
        sessionToken,
        platformUserId: userId as any,
        addedPermissions: addedPermissions
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        removedPermissions: removedPermissions
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      toast.success("Platform user updated");
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
        platformUserId: userId as any,
        reason: reason.trim() || undefined,
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
        platformUserId: userId as any,
      });
      toast.success("Platform user reactivated");
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
        platformUserId: userId as any,
        reason: reason.trim() || undefined,
      });
      toast.success("Platform user deleted");
      router.push("/platform/users");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.firstName || user.lastName ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : user.email}
        description="Platform staff detail with persisted role assignment and permission overrides."
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
        <Badge variant="outline" className={badgeClass(user.status)}>
          {user.status}
        </Badge>
        {user.status === "active" ? (
          <Button variant="destructive" onClick={() => setShowSuspendDialog(true)} disabled={saving || !canSuspendUsers}>
            <UserX className="mr-2 h-4 w-4" />
            Suspend User
          </Button>
        ) : (
          <Button variant="outline" onClick={handleActivate} disabled={saving || !canSuspendUsers}>
            <UserCheck className="mr-2 h-4 w-4" />
            Reactivate User
          </Button>
        )}
        <Button variant="outline" onClick={() => setShowDeleteDialog(true)} disabled={saving || !canDeleteUsers}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete User
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>
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
                <Label>Last Login</Label>
                <p className="mt-1 font-medium">{user.lastLogin ? formatDateTime(user.lastLogin) : "No login yet"}</p>
              </div>
              <div>
                <Label>Accepted At</Label>
                <p className="mt-1 font-medium">{user.acceptedAt ? formatDateTime(user.acceptedAt) : "Invite not accepted yet"}</p>
              </div>
              <div>
                <Label>Access Expires</Label>
                <p className="mt-1 font-medium">{user.accessExpiresAt ? formatDateTime(user.accessExpiresAt) : "No expiry"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role and Permission Overrides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Label>Added Permissions</Label>
                <Textarea
                  value={addedPermissions}
                  onChange={(event) => setAddedPermissions(event.target.value)}
                  placeholder="Comma-separated permission keys"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Removed Permissions</Label>
                <Textarea
                  value={removedPermissions}
                  onChange={(event) => setRemovedPermissions(event.target.value)}
                  placeholder="Comma-separated permission keys"
                  rows={4}
                />
              </div>

              <Button onClick={handleSave} disabled={saving || !canManageUsers}>
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <EmptyState
                icon={Shield}
                title="No audit activity"
                description="Platform audit events for this user will appear here."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={String(log._id)}>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.tenantName}</TableCell>
                      <TableCell>{formatDateTime(log.timestamp)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

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
              This will immediately block the user from platform access.
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
              This permanently removes the user record and should only be used when access should not be restored.
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
