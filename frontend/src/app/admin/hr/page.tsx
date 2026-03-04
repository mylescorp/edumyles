"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Banknote, ArrowRight, UserPlus } from "lucide-react";
import Link from "next/link";

export default function HRDashboardPage() {
    const { isLoading, sessionToken } = useAuth();

    const stats = useQuery(
        api.modules.hr.queries.getStaffStats,
        sessionToken ? {} : "skip"
    );

    if (isLoading || !stats) return <LoadingSkeleton variant="page" />;

    return (
        <div className="space-y-6">
            <PageHeader
                title="HR & Payroll"
                description="Manage school staff, payroll, and leave"
                actions={
                    <Link href="/admin/staff/create">
                        <Button className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Add Staff
                        </Button>
                    </Link>
                }
            />

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard
                    label="Total Staff"
                    value={stats.total}
                    icon={Users}
                />
                <StatCard
                    label="Active Staff"
                    value={stats.active}
                    icon={Users}
                />
                <StatCard
                    label="On Leave"
                    value={stats.on_leave}
                    icon={Calendar}
                    className={stats.on_leave > 0 ? "border-amber-200 bg-amber-50/50" : ""}
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
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground text-center py-8">
                            Staff activity and updates will appear here.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
