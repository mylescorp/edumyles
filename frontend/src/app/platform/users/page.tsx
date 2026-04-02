"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Activity,
  CheckCircle,
  Download,
  Loader2,
  MoreHorizontal,
  Plus,
  Shield,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { PlatformAdminInviteForm } from "./PlatformAdminInviteForm";

type User = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: string;
  tenantId: string;
  isActive: boolean;
  permissions: string[];
  location?: string;
  createdAt: number;
  twoFactorEnabled?: boolean;
  eduMylesUserId: string;
};

type TenantOption = {
  tenantId: string;
  name: string;
  status: string;
  subdomain: string;
};

type CustomRole = {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: number;
};

type AuditLog = {
  _id: string;
  actorId: string;
  action: string;
  createdAt?: number;
  timestamp?: number;
  userName?: string;
  userEmail?: string;
  tenantName?: string;
};

const SYSTEM_PLATFORM_ROLES = [
  {
    _id: "master_admin",
    name: "master_admin",
    description: "Full platform control including billing, settings, and tenant operations.",
    permissions: ["*"],
    isSystem: true,
    createdAt: 0,
  },
  {
    _id: "super_admin",
    name: "super_admin",
    description: "Secondary platform admin role for operational oversight and support.",
    permissions: ["platform:admin", "reports:read", "settings:read"],
    isSystem: true,
    createdAt: 0,
  },
];

const PERMISSION_MODULES = {
  Dashboard: ["dashboard:view"],
  Users: ["users:view", "users:create", "users:edit", "users:delete"],
  Tenants: ["tenants:view", "tenants:create", "tenants:edit", "tenants:delete"],
  Tickets: ["tickets:view", "tickets:create", "tickets:assign", "tickets:resolve"],
  Billing: ["billing:view", "billing:create", "billing:manage"],
  Analytics: ["analytics:view", "analytics:export"],
  Settings: ["settings:view", "settings:manage"],
};

function formatRoleLabel(role: string) {
  return role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(timestamp?: number) {
  if (!timestamp) return "Unknown";
  return new Date(timestamp).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-6">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="text-muted-foreground">{icon}</div>
      </CardContent>
    </Card>
  );
}

