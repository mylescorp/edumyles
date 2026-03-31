"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, UserCheck, FileText, DollarSign, GraduationCap, Activity } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "student_enrolled" | "invoice_paid" | "staff_added" | "application_submitted";
  title: string;
  description: string;
  user?: {
    name: string;
    avatar?: string;
  };
  timestamp: number;
  href?: string;
}

const ACTIVITY_CONFIG: Record<ActivityItem["type"], { icon: any; iconBg: string; iconColor: string; label: string }> = {
  student_enrolled: {
    icon: GraduationCap,
    iconBg: "bg-[rgba(15,76,42,0.1)]",
    iconColor: "text-[#0F4C2A]",
    label: "Enrolled",
  },
  invoice_paid: {
    icon: DollarSign,
    iconBg: "bg-[rgba(21,101,192,0.1)]",
    iconColor: "text-[#1565C0]",
    label: "Payment",
  },
  staff_added: {
    icon: UserCheck,
    iconBg: "bg-[rgba(124,58,237,0.1)]",
    iconColor: "text-[#7C3AED]",
    label: "Staff",
  },
  application_submitted: {
    icon: FileText,
    iconBg: "bg-[rgba(232,160,32,0.1)]",
    iconColor: "text-[#E8A020]",
    label: "Admission",
  },
};

interface AdminRecentActivityProps {
  activities: ActivityItem[];
  showViewAll?: boolean;
  viewAllHref?: string;
}

export function AdminRecentActivity({
  activities,
  showViewAll = true,
  viewAllHref = "/admin/activity",
}: AdminRecentActivityProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Activity className="h-4 w-4 text-[#0F4C2A]" />
          Recent Activity
        </CardTitle>
        {showViewAll && (
          <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
            <Link href={viewAllHref} className="inline-flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => {
              const cfg = ACTIVITY_CONFIG[activity.type];
              const Icon = cfg.icon;

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors duration-150"
                >
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 mt-0.5", cfg.iconBg)}>
                    <Icon className={cn("h-4 w-4", cfg.iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate leading-tight">
                        {activity.title}
                      </p>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {activity.description}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1.5">
                        {activity.user && (
                          <>
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={activity.user.avatar} />
                              <AvatarFallback className="text-[8px]">
                                {activity.user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{activity.user.name}</span>
                          </>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  {activity.href && (
                    <Link
                      href={activity.href}
                      className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
