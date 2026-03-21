"use client";

import { Calendar } from "lucide-react";
import { AdminFeatureUnavailable } from "@/components/admin/AdminFeatureUnavailable";

export default function SchedulePage() {
  return (
    <AdminFeatureUnavailable
      title="Schedule Builder"
      description="Build and review timetable schedules across classes and rooms"
      icon={Calendar}
      sectionHref="/admin/timetable"
      sectionLabel="Timetable"
    />
  );
}
