import { ReactNode } from "react";
import { ensureAuthorizedRouteSession } from "@/lib/serverRouteAuth";
import { ResellerShell } from "@/components/layout/shells/ResellerShell";

const RESELLER_ROLES = ["reseller", "master_admin", "super_admin"] as const;

export default async function ResellerLayout({ children }: { children: ReactNode }) {
  await ensureAuthorizedRouteSession(RESELLER_ROLES, "/dashboard");
  return <ResellerShell>{children}</ResellerShell>;
}
