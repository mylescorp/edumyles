"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

type PlatformUser = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: string;
  tenantId: string;
  isActive?: boolean;
  permissions?: string[];
  location?: string;
  createdAt?: number;
  lastLogin?: number;
  eduMylesUserId: string;
};

type AuditLog = {
  _id: string;
  action: string;
  createdAt?: number;
  timestamp?: number;
  tenantName?: string;
  userName?: string;
  userEmail?: string;
};

type TenantOption = {
  tenantId: string;
  name: string;
};

function formatRoleLabel(role: string) {
  return role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(timestamp?: number) {
  if (!timestamp) return "Unknown";
  return new Date(timestamp).toLocaleString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PlatformUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { sessionToken } = useAuth();
  const userId = params.userId as string;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    role: "super_admin" as "master_admin" | "super_admin",
    status: "active" as "active" | "inactive",
  });

  const user = usePlatformQuery(
    api.platform.users.queries.getUserById,
    sessionToken ? { sessionToken, userId: userId as any } : "skip",
    !!sessionToken
  ) as PlatformUser | null | undefined;

  const tenantOptions = usePlatformQuery(
    api.platform.users.queries.listTenantFilterOptions,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as TenantOption[] | undefined;

  const auditLogs = usePlatformQuery(
    api.platform.audit.queries.listAuditLogs,
    sessionToken && user?.eduMylesUserId
      ? { sessionToken, userId: user.eduMylesUserId, limit: 20 }
      : "skip",
    !!sessionToken && !!user?.eduMylesUserId
  ) as AuditLog[] | undefined;

  const updatePlatformAdminDetails = useMutation(api.platform.users.mutations.updatePlatformAdminDetails);
  const deactivatePlatformAdmin = useMutation(api.platform.users.mutations.deactivatePlatformAdmin);
  const reactivatePlatformAdmin = useMutation(api.platform.users.mutations.reactivatePlatformAdmin);

  const tenantName = useMemo(() => {
    if (!user || !tenantOptions) return user?.tenantId ?? "Unknown";
    return tenantOptions.find((tenant) => tenant.tenantId === user.tenantId)?.name ?? user.tenantId;
  }, [tenantOptions, user]);

  const isPlatformAdmin = user?.role === "master_admin" || user?.role === "super_admin";
  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || user?.email || "User";

  const openEditDialog = () => {
    if (!user || !isPlatformAdmin) {
      toast.error("Only platform admins can be edited from this screen.");
      return;
    }

    setEditForm({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email,
      phone: user.phone ?? "",
      location: user.location ?? "",
      role: user.role === "master_admin" ? "master_admin" : "super_admin",
      status: user.isActive === false ? "inactive" : "active",
    });
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!sessionToken || !user) return;

    setActionPending(true);
    try {
      await updatePlatformAdminDetails({
        sessionToken,
        userId: user._id as any,
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || undefined,
        location: editForm.location.trim() || undefined,
        role: editForm.role,
      });

      const isCurrentlyActive = user.isActive !== false;
      if (isCurrentlyActive && editForm.status === "inactive") {
        await deactivatePlatformAdmin({ sessionToken, userId: user._id as any });
      }
      if (!isCurrentlyActive && editForm.status === "active") {
        await reactivatePlatformAdmin({ sessionToken, userId: user._id as any });
      }

      setIsEditDialogOpen(false);
      toast.success("Platform admin updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save platform admin");
    } finally {
      setActionPending(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!sessionToken || !user || !isPlatformAdmin) return;

    setActionPending(true);
    try {
      if (user.isActive === false) {
        await reactivatePlatformAdmin({ sessionToken, userId: user._id as any });
        toast.success("Platform admin reactivated");
      } else {
        await deactivatePlatformAdmin({ sessionToken, userId: user._id as any });
        toast.success("Platform admin deactivated");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update account status");
    } finally {
      setActionPending(false);
    }
  };

  if (!sessionToken || user === undefined || tenantOptions === undefined || (user && auditLogs === undefined)) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="User Not Found"
          description="The selected user record could not be loaded."
          breadcrumbs={[
            { label: "Platform", href: "/platform" },
            { label: "Users", href: "/platform/users" },
            { label: "Not Found" },
          ]}
          actions={
            <Button asChild variant="outline">
              <Link href="/platform/users">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={fullName}
        description="Platform account details, permissions, and recent activity"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Users", href: "/platform/users" },
          { label: fullName },
        ]}
        badge={
          <Badge variant={user.isActive === false ? "secondary" : "default"}>
            {user.isActive === false ? "Inactive" : "Active"}
          </Badge>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => router.push("/platform/users")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {isPlatformAdmin && (
              <>
                <Button variant="outline" onClick={openEditDialog}>
                  Edit Admin
                </Button>
                <Button
                  variant={user.isActive === false ? "default" : "destructive"}
                  onClick={handleToggleStatus}
                  disabled={actionPending}
                >
                  {actionPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : user.isActive === false ? (
                    <UserCheck className="mr-2 h-4 w-4" />
                  ) : (
                    <UserX className="mr-2 h-4 w-4" />
                  )}
                  {user.isActive === false ? "Reactivate" : "Deactivate"}
                </Button>
              </>
            )}
          </>
        }
      />

      {!isPlatformAdmin && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-start gap-3 pt-6 text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">Read-only account view</p>
              <p className="text-sm text-amber-800">
                This user is not a `master_admin` or `super_admin`, so platform-admin edit actions are intentionally disabled here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Name</Label>
                <p className="font-medium">{fullName}</p>
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <p className="font-medium">{formatRoleLabel(user.role)}</p>
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <p className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {user.email}
                </p>
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <p className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {user.phone || "Not provided"}
                </p>
              </div>
              <div className="space-y-1">
                <Label>Location</Label>
                <p className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {user.location || "Not provided"}
                </p>
              </div>
              <div className="space-y-1">
                <Label>Tenant</Label>
                <p className="font-medium">{tenantName}</p>
              </div>
              <div className="space-y-1">
                <Label>Created</Label>
                <p className="text-sm">{formatDate(user.createdAt)}</p>
              </div>
              <div className="space-y-1">
                <Label>Last Login</Label>
                <p className="text-sm">{formatDate(user.lastLogin)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Audit Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(auditLogs ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent platform audit activity was found for this user.</p>
              ) : (
                (auditLogs ?? []).map((log) => (
                  <div
                    key={log._id}
                    className="flex flex-col gap-1 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{log.action}</Badge>
                        <span className="text-sm font-medium">{log.userName || fullName}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {log.userEmail || user.email}
                        {log.tenantName ? ` • ${log.tenantName}` : ""}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(log.createdAt ?? log.timestamp)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.permissions && user.permissions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.permissions.map((permission) => (
                    <Badge key={permission} variant="outline">
                      {permission}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No explicit permissions are stored on this user. Access is currently role-driven.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Flags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Status</span>
                <Badge variant={user.isActive === false ? "secondary" : "default"}>
                  {user.isActive === false ? "Inactive" : "Active"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Platform Admin</span>
                <Badge variant={isPlatformAdmin ? "default" : "secondary"}>
                  {isPlatformAdmin ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>User ID</span>
                <span className="font-mono text-xs">{user.eduMylesUserId}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Platform Admin</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input
                  id="edit-firstName"
                  value={editForm.firstName}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, firstName: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  value={editForm.lastName}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, lastName: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editForm.location}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, location: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(value) =>
                    setEditForm((current) => ({
                      ...current,
                      role: value as "master_admin" | "super_admin",
                    }))
                  }
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="master_admin">Master Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) =>
                    setEditForm((current) => ({
                      ...current,
                      status: value as "active" | "inactive",
                    }))
                  }
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={actionPending}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={actionPending}>
                {actionPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
