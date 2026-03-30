"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package } from "lucide-react";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useInstalledModules } from "@/hooks/useInstalledModules";

type RouteModuleRule = {
  prefix: string;
  moduleId: string;
};

const MODULE_ROUTE_RULES: RouteModuleRule[] = [
  { prefix: "/admin/students", moduleId: "sis" },
  { prefix: "/admin/classes", moduleId: "sis" },
  { prefix: "/admin/staff", moduleId: "hr" },
  { prefix: "/admin/admissions", moduleId: "admissions" },
  { prefix: "/admin/academics", moduleId: "academics" },
  { prefix: "/admin/finance", moduleId: "finance" },
  { prefix: "/admin/timetable", moduleId: "timetable" },
  { prefix: "/admin/hr", moduleId: "hr" },
  { prefix: "/admin/library", moduleId: "library" },
  { prefix: "/admin/transport", moduleId: "transport" },
  { prefix: "/admin/communications", moduleId: "communications" },
  { prefix: "/admin/tickets", moduleId: "tickets" },
  { prefix: "/admin/ewallet", moduleId: "ewallet" },
  { prefix: "/admin/ecommerce", moduleId: "ecommerce" },
  { prefix: "/admin/users", moduleId: "users" },
  { prefix: "/portal/teacher/classes", moduleId: "sis" },
  { prefix: "/portal/teacher/attendance", moduleId: "sis" },
  { prefix: "/portal/teacher/assignments", moduleId: "academics" },
  { prefix: "/portal/teacher/timetable", moduleId: "timetable" },
  { prefix: "/portal/teacher/communications", moduleId: "communications" },
  { prefix: "/portal/student/assignments", moduleId: "academics" },
  { prefix: "/portal/student/communications", moduleId: "communications" },
  { prefix: "/portal/student/wallet", moduleId: "ewallet" },
  { prefix: "/portal/parent/children", moduleId: "sis" },
  { prefix: "/portal/parent/fees", moduleId: "finance" },
  { prefix: "/portal/parent/payments", moduleId: "finance" },
  { prefix: "/portal/parent/messages", moduleId: "communications" },
  { prefix: "/portal/parent/announcements", moduleId: "communications" },
  { prefix: "/portal/parent/communications", moduleId: "communications" },
  { prefix: "/portal/partner/students", moduleId: "sis" },
  { prefix: "/portal/partner/reports", moduleId: "finance" },
  { prefix: "/portal/partner/payments", moduleId: "finance" },
  { prefix: "/portal/partner/messages", moduleId: "communications" },
];

function getRequiredModule(pathname: string) {
  return MODULE_ROUTE_RULES.find((rule) => pathname.startsWith(rule.prefix))?.moduleId ?? null;
}

interface ModuleAccessGuardProps {
  children: React.ReactNode;
  fallbackHref?: string;
}

export function ModuleAccessGuard({
  children,
  fallbackHref = "/admin/marketplace",
}: ModuleAccessGuardProps) {
  const pathname = usePathname();
  const { isLoading, availableModules, isModuleInstalled } = useInstalledModules();
  const requiredModule = getRequiredModule(pathname);

  if (isLoading) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!requiredModule) {
    return <>{children}</>;
  }

  const moduleMeta = availableModules.find((mod: any) => mod.moduleId === requiredModule);
  const isAvailable = isModuleInstalled(requiredModule);

  if (isAvailable) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-lg">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Module Not Available</h2>
            <p className="text-sm text-muted-foreground mt-2">
              This page depends on the
              {" "}
              <span className="font-medium">{moduleMeta?.name ?? requiredModule}</span>
              {" "}
              module, which is not active for this tenant.
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <Button asChild>
              <Link href={fallbackHref}>Manage Modules</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/marketplace">Open Marketplace</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
