import { ReactNode } from "react";
import { ensureAuthorizedRouteSession } from "@/lib/serverRouteAuth";
import { PartnerShell } from "@/components/layout/shells/PartnerShell";

const PARTNER_ROLES = ["partner", "master_admin", "super_admin"] as const;

export default async function PartnerLayout({ children }: { children: ReactNode }) {
  await ensureAuthorizedRouteSession(PARTNER_ROLES, "/dashboard");
  return <PartnerShell>{children}</PartnerShell>;
}
