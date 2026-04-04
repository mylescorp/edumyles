"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, CheckCircle, Gauge, Star, TrendingDown, TrendingUp } from "lucide-react";

function trendMeta(trend: string) {
  if (trend === "up") {
    return { label: "Improving", icon: <TrendingUp className="h-4 w-4 text-green-600" /> };
  }
  if (trend === "down") {
    return { label: "Declining", icon: <TrendingDown className="h-4 w-4 text-red-600" /> };
  }
  return { label: "Stable", icon: <Activity className="h-4 w-4 text-muted-foreground" /> };
}

export default function StaffPerformanceDetailPage() {
  const params = useParams();
  const { sessionToken } = useAuth();
  const staffId = params.staffId as string;

  const detail = usePlatformQuery(
    api.platform.staffPerformance.queries.getStaffDetail,
    { sessionToken: sessionToken || "", userId: staffId },
    !!sessionToken
  ) as any;

  if (!detail) {
    return <div className="p-6">Loading...</div>;
  }

  const latestPeriod = detail.periods?.[0];
  const latestMetrics = latestPeriod?.metrics || {};
  const trend = trendMeta(detail.trend);

  return (
    <div className="space-y-6">
      <PageHeader
        title={detail.userName}
        description="Backend-recorded performance history without synthetic KPI placeholders."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Staff Performance", href: "/platform/staff-performance" },
          { label: detail.userName, href: `/platform/staff-performance/${staffId}` },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Current Score</div>
            <div className="text-2xl font-bold">{detail.currentScore}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Tickets Resolved</div>
            <div className="text-2xl font-bold">{latestMetrics.ticketsResolved ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Avg Response Time</div>
            <div className="text-2xl font-bold">{latestMetrics.avgResponseTime ?? 0}m</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">SLA Compliance</div>
            <div className="text-2xl font-bold">{latestMetrics.slaCompliance ?? 0}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Staff Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm text-muted-foreground">Email</div>
            <div className="font-medium">{detail.userEmail}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Role</div>
            <Badge variant="secondary" className="mt-1 capitalize">
              {String(detail.role).replace(/_/g, " ")}
            </Badge>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Department</div>
            <div className="font-medium">{detail.department || "General"}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Trend</div>
            <div className="flex items-center gap-2 font-medium mt-1">
              {trend.icon}
              {trend.label}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest Period Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2"><CheckCircle className="h-4 w-4" /> First Contact Resolution</span>
              <span className="font-medium">{latestMetrics.firstContactResolution ?? 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2"><Gauge className="h-4 w-4" /> Avg Resolution Time</span>
              <span className="font-medium">{latestMetrics.avgResolutionTime ?? 0}m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2"><Star className="h-4 w-4" /> Satisfaction Score</span>
              <span className="font-medium">{latestMetrics.satisfactionScore ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Escalation Rate</span>
              <span className="font-medium">{latestMetrics.escalationRate ?? 0}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Goals and Achievements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {detail.goals ? (
              <div className="space-y-2">
                {detail.goals.ticketsTarget !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tickets Target</span>
                    <span className="font-medium">{detail.goals.ticketsTarget}</span>
                  </div>
                )}
                {detail.goals.satisfactionTarget !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Satisfaction Target</span>
                    <span className="font-medium">{detail.goals.satisfactionTarget}</span>
                  </div>
                )}
                {detail.goals.responseTimeTarget !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Response Time Target</span>
                    <span className="font-medium">{detail.goals.responseTimeTarget}m</span>
                  </div>
                )}
              </div>
            ) : (
              <Alert>
                <AlertTitle>No active goals</AlertTitle>
                <AlertDescription>This staff member does not yet have explicit performance targets recorded.</AlertDescription>
              </Alert>
            )}

            <div>
              <div className="text-sm font-medium mb-2">Achievements</div>
              {detail.achievements?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {detail.achievements.map((achievement: string) => (
                    <Badge key={achievement} variant="outline">
                      {achievement}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No achievements recorded yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(detail.periods || []).map((period: any) => (
            <div key={period.period} className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium capitalize">{period.period}</div>
                <Badge variant="secondary">Score {period.overallScore}</Badge>
              </div>
              <div className="grid gap-2 md:grid-cols-3 text-sm">
                <div className="text-muted-foreground">
                  Tickets Resolved: <span className="font-medium text-foreground">{period.metrics?.ticketsResolved ?? 0}</span>
                </div>
                <div className="text-muted-foreground">
                  Response Time: <span className="font-medium text-foreground">{period.metrics?.avgResponseTime ?? 0}m</span>
                </div>
                <div className="text-muted-foreground">
                  SLA Compliance: <span className="font-medium text-foreground">{period.metrics?.slaCompliance ?? 0}%</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
