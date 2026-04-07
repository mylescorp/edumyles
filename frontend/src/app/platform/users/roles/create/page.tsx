"use client";

import { UsersAdminRail } from "@/components/platform/UsersAdminRail";
import { PageHeader } from "@/components/shared/PageHeader";
import { RoleForm } from "../RoleForm";

export default function CreateRolePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Custom Role"
        description="Start from scratch or extend a system role, then refine the exact permissions this role should have."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Users", href: "/platform/users" },
          { label: "Roles", href: "/platform/users/roles" },
          { label: "Create" },
        ]}
      />

      <UsersAdminRail />
      <RoleForm mode="create" />
    </div>
  );
}
