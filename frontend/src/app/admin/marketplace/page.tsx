"use client";

import { ModuleInstallationPanel } from "@/components/admin/ModuleInstallationPanel";
import { PageHeader } from "@/components/shared/PageHeader";

export default function AdminMarketplacePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace"
        description="Browse, install, and manage modules available to your school."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Marketplace" },
        ]}
      />

      <ModuleInstallationPanel />
    </div>
  );
}
