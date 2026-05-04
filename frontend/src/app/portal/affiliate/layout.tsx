import { ReactNode } from "react";
import { ensureAuthorizedRouteSession } from "@/lib/serverRouteAuth";
import { AffiliateShell } from "@/components/layout/shells/AffiliateShell";

const AFFILIATE_ROLES = ["affiliate", "master_admin", "super_admin"] as const;

export default async function AffiliateLayout({ children }: { children: ReactNode }) {
  await ensureAuthorizedRouteSession(AFFILIATE_ROLES, "/dashboard");
  return <AffiliateShell>{children}</AffiliateShell>;
}
