"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar,
  Award,
  AlertTriangle,
  BookOpen,
  Target,
  Activity,
  Download,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

export default function EnhancedParentDashboardPage() {
  const { user, isLoading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("current");

  // Mock data - in real app, these would come from queries
  const studentPerformance = {
    averageGrade: "B+",
    attendanceRate: 92,
    assignmentsCompleted: 45,
    totalAssignments: 48,
    behaviorScore: "Excellent",
    recentActivity: [
      { type: "assignment", subject: "Math", grade: "A", date: "2024-03-01" },
      { type: "test", subject: "Science", grade: "B+", date: "2024-02-28" },
      { type: "attendance", subject: "English", status: "Present", date: "2024-02-27" }
    ]
  };

  const financialOverview = {
    totalFees: 150000,
    paidAmount: 120000,
    outstandingBalance: 30000,
    nextPaymentDue: "2024-03-15",
    paymentHistory: [
      { date: "2024-02-15", amount: 25000, method: "M-Pesa", status: "completed" },
      { date: "2024-01-15", amount: 25000, method: "Bank Transfer", status: "completed" }
    ]
  };

  const communicationStats = {
    totalMessages: 24,
    unreadMessages: 3,
    lastCommunication: "2024-03-01",
    upcomingEvents: 2,
    recentAnnouncements: [
      { title: "Parent-Teacher Meeting", date: "2024-03-10", type: "meeting" },
      { title: "School Holiday Notice", date: "2024-03-05", type: "announcement" }
    ]
  };

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div>
      <PageHeader
        title="Enhanced Parent Dashboard"
        description="Comprehensive overview of student performance and activities"
      />

      <div className="space-y-6">
        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Academic Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {studentPerformance.averageGrade}
                </div>
                <p className="text-sm text-muted-foreground">Average Grade</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {studentPerformance.attendanceRate}%
                </div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {studentPerformance.assignmentsCompleted}/{studentPerformance.totalAssignments}
                </div>
                <p className="text-sm text-muted-foreground">Assignments</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {studentPerformance.behaviorScore}
                </div>
                <p className="text-sm text-muted-foreground">Behavior Score</p>
              </div>
            </div>

            {/* Performance Progress Bars */}
            <div className="grid gap-4 md:grid-cols-2 mt-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Grade Progress</span>
                  <span className="text-sm text-muted-foreground">B+</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Attendance</span>
                  <span className="text-sm text-muted-foreground">92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Fees</p>
                <p className="text-2xl font-bold">
                  KES {(financialOverview.totalFees / 100).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  KES {(financialOverview.paidAmount / 100).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold text-red-600">
                  KES {(financialOverview.outstandingBalance / 100).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Payment Progress */}
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Payment Progress</span>
                <span className="text-sm text-muted-foreground">80%</span>
              </div>
              <Progress value={80} className="h-3" />
            </div>

            <div className="flex items-center gap-2 mt-4 p-3 bg-yellow-50 rounded">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                Next payment due: {format(new Date(financialOverview.nextPaymentDue), "PPP")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studentPerformance.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'assignment' ? 'bg-blue-500' :
                      activity.type === 'test' ? 'bg-green-500' :
                      'bg-purple-500'
                    }`} />
                    <div>
                      <p className="font-medium capitalize">{activity.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.subject} • {format(new Date(activity.date), "PPP")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {activity.grade && (
                      <Badge variant="default">{activity.grade}</Badge>
                    )}
                    {activity.status && (
                      <Badge variant="outline">{activity.status}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Communication & Events */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Communications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Messages</span>
                  <Badge variant="default">{communicationStats.totalMessages}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Unread</span>
                  <Badge variant="destructive">{communicationStats.unreadMessages}</Badge>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recent Announcements</p>
                  {communicationStats.recentAnnouncements.map((announcement, index) => (
                    <div key={index} className="p-2 bg-muted rounded text-sm">
                      <p className="font-medium">{announcement.title}</p>
                      <p className="text-muted-foreground">
                        {format(new Date(announcement.date), "PPP")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Upcoming Events</span>
                  <Badge variant="default">{communicationStats.upcomingEvents}</Badge>
                </div>
                
                <div className="space-y-2">
                  {communicationStats.recentAnnouncements
                    .filter(a => a.type === 'meeting')
                    .map((event, index) => (
                      <div key={index} className="p-2 bg-blue-50 rounded text-sm">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-blue-600">
                          {format(new Date(event.date), "PPP")}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
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
    </div>
  );
}
