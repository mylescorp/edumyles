"use client";

import { FileText } from "lucide-react";
import { AdminFeatureUnavailable } from "@/components/admin/AdminFeatureUnavailable";

export default function AuditReportsPage() {
  return (
    <AdminFeatureUnavailable
      title="Audit Reports"
      description="Comprehensive audit trail analysis and security reports"
      icon={FileText}
      sectionHref="/admin/audit"
      sectionLabel="Audit"
    />
  );
}
