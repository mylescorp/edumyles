"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { usePlatformMetrics } from "@/components/platform/PlatformMetrics";
import { InteractiveChart } from "@/components/charts/InteractiveChart";
import { HeatmapChart } from "@/components/charts/HeatmapChart";
import { AdvancedDateRange } from "@/components/forms/AdvancedDateRange";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AnalyticsPage() {
  const { isLoading } = useAuth();
  const { hasRole } = usePermissions();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const isPlatformAdmin = hasRole("master_admin", "super_admin");

  const { data: stats } = usePlatformMetrics();

  const rangeMs = useMemo(() => {
    const day = 24 * 60 * 60 * 1000;
    return timeRange === "7d" ? 7 * day : timeRange === "30d" ? 30 * day : timeRange === "90d" ? 90 * day : 365 * day;
  }, [timeRange]);

  const chartData = useMemo(() => {
    const activity = (stats?.recentActivity ?? []).filter(
      (a: any) => (a.timestamp ?? 0) >= Date.now() - rangeMs
    );

    // Group by day offset for trend line
    const buckets: Record<number, number> = {};
    activity.forEach((a: any) => {
      const dayOffset = Math.floor((Date.now() - (a.timestamp ?? 0)) / (24 * 60 * 60 * 1000));
      buckets[dayOffset] = (buckets[dayOffset] ?? 0) + 1;
    });
    const totalDays = Math.ceil(rangeMs / (24 * 60 * 60 * 1000));
    const trend = Array.from({ length: totalDays }, (_, i) => ({
      x: totalDays - 1 - i,
      y: buckets[i] ?? 0,
      value: { metric: "activity", day: i }
    }));

    // Group by day-of-week for heatmap
    const heatmap = DAY_NAMES.map((day) => {
      const count = activity.filter((a: any) => {
        const d = new Date(a.timestamp ?? 0);
        return DAY_NAMES[d.getDay()] === day;
      }).length;
      return { day, hour: 12, value: count };
    });

    return { trend, heatmap };
  }, [stats, rangeMs]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Analytics"
        description="Deep insights into platform performance and usage"
        breadcrumbs={[
          { label: "Dashboard", href: "/platform" },
          { label: "Analytics", href: "/platform/analytics" }
        ]}
      />

      <div className="flex items-center justify-between mb-6">
        <AdvancedDateRange
          value={{ start: new Date(Date.now() - rangeMs), end: new Date() }}
          onChange={(range) => {
            const days = Math.ceil((range.end.getTime() - range.start.getTime()) / (24 * 60 * 60 * 1000));
            setTimeRange(days <= 7 ? "7d" : days <= 30 ? "30d" : days <= 90 ? "90d" : "1y");
          }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <InteractiveChart
          data={chartData.trend}
          title="Activity Trend"
          type="line"
          onDrillDown={(point) => {
            console.log("Drill down to:", point.value);
          }}
        />

        <HeatmapChart
          data={chartData.heatmap}
          title="Activity by Day of Week"
        />
      </div>
    </div>
  );
}
