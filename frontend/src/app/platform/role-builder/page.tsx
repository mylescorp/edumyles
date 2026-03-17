"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation } from "convex/react";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/convex/_generated/api";
import {
  Lock,
  Plus,
  Edit,
  Trash2,
  Copy,
  Shield,
  Users,
  Loader2,
  CheckSquare,
} from "lucide-react";

const PERMISSION_MODULES = {
  "Dashboard": ["dashboard:view"],
  "Users": ["users:view", "users:create", "users:edit", "users:delete"],
  "Tenants": ["tenants:view", "tenants:create", "tenants:edit", "tenants:delete", "tenants:impersonate"],
  "Tickets": ["tickets:view", "tickets:create", "tickets:assign", "tickets:resolve", "tickets:delete"],
  "CRM": ["crm:view", "crm:create", "crm:edit", "crm:delete", "crm:proposals"],
  "Billing": ["billing:view", "billing:create", "billing:manage"],
  "Analytics": ["analytics:view", "analytics:export"],
  "Security": ["security:view", "security:manage", "security:audit"],
  "Settings": ["settings:view", "settings:manage"],
  "Automation": ["automation:view", "automation:create", "automation:manage"],
  "Communications": ["communications:view", "communications:send", "communications:templates"],
};

export default function RoleBuilderPage() {
  const { sessionToken } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const roles = usePlatformQuery(
    api.platform.roleBuilder.queries.listCustomRoles,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );

  const createRole = useMutation(api.platform.roleBuilder.mutations.createRole);
  const updateRole = useMutation(api.platform.roleBuilder.mutations.updateRole);
  const deleteRole = useMutation(api.platform.roleBuilder.mutations.deleteRole);
  const duplicateRole = useMutation(api.platform.roleBuilder.mutations.duplicateRole);

  const handleSave = async () => {
    if (!sessionToken || !roleName) return;
    try {
      if (editingRole) {
        await updateRole({
          sessionToken,
          roleId: editingRole._id,
          name: roleName,
          description: roleDescription,
          permissions: selectedPermissions,
        });
      } else {
        await createRole({
          sessionToken,
          name: roleName,
          description: roleDescription,
          permissions: selectedPermissions,
        });
      }
      setIsCreateOpen(false);
      setEditingRole(null);
      setRoleName("");
      setRoleDescription("");
      setSelectedPermissions([]);
    } catch (error) {
      console.error("Failed to save role:", error);
    }
  };

  const openEdit = (role: any) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || "");
    setSelectedPermissions(role.permissions || []);
    setIsCreateOpen(true);
  };

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const toggleModule = (module: string) => {
    const perms = PERMISSION_MODULES[module as keyof typeof PERMISSION_MODULES] || [];
    const allSelected = perms.every((p) => selectedPermissions.includes(p));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !perms.includes(p)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...perms])]);
    }
  };

  if (!roles) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Role Builder"
        description="Create and manage custom roles with granular permissions"
        action={
          <Button onClick={() => { setIsCreateOpen(true); setEditingRole(null); setRoleName(""); setRoleDescription(""); setSelectedPermissions([]); }}>
            <Plus className="h-4 w-4 mr-2" /> Create Role
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No custom roles yet. Create your first role.</p>
            </CardContent>
          </Card>
        ) : (
          roles.map((role: any) => (
            <Card key={role._id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {role.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                  </div>
                  {role.isSystem && <Badge variant="secondary">System</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-4">
                  {(role.permissions || []).slice(0, 6).map((p: string) => (
                    <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                  ))}
                  {(role.permissions || []).length > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{role.permissions.length - 6} more
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {!role.isSystem && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => openEdit(role)}>
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (!sessionToken) return;
                          await duplicateRole({ sessionToken, roleId: role._id });
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" /> Clone
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (!sessionToken) return;
                          await deleteRole({ sessionToken, roleId: role._id });
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create Role"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g., School Manager" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)} placeholder="What can this role do?" rows={2} />
            </div>
            <div className="space-y-3">
              <Label>Permissions ({selectedPermissions.length} selected)</Label>
              {Object.entries(PERMISSION_MODULES).map(([module, perms]) => {
                const allSelected = perms.every((p) => selectedPermissions.includes(p));
                const someSelected = perms.some((p) => selectedPermissions.includes(p));
                return (
                  <div key={module} className="border rounded-lg p-3">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                        onChange={() => toggleModule(module)}
                        className="rounded"
                      />
                      <span className="font-medium text-sm">{module}</span>
                      <Badge variant="outline" className="text-xs ml-auto">
                        {perms.filter((p) => selectedPermissions.includes(p)).length}/{perms.length}
                      </Badge>
                    </label>
                    <div className="grid grid-cols-2 gap-1 pl-6">
                      {perms.map((perm) => (
                        <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer py-0.5">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(perm)}
                            onChange={() => togglePermission(perm)}
                            className="rounded"
                          />
                          {perm.split(":")[1]}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <Button className="w-full" onClick={handleSave} disabled={!roleName}>
              {editingRole ? "Update Role" : "Create Role"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
