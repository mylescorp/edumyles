"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";

export default function ParentAnnouncementsPage() {
  const { isLoading } = useAuth();
  const announcements = useQuery(
    api.modules.portal.parent.queries.getAnnouncements,
    {}
  ) as Array<{ _id: string; title: string; message: string }> | undefined;

  if (isLoading || announcements === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Announcements"
        description="Important updates and news from the school"
      />

      {announcements.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No announcements at the moment.
        </p>
      ) : (
        announcements.map((a: { _id: string; title: string; message: string }) => (
          <Card key={a._id}>
            <CardContent className="py-4">
              <p className="font-medium">{a.title}</p>
              <p className="text-sm text-muted-foreground">{a.message}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

