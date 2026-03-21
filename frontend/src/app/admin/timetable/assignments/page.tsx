"use client";

import { Users } from "lucide-react";
import { AdminFeatureUnavailable } from "@/components/admin/AdminFeatureUnavailable";

export default function AssignmentsPage() {
  return (
    <AdminFeatureUnavailable
      title="Teacher Assignments"
      description="Manage teacher workload and subject allocations"
      icon={Users}
      sectionHref="/admin/timetable"
      sectionLabel="Timetable"
    />
  );
}
