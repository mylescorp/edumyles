"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useInstalledModules } from "@/hooks/useInstalledModules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  UserCog,
  Library,
  Calendar,
  DollarSign,
  MessageSquare,
  ArrowRight,
  Users,
  BookOpen,
  Clock,
  Banknote,
} from "lucide-react";

const MODULES = [
  {
    id: "hr",
    label: "HR & Payroll",
    description: "Staff management, payroll runs, contracts and leave tracking.",
    icon: UserCog,
    color: "bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800",
    iconColor: "text-pink-600 dark:text-pink-400",
    href: "/portal/admin/hr",
    links: [
      { label: "HR Dashboard", href: "/portal/admin/hr/dashboard" },
      { label: "Payroll", href: "/portal/admin/hr/payroll" },
      { label: "Contracts", href: "/portal/admin/hr/contracts" },
    ],
  },
  {
    id: "library",
    label: "Library",
    description: "Book catalogue, circulation tracking, borrowing and returns.",
    icon: Library,
    color: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
    iconColor: "text-amber-600 dark:text-amber-400",
    href: "/portal/admin/library",
    links: [
      { label: "Library Overview", href: "/portal/admin/library/dashboard" },
      { label: "Circulation", href: "/portal/admin/library/circulation" },
    ],
  },
  {
    id: "timetable",
    label: "Timetable",
    description: "Visual schedule builder, slot assignments and conflict detection.",
    icon: Calendar,
    color: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    href: "/portal/admin/timetable",
    links: [
      { label: "Timetable Builder", href: "/portal/admin/timetable/builder" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    description: "Fee structures, discount policies and billing configuration.",
    icon: DollarSign,
    color: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    href: "/portal/admin/finance",
    links: [
      { label: "Fee Management", href: "/portal/admin/finance/fees" },
    ],
  },
  {
    id: "communications",
    label: "Communications",
    description: "Send announcements, messages and notifications to all stakeholders.",
    icon: MessageSquare,
    color: "bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800",
    iconColor: "text-teal-600 dark:text-teal-400",
    href: "/portal/admin/communications",
    links: [
      { label: "Communications Hub", href: "/portal/admin/communications" },
    ],
  },
];

const QUICK_LINKS = [
  { label: "Students",      href: "/admin/students",   icon: Users,       color: "text-blue-600" },
  { label: "Staff",         href: "/admin/staff",      icon: UserCog,     color: "text-pink-600" },
  { label: "Classes",       href: "/admin/classes",    icon: BookOpen,    color: "text-purple-600" },
  { label: "Timetable",     href: "/admin/timetable",  icon: Clock,       color: "text-indigo-600" },
  { label: "Library",       href: "/admin/library",    icon: Library,     color: "text-amber-600" },
  { label: "Finance",       href: "/admin/finance",    icon: Banknote,    color: "text-yellow-600" },
];

export default function PortalAdminHomePage() {
  const { isLoading, user } = useAuth();
  const { isModuleInstalled, isLoading: modulesLoading } = useInstalledModules();

  if (isLoading || modulesLoading) return <LoadingSkeleton variant="page" />;

  const visibleModules = MODULES.filter((m) =>
    m.id === "communications" ? isModuleInstalled("communications") : isModuleInstalled(m.id as any) ?? true
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Portal"
        description={`Welcome back${user?.firstName ? `, ${user.firstName}` : ""}. Manage your school's core modules from here.`}
      />

      {/* Quick navigation */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Quick Navigation
        </h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {QUICK_LINKS.map((ql) => {
            const Icon = ql.icon;
            return (
              <Link key={ql.href} href={ql.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="flex flex-col items-center justify-center gap-2 py-4 text-center">
                    <Icon className={`h-6 w-6 ${ql.color}`} />
                    <span className="text-xs font-medium">{ql.label}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Module cards */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Modules
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Card key={mod.id} className={`border ${mod.color}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white dark:bg-gray-900 shadow-sm`}>
                        <Icon className={`h-5 w-5 ${mod.iconColor}`} />
                      </div>
                      <CardTitle className="text-base">{mod.label}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px]">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{mod.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {mod.links.map((link) => (
                      <Link key={link.href} href={link.href}>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
                          {link.label}
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Link back to main admin */}
      <div className="rounded-lg border border-dashed p-5 text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Looking for the full admin panel?
        </p>
        <Link href="/admin">
          <Button variant="outline" className="gap-2">
            Go to Admin Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
