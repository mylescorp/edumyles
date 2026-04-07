"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { UsersAdminRail } from "@/components/platform/UsersAdminRail";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { Copy, Plus, Shield } from "lucide-react";

export default function PlatformRolesPage() {
  const { isLoading, sessionToken } = useAuth();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const roles = usePlatformQuery(
    api.modules.platform.rbac.getRoles,
    sessionToken ? { sessionToken, includeSystem: true, includeInactive: true } : "skip",
    !!sessionToken
  ) as Array<any> | undefined;

  const selectedRole = usePlatformQuery(
    api.modules.platform.rbac.getRole,
    sessionToken && selectedSlug ? { sessionToken, slug: selectedSlug } : "skip",
    !!sessionToken && !!selectedSlug
  ) as any;

  if (isLoading || roles === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const effectiveSelected = selectedRole ?? (roles[0] ? { ...roles[0], users: [] } : null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role Management"
        description="Manage system roles, duplicate them into custom roles, and inspect effective platform access."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Users", href: "/platform/users" },
          { label: "Roles" },
        ]}
        actions={
          <Button asChild>
            <Link href="/platform/users/roles/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Link>
          </Button>
        }
      />

      <UsersAdminRail />

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {roles.map((role) => (
              <button
                key={role.slug}
                type="button"
                onClick={() => setSelectedSlug(role.slug)}
                className="w-full rounded-xl border px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{role.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{role.description}</p>
                  </div>
                  <Badge variant={role.isSystem ? "secondary" : "outline"}>{role.userCount}</Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {!effectiveSelected ? (
          <EmptyState icon={Shield} title="No roles yet" description="System roles will appear here once RBAC is seeded." />
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{effectiveSelected.name}</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">{effectiveSelected.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={effectiveSelected.isSystem ? "secondary" : "outline"}>
                  {effectiveSelected.isSystem ? "System role" : "Custom role"}
                </Badge>
                {!effectiveSelected.isSystem ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/platform/users/roles/${effectiveSelected._id ?? effectiveSelected.id}/edit`}>Edit</Link>
                  </Button>
                ) : null}
                <Button asChild variant="outline" size="sm">
                  <Link href={`/platform/users/roles/create?duplicate=${effectiveSelected.slug}`}>
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Duplicate
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Slug</p>
                  <p className="mt-2 font-mono text-sm">{effectiveSelected.slug}</p>
                </div>
                <div className="rounded-xl border px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">User count</p>
                  <p className="mt-2 text-2xl font-semibold">{effectiveSelected.userCount ?? 0}</p>
                </div>
                <div className="rounded-xl border px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                  <p className="mt-2 font-semibold">{effectiveSelected.isActive ? "Active" : "Inactive"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Permissions</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {(effectiveSelected.permissions ?? []).map((permission: string) => (
                    <div key={permission} className="rounded-xl border px-4 py-3 font-mono text-sm">
                      {permission}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Users with this role</h3>
                {(selectedRole?.users ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active platform users currently have this role.</p>
                ) : (
                  <div className="grid gap-3">
                    {selectedRole.users.map((user: any) => (
                      <Link
                        key={user.id}
                        href={`/platform/users/${user.id}`}
                        className="rounded-xl border px-4 py-3 transition hover:border-emerald-300 hover:bg-emerald-50/50"
                      >
                        <p className="font-medium">{user.firstName || user.lastName ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
