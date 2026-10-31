"use client";

import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { UsersAdminRail } from "@/components/platform/UsersAdminRail";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { RoleForm } from "../../RoleForm";

export default function EditRolePage() {
  const { roleId } = useParams<{ roleId: string }>();
  const { isLoading, sessionToken } = useAuth();
  const role = usePlatformQuery(
    api.modules.platform.rbac.getRole,
    sessionToken ? { sessionToken, roleId: roleId as any } : "skip",
    !!sessionToken
  ) as any;

  if (isLoading || role === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${role?.name ?? "Role"}`}
        description="Changes to a role take effect immediately for every platform user assigned to it."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Users", href: "/platform/users" },
          { label: "Roles", href: "/platform/users/roles" },
          { label: "Edit" },
        ]}
      />

      <UsersAdminRail />
      <RoleForm mode="edit" role={role} />
    </div>
  );
}
