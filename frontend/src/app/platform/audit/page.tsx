"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { AuditTrail } from "@/components/platform/AuditTrail";
import { PlatformMetricsProvider } from "@/components/platform/PlatformMetrics";

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
    <PlatformMetricsProvider>
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
    </PlatformMetricsProvider>
  );
}
