"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Users, DollarSign, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ParentDashboardPage() {
  const { user, isLoading } = useAuth();

  const children = useQuery(
    api.modules.portal.parent.queries.getChildren,
    {}
  );
  const feeOverview = useQuery(
    api.modules.portal.parent.queries.getChildrenFeeOverview,
    {}
  );
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    user?._id ? { userId: String(user._id) } : "skip"
  );

  if (isLoading || children === undefined || feeOverview === undefined || unreadCount === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const totalBalance = feeOverview.reduce(
    (sum: number, child: any) => sum + (child.balance || 0),
    0
  );

  return (
    <div>
      <PageHeader
        title="Parent Dashboard"
        description="Monitor your children's progress and manage fees"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Children" value={children.length.toString()} icon={Users} />
        <StatCard label="Fee Balance" value={`KES ${totalBalance}`} icon={DollarSign} />
        <StatCard label="Notifications" value={unreadCount.toString()} icon={Bell} />
        <StatCard label="Children with Fees" value={feeOverview.length.toString()} icon={DollarSign} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Children Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {children.length === 0 ? (
              <p>No children are linked to your account yet.</p>
            ) : (
              children.map((child: any) => (
                <p key={child._id}>
                  {child.firstName} {child.lastName} — {child.status}
                </p>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {/* Parent announcements page shows full feed; here we just hint at usage */}
            <p>Visit the Announcements section to view recent updates from your school.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
