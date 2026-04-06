import { ReactNode } from "react";
import { ensureProtectedRouteSession } from "@/lib/serverRouteAuth";
import { PortalAdminShell } from "@/components/layout/shells/PortalAdminShell";

export default async function PortalAdminLayout({ children }: { children: ReactNode }) {
  await ensureProtectedRouteSession();
  return <PortalAdminShell>{children}</PortalAdminShell>;
}
