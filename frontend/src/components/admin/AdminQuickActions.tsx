"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GraduationCap,
  Users,
  FileText,
  DollarSign,
  Calendar,
  MessageSquare,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: any;
  iconBg: string;
  iconColor: string;
}

const quickActions: QuickAction[] = [
  {
    title: "Enroll Student",
    description: "Add a new student",
    href: "/admin/students/create",
    icon: GraduationCap,
    iconBg: "bg-[var(--platform-accent-soft)]",
    iconColor: "text-[var(--platform-accent)]",
  },
  {
    title: "Add Staff Member",
    description: "Create staff / teacher account",
    href: "/admin/staff/create",
    icon: Users,
    iconBg: "bg-[var(--platform-accent-soft)]",
    iconColor: "text-[var(--platform-accent)]",
  },
  {
    title: "Create Invoice",
    description: "Generate a fee invoice",
    href: "/admin/finance/invoices/create",
    icon: DollarSign,
    iconBg: "bg-[var(--platform-highlight-soft)]",
    iconColor: "text-[var(--platform-highlight)]",
  },
  {
    title: "Schedule Event",
    description: "Add to the calendar",
    href: "/admin/timetable/events/create",
    icon: Calendar,
    iconBg: "bg-[var(--platform-accent-soft)]",
    iconColor: "text-[var(--platform-accent)]",
  },
  {
    title: "Send Announcement",
    description: "Broadcast to all users",
    href: "/admin/communications/create",
    icon: MessageSquare,
    iconBg: "bg-[var(--platform-success-soft)]",
    iconColor: "text-[var(--em-success)]",
  },
  {
    title: "Generate Report",
    description: "Academic or financial reports",
    href: "/admin/reports",
    icon: FileText,
    iconBg: "bg-[var(--platform-danger-soft)]",
    iconColor: "text-[var(--em-danger)]",
  },
];

export function AdminQuickActions() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 pt-5 px-5">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Zap className="h-4 w-4 text-[var(--platform-accent)]" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-1.5">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left",
                "border border-border/50 bg-muted/20",
                "hover:bg-muted/50 hover:border-border transition-colors duration-150"
              )}
            >
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0", action.iconBg)}>
                <Icon className={cn("h-4 w-4", action.iconColor)} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground leading-tight">{action.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
