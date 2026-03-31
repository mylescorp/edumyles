"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useInstalledModules } from "@/hooks/useInstalledModules";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import {
  Users,
  DollarSign,
  Bell,
  GraduationCap,
  ArrowRight,
  Megaphone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "text-[#26A65B] bg-[rgba(38,166,91,0.1)] border-[#26A65B]/30" },
  inactive: { label: "Inactive", cls: "text-muted-foreground bg-muted border-border" },
  graduated: { label: "Graduated", cls: "text-[#1565C0] bg-[rgba(21,101,192,0.1)] border-[#1565C0]/30" },
  suspended: { label: "Suspended", cls: "text-[#DC2626] bg-[rgba(220,38,38,0.1)] border-[#DC2626]/30" },
};

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
    (user as any)?._id ? { userId: String((user as any)._id) } : "skip"
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

  const anyUser = user as any;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back${anyUser?.firstName ? `, ${anyUser.firstName}` : ""}`}
        description="Monitor your children's progress and manage fees"
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Children"
          value={sisEnabled ? childList.length : "—"}
          icon={Users}
          variant="default"
        />
        <StatCard
          label="Total Fee Balance"
          value={financeEnabled ? `KES ${totalBalance.toLocaleString()}` : "—"}
          icon={DollarSign}
          variant={totalBalance > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Notifications"
          value={unreadCount ?? 0}
          icon={Bell}
          variant={(unreadCount ?? 0) > 0 ? "info" : "default"}
        />
        <StatCard
          label="Children with Fees"
          value={financeEnabled ? feeItems.length : "—"}
          icon={GraduationCap}
          variant="default"
        />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Children Summary */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-[#0F4C2A]" />
              Children Summary
            </CardTitle>
            {sisEnabled && childList.length > 0 && (
              <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                <Link href="/portal/parent/children" className="flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {!sisEnabled ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Children records unavailable — SIS module is not active.
              </p>
            ) : childList.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No children are linked to your account yet.
              </p>
            ) : (
              <div className="space-y-2">
                {childList.map((child: any) => {
                  const statusCfg = STATUS_CONFIG[child.status] ?? STATUS_CONFIG.inactive;
                  return (
                    <div
                      key={child._id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(15,76,42,0.1)] flex-shrink-0">
                          <span className="text-xs font-bold text-[#0F4C2A]">
                            {(child.firstName?.[0] ?? "?").toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {child.firstName} {child.lastName}
                          </p>
                          {child.grade && (
                            <p className="text-xs text-muted-foreground">Grade {child.grade}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("text-xs flex-shrink-0", statusCfg.cls)}>
                        {statusCfg.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fee Overview */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <DollarSign className="h-4 w-4 text-[#E8A020]" />
              Fee Overview
            </CardTitle>
            {financeEnabled && (
              <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                <Link href="/portal/parent/fees" className="flex items-center gap-1">
                  Manage fees <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {!financeEnabled ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Finance module is not active for this school.
              </p>
            ) : feeItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No fee records found.
              </p>
            ) : (
              <div className="space-y-2">
                {feeItems.map((item: any) => (
                  <div
                    key={item._id ?? item.studentId}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.studentName ?? "Student"}
                      </p>
                      {item.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          Due {new Date(item.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-semibold flex-shrink-0",
                        (item.balance ?? 0) > 0
                          ? "text-[#E8A020] border-[#E8A020]/40 bg-[rgba(232,160,32,0.07)]"
                          : "text-[#26A65B] border-[#26A65B]/30 bg-[rgba(38,166,91,0.07)]"
                      )}
                    >
                      KES {(item.balance ?? 0).toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Announcements hint */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Megaphone className="h-4 w-4 text-[#1565C0]" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex items-center justify-between p-3 rounded-lg border border-[rgba(21,101,192,0.2)] bg-[rgba(21,101,192,0.05)]">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Visit Announcements to see the latest updates and notices from your school.
            </p>
            <Button asChild size="sm" variant="outline" className="ml-4 flex-shrink-0 h-7 text-xs">
              <Link href="/portal/parent/announcements" className="flex items-center gap-1">
                View <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
