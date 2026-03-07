"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, GraduationCap, Wallet, Bell } from "lucide-react";

export default function StudentDashboard() {
  const profile = useQuery(api.modules.portal.student.queries.getMyProfile);
  const grades = useQuery(api.modules.portal.student.queries.getMyGrades, {});
  const attendance = useQuery(api.modules.portal.student.queries.getMyAttendance, {});
  const assignments = useQuery(api.modules.portal.student.queries.getMyAssignments, {});
  const wallet = useQuery(api.modules.portal.student.queries.getMyWalletBalance);
  const announcements = useQuery(api.modules.portal.student.queries.getAnnouncements);

  const gpa = grades
    ? (
        grades.reduce((acc, g) => acc + (g.score / g.maxScore) * 100, 0) / (grades.length || 1)
      ).toFixed(1)
    : "0.0";
  const attendanceRate = attendance
    ? (
        (attendance.filter((r) => r.status === "present").length / (attendance.length || 1)) *
        100
      ).toFixed(0)
    : "0";
  const pendingAssignments = assignments
    ? assignments.filter((a) => a.status === "pending").length
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${profile?.firstName || "Student"}!`}
        description="Here's what's happening with your studies today."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Average Score"
          value={gpa}
          icon={GraduationCap}
          trend={{ value: 2.1, label: "from last term" }}
        />
        <StatCard
          label="Attendance"
          value={attendanceRate}
          icon={Calendar}
          trend={{ value: 0, label: "Overall rate" }}
        />
        <StatCard
          label="Pending Tasks"
          value={pendingAssignments}
          icon={FileText}
          trend={{ value: 0, label: `total: ${assignments?.length || 0}` }}
        />
        <StatCard
          label="Wallet Balance"
          value={wallet?.balanceCents ? `$${(wallet.balanceCents / 100).toFixed(2)}` : "$0.00"}
          icon={Wallet}
          trend={{ value: 0, label: "Available" }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Latest Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements && announcements.length > 0 ? (
                announcements.slice(0, 3).map((ann) => (
                  <div key={ann._id} className="border-b pb-3 last:border-0 last:pb-0">
                    <h4 className="font-semibold">{ann.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">{ann.body}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(ann.sentAt || ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No recent announcements.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignments && assignments.filter((a) => a.status === "pending").length > 0 ? (
                assignments
                  .filter((a) => a.status === "pending")
                  .slice(0, 3)
                  .map((asg) => (
                    <div
                      key={asg._id}
                      className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <h4 className="font-semibold">{asg.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(asg.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={asg.dueDate < Date.now() ? "destructive" : "secondary"}>
                        {asg.dueDate < Date.now() ? "Overdue" : "Pending"}
                      </Badge>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No upcoming assignments.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
