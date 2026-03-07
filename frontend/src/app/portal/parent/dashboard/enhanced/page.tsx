"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DollarSign,
  BookOpen,
  AlertTriangle,
  Activity,
  Download,
  Eye,
  Calendar,
  Target,
} from "lucide-react";
import { formatDate } from "@/lib/formatters";

type Child = {
  _id: string;
  firstName: string;
  lastName: string;
  classId?: string;
  status?: string;
};

export default function EnhancedParentDashboardPage() {
  const { user, isLoading } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState<string>("all");

  const children = useQuery(api.modules.portal.parent.queries.getChildren, {});
  const feeOverview = useQuery(api.modules.portal.parent.queries.getChildrenFeeOverview, {});
  const paymentHistory = useQuery(api.modules.portal.parent.queries.getPaymentHistory, {});
  const announcements = useQuery(api.modules.portal.parent.queries.getAnnouncements, {});
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    user?._id ? { userId: String(user._id) } : "skip"
  );

  const selectedChild = useMemo(() => {
    if (!children || selectedChildId === "all") return null;
    return (children as Child[]).find((c) => String(c._id) === selectedChildId) ?? null;
  }, [children, selectedChildId]);

  const childGrades = useQuery(
    api.modules.portal.parent.queries.getChildGrades,
    selectedChild ? { studentId: String(selectedChild._id) } : "skip"
  );
  const childAttendance = useQuery(
    api.modules.portal.parent.queries.getChildAttendance,
    selectedChild ? { studentId: String(selectedChild._id) } : "skip"
  );
  const childAssignments = useQuery(
    api.modules.portal.parent.queries.getChildAssignments,
    selectedChild?.classId ? { studentId: String(selectedChild._id), classId: String(selectedChild.classId) } : "skip"
  );

  if (
    isLoading ||
    children === undefined ||
    feeOverview === undefined ||
    paymentHistory === undefined ||
    announcements === undefined ||
    unreadCount === undefined
  ) {
    return <LoadingSkeleton variant="page" />;
  }

  const childrenList = children as Child[];
  const totalBalance = (feeOverview as any[]).reduce((sum, child) => sum + (child.balance || 0), 0);
  const totalInvoiced = (feeOverview as any[]).reduce((sum, child) => sum + (child.totalInvoiced || 0), 0);
  const totalPaid = (feeOverview as any[]).reduce((sum, child) => sum + (child.totalPaid || 0), 0);
  const paymentProgress = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

  const computedAverage = useMemo(() => {
    if (!childGrades || childGrades.length === 0) return null;
    const total = childGrades.reduce((sum: number, g: any) => sum + (g.score ?? 0), 0);
    return Math.round((total / childGrades.length) * 10) / 10;
  }, [childGrades]);

  const attendanceRate = useMemo(() => {
    if (!childAttendance || childAttendance.length === 0) return null;
    const present = childAttendance.filter((a: any) => a.status === "present").length;
    return Math.round((present / childAttendance.length) * 100);
  }, [childAttendance]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enhanced Parent Dashboard"
        description="Live overview of academics, fees, and communication activity"
      />

      <Card>
        <CardHeader>
          <CardTitle>Child Context</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Select child for academic details</Label>
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All children (financial + comms)</SelectItem>
                {childrenList.map((child) => (
                  <SelectItem key={String(child._id)} value={String(child._id)}>
                    {child.firstName} {child.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border p-3 text-sm">
            <p className="font-medium">Notifications</p>
            <p className="text-muted-foreground">Unread: {unreadCount}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Average Score</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{computedAverage ?? "--"}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Attendance Rate</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{attendanceRate !== null ? `${attendanceRate}%` : "--"}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Assignments</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{childAssignments ? childAssignments.length : "--"}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Outstanding Fees</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-red-600">KES {totalBalance.toLocaleString()}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Invoiced</p>
              <p className="text-xl font-semibold">KES {totalInvoiced.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-xl font-semibold text-green-600">KES {totalPaid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="text-xl font-semibold text-red-600">KES {totalBalance.toLocaleString()}</p>
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>Payment Progress</span>
              <span>{paymentProgress}%</span>
            </div>
            <Progress value={paymentProgress} className="h-3" />
          </div>
          {totalBalance > 0 && (
            <div className="flex items-center gap-2 rounded bg-yellow-50 p-3 text-sm text-yellow-700">
              <AlertTriangle className="h-4 w-4" />
              <span>There is an outstanding fee balance.</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(paymentHistory as any[]).slice(0, 8).map((payment: any) => (
              <div key={String(payment._id)} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">KES {(payment.amount ?? 0).toLocaleString()}</p>
                  <Badge variant={payment.status === "completed" ? "default" : "secondary"}>{payment.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{payment.method} • {formatDate(payment.processedAt)}</p>
              </div>
            ))}
            {(paymentHistory as any[]).length === 0 && (
              <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Recent Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(announcements as any[]).slice(0, 8).map((item: any) => (
              <div key={String(item._id)} className="rounded-lg border p-3">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.message}</p>
                <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
              </div>
            ))}
            {(announcements as any[]).length === 0 && (
              <p className="text-sm text-muted-foreground">No announcements available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button className="w-full justify-start" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Report Card
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View Detailed Progress
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
