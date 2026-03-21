"use client";

import { BookOpen } from "lucide-react";
import { AdminFeatureUnavailable } from "@/components/admin/AdminFeatureUnavailable";

export default function CirculationPage() {
  return (
    <AdminFeatureUnavailable
      title="Library Circulation"
      description="Monitor active borrows, overdue items, and returns"
      icon={BookOpen}
      sectionHref="/admin/library"
      sectionLabel="Library"
    />
  );
}
