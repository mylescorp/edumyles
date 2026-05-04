import { ReactNode } from "react";
import { ensureAuthorizedRouteSession } from "@/lib/serverRouteAuth";
import { ParentShell } from "@/components/layout/shells/ParentShell";

const PARENT_ROLES = ["parent", "master_admin", "super_admin"] as const;

export default async function ParentLayout({ children }: { children: ReactNode }) {
  await ensureAuthorizedRouteSession(PARENT_ROLES, "/dashboard");
  return <ParentShell>{children}</ParentShell>;
}
