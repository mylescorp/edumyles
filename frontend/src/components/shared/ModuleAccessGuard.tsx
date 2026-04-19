"use client";

import { usePathname } from "next/navigation";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { ModuleUnavailablePage } from "@/components/modules/ModuleUnavailablePage";
import { ModuleAccessDeniedPage } from "@/components/modules/ModuleAccessDeniedPage";
import { ModuleSuspendedPage } from "@/components/modules/ModuleSuspendedPage";

type RouteModuleRule = {
  prefix: string;
  moduleSlug: string;
};

const MODULE_ROUTE_RULES: RouteModuleRule[] = [
  { prefix: "/admin/students", moduleSlug: "core_sis" },
  { prefix: "/admin/classes", moduleSlug: "core_sis" },
  { prefix: "/admin/users", moduleSlug: "core_users" },
  { prefix: "/admin/admissions", moduleSlug: "mod_admissions" },
  { prefix: "/admin/academics", moduleSlug: "mod_academics" },
  { prefix: "/admin/attendance", moduleSlug: "mod_attendance" },
  { prefix: "/admin/finance", moduleSlug: "mod_finance" },
  { prefix: "/admin/timetable", moduleSlug: "mod_timetable" },
  { prefix: "/admin/hr", moduleSlug: "mod_hr" },
  { prefix: "/admin/library", moduleSlug: "mod_library" },
  { prefix: "/admin/transport", moduleSlug: "mod_transport" },
  { prefix: "/admin/communications", moduleSlug: "mod_communications" },
  { prefix: "/admin/ewallet", moduleSlug: "mod_ewallet" },
  { prefix: "/admin/ecommerce", moduleSlug: "mod_ecommerce" },
  { prefix: "/admin/reports", moduleSlug: "mod_reports" },
  { prefix: "/portal/teacher/classes", moduleSlug: "core_sis" },
  { prefix: "/portal/teacher/attendance", moduleSlug: "mod_attendance" },
  { prefix: "/portal/teacher/gradebook", moduleSlug: "mod_academics" },
  { prefix: "/portal/teacher/assignments", moduleSlug: "mod_academics" },
  { prefix: "/portal/teacher/timetable", moduleSlug: "mod_timetable" },
  { prefix: "/portal/teacher/communications", moduleSlug: "mod_communications" },
  { prefix: "/portal/student/grades", moduleSlug: "mod_academics" },
  { prefix: "/portal/student/report-cards", moduleSlug: "mod_academics" },
  { prefix: "/portal/student/assignments", moduleSlug: "mod_academics" },
  { prefix: "/portal/student/attendance", moduleSlug: "mod_attendance" },
  { prefix: "/portal/student/communications", moduleSlug: "mod_communications" },
  { prefix: "/portal/student/timetable", moduleSlug: "mod_timetable" },
  { prefix: "/portal/student/wallet", moduleSlug: "mod_ewallet" },
  { prefix: "/portal/parent/announcements", moduleSlug: "mod_communications" },
  { prefix: "/portal/parent/fees", moduleSlug: "mod_finance" },
  { prefix: "/portal/parent/payments", moduleSlug: "mod_finance" },
  { prefix: "/portal/parent/messages", moduleSlug: "mod_communications" },
  { prefix: "/portal/parent/communications", moduleSlug: "mod_communications" },
  { prefix: "/portal/alumni/transcripts", moduleSlug: "mod_alumni" },
  { prefix: "/portal/alumni/directory", moduleSlug: "mod_alumni" },
  { prefix: "/portal/alumni/events", moduleSlug: "mod_alumni" },
];

function getRequiredModule(pathname: string) {
  if (pathname.startsWith("/portal/teacher/classes/") && pathname.includes("/grades")) {
    return "mod_academics";
  }

  if (pathname.startsWith("/portal/parent/children/")) {
    if (pathname.includes("/assignments")) return "mod_academics";
    if (pathname.includes("/grades")) return "mod_academics";
    if (pathname.includes("/attendance")) return "mod_attendance";
    if (pathname.includes("/timetable")) return "mod_timetable";
    return "core_sis";
  }

  return MODULE_ROUTE_RULES.find((rule) => pathname.startsWith(rule.prefix))?.moduleSlug ?? null;
}

interface ModuleAccessGuardProps {
  children: React.ReactNode;
  fallbackHref?: string;
}

export function ModuleAccessGuard({
  children,
}: ModuleAccessGuardProps) {
  const pathname = usePathname();
  const requiredModule = getRequiredModule(pathname);
  const { isLoading, isInstalled, hasAccess, installStatus, reason } = useModuleAccess(
    requiredModule ?? ""
  );

  if (isLoading) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!requiredModule) {
    return <>{children}</>;
  }

  if (isInstalled && hasAccess) {
    return <>{children}</>;
  }

  if (!isInstalled) {
    return <ModuleUnavailablePage moduleName={requiredModule} description={reason} />;
  }

  if (installStatus.includes("suspended")) {
    return (
      <ModuleSuspendedPage
        moduleName={requiredModule}
        variant={installStatus === "suspended_payment" ? "payment" : "platform"}
      />
    );
  }

  return <ModuleAccessDeniedPage moduleName={requiredModule} reason={reason} />;
}
