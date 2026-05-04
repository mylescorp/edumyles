import { ReactNode } from "react";
import { ensureAuthorizedRouteSession } from "@/lib/serverRouteAuth";
import { DeveloperShell } from "@/components/layout/shells/DeveloperShell";

const DEVELOPER_ROLES = ["developer", "master_admin", "super_admin"] as const;

export default async function DeveloperLayout({ children }: { children: ReactNode }) {
  await ensureAuthorizedRouteSession(DEVELOPER_ROLES, "/dashboard");
  return <DeveloperShell>{children}</DeveloperShell>;
}
