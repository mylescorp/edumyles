"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  Banknote, 
  ArrowRight, 
  UserPlus,
  TrendingUp,
  Clock,
  Award,
  UserCheck
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function HRDashboardPage() {
    const { isLoading, sessionToken } = useAuth();

    const stats = usePlatformQuery(
        api.modules.hr.queries.getStaffStats,
        sessionToken ? { sessionToken } : "skip",
        !!sessionToken
    );

    const recentActivities = usePlatformQuery(
        api.modules.hr.queries.getRecentActivities,
        sessionToken ? { sessionToken, limit: 5 } : "skip",
        !!sessionToken
    );

    if (isLoading || !stats || !recentActivities) return <LoadingSkeleton variant="page" />;

    const upcomingEvents: { id: string; title: string; date: string; time: string; type: string }[] = [];

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "leave_request":
                return Calendar;
            case "new_hire":
                return UserCheck;
            case "payroll_processed":
                return Banknote;
            default:
                return Clock;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "default";
            case "pending":
                return "secondary";
            case "failed":
                return "destructive";
            default:
                return "outline";
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="HR & Payroll"
                description="Manage school staff, payroll, and leave"
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Add Staff
                        </Button>
                        <Button className="gap-2">
                            <Banknote className="h-4 w-4" />
                            Process Payroll
                        </Button>
                    </div>
                }
            />

            {/* Enhanced Stats Overview */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <AdminStatsCard
                    title="Total Staff"
                    value={stats.total}
                    description="All employees"
                    icon={Users}
                    trend={{ value: 5, isPositive: true }}
                />
                <AdminStatsCard
                    title="Active Staff"
                    value={stats.active}
                    description="Currently working"
                    icon={UserCheck}
                    trend={{ value: 8, isPositive: true }}
                />
                <AdminStatsCard
                    title="On Leave"
                    value={stats.on_leave}
                    description="Currently on leave"
                    icon={Calendar}
                    variant={stats.on_leave > 0 ? "warning" : "default"}
                />
                <AdminStatsCard
                    title="Open Positions"
                    value={3}
                    description="Vacancies"
                    icon={TrendingUp}
                    variant="warning"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Management</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Link href="/admin/hr/payroll">
                            <Button className="w-full justify-start gap-2" variant="outline">
                                <Banknote className="h-4 w-4" />
                                Payroll Management
                                <ArrowRight className="ml-auto h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/admin/hr/leave">
                            <Button className="w-full justify-start gap-2" variant="outline">
                                <Calendar className="h-4 w-4" />
                                Leave Requests
                                <ArrowRight className="ml-auto h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/admin/staff">
                            <Button className="w-full justify-start gap-2" variant="outline">
                                <Users className="h-4 w-4" />
                                Staff Directory
                                <ArrowRight className="ml-auto h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/admin/hr/performance">
                            <Button className="w-full justify-start gap-2" variant="outline">
                                <Award className="h-4 w-4" />
                                Performance Reviews
                                <ArrowRight className="ml-auto h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivities.map((activity) => {
                                const Icon = getActivityIcon(activity.type);
                                return (
                                    <div key={activity._id} className="flex items-start gap-3 p-3 border rounded-lg">
                                        <div className="p-2 bg-muted rounded-full">
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-medium text-sm">{activity.title}</h4>
                                                <Badge variant={getStatusColor(activity.status)}>
                                                    {activity.status}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                <div>{activity.employee} • {activity.department}</div>
                                                <div>
                                                    {formatDistanceToNow(new Date(activity.date), {
                                                        addSuffix: true,
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Upcoming Events
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {upcomingEvents.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground">
                                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                    <p className="text-sm">No upcoming events scheduled</p>
                                </div>
                            ) : upcomingEvents.map((event) => (
                                <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                                    <div className="p-2 bg-success-bg rounded-full">
                                        <Clock className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-sm">{event.title}</h4>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            <div>{event.date}</div>
                                            <div>{event.time}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
