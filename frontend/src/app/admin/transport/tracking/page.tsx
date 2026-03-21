"use client";

import { Bus } from "lucide-react";
import { AdminFeatureUnavailable } from "@/components/admin/AdminFeatureUnavailable";

export default function TransportTrackingPage() {
  return (
    <AdminFeatureUnavailable
      title="Vehicle Tracking"
      description="Monitor route progress, fleet activity, and transport alerts"
      icon={Bus}
      sectionHref="/admin/transport"
      sectionLabel="Transport"
    />
  );
}
