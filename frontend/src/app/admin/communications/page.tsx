"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Plus, Bell, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/formatters";

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

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const columns: Column<Announcement>[] = [
        {
            key: "title",
            header: "Title",
            sortable: true,
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
