import { ReactNode } from "react";
import { ensureAuthorizedRouteSession } from "@/lib/serverRouteAuth";
import { PortalAdminShell } from "@/components/layout/shells/PortalAdminShell";

const PORTAL_ADMIN_ROLES = ["school_admin", "principal", "master_admin", "super_admin"] as const;

export default async function PortalAdminLayout({ children }: { children: ReactNode }) {
  await ensureAuthorizedRouteSession(PORTAL_ADMIN_ROLES, "/dashboard");
  return <PortalAdminShell>{children}</PortalAdminShell>;
}
