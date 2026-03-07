"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, UserCheck, FileText, DollarSign, GraduationCap } from "lucide-react";
import Link from "next/link";

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

const getActivityIcon = (type: ActivityItem["type"]) => {
  switch (type) {
    case "student_enrolled":
      return GraduationCap;
    case "invoice_paid":
      return DollarSign;
    case "staff_added":
      return UserCheck;
    case "application_submitted":
      return FileText;
    default:
      return FileText;
  }
};

const getActivityColor = (type: ActivityItem["type"]) => {
  switch (type) {
    case "student_enrolled":
      return "bg-green-100 text-green-800 border-green-200";
    case "invoice_paid":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "staff_added":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "application_submitted":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Activity</CardTitle>
        {showViewAll && (
          <Button asChild size="sm" variant="ghost">
            <Link href={viewAllHref} className="inline-flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-sm">No recent activity</div>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const colorClass = getActivityColor(activity.type);

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20"
                >
                  <div className={`p-2 rounded-full ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">
                        {activity.title}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {activity.type.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {activity.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {activity.user && (
                          <>
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={activity.user.avatar} />
                              <AvatarFallback className="text-[10px]">
                                {activity.user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              {activity.user.name}
                            </span>
                          </>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  {activity.href && (
                    <Button asChild size="sm" variant="ghost">
                      <Link href={activity.href}>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
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
