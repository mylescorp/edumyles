"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
} from "lucide-react";

const STATUS_CONFIG = {
  present: {
    icon: CheckCircle,
    className: "text-green-500",
    badge: "bg-green-100 text-green-800 border-green-200",
    label: "Present",
  },
  absent: {
    icon: XCircle,
    className: "text-red-500",
    badge: "bg-red-100 text-red-800 border-red-200",
    label: "Absent",
  },
  late: {
    icon: Clock,
    className: "text-yellow-500",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
    label: "Late",
  },
  excused: {
    icon: AlertTriangle,
    className: "text-blue-500",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    label: "Excused",
  },
} as const;

export default function StudentAttendancePage() {
  const { isLoading, sessionToken } = useAuth();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [scanning, setScanning] = useState(false);

  const records = useQuery(api.modules.portal.student.queries.getMyAttendance, {});
  const profile = useQuery(
    api.modules.portal.student.queries.getMyProfile,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as any;
  const markByQrToken = useMutation(api.modules.attendance.mutations.markAttendanceByQrToken);

  if (isLoading || records === undefined || (token && profile === undefined)) {
    return <LoadingSkeleton variant="page" />;
  }

  const handleMarkByQrToken = async () => {
    if (!token || !profile?._id || !sessionToken) return;
    setScanning(true);
    try {
      await markByQrToken({
        sessionToken,
        token,
        studentId: profile._id,
        status: "present",
      });
      toast({ title: "Attendance marked", description: "You have been marked present for this session." });
    } catch (error) {
      toast({
        title: "QR attendance failed",
        description: error instanceof Error ? error.message : "Please ask your teacher for a new code.",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  const stats = {
    present: records.filter((r: any) => r.status === "present").length,
    absent: records.filter((r: any) => r.status === "absent").length,
    late: records.filter((r: any) => r.status === "late").length,
    excused: records.filter((r: any) => r.status === "excused").length,
    total: records.length,
  };

  const attendanceRate =
    stats.total > 0
      ? ((stats.present / stats.total) * 100).toFixed(1)
      : null;

  const sorted = [...records].sort(
    (a: any, b: any) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div>
      <PageHeader
        title="Attendance Record"
        description="Your daily class attendance history"
      />

      <div className="space-y-6">
        {token && (
          <Card>
            <CardHeader>
              <CardTitle>QR Attendance</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Mark yourself present for the active class session.
              </p>
              <Button onClick={handleMarkByQrToken} disabled={scanning || !profile?._id}>
                {scanning ? "Marking..." : "Mark Present"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {(["present", "absent", "late", "excused"] as const).map((status) => {
            const cfg = STATUS_CONFIG[status];
            const Icon = cfg.icon;
            return (
              <Card key={status}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground capitalize">
                    <Icon className={cn("h-4 w-4", cfg.className)} />
                    {cfg.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-bold">{stats[status]}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Attendance Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-blue-600">
                {attendanceRate !== null ? `${attendanceRate}%` : "--"}
              </span>
              <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{
                    width:
                      attendanceRate !== null ? `${attendanceRate}%` : "0%",
                  }}
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {stats.present}/{stats.total} days
              </span>
            </div>
          </CardContent>
        </Card>

        {/* History List */}
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Records Yet</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Your attendance records will appear here once your teacher
                  starts recording attendance.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sorted.map((rec: any, i) => {
                  const status =
                    (rec.status as keyof typeof STATUS_CONFIG) in STATUS_CONFIG
                      ? (rec.status as keyof typeof STATUS_CONFIG)
                      : "present";
                  const cfg = STATUS_CONFIG[status];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {new Date(rec.date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          {rec.note && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {rec.note}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge className={cfg.badge} variant="outline">
                        <Icon className={cn("h-3 w-3 mr-1", cfg.className)} />
                        {cfg.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
