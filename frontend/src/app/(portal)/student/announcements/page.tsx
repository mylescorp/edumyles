"use client";

import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Info, Megaphone } from "lucide-react";

type StudentAnnouncement = {
    _id: string;
    title: string;
    status: string;
    body: string;
    sentBy?: string;
    sentAt?: number;
    createdAt: number;
};

export default function StudentAnnouncements() {
    const announcements = useQuery(api.modules.portal.student.queries.getAnnouncements) as StudentAnnouncement[] | undefined;

    return (
        <div className="space-y-6">
            <PageHeader
                title="School Announcements"
                description="Stay updated with the latest news and notices from your school."
            />

            <div className="max-w-4xl mx-auto space-y-6">
                {announcements && announcements.length > 0 ? (
                    announcements.map((ann) => (
                        <Card key={ann._id} className="overflow-hidden border-l-4 border-l-primary">
                            <CardHeader className="bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-full bg-primary/10">
                                            <Megaphone className="h-4 w-4 text-primary" />
                                        </div>
                                        <CardTitle className="text-xl">{ann.title}</CardTitle>
                                    </div>
                                    <Badge variant="outline" className="capitalize">
                                        {ann.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                                    {ann.body}
                                </p>
                            </CardContent>
                            <CardFooter className="border-t bg-muted/10 py-3 flex justify-between">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Info className="h-3 w-3" />
                                    <span>Sent by {ann.sentBy || "School Admin"}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(ann.sentAt || ann.createdAt).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </CardFooter>
                        </Card>
                    ))
                ) : announcements ? (
                    <div className="flex h-64 flex-col items-center justify-center text-muted-foreground gap-4 bg-muted/20 rounded-xl border-2 border-dashed">
                        <Bell className="h-12 w-12 opacity-20" />
                        <p className="italic font-medium">No announcements for you right now.</p>
                    </div>
                ) : (
                    <div className="flex h-32 items-center justify-center text-muted-foreground italic">
                        Loading announcements...
                    </div>
                )}
            </div>
        </div>
    );
}
