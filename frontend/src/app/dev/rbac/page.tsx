"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Copy,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserCog,
} from "lucide-react";
import {
  DevConsoleShell,
  ErrorState,
  formatTimestamp,
  LoadingState,
  MetricCard,
  PrivilegedAccessEmptyState,
  useDevSystemMapData,
} from "@/components/dev/console";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import type { DevRbacData, DevRbacRole, DevRbacUser } from "@/lib/dev/types";

const DEFAULT_ROLE_COLOR = "#2563EB";
const DEFAULT_ROLE_ICON = "shield-check";

type RoleFormState = {
  name: string;
  description: string;
  baseRole: string;
  color: string;
  icon: string;
  permissions: string[];
  isActive: boolean;
};

function emptyRoleForm(): RoleFormState {
  return {
    name: "",
    description: "",
    baseRole: "",
    color: DEFAULT_ROLE_COLOR,
    icon: DEFAULT_ROLE_ICON,
    permissions: [],
    isActive: true,
  };
}

function formFromRole(role: DevRbacRole): RoleFormState {
  return {
    name: role.name,
    description: role.description ?? "",
    baseRole: role.baseRole ?? "",
    color: role.color ?? DEFAULT_ROLE_COLOR,
    icon: role.icon ?? DEFAULT_ROLE_ICON,
    permissions: role.permissions,
    isActive: role.isActive,
  };
}

function formatDate(value?: number) {
  if (!value) return "Never";
  return formatTimestamp(new Date(value).toISOString());
}

