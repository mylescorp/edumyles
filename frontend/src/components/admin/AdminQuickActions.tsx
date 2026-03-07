"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GraduationCap,
  Users,
  FileText,
  DollarSign,
  Calendar,
  MessageSquare,
  Plus,
} from "lucide-react";
import Link from "next/link";

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: any;
  variant?: "default" | "outline";
}

const quickActions: QuickAction[] = [
  {
    title: "Enroll Student",
    description: "Add a new student to the system",
    href: "/admin/students/create",
    icon: GraduationCap,
  },
  {
    title: "Add Staff Member",
    description: "Create a new staff or teacher account",
    href: "/admin/staff/create",
    icon: Users,
  },
  {
    title: "Create Invoice",
    description: "Generate a new fee invoice",
    href: "/admin/finance/invoices/create",
    icon: DollarSign,
  },
  {
    title: "Schedule Event",
    description: "Add a new event to the calendar",
    href: "/admin/timetable/events/create",
    icon: Calendar,
  },
  {
    title: "Send Announcement",
    description: "Broadcast a message to all users",
    href: "/admin/communications/create",
    icon: MessageSquare,
  },
  {
    title: "Generate Report",
    description: "Create academic or financial reports",
    href: "/admin/reports",
    icon: FileText,
  },
];

export function AdminQuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-auto p-3"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </Button>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
