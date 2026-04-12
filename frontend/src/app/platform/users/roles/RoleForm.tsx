"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { toast } from "sonner";

type RoleFormProps = {
  mode: "create" | "edit";
  role?: any;
};

export function RoleForm({ mode, role }: RoleFormProps) {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const permissionCatalog = usePlatformQuery(
    api.modules.platform.rbac.getPermissionCatalog,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as Record<string, Array<{ key: string; label: string; description: string }>> | undefined;
  const roles = usePlatformQuery(
    api.modules.platform.rbac.getRoles,
    sessionToken ? { sessionToken, includeSystem: true, includeInactive: true } : "skip",
    !!sessionToken
  ) as Array<any> | undefined;

  const createRole = useMutation(api.modules.platform.rbac.createRole);
  const updateRole = useMutation(api.modules.platform.rbac.updateRole);

  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [baseRole, setBaseRole] = useState(role?.baseRole ?? "custom");
  const [color, setColor] = useState(role?.color ?? "#2563EB");
  const [icon, setIcon] = useState(role?.icon ?? "shield");
  const [permissions, setPermissions] = useState<string[]>(role?.permissions ?? []);
  const [saving, setSaving] = useState(false);

  const orderedCategories = useMemo(() => Object.entries(permissionCatalog ?? {}), [permissionCatalog]);

  const togglePermission = (permissionKey: string) => {
    setPermissions((current) =>
      current.includes(permissionKey)
        ? current.filter((permission) => permission !== permissionKey)
        : [...current, permissionKey]
    );
  };

  const handleBaseRoleChange = (nextBaseRole: string) => {
    setBaseRole(nextBaseRole);
    if (nextBaseRole === "custom" || !roles) return;
    const source = roles.find((entry) => entry.slug === nextBaseRole);
    if (source) {
      setPermissions(source.permissions ?? []);
    }
  };

  const handleSubmit = async () => {
    if (!sessionToken) return;
    if (!name.trim()) {
      toast.error("Role name is required");
      return;
    }

    setSaving(true);
    try {
      if (mode === "create") {
        const result = await createRole({
          sessionToken,
          name: name.trim(),
          description: description.trim(),
          baseRole: baseRole === "custom" ? undefined : baseRole,
          color,
          icon,
          permissions,
        });
        toast.success("Role created");
        router.push(`/platform/users/roles/${result.roleId}/edit`);
      } else if (role?._id) {
        await updateRole({
          sessionToken,
          roleId: role._id,
          name: name.trim(),
          description: description.trim(),
          baseRole: baseRole === "custom" ? undefined : baseRole,
          color,
          icon,
          permissions,
        });
        toast.success("Role updated");
        router.push("/platform/users/roles");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "Role Identity" : "Edit Role"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Role name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={50} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={200} rows={4} />
          </div>
          <div className="space-y-2">
            <Label>Base role</Label>
            <Select value={baseRole} onValueChange={handleBaseRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a base role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">From scratch</SelectItem>
                {(roles ?? []).map((entry) => (
                  <SelectItem key={entry.slug} value={entry.slug}>
                    {entry.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Color</Label>
              <Input type="color" value={color} onChange={(event) => setColor(event.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <Input value={icon} onChange={(event) => setIcon(event.target.value)} />
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={saving || !permissionCatalog}>
            {mode === "create" ? "Create Role" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {orderedCategories.map(([category, categoryPermissions]) => (
            <div key={category} className="space-y-3 border-b pb-5 last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{category}</h3>
                  <p className="text-sm text-muted-foreground">
                    {categoryPermissions.filter((permission) => permissions.includes(permission.key)).length} of {categoryPermissions.length} enabled
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPermissions((current) => {
                      const categoryKeys = categoryPermissions.map((permission) => permission.key);
                      const hasAll = categoryKeys.every((permissionKey) => current.includes(permissionKey));
                      if (hasAll) {
                        return current.filter((permissionKey) => !categoryKeys.includes(permissionKey));
                      }
                      return Array.from(new Set([...current, ...categoryKeys]));
                    })
                  }
                >
                  Toggle all
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {categoryPermissions.map((permission) => {
                  const checked = permissions.includes(permission.key);
                  return (
                    <label
                      key={permission.key}
                      className="flex items-start gap-3 rounded-xl border border-border/70 bg-background px-4 py-3"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => togglePermission(permission.key)}
                        className="mt-0.5"
                      />
                      <div className="space-y-1">
                        <p className="font-medium">{permission.label}</p>
                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                        <p className="text-[11px] font-mono text-muted-foreground">{permission.key}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