export default function DevRbacPage() {
  const {
    systemMap,
    isLoading,
    isRefreshing,
    error,
    autoRefresh,
    setAutoRefresh,
    loadSystemMap,
  } = useDevSystemMapData();
  const { toast } = useToast();
  const [rbacData, setRbacData] = useState<DevRbacData | null>(null);
  const [rbacError, setRbacError] = useState<string | null>(null);
  const [isRbacLoading, setIsRbacLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<DevRbacRole | null>(null);
  const [roleForm, setRoleForm] = useState<RoleFormState>(emptyRoleForm);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [deleteRole, setDeleteRole] = useState<DevRbacRole | null>(null);
  const [selectedUser, setSelectedUser] = useState<DevRbacUser | null>(null);
  const [userReason, setUserReason] = useState("Developer console RBAC review");
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const currentRole = systemMap?.access.find((entry) => entry.canRunPrivilegedDevActions);

  const loadRbac = useCallback(async () => {
    setIsRbacLoading(true);
    try {
      const suffix = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
      const response = await fetch(`/api/dev/rbac${suffix}`, { cache: "no-store" });
      const payload = (await response.json()) as DevRbacData | { error?: string };
      if (!response.ok) {
        throw new Error("error" in payload && payload.error ? payload.error : "Failed to load RBAC data");
      }
      setRbacData(payload as DevRbacData);
      setRbacError(null);
    } catch (loadError) {
      setRbacError(loadError instanceof Error ? loadError.message : "Failed to load RBAC data");
    } finally {
      setIsRbacLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void loadRbac();
  }, [loadRbac]);

  const permissionGroups = useMemo(() => {
    const groups = new Map<string, DevRbacData["permissions"]>();
    for (const permission of rbacData?.permissions ?? []) {
      const existing = groups.get(permission.group) ?? [];
      existing.push(permission);
      groups.set(permission.group, existing);
    }
    return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [rbacData?.permissions]);

  const filteredRoles = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (rbacData?.roles ?? []).filter((role) => {
      if (!needle) return true;
      return `${role.name} ${role.slug} ${role.description ?? ""}`.toLowerCase().includes(needle);
    });
  }, [rbacData?.roles, search]);

  const filteredUsers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (rbacData?.users ?? []).filter((user) => {
      if (!needle) return true;
      return `${user.email} ${user.firstName ?? ""} ${user.lastName ?? ""} ${user.role}`.toLowerCase().includes(needle);
    });
  }, [rbacData?.users, search]);

  const runAction = useCallback(
    async (payload: Record<string, unknown>, successMessage: string) => {
      const actionKey = String(payload.action ?? "action");
      setPendingAction(actionKey);
      try {
        const response = await fetch("/api/dev/rbac", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(result.error ?? "RBAC action failed");
        }
        toast({ title: "RBAC updated", description: successMessage });
        await loadRbac();
      } catch (actionError) {
        toast({
          title: "RBAC action failed",
          description: actionError instanceof Error ? actionError.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        setPendingAction(null);
      }
    },
    [loadRbac, toast]
  );

  const openCreateRole = () => {
    setSelectedRole(null);
    setRoleForm(emptyRoleForm());
    setIsRoleDialogOpen(true);
  };

  const openEditRole = (role: DevRbacRole) => {
    setSelectedRole(role);
    setRoleForm(formFromRole(role));
    setIsRoleDialogOpen(true);
  };

  const togglePermission = (permission: string) => {
    setRoleForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission].sort(),
    }));
  };

  const saveRole = async () => {
    const payload = selectedRole
      ? {
          action: "updateRole",
          roleId: selectedRole.id,
          ...roleForm,
          baseRole: roleForm.baseRole || undefined,
        }
      : {
          action: "createRole",
          ...roleForm,
          baseRole: roleForm.baseRole || undefined,
        };

    await runAction(payload, selectedRole ? "Role policy saved." : "Role policy created.");
    setIsRoleDialogOpen(false);
  };

  if (isLoading && !systemMap) {
    return (
      <DevConsoleShell
        title="RBAC Control"
        description="Role CRUD, platform user role assignment, permission overrides, and audit review."
        systemMap={null}
        isRefreshing={isRefreshing}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        onRefresh={() => void loadSystemMap("refresh")}
      >
        <LoadingState />
      </DevConsoleShell>
    );
  }

  const totalPermissions = rbacData?.permissions.length ?? 0;
  const customRoleCount = rbacData?.roles.filter((role) => !role.isSystem).length ?? 0;
  const systemRoleCount = rbacData?.roles.filter((role) => role.isSystem).length ?? 0;
  const activeUsers = rbacData?.users.filter((user) => user.status !== "suspended").length ?? 0;

  return (
    <DevConsoleShell
      title="RBAC Control"
      description="Role CRUD, platform user role assignment, permission overrides, and audit review."
      systemMap={systemMap}
      isRefreshing={isRefreshing}
      autoRefresh={autoRefresh}
      setAutoRefresh={setAutoRefresh}
      onRefresh={() => {
        void loadSystemMap("refresh");
        void loadRbac();
      }}
    >
      {error ? <ErrorState error={error} /> : null}
      {rbacError ? <ErrorState error={rbacError} /> : null}
      {currentRole ? null : <PrivilegedAccessEmptyState />}

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="System Roles" value={systemRoleCount} detail="Protected platform policies" icon={ShieldCheck} />
          <MetricCard title="Custom Roles" value={customRoleCount} detail="Editable role definitions" icon={KeyRound} />
          <MetricCard title="Permissions" value={totalPermissions} detail="Catalogued platform permissions" icon={SlidersHorizontal} />
          <MetricCard title="Platform Users" value={activeUsers} detail="Active or reviewable staff accounts" icon={UserCog} />
        </div>

        <Card className="border-border/70">
          <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search roles, users, slugs, or permissions"
                className="max-w-xl"
              />
              <Button variant="outline" onClick={() => void loadRbac()} disabled={isRbacLoading}>
                {isRbacLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh RBAC
              </Button>
            </div>
            <Button onClick={openCreateRole}>
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </CardContent>
        </Card>

        {isRbacLoading && !rbacData ? <LoadingState /> : null}

        {rbacData ? (
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <KeyRound className="h-4 w-4" />
                  Role Policies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredRoles.map((role) => (
                  <div key={role.id} className="rounded-lg border border-border/70 bg-background p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium text-foreground">{role.name}</div>
                          <Badge variant={role.isSystem ? "secondary" : "outline"}>{role.isSystem ? "system" : "custom"}</Badge>
                          <Badge variant={role.isActive ? "default" : "secondary"}>{role.isActive ? "active" : "inactive"}</Badge>
                          <Badge variant="outline">{role.userCount} users</Badge>
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-muted-foreground">{role.slug}</div>
                        <p className="mt-2 text-sm text-muted-foreground">{role.description || "No description yet."}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => void runAction({ action: "duplicateRole", roleId: role.id }, "Role duplicated.")}>
                          <Copy className="mr-2 h-3.5 w-3.5" />
                          Clone
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditRole(role)} disabled={role.isSystem}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setDeleteRole(role)} disabled={role.isSystem}>
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {role.permissions.slice(0, 12).map((permission) => (
                        <Badge key={`${role.id}:${permission}`} variant="outline" className="font-mono text-[11px]">
                          {permission}
                        </Badge>
                      ))}
                      {role.permissions.length > 12 ? <Badge variant="secondary">+{role.permissions.length - 12}</Badge> : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <UserCog className="h-4 w-4" />
                    Platform Users
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredUsers.slice(0, 20).map((user) => (
                    <div key={user.id} className="rounded-lg border border-border/70 bg-background p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">{user.firstName || user.lastName ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : user.email}</div>
                          <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <Badge variant="outline">{user.role}</Badge>
                            <Badge variant={user.status === "suspended" ? "secondary" : "default"}>{user.status ?? "active"}</Badge>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle className="text-base">RBAC Audit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {rbacData.audit.length ? (
                    rbacData.audit.slice(0, 12).map((entry) => (
                      <div key={entry.id} className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Badge variant="outline">{entry.changeType ?? "change"}</Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</span>
                        </div>
                        <div className="mt-1 text-sm text-foreground">{entry.changeSummary ?? "Permission policy changed"}</div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                      No RBAC audit entries available for this session.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRole ? "Edit role policy" : "Create role policy"}</DialogTitle>
            <DialogDescription>
              Manage platform role permissions through the production RBAC backend.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role name</Label>
              <Input id="role-name" value={roleForm.name} onChange={(event) => setRoleForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="base-role">Base role</Label>
              <select
                id="base-role"
                value={roleForm.baseRole}
                onChange={(event) => setRoleForm((current) => ({ ...current, baseRole: event.target.value }))}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">No base role</option>
                {rbacData?.roles.map((role) => (
                  <option key={role.slug} value={role.slug}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                value={roleForm.description}
                onChange={(event) => setRoleForm((current) => ({ ...current, description: event.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>Permissions ({roleForm.permissions.length})</Label>
              <Button variant="outline" size="sm" onClick={() => setRoleForm((current) => ({ ...current, permissions: [] }))}>
                Clear
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {permissionGroups.map(([group, permissions]) => {
                const selectedCount = permissions.filter((permission) => roleForm.permissions.includes(permission.key)).length;
                return (
                  <div key={group} className="rounded-lg border border-border/70 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="font-medium text-foreground">{group}</div>
                      <Badge variant="outline">{selectedCount}/{permissions.length}</Badge>
                    </div>
                    <div className="space-y-1.5">
                      {permissions.map((permission) => (
                        <label key={permission.key} className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50">
                          <input
                            type="checkbox"
                            checked={roleForm.permissions.includes(permission.key)}
                            onChange={() => togglePermission(permission.key)}
                            className="mt-1"
                          />
                          <span className="min-w-0">
                            <span className="block text-sm text-foreground">{permission.label}</span>
                            <span className="block font-mono text-[11px] text-muted-foreground">{permission.key}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void saveRole()} disabled={!roleForm.name.trim() || pendingAction !== null}>
              {pendingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteRole} onOpenChange={(open) => !open && setDeleteRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete custom role?</DialogTitle>
            <DialogDescription>
              This removes {deleteRole?.name}. Roles with assigned users must be reassigned before deletion.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRole(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleteRole) return;
                void runAction({ action: "deleteRole", roleId: deleteRole.id }, "Role deleted.");
                setDeleteRole(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage platform user</DialogTitle>
            <DialogDescription>{selectedUser?.email}</DialogDescription>
          </DialogHeader>
          {selectedUser ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <select
                    value={selectedUser.role}
                    onChange={(event) => setSelectedUser((current) => current ? { ...current, role: event.target.value } : current)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {rbacData?.roles.filter((role) => role.isActive).map((role) => (
                      <option key={role.slug} value={role.slug}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    value={selectedUser.status ?? "active"}
                    onChange={(event) => setSelectedUser((current) => current ? { ...current, status: event.target.value } : current)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea value={userReason} onChange={(event) => setUserReason(event.target.value)} rows={2} />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!selectedUser) return;
                await runAction(
                  {
                    action: "updateUserRole",
                    targetUserId: selectedUser.id,
                    newRole: selectedUser.role,
                    reason: userReason,
                  },
                  "User role updated."
                );
                await runAction(
                  {
                    action: "setUserStatus",
                    targetUserId: selectedUser.id,
                    status: selectedUser.status ?? "active",
                    reason: userReason,
                  },
                  "User status updated."
                );
                setSelectedUser(null);
              }}
              disabled={!selectedUser || pendingAction !== null}
            >
              Save user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DevConsoleShell>
  );
}
