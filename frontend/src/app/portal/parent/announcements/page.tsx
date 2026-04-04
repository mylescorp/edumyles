"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Megaphone } from "lucide-react";

type Announcement = {
  _id: string;
  title: string;
  message: string;
  audience: string;
  priority: string;
  publishedAt: number;
  createdAt: number;
};

const priorityVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  urgent: "destructive",
  high: "default",
  medium: "secondary",
  low: "outline",
};

export default function ParentAnnouncementsPage() {
  const { isLoading, sessionToken } = useAuth();
  const announcements = useQuery(
    api.modules.portal.parent.queries.getAnnouncements,
    sessionToken ? { sessionToken, limit: 30 } : "skip"
  ) as Announcement[] | undefined;

  if (isLoading || (sessionToken && announcements === undefined)) {
    return <LoadingSkeleton variant="page" />;
  }

  const list = announcements ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Announcements"
        description="Important updates and news from the school"
      />

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Megaphone className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="font-medium text-foreground mb-1">No announcements</h3>
            <p className="text-sm text-muted-foreground">
              Check back later for school news and updates.
            </p>
          </CardContent>
        </Card>
      ) : (
        list.map((a) => (
          <Card key={a._id}>
            <CardContent className="py-4 space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium leading-snug">{a.title}</p>
                {a.priority && a.priority !== "low" && (
                  <Badge variant={priorityVariant[a.priority] ?? "outline"} className="shrink-0">
                    {a.priority}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{a.message}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(a.publishedAt), { addSuffix: true })}
              </p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
