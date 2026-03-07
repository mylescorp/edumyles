"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Plus, Bell, MessageSquare, Send, Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/formatters";
import Link from "next/link";

type Announcement = {
    _id: string;
    title: string;
    audience: string;
    priority: string;
    status: string;
    createdAt: number;
};

const priorityColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    normal: "outline",
    high: "secondary",
    emergency: "destructive",
};

export default function CommunicationsPage() {
    const { isLoading, sessionToken } = useAuth();

    const announcements = useQuery(
        api.modules.communications.queries.listAnnouncements,
        sessionToken ? {} : "skip"
    );

    // Mock stats - in real app, this would come from API
    const stats = {
        totalMessages: 1247,
        activeCampaigns: 3,
        deliveryRate: 96,
        openRate: 78,
    };

    if (isLoading || !announcements) return <LoadingSkeleton variant="page" />;

    const columns: Column<Announcement>[] = [
        {
            key: "title",
            header: "Title",
            sortable: true,
            cell: (row: Announcement) => row.title,
        },
        {
            key: "audience",
            header: "Audience",
            cell: (row: Announcement) => (
                <Badge variant="outline" className="capitalize">
                    {row.audience.replace(":", ": ")}
                </Badge>
            ),
        },
        {
            key: "priority",
            header: "Priority",
            cell: (row: Announcement) => (
                <Badge variant={priorityColors[row.priority] ?? "outline"} className="capitalize">
                    {row.priority}
                </Badge>
            ),
        },
        {
            key: "status",
            header: "Status",
            cell: (row: Announcement) => (
                <Badge variant={row.status === "published" ? "default" : "secondary"} className="capitalize">
                    {row.status}
                </Badge>
            ),
        },
        {
            key: "createdAt",
            header: "Date",
            cell: (row: Announcement) => formatDate(row.createdAt),
            sortable: true,
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Communications"
                description="Manage school announcements and broadcasts"
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" className="gap-2">
                            <Bell className="h-4 w-4" />
                            Send Broadcast
                        </Button>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            New Announcement
                        </Button>
                    </div>
                }
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <AdminStatsCard
                    title="Total Messages"
                    value={stats.totalMessages.toLocaleString()}
                    description="Messages sent this month"
                    icon={MessageSquare}
                    trend={{ value: 15, isPositive: true }}
                />
                <AdminStatsCard
                    title="Active Campaigns"
                    value={stats.activeCampaigns}
                    description="Currently running campaigns"
                    icon={Send}
                    variant="warning"
                />
                <AdminStatsCard
                    title="Delivery Rate"
                    value={`${stats.deliveryRate}%`}
                    description="Successful deliveries"
                    icon={Users}
                    variant="success"
                    trend={{ value: 2, isPositive: true }}
                />
                <AdminStatsCard
                    title="Open Rate"
                    value={`${stats.openRate}%`}
                    description="Message engagement"
                    icon={Mail}
                    variant="success"
                    trend={{ value: 5, isPositive: true }}
                />
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Link href="/admin/communications/announcement">
                        <Button variant="outline" className="w-full justify-start gap-2">
                            <Bell className="h-4 w-4" />
                            Send Announcement
                        </Button>
                    </Link>
                    <Link href="/admin/communications/sms">
                        <Button variant="outline" className="w-full justify-start gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Send SMS
                        </Button>
                    </Link>
                    <Link href="/admin/communications/email">
                        <Button variant="outline" className="w-full justify-start gap-2">
                            <Mail className="h-4 w-4" />
                            Send Email
                        </Button>
                    </Link>
                    <Link href="/admin/communications/templates">
                        <Button variant="outline" className="w-full justify-start gap-2">
                            <Plus className="h-4 w-4" />
                            Manage Templates
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            <DataTable
                data={(announcements as Announcement[]) ?? []}
                columns={columns}
                searchable
                searchPlaceholder="Search announcements..."
                emptyTitle="No announcements found"
                emptyDescription="Create announcements to keep your school community informed."
            />
        </div>
    );
}
