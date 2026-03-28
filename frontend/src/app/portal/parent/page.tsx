"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useInstalledModules } from "@/hooks/useInstalledModules";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Users, DollarSign, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ParentDashboardPage() {
  const { user, isLoading } = useAuth();
  const { isModuleInstalled, isLoading: modulesLoading } = useInstalledModules();
  const financeEnabled = isModuleInstalled("finance");
  const sisEnabled = isModuleInstalled("sis");

  const children = useQuery(
    api.modules.portal.parent.queries.getChildren,
    sisEnabled ? {} : "skip"
  );
  const feeOverview = useQuery(
    api.modules.portal.parent.queries.getChildrenFeeOverview,
    financeEnabled ? {} : "skip"
  );
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    user?._id ? { userId: String(user._id) } : "skip"
  );

  if (
    isLoading ||
    modulesLoading ||
    (sisEnabled && children === undefined) ||
    (financeEnabled && feeOverview === undefined) ||
    unreadCount === undefined
  ) {
    return <LoadingSkeleton variant="page" />;
  }

  const childList = children ?? [];
  const feeItems = feeOverview ?? [];
  const totalBalance = feeItems.reduce(
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
        <StatCard label="Children" value={sisEnabled ? childList.length.toString() : "Module Off"} icon={Users} />
        <StatCard label="Fee Balance" value={`KES ${totalBalance}`} icon={DollarSign} />
        <StatCard label="Notifications" value={unreadCount.toString()} icon={Bell} />
        <StatCard label="Children with Fees" value={financeEnabled ? feeItems.length.toString() : "Module Off"} icon={DollarSign} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Children Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {!sisEnabled ? (
              <p>Children records are unavailable because the SIS module is not active.</p>
            ) : childList.length === 0 ? (
              <p>No children are linked to your account yet.</p>
            ) : (
              childList.map((child: any) => (
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
            {!financeEnabled && (
              <p>Finance views stay hidden until the Finance module is enabled for this tenant.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
