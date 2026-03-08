"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { AuditTrail } from "@/components/platform/AuditTrail";
import { formatRelativeTime, formatDateTime } from "@/lib/formatters";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type AuditLog = {
    _id: string;
    tenantId: string;
    actorId: string;
    action: string;
    entityId: string;
    entityType: string;
    after?: any;
    before?: any;
    timestamp: number;
    tenantName: string;
    userName: string;
    userEmail: string;
};

function ActionBadge({ action }: { action: string }) {
    const colors: Record<string, string> = {
        "tenant.created": "bg-green-500/10 text-green-700",
        "tenant.suspended": "bg-red-500/10 text-red-700",
        "user.created": "bg-blue-500/10 text-blue-700",
        "user.updated": "bg-yellow-500/10 text-yellow-700",
        "user.deleted": "bg-red-500/10 text-red-700",
        "user.login": "bg-gray-500/10 text-gray-700",
        "user.logout": "bg-gray-500/10 text-gray-700",
        "module.installed": "bg-purple-500/10 text-purple-700",
        "module.uninstalled": "bg-orange-500/10 text-orange-700",
        "settings.updated": "bg-teal-500/10 text-teal-700",
        "impersonation.started": "bg-amber-500/10 text-amber-700",
        "impersonation.ended": "bg-amber-500/10 text-amber-700",
        "payment.initiated": "bg-indigo-500/10 text-indigo-700",
        "payment.completed": "bg-green-500/10 text-green-700",
        "payment.failed": "bg-red-500/10 text-red-700",
    };

    return (
        <Badge variant="secondary" className={colors[action] ?? "bg-gray-500/10 text-gray-700"}>

export default function AuditLogPage() {
  const { isLoading, sessionToken } = useAuth();
  const { hasRole } = usePermissions();
  const isPlatformAdmin = hasRole("master_admin", "super_admin");

  const logs = usePlatformQuery(
    api.platform.audit.queries.listAuditLogs,
    { sessionToken },
    isPlatformAdmin && !!sessionToken
  );

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Platform-wide activity and security audit trail"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Audit Log", href: "/platform/audit" }
        ]}
      />

      <AuditTrail logs={logs || []} />
    </div>
  );
}