export default function UsersPage() {
  const { sessionToken } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTenant, setSelectedTenant] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingCustomRole, setEditingCustomRole] = useState<CustomRole | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    role: "super_admin" as "master_admin" | "super_admin",
    status: "active" as "active" | "inactive",
  });

  const users = usePlatformQuery(
    api.platform.users.queries.listAllUsers,
    sessionToken
      ? {
          sessionToken,
          ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
          ...(selectedRoleFilter !== "all" ? { role: selectedRoleFilter } : {}),
          ...(selectedTenant !== "all" ? { tenantId: selectedTenant } : {}),
          ...(selectedStatus !== "all" ? { status: selectedStatus } : {}),
        }
      : "skip",
    !!sessionToken
  ) as User[] | undefined;

  const tenantOptions = usePlatformQuery(
    api.platform.users.queries.listTenantFilterOptions,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as TenantOption[] | undefined;

  const customRoles = usePlatformQuery(
    api.platform.roleBuilder.queries.listCustomRoles,
    sessionToken ? { sessionToken, tenantId: "PLATFORM", includeSystem: false } : "skip",
    !!sessionToken
  ) as CustomRole[] | undefined;

  const activityLogs = usePlatformQuery(
    api.platform.audit.queries.listAuditLogs,
    sessionToken ? { sessionToken, limit: 100 } : "skip",
    !!sessionToken
  ) as AuditLog[] | undefined;

  const deactivatePlatformAdmin = useMutation(api.platform.users.mutations.deactivatePlatformAdmin);
  const reactivatePlatformAdmin = useMutation(api.platform.users.mutations.reactivatePlatformAdmin);
  const updatePlatformAdminDetails = useMutation(api.platform.users.mutations.updatePlatformAdminDetails);
  const createRole = useMutation(api.platform.roleBuilder.mutations.createRole);
  const updateRole = useMutation(api.platform.roleBuilder.mutations.updateRole);
  const deleteRole = useMutation(api.platform.roleBuilder.mutations.deleteRole);
  const duplicateRole = useMutation(api.platform.roleBuilder.mutations.duplicateRole);

  if (!sessionToken || users === undefined || tenantOptions === undefined || customRoles === undefined || activityLogs === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const userRows = users;
  const tenantMap = new Map(tenantOptions.map((tenant) => [tenant.tenantId, tenant.name]));
  const combinedRoles = [...SYSTEM_PLATFORM_ROLES, ...customRoles];
  const stats = {
    total: userRows.length,
    active: userRows.filter((user) => user.isActive).length,
    inactive: userRows.filter((user) => !user.isActive).length,
    twoFactor: userRows.filter((user) => user.twoFactorEnabled).length,
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email,
      phone: user.phone ?? "",
      location: user.location ?? "",
      role: user.role === "master_admin" ? "master_admin" : "super_admin",
      status: user.isActive ? "active" : "inactive",
    });
    setIsEditDialogOpen(true);
  };

  const openRoleDialog = (role?: CustomRole) => {
    setEditingCustomRole(role ?? null);
    setRoleName(role?.name ?? "");
    setRoleDescription(role?.description ?? "");
    setSelectedPermissions(role?.permissions ?? []);
    setIsRoleDialogOpen(true);
  };

  const resetRoleDialog = () => {
    setEditingCustomRole(null);
    setRoleName("");
    setRoleDescription("");
    setSelectedPermissions([]);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    setActionUserId(editingUser._id);
    try {
      await updatePlatformAdminDetails({
        sessionToken,
        userId: editingUser._id as any,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        phone: editForm.phone,
        location: editForm.location,
        role: editForm.role,
      });

      if (editingUser.isActive && editForm.status === "inactive") {
        await deactivatePlatformAdmin({ sessionToken, userId: editingUser._id as any });
      } else if (!editingUser.isActive && editForm.status === "active") {
        await reactivatePlatformAdmin({ sessionToken, userId: editingUser._id as any });
      }

      toast.success("Platform admin updated");
      setIsEditDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update platform admin");
    } finally {
      setActionUserId(null);
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (user.role !== "master_admin" && user.role !== "super_admin") {
      toast.error("Only platform admins can be activated or deactivated from this page.");
      return;
    }

    setActionUserId(user._id);
    try {
      if (user.isActive) {
        await deactivatePlatformAdmin({ sessionToken, userId: user._id as any });
        toast.success("Platform admin deactivated");
      } else {
        await reactivatePlatformAdmin({ sessionToken, userId: user._id as any });
        toast.success("Platform admin reactivated");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update account status");
    } finally {
      setActionUserId(null);
    }
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) return;

    try {
      if (editingCustomRole) {
        await updateRole({
          sessionToken,
          roleId: editingCustomRole._id,
          name: roleName.trim(),
          description: roleDescription.trim(),
          permissions: selectedPermissions,
        });
        toast.success("Custom role updated");
      } else {
        await createRole({
          sessionToken,
          tenantId: "PLATFORM",
          name: roleName.trim(),
          description: roleDescription.trim(),
          permissions: selectedPermissions,
        });
        toast.success("Custom role created");
      }

      setIsRoleDialogOpen(false);
      resetRoleDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save role");
    }
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission]
    );
  };

  const exportUsers = () => {
    const csvContent = [
      ["Name", "Email", "Role", "Status", "Tenant", "Location", "Created"],
      ...userRows.map((user) => [
        `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
        user.email,
        user.role,
        user.isActive ? "active" : "inactive",
        tenantMap.get(user.tenantId) ?? user.tenantId,
        user.location ?? "",
        formatDate(user.createdAt),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `platform-users-${new Date().toISOString().split("T")[0]}.csv`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage platform users, custom roles, and recent admin activity"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Users", href: "/platform/users" },
        ]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Users" value={stats.total} icon={<Activity className="h-4 w-4" />} />
            <StatCard title="Active Users" value={stats.active} icon={<UserCheck className="h-4 w-4" />} />
            <StatCard title="Inactive Users" value={stats.inactive} icon={<UserX className="h-4 w-4" />} />
            <StatCard title="2FA Enabled" value={stats.twoFactor} icon={<Shield className="h-4 w-4" />} />
          </div>

          <Card>
            <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search name, email, tenant, or role"
                />
                <Select value={selectedRoleFilter} onValueChange={setSelectedRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {combinedRoles.map((role) => (
                      <SelectItem key={role._id} value={role.name}>
                        {formatRoleLabel(role.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tenants</SelectItem>
                    {tenantOptions.map((tenant) => (
                      <SelectItem key={tenant.tenantId} value={tenant.tenantId}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={exportUsers}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button
                  onClick={() => {
                    setIsCreateDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Invite Platform Admin
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {userRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users matched the current filters.</p>
              ) : (
                userRows.map((user) => {
                  const isPlatformAdmin = user.role === "master_admin" || user.role === "super_admin";

                  return (
                    <div
                      key={user._id}
                      className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">
                            {`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email}
                          </p>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">{formatRoleLabel(user.role)}</Badge>
                          {isPlatformAdmin && <Badge variant="secondary">Platform Admin</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                          {user.phone ? ` • ${user.phone}` : ""}
                          {user.location ? ` • ${user.location}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tenantMap.get(user.tenantId) ?? user.tenantId} • Created {formatDate(user.createdAt)}
                        </p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            asChild
                          >
                            <Link href={`/platform/users/${user._id}`}>View Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (!isPlatformAdmin) {
                                toast.error("Only platform admins can be edited from this page.");
                                return;
                              }
                              openEditUser(user);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(user)}
                            disabled={actionUserId === user._id}
                          >
                            {actionUserId === user._id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : user.isActive ? (
                              <UserX className="mr-2 h-4 w-4" />
                            ) : (
                              <UserCheck className="mr-2 h-4 w-4" />
                            )}
                            {user.isActive ? "Deactivate" : "Reactivate"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Platform Roles</h2>
              <p className="text-sm text-muted-foreground">
                System roles are read-only. Custom roles are stored in Convex and can be edited here.
              </p>
            </div>
            <Button onClick={() => openRoleDialog()}>
              <UserPlus className="mr-2 h-4 w-4" />
              Create Custom Role
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {combinedRoles.map((role) => (
              <Card key={role._id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{formatRoleLabel(role.name)}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">{role.description}</p>
                    </div>
                    <Badge variant={role.isSystem ? "secondary" : "outline"}>
                      {role.isSystem ? "System" : "Custom"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 6).map((permission) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                    {role.permissions.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{role.permissions.length - 6} more
                      </Badge>
                    )}
                  </div>

                  {!role.isSystem && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openRoleDialog(role as CustomRole)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            await duplicateRole({ sessionToken, roleId: role._id });
                            toast.success("Custom role duplicated");
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Unable to duplicate role");
                          }
                        }}
                      >
                        Duplicate
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={async () => {
                          try {
                            await deleteRole({ sessionToken, roleId: role._id });
                            toast.success("Custom role deleted");
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Unable to delete role");
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Platform Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activityLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent audit activity found.</p>
              ) : (
                activityLogs.map((log) => (
                  <div
                    key={log._id}
                    className="flex flex-col gap-2 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{log.action}</Badge>
                        <span className="text-sm font-medium">{log.userName ?? log.actorId}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {log.userEmail ? `${log.userEmail} • ` : ""}
                        {log.tenantName ?? "Platform"}
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
        </TabsContent>
      </Tabs>

      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Invite Platform Admin</DialogTitle>
          </DialogHeader>
          <PlatformAdminInviteForm
            mode="dialog"
            sessionToken={sessionToken}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

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
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveUser} disabled={actionUserId === editingUser?._id}>
                {actionUserId === editingUser?._id ? (
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

      <Dialog
        open={isRoleDialogOpen}
        onOpenChange={(open) => {
          setIsRoleDialogOpen(open);
          if (!open) resetRoleDialog();
        }}
      >
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCustomRole ? "Edit Custom Role" : "Create Custom Role"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input value={roleName} onChange={(event) => setRoleName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={roleDescription}
                onChange={(event) => setRoleDescription(event.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label>Permissions ({selectedPermissions.length} selected)</Label>
              {Object.entries(PERMISSION_MODULES).map(([module, permissions]) => (
                <div key={module} className="rounded-lg border p-3">
                  <p className="mb-2 text-sm font-medium">{module}</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {permissions.map((permission) => (
                      <label key={permission} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission)}
                          onChange={() => togglePermission(permission)}
                        />
                        {permission}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRole}>Save Role</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
